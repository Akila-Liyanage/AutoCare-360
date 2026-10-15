import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import authService from '../../services/authService';
import carBg from '../../assets/auth/vehicle_owner_bg.jpg';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  const validate = (): boolean => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Account email is required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError('Please provide a valid email address.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setApiSuccess(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await authService.forgotPassword(email.trim());
      setApiSuccess(response.message);

      // Transition to code verification screen with email prefilled
      setTimeout(() => {
        navigate('/verify-code', { state: { email: email.trim() } });
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send recovery code. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout bgImage={carBg}>
      <div className="autocare-auth-card">
        {/* Card Header matching Figma */}
        <header className="autocare-auth-header autocare-auth-card-header">
          <div className="autocare-card-shield-badge" aria-hidden="true">
            <KeyRound size={18} />
          </div>
          <h1 className="autocare-auth-card-title">Password Recovery</h1>
          <p className="autocare-auth-card-subtitle">
            Enter your registered account email to receive a 6-digit verification code
          </p>
        </header>

        {/* Card Body */}
        <div className="autocare-auth-card-body">
          <form className="autocare-login-form" onSubmit={handleSubmit} noValidate>
            {/* Account Email Field */}
            <div className="autocare-form-field">
              <label htmlFor="recovery-email" className="autocare-field-label">
                Account Email
              </label>
              <div className="autocare-input-container">
                <input
                  id="recovery-email"
                  type="email"
                  className={`autocare-text-input ${error ? 'input-invalid' : ''}`}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  autoComplete="email"
                  disabled={isSubmitting}
                  required
                />
              </div>
              {error && (
                <div className="autocare-inline-error" role="alert">
                  <AlertCircle size={13} /> {error}
                </div>
              )}
            </div>

            {/* Success Notice */}
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

            {/* Submit Button */}
            <button 
              type="submit" 
              className="autocare-primary-button" 
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Sending Code...' : 'Send Verification Code'}</span>
              <ArrowRight size={15} />
            </button>
          </form>
        </div>

        {/* Card Footer matching Figma */}
        <footer className="autocare-auth-card-footer">
          <div className="autocare-footer-branding-label">
            <span>AutoCare 360</span>
            <span className="autocare-footer-vms-pill">Universal VMR</span>
          </div>
          <p className="autocare-footer-register-prompt">
            Remember your credentials?
            <Link to="/login" className="autocare-footer-register-link">
              Back to Sign In
            </Link>
          </p>
        </footer>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
