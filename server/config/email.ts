// server/config/email.ts
import { log } from 'console';
import nodemailer from 'nodemailer';

const mailcreds = {
  host: process.env.SMTP_HOST || 'smtp.mailgun.org',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  logger: true,
  debug: true,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  tls: {
    rejectUnauthorized: false
  }
};


export const transporter = nodemailer.createTransport(mailcreds);

export const EMAIL_CONFIG = {
  from: process.env.SMTP_FROM || 'ZuZu Auth <noreply@zuzu.com>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@zuzu.com'
};
