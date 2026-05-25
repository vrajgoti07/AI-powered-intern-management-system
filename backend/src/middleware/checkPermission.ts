import { Request, Response, NextFunction } from 'express';
import { forbiddenResponse, unauthorizedResponse } from '../utils/response';
import { PERMISSIONS } from '../config/permissions';

/**
 * Middleware factory to check if the authenticated user's role has the required permission.
 * Returns 403 (Forbidden) with insufficient permissions message if not allowed.
 */
export const checkPermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // 1. Check if user is authenticated
    if (!req.user) {
      unauthorizedResponse(res, 'Authentication required');
      return;
    }

    const userRole = req.user.role; // e.g. 'SUPER_ADMIN', 'HR', etc.

    // 2. Fetch permissions for the user's role
    const userPermissions = PERMISSIONS[userRole] || [];

    // 3. Super Admin bypasses all check, otherwise check allowed array
    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    const hasAccess = isSuperAdmin || userPermissions.includes(requiredPermission);

    if (!hasAccess) {
      forbiddenResponse(
        res,
        `Access denied. You do not have permission: ${requiredPermission}`
      );
      return;
    }

    next();
  };
};
export default checkPermission;
