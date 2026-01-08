// server/index.ts
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import apiRoutes from "./routes/api.js";
import openRouterRoutes from "./routes/openrouter.js";
import logRoutes from "./routes/logs.js";
import authRoutes from "./routes/auth.routes.js";
import reviewRoutes from "./routes/review.js";
import csrfRoutes from "./routes/csrf.js";
import templateRoutes from "./routes/templates.js";
import styleGuideRoutes from "./routes/styleGuides.js";
import leetmasterRoutes from "./routes/leetmaster.js";
import { logger, httpLogger } from "./config/logger.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import { apiLimiter } from "./middleware/rateLimiter.middleware.js";
import {
  csrfProtection,
  csrfErrorHandler,
} from "./middleware/csrf.middleware.js";

const currDir = path.resolve();

console.log("Current directory:", currDir);
console.log("Looking for routes in:", path.join(currDir, "routes", "api.js"));

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", true);

// Security headers
app.use(helmet());

// Cookie parser
app.use(cookieParser());

// Ensure logs directory exists at project root
const logsDir = path.join(process.cwd(), "logs");
console.log("Logs directory path:", logsDir);

if (!fs.existsSync(logsDir)) {
  console.log("Creating logs directory...");
  fs.mkdirSync(logsDir, { recursive: true });
  console.log("Logs directory created");
} else {
  console.log("Logs directory already exists");
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

// Custom Morgan token for session ID tracking
morgan.token("sess-id", (req: express.Request) => {
  // Try to get session ID from accessToken cookie first, then refreshToken
  const accessToken = req.cookies?.accessToken;
  const refreshToken = req.cookies?.refreshToken;
  const sessionSource = accessToken || refreshToken;

  if (!sessionSource) {
    return "-";
  }

  // Create MD5 hash and take first 8 characters for shorter session ID
  const hash = crypto.createHash("md5").update(sessionSource).digest("hex");
  return hash.substring(0, 8);
});

// Custom Morgan token for username from JWT
morgan.token("username", (req: express.Request) => {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    return "-";
  }

  try {
    // Decode JWT without verification (just for logging purposes)
    const decoded = jwt.decode(accessToken) as {
      email?: string;
      userId?: string;
    } | null;

    if (decoded && decoded.email) {
      return decoded.email;
    }

    return "-";
  } catch (error) {
    // If decode fails, return dash
    return "-";
  }
});

const jsonFormat =
  '[[[{"remote_addr": ":remote-addr", "remote_user": ":username", "date": ":date[clf]", "method": ":method", "url": ":url", "http_version": ":http-version", "status": ":status", "result_length": ":res[content-length]", "referrer": ":referrer", "user_agent": ":user-agent", "response_time": ":response-time", "sess_id": ":sess-id"}]]]';
const combinedFormat =
  ':real-ip - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';
app.use(
  morgan(jsonFormat, {
    skip: (req, res) => {
      // Skip logging for specific routes
      if (
        ["/files", "/current", "/hello", "/me", "/health", "/favicon.ico"].some(
          (pathPart) => req.path.includes(pathPart),
        )
      ) {
        // console.log('Skipping logging for path:', req.path);
        return true;
      }
      return false;
    },
    stream: {
      write: (message: string) => {
        httpLogger.info(message.trim());
      },
    },
  }),
);

// Middleware
// Build allowed origins list
const allowedOrigins: string[] = ["http://localhost:3000"];

// Add production frontend URL if set
if (process.env.PRODUCTION_FRONTEND_URL) {
  allowedOrigins.push(process.env.PRODUCTION_FRONTEND_URL);
}

// Add any additional origins from ALLOWED_ORIGINS
if (process.env.ALLOWED_ORIGINS) {
  const additionalOrigins = process.env.ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  allowedOrigins.push(...additionalOrigins);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
      "CSRF-Token",
    ],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (
    process.env.NODE_ENV === "production" &&
    req.headers["x-forwarded-proto"] !== "https"
  ) {
    return res.redirect("https://" + req.headers.host + req.url);
  }
  next();
});

// Add username to request headers for downstream middleware
app.use((req, _res, next) => {
  const accessToken = req.cookies?.accessToken;

  if (accessToken) {
    try {
      const decoded = jwt.decode(accessToken) as {
        email?: string;
        userId?: string;
      } | null;
      if (decoded && decoded.email) {
        // Add username to headers for downstream use
        req.headers["x-user-email"] = decoded.email;
      }
    } catch (error) {
      // If decode fails, skip setting header
    }
  }

  next();
});

app.use((req, res, next) => {
  if (req.method === "POST") {
    // Generate session ID for logging (same logic as Morgan token)
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;
    const sessionSource = accessToken || refreshToken;
    const sessId = sessionSource
      ? crypto
          .createHash("md5")
          .update(sessionSource)
          .digest("hex")
          .substring(0, 8)
      : "-";

    // Extract username from JWT (same logic as Morgan token)
    let username = "-";
    if (accessToken) {
      try {
        const decoded = jwt.decode(accessToken) as {
          email?: string;
          userId?: string;
        } | null;
        if (decoded && decoded.email) {
          username = decoded.email;
        }
      } catch (error) {
        // If decode fails, keep default '-'
      }
    }

    // replace any password fields in the body with ****
    if (
      Object.keys(req.body).length > 0 &&
      [
        "/api/auth/login",
        "/api/auth/signup",
        "/api/auth/refresh-token",
      ].indexOf(req.path) < 0
    ) {
      const sanitizedBody = JSON.parse(
        JSON.stringify(req.body),
        (key, value) => {
          if (key === "password") return "****";
          return value;
        },
      );
      // Add sess_id and username to sanitized body for log tracing
      const bodyWithMetadata = {
        ...sanitizedBody,
        sess_id: sessId,
        username: username,
      };
      logger.info(
        `POST ${req.path} - Body: [[[${JSON.stringify(bodyWithMetadata)}]]]`,
      );
    } else if (["/api/auth/refresh-token"].indexOf(req.path) < 0) {
      logger.info(
        `POST ${req.path} - sess_id: ${sessId}, username: ${username}`,
      );
    }
  }
  next();
});

// API rate limiting
app.use("/api", apiLimiter);

// CSRF token endpoint (must be before CSRF protection)
app.use("/api", csrfRoutes);

// Apply CSRF protection to all routes except GET/HEAD/OPTIONS
// Note: The CSRF middleware automatically skips GET, HEAD, OPTIONS methods
app.use("/api", csrfProtection);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", apiRoutes);
app.use("/api/openrouter", openRouterRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/style-guides", styleGuideRoutes);
app.use("/api/leetmaster", leetmasterRoutes);

// Health check endpoint
app.get("/health", (_req, res) => {
  logger.info("Health check requested");
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ message: "Route not found" });
});

// CSRF error handler (before general error handler)
app.use(csrfErrorHandler);

// Centralized error handler (must be last)
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(
    "/********************************* SERVER *********************************************/",
  );
  logger.info(`Server running on http://localhost:${PORT}`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(
    "/********************************* SERVER *********************************************/",
  );
  // Test that logging is working
  logger.info("Test log entry - server started successfully");
  logger.warn("Test warning log");
  logger.error("Test error log");
});
