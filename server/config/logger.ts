// server/config/logger.ts
import log4js from 'log4js';
import path from 'path';
import fs from 'fs';

const isVercel = !!process.env.VERCEL;

// Only write to filesystem locally — Vercel has a read-only filesystem
const appenders: string[] = ['console'];

if (!isVercel) {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    console.log('Creating logs directory at:', logsDir);
    fs.mkdirSync(logsDir, { recursive: true });
  }
  const logFilePath = path.join(logsDir, 'app.log');
  console.log('Log file will be written to:', logFilePath);
  log4js.configure({
    appenders: {
      console: { type: 'console' },
      file: { type: 'file', filename: logFilePath, maxLogSize: 10485760, backups: 5, compress: true }
    },
    categories: {
      default: { appenders: ['console', 'file'], level: 'info' },
      http: { appenders: ['console', 'file'], level: 'info' },
      error: { appenders: ['console', 'file'], level: 'error' }
    }
  });
} else {
  log4js.configure({
    appenders: { console: { type: 'console' } },
    categories: {
      default: { appenders: ['console'], level: 'info' },
      http: { appenders: ['console'], level: 'info' },
      error: { appenders: ['console'], level: 'error' }
    }
  });
}

export const logger = log4js.getLogger();
export const httpLogger = log4js.getLogger('http');
export const errorLogger = log4js.getLogger('error');

// Test log on initialization
logger.info('Logger initialized successfully');

export default logger;