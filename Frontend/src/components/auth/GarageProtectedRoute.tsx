import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, AlertTriangle, LogOut } from 'lucide-react';

interface GarageProtectedRouteProps {
  children?: React.ReactNode;
}

/**
 * Route guard for Verified Garage workspace routes (BRD FR-03, FR-04).
 * Ensures only authenticated users with the "garage" role and "active" status can access the workshop workspace.
 */
export const GarageProtectedRoute: React.FC<GarageProtectedRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
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
          Verifying workshop credentials...
        </span>
      </div>
    );
  }

  // Unauthenticated user -> redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Non-garage roles redirected to their proper workspace
  if (user.role === 'owner') {
    return <Navigate to="/vehicles" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin/garages" replace />;
  }

  if (user.role !== 'garage') {
    return <Navigate to="/login" replace />;
  }

  // Pending garage partner -> redirect to accreditation pending page
  if (user.status === 'pending') {
    return <Navigate to="/garage/verification-pending" replace />;
  }

  // Suspended garage partner -> display safe blocked notification state
  if (user.status === 'suspended') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          padding: '24px',
          backgroundColor: '#f8fafc',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '36px 28px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
            textAlign: 'center',
            border: '1px solid #fee2e2',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <AlertTriangle size={32} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
            Workshop Account Suspended
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
            Your garage partner account is currently suspended from accessing service records and digital passport management. Please contact AutoCare 360 platform administration for assistance.
          </p>
          <button
            type="button"
            onClick={logout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  // ONLY role === "garage" AND status === "active" may access garage workspace
  if (user.status !== 'active') {
    return <Navigate to="/garage/verification-pending" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default GarageProtectedRoute;
