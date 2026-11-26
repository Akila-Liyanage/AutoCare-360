import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  X,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Sliders,
  Eye
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

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'error';
}

const STORAGE_KEY = 'autocare.preview.accessPermissions';

const getInitialPreviewData = (): PreviewPermissionRecord | null => {
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
  return null;
};

const AccessPermissionManagementPage: React.FC = () => {
  const navigate = useNavigate();

  const initialRecord = getInitialPreviewData();

  // Active permission tier/mode
  const [selectedMode, setSelectedMode] = useState<PermissionMode>(() => {
    if (
      initialRecord?.mode === 'Full Access' ||
      initialRecord?.mode === 'Limited Access' ||
      initialRecord?.mode === 'Selected Records'
    ) {
      return initialRecord.mode;
    }
    return 'Selected Records';
  });

  // Editable expiration datetime string matching Figma target
  const [expiration, setExpiration] = useState<string>(() => {
    return initialRecord?.expiration || '30 Sep 2026 · 6:00 PM';
  });

  // Current permission status in local preview session
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>(() => {
    if (initialRecord?.status === 'granted' || initialRecord?.status === 'revoked') {
      return initialRecord.status;
    }
    return 'ready';
  });

  const [lastSavedRecord, setLastSavedRecord] = useState<PreviewPermissionRecord | null>(initialRecord);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  const handleSelectMode = (mode: PermissionMode) => {
    setSelectedMode(mode);
    if (validationError) setValidationError(null);
  };

  const handleExpirationChange = (val: string) => {
    setExpiration(val);
    if (validationError) setValidationError(null);
  };

  // Dynamic summary metadata based on selected permission mode
  const getSummaryData = () => {
    switch (selectedMode) {
      case 'Full Access':
        return {
          allowed: 'Complete service history, Costs and invoices, Documents and images',
          hidden: 'None (Full visibility granted)',
          categoriesCount: 'All record categories visible'
        };
      case 'Limited Access':
        return {
          allowed: 'Service dates, Mileage readings, Garage details',
          hidden: 'Costs, Invoices, Documents and images',
          categoriesCount: '1 record category visible'
        };
      case 'Selected Records':
      default:
        return {
          allowed: 'Engine repair history, Periodic service records',
          hidden: 'Insurance documents, Costs and invoices',
          categoriesCount: '2 record categories visible'
        };
    }
  };

  const summary = getSummaryData();

  // Check if current form inputs differ from what was previously saved
  const isConfigModified =
    permissionStatus === 'granted' &&
    (lastSavedRecord?.mode !== selectedMode ||
      lastSavedRecord?.expiration !== expiration.trim());

  const grantButtonLabel =
    permissionStatus === 'granted'
      ? isConfigModified
        ? 'Update access'
        : 'View access details'
      : permissionStatus === 'revoked'
      ? 'Restore access'
      : 'Grant access';

  const handleGrantAccess = () => {
    setValidationError(null);

    // 1. Recipient check
    const recipientName = 'N. Fernando · Ceylinco Insurance';
    if (!recipientName.trim()) {
      const err = 'Recipient context is missing. Please select a valid recipient.';
      setValidationError(err);
      showToast(err, 'error');
      return;
    }

    // 2. Access level check
    if (!selectedMode) {
      const err = 'Please select a valid access permission level.';
      setValidationError(err);
      showToast(err, 'error');
      return;
    }

    // 3. Allowed categories check
    if (!summary.allowed || !summary.allowed.trim()) {
      const err = 'At least one allowed record category must be present.';
      setValidationError(err);
      showToast(err, 'error');
      return;
    }

    // 4. Expiration check
    if (!expiration || !expiration.trim()) {
      const err = 'An expiration date and time is required before granting access.';
      setValidationError(err);
      showToast(err, 'error');
      return;
    }

    // 5. Prevent duplicate no-op saves if exact same config is already granted
    if (
      permissionStatus === 'granted' &&
      lastSavedRecord?.mode === selectedMode &&
      lastSavedRecord?.expiration === expiration.trim()
    ) {
      showToast('Access permission is already active with this configuration.', 'info');
      return;
    }

    const newRecord: PreviewPermissionRecord = {
      recipient: {
        name: 'N. Fernando',
        organization: 'Ceylinco Insurance',
        role: 'Inspection officer',
        email: 'inspection@ceylinco.lk',
        verified: true,
      },
      vehicle: 'WP ABC-1234 · Toyota Aqua',
      mode: selectedMode,
      expiration: expiration.trim(),
      allowed: summary.allowed,
      hidden: summary.hidden,
      status: 'granted',
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecord));
    } catch {
      // storage unavailable
    }

    setLastSavedRecord(newRecord);
    setPermissionStatus('granted');

    const toastMsg =
      permissionStatus === 'granted'
        ? 'Access configuration updated in preview mode'
        : 'Access granted in preview mode';
    showToast(toastMsg, 'success');
  };

  const handleRevokeAccess = () => {
    setValidationError(null);

    const revokedRecord: PreviewPermissionRecord = {
      recipient: {
        name: 'N. Fernando',
        organization: 'Ceylinco Insurance',
        role: 'Inspection officer',
        email: 'inspection@ceylinco.lk',
        verified: true,
      },
      vehicle: 'WP ABC-1234 · Toyota Aqua',
      mode: selectedMode,
      expiration: expiration.trim(),
      allowed: summary.allowed,
      hidden: summary.hidden,
      status: 'revoked',
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(revokedRecord));
    } catch {
      // storage unavailable
    }

    setLastSavedRecord(revokedRecord);
    setPermissionStatus('revoked');
    showToast('Access revoked in preview mode', 'info');
  };

  return (
    <div className="autocare-perm-page">
      <Navbar />

      <main className="autocare-perm-main">
        <div className="autocare-perm-container">
          {/* Breadcrumb / Back Navigation */}
          <div className="autocare-perm-back-nav">
            <button
              type="button"
              className="autocare-perm-back-btn"
              onClick={() => navigate(-1)}
              title="Return to previous screen"
            >
              <ArrowLeft size={16} />
              <span>Back to sharing options</span>
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
              gap: '12px',
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
                whiteSpace: 'nowrap',
              }}
            >
              <span>Go to Secure Link Sharing</span>
              <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
            </Link>
          </div>

          {/* Top Header Row matching Figma target */}
          <header className="autocare-perm-header-row">
            <div className="autocare-perm-title-group">
              <h1 className="autocare-perm-title">Access Permission Management</h1>
              <p className="autocare-perm-subtitle">
                BR-06 · Grant the minimum record access needed.
              </p>
            </div>

            <div className="autocare-perm-header-actions">
              <Link
                to="/sharing/protection"
                className="autocare-perm-back-btn"
                style={{
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0056A2',
                  padding: '9px 18px',
                  borderRadius: '8px'
                }}
                title="Configure advanced protection"
              >
                <Sliders size={15} />
                <span>Configure protection</span>
              </Link>

              <button
                type="button"
                className="autocare-perm-btn-grant"
                onClick={
                  permissionStatus === 'granted' && !isConfigModified
                    ? () => navigate('/sharing/permissions/granted')
                    : handleGrantAccess
                }
                style={{
                  backgroundColor:
                    permissionStatus === 'granted' && !isConfigModified
                      ? '#0056A2'
                      : permissionStatus === 'granted'
                      ? '#15803d'
                      : '#0056A2',
                  cursor: 'pointer'
                }}
              >
                {permissionStatus === 'granted' && !isConfigModified ? (
                  <Eye size={16} />
                ) : (
                  <Check size={16} />
                )}
                <span>{grantButtonLabel}</span>
              </button>
            </div>
          </header>

          {/* Card 1: Recipient Context Card */}
          <section className="autocare-perm-recipient-card" aria-label="Recipient Context">
            <h2 className="autocare-perm-recipient-title">Recipient context</h2>
            <div className="autocare-perm-recipient-row">
              <div className="autocare-perm-recipient-info">
                <span className="autocare-perm-recipient-name">
                  N. Fernando · Ceylinco Insurance
                </span>
                <span className="autocare-perm-recipient-role">
                  Inspection officer · inspection@ceylinco.lk
                </span>
              </div>

              <div className="autocare-perm-badge-verified">
                <CheckCircle2 size={14} />
                <span>IDENTITY VERIFIED</span>
              </div>
            </div>
          </section>

          {/* Card Stack 2: 3 Permission Option Cards */}
          <section className="autocare-perm-options-grid" aria-label="Permission Options">
            {/* Card Option 1: Full Access */}
            <div
              className={`autocare-perm-option-card ${
                selectedMode === 'Full Access' ? 'is-selected' : ''
              }`}
              onClick={() => handleSelectMode('Full Access')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleSelectMode('Full Access');
              }}
            >
              <div className="autocare-perm-option-header">
                <h3 className="autocare-perm-option-title">Full Access</h3>
                <p className="autocare-perm-option-desc">
                  Complete service history, costs and documents
                </p>
              </div>

              <div className="autocare-perm-option-list">
                <div className="autocare-perm-list-bullet">
                  <span>•</span>
                  <span>Complete service history</span>
                </div>
                <div className="autocare-perm-list-bullet">
                  <span>•</span>
                  <span>Costs and invoices</span>
                </div>
                <div className="autocare-perm-list-bullet">
                  <span>•</span>
                  <span>Documents and images</span>
                </div>
              </div>

              <div className="autocare-perm-option-footer">
                <span
                  className={`autocare-perm-pill-status ${
                    selectedMode === 'Full Access' ? 'selected' : 'not-selected'
                  }`}
                >
                  {selectedMode === 'Full Access' ? 'SELECTED' : 'NOT SELECTED'}
                </span>
              </div>
            </div>

            {/* Card Option 2: Limited Access */}
            <div
              className={`autocare-perm-option-card ${
                selectedMode === 'Limited Access' ? 'is-selected' : ''
              }`}
              onClick={() => handleSelectMode('Limited Access')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleSelectMode('Limited Access');
              }}
            >
              <div className="autocare-perm-option-header">
                <h3 className="autocare-perm-option-title">Limited Access</h3>
                <p className="autocare-perm-option-desc">
                  Essential operational history only
                </p>
              </div>

              <div className="autocare-perm-option-list">
                <div className="autocare-perm-list-bullet">
                  <span>•</span>
                  <span>Service dates</span>
                </div>
                <div className="autocare-perm-list-bullet">
                  <span>•</span>
                  <span>Mileage readings</span>
                </div>
                <div className="autocare-perm-list-bullet">
                  <span>•</span>
                  <span>Garage details</span>
                </div>
              </div>

              <div className="autocare-perm-option-footer">
                <span
                  className={`autocare-perm-pill-status ${
                    selectedMode === 'Limited Access' ? 'selected' : 'not-selected'
                  }`}
                >
                  {selectedMode === 'Limited Access' ? 'SELECTED' : 'NOT SELECTED'}
                </span>
              </div>
            </div>

            {/* Card Option 3: Selected Records (Default Active in Figma) */}
            <div
              className={`autocare-perm-option-card ${
                selectedMode === 'Selected Records' ? 'is-selected' : ''
              }`}
              onClick={() => handleSelectMode('Selected Records')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleSelectMode('Selected Records');
              }}
            >
              <div className="autocare-perm-option-header">
                <h3 className="autocare-perm-option-title">Selected Records</h3>
                <p className="autocare-perm-option-desc">
                  Precisely control individual categories
                </p>
              </div>

              <div className="autocare-perm-option-list">
                <div className="autocare-perm-list-allowed">
                  <Check size={15} />
                  <span>Engine repair history — allowed</span>
                </div>
                <div className="autocare-perm-list-hidden">
                  <X size={15} />
                  <span>Insurance documents — hidden</span>
                </div>
                <div className="autocare-perm-list-bullet">
                  <Check size={15} style={{ color: '#10b981' }} />
                  <span>Periodic service records</span>
                </div>
              </div>

              <div className="autocare-perm-option-footer">
                <span
                  className={`autocare-perm-pill-status ${
                    selectedMode === 'Selected Records' ? 'selected' : 'not-selected'
                  }`}
                >
                  {selectedMode === 'Selected Records' ? 'SELECTED' : 'NOT SELECTED'}
                </span>
              </div>
            </div>
          </section>

          {/* Bottom Split Section: Permission Summary (Left) + Review Panel (Right) */}
          <div className="autocare-perm-bottom-grid">
            {/* Left: Permission Summary Card */}
            <section className="autocare-perm-summary-card" aria-label="Permission Summary">
              <h2 className="autocare-perm-summary-title">Permission summary</h2>

              <div className="autocare-perm-summary-table">
                <div className="autocare-perm-summary-row">
                  <span className="autocare-perm-summary-label">Recipient</span>
                  <span className="autocare-perm-summary-val">N. Fernando · Ceylinco Insurance</span>
                </div>

                <div className="autocare-perm-summary-row">
                  <span className="autocare-perm-summary-label">Vehicle</span>
                  <span className="autocare-perm-summary-val">WP ABC-1234 · Toyota Aqua</span>
                </div>

                <div className="autocare-perm-summary-row">
                  <span className="autocare-perm-summary-label">Access</span>
                  <span className="autocare-perm-summary-val">{selectedMode}</span>
                </div>

                <div className="autocare-perm-summary-row">
                  <span className="autocare-perm-summary-label">Allowed</span>
                  <span className="autocare-perm-summary-val">{summary.allowed}</span>
                </div>

                <div className="autocare-perm-summary-row">
                  <span className="autocare-perm-summary-label">Hidden</span>
                  <span className="autocare-perm-summary-val">{summary.hidden}</span>
                </div>

                <div className="autocare-perm-summary-row">
                  <span className="autocare-perm-summary-label">Expiration</span>
                  <span className="autocare-perm-summary-val">{expiration}</span>
                </div>

                <div className="autocare-perm-summary-row">
                  <span className="autocare-perm-summary-label">Status</span>
                  <span
                    className="autocare-perm-summary-val"
                    style={{
                      fontWeight: 700,
                      color:
                        permissionStatus === 'granted'
                          ? '#15803d'
                          : permissionStatus === 'revoked'
                          ? '#b91c1c'
                          : '#475569'
                    }}
                  >
                    {permissionStatus === 'granted'
                      ? 'Granted in preview mode'
                      : permissionStatus === 'revoked'
                      ? 'Revoked in preview mode'
                      : 'Ready to grant'}
                  </span>
                </div>
              </div>
            </section>

            {/* Right: Review Panel Card */}
            <section className="autocare-perm-review-card" aria-label="Review Panel">
              <h2 className="autocare-perm-review-title">Review panel</h2>

              {/* Status Badge */}
              {permissionStatus === 'granted' ? (
                <div
                  className="autocare-perm-badge-ready"
                  style={{
                    backgroundColor: '#dcfce7',
                    borderColor: '#86efac',
                    color: '#15803d',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle2 size={13} style={{ color: '#15803d' }} />
                  <span>ACCESS GRANTED</span>
                </div>
              ) : permissionStatus === 'revoked' ? (
                <div
                  className="autocare-perm-badge-ready"
                  style={{
                    backgroundColor: '#fee2e2',
                    borderColor: '#fca5a5',
                    color: '#b91c1c',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <X size={13} style={{ color: '#b91c1c' }} />
                  <span>ACCESS REVOKED</span>
                </div>
              ) : (
                <div className="autocare-perm-badge-ready">
                  READY TO GRANT
                </div>
              )}

              {/* Inline Validation Alert */}
              {validationError && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    marginBottom: '14px',
                    fontSize: '12.5px',
                    color: '#b91c1c',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Granted Status Experience */}
              {permissionStatus === 'granted' ? (
                <>
                  <div
                    style={{
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      marginBottom: '14px',
                      fontSize: '12.5px',
                      color: '#166534',
                      lineHeight: 1.5
                    }}
                  >
                    <strong>Access granted in preview mode</strong>
                    <div style={{ marginTop: '4px', color: '#15803d', fontSize: '12px' }}>
                      This permission is stored in the current frontend preview only. Live token-secured sharing remains available through Secure Link Sharing.
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/sharing/permissions/granted')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '10px',
                        background: '#ffffff',
                        border: '1px solid #86efac',
                        color: '#15803d',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Eye size={13} />
                      <span>View access details page</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      marginBottom: '16px',
                      fontSize: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Recipient</span>
                      <span style={{ color: '#0f172a', fontWeight: 700, textAlign: 'right' }}>N. Fernando · Ceylinco Insurance</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Vehicle</span>
                      <span style={{ color: '#0f172a', fontWeight: 600, textAlign: 'right' }}>WP ABC-1234 · Toyota Aqua</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Access</span>
                      <span style={{ color: '#0056A2', fontWeight: 700, textAlign: 'right' }}>{selectedMode}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Allowed</span>
                      <span style={{ color: '#15803d', fontWeight: 600 }}>{summary.allowed}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Hidden</span>
                      <span style={{ color: '#94a3b8', fontWeight: 500 }}>{summary.hidden}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Expiration</span>
                      <span style={{ color: '#0f172a', fontWeight: 600, textAlign: 'right' }}>{expiration}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Status</span>
                      <span style={{ color: '#15803d', fontWeight: 700, textAlign: 'right' }}>Granted in preview mode</span>
                    </div>
                  </div>
                </>
              ) : permissionStatus === 'revoked' ? (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    marginBottom: '14px',
                    fontSize: '12.5px',
                    color: '#991b1b',
                    lineHeight: 1.5
                  }}
                >
                  <strong>Access revoked in preview mode</strong>
                  <div style={{ marginTop: '4px', color: '#b91c1c', fontSize: '12px' }}>
                    This permission has been revoked for the current frontend preview. You can restore or re-grant access at any time.
                  </div>
                </div>
              ) : (
                <>
                  <div className="autocare-perm-review-headline">
                    {summary.categoriesCount}
                  </div>
                  <p className="autocare-perm-review-desc">
                    Recipient can view but cannot download or reshare. Every access event appears in BR-08 Audit Trail.
                  </p>
                </>
              )}

              <div className="autocare-perm-form-group">
                <label htmlFor="perm-expiration-input" className="autocare-perm-label">
                  Expiration
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="perm-expiration-input"
                    type="text"
                    className="autocare-perm-input"
                    style={{
                      borderColor: validationError && (!expiration || !expiration.trim()) ? '#ef4444' : undefined
                    }}
                    value={expiration}
                    onChange={(e) => handleExpirationChange(e.target.value)}
                    placeholder="e.g. 30 Sep 2026 · 6:00 PM"
                  />
                  <Calendar
                    size={16}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      pointerEvents: 'none'
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                className="autocare-perm-btn-panel-grant"
                onClick={
                  permissionStatus === 'granted' && !isConfigModified
                    ? () => navigate('/sharing/permissions/granted')
                    : handleGrantAccess
                }
                style={{
                  backgroundColor:
                    permissionStatus === 'granted' && !isConfigModified
                      ? '#0056A2'
                      : permissionStatus === 'granted'
                      ? '#15803d'
                      : '#0056A2'
                }}
              >
                {permissionStatus === 'granted' && !isConfigModified ? (
                  <>
                    <Eye size={16} />
                    <span>View access details</span>
                  </>
                ) : permissionStatus === 'granted' ? (
                  <>
                    <Check size={16} />
                    <span>Update access</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>{grantButtonLabel}</span>
                  </>
                )}
              </button>

              {permissionStatus === 'granted' && (
                <button
                  type="button"
                  onClick={handleRevokeAccess}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: '10px',
                    background: '#fff1f2',
                    border: '1px solid #fecdd3',
                    color: '#e11d48',
                    fontSize: '13px',
                    fontWeight: 700,
                    padding: '9px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                  title="Revoke access permission in preview mode"
                >
                  <X size={14} />
                  <span>Revoke access</span>
                </button>
              )}

              <Link
                to="/sharing/protection"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '10px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#0056A2',
                  fontSize: '13px',
                  fontWeight: 700,
                  padding: '9px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
                title="Configure advanced data protection"
              >
                <Sliders size={14} />
                <span>Configure protection</span>
              </Link>
            </section>
          </div>
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toast.show && (
        <div
          className={`autocare-perm-toast is-${toast.type === 'error' ? 'info' : toast.type}`}
          role="alert"
          style={{
            borderLeftColor: toast.type === 'error' ? '#ef4444' : undefined
          }}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
          ) : toast.type === 'error' ? (
            <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
          ) : (
            <AlertCircle size={18} style={{ color: '#38bdf8', flexShrink: 0 }} />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            className="autocare-perm-toast-close"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AccessPermissionManagementPage;
