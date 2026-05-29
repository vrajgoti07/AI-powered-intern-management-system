import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

/**
 * Custom operational error class.
 * Use for known, expected errors (bad input, not found, unauthorized, etc.).
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Map Prisma error codes to user-friendly messages and HTTP status codes.
 */
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): { statusCode: number; message: string; code: string } => {
  switch (error.code) {
    case 'P2002': {
      const target = (error.meta?.target as string[])?.join(', ') || 'field';
      return { statusCode: 409, message: `A record with this ${target} already exists.`, code: 'DUPLICATE_ENTRY' };
    }
    case 'P2025':
      return { statusCode: 404, message: 'The requested record was not found.', code: 'NOT_FOUND' };
    case 'P2003':
      return { statusCode: 400, message: 'Related record not found. Check your references.', code: 'FOREIGN_KEY_VIOLATION' };
    case 'P2014':
      return { statusCode: 400, message: 'This change would violate a required relation.', code: 'RELATION_VIOLATION' };
    default:
      return { statusCode: 400, message: 'A database error occurred.', code: 'DATABASE_ERROR' };
  }
};

/**
 * Global Error Handler Middleware.
 * MUST be registered as the LAST middleware in the Express chain.
 *
 * Returns a consistent JSON shape:
 * { success: false, message: string, code: string }
 *
 * Never exposes stack traces in production.
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log every error with request context
  logger.error(err.message, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id || 'anonymous',
  });

  // --- Known operational AppError ---
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // --- Zod Validation Errors ---
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors,
    });
    return;
  }

  // --- Prisma Known Request Errors (P2002 unique, P2025 not found, etc.) ---
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const { statusCode, message, code } = handlePrismaError(err);
    res.status(statusCode).json({ success: false, message, code });
    return;
  }

  // --- Prisma Validation Errors ---
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: 'Invalid data provided to the database.',
      code: 'PRISMA_VALIDATION_ERROR',
    });
    return;
  }

  // --- JWT Errors ---
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, message: 'Invalid authentication token.', code: 'INVALID_TOKEN' });
    return;
  }
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Authentication token has expired.', code: 'TOKEN_EXPIRED' });
    return;
  }

  // --- Payload Too Large ---
  if (err.name === 'PayloadTooLargeError' || (err as any).type === 'entity.too.large') {
    res.status(413).json({ success: false, message: 'Request payload is too large.', code: 'PAYLOAD_TOO_LARGE' });
    return;
  }

  // --- Syntax Error (malformed JSON body) ---
  if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
    res.status(400).json({ success: false, message: 'Malformed JSON in request body.', code: 'INVALID_JSON' });
    return;
  }

  // --- Unknown / Unexpected Errors ---
  res.status(500).json({
    success: false,
    message: 'An unexpected internal error occurred.',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { detail: err.message, stack: err.stack }),
  });
};

/**
 * 404 Not Found Handler.
 * Place AFTER all route registrations, BEFORE errorHandler.
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
    code: 'ROUTE_NOT_FOUND',
  });
};

/**
 * Async Handler Wrapper.
 * Wraps async route handlers so that rejected promises propagate to errorHandler.
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
