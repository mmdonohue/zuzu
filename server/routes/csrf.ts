// server/routes/csrf.ts
import express, { Request, Response } from 'express';
import { generateCsrfMiddleware } from '../middleware/csrf.middleware.js';

const router = express.Router();

/**
 * GET /api/csrf-token
 *
 * Returns a CSRF token for the client to use in subsequent requests.
 * The token is also set as an httpOnly cookie.
 *
 * Usage:
 * 1. Client calls this endpoint on app initialization
 * 2. Client stores the token from the response
 * 3. Client includes the token in X-CSRF-Token header for all state-changing requests
 */
router.get('/csrf-token', generateCsrfMiddleware, (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      csrfToken: res.locals.csrfToken
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
