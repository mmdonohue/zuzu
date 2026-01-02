# ZuZu Project Structure

## Root Directory Layout

```
zuzu/
├── .claude/                    # Claude Code configuration and hooks
│   ├── hooks/                 # Custom hooks (review-agent.py)
│   ├── review/                # Code review configuration
│   ├── CLAUDE.md              # Project documentation for Claude
│   └── settings.json          # Claude settings
├── .github/                   # GitHub workflows and config
├── .serena/                   # Serena agent memory files
├── cypress/                   # Cypress E2E test suite
│   ├── e2e/                   # Test specs
│   └── support/               # Test utilities
├── dist/                      # Frontend production build output
├── logs/                      # Backend application logs
├── public/                    # Static assets (index.html, images)
├── server/                    # Backend Express application
│   ├── controllers/           # Request handlers
│   ├── dist/                  # Compiled backend code (generated)
│   ├── middleware/            # Express middleware
│   ├── models/                # Data models and types
│   ├── routes/                # API route definitions
│   ├── services/              # Business logic layer
│   ├── utils/                 # Backend utilities
│   ├── index.ts               # Backend entry point
│   ├── package.json           # Backend dependencies
│   ├── tsconfig.json          # Backend TypeScript config (CommonJS)
│   └── .env                   # Backend environment variables (not committed)
├── src/                       # Frontend React application
│   ├── components/            # Reusable UI components
│   ├── context/               # React context providers (AuthContext)
│   ├── pages/                 # Page components (Dashboard, OpenRouter, etc.)
│   ├── services/              # API services and utilities
│   ├── store/                 # Redux store configuration
│   │   └── slices/            # Redux Toolkit slices (authSlice, uiSlice)
│   ├── styles/                # Global styles
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Frontend utilities (environment.ts)
│   ├── App.tsx                # Main app component with routing
│   └── index.tsx              # Frontend entry point with providers
├── .env                       # Frontend environment variables (not committed)
├── .env.example               # Frontend environment variable template
├── .gitignore                 # Git ignore rules
├── cypress.config.ts          # Cypress configuration
├── package.json               # Frontend dependencies and scripts
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json              # Frontend TypeScript config (ESNext)
├── webpack.config.cjs         # Webpack build configuration
└── README.md                  # Project documentation
```

## Frontend Structure (`src/`)

### Entry Point and Providers
```
src/
├── index.tsx                  # App entry with provider hierarchy:
│                              #   1. Redux Provider
│                              #   2. TanStack QueryClientProvider
│                              #   3. React Router BrowserRouter
│                              #   4. MUI ThemeProvider
│                              #   5. CssBaseline
│                              #   6. AuthProvider
└── App.tsx                    # Main routing component
```

### Pages (Routed Components)
```
src/pages/
├── Home.tsx                   # Landing page (public)
├── About.tsx                  # About page (public)
├── Login.tsx                  # Login page (auth, redirects if authenticated)
├── Signup.tsx                 # Signup page (auth, redirects if authenticated)
├── VerifyCode.tsx             # 2FA verification (auth)
├── Dashboard.tsx              # Main dashboard (protected)
│                              #   - Code review visualization
│                              #   - Category cards with status
│                              #   - Findings list
│                              #   - Run code review button (local only)
├── OpenRouter.tsx             # AI chat interface (protected)
│                              #   - Model selection
│                              #   - Streaming responses
│                              #   - Conversation history
├── Logs.tsx                   # Application logs viewer (protected)
└── Account.tsx                # User account settings (protected)
```

### Context Providers
```
src/context/
└── AuthContext.tsx            # Authentication context
                               #   - User state management
                               #   - Login/logout functions
                               #   - Dev auto-login (local only)
                               #   - Token refresh handling
```

### State Management
```
src/store/
├── index.ts                   # Redux store configuration
└── slices/
    ├── authSlice.ts           # Authentication state
    └── uiSlice.ts             # UI state (theme, loading, etc.)
```

### Services (API Layer)
```
src/services/
├── api.ts                     # Core API utilities
│                              #   - fetchWithCsrf (CSRF-protected requests)
│                              #   - Base fetch configuration
├── auth.service.ts            # Authentication API calls
│                              #   - login, signup, logout
│                              #   - Token management
│                              #   - User storage (localStorage)
├── csrf.service.ts            # CSRF token management
│                              #   - Token fetching
│                              #   - Token storage
└── supabase.ts                # Supabase client
                               #   - Database operations
                               #   - fetchData, insertData, updateData, deleteData
```

### Utilities
```
src/utils/
└── environment.ts             # Environment detection
                               #   - isLocalEnvironment()
                               #   - isProductionEnvironment()
                               #   - getEnvironment()
```

### Components (Reusable UI)
```
src/components/
├── ProtectedRoute.tsx         # Authentication wrapper for protected pages
├── Navbar.tsx                 # Navigation bar
└── ...                        # Other reusable components
```

## Backend Structure (`server/`)

### Entry Point
```
server/
└── index.ts                   # Express server setup
                               #   - CORS configuration
                               #   - Middleware mounting
                               #   - Route mounting
                               #   - Error handling
                               #   - Server startup
```

### Controllers (Request Handlers)
```
server/controllers/
├── auth.controller.ts         # Authentication endpoints
│                              #   - signup, login, logout
│                              #   - verifyCode, resendCode
│                              #   - passwordReset, refreshToken
│                              #   - getCurrentUser, devLogin
└── ...                        # Other controllers
```

### Services (Business Logic)
```
server/services/
├── auth.service.ts            # Authentication logic
│                              #   - Password hashing (bcrypt)
│                              #   - JWT token generation
│                              #   - Token validation
│                              #   - 2FA code generation
├── user.service.ts            # User CRUD operations
│                              #   - Supabase database queries
│                              #   - User creation, update, deletion
└── ...                        # Other services
```

### Routes (API Endpoints)
```
server/routes/
├── auth.routes.ts             # Authentication routes
│                              #   - POST /signup, /login, /logout
│                              #   - POST /verify-code, /resend-code
│                              #   - POST /refresh-token
│                              #   - GET /me, /dev-login
├── csrf.ts                    # CSRF token endpoint
│                              #   - GET /csrf-token
├── openrouter.routes.ts       # OpenRouter API proxy
├── logs.routes.ts             # Application logs endpoints
├── review.routes.ts           # Code review endpoints
└── ...                        # Other routes
```

### Middleware
```
server/middleware/
├── auth.middleware.ts         # JWT authentication
│                              #   - authenticateToken (verify JWT)
│                              #   - Extract user from token
├── csrf.middleware.ts         # CSRF protection
│                              #   - csrfProtection (validate CSRF token)
│                              #   - Error handling for CSRF failures
├── validation.middleware.ts   # Input validation
│                              #   - validateSignup, validateLogin
│                              #   - Express-validator schemas
├── rateLimiter.middleware.ts  # Rate limiting
│                              #   - loginLimiter, codeLimiter
└── error.middleware.ts        # Error handling
```

### Models/Types
```
server/models/
├── user.model.ts              # User type definitions
├── auth.model.ts              # Auth-related types
└── ...                        # Other models
```

### Utilities
```
server/utils/
├── logger.ts                  # log4js configuration
├── errors.ts                  # Custom error classes
└── ...                        # Other utilities
```

## Build Artifacts

### Frontend Build
```
dist/                          # Created by webpack
├── index.html                 # Entry HTML
├── main.[hash].js             # Main bundle (content-hashed)
├── [chunk].[hash].js          # Code-split chunks
└── assets/                    # Images, fonts, etc.
```

### Backend Build
```
server/dist/                   # Created by TypeScript compiler
├── index.js                   # Compiled server entry
├── controllers/               # Compiled controllers
├── services/                  # Compiled services
├── routes/                    # Compiled routes
└── ...                        # Other compiled code
```

## Configuration Files

### TypeScript
- `tsconfig.json` - Frontend config (ESNext modules, React JSX)
- `server/tsconfig.json` - Backend config (CommonJS modules)

### Build Tools
- `webpack.config.cjs` - Webpack configuration (dev server, production build)
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration (if exists)

### Testing
- `cypress.config.ts` - Cypress E2E test configuration
- `cypress/` - Test specs and support files

### Environment
- `.env.example` - Frontend environment variable template
- `server/.env.example` - Backend environment variable template
- `.env` - Actual frontend env vars (not committed)
- `server/.env` - Actual backend env vars (not committed)

## Key Architectural Decisions

### Module Systems
- **Frontend**: ESNext modules (`import`/`export`)
- **Backend**: CommonJS modules (`require`/`module.exports`)
- Separate TypeScript configurations for each

### Path Aliases
- Frontend: `@/*` maps to `src/*`
- Configured in both `tsconfig.json` and `webpack.config.cjs`

### API Communication
- Development: Webpack dev server proxies `/api` to `http://localhost:5000`
- Production: Frontend makes direct requests to backend URL

### State Management Strategy
- **Global App State**: Redux Toolkit (authSlice, uiSlice)
- **Server State**: TanStack Query (API data, caching)
- **Local UI State**: React useState (component-specific)
- **Auth State**: React Context (AuthProvider) wrapping Redux

### Security Layers
1. **CORS**: Configured origins in server
2. **CSRF**: Double Submit Cookie pattern for state-changing requests
3. **JWT**: Access and refresh tokens in httpOnly cookies
4. **Input Validation**: Express-validator on backend
5. **Rate Limiting**: Per-endpoint rate limiters
6. **Helmet**: Security headers

### Logging Strategy
- **HTTP Requests**: Morgan middleware → log4js
- **Application Events**: log4js → `logs/` directory
- **Real IP Tracking**: Proxy-aware via x-forwarded-for headers
- **Log Rotation**: Configured in log4js (date-based)
