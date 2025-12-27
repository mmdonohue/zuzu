"""Quality Checker - Based on code-quality-reviewer agent"""

import re
from pathlib import Path
from typing import Dict, Any, List
import fnmatch


class QualityChecker:
    """
    Automated code quality checker based on .claude/agents/code-quality-reviewer.md

    Focuses on:
    - Clean Code Analysis (naming, complexity, duplication)
    - Error Handling & Edge Cases
    - TypeScript-specific issues
    - Best Practices
    """

    def __init__(self, project_root, config):
        self.project_root = Path(project_root)
        self.config = config
        self.findings = []
        self.gitignore_patterns = self._load_gitignore()

    def run(self) -> Dict[str, Any]:
        """Run all quality checks."""
        # Check TypeScript/JavaScript files
        self._check_typescript_files()
        self._check_error_handling()
        self._check_magic_values()
        self._check_code_complexity()
        self._check_typescript_best_practices()

        # Determine status
        critical = len([f for f in self.findings if f['severity'] == 'critical'])
        warning = len([f for f in self.findings if f['severity'] == 'warning'])

        if critical > 0:
            status = 'critical'
        elif warning > 0:
            status = 'warning'
        else:
            status = 'pass'

        return {
            'category': 'quality',
            'status': status,
            'findings': self.findings,
            'metrics': {
                'files_checked': self._count_source_files(),
                'issues_found': len(self.findings)
            }
        }

    def _count_source_files(self) -> int:
        """Count TypeScript/JavaScript source files."""
        count = 0
        for ext in ['*.ts', '*.tsx', '*.js', '*.jsx']:
            files = [f for f in self.project_root.glob(f'src/**/{ext}')
                    if not self._should_ignore_path(f)]
            count += len(files)
        return count

    def _load_gitignore(self) -> List[str]:
        """Load and parse .gitignore patterns."""
        patterns = []
        gitignore_path = self.project_root / '.gitignore'

        if gitignore_path.exists():
            with open(gitignore_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    # Skip empty lines and comments
                    if line and not line.startswith('#'):
                        # Remove leading slash for consistent matching
                        if line.startswith('/'):
                            line = line[1:]
                        patterns.append(line)

        # Always ignore common build/dependency directories
        patterns.extend([
            'node_modules', 'dist', 'build', '.git',
            '__pycache__', '*.pyc', '.cache'
        ])

        return patterns

    def _should_ignore_path(self, file_path: Path) -> bool:
        """Check if file path matches any gitignore pattern."""
        try:
            # Get relative path from project root
            rel_path = file_path.relative_to(self.project_root)
            path_str = str(rel_path)

            for pattern in self.gitignore_patterns:
                # Handle directory patterns (ending with /)
                if pattern.endswith('/'):
                    if path_str.startswith(pattern.rstrip('/')):
                        return True
                # Handle wildcard patterns
                elif '*' in pattern:
                    if fnmatch.fnmatch(path_str, pattern):
                        return True
                    # Also check if any parent directory matches
                    for part in rel_path.parts:
                        if fnmatch.fnmatch(part, pattern):
                            return True
                # Handle exact matches and directory prefixes
                else:
                    if path_str.startswith(pattern + '/') or path_str == pattern:
                        return True
                    # Check if any part of the path matches the pattern
                    if pattern in rel_path.parts:
                        return True

            return False
        except ValueError:
            # Path is not relative to project_root
            return True

    def _is_inside_sx_block(self, lines: List[str], current_line_idx: int) -> bool:
        """
        Check if the current line is inside a MUI sx={{ ... }} block.

        Args:
            lines: All lines of the file
            current_line_idx: Index of the current line (0-based)

        Returns:
            True if the line is inside an sx block
        """
        # Look backwards to find if we're inside an sx block
        brace_depth = 0
        in_sx_block = False

        # Check from the beginning up to current line
        for i in range(current_line_idx + 1):
            line = lines[i]

            # Check if we're entering an sx block
            if 'sx=' in line or 'sx =' in line:
                # Found sx=, start tracking
                in_sx_block = True
                # Count opening braces after sx=
                sx_pos = line.find('sx=')
                if sx_pos == -1:
                    sx_pos = line.find('sx =')
                if sx_pos >= 0:
                    after_sx = line[sx_pos + 3:]
                    brace_depth += after_sx.count('{') - after_sx.count('}')
            elif in_sx_block:
                # We're tracking an sx block, count braces
                brace_depth += line.count('{') - line.count('}')

            # If we're at the current line, check if we're still inside
            if i == current_line_idx:
                return in_sx_block and brace_depth > 0

            # If brace depth reaches 0, we've exited the sx block
            if in_sx_block and brace_depth <= 0:
                in_sx_block = False
                brace_depth = 0

        return False

    def _check_typescript_files(self):
        """Check TypeScript files for quality issues."""
        try:
            # Find all TypeScript files in src/ (excluding gitignored paths)
            ts_files = [f for f in self.project_root.glob('src/**/*.ts')
                       if not self._should_ignore_path(f)] + \
                      [f for f in self.project_root.glob('src/**/*.tsx')
                       if not self._should_ignore_path(f)]

            for file_path in ts_files:
                with open(file_path, 'r') as f:
                    content = f.read()
                    lines = content.split('\n')

                # Check for 'any' type usage
                any_pattern = r':\s*any\b'
                for i, line in enumerate(lines, 1):
                    if re.search(any_pattern, line) and 'eslint-disable' not in line:
                        self.findings.append({
                            'severity': 'warning',
                            'issue': 'Use of "any" type reduces type safety',
                            'file': str(file_path.relative_to(self.project_root)),
                            'line': i,
                            'description': f'Line {i} uses "any" type which defeats TypeScript\'s type checking.',
                            'recommendation': 'Define a proper type or interface instead of using "any"',
                            'code_snippet': line.strip()
                        })

                # Check for interface vs type preference
                interface_pattern = r'^\s*interface\s+\w+'
                for i, line in enumerate(lines, 1):
                    if re.search(interface_pattern, line):
                        self.findings.append({
                            'severity': 'info',
                            'issue': 'Use "type" instead of "interface" per project standards',
                            'file': str(file_path.relative_to(self.project_root)),
                            'line': i,
                            'description': 'Project standards prefer "type" over "interface" for consistency.',
                            'recommendation': 'Convert interface to type alias',
                            'code_snippet': line.strip()
                        })

        except Exception as e:
            print(f"[quality] Error checking TypeScript files: {e}")

    def _check_error_handling(self):
        """Check for proper error handling patterns."""
        try:
            # Find all TypeScript/JavaScript files (excluding gitignored paths)
            source_files = [f for f in self.project_root.glob('src/**/*.ts')
                           if not self._should_ignore_path(f)] + \
                          [f for f in self.project_root.glob('src/**/*.tsx')
                           if not self._should_ignore_path(f)] + \
                          [f for f in self.project_root.glob('server/**/*.ts')
                           if not self._should_ignore_path(f)]

            for file_path in source_files:
                with open(file_path, 'r') as f:
                    content = f.read()
                    lines = content.split('\n')

                # Check for fetch/API calls without error handling
                fetch_pattern = r'(fetch|axios\.(get|post|put|delete|patch))\s*\('
                in_try_block = False
                try_depth = 0

                for i, line in enumerate(lines, 1):
                    # Track try-catch blocks
                    if 'try' in line and '{' in line:
                        in_try_block = True
                        try_depth += 1
                    if in_try_block and '}' in line and 'catch' in lines[min(i, len(lines)-1)]:
                        try_depth -= 1
                        if try_depth == 0:
                            in_try_block = False

                    # Check for API calls
                    if re.search(fetch_pattern, line):
                        # Check if followed by .catch() or in try block
                        next_lines = '\n'.join(lines[i:min(i+5, len(lines))])
                        has_catch = '.catch(' in next_lines or 'catch(' in next_lines

                        if not in_try_block and not has_catch:
                            self.findings.append({
                                'severity': 'warning',
                                'issue': 'API call without error handling',
                                'file': str(file_path.relative_to(self.project_root)),
                                'line': i,
                                'description': 'API call lacks proper error handling (no try-catch or .catch())',
                                'recommendation': 'Wrap in try-catch block or add .catch() handler',
                                'code_snippet': line.strip()
                            })

        except Exception as e:
            print(f"[quality] Error checking error handling: {e}")

    def _check_magic_values(self):
        """Check for magic numbers and strings that should be constants."""
        try:
            source_files = [f for f in self.project_root.glob('src/**/*.ts')
                           if not self._should_ignore_path(f)] + \
                          [f for f in self.project_root.glob('src/**/*.tsx')
                           if not self._should_ignore_path(f)]

            for file_path in source_files:
                with open(file_path, 'r') as f:
                    content = f.read()
                    lines = content.split('\n')

                # Look for magic numbers (excluding common values)
                magic_number_pattern = r'\b(\d{3,}|\d+\.\d+)\b'
                excluded_numbers = {'0', '1', '2', '100', '200', '404', '500'}

                for i, line in enumerate(lines, 1):
                    # Skip comments and strings
                    if line.strip().startswith('//') or line.strip().startswith('*'):
                        continue

                    # Skip lines inside MUI sx blocks
                    if self._is_inside_sx_block(lines, i - 1):  # i-1 because enumerate starts at 1
                        continue

                    matches = re.finditer(magic_number_pattern, line)
                    for match in matches:
                        number = match.group(1)
                        if number not in excluded_numbers:
                            # Check if this number is part of a hex color code (e.g., #001133)
                            match_start = match.start()
                            if match_start > 0 and line[match_start - 1] == '#':
                                # Skip hex color codes
                                continue

                            # Check if this number is a CSS dimension property value
                            # (e.g., width: 100, height: 200, maxWidth: 300, etc.)
                            dimension_props = r'\b(width|height|maxWidth|minWidth|maxHeight|minHeight)\s*:\s*'
                            if re.search(dimension_props + re.escape(number) + r'\s*[,}]', line):
                                # Skip CSS dimension property values
                                continue

                            # Check if it's already a const
                            if 'const' not in line and '=' not in line.split(number)[0]:
                                self.findings.append({
                                    'severity': 'info',
                                    'issue': f'Magic number "{number}" should be a named constant',
                                    'file': str(file_path.relative_to(self.project_root)),
                                    'line': i,
                                    'description': 'Using magic numbers reduces code readability and maintainability.',
                                    'recommendation': f'Define a named constant: const MEANINGFUL_NAME = {number}',
                                    'code_snippet': line.strip()
                                })

        except Exception as e:
            print(f"[quality] Error checking magic values: {e}")

    def _check_code_complexity(self):
        """Check for overly complex functions using cyclomatic complexity estimation."""
        try:
            source_files = [f for f in self.project_root.glob('src/**/*.ts')
                           if not self._should_ignore_path(f)] + \
                          [f for f in self.project_root.glob('src/**/*.tsx')
                           if not self._should_ignore_path(f)] + \
                          [f for f in self.project_root.glob('server/**/*.ts')
                           if not self._should_ignore_path(f)]

            max_complexity = self.config.get('thresholds', {}).get('complexity_max', 10)

            for file_path in source_files:
                with open(file_path, 'r') as f:
                    content = f.read()
                    lines = content.split('\n')

                # Simple function detection and complexity counting
                function_pattern = r'(function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>|\w+\s*\([^)]*\)\s*\{)'
                current_function = None
                current_function_line = 0
                brace_depth = 0
                complexity = 1  # Base complexity

                for i, line in enumerate(lines, 1):
                    # Detect function start
                    if re.search(function_pattern, line):
                        current_function = line.strip()
                        current_function_line = i
                        complexity = 1
                        brace_depth = line.count('{') - line.count('}')

                    if current_function:
                        # Only update brace depth if we're not on the function declaration line
                        # (to avoid double-counting braces)
                        if i != current_function_line:
                            brace_depth += line.count('{') - line.count('}')

                        # Count complexity indicators
                        complexity += line.count('if ')
                        complexity += line.count('else if')
                        complexity += line.count('for ')
                        complexity += line.count('while ')
                        complexity += line.count('case ')
                        complexity += line.count('&&')
                        complexity += line.count('||')
                        complexity += line.count('?')

                        # Function ended
                        if brace_depth == 0 and current_function_line != i:
                            if complexity > max_complexity:
                                self.findings.append({
                                    'severity': 'warning',
                                    'issue': f'High cyclomatic complexity ({complexity})',
                                    'file': str(file_path.relative_to(self.project_root)),
                                    'line': current_function_line,
                                    'description': f'Function has complexity of {complexity}, exceeding threshold of {max_complexity}.',
                                    'recommendation': 'Consider breaking this function into smaller, more focused functions',
                                    'code_snippet': current_function[:100]
                                })
                            current_function = None

        except Exception as e:
            print(f"[quality] Error checking complexity: {e}")

    def _check_typescript_best_practices(self):
        """Check TypeScript-specific best practices."""
        try:
            ts_files = [f for f in self.project_root.glob('src/**/*.ts')
                       if not self._should_ignore_path(f)] + \
                      [f for f in self.project_root.glob('src/**/*.tsx')
                       if not self._should_ignore_path(f)]

            for file_path in ts_files:
                with open(file_path, 'r') as f:
                    content = f.read()
                    lines = content.split('\n')

                # Check for unused variables with underscore prefix
                # Use negative lookbehind to ensure _ is at the start of an identifier
                # Excludes object properties (e.g., object._property)
                unused_pattern = r'(?<![a-zA-Z0-9_\.])_\w+\s*[,=:]'
                for i, line in enumerate(lines, 1):
                    if re.search(unused_pattern, line):
                        self.findings.append({
                            'severity': 'info',
                            'issue': 'Avoid underscore prefix for unused variables',
                            'file': str(file_path.relative_to(self.project_root)),
                            'line': i,
                            'description': 'Project standards prefer removing unused variables instead of prefixing with underscore.',
                            'recommendation': 'Remove unused variable or use it if needed',
                            'code_snippet': line.strip()
                        })

                # Check for console.log in non-dev files
                if 'console.log(' in content and '/src/' in str(file_path):
                    log_lines = [i+1 for i, line in enumerate(lines)
                                if 'console.log(' in line and not line.strip().startswith('//')]
                    if log_lines:
                        self.findings.append({
                            'severity': 'info',
                            'issue': 'console.log() found in source code',
                            'file': str(file_path.relative_to(self.project_root)),
                            'line': log_lines[0],
                            'description': f'Found {len(log_lines)} console.log statement(s) which should be removed or replaced with proper logging.',
                            'recommendation': 'Remove debug console.log or use a proper logging library',
                            'code_snippet': f'{len(log_lines)} occurrence(s) found'
                        })

        except Exception as e:
            print(f"[quality] Error checking TypeScript best practices: {e}")
