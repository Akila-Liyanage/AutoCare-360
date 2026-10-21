import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Clock,
  Building2,
  CheckCircle2,
  ArrowLeft,
  LogOut,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import AuthLayout from '../../components/auth/AuthLayout';
import registerBg from '../../assets/auth/bg register 2.png';
import '../../styles/auth.css';

interface LocationState {
  workshopName?: string;
  businessRegNumber?: string;
  city?: string;
  email?: string;
}

export const GarageVerificationPendingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const state = (location.state as LocationState) || {};

  // Resolve workshop name from state, auth user, or fallback
  const savedPending = (() => {
    try {
      const raw = localStorage.getItem('autocare_pending_garage');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  })();

  const workshopName =
    state.workshopName ||
    user?.fullName ||
    savedPending.workshopName ||
    'Authorized Garage Station';

  const brn = state.businessRegNumber || savedPending.businessRegNumber || 'BR-PENDING-2026';
  const city = state.city || savedPending.city || 'Sri Lanka';

  const handleLogout = () => {
    logout();
    localStorage.removeItem('autocare_pending_garage');
    navigate('/login', { replace: true });
  };

  return (
    <AuthLayout bgImage={registerBg} layoutMode="centered" hideFade={true}>
      <div className="autocare-auth-card is-register" style={{ maxWidth: '580px' }}>
        {/* Header */}
        <header className="autocare-auth-header autocare-auth-card-header">
          <div
            className="autocare-card-pill-badge"
            style={{
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a',
            }}
          >
            <Clock size={13} style={{ marginRight: '6px' }} />
            ACCREDITATION PENDING
          </div>
          <h1 className="autocare-auth-card-title">Registration Received</h1>
          <p className="autocare-auth-card-subtitle">
            Your garage partner application has been submitted to the AutoCare 360 Trust Network.
          </p>
        </header>

        {/* Body */}
        <div className="autocare-auth-card-body" style={{ padding: '24px 28px' }}>
          {/* Workshop Details Capsule */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              <Building2 size={28} />
            </div>

            <h2
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#0f172a',
                margin: '0 0 6px 0',
              }}
            >
              {workshopName}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              BRN: <strong>{brn}</strong> · Location: <strong>{city}</strong>
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#fffbeb',
                color: '#b45309',
                border: '1px solid #fcd34d',
                padding: '4px 14px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 700,
                marginTop: '14px',
              }}
            >
              <Clock size={14} />
              <span>STATUS: PENDING VERIFICATION</span>
            </div>
          </div>

          {/* Explanation notice */}
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}
          >
            <ShieldAlert size={20} style={{ color: '#0056a2', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '13px', color: '#1e3a8a', lineHeight: '1.55' }}>
              <strong>Verification Requirement:</strong> To safeguard vehicle passports and ensure
              regulatory compliance, all garage partners must undergo accreditation verification
              before publishing official maintenance records or issuing verified certificates.
              Our operations team reviews business registration and workshop credentials within
              1–2 business days.
            </div>
          </div>

          {/* Verification checklist steps */}
          <div style={{ marginBottom: '24px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#64748b',
                letterSpacing: '0.5px',
                display: 'block',
                marginBottom: '10px',
              }}
            >
              Verification Process
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155' }}>
                <CheckCircle2 size={16} style={{ color: '#059669', flexShrink: 0 }} />
                <span>Account registration &amp; representative details submitted</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155' }}>
                <Clock size={16} style={{ color: '#d97706', flexShrink: 0 }} />
                <span>Business Registration Number (BRN) and workshop audit in review</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#94a3b8' }}>
                <FileCheck size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <span>Accreditation key generation &amp; workshop console activation</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="autocare-auth-btn-secondary"
              style={{ flex: 1, minWidth: '160px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={() => navigate('/login')}
            >
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </button>

            <button
              type="button"
              className="autocare-auth-btn-primary"
              style={{
                flex: 1,
                minWidth: '160px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: '#dc2626',
                borderColor: '#dc2626',
              }}
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default GarageVerificationPendingPage;
