import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { unauthorizedResponse } from '../utils/response';
import prisma from '../config/database';

/**
 * Extend Express Request to include user
 */
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Authentication Middleware
 * Verifies JWT access token from Authorization header and fetches complete database user
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header or query parameter
    let token = '';
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    } else if (req.query.token && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      unauthorizedResponse(res, 'No token provided');
      return;
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Fetch full user with intern, mentor, and headedDepartment profiles
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        intern: true,
        mentor: true,
        headedDepartment: true,
      },
    });

    if (!user) {
      unauthorizedResponse(res, 'User not found or session invalid');
      return;
    }

    if (!user.isActive) {
      unauthorizedResponse(res, 'User account is deactivated');
      return;
    }
    
    // Attach user to request
    req.user = user;
    
    next();
  } catch (error) {
    unauthorizedResponse(res, 'Invalid or expired token');
  }
};

/**
 * Optional Authentication Middleware
 * Attaches user if token is valid, but doesn't fail if no token
 */
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          intern: true,
          mentor: true,
          headedDepartment: true,
        },
      });

      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without user
    next();
  }
};
