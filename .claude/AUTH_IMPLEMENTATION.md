# Authentication System Implementation

This document provides an overview of the authentication system implemented for the ZuZu application.

## Overview

A complete, production-ready authentication system with email verification, password reset, and JWT-based session management.

## Features

### Backend
- ✅ User registration with email verification (6-digit code)
- ✅ Login with email/password + 2FA verification code
- ✅ JWT access tokens (15 min) and refresh tokens (7 days)
- ✅ Password reset via email link
- ✅ Account lockout after failed login attempts (5 attempts = 15 min lock)
- ✅ Rate limiting on auth endpoints
- ✅ Secure httpOnly cookies for token storage
- ✅ Password strength validation
- ✅ Email service integration (Mailgun/SMTP)
- ✅ Comprehensive error handling

### Frontend
- ✅ Signup page with form validation
- ✅ Login page
- ✅ Email verification page (6-digit code input)
- ✅ Account profile page
- ✅ Protected routes (requires authentication)
- ✅ Auth context for global state management
- ✅ Automatic token refresh
- ✅ Header with login/logout functionality

## File Structure

### Backend (`server/`)
```
config/
  ├── email.ts          # SMTP/Mailgun configuration
  ├── jwt.ts            # JWT and cookie settings
  └── logger.ts         # Logging configuration

controllers/
  └── auth.controller.ts # Auth endpoint handlers

middleware/
  ├── auth.middleware.ts           # JWT verification
  ├── errorHandler.middleware.ts   # Centralized error handling
  ├── rateLimiter.middleware.ts    # Rate limiting
  └── validation.middleware.ts     # Input validation

routes/
  └── auth.routes.ts    # Auth API routes

services/
  ├── auth.service.ts   # Auth utilities (JWT, bcrypt)
  ├── email.service.ts  # Email sending
  └── user.service.ts   # User CRUD operations

utils/
  ├── errors.ts         # Custom error classes
  └── responses.ts      # Response helpers

migrations/
  └── 001_add_auth_columns.sql  # Database schema updates
```

### Frontend (`src/`)
```
context/
  └── AuthContext.tsx   # Global auth state

services/
  └── auth.service.ts   # API client for auth endpoints

pages/
  ├── Login.tsx         # Login page
  ├── Signup.tsx        # Registration page
  ├── VerifyCode.tsx    # Email verification page
  └── Account.tsx       # User profile page

components/
  ├── ProtectedRoute.tsx # Route guard component
  └── Header.tsx         # Updated with auth UI
```

## API Endpoints

### Public Endpoints
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login (sends verification code)
- `POST /api/auth/verify-code` - Verify 6-digit code
- `POST /api/auth/resend-code` - Resend verification code
- `POST /api/auth/password-reset-request` - Request password reset
- `POST /api/auth/password-reset-confirm` - Reset password with token
- `POST /api/auth/refresh-token` - Get new access token

### Protected Endpoints
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout (clear cookies)

## Environment Variables

### Frontend (`.env`)
```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_KEY=your-supabase-key
```

### Backend (`server/.env`)
```bash
# Database
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-service-role-key

# Server
PORT=5000
FRONTEND_URL=http://localhost:3000

# JWT Secrets (generate strong random strings for production)
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Email (SMTP/Mailgun)
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=ZuZu Auth <noreply@yourdomain.com>
EMAIL_REPLY_TO=support@yourdomain.com
```

## Database Schema

### Tables Required
1. **users** - User accounts (see zuzu-tasks.txt for schema)
2. **roles** - User roles (SUPER_ADMIN, ADMIN, OWNER, USER)
3. **emails** - Email delivery logs

### Migration
Run the SQL migration to add required auth columns:
```bash
server/migrations/001_add_auth_columns.sql
```

## Authentication Flow

### Signup Flow
1. User submits email, password, name → `POST /api/auth/signup`
2. Backend validates password strength, creates user
3. Backend generates 6-digit code, sends email
4. User enters code → `POST /api/auth/verify-code`
5. Backend verifies code, creates JWT tokens
6. User redirected to dashboard

### Login Flow
1. User submits email/password → `POST /api/auth/login`
2. Backend verifies credentials, generates 6-digit code
3. Backend sends verification email
4. User enters code → `POST /api/auth/verify-code`
5. Backend creates JWT tokens, sets httpOnly cookies
6. User redirected to dashboard

### Session Management
- Access token: 15 minutes (stored in httpOnly cookie)
- Refresh token: 7 days (stored in httpOnly cookie)
- Frontend auto-refreshes tokens via interceptor
- User object cached in localStorage (non-sensitive data only)

## Security Features

1. **Password Requirements**: Min 8 chars, uppercase, lowercase, number, special char
2. **Account Lockout**: 5 failed attempts = 15 min lockout
3. **Rate Limiting**:
   - Login: 5 attempts per 15 min
   - Code requests: 3 per 15 min
   - Password reset: 3 per hour
4. **Code Expiry**: Verification codes expire in 5 minutes
5. **HttpOnly Cookies**: Tokens not accessible via JavaScript
6. **CORS**: Configurable allowed origins
7. **Helmet.js**: Security headers
8. **Input Validation**: Express-validator on all inputs

## Testing

### Manual Testing Checklist
- [ ] Signup with valid/invalid data
- [ ] Email verification code received and works
- [ ] Code expiry (5 minutes)
- [ ] Login with correct/incorrect credentials
- [ ] Account lockout after 5 failed attempts
- [ ] Password reset email received
- [ ] Protected routes redirect when not logged in
- [ ] Logout clears session
- [ ] Token refresh works
- [ ] Rate limiting triggers correctly

## Running the Application

### Development
```bash
# Terminal 1 - Frontend
npm start

# Terminal 2 - Backend
npm run server

# Or both together
npm run dev
```

### Production Build
```bash
# Frontend
npm run build

# Backend
npm run build:server
npm run server:start
```

## Next Steps / Enhancements

Optional features to add:
- [ ] Password reset frontend pages
- [ ] Update user profile (change name, email)
- [ ] Change password while logged in
- [ ] Email preferences
- [ ] Two-factor authentication (TOTP)
- [ ] OAuth integration (Google, GitHub, etc.)
- [ ] Remember me functionality
- [ ] Session management (view/revoke active sessions)
- [ ] Admin panel for user management
- [ ] Role-based access control middleware

## Troubleshooting

### Emails not sending
- Check SMTP credentials in `server/.env`
- Verify Mailgun/SMTP service is active
- Check `logs/app.log` for email errors

### JWT errors
- Ensure JWT secrets are set in `server/.env`
- Check cookie settings if running across different domains
- Verify CORS settings allow credentials

### Database errors
- Run migration: `server/migrations/001_add_auth_columns.sql`
- Verify Supabase service role key (not anon key)
- Check roles table has default USER role (rank 4)

## Support

For issues or questions, see:
- Backend logs: `logs/app.log`
- Frontend console errors
- Network tab for API responses
