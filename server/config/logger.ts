// server/config/logger.ts
import log4js from 'log4js';
import path from 'path';
import fs from 'fs';

// Get the actual directory path - adjust based on where your compiled server runs from
const logsDir = path.join(process.cwd(), 'logs');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  console.log('Creating logs directory at:', logsDir);
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFilePath = path.join(logsDir, 'app.log');
console.log('Log file will be written to:', logFilePath);

log4js.configure({
  appenders: {
    console: {
      type: 'console'
    },
    file: {
      type: 'file',
      filename: logFilePath,
      maxLogSize: 10485760, // 10MB
      backups: 5,
      compress: true,
      layout: { type: 'json' }
    }
  },
  categories: {
    default: {
      appenders: ['console', 'file'],
      level: 'info'
    },
    http: {
      appenders: ['console', 'file'],
      level: 'info'
    },
    error: {
      appenders: ['console', 'file'],
      level: 'error'
    }
  }
});

export const logger = log4js.getLogger();
export const httpLogger = log4js.getLogger('http');
export const errorLogger = log4js.getLogger('error');

// Test log on initialization
logger.info('Logger initialized successfully');

export default logger;