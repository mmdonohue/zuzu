// server/config/email.ts
import nodemailer from 'nodemailer';

const mailcreds = {
  host: process.env.SMTP_HOST || 'mg.seravanna.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASSWORD || 'password',
  }
};


export const transporter = nodemailer.createTransport(mailcreds);

export const EMAIL_CONFIG = {
  from: process.env.SMTP_FROM || 'ZuZu Auth <noreply@zuzu.com>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@zuzu.com'
};
