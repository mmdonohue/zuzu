// server/middleware/rateLimiter.middleware.ts
import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../utils/errors.js';

// General API rate limiter (1000 requests per 30 minutes)
export const apiLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 1000,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    ip: false,
    trustProxy: false,
    forwardedHeader: false
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later'
    });
  }
});

// Strict rate limiter for login attempts (5 attempts per 15 minutes)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts, please try again after 15 minutes',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    ip: false,
    trustProxy: false,
    forwardedHeader: false
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Account temporarily locked.'
    });
  }
});

// Rate limiter for code sending (3 codes per 15 minutes)
export const codeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: 'Too many verification codes requested',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many code requests. Please wait before requesting another.'
    });
  }
});

// Rate limiter for password reset (3 requests per hour)
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset requests',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset requests. Please try again later.'
    });
  }
});
