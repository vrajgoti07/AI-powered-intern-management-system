/**
 * Prisma Error Handler — Maps Prisma error codes to HTTP responses
 * 
 * Provides consistent error responses for Prisma/Neon database errors,
 * including Neon-specific codes for connection pool timeouts and cold starts.
 * 
 * Usage in Express error middleware:
 *   import { mapPrismaError, isPrismaError } from '../utils/prismaErrorHandler';
 *   
 *   if (isPrismaError(error)) {
 *     const { status, message, code } = mapPrismaError(error);
 *     return res.status(status).json({ error: message, code });
 *   }
 * 
 * Usage in service/controller catch blocks:
 *   try {
 *     await prisma.user.create({...});
 *   } catch (error) {
 *     const mapped = mapPrismaError(error);
 *     throw new HttpError(mapped.status, mapped.message);
 *   }
 */

import { logger } from './logger';

/** Prisma error code to HTTP status and user-friendly message mapping */
const PRISMA_ERROR_MAP: Record<string, { status: number; message: string; severity: 'warn' | 'error' }> = {
  // --- Client Errors (Prisma Client Known Request Errors) ---
  P2000: { status: 400, message: 'Value too long for the column', severity: 'warn' },
  P2001: { status: 404, message: 'Record not found matching the search criteria', severity: 'warn' },
  P2002: { status: 409, message: 'Duplicate entry: a record with this unique value already exists', severity: 'warn' },
  P2003: { status: 400, message: 'Invalid reference: foreign key constraint violated', severity: 'warn' },
  P2004: { status: 400, message: 'A constraint failed on the database', severity: 'warn' },
  P2005: { status: 400, message: 'Invalid value stored in the database for a field', severity: 'error' },
  P2006: { status: 400, message: 'Invalid value provided for a field', severity: 'warn' },
  P2007: { status: 400, message: 'Data validation error', severity: 'warn' },
  P2011: { status: 400, message: 'Null constraint violation: required field is missing', severity: 'warn' },
  P2014: { status: 400, message: 'Relation violation: required relation would be broken', severity: 'warn' },
  P2015: { status: 404, message: 'Related record not found', severity: 'warn' },
  P2018: { status: 404, message: 'Required connected records were not found', severity: 'warn' },
  P2021: { status: 500, message: 'Table does not exist in the database', severity: 'error' },
  P2022: { status: 500, message: 'Column does not exist in the database', severity: 'error' },
  P2025: { status: 404, message: 'Record to update/delete not found', severity: 'warn' },

  // --- Connection / Neon-Specific Errors ---
  P1001: { status: 503, message: 'Database server unreachable — Neon may be waking up from suspend', severity: 'error' },
  P1002: { status: 503, message: 'Database server timed out — Neon cold start in progress', severity: 'error' },
  P1008: { status: 504, message: 'Database operation timed out', severity: 'error' },
  P1017: { status: 503, message: 'Server closed the connection unexpectedly', severity: 'error' },
  P2024: { status: 503, message: 'Connection pool timeout — too many concurrent requests or Neon cold start', severity: 'error' },

  // --- Migration Errors ---
  P3000: { status: 500, message: 'Database creation failed', severity: 'error' },
  P3001: { status: 500, message: 'Migration possible with destructive changes', severity: 'error' },
  P3002: { status: 500, message: 'Attempted rollback was not possible', severity: 'error' },
};

export interface MappedPrismaError {
  /** HTTP status code */
  status: number;
  /** User-friendly error message */
  message: string;
  /** Original Prisma error code (e.g., P2002) */
  code: string;
  /** Whether this is a retryable error (connection/timeout issues) */
  isRetryable: boolean;
  /** The specific field that caused the error (if available) */
  field?: string;
}

/** Retryable error codes — typically Neon cold-start or connection pool issues */
const RETRYABLE_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024']);

/**
 * Check if an error is a Prisma Client known error
 */
export function isPrismaError(error: any): boolean {
  return (
    error?.code?.startsWith('P') &&
    typeof error?.message === 'string'
  );
}

/**
 * Maps a Prisma error to an HTTP-friendly response object.
 * Logs the error with appropriate severity.
 */
export function mapPrismaError(error: any): MappedPrismaError {
  const code = error?.code || 'UNKNOWN';
  const mapping = PRISMA_ERROR_MAP[code];
  const isRetryable = RETRYABLE_CODES.has(code);

  // Extract the field name from Prisma meta (for unique constraint errors etc.)
  const field = error?.meta?.target?.[0] || error?.meta?.field_name || undefined;

  const result: MappedPrismaError = {
    status: mapping?.status || 500,
    message: mapping?.message || 'An unexpected database error occurred',
    code,
    isRetryable,
    field,
  };

  // Log with appropriate severity
  const logData = {
    prismaCode: code,
    httpStatus: result.status,
    field,
    isRetryable,
    meta: error?.meta,
    message: error?.message?.substring(0, 200),
  };

  if (mapping?.severity === 'warn' || result.status < 500) {
    logger.warn(`Prisma error [${code}]: ${result.message}`, logData);
  } else {
    logger.error(`Prisma error [${code}]: ${result.message}`, logData);
  }

  return result;
}

/**
 * Express-compatible error handler middleware for Prisma errors.
 * 
 * Usage:
 *   app.use(prismaErrorMiddleware);
 */
export function prismaErrorMiddleware(err: any, _req: any, res: any, next: any): void {
  if (isPrismaError(err)) {
    const mapped = mapPrismaError(err);
    res.status(mapped.status).json({
      success: false,
      error: mapped.message,
      code: mapped.code,
      ...(mapped.field && { field: mapped.field }),
      ...(mapped.isRetryable && { retryable: true }),
    });
    return;
  }

  // Not a Prisma error — pass to next error handler
  next(err);
}
