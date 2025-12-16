"""
Markdown Report Generator

Generates comprehensive markdown reports from review findings.
"""

from datetime import datetime
from typing import Dict, Any, List
import subprocess


class MarkdownReportGenerator:
    """Generates markdown reports from review data."""

    def __init__(self, config: Dict[str, Any], include_git: bool = True):
        """
        Initialize the markdown generator.

        Args:
            config: Configuration dictionary
            include_git: Whether to include git information
        """
        self.config = config
        self.include_git = include_git

    def generate(self, report_data: Dict[str, Any]) -> str:
        """
        Generate full markdown report.

        Args:
            report_data: Aggregated report data from checkers

        Returns:
            Formatted markdown string
        """
        sections = []

        # Header
        sections.append(self._generate_header(report_data))

        # Executive Summary
        sections.append(self._generate_executive_summary(report_data))

        # Detailed Findings by Category
        for category, data in sorted(report_data['categories'].items()):
            if data['findings']:
                sections.append(self._generate_category_section(category, data))

        # Recommendations
        sections.append(self._generate_recommendations(report_data))

        # Metrics
        sections.append(self._generate_metrics(report_data))

        return '\n\n---\n\n'.join(sections)

    def _generate_header(self, report_data: Dict[str, Any]) -> str:
        """Generate report header with metadata."""
        lines = [
            "# Codebase Review Report",
            "",
            f"**Generated**: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}",
            f"**Review Version**: {self.config.get('version', '1.0.0')}"
        ]

        if self.include_git:
            try:
                # Get current commit
                result = subprocess.run(
                    ['git', 'rev-parse', '--short', 'HEAD'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0:
                    commit = result.stdout.strip()

                    # Get current branch
                    result = subprocess.run(
                        ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
                        capture_output=True,
                        text=True,
                        timeout=5
                    )
                    branch = result.stdout.strip() if result.returncode == 0 else 'unknown'

                    lines.append(f"**Commit**: {commit} ({branch})")
            except:
                pass

        lines.extend([
            f"**Total Findings**: {report_data['total_findings']}",
            ""
        ])

        return '\n'.join(lines)

    def _generate_executive_summary(self, report_data: Dict[str, Any]) -> str:
        """Generate executive summary with overall status."""
        # Determine overall status
        if report_data['critical_count'] > 0:
            overall_status = "🔴 CRITICAL"
        elif report_data['warning_count'] > 0:
            overall_status = "⚠️ WARNING"
        elif report_data['info_count'] > 0:
            overall_status = "ℹ️ INFO"
        else:
            overall_status = "✅ PASS"

        lines = [
            "## Executive Summary",
            "",
            f"**Overall Status**: {overall_status}",
            ""
        ]

        # Category table
        if report_data['categories']:
            lines.extend([
                "| Category | Status | Critical | Warning | Info |",
                "|----------|--------|----------|---------|------|"
            ])

            for category, data in sorted(report_data['categories'].items()):
                status_icon = self._get_status_icon(data)
                lines.append(
                    f"| {category.title()} | {status_icon} | "
                    f"{data['critical']} | {data['warning']} | {data['info']} |"
                )

            lines.append("")

        # Priority actions
        priority_findings = [
            f for f in report_data['all_findings']
            if f.get('severity') == 'critical'
        ]

        if priority_findings:
            lines.extend([
                "### Priority Actions Required",
                ""
            ])
            for i, finding in enumerate(priority_findings[:5], 1):  # Top 5
                lines.append(f"{i}. [CRITICAL] {finding.get('issue', 'Unknown issue')}")
            lines.append("")

        return '\n'.join(lines)

    def _generate_category_section(self, category: str, data: Dict[str, Any]) -> str:
        """Generate detailed section for a category."""
        lines = [
            f"## {category.title()} Review",
            ""
        ]

        # Group findings by severity
        critical = [f for f in data['findings'] if f.get('severity') == 'critical']
        warning = [f for f in data['findings'] if f.get('severity') == 'warning']
        info = [f for f in data['findings'] if f.get('severity') == 'info']

        # Critical findings
        if critical:
            lines.append("### 🔴 Critical Issues")
            lines.append("")
            for finding in critical:
                lines.extend(self._format_finding(finding))
            lines.append("")

        # Warning findings
        if warning:
            lines.append("### ⚠️ Warnings")
            lines.append("")
            for finding in warning:
                lines.extend(self._format_finding(finding))
            lines.append("")

        # Info findings
        if info:
            lines.append("### ℹ️ Information")
            lines.append("")
            for finding in info:
                lines.extend(self._format_finding(finding))
            lines.append("")

        # Category metrics
        if data.get('metrics'):
            lines.append("### Metrics")
            lines.append("")
            for key, value in data['metrics'].items():
                lines.append(f"- **{key.replace('_', ' ').title()}**: {value}")
            lines.append("")

        return '\n'.join(lines)

    def _format_finding(self, finding: Dict[str, Any]) -> List[str]:
        """Format a single finding."""
        lines = [
            f"#### {finding.get('issue', 'Unknown Issue')}",
            ""
        ]

        if finding.get('file'):
            location = finding['file']
            if finding.get('line'):
                location += f":{finding['line']}"
            lines.append(f"**Location**: `{location}`")
            lines.append("")

        if finding.get('description'):
            lines.append(finding['description'])
            lines.append("")

        if finding.get('actual'):
            lines.append(f"**Actual**: {finding['actual']}")
            lines.append("")

        if finding.get('expected'):
            lines.append(f"**Expected**: {finding['expected']}")
            lines.append("")

        if finding.get('documented'):
            lines.append(f"**Documented**: {finding['documented']}")
            lines.append("")

        if finding.get('code'):
            lines.append("```")
            lines.append(finding['code'])
            lines.append("```")
            lines.append("")

        if finding.get('recommendation'):
            lines.append(f"**Recommendation**: {finding['recommendation']}")
            lines.append("")

        return lines

    def _generate_recommendations(self, report_data: Dict[str, Any]) -> str:
        """Generate recommendations summary."""
        lines = [
            "## Recommendations Summary",
            ""
        ]

        # Collect all recommendations
        recommendations = {
            'critical': [],
            'warning': [],
            'info': []
        }

        for finding in report_data['all_findings']:
            if finding.get('recommendation'):
                severity = finding.get('severity', 'info')
                recommendations[severity].append(finding['recommendation'])

        # Output by priority
        if recommendations['critical']:
            lines.append("### Immediate Actions (Critical)")
            for i, rec in enumerate(recommendations['critical'], 1):
                lines.append(f"{i}. {rec}")
            lines.append("")

        if recommendations['warning']:
            lines.append("### High Priority (Warnings)")
            for i, rec in enumerate(recommendations['warning'], 1):
                lines.append(f"{i}. {rec}")
            lines.append("")

        if recommendations['info']:
            lines.append("### Suggested Improvements (Info)")
            for i, rec in enumerate(recommendations['info'][:5], 1):  # Top 5
                lines.append(f"{i}. {rec}")
            lines.append("")

        if not any(recommendations.values()):
            lines.append("No specific recommendations at this time.")
            lines.append("")

        return '\n'.join(lines)

    def _generate_metrics(self, report_data: Dict[str, Any]) -> str:
        """Generate metrics summary."""
        lines = [
            "## Review Metrics",
            ""
        ]

        # Calculate health score
        max_score = 100
        score = max_score
        score -= report_data['critical_count'] * 10  # -10 per critical
        score -= report_data['warning_count'] * 3   # -3 per warning
        score -= report_data['info_count'] * 1      # -1 per info
        score = max(0, score)  # Don't go below 0

        lines.extend([
            f"### Health Score: {score}/{max_score}",
            ""
        ])

        # Score breakdown
        lines.extend([
            "**Score Breakdown**:",
            f"- Base Score: {max_score}",
            f"- Critical Issues: -{report_data['critical_count'] * 10} ({report_data['critical_count']} × 10)",
            f"- Warnings: -{report_data['warning_count'] * 3} ({report_data['warning_count']} × 3)",
            f"- Info: -{report_data['info_count'] * 1} ({report_data['info_count']} × 1)",
            f"- **Final Score**: {score}",
            ""
        ])

        # Category breakdown
        if report_data['categories']:
            lines.extend([
                "### Category Breakdown",
                ""
            ])
            for category, data in sorted(report_data['categories'].items()):
                total = data['critical'] + data['warning'] + data['info']
                lines.append(f"- **{category.title()}**: {total} findings "
                           f"({data['critical']} critical, {data['warning']} warnings, {data['info']} info)")
            lines.append("")

        return '\n'.join(lines)

    @staticmethod
    def _get_status_icon(data: Dict[str, Any]) -> str:
        """Get status icon for category."""
        if data['critical'] > 0:
            return "🔴"
        elif data['warning'] > 0:
            return "⚠️"
        elif data['info'] > 0:
            return "ℹ️"
        else:
            return "✅"
