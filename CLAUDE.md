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

- **Routing**: React Router v6 in `src/App.tsx` with routes for Home, About, Dashboard, OpenRouter, and Logs pages

- **State Management**:
  - Redux Toolkit with slices in `src/store/slices/` (authSlice, uiSlice)
  - TanStack Query for server state and caching
  - Store configured in `src/store/index.ts`

- **Styling**:
  - MUI components with custom theme (primary: #6F87BF, secondary: #001133)
  - Tailwind CSS for utility classes
  - Global styles in `src/styles/globals.css`

- **Path Aliases**: `@/*` maps to `src/*` (configured in tsconfig.json and webpack)

### Backend Stack
- **Entry Point**: `server/index.ts` - Express server with:
  - CORS configured for localhost:3000 and production frontend
  - Morgan HTTP logger integrated with log4js
  - Routes mounted at `/api`, `/api/openrouter`, `/api/logs`
  - Health check endpoint at `/health`

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

**Backend** (`server/.env`):
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase service role key
- `ZUZU_OPENROUTER_KEY` - OpenRouter API key
- `PORT` - Server port (defaults to 5000)
- `PRODUCTION_FRONTEND_URL` - Production frontend URL (automatically added to CORS allowed origins)
- `ALLOWED_ORIGINS` - Additional allowed CORS origins (optional, comma-separated)

## Key Development Notes

1. **Dual TypeScript Configs**: Frontend and server have separate tsconfig files with different module systems
2. **API Proxy**: In development, webpack-dev-server proxies `/api` requests to backend at localhost:5000
3. **Logging Directory**: Server automatically creates `logs/` directory at project root on startup
4. **IP Tracking**: Server tracks real client IPs via x-forwarded-for and x-real-ip headers for proxy support
5. **Build Process**: `prebuild` script runs development build before production build
