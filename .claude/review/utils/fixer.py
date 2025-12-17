"""
Interactive Fixer

Walks through review findings and offers to automatically fix documentation issues.
"""

import os
import re
from pathlib import Path
from typing import Dict, Any, List


class InteractiveFixer:
    """Interactively fixes documentation findings."""

    def __init__(self, project_root: str, auto_mode: bool = False, fix_all: bool = False):
        """
        Initialize the fixer.

        Args:
            project_root: Root directory of the project
            auto_mode: If True, apply fixes automatically without prompting
            fix_all: If True, fix all severity levels including info
        """
        self.project_root = Path(project_root)
        self.auto_mode = auto_mode
        self.fix_all = fix_all
        self.fixed_count = 0

    def fix_findings(self, findings: List[Dict[str, Any]]) -> int:
        """
        Walk through findings and offer to fix each one.

        Args:
            findings: List of finding dictionaries

        Returns:
            Number of findings fixed
        """
        print("\n" + "=" * 70)
        print("INTERACTIVE FIX MODE")
        print("=" * 70)
        print("\nWalking through findings and offering fixes...\n")

        for i, finding in enumerate(findings, 1):
            # Skip info-level findings unless fix_all is enabled
            if finding.get('severity') == 'info' and not self.fix_all:
                continue

            print(f"\n--- Finding {i}/{len(findings)} ---")
            print(f"Severity: {finding.get('severity', 'unknown').upper()}")
            print(f"Issue: {finding.get('issue', 'Unknown issue')}")
            print(f"File: {finding.get('file', 'Unknown file')}")

            if finding.get('description'):
                print(f"Description: {finding['description']}")

            # Try to fix based on issue type
            if self._can_fix(finding):
                should_fix = self.auto_mode
                if not self.auto_mode:
                    try:
                        response = input("\nAttempt to fix this? [y/N]: ").strip().lower()
                        should_fix = response == 'y'
                    except (EOFError, KeyboardInterrupt):
                        print("\n\nInterrupted. Exiting fix mode.")
                        return self.fixed_count

                if should_fix:
                    if self._apply_fix(finding):
                        self.fixed_count += 1
                        print("✓ Fixed!")
                    else:
                        print("✗ Could not apply fix")
            else:
                if not self.auto_mode:
                    print("(No automatic fix available)")

        return self.fixed_count

    def _can_fix(self, finding: Dict[str, Any]) -> bool:
        """Check if a finding can be automatically fixed."""
        issue = finding.get('issue', '')

        # Fixable issues
        fixable_patterns = [
            'Missing AuthProvider',
            'Incomplete routing documentation',
            'Missing /api/auth',
            'not documented in README',
            'not fully documented',
            'missing from Home.tsx',
            'Technologies mentioned in About.tsx',
            'JWT environment variables not documented',
        ]

        return any(pattern.lower() in issue.lower() for pattern in fixable_patterns)

    def _apply_fix(self, finding: Dict[str, Any]) -> bool:
        """
        Apply a fix for the finding.

        Args:
            finding: Finding dictionary

        Returns:
            True if fix was applied, False otherwise
        """
        issue = finding.get('issue', '')
        file_path = finding.get('file', '')

        try:
            # Fix missing AuthProvider in CLAUDE.md
            if 'Missing AuthProvider' in issue and 'CLAUDE.md' in file_path:
                return self._fix_missing_auth_provider(file_path)

            # Fix incomplete routing documentation
            elif 'Incomplete routing' in issue and 'CLAUDE.md' in file_path:
                return self._fix_incomplete_routing(file_path, finding)

            # Fix missing /api/auth
            elif 'Missing /api/auth' in issue and 'CLAUDE.md' in file_path:
                return self._fix_missing_api_auth(file_path)

            # Fix README tech stack
            elif 'not fully documented in README' in issue:
                return self._fix_readme_tech_stack(file_path, finding)

            # Fix Home.tsx missing technologies
            elif 'missing from Home.tsx' in issue:
                return self._fix_home_tech_stack(file_path, finding)

            # Fix JWT environment variables documentation
            elif 'JWT environment variables not documented' in issue:
                return self._fix_jwt_env_vars(file_path, finding)

            return False

        except Exception as e:
            print(f"Error applying fix: {e}")
            return False

    def _fix_missing_auth_provider(self, file_path: str) -> bool:
        """Add AuthProvider to CLAUDE.md provider hierarchy."""
        full_path = self.project_root / file_path

        with open(full_path, 'r') as f:
            content = f.read()

        # Find the provider hierarchy section (around line 47-52)
        # Add AuthProvider after CssBaseline
        updated = content.replace(
            '  5. CssBaseline (CSS reset)',
            '  5. CssBaseline (CSS reset)\n  6. AuthProvider (authentication context)'
        )

        if updated != content:
            print("\nPreview of change:")
            print("  5. CssBaseline (CSS reset)")
            print("+ 6. AuthProvider (authentication context)")

            if self.auto_mode or input("\nApply this change? [y/N]: ").strip().lower() == 'y':
                with open(full_path, 'w') as f:
                    f.write(updated)
                return True

        return False

    def _fix_incomplete_routing(self, file_path: str, finding: Dict[str, Any]) -> bool:
        """Update routing documentation with all routes."""
        full_path = self.project_root / file_path
        actual = finding.get('actual', '')

        # Extract route list from actual
        # Format: "9 routes: Home, About, Login, ..."
        match = re.search(r'routes: (.+)$', actual)
        if not match:
            return False

        route_list = match.group(1)

        with open(full_path, 'r') as f:
            lines = f.readlines()

        # Find and update line 54 (0-indexed: 53)
        if len(lines) > 53:
            old_line = lines[53]
            # Update the route list
            new_line = re.sub(
                r'with routes for .+$',
                f'with routes for {route_list}\n',
                old_line
            )

            print("\nPreview of change:")
            print(f"- {old_line.rstrip()}")
            print(f"+ {new_line.rstrip()}")

            if self.auto_mode or input("\nApply this change? [y/N]: ").strip().lower() == 'y':
                lines[53] = new_line
                with open(full_path, 'w') as f:
                    f.writelines(lines)
                return True

        return False

    def _fix_missing_api_auth(self, file_path: str) -> bool:
        """Add /api/auth to backend routes documentation."""
        full_path = self.project_root / file_path

        with open(full_path, 'r') as f:
            content = f.read()

        # Find the backend section and add /api/auth
        # Look for the routes mounted line
        pattern = r'(Routes mounted at `/api`, `/api/openrouter`, `/api/logs`)'
        replacement = r'Routes mounted at `/api`, `/api/auth`, `/api/openrouter`, `/api/logs`'

        updated = re.sub(pattern, replacement, content)

        if updated != content:
            print("\nPreview of change:")
            print("- Routes mounted at `/api`, `/api/openrouter`, `/api/logs`")
            print("+ Routes mounted at `/api`, `/api/auth`, `/api/openrouter`, `/api/logs`")

            if self.auto_mode or input("\nApply this change? [y/N]: ").strip().lower() == 'y':
                with open(full_path, 'w') as f:
                    f.write(updated)
                return True

        return False

    def _fix_readme_tech_stack(self, file_path: str, finding: Dict[str, Any]) -> bool:
        """Add missing technologies to README.md tech stack."""
        full_path = self.project_root / file_path
        actual = finding.get('actual', '')

        # Extract missing tech list
        match = re.search(r'Technologies in use: (.+)$', actual)
        if not match:
            return False

        missing_tech = match.group(1).split(', ')

        print(f"\nMissing technologies: {', '.join(missing_tech)}")
        print("\nNote: You'll need to manually add these to the appropriate section in README.md")
        print("(Auto-fix for README tech stack sections not yet implemented)")

        return False

    def _fix_home_tech_stack(self, file_path: str, finding: Dict[str, Any]) -> bool:
        """Add missing technologies to Home.tsx arrays."""
        full_path = self.project_root / file_path
        actual = finding.get('actual', '')

        # Extract missing tech list
        match = re.search(r'Technologies in use: (.+)$', actual)
        if not match:
            return False

        missing_tech = match.group(1).split(', ')

        print(f"\nMissing from Home.tsx: {', '.join(missing_tech)}")

        # Map technologies to appropriate arrays
        frontend_tech = ['React Router', 'Axios']
        backend_tech = ['bcrypt', 'JWT']

        with open(full_path, 'r') as f:
            content = f.read()

        updated = content

        # Add to frontendTech array
        for tech in missing_tech:
            if tech in frontend_tech:
                description = self._get_tech_description(tech)
                addition = f"  {{ name: '{tech}', description: '{description}' }},\n"

                # Find frontendTech array and add before closing bracket
                pattern = r'(const frontendTech = \[[\s\S]*?)(];)'
                updated = re.sub(pattern, r'\1  ' + addition + r'\2', updated, count=1)
                print(f"+ Adding '{tech}' to frontendTech array")

        # Add to backendTech array
        for tech in missing_tech:
            if tech in backend_tech:
                description = self._get_tech_description(tech)
                addition = f"  {{ name: '{tech}', description: '{description}' }},\n"

                # Find backendTech array and add before closing bracket
                pattern = r'(const backendTech = \[[\s\S]*?)(];)'
                updated = re.sub(pattern, r'\1  ' + addition + r'\2', updated, count=1)
                print(f"+ Adding '{tech}' to backendTech array")

        if updated != content:
            if self.auto_mode or input("\nApply these changes? [y/N]: ").strip().lower() == 'y':
                with open(full_path, 'w') as f:
                    f.write(updated)
                return True

        return False

    def _fix_jwt_env_vars(self, file_path: str, finding: Dict[str, Any]) -> bool:
        """Add missing JWT environment variables to CLAUDE.md."""
        full_path = self.project_root / file_path
        actual = finding.get('actual', '')

        # Extract JWT variables from actual
        match = re.search(r'JWT variables in \.env\.example: (.+)$', actual)
        if not match:
            return False

        jwt_vars = match.group(1).split(', ')

        with open(full_path, 'r') as f:
            content = f.read()

        # Find the Backend environment variables section
        # Look for "Backend (`server/.env`):" and add JWT vars
        pattern = r'(\*\*Backend\*\* \(`server/\.env`\):[\s\S]*?- `ALLOWED_ORIGINS`[^\n]*\n)'

        # Build the JWT vars to add
        jwt_additions = '\n'.join([f'- `{var}` - JWT secret for {"access" if "ACCESS" in var else "refresh"} tokens' for var in jwt_vars])

        updated = re.sub(
            pattern,
            r'\1' + jwt_additions + '\n',
            content
        )

        if updated != content:
            print("\nPreview of change:")
            print(f"Adding JWT environment variables to CLAUDE.md:")
            for var in jwt_vars:
                print(f"+ {var}")

            if self.auto_mode or input("\nApply this change? [y/N]: ").strip().lower() == 'y':
                with open(full_path, 'w') as f:
                    f.write(updated)
                return True

        return False

    @staticmethod
    def _get_tech_description(tech_name: str) -> str:
        """Get a description for a technology."""
        descriptions = {
            'React Router': 'Declarative routing for React applications',
            'Axios': 'Promise-based HTTP client for the browser and Node.js',
            'bcrypt': 'Library for hashing and salting passwords',
            'JWT': 'JSON Web Tokens for secure authentication',
        }
        return descriptions.get(tech_name, f'{tech_name} library')
