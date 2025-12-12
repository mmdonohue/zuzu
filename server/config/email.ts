// server/config/email.ts
import { log } from 'console';
import nodemailer from 'nodemailer';

const mailcreds = {
  host: 'smtp.mailgun.org',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
};


export const transporter = nodemailer.createTransport(mailcreds);

export const EMAIL_CONFIG = {
  from: process.env.SMTP_FROM || 'ZuZu Auth <noreply@zuzu.com>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@zuzu.com'
};
