// server/services/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import { JWT_CONFIG } from '../config/jwt.js';
import { AuthenticationError } from '../utils/errors.js';

type JwtAccessTokenPayload = JwtPayload & {
  userId: string;
  email: string;
  role: string;
  type: 'access';
};

type JwtRefreshTokenPayload = JwtPayload & {
  userId: string;
  type: 'refresh';
};

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
  // Math.random() is not cryptographically secure but sufficient for this purpose
  // SECURITY-IGNORE: This is for authentication codes, not for cryptographic keys
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
  static verifyAccessToken(token: string): JwtAccessTokenPayload {
    try {
      const payload = jwt.verify(token, JWT_CONFIG.accessTokenSecret, {
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience
      });
      return payload as JwtAccessTokenPayload;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): JwtRefreshTokenPayload {
    try {
      const payload = jwt.verify(token, JWT_CONFIG.refreshTokenSecret, {
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience
      });
      return payload as JwtRefreshTokenPayload;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }
  }

  // Generate password reset token (32 bytes, hex)
  // Random bytes count may be too low for security-sensitive uses
  // SECURITY-IGNORE: This is for password reset tokens, not cryptographic keys
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
