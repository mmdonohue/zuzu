# ZuZu Project Overview

## Purpose
ZuZu is a full-stack React application scaffold designed to integrate multiple modern web technologies into a cohesive development platform. It serves as a foundation for building production-ready web applications with authentication, AI integration, and comprehensive logging.

## Tech Stack

### Frontend
- **Framework**: React 18.2 with TypeScript
- **UI Libraries**: 
  - Material-UI (MUI) 5.15 for components
  - Tailwind CSS 3.4 for utility styling
  - Emotion for CSS-in-JS
- **State Management**:
  - Redux Toolkit 2.0 for global state
  - TanStack Query 4.36 for server state and caching
- **Routing**: React Router v6
- **Forms**: React Hook Form with Yup validation
- **Build Tool**: Webpack 5 with webpack-dev-server
- **Code Editor**: Monaco Editor (integrated)

### Backend
- **Framework**: Express 4.18
- **Language**: TypeScript (compiled to CommonJS)
- **Authentication**: JWT with bcrypt password hashing
- **Security**: 
  - CSRF protection (csrf-csrf library)
  - Helmet for HTTP headers
  - Express rate limiting
  - Input validation (express-validator)
- **Logging**: log4js with Morgan HTTP logger
- **Email**: Nodemailer (SMTP support)

### External Services
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenRouter API integration
- **Authentication**: Custom JWT-based auth with 2FA support

### Development Tools
- **Testing**: Cypress for E2E tests
- **TypeScript**: Separate configs for frontend (ES2020) and backend (CommonJS)
- **Module System**: 
  - Frontend: ESNext modules
  - Backend: CommonJS modules
- **Path Aliases**: `@/*` maps to `src/*` in frontend

## Key Features
1. **Authentication System**: JWT-based auth with 2FA, password reset, auto-login for local dev
2. **CSRF Protection**: Double Submit Cookie pattern for security
3. **OpenRouter Integration**: AI chat interface with conversation history
4. **Code Review**: Automated security and quality code review system
5. **Environment Detection**: Conditional features based on local vs production
6. **Comprehensive Logging**: HTTP request logging and application event tracking
7. **Real IP Tracking**: Proxy-aware IP detection for accurate logging

## Architecture Highlights
- **Dual Module Systems**: Frontend (ESNext) and Backend (CommonJS) with separate TypeScript configs
- **API Proxy**: Development server proxies `/api` requests to backend
- **Provider Hierarchy**: Redux → TanStack Query → Router → MUI Theme → Auth Context
- **Protected Routes**: Authentication wrapper for secure pages
- **Cookie-based Auth**: HttpOnly cookies with refresh token rotation
