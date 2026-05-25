import { useAuth } from './useAuth';

// Standard client-side permission matrix mapped from roles
// Supports lowercase roles as structured in AuthContext
export const CLIENT_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'assign:intern',
    'view:reports',
    'update:task',
    'view:intern',
    'manage:departments',
    'view:audit-logs',
    'manage:users'
  ],
  super_admin: [
    'assign:intern',
    'view:reports',
    'update:task',
    'view:intern',
    'manage:departments',
    'view:audit-logs',
    'manage:users'
  ],
  hr: [
    'assign:intern',
    'view:reports',
    'view:intern',
    'manage:departments',
    'view:audit-logs'
  ],
  mentor: [
    'update:task',
    'view:intern'
  ],
  department_head: [
    'update:task',
    'view:intern',
    'assign:head'
  ],
  intern: [
    'view:own-profile',
    'submit:task',
    'request:leave'
  ]
};

/**
 * Hook to check if the current user has a specific permission.
 */
export const usePermission = () => {
  const { user } = useAuth();

  const hasPermission = (action: string): boolean => {
    if (!user) return false;

    const userRole = user.role.toLowerCase();

    // Admin / Super Admin bypasses all checks
    if (userRole === 'admin' || userRole === 'super_admin' || user.originalRole === 'SUPER_ADMIN') {
      return true;
    }

    // Check mapping based on standard role
    const permissions = CLIENT_PERMISSIONS[userRole] || [];
    if (permissions.includes(action)) {
      return true;
    }

    // Check mapping based on originalRole (uppercase in DB)
    if (user.originalRole) {
      const dbPermissions = CLIENT_PERMISSIONS[user.originalRole.toLowerCase()] || [];
      if (dbPermissions.includes(action)) {
        return true;
      }
    }

    return false;
  };

  return { hasPermission };
};
export default usePermission;
