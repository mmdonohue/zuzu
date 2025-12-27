#!/usr/bin/env python3
"""
Codebase Review Agent for ZuZu Project

Performs comprehensive codebase analysis including:
- Documentation sync verification
- Security scanning
- Code quality analysis
- Architecture checks
- Dependency analysis
- Testing coverage assessment

Integrates with Claude Code via Stop hook.
"""

import sys
import os
import argparse
import json
import subprocess
from datetime import datetime
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List, Any, Optional

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from review.utils.markdown_gen import MarkdownReportGenerator
from review.checkers.documentation import DocumentationChecker
from review.checkers.security import SecurityChecker
from review.checkers.architecture import ArchitectureChecker
from review.checkers.quality import QualityChecker
from review.checkers.dependencies import DependenciesChecker
from review.checkers.testing import TestingChecker


def should_run_review() -> bool:
    """
    Check if review should run based on trigger conditions.

    Returns:
        bool: True if review should run, False otherwise
    """
    # Environment variable trigger
    if os.environ.get('CLAUDE_REVIEW') == 'true':
        print("[review-agent] Triggered by CLAUDE_REVIEW environment variable", file=sys.stderr)
        return True

    # Trigger file exists
    trigger_file = '/tmp/.claude-review-trigger'
    if os.path.exists(trigger_file):
        print(f"[review-agent] Triggered by {trigger_file}", file=sys.stderr)
        try:
            os.remove(trigger_file)
        except:
            pass
        return True

    # Smart trigger: check git changes
    try:
        result = subprocess.run(
            ['git', 'diff', '--stat', 'HEAD~10..HEAD'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            changed_files = len([l for l in lines if l.strip() and '|' in l])
            if changed_files >= 5:
                print(f"[review-agent] Smart trigger: {changed_files} files changed", file=sys.stderr)
                return True
    except Exception as e:
        print(f"[review-agent] Smart trigger check failed: {e}", file=sys.stderr)

    return False


def load_config(config_path: str) -> Dict[str, Any]:
    """Load configuration from JSON file."""
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"[review-agent] ERROR: Config file not found: {config_path}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"[review-agent] ERROR: Invalid JSON in config file: {e}", file=sys.stderr)
        sys.exit(1)


def initialize_checkers(focus: str, config: Dict[str, Any]) -> List[Any]:
    """
    Initialize checker instances based on focus area.

    Args:
        focus: Focus area ('all', 'docs', 'security', 'quality', 'architecture', 'dependencies', 'testing')
        config: Configuration dictionary

    Returns:
        List of checker instances
    """
    project_root = config['project_root']
    checkers = []

    if focus in ('all', 'docs'):
        checkers.append(DocumentationChecker(project_root, config))

    if focus in ('all', 'security'):
        checkers.append(SecurityChecker(project_root, config))

    if focus in ('all', 'architecture'):
        checkers.append(ArchitectureChecker(project_root, config))

    if focus in ('all', 'quality'):
        checkers.append(QualityChecker(project_root, config))

    if focus in ('all', 'dependencies'):
        checkers.append(DependenciesChecker(project_root, config))

    if focus in ('all', 'testing'):
        checkers.append(TestingChecker(project_root, config))

    return checkers


def aggregate_results(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Aggregate results from all checkers.

    Args:
        results: List of checker result dictionaries

    Returns:
        Aggregated report data
    """
    aggregated = {
        'categories': {},
        'all_findings': [],
        'critical_count': 0,
        'warning_count': 0,
        'info_count': 0,
        'total_findings': 0
    }

    for result in results:
        if not result:
            continue

        category = result.get('category', 'unknown')
        findings = result.get('findings', [])

        # Count by severity
        critical = len([f for f in findings if f.get('severity') == 'critical'])
        warning = len([f for f in findings if f.get('severity') == 'warning'])
        info = len([f for f in findings if f.get('severity') == 'info'])

        aggregated['categories'][category] = {
            'status': result.get('status', 'unknown'),
            'findings': findings,
            'critical': critical,
            'warning': warning,
            'info': info,
            'metrics': result.get('metrics', {})
        }

        aggregated['all_findings'].extend(findings)
        aggregated['critical_count'] += critical
        aggregated['warning_count'] += warning
        aggregated['info_count'] += info

    aggregated['total_findings'] = len(aggregated['all_findings'])

    return aggregated


def print_summary(report_data: Dict[str, Any], file=sys.stdout):
    """Print a brief summary of findings."""
    print("\n=== Codebase Review Summary ===", file=file)
    print(f"Total Findings: {report_data['total_findings']}", file=file)
    print(f"  Critical: {report_data['critical_count']}", file=file)
    print(f"  Warning: {report_data['warning_count']}", file=file)
    print(f"  Info: {report_data['info_count']}", file=file)

    if report_data['total_findings'] > 0:
        print(f"\nDetailed report generated.", file=file)


def update_executive_summary(project_root: str, focus: str, report_data: Dict[str, Any]):
    """Update the executive summary with results from a focused review."""
    from datetime import datetime, timezone

    summary_path = Path(project_root) / '.claude' / 'CODEBASE_REVIEW.md'
    focus_display = focus.title()
    focus_upper = focus.upper()

    # Calculate health score
    base_score = 100
    critical_penalty = report_data['critical_count'] * 10
    warning_penalty = report_data['warning_count'] * 3
    info_penalty = report_data['info_count'] * 1
    health_score = max(0, base_score - critical_penalty - warning_penalty - info_penalty)

    # Determine status emoji
    if report_data['critical_count'] > 0:
        status = '🔴 CRITICAL'
    elif report_data['warning_count'] > 0:
        status = '⚠️ WARNING'
    else:
        status = '✅ PASS'

    # Create section for this focus area
    timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    section = f"""
## {focus_display} Review

**Last Updated**: {timestamp}
**Status**: {status}
**Health Score**: {health_score}/100

| Metric | Count |
|--------|-------|
| Critical Issues | {report_data['critical_count']} |
| Warnings | {report_data['warning_count']} |
| Info | {report_data['info_count']} |
| **Total Findings** | **{report_data['total_findings']}** |

**Detailed Report**: [CODEBASE_REVIEW_{focus_upper}.md](./CODEBASE_REVIEW_{focus_upper}.md)

---
"""

    # Read or create executive summary
    if summary_path.exists():
        with open(summary_path, 'r') as f:
            content = f.read()

        # Check if section for this focus exists
        section_marker = f"## {focus_display} Review"
        if section_marker in content:
            # Replace existing section
            import re
            # Match from section header to the next ## or end of file
            pattern = rf'{re.escape(section_marker)}.*?(?=\n## |\Z)'
            content = re.sub(pattern, section.strip(), content, flags=re.DOTALL)
        else:
            # Append new section before the final marker (if exists) or at end
            if '---\n\n_Last updated:' in content:
                content = content.replace('---\n\n_Last updated:', section + '\n---\n\n_Last updated:')
            else:
                content += '\n' + section
    else:
        # Create new executive summary
        content = f"""# Codebase Review - Executive Summary

This dashboard provides a high-level overview of all review findings. Each focus area maintains its own detailed report.

---

{section}

---

_Last updated: {timestamp}_
"""

    # Write updated summary
    with open(summary_path, 'w') as f:
        f.write(content)


def export_json_summary(project_root: str, focus: str = None, report_data: Dict[str, Any] = None):
    """
    Export executive summary as JSON for frontend consumption.

    This function is ADDITIVE - it only updates the sections that were just reviewed,
    keeping other sections intact. Each section maintains its own timestamp.
    """
    from datetime import datetime, timezone
    import re
    import json

    summary_path = Path(project_root) / '.claude' / 'CODEBASE_REVIEW.md'
    json_path = Path(project_root) / '.claude' / 'CODEBASE_REVIEW.json'

    if not summary_path.exists():
        return

    # Load existing JSON data if it exists
    existing_data = {}
    if json_path.exists():
        try:
            with open(json_path, 'r') as f:
                existing_data = json.load(f)
        except (json.JSONDecodeError, IOError):
            existing_data = {}

    # Get existing reviews as a dictionary for easy updates
    existing_reviews = {r['category']: r for r in existing_data.get('reviews', [])}
    existing_findings = {f.get('category'): [] for f in existing_data.get('findings', [])}
    for finding in existing_data.get('findings', []):
        category = finding.get('category')
        if category:
            if category not in existing_findings:
                existing_findings[category] = []
            existing_findings[category].append(finding)

    # Read current markdown summary
    with open(summary_path, 'r') as f:
        content = f.read()

    # Pattern to match review sections
    section_pattern = r'## (.+?) Review\s*\n\s*\n\*\*Last Updated\*\*:\s*(.+?)\s*\n\*\*Status\*\*:\s*(.+?)\s*\n\*\*Health Score\*\*:\s*(\d+)/100\s*\n\s*\n\| Metric \| Count \|\s*\n\|[^|]+\|[^|]+\|\s*\n\| Critical Issues \| (\d+) \|\s*\n\| Warnings \| (\d+) \|\s*\n\| Info \| (\d+) \|\s*\n\| \*\*Total Findings\*\* \| \*\*(\d+)\*\* \|'

    matches = re.finditer(section_pattern, content, re.MULTILINE)

    # Parse newly reviewed sections from markdown
    for match in matches:
        category = match.group(1)
        last_updated = match.group(2)
        status_raw = match.group(3)
        health_score = int(match.group(4))
        critical = int(match.group(5))
        warnings = int(match.group(6))
        info = int(match.group(7))
        total = int(match.group(8))

        # Parse status emoji and text
        status_map = {
            '🔴 CRITICAL': 'critical',
            '⚠️ WARNING': 'warning',
            '✅ PASS': 'pass',
            'ℹ️ INFO': 'pass'
        }
        status = status_map.get(status_raw, 'unknown')

        # Build review data for this category
        review_data = {
            'category': category.lower(),
            'displayName': category,
            'lastUpdated': last_updated,
            'status': status,
            'statusDisplay': status_raw,
            'healthScore': health_score,
            'metrics': {
                'critical': critical,
                'warnings': warnings,
                'info': info,
                'total': total
            }
        }

        # Update or add this category's review data
        category_key = category.lower()

        # Only update if this category was actually reviewed (based on focus or if no focus specified)
        should_update = (focus is None) or (focus == category_key) or (focus == 'all')

        if should_update:
            existing_reviews[category_key] = review_data

            # Parse and update findings for this category
            category_upper = category.upper()
            detail_path = Path(project_root) / '.claude' / f'CODEBASE_REVIEW_{category_upper}.md'

            if detail_path.exists():
                with open(detail_path, 'r') as f:
                    detail_content = f.read()

                # Parse findings from markdown
                findings = _parse_findings_from_markdown(detail_content, category_key, category)
                existing_findings[category_key] = findings

    # Convert back to lists
    all_reviews = list(existing_reviews.values())
    all_findings = []
    for category_findings in existing_findings.values():
        all_findings.extend(category_findings)

    # Calculate overall metrics from all reviews
    if all_reviews:
        overall_health = sum(r['healthScore'] for r in all_reviews) // len(all_reviews)
        overall_critical = sum(r['metrics']['critical'] for r in all_reviews)
        overall_warnings = sum(r['metrics']['warnings'] for r in all_reviews)
        overall_info = sum(r['metrics']['info'] for r in all_reviews)
        overall_total = sum(r['metrics']['total'] for r in all_reviews)
    else:
        overall_health = 0
        overall_critical = 0
        overall_warnings = 0
        overall_info = 0
        overall_total = 0

    # Determine overall status
    if overall_critical > 0:
        overall_status = 'critical'
        overall_status_display = '🔴 CRITICAL'
    elif overall_warnings > 0:
        overall_status = 'warning'
        overall_status_display = '⚠️ WARNING'
    else:
        overall_status = 'pass'
        overall_status_display = '✅ PASS'

    # Build JSON structure (preserving existing reviews and only updating what changed)
    json_data = {
        'lastUpdated': datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC'),
        'overallStatus': overall_status,
        'overallStatusDisplay': overall_status_display,
        'overallHealthScore': overall_health,
        'overallMetrics': {
            'critical': overall_critical,
            'warnings': overall_warnings,
            'info': overall_info,
            'total': overall_total
        },
        'reviews': sorted(all_reviews, key=lambda x: x['category']),  # Sort for consistency
        'findings': all_findings
    }

    # Write JSON file
    with open(json_path, 'w') as f:
        json.dump(json_data, f, indent=2)


def _parse_findings_from_markdown(content: str, category: str, category_display: str) -> List[Dict[str, Any]]:
    """Parse individual findings from detailed markdown report."""
    import re

    findings = []

    # Pattern to match finding sections
    # Matches: #### Issue Title\n**Location**: `file:line`\nDescription\n**Recommendation**: recommendation
    finding_pattern = r'####\s+(.+?)\n\n(?:\*\*Location\*\*:\s*`(.+?)`\n\n)?(.+?)(?:\n\n\*\*Recommendation\*\*:\s*(.+?))?(?=\n\n####|\n\n###|\Z)'

    # Find severity sections
    severity_sections = {
        'critical': re.search(r'### (?:⚠️|🔴) (?:Critical Issues?|CRITICAL)(.*?)(?=\n### |\Z)', content, re.DOTALL),
        'warning': re.search(r'### (?:⚠️|WARNING) Warnings?(.*?)(?=\n### |\Z)', content, re.DOTALL),
        'info': re.search(r'### (?:ℹ️|INFO) Information(.*?)(?=\n### |\Z)', content, re.DOTALL)
    }

    for severity, section_match in severity_sections.items():
        if section_match:
            section_content = section_match.group(1)
            matches = re.finditer(finding_pattern, section_content, re.DOTALL)

            for match in matches:
                issue = match.group(1).strip()
                location = match.group(2).strip() if match.group(2) else ''
                description = match.group(3).strip()
                recommendation = match.group(4).strip() if match.group(4) else ''

                # Parse file and line from location
                file_path = ''
                line_number = None
                if location and ':' in location:
                    parts = location.rsplit(':', 1)
                    file_path = parts[0]
                    try:
                        line_number = int(parts[1])
                    except (ValueError, IndexError):
                        file_path = location
                elif location:
                    file_path = location

                findings.append({
                    'category': category,
                    'categoryDisplay': category_display,
                    'severity': severity,
                    'issue': issue,
                    'file': file_path,
                    'line': line_number,
                    'description': description,
                    'recommendation': recommendation
                })

    return findings


def main():
    """Main entry point for review agent."""
    parser = argparse.ArgumentParser(
        description='''
╔══════════════════════════════════════════════════════════════════════════════╗
║                        ZuZu Codebase Review Agent                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

Automatically verifies that documentation matches actual code implementation.
Runs via Claude Code Stop hook or manually via command line.

WHAT IT CHECKS:
  Documentation Sync:
    • .claude/CLAUDE.md - Architecture documentation accuracy
    • .claude/AUTH_IMPLEMENTATION.md - Auth system documentation
    • README.md - Tech stack and scripts documentation
    • src/pages/Home.tsx - Displayed tech stack matches dependencies
    • src/pages/About.tsx - Mentioned technologies are installed

  Security (when enabled):
    • Hardcoded secrets and credentials
    • JWT configuration security
    • Cookie security settings
    • CORS configuration

  Code Quality (when enabled):
    • Cyclomatic complexity
    • Error handling patterns
    • Logging practices
    • Code consistency

  Architecture (when enabled):
    • Design pattern adherence
    • Circular dependencies
    • Configuration consistency
    • Orphaned files

  Dependencies (when enabled):
    • Unused dependencies
    • Version consistency
    • License analysis

  Testing (when enabled):
    • Test coverage estimation
    • Critical untested modules

SEVERITY LEVELS:
  🔴 CRITICAL - Must fix (blocks successful exit code)
  ⚠️  WARNING  - Should fix (documentation drift, missing info)
  ℹ️  INFO     - Nice to have (suggestions for improvement)

OUTPUT:
  Generates a markdown report at .claude/CODEBASE_REVIEW.md with:
    • Executive summary with health score
    • Findings organized by category and severity
    • Specific file locations and line numbers
    • Actionable recommendations
''',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
BASIC USAGE:
  %(prog)s                           # Run full review (auto-triggers on changes)
  %(prog)s --focus docs              # Documentation sync only
  %(prog)s --verbose                 # Show detailed progress

FIXING FINDINGS:
  %(prog)s --fix                     # Interactive mode - prompts for each fix
  %(prog)s --auto-fix                # Automatic mode - fixes critical/warning only
  %(prog)s --auto-fix --fix-all      # Fix everything including info-level

OUTPUT CONTROL:
  %(prog)s --silent                  # Only output when issues found
  %(prog)s --output /tmp/review.md   # Custom output location

FOCUS AREAS:
  --focus docs           Documentation sync verification
  --focus security       Security scanning
  --focus quality        Code quality analysis
  --focus architecture   Architecture validation
  --focus dependencies   Dependency analysis
  --focus testing        Test coverage assessment
  --focus all            Everything (default)

COMMON WORKFLOWS:

  1. Quick doc check before committing:
     %(prog)s --focus docs --silent

  2. Fix all documentation issues automatically:
     %(prog)s --focus docs --auto-fix --fix-all

  3. Full review with interactive fixes:
     %(prog)s --fix

  4. Security audit only:
     %(prog)s --focus security --verbose

  5. Check specific finding types:
     %(prog)s --focus docs --fix          # Fix only warnings/critical
     %(prog)s --focus docs --fix --fix-all # Fix warnings/critical/info

TRIGGERING:
  Automatic:
    • Runs on Claude Code Stop hook (if configured)
    • Smart detection: runs when 5+ files changed in last 10 commits

  Manual:
    • Run directly: python3 .claude/hooks/review-agent.py
    • Set env var: export CLAUDE_REVIEW=true
    • Touch trigger: touch /tmp/.claude-review-trigger

CONFIGURATION:
  Edit .claude/review/config/review-config.json to customize:
    • Enabled checkers
    • Severity thresholds
    • Exclusion patterns
    • Smart trigger settings

EXIT CODES:
  0 - Success (no critical issues)
  1 - Critical issues found

REPORTS:
  View the generated report at:
    .claude/CODEBASE_REVIEW.md

  Contains:
    • Overall health score (0-100)
    • Findings by severity and category
    • File locations with line numbers
    • Specific recommendations
    • Metrics and statistics
'''
    )

    parser.add_argument(
        '--output',
        default='.claude/CODEBASE_REVIEW.md',
        help='Output path for markdown report (default: .claude/CODEBASE_REVIEW.md)'
    )

    parser.add_argument(
        '--config',
        default='.claude/review/config/review-config.json',
        help='Path to configuration file (default: .claude/review/config/review-config.json)'
    )

    parser.add_argument(
        '--focus',
        choices=['all', 'docs', 'security', 'quality', 'architecture', 'dependencies', 'testing'],
        default='all',
        help='Focus area for review (default: all)'
    )

    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose output'
    )

    parser.add_argument(
        '--silent',
        action='store_true',
        help='Only output if issues are found'
    )

    parser.add_argument(
        '--no-git',
        action='store_true',
        help='Skip git-based checks'
    )

    parser.add_argument(
        '--fix',
        action='store_true',
        help='Interactively fix findings by updating documentation'
    )

    parser.add_argument(
        '--auto-fix',
        action='store_true',
        help='Automatically fix all fixable findings without prompting'
    )

    parser.add_argument(
        '--fix-all',
        action='store_true',
        help='Fix all severity levels including info (default: only critical and warning)'
    )

    args = parser.parse_args()

    # Check if review should run (unless --no-smart-trigger or focus specified)
    if args.focus == 'all' and not should_run_review():
        if args.verbose:
            print("[review-agent] Review not triggered (no significant changes)", file=sys.stderr)
        sys.exit(0)

    # Load configuration
    config = load_config(args.config)

    if args.verbose:
        print(f"[review-agent] Starting review with focus: {args.focus}", file=sys.stderr)
        print(f"[review-agent] Project root: {config['project_root']}", file=sys.stderr)

    # Initialize checkers
    checkers = initialize_checkers(args.focus, config)

    if args.verbose:
        print(f"[review-agent] Initialized {len(checkers)} checker(s)", file=sys.stderr)

    # Run checks in parallel
    results = []
    with ThreadPoolExecutor(max_workers=len(checkers)) as executor:
        futures = [executor.submit(checker.run) for checker in checkers]
        for future in futures:
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                print(f"[review-agent] ERROR: Checker failed: {e}", file=sys.stderr)
                if args.verbose:
                    import traceback
                    traceback.print_exc(file=sys.stderr)

    # Aggregate results
    report_data = aggregate_results(results)

    # Generate report
    generator = MarkdownReportGenerator(config, not args.no_git)
    report = generator.generate(report_data)

    # Determine output path based on focus
    if args.output == '.claude/CODEBASE_REVIEW.md':  # Using default output
        if args.focus != 'all':
            # Use focus-specific filename
            focus_name = args.focus.upper()
            output_filename = f'.claude/CODEBASE_REVIEW_{focus_name}.md'
            output_path = Path(config['project_root']) / output_filename
        else:
            # Use default for 'all' focus
            output_path = Path(config['project_root']) / args.output
    else:
        # User specified custom output path
        output_path = Path(config['project_root']) / args.output

    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w') as f:
        f.write(report)

    if args.verbose:
        print(f"[review-agent] Report written to: {output_path}", file=sys.stderr)

    # Update executive summary if this is a focused review
    if args.focus != 'all':
        update_executive_summary(config['project_root'], args.focus, report_data)
        export_json_summary(config['project_root'])
        if args.verbose:
            print(f"[review-agent] Executive summary updated", file=sys.stderr)
            print(f"[review-agent] JSON summary exported", file=sys.stderr)

    # Print summary (unless silent mode with no findings)
    if not (args.silent and report_data['total_findings'] == 0):
        print_summary(report_data, file=sys.stderr)

    # Fix mode
    if (args.fix or args.auto_fix) and report_data['total_findings'] > 0:
        if args.auto_fix:
            print("\n[review-agent] Auto-fixing findings...", file=sys.stderr)
        else:
            print("\n[review-agent] Entering interactive fix mode...", file=sys.stderr)

        from review.utils.fixer import InteractiveFixer
        fixer = InteractiveFixer(config['project_root'], auto_mode=args.auto_fix, fix_all=args.fix_all)
        fixed_count = fixer.fix_findings(report_data['all_findings'])
        print(f"[review-agent] Fixed {fixed_count} finding(s)", file=sys.stderr)

    # Exit with appropriate code
    exit_code = 0 if report_data['critical_count'] == 0 else 1

    if args.verbose:
        print(f"[review-agent] Exiting with code: {exit_code}", file=sys.stderr)

    sys.exit(exit_code)


if __name__ == '__main__':
    main()
