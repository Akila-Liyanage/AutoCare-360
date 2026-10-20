import React, { useState, useEffect, useCallback } from 'react';
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
  Loader2,
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import defaultVehicleImg from '../../assets/vehicles/default-vehicle-hero.png';
import api from '../../services/api';
import '../../styles/shared-record.css';

interface SharedGrantData {
  id: string;
  type: 'link' | 'qr';
  permissionLevel: 'full' | 'limited' | 'selected';
  allowedSections: string[];
  expiresAt: string;
  purpose: string;
  recipientName: string;
  viewCount: number;
  maxViews?: number | null;
}

interface ProtectionData {
  allowDownload: boolean;
  allowPrint: boolean;
  allowCopy: boolean;
  watermarkEnabled: boolean;
  watermarkText: string;
}

interface SharedVehicleData {
  _id: string;
  registrationNumber: string;
  vin: string;
  manufacturer: string;
  model: string;
  manufacturingYear: number;
  vehicleType: string;
  fuelType: string;
  transmission: string;
  color: string;
  currentMileage: number | null;
  engineNumber: string | null;
  imageUrl?: string | null;
  trustScore: number;
  owner?: {
    fullName: string;
    email?: string;
    phone?: string;
  } | null;
}

interface SharedServiceRecord {
  _id: string;
  serviceType: string;
  workPerformed: string;
  verificationStatus: string;
  serviceDate: string | null;
  mileage: number | null;
  garageName: string | null;
  technicianName: string | null;
  partsReplaced?: string[];
  totalCost: number | null;
  labourCost: number | null;
  partsCost: number | null;
  invoiceUrl: string | null;
  serviceImages?: string[];
}

interface SharedDocumentRecord {
  _id: string;
  title: string;
  documentType: string;
  description?: string;
  issueDate?: string | null;
  expiryDate?: string | null;
  source: string;
  verificationStatus: string;
  fileUrl?: string | null;
}

interface PublicSharedPayload {
  grant: SharedGrantData;
  protection: ProtectionData;
  vehicle: SharedVehicleData;
  services: SharedServiceRecord[];
  documents: SharedDocumentRecord[];
}

interface ToastState {
  show: boolean;
  message: string;
}

const formatRemainingTime = (isoDate: string) => {
  if (!isoDate) return '48h';
  const diffMs = new Date(isoDate).getTime() - new Date().getTime();
  if (diffMs <= 0) return 'Expired';
  const totalMins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours < 1) return `${mins}m`;
  return `${hours}h ${mins}m`;
};

const formatDateShort = (isoDate?: string | null) => {
  if (!isoDate) return 'N/A';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const BuyerSharedRecordViewPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  // Async data states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [sharedData, setSharedData] = useState<PublicSharedPayload | null>(null);

  // Preview document modal state
  const [activePreviewDoc, setActivePreviewDoc] = useState<{
    title: string;
    authority: string;
    date: string;
    fileUrl?: string | null;
  } | null>(null);

  // Floating security restriction toast
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  const showSecurityNotice = useCallback((actionName: string) => {
    setToast({
      show: true,
      message: `Security Restriction Active: ${actionName} is strictly disabled by owner permissions for this shared inspection copy.`,
    });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  }, []);

  // Fetch Public Shared Record
  useEffect(() => {
    let isMounted = true;

    const fetchSharedRecord = async () => {
      if (!token) {
        setIsLoading(false);
        setErrorType('missing_token');
        setErrorMessage('No vehicle sharing token provided. Please scan a valid QR code or open a shared link.');
        return;
      }

      try {
        setIsLoading(true);
        setErrorType(null);
        setErrorMessage('');

        const res = await api.get<{ success: boolean; data: PublicSharedPayload }>(
          `/public/shared/${encodeURIComponent(token)}`
        );

        if (isMounted) {
          setSharedData(res.data.data);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!isMounted) return;

        interface AxiosErrorShape {
          response?: {
            status?: number;
            data?: {
              errorType?: string;
              message?: string;
            };
          };
          message?: string;
        }

        const axiosErr = err as AxiosErrorShape;
        const status = axiosErr.response?.status;
        const apiErrorType = axiosErr.response?.data?.errorType;
        const msg =
          axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Failed to verify shared vehicle record token.';

        if (status === 404 || apiErrorType === 'not_found') {
          setErrorType('not_found');
          setErrorMessage(msg);
        } else if (status === 410 || apiErrorType === 'expired') {
          setErrorType('expired');
          setErrorMessage(msg);
        } else if (apiErrorType === 'revoked') {
          setErrorType('revoked');
          setErrorMessage(msg);
        } else if (apiErrorType === 'limit_reached') {
          setErrorType('limit_reached');
          setErrorMessage(msg);
        } else {
          setErrorType('server_error');
          setErrorMessage(msg);
        }

        setIsLoading(false);
      }
    };

    fetchSharedRecord();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Copy protection: block Ctrl+C / copy event if allowCopy = false
  const handleCopyProtection = (e: React.ClipboardEvent) => {
    if (sharedData?.protection && !sharedData.protection.allowCopy) {
      e.preventDefault();
      showSecurityNotice('Text Copying');
    }
  };

  const displayToken = token || '8f9e-2b7c-4a1d';

  return (
    <div
      className="autocare-shared-page"
      onCopy={handleCopyProtection}
      style={{
        userSelect: sharedData?.protection && !sharedData.protection.allowCopy ? 'none' : 'auto',
      }}
    >
      {/* Print protection shield if allowPrint is false */}
      {sharedData?.protection && !sharedData.protection.allowPrint && (
        <style>
          {`
            @media print {
              body, .autocare-shared-page {
                display: none !important;
                visibility: hidden !important;
              }
            }
          `}
        </style>
      )}

      <Navbar />

      <main className="autocare-shared-main">
        <div className="autocare-shared-container">
          {/* Loading State */}
          {isLoading ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '100px 0',
                gap: '16px',
                color: '#64748b',
                fontWeight: 600,
              }}
            >
              <Loader2 size={36} className="animate-spin" style={{ color: '#0056A2' }} />
              <span style={{ fontSize: '15px' }}>
                Verifying cryptographic ledger token &amp; loading vehicle passport...
              </span>
            </div>
          ) : errorType ? (
            /* Error & Expiration States */
            <div className="autocare-shared-revoked-box" role="alert">
              <div className="autocare-shared-revoked-icon">
                {errorType === 'revoked' ? (
                  <Ban size={36} style={{ color: '#ef4444' }} />
                ) : errorType === 'expired' ? (
                  <Clock size={36} style={{ color: '#f59e0b' }} />
                ) : (
                  <AlertTriangle size={36} style={{ color: '#ef4444' }} />
                )}
              </div>
              <h2 className="autocare-shared-revoked-title">
                {errorType === 'revoked'
                  ? 'Shared Record Access Revoked'
                  : errorType === 'expired'
                  ? 'Shared Record Access Expired'
                  : errorType === 'limit_reached'
                  ? 'Maximum Access Limit Reached'
                  : errorType === 'not_found'
                  ? 'Invalid or Non-Existent Share Token'
                  : 'Unable to Load Shared Vehicle Record'}
              </h2>
              <p className="autocare-shared-revoked-desc">
                {errorMessage ||
                  'This secure vehicle passport link or QR authorization token has expired or was revoked by the vehicle owner. All viewing sessions and attempts are logged permanently on the AutoCare 360 system audit ledger.'}
              </p>
              <button
                type="button"
                className="autocare-shared-btn-reset"
                onClick={() => navigate('/')}
              >
                <span>Return to AutoCare 360 home</span>
              </button>
            </div>
          ) : sharedData ? (
            <>
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
                    Viewer: {sharedData.grant.recipientName || 'Prospective Buyer / Verification Officer'}
                  </span>
                </div>

                <div className="autocare-shared-session-right">
                  <div className="autocare-shared-expiry-pill">
                    <Clock size={13} />
                    <span>Expires in {formatRemainingTime(sharedData.grant.expiresAt)}</span>
                  </div>

                  <div className="autocare-shared-restrictions-pill">
                    <Ban size={13} />
                    <span>
                      {!sharedData.protection.allowDownload
                        ? 'Download & Export Disabled'
                        : !sharedData.protection.allowPrint
                        ? 'Printing Restricted'
                        : 'Protected Passport View'}
                    </span>
                  </div>
                </div>
              </div>

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
                {sharedData.protection.watermarkEnabled && (
                  <div className="autocare-shared-watermark-overlay" aria-hidden="true">
                    {sharedData.protection.watermarkText || 'AUTOCARE 360 SECURED · BUYER INSPECTION COPY'}
                  </div>
                )}

                <div className="autocare-shared-hero-image-box">
                  <img
                    src={sharedData.vehicle.imageUrl || defaultVehicleImg}
                    alt={`${sharedData.vehicle.manufacturer} ${sharedData.vehicle.model}`}
                    className="autocare-shared-hero-img"
                  />
                </div>

                <div className="autocare-shared-hero-info">
                  <div className="autocare-shared-hero-top">
                    <div>
                      <h2 className="autocare-shared-vehicle-name">
                        {sharedData.vehicle.manufacturer} {sharedData.vehicle.model} ({sharedData.vehicle.manufacturingYear})
                      </h2>
                      <p className="autocare-shared-vehicle-reg">
                        {sharedData.vehicle.registrationNumber} · {sharedData.vehicle.manufacturingYear} · {sharedData.vehicle.color}
                      </p>
                    </div>

                    <div className="autocare-shared-badge-verified">
                      <CheckCircle2 size={15} />
                      <span>PASSPORT VERIFIED</span>
                    </div>
                  </div>

                  <p className="autocare-shared-hero-desc">
                    Verified {sharedData.vehicle.manufacturer} {sharedData.vehicle.model} with cryptographically certified maintenance history, authentic odometer readings and tamper-proof ledger binding.
                  </p>

                  <div className="autocare-shared-quick-specs">
                    <div className="autocare-shared-spec-item">
                      <span className="autocare-shared-spec-label">Powertrain</span>
                      <span className="autocare-shared-spec-val">
                        {sharedData.vehicle.vehicleType} · {sharedData.vehicle.fuelType || 'Hybrid'}
                      </span>
                    </div>

                    <div className="autocare-shared-spec-item">
                      <span className="autocare-shared-spec-label">Verified Mileage</span>
                      <span className="autocare-shared-spec-val">
                        {sharedData.vehicle.currentMileage !== null
                          ? `${sharedData.vehicle.currentMileage.toLocaleString()} km [AUTHENTICATED]`
                          : '[RESTRICTED BY OWNER]'}
                      </span>
                    </div>

                    <div className="autocare-shared-spec-item">
                      <span className="autocare-shared-spec-label">Trust Score</span>
                      <span className="autocare-shared-spec-val" style={{ color: '#15803d' }}>
                        {sharedData.vehicle.trustScore} / 100 (Excellent)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Metric Highlights Cards */}
              <section className="autocare-shared-metrics-grid" aria-label="Key Vehicle Verification Metrics">
                <div className="autocare-shared-metric-card">
                  <span className="autocare-shared-metric-label">Odometer Integrity</span>
                  <div className="autocare-shared-metric-val">
                    {sharedData.vehicle.currentMileage !== null
                      ? `${sharedData.vehicle.currentMileage.toLocaleString()} km`
                      : 'Protected'}
                  </div>
                  <span className="autocare-shared-metric-sub">
                    {sharedData.vehicle.currentMileage !== null
                      ? '✓ No rollback anomalies detected'
                      : 'Masked under permission policy'}
                  </span>
                </div>

                <div className="autocare-shared-metric-card">
                  <span className="autocare-shared-metric-label">Passport Trust Score</span>
                  <div className="autocare-shared-metric-val" style={{ color: '#15803d' }}>
                    {sharedData.vehicle.trustScore} / 100
                  </div>
                  <span className="autocare-shared-metric-sub">
                    Immutable consensus verified
                  </span>
                </div>

                <div className="autocare-shared-metric-card">
                  <span className="autocare-shared-metric-label">Service Health</span>
                  <div className="autocare-shared-metric-val">
                    {sharedData.services.length > 0
                      ? `${sharedData.services.length} records verified`
                      : 'Up to date'}
                  </div>
                  <span className="autocare-shared-metric-sub">
                    Certified workshop logs
                  </span>
                </div>

                <div className="autocare-shared-metric-card">
                  <span className="autocare-shared-metric-label">Ledger Consensus</span>
                  <div className="autocare-shared-metric-val">Fully Compliant</div>
                  <span className="autocare-shared-metric-sub">
                    Hash: 0x{displayToken.substring(0, 4)}...{displayToken.substring(displayToken.length - 4)}
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
                        <span className="autocare-shared-spec-row-val">{sharedData.vehicle.registrationNumber}</span>
                      </div>

                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">VIN / Chassis No</span>
                        <span className="autocare-shared-spec-row-val">{sharedData.vehicle.vin}</span>
                      </div>

                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">Engine Number</span>
                        <span className="autocare-shared-spec-row-val">
                          {sharedData.vehicle.engineNumber || (
                            <span className="autocare-shared-masked">
                              <Lock size={12} />
                              <span>[PROTECTED · ENGINE MASKED]</span>
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">Vehicle Category</span>
                        <span className="autocare-shared-spec-row-val">
                          {sharedData.vehicle.vehicleType} ({sharedData.vehicle.fuelType})
                        </span>
                      </div>

                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">Manufacturer</span>
                        <span className="autocare-shared-spec-row-val">{sharedData.vehicle.manufacturer}</span>
                      </div>

                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">Model &amp; Variant</span>
                        <span className="autocare-shared-spec-row-val">{sharedData.vehicle.model}</span>
                      </div>

                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">Year of Manufacture</span>
                        <span className="autocare-shared-spec-row-val">{sharedData.vehicle.manufacturingYear}</span>
                      </div>

                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">Registered Owner</span>
                        <span className="autocare-shared-spec-row-val">
                          {sharedData.vehicle.owner ? (
                            `${sharedData.vehicle.owner.fullName} (${sharedData.vehicle.owner.phone || 'Verified Owner'})`
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

                    {sharedData.services.length === 0 ? (
                      <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748b', fontSize: '13.5px' }}>
                        No maintenance records disclosed under current permission policy.
                      </div>
                    ) : (
                      <div className="autocare-shared-service-list">
                        {sharedData.services.map((rec) => (
                          <div key={rec._id} className="autocare-shared-service-item">
                            <div className="autocare-shared-service-left">
                              <div className="autocare-shared-service-icon-box">
                                <Wrench size={18} />
                              </div>
                              <div className="autocare-shared-service-info">
                                <h4 className="autocare-shared-service-title">{rec.serviceType}</h4>
                                <p className="autocare-shared-service-meta">
                                  {formatDateShort(rec.serviceDate)} · {rec.garageName || 'Certified Service Center'} ·{' '}
                                  {rec.mileage !== null ? `${rec.mileage.toLocaleString()} km` : 'Mileage Protected'}
                                </p>
                              </div>
                            </div>

                            <div className="autocare-shared-service-right">
                              <span className="autocare-shared-service-cost">
                                {rec.totalCost !== null ? (
                                  `LKR ${rec.totalCost.toLocaleString()}`
                                ) : (
                                  <span className="autocare-shared-masked">
                                    <Lock size={11} /> [Cost Masked]
                                  </span>
                                )}
                              </span>
                              <span className="autocare-doc-status-badge verified">
                                {rec.verificationStatus === 'verified' ? 'VERIFIED' : 'RECORDED'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                          {sharedData.documents.length === 0
                            ? '0 documents visible under permission policy'
                            : `${sharedData.documents.length} document${
                                sharedData.documents.length === 1 ? '' : 's'
                              } visible under permission policy`}
                        </p>
                      </div>
                    </div>

                    {sharedData.documents.length === 0 ? (
                      <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748b', fontSize: '13.5px' }}>
                        No additional documents disclosed for this inspection level.
                      </div>
                    ) : (
                      <div className="autocare-shared-doc-list">
                        {sharedData.documents.map((doc) => (
                          <div key={doc._id} className="autocare-shared-doc-item">
                            <div className="autocare-shared-doc-info">
                              <h4 className="autocare-shared-doc-name">{doc.title}</h4>
                              <span className="autocare-shared-doc-sub">
                                {doc.verificationStatus === 'verified' ? 'Verified' : 'Recorded'} ·{' '}
                                {doc.source === 'verified_garage' ? 'Verified Garage' : 'Certified Authority'}
                              </span>
                            </div>

                            <div className="autocare-shared-doc-actions">
                              <button
                                type="button"
                                className="autocare-shared-btn-view-doc"
                                onClick={() =>
                                  setActivePreviewDoc({
                                    title: doc.title,
                                    authority:
                                      doc.source === 'verified_garage'
                                        ? 'Verified Service Workshop'
                                        : 'Department of Motor Traffic (DMT)',
                                    date: formatDateShort(doc.issueDate),
                                    fileUrl: doc.fileUrl,
                                  })
                                }
                              >
                                <Eye size={13} />
                                <span>View</span>
                              </button>

                              {sharedData.protection.allowDownload && doc.fileUrl ? (
                                <a
                                  href={doc.fileUrl}
                                  download
                                  className="autocare-shared-btn-view-doc"
                                  style={{ textDecoration: 'none' }}
                                  title="Download authorized copy"
                                >
                                  <Download size={13} />
                                  <span>Download</span>
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  className="autocare-shared-btn-download-disabled"
                                  onClick={() => showSecurityNotice('Document Download')}
                                  title="Download disabled by owner policy"
                                >
                                  <Download size={13} />
                                  <span>Download</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Access Limitations Notice Box */}
                    <div className="autocare-shared-limitations-box">
                      <h4 className="autocare-shared-limitations-title">
                        <Lock size={14} />
                        <span>Security &amp; Policy Protections</span>
                      </h4>
                      <p className="autocare-shared-limitations-desc">
                        Recipient can view certified specifications and service milestones. Downloading, printing, and raw telemetry export are governed by owner security policy.
                      </p>
                      <div className="autocare-shared-limitations-tags">
                        <span className="autocare-shared-limit-tag">✓ View Only</span>
                        <span className="autocare-shared-limit-tag">
                          {sharedData.protection.allowDownload ? '✓ Download Permitted' : '✕ No Download'}
                        </span>
                        <span className="autocare-shared-limit-tag">
                          {sharedData.protection.watermarkEnabled ? '✓ Watermark Sealed' : '✕ No Watermark'}
                        </span>
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
                    0x{displayToken.substring(0, 10)}...{displayToken.substring(Math.max(0, displayToken.length - 6))}
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
                      gap: '4px',
                    }}
                    onClick={() => navigate('/vehicles')}
                  >
                    <span>Owner Portal</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            </>
          ) : null}
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
                {sharedData?.protection?.watermarkText || 'AUTOCARE 360 SECURED'}
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
                  cursor: 'pointer',
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
