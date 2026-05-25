import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';
import { AccessDenied } from '../pages/shared/AccessDenied';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
}) => {
  const { user, isLoading } = useAuth();
  const { hasPermission } = usePermission();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Redirect to login if user is not authenticated at all
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 1. Check Role if provided
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoleLower = user.role.toLowerCase();
    const hasRole = allowedRoles.some(
      (role) =>
        role.toLowerCase() === userRoleLower ||
        (userRoleLower === 'admin' && role.toLowerCase() === 'hr') ||
        (userRoleLower === 'super_admin' && role.toLowerCase() === 'admin')
    );

    if (!hasRole) {
      return <AccessDenied />;
    }
  }

  // 2. Check Permission if provided
  if (requiredPermission) {
    if (!hasPermission(requiredPermission)) {
      return <AccessDenied />;
    }
  }

  return <>{children}</>;
};
export default ProtectedRoute;
