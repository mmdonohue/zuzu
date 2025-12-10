// server/services/user.service.ts
import { supabase } from './supabase.js';
import { AuthService } from './auth.service.js';
import { NotFoundError, ValidationError, DatabaseError } from '../utils/errors.js';

export class UserService {
  // Create new user
  static async createUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) {
    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      throw new ValidationError('Email already registered');
    }

    // Hash password
    const hashedPassword = await AuthService.hashPassword(password);

    // Get default USER role (rank 4)
    const { data: role } = await supabase
      .from('roles')
      .select('id')
      .eq('rank', 4)
      .single();

    // Insert user
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role_id: role?.id,
        inactive: false
      })
      .select('id, email, first_name, last_name, role_id')
      .single();

    if (error) throw new DatabaseError(error.message);
    return data;
  }

  // Find user by email
  static async findByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*, roles(role, rank)')
      .eq('email', email)
      .single();

    if (error || !data) return null;
    return data;
  }

  // Find user by ID
  static async findById(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, roles(role, rank), inactive')
      .eq('id', userId)
      .single();

    if (error || !data) throw new NotFoundError('User not found');
    return data;
  }

  // Update auth code
  static async updateAuthCode(userId: string, code: number) {
    const { error } = await supabase
      .from('users')
      .update({
        auth_code: code,
        auth_code_sent: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw new DatabaseError(error.message);
  }

  // Verify auth code (must be within 5 minutes)
  static async verifyAuthCode(userId: string, code: number): Promise<boolean> {
    const { data } = await supabase
      .from('users')
      .select('auth_code, auth_code_sent')
      .eq('id', userId)
      .single();

    if (!data || data.auth_code !== code) return false;

    // Check if code expired (5 minutes)
    const sentAt = new Date(data.auth_code_sent);
    const now = new Date();
    const diffMinutes = (now.getTime() - sentAt.getTime()) / 1000 / 60;

    if (diffMinutes > 5) return false;

    // Clear auth code after successful verification
    await supabase
      .from('users')
      .update({ auth_code: null, auth_code_sent: null })
      .eq('id', userId);

    return true;
  }

  // Update last sign in
  static async updateSignIn(userId: string) {
    await supabase
      .from('users')
      .update({ signed_in: new Date().toISOString() })
      .eq('id', userId);
  }

  // Update password
  static async updatePassword(userId: string, newPassword: string) {
    const hashedPassword = await AuthService.hashPassword(newPassword);

    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', userId);

    if (error) throw new DatabaseError(error.message);
  }

  // Store password reset token
  static async storeResetToken(userId: string, hashedToken: string) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    const { error } = await supabase
      .from('users')
      .update({
        reset_token: hashedToken,
        reset_token_expires: expiresAt.toISOString()
      })
      .eq('id', userId);

    if (error) throw new DatabaseError(error.message);
  }

  // Verify password reset token
  static async verifyResetToken(hashedToken: string): Promise<string | null> {
    const { data } = await supabase
      .from('users')
      .select('id, reset_token_expires')
      .eq('reset_token', hashedToken)
      .single();

    if (!data) return null;

    // Check if token expired
    const expiresAt = new Date(data.reset_token_expires);
    const now = new Date();

    if (now > expiresAt) {
      // Clear expired token
      await supabase
        .from('users')
        .update({ reset_token: null, reset_token_expires: null })
        .eq('id', data.id);
      return null;
    }

    return data.id;
  }

  // Clear password reset token
  static async clearResetToken(userId: string) {
    await supabase
      .from('users')
      .update({ reset_token: null, reset_token_expires: null })
      .eq('id', userId);
  }

  // Record failed login attempt
  static async recordFailedAttempt(userId: string) {
    const { data: user } = await supabase
      .from('users')
      .select('failed_attempts')
      .eq('id', userId)
      .single();

    if (!user) return;

    const attempts = (user.failed_attempts || 0) + 1;

    // Lock account after 5 failed attempts
    if (attempts >= 5) {
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + 15); // Lock for 15 minutes

      await supabase
        .from('users')
        .update({
          failed_attempts: attempts,
          locked_until: lockedUntil.toISOString()
        })
        .eq('id', userId);
    } else {
      await supabase
        .from('users')
        .update({ failed_attempts: attempts })
        .eq('id', userId);
    }
  }

  // Reset failed attempts on successful login
  static async resetFailedAttempts(userId: string) {
    await supabase
      .from('users')
      .update({
        failed_attempts: 0,
        locked_until: null
      })
      .eq('id', userId);
  }

  // Check if account is locked
  static async isAccountLocked(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('users')
      .select('locked_until')
      .eq('id', userId)
      .single();

    if (!data || !data.locked_until) return false;

    const lockedUntil = new Date(data.locked_until);
    const now = new Date();

    // If lock period has expired, clear it
    if (now > lockedUntil) {
      await this.resetFailedAttempts(userId);
      return false;
    }

    return true;
  }
}
