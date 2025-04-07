# ZuZu

ZuZu is a scaffold application for practicing integration of different tech stacks with a React JavaScript demo site.

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

3. Configure Supabase
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Copy your Supabase URL and anon key
   - Update the values in `src/services/supabase.ts`

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
