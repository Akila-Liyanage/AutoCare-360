import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import '../../styles/permissions.css';

type PermissionMode = 'Full Access' | 'Limited Access' | 'Selected Records';

interface ToastState {
  message: string;
  type: 'success' | 'info';
}

export const AccessPermissionManagementPage: React.FC = () => {
  const navigate = useNavigate();

  // Permission selection state - default to Figma visual target ('Selected Records')
  const [selectedMode, setSelectedMode] = useState<PermissionMode>('Selected Records');

  // Expiration field state matching Figma ('30 Sep 2026 · 6:00 PM')
  const [expiration, setExpiration] = useState('30 Sep 2026 · 6:00 PM');

  // Confirmation toast state
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleGrantAccess = () => {
    showToast(
      `Access permissions (${selectedMode}) granted to N. Fernando (Ceylinco Insurance). Logged in BR-08 Audit Trail.`,
      'success'
    );
  };

  // Dynamic summary mappings based on selected mode
  const getSummaryData = () => {
    switch (selectedMode) {
      case 'Full Access':
        return {
          modeLabel: 'Full access',
          allowed: 'All maintenance, invoices, telemetry & documents',
          hidden: 'None (unredacted)',
          reviewHeadline: 'All record categories visible',
          reviewDesc:
            'The recipient will be granted unredacted read-only access to all historical maintenance and claim records. An audit log entry will record this grant.'
        };
      case 'Limited Access':
        return {
          modeLabel: 'Limited access',
          allowed: 'Periodic service milestones, odometer, battery health',
          hidden: 'Costs, invoices, documents, owner contact',
          reviewHeadline: '4 operational categories visible',
          reviewDesc:
            'The recipient will be granted read-only access to operational logs only. Financial and owner contact data are strictly redacted.'
        };
      case 'Selected Records':
      default:
        return {
          modeLabel: 'Selected records',
          allowed: 'Engine repair history · periodic service',
          hidden: 'Insurance documents · owner contact',
          reviewHeadline: '2 record categories visible',
          reviewDesc:
            'The recipient will be granted read-only access to the allowed categories. An audit log entry will record this grant.'
        };
    }
  };

  const summary = getSummaryData();

  return (
    <div className="autocare-perms-page">
      <Navbar />

      <main className="autocare-perms-main">
        <div className="autocare-perms-container">
          {/* Breadcrumb / Back Navigation */}
          <div className="autocare-perms-back-nav">
            <button
              type="button"
              className="autocare-perms-back-btn"
              onClick={() => navigate(-1)}
              title="Return to previous screen"
            >
              <ArrowLeft size={16} />
              <span>Back to sharing</span>
            </button>
          </div>

          {/* Top Header Row matching Figma */}
          <header className="autocare-perms-header-row">
            <div className="autocare-perms-title-group">
              <h1 className="autocare-perms-title">Access Permission Management</h1>
              <p className="autocare-perms-subtitle">
                BR-06 · Grant the minimum record access needed. Selected permissions are logged in the
                audit trail.
              </p>
            </div>

            <div className="autocare-perms-header-actions">
              <Link
                to="/sharing/secure-link"
                className="autocare-perms-btn-nav"
                title="View Secure Link Sharing"
              >
                <span>Secure Link</span>
              </Link>
              <Link
                to="/sharing/qr"
                className="autocare-perms-btn-nav"
                title="View QR Code Sharing"
              >
                <span>QR Sharing</span>
              </Link>
              <button
                type="button"
                className="autocare-perms-btn-primary"
                onClick={handleGrantAccess}
              >
                <ShieldCheck size={16} />
                <span>Grant access</span>
              </button>
            </div>
          </header>

          {/* Recipient Context Card matching Figma */}
          <section className="autocare-perms-recipient-card" aria-label="Recipient context">
            <h2 className="autocare-perms-card-label">Recipient context</h2>
            <div className="autocare-perms-recipient-content">
              <div className="autocare-perms-recipient-info">
                <span className="autocare-perms-recipient-name">
                  N. Fernando · Ceylinco Insurance
                </span>
                <span className="autocare-perms-recipient-sub">
                  Inspection officer · inspection@ceylinco.lk
                </span>
              </div>
              <div className="autocare-perms-badge-verified">
                <CheckCircle2 size={13} />
                <span>IDENTITY VERIFIED</span>
              </div>
            </div>
          </section>

          {/* 3-Column Permission Options Grid */}
          <section className="autocare-perms-options-grid" aria-label="Permission options">
            {/* 1. Full Access Card */}
            <div
              className={`autocare-perms-option-card ${
                selectedMode === 'Full Access' ? 'is-selected' : ''
              }`}
              onClick={() => setSelectedMode('Full Access')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedMode('Full Access')}
            >
              <div>
                <div className="autocare-perms-option-header">
                  <h3 className="autocare-perms-option-title">Full Access</h3>
                  <p className="autocare-perms-option-desc">
                    Complete service history, costs and documents
                  </p>
                </div>
                <div className="autocare-perms-option-list">
                  <div className="autocare-perms-option-item is-dark">
                    • Maintenance and repair records
                  </div>
                  <div className="autocare-perms-option-item is-dark">
                    • Parts and labor invoices
                  </div>
                  <div className="autocare-perms-option-item is-dark">
                    • Accident history and reports
                  </div>
                  <div className="autocare-perms-option-item is-dark">
                    • Insurance claim documents
                  </div>
                </div>
              </div>
              <div>
                <span
                  className={`autocare-perms-badge-state ${
                    selectedMode === 'Full Access' ? 'is-active' : 'is-unselected'
                  }`}
                >
                  {selectedMode === 'Full Access' ? 'SELECTED' : 'NOT SELECTED'}
                </span>
              </div>
            </div>

            {/* 2. Limited Access Card */}
            <div
              className={`autocare-perms-option-card ${
                selectedMode === 'Limited Access' ? 'is-selected' : ''
              }`}
              onClick={() => setSelectedMode('Limited Access')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedMode('Limited Access')}
            >
              <div>
                <div className="autocare-perms-option-header">
                  <h3 className="autocare-perms-option-title">Limited Access</h3>
                  <p className="autocare-perms-option-desc">
                    Essential operational history only
                  </p>
                </div>
                <div className="autocare-perms-option-list">
                  <div className="autocare-perms-option-item is-dark">
                    • Periodic service milestones
                  </div>
                  <div className="autocare-perms-option-item is-dark">
                    • Odometer reading log
                  </div>
                  <div className="autocare-perms-option-item is-dark">
                    • Battery health status
                  </div>
                  <div className="autocare-perms-option-item is-dark">
                    • Active warning indicators
                  </div>
                </div>
              </div>
              <div>
                <span
                  className={`autocare-perms-badge-state ${
                    selectedMode === 'Limited Access' ? 'is-active' : 'is-unselected'
                  }`}
                >
                  {selectedMode === 'Limited Access' ? 'SELECTED' : 'NOT SELECTED'}
                </span>
              </div>
            </div>

            {/* 3. Selected Records Card (Default in Figma) */}
            <div
              className={`autocare-perms-option-card ${
                selectedMode === 'Selected Records' ? 'is-selected' : ''
              }`}
              onClick={() => setSelectedMode('Selected Records')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedMode('Selected Records')}
            >
              <div>
                <div className="autocare-perms-option-header">
                  <h3 className="autocare-perms-option-title">Selected Records</h3>
                  <p className="autocare-perms-option-desc">
                    Custom record-level grant
                  </p>
                </div>
                <div className="autocare-perms-option-list">
                  <div className="autocare-perms-option-item is-allowed">
                    <Check size={15} strokeWidth={2.5} />
                    <span>Engine repair history — allowed</span>
                  </div>
                  <div className="autocare-perms-option-item is-hidden">
                    <X size={15} strokeWidth={2.5} />
                    <span>Insurance documents — hidden</span>
                  </div>
                  <div className="autocare-perms-option-item is-allowed">
                    <Check size={15} strokeWidth={2.5} />
                    <span>Periodic service records</span>
                  </div>
                </div>
              </div>
              <div>
                <span
                  className={`autocare-perms-badge-state ${
                    selectedMode === 'Selected Records' ? 'is-active' : 'is-unselected'
                  }`}
                >
                  {selectedMode === 'Selected Records' ? 'SELECTED' : 'NOT SELECTED'}
                </span>
              </div>
            </div>
          </section>

          {/* Bottom 2-Column Grid matching Figma */}
          <div className="autocare-perms-bottom-grid">
            {/* Left Column: Permission summary card */}
            <section className="autocare-perms-summary-card" aria-label="Permission summary">
              <h2 className="autocare-perms-summary-title">Permission summary</h2>
              <div className="autocare-perms-summary-list">
                <div className="autocare-perms-summary-row">
                  <span className="autocare-perms-summary-label">Vehicle</span>
                  <span className="autocare-perms-summary-value">
                    WP CAB-1234 · Toyota Aqua 2018
                  </span>
                </div>
                <div className="autocare-perms-summary-row">
                  <span className="autocare-perms-summary-label">Access mode</span>
                  <span className="autocare-perms-summary-value">{summary.modeLabel}</span>
                </div>
                <div className="autocare-perms-summary-row">
                  <span className="autocare-perms-summary-label">Allowed items</span>
                  <span className="autocare-perms-summary-value">{summary.allowed}</span>
                </div>
                <div className="autocare-perms-summary-row">
                  <span className="autocare-perms-summary-label">Hidden items</span>
                  <span className="autocare-perms-summary-value">{summary.hidden}</span>
                </div>
                <div className="autocare-perms-summary-row">
                  <span className="autocare-perms-summary-label">Expiration</span>
                  <span className="autocare-perms-summary-value">{expiration}</span>
                </div>
              </div>
            </section>

            {/* Right Column: Review panel card */}
            <section className="autocare-perms-review-card" aria-label="Review panel">
              <div className="autocare-perms-review-header">
                <h2 className="autocare-perms-review-title">Review panel</h2>
                <div className="autocare-perms-badge-ready">
                  <CheckCircle2 size={12} />
                  <span>READY TO GRANT</span>
                </div>
              </div>

              <div className="autocare-perms-review-headline">{summary.reviewHeadline}</div>
              <p className="autocare-perms-review-desc">{summary.reviewDesc}</p>

              <div className="autocare-perms-expiration-group">
                <label htmlFor="perms-expiration" className="autocare-perms-expiration-label">
                  Expiration
                </label>
                <input
                  id="perms-expiration"
                  type="text"
                  className="autocare-perms-expiration-input"
                  value={expiration}
                  onChange={(e) => setExpiration(e.target.value)}
                  placeholder="30 Sep 2026 · 6:00 PM"
                />
              </div>

              <button
                type="button"
                className="autocare-perms-btn-grant-bottom"
                onClick={handleGrantAccess}
              >
                <ShieldCheck size={16} />
                <span>Grant access</span>
              </button>
            </section>
          </div>
        </div>
      </main>

      {/* Floating Action Confirmation Toast */}
      {toast && (
        <div className={`autocare-perms-toast is-${toast.type}`} role="alert">
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
          <button
            type="button"
            className="autocare-perms-toast-close"
            onClick={() => setToast(null)}
            aria-label="Dismiss toast"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AccessPermissionManagementPage;
