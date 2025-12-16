"""
File Parser Utility

Provides utilities for parsing and analyzing code files.
"""

import ast
import re
from pathlib import Path
from typing import List, Dict, Any, Optional


class FileParser:
    """Utility for parsing and analyzing code files."""

    @staticmethod
    def parse_typescript_imports(file_path: str) -> List[str]:
        """
        Extract import statements from TypeScript/JavaScript files.

        Args:
            file_path: Path to the TypeScript/JavaScript file

        Returns:
            List of imported module names
        """
        imports = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Match various import patterns
            patterns = [
                r"import\s+.*?\s+from\s+['\"]([^'\"]+)['\"]",  # import X from 'module'
                r"import\s+['\"]([^'\"]+)['\"]",                # import 'module'
                r"require\(['\"]([^'\"]+)['\"]\)",             # require('module')
            ]

            for pattern in patterns:
                matches = re.findall(pattern, content)
                imports.extend(matches)

        except Exception as e:
            print(f"[file_parser] Error parsing imports from {file_path}: {e}")

        return imports

    @staticmethod
    def extract_jsx_tree(file_path: str, function_name: str = 'render') -> Optional[str]:
        """
        Extract JSX tree from a React component.

        Args:
            file_path: Path to the React component file
            function_name: Function to extract JSX from (default: 'render')

        Returns:
            JSX tree as string, or None if not found
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Find the root.render or ReactDOM.render call
            render_pattern = r'root\.render\(([\s\S]*?)\);'
            match = re.search(render_pattern, content)

            if match:
                return match.group(1).strip()

        except Exception as e:
            print(f"[file_parser] Error extracting JSX from {file_path}: {e}")

        return None

    @staticmethod
    def extract_routes(file_path: str) -> List[Dict[str, str]]:
        """
        Extract route definitions from React Router.

        Args:
            file_path: Path to file containing routes

        Returns:
            List of route dictionaries with 'path' and 'element' keys
        """
        routes = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Match <Route path="..." element={...} />
            route_pattern = r'<Route\s+path=["\']([^"\']+)["\']\s+element=\{<(\w+)'
            matches = re.findall(route_pattern, content)

            for path, element in matches:
                routes.append({
                    'path': path,
                    'element': element
                })

        except Exception as e:
            print(f"[file_parser] Error extracting routes from {file_path}: {e}")

        return routes

    @staticmethod
    def extract_app_use_routes(file_path: str) -> List[str]:
        """
        Extract Express app.use() route prefixes.

        Args:
            file_path: Path to Express server file

        Returns:
            List of route prefixes
        """
        routes = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Match app.use('/prefix', ...)
            pattern = r"app\.use\(['\"]([^'\"]+)['\"]"
            matches = re.findall(pattern, content)
            routes.extend(matches)

        except Exception as e:
            print(f"[file_parser] Error extracting app.use routes from {file_path}: {e}")

        return routes

    @staticmethod
    def extract_env_variables(file_path: str) -> List[str]:
        """
        Extract environment variable names from .env.example file.

        Args:
            file_path: Path to .env.example file

        Returns:
            List of environment variable names
        """
        variables = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        # Extract variable name before =
                        match = re.match(r'^([A-Z_][A-Z0-9_]*)=', line)
                        if match:
                            variables.append(match.group(1))

        except Exception as e:
            print(f"[file_parser] Error extracting env variables from {file_path}: {e}")

        return variables

    @staticmethod
    def extract_config_value(file_path: str, key: str) -> Optional[str]:
        """
        Extract a configuration value from a TypeScript config file.

        Args:
            file_path: Path to config file
            key: Key to extract (e.g., 'refreshTokenExpiry')

        Returns:
            Value as string, or None if not found
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Match: key: 'value' or key: value
            pattern = rf'{key}:\s*["\']?([^,\'"}}]+)["\']?'
            match = re.search(pattern, content)

            if match:
                return match.group(1).strip()

        except Exception as e:
            print(f"[file_parser] Error extracting {key} from {file_path}: {e}")

        return None

    @staticmethod
    def count_console_logs(file_path: str) -> int:
        """
        Count console.log statements in a file.

        Args:
            file_path: Path to file

        Returns:
            Number of console.log statements
        """
        count = 0
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Match console.log, console.error, console.warn
            pattern = r'\bconsole\.(log|error|warn|debug|info)\('
            matches = re.findall(pattern, content)
            count = len(matches)

        except Exception as e:
            print(f"[file_parser] Error counting console.log in {file_path}: {e}")

        return count

    @staticmethod
    def read_file_lines(file_path: str, start_line: int = 0, end_line: int = -1) -> List[str]:
        """
        Read specific lines from a file.

        Args:
            file_path: Path to file
            start_line: Starting line number (0-indexed)
            end_line: Ending line number (0-indexed, -1 for end of file)

        Returns:
            List of lines
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                if end_line == -1:
                    return lines[start_line:]
                else:
                    return lines[start_line:end_line + 1]
        except Exception as e:
            print(f"[file_parser] Error reading lines from {file_path}: {e}")
            return []
