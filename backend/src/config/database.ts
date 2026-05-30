import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { softDeleteExtension } from '../middleware/softDeleteMiddleware';

// Base Prisma Client instance with logging
const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

// Extended Prisma Client with soft delete features
const prisma = basePrisma.$extends(softDeleteExtension);

/**
 * Connect to PostgreSQL database
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    const isNeon = process.env.DATABASE_URL?.includes('neon.tech');
    logger.info(`✅ ${isNeon ? 'Neon ' : ''}PostgreSQL database connected successfully`);
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

/**
 * Disconnect from database
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error disconnecting database:', error);
  }
};

export default prisma;
