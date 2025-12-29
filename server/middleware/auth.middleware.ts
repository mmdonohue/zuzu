// server/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuthenticationError, ForbiddenError } from '../utils/errors.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

// Verify JWT from httpOnly cookie
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from httpOnly cookie
    const token = req.cookies.accessToken;

    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    // Verify token
    const decoded = AuthService.verifyAccessToken(token);

    // Attach user to request (convert userId to string for consistency)
    req.user = {
      userId: typeof decoded.userId === 'number' ? decoded.userId.toString() : decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    next(new AuthenticationError('Invalid or expired token'));
  }
};

// Check user role authorization
export const authorizeRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.accessToken;
    if (token) {
      const decoded = AuthService.verifyAccessToken(token);
      req.user = {
        userId: typeof decoded.userId === 'number' ? decoded.userId.toString() : decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
    }
  } catch (error) {
    // Silently fail - token invalid but continue
  }
  next();
};
