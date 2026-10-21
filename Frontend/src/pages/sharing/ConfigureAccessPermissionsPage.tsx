import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  CheckCircle2,
  AlertCircle,
  X,
  Link as LinkIcon,
  QrCode,
  ShieldCheck
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import '../../styles/protection.css';

type AccessMethod = 'Secure URL Key' | 'QR Authorization';
type VisibilityScope = 'Full Records' | 'Limited Scope' | 'Custom Select';

interface CheckboxState {
  odometerTelemetry: boolean;
  certifiedChronology: boolean;
  detailedInvoices: boolean;
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'info';
}

const ConfigureAccessPermissionsPage: React.FC = () => {
  const navigate = useNavigate();

  // Access method tab
  const [accessMethod, setAccessMethod] = useState<AccessMethod>('Secure URL Key');

  // Recipient info
  const [recipientEntity, setRecipientEntity] = useState<string>('Lanka Premium Cars (Pvt) Ltd');
  const [recipientEmail, setRecipientEmail] = useState<string>('evaluations@lankapremium.lk');

  // Expiry inputs
  const [expiryDuration, setExpiryDuration] = useState<string>('48 Hours (Recommended)');
  const [expiryDateTime, setExpiryDateTime] = useState<string>('Expires 30 Sep 2026, 10:30');

  // Scope selection
  const [visibilityScope, setVisibilityScope] = useState<VisibilityScope>('Limited Scope');

  // Checkbox categories
  const [checkboxes, setCheckboxes] = useState<CheckboxState>({
    odometerTelemetry: true,
    certifiedChronology: true,
    detailedInvoices: false
  });

  // Active Credentials Key
  const [credentialsKey, setCredentialsKey] = useState<string>(
    'https://autocare360.lk/verify/auth_token=8f9e...2b7c'
  );

  // Toast feedback
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

  const handleScopeSelect = (scope: VisibilityScope) => {
    setVisibilityScope(scope);
    if (scope === 'Full Records') {
      setCheckboxes({
        odometerTelemetry: true,
        certifiedChronology: true,
        detailedInvoices: true
      });
    } else if (scope === 'Limited Scope') {
      setCheckboxes({
        odometerTelemetry: true,
        certifiedChronology: true,
        detailedInvoices: false
      });
    }
  };

  const handleCheckboxToggle = (key: keyof CheckboxState) => {
    const nextState = {
      ...checkboxes,
      [key]: !checkboxes[key]
    };
    setCheckboxes(nextState);

    // If matches preset scopes, sync scope name; otherwise set Custom Select
    if (nextState.odometerTelemetry && nextState.certifiedChronology && nextState.detailedInvoices) {
      setVisibilityScope('Full Records');
    } else if (nextState.odometerTelemetry && nextState.certifiedChronology && !nextState.detailedInvoices) {
      setVisibilityScope('Limited Scope');
    } else {
      setVisibilityScope('Custom Select');
    }
  };

  const handleGenerateLink = () => {
    const randomHash1 = Math.random().toString(36).substring(2, 6);
    const randomHash2 = Math.random().toString(36).substring(2, 6);
    const newKey = `https://autocare360.lk/verify/auth_token=${randomHash1}...${randomHash2}`;
    setCredentialsKey(newKey);
    showToast(
      `Verifiable cryptographic link generated successfully for ${recipientEntity || 'recipient'}. Registered on audit ledger.`,
      'success'
    );
  };

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(credentialsKey).catch(() => {});
    }
    showToast('Active credentials key copied to clipboard!', 'success');
  };

  return (
    <div className="autocare-protect-page">
      <Navbar />

      <main className="autocare-protect-main">
        <div className="autocare-protect-container">
          {/* Breadcrumb / Back Navigation */}
          <div className="autocare-protect-back-nav">
            <button
              type="button"
              className="autocare-protect-back-btn"
              onClick={() => navigate('/sharing/permissions')}
              title="Return to Access Permission Management"
            >
              <ArrowLeft size={16} />
              <span>Back to access permissions</span>
            </button>
          </div>

          {/* Top Header Block matching Figma */}
          <header className="autocare-protect-header">
            <div className="autocare-protect-context-tag">
              <span className="autocare-protect-tag-blue">SECURE DECENTRALIZED SHARING</span>
              <span className="autocare-protect-tag-dot">•</span>
              <span className="autocare-protect-tag-muted">VEHICLE INDEX: WP ABC-1234</span>
            </div>

            <h1 className="autocare-protect-title">Configure Access Permissions</h1>
            <p className="autocare-protect-subtitle">
              Generate time-locked, cryptographically verified share-links and secure QR authorization certificates. All viewing transactions are registered permanently on the system audit ledger.
            </p>
          </header>

          {/* 2-Column Layout Grid */}
          <div className="autocare-protect-grid">
            {/* Left Column: Main Configuration Card */}
            <section className="autocare-protect-card" aria-label="Access Controls and Data Visibility Scope">
              {/* Section 1: Recipient & Access Controls */}
              <div className="autocare-protect-section">
                <h2 className="autocare-protect-section-title">1. Recipient &amp; Access Controls</h2>

                {/* Segmented Selector */}
                <div className="autocare-protect-segmented-bar" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={accessMethod === 'Secure URL Key'}
                    className={`autocare-protect-segment-btn ${
                      accessMethod === 'Secure URL Key' ? 'is-active' : ''
                    }`}
                    onClick={() => setAccessMethod('Secure URL Key')}
                  >
                    <LinkIcon size={14} />
                    <span>Secure URL Key</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={accessMethod === 'QR Authorization'}
                    className={`autocare-protect-segment-btn ${
                      accessMethod === 'QR Authorization' ? 'is-active' : ''
                    }`}
                    onClick={() => setAccessMethod('QR Authorization')}
                  >
                    <QrCode size={14} />
                    <span>QR Authorization</span>
                  </button>
                </div>

                {/* Recipient Entity / Name */}
                <div className="autocare-protect-form-group">
                  <label htmlFor="recipient-entity" className="autocare-protect-label">
                    Recipient Entity / Name
                  </label>
                  <input
                    id="recipient-entity"
                    type="text"
                    className="autocare-protect-input"
                    value={recipientEntity}
                    onChange={(e) => setRecipientEntity(e.target.value)}
                    placeholder="e.g. Lanka Premium Cars (Pvt) Ltd"
                  />
                </div>

                {/* Recipient Verification Email */}
                <div className="autocare-protect-form-group">
                  <label htmlFor="recipient-email" className="autocare-protect-label">
                    Recipient Verification Email
                  </label>
                  <input
                    id="recipient-email"
                    type="email"
                    className="autocare-protect-input"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="e.g. evaluations@lankapremium.lk"
                  />
                </div>

                {/* Automatic Expiry (Mandatory SLA Lock) */}
                <div className="autocare-protect-form-group">
                  <label htmlFor="expiry-duration" className="autocare-protect-label">
                    Automatic Expiry (Mandatory SLA Lock)
                  </label>
                  <div className="autocare-protect-expiry-row">
                    <div className="autocare-protect-input-icon-wrap">
                      <input
                        id="expiry-duration"
                        type="text"
                        className="autocare-protect-input"
                        value={expiryDuration}
                        onChange={(e) => setExpiryDuration(e.target.value)}
                        placeholder="e.g. 48 Hours (Recommended)"
                      />
                      <Clock size={16} className="autocare-protect-input-icon" />
                    </div>

                    <div className="autocare-protect-input-icon-wrap">
                      <input
                        id="expiry-datetime"
                        type="text"
                        className="autocare-protect-input autocare-protect-input-alert"
                        value={expiryDateTime}
                        onChange={(e) => setExpiryDateTime(e.target.value)}
                        placeholder="e.g. Expires 30 Sep 2026, 10:30"
                      />
                      <Calendar size={16} className="autocare-protect-input-icon" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Define Data Visibility Scope */}
              <div className="autocare-protect-section">
                <h2 className="autocare-protect-section-title">2. Define Data Visibility Scope</h2>

                {/* 3 Scope Cards */}
                <div className="autocare-protect-scope-grid">
                  {/* Card 1: Full Records */}
                  <div
                    className={`autocare-protect-scope-card ${
                      visibilityScope === 'Full Records' ? 'is-selected' : ''
                    }`}
                    onClick={() => handleScopeSelect('Full Records')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleScopeSelect('Full Records');
                    }}
                  >
                    <h3 className="autocare-protect-scope-title">Full Records</h3>
                    <p className="autocare-protect-scope-desc">
                      Shares all specs, diagnostics &amp; financials.
                    </p>
                  </div>

                  {/* Card 2: Limited Scope (Default in Figma) */}
                  <div
                    className={`autocare-protect-scope-card ${
                      visibilityScope === 'Limited Scope' ? 'is-selected' : ''
                    }`}
                    onClick={() => handleScopeSelect('Limited Scope')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleScopeSelect('Limited Scope');
                    }}
                  >
                    <h3 className="autocare-protect-scope-title">Limited Scope</h3>
                    <p className="autocare-protect-scope-desc">
                      Masks owner identification &amp; service costs.
                    </p>
                  </div>

                  {/* Card 3: Custom Select */}
                  <div
                    className={`autocare-protect-scope-card ${
                      visibilityScope === 'Custom Select' ? 'is-selected' : ''
                    }`}
                    onClick={() => handleScopeSelect('Custom Select')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleScopeSelect('Custom Select');
                    }}
                  >
                    <h3 className="autocare-protect-scope-title">Custom Select</h3>
                    <p className="autocare-protect-scope-desc">
                      Manual checklist confirmation below.
                    </p>
                  </div>
                </div>

                {/* Checkbox List */}
                <div className="autocare-protect-checkboxes-group">
                  <label className="autocare-protect-checkbox-item">
                    <input
                      type="checkbox"
                      checked={checkboxes.odometerTelemetry}
                      onChange={() => handleCheckboxToggle('odometerTelemetry')}
                    />
                    <span>Odometer &amp; Telemetry Audits</span>
                  </label>

                  <label className="autocare-protect-checkbox-item">
                    <input
                      type="checkbox"
                      checked={checkboxes.certifiedChronology}
                      onChange={() => handleCheckboxToggle('certifiedChronology')}
                    />
                    <span>Certified Service Chronology</span>
                  </label>

                  <label className="autocare-protect-checkbox-item">
                    <input
                      type="checkbox"
                      checked={checkboxes.detailedInvoices}
                      onChange={() => handleCheckboxToggle('detailedInvoices')}
                    />
                    <span>Detailed Invoice Expenses &amp; Garage Parts</span>
                  </label>
                </div>
              </div>
            </section>

            {/* Right Column: Live Passport Preview + Active Credentials */}
            <div className="autocare-protect-right-col">
              {/* Card 1: Live Passport Preview */}
              <section className="autocare-protect-preview-card" aria-label="Live Passport Preview">
                <div className="autocare-protect-preview-top">
                  <span className="autocare-protect-preview-label">LIVE PASSPORT PREVIEW</span>
                  <span className="autocare-protect-badge-protected">PROTECTED VIEW</span>
                </div>

                {/* Inner Vehicle Card with Watermark */}
                <div className="autocare-protect-passport-box">
                  <div className="autocare-protect-watermark">
                    AUTOCARE 360 SECURED
                  </div>

                  <h3 className="autocare-protect-passport-title">Toyota Aqua (2018)</h3>
                  <div className="autocare-protect-passport-specs">
                    <div>CHASSIS: NHP10-23648102</div>
                    <div>
                      ODOMETER: 85,240 km{' '}
                      <span className="autocare-protect-spec-highlight">[AUTHENTICATED]</span>
                    </div>
                    <div>TRUST RATING: 92/100</div>
                    {visibilityScope === 'Limited Scope' && (
                      <div style={{ color: '#cbd5e1', fontSize: '11px', marginTop: '4px' }}>
                        * SENSITIVE FINANCIALS &amp; OWNER PII REDACTED
                      </div>
                    )}
                    {visibilityScope === 'Full Records' && (
                      <div style={{ color: '#86efac', fontSize: '11px', marginTop: '4px' }}>
                        * FULL HISTORICAL &amp; INVOICE DISCLOSURE
                      </div>
                    )}
                  </div>
                </div>

                <p className="autocare-protect-preview-note">
                  * Dynamic watermarks containing recipient details and temporary IP restriction tags will be rendered on execution.
                </p>

                <button
                  type="button"
                  className="autocare-protect-btn-generate"
                  onClick={handleGenerateLink}
                >
                  <ShieldCheck size={18} />
                  <span>Generate Verifiable Link</span>
                </button>
              </section>

              {/* Card 2: Active Credentials Key */}
              <section className="autocare-protect-creds-card" aria-label="Active Credentials Key">
                <h2 className="autocare-protect-creds-title">Active Credentials Key</h2>
                <div className="autocare-protect-creds-row">
                  <input
                    type="text"
                    readOnly
                    className="autocare-protect-creds-input"
                    value={credentialsKey}
                    aria-label="Active credentials token link"
                  />
                  <button
                    type="button"
                    className="autocare-protect-btn-copy"
                    onClick={handleCopy}
                  >
                    <Copy size={15} />
                    <span>Copy</span>
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toast.show && (
        <div className={`autocare-protect-toast is-${toast.type}`} role="alert">
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
          ) : (
            <AlertCircle size={18} style={{ color: '#38bdf8', flexShrink: 0 }} />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            className="autocare-protect-toast-close"
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

export default ConfigureAccessPermissionsPage;
