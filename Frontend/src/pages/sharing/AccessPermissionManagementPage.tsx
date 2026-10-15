import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  X,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Sliders
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import '../../styles/permissions.css';

type PermissionMode = 'Full Access' | 'Limited Access' | 'Selected Records';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'info';
}

const AccessPermissionManagementPage: React.FC = () => {
  const navigate = useNavigate();

  // Active permission tier/mode
  const [selectedMode, setSelectedMode] = useState<PermissionMode>('Selected Records');

  // Editable expiration datetime string matching Figma target
  const [expiration, setExpiration] = useState<string>('30 Sep 2026 · 6:00 PM');

  // Toast notification state
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  const handleGrantAccess = () => {
    showToast(
      `Access granted under "${selectedMode}" to N. Fernando (Ceylinco Insurance) until ${expiration}. Event logged in BR-08 Audit Trail.`,
      'success'
    );
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
                onClick={handleGrantAccess}
              >
                <Check size={16} />
                <span>Grant access</span>
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
              onClick={() => setSelectedMode('Full Access')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedMode('Full Access');
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
              onClick={() => setSelectedMode('Limited Access')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedMode('Limited Access');
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
              onClick={() => setSelectedMode('Selected Records')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedMode('Selected Records');
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
              </div>
            </section>

            {/* Right: Review Panel Card */}
            <section className="autocare-perm-review-card" aria-label="Review Panel">
              <h2 className="autocare-perm-review-title">Review panel</h2>

              <div className="autocare-perm-badge-ready">
                READY TO GRANT
              </div>

              <div className="autocare-perm-review-headline">
                {summary.categoriesCount}
              </div>

              <p className="autocare-perm-review-desc">
                Recipient can view but cannot download or reshare. Every access event appears in BR-08 Audit Trail.
              </p>

              <div className="autocare-perm-form-group">
                <label htmlFor="perm-expiration-input" className="autocare-perm-label">
                  Expiration
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="perm-expiration-input"
                    type="text"
                    className="autocare-perm-input"
                    value={expiration}
                    onChange={(e) => setExpiration(e.target.value)}
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
                onClick={handleGrantAccess}
              >
                <ShieldCheck size={16} />
                <span>Grant access</span>
              </button>

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
        <div className={`autocare-perm-toast is-${toast.type}`} role="alert">
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
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
