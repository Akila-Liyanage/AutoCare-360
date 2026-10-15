import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  X,
  Lock,
  ShieldCheck,
  Ban,
  QrCode
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import '../../styles/secure-link-sharing.css';

interface ToastState {
  message: string;
  type: 'success' | 'info';
}

interface DataVisibilityState {
  serviceDates: boolean;
  garageDetails: boolean;
  invoices: boolean;
  ownerContact: boolean;
}

export const SecureLinkSharingPage: React.FC = () => {
  const navigate = useNavigate();

  // Form Fields State matching Figma
  const [recipient, setRecipient] = useState('N. Fernando · Ceylinco Insurance');
  const [email, setEmail] = useState('inspection@ceylinco.lk');
  const [startDate, setStartDate] = useState('21 Sep 2026 · Now');
  const [expiresDate, setExpiresDate] = useState('24 Sep 2026 · 6:00 PM');

  const [visibility, setVisibility] = useState<DataVisibilityState>({
    serviceDates: true,
    garageDetails: true,
    invoices: true,
    ownerContact: false,
  });

  const [vehicle, setVehicle] = useState('WP ABC-1234 · Toyota Aqua');
  const [selectedRecords, setSelectedRecords] = useState(
    '21 Sep service · 15 May service · emissions report'
  );

  const [passcode, setPasscode] = useState('Required · 6 digits');
  const [downloads, setDownloads] = useState('Disabled');
  const [watermark, setWatermark] = useState('Recipient email');

  // Active Link Preview State
  const [linkSlug, setLinkSlug] = useState('AC9-K7Q-26');
  const [isLinkActive, setIsLinkActive] = useState(true);

  // Toast feedback state
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleCheckboxChange = (key: keyof DataVisibilityState) => {
    setVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveDraft = () => {
    showToast(`Draft sharing settings for ${vehicle} saved successfully.`, 'info');
  };

  const handleCreateSecureLink = () => {
    // Generate a fresh random link token
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const newSlug = `AC9-${code.slice(0, 3)}-${code.slice(3)}`;
    setLinkSlug(newSlug);
    setIsLinkActive(true);

    showToast(
      `Secure link generated: autocare.lk/s/${newSlug} (Passcode & Watermarking applied)`,
      'success'
    );
  };

  const handleCopyLink = () => {
    const fullUrl = `https://autocare.lk/s/${linkSlug}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(fullUrl).catch(() => {});
    }
    showToast(`Secure link copied: ${fullUrl}`, 'success');
  };

  const handleRevoke = () => {
    setIsLinkActive(false);
    showToast('Secure link access revoked immediately. Viewer sessions terminated.', 'info');
  };

  return (
    <div className="autocare-sharing-page">
      <Navbar />

      <main className="autocare-sharing-main">
        <div className="autocare-sharing-container">
          {/* Breadcrumb / Back Link */}
          <div className="autocare-sharing-back-nav">
            <button
              type="button"
              className="autocare-sharing-back-btn"
              onClick={() => navigate(-1)}
              title="Return to previous screen"
            >
              <ArrowLeft size={16} />
              <span>Back to vehicle details</span>
            </button>
          </div>

          {/* Top Header Row matching Figma */}
          <header className="autocare-sharing-header-row">
            <div className="autocare-sharing-title-group">
              <h1 className="autocare-sharing-title">Secure Link Sharing</h1>
              <p className="autocare-sharing-subtitle">
                BR-05 · Share a controlled, auditable vehicle record link.
              </p>
            </div>

            <div className="autocare-sharing-header-actions">
              <Link
                to="/sharing/permissions"
                className="autocare-sharing-btn-draft"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Manage access permissions"
              >
                <ShieldCheck size={15} />
                <span>Access permissions</span>
              </Link>

              <Link
                to="/sharing/qr"
                className="autocare-sharing-btn-draft"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Navigate to QR Code Sharing"
              >
                <QrCode size={15} />
                <span>QR Code Sharing</span>
              </Link>

              <button
                type="button"
                className="autocare-sharing-btn-draft"
                onClick={handleSaveDraft}
              >
                Save draft
              </button>

              <button
                type="button"
                className="autocare-sharing-btn-create"
                onClick={handleCreateSecureLink}
              >
                <Lock size={15} />
                <span>Create secure link</span>
              </button>
            </div>
          </header>

          {/* 2-Column Layout */}
          <div className="autocare-sharing-grid">
            {/* Left Form Column */}
            <div className="autocare-sharing-form-column">
              {/* Card 1: Recipient */}
              <section className="autocare-sharing-card" aria-label="Recipient Information">
                <h2 className="autocare-sharing-card-title">Recipient</h2>

                <div className="autocare-sharing-field-row-2">
                  <div className="autocare-sharing-form-group">
                    <label htmlFor="recipient-input" className="autocare-sharing-label">
                      Recipient
                    </label>
                    <input
                      id="recipient-input"
                      type="text"
                      className="autocare-sharing-input"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="e.g. N. Fernando · Ceylinco Insurance"
                    />
                  </div>

                  <div className="autocare-sharing-form-group">
                    <label htmlFor="email-input" className="autocare-sharing-label">
                      Email
                    </label>
                    <input
                      id="email-input"
                      type="email"
                      className="autocare-sharing-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. inspection@ceylinco.lk"
                    />
                  </div>
                </div>
              </section>

              {/* Card 2: Access duration */}
              <section className="autocare-sharing-card" aria-label="Access Duration">
                <h2 className="autocare-sharing-card-title">Access duration</h2>

                <div className="autocare-sharing-field-row-2">
                  <div className="autocare-sharing-form-group">
                    <label htmlFor="start-input" className="autocare-sharing-label">
                      Start
                    </label>
                    <input
                      id="start-input"
                      type="text"
                      className="autocare-sharing-input"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="e.g. 21 Sep 2026 · Now"
                    />
                  </div>

                  <div className="autocare-sharing-form-group">
                    <label htmlFor="expires-input" className="autocare-sharing-label">
                      Expires
                    </label>
                    <input
                      id="expires-input"
                      type="text"
                      className="autocare-sharing-input"
                      value={expiresDate}
                      onChange={(e) => setExpiresDate(e.target.value)}
                      placeholder="e.g. 24 Sep 2026 · 6:00 PM"
                    />
                  </div>
                </div>
              </section>

              {/* Card 3: Data visibility */}
              <section className="autocare-sharing-card" aria-label="Data Visibility Options">
                <h2 className="autocare-sharing-card-title">Data visibility</h2>

                <div className="autocare-sharing-checkbox-list">
                  <label className="autocare-sharing-checkbox-item">
                    <input
                      type="checkbox"
                      checked={visibility.serviceDates}
                      onChange={() => handleCheckboxChange('serviceDates')}
                    />
                    <span>Service dates &amp; mileage</span>
                  </label>

                  <label className="autocare-sharing-checkbox-item">
                    <input
                      type="checkbox"
                      checked={visibility.garageDetails}
                      onChange={() => handleCheckboxChange('garageDetails')}
                    />
                    <span>Garage and technician details</span>
                  </label>

                  <label className="autocare-sharing-checkbox-item">
                    <input
                      type="checkbox"
                      checked={visibility.invoices}
                      onChange={() => handleCheckboxChange('invoices')}
                    />
                    <span>Invoices and service images</span>
                  </label>

                  <label className="autocare-sharing-checkbox-item">
                    <input
                      type="checkbox"
                      checked={visibility.ownerContact}
                      onChange={() => handleCheckboxChange('ownerContact')}
                    />
                    <span>Owner contact and insurance documents</span>
                  </label>
                </div>
              </section>

              {/* Card 4: Vehicle & record scope */}
              <section className="autocare-sharing-card" aria-label="Vehicle and Record Scope">
                <h2 className="autocare-sharing-card-title">Vehicle &amp; record scope</h2>

                <div className="autocare-sharing-form-group">
                  <label htmlFor="vehicle-input" className="autocare-sharing-label">
                    Vehicle
                  </label>
                  <input
                    id="vehicle-input"
                    type="text"
                    className="autocare-sharing-input"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    placeholder="e.g. WP ABC-1234 · Toyota Aqua"
                  />
                </div>

                <div className="autocare-sharing-form-group has-spacing">
                  <label htmlFor="records-input" className="autocare-sharing-label">
                    Selected records
                  </label>
                  <input
                    id="records-input"
                    type="text"
                    className="autocare-sharing-input"
                    value={selectedRecords}
                    onChange={(e) => setSelectedRecords(e.target.value)}
                    placeholder="e.g. 21 Sep service · 15 May service · emissions report"
                  />
                </div>
              </section>

              {/* Card 5: Link protections */}
              <section className="autocare-sharing-card" aria-label="Link Protections">
                <h2 className="autocare-sharing-card-title">Link protections</h2>

                <div className="autocare-sharing-field-row-3">
                  <div className="autocare-sharing-form-group">
                    <label htmlFor="passcode-input" className="autocare-sharing-label">
                      Passcode
                    </label>
                    <input
                      id="passcode-input"
                      type="text"
                      className="autocare-sharing-input"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="e.g. Required · 6 digits"
                    />
                  </div>

                  <div className="autocare-sharing-form-group">
                    <label htmlFor="downloads-input" className="autocare-sharing-label">
                      Downloads
                    </label>
                    <input
                      id="downloads-input"
                      type="text"
                      className="autocare-sharing-input"
                      value={downloads}
                      onChange={(e) => setDownloads(e.target.value)}
                      placeholder="e.g. Disabled"
                    />
                  </div>

                  <div className="autocare-sharing-form-group">
                    <label htmlFor="watermark-input" className="autocare-sharing-label">
                      Watermark
                    </label>
                    <input
                      id="watermark-input"
                      type="text"
                      className="autocare-sharing-input"
                      value={watermark}
                      onChange={(e) => setWatermark(e.target.value)}
                      placeholder="e.g. Recipient email"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Right Side Column */}
            <aside className="autocare-sharing-side-column" aria-label="Link Preview and Guidance">
              {/* Card A: Active-link preview */}
              <div className="autocare-sharing-preview-card">
                <div className="autocare-sharing-preview-header">
                  <h2 className="autocare-sharing-preview-title">Active-link preview</h2>
                  {isLinkActive ? (
                    <span className="autocare-sharing-badge-active">
                      <ShieldCheck size={12} />
                      <span>SECURE · ACTIVE</span>
                    </span>
                  ) : (
                    <span className="autocare-sharing-badge-revoked">
                      <Ban size={12} />
                      <span>REVOKED</span>
                    </span>
                  )}
                </div>

                <div className="autocare-sharing-vehicle-target">
                  {vehicle.includes('·') ? vehicle.split('·')[1].trim() : vehicle} verified history
                </div>

                <div className="autocare-sharing-link-box">
                  <span>autocare.lk/s/{linkSlug}</span>
                </div>

                <p className="autocare-sharing-expires-text">
                  Expires {expiresDate}
                </p>

                <div className="autocare-sharing-preview-actions">
                  <button
                    type="button"
                    className="autocare-sharing-btn-copy"
                    onClick={handleCopyLink}
                    disabled={!isLinkActive}
                    style={{ opacity: isLinkActive ? 1 : 0.6 }}
                  >
                    <Copy size={14} />
                    <span>Copy link</span>
                  </button>

                  <button
                    type="button"
                    className="autocare-sharing-btn-revoke"
                    onClick={handleRevoke}
                    disabled={!isLinkActive}
                    style={{ opacity: isLinkActive ? 1 : 0.6 }}
                  >
                    <span>Revoke</span>
                  </button>
                </div>
              </div>

              {/* Card B: Security guidance */}
              <div className="autocare-sharing-guidance-card">
                <h2 className="autocare-sharing-guidance-title">Security guidance</h2>
                <p className="autocare-sharing-guidance-text">
                  Identity checks, passcode protection and recipient watermarking are logged. Revoke
                  access immediately if the inspection ends early.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`autocare-sharing-toast is-${toast.type}`}
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
            className="autocare-sharing-toast-close"
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

export default SecureLinkSharingPage;
