// server/middleware/csrf.middleware.ts
import { doubleCsrf } from 'csrf-csrf';
import { Request, Response, NextFunction } from 'express';

/**
 * CSRF Protection Middleware using csrf-csrf
 *
 * This implements the Double Submit Cookie pattern:
 * 1. Server sends CSRF token in both a cookie and response body
 * 2. Client includes the token from the response body in request headers
 * 3. Server validates that the header token matches the cookie token
 *
 * Why this is needed:
 * - Our app uses httpOnly cookies for JWT authentication
 * - In production, cookies use sameSite: 'none' for cross-origin support
 * - This makes the app vulnerable to CSRF attacks without additional protection
 */

// Configure CSRF protection
const {
  generateCsrfToken,
  doubleCsrfProtection
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'your-csrf-secret-change-in-production',
  getSessionIdentifier: (req: Request) => {
    // Use the access token cookie as session identifier
    // This ties CSRF protection to the user's session
    return req.cookies?.accessToken || req.ip || 'anonymous';
  },
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 1800000 // 30 minutes in milliseconds
  },
  size: 64, // Token size in bytes
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'], // Methods that don't need CSRF protection
  getCsrfTokenFromRequest: (req: Request) => {
    // Check multiple possible header names
    return req.headers['x-csrf-token'] as string ||
           req.headers['csrf-token'] as string ||
           req.body?.csrfToken;
  }
});

/**
 * Middleware to generate and send CSRF token
 * Use this on a GET endpoint to allow clients to retrieve the token
 */
export const generateCsrfMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = generateCsrfToken(req, res);
    res.locals.csrfToken = token;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to validate CSRF token on state-changing requests
 * This should be applied to routes that modify data (POST, PUT, DELETE, PATCH)
 */
export const csrfProtection = doubleCsrfProtection;

/**
 * Error handler for CSRF validation failures
 * Add this after the CSRF middleware to provide better error messages
 */
export const csrfErrorHandler = (err: Error & { code?: string }, req: Request, res: Response, next: NextFunction) => {
  if (err.code === 'EBADCSRFTOKEN' || err.message?.includes('csrf')) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token. Please refresh the page and try again.',
      code: 'CSRF_VALIDATION_FAILED'
    });
  }
  next(err);
};
