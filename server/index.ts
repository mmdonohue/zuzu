// server/index.ts
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import apiRoutes from './routes/api.js';
import openRouterRoutes from './routes/openrouter.js';
import logRoutes from './routes/logs.js';
import authRoutes from './routes/auth.routes.js';
import { logger, httpLogger } from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import { apiLimiter } from './middleware/rateLimiter.middleware.js';

const currDir = path.resolve();

console.log('Current directory:', currDir);
console.log('Looking for routes in:', path.join(currDir, 'routes', 'api.js'));

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', true);

// Security headers
app.use(helmet());

// Cookie parser
app.use(cookieParser());

// Ensure logs directory exists at project root
const logsDir = path.join(process.cwd(), 'logs');
console.log('Logs directory path:', logsDir);

if (!fs.existsSync(logsDir)) {
  console.log('Creating logs directory...');
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('Logs directory created');
} else {
  console.log('Logs directory already exists');
}

// Morgan logger setup - custom format that outputs to log4js

/*
morgan.token('real-ip', (req) => {
  // Check various headers for the real client IP
  return req.headers['x-forwarded-for'] as string || 
         req.headers['x-real-ip'] as string || 
         req.socket.remoteAddress || 
         'unknown';
});
*/

const jsonFormat = '[[[{"remote_addr": ":remote-addr", "remote_user": ":remote-user", "date": ":date[clf]", "method": ":method", "url": ":url", "http_version": ":http-version", "status": ":status", "result_length": ":res[content-length]", "referrer": ":referrer", "user_agent": ":user-agent", "response_time": ":response-time"}]]]';
const combinedFormat = ':real-ip - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';
app.use(morgan(
  jsonFormat,
  {
    skip: (req, res) => {
      // Skip logging for specific routes
      if(['/files', '/current', '/hello', '/me', '/refresh-token' , '/health', '/favicon.ico'].some(pathPart => req.path.includes(pathPart))) {
        // console.log('Skipping logging for path:', req.path);
        return true;
      }
      return false;
    },
    stream: {
      write: (message: string) => {
        httpLogger.info(message.trim());
      }
    }
  }
));

// Middleware
// Build allowed origins list
const allowedOrigins: string[] = ['http://localhost:3000'];

// Add production frontend URL if set
if (process.env.PRODUCTION_FRONTEND_URL) {
  allowedOrigins.push(process.env.PRODUCTION_FRONTEND_URL);
}

// Add any additional origins from ALLOWED_ORIGINS
if (process.env.ALLOWED_ORIGINS) {
  const additionalOrigins = process.env.ALLOWED_ORIGINS.split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);
  allowedOrigins.push(...additionalOrigins);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
  if(req.method === 'POST') {
    if(Object.keys(req.body).length > 0) {
      logger.info(`POST ${req.path} - Body: [[[${JSON.stringify(req.body)}]]]`);
    }
    else {
      logger.info(`POST ${req.path}`);
    }
  }
  next();
});

// API rate limiting
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/openrouter', openRouterRoutes);
app.use('/api/logs', logRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  logger.info('Health check requested');
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ message: 'Route not found' });
});

// Centralized error handler (must be last)
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log('/********************************* SERVER *********************************************/');
  logger.info(`Server running on http://localhost:${PORT}`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('/********************************* SERVER *********************************************/');
    // Test that logging is working
  logger.info('Test log entry - server started successfully');
  logger.warn('Test warning log');
  logger.error('Test error log');
});

