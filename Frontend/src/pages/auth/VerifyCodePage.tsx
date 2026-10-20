import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowRight, AlertCircle, CheckCircle2, RotateCw } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import authService from '../../services/authService';
import carBg from '../../assets/auth/vehicle_owner_bg.jpg';

interface LocationState {
  email?: string;
}

export const VerifyCodePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState) || {};
  const email = state.email || '';

  const [code, setCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(60);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const maskEmail = (raw: string): string => {
    if (!raw || !raw.includes('@')) return raw || 'your email';
    const [name, domain] = raw.split('@');
    if (name.length <= 2) return `${name}***@${domain}`;
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(numericOnly);
    if (error) setError(null);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setApiSuccess(null);

    if (code.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    if (!email) {
      setError('Recovery session expired. Please re-enter your email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.verifyCode(email, code);
      setApiSuccess('Code verified successfully.');

      setTimeout(() => {
        navigate('/reset-password', {
          state: {
            email,
            resetToken: response.data.resetToken,
          },
        });
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid code. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setError(null);
    setApiSuccess(null);

    if (!email) {
      setError('Please restart recovery from the Forgot Password screen.');
      return;
    }

    setIsResending(true);
    try {
      const response = await authService.resendCode(email);
      setApiSuccess(response.message || 'A fresh verification code has been dispatched.');
      setCountdown(60);
      setCode('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend verification code.';
      setError(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout bgImage={carBg}>
      <div className="autocare-auth-card">
        {/* Card Header matching Figma */}
        <header className="autocare-auth-header autocare-auth-card-header">
          <div className="autocare-card-shield-badge" aria-hidden="true">
            <ShieldCheck size={18} />
          </div>
          <h1 className="autocare-auth-card-title">Verify Security Code</h1>
          <p className="autocare-auth-card-subtitle">
            We sent a 6-digit verification code to{' '}
            <strong style={{ color: 'var(--autocare-blue)' }}>{maskEmail(email)}</strong>
          </p>
        </header>

        {/* Card Body */}
        <div className="autocare-auth-card-body">
          <form className="autocare-login-form" onSubmit={handleVerify} noValidate>
            {/* 6-Digit Code Input */}
            <div className="autocare-form-field">
              <label htmlFor="otp-code" className="autocare-field-label">
                6-Digit Security Code
              </label>
              <div className="autocare-input-container">
                <input
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  className={`autocare-text-input ${error ? 'input-invalid' : ''}`}
                  placeholder="• • • • • •"
                  style={{
                    letterSpacing: '8px',
                    fontSize: '18px',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                  value={code}
                  onChange={handleCodeChange}
                  disabled={isSubmitting}
                  maxLength={6}
                  required
                />
              </div>
              {error && (
                <div className="autocare-inline-error" role="alert">
                  <AlertCircle size={13} /> {error}
                </div>
              )}
            </div>

            {/* Resend Action & Countdown */}
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '11.5px',
                marginTop: '2px',
              }}
            >
              <span style={{ color: 'var(--autocare-gray-500)' }}>
                {countdown > 0 ? (
                  `Resend code in ${countdown}s`
                ) : (
                  'Didn’t receive the code?'
                )}
              </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || isResending}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: countdown > 0 ? 'var(--autocare-gray-400)' : 'var(--autocare-blue)',
                  cursor: countdown > 0 ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RotateCw size={12} className={isResending ? 'spin' : ''} />
                Resend Code
              </button>
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

            {/* Primary Submit Button */}
            <button 
              type="submit" 
              className="autocare-primary-button" 
              disabled={isSubmitting || code.length !== 6}
            >
              <span>{isSubmitting ? 'Verifying Code...' : 'Verify Code'}</span>
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
            Entered wrong email?
            <Link to="/forgot-password" className="autocare-footer-register-link">
              Try another email
            </Link>
          </p>
        </footer>
      </div>
    </AuthLayout>
  );
};

export default VerifyCodePage;
