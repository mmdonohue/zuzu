// Vercel serverless entry point — routes all /api/* requests to the Express app
// Import from compiled dist (built by `npm run build` before Vercel deploys)
import { app } from '../server/dist/index.js';

export default app;
