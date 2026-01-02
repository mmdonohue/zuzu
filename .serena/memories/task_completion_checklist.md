# Task Completion Checklist

When a coding task is completed, follow this checklist to ensure quality and consistency:

## 1. Code Quality

### Type Safety
- [ ] All function parameters have explicit types
- [ ] All function return types are explicitly declared
- [ ] No `any` types used (use `unknown`, specific types, or generics instead)
- [ ] Prefer `type` over `interface` for consistency
- [ ] All magic numbers replaced with named constants (UPPER_SNAKE_CASE)

### Code Standards
- [ ] Follow project naming conventions (camelCase for variables/functions, PascalCase for components/types)
- [ ] Imports organized: external libraries → internal (@/) → relative
- [ ] No unnecessary comments added to unchanged code
- [ ] Complex logic has explanatory comments (explain "why", not "what")

## 2. Security Checks

### Authentication & Authorization
- [ ] Protected routes use authentication middleware
- [ ] User permissions checked before sensitive operations
- [ ] JWT tokens properly validated
- [ ] Dev-only endpoints check for localhost hostname

### CSRF Protection
- [ ] State-changing routes (POST, PUT, DELETE, PATCH) use `csrfProtection` middleware
- [ ] Frontend requests use `fetchWithCsrf` for protected endpoints
- [ ] CSRF retry logic implemented where needed (100ms delay pattern)

### Input Validation
- [ ] User input validated on backend
- [ ] Validation middleware applied to routes
- [ ] Error messages don't leak sensitive information
- [ ] No SQL injection vulnerabilities (use parameterized queries)

### Environment Variables
- [ ] No secrets hardcoded in code
- [ ] Required environment variables documented in `.env.example` or `server/.env.example`
- [ ] Sensitive values in `.env` and `server/.env` (not committed to git)

## 3. Testing

### Manual Testing
- [ ] Feature works in development environment
- [ ] Feature works with production build (`npm run build` && `npm run serve`)
- [ ] No console errors in browser
- [ ] No TypeScript compilation errors
- [ ] Test both authenticated and unauthenticated states (if applicable)
- [ ] Test error scenarios (network failure, invalid input, etc.)

### Automated Testing (if applicable)
- [ ] Add Cypress E2E tests for new user flows
- [ ] Run existing tests: `npm test`
- [ ] All tests pass

## 4. Build Verification

### Frontend Build
```bash
npm run build
```
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No webpack errors
- [ ] Bundle size is reasonable

### Backend Build
```bash
npm run build:server
```
- [ ] TypeScript compilation succeeds
- [ ] No type errors in server code
- [ ] `server/dist/` directory created

## 5. Environment-Specific Features

### Local vs Production
- [ ] Local-only features use `isLocalEnvironment()` check
- [ ] Production-only features use `isProductionEnvironment()` check
- [ ] Dev endpoints (e.g., `/dev-login`) check `req.hostname` for localhost
- [ ] No local-only features accidentally exposed in production

## 6. Documentation

### Code Documentation
- [ ] Complex algorithms explained with comments
- [ ] Security patterns documented (CSRF, auth checks, etc.)
- [ ] TODOs added for incomplete work

### Project Documentation
- [ ] Update `.claude/CLAUDE.md` if architecture changes
- [ ] Update `.env.example` or `server/.env.example` if new env vars added
- [ ] Update README.md if user-facing changes made

## 7. Git Workflow

### Pre-Commit
- [ ] Review all changes: `git status` and `git diff`
- [ ] Stage only relevant files: `git add <files>`
- [ ] No debug code or console.logs left in production code (unless intentional)
- [ ] No commented-out code (remove it or uncomment it)
- [ ] `.env` and `server/.env` not staged (should be in `.gitignore`)

### Commit
```bash
git commit -m "Clear, descriptive commit message"
```
- [ ] Commit message describes what and why
- [ ] Commit message is concise but informative

### Post-Commit
- [ ] Run full test suite one more time: `npm test`
- [ ] Push to remote: `git push origin main`

## 8. Deployment Considerations

### Environment Variables
- [ ] Production environment variables set on hosting platform
- [ ] JWT secrets generated fresh for production (not using example values)
- [ ] CSRF secret generated for production
- [ ] SMTP credentials configured if using email features
- [ ] Supabase keys configured
- [ ] OpenRouter API key configured

### CORS Configuration
- [ ] `PRODUCTION_FRONTEND_URL` set in `server/.env` for production
- [ ] CORS origins properly configured for production deployment

### Logging
- [ ] Application logs writing to `logs/` directory
- [ ] Log directory has proper permissions
- [ ] Sensitive data not logged (passwords, tokens, etc.)

## 9. Performance

- [ ] No unnecessary re-renders in React components
- [ ] Large lists use virtualization if needed
- [ ] Images optimized and properly sized
- [ ] API calls use TanStack Query for caching (avoid redundant requests)
- [ ] Bundle size analyzed (use webpack bundle analyzer if needed)

## 10. Accessibility (if UI changes)

- [ ] Semantic HTML elements used
- [ ] Buttons have accessible labels
- [ ] Forms have proper labels
- [ ] Color contrast meets WCAG standards (MUI components handle this)
- [ ] Keyboard navigation works

## Quick Completion Command Sequence

```bash
# 1. Build and test
npm run build
npm test

# 2. Review changes
git status
git diff

# 3. Commit
git add .
git commit -m "Your descriptive message"

# 4. Final verification
npm run dev  # Start servers and manually test

# 5. Push
git push origin main
```

## Common Issues to Check

### TypeScript Errors
- Missing type declarations
- Implicit `any` types
- Mismatched types in function calls
- Missing properties in objects

### Runtime Errors
- CSRF token failures (implement retry logic)
- Authentication failures (check JWT token handling)
- CORS errors (verify allowed origins)
- Environment variable not set (check .env files)

### Security Issues
- Unprotected routes (missing auth middleware)
- Missing CSRF protection on state-changing routes
- Hardcoded secrets
- Input not validated
- SQL injection vulnerabilities
- XSS vulnerabilities

### Performance Issues
- Unnecessary re-renders
- Large bundle sizes
- Unoptimized images
- Missing caching (use TanStack Query)
