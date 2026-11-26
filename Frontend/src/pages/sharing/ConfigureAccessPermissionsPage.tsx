import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

interface GenerationSnapshot {
  recipientEntity: string;
  recipientEmail: string;
  expiryDuration: string;
  expiryDateTime: string;
  accessMethod: AccessMethod;
  visibilityScope: VisibilityScope;
  checkboxes: CheckboxState;
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'info';
}

const formatExpiryDisplay = (raw: string): string => {
  if (!raw) return '30 Sep 2026 · 10:30';
  const cleaned = raw.replace(/^Expires\s*/i, '').trim();
  return cleaned.replace(/,\s*/, ' · ');
};

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

  // Generated credential state
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);
  const [generationSnapshot, setGenerationSnapshot] = useState<GenerationSnapshot | null>(null);
  const [credentialCode, setCredentialCode] = useState<string>('AC360-PREVIEW-8F9E');
  const [previewUrl, setPreviewUrl] = useState<string>(
    'https://autocare360.lk/verify/preview/AC360-PREVIEW-8F9E'
  );

  // Check if inputs differ from generation snapshot
  const isConfigChanged = Boolean(
    hasGenerated &&
    generationSnapshot &&
    (generationSnapshot.recipientEntity !== recipientEntity.trim() ||
      generationSnapshot.recipientEmail !== recipientEmail.trim() ||
      generationSnapshot.expiryDuration !== expiryDuration.trim() ||
      generationSnapshot.expiryDateTime !== expiryDateTime.trim() ||
      generationSnapshot.accessMethod !== accessMethod ||
      generationSnapshot.visibilityScope !== visibilityScope ||
      generationSnapshot.checkboxes.odometerTelemetry !== checkboxes.odometerTelemetry ||
      generationSnapshot.checkboxes.certifiedChronology !== checkboxes.certifiedChronology ||
      generationSnapshot.checkboxes.detailedInvoices !== checkboxes.detailedInvoices)
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
    setHasGenerated(true);
    setGenerationSnapshot({
      recipientEntity: recipientEntity.trim(),
      recipientEmail: recipientEmail.trim(),
      expiryDuration: expiryDuration.trim(),
      expiryDateTime: expiryDateTime.trim(),
      accessMethod,
      visibilityScope,
      checkboxes: { ...checkboxes }
    });
    setCredentialCode('AC360-PREVIEW-8F9E');
    setPreviewUrl('https://autocare360.lk/verify/preview/AC360-PREVIEW-8F9E');
    showToast(
      `Preview share link generated for ${recipientEntity || 'recipient'}. For live tokenized access, use Secure Link Sharing.`,
      'info'
    );
  };

  const handleCopy = (textToCopy?: string) => {
    const target = textToCopy || previewUrl || credentialCode;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(target).catch(() => {});
    }
    showToast('Copied preview credential', 'success');
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
                  Field-level data protection configuration is a preview UI. For active sharing, generate a live time-locked link in Secure Link Sharing.
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

          {/* Top Header Block matching Figma */}
          <header className="autocare-protect-header">
            <div className="autocare-protect-context-tag">
              <span className="autocare-protect-tag-blue">SECURE VERIFIED SHARING</span>
              <span className="autocare-protect-tag-dot">•</span>
              <span className="autocare-protect-tag-muted">VEHICLE INDEX: WP ABC-1234</span>
            </div>

            <h1 className="autocare-protect-title">Configure Access Permissions</h1>
            <p className="autocare-protect-subtitle">
              Configure custom data visibility parameters for secure tokenized vehicle passport access and verification.
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
              {/* Card 1: Protected Passport Preview */}
              <section className="autocare-protect-preview-card" aria-label="Protected Passport Preview">
                <div className="autocare-protect-preview-top">
                  <span className="autocare-protect-preview-label">PROTECTED PASSPORT PREVIEW</span>
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
                  <span>{hasGenerated ? 'Regenerate Preview Link' : 'Generate Verifiable Link'}</span>
                </button>
              </section>

              {/* Card 2: Persistent Result Card — Preview Credential */}
              {hasGenerated && (
                <section className="autocare-protect-creds-card" aria-label="Preview Credential">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '14px',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <h2 className="autocare-protect-creds-title" style={{ margin: 0 }}>
                      Preview credential
                    </h2>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: isConfigChanged ? '#fffbeb' : '#dcfce7',
                        color: isConfigChanged ? '#b45309' : '#15803d',
                        border: `1px solid ${isConfigChanged ? '#fde68a' : '#86efac'}`,
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px'
                      }}
                    >
                      {isConfigChanged ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                      <span>{isConfigChanged ? 'Configuration changed' : 'Preview ready'}</span>
                    </span>
                  </div>

                  {isConfigChanged && (
                    <div
                      style={{
                        backgroundColor: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        marginBottom: '14px',
                        fontSize: '12.5px',
                        color: '#92400e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertCircle size={15} style={{ color: '#d97706', flexShrink: 0 }} />
                        <span>Parameters modified since generation.</span>
                      </div>
                      <strong style={{ color: '#b45309', fontSize: '12px' }}>
                        Regenerate preview credential
                      </strong>
                    </div>
                  )}

                  {/* Summary Details */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      fontSize: '13px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      marginBottom: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Status</span>
                      <strong style={{ color: isConfigChanged ? '#d97706' : '#16a34a' }}>
                        {isConfigChanged ? 'Configuration changed' : 'Preview ready'}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Recipient</span>
                      <span style={{ color: '#0f172a', fontWeight: 700, textAlign: 'right' }}>
                        {recipientEntity || 'Lanka Premium Cars (Pvt) Ltd'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Vehicle</span>
                      <span style={{ color: '#0f172a', fontWeight: 600, textAlign: 'right' }}>
                        WP ABC-1234 · Toyota Aqua
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Scope</span>
                      <span style={{ color: '#0056A2', fontWeight: 700, textAlign: 'right' }}>
                        {visibilityScope}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Expiry</span>
                      <span style={{ color: '#0f172a', fontWeight: 600, textAlign: 'right' }}>
                        {formatExpiryDisplay(expiryDateTime)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Credential</span>
                      {isConfigChanged ? (
                        <span style={{ color: '#d97706', fontWeight: 700, fontStyle: 'italic', fontSize: '12.5px' }}>
                          Regenerate preview credential
                        </span>
                      ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                              color: '#0f172a',
                              fontWeight: 700,
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              padding: '2px 8px',
                              borderRadius: '5px'
                            }}
                          >
                            {credentialCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(credentialCode)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#0056A2',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px'
                            }}
                            title="Copy preview credential"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preview URL row with copy button */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>
                        Preview URL
                      </label>
                      {isConfigChanged && (
                        <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 700 }}>
                          Regenerate preview credential
                        </span>
                      )}
                    </div>

                    <div className="autocare-protect-creds-row">
                      <input
                        type="text"
                        readOnly
                        className="autocare-protect-creds-input"
                        value={isConfigChanged ? 'Configuration changed — click Regenerate Preview Link' : previewUrl}
                        style={{
                          color: isConfigChanged ? '#d97706' : '#0056A2',
                          backgroundColor: isConfigChanged ? '#fffbeb' : '#f0f7ff',
                          borderColor: isConfigChanged ? '#fde68a' : '#bfdbfe'
                        }}
                        aria-label="Preview verification link"
                      />
                      <button
                        type="button"
                        className="autocare-protect-btn-copy"
                        onClick={() => handleCopy(previewUrl)}
                        disabled={isConfigChanged}
                        style={{
                          opacity: isConfigChanged ? 0.6 : 1,
                          cursor: isConfigChanged ? 'not-allowed' : 'pointer'
                        }}
                        title={isConfigChanged ? 'Regenerate preview credential before copying' : 'Copy preview URL'}
                      >
                        <Copy size={15} />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>

                  {/* Helper notice */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      color: '#64748b',
                      fontSize: '12px',
                      lineHeight: 1.45,
                      marginTop: '12px'
                    }}
                  >
                    <ShieldCheck size={16} style={{ color: '#0056A2', flexShrink: 0, marginTop: '1px' }} />
                    <span>
                      Frontend preview only — live token-secured access is created through Secure Link Sharing.
                    </span>
                  </div>
                </section>
              )}
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
