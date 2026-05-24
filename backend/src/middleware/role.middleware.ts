import { Request, Response, NextFunction } from 'express';
import { forbiddenResponse, unauthorizedResponse } from '../utils/response';

/**
 * Role-based Authorization Middleware
 * Checks if authenticated user has required role(s)
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user is authenticated
    if (!req.user) {
      unauthorizedResponse(res, 'Authentication required');
      return;
    }

    // Check if user has required role (allow DEPARTMENT_HEAD to act as MENTOR)
    const hasRole = allowedRoles.includes(req.user.role) || 
      (allowedRoles.includes('MENTOR') && req.user.role === 'DEPARTMENT_HEAD');

    if (!hasRole) {
      forbiddenResponse(
        res,
        `Access denied. Required role: ${allowedRoles.join(' or ')}`
      );
      return;
    }

    next();
  };
};

/**
 * HR Only Middleware
 */
export const hrOnly = authorize('HR');

/**
 * Mentor Only Middleware
 */
export const mentorOnly = authorize('MENTOR');

/**
 * Intern Only Middleware
 */
export const internOnly = authorize('INTERN');

/**
 * HR or Mentor Middleware
 */
export const hrOrMentor = authorize('HR', 'MENTOR');

/**
 * Any Authenticated User Middleware
 */
export const anyAuthenticated = authorize('SUPER_ADMIN', 'HR', 'MENTOR', 'INTERN');
