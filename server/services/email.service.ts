// server/services/email.service.ts
import { transporter, EMAIL_CONFIG } from '../config/email.js';
import { supabase } from './supabase.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/errors.js';

export class EmailService {
  // Send verification code email
  static async sendVerificationCode(email: string, code: number, firstName?: string) {
    const subject = 'Your ZuZu Verification Code';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .code-box {
              background: #f4f4f4;
              padding: 20px;
              text-align: center;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .warning { color: #d9534f; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Hello ${firstName || 'there'}!</h2>
            <p>Your verification code is:</p>
            <div class="code-box">${code}</div>
            <p>This code will expire in <strong>5 minutes</strong>.</p>
            <p class="warning">If you didn't request this code, please ignore this email.</p>
            <p>Best regards,<br/>The ZuZu Team</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(email, subject, html, 'verification_code');
  }

  // Send password reset email
  static async sendPasswordResetEmail(email: string, resetToken: string, firstName?: string) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    const subject = 'Password Reset Request';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
            }
            .warning { color: #d9534f; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Hello ${firstName || 'there'}!</h2>
            <p>You requested to reset your password. Click the button below to proceed:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy this link: <br/>${resetUrl}</p>
            <p>This link will expire in <strong>1 hour</strong>.</p>
            <p class="warning">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
            <p>Best regards,<br/>The ZuZu Team</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(email, subject, html, 'password_reset');
  }

  // Generic send email with database logging
  private static async sendEmail(
    recipient: string,
    subject: string,
    html: string,
    type: string
  ) {
    // test config
    try {
      await transporter.verify();
      logger.info(`Server is ready to take our messages ${EMAIL_CONFIG.from}`);
    } catch (err) {
      logger.error(`Verification failed ${EMAIL_CONFIG.from}`, err);
    }
    // Send email
    try {
      // Send email via nodemailer
      const info = await transporter.sendMail({
        from: EMAIL_CONFIG.from,
        to: recipient,
        subject,
        html
      });

      // Log to database (emails table)
      await supabase
        .from('emails')
        .insert({
          type,
          recipient,
          subject,
          message: html,
          status: 'sent',
          sent_at: new Date().toISOString()
        });

      logger.info(`Email sent: ${type} to ${recipient}`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      logger.error(`Email send failed: ${error.message}`);

      // Log failed email to database
      await supabase
        .from('emails')
        .insert({
          type,
          recipient,
          subject,
          message: html,
          status: 'failed',
          error: error.message
        });

      throw new AppError('Failed to send email', 500);
    }
  }
}
