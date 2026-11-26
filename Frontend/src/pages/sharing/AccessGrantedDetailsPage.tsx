import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  X,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Sliders,
  ExternalLink,
  Car,
  UserCheck,
  Lock
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import '../../styles/permissions.css';

type PermissionMode = 'Full Access' | 'Limited Access' | 'Selected Records';
type PermissionStatus = 'ready' | 'granted' | 'revoked';

interface PreviewPermissionRecord {
  recipient: {
    name: string;
    organization: string;
    role: string;
    email: string;
    verified: boolean;
  };
  vehicle: string;
  mode: PermissionMode;
  expiration: string;
  allowed: string;
  hidden: string;
  status: PermissionStatus;
  updatedAt?: string;
}

const STORAGE_KEY = 'autocare.preview.accessPermissions';

const getStoredPermission = (): PreviewPermissionRecord => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PreviewPermissionRecord;
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return {
    recipient: {
      name: 'N. Fernando',
      organization: 'Ceylinco Insurance',
      role: 'Inspection officer',
      email: 'inspection@ceylinco.lk',
      verified: true
    },
    vehicle: 'WP ABC-1234 · Toyota Aqua',
    mode: 'Selected Records',
    expiration: '30 Sep 2026 · 6:00 PM',
    allowed: 'Engine repair history, Periodic service records',
    hidden: 'Insurance documents, Costs and invoices',
    status: 'granted'
  };
};

export const AccessGrantedDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const [record, setRecord] = useState<PreviewPermissionRecord>(getStoredPermission);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'info' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'info' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleRevoke = () => {
    const updated: PreviewPermissionRecord = {
      ...record,
      status: 'revoked',
      updatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // storage unavailable
    }
    setRecord(updated);
    showToast('Access revoked in preview mode', 'info');
  };

  const allowedList = record.allowed
    ? record.allowed.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const hiddenList = record.hidden
    ? record.hidden.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const isGranted = record.status === 'granted';

  return (
    <div className="autocare-perm-page">
      <Navbar />

      <main className="autocare-perm-main">
        <div className="autocare-perm-container" style={{ maxWidth: '980px' }}>
          {/* Breadcrumb / Back Navigation */}
          <div className="autocare-perm-back-nav">
            <button
              type="button"
              className="autocare-perm-back-btn"
              onClick={() => navigate('/sharing/permissions')}
              title="Return to Access Permission Management"
            >
              <ArrowLeft size={16} />
              <span>Back to permissions</span>
            </button>
          </div>

          {/* Demo / Preview Mode Banner */}
          <div
            className="autocare-demo-banner"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={20} style={{ color: '#d97706', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '14px', color: '#92400e', display: 'block' }}>
                  Demo / Preview Mode
                </strong>
                <span style={{ fontSize: '13px', color: '#b45309' }}>
                  Granular field-level permissions are a preview UI. Active token-secured sharing is available through Secure Link Sharing.
                </span>
              </div>
            </div>
            <Link
              to="/sharing/secure-link"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: '#0056a2',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
                textDecoration: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              <span>Go to Secure Link Sharing</span>
              <ExternalLink size={14} />
            </Link>
          </div>

          {/* Header Row */}
          <header className="autocare-perm-header-row" style={{ marginBottom: '22px' }}>
            <div className="autocare-perm-title-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 className="autocare-perm-title" style={{ fontSize: '28px' }}>
                  Access granted
                </h1>
                <span
                  style={{
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Preview mode
                </span>
                <span
                  style={{
                    backgroundColor: isGranted ? '#dcfce7' : '#fee2e2',
                    color: isGranted ? '#15803d' : '#b91c1c',
                    border: `1px solid ${isGranted ? '#86efac' : '#fca5a5'}`,
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {isGranted ? <CheckCircle2 size={12} /> : <X size={12} />}
                  <span>{isGranted ? 'Granted in preview mode' : 'Revoked in preview mode'}</span>
                </span>
              </div>
              <p className="autocare-perm-subtitle">
                Review the permission prepared for this recipient.
              </p>
            </div>

            <div className="autocare-perm-header-actions">
              <Link
                to="/sharing/permissions"
                className="autocare-perm-back-btn"
                style={{
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0056A2',
                  padding: '9px 16px',
                  borderRadius: '8px'
                }}
              >
                <ArrowLeft size={15} />
                <span>Back to permissions</span>
              </Link>

              <Link
                to="/sharing/protection"
                className="autocare-perm-btn-grant"
                style={{
                  backgroundColor: '#0056A2',
                  textDecoration: 'none',
                  padding: '9px 20px'
                }}
              >
                <span>Continue to protected sharing</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </header>

          {/* Helper Card Notice */}
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            <ShieldCheck size={20} style={{ color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '13.5px', color: '#166534', display: 'block' }}>
                Access granted in preview mode
              </strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#15803d', lineHeight: 1.5 }}>
                This permission is stored in the frontend preview only. Live token-secured access is available through Secure Link Sharing.
              </p>
            </div>
          </div>

          {/* Main Details Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '28px 30px',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
              marginBottom: '24px'
            }}
          >
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 800,
                color: '#0f172a',
                margin: '0 0 20px 0',
                letterSpacing: -0.2
              }}
            >
              Permission Overview
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Recipient */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr',
                  alignItems: 'center',
                  paddingBottom: '14px',
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                <span style={{ color: '#64748b', fontSize: '13.5px', fontWeight: 600 }}>Recipient</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <strong style={{ color: '#0f172a', fontSize: '14px' }}>
                    {record.recipient.name} · {record.recipient.organization}
                  </strong>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#e6f4ea',
                      color: '#137333',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}
                  >
                    <UserCheck size={12} />
                    <span>VERIFIED</span>
                  </span>
                </div>
              </div>

              {/* Vehicle */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr',
                  alignItems: 'center',
                  paddingBottom: '14px',
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                <span style={{ color: '#64748b', fontSize: '13.5px', fontWeight: 600 }}>Vehicle</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Car size={16} style={{ color: '#0056A2' }} />
                  <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>
                    {record.vehicle}
                  </span>
                </div>
              </div>

              {/* Access Mode */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr',
                  alignItems: 'center',
                  paddingBottom: '14px',
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                <span style={{ color: '#64748b', fontSize: '13.5px', fontWeight: 600 }}>Access</span>
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#eff6ff',
                      color: '#0056A2',
                      border: '1px solid #bfdbfe',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 700
                    }}
                  >
                    {record.mode}
                  </span>
                </div>
              </div>

              {/* Allowed Categories */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr',
                  alignItems: 'start',
                  paddingBottom: '14px',
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                <span style={{ color: '#64748b', fontSize: '13.5px', fontWeight: 600, paddingTop: '2px' }}>
                  Allowed
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {allowedList.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#15803d',
                        fontSize: '13.5px',
                        fontWeight: 600
                      }}
                    >
                      <CheckCircle2 size={15} style={{ color: '#16a34a', flexShrink: 0 }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hidden Categories */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr',
                  alignItems: 'start',
                  paddingBottom: '14px',
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                <span style={{ color: '#64748b', fontSize: '13.5px', fontWeight: 600, paddingTop: '2px' }}>
                  Hidden
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {hiddenList.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#64748b',
                        fontSize: '13.5px',
                        fontWeight: 500
                      }}
                    >
                      <Lock size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expiration */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr',
                  alignItems: 'center',
                  paddingBottom: '14px',
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                <span style={{ color: '#64748b', fontSize: '13.5px', fontWeight: 600 }}>Expiration</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={15} style={{ color: '#64748b' }} />
                  <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>
                    {record.expiration}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr',
                  alignItems: 'center'
                }}
              >
                <span style={{ color: '#64748b', fontSize: '13.5px', fontWeight: 600 }}>Status</span>
                <div>
                  <strong
                    style={{
                      color: isGranted ? '#15803d' : '#b91c1c',
                      fontSize: '14px'
                    }}
                  >
                    {isGranted ? 'Granted in preview mode' : 'Revoked in preview mode'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer Navigation Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <Link
                to="/sharing/protection"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#0056A2',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  padding: '10px 20px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  transition: 'background 0.2s ease'
                }}
              >
                <Sliders size={16} />
                <span>Continue to protected sharing</span>
              </Link>

              <Link
                to="/sharing/permissions"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  padding: '10px 18px',
                  borderRadius: '8px',
                  textDecoration: 'none'
                }}
              >
                <ArrowLeft size={15} />
                <span>Back to permissions</span>
              </Link>

              <Link
                to="/sharing/secure-link"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0056A2',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  padding: '10px 18px',
                  borderRadius: '8px',
                  textDecoration: 'none'
                }}
              >
                <span>Go to Secure Link Sharing</span>
                <ExternalLink size={14} />
              </Link>
            </div>

            <div>
              {isGranted ? (
                <button
                  type="button"
                  onClick={handleRevoke}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#fff1f2',
                    border: '1px solid #fecdd3',
                    color: '#e11d48',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    padding: '10px 18px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  title="Revoke access permission in preview mode"
                >
                  <X size={15} />
                  <span>Revoke access</span>
                </button>
              ) : (
                <Link
                  to="/sharing/permissions"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#0056A2',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    padding: '10px 18px',
                    borderRadius: '8px',
                    textDecoration: 'none'
                  }}
                >
                  <CheckCircle2 size={15} />
                  <span>Re-grant access</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Toast Feedback */}
      {toast.show && (
        <div className={`autocare-perm-toast is-${toast.type}`} role="alert">
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
          ) : (
            <AlertCircle size={18} style={{ color: '#38bdf8', flexShrink: 0 }} />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AccessGrantedDetailsPage;
