# .claude Directory

This directory contains Claude Code configuration and automation for the ZuZu project.

## Files in This Directory

### Documentation (Committed to Repo)
- **CLAUDE.md** - Comprehensive project guidance for Claude Code
- **AUTH_IMPLEMENTATION.md** - Complete authentication system documentation

### Review Agent (Committed to Repo)
- **hooks/review-agent.py** - Main codebase review orchestration script
- **review/checkers/** - Review modules (documentation, security, quality, etc.)
- **review/utils/** - Utility modules (file parser, markdown generator, git utils)
- **review/config/review-config.json** - Review agent configuration

### Settings
- **settings.json** - Shared team settings (committed to repo)
- **settings.local.json** - Personal local settings (gitignored)

### Generated Files (Gitignored)
- **CODEBASE_REVIEW.md** - Auto-generated review report
- **plans/** - Temporary planning files

## Codebase Review Agent

The review agent automatically verifies documentation accuracy when Claude Code stops.

### What It Checks

**Documentation Sync** (5 files):
1. `.claude/CLAUDE.md` - Architecture docs match actual code
2. `.claude/AUTH_IMPLEMENTATION.md` - Auth docs match implementation
3. `README.md` - Tech stack and scripts are accurate
4. `src/pages/Home.tsx` - Displayed tech stack matches package.json
5. `src/pages/About.tsx` - Mentioned technologies are installed

## Review Checkers

The review agent includes multiple specialized checkers:

### Documentation Checker
Verifies documentation accuracy across 5 key files:
- `.claude/CLAUDE.md` - Architecture matches code
- `.claude/AUTH_IMPLEMENTATION.md` - Auth implementation is accurate
- `README.md` - Tech stack and scripts are current
- `src/pages/Home.tsx` - Displayed tech stack matches package.json
- `src/pages/About.tsx` - Technologies mentioned are installed

### Security Checker
Scans for security vulnerabilities and configuration issues:
- Secrets exposure (hardcoded API keys, passwords)
- CSRF protection (validates requirements based on auth method)
- SQL injection patterns
- XSS vulnerabilities
- Insecure randomness
- Dependency vulnerabilities
- Missing rate limiting
- Input validation issues

**Configuration**: `.claude/review/config/security.json`
**Suppressions**: `.claude/review/config/suppressions.json`

### Architecture Checker
Validates architectural patterns and consistency:
- Module structure
- Separation of concerns
- Import patterns
- Code organization

### Dependencies Checker
Analyzes dependency health:
- Outdated packages
- Unused dependencies
- Security vulnerabilities via `npm audit`

## Security Documentation

Security implementation is documented in:
- **.claude/SECURITY.md** - Complete security guide (CSRF, auth, best practices)
- **.claude/AUTH_IMPLEMENTATION.md** - Authentication system details
- **.claude/review/config/security.json** - Security checker configuration
- **.claude/review/config/suppressions.json** - False positive suppressions

### Running Security Reviews

```bash
# Security checks only
python3 .claude/hooks/review-agent.py --focus security

# Full review (all checkers)
python3 .claude/hooks/review-agent.py
```

### Security Configuration

Edit `.claude/review/config/security.json` to:
- Define authentication method (affects CSRF requirements)
- Enable/disable specific security checks
- Set severity levels (critical, warning, info)
- Configure check-specific behavior

### Managing False Positives

Use `.claude/review/config/suppressions.json` to suppress:
- Test files with mock credentials
- Public endpoints that don't need CSRF
- Non-cryptographic uses of `Math.random()`
- Accepted security risks (document the reason!)

**Suppression Types**:
1. **Specific** - Exact file and line number
2. **Pattern** - Regex matching multiple files
3. **Inline** - Code comments (`// SECURITY-IGNORE: <reason>`)

### Manual Usage

```bash
# Run documentation review
python3 .claude/hooks/review-agent.py --focus docs

# Run full review (all checkers)
python3 .claude/hooks/review-agent.py

# View help
python3 .claude/hooks/review-agent.py --help
```

### Trigger Review On-Demand

```bash
# Force review on next Stop hook
export CLAUDE_REVIEW=true

# One-time trigger
touch /tmp/.claude-review-trigger
```

### Configuration

Edit `.claude/review/config/review-config.json` to customize:
- Enabled checkers
- Severity thresholds
- Exclusion patterns
- Smart trigger settings

## Team Usage

1. **First Time Setup**:
   - Copy `settings.json` to `settings.local.json`
   - Customize personal preferences in `settings.local.json`
   - Your local settings won't be committed

2. **Running Reviews**:
   - Reviews run automatically when Claude Code stops
   - Check `.claude/CODEBASE_REVIEW.md` for findings
   - Address critical issues before committing

3. **Updating Documentation**:
   - Keep CLAUDE.md and AUTH_IMPLEMENTATION.md up to date
   - Review agent will flag discrepancies
   - Fix findings or update docs to match reality

## Benefits

- **Documentation stays current** - Never outdated docs again
- **Onboarding clarity** - New team members get accurate info
- **Tech stack visibility** - What's displayed matches what's installed
- **Automated enforcement** - Review agent catches drift
