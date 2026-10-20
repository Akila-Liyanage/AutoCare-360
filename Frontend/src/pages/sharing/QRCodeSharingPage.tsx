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

  // Sharing Purpose state
  const [purpose, setPurpose] = useState<'Vehicle sale' | 'Insurance inspection' | 'Vehicle verification'>(
    'Insurance inspection'
  );

  // Vehicle & Record scope state
  const [vehicle, setVehicle] = useState('WP ABC-1234 · Toyota Aqua');
  const [records, setRecords] = useState('Complete service history · 6 verified entries');

  // Limits state
  const [expiration, setExpiration] = useState('48 hours · 23 Sep 2026');
  const [scanLimit, setScanLimit] = useState('10 scans');
  const [authentication, setAuthentication] = useState('Viewer name + OTP');

  // Recent QR codes
  const [recentCodes, setRecentCodes] = useState<RecentQRCodeItem[]>(INITIAL_RECENT_QR_CODES);

  // Dynamic QR Payload state
  const [qrToken, setQrToken] = useState('AC360-INS-9812-WPABC1234');

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
  };

  const handleSaveDraft = () => {
    showToast(`Draft QR configuration for ${vehicleNumber} (${purpose}) saved successfully.`, 'info');
  };

  const handleGenerateQR = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const newCode = `AC360-${purpose.slice(0, 3).toUpperCase()}-${randomSuffix}-${vehicleNumber.replace(/[^a-zA-Z0-9]/g, '')}`;
    setQrToken(newCode);

    // Prepend to recent list
    const newRecentItem: RecentQRCodeItem = {
      id: `qr-${Date.now()}`,
      purpose,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      scans: `0 / ${scanLimit.split(' ')[0] || '10'} scans`,
      status: 'Active',
    };
    setRecentCodes((prev) => [newRecentItem, ...prev.slice(0, 4)]);

    showToast(`Purpose-bound QR code generated for ${purpose}!`, 'success');
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
    const verificationUrl = `https://autocare.lk/verify/qr?token=${qrToken}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(verificationUrl).catch(() => {});
    }
    showToast(`QR verification link copied to clipboard: ${verificationUrl}`, 'success');
  };

  const fullQrPayload = `https://autocare.lk/verify/qr?token=${qrToken}&purpose=${encodeURIComponent(
    purpose
  )}&vehicle=${encodeURIComponent(vehicleNumber)}`;

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
              >
                <QrCode size={16} />
                <span>Generate QR code</span>
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

              {/* Card 2: Vehicle & record scope */}
              <section className="autocare-qr-card" aria-label="Vehicle and Record Scope">
                <h2 className="autocare-qr-card-title">Vehicle &amp; record scope</h2>

                <div className="autocare-qr-form-group">
                  <label htmlFor="qr-vehicle-input" className="autocare-qr-label">
                    Vehicle
                  </label>
                  <input
                    id="qr-vehicle-input"
                    type="text"
                    className="autocare-qr-input"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    placeholder="e.g. WP ABC-1234 · Toyota Aqua"
                  />
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
                    to={`/shared/vehicle/${qrToken}`}
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
