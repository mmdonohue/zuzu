// server/routes/auth.routes.ts
import express from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import {
  validateSignup,
  validateLogin,
  validateVerifyCode,
  validateResendCode,
  validatePasswordResetRequest,
  validatePasswordResetConfirm
} from '../middleware/validation.middleware.js';
import {
  loginLimiter,
  codeLimiter,
  passwordResetLimiter
} from '../middleware/rateLimiter.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/signup', validateSignup, AuthController.signup);
router.post('/login', loginLimiter, validateLogin, AuthController.login);
router.post('/verify-code', codeLimiter, validateVerifyCode, AuthController.verifyCode);
router.post('/resend-code', codeLimiter, validateResendCode, AuthController.resendCode);
router.post('/password-reset-request', passwordResetLimiter, validatePasswordResetRequest, AuthController.passwordResetRequest);
router.post('/password-reset-confirm', validatePasswordResetConfirm, AuthController.passwordResetConfirm);

// Development auto-login (only works on localhost with TEST_USER_EMAIL set)
router.get('/dev-login', AuthController.devLogin);

// Protected routes
router.post('/logout', authenticateToken, AuthController.logout);
router.post('/refresh-token', AuthController.refreshToken);
router.get('/me', authenticateToken, AuthController.getCurrentUser);

export default router;
