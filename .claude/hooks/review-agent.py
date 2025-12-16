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


def main():
    """Main entry point for review agent."""
    parser = argparse.ArgumentParser(
        description='ZuZu Codebase Review Agent',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  %(prog)s                                    # Full review with smart triggering
  %(prog)s --focus docs                       # Documentation sync only
  %(prog)s --output /tmp/review.md            # Custom output path
  %(prog)s --silent                           # Only output if issues found
  %(prog)s --verbose                          # Show detailed progress

Environment Variables:
  CLAUDE_REVIEW=true    Force review to run
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

    # Write report
    output_path = Path(config['project_root']) / args.output
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w') as f:
        f.write(report)

    if args.verbose:
        print(f"[review-agent] Report written to: {output_path}", file=sys.stderr)

    # Print summary (unless silent mode with no findings)
    if not (args.silent and report_data['total_findings'] == 0):
        print_summary(report_data, file=sys.stderr)

    # Exit with appropriate code
    exit_code = 0 if report_data['critical_count'] == 0 else 1

    if args.verbose:
        print(f"[review-agent] Exiting with code: {exit_code}", file=sys.stderr)

    sys.exit(exit_code)


if __name__ == '__main__':
    main()
