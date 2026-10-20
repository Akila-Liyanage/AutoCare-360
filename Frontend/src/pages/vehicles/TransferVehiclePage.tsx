import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Bell,
  ShieldCheck,
  Pencil,
  Zap,
  CheckCircle2,
  LayoutGrid,
  X,
  AlertCircle
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import defaultHeroImg from '../../assets/vehicles/default-vehicle-hero.png';
import '../../styles/transfer.css';

interface ToastState {
  message: string;
  type: 'success' | 'info';
}

interface TransferFormData {
  recipientName: string;
  recipientNic: string;
  recipientEmail: string;
  recipientPhone: string;
  transferDate: string;
  transferNotes: string;
  acknowledged: boolean;
}

interface FormErrors {
  recipientName?: string;
  recipientNic?: string;
  recipientEmail?: string;
  acknowledged?: string;
}

export const TransferVehiclePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');

  // Transfer Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Transfer Form State
  const [formData, setFormData] = useState<TransferFormData>({
    recipientName: '',
    recipientNic: '',
    recipientEmail: '',
    recipientPhone: '',
    transferDate: new Date().toISOString().split('T')[0],
    transferNotes: '',
    acknowledged: false,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Ownership Ledger State (Frontend mock state)
  const [currentOwner, setCurrentOwner] = useState('Alex Mitchell');
  const [ownerHash] = useState('0x81ac2 ... b652');
  const [transferStatus, setTransferStatus] = useState<'compliant' | 'pending' | 'transferred'>('compliant');
  const [transferStatusText, setTransferStatusText] = useState('● FULLY COMPLIANT');
  const [auditSubtext, setAuditSubtext] = useState('Audit status verified 100% complete');

  // Toast feedback state
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Safe vehicle ID for back navigation
  const vehicleId = id || 'WP-ABC-1234';

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
      if (formErrors.acknowledged) {
        setFormErrors((prev) => ({ ...prev, acknowledged: undefined }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (formErrors[name as keyof FormErrors]) {
        setFormErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.recipientName.trim()) {
      errors.recipientName = 'Recipient full name is required.';
    }

    if (!formData.recipientNic.trim()) {
      errors.recipientNic = 'Recipient NIC / Passport number is required.';
    }

    if (!formData.recipientEmail.trim()) {
      errors.recipientEmail = 'Recipient email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipientEmail.trim())) {
      errors.recipientEmail = 'Please provide a valid email address.';
    }

    if (!formData.acknowledged) {
      errors.acknowledged = 'You must confirm ownership transfer terms.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Update local ledger status to pending transfer
    setCurrentOwner(`${formData.recipientName} (Pending Handover)`);
    setTransferStatus('pending');
    setTransferStatusText('● PENDING RECIPIENT ACCEPTANCE');
    setAuditSubtext(
      `Transfer request initiated to ${formData.recipientName} (${formData.recipientNic})`
    );

    setIsModalOpen(false);
    showToast(
      `Transfer passport request for ${vehicleId} dispatched to ${formData.recipientName}! Cryptographic transfer broadcast initiated.`,
      'success'
    );
  };

  const handleCancelBack = () => {
    navigate(`/vehicles/${vehicleId}`);
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  return (
    <div className="autocare-transfer-page">
      <Navbar />

      <main className="autocare-transfer-main">
        <div className="autocare-transfer-container">
          {/* Back Navigation Button */}
          <div className="autocare-transfer-back-nav">
            <Link
              to={`/vehicles/${vehicleId}`}
              className="autocare-transfer-back-btn"
              title="Return to vehicle details"
            >
              <ArrowLeft size={16} />
              <span>Back to vehicle details</span>
            </Link>
          </div>

          {/* Top Header Row Matching Figma */}
          <header className="autocare-transfer-header-row">
            <h1 className="autocare-transfer-title">Transfer vehicle records</h1>

            <div className="autocare-transfer-toolbar">
              {/* Search Box */}
              <div className="autocare-transfer-search-box">
                <Search size={18} className="autocare-transfer-search-icon" />
                <input
                  type="text"
                  className="autocare-transfer-search-input"
                  placeholder="Search VINs, service records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search VINs or service records"
                />
              </div>

              {/* Notification Bell Button */}
              <button
                type="button"
                className="autocare-transfer-bell-btn"
                title="Notifications"
                onClick={() => navigate('/notifications')}
                aria-label="View notifications"
              >
                <Bell size={18} />
              </button>

              {/* AutoCare Blockchain Secured Capsule Pill */}
              <div className="autocare-transfer-badge-secured" role="status">
                <span className="autocare-transfer-dot-secured" aria-hidden="true" />
                <span>AutoCare Blockchain Secured</span>
              </div>
            </div>
          </header>

          {/* 1. Hero Vehicle Summary Card */}
          <section className="autocare-transfer-hero-card" aria-label="Selected Vehicle Information">
            <div className="autocare-transfer-hero-left">
              <div className="autocare-transfer-hero-thumb">
                <img
                  src={defaultHeroImg}
                  alt="Vehicle Thumbnail"
                  loading="lazy"
                />
              </div>

              <div className="autocare-transfer-hero-info">
                <div className="autocare-transfer-hero-title-row">
                  <h2 className="autocare-transfer-hero-title">Tesla Model S Plaid</h2>
                  <span className="autocare-transfer-hero-badge">
                    <CheckCircle2 size={13} />
                    <span>AI Trust Score: 98%</span>
                  </span>
                </div>
                <p className="autocare-transfer-hero-hash">
                  Global Immutable Record: <code>0x9d15dc86 ... bf489</code>
                </p>
              </div>
            </div>

            <div className="autocare-transfer-hero-actions">
              <button
                type="button"
                className="autocare-transfer-btn-edit"
                onClick={handleCancelBack}
                title="Edit vehicle details"
              >
                <Pencil size={15} />
                <span>Edit Details</span>
              </button>

              <button
                type="button"
                className="autocare-transfer-btn-passport"
                onClick={() => setIsModalOpen(true)}
                title="Transfer vehicle passport records"
              >
                <Zap size={16} />
                <span>Transfer Passport</span>
              </button>
            </div>
          </section>

          {/* 2. Ownership & Cryptographic Integrity Ledger Card */}
          <section
            className="autocare-transfer-ownership-card"
            aria-label="Ownership and Cryptographic Ledger"
          >
            <h2 className="autocare-transfer-card-heading">
              Ownership &amp; Cryptographic Integrity Ledger
            </h2>

            <div className="autocare-transfer-ownership-grid">
              {/* Left Box: Current Verified Owner */}
              <div className="autocare-transfer-ledger-box">
                <span className="autocare-transfer-ledger-label">Current Verified Owner</span>
                <span className="autocare-transfer-ledger-val">{currentOwner}</span>
                <span className="autocare-transfer-ledger-sub">Owner Hash: {ownerHash}</span>
              </div>

              {/* Right Box: Trust Verification Status */}
              <div className="autocare-transfer-ledger-box">
                <span className="autocare-transfer-ledger-label">Trust Verification Status</span>
                <span
                  className={`autocare-transfer-ledger-val ${
                    transferStatus === 'compliant' ? 'is-green' : ''
                  }`}
                  style={{
                    color: transferStatus === 'compliant' ? '#15803d' : '#0284c7',
                  }}
                >
                  {transferStatusText}
                </span>
                <span className="autocare-transfer-ledger-sub" style={{ fontFamily: 'inherit' }}>
                  {auditSubtext}
                </span>
              </div>
            </div>
          </section>

          {/* 3. Middle Split Section: Specifications (Left) + Scores (Right) */}
          <section className="autocare-transfer-middle-grid" aria-label="Official Specifications and Trust Score">
            {/* Left Column: Official Registration Specifications */}
            <div className="autocare-transfer-specs-card">
              <h2 className="autocare-transfer-card-heading">
                Official Registration Specifications
              </h2>

              <div className="autocare-transfer-specs-list">
                <div className="autocare-transfer-specs-row">
                  <span className="autocare-transfer-specs-label">Registration Number</span>
                  <span className="autocare-transfer-specs-value">WP ABC-1234</span>
                </div>
                <div className="autocare-transfer-specs-row">
                  <span className="autocare-transfer-specs-label">VIN / Chassis No</span>
                  <span className="autocare-transfer-specs-value is-mono">NHP10-23648102</span>
                </div>
                <div className="autocare-transfer-specs-row">
                  <span className="autocare-transfer-specs-label">Engine Number</span>
                  <span className="autocare-transfer-specs-value is-mono">1NZ-FXE-45812</span>
                </div>
                <div className="autocare-transfer-specs-row">
                  <span className="autocare-transfer-specs-label">Vehicle Category</span>
                  <span className="autocare-transfer-specs-value">Motor Car (Hybrid)</span>
                </div>
                <div className="autocare-transfer-specs-row">
                  <span className="autocare-transfer-specs-label">Manufacturer</span>
                  <span className="autocare-transfer-specs-value">Toyota Motor Corporation</span>
                </div>
                <div className="autocare-transfer-specs-row">
                  <span className="autocare-transfer-specs-label">Model &amp; Variant</span>
                  <span className="autocare-transfer-specs-value">Aqua 1.5 S</span>
                </div>
                <div className="autocare-transfer-specs-row">
                  <span className="autocare-transfer-specs-label">Year of Manufacture</span>
                  <span className="autocare-transfer-specs-value">2018</span>
                </div>
                <div className="autocare-transfer-specs-row">
                  <span className="autocare-transfer-specs-label">Current Recorded Mileage</span>
                  <span className="autocare-transfer-specs-value">85,240 km (Verified)</span>
                </div>
                <div className="autocare-transfer-specs-row">
                  <span className="autocare-transfer-specs-label">Current Registered Owner</span>
                  <span className="autocare-transfer-specs-value">David Silva</span>
                </div>
              </div>
            </div>

            {/* Right Column: Passport Trust Score & Odometer Authenticity */}
            <div className="autocare-transfer-right-stack">
              {/* Card 1: Passport Trust Score */}
              <div className="autocare-transfer-score-card">
                <h2 className="autocare-transfer-card-heading">Passport Trust Score</h2>

                <div className="autocare-transfer-circle-container">
                  <svg
                    width="128"
                    height="128"
                    viewBox="0 0 120 120"
                    className="autocare-transfer-circle-svg"
                    aria-hidden="true"
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="48"
                      strokeWidth="11"
                      fill="transparent"
                      className="autocare-transfer-circle-bg"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="48"
                      strokeWidth="11"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 48}
                      strokeDashoffset="0"
                      className="autocare-transfer-circle-progress"
                    />
                  </svg>
                  <span className="autocare-transfer-circle-text">100%</span>
                </div>

                <p className="autocare-transfer-score-subtext">
                  Data sources verified on decentralised cluster ledger. No discrepancy found.
                </p>
              </div>

              {/* Card 2: Odometer Authenticity */}
              <div className="autocare-transfer-odometer-card">
                <div className="autocare-transfer-odometer-header">
                  <LayoutGrid size={20} className="autocare-transfer-odometer-icon" />
                  <h3 className="autocare-transfer-odometer-title">Odometer Authenticity</h3>
                </div>

                <p className="autocare-transfer-odometer-desc">
                  Telemetry cross-analysis confirms odometer sequence consistency against 12 historical check-ins.
                </p>

                <div className="autocare-transfer-odometer-badge">
                  MILEAGE RATING: PERFECT (A+)
                </div>
              </div>
            </div>
          </section>

          {/* 4. Bottom Dark Navy Card: Verified Ledger Records */}
          <section
            className="autocare-transfer-records-card"
            aria-label="Verified Ledger Records Authorized For Viewer"
          >
            <h2 className="autocare-transfer-records-heading">
              Verified Ledger Records (Authorized For Viewer)
            </h2>

            <div className="autocare-transfer-records-list">
              {/* Record 1 */}
              <div className="autocare-transfer-record-item">
                <div className="autocare-transfer-record-info">
                  <span className="autocare-transfer-record-title">Cabin Filter &amp; AC Service</span>
                  <span className="autocare-transfer-record-meta">Aug 12, 2025 • Apex Tech Center</span>
                </div>
                <span className="autocare-transfer-badge-certified">Certified</span>
              </div>

              <div className="autocare-transfer-record-divider" />

              {/* Record 2 */}
              <div className="autocare-transfer-record-item">
                <div className="autocare-transfer-record-info">
                  <span className="autocare-transfer-record-title">
                    Annual Safety &amp; Electronic Diagnostics Check
                  </span>
                  <span className="autocare-transfer-record-meta">
                    May 04, 2025 • Palo Alto Supercharger
                  </span>
                </div>
                <span className="autocare-transfer-badge-certified">Certified</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* 5. Transfer Ownership Modal / Dialog */}
      {isModalOpen && (
        <div
          className="autocare-transfer-modal-backdrop"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="transfer-modal-title"
        >
          <div
            className="autocare-transfer-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="autocare-transfer-modal-header">
              <div className="autocare-transfer-modal-title-group">
                <h2 id="transfer-modal-title">Transfer Vehicle Ownership &amp; Records</h2>
                <p>
                  Reassign decentralized vehicle passport and maintenance logs to the new legal owner.
                </p>
              </div>

              <button
                type="button"
                className="autocare-transfer-modal-close"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close transfer modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit}>
              <div className="autocare-transfer-modal-body">
                {/* Current Owner Banner */}
                <div className="autocare-transfer-current-owner-banner">
                  <div className="autocare-transfer-current-owner-info">
                    <span className="autocare-transfer-current-owner-title">Current Legal Owner</span>
                    <span className="autocare-transfer-current-owner-name">{currentOwner}</span>
                  </div>
                  <span className="autocare-transfer-current-owner-hash">{ownerHash}</span>
                </div>

                {/* Recipient Full Name */}
                <div className="autocare-transfer-form-group">
                  <label htmlFor="recipientName" className="autocare-transfer-form-label">
                    <span>
                      New Owner Full Name <span className="autocare-transfer-form-required">*</span>
                    </span>
                  </label>
                  <input
                    id="recipientName"
                    name="recipientName"
                    type="text"
                    className={`autocare-transfer-form-input ${
                      formErrors.recipientName ? 'is-error' : ''
                    }`}
                    placeholder="e.g. David Silva"
                    value={formData.recipientName}
                    onChange={handleInputChange}
                  />
                  {formErrors.recipientName && (
                    <span className="autocare-transfer-error-msg">{formErrors.recipientName}</span>
                  )}
                </div>

                {/* Recipient NIC & Email in 2 columns */}
                <div className="autocare-transfer-form-row-2">
                  <div className="autocare-transfer-form-group">
                    <label htmlFor="recipientNic" className="autocare-transfer-form-label">
                      <span>
                        Recipient NIC / ID <span className="autocare-transfer-form-required">*</span>
                      </span>
                    </label>
                    <input
                      id="recipientNic"
                      name="recipientNic"
                      type="text"
                      className={`autocare-transfer-form-input ${
                        formErrors.recipientNic ? 'is-error' : ''
                      }`}
                      placeholder="e.g. 199412345678"
                      value={formData.recipientNic}
                      onChange={handleInputChange}
                    />
                    {formErrors.recipientNic && (
                      <span className="autocare-transfer-error-msg">{formErrors.recipientNic}</span>
                    )}
                  </div>

                  <div className="autocare-transfer-form-group">
                    <label htmlFor="recipientEmail" className="autocare-transfer-form-label">
                      <span>
                        Recipient Email <span className="autocare-transfer-form-required">*</span>
                      </span>
                    </label>
                    <input
                      id="recipientEmail"
                      name="recipientEmail"
                      type="email"
                      className={`autocare-transfer-form-input ${
                        formErrors.recipientEmail ? 'is-error' : ''
                      }`}
                      placeholder="e.g. david.silva@example.com"
                      value={formData.recipientEmail}
                      onChange={handleInputChange}
                    />
                    {formErrors.recipientEmail && (
                      <span className="autocare-transfer-error-msg">{formErrors.recipientEmail}</span>
                    )}
                  </div>
                </div>

                {/* Phone & Date in 2 columns */}
                <div className="autocare-transfer-form-row-2">
                  <div className="autocare-transfer-form-group">
                    <label htmlFor="recipientPhone" className="autocare-transfer-form-label">
                      <span>Recipient Contact Phone</span>
                    </label>
                    <input
                      id="recipientPhone"
                      name="recipientPhone"
                      type="tel"
                      className="autocare-transfer-form-input"
                      placeholder="e.g. +94 77 123 4567"
                      value={formData.recipientPhone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="autocare-transfer-form-group">
                    <label htmlFor="transferDate" className="autocare-transfer-form-label">
                      <span>Transfer Effective Date</span>
                    </label>
                    <input
                      id="transferDate"
                      name="transferDate"
                      type="date"
                      className="autocare-transfer-form-input"
                      value={formData.transferDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Transfer Notes */}
                <div className="autocare-transfer-form-group">
                  <label htmlFor="transferNotes" className="autocare-transfer-form-label">
                    <span>Transfer Notes &amp; Handover Details</span>
                  </label>
                  <textarea
                    id="transferNotes"
                    name="transferNotes"
                    rows={3}
                    className="autocare-transfer-form-textarea"
                    placeholder="e.g. Ownership transfer following vehicle sales deed completion. Digital maintenance history transferred."
                    value={formData.transferNotes}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Cryptographic Security Callout */}
                <div className="autocare-transfer-security-callout">
                  <ShieldCheck size={20} className="autocare-transfer-security-icon" />
                  <div className="autocare-transfer-security-text">
                    <strong>Decentralized Ownership Reassignment Protocol</strong>
                    Reassigning this vehicle passport will transfer sovereignty of all verified maintenance
                    logs and telemetry entries to the designated recipient. An immutable audit event will be
                    logged to the AutoCare Blockchain ledger.
                  </div>
                </div>

                {/* Confirmation Checkbox */}
                <div className="autocare-transfer-form-group">
                  <label className="autocare-transfer-checkbox-label">
                    <input
                      type="checkbox"
                      name="acknowledged"
                      checked={formData.acknowledged}
                      onChange={handleInputChange}
                    />
                    <span>
                      I verify that I am authorized to transfer this vehicle passport and agree to hand over
                      cryptographic records to the designated recipient.
                    </span>
                  </label>
                  {formErrors.acknowledged && (
                    <span className="autocare-transfer-error-msg">{formErrors.acknowledged}</span>
                  )}
                </div>
              </div>

              <div className="autocare-transfer-modal-footer">
                <button
                  type="button"
                  className="autocare-transfer-btn-cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="autocare-transfer-btn-submit"
                >
                  <Zap size={16} />
                  <span>Confirm &amp; Transfer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`autocare-transfer-toast is-${toast.type}`}
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
            className="autocare-transfer-toast-close"
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

export default TransferVehiclePage;
