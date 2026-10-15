import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import authService from '../../services/authService';
import carBg from '../../assets/auth/vehicle_owner_bg.jpg';

interface LocationState {
  email?: string;
  resetToken?: string;
}

export const ResetPasswordPage: React.FC = () => {
  const location = useLocation();
  const state = (location.state as LocationState) || {};
  const email = state.email || '';
  const resetToken = state.resetToken || '';

  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const maskEmail = (raw: string): string => {
    if (!raw || !raw.includes('@')) return raw || 'your account';
    const [name, domain] = raw.split('@');
    if (name.length <= 2) return `${name}***@${domain}`;
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
  };

  const validate = (): boolean => {
    const newErrors: { newPassword?: string; confirmPassword?: string } = {};

    if (!newPassword) {
      newErrors.newPassword = 'New password is required.';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm your new password.';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!email || !resetToken) {
      setApiError('Recovery session expired or invalid. Please request a new verification code.');
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await authService.resetPassword({
        email,
        resetToken,
        newPassword,
      });

      // Transition to Figma-aligned Reset Success view
      setIsSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password. Please try again.';
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. FRONTEND — RESET SUCCESS SCREEN
  if (isSuccess) {
    return (
      <AuthLayout bgImage={carBg}>
        <div className="autocare-auth-card">
          {/* Success Header matching Figma */}
          <header className="autocare-auth-header autocare-auth-card-header" style={{ background: 'linear-gradient(135deg, #0056A2 0%, #1e40af 100%)' }}>
            <div 
              className="autocare-card-shield-badge" 
              style={{ background: '#50B748', borderColor: '#50B748' }}
              aria-hidden="true"
            >
              <CheckCircle2 size={18} color="#ffffff" />
            </div>
            <h1 className="autocare-auth-card-title">Password Reset Successfully</h1>
            <p className="autocare-auth-card-subtitle">
              Your account credentials have been securely updated
            </p>
          </header>

          <div className="autocare-auth-card-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
            {/* Success Icon Circle */}
            <div 
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                border: '2px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 4px 12px rgba(80, 183, 72, 0.15)'
              }}
            >
              <ShieldCheck size={36} color="#16a34a" />
            </div>

            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
              Credentials Updated
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 0 24px' }}>
              Your password for <strong>{maskEmail(email)}</strong> has been changed successfully. You can now sign in using your new password.
            </p>

            <Link
              to="/login"
              className="autocare-primary-button"
              style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            >
              <span>Sign In to Your Account</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <footer className="autocare-auth-card-footer">
            <p className="autocare-footer-text">
              Need assistance?{' '}
              <a href="mailto:support@autocare360.com" className="autocare-footer-link">
                Contact Support
              </a>
            </p>
          </footer>
        </div>
      </AuthLayout>
    );
  }

  // 3. FRONTEND — SET NEW PASSWORD SCREEN
  return (
    <AuthLayout bgImage={carBg}>
      <div className="autocare-auth-card">
        {/* Card Header matching Figma */}
        <header className="autocare-auth-header autocare-auth-card-header">
          <div className="autocare-card-shield-badge" aria-hidden="true">
            <Lock size={18} />
          </div>
          <h1 className="autocare-auth-card-title">Set New Password</h1>
          <p className="autocare-auth-card-subtitle">
            Create a secure password for {maskEmail(email)}
          </p>
        </header>

        {/* Card Body */}
        <div className="autocare-auth-card-body">
          {/* Missing Session Alert */}
          {(!email || !resetToken) && (
            <div
              className="autocare-dev-status-notice"
              style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#b45309' }}
              role="alert"
            >
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <span>Recovery session details are missing. </span>
                <Link to="/forgot-password" style={{ color: '#b45309', fontWeight: 600, textDecoration: 'underline' }}>
                  Request a new verification code
                </Link>
              </div>
            </div>
          )}

          {/* API Error Alert */}
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

          <form className="autocare-login-form" onSubmit={handleSubmit} noValidate>
            {/* New Password Field */}
            <div className="autocare-form-field">
              <label htmlFor="new-password" className="autocare-field-label">
                New Password
              </label>
              <div className="autocare-input-container">
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  className={`autocare-text-input has-toggle ${errors.newPassword ? 'input-invalid' : ''}`}
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: undefined }));
                    if (apiError) setApiError(null);
                  }}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="autocare-eye-toggle"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  disabled={isSubmitting}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.newPassword && (
                <div className="autocare-inline-error" role="alert">
                  <AlertCircle size={13} /> {errors.newPassword}
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="autocare-form-field">
              <label htmlFor="confirm-password" className="autocare-field-label">
                Confirm New Password
              </label>
              <div className="autocare-input-container">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`autocare-text-input has-toggle ${errors.confirmPassword ? 'input-invalid' : ''}`}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    if (apiError) setApiError(null);
                  }}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="autocare-eye-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="autocare-inline-error" role="alert">
                  <AlertCircle size={13} /> {errors.confirmPassword}
                </div>
              )}
            </div>

            {/* Password Hint */}
            <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4, marginTop: '2px' }}>
              Must contain at least 8 characters. Make sure both passwords match.
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              className="autocare-primary-button"
              disabled={isSubmitting}
              style={{ marginTop: '12px' }}
            >
              {isSubmitting ? (
                <>
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#ffffff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Card Footer */}
        <footer className="autocare-auth-card-footer">
          <p className="autocare-footer-text">
            Remember your credentials?{' '}
            <Link to="/login" className="autocare-footer-link">
              Back to Sign In
            </Link>
          </p>
        </footer>
      </div>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
