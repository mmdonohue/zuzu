# Suggested Commands for ZuZu Development

## Frontend Development

### Start Development Server
```bash
npm start
# Starts webpack-dev-server on port 3000
# Opens browser automatically
# Proxies /api requests to localhost:5000
```

### Build for Production
```bash
npm run build
# Creates optimized production bundle in dist/
# Runs prebuild (dev build) first
# Generates content-hashed bundles for cache busting
```

### Serve Production Build Locally
```bash
npm run serve
# Serves the dist/ directory on port 3000 (or PORT env var)
# Useful for testing production build locally
```

## Backend Development

### Run Backend Server (Development)
```bash
npm run server
# Runs server with ts-node in development mode
# Watches for changes (via ts-node)
# Server runs on port 5000 (or PORT env var)
```

### Build Backend
```bash
npm run build:server
# Compiles TypeScript to server/dist/
# Installs server dependencies
```

### Run Backend (Production)
```bash
npm run server:start
# Runs compiled JavaScript from server/dist/
# Production mode - no TypeScript compilation
```

### Build and Run Backend
```bash
npm run dev:server
# Builds server and runs production version
# Equivalent to: build:server && server:start
```

## Full Stack Development

### Run Both Frontend and Backend
```bash
npm run dev
# Runs frontend dev server and backend concurrently
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

## Testing

### Run Cypress Tests (Headless)
```bash
npm test
# Runs all Cypress E2E tests in headless mode
# Tests run against http://localhost:3000
```

### Open Cypress Test Runner
```bash
npm run test:open
# Opens Cypress GUI for interactive test development
# Allows running individual tests and debugging
```

## Server-Specific Commands

### Clean Server Dependencies
```bash
cd server && npm run clean
# Removes node_modules and package-lock.json
```

### Reinstall Server Dependencies
```bash
cd server && npm run reinstall
# Cleans and reinstalls all dependencies
```

### Rebuild Server
```bash
cd server && npm run rebuild
# Full clean + reinstall + build
```

## Environment Setup

### Generate Secrets
```bash
# Generate JWT secrets (run twice for access and refresh)
openssl rand -base64 48

# Generate CSRF secret
openssl rand -base64 48
```

### Check Environment Variables
```bash
# Frontend .env
cat .env

# Backend .env
cat server/.env

# Check for required JWT secrets
if [ -f server/.env ]; then grep -E "^JWT_" server/.env; else echo "server/.env file does not exist"; fi

# Check for CSRF secret
if [ -f server/.env ]; then grep -E "^CSRF_SECRET=" server/.env; else echo "server/.env file does not exist"; fi
```

## Git Workflow
```bash
# Check status
git status

# View recent commits
git log --oneline -20

# Stage changes
git add .

# Commit with message
git commit -m "Your message"

# Push to remote
git push origin main
```

## System Commands (macOS/Darwin)

### File Operations
```bash
# List files
ls -la

# Find files
find . -name "*.ts" -not -path "*/node_modules/*"

# Search in files
grep -r "search term" --include="*.ts" --exclude-dir=node_modules

# Change directory
cd path/to/directory
```

### Process Management
```bash
# Find process by port
lsof -i :3000
lsof -i :5000

# Kill process by PID
kill -9 <PID>
```

### View Logs
```bash
# View application logs
tail -f logs/app.log

# View specific log file
cat logs/app.log
```

## Development Workflow

### First Time Setup
```bash
# 1. Install frontend dependencies
npm install

# 2. Install backend dependencies
cd server && npm install && cd ..

# 3. Copy environment files
cp .env.example .env
cp server/.env.example server/.env

# 4. Configure environment variables in .env and server/.env
# 5. Generate secrets (see Environment Setup above)
```

### Daily Development
```bash
# Start both frontend and backend
npm run dev

# OR start separately:
# Terminal 1: npm start
# Terminal 2: npm run server
```

### Before Committing
```bash
# 1. Run tests
npm test

# 2. Build to check for errors
npm run build

# 3. Review changes
git status
git diff

# 4. Commit
git add .
git commit -m "Descriptive message"
```
