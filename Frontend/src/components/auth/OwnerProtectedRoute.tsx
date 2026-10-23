import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface OwnerProtectedRouteProps {
  children?: React.ReactNode;
}

/**
 * Route guard for Vehicle Owner workspace routes (BRD FR-01, FR-02).
 * Ensures only authenticated users with the "owner" role can access vehicle owner resources.
 */
export const OwnerProtectedRoute: React.FC<OwnerProtectedRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Safe loading spinner while auth session is verified
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
        />
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>
          Verifying session...
        </span>
      </div>
    );
  }

  // Unauthenticated user -> redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Garage partner -> redirect to garage workspace
  if (user.role === 'garage') {
    return <Navigate to="/garage/dashboard" replace />;
  }

  // Admin user -> redirect to admin workspace
  if (user.role === 'admin') {
    return <Navigate to="/admin/garages" replace />;
  }

  // Any other non-owner role -> redirect to login
  if (user.role !== 'owner') {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default OwnerProtectedRoute;
