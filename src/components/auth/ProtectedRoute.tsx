import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('admin' | 'faculty')[];
}

/**
 * ProtectedRoute: Checks if user is authenticated via Firebase.
 * Shows loading spinner while auth state is resolving.
 * Redirects to login if not authenticated.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login/faculty" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath = user.role === 'admin' ? '/admin' : '/faculty';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

/**
 * AdminRoute: Checks if user is an admin.
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login/admin" replace />;
  }
  if (user.role !== 'admin') {
    return <Navigate to="/faculty" replace />;
  }
  return <>{children}</>;
}

/**
 * FacultyRoute: Checks if user is faculty.
 */
export function FacultyRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login/faculty" replace />;
  }
  if (user.role !== 'faculty') {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}

export default ProtectedRoute;
