import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache.service';
import { logger } from '../utils/logger';

/**
 * Middleware to cache HTTP responses using Redis
 * @param ttlSeconds Time to live in seconds
 * @param customKeyGenerator Optional function to generate a custom cache key
 */
export const cacheMiddleware = (
  ttlSeconds: number = 300,
  customKeyGenerator?: (req: Request) => string
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const key = customKeyGenerator ? customKeyGenerator(req) : `cache:${req.originalUrl || req.url}`;

    try {
      // Check if data exists in cache
      const cachedData = await cacheService.get<any>(key);

      if (cachedData) {
        logger.info(`Cache hit for ${key}`);
        res.status(200).json(cachedData);
        return;
      }

      // If not in cache, intercept the res.json to save the response
      const originalJson = res.json;
      res.json = function (body) {
        // Restore original res.json to prevent infinite loops
        res.json = originalJson;

        // Only cache successful responses (2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(key, body, ttlSeconds).catch(err => {
            logger.error(`Failed to cache response for ${key}:`, err);
          });
        }

        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      logger.error(`Cache Middleware Error for ${key}:`, error);
      next(); // Continue even if cache fails
    }
  };
};

export default cacheMiddleware;
