"""
Security Checker

Reviews code for security vulnerabilities and best practices:
- Authentication and authorization issues
- Input validation and injection vulnerabilities
- Secrets management and exposure
- Network security (HTTPS, CORS, headers)
- Dangerous code patterns
- File security
- CSRF protection
- Cryptographic weaknesses
"""

import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Set, Any
import fnmatch

# Import suppression manager
sys.path.insert(0, str(Path(__file__).parent.parent))
from utils.suppressions import SuppressionManager


class SecurityChecker:
    def __init__(self, project_root, config):
        self.project_root = Path(project_root)
        self.config = config
        self.findings = []
        self.gitignore_patterns = self._load_gitignore()
        self.suppression_manager = SuppressionManager(project_root)
        self.security_config = self._load_security_config()
        self.metrics = {
            'files_scanned': 0,
            'critical_vulnerabilities': 0,
            'potential_vulnerabilities': 0,
            'security_patterns_found': set(),
            'suppressed_findings': 0
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

    def _load_security_config(self) -> Dict[str, Any]:
        """Load security configuration from config file."""
        config_path = self.project_root / '.claude' / 'review' / 'config' / 'security.json'

        # Default configuration
        default_config = {
            'authentication': {'method': 'cookie'},
            'csrfProtection': {'required': True, 'implemented': False},
            'checks': {
                'csrfProtection': {'enabled': True, 'skipIfHeaderAuth': True, 'skipIfSameSiteStrict': True}
            }
        }

        if not config_path.exists():
            return default_config

        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"[WARNING] Failed to load security config: {e}", file=sys.stderr)
            return default_config

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

    def _add_finding(self, finding: Dict[str, Any], code_content: Optional[str] = None):
        """Add a finding after checking if it's suppressed."""
        file_path = finding.get('file', '')
        line = finding.get('line')
        issue = finding.get('issue', '')

        # Check if this finding is suppressed
        is_suppressed, justification = self.suppression_manager.is_suppressed(
            file_path=file_path,
            line=line,
            checker='security',
            issue=issue,
            code_content=code_content
        )

        if is_suppressed:
            self.metrics['suppressed_findings'] += 1
            # Optionally log suppressed findings for audit
            # print(f"[SUPPRESSED] {file_path}:{line} - {issue}: {justification}", file=sys.stderr)
            return

        # Add the finding
        self.findings.append(finding)

        # Update metrics
        severity = finding.get('severity')
        if severity == 'critical':
            self.metrics['critical_vulnerabilities'] += 1
        else:
            self.metrics['potential_vulnerabilities'] += 1

    def run(self):
        """Run all security checks."""
        try:
            self._check_secrets_exposure()
            self._check_injection_vulnerabilities()
            self._check_dangerous_functions()
            self._check_authentication_security()
            self._check_crypto_weaknesses()
            self._check_network_security()
            self._check_file_security()
            self._check_xss_vulnerabilities()
            self._check_csrf_protection()

            # Convert sets to lists for JSON serialization
            self.metrics['security_patterns_found'] = list(self.metrics['security_patterns_found'])

            # Determine overall status
            status = 'pass'
            if any(f['severity'] == 'critical' for f in self.findings):
                status = 'critical'
            elif any(f['severity'] == 'warning' for f in self.findings):
                status = 'warning'

            return {
                'category': 'security',
                'status': status,
                'findings': self.findings,
                'metrics': self.metrics
            }
        except Exception as e:
            return {
                'category': 'security',
                'status': 'error',
                'findings': [{
                    'severity': 'critical',
                    'issue': f'Security checker failed: {str(e)}',
                    'description': str(e)
                }],
                'metrics': self.metrics
            }

    def _check_secrets_exposure(self):
        """Check for exposed secrets, API keys, and credentials."""
        code_files = []
        for ext in ['*.ts', '*.tsx', '*.js', '*.jsx', '*.env*']:
            code_files.extend([f for f in self.project_root.glob(f'**/{ext}')
                             if not self._should_ignore_path(f)])

        # Patterns for detecting secrets
        secret_patterns = [
            (r'(?i)(password|passwd|pwd)\s*[=:]\s*["\'](?!.*process\.env)([^"\']{3,})["\']', 'Hardcoded password', 'critical'),
            (r'(?i)(api[_-]?key|apikey)\s*[=:]\s*["\'](?!.*process\.env)([^"\']{10,})["\']', 'Hardcoded API key', 'critical'),
            (r'(?i)(secret|secret[_-]?key)\s*[=:]\s*["\'](?!.*process\.env)([^"\']{10,})["\']', 'Hardcoded secret', 'critical'),
            (r'(?i)(access[_-]?token|auth[_-]?token)\s*[=:]\s*["\'](?!.*process\.env)([^"\']{10,})["\']', 'Hardcoded auth token', 'critical'),
            (r'(?i)(private[_-]?key)\s*[=:]\s*["\']([^"\']{10,})["\']', 'Hardcoded private key', 'critical'),
            (r'-----BEGIN (?:RSA |DSA )?PRIVATE KEY-----', 'Private key in code', 'critical'),
            (r'(?i)(aws|amazon).{0,20}(secret|access.?key).{0,20}["\']([A-Za-z0-9/+=]{40})["\']', 'AWS credentials', 'critical'),
        ]

        for code_file in code_files[:100]:  # Limit to avoid performance issues
            self.metrics['files_scanned'] += 1

            try:
                with open(code_file, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    lines = content.split('\n')

                for i, line in enumerate(lines, 1):
                    # Skip comments
                    if line.strip().startswith('//') or line.strip().startswith('#'):
                        continue

                    for pattern, issue_name, severity in secret_patterns:
                        if re.search(pattern, line):
                            # Double check it's not using env vars
                            if 'process.env' in line or 'import.meta.env' in line or '.env' in line:
                                continue

                            self._add_finding({
                                'severity': severity,
                                'issue': issue_name,
                                'file': str(code_file.relative_to(self.project_root)),
                                'line': i,
                                'description': f'Potential {issue_name.lower()} detected in source code',
                                'recommendation': 'Move sensitive values to environment variables (.env file) and never commit them',
                                'category': 'Secrets Exposure',
                                'code_snippet': line.strip()[:80]
                            }, code_content=content)
            except Exception:
                continue

    def _check_injection_vulnerabilities(self):
        """Check for SQL injection, command injection, and NoSQL injection."""
        code_files = []
        for ext in ['*.ts', '*.tsx', '*.js', '*.jsx']:
            code_files.extend([f for f in self.project_root.glob(f'server/**/{ext}')
                             if not self._should_ignore_path(f)])

        injection_patterns = [
            # SQL Injection
            (r'query\s*\([^)]*\$\{|query\s*\([^)]*\+\s*\w+', 'Potential SQL injection', 'critical'),
            (r'\.query\s*\(\s*["\'].*?\$\{', 'SQL injection via template literal', 'critical'),
            (r'execute\s*\([^)]*\+\s*', 'Potential SQL injection in execute', 'critical'),

            # Command Injection
            (r'exec\s*\(\s*["\'].*?\$\{|exec\s*\([^)]*\+\s*', 'Command injection risk', 'critical'),
            (r'spawn\s*\(\s*["\'].*?\$\{|spawn\s*\([^)]*\+\s*', 'Command injection in spawn', 'critical'),
            (r'child_process\.(exec|spawn)\s*\([^)]*\$\{', 'Command injection risk', 'critical'),

            # NoSQL Injection
            (r'find\s*\(\s*\{[^}]*\$\{|find\s*\(\s*req\.(query|body|params)', 'Potential NoSQL injection', 'warning'),
            (r'findOne\s*\(\s*req\.(query|body|params)', 'Potential NoSQL injection in findOne', 'warning'),
        ]

        for code_file in code_files[:50]:
            try:
                with open(code_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    lines = content.split('\n')

                for i, line in enumerate(lines, 1):
                    for pattern, issue_name, severity in injection_patterns:
                        if re.search(pattern, line):
                            if severity == 'critical':
                                self.metrics['critical_vulnerabilities'] += 1
                            else:
                                self.metrics['potential_vulnerabilities'] += 1

                            self.findings.append({
                                'severity': severity,
                                'issue': issue_name,
                                'file': str(code_file.relative_to(self.project_root)),
                                'line': i,
                                'description': f'{issue_name} - user input may be concatenated into query',
                                'recommendation': 'Use parameterized queries or prepared statements. Never concatenate user input into queries.',
                                'category': 'Injection Vulnerabilities',
                                'code_snippet': line.strip()[:100]
                            })
            except Exception:
                continue

    def _check_dangerous_functions(self):
        """Check for usage of dangerous functions."""
        code_files = []
        for ext in ['*.ts', '*.tsx', '*.js', '*.jsx']:
            code_files.extend([f for f in self.project_root.glob(f'**/{ext}')
                             if not self._should_ignore_path(f)])

        dangerous_patterns = [
            (r'\beval\s*\(', 'Use of eval()', 'critical', 'eval() executes arbitrary code and is a major security risk'),
            (r'new\s+Function\s*\(', 'Use of Function constructor', 'warning', 'Function constructor can execute arbitrary code'),
            (r'dangerouslySetInnerHTML', 'Use of dangerouslySetInnerHTML', 'warning', 'Can lead to XSS if not properly sanitized'),
            (r'innerHTML\s*=', 'Direct innerHTML assignment', 'warning', 'Can lead to XSS vulnerabilities'),
            (r'document\.write\s*\(', 'Use of document.write()', 'warning', 'Can introduce XSS vulnerabilities'),
            (r'setTimeout\s*\(\s*["\']', 'setTimeout with string', 'warning', 'String argument to setTimeout is eval-like'),
            (r'setInterval\s*\(\s*["\']', 'setInterval with string', 'warning', 'String argument to setInterval is eval-like'),
        ]

        for code_file in code_files[:50]:
            try:
                with open(code_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    lines = content.split('\n')

                for i, line in enumerate(lines, 1):
                    # Skip comments
                    if line.strip().startswith('//') or line.strip().startswith('*'):
                        continue

                    for pattern, issue_name, severity, description in dangerous_patterns:
                        if re.search(pattern, line):
                            if severity == 'critical':
                                self.metrics['critical_vulnerabilities'] += 1
                            else:
                                self.metrics['potential_vulnerabilities'] += 1

                            self.findings.append({
                                'severity': severity,
                                'issue': issue_name,
                                'file': str(code_file.relative_to(self.project_root)),
                                'line': i,
                                'description': description,
                                'recommendation': 'Avoid dangerous functions. Use safer alternatives.',
                                'category': 'Dangerous Functions',
                                'code_snippet': line.strip()[:100]
                            })
                            break  # Only report once per line
            except Exception:
                continue

    def _check_authentication_security(self):
        """Check authentication and authorization security."""
        # Check for JWT implementation
        auth_files = []
        for pattern in ['**/auth*.ts', '**/auth*.js', '**/middleware/**/*.ts', '**/middleware/**/*.js']:
            auth_files.extend([f for f in self.project_root.glob(pattern)
                             if not self._should_ignore_path(f)])

        for auth_file in auth_files:
            try:
                with open(auth_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    lines = content.split('\n')

                # Check for JWT issues
                if 'jsonwebtoken' in content or 'jwt.sign' in content:
                    self.metrics['security_patterns_found'].add('jwt-authentication')

                    # Check for weak JWT secrets
                    for i, line in enumerate(lines, 1):
                        if re.search(r'jwt\.sign.*secret\s*:\s*["\'](\w{1,15})["\']', line, re.IGNORECASE):
                            self.metrics['critical_vulnerabilities'] += 1
                            self.findings.append({
                                'severity': 'critical',
                                'issue': 'Weak JWT secret',
                                'file': str(auth_file.relative_to(self.project_root)),
                                'line': i,
                                'description': 'JWT secret appears to be short and weak',
                                'recommendation': 'Use a strong, random secret (at least 256 bits). Store in environment variables.',
                                'category': 'Authentication Security'
                            })

                        # Check for missing expiration
                        if 'jwt.sign(' in line and 'expiresIn' not in content:
                            self.metrics['potential_vulnerabilities'] += 1
                            self.findings.append({
                                'severity': 'warning',
                                'issue': 'JWT without expiration',
                                'file': str(auth_file.relative_to(self.project_root)),
                                'line': i,
                                'description': 'JWT tokens should have an expiration time',
                                'recommendation': 'Add expiresIn option to jwt.sign() to prevent token reuse',
                                'category': 'Authentication Security'
                            })
                            break

                # Check for password hashing
                if 'password' in content.lower():
                    has_bcrypt = 'bcrypt' in content or 'argon2' in content or 'scrypt' in content
                    has_plain_comparison = re.search(r'password\s*===?\s*\w+|password\s*==\s*req\.body', content)

                    if has_plain_comparison and not has_bcrypt:
                        self.metrics['critical_vulnerabilities'] += 1
                        self.findings.append({
                            'severity': 'critical',
                            'issue': 'Plain text password comparison',
                            'file': str(auth_file.relative_to(self.project_root)),
                            'description': 'Passwords appear to be compared in plain text',
                            'recommendation': 'Use bcrypt, argon2, or scrypt to hash passwords. Never store or compare plain text passwords.',
                            'category': 'Authentication Security'
                        })

            except Exception:
                continue

    def _is_comment_line(self, line: str) -> bool:
        """Check if a line is a comment (single-line or inside multi-line comment)."""
        stripped = line.strip()
        # Check for single-line comments
        if stripped.startswith('//') or stripped.startswith('#'):
            return True
        # Check for lines that are only part of multi-line comments
        if stripped.startswith('*') and not stripped.endswith('*/'):
            return True
        # Check for complete multi-line comment on single line
        if stripped.startswith('/*') and stripped.endswith('*/'):
            return True
        return False

    def _check_crypto_weaknesses(self):
        """Check for cryptographic weaknesses."""
        code_files = []
        for ext in ['*.ts', '*.tsx', '*.js', '*.jsx']:
            code_files.extend([f for f in self.project_root.glob(f'server/**/{ext}')
                             if not self._should_ignore_path(f)])

        crypto_patterns = [
            (r'createHash\s*\(\s*["\']md5["\']', 'Use of MD5', 'warning', 'MD5 is cryptographically broken'),
            (r'createHash\s*\(\s*["\']sha1["\']', 'Use of SHA1', 'warning', 'SHA1 is deprecated for security use'),
            (r'Math\.random\s*\(\s*\)', 'Use of Math.random() for security', 'warning', 'Math.random() is not cryptographically secure'),
            (r'crypto\.randomBytes\s*\(\s*[0-9]{1,2}\s*\)', 'Insufficient randomness', 'warning', 'Random bytes count may be too low for security'),
        ]

        for code_file in code_files[:30]:
            try:
                with open(code_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    lines = content.split('\n')

                in_multiline_comment = False
                for i, line in enumerate(lines, 1):
                    stripped = line.strip()

                    # Track multi-line comment state
                    if '/*' in stripped and '*/' not in stripped:
                        in_multiline_comment = True
                    elif '*/' in stripped:
                        in_multiline_comment = False
                        continue  # Skip the closing line

                    # Skip comment lines
                    if in_multiline_comment or self._is_comment_line(line):
                        continue

                    for pattern, issue_name, severity, description in crypto_patterns:
                        if re.search(pattern, line):
                            finding = {
                                'severity': severity,
                                'issue': issue_name,
                                'file': str(code_file.relative_to(self.project_root)),
                                'line': i,
                                'description': description,
                                'recommendation': 'Use SHA-256 or better for hashing. Use crypto.randomBytes() for random values.',
                                'category': 'Cryptographic Weaknesses',
                                'code_snippet': line.strip()[:100]
                            }
                            # Use _add_finding to respect suppressions
                            self._add_finding(finding, content)
            except Exception:
                continue

    def _check_network_security(self):
        """Check network security configuration."""
        server_index = self.project_root / 'server' / 'index.ts'
        if not server_index.exists():
            server_index = self.project_root / 'server' / 'index.js'

        if not server_index.exists():
            return

        with open(server_index, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check for security headers
        security_headers = {
            'helmet': 'Helmet.js security headers',
            'X-Content-Type-Options': 'X-Content-Type-Options header',
            'X-Frame-Options': 'X-Frame-Options header',
            'Strict-Transport-Security': 'HSTS header',
            'Content-Security-Policy': 'CSP header'
        }

        has_helmet = 'helmet' in content
        if has_helmet:
            self.metrics['security_patterns_found'].add('security-headers')
        else:
            missing_headers = []
            for header, desc in security_headers.items():
                if header not in content:
                    missing_headers.append(desc)

            if missing_headers:
                self.metrics['potential_vulnerabilities'] += 1
                self.findings.append({
                    'severity': 'warning',
                    'issue': 'Missing security headers',
                    'file': str(server_index.relative_to(self.project_root)),
                    'description': 'Security headers protect against common web vulnerabilities',
                    'recommendation': 'Install and use helmet.js: npm install helmet, then app.use(helmet())',
                    'category': 'Network Security'
                })

        # Check for HTTPS enforcement
        if 'app.use(' in content and 'https' not in content.lower():
            self.metrics['potential_vulnerabilities'] += 1
            self.findings.append({
                'severity': 'info',
                'issue': 'HTTPS enforcement not detected',
                'file': str(server_index.relative_to(self.project_root)),
                'description': 'No HTTPS enforcement found in server configuration',
                'recommendation': 'Consider enforcing HTTPS in production with middleware or reverse proxy',
                'category': 'Network Security'
            })

    def _check_file_security(self):
        """Check for file security issues."""
        code_files = []
        for ext in ['*.ts', '*.tsx', '*.js', '*.jsx']:
            code_files.extend([f for f in self.project_root.glob(f'server/**/{ext}')
                             if not self._should_ignore_path(f)])

        file_patterns = [
            (r'fs\.readFile.*req\.(query|body|params)', 'Path traversal risk in readFile', 'critical'),
            (r'fs\.writeFile.*req\.(query|body|params)', 'Path traversal risk in writeFile', 'critical'),
            (r'require\s*\(.*req\.(query|body|params)', 'Arbitrary file require', 'critical'),
            (r'import\s*\(.*req\.(query|body|params)', 'Arbitrary file import', 'critical'),
            (r'__dirname.*\+.*req\.(query|body|params)', 'Path traversal via concatenation', 'critical'),
        ]

        for code_file in code_files[:30]:
            try:
                with open(code_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    lines = content.split('\n')

                for i, line in enumerate(lines, 1):
                    for pattern, issue_name, severity in file_patterns:
                        if re.search(pattern, line):
                            self.metrics['critical_vulnerabilities'] += 1
                            self.findings.append({
                                'severity': severity,
                                'issue': issue_name,
                                'file': str(code_file.relative_to(self.project_root)),
                                'line': i,
                                'description': 'User input used in file operations can lead to path traversal attacks',
                                'recommendation': 'Validate and sanitize file paths. Use path.join() and check for ".." sequences.',
                                'category': 'File Security',
                                'code_snippet': line.strip()[:100]
                            })
            except Exception:
                continue

    def _check_xss_vulnerabilities(self):
        """Check for Cross-Site Scripting (XSS) vulnerabilities."""
        code_files = []
        for ext in ['*.tsx', '*.jsx']:
            code_files.extend([f for f in self.project_root.glob(f'src/**/{ext}')
                             if not self._should_ignore_path(f)])

        for code_file in code_files[:30]:
            try:
                with open(code_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    lines = content.split('\n')

                for i, line in enumerate(lines, 1):
                    # Check for dangerouslySetInnerHTML with unsanitized content
                    if 'dangerouslySetInnerHTML' in line:
                        if 'DOMPurify' not in content and 'sanitize' not in content:
                            self.metrics['potential_vulnerabilities'] += 1
                            self.findings.append({
                                'severity': 'warning',
                                'issue': 'Unsanitized HTML content',
                                'file': str(code_file.relative_to(self.project_root)),
                                'line': i,
                                'description': 'dangerouslySetInnerHTML without sanitization can lead to XSS',
                                'recommendation': 'Use DOMPurify or similar library to sanitize HTML before rendering',
                                'category': 'XSS Vulnerabilities',
                                'code_snippet': line.strip()[:100]
                            })
            except Exception:
                continue

    def _check_csrf_protection(self):
        """Check for CSRF protection (respects security config)."""
        # Check if CSRF check is enabled
        csrf_check_config = self.security_config.get('checks', {}).get('csrfProtection', {})
        if not csrf_check_config.get('enabled', True):
            return

        # Skip if using header-based authentication (no cookies)
        auth_method = self.security_config.get('authentication', {}).get('method', 'cookie')
        if auth_method == 'header' and csrf_check_config.get('skipIfHeaderAuth', True):
            return

        # Skip if SameSite strict/lax is configured
        cookie_config = self.security_config.get('authentication', {}).get('cookieConfig', {})
        same_site = cookie_config.get('sameSite', 'none')
        if same_site in ['strict', 'lax'] and csrf_check_config.get('skipIfSameSiteStrict', True):
            self.metrics['security_patterns_found'].add('csrf-protection-samesite')
            return

        # Check if CSRF protection is marked as implemented in config
        csrf_protection_config = self.security_config.get('csrfProtection', {})
        if csrf_protection_config.get('implemented', False):
            self.metrics['security_patterns_found'].add('csrf-protection')
            return

        # Scan for CSRF protection implementations
        server_files = []
        for ext in ['*.ts', '*.js']:
            server_files.extend([f for f in self.project_root.glob(f'server/**/{ext}')
                               if not self._should_ignore_path(f)])

        has_csrf_protection = False

        for server_file in server_files:
            try:
                with open(server_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                if 'csurf' in content or 'csrf' in content.lower():
                    has_csrf_protection = True
                    self.metrics['security_patterns_found'].add('csrf-protection')
                    break
            except Exception:
                continue

        # Check for state-changing endpoints without CSRF protection
        if not has_csrf_protection:
            route_files = []
            for pattern in ['server/**/routes/**/*.ts', 'server/**/routes/**/*.js']:
                route_files.extend([f for f in self.project_root.glob(pattern)
                                  if not self._should_ignore_path(f)])

            has_post_routes = False
            for route_file in route_files:
                try:
                    with open(route_file, 'r', encoding='utf-8') as f:
                        content = f.read()

                    if re.search(r'\.(post|put|patch|delete)\s*\(', content):
                        has_post_routes = True
                        break
                except Exception:
                    continue

            if has_post_routes:
                # Use configured severity or default to warning
                severity = csrf_check_config.get('severity', 'warning')

                finding = {
                    'severity': severity,
                    'issue': 'No CSRF protection detected',
                    'description': f'Application has state-changing endpoints but no CSRF protection. Auth method: {auth_method}, SameSite: {same_site}',
                    'recommendation': 'Implement CSRF protection using csurf middleware or change SameSite cookie attribute to "lax" or "strict"',
                    'category': 'CSRF Protection'
                }

                # Use _add_finding to respect suppressions
                self._add_finding(finding)
