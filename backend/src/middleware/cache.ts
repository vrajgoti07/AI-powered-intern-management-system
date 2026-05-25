import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';

export const cacheMiddleware = (ttlSeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        console.log("CACHE HIT: " + key);
        res.status(200).json(JSON.parse(cached));
        return;
      }

      console.log("CACHE MISS: " + key);

      const originalJson = res.json;
      res.json = function (body) {
        res.json = originalJson;

        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis.set(key, JSON.stringify(body), 'EX', ttlSeconds).catch((err) => {
            console.error(`Failed to cache response for key ${key}:`, err);
          });
        }

        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      console.error(`Cache Middleware error for key ${key}:`, error);
      next();
    }
  };
};

export default cacheMiddleware;
