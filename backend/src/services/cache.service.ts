import redis from '../config/redis';
import { logger } from '../utils/logger';

class CacheService {
  /**
   * Set cache with expiry
   */
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      const data = JSON.stringify(value);
      await redis.set(key, data, 'EX', ttlSeconds);
    } catch (error) {
      logger.error(`Redis Cache Set Error [${key}]:`, error);
    }
  }

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error(`Redis Cache Get Error [${key}]:`, error);
      return null;
    }
  }

  /**
   * Delete cache
   */
  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error(`Redis Cache Delete Error [${key}]:`, error);
    }
  }

  // --- SPECIFIC DOMAIN HELPERS --- //

  // 1. OTP Caching
  async setOTP(userId: string, otp: string, ttlSeconds: number = 300): Promise<void> {
    await this.set(`otp:${userId}`, otp, ttlSeconds);
  }

  async getOTP(userId: string): Promise<string | null> {
    return await this.get<string>(`otp:${userId}`);
  }

  async deleteOTP(userId: string): Promise<void> {
    await this.del(`otp:${userId}`);
  }

  // 2. Session Caching
  async setSession(userId: string, token: string, ttlSeconds: number = 86400): Promise<void> {
    await this.set(`session:${userId}`, token, ttlSeconds);
  }

  async getSession(userId: string): Promise<string | null> {
    return await this.get<string>(`session:${userId}`);
  }

  async deleteSession(userId: string): Promise<void> {
    await this.del(`session:${userId}`);
  }

  // 3. AI Response Caching
  async setAIResponse(queryHash: string, response: any, ttlSeconds: number = 7200): Promise<void> {
    await this.set(`ai_cache:${queryHash}`, response, ttlSeconds);
  }

  async getAIResponse<T>(queryHash: string): Promise<T | null> {
    return await this.get<T>(`ai_cache:${queryHash}`);
  }

  // 4. Analytics Caching
  async setAnalytics(dashboardType: string, data: any, ttlSeconds: number = 1800): Promise<void> {
    await this.set(`analytics:${dashboardType}`, data, ttlSeconds);
  }

  async getAnalytics<T>(dashboardType: string): Promise<T | null> {
    return await this.get<T>(`analytics:${dashboardType}`);
  }
}

export const cacheService = new CacheService();
export default cacheService;
