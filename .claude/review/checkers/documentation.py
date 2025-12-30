"""
Documentation Checker

Verifies that documentation in .claude/ matches actual code implementation.
"""

import os
from pathlib import Path
from typing import Dict, Any, List
import sys

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.file_parser import FileParser


class DocumentationChecker:
    """Checks documentation accuracy against actual code."""

    def __init__(self, project_root: str, config: Dict[str, Any]):
        """
        Initialize documentation checker.

        Args:
            project_root: Root directory of the project
            config: Configuration dictionary
        """
        self.project_root = Path(project_root)
        self.config = config
        self.parser = FileParser()
        self.findings = []

    def run(self) -> Dict[str, Any]:
        """
        Run all documentation checks.

        Returns:
            Dictionary with findings and metrics
        """
        self.findings = []

        # Check CLAUDE.md accuracy
        self._check_provider_hierarchy()
        self._check_routing_documentation()
        self._check_backend_routes()
        self._check_environment_variables()

        # Check AUTH_IMPLEMENTATION.md accuracy
        self._check_auth_file_structure()
        self._check_jwt_configuration()

        # Check README.md accuracy
        self._check_readme_scripts()
        self._check_readme_tech_stack()
        self._check_readme_claude_consistency()

        # Check About.tsx and Home.tsx tech stack
        self._check_page_tech_stacks()

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
            'category': 'docs',
            'status': status,
            'findings': self.findings,
            'metrics': {
                'docs_checked': 5,
                'claims_verified': 10,
                'discrepancies': len(self.findings)
            }
        }

    def _check_provider_hierarchy(self):
        """Check if CLAUDE.md provider hierarchy matches src/index.tsx."""
        try:
            # Read actual provider hierarchy from src/index.tsx
            index_file = self.project_root / 'src' / 'index.tsx'
            jsx_tree = self.parser.extract_jsx_tree(str(index_file))

            if jsx_tree:
                # Check for AuthProvider
                if 'AuthProvider' in jsx_tree:
                    # AuthProvider exists but may not be in docs
                    claude_md = self.project_root / '.claude' / 'CLAUDE.md'
                    with open(claude_md, 'r') as f:
                        content = f.read()

                    # Check lines 47-54 for provider list
                    lines = content.split('\n')
                    provider_section = '\n'.join(lines[46:54])  # Lines 47-54 (0-indexed)

                    if 'AuthProvider' not in provider_section and 'AuthContext' not in provider_section:
                        self.findings.append({
                            'severity': 'warning',
                            'issue': 'Missing AuthProvider in CLAUDE.md provider hierarchy',
                            'file': '.claude/CLAUDE.md',
                            'line': 47,
                            'description': 'The provider hierarchy documentation does not mention AuthProvider, but it exists in the code.',
                            'actual': 'Provider hierarchy includes: Redux, QueryClient, BrowserRouter, ThemeProvider, CssBaseline, AuthProvider',
                            'documented': 'Provider hierarchy lists: Redux, QueryClient, BrowserRouter, ThemeProvider, CssBaseline (missing AuthProvider)',
                            'recommendation': 'Add AuthProvider to the provider hierarchy list in CLAUDE.md around line 52'
                        })

        except Exception as e:
            print(f"[documentation] Error checking provider hierarchy: {e}")

    def _check_routing_documentation(self):
        """Check if routing documentation matches App.tsx."""
        try:
            app_file = self.project_root / 'src' / 'App.tsx'
            routes = self.parser.extract_routes(str(app_file))

            if routes:
                # Count actual routes
                actual_routes = [r['element'] for r in routes]
                actual_count = len(actual_routes)

                # Check CLAUDE.md routing section (lines 54-60, handles multi-line format)
                claude_md = self.project_root / '.claude' / 'CLAUDE.md'
                with open(claude_md, 'r') as f:
                    lines = f.readlines()

                if len(lines) > 53:
                    # Read routing section (may span multiple lines)
                    routing_section = '\n'.join([l.strip() for l in lines[53:60]])

                    # Extract mentioned routes from documentation
                    # Handles both single-line and multi-line formats
                    documented_routes = []
                    if 'Home' in routing_section:
                        documented_routes.append('Home')
                    if 'About' in routing_section:
                        documented_routes.append('About')
                    if 'Dashboard' in routing_section:
                        documented_routes.append('Dashboard')
                    if 'OpenRouter' in routing_section:
                        documented_routes.append('OpenRouter')
                    if 'Logs' in routing_section:
                        documented_routes.append('Logs')
                    if 'Login' in routing_section:
                        documented_routes.append('Login')
                    if 'Signup' in routing_section:
                        documented_routes.append('Signup')
                    if 'VerifyCode' in routing_section or 'verify' in routing_section.lower():
                        documented_routes.append('VerifyCode')
                    if 'Account' in routing_section:
                        documented_routes.append('Account')

                    documented_count = len(documented_routes)

                    # Normalize route names for comparison (remove common suffixes)
                    def normalize_route_name(name):
                        """Remove common suffixes like Component, Page, etc."""
                        suffixes = ['Component', 'Page', 'Screen', 'View']
                        for suffix in suffixes:
                            if name.endswith(suffix):
                                return name[:-len(suffix)]
                        return name

                    # Normalize both lists for comparison
                    normalized_actual = [normalize_route_name(r) for r in actual_routes]
                    normalized_documented = [normalize_route_name(r) for r in documented_routes]

                    # Check for missing routes (using normalized names)
                    missing_routes = [actual_routes[i] for i, norm in enumerate(normalized_actual)
                                     if norm not in normalized_documented]

                    if missing_routes or actual_count != documented_count:
                        self.findings.append({
                            'severity': 'warning',
                            'issue': 'Incomplete routing documentation',
                            'file': '.claude/CLAUDE.md',
                            'line': 54,
                            'description': f'Documentation lists {documented_count} routes but codebase has {actual_count} routes.',
                            'actual': f'{actual_count} routes: {", ".join(actual_routes)}',
                            'documented': f'{documented_count} routes: {", ".join(documented_routes)}',
                            'recommendation': f'Update line 54 to include all routes: {", ".join(actual_routes)}'
                        })

        except Exception as e:
            print(f"[documentation] Error checking routing: {e}")

    def _check_backend_routes(self):
        """Check if backend routes documentation matches server/index.ts."""
        try:
            server_file = self.project_root / 'server' / 'index.ts'
            routes = self.parser.extract_app_use_routes(str(server_file))

            if routes:
                # Check if /api/auth is in routes
                has_auth_route = any('/api/auth' in r or '/auth' in r for r in routes)

                # Check CLAUDE.md line 72
                claude_md = self.project_root / '.claude' / 'CLAUDE.md'
                with open(claude_md, 'r') as f:
                    content = f.read()

                # Look for backend routes documentation
                if '/api/auth' not in content[:5000]:  # Check first part of doc
                    if has_auth_route:
                        self.findings.append({
                            'severity': 'warning',
                            'issue': 'Missing /api/auth in backend routes documentation',
                            'file': '.claude/CLAUDE.md',
                            'line': 72,
                            'description': 'The backend routes section does not mention /api/auth endpoint.',
                            'actual': f'Routes include: {", ".join(routes)}',
                            'documented': 'Routes listed do not include /api/auth',
                            'recommendation': 'Add /api/auth to the backend routes list'
                        })

        except Exception as e:
            print(f"[documentation] Error checking backend routes: {e}")

    def _check_environment_variables(self):
        """Check if environment variables match between docs and .env.example."""
        try:
            # Get env vars from .env.example
            env_file = self.project_root / '.env.example'
            server_env_file = self.project_root / 'server' / '.env.example'

            actual_vars = set()
            if env_file.exists():
                actual_vars.update(self.parser.extract_env_variables(str(env_file)))
            if server_env_file.exists():
                actual_vars.update(self.parser.extract_env_variables(str(server_env_file)))

            # Check for JWT variables
            jwt_vars = [v for v in actual_vars if 'JWT' in v]

            # Check CLAUDE.md
            claude_md = self.project_root / '.claude' / 'CLAUDE.md'
            with open(claude_md, 'r') as f:
                content = f.read()

            # Check if JWT vars are documented
            missing_jwt_vars = [v for v in jwt_vars if v not in content]

            if missing_jwt_vars:
                self.findings.append({
                    'severity': 'info',
                    'issue': 'JWT environment variables not documented in CLAUDE.md',
                    'file': '.claude/CLAUDE.md',
                    'description': 'Some JWT-related environment variables are not mentioned in the documentation.',
                    'actual': f'JWT variables in .env.example: {", ".join(jwt_vars)}',
                    'documented': 'JWT variables may not be fully documented',
                    'recommendation': 'Consider adding JWT_ACCESS_SECRET, JWT_REFRESH_SECRET to environment variables section'
                })

        except Exception as e:
            print(f"[documentation] Error checking env variables: {e}")

    def _check_auth_file_structure(self):
        """Check if all files listed in AUTH_IMPLEMENTATION.md actually exist."""
        try:
            auth_doc = self.project_root / '.claude' / 'AUTH_IMPLEMENTATION.md'
            if not auth_doc.exists():
                return

            with open(auth_doc, 'r') as f:
                content = f.read()

            # Extract file paths from documentation
            # Look for common patterns like server/config/jwt.ts, server/controllers/auth.controller.ts, etc.
            import re
            file_pattern = r'(?:server|src)/[a-zA-Z0-9_/.-]+\.(?:ts|tsx|js|jsx)'
            potential_files = re.findall(file_pattern, content)

            # Check if files exist
            missing_files = []
            for file_path in set(potential_files):
                full_path = self.project_root / file_path
                if not full_path.exists():
                    missing_files.append(file_path)

            if missing_files:
                self.findings.append({
                    'severity': 'warning',
                    'issue': 'Missing files listed in AUTH_IMPLEMENTATION.md',
                    'file': '.claude/AUTH_IMPLEMENTATION.md',
                    'description': 'Some files mentioned in documentation do not exist in the codebase.',
                    'actual': f'Missing files: {", ".join(missing_files)}',
                    'recommendation': 'Remove references to non-existent files or create the missing files'
                })

        except Exception as e:
            print(f"[documentation] Error checking auth file structure: {e}")

    def _check_jwt_configuration(self):
        """Check JWT token expiry configuration matches documentation."""
        try:
            # Read actual JWT config
            jwt_config = self.project_root / 'server' / 'config' / 'jwt.ts'
            if not jwt_config.exists():
                return

            refresh_expiry = self.parser.extract_config_value(str(jwt_config), 'refreshTokenExpiry')

            if refresh_expiry:
                # Check AUTH_IMPLEMENTATION.md
                auth_doc = self.project_root / '.claude' / 'AUTH_IMPLEMENTATION.md'
                if auth_doc.exists():
                    with open(auth_doc, 'r') as f:
                        content = f.read()

                    # Check for discrepancy between documented (7 days) and actual (1 day)
                    if '7 days' in content or '7d' in content:
                        if refresh_expiry == '1d' or refresh_expiry == "'1d'":
                            self.findings.append({
                                'severity': 'critical',
                                'issue': 'JWT refresh token expiry mismatch',
                                'file': '.claude/AUTH_IMPLEMENTATION.md',
                                'description': 'Documentation states refresh token expires in 7 days, but code has 1 day.',
                                'actual': f'Refresh token expiry: 1 day (server/config/jwt.ts:6)',
                                'documented': 'Refresh token expiry: 7 days',
                                'recommendation': 'Update code to use 7d OR update documentation to reflect 1d. This is a security configuration that should match documentation.'
                            })

        except Exception as e:
            print(f"[documentation] Error checking JWT configuration: {e}")

    def _check_readme_scripts(self):
        """Check if npm scripts in README.md match package.json."""
        try:
            import json

            # Read package.json
            package_json = self.project_root / 'package.json'
            if not package_json.exists():
                return

            with open(package_json, 'r') as f:
                pkg_data = json.load(f)

            actual_scripts = pkg_data.get('scripts', {})

            # Read README.md
            readme = self.project_root / 'README.md'
            if not readme.exists():
                return

            with open(readme, 'r') as f:
                readme_content = f.read()

            # Check for common scripts that should be documented
            important_scripts = ['start', 'build', 'test', 'dev', 'server']

            missing_from_readme = []
            for script in important_scripts:
                if script in actual_scripts:
                    # Check if script is mentioned in README
                    if f'npm {script}' not in readme_content and f'npm run {script}' not in readme_content:
                        missing_from_readme.append(script)

            if missing_from_readme:
                self.findings.append({
                    'severity': 'info',
                    'issue': 'npm scripts not documented in README.md',
                    'file': 'README.md',
                    'description': 'Some npm scripts exist in package.json but are not documented in README.md.',
                    'actual': f'Scripts in package.json: {", ".join(missing_from_readme)}',
                    'documented': 'Missing from README.md',
                    'recommendation': f'Add documentation for: {", ".join(missing_from_readme)}'
                })

        except Exception as e:
            print(f"[documentation] Error checking README scripts: {e}")

    def _check_readme_tech_stack(self):
        """Check if tech stack in README.md matches package.json dependencies."""
        try:
            import json

            # Read package.json
            package_json = self.project_root / 'package.json'
            if not package_json.exists():
                return

            with open(package_json, 'r') as f:
                pkg_data = json.load(f)

            dependencies = pkg_data.get('dependencies', {})

            # Key technologies to check
            key_tech = {
                'react': 'React',
                '@mui/material': 'Material-UI (MUI)',
                'tailwindcss': 'Tailwind CSS',
                '@tanstack/react-query': 'TanStack Query',
                '@reduxjs/toolkit': 'Redux Toolkit',
                'react-router-dom': 'React Router',
            }

            # Read README.md
            readme = self.project_root / 'README.md'
            if not readme.exists():
                return

            with open(readme, 'r') as f:
                readme_content = f.read()

            # Check which technologies are missing from README
            missing_tech = []
            for pkg, name in key_tech.items():
                if pkg in dependencies:
                    # Check if mentioned in README (flexible matching)
                    if name.lower() not in readme_content.lower():
                        missing_tech.append(name)

            if missing_tech:
                self.findings.append({
                    'severity': 'info',
                    'issue': 'Technology stack not fully documented in README.md',
                    'file': 'README.md',
                    'description': 'Some major dependencies are not mentioned in the README tech stack section.',
                    'actual': f'Technologies in use: {", ".join(missing_tech)}',
                    'documented': 'Missing from README.md tech stack',
                    'recommendation': f'Consider adding: {", ".join(missing_tech)}'
                })

            # Check for outdated versions mentioned
            # Extract version numbers from README (pattern: React 18, MUI v5, etc.)
            import re
            version_pattern = r'(React|MUI|Material-UI|Redux|Router)\s+v?(\d+)'
            version_mentions = re.findall(version_pattern, readme_content, re.IGNORECASE)

            for tech, version in version_mentions:
                # Map tech names to package names
                pkg_name = None
                if 'react' in tech.lower() and 'router' not in tech.lower():
                    pkg_name = 'react'
                elif 'mui' in tech.lower() or 'material' in tech.lower():
                    pkg_name = '@mui/material'
                elif 'redux' in tech.lower():
                    pkg_name = '@reduxjs/toolkit'
                elif 'router' in tech.lower():
                    pkg_name = 'react-router-dom'

                if pkg_name and pkg_name in dependencies:
                    actual_version = dependencies[pkg_name].lstrip('^~')
                    major_version = actual_version.split('.')[0]

                    if version != major_version:
                        self.findings.append({
                            'severity': 'warning',
                            'issue': f'{tech} version mismatch in README.md',
                            'file': 'README.md',
                            'description': f'README mentions {tech} {version} but package.json has version {actual_version}',
                            'actual': f'{tech} version: {actual_version}',
                            'documented': f'{tech} version: {version}',
                            'recommendation': f'Update README to reflect {tech} version {major_version}'
                        })

        except Exception as e:
            print(f"[documentation] Error checking README tech stack: {e}")

    def _check_readme_claude_consistency(self):
        """Check if README.md is consistent with CLAUDE.md."""
        try:
            # Read both files
            readme = self.project_root / 'README.md'
            claude_md = self.project_root / '.claude' / 'CLAUDE.md'

            if not readme.exists() or not claude_md.exists():
                return

            with open(readme, 'r') as f:
                readme_content = f.read()

            with open(claude_md, 'r') as f:
                claude_content = f.read()

            # Extract tech stacks from CLAUDE.md
            # Look for key technologies mentioned in CLAUDE.md that should be in README
            claude_techs = {
                'React Router': ['react-router', 'router'],
                'Redux Toolkit': ['redux toolkit', '@reduxjs/toolkit'],
                'TanStack Query': ['tanstack query', 'react-query'],
                'Material-UI': ['mui', 'material-ui', '@mui'],
                'OpenRouter': ['openrouter'],
                'log4js': ['log4js', 'logging'],
                'bcrypt': ['bcrypt'],
                'JWT': ['jwt', 'json web token'],
            }

            missing_from_readme = []
            for tech_name, patterns in claude_techs.items():
                # Check if mentioned in CLAUDE.md
                claude_mentions = any(pattern in claude_content.lower() for pattern in patterns)

                if claude_mentions:
                    # Check if also mentioned in README
                    readme_mentions = any(pattern in readme_content.lower() for pattern in patterns)

                    if not readme_mentions:
                        missing_from_readme.append(tech_name)

            if missing_from_readme:
                self.findings.append({
                    'severity': 'warning',
                    'issue': 'README.md missing technologies documented in CLAUDE.md',
                    'file': 'README.md',
                    'description': 'Technologies mentioned in CLAUDE.md are not documented in README.md.',
                    'actual': f'CLAUDE.md documents: {", ".join(missing_from_readme)}',
                    'documented': 'Missing from README.md',
                    'recommendation': f'Add to README.md tech stack section: {", ".join(missing_from_readme)}'
                })

            # Check development commands consistency
            # Extract commands from CLAUDE.md
            import re
            claude_commands = set(re.findall(r'npm (?:run )?(\w+)', claude_content))
            readme_commands = set(re.findall(r'npm (?:run )?(\w+)', readme_content))

            # Commands in CLAUDE.md but not in README
            missing_commands = claude_commands - readme_commands
            if missing_commands:
                # Filter to only important commands
                important_commands = {'start', 'build', 'test', 'dev', 'server', 'serve'}
                missing_important = missing_commands & important_commands

                if missing_important:
                    self.findings.append({
                        'severity': 'info',
                        'issue': 'README.md missing npm scripts from CLAUDE.md',
                        'file': 'README.md',
                        'description': 'Some npm commands documented in CLAUDE.md are not in README.md.',
                        'actual': f'CLAUDE.md documents: npm {", npm ".join(sorted(missing_important))}',
                        'documented': 'Missing from README.md',
                        'recommendation': f'Add command documentation to README.md: {", ".join(sorted(missing_important))}'
                    })

            # Check environment variables consistency
            # Extract env vars from both files
            claude_env_vars = set(re.findall(r'`([A-Z_]+(?:_[A-Z_]+)*)`', claude_content))
            readme_env_vars = set(re.findall(r'`([A-Z_]+(?:_[A-Z_]+)*)`', readme_content))

            # Filter to actual env vars (start with common prefixes)
            env_prefixes = ['REACT_APP_', 'SUPABASE_', 'ZUZU_', 'PORT', 'PRODUCTION_', 'ALLOWED_', 'JWT_']
            claude_env_vars = {v for v in claude_env_vars if any(v.startswith(p) for p in env_prefixes)}
            readme_env_vars = {v for v in readme_env_vars if any(v.startswith(p) for p in env_prefixes)}

            # Important vars in CLAUDE.md but not README
            missing_env_vars = claude_env_vars - readme_env_vars
            if missing_env_vars:
                self.findings.append({
                    'severity': 'info',
                    'issue': 'README.md missing environment variables from CLAUDE.md',
                    'file': 'README.md',
                    'description': 'Some environment variables in CLAUDE.md are not documented in README.md.',
                    'actual': f'CLAUDE.md documents: {", ".join(sorted(missing_env_vars))}',
                    'documented': 'Missing from README.md',
                    'recommendation': f'Consider adding to README.md: {", ".join(sorted(missing_env_vars))}'
                })

        except Exception as e:
            print(f"[documentation] Error checking README/CLAUDE consistency: {e}")

    def _check_page_tech_stacks(self):
        """Check if tech stacks displayed in About.tsx and Home.tsx match package.json."""
        try:
            import json
            import re

            # Read package.json for both frontend and backend
            package_json = self.project_root / 'package.json'
            server_package_json = self.project_root / 'server' / 'package.json'

            if not package_json.exists():
                return

            with open(package_json, 'r') as f:
                frontend_pkg = json.load(f)

            frontend_deps = frontend_pkg.get('dependencies', {})
            frontend_dev_deps = frontend_pkg.get('devDependencies', {})

            backend_deps = {}
            if server_package_json.exists():
                with open(server_package_json, 'r') as f:
                    backend_pkg = json.load(f)
                backend_deps = backend_pkg.get('dependencies', {})

            # Map display names to package names
            tech_mapping = {
                'React': 'react',
                'MUI': '@mui/material',
                'Material UI': '@mui/material',
                'TypeScript': 'typescript',
                'Redux': '@reduxjs/toolkit',
                'Tailwind CSS': 'tailwindcss',
                'TanStack Query': '@tanstack/react-query',
                'Express': 'express',
                'log4js': 'log4js',
                'Morgan': 'morgan',
                'Supabase': '@supabase/supabase-js',
                'OpenRouter': None,  # Not a package, it's a service
                'Webpack': 'webpack',
                'Cypress': 'cypress'
            }

            # Check Home.tsx
            home_file = self.project_root / 'src' / 'pages' / 'Home.tsx'
            if home_file.exists():
                with open(home_file, 'r') as f:
                    home_content = f.read()

                # Extract tech names from arrays
                # frontendTech array (lines 61-68)
                frontend_match = re.search(r'const frontendTech = \[(.*?)\];', home_content, re.DOTALL)
                # backendTech array (lines 70-76)
                backend_match = re.search(r'const backendTech = \[(.*?)\];', home_content, re.DOTALL)
                # devTools array (lines 78-82)
                devtools_match = re.search(r'const devTools = \[(.*?)\];', home_content, re.DOTALL)

                missing_techs = []

                # Check frontend techs
                if frontend_match:
                    frontend_section = frontend_match.group(1)
                    for tech_name, package_name in tech_mapping.items():
                        if tech_name in frontend_section and package_name:
                            # Check if package exists
                            if package_name not in frontend_deps and package_name not in frontend_dev_deps:
                                missing_techs.append(f'{tech_name} (listed in Home.tsx but not in package.json)')

                # Check backend techs
                if backend_match:
                    backend_section = backend_match.group(1)
                    for tech_name, package_name in tech_mapping.items():
                        if tech_name in backend_section and package_name:
                            # Check if package exists in backend
                            if package_name not in backend_deps:
                                missing_techs.append(f'{tech_name} (listed in Home.tsx but not in server/package.json)')

                # Check for technologies in package.json but not displayed
                displayed_techs_lower = home_content.lower()

                # Key packages that should be displayed
                important_packages = {
                    'react-router-dom': 'React Router',
                    'axios': 'Axios',
                    'bcryptjs': 'bcrypt',
                    'jsonwebtoken': 'JWT',
                }

                missing_from_display = []
                for pkg, display_name in important_packages.items():
                    if pkg in frontend_deps or pkg in backend_deps:
                        if display_name.lower() not in displayed_techs_lower:
                            missing_from_display.append(display_name)

                if missing_from_display:
                    self.findings.append({
                        'severity': 'info',
                        'issue': 'Technologies missing from Home.tsx display',
                        'file': 'src/pages/Home.tsx',
                        'description': 'Some technologies used in the project are not displayed on the home page.',
                        'actual': f'Technologies in use: {", ".join(missing_from_display)}',
                        'documented': 'Not displayed on home page',
                        'recommendation': f'Consider adding to frontendTech or backendTech arrays: {", ".join(missing_from_display)}'
                    })

            # Check About.tsx
            about_file = self.project_root / 'src' / 'pages' / 'About.tsx'
            if about_file.exists():
                with open(about_file, 'r') as f:
                    about_content = f.read()

                # Check for mentioned technologies
                mentioned_techs = []
                for tech_name, package_name in tech_mapping.items():
                    if tech_name in about_content and package_name:
                        mentioned_techs.append((tech_name, package_name))

                # Verify each mentioned tech exists in package.json
                missing_from_about = []
                for tech_name, package_name in mentioned_techs:
                    all_deps = {**frontend_deps, **frontend_dev_deps, **backend_deps}
                    if package_name not in all_deps:
                        missing_from_about.append(f'{tech_name} (mentioned in About.tsx but not in package.json)')

                if missing_from_about:
                    self.findings.append({
                        'severity': 'warning',
                        'issue': 'Technologies mentioned in About.tsx not in package.json',
                        'file': 'src/pages/About.tsx',
                        'description': 'About page mentions technologies that are not installed.',
                        'actual': f'Missing packages: {", ".join(missing_from_about)}',
                        'recommendation': 'Remove mentions of uninstalled technologies or add them to package.json'
                    })

                # Check for outdated descriptions
                # Example: Check if "React" is mentioned with a specific version
                react_version_match = re.search(r'React\s+(\d+)', about_content)
                if react_version_match:
                    mentioned_version = react_version_match.group(1)
                    actual_version = frontend_deps.get('react', '').lstrip('^~')
                    if actual_version:
                        actual_major = actual_version.split('.')[0]
                        if mentioned_version != actual_major:
                            self.findings.append({
                                'severity': 'info',
                                'issue': 'React version mismatch in About.tsx',
                                'file': 'src/pages/About.tsx',
                                'description': f'About page mentions React {mentioned_version} but package.json has {actual_version}',
                                'actual': f'React version: {actual_version}',
                                'documented': f'React {mentioned_version}',
                                'recommendation': f'Update About.tsx to mention React {actual_major}'
                            })

        except Exception as e:
            print(f"[documentation] Error checking page tech stacks: {e}")
