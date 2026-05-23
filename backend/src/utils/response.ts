import { Response } from 'express';

/**
 * Standard API Response Structure
 */
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: any[];
  timestamp: string;
}

/**
 * Success Response Helper
 */
export const successResponse = <T = any>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(response);
};

/**
 * Error Response Helper
 */
export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number = 500,
  error?: string,
  errors?: any[]
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    error,
    errors,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(response);
};

/**
 * Validation Error Response Helper
 */
export const validationErrorResponse = (
  res: Response,
  errors: any[]
): Response => {
  return errorResponse(
    res,
    'Validation failed',
    400,
    'Invalid input data',
    errors
  );
};

/**
 * Unauthorized Response Helper
 */
export const unauthorizedResponse = (
  res: Response,
  message: string = 'Unauthorized access'
): Response => {
  return errorResponse(res, message, 401, 'Authentication required');
};

/**
 * Forbidden Response Helper
 */
export const forbiddenResponse = (
  res: Response,
  message: string = 'Access forbidden'
): Response => {
  return errorResponse(res, message, 403, 'Insufficient permissions');
};

/**
 * Not Found Response Helper
 */
export const notFoundResponse = (
  res: Response,
  resource: string = 'Resource'
): Response => {
  return errorResponse(res, `${resource} not found`, 404);
};
