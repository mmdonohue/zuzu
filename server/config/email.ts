// server/config/email.ts
import { log } from 'console';
import nodemailer from 'nodemailer';

const mailcreds = {
  host: process.env.SMTP_HOST || 'mg.seravanna.com',
  port: process.env.SMTP_PORT || 465,
  secure: true,
  authMethod: process.env.SMTP_AUTH_METHOD || 'LOGIN',
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASSWORD || 'password',
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  logger: true,
  debug: false
};


export const transporter = nodemailer.createTransport(mailcreds);

export const EMAIL_CONFIG = {
  from: process.env.SMTP_FROM || 'ZuZu Auth <noreply@zuzu.com>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@zuzu.com'
};
