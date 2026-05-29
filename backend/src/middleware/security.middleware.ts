import helmet from 'helmet';
import cors from 'cors';
import { Request, Response, NextFunction, Application } from 'express';
import { config } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Configure and return helmet middleware with hardened CSP.
 *
 * Security headers set:
 *   X-Frame-Options: DENY
 *   X-Content-Type-Options: nosniff
 *   Strict-Transport-Security: max-age=31536000; includeSubDomains
 *   Content-Security-Policy: default-src 'self'
 *   X-XSS-Protection: 0 (disabled in favor of CSP)
 *   Referrer-Policy: strict-origin-when-cross-origin
 */
export const helmetMiddleware = helmet({
  // Content-Security-Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  // X-Frame-Options: DENY — prevent clickjacking
  frameguard: { action: 'deny' },
  // X-Content-Type-Options: nosniff — prevent MIME-type sniffing
  noSniff: true,
  // Strict-Transport-Security — enforce HTTPS
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  // Hide X-Powered-By header
  hidePoweredBy: true,
  // Referrer-Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // Cross-Origin-Resource-Policy — allow API same-origin responses
  crossOriginResourcePolicy: { policy: 'same-origin' },
  // Cross-Origin-Opener-Policy
  crossOriginOpenerPolicy: { policy: 'same-origin' },
});

/**
 * Configure CORS with strict origin whitelist.
 *
 * - Only allows the frontend URL from env
 * - Allows credentials (cookies, Authorization header)
 * - Pre-flight cache: 600 seconds
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = config.cors.origin
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    // Allow requests with no origin (server-to-server, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS request blocked from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600, // Pre-flight cache: 10 minutes
});

/**
 * Request logger middleware.
 * Logs every incoming HTTP request with method, URL, status code, duration, and IP.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: (req as any).user?.id || undefined,
    };

    if (res.statusCode >= 500) {
      logger.error('Request completed with server error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed with client error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

/**
 * Content-Type enforcement middleware.
 * Blocks POST/PUT/PATCH requests that claim to be JSON but send malformed content-type.
 */
export const contentTypeGuard = (req: Request, res: Response, next: NextFunction): void => {
  const methodsRequiringBody = ['POST', 'PUT', 'PATCH'];

  if (methodsRequiringBody.includes(req.method) && req.headers['content-length'] && parseInt(req.headers['content-length']) > 0) {
    const contentType = req.headers['content-type'];

    // If body exists but no content-type, block it
    if (!contentType) {
      res.status(415).json({
        success: false,
        message: 'Content-Type header is required for requests with a body.',
        code: 'MISSING_CONTENT_TYPE',
      });
      return;
    }
  }

  next();
};

/**
 * Apply all security middlewares to an Express application in the correct order.
 */
export const applySecurityMiddleware = (app: Application): void => {
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(contentTypeGuard);
  app.use(requestLogger);
};
