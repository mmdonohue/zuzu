"""
Suppression System for Code Review Findings

Supports three types of suppressions:
1. Inline comments (e.g., // SECURITY-IGNORE: justification)
2. File/line-specific suppressions in suppressions.json
3. Pattern-based suppressions for common false positives

Architecture:
- Centralized suppression management
- Mandatory justifications
- Audit trail
- Expiration support
- Review workflow
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Optional, Set, Any
from datetime import datetime, timedelta


class SuppressionManager:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.suppressions_path = self.project_root / '.claude' / 'review' / 'config' / 'suppressions.json'
        self.suppressions_data = self._load_suppressions()
        self.inline_markers = self.suppressions_data.get('inline_markers', [
            'SECURITY-IGNORE',
            'SEC-IGNORE',
            'NOSEC',
            'security:ignore',
            'REVIEW-IGNORE',
            'QUALITY-IGNORE'
        ])

    def _load_suppressions(self) -> Dict[str, Any]:
        """Load suppressions configuration from JSON file."""
        if not self.suppressions_path.exists():
            return {
                'suppressions': [],
                'patterns': [],
                'inline_markers': []
            }

        with open(self.suppressions_path, 'r') as f:
            return json.load(f)

    def is_suppressed(
        self,
        file_path: str,
        line: Optional[int],
        checker: str,
        issue: str,
        code_content: Optional[str] = None
    ) -> tuple[bool, Optional[str]]:
        """
        Check if a finding should be suppressed.

        Args:
            file_path: Relative path to the file
            line: Line number of the finding
            checker: Name of the checker (security, quality, etc.)
            issue: Issue description
            code_content: Optional content of the file for inline comment checking

        Returns:
            Tuple of (is_suppressed, justification)
        """
        # Check inline suppressions first
        if code_content and line:
            inline_suppression = self._check_inline_suppression(code_content, line)
            if inline_suppression:
                return True, inline_suppression

        # Check file/line-specific suppressions
        for suppression in self.suppressions_data.get('suppressions', []):
            if self._matches_suppression(suppression, file_path, line, checker, issue):
                # Check expiration
                if self._is_expired(suppression):
                    continue

                justification = suppression.get('justification', 'No justification provided')
                return True, f"Suppressed: {justification}"

        # Check pattern-based suppressions
        for pattern_sup in self.suppressions_data.get('patterns', []):
            if self._matches_pattern_suppression(pattern_sup, file_path, checker, issue):
                justification = pattern_sup.get('justification', 'Pattern-based suppression')
                return True, f"Pattern suppressed: {justification}"

        return False, None

    def _check_inline_suppression(self, code_content: str, target_line: int) -> Optional[str]:
        """Check for inline suppression comments."""
        lines = code_content.split('\n')

        # Check the line itself and 2 lines before
        check_range = range(max(0, target_line - 3), target_line)

        for line_idx in check_range:
            if line_idx >= len(lines):
                continue

            line = lines[line_idx]

            # Look for suppression markers
            for marker in self.inline_markers:
                # Match: // MARKER: justification or # MARKER: justification
                pattern = rf'(?://|#)\s*{re.escape(marker)}(?::\s*(.+))?'
                match = re.search(pattern, line, re.IGNORECASE)

                if match:
                    justification = match.group(1) if match.group(1) else 'Suppressed by inline comment'
                    return justification.strip()

        return None

    def _matches_suppression(
        self,
        suppression: Dict[str, Any],
        file_path: str,
        line: Optional[int],
        checker: str,
        issue: str
    ) -> bool:
        """Check if a suppression entry matches the finding."""
        # Normalize paths for comparison
        suppression_file = suppression.get('file', '')
        if suppression_file and not self._path_matches(file_path, suppression_file):
            return False

        # Check line number (with tolerance of +/- 2 lines for code changes)
        suppression_line = suppression.get('line')
        if suppression_line is not None and line is not None:
            if abs(line - suppression_line) > 2:
                return False

        # Check checker
        suppression_checker = suppression.get('checker')
        if suppression_checker and suppression_checker != checker:
            return False

        # Check issue pattern
        suppression_pattern = suppression.get('pattern')
        if suppression_pattern:
            if not re.search(suppression_pattern, issue, re.IGNORECASE):
                return False

        return True

    def _matches_pattern_suppression(
        self,
        pattern_sup: Dict[str, Any],
        file_path: str,
        checker: str,
        issue: str
    ) -> bool:
        """Check if a pattern-based suppression matches."""
        # Check if file matches any of the path patterns
        paths = pattern_sup.get('paths', [])
        if paths:
            import fnmatch
            if not any(fnmatch.fnmatch(file_path, pattern) for pattern in paths):
                return False

        # Check checker
        pattern_checker = pattern_sup.get('checker')
        if pattern_checker and pattern_checker != checker:
            return False

        # Check issue pattern
        pattern = pattern_sup.get('pattern')
        if pattern and not re.search(pattern, issue, re.IGNORECASE):
            return False

        return True

    def _path_matches(self, file_path: str, pattern: str) -> bool:
        """Check if a file path matches a pattern."""
        import fnmatch

        # Normalize paths
        file_path = str(Path(file_path)).replace('\\', '/')
        pattern = str(Path(pattern)).replace('\\', '/')

        # Exact match
        if file_path == pattern:
            return True

        # Fnmatch pattern
        if fnmatch.fnmatch(file_path, pattern):
            return True

        # Ends with match (for relative paths)
        if file_path.endswith(pattern):
            return True

        return False

    def _is_expired(self, suppression: Dict[str, Any]) -> bool:
        """Check if a suppression has expired."""
        expires = suppression.get('expires')
        if not expires:
            return False

        try:
            expire_date = datetime.fromisoformat(expires)
            return datetime.now() > expire_date
        except (ValueError, TypeError):
            return False

    def add_suppression(
        self,
        file_path: str,
        line: int,
        checker: str,
        issue: str,
        justification: str,
        expires_days: Optional[int] = None
    ) -> str:
        """
        Add a new suppression to the configuration file.

        Args:
            file_path: File path of the finding
            line: Line number
            checker: Checker name
            issue: Issue description
            justification: Required justification for suppression
            expires_days: Optional number of days until suppression expires

        Returns:
            Suppression ID
        """
        # Generate unique ID
        import hashlib
        id_source = f"{file_path}:{line}:{checker}:{issue}"
        suppression_id = hashlib.md5(id_source.encode()).hexdigest()[:12]

        # Calculate expiration date
        expires = None
        if expires_days:
            expires = (datetime.now() + timedelta(days=expires_days)).isoformat()

        # Create suppression entry
        suppression = {
            'id': suppression_id,
            'file': file_path,
            'line': line,
            'checker': checker,
            'pattern': issue,
            'justification': justification,
            'added_by': 'user',
            'added_date': datetime.now().strftime('%Y-%m-%d'),
            'expires': expires,
            'reviewed': False
        }

        # Add to suppressions
        if 'suppressions' not in self.suppressions_data:
            self.suppressions_data['suppressions'] = []

        self.suppressions_data['suppressions'].append(suppression)

        # Save to file
        self._save_suppressions()

        return suppression_id

    def _save_suppressions(self):
        """Save suppressions to JSON file."""
        self.suppressions_path.parent.mkdir(parents=True, exist_ok=True)

        with open(self.suppressions_path, 'w') as f:
            json.dump(self.suppressions_data, f, indent=2)

    def get_suppression_stats(self) -> Dict[str, int]:
        """Get statistics about suppressions."""
        suppressions = self.suppressions_data.get('suppressions', [])

        return {
            'total': len(suppressions),
            'expired': sum(1 for s in suppressions if self._is_expired(s)),
            'active': sum(1 for s in suppressions if not self._is_expired(s)),
            'needs_review': sum(1 for s in suppressions if not s.get('reviewed', False)),
            'pattern_rules': len(self.suppressions_data.get('patterns', []))
        }
