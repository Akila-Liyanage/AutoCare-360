import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import RoleSelector, { type AuthRole } from '../../components/auth/RoleSelector';
import { useAuth } from '../../hooks/useAuth';

import carBg from '../../assets/auth/vehicle_owner_bg.jpg';
import garageBg from '../../assets/auth/garage_service_bg.jpg';

interface FormErrors {
  email?: string;
  password?: string;
}

const ROLE_CONFIG: Record<
  AuthRole,
  {
    bg: string;
    ctaLabel: string;
  }
> = {
  owner: {
    bg: carBg,
    ctaLabel: 'Sign In As Vehicle Owner',
  },
  garage: {
    bg: garageBg,
    ctaLabel: 'Sign In As Verified Garage',
  },
  admin: {
    bg: carBg,
    ctaLabel: 'Sign In As System Admin',
  },
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState<AuthRole>('owner');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberDevice, setRememberDevice] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // API Interaction States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  const handleRoleChange = (newRole: AuthRole) => {
    setSelectedRole(newRole);
    setErrors({});
    setApiError(null);
    setApiSuccess(null);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const emailTrimmed = email.trim();

    if (!emailTrimmed) {
      newErrors.email = 'Account email is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrimmed)) {
        newErrors.email = 'Please enter a valid email address.';
      }
    }

    if (!password) {
      newErrors.password = 'Account password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);

    const isValid = validateForm();
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const response = await login({
        email: email.trim(),
        password,
        selectedRole,
      });

      setApiSuccess(response.message || 'Authentication successful!');

      // Smooth brief transition to authenticated workspace placeholder
      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Authentication failed. Please verify your credentials and network connection.';
      setApiError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentConfig = ROLE_CONFIG[selectedRole];

  return (
    <AuthLayout bgImage={currentConfig.bg}>
      <div className="autocare-auth-card">
        {/* Card Header in Brand Blue (#0056A2) matching Figma */}
        <header className="autocare-auth-header autocare-auth-card-header">
          <div className="autocare-card-shield-badge" aria-hidden="true">
            <Shield size={18} />
          </div>
          <h1 className="autocare-auth-card-title">Sign In to AutoCare 360</h1>
          <p className="autocare-auth-card-subtitle">
            Access your digital vehicle passport, garage workstation, or administrative audit console
          </p>
        </header>

        {/* Card Body */}
        <div className="autocare-auth-card-body">
          {/* Reusable Role Selector matching Figma tabs */}
          <RoleSelector 
            selectedRole={selectedRole} 
            onSelectRole={handleRoleChange} 
          />

          {/* Login Form */}
          <form className="autocare-login-form" onSubmit={handleSubmit} noValidate>
            {/* Account Email Field */}
            <div className="autocare-form-field">
              <label htmlFor="account-email" className="autocare-field-label">
                Account Email
              </label>
              <div className="autocare-input-container">
                <input
                  id="account-email"
                  type="email"
                  className={`autocare-text-input ${errors.email ? 'input-invalid' : ''}`}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    if (apiError) setApiError(null);
                  }}
                  autoComplete="email"
                  disabled={isSubmitting}
                  required
                />
              </div>
              {errors.email && (
                <div className="autocare-inline-error" role="alert">
                  <AlertCircle size={13} /> {errors.email}
                </div>
              )}
            </div>

            {/* Account Password Field */}
            <div className="autocare-form-field">
              <div className="autocare-field-header-row">
                <label htmlFor="account-password" className="autocare-field-label">
                  Account Password
                </label>
                <Link to="/forgot-password" className="autocare-forgot-pwd-link">
                  Forgot password?
                </Link>
              </div>
              <div className="autocare-input-container">
                <input
                  id="account-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`autocare-text-input has-toggle ${errors.password ? 'input-invalid' : ''}`}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    if (apiError) setApiError(null);
                  }}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="autocare-eye-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <div className="autocare-inline-error" role="alert">
                  <AlertCircle size={13} /> {errors.password}
                </div>
              )}
            </div>

            {/* Remember Device Checkbox */}
            <div className="autocare-remember-row">
              <input
                id="remember-device"
                type="checkbox"
                className="autocare-checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                disabled={isSubmitting}
              />
              <label htmlFor="remember-device" className="autocare-checkbox-text">
                Remember this device for 30 days
              </label>
            </div>

            {/* Real API Error Notice */}
            {apiError && (
              <div 
                className="autocare-dev-status-notice" 
                style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}
                role="alert"
              >
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{apiError}</span>
              </div>
            )}

            {/* Real API Success Notice */}
            {apiSuccess && (
              <div 
                className="autocare-dev-status-notice" 
                style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' }}
                role="status"
              >
                <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{apiSuccess}</span>
              </div>
            )}

            {/* Primary Submit Button */}
            <button 
              type="submit" 
              className="autocare-primary-button" 
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Authenticating...' : currentConfig.ctaLabel}</span>
              <ArrowRight size={15} />
            </button>
          </form>
        </div>

        {/* Card Footer matching Figma */}
        <footer className="autocare-auth-card-footer">
          <div className="autocare-footer-branding-label">
            <span>AutoCare 360</span>
            <span className="autocare-footer-vms-pill">Universal VMS</span>
          </div>
          <p className="autocare-footer-register-prompt">
            Don't have a passport or garage account yet?
            <Link to="/register" className="autocare-footer-register-link">
              Register your vehicle or business
            </Link>
          </p>
        </footer>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
