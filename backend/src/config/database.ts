import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { softDeleteExtension } from '../middleware/softDeleteMiddleware';
import { tenantExtension } from '../middleware/tenantExtension';

// Base Prisma Client instance with logging
const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

// Extended Prisma Client with soft delete and multi-tenant isolation features
const prisma = basePrisma.$extends(softDeleteExtension).$extends(tenantExtension);

/**
 * Connect to PostgreSQL database with Neon branch verification
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();

    // --- Neon Branch & Connection Verification ---
    const dbUrl = process.env.DATABASE_URL || '';
    const dbName = dbUrl.split('/').pop()?.split('?')[0] || 'unknown';
    const isNeon = dbUrl.includes('neon.tech');
    const isPooled = dbUrl.includes('-pooler');
    const branchEndpoint = isNeon
      ? (dbUrl.match(/ep-[\w-]+/)?.[0] || 'unknown-endpoint')
      : 'local';

    logger.info(
      `✅ ${isNeon ? 'Neon ' : ''}PostgreSQL connected` +
      ` | DB: ${dbName}` +
      ` | Endpoint: ${branchEndpoint}` +
      ` | Pooled: ${isPooled}` +
      ` | ENV: ${process.env.NODE_ENV || 'development'}`
    );

    // Quick data-presence sanity check for Neon
    if (isNeon) {
      try {
        const result = await basePrisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM "users"`;
        const userCount = Number(result[0]?.count ?? 0);
        logger.info(`📊 Neon verification: ${userCount} users in database`);

        if (userCount === 0) {
          logger.warn(
            '⚠️  WARNING: Connected to Neon but database has 0 users!' +
            ' Verify you are connected to the correct branch (main vs dev).'
          );
        }
      } catch (countErr) {
        // Table may not exist yet (first migration) — that's okay
        logger.warn('📊 Neon verification skipped: users table may not exist yet');
      }
    }

    // Warn if DIRECT_URL is missing for Neon
    if (isNeon && !process.env.DIRECT_URL) {
      logger.warn(
        '⚠️  DIRECT_URL is not set! Prisma migrations MUST use a direct (non-pooled) connection.' +
        ' Copy the unpooled connection string from Neon dashboard → set DIRECT_URL in .env'
      );
    }
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

