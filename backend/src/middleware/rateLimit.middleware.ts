import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { config } from '../config/env';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import redisClient from '../config/redis';

/**
 * Standard 429 response body factory.
 */
const rateLimitResponse = (message: string) => ({
  success: false,
  message,
  code: 'RATE_LIMIT_EXCEEDED',
  timestamp: new Date().toISOString(),
});

// ──────────────────────────────────────
// 1. Global API Rate Limiter
//    100 requests per 15 minutes per IP
//    Uses in-memory store — reliable on single Render instance.
//    Redis store was causing crashes (EVALSHA init errors, quota exceeded).
// ──────────────────────────────────────
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: rateLimitResponse('Too many requests from this IP. Please try again later.'),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.path === '/' || req.path === '/health',
});

// ──────────────────────────────────────
// 2. Auth Routes Rate Limiter
//    Max 5 failed attempts per 5 minutes per (email + role)
//    Always uses in-memory store.
// ──────────────────────────────────────
const memoryStore = new Map<string, { attempts: number; expiry: number }>();

export const authLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const email = req.body?.email;
  const role = req.body?.role || 'unknown';

  if (!email) return next();

  const key = `login_attempts:${role}:${email}`;
  const isRedisReady = redisClient.status === 'ready';

  try {
    let attempts = 0;

    if (isRedisReady) {
      try {
        const redisAttempts = await redisClient.get(key);
        attempts = redisAttempts ? parseInt(redisAttempts, 10) : 0;
      } catch {
        const record = memoryStore.get(key);
        if (record && Date.now() < record.expiry) attempts = record.attempts;
      }
    } else {
      const record = memoryStore.get(key);
      if (record && Date.now() < record.expiry) {
        attempts = record.attempts;
      } else if (record) {
        memoryStore.delete(key);
      }
    }

    if (attempts >= 5) {
      logger.warn(`ACCOUNT LOCKED for ${role}:${email}`);
      res.status(429).json({
        success: false,
        message: 'Too many failed login attempts. Please try again after 5 minutes.',
        code: 'RATE_LIMIT_EXCEEDED',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.on('finish', async () => {
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
      const isFailure = res.statusCode >= 400;

      try {
        if (isSuccess) {
          if (isRedisReady) {
            await redisClient.del(key).catch(() => {});
          } else {
            memoryStore.delete(key);
          }
          logger.info(`LOGIN SUCCESS for ${role}:${email}`);
        } else if (isFailure) {
          if (isRedisReady) {
            try {
              const currentAttempts = await redisClient.incr(key);
              if (currentAttempts === 1) await redisClient.expire(key, 300);
              logger.warn(`LOGIN FAILED for ${role}:${email}. Attempt ${currentAttempts}`);
            } catch {
              const record = memoryStore.get(key) || { attempts: 0, expiry: Date.now() + 300_000 };
              record.attempts += 1;
              memoryStore.set(key, record);
              logger.warn(`LOGIN FAILED for ${role}:${email}. Attempt ${record.attempts}`);
            }
          } else {
            const record = memoryStore.get(key) || { attempts: 0, expiry: Date.now() + 300_000 };
            record.attempts += 1;
            memoryStore.set(key, record);
            logger.warn(`LOGIN FAILED for ${role}:${email}. Attempt ${record.attempts}`);
          }
        }
      } catch (err) {
        logger.error('Error updating auth rate limit', err);
      }
    });

    next();
  } catch (error) {
    logger.error('Error in authLimiter', error);
    next();
  }
};

// ──────────────────────────────────────
// 3. Password Reset Rate Limiter
//    100 requests per hour per IP
// ──────────────────────────────────────
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: rateLimitResponse('Too many password reset attempts. Please try again after 1 hour.'),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// ──────────────────────────────────────
// 4. AI Routes Rate Limiter
//    20 requests per minute per user
// ──────────────────────────────────────
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: rateLimitResponse('AI request limit reached. Please wait a moment before trying again.'),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return (req as any).user?.id || ipKeyGenerator(req.ip ?? '127.0.0.1');
  },
  validate: { keyGeneratorIpFallback: false },
});

// ──────────────────────────────────────
// 5. Public Profile Rate Limiter
//    100 requests per minute per IP
// ──────────────────────────────────────
export const publicProfileLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: rateLimitResponse('Too many profile requests. Please try again shortly.'),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
