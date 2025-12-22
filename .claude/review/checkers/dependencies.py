"""
Dependencies Checker

Reviews package dependencies for:
- Version consistency between package.json and lock files
- Duplicate dependencies
- Unused and missing dependencies
- Security best practices
- Version conflicts between frontend and backend
- Dependency bloat
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Set, Any
import fnmatch


class DependenciesChecker:
    def __init__(self, project_root, config):
        self.project_root = Path(project_root)
        self.config = config
        self.findings = []
        self.gitignore_patterns = self._load_gitignore()
        self.metrics = {
            'total_dependencies': 0,
            'dev_dependencies': 0,
            'duplicate_packages': 0,
            'unused_dependencies': 0,
            'version_conflicts': 0
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
        """Run all dependency checks."""
        try:
            self._check_package_lock_sync()
            self._check_duplicate_dependencies()
            self._check_unused_dependencies()
            self._check_version_conflicts()
            self._check_dependency_bloat()
            self._check_security_best_practices()

            # Determine overall status
            status = 'pass'
            if any(f['severity'] == 'critical' for f in self.findings):
                status = 'critical'
            elif any(f['severity'] == 'warning' for f in self.findings):
                status = 'warning'

            return {
                'category': 'dependencies',
                'status': status,
                'findings': self.findings,
                'metrics': self.metrics
            }
        except Exception as e:
            return {
                'category': 'dependencies',
                'status': 'error',
                'findings': [{
                    'severity': 'critical',
                    'issue': f'Dependencies checker failed: {str(e)}',
                    'description': str(e)
                }],
                'metrics': self.metrics
            }

    def _check_package_lock_sync(self):
        """Check if package.json and package-lock.json are in sync."""
        package_json = self.project_root / 'package.json'
        package_lock = self.project_root / 'package-lock.json'

        if not package_json.exists():
            return

        if not package_lock.exists():
            self.findings.append({
                'severity': 'warning',
                'issue': 'Missing package-lock.json',
                'file': 'package-lock.json',
                'description': 'package-lock.json ensures consistent dependency versions across environments',
                'recommendation': 'Run "npm install" to generate package-lock.json and commit it to version control',
                'category': 'Dependency Management'
            })
            return

        with open(package_json, 'r') as f:
            pkg = json.load(f)

        with open(package_lock, 'r') as f:
            pkg_lock = json.load(f)

        # Check version mismatch
        pkg_version = pkg.get('version', '0.0.0')
        lock_version = pkg_lock.get('version', '0.0.0')

        if pkg_version != lock_version:
            self.findings.append({
                'severity': 'warning',
                'issue': 'Version mismatch between package.json and package-lock.json',
                'file': 'package.json',
                'description': f'package.json version ({pkg_version}) differs from package-lock.json ({lock_version})',
                'recommendation': 'Run "npm install" to sync package-lock.json',
                'category': 'Dependency Management'
            })

        # Check if package-lock.json is gitignored (it shouldn't be)
        gitignore = self.project_root / '.gitignore'
        if gitignore.exists():
            with open(gitignore, 'r') as f:
                gitignore_content = f.read()

            if 'package-lock.json' in gitignore_content:
                self.findings.append({
                    'severity': 'critical',
                    'issue': 'package-lock.json is gitignored',
                    'file': '.gitignore',
                    'description': 'package-lock.json should be committed to ensure reproducible builds',
                    'recommendation': 'Remove package-lock.json from .gitignore',
                    'category': 'Dependency Management'
                })

        # Check server package-lock as well
        server_pkg_json = self.project_root / 'server' / 'package.json'
        server_pkg_lock = self.project_root / 'server' / 'package-lock.json'

        if server_pkg_json.exists() and not server_pkg_lock.exists():
            self.findings.append({
                'severity': 'warning',
                'issue': 'Missing server/package-lock.json',
                'file': 'server/package-lock.json',
                'description': 'Server dependencies should have a package-lock.json',
                'recommendation': 'Run "npm install" in server directory',
                'category': 'Dependency Management'
            })

    def _check_duplicate_dependencies(self):
        """Check for packages listed in both dependencies and devDependencies."""
        for pkg_path in [self.project_root / 'package.json',
                        self.project_root / 'server' / 'package.json']:
            if not pkg_path.exists():
                continue

            with open(pkg_path, 'r') as f:
                pkg = json.load(f)

            deps = set(pkg.get('dependencies', {}).keys())
            dev_deps = set(pkg.get('devDependencies', {}).keys())

            # Update metrics
            self.metrics['total_dependencies'] += len(deps)
            self.metrics['dev_dependencies'] += len(dev_deps)

            duplicates = deps.intersection(dev_deps)

            if duplicates:
                self.metrics['duplicate_packages'] += len(duplicates)
                for dup in duplicates:
                    self.findings.append({
                        'severity': 'warning',
                        'issue': f'Duplicate dependency: {dup}',
                        'file': str(pkg_path.relative_to(self.project_root)),
                        'description': f'Package "{dup}" appears in both dependencies and devDependencies',
                        'recommendation': 'Remove from devDependencies if needed at runtime, or from dependencies if only needed for development',
                        'category': 'Duplicate Dependencies'
                    })

    def _check_unused_dependencies(self):
        """Check for dependencies that appear unused in the codebase."""
        package_json = self.project_root / 'package.json'

        if not package_json.exists():
            return

        with open(package_json, 'r') as f:
            pkg = json.load(f)

        deps = pkg.get('dependencies', {})
        dev_deps = pkg.get('devDependencies', {})

        # Scan source files for imports
        imports_found = self._scan_imports()

        # Check for unused dependencies (excluding commonly implicit ones)
        implicit_deps = {
            'react', 'react-dom', 'typescript', 'webpack', 'webpack-dev-server',
            '@types/react', '@types/react-dom', '@types/node',
            'eslint', 'prettier', 'cypress', 'jest'
        }

        for dep_name in deps.keys():
            # Skip scoped packages' parent scope check
            check_name = dep_name.split('/')[1] if dep_name.startswith('@') else dep_name

            if dep_name not in implicit_deps and dep_name not in imports_found and check_name not in imports_found:
                # Double-check if it's imported with different patterns
                is_used = any(
                    dep_name in imp or check_name in imp
                    for imp in imports_found
                )

                if not is_used:
                    self.metrics['unused_dependencies'] += 1
                    self.findings.append({
                        'severity': 'info',
                        'issue': f'Potentially unused dependency: {dep_name}',
                        'file': 'package.json',
                        'description': f'Package "{dep_name}" is listed in dependencies but no imports were found',
                        'recommendation': 'Verify if this dependency is needed. Remove if unused to reduce bundle size',
                        'category': 'Unused Dependencies'
                    })

    def _scan_imports(self) -> Set[str]:
        """Scan source files to find all imported packages."""
        imports = set()

        # Scan frontend files
        code_files = []
        for ext in ['*.ts', '*.tsx', '*.js', '*.jsx']:
            code_files.extend([f for f in self.project_root.glob(f'src/**/{ext}')
                             if not self._should_ignore_path(f)])
            code_files.extend([f for f in self.project_root.glob(f'server/**/{ext}')
                             if not self._should_ignore_path(f)])

        # Import patterns to match
        import_patterns = [
            r'import\s+.*?\s+from\s+["\']([^"\']+)["\']',  # import ... from 'pkg'
            r'require\s*\(\s*["\']([^"\']+)["\']\s*\)',    # require('pkg')
            r'import\s*\(\s*["\']([^"\']+)["\']\s*\)',     # import('pkg')
        ]

        for code_file in code_files[:100]:  # Limit to avoid performance issues
            try:
                with open(code_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                for pattern in import_patterns:
                    matches = re.findall(pattern, content)
                    for match in matches:
                        # Extract package name (handle scoped packages and subpaths)
                        if match.startswith('@'):
                            # Scoped package: @scope/package
                            parts = match.split('/')
                            if len(parts) >= 2:
                                imports.add(f'{parts[0]}/{parts[1]}')
                        elif match.startswith('.'):
                            # Relative import, skip
                            continue
                        else:
                            # Regular package
                            pkg_name = match.split('/')[0]
                            imports.add(pkg_name)
            except Exception:
                continue

        return imports

    def _check_version_conflicts(self):
        """Check for version conflicts between frontend and backend."""
        frontend_pkg = self.project_root / 'package.json'
        backend_pkg = self.project_root / 'server' / 'package.json'

        if not (frontend_pkg.exists() and backend_pkg.exists()):
            return

        with open(frontend_pkg, 'r') as f:
            frontend = json.load(f)

        with open(backend_pkg, 'r') as f:
            backend = json.load(f)

        frontend_deps = {**frontend.get('dependencies', {}), **frontend.get('devDependencies', {})}
        backend_deps = {**backend.get('dependencies', {}), **backend.get('devDependencies', {})}

        # Find shared packages with different versions
        shared_packages = set(frontend_deps.keys()).intersection(set(backend_deps.keys()))

        for pkg in shared_packages:
            frontend_ver = frontend_deps[pkg]
            backend_ver = backend_deps[pkg]

            if frontend_ver != backend_ver:
                self.metrics['version_conflicts'] += 1
                self.findings.append({
                    'severity': 'warning',
                    'issue': f'Version conflict: {pkg}',
                    'description': f'Frontend uses {pkg}@{frontend_ver} but backend uses {pkg}@{backend_ver}',
                    'recommendation': 'Consider aligning versions for shared packages to avoid compatibility issues',
                    'category': 'Version Conflicts'
                })

    def _check_dependency_bloat(self):
        """Check for excessive number of dependencies."""
        package_json = self.project_root / 'package.json'

        if not package_json.exists():
            return

        with open(package_json, 'r') as f:
            pkg = json.load(f)

        deps_count = len(pkg.get('dependencies', {}))
        dev_deps_count = len(pkg.get('devDependencies', {}))
        total = deps_count + dev_deps_count

        # Thresholds
        max_deps = self.config.get('thresholds', {}).get('max_dependencies', 50)
        max_dev_deps = self.config.get('thresholds', {}).get('max_dev_dependencies', 100)

        if deps_count > max_deps:
            self.findings.append({
                'severity': 'info',
                'issue': f'High number of dependencies ({deps_count})',
                'file': 'package.json',
                'description': f'Project has {deps_count} production dependencies (threshold: {max_deps})',
                'recommendation': 'Review dependencies and remove unused packages. Consider if all are necessary.',
                'category': 'Dependency Bloat'
            })

        if dev_deps_count > max_dev_deps:
            self.findings.append({
                'severity': 'info',
                'issue': f'High number of devDependencies ({dev_deps_count})',
                'file': 'package.json',
                'description': f'Project has {dev_deps_count} development dependencies (threshold: {max_dev_deps})',
                'recommendation': 'Review devDependencies and remove unused development tools',
                'category': 'Dependency Bloat'
            })

    def _check_security_best_practices(self):
        """Check for dependency security best practices."""
        package_json = self.project_root / 'package.json'

        if not package_json.exists():
            return

        with open(package_json, 'r') as f:
            pkg = json.load(f)

        deps = pkg.get('dependencies', {})

        # Check for wildcards or loose version ranges
        loose_versions = []
        for dep_name, version in deps.items():
            # Check for wildcards or very loose ranges
            if version in ['*', 'latest'] or version.startswith('>='):
                loose_versions.append((dep_name, version))

        if loose_versions:
            for dep_name, version in loose_versions[:5]:  # Limit reporting
                self.findings.append({
                    'severity': 'warning',
                    'issue': f'Loose version constraint: {dep_name}@{version}',
                    'file': 'package.json',
                    'description': f'Package "{dep_name}" uses loose version "{version}" which can lead to unexpected updates',
                    'recommendation': 'Use specific version ranges (^x.y.z or ~x.y.z) instead of wildcards',
                    'category': 'Security Best Practices'
                })

        # Check for .npmrc file
        npmrc = self.project_root / '.npmrc'
        if npmrc.exists():
            with open(npmrc, 'r') as f:
                npmrc_content = f.read()

            # Check for save-exact
            if 'save-exact=true' in npmrc_content:
                self.findings.append({
                    'severity': 'info',
                    'issue': 'Exact versions enforced',
                    'file': '.npmrc',
                    'description': 'save-exact=true is configured, ensuring exact version matches',
                    'recommendation': 'Good practice for reproducible builds',
                    'category': 'Security Best Practices'
                })
