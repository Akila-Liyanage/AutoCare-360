import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children?: React.ReactNode;
}

/**
 * Route guard for System Administrator workspace routes.
 * Ensures only authenticated users with the "admin" role can access administrative resources.
 */
export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Safe loading state while auth session is verified
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '12px',
          color: '#0056A2',
        }}
      >
        <Loader2
          size={36}
          style={{ animation: 'spin 1s linear infinite' }}
          aria-label="Loading session"
        />
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>
          Verifying administrative credentials...
        </span>
      </div>
    );
  }

  // Unauthenticated user -> redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vehicle owner -> redirect to owner workspace
  if (user.role === 'owner') {
    return <Navigate to="/vehicles" replace />;
  }

  // Garage partner -> redirect to garage workspace
  if (user.role === 'garage') {
    return <Navigate to="/garage/dashboard" replace />;
  }

  // Admin user -> allow access to admin routes
  if (user.role === 'admin') {
    return children ? <>{children}</> : <Outlet />;
  }

  // Any other role -> redirect to login
  return <Navigate to="/login" replace />;
};

export default AdminProtectedRoute;
