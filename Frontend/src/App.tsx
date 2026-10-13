import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import AuthProvider from './context/AuthContext';
import HomePage from './pages/home/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import VerifyCodePage from './pages/auth/VerifyCodePage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import MyVehiclesPage from './pages/vehicles/MyVehiclesPage';
import './App.css';

// Lightweight Shell Component for Upcoming Phase Routes
const RoutePlaceholder: React.FC<{ title: string; subtitle: string; phase: string }> = ({ 
  title, 
  subtitle, 
  phase 
}) => (
  <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
    <Navbar />
    <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 24px' }}>
      <div style={{ 
        background: '#ffffff', 
        border: '1px solid #e2e8f0', 
        borderRadius: '16px', 
        padding: '44px 36px', 
        maxWidth: '520px', 
        textAlign: 'center', 
        boxShadow: '0 12px 28px -6px rgba(0, 86, 162, 0.08)' 
      }}>
        <div style={{ 
          display: 'inline-flex', 
          padding: '14px', 
          background: 'var(--autocare-blue-light)', 
          color: 'var(--autocare-blue)', 
          borderRadius: '14px', 
          marginBottom: '18px' 
        }}>
          <Clock size={32} />
        </div>
        <span style={{ 
          display: 'block', 
          fontSize: '11px', 
          fontWeight: 700, 
          color: 'var(--autocare-blue)', 
          textTransform: 'uppercase', 
          letterSpacing: '0.8px', 
          marginBottom: '8px' 
        }}>
          {phase}
        </span>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0b2545', margin: '0 0 10px 0' }}>
          {title}
        </h2>
        <p style={{ fontSize: '14.5px', color: '#64748b', lineHeight: 1.6, margin: '0 0 24px 0' }}>
          {subtitle}
        </p>
        <Link 
          to="/" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '10px 22px', 
            background: 'var(--autocare-blue)', 
            color: '#ffffff', 
            borderRadius: '8px', 
            textDecoration: 'none', 
            fontWeight: 700, 
            fontSize: '14px',
            boxShadow: '0 2px 6px rgba(0, 86, 162, 0.25)'
          }}
        >
          Return to Home Overview
        </Link>
      </div>
    </main>
    <Footer />
  </div>
);

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Core Landing & Overview */}
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />

          {/* Authentication & Password Recovery Flow */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-code" element={<VerifyCodePage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Vehicle Digital Passport — Phase 2C Gallery & Shells */}
          <Route path="/vehicles" element={<MyVehiclesPage />} />
          <Route 
            path="/vehicles/:id" 
            element={
              <RoutePlaceholder 
                title="Vehicle Digital Passport Inspector" 
                subtitle="Full Passport inspector, telemetry logs, and vehicle editing screen will be assembled in Phase 2D."
                phase="Phase 2D Route Shell"
              />
            } 
          />
          <Route 
            path="/vehicles/add" 
            element={
              <RoutePlaceholder 
                title="Register New Vehicle Passport" 
                subtitle="The POST /api/vehicles backend endpoint is ready and verified. Add Vehicle frontend form with developer Quick Fill will be assembled in Phase 2C."
                phase="Phase 2B Route Shell"
              />
            } 
          />
          <Route 
            path="/buyer-qr" 
            element={
              <RoutePlaceholder 
                title="Buyer QR Verification View" 
                subtitle="Protected public vehicle inspection and dynamic watermark view will be integrated in subsequent phases."
                phase="Phase 2B Route Shell"
              />
            } 
          />
          <Route 
            path="/profile" 
            element={
              <RoutePlaceholder 
                title="User Profile & Settings" 
                subtitle="Owner and garage credentials management will be integrated in subsequent phases."
                phase="Phase 2B Route Shell"
              />
            } 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
