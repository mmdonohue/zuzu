// Vercel serverless entry point — routes all /api/* requests to the Express app
import type { VercelRequest, VercelResponse } from '@vercel/node';

let appHandler: ((req: VercelRequest, res: VercelResponse) => void) | null = null;
let initError: Error | null = null;

try {
  const { app } = require('../server/index');
  appHandler = app;
} catch (e: unknown) {
  initError = e as Error;
  console.error('[api/index] Failed to load server app:', e);
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (initError || !appHandler) {
    res.status(500).json({
      error: 'Server initialization failed',
      message: initError?.message ?? 'Unknown error',
      stack: process.env.NODE_ENV !== 'production' ? initError?.stack : undefined,
    });
    return;
  }
  appHandler(req, res);
}
