/**
 * Neon-Aware Retry Wrapper for Prisma Operations
 * 
 * Neon PostgreSQL is serverless — databases auto-suspend after inactivity.
 * When a cold-start occurs mid-transaction, connections may drop, causing:
 *   - P2024: Timed out fetching a new connection from the connection pool
 *   - P1001: Can't reach database server
 *   - P1002: Database server started but refused connection (cold start in progress)
 * 
 * This wrapper automatically retries with exponential backoff for these
 * transient Neon errors, while immediately throwing for permanent errors
 * (e.g., unique constraint violations, foreign key errors).
 * 
 * Usage:
 *   import { withNeonRetry } from '../utils/neonRetry';
 *   
 *   const result = await withNeonRetry(
 *     () => prisma.$transaction([...]),
 *     { label: 'createInternWithOnboarding', maxRetries: 3 }
 *   );
 */

import { logger } from './logger';

/** Error codes that indicate a transient Neon/connection issue (safe to retry) */
const RETRYABLE_ERROR_CODES = new Set([
  'P2024', // Timed out fetching a new connection from the connection pool
  'P1001', // Can't reach database server at host
  'P1002', // Database server was reached but timed out / connection refused
  'P1008', // Operations timed out
  'P1017', // Server has closed the connection
]);

/** Error message patterns that indicate a transient issue */
const RETRYABLE_MESSAGE_PATTERNS = [
  'connection',
  'timeout',
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'socket hang up',
  'server closed the connection',
  'prepared statement',  // Neon pooler sometimes invalidates prepared statements
];

interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Human-readable label for logging (default: 'operation') */
  label?: string;
  /** Initial delay in ms before first retry (default: 500) */
  initialDelayMs?: number;
  /** Maximum delay in ms between retries (default: 5000) */
  maxDelayMs?: number;
}

/**
 * Wraps a Prisma operation with automatic retry logic for Neon cold-start failures.
 * 
 * @param fn - The async function to execute (typically a prisma.$transaction call)
 * @param options - Configuration for retry behavior
 * @returns The result of the function
 * @throws The last error if all retries are exhausted
 */
export async function withNeonRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    label = 'operation',
    initialDelayMs = 500,
    maxDelayMs = 5000,
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      
      // Log recovery if this wasn't the first attempt
      if (attempt > 1) {
        logger.info(`✅ Neon retry succeeded for "${label}" on attempt ${attempt}/${maxRetries}`);
      }
      
      return result;
    } catch (error: any) {
      lastError = error;

      // Check if this error is retryable
      const isRetryableCode = error.code && RETRYABLE_ERROR_CODES.has(error.code);
      const isRetryableMessage = RETRYABLE_MESSAGE_PATTERNS.some(
        pattern => error.message?.toLowerCase().includes(pattern.toLowerCase())
      );
      const isRetryable = isRetryableCode || isRetryableMessage;

      // If not retryable or last attempt, throw immediately
      if (!isRetryable || attempt === maxRetries) {
        if (attempt > 1) {
          logger.error(
            `❌ Neon retry exhausted for "${label}" after ${attempt} attempts`,
            { code: error.code, message: error.message }
          );
        }
        throw error;
      }

      // Calculate delay with exponential backoff + jitter
      const baseDelay = initialDelayMs * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 200; // 0-200ms random jitter
      const delay = Math.min(baseDelay + jitter, maxDelayMs);

      logger.warn(
        `⏳ Neon retry ${attempt}/${maxRetries} for "${label}" — waiting ${Math.round(delay)}ms`,
        {
          code: error.code,
          message: error.message?.substring(0, 100),
          retryable: isRetryableCode ? 'code' : 'message',
        }
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Should be unreachable, but TypeScript requires it
  throw lastError;
}

/**
 * Wraps a Prisma $transaction call with Neon-aware retry logic
 * and structured error logging.
 * 
 * Usage:
 *   const [user, intern] = await withNeonTransaction(
 *     prisma,
 *     async (tx) => {
 *       const user = await tx.user.create({...});
 *       const intern = await tx.intern.create({...});
 *       return [user, intern];
 *     },
 *     { label: 'createInternOnboarding', timeout: 10000 }
 *   );
 */
export async function withNeonTransaction<T>(
  prisma: any,
  fn: (tx: any) => Promise<T>,
  options: RetryOptions & { timeout?: number } = {}
): Promise<T> {
  const { timeout = 10000, ...retryOptions } = options;

  return withNeonRetry(
    () =>
      prisma.$transaction(fn, {
        timeout,
        maxWait: 5000, // Max time to acquire a connection from pool
      }),
    retryOptions
  );
}
