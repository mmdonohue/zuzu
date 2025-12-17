// server/middleware/errorHandler.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Don't log authentication errors (token expiration is normal)
  const isAuthError = err.message?.includes('Invalid or expired token') ||
                     err.message?.includes('No authentication token') ||
                     err.message?.includes('refresh token');

  // Log error (skip auth errors)
  if (!isAuthError) {
    // replace any password fields in req.body with ****
    const sanitizedBody = { ...req.body, password: '****' };
    logger.error(`Error: ${err.message}`, {
      stack: err.stack,
      path: req.path,
      method: req.method,
      body: sanitizedBody
    });
  }

  // Handle operational errors
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Handle unexpected errors
  if (!isAuthError) {
    console.error('Unexpected error:', err);
  }
  return res.status(500).json({
    success: false,
    message: 'An unexpected error occurred'
  });
};
