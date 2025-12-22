"""
Architecture Checker

Based on Winston (software-architect agent) principles:
- Holistic system design and component interaction
- Scalability focus and growth planning
- Technology selection and stack coherence
- Cross-stack optimization
- Quality attributes (performance, security, maintainability)
- Architecture pattern consistency
"""

import re
import json
from pathlib import Path
from typing import Dict, List, Any
import fnmatch


class ArchitectureChecker:
    def __init__(self, project_root, config):
        self.project_root = Path(project_root)
        self.config = config
        self.findings = []
        self.gitignore_patterns = self._load_gitignore()
        self.metrics = {
            'files_analyzed': 0,
            'architecture_patterns_found': set(),
            'technologies_detected': set(),
            'api_endpoints': 0,
            'config_files': 0
        }

    def _load_gitignore(self) -> List[str]:
        """Load and parse .gitignore patterns."""
        patterns = []
        gitignore_path = self.project_root / '.gitignore'

        if gitignore_path.exists():
            with open(gitignore_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        if line.startswith('/'):
                            line = line[1:]
                        patterns.append(line)

        # Always ignore common build/dependency directories
        patterns.extend([
            'node_modules', 'dist', 'build', '.git',
            '__pycache__', '*.pyc', '.cache', 'coverage'
        ])

        return patterns

    def _should_ignore_path(self, file_path: Path) -> bool:
        """Check if file path matches any gitignore pattern."""
        try:
            rel_path = file_path.relative_to(self.project_root)
            path_str = str(rel_path)

            for pattern in self.gitignore_patterns:
                if pattern.endswith('/'):
                    if path_str.startswith(pattern.rstrip('/')):
                        return True
                elif '*' in pattern:
                    if fnmatch.fnmatch(path_str, pattern):
                        return True
                    for part in rel_path.parts:
                        if fnmatch.fnmatch(part, pattern):
                            return True
                else:
                    if path_str.startswith(pattern + '/') or path_str == pattern:
                        return True
                    if pattern in rel_path.parts:
                        return True

            return False
        except ValueError:
            return True

    def run(self):
        """Run all architecture checks."""
        try:
            self._check_architecture_patterns()
            self._check_technology_coherence()
            self._check_api_design()
            self._check_configuration_management()
            self._check_error_handling_architecture()
            self._check_scalability_patterns()
            self._check_security_architecture()
            self._check_code_organization()
            self._check_documentation()

            # Convert sets to lists for JSON serialization
            self.metrics['architecture_patterns_found'] = list(self.metrics['architecture_patterns_found'])
            self.metrics['technologies_detected'] = list(self.metrics['technologies_detected'])

            # Determine overall status
            status = 'pass'
            if any(f['severity'] == 'critical' for f in self.findings):
                status = 'critical'
            elif any(f['severity'] == 'warning' for f in self.findings):
                status = 'warning'

            return {
                'category': 'architecture',
                'status': status,
                'findings': self.findings,
                'metrics': self.metrics
            }
        except Exception as e:
            return {
                'category': 'architecture',
                'status': 'error',
                'findings': [{
                    'severity': 'critical',
                    'issue': f'Architecture checker failed: {str(e)}',
                    'description': str(e)
                }],
                'metrics': self.metrics
            }

    def _check_architecture_patterns(self):
        """Detect and validate architecture patterns."""
        # Check for monolithic vs microservices indicators
        server_files = list(self.project_root.glob('server/**/*.ts')) + \
                      list(self.project_root.glob('server/**/*.js'))
        server_files = [f for f in server_files if not self._should_ignore_path(f)]

        # Detect if this is a monolithic architecture
        has_single_entry = (self.project_root / 'server' / 'index.ts').exists() or \
                          (self.project_root / 'server' / 'index.js').exists()

        if has_single_entry:
            self.metrics['architecture_patterns_found'].add('monolithic')

            # Check for proper layering in monolithic architecture
            has_routes = any((self.project_root / 'server').glob('**/routes/*.ts')) or \
                        any((self.project_root / 'server').glob('**/routes/*.js'))
            has_controllers = any((self.project_root / 'server').glob('**/controllers/*.ts')) or \
                            any((self.project_root / 'server').glob('**/controllers/*.js'))
            has_services = any((self.project_root / 'server').glob('**/services/*.ts')) or \
                          any((self.project_root / 'server').glob('**/services/*.js'))

            if not (has_routes or has_controllers or has_services):
                self.findings.append({
                    'severity': 'warning',
                    'issue': 'Missing layered architecture structure',
                    'file': 'server/',
                    'description': 'Monolithic architecture should have clear separation of concerns with routes, controllers, and services',
                    'recommendation': 'Organize code into layers: routes (HTTP), controllers (orchestration), services (business logic)',
                    'category': 'Architecture Patterns'
                })

    def _check_technology_coherence(self):
        """Verify technology stack coherence and compatibility."""
        package_json = self.project_root / 'package.json'
        server_package_json = self.project_root / 'server' / 'package.json'

        if package_json.exists():
            with open(package_json, 'r') as f:
                pkg = json.load(f)

            # Detect frontend technologies
            deps = {**pkg.get('dependencies', {}), **pkg.get('devDependencies', {})}

            # Check for React ecosystem
            if 'react' in deps:
                self.metrics['technologies_detected'].add('React')

                # Check for state management
                if 'redux' in deps or '@reduxjs/toolkit' in deps:
                    self.metrics['technologies_detected'].add('Redux')
                if '@tanstack/react-query' in deps:
                    self.metrics['technologies_detected'].add('TanStack Query')

                # Check for routing
                if 'react-router-dom' in deps:
                    self.metrics['technologies_detected'].add('React Router')

                # Check for UI framework
                if '@mui/material' in deps:
                    self.metrics['technologies_detected'].add('Material-UI')
                if 'tailwindcss' in deps:
                    self.metrics['technologies_detected'].add('Tailwind CSS')

                    # Check for potential styling conflicts
                    if '@mui/material' in deps and 'tailwindcss' in deps:
                        self.findings.append({
                            'severity': 'info',
                            'issue': 'Multiple styling systems detected',
                            'file': 'package.json',
                            'description': 'Both Material-UI and Tailwind CSS are in use. Ensure consistent styling approach.',
                            'recommendation': 'Document when to use MUI components vs Tailwind utilities to avoid styling conflicts',
                            'category': 'Technology Stack'
                        })

        if server_package_json.exists():
            with open(server_package_json, 'r') as f:
                server_pkg = json.load(f)

            server_deps = {**server_pkg.get('dependencies', {}), **server_pkg.get('devDependencies', {})}

            # Detect backend technologies
            if 'express' in server_deps:
                self.metrics['technologies_detected'].add('Express')

            if 'log4js' in server_deps:
                self.metrics['technologies_detected'].add('log4js')

    def _check_api_design(self):
        """Validate API design patterns and RESTful conventions."""
        # Find API route files
        route_files = []
        for pattern in ['server/**/routes/**/*.ts', 'server/**/routes/**/*.js',
                       'server/routes/**/*.ts', 'server/routes/**/*.js']:
            route_files.extend([f for f in self.project_root.glob(pattern)
                              if not self._should_ignore_path(f)])

        for route_file in route_files:
            self.metrics['files_analyzed'] += 1

            with open(route_file, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')

            # Check for RESTful HTTP methods
            http_methods = re.findall(r'\.(get|post|put|patch|delete)\s*\(', content, re.IGNORECASE)
            self.metrics['api_endpoints'] += len(http_methods)

            # Check for API versioning
            if '/api/' in content:
                if not re.search(r'/api/v\d+/', content):
                    self.findings.append({
                        'severity': 'info',
                        'issue': 'API versioning not detected',
                        'file': str(route_file.relative_to(self.project_root)),
                        'description': 'Consider implementing API versioning for future compatibility',
                        'recommendation': 'Use versioned routes like /api/v1/ to allow breaking changes without affecting existing clients',
                        'category': 'API Design'
                    })

            # Check for error handling in routes
            for i, line in enumerate(lines, 1):
                if re.search(r'\.(get|post|put|patch|delete)\s*\(', line):
                    # Look ahead for error handling
                    route_block = '\n'.join(lines[i:min(i+20, len(lines))])
                    if 'try' not in route_block and '.catch' not in route_block:
                        self.findings.append({
                            'severity': 'warning',
                            'issue': 'Route handler missing error handling',
                            'file': str(route_file.relative_to(self.project_root)),
                            'line': i,
                            'description': 'API route handlers should include error handling',
                            'recommendation': 'Wrap route logic in try-catch or use .catch() for promises',
                            'category': 'API Design',
                            'code_snippet': line.strip()[:100]
                        })
                        break  # Only report once per file

    def _check_configuration_management(self):
        """Review configuration and environment variable management."""
        # Check for environment variable files
        env_example = self.project_root / '.env.example'
        env_file = self.project_root / '.env'
        server_env_example = self.project_root / 'server' / '.env.example'

        if env_example.exists():
            self.metrics['config_files'] += 1

            # Check if .env is gitignored
            if env_file.exists():
                gitignore = self.project_root / '.gitignore'
                if gitignore.exists():
                    with open(gitignore, 'r') as f:
                        gitignore_content = f.read()

                    if '.env' not in gitignore_content:
                        self.findings.append({
                            'severity': 'critical',
                            'issue': '.env file not in .gitignore',
                            'file': '.env',
                            'description': 'Environment files containing secrets should never be committed to version control',
                            'recommendation': 'Add .env to .gitignore immediately',
                            'category': 'Configuration Management'
                        })

        # Check for hardcoded secrets in code
        code_files = []
        for ext in ['*.ts', '*.tsx', '*.js', '*.jsx']:
            code_files.extend([f for f in self.project_root.glob(f'src/**/{ext}')
                             if not self._should_ignore_path(f)])
            code_files.extend([f for f in self.project_root.glob(f'server/**/{ext}')
                             if not self._should_ignore_path(f)])

        secret_patterns = [
            (r'password\s*=\s*["\'][^"\']{3,}["\']', 'Hardcoded password'),
            (r'api[_-]?key\s*=\s*["\'][^"\']{10,}["\']', 'Hardcoded API key'),
            (r'secret\s*=\s*["\'][^"\']{10,}["\']', 'Hardcoded secret'),
        ]

        for code_file in code_files[:50]:  # Limit to avoid performance issues
            try:
                with open(code_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    lines = content.split('\n')

                for i, line in enumerate(lines, 1):
                    for pattern, issue_name in secret_patterns:
                        if re.search(pattern, line, re.IGNORECASE):
                            # Skip if it's using process.env
                            if 'process.env' not in line and 'import.meta.env' not in line:
                                self.findings.append({
                                    'severity': 'critical',
                                    'issue': issue_name,
                                    'file': str(code_file.relative_to(self.project_root)),
                                    'line': i,
                                    'description': 'Secrets should be stored in environment variables, not hardcoded',
                                    'recommendation': 'Move to environment variable and access via process.env.VARIABLE_NAME',
                                    'category': 'Configuration Management',
                                    'code_snippet': line.strip()[:100]
                                })
            except Exception:
                continue

    def _check_error_handling_architecture(self):
        """Assess global error handling and logging architecture."""
        # Check for global error handler in Express
        server_index = self.project_root / 'server' / 'index.ts'
        if not server_index.exists():
            server_index = self.project_root / 'server' / 'index.js'

        if server_index.exists():
            with open(server_index, 'r', encoding='utf-8') as f:
                content = f.read()

            # Check for error handling middleware
            has_error_handler = re.search(r'app\.use\s*\(\s*\(err,\s*req,\s*res,\s*next\)', content) or \
                              re.search(r'app\.use\s*\(\s*errorHandler', content)

            if not has_error_handler:
                self.findings.append({
                    'severity': 'warning',
                    'issue': 'No global error handler detected',
                    'file': str(server_index.relative_to(self.project_root)),
                    'description': 'Express applications should have a global error handling middleware',
                    'recommendation': 'Add error handling middleware: app.use((err, req, res, next) => { ... })',
                    'category': 'Error Handling'
                })

            # Check for logging setup
            has_logging = 'log4js' in content or 'winston' in content or 'morgan' in content
            if not has_logging:
                self.findings.append({
                    'severity': 'info',
                    'issue': 'Logging framework not detected',
                    'file': str(server_index.relative_to(self.project_root)),
                    'description': 'Production applications should use a structured logging framework',
                    'recommendation': 'Consider adding log4js, winston, or pino for structured logging',
                    'category': 'Error Handling'
                })

    def _check_scalability_patterns(self):
        """Identify scalability and performance patterns."""
        # Check for caching implementation
        code_files = []
        for ext in ['*.ts', '*.tsx', '*.js', '*.jsx']:
            code_files.extend([f for f in self.project_root.glob(f'src/**/{ext}')
                             if not self._should_ignore_path(f)])
            code_files.extend([f for f in self.project_root.glob(f'server/**/{ext}')
                             if not self._should_ignore_path(f)])

        has_caching = False
        has_query_caching = False

        for code_file in code_files[:50]:
            try:
                with open(code_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                if 'redis' in content.lower() or 'memcached' in content.lower():
                    has_caching = True
                    self.metrics['architecture_patterns_found'].add('caching')

                if '@tanstack/react-query' in content or 'useQuery' in content:
                    has_query_caching = True
                    self.metrics['architecture_patterns_found'].add('client-side-caching')
            except Exception:
                continue

        # Check for database connection pooling
        server_files = [f for f in self.project_root.glob('server/**/*.ts')
                       if not self._should_ignore_path(f)]

        for server_file in server_files[:20]:
            try:
                with open(server_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Check for connection pooling patterns
                if 'createPool' in content or 'pool' in content.lower():
                    self.metrics['architecture_patterns_found'].add('connection-pooling')
            except Exception:
                continue

    def _check_security_architecture(self):
        """Review security architecture and patterns."""
        # Check for authentication/authorization
        auth_files = []
        for pattern in ['src/**/auth*.ts*', 'server/**/auth*.ts', 'server/**/middleware/**/*.ts']:
            auth_files.extend([f for f in self.project_root.glob(pattern)
                             if not self._should_ignore_path(f)])

        has_auth = len(auth_files) > 0

        if has_auth:
            self.metrics['architecture_patterns_found'].add('authentication')

            # Check for JWT or session-based auth
            for auth_file in auth_files:
                with open(auth_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                if 'jsonwebtoken' in content or 'jwt' in content.lower():
                    self.metrics['architecture_patterns_found'].add('jwt-auth')

                if 'express-session' in content:
                    self.metrics['architecture_patterns_found'].add('session-auth')

        # Check for CORS configuration
        server_index = self.project_root / 'server' / 'index.ts'
        if not server_index.exists():
            server_index = self.project_root / 'server' / 'index.js'

        if server_index.exists():
            with open(server_index, 'r', encoding='utf-8') as f:
                content = f.read()

            if 'cors' in content:
                self.metrics['architecture_patterns_found'].add('cors')

                # Check if CORS is configured properly
                if 'origin:' not in content and 'credentials:' not in content:
                    self.findings.append({
                        'severity': 'warning',
                        'issue': 'CORS configuration may be too permissive',
                        'file': str(server_index.relative_to(self.project_root)),
                        'description': 'CORS should explicitly specify allowed origins',
                        'recommendation': 'Configure CORS with specific origins and credentials settings',
                        'category': 'Security'
                    })
            else:
                self.findings.append({
                    'severity': 'info',
                    'issue': 'CORS not configured',
                    'file': str(server_index.relative_to(self.project_root)),
                    'description': 'If this API is accessed from browsers, CORS should be configured',
                    'recommendation': 'Add cors middleware if frontend and backend are on different origins',
                    'category': 'Security'
                })

        # Check for input validation
        code_files = []
        for ext in ['*.ts', '*.tsx', '*.js', '*.jsx']:
            code_files.extend([f for f in self.project_root.glob(f'src/**/{ext}')
                             if not self._should_ignore_path(f)])
            code_files.extend([f for f in self.project_root.glob(f'server/**/{ext}')
                             if not self._should_ignore_path(f)])

        has_validation = False
        for code_file in code_files[:30]:
            try:
                with open(code_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                if any(lib in content for lib in ['joi', 'yup', 'zod', 'express-validator']):
                    has_validation = True
                    self.metrics['architecture_patterns_found'].add('input-validation')
                    break
            except Exception:
                continue

        if not has_validation and self.metrics['api_endpoints'] > 0:
            self.findings.append({
                'severity': 'warning',
                'issue': 'Input validation library not detected',
                'description': 'API endpoints should validate input to prevent injection attacks',
                'recommendation': 'Consider adding joi, yup, zod, or express-validator for input validation',
                'category': 'Security'
            })

    def _check_code_organization(self):
        """Evaluate code organization and layer separation."""
        # Check for proper separation of concerns
        src_path = self.project_root / 'src'
        server_path = self.project_root / 'server'

        # Frontend organization
        if src_path.exists():
            has_components = (src_path / 'components').exists()
            has_pages = (src_path / 'pages').exists() or (src_path / 'views').exists()
            has_services = (src_path / 'services').exists() or (src_path / 'api').exists()
            has_utils = (src_path / 'utils').exists() or (src_path / 'helpers').exists()

            if not has_components:
                self.findings.append({
                    'severity': 'info',
                    'issue': 'No components directory found',
                    'file': 'src/',
                    'description': 'React applications typically organize reusable UI in a components directory',
                    'recommendation': 'Consider creating src/components/ for reusable React components',
                    'category': 'Code Organization'
                })

        # Backend organization
        if server_path.exists():
            has_routes = (server_path / 'routes').exists()
            has_controllers = (server_path / 'controllers').exists()
            has_models = (server_path / 'models').exists()

            layers_count = sum([has_routes, has_controllers, has_models])

            if layers_count < 2:
                self.findings.append({
                    'severity': 'warning',
                    'issue': 'Backend lacks clear layered architecture',
                    'file': 'server/',
                    'description': 'Backend should separate concerns into routes, controllers, and models/services',
                    'recommendation': 'Organize backend code into layers: routes (HTTP), controllers (logic), models (data)',
                    'category': 'Code Organization'
                })

    def _check_documentation(self):
        """Check for architectural documentation."""
        # Check for ADR (Architecture Decision Records)
        adr_paths = [
            self.project_root / 'docs' / 'adr',
            self.project_root / 'adr',
            self.project_root / '.adr',
            self.project_root / 'architecture' / 'decisions'
        ]

        has_adr = any(path.exists() for path in adr_paths)

        if not has_adr and self.metrics['api_endpoints'] > 10:
            self.findings.append({
                'severity': 'info',
                'issue': 'No Architecture Decision Records found',
                'description': 'Documenting architectural decisions helps maintain context over time',
                'recommendation': 'Consider creating ADR directory to document key architectural choices',
                'category': 'Documentation'
            })

        # Check for API documentation
        api_doc_files = list(self.project_root.glob('**/api.md')) + \
                       list(self.project_root.glob('**/API.md')) + \
                       list(self.project_root.glob('**/*swagger*.json')) + \
                       list(self.project_root.glob('**/*openapi*.json'))

        if not api_doc_files and self.metrics['api_endpoints'] > 5:
            self.findings.append({
                'severity': 'info',
                'issue': 'API documentation not found',
                'description': 'API endpoints should be documented for developers and consumers',
                'recommendation': 'Consider adding OpenAPI/Swagger documentation or API.md file',
                'category': 'Documentation'
            })

        # Check for architecture diagram or overview
        arch_docs = list(self.project_root.glob('**/ARCHITECTURE.md')) + \
                   list(self.project_root.glob('**/architecture.md'))

        if not arch_docs:
            self.findings.append({
                'severity': 'info',
                'issue': 'Architecture documentation not found',
                'description': 'High-level architecture documentation helps onboard new developers',
                'recommendation': 'Create ARCHITECTURE.md documenting system components and their interactions',
                'category': 'Documentation'
            })
