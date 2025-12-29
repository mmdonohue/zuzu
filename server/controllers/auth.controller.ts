// server/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';
import { AuthService } from '../services/auth.service.js';
import { EmailService } from '../services/email.service.js';
import { sendSuccess } from '../utils/responses.js';
import { AuthenticationError, ValidationError } from '../utils/errors.js';
import { COOKIE_CONFIG } from '../config/jwt.js';

export class AuthController {
  // POST /api/auth/signup
  static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Validate password strength
      const passwordValidation = AuthService.validatePassword(password);
      if (!passwordValidation.valid) {
        throw new ValidationError(passwordValidation.errors.join(', '));
      }

      // Create user
      const user = await UserService.createUser(email, password, firstName, lastName);

      // Generate and send verification code
      const code = AuthService.generateAuthCode();
      await UserService.updateAuthCode(user.id, code);
      await EmailService.sendVerificationCode(email, code, firstName);

      sendSuccess(
        res,
        { userId: user.id, email: user.email },
        'Signup successful. Verification code sent to your email.',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/login
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await UserService.findByEmail(email);
      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Check if account is inactive
      if (user.inactive) {
        throw new AuthenticationError('Account is disabled');
      }

      // Check if account is locked
      const isLocked = await UserService.isAccountLocked(user.id);
      if (isLocked) {
        throw new AuthenticationError('Account is temporarily locked. Please try again later.');
      }

      // Verify password
      const isValid = await AuthService.comparePassword(password, user.password);
      if (!isValid) {
        // Record failed attempt
        await UserService.recordFailedAttempt(user.id);
        throw new AuthenticationError('Invalid email or password');
      }

      // Reset failed attempts on successful password verification
      await UserService.resetFailedAttempts(user.id);

      // Generate and send verification code
      const code = AuthService.generateAuthCode();
      await UserService.updateAuthCode(user.id, code);
      await EmailService.sendVerificationCode(email, code, user.first_name);

      sendSuccess(res,
        { userId: user.id, requiresVerification: true },
        'Verification code sent to your email'
      );
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/verify-code
  static async verifyCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, code } = req.body;

      // Verify code
      const isValid = await UserService.verifyAuthCode(userId, parseInt(code));
      if (!isValid) {
        throw new AuthenticationError('Invalid or expired verification code');
      }

      // Get user details
      const user = await UserService.findById(userId);

      // Generate tokens
      const userRole = (user.roles as any)?.role || 'USER';
      const accessToken = AuthService.generateAccessToken(
        user.id.toString(),
        user.email,
        userRole
      );
      const refreshToken = AuthService.generateRefreshToken(user.id.toString());

      // Set httpOnly cookies
      res.cookie('accessToken', accessToken, COOKIE_CONFIG);
      res.cookie('refreshToken', refreshToken, COOKIE_CONFIG);

      // Update last sign in
      await UserService.updateSignIn(userId);

      sendSuccess(res, {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: userRole
        },
        accessToken // Also return in body for mobile apps
      }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/resend-code
  static async resendCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.body;

      const user = await UserService.findById(userId);
      const code = AuthService.generateAuthCode();

      await UserService.updateAuthCode(userId, code);
      await EmailService.sendVerificationCode(user.email, code, user.first_name);

      sendSuccess(res, null, 'Verification code resent');
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/logout
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      sendSuccess(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/refresh-token
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        throw new AuthenticationError('No refresh token provided');
      }

      // Verify refresh token
      const decoded = AuthService.verifyRefreshToken(refreshToken);

      // Get user
      const user = await UserService.findById(decoded.userId);

      // Generate new access token
      const userRole = (user.roles as any)?.role || 'USER';
      const newAccessToken = AuthService.generateAccessToken(
        user.id.toString(),
        user.email,
        userRole
      );

      // Set new cookie
      res.cookie('accessToken', newAccessToken, COOKIE_CONFIG);

      sendSuccess(res, { accessToken: newAccessToken }, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/me
  static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.findById(req.user!.userId);
      const userRole = (user.roles as any)?.role || 'USER';

      sendSuccess(res, {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: userRole
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/password-reset-request
  static async passwordResetRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      const user = await UserService.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists
        return sendSuccess(res, null, 'If email exists, reset link has been sent');
      }

      // Generate reset token
      const resetToken = AuthService.generatePasswordResetToken();
      const hashedToken = AuthService.hashToken(resetToken);

      // Store hashed token with expiry (1 hour)
      await UserService.storeResetToken(user.id, hashedToken);

      // Send email
      await EmailService.sendPasswordResetEmail(user.email, resetToken, user.first_name);

      sendSuccess(res, null, 'Password reset link sent to your email');
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/password-reset-confirm
  static async passwordResetConfirm(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;

      // Hash token to compare with database
      const hashedToken = AuthService.hashToken(token);

      // Verify token from database and check expiry
      const userId = await UserService.verifyResetToken(hashedToken);
      if (!userId) {
        throw new AuthenticationError('Invalid or expired reset token');
      }

      // Validate password
      const passwordValidation = AuthService.validatePassword(password);
      if (!passwordValidation.valid) {
        throw new ValidationError(passwordValidation.errors.join(', '));
      }

      // Update password
      await UserService.updatePassword(userId, password);

      // Clear reset token
      await UserService.clearResetToken(userId);

      sendSuccess(res, null, 'Password reset successful');
    } catch (error) {
      next(error);
    }
  }
}
