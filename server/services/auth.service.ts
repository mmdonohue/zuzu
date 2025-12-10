// server/services/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { JWT_CONFIG } from '../config/jwt.js';
import { AuthenticationError } from '../utils/errors.js';

export class AuthService {
  // Hash password using bcrypt (salt rounds: 12)
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // Compare password with hash
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate 6-digit auth code
  static generateAuthCode(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }

  // Generate JWT access token (15 min expiry)
  static generateAccessToken(userId: string, email: string, role: string): string {
    const payload = { userId, email, role, type: 'access' };
    return jwt.sign(payload, JWT_CONFIG.accessTokenSecret, {
      expiresIn: JWT_CONFIG.accessTokenExpiry,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    } as SignOptions);
  }

  // Generate JWT refresh token (7 day expiry)
  static generateRefreshToken(userId: string): string {
    const payload = { userId, type: 'refresh' };
    return jwt.sign(payload, JWT_CONFIG.refreshTokenSecret, {
      expiresIn: JWT_CONFIG.refreshTokenExpiry,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    } as SignOptions);
  }

  // Verify access token
  static verifyAccessToken(token: string): any {
    try {
      return jwt.verify(token, JWT_CONFIG.accessTokenSecret, {
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience
      });
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, JWT_CONFIG.refreshTokenSecret, {
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience
      });
    } catch (error) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }
  }

  // Generate password reset token (32 bytes, hex)
  static generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Hash password reset token for storage
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Validate password strength
  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return { valid: errors.length === 0, errors };
  }
}
