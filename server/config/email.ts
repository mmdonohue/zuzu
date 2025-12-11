// server/config/email.ts
import nodemailer from 'nodemailer';

const port = parseInt(process.env.SMTP_PORT || '587');

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailgun.org',
  port: port,
  secure: port === 465, // true for 465 (implicit TLS), false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  // Add timeout and connection logging
  connectionTimeout: 10000, // 10 seconds
  logger: true,
  debug: process.env.NODE_ENV !== 'production'
});

export const EMAIL_CONFIG = {
  from: process.env.SMTP_FROM || 'ZuZu Auth <noreply@zuzu.com>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@zuzu.com'
};
