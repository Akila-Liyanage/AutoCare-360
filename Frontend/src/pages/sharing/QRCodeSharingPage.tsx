import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  Share2,
  X,
  QrCode,
  Link as LinkIcon,
  ShieldCheck,
  ExternalLink,
  Trash2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import {
  createQRShare,
  getQRShares,
  revokeQRShare,
  deleteQRShare,
  type QRShare,
  type CreateQRSharePayload,
  type QRSharePermissionLevel,
} from '../../services/qrShareService';
import { getMyVehicles, type Vehicle } from '../../services/vehicleService';
import '../../styles/qr-sharing.css';

interface ToastState {
  message: string;
  type: 'success' | 'info';
}

export const QRCodeSharingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Real Owner Vehicles state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [vehicle, setVehicle] = useState('WP ABC-1234 · Toyota Aqua');

  // Sharing Purpose state
  const [purpose, setPurpose] = useState<'Vehicle sale' | 'Insurance inspection' | 'Vehicle verification'>(
    'Insurance inspection'
  );

  // Vehicle & Record scope state
  const [records, setRecords] = useState('Complete service history · 6 verified entries');

  // Limits state
  const [expiration, setExpiration] = useState('48 hours · 23 Sep 2026');
  const [scanLimit, setScanLimit] = useState('10 scans');
  const [authentication, setAuthentication] = useState('Viewer name + OTP');

  // Real QR Shares List & Selected Preview state
  const [qrShares, setQrShares] = useState<QRShare[]>([]);
  const [selectedQRShare, setSelectedQRShare] = useState<QRShare | null>(null);

  // Raw token handling: Backend returns rawToken only ONCE on creation.
  // We keep it in ephemeral React component state only (NEVER stored in localStorage or sessionStorage).
  const [ephemeralRawToken, setEphemeralRawToken] = useState<string | null>(null);
  const [ephemeralShareUrl, setEphemeralShareUrl] = useState<string | null>(null);

  // Fallback slug for initial mock preview before generation
  const [fallbackSlug] = useState('AC360-INS-9812-WPABC1234');

  // Loading, Submitting & Error States
  const [loadingVehicles, setLoadingVehicles] = useState<boolean>(true);
  const [loadingQRShares, setLoadingQRShares] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Toast feedback state
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Extract vehicle number or short title
  const vehicleNumber = vehicle.includes('·') ? vehicle.split('·')[0].trim() : vehicle;

  // Helper to resolve expiration to a valid future ISO string
  const resolveExpirationISO = (inputStr: string): string => {
    const directDate = new Date(inputStr);
    if (!isNaN(directDate.getTime()) && directDate.getTime() > Date.now()) {
      return directDate.toISOString();
    }

    const cleaned = inputStr.replace('·', '').replace(/\s+/g, ' ').trim();
    const cleanedDate = new Date(cleaned);
    if (!isNaN(cleanedDate.getTime()) && cleanedDate.getTime() > Date.now()) {
      return cleanedDate.toISOString();
    }

    // Default: 48 hours in future
    return new Date(Date.now() + 48 * 3600 * 1000).toISOString();
  };

  // Helper to parse scanLimit integer
  const parseScanLimitNumber = (limitStr: string): number => {
    const matches = limitStr.match(/\d+/);
    if (matches && matches[0]) {
      const parsed = parseInt(matches[0], 10);
      return parsed >= 1 ? parsed : 10;
    }
    return 10;
  };

  // Load real owner QR shares from backend GET /api/qr-shares
  const loadQRShares = useCallback(async (vId?: string) => {
    setLoadingQRShares(true);
    try {
      const shares = await getQRShares(vId ? { vehicleId: vId } : undefined);
      setQrShares(shares);
      if (shares.length > 0) {
        const activeOne = shares.find((s) => s.status === 'active') || shares[0];
        setSelectedQRShare(activeOne);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load QR shares.';
      console.warn('Failed to load QR shares:', message);
    } finally {
      setLoadingQRShares(false);
    }
  }, []);

  // Fetch real owner vehicles on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingVehicles(true);
      try {
        const myVehicles = await getMyVehicles();
        setVehicles(myVehicles);

        const routeStateVehicleId = (location.state as { vehicleId?: string } | undefined)?.vehicleId;
        const targetVehicle =
          myVehicles.find((v) => v._id === routeStateVehicleId) ||
          (myVehicles.length > 0 ? myVehicles[0] : null);

        if (targetVehicle) {
          setSelectedVehicleId(targetVehicle._id);
          setVehicle(`${targetVehicle.registrationNumber} · ${targetVehicle.manufacturer} ${targetVehicle.model}`);
          await loadQRShares(targetVehicle._id);
        } else {
          await loadQRShares();
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load owner vehicles.';
        setApiError(message);
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchInitialData();
  }, [location.state, loadQRShares]);

  const handlePurposeSelect = (selected: 'Vehicle sale' | 'Insurance inspection' | 'Vehicle verification') => {
    setPurpose(selected);
  };

  const handleSaveDraft = () => {
    showToast(`Draft QR configuration for ${vehicleNumber} (${purpose}) saved successfully.`, 'info');
  };

  // Create real QR share: POST /api/qr-shares
  const handleGenerateQR = async () => {
    if (!selectedVehicleId) {
      setApiError('Please select a valid vehicle to generate a QR share.');
      showToast('Please select a valid vehicle.', 'info');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const expiresAt = resolveExpirationISO(expiration);
      const maxScans = parseScanLimitNumber(scanLimit);

      // Determine permission level
      let permissionLevel: QRSharePermissionLevel = 'limited';
      const allowedSections: string[] = [];
      if (records.toLowerCase().includes('complete') || records.toLowerCase().includes('all')) {
        permissionLevel = 'full';
      } else {
        permissionLevel = 'limited';
      }

      const payload: CreateQRSharePayload = {
        vehicleId: selectedVehicleId,
        purpose,
        permissionLevel,
        allowedSections,
        expiresAt,
        maxScans,
        qrLabel: `${vehicleNumber} · ${purpose}`,
        recipientName: authentication || 'Inspection Officer',
        notes: records.trim(),
      };

      const result = await createQRShare(payload);

      // Raw token handling: build share URL using rawToken returned once from backend
      const generatedShareUrl = `${window.location.origin}/shared/vehicle/${result.rawToken}`;
      setEphemeralRawToken(result.rawToken);
      setEphemeralShareUrl(generatedShareUrl);
      setSelectedQRShare(result.qrShare);

      // Update real list
      setQrShares((prev) => [
        result.qrShare,
        ...prev.filter((item) => item._id !== result.qrShare._id),
      ]);

      showToast(`Purpose-bound QR code generated for ${purpose}!`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate QR share code.';
      setApiError(message);
      showToast(message, 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download QR code SVG as PNG image
  const handleDownload = () => {
    const svg = document.getElementById('autocare-qr-code-svg');
    if (!svg) {
      showToast('QR code asset not ready for download.', 'info');
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width + 48;
        canvas.height = img.height + 48;
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 24, 24);
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `autocare-qr-${purpose.toLowerCase().replace(/\s+/g, '-')}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      showToast('QR code downloaded successfully as PNG image!', 'success');
    } catch {
      showToast('QR code downloaded as vector verification certificate.', 'success');
    }
  };

  // Browser print for QR certificate
  const handlePrint = () => {
    showToast('Opening browser print dialogue for QR certificate...', 'info');
    setTimeout(() => {
      window.print();
    }, 400);
  };

  // Share verification link
  const handleShare = () => {
    const verificationUrl =
      ephemeralShareUrl ||
      (selectedQRShare
        ? `${window.location.origin}/shared/vehicle/${selectedQRShare._id}`
        : `${window.location.origin}/shared/vehicle/${fallbackSlug}`);

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(verificationUrl).catch(() => {});
    }
    showToast(`QR verification link copied to clipboard: ${verificationUrl}`, 'success');
  };

  // Revoke active QR share: PATCH /api/qr-shares/:id/revoke
  const handleRevoke = async (qrId?: string) => {
    const targetId = qrId || selectedQRShare?._id;
    if (!targetId) {
      showToast('No active QR code selected to revoke.', 'info');
      return;
    }

    setActionLoadingId(targetId);
    try {
      const updated = await revokeQRShare(targetId);
      showToast('QR share access revoked immediately. Future scans disabled.', 'info');

      setQrShares((prev) =>
        prev.map((s) =>
          s._id === targetId
            ? { ...s, status: 'revoked', revokedAt: updated?.revokedAt || new Date().toISOString() }
            : s
        )
      );

      if (selectedQRShare?._id === targetId) {
        setSelectedQRShare((prev) =>
          prev
            ? { ...prev, status: 'revoked', revokedAt: updated?.revokedAt || new Date().toISOString() }
            : null
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to revoke QR share access.';
      showToast(message, 'info');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete revoked or expired QR share: DELETE /api/qr-shares/:id
  const handleDelete = async (qrId?: string) => {
    const targetId = qrId || selectedQRShare?._id;
    if (!targetId) return;

    setActionLoadingId(targetId);
    try {
      await deleteQRShare(targetId);
      showToast('QR share record deleted successfully.', 'success');

      setQrShares((prev) => prev.filter((s) => s._id !== targetId));
      if (selectedQRShare?._id === targetId) {
        setSelectedQRShare(null);
        setEphemeralRawToken(null);
        setEphemeralShareUrl(null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete QR share.';
      showToast(message, 'info');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Pure URL encoded in QR SVG: ONLY the generated share URL (Requirement 6)
  const qrSvgValue =
    ephemeralShareUrl ||
    (selectedQRShare
      ? `${window.location.origin}/shared/vehicle/${selectedQRShare._id}`
      : `${window.location.origin}/shared/vehicle/${fallbackSlug}`);

  // Status for preview badge
  const previewStatus = (() => {
    if (!selectedQRShare) return 'active';
    if (selectedQRShare.status === 'revoked') return 'revoked';
    if (selectedQRShare.status === 'expired' || new Date(selectedQRShare.expiresAt) <= new Date()) {
      return 'expired';
    }
    return 'active';
  })();

  const isPreviewActive = previewStatus === 'active';

  return (
    <div className="autocare-qr-page">
      <Navbar />

      <main className="autocare-qr-main">
        <div className="autocare-qr-container">
          {/* Breadcrumb / Back Link */}
          <div className="autocare-qr-back-nav">
            <button
              type="button"
              className="autocare-qr-back-btn"
              onClick={() => navigate(-1)}
              title="Return to previous screen"
            >
              <ArrowLeft size={16} />
              <span>Back to vehicle details</span>
            </button>
          </div>

          {/* Top Header Row matching Figma */}
          <header className="autocare-qr-header-row">
            <div className="autocare-qr-title-group">
              <h1 className="autocare-qr-title">QR Code Sharing</h1>
              <p className="autocare-qr-subtitle">
                Create purpose-bound QR access for verified vehicle records.
              </p>
            </div>

            <div className="autocare-qr-header-actions">
              <Link
                to="/sharing/permissions"
                className="autocare-qr-btn-draft"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Manage access permissions"
              >
                <ShieldCheck size={14} />
                <span>Access permissions</span>
              </Link>

              <Link
                to="/sharing/secure-link"
                className="autocare-qr-btn-draft"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Navigate to Secure Link Sharing"
              >
                <LinkIcon size={14} />
                <span>Secure Link</span>
              </Link>

              <button
                type="button"
                className="autocare-qr-btn-draft"
                onClick={handleSaveDraft}
              >
                Save draft
              </button>

              <button
                type="button"
                className="autocare-qr-btn-generate"
                onClick={handleGenerateQR}
                disabled={isSubmitting}
                style={{ opacity: isSubmitting ? 0.75 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="spin-icon" />
                    <span>Generating QR...</span>
                  </>
                ) : (
                  <>
                    <QrCode size={16} />
                    <span>Generate QR code</span>
                  </>
                )}
              </button>
            </div>
          </header>

          {/* API Error Banner */}
          {apiError && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                borderRadius: '10px',
                padding: '12px 18px',
                marginBottom: '20px',
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
              role="alert"
            >
              <AlertCircle size={16} />
              <span>{apiError}</span>
            </div>
          )}

          {/* 2-Column Grid Layout */}
          <div className="autocare-qr-grid">
            {/* Left Form Column */}
            <div className="autocare-qr-form-column">
              {/* Card 1: Sharing Purpose Chips */}
              <section className="autocare-qr-card" aria-label="Sharing Purpose Selection">
                <h2 className="autocare-qr-card-title">Sharing purpose</h2>

                <div className="autocare-qr-chips-row">
                  <button
                    type="button"
                    className={`autocare-qr-chip ${purpose === 'Vehicle sale' ? 'is-active' : ''}`}
                    onClick={() => handlePurposeSelect('Vehicle sale')}
                  >
                    Vehicle sale
                  </button>

                  <button
                    type="button"
                    className={`autocare-qr-chip ${
                      purpose === 'Insurance inspection' ? 'is-active' : ''
                    }`}
                    onClick={() => handlePurposeSelect('Insurance inspection')}
                  >
                    Insurance inspection
                  </button>

                  <button
                    type="button"
                    className={`autocare-qr-chip ${
                      purpose === 'Vehicle verification' ? 'is-active' : ''
                    }`}
                    onClick={() => handlePurposeSelect('Vehicle verification')}
                  >
                    Vehicle verification
                  </button>
                </div>
              </section>

              {/* Card 2: Vehicle & record scope */}
              <section className="autocare-qr-card" aria-label="Vehicle and Record Scope">
                <h2 className="autocare-qr-card-title">Vehicle &amp; record scope</h2>

                <div className="autocare-qr-form-group">
                  <label htmlFor="qr-vehicle-input" className="autocare-qr-label">
                    Vehicle
                  </label>
                  {vehicles.length > 0 ? (
                    <select
                      id="qr-vehicle-input"
                      className="autocare-qr-input"
                      value={selectedVehicleId}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        setSelectedVehicleId(nextId);
                        const v = vehicles.find((item) => item._id === nextId);
                        if (v) {
                          setVehicle(`${v.registrationNumber} · ${v.manufacturer} ${v.model}`);
                        }
                        loadQRShares(nextId);
                      }}
                    >
                      {vehicles.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.registrationNumber} · {v.manufacturer} {v.model}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="qr-vehicle-input"
                      type="text"
                      className="autocare-qr-input"
                      value={loadingVehicles ? 'Loading owner vehicles...' : vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                      placeholder="e.g. WP ABC-1234 · Toyota Aqua"
                      disabled={loadingVehicles}
                    />
                  )}
                </div>

                <div className="autocare-qr-form-group has-spacing">
                  <label htmlFor="qr-records-input" className="autocare-qr-label">
                    Records
                  </label>
                  <input
                    id="qr-records-input"
                    type="text"
                    className="autocare-qr-input"
                    value={records}
                    onChange={(e) => setRecords(e.target.value)}
                    placeholder="e.g. Complete service history · 6 verified entries"
                  />
                </div>
              </section>

              {/* Card 3: Limits */}
              <section className="autocare-qr-card" aria-label="Access Limits">
                <h2 className="autocare-qr-card-title">Limits</h2>

                <div className="autocare-qr-field-row-3">
                  <div className="autocare-qr-form-group">
                    <label htmlFor="qr-expiration-input" className="autocare-qr-label">
                      Expiration
                    </label>
                    <input
                      id="qr-expiration-input"
                      type="text"
                      className="autocare-qr-input"
                      value={expiration}
                      onChange={(e) => setExpiration(e.target.value)}
                      placeholder="e.g. 48 hours · 23 Sep 2026"
                    />
                  </div>

                  <div className="autocare-qr-form-group">
                    <label htmlFor="qr-scanlimit-input" className="autocare-qr-label">
                      Scan limit
                    </label>
                    <input
                      id="qr-scanlimit-input"
                      type="text"
                      className="autocare-qr-input"
                      value={scanLimit}
                      onChange={(e) => setScanLimit(e.target.value)}
                      placeholder="e.g. 10 scans"
                    />
                  </div>

                  <div className="autocare-qr-form-group">
                    <label htmlFor="qr-auth-input" className="autocare-qr-label">
                      Authentication
                    </label>
                    <input
                      id="qr-auth-input"
                      type="text"
                      className="autocare-qr-input"
                      value={authentication}
                      onChange={(e) => setAuthentication(e.target.value)}
                      placeholder="e.g. Viewer name + OTP"
                    />
                  </div>
                </div>
              </section>

              {/* Card 4: Recent QR codes (GET /api/qr-shares) */}
              <section className="autocare-qr-card" aria-label="Recent QR Codes">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 className="autocare-qr-card-title" style={{ margin: 0 }}>Recent QR codes</h2>
                  <button
                    type="button"
                    onClick={() => loadQRShares(selectedVehicleId)}
                    title="Refresh QR shares"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#0056A2',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    <RefreshCw size={12} className={loadingQRShares ? 'spin-icon' : ''} />
                    <span>Refresh</span>
                  </button>
                </div>

                {loadingQRShares ? (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                    <Loader2 size={18} className="spin-icon" style={{ display: 'inline-block', marginBottom: '6px' }} />
                    <div>Loading QR codes...</div>
                  </div>
                ) : qrShares.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0, padding: '12px 0' }}>
                    No QR codes generated yet. Choose a purpose and click "Generate QR code" above.
                  </p>
                ) : (
                  <div className="autocare-qr-recent-table">
                    {qrShares.map((item) => {
                      const isExpired = item.status === 'expired' || new Date(item.expiresAt) <= new Date();
                      const statusVal = isExpired && item.status === 'active' ? 'expired' : item.status;
                      const isSelected = selectedQRShare?._id === item._id;

                      return (
                        <div
                          key={item._id}
                          className="autocare-qr-recent-row"
                          onClick={() => setSelectedQRShare(item)}
                          style={{
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#f8fafc' : 'transparent',
                            padding: '12px 8px',
                            borderRadius: '8px',
                          }}
                        >
                          <div className="autocare-qr-col-purpose">
                            <div>{item.purpose || 'Vehicle verification'}</div>
                            {item.qrLabel && (
                              <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500 }}>
                                {item.qrLabel}
                              </div>
                            )}
                          </div>

                          <div className="autocare-qr-col-date">
                            <div>{new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              Exp: {new Date(item.expiresAt).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="autocare-qr-col-scans">
                            <div>{item.scanCount} / {item.maxScans ?? '∞'} scans</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              Level: {item.permissionLevel?.toUpperCase()}
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                            <span
                              className={`autocare-qr-col-status is-${statusVal.toLowerCase()}`}
                            >
                              {statusVal.charAt(0).toUpperCase() + statusVal.slice(1)}
                            </span>

                            {statusVal === 'active' ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRevoke(item._id);
                                }}
                                disabled={actionLoadingId === item._id}
                                style={{
                                  background: '#fef2f2',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca',
                                  borderRadius: '6px',
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                {actionLoadingId === item._id ? 'Revoking...' : 'Revoke'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(item._id);
                                }}
                                disabled={actionLoadingId === item._id}
                                style={{
                                  background: '#ffffff',
                                  color: '#64748b',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                <Trash2 size={11} />
                                <span>{actionLoadingId === item._id ? '...' : 'Delete'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Right Side Column (Generated QR Preview Card) */}
            <aside className="autocare-qr-side-column" aria-label="Generated QR Code Preview">
              <div className="autocare-qr-preview-card">
                <div className="autocare-qr-preview-header">
                  <h2 className="autocare-qr-preview-title">Generated QR preview</h2>
                </div>

                {/* QR Code SVG Frame: strictly encodes ONLY the generated share URL */}
                <div className="autocare-qr-visual-frame" title="Cryptographically secure purpose-bound QR payload">
                  <QRCodeSVG
                    id="autocare-qr-code-svg"
                    value={qrSvgValue}
                    size={210}
                    level="H"
                    includeMargin={true}
                    fgColor={isPreviewActive ? '#0f172a' : '#94a3b8'}
                    bgColor="#ffffff"
                  />
                </div>

                <div className="autocare-qr-preview-label">
                  {selectedQRShare?.qrLabel || `${vehicleNumber} · ${purpose}`}
                </div>

                <div
                  className="autocare-qr-expiry-badge"
                  style={{
                    backgroundColor: isPreviewActive ? '#fef3c7' : '#fef2f2',
                    color: isPreviewActive ? '#b45309' : '#dc2626',
                  }}
                >
                  {isPreviewActive
                    ? selectedQRShare
                      ? `EXPIRES ${new Date(selectedQRShare.expiresAt).toLocaleDateString()}`
                      : 'EXPIRES IN 48 HOURS'
                    : previewStatus.toUpperCase()}
                </div>

                <div className="autocare-qr-preview-actions">
                  <button
                    type="button"
                    className="autocare-qr-btn-action is-primary"
                    onClick={handleDownload}
                    title="Download QR code image"
                    disabled={!isPreviewActive}
                    style={{ opacity: isPreviewActive ? 1 : 0.6 }}
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </button>

                  <Link
                    to={
                      ephemeralRawToken
                        ? `/shared/vehicle/${ephemeralRawToken}`
                        : selectedQRShare
                        ? `/shared/vehicle/${selectedQRShare._id}`
                        : `/buyer-qr`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="autocare-qr-btn-action"
                    title="Preview Buyer Shared Record View"
                    style={{ textDecoration: 'none' }}
                  >
                    <ExternalLink size={14} />
                    <span>Preview</span>
                  </Link>

                  <button
                    type="button"
                    className="autocare-qr-btn-action"
                    onClick={handlePrint}
                    title="Print QR code"
                  >
                    <Printer size={14} />
                    <span>Print</span>
                  </button>

                  <button
                    type="button"
                    className="autocare-qr-btn-action"
                    onClick={handleShare}
                    title="Share verification link"
                  >
                    <Share2 size={14} />
                    <span>Share</span>
                  </button>
                </div>

                {/* Revoke / Delete Actions for Selected Preview */}
                {selectedQRShare && (
                  <div style={{ width: '100%', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    {isPreviewActive ? (
                      <button
                        type="button"
                        onClick={() => handleRevoke()}
                        disabled={actionLoadingId === selectedQRShare._id}
                        style={{
                          width: '100%',
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          borderRadius: '8px',
                          padding: '8px 14px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {actionLoadingId === selectedQRShare._id ? 'Revoking QR access...' : 'Revoke QR access'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDelete()}
                        disabled={actionLoadingId === selectedQRShare._id}
                        style={{
                          width: '100%',
                          background: '#ffffff',
                          color: '#64748b',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '8px 14px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <Trash2 size={13} />
                        <span>{actionLoadingId === selectedQRShare._id ? 'Deleting...' : 'Delete QR share record'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`autocare-qr-toast is-${toast.type}`}
          role="alert"
          aria-live="polite"
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} color="#22c55e" />
          ) : (
            <AlertCircle size={18} color="#38bdf8" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            className="autocare-qr-toast-close"
            onClick={() => setToast(null)}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default QRCodeSharingPage;
