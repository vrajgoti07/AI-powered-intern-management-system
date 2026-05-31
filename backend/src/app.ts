
import express, { Application } from 'express';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import { apiLimiter } from './middleware/rateLimit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { applySecurityMiddleware } from './middleware/security.middleware';
import routes from './routes';
import './config/redis';
import path from 'path';
import { serverAdapter } from './queues/queue.config';


/**
 * Create Express Application
 */
const createApp = (): Application => {
  const app = express();

  // ── 0. Trust Proxy (Required for Render/Reverse Proxies) ──
  app.set('trust proxy', 1);

  // ── 1. Security Middleware (helmet, CORS, request logger, content-type guard) ──
  applySecurityMiddleware(app);

  // ── 2. Body Parsing (with size limits) ──
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── 3. Cookie Parser ──
  app.use(cookieParser());

  // ── 4. Serve static uploads ──
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // ── 5. Global Rate Limiting ──
  app.use(apiLimiter);

  // ── 6. API Routes ──
  app.use(`/api/${config.server.apiVersion}`, routes);

  // ── 6.5 Bull Board (Password protected) ──
  app.use('/admin/queues', (req, res, next) => {
    // Basic auth for queues
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');
    
    // In production, use env vars for admin credentials
    if (login === 'admin' && password === (process.env.ADMIN_QUEUE_PASS || 'admin')) {
      return next();
    }
    
    res.set('WWW-Authenticate', 'Basic realm="401"');
    res.status(401).send('Authentication required.');
  }, serverAdapter.getRouter());


  // ── 7. Root health endpoint ──
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'AI-Powered Intern Management System API',
      version: config.server.apiVersion,
      documentation: `/api/${config.server.apiVersion}/health`,
    });
  });

  // ── 8. 404 handler (AFTER all routes) ──
  app.use(notFoundHandler);

  // ── 9. Global error handler (MUST be LAST middleware) ──
  app.use(errorHandler);

  return app;
};

export default createApp;
