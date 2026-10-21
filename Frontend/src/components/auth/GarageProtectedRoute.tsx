import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface GarageProtectedRouteProps {
  children: React.ReactNode;
}

export const GarageProtectedRoute: React.FC<GarageProtectedRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#f4f7fb',
          color: '#003874',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid #cbd5e1',
            borderTopColor: '#003874',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '16px',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontWeight: 600, fontSize: '15px' }}>
          Verifying Garage Station Authorization...
        </span>
      </div>
    );
  }

  // Not authenticated -> redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated but not a garage partner -> redirect to vehicle owner home
  if (user.role !== 'garage') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default GarageProtectedRoute;
