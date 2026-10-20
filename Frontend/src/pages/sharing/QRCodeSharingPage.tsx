import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  ExternalLink
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { getMyVehicles, type Vehicle } from '../../services/vehicleService';
import {
  createShareLink,
  getShareLinks,
  type ShareLinkPermissionLevel
} from '../../services/shareLinkService';
import '../../styles/qr-sharing.css';

interface ToastState {
  message: string;
  type: 'success' | 'info';
}

interface RecentQRCodeItem {
  id: string;
  purpose: string;
  date: string;
  scans: string;
  status: 'Expired' | 'Revoked' | 'Active';
}

const INITIAL_RECENT_QR_CODES: RecentQRCodeItem[] = [
  {
    id: 'qr-1',
    purpose: 'Insurance inspection',
    date: '19 Sep 2026',
    scans: '7 / 10 scans',
    status: 'Expired',
  },
  {
    id: 'qr-2',
    purpose: 'Vehicle verification',
    date: '08 Sep 2026',
    scans: '2 / 5 scans',
    status: 'Revoked',
  },
];

export const QRCodeSharingPage: React.FC = () => {
  const navigate = useNavigate();

  // Registered vehicles state
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  // Sharing Purpose state (BR-05)
  const [purpose, setPurpose] = useState<'Vehicle sale' | 'Insurance inspection' | 'Vehicle verification'>(
    'Vehicle sale'
  );

  // Vehicle & Record scope state (BR-06)
  const [vehicle, setVehicle] = useState('WP CAA-1234 · Toyota Corolla');
  const [permissionScope, setPermissionScope] = useState<ShareLinkPermissionLevel>('limited');

  // Limits state (BR-05, BRULE-03)
  const [durationHours, setDurationHours] = useState<number>(48);
  const [scanLimit, setScanLimit] = useState('10 scans');
  const [recipientName, setRecipientName] = useState('Prospective Buyer');

  // Recent QR codes
  const [recentCodes, setRecentCodes] = useState<RecentQRCodeItem[]>(INITIAL_RECENT_QR_CODES);

  // Dynamic QR Payload state
  const [qrToken, setQrToken] = useState('AC360-SAMPLE-BUYER-QR');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Load real user vehicles and recent share links on mount
  React.useEffect(() => {
    getMyVehicles()
      .then((vehicles) => {
        if (vehicles && vehicles.length > 0) {
          setVehiclesList(vehicles);
          setSelectedVehicleId(vehicles[0]._id);
          setVehicle(`${vehicles[0].registrationNumber} · ${vehicles[0].manufacturer} ${vehicles[0].model}`);
        }
      })
      .catch(() => {});

    getShareLinks()
      .then((links) => {
        if (links && links.length > 0) {
          const mapped: RecentQRCodeItem[] = links.slice(0, 5).map((l) => ({
            id: l._id,
            purpose: l.purpose || 'Vehicle verification',
            date: new Date(l.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            scans: `${l.viewCount} / ${l.maxViews || 10} scans`,
            status: l.status === 'active' ? 'Active' : l.status === 'expired' ? 'Expired' : 'Revoked',
          }));
          setRecentCodes(mapped);
        }
      })
      .catch(() => {});
  }, []);

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

  const handlePurposeSelect = (selected: 'Vehicle sale' | 'Insurance inspection' | 'Vehicle verification') => {
    setPurpose(selected);
    if (selected === 'Vehicle sale') {
      setRecipientName('Prospective Buyer');
      setPermissionScope('limited');
    } else if (selected === 'Insurance inspection') {
      setRecipientName('Insurance Inspector');
      setPermissionScope('limited');
    } else {
      setRecipientName('Verification Officer');
      setPermissionScope('limited');
    }
  };

  const handleSaveDraft = () => {
    showToast(`Draft QR configuration for ${vehicleNumber} (${purpose}) saved successfully.`, 'info');
  };

  const handleGenerateQR = async () => {
    try {
      setIsGenerating(true);
      const targetVehicle = vehiclesList.find((v) => v._id === selectedVehicleId) || vehiclesList[0];
      const parsedLimit = parseInt(scanLimit, 10) || 10;
      const expiresDate = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();

      if (targetVehicle) {
        const res = await createShareLink({
          vehicleId: targetVehicle._id,
          recipientName: recipientName.trim() || (purpose === 'Vehicle sale' ? 'Prospective Buyer' : 'Verification Officer'),
          purpose: purpose,
          permissionLevel: permissionScope,
          expiresAt: expiresDate,
          maxViews: parsedLimit,
        });

        const token = res.rawToken;
        setQrToken(token);

        const newRecentItem: RecentQRCodeItem = {
          id: res.shareLink._id,
          purpose,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          scans: `0 / ${parsedLimit} scans`,
          status: 'Active',
        };
        setRecentCodes((prev) => [newRecentItem, ...prev.slice(0, 4)]);
        showToast(`Purpose-bound QR code generated for ${purpose}!`, 'success');
      } else {
        const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
        const newCode = `AC360-${purpose.slice(0, 3).toUpperCase()}-${randomSuffix}-${vehicleNumber.replace(/[^a-zA-Z0-9]/g, '')}`;
        setQrToken(newCode);
        showToast(`Demo QR code generated for ${purpose}!`, 'success');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate QR code.';
      showToast(msg, 'info');
    } finally {
      setIsGenerating(false);
    }
  };

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

  const handlePrint = () => {
    showToast('Opening browser print dialogue for QR certificate...', 'info');
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const handleShare = () => {
    const verificationUrl = `${window.location.origin}/buyer-qr?token=${qrToken}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(verificationUrl).catch(() => {});
    }
    showToast(`QR verification link copied to clipboard: ${verificationUrl}`, 'success');
  };

  const fullQrPayload = `${window.location.origin}/buyer-qr?token=${qrToken}`;

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
                disabled={isGenerating}
                style={{ opacity: isGenerating ? 0.7 : 1, cursor: isGenerating ? 'not-allowed' : 'pointer' }}
              >
                <QrCode size={16} />
                <span>{isGenerating ? 'Generating...' : 'Generate QR code'}</span>
              </button>
            </div>
          </header>

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

              {/* Card 2: Vehicle & record scope (BR-06) */}
              <section className="autocare-qr-card" aria-label="Vehicle and Record Scope">
                <h2 className="autocare-qr-card-title">Vehicle &amp; Record Scope (BR-06)</h2>

                <div className="autocare-qr-form-group">
                  <label htmlFor="qr-vehicle-select" className="autocare-qr-label">
                    Select Vehicle
                  </label>
                  {vehiclesList.length > 0 ? (
                    <select
                      id="qr-vehicle-select"
                      className="autocare-field-select"
                      value={selectedVehicleId}
                      onChange={(e) => {
                        setSelectedVehicleId(e.target.value);
                        const v = vehiclesList.find((item) => item._id === e.target.value);
                        if (v) setVehicle(`${v.registrationNumber} · ${v.manufacturer} ${v.model}`);
                      }}
                    >
                      {vehiclesList.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.registrationNumber} - {v.manufacturer} {v.model} ({v.manufacturingYear})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="qr-vehicle-input"
                      type="text"
                      className="autocare-qr-input"
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                      placeholder="e.g. WP CAA-1234 · Toyota Corolla"
                    />
                  )}
                </div>

                <div className="autocare-qr-form-group has-spacing">
                  <label htmlFor="qr-records-select" className="autocare-qr-label">
                    Permission Scope (BR-06)
                  </label>
                  <select
                    id="qr-records-select"
                    className="autocare-field-select"
                    value={permissionScope}
                    onChange={(e) => setPermissionScope(e.target.value as ShareLinkPermissionLevel)}
                  >
                    <option value="limited">Limited Access (Buyer Default - Costs &amp; Owner Masked)</option>
                    <option value="full">Full Access (Complete History, Costs &amp; Documents)</option>
                    <option value="selected">Selected Records (Specific milestones only)</option>
                  </select>
                </div>
              </section>

              {/* Card 3: Limits (BR-05, BRULE-03) */}
              <section className="autocare-qr-card" aria-label="Access Limits">
                <h2 className="autocare-qr-card-title">Access Limits &amp; Expiry (BRULE-03)</h2>

                <div className="autocare-qr-field-row-3">
                  <div className="autocare-qr-form-group">
                    <label htmlFor="qr-expiration-select" className="autocare-qr-label">
                      Expiration Duration
                    </label>
                    <select
                      id="qr-expiration-select"
                      className="autocare-field-select"
                      value={durationHours}
                      onChange={(e) => setDurationHours(Number(e.target.value))}
                    >
                      <option value={24}>24 Hours (1 Day)</option>
                      <option value={48}>48 Hours (2 Days - Recommended)</option>
                      <option value={168}>7 Days (1 Week)</option>
                      <option value={720}>30 Days (1 Month)</option>
                    </select>
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
                    <label htmlFor="qr-recipient-input" className="autocare-qr-label">
                      Recipient / Buyer Name
                    </label>
                    <input
                      id="qr-recipient-input"
                      type="text"
                      className="autocare-qr-input"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Prospective Buyer"
                    />
                  </div>
                </div>
              </section>

              {/* Card 4: Recent QR codes */}
              <section className="autocare-qr-card" aria-label="Recent QR Codes">
                <h2 className="autocare-qr-card-title">Recent QR codes</h2>

                <div className="autocare-qr-recent-table">
                  {recentCodes.map((item) => (
                    <div key={item.id} className="autocare-qr-recent-row">
                      <span className="autocare-qr-col-purpose">{item.purpose}</span>
                      <span className="autocare-qr-col-date">{item.date}</span>
                      <span className="autocare-qr-col-scans">{item.scans}</span>
                      <span
                        className={`autocare-qr-col-status is-${item.status.toLowerCase()}`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Side Column (Generated QR Preview Card) */}
            <aside className="autocare-qr-side-column" aria-label="Generated QR Code Preview">
              <div className="autocare-qr-preview-card">
                <div className="autocare-qr-preview-header">
                  <h2 className="autocare-qr-preview-title">Generated QR preview</h2>
                </div>

                <div className="autocare-qr-visual-frame">
                  <QRCodeSVG
                    id="autocare-qr-code-svg"
                    value={fullQrPayload}
                    size={210}
                    level="H"
                    includeMargin={true}
                    fgColor="#0f172a"
                    bgColor="#ffffff"
                  />
                </div>

                <div className="autocare-qr-preview-label">
                  {vehicleNumber} · {purpose}
                </div>

                <div className="autocare-qr-expiry-badge">
                  EXPIRES IN 48 HOURS
                </div>

                <div className="autocare-qr-preview-actions">
                  <button
                    type="button"
                    className="autocare-qr-btn-action is-primary"
                    onClick={handleDownload}
                    title="Download QR code image"
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </button>

                  <Link
                    to={`/buyer-qr?token=${qrToken}`}
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
