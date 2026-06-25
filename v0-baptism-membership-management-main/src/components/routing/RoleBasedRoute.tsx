import { useSelector } from 'react-redux';
import { selectUserRole, selectIsAuthenticated } from '@/store/authStore';
import { Navigate } from 'react-router-dom';
import { UserRole } from '@/types';

interface RoleBasedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export default function RoleBasedRoute({
  allowedRoles,
  children,
}: RoleBasedRouteProps) {
  const userRole = useSelector(selectUserRole);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // not logged in → login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // wrong role → dashboard fallback
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}