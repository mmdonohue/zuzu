# Security Documentation

This document provides comprehensive security guidance for the ZuZu application, covering authentication, CSRF protection, security configuration, and best practices.

## Table of Contents

1. [Security Features](#security-features)
2. [CSRF Protection](#csrf-protection)
3. [Authentication Security](#authentication-security)
4. [Security Configuration](#security-configuration)
5. [Suppression System](#suppression-system)
6. [Security Headers](#security-headers)
7. [Best Practices](#best-practices)
8. [Security Review System](#security-review-system)
9. [Additional Resources](#additional-resources)

---

## Security Features

### Overview

ZuZu implements multiple layers of security to protect against common web vulnerabilities:

- **CSRF Protection**: Double Submit Cookie pattern using `csrf-csrf` library
- **Cookie-Based Authentication**: httpOnly, secure cookies for JWT storage
- **Security Review System**: Automated code scanning for security issues
- **Configurable Security Checks**: Customize security validation for your architecture
- **Suppression Management**: Handle false positives without disabling checks

---

## CSRF Protection

### Why CSRF Protection is Needed

Our application uses **cookie-based authentication** with the following configuration:

```javascript
{
  httpOnly: true,
  sameSite: 'none',  // Required for cross-origin support in production
  secure: true       // HTTPS only in production
}
```

**The Problem**: When `sameSite` is set to `'none'`, cookies are sent with cross-origin requests, making the application vulnerable to CSRF attacks. An attacker could trick a logged-in user into submitting a malicious request.

**The Solution**: We implement the **Double Submit Cookie pattern**:
1. Server generates a CSRF token and sends it in both:
   - A cookie (automatically sent by browser)
   - Response body (client must manually include in requests)
2. Client stores the token and includes it in request headers
3. Server validates that the header token matches the cookie token

This works because while an attacker can trigger a cross-origin request (which includes cookies), they cannot read the token from the response body due to Same-Origin Policy.

### Implementation

#### Backend Setup

The CSRF middleware is configured in `server/middleware/csrf.middleware.ts`:

```typescript
import { generateCsrfMiddleware, csrfProtection, csrfErrorHandler } from './middleware/csrf.middleware';

// 1. Add CSRF token generation endpoint
app.get('/api/csrf-token', generateCsrfMiddleware, (req, res) => {
  res.json({ csrfToken: res.locals.csrfToken });
});

// 2. Protect routes that modify data
app.post('/api/protected-route', csrfProtection, (req, res) => {
  // Your route handler
});

// 3. Add error handler for better error messages
app.use(csrfErrorHandler);
```

**Key Configuration**:
- **CSRF_SECRET** (required): Secret key for token generation
  ```bash
  # Generate a strong secret
  openssl rand -base64 48
  ```
- **Cookie Name**: `x-csrf-token`
- **Protected Methods**: POST, PUT, DELETE, PATCH (GET, HEAD, OPTIONS are safe)
- **Token Size**: 64 bytes

#### Frontend Usage

The CSRF service is in `src/services/csrf.service.ts`:

```typescript
import { csrfService } from '@/services/csrf.service';

// Example: Protected API call
async function createResource(data) {
  const token = await csrfService.getToken();

  const response = await fetch('/api/resources', {
    method: 'POST',
    credentials: 'include',  // Important: include cookies
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': token   // Include CSRF token
    },
    body: JSON.stringify(data)
  });

  return response.json();
}

// Clear token on logout
csrfService.clearToken();
```

**Helper Method**: Use `fetchWithCsrf` from `api.ts` for automatic token handling:

```typescript
import { fetchWithCsrf } from '@/services/api';

// Automatically includes CSRF token
const response = await fetchWithCsrf('/api/resources', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

#### Error Handling

If CSRF validation fails:
- **Status Code**: 403 Forbidden
- **Error Response**:
  ```json
  {
    "success": false,
    "message": "Invalid CSRF token. Please refresh the page and try again.",
    "code": "CSRF_VALIDATION_FAILED"
  }
  ```

**Recovery**: The frontend automatically refreshes the token and retries.

---

## Authentication Security

### Cookie-Based JWT Authentication

**Access Token**:
- Stored in httpOnly cookie (not accessible to JavaScript)
- Short-lived (15 minutes default)
- Automatically included in requests via `credentials: 'include'`

**Refresh Token**:
- Stored in separate httpOnly cookie
- Longer-lived (7 days default)
- Used to obtain new access tokens without re-login

**Cookie Configuration** (production):
```javascript
{
  httpOnly: true,      // Prevents XSS attacks
  secure: true,        // HTTPS only
  sameSite: 'none',    // Cross-origin support (requires CSRF protection)
  path: '/',           // Available to all routes
  maxAge: 900000       // 15 minutes for access token
}
```

### Password Security

**Hashing**: All passwords are hashed using bcrypt:

```typescript
import bcrypt from 'bcryptjs';

// Hash password with salt rounds = 12
const hashedPassword = await bcrypt.hash(password, 12);

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword);
```

**Best Practices**:
- Never log passwords
- Never send passwords in GET requests
- Always use HTTPS in production
- Implement password complexity requirements
- Consider rate limiting on auth endpoints

---

## Security Configuration

### Configuration File

Security checks are configured in `.claude/review/config/security.json`:

```json
{
  "authentication": {
    "method": "cookie",
    "cookieConfig": {
      "httpOnly": true,
      "sameSite": "none",
      "secure": true
    }
  },

  "csrfProtection": {
    "required": true,
    "implemented": true,
    "method": "csrf-csrf"
  },

  "checks": {
    "csrfProtection": {
      "enabled": true,
      "severity": "warning",
      "skipIfHeaderAuth": true,
      "skipIfSameSiteStrict": true
    }
  }
}
```

### Configuration Options

#### Authentication Method
- `"cookie"`: Session/JWT stored in cookies (requires CSRF protection if sameSite: none)
- `"header"`: Bearer tokens in Authorization header (CSRF protection not needed)
- `"both"`: Support both methods

#### CSRF Protection
- `required`: Whether CSRF protection is needed
- `implemented`: Whether it's currently implemented
- `method`: Implementation method (`"csrf-csrf"`, `"sameSite"`, `"custom"`)

#### CSRF Check Behavior

The CSRF check is **automatically skipped** when:
1. **Header-based authentication** is used (`"method": "header"`)
2. **SameSite strict/lax** cookies are used (no cross-origin risk)
3. **Suppressed** via suppression system

This prevents false positives for architectures that don't need CSRF protection.

---

## Suppression System

The suppression system allows you to manage false positives without disabling security checks entirely.

### Suppression Types

#### 1. Inline Suppressions (Code Comments)

Suppress findings directly in code:

```typescript
// SECURITY-IGNORE: Public endpoint, no auth required
app.get('/api/public/data', (req, res) => {
  // ...
});

// SECURITY-IGNORE: Test mock data, not real credentials
const mockApiKey = 'test-key-123';
```

**Supported Markers**:
- `SECURITY-IGNORE: <reason>`
- `SEC-IGNORE: <reason>`
- `NOSEC: <reason>`
- `security:ignore <reason>`

**Best Practice**: Always include a reason with inline suppressions for future maintainability.

#### 2. Global Suppressions (File)

Location: `.claude/review/config/suppressions.json`

```json
{
  "suppressions": [
    {
      "id": "unique-identifier",
      "file": "server/services/auth.service.ts",
      "line": 23,
      "checker": "security",
      "pattern": "Math.random()",
      "justification": "Used for 6-digit auth codes, not cryptographic keys",
      "added_by": "developer",
      "added_date": "2025-12-21",
      "expires": null,
      "reviewed": false
    }
  ],
  "patterns": [
    {
      "id": "test-secrets",
      "pattern": "password.*test",
      "paths": ["**/*test.ts", "**/*spec.ts"],
      "checker": "security",
      "justification": "Test files use mock passwords for testing purposes"
    }
  ]
}
```

---

## Security Headers

### Helmet Configuration

Helmet is configured for security headers:

```typescript
import helmet from 'helmet';

app.use(helmet());
```

**Key Headers**:
- `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
- `X-Frame-Options: DENY` - Prevent clickjacking
- `Strict-Transport-Security` - Force HTTPS

---

## Best Practices

### Development Checklist

- [ ] **Environment Variables**: All secrets in `.env` files (never committed)
- [ ] **CSRF Protection**: All state-changing endpoints protected
- [ ] **Cookie Security**: httpOnly, secure, appropriate sameSite
- [ ] **Password Handling**: Hashed with bcrypt, never logged
- [ ] **Input Validation**: All user input validated and sanitized
- [ ] **HTTPS**: Enforced in production
- [ ] **Dependencies**: Regular `npm audit` checks
- [ ] **Rate Limiting**: Implemented on auth endpoints

### Production Deployment Checklist

Before deploying to production:

- [ ] `NODE_ENV=production` set
- [ ] `CSRF_SECRET` generated and configured (strong random value)
- [ ] `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` configured (unique, strong)
- [ ] HTTPS enforced (redirect HTTP to HTTPS)
- [ ] Security headers configured (Helmet)
- [ ] Rate limiting enabled on authentication endpoints
- [ ] Dependency audit passed (`npm audit --production`)
- [ ] Security review run and all critical findings addressed
- [ ] CORS configured with specific allowed origins (not `*`)

---

## Security Review System

### Running Security Reviews

```bash
# Run security checks only
python3 .claude/hooks/review-agent.py --focus security

# Run full review (includes security, docs, architecture, etc.)
python3 .claude/hooks/review-agent.py
```

### Interpreting Results

Security findings are categorized by severity:

**Critical**: Immediate action required
- Hardcoded secrets
- SQL injection vulnerabilities
- Known vulnerable dependencies

**Warning**: Should be addressed
- Missing CSRF protection
- Weak randomness in security contexts
- Missing rate limiting

**Info**: Recommendations
- Missing security headers
- HTTPS not enforced in production

---

## Additional Resources

### OWASP Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

### Libraries Used
- [csrf-csrf](https://github.com/Psifi-Solutions/csrf-csrf) - CSRF protection
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) - Password hashing
- [helmet](https://helmetjs.github.io/) - Security headers

---

**Last Updated**: 2025-12-21
