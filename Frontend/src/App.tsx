import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AuthPlaceholder from './components/auth/AuthPlaceholder';
import './App.css';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/forgot-password" 
            element={
              <AuthPlaceholder 
                title="Password Recovery" 
                phase="Next Phase" 
                description="Password reset and verification flow will be implemented in subsequent phases." 
              />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <AuthPlaceholder 
                title="Authenticated Workspace" 
                phase="Phase 1 Active" 
                description="Authentication successful! You are signed in. Vehicle Passport and Garage modules will be integrated in subsequent phases." 
              />
            } 
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
