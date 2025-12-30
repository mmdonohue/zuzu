# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZuZu is a full-stack React application scaffold that integrates multiple modern web technologies. It consists of a TypeScript/React frontend with MUI components and Tailwind CSS, and an Express backend server.

## Development Commands

### Frontend Development
```bash
# Start frontend dev server (webpack-dev-server on port 3000)
npm start

# Build for production
npm run build

# Serve production build locally
npm run serve
```

### Backend Development
```bash
# Run backend server (port 5000)
npm run server

# Build and run backend
npm run dev:server

# Run both frontend and backend concurrently
npm run dev
```

### Testing
```bash
# Run Cypress tests in headless mode
npm test

# Open Cypress Test Runner UI
npm run test:open
```

## Architecture

### Frontend Stack
- **Entry Point**: `src/index.tsx` - Wraps app with Provider hierarchy:
  1. Redux Provider (state management)
  2. TanStack QueryClientProvider (server state/data fetching)
  3. React Router BrowserRouter (routing)
  4. MUI ThemeProvider (Material UI theming)
  5. CssBaseline (CSS reset)
  6. AuthProvider (authentication context)

- **Routing**: React Router v6 in `src/App.tsx` with the following route structure:
  - **Public Routes**: `/` (Home), `/about` (About)
  - **Auth Routes**: `/login` (Login), `/signup` (Signup), `/auth/verify` (VerifyCode) - redirect to dashboard if authenticated
  - **Protected Routes**: `/dashboard` (Dashboard), `/openrouter` (OpenRouter), `/logs` (Logs), `/account` (Account) - require authentication via ProtectedRoute wrapper

- **State Management**:
  - Redux Toolkit with slices in `src/store/slices/` (authSlice, uiSlice)
  - TanStack Query for server state and caching
  - Store configured in `src/store/index.ts`

- **Styling**:
  - MUI components with custom theme (primary: #6F87BF, secondary: #001133)
  - Tailwind CSS for utility classes
  - Global styles in `src/styles/globals.css`

- **Path Aliases**: `@/*` maps to `src/*` (configured in tsconfig.json and webpack)

- **Environment Detection**: `src/utils/environment.ts` provides utilities to detect runtime environment:
  - `isLocalEnvironment()` - Returns true if running on localhost or REACT_APP_ENVIRONMENT is 'local'/'development'
  - `isProductionEnvironment()` - Returns true if not running locally
  - `getEnvironment()` - Returns 'local' or 'production'
  - **Usage**: Use to conditionally render features that only work locally (e.g., "Run Code Review" button)
  - **Auto-detection**: Checks hostname (localhost, 127.0.0.1, [::1]) or REACT_APP_ENVIRONMENT variable

### Backend Stack
- **Entry Point**: `server/index.ts` - Express server with:
  - CORS configured for localhost:3000 and production frontend (credentials enabled)
  - Morgan HTTP logger integrated with log4js
  - Routes mounted at `/api`, `/api/auth`, `/api/openrouter`, `/api/logs`, `/api/review`, `/api/csrf-token`
  - CSRF protection applied to all state-changing routes (POST, PUT, DELETE, PATCH)
  - Health check endpoint at `/health`

- **Security**:
  - CSRF protection via `csrf-csrf` library (Double Submit Cookie pattern)
  - CSRF middleware in `server/middleware/csrf.middleware.ts`
  - Token endpoint at `/api/csrf-token`
  - Protection applied to POST, PUT, DELETE, PATCH routes
  - Cookie-based authentication requires CSRF due to `sameSite: 'none'`
  - bcrypt password hashing in `server/services/auth.service.ts`

- **Logging**:
  - log4js configured to write to `logs/` directory at project root
  - Custom Morgan token for real IP tracking (handles proxies)
  - Logs include HTTP requests and application events

- **CORS Configuration**:
  - Automatically includes http://localhost:3000
  - Adds PRODUCTION_FRONTEND_URL if set in environment
  - Can add additional origins via ALLOWED_ORIGINS (comma-separated)
  - Origins are built dynamically on server startup

- **Module System**:
  - Server uses CommonJS (tsconfig.json: "module": "CommonJS")
  - TypeScript compiled to `server/dist/`
  - Frontend uses ESNext modules

### External Services
- **Supabase**: Database service configured via environment variables
  - `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_KEY` required
  - Client initialized in `src/services/supabase.ts`
  - Helper functions: fetchData, insertData, updateData, deleteData

- **OpenRouter**: AI service integration via `REACT_APP_ZUZU_OPENROUTER_KEY`

### Build Configuration
- **Webpack**: Bundle config in `webpack.config.cjs`
  - Dev server proxies `/api` requests to `http://localhost:5000`
  - Uses dotenv-webpack to inject environment variables
  - Supports TypeScript, CSS (with PostCSS/Tailwind), and image assets
  - Content hashed bundles for cache busting
  - Path aliases: `@` resolves to `src/`

- **TypeScript**:
  - Root tsconfig.json for frontend (JSX: react-jsx, target: ES2020)
  - Separate server/tsconfig.json (CommonJS modules)

### Testing
- Cypress configured for e2e tests
- Base URL: http://localhost:3000
- Spec pattern: `cypress/e2e/**/*.cy.{js,jsx,ts,tsx}`
- Video and screenshots disabled by default

## Environment Variables

Required environment variables are defined in `.env.example` and `server/.env.example`. Copy these to `.env` and `server/.env` respectively.

**Frontend** (`.env`):
- `REACT_APP_SUPABASE_URL` - Supabase project URL
- `REACT_APP_SUPABASE_KEY` - Supabase anon key
- `REACT_APP_ZUZU_OPENROUTER_KEY` - OpenRouter API key
- `REACT_APP_PRODUCTION` - Production frontend URL (optional)
- `REACT_APP_ENVIRONMENT` - Environment type (optional) - Set to 'local' or 'development' to enable local-only features. Auto-detected from hostname if not set.

**Backend** (`server/.env`):
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase service role key
- `ZUZU_OPENROUTER_KEY` - OpenRouter API key
- `PORT` - Server port (defaults to 5000)
- `PRODUCTION_FRONTEND_URL` - Production frontend URL (automatically added to CORS allowed origins)
- `ALLOWED_ORIGINS` - Additional allowed CORS origins (optional, comma-separated)
- `JWT_ACCESS_SECRET` - JWT secret for access tokens (generate with `openssl rand -base64 48`)
- `JWT_REFRESH_SECRET` - JWT secret for refresh tokens (generate with `openssl rand -base64 48`)
- `CSRF_SECRET` - CSRF token signing key **REQUIRED** (generate with `openssl rand -base64 48`)

## Security Implementation

### CSRF Protection

**Why Required**: Cookie-based auth with `sameSite: 'none'` allows cross-origin cookie transmission, creating CSRF vulnerability.

**Implementation**: Double Submit Cookie pattern
1. Server generates token, sends in cookie + response body
2. Client stores token, includes in `x-csrf-token` header
3. Server validates cookie matches header (attacker can't read response body due to Same-Origin Policy)

**Files**:
- `server/middleware/csrf.middleware.ts` - CSRF middleware, error handling
- `src/services/csrf.service.ts` - Frontend token management
- `src/services/api.ts` - `fetchWithCsrf` helper for automatic token inclusion
- `server/routes/csrf.ts` - Token endpoint (`/api/csrf-token`)

**Environment**: `CSRF_SECRET` required in `server/.env` (generate: `openssl rand -base64 48`)

**Protected Routes**: Apply `csrfProtection` middleware to all state-changing endpoints (POST, PUT, DELETE, PATCH)

**Error Handling**: Frontend automatically refreshes token on `CSRF_VALIDATION_FAILED` (403) response

### Security Configuration

Review agent uses `.claude/review/config/security.json` to:
- Define authentication method (`cookie`, `header`, `both`)
- Configure CSRF requirements
- Enable/disable security checks
- Set severity levels

**CSRF Check Behavior**: Automatically skipped when:
- Authentication method is `header` (no cookies = no CSRF risk)
- `sameSite` is `strict` or `lax` (browser blocks cross-origin cookies)
- Suppressed via `.claude/review/config/suppressions.json`

### Suppression System

False positives can be suppressed in `.claude/review/config/suppressions.json`:

**Types**:
1. **Specific**: Suppress exact file + line number
2. **Pattern**: Suppress regex-matched paths (e.g., test files)
3. **Inline**: Code comments (`// SECURITY-IGNORE: <reason>`)

**Best Practice**: Always include expiration dates and clear reasons for suppressions

See `.claude/SECURITY.md` for complete security documentation and best practices.

## TypeScript Coding Standards

**IMPORTANT**: Follow these TypeScript standards for all code written in this project:

### Type Definitions

1. **Prefer `type` over `interface`**
   - Project standard is to use `type` for consistency
   - **Good**: `type User = { id: string; name: string; }`
   - **Avoid**: `interface User { id: string; name: string; }`
   - Exception: Only use `interface` when you need declaration merging or extending complex class hierarchies

2. **Never use `any` type**
   - Always specify concrete types when the type is known
   - **Good**: `value: string`, `count: number`, `data: User | null`
   - **Bad**: `value: any`, `data: any`
   - If the type is truly unknown or dynamic, use:
     - `unknown` - for values that need type checking before use
     - `Record<string, unknown>` - for objects with unknown properties
     - Specific union types - `string | number | boolean`
     - Generic types - `T extends SomeConstraint`

3. **Type Safety Examples**
   ```typescript
   // BAD - Using any
   const handleChange = (event: any) => {
     setValue(event.target.value);
   };

   // GOOD - Specific type
   const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
     setValue(event.target.value);
   };

   // BAD - Any for API response
   const fetchData = async (): Promise<any> => { ... };

   // GOOD - Typed response
   type ApiResponse = {
     success: boolean;
     data: User[];
   };
   const fetchData = async (): Promise<ApiResponse> => { ... };
   ```

4. **Function Parameters and Return Types**
   - Always explicitly type function parameters
   - Always explicitly type function return types
   - Avoid implicit `any` from missing types

5. **Avoid Magic Numbers - Use Named Constants**
   - **Rule**: Never use hardcoded numbers directly in code (except 0, 1, -1 in obvious contexts)
   - **Always** declare numbers as named constants with clear, descriptive names
   - **Benefits**: Improves readability, maintainability, and prevents errors from typos

   ```typescript
   // BAD - Magic numbers
   setTimeout(() => refetch(), 30000);
   if (score >= 80) { ... }
   const maxItems = items.slice(0, 50);

   // GOOD - Named constants
   const REFETCH_INTERVAL_MS = 30000; // 30 seconds
   setTimeout(() => refetch(), REFETCH_INTERVAL_MS);

   const PASSING_SCORE_THRESHOLD = 80;
   if (score >= PASSING_SCORE_THRESHOLD) { ... }

   const MAX_DISPLAY_ITEMS = 50;
   const maxItems = items.slice(0, MAX_DISPLAY_ITEMS);
   ```

   **When to Use Constants**:
   - Timeouts/intervals: `const POLLING_INTERVAL_MS = 5000;`
   - Thresholds/limits: `const MAX_FILE_SIZE_MB = 10;`
   - Retry counts: `const MAX_RETRY_ATTEMPTS = 3;`
   - Percentages: `const DISCOUNT_PERCENTAGE = 15;`
   - Array indices (beyond 0, 1): `const HEADER_ROW_INDEX = 2;`
   - Status codes: `const HTTP_OK = 200;`
   - Configuration values: `const DEFAULT_PAGE_SIZE = 20;`

   **Naming Convention**:
   - Use UPPER_SNAKE_CASE for constants: `MAX_RETRIES`, `API_TIMEOUT_MS`
   - Include units in name when applicable: `_MS` (milliseconds), `_MB` (megabytes), `_PERCENT`
   - Make the name self-documenting: reader should understand what it represents

   **Acceptable Magic Numbers**:
   - `0`, `1`, `-1` in obvious contexts (array indices, loop counters, boolean conversions)
   - Mathematical constants already named: `Math.PI`, `Math.E`
   - Percentages that are immediately clear: `progress / 100`

## Key Development Notes

1. **Dual TypeScript Configs**: Frontend and server have separate tsconfig files with different module systems
2. **API Proxy**: In development, webpack-dev-server proxies `/api` requests to backend at localhost:5000
3. **Logging Directory**: Server automatically creates `logs/` directory at project root on startup
4. **IP Tracking**: Server tracks real client IPs via x-forwarded-for and x-real-ip headers for proxy support
5. **Build Process**: `prebuild` script runs development build before production build
