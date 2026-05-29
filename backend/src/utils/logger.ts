import winston from 'winston';
import path from 'path';
import { config } from '../config/env';

/**
 * Custom log format with timestamp, level, message, and optional metadata.
 * In development: colorized console output.
 * In production: JSON logs written to error.log + combined.log files.
 */
const logFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

/**
 * Winston transports configuration
 */
const transports: winston.transport[] = [];

if (config.server.isProduction) {
  // Production: write to files
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB per file
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    })
  );
} else {
  // Development: colorized console output
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    })
  );
}

/**
 * Create Winston logger instance
 */
export const logger = winston.createLogger({
  level: config.server.isDevelopment ? 'debug' : 'info',
  levels: winston.config.npm.levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    logFormat
  ),
  defaultMeta: { service: 'intern-management-api' },
  transports,
  // Never crash on uncaught log errors
  exitOnError: false,
});
