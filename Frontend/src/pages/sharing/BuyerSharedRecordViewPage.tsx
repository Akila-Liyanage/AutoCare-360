import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Eye,
  Download,
  Ban,
  Wrench,
  X,
  ExternalLink,
  Info
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import defaultVehicleImg from '../../assets/vehicles/default-vehicle-hero.png';
import '../../styles/shared-record.css';

type SharingScopeMode = 'Limited Scope' | 'Full Records' | 'Selected Records' | 'Expired';

interface ToastState {
  show: boolean;
  message: string;
}

const BuyerSharedRecordViewPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  // Active simulated permission scope (defaults to Limited Scope as typical for buyer QR view)
  const [scopeMode, setScopeMode] = useState<SharingScopeMode>('Limited Scope');

  // Preview document modal state
  const [activePreviewDoc, setActivePreviewDoc] = useState<{
    title: string;
    authority: string;
    date: string;
  } | null>(null);

  // Floating security restriction toast
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  const showSecurityNotice = (actionName: string) => {
    setToast({
      show: true,
      message: `Security Restriction Active: ${actionName} is strictly disabled by owner permissions for this shared inspection copy.`
    });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  // Active token identifier
  const displayToken = token || '8f9e-2b7c-4a1d';

  return (
    <div className="autocare-shared-page">
      <Navbar />

      <main className="autocare-shared-main">
        <div className="autocare-shared-container">
          {/* Top Security & Session Banner (Protected View Bar) */}
          <div className="autocare-shared-session-bar" role="region" aria-label="Session Security Status">
            <div className="autocare-shared-session-left">
              <span className="autocare-shared-badge-protected">
                <Lock size={12} />
                <span>PROTECTED VIEW</span>
              </span>

              <span className="autocare-shared-session-title">
                Session #{displayToken.substring(0, 9)}
              </span>

              <span className="autocare-shared-session-dot">•</span>

              <span className="autocare-shared-session-recipient">
                Viewer: Prospective Buyer / Verification Officer
              </span>
            </div>

            <div className="autocare-shared-session-right">
              <div className="autocare-shared-expiry-pill">
                <Clock size={13} />
                <span>Expires in 47h 58m</span>
              </div>

              <div className="autocare-shared-restrictions-pill">
                <Ban size={13} />
                <span>Download &amp; Export Disabled</span>
              </div>
            </div>
          </div>

          {/* Interactive Scope Simulation Toolbar */}
          <div className="autocare-shared-control-bar" role="toolbar" aria-label="Permission Scope Simulator">
            <div className="autocare-shared-control-label">
              <Info size={15} style={{ color: '#0056A2' }} />
              <span>Permission Scope View Simulator:</span>
            </div>

            <div className="autocare-shared-scope-selector">
              <button
                type="button"
                className={`autocare-shared-scope-btn ${
                  scopeMode === 'Limited Scope' ? 'is-active' : ''
                }`}
                onClick={() => setScopeMode('Limited Scope')}
              >
                Limited Scope (Default)
              </button>

              <button
                type="button"
                className={`autocare-shared-scope-btn ${
                  scopeMode === 'Full Records' ? 'is-active' : ''
                }`}
                onClick={() => setScopeMode('Full Records')}
              >
                Full Records
              </button>

              <button
                type="button"
                className={`autocare-shared-scope-btn ${
                  scopeMode === 'Selected Records' ? 'is-active' : ''
                }`}
                onClick={() => setScopeMode('Selected Records')}
              >
                Selected Records
              </button>

              <button
                type="button"
                className={`autocare-shared-scope-btn is-danger ${
                  scopeMode === 'Expired' ? 'is-active' : ''
                }`}
                onClick={() => setScopeMode('Expired')}
              >
                Simulate Expired/Revoked
              </button>
            </div>
          </div>

          {/* Conditional Rendering: If Expired / Revoked */}
          {scopeMode === 'Expired' ? (
            <div className="autocare-shared-revoked-box" role="alert">
              <div className="autocare-shared-revoked-icon">
                <AlertTriangle size={36} />
              </div>
              <h2 className="autocare-shared-revoked-title">
                Shared Record Access Expired or Revoked
              </h2>
              <p className="autocare-shared-revoked-desc">
                This secure vehicle passport link or QR authorization token has expired or was revoked by the vehicle owner. All viewing sessions and attempts are logged permanently on the AutoCare 360 system audit ledger.
              </p>
              <button
                type="button"
                className="autocare-shared-btn-reset"
                onClick={() => setScopeMode('Limited Scope')}
              >
                <span>Reset to active shared view</span>
              </button>
            </div>
          ) : (
            <>
              {/* Page Title & Subtitle */}
              <header className="autocare-shared-header">
                <span className="autocare-shared-category-tag">
                  SECURE DECENTRALIZED SHARING · PUBLIC VERIFIER
                </span>
                <h1 className="autocare-shared-title">Protected Vehicle Passport</h1>
                <p className="autocare-shared-subtitle">
                  Cryptographically verified vehicle records for buyer inspection. Authenticated by AutoCare 360 blockchain consensus.
                </p>
              </header>

              {/* Watermarked Vehicle Hero Card */}
              <div className="autocare-shared-hero-card">
                {/* Diagonal Watermark Layer */}
                <div className="autocare-shared-watermark-overlay" aria-hidden="true">
                  AUTOCARE 360 SECURED · BUYER INSPECTION COPY · IP RESTRICTED
                </div>

                <div className="autocare-shared-hero-image-box">
                  <img
                    src={defaultVehicleImg}
                    alt="Toyota Aqua"
                    className="autocare-shared-hero-img"
                  />
                </div>

                <div className="autocare-shared-hero-info">
                  <div className="autocare-shared-hero-top">
                    <div>
                      <h2 className="autocare-shared-vehicle-name">Toyota Aqua (2018)</h2>
                      <p className="autocare-shared-vehicle-reg">
                        WP ABC-1234 · 2018 · Pearl White Metallic
                      </p>
                    </div>

                    <div className="autocare-shared-badge-verified">
                      <CheckCircle2 size={15} />
                      <span>PASSPORT VERIFIED</span>
                    </div>
                  </div>

                  <p className="autocare-shared-hero-desc">
                    Verified compact hybrid electric hatchback with cryptographically certified maintenance history, authentic odometer readings and tamper-proof ledger binding.
                  </p>

                  <div className="autocare-shared-quick-specs">
                    <div className="autocare-shared-spec-item">
                      <span className="autocare-shared-spec-label">Powertrain</span>
                      <span className="autocare-shared-spec-val">1.5L Hybrid · e-CVT</span>
                    </div>

                    <div className="autocare-shared-spec-item">
                      <span className="autocare-shared-spec-label">Verified Mileage</span>
                      <span className="autocare-shared-spec-val">85,240 km [AUTHENTICATED]</span>
                    </div>

                    <div className="autocare-shared-spec-item">
                      <span className="autocare-shared-spec-label">Trust Score</span>
                      <span className="autocare-shared-spec-val" style={{ color: '#15803d' }}>
                        92 / 100 (Excellent)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Metric Highlights Cards */}
              <section className="autocare-shared-metrics-grid" aria-label="Key Vehicle Verification Metrics">
                <div className="autocare-shared-metric-card">
                  <span className="autocare-shared-metric-label">Odometer Integrity</span>
                  <div className="autocare-shared-metric-val">85,240 km</div>
                  <span className="autocare-shared-metric-sub">
                    ✓ No rollback anomalies detected
                  </span>
                </div>

                <div className="autocare-shared-metric-card">
                  <span className="autocare-shared-metric-label">Passport Trust Score</span>
                  <div className="autocare-shared-metric-val" style={{ color: '#15803d' }}>
                    92 / 100
                  </div>
                  <span className="autocare-shared-metric-sub">
                    18 of 19 source checks verified
                  </span>
                </div>

                <div className="autocare-shared-metric-card">
                  <span className="autocare-shared-metric-label">Service Health</span>
                  <div className="autocare-shared-metric-val">Up to date</div>
                  <span className="autocare-shared-metric-sub">
                    Next inspection due in 3,590 km
                  </span>
                </div>

                <div className="autocare-shared-metric-card">
                  <span className="autocare-shared-metric-label">Ledger Consensus</span>
                  <div className="autocare-shared-metric-val">Fully Compliant</div>
                  <span className="autocare-shared-metric-sub">
                    Hash: 0x8f9e...2b7c
                  </span>
                </div>
              </section>

              {/* 2-Column Body Grid */}
              <div className="autocare-shared-body-grid">
                {/* Left Column: Specifications & Service Records */}
                <div>
                  {/* Card 1: Official Registration Specifications */}
                  <section className="autocare-shared-card" aria-label="Official Registration Specifications">
                    <div className="autocare-shared-card-header">
                      <div>
                        <h3 className="autocare-shared-card-title">
                          Official Registration Specifications
                        </h3>
                        <p className="autocare-shared-card-subtitle">
                          Government registry identifiers and vehicle characteristics.
                        </p>
                      </div>
                    </div>

                    <div className="autocare-shared-specs-list">
                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">Registration Number</span>
                        <span className="autocare-shared-spec-row-val">WP ABC-1234</span>
                      </div>

                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">VIN / Chassis No</span>
                        <span className="autocare-shared-spec-row-val">NHP10-23648102</span>
                      </div>

                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">Engine Number</span>
                        <span className="autocare-shared-spec-row-val">1NZ-FXE-45812</span>
                      </div>

                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">Vehicle Category</span>
                        <span className="autocare-shared-spec-row-val">Motor Car (Hybrid)</span>
                      </div>

                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">Manufacturer</span>
                        <span className="autocare-shared-spec-row-val">Toyota Motor Corporation</span>
                      </div>

                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">Model &amp; Variant</span>
                        <span className="autocare-shared-spec-row-val">Aqua 1.5 S</span>
                      </div>

                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">Year of Manufacture</span>
                        <span className="autocare-shared-spec-row-val">2018</span>
                      </div>

                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">Registered Owner</span>
                        <span className="autocare-shared-spec-row-val">
                          {scopeMode === 'Full Records' ? (
                            'David Silva (Current Owner)'
                          ) : (
                            <span className="autocare-shared-masked">
                              <Lock size={12} />
                              <span>[PROTECTED · OWNER MASKED]</span>
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Card 2: Certified Service & Maintenance History */}
                  <section className="autocare-shared-card" aria-label="Maintenance Records">
                    <div className="autocare-shared-card-header">
                      <div>
                        <h3 className="autocare-shared-card-title">
                          Recent Verified Maintenance Records
                        </h3>
                        <p className="autocare-shared-card-subtitle">
                          Certified workshop events logged on the immutable ledger.
                        </p>
                      </div>
                    </div>

                    <div className="autocare-shared-service-list">
                      {/* Record 1 */}
                      <div className="autocare-shared-service-item">
                        <div className="autocare-shared-service-left">
                          <div className="autocare-shared-service-icon-box">
                            <Wrench size={18} />
                          </div>
                          <div className="autocare-shared-service-info">
                            <h4 className="autocare-shared-service-title">
                              Annual safety &amp; electronics diagnostics
                            </h4>
                            <p className="autocare-shared-service-meta">
                              14 Aug 2026 · Apex Tech Service Center · 82,410 km
                            </p>
                          </div>
                        </div>

                        <div className="autocare-shared-service-right">
                          <span className="autocare-shared-service-cost">
                            {scopeMode === 'Full Records' ? (
                              'LKR 28,500'
                            ) : (
                              <span className="autocare-shared-masked">
                                <Lock size={11} /> [Cost Masked]
                              </span>
                            )}
                          </span>
                          <span className="autocare-doc-status-badge verified">VERIFIED</span>
                        </div>
                      </div>

                      {/* Record 2 */}
                      <div className="autocare-shared-service-item">
                        <div className="autocare-shared-service-left">
                          <div className="autocare-shared-service-icon-box">
                            <Wrench size={18} />
                          </div>
                          <div className="autocare-shared-service-info">
                            <h4 className="autocare-shared-service-title">
                              Cabin filter &amp; AC service
                            </h4>
                            <p className="autocare-shared-service-meta">
                              12 Jul 2026 · Apex Tech Service Center · 80,840 km
                            </p>
                          </div>
                        </div>

                        <div className="autocare-shared-service-right">
                          <span className="autocare-shared-service-cost">
                            {scopeMode === 'Full Records' ? (
                              'LKR 12,000'
                            ) : (
                              <span className="autocare-shared-masked">
                                <Lock size={11} /> [Cost Masked]
                              </span>
                            )}
                          </span>
                          <span className="autocare-doc-status-badge verified">VERIFIED</span>
                        </div>
                      </div>

                      {/* Record 3 (Only visible in Full Records or Limited Scope) */}
                      {scopeMode !== 'Selected Records' && (
                        <div className="autocare-shared-service-item">
                          <div className="autocare-shared-service-left">
                            <div className="autocare-shared-service-icon-box">
                              <Wrench size={18} />
                            </div>
                            <div className="autocare-shared-service-info">
                              <h4 className="autocare-shared-service-title">
                                Tyre safety check &amp; rotation
                              </h4>
                              <p className="autocare-shared-service-meta">
                                04 May 2026 · Perera Auto Works · 77,920 km
                              </p>
                            </div>
                          </div>

                          <div className="autocare-shared-service-right">
                            <span className="autocare-shared-service-cost">
                              {scopeMode === 'Full Records' ? (
                                'LKR 8,500'
                              ) : (
                                <span className="autocare-shared-masked">
                                  <Lock size={11} /> [Cost Masked]
                                </span>
                              )}
                            </span>
                            <span className="autocare-doc-status-badge verified">VERIFIED</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                {/* Right Column: Allowed Documents & Access Limitations Notice */}
                <div>
                  {/* Card 3: Allowed Verified Documents */}
                  <section className="autocare-shared-card" aria-label="Verified Documents">
                    <div className="autocare-shared-card-header">
                      <div>
                        <h3 className="autocare-shared-card-title">Allowed Documents</h3>
                        <p className="autocare-shared-card-subtitle">
                          {scopeMode === 'Full Records'
                            ? '4 documents visible'
                            : '2 documents visible under permission policy'}
                        </p>
                      </div>
                    </div>

                    <div className="autocare-shared-doc-list">
                      {/* Doc 1: Registration Certificate */}
                      <div className="autocare-shared-doc-item">
                        <div className="autocare-shared-doc-info">
                          <h4 className="autocare-shared-doc-name">
                            Vehicle registration certificate
                          </h4>
                          <span className="autocare-shared-doc-sub">
                            Verified · DMT Sri Lanka
                          </span>
                        </div>

                        <div className="autocare-shared-doc-actions">
                          <button
                            type="button"
                            className="autocare-shared-btn-view-doc"
                            onClick={() =>
                              setActivePreviewDoc({
                                title: 'Vehicle Registration Certificate',
                                authority: 'Department of Motor Traffic (DMT), Sri Lanka',
                                date: '15 May 2024'
                              })
                            }
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            className="autocare-shared-btn-download-disabled"
                            onClick={() => showSecurityNotice('Document Download')}
                            title="Download disabled by owner policy"
                          >
                            <Download size={13} />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>

                      {/* Doc 2: Diagnostic Report */}
                      <div className="autocare-shared-doc-item">
                        <div className="autocare-shared-doc-info">
                          <h4 className="autocare-shared-doc-name">
                            Annual diagnostic report
                          </h4>
                          <span className="autocare-shared-doc-sub">
                            14 Aug 2026 · Apex Tech Workshop
                          </span>
                        </div>

                        <div className="autocare-shared-doc-actions">
                          <button
                            type="button"
                            className="autocare-shared-btn-view-doc"
                            onClick={() =>
                              setActivePreviewDoc({
                                title: 'Annual Diagnostic & Safety Inspection Report',
                                authority: 'Apex Tech Service Center',
                                date: '14 Aug 2026'
                              })
                            }
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            className="autocare-shared-btn-download-disabled"
                            onClick={() => showSecurityNotice('Document Download')}
                            title="Download disabled by owner policy"
                          >
                            <Download size={13} />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>

                      {/* Doc 3: Insurance Policy (Only if Full Records) */}
                      {scopeMode === 'Full Records' && (
                        <div className="autocare-shared-doc-item">
                          <div className="autocare-shared-doc-info">
                            <h4 className="autocare-shared-doc-name">Insurance policy</h4>
                            <span className="autocare-shared-doc-sub">
                              Expires 14 Nov 2026 · Ceylinco Insurance
                            </span>
                          </div>

                          <div className="autocare-shared-doc-actions">
                            <button
                              type="button"
                              className="autocare-shared-btn-view-doc"
                              onClick={() =>
                                setActivePreviewDoc({
                                  title: 'Insurance Policy Certificate',
                                  authority: 'Ceylinco General Insurance PLC',
                                  date: '15 Nov 2025'
                                })
                              }
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              className="autocare-shared-btn-download-disabled"
                              onClick={() => showSecurityNotice('Document Download')}
                            >
                              <Download size={13} />
                              <span>Download</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Doc 4: Ownership Certificate (Only if Full Records) */}
                      {scopeMode === 'Full Records' && (
                        <div className="autocare-shared-doc-item">
                          <div className="autocare-shared-doc-info">
                            <h4 className="autocare-shared-doc-name">
                              Ownership certificate
                            </h4>
                            <span className="autocare-shared-doc-sub">
                              15 May 2026 · Signed Title Token
                            </span>
                          </div>

                          <div className="autocare-shared-doc-actions">
                            <button
                              type="button"
                              className="autocare-shared-btn-view-doc"
                              onClick={() =>
                                setActivePreviewDoc({
                                  title: 'Ownership Certificate & Title Deed',
                                  authority: 'AutoCare 360 Decentralized Ledger',
                                  date: '15 May 2026'
                                })
                              }
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              className="autocare-shared-btn-download-disabled"
                              onClick={() => showSecurityNotice('Document Download')}
                            >
                              <Download size={13} />
                              <span>Download</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Access Limitations Notice Box */}
                    <div className="autocare-shared-limitations-box">
                      <h4 className="autocare-shared-limitations-title">
                        <Lock size={14} />
                        <span>Security &amp; Policy Protections</span>
                      </h4>
                      <p className="autocare-shared-limitations-desc">
                        Recipient can view certified specifications and service milestones. Downloading, printing, and raw telemetry export are disabled by the vehicle owner.
                      </p>
                      <div className="autocare-shared-limitations-tags">
                        <span className="autocare-shared-limit-tag">✓ View Only</span>
                        <span className="autocare-shared-limit-tag">✕ No Download</span>
                        <span className="autocare-shared-limit-tag">✕ Watermark Sealed</span>
                        <span className="autocare-shared-limit-tag">✓ Ledger Logged</span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              {/* Audit & Compliance Footer Box */}
              <div className="autocare-shared-audit-footer">
                <div className="autocare-shared-audit-info">
                  <ShieldCheck size={18} style={{ color: '#16a34a' }} />
                  <span>
                    Cryptographically registered on AutoCare 360 audit ledger. Access ID:
                  </span>
                  <span className="autocare-shared-audit-hash">
                    0x8f9e2b7c4a1d...bf489
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    type="button"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#0056A2',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onClick={() => navigate('/vehicles')}
                  >
                    <span>Owner Portal</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Document View Preview Modal */}
      {activePreviewDoc && (
        <div className="autocare-shared-modal-overlay" role="dialog" aria-modal="true">
          <div className="autocare-shared-modal-card">
            <div className="autocare-shared-modal-header">
              <h3 className="autocare-shared-modal-title">Protected Document Inspection</h3>
              <button
                type="button"
                className="autocare-shared-modal-close"
                onClick={() => setActivePreviewDoc(null)}
                aria-label="Close document inspection"
              >
                <X size={18} />
              </button>
            </div>

            <div className="autocare-shared-modal-body">
              <div className="autocare-shared-modal-watermark">
                AUTOCARE 360 SECURED
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <FileText size={28} color="#0056A2" />
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    {activePreviewDoc.title}
                  </h4>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {activePreviewDoc.authority}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#334155' }}>
                <div>
                  <strong>Verification Date:</strong> {activePreviewDoc.date}
                </div>
                <div>
                  <strong>Ledger Authenticity:</strong> Certified Immutable Hash
                </div>
                <div>
                  <strong>Inspection Restriction:</strong> Dynamic Recipient Watermark Embedded
                </div>
              </div>

              <div className="autocare-shared-modal-notice">
                <Ban size={15} style={{ flexShrink: 0 }} />
                <span>
                  Direct PDF export and high-resolution printing are blocked by the owner security policy.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
                onClick={() => setActivePreviewDoc(null)}
              >
                Close viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Restriction Toast */}
      {toast.show && (
        <div className="autocare-shared-toast" role="alert">
          <Ban size={18} style={{ color: '#f87171', flexShrink: 0 }} />
          <span>{toast.message}</span>
          <button
            type="button"
            className="autocare-shared-toast-close"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            aria-label="Dismiss security notice"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default BuyerSharedRecordViewPage;
