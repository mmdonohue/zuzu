# ZuZu
<img width="200" height="200" alt="image" src="https://github.com/user-attachments/assets/a7fc82ea-07df-4ad1-9eac-4a13fd57291c" />

ZuZu is a production-ready full-stack application scaffold featuring React/TypeScript frontend, Express backend, JWT authentication, comprehensive security implementation, and automated code review with best practices enforcement.

## Tech Stack

This project integrates the following technologies:

### Frontend
- **React**: A JavaScript library for building user interfaces
- **MUI Components**: React UI framework following Material Design
- **TypeScript**: A typed superset of JavaScript
- **Redux**: State management for React applications
- **Tailwind CSS**: A utility-first CSS framework
- **Webpack**: Module bundler for JavaScript applications
- **TanStack Query**: Data fetching and caching library

### Backend
- **Express**: Web application framework for Node.js

### Database
- **Supabase**: An open-source Firebase alternative

### Testing
- **Cypress**: End-to-end testing framework

## Getting Started

### Prerequisites

- Node.js (version 16.x or higher)
- npm (version 8.x or higher)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/zuzu.git
   cd zuzu
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables

   **Frontend configuration:**
   ```bash
   # Copy the example file
   cp .env.example .env
   ```

   Edit `.env` and add your credentials:
   - `REACT_APP_SUPABASE_URL`: Your Supabase project URL (get from [supabase.com](https://supabase.com))
   - `REACT_APP_SUPABASE_KEY`: Your Supabase anon key
   - `REACT_APP_ZUZU_OPENROUTER_KEY`: Your OpenRouter API key (get from [openrouter.ai/keys](https://openrouter.ai/keys))
   - `REACT_APP_PRODUCTION`: Your production frontend URL (optional, for production deployments)

   **Backend configuration:**
   ```bash
   # Copy the example file
   cp server/.env.example server/.env
   ```

   Edit `server/.env` and add your credentials:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase service role key (⚠️ keep this secret!)
   - `ZUZU_OPENROUTER_KEY`: Your OpenRouter API key
   - `PORT`: Server port (default: 5000)
   - `PRODUCTION_FRONTEND_URL`: Your production frontend URL (automatically added to CORS allowed origins)
   - `ALLOWED_ORIGINS`: Additional allowed CORS origins (optional, comma-separated)
   - `JWT_ACCESS_SECRET`: JWT secret for access tokens (generate with `openssl rand -base64 48`)
   - `JWT_REFRESH_SECRET`: JWT secret for refresh tokens (generate with `openssl rand -base64 48`)
   - `CSRF_SECRET`: CSRF token signing key (generate with `openssl rand -base64 48`)

### Running the Application

1. Start the development server (both frontend and backend)
   ```bash
   npm run dev
   ```

   This will start:
   - React frontend at [http://localhost:3000](http://localhost:3000)
   - Express backend at [http://localhost:5000](http://localhost:5000)

2. To run only the frontend
   ```bash
   npm start
   ```

3. To run only the backend
   ```bash
   npm run server
   ```

### Building for Production

```bash
npm run build
```

The build files will be generated in the `dist` directory.

### Running Tests

```bash
# Run tests in headless mode
npm test

# Open Cypress Test Runner
npm run test:open
```

## Security

ZuZu implements multiple security layers to protect against common web vulnerabilities.

### CSRF Protection

The application uses cookie-based authentication with `sameSite: 'none'`, which requires CSRF protection:

- **Implementation**: Double Submit Cookie pattern using `csrf-csrf` library
- **Protected Routes**: All POST, PUT, DELETE, PATCH endpoints
- **Frontend**: CSRF tokens automatically included via `fetchWithCsrf` helper

**Quick Start:**
```bash
# Generate CSRF secret (add to server/.env)
openssl rand -base64 48
```

See [SECURITY.md](./SECURITY.md) for complete security documentation.

### Authentication

- **JWT Storage**: httpOnly, secure cookies (protected from XSS)
- **Token Types**: Short-lived access tokens (15min) + refresh tokens (7 days)
- **Password Security**: bcrypt hashing with salt rounds = 12

### Environment Security

**Required secrets** in `server/.env`:
- `CSRF_SECRET` - CSRF token signing key (generate with `openssl rand -base64 48`)
- `JWT_ACCESS_SECRET` - Access token signing key
- `JWT_REFRESH_SECRET` - Refresh token signing key

**Never commit** `.env` or `server/.env` files to version control.

### Security Review

Run automated security checks:
```bash
python3 .claude/hooks/review-agent.py --focus security
```

For detailed security guidance, see:
- [SECURITY.md](./SECURITY.md) - Complete security documentation
- [.claude/AUTH_IMPLEMENTATION.md](./.claude/AUTH_IMPLEMENTATION.md) - Authentication implementation details

## Project Structure

```
ZuZu/
├── src/                  # Frontend source files
│   ├── components/       # Reusable UI components
│   ├── pages/            # Application pages
│   ├── services/         # API and external services
│   ├── store/            # Redux store, slices, and middleware
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   └── styles/           # Global styles
├── server/               # Backend Express server
│   ├── routes/           # API route definitions
│   └── controllers/      # Route controllers
├── public/               # Static assets
├── cypress/              # Cypress tests
│   ├── e2e/              # End-to-end tests
│   ├── fixtures/         # Test data
│   └── support/          # Support files and commands
└── config files          # Configuration files for various tools
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
