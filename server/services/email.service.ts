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

  // Send site contact form notification (generic — works for any microsite)
  static async sendSiteContactRequest(
    siteName: string,
    ownerEmail: string,
    userEmail: string,
    interest: string,
    notes?: string
  ) {
    const subject = `New Consultation Request — ${siteName}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #111;">New ${siteName} Consultation Request</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
              <tr>
                <td style="padding: 8px 12px; background: #f4f4f4; font-weight: bold; width: 140px;">Email</td>
                <td style="padding: 8px 12px; border: 1px solid #eee;">${userEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; background: #f4f4f4; font-weight: bold;">Interest</td>
                <td style="padding: 8px 12px; border: 1px solid #eee;">${interest}</td>
              </tr>
              ${notes ? `<tr>
                <td style="padding: 8px 12px; background: #f4f4f4; font-weight: bold; vertical-align: top;">Notes</td>
                <td style="padding: 8px 12px; border: 1px solid #eee; white-space: pre-wrap;">${notes}</td>
              </tr>` : ''}
            </table>
            <p style="margin-top: 24px; color: #666; font-size: 13px;">Submitted via ${siteName} contact form.</p>
          </div>
        </body>
      </html>
    `;
    // from must use the Mailgun-authorized domain; replyTo set to the submitter
    // so replies go directly to the lead
    return this.sendEmail(
      ownerEmail,
      subject,
      html,
      'site_contact',
      undefined,
      userEmail
    );
  }

  // Send event registration confirmation to registrant + owner notification
  static async sendEventRegistrationConfirmation(params: {
    eventId: string;
    eventTitle: string;
    location: string | null;
    locationUrl: string | null;
    startAt: string;
    registrantEmail: string;
    registrantName: string | null;
    registeredCount: number;
    maxCapacity: number | null;
    siteName: string;
    ownerEmail: string;
  }) {
    const {
      eventId, eventTitle, location, locationUrl, startAt,
      registrantEmail, registrantName, registeredCount, maxCapacity, siteName, ownerEmail
    } = params;

    const shortId = eventId.slice(-8).toUpperCase();
    const formattedDate = new Date(startAt).toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
    });
    const capacityLine = maxCapacity
      ? `${registeredCount} of ${maxCapacity} spots filled`
      : `${registeredCount} registered`;

    const confirmationHtml = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #111;">You're registered — see you there!</h2>
            <p>Hi ${registrantName || 'there'},</p>
            <p>Your spot at <strong>${eventTitle}</strong> is confirmed.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr>
                <td style="padding: 8px 12px; background: #f4f4f4; font-weight: bold; width: 140px;">Reference</td>
                <td style="padding: 8px 12px; border: 1px solid #eee; font-family: monospace;">#${shortId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; background: #f4f4f4; font-weight: bold;">Date</td>
                <td style="padding: 8px 12px; border: 1px solid #eee;">${formattedDate}</td>
              </tr>
              ${location ? `<tr>
                <td style="padding: 8px 12px; background: #f4f4f4; font-weight: bold;">Location</td>
                <td style="padding: 8px 12px; border: 1px solid #eee;">
                  ${locationUrl ? `<a href="${locationUrl}" style="color: #0066cc;">${location}</a>` : location}
                </td>
              </tr>` : ''}
              <tr>
                <td style="padding: 8px 12px; background: #f4f4f4; font-weight: bold;">Attendance</td>
                <td style="padding: 8px 12px; border: 1px solid #eee;">${capacityLine}</td>
              </tr>
            </table>
            <p style="margin-top: 24px; color: #666; font-size: 13px;">Registered via ${siteName}. Reply to this email with any questions.</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(registrantEmail, `You're registered: ${eventTitle}`, confirmationHtml, 'event_confirmation', undefined, ownerEmail);

    const notifyHtml = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #111;">New Registration — ${eventTitle}</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr>
                <td style="padding: 8px 12px; background: #f4f4f4; font-weight: bold; width: 140px;">Reference</td>
                <td style="padding: 8px 12px; border: 1px solid #eee; font-family: monospace;">#${shortId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; background: #f4f4f4; font-weight: bold;">Name</td>
                <td style="padding: 8px 12px; border: 1px solid #eee;">${registrantName || '—'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; background: #f4f4f4; font-weight: bold;">Email</td>
                <td style="padding: 8px 12px; border: 1px solid #eee;">${registrantEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; background: #f4f4f4; font-weight: bold;">Attendance</td>
                <td style="padding: 8px 12px; border: 1px solid #eee;">${capacityLine}</td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `;
    await this.sendEmail(ownerEmail, `New registration: ${eventTitle} (#${shortId})`, notifyHtml, 'event_registration_notify', undefined, registrantEmail);
  }

  // Generic send email with database logging
  private static async sendEmail(
    recipient: string,
    subject: string,
    html: string,
    type: string,
    from?: string,
    replyTo?: string
  ) {
    // test config
    /*
    try {
      await transporter.verify();
      logger.info(`Server is ready to take our messages ${EMAIL_CONFIG.from}`);
    } catch (err) {
      logger.error(`Verification failed ${EMAIL_CONFIG.from}`, err);
    }
    */
    // Send email
    try {
      // Send email via nodemailer
      logger.info(`Sending email: ${type} to ${recipient}`);
      const info = await transporter.sendMail({
        from: from || EMAIL_CONFIG.from,
        to: recipient,
        replyTo: replyTo || EMAIL_CONFIG.replyTo,
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Email send failed: ${errorMessage}`);

      // Log failed email to database
      await supabase
        .from('emails')
        .insert({
          type,
          recipient,
          subject,
          message: html,
          status: 'failed',
          error: errorMessage
        });

      throw new AppError('Failed to send email', 500);
    }
  }
}
