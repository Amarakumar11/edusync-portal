import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { getCurrentUser, isAdmin, isFaculty } from '@/demoAuth';

// ⚠️ DEMO MODE: Route protection using demo auth (localStorage-based)
// For production, integrate with Firebase or backend authentication

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('admin' | 'faculty')[];
}

/**
 * ProtectedRoute: Checks if user is authenticated.
 * Redirects to login if not.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login/faculty" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = user.role === 'admin' ? '/admin' : '/faculty';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

/**
 * AdminRoute: Checks if user is an admin.
 * Redirects to faculty dashboard if not.
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const user = getCurrentUser();
  if (!user) {
    return <Navigate to="/login/admin" replace />;
  }
  if (!isAdmin()) {
    return <Navigate to="/faculty" replace />;
  }
  return <>{children}</>;
}

/**
 * FacultyRoute: Checks if user is faculty.
 * Redirects to admin dashboard if user is admin, or login if not authenticated.
 */
export function FacultyRoute({ children }: { children: ReactNode }) {
  const user = getCurrentUser();
  if (!user) {
    return <Navigate to="/login/faculty" replace />;
  }
  if (!isFaculty()) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}

export default ProtectedRoute;
