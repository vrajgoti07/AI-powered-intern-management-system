import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment variables validation schema
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().min(1, 'PORT is required'),
  API_VERSION: z.string().default('v1'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Redis
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT Secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT Refresh Secret must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  
  // CORS
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  
  // Queue
  ADMIN_QUEUE_PASS: z.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  
  // Frontend
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  
  // AI Microservice
  AI_SERVICE_URL: z.string().min(1, 'AI_SERVICE_URL is required'),
});

// Validate and parse environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const env = parseEnv();

// Export typed configuration
export const config = {
  server: {
    env: env.NODE_ENV,
    port: parseInt(env.PORT, 10),
    apiVersion: env.API_VERSION,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
  },
  database: {
    url: env.DATABASE_URL,
  },
  jwt: {
    accessSecret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiry: env.JWT_ACCESS_EXPIRY as string,
    refreshExpiry: env.JWT_REFRESH_EXPIRY as string,
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ? parseInt(env.SMTP_PORT, 10) : undefined,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
    from: env.EMAIL_FROM,
  },
  queue: {
    adminPassword: env.ADMIN_QUEUE_PASS,
  },
  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
  },
  frontend: {
    url: env.FRONTEND_URL,
  },
  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: env.CLOUDINARY_API_KEY || '',
    apiSecret: env.CLOUDINARY_API_SECRET || '',
  },
  redis: {
    url: env.REDIS_URL,
    host: env.REDIS_HOST,
    port: parseInt(env.REDIS_PORT, 10),
    password: env.REDIS_PASSWORD || undefined,
  },
  ai: {
    serviceUrl: env.AI_SERVICE_URL,
  },
};
