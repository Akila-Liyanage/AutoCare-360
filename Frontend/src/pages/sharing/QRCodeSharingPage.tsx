import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
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
  Copy,
  ScanLine
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import QRScannerModal from '../../components/common/QRScannerModal';
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
  token?: string;
}

export const QRCodeSharingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Registered vehicles state
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  // Sharing Purpose state (BR-05)
  const [purpose, setPurpose] = useState<'Vehicle sale' | 'Insurance inspection' | 'Vehicle verification'>(
    'Vehicle sale'
  );

  // Vehicle & Record scope state (BR-06)
  const [vehicle, setVehicle] = useState('WP CAR-1010 · Toyota Corolla Cross');
  const [permissionScope, setPermissionScope] = useState<ShareLinkPermissionLevel>('limited');

  // Limits state (BR-05, BRULE-03)
  const [durationHours, setDurationHours] = useState<number>(48);
  const [scanLimit, setScanLimit] = useState('10 scans');
  const [recipientName, setRecipientName] = useState('Prospective Buyer');

  // Recent QR codes
  const [recentCodes, setRecentCodes] = useState<RecentQRCodeItem[]>([]);

  // Dynamic QR Payload state
  const [qrToken, setQrToken] = useState<string>('');
  const [backendQrDataUrl, setBackendQrDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // QR Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  // Toast feedback state
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Load real user vehicles and recent share links on mount
  useEffect(() => {
    const requestedVehicleId = searchParams.get('vehicleId');

    getMyVehicles()
      .then(async (vehicles) => {
        if (vehicles && vehicles.length > 0) {
          setVehiclesList(vehicles);
          const initial = requestedVehicleId
            ? vehicles.find((v) => v._id === requestedVehicleId) || vehicles[0]
            : vehicles[0];

          setSelectedVehicleId(initial._id);
          setVehicle(`${initial.registrationNumber} · ${initial.manufacturer} ${initial.model}`);

          // Fetch recent links for this owner
          try {
            const links = await getShareLinks();
            if (links && links.length > 0) {
              const mapped: RecentQRCodeItem[] = links.slice(0, 5).map((l) => ({
                id: l._id,
                purpose: l.purpose || 'Vehicle verification',
                date: new Date(l.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                }),
                scans: `${l.viewCount} / ${l.maxViews || 10} scans`,
                status: l.status === 'active' ? 'Active' : l.status === 'expired' ? 'Expired' : 'Revoked',
                token: l._id,
              }));
              setRecentCodes(mapped);

              // Use latest active link for current vehicle if available
              const currentActive = links.find(
                (l) =>
                  (typeof l.vehicleId === 'object' ? l.vehicleId?._id : l.vehicleId) === initial._id &&
                  l.status === 'active'
              );
              if (currentActive) {
                setQrToken(currentActive._id);
                return;
              }
            }
          } catch {
            // Ignore background error
          }

          // Generate initial real token for the vehicle
          generateInitialToken(initial);
        }
      })
      .catch(() => {
        // Fallback demo vehicle
        setQrToken('WP-CAR-1010');
      });
  }, [searchParams]);

  const generateInitialToken = async (targetVehicle: Vehicle) => {
    try {
      setIsGenerating(true);
      const res = await createShareLink({
        vehicleId: targetVehicle._id,
        recipientName: 'Prospective Buyer',
        purpose: 'Vehicle sale',
        permissionLevel: 'limited',
        expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        maxViews: 10,
      });

      setQrToken(res.rawToken);
      if (res.qrCodeDataUrl) {
        setBackendQrDataUrl(res.qrCodeDataUrl);
      }
    } catch {
      setQrToken(targetVehicle.registrationNumber || targetVehicle._id);
    } finally {
      setIsGenerating(false);
    }
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
        if (res.qrCodeDataUrl) {
          setBackendQrDataUrl(res.qrCodeDataUrl);
        }

        const newRecentItem: RecentQRCodeItem = {
          id: res.shareLink._id,
          purpose,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          scans: `0 / ${parsedLimit} scans`,
          status: 'Active',
          token,
        };
        setRecentCodes((prev) => [newRecentItem, ...prev.slice(0, 4)]);
        showToast(`Purpose-bound QR code generated for ${purpose}!`, 'success');
      } else {
        const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
        const newCode = `AC360-${purpose.slice(0, 3).toUpperCase()}-${randomSuffix}-${vehicleNumber.replace(/[^a-zA-Z0-9]/g, '')}`;
        setQrToken(newCode);
        showToast(`Verification QR code generated for ${purpose}!`, 'success');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate QR code.';
      showToast(msg, 'info');
    } finally {
      setIsGenerating(false);
    }
  };

  const fullQrPayload = `${window.location.origin}/buyer-qr?token=${qrToken}`;

  // High-Resolution PNG Card Download
  const handleDownload = () => {
    const canvas = document.getElementById('autocare-qr-code-canvas') as HTMLCanvasElement;
    if (!canvas) {
      showToast('QR code asset not ready for download.', 'info');
      return;
    }

    try {
      const cardCanvas = document.createElement('canvas');
      cardCanvas.width = 640;
      cardCanvas.height = 800;
      const ctx = cardCanvas.getContext('2d');
      if (!ctx) return;

      // Clean white background with rounded border
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cardCanvas.width, cardCanvas.height);

      // Top Header Gradient Banner
      const grad = ctx.createLinearGradient(0, 0, cardCanvas.width, 0);
      grad.addColorStop(0, '#002B49');
      grad.addColorStop(1, '#0056A2');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cardCanvas.width, 105);

      // Header Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AutoCare 360 • Digital Passport QR', cardCanvas.width / 2, 48);

      ctx.fillStyle = '#93c5fd';
      ctx.font = '13px Inter, system-ui, sans-serif';
      ctx.fillText(`Purpose: ${purpose} • Sri Lanka Verified Ledger`, cardCanvas.width / 2, 78);

      // Vehicle Info Panel
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(40, 125, 560, 72, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 21px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(vehicleNumber, cardCanvas.width / 2, 156);

      ctx.fillStyle = '#64748b';
      ctx.font = '13px Inter, system-ui, sans-serif';
      ctx.fillText(vehicle, cardCanvas.width / 2, 178);

      // Draw QR Code
      ctx.drawImage(canvas, (cardCanvas.width - 320) / 2, 225, 320, 320);

      // Verification instructions
      ctx.fillStyle = '#0056a2';
      ctx.font = 'bold 13px Inter, system-ui, sans-serif';
      ctx.fillText('SCAN USING PHONE CAMERA TO VERIFY VEHICLE INTEGRITY', cardCanvas.width / 2, 580);

      ctx.fillStyle = '#64748b';
      ctx.font = '11px monospace';
      ctx.fillText(fullQrPayload, cardCanvas.width / 2, 608);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      ctx.fillText(`EXPIRES IN ${durationHours} HOURS • PROTECTED VIEW ONLY (BR-07)`, cardCanvas.width / 2, 638);

      // Footer
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.fillText('AutoCare 360 Cryptographic Ecosystem • Verified Digital Passport', cardCanvas.width / 2, 760);

      const pngUrl = cardCanvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `AutoCare360_QR_${vehicleNumber.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      showToast(`High-resolution QR pass for ${vehicleNumber} downloaded successfully!`, 'success');
    } catch {
      showToast('Downloaded standard QR vector code.', 'success');
    }
  };

  // Official Printable Certificate Window
  const handlePrint = () => {
    const canvas = document.getElementById('autocare-qr-code-canvas') as HTMLCanvasElement;
    const qrDataUrl = canvas ? canvas.toDataURL('image/png') : backendQrDataUrl;

    const printWin = window.open('', '_blank', 'width=760,height=880');
    if (!printWin) {
      window.print();
      return;
    }

    const printHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>AutoCare 360 - Verification Pass - ${vehicleNumber}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 40px; color: #0f172a; background: #ffffff; }
        .cert-card { border: 2px solid #002B49; border-radius: 16px; padding: 36px; max-width: 620px; margin: 0 auto; text-align: center; }
        .cert-header { margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
        .logo { font-size: 26px; font-weight: 800; color: #002B49; letter-spacing: -0.5px; }
        .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 14px; border-radius: 20px; font-size: 11.5px; font-weight: 700; margin-top: 8px; }
        .vehicle-reg { font-size: 28px; font-weight: 800; margin: 16px 0 4px; color: #0f172a; }
        .vehicle-name { font-size: 15px; color: #64748b; margin-bottom: 24px; }
        .qr-wrap { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 14px; display: inline-block; padding: 14px; margin: 0 auto 20px; }
        .qr-img { width: 260px; height: 260px; display: block; }
        .info-grid { width: 100%; border-collapse: collapse; margin: 24px 0 16px; text-align: left; font-size: 13px; }
        .info-grid td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
        .info-grid td:first-child { font-weight: 600; color: #475569; width: 36%; }
        .footer-law { font-size: 11px; color: #94a3b8; margin-top: 24px; line-height: 1.5; }
        @media print {
          body { padding: 0; }
          .cert-card { border-color: #000; box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="cert-card">
        <div class="cert-header">
          <div class="logo">AutoCare 360</div>
          <div class="badge">OFFICIAL VEHICLE INSPECTION &amp; VERIFICATION PASS</div>
        </div>

        <div class="vehicle-reg">${vehicleNumber}</div>
        <div class="vehicle-name">${vehicle}</div>

        <div class="qr-wrap">
          <img src="${qrDataUrl}" class="qr-img" alt="AutoCare 360 QR Code" />
        </div>

        <table class="info-grid">
          <tr><td>Sharing Purpose:</td><td><strong>${purpose}</strong></td></tr>
          <tr><td>Permission Scope:</td><td>${permissionScope === 'limited' ? 'Limited (Costs & Owner Privacy Masked - BR-06)' : 'Full Access'}</td></tr>
          <tr><td>Authorized Recipient:</td><td>${recipientName}</td></tr>
          <tr><td>Validity:</td><td>Expires in ${durationHours} hours (${new Date(Date.now() + durationHours * 3600000).toLocaleString()})</td></tr>
          <tr><td>Verification URL:</td><td><code style="font-size: 11px; word-break: break-all;">${fullQrPayload}</code></td></tr>
        </table>

        <div class="footer-law">
          Scan with any mobile device or inspection terminal to view cryptographic service ledger.
          <br>Tamper-evident verification backed by AutoCare 360 governance rules.
        </div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 250);
        };
      </script>
    </body>
    </html>
    `;

    printWin.document.write(printHtml);
    printWin.document.close();
  };

  const handleShare = async () => {
    const verificationUrl = fullQrPayload;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `AutoCare 360 Vehicle Passport - ${vehicleNumber}`,
          text: `Verified digital maintenance records for ${vehicleNumber} (${purpose})`,
          url: verificationUrl,
        });
        showToast('Shared successfully!', 'success');
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(verificationUrl).catch(() => {});
    }
    showToast(`QR verification link copied to clipboard!`, 'success');
  };

  const copyPayload = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(fullQrPayload).catch(() => {});
    }
    showToast('Verification URL copied to clipboard!', 'success');
  };

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
              <button
                type="button"
                className="autocare-qr-btn-draft"
                onClick={() => setIsScannerOpen(true)}
                title="Open Live QR Code Scanner"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ScanLine size={15} />
                <span>Test Scanner</span>
              </button>

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
                        if (v) {
                          setVehicle(`${v.registrationNumber} · ${v.manufacturer} ${v.model}`);
                          generateInitialToken(v);
                        }
                      }}
                    >
                      {vehiclesList.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.registrationNumber} - {v.manufacturer} {v.model} ({v.manufacturingYear || '2023'})
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
                  {recentCodes.length > 0 ? (
                    recentCodes.map((item) => (
                      <div
                        key={item.id}
                        className="autocare-qr-recent-row"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          if (item.token) {
                            setQrToken(item.token);
                            showToast(`Loaded QR pass for ${item.purpose}.`, 'info');
                          }
                        }}
                      >
                        <span className="autocare-qr-col-purpose">{item.purpose}</span>
                        <span className="autocare-qr-col-date">{item.date}</span>
                        <span className="autocare-qr-col-scans">{item.scans}</span>
                        <span
                          className={`autocare-qr-col-status is-${item.status.toLowerCase()}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                      No previous QR codes generated yet. Click &quot;Generate QR code&quot; above.
                    </div>
                  )}
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
                  {/* Canvas for crisp PNG card generation & SVG for sharp responsive display */}
                  <QRCodeCanvas
                    id="autocare-qr-code-canvas"
                    value={fullQrPayload}
                    size={240}
                    level="H"
                    includeMargin={true}
                    fgColor="#002B49"
                    bgColor="#ffffff"
                    style={{ display: 'none' }}
                  />
                  <QRCodeSVG
                    id="autocare-qr-code-svg"
                    value={fullQrPayload}
                    size={220}
                    level="H"
                    includeMargin={true}
                    fgColor="#002B49"
                    bgColor="#ffffff"
                  />
                </div>

                <div className="autocare-qr-preview-label">
                  {vehicleNumber} · {purpose}
                </div>

                <div className="autocare-qr-expiry-badge">
                  EXPIRES IN {durationHours} HOURS
                </div>

                {/* Direct Verification Link Box */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    marginBottom: '16px',
                    fontSize: '11.5px',
                    color: '#475569',
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '220px',
                    }}
                  >
                    {fullQrPayload}
                  </span>
                  <button
                    type="button"
                    onClick={copyPayload}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0056A2',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px',
                    }}
                    title="Copy verification link"
                  >
                    <Copy size={13} />
                  </button>
                </div>

                <div className="autocare-qr-preview-actions">
                  <button
                    type="button"
                    className="autocare-qr-btn-action is-primary"
                    onClick={handleDownload}
                    title="Download high-resolution QR pass"
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </button>

                  <Link
                    to={`/buyer-qr?token=${qrToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="autocare-qr-btn-action"
                    title="Preview Buyer Shared Record View in new tab"
                    style={{ textDecoration: 'none' }}
                  >
                    <ExternalLink size={14} />
                    <span>Preview</span>
                  </Link>

                  <button
                    type="button"
                    className="autocare-qr-btn-action"
                    onClick={handlePrint}
                    title="Print official verification certificate"
                  >
                    <Printer size={14} />
                    <span>Print</span>
                  </button>

                  <button
                    type="button"
                    className="autocare-qr-btn-action"
                    onClick={handleShare}
                    title="Share verification pass"
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

      {/* Reusable QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(token) => {
          navigate(`/buyer-qr?token=${encodeURIComponent(token)}`);
        }}
        title="AutoCare 360 QR Scanner"
        subtitle="Scan vehicle inspection QR pass or digital passport"
      />

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
