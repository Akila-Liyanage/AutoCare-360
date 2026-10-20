import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  X,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Plus
} from 'lucide-react';
import Footer from '../../components/layout/Footer';
import logoImg from '../../assets/auth/download (27) (1) 2.png';
import {
  MOCK_GARAGE_KPIS,
  MOCK_RECENT_ENTRIES,
  MOCK_OCR_QUEUE,
  MOCK_OCR_WARNING,
  MOCK_GARAGE_RECORDS,
  type GarageRecordItem
} from './garageData';
import '../../styles/garage-dashboard.css';

interface ToastState {
  show: boolean;
  message: string;
}

export const GarageDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Active Sidebar Item State
  const [activeTab, setActiveTab] = useState<string>('Overview');

  // Interactive Toast State
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  const handleSidebarClick = (tabName: string) => {
    setActiveTab(tabName);
    if (tabName === 'Vehicles') {
      navigate('/vehicles');
    } else if (tabName === 'Documents') {
      navigate('/vehicles/1/documents');
    } else if (tabName === 'Sharing & access') {
      navigate('/sharing/qr');
    } else if (tabName === 'Notifications') {
      navigate('/notifications');
    } else if (tabName !== 'Overview') {
      showToast(`Switched view to ${tabName} workspace for Perera Auto Works.`);
    }
  };

  const handleAddServiceEntry = () => {
    showToast(
      'Ledger Entry Publisher initialized for Perera Auto Works. Maintenance record submission form will be integrated in the upcoming publisher phase.'
    );
  };

  const handleViewPassport = (record: GarageRecordItem) => {
    showToast(`Opening Verified Digital Passport for ${record.vehicleRef}...`);
    setTimeout(() => {
      navigate('/vehicles');
    }, 600);
  };

  const handleAddRecord = (record: GarageRecordItem) => {
    showToast(
      `Add Service Record for ${record.vehicleRef} will be available in the upcoming maintenance publisher phase.`
    );
  };

  const handleOcrClick = () => {
    showToast(
      'Invoice Scan #0492: AI Optical Recognition currently at 88% confidence for Toyota Prius (WP CAR-8282).'
    );
  };

  const handleOcrWarningClick = () => {
    showToast(
      'OCR Validation Warning: Telemetry disparity detected. Manual inspection of physical odometer photo required.'
    );
  };

  const sidebarMenuItems = [
    { label: 'Overview', id: 'Overview' },
    { label: 'Vehicles', id: 'Vehicles' },
    { label: 'Service records', id: 'Service records' },
    { label: 'Documents', id: 'Documents' },
    { label: 'Sharing & access', id: 'Sharing & access' },
    { label: 'Audit trail', id: 'Audit trail' },
    { label: 'Notifications', id: 'Notifications' }
  ];

  return (
    <div className="autocare-garage-layout">
      {/* ====================================================================
          LEFT SIDEBAR — Verified Garage Navigation
          ==================================================================== */}
      <aside className="autocare-garage-sidebar" aria-label="Garage Navigation Sidebar">
        <div>
          {/* Logo Card */}
          <Link to="/" className="autocare-garage-logo-card" aria-label="AutoCare 360 Home">
            <img src={logoImg} alt="AutoCare 360" />
          </Link>

          {/* Sidebar Menu Items */}
          <nav className="autocare-garage-menu" aria-label="Garage Menu">
            {sidebarMenuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`autocare-garage-menu-item ${activeTab === item.id ? 'is-active' : ''
                  }`}
                onClick={() => handleSidebarClick(item.label)}
              >
                <span className="autocare-garage-menu-dot" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom Verified Garage Badge Card */}
        <div className="autocare-garage-badge-card">
          <span className="autocare-garage-verified-pill">VERIFIED GARAGE</span>
          <h4 className="autocare-garage-badge-name">Perera Auto Works</h4>
          <p className="autocare-garage-badge-location">Colombo 05 · BR-03</p>
        </div>
      </aside>

      {/* ====================================================================
          MAIN RIGHT AREA — Top Bar + Content + Footer
          ==================================================================== */}
      <div className="autocare-garage-main-wrapper">
        {/* Top Bar */}
        <header className="autocare-garage-topbar">
          <div className="autocare-garage-breadcrumb">
            <Link to="/" className="autocare-garage-crumb-parent">
              AutoCare 360
            </Link>
            <span className="autocare-garage-crumb-separator">/</span>
            <span className="autocare-garage-crumb-current">Overview</span>
          </div>

          <div className="autocare-garage-topbar-actions">
            <Link
              to="/notifications"
              className="autocare-garage-notify-btn"
              aria-label="Garage Notifications"
              title="Notifications"
            >
              <Bell size={18} />
              <span className="autocare-garage-notify-dot" aria-hidden="true" />
            </Link>

            <div
              className="autocare-garage-user-pill"
              onClick={() => setShowProfileModal(true)}
              title="View Garage Representative Profile"
            >
              <span className="autocare-garage-user-name">Kaveesha P.</span>
              <div className="autocare-garage-user-avatar">KP</div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="autocare-garage-content">
          {/* Business Verification Hero Card */}
          <section
            className="autocare-garage-hero-card"
            aria-label="Garage Verification Status"
          >
            <div>
              <p className="autocare-garage-hero-sub">Business verification</p>
              <span className="autocare-garage-hero-verified-badge">
                VERIFIED BUSINESS
              </span>
              <h2 className="autocare-garage-hero-title">Perera Auto Works</h2>
              <p className="autocare-garage-hero-desc">
                BR-03 · Verified through 31 Dec 2026 · Colombo 05
              </p>
            </div>

            <button
              type="button"
              className="autocare-garage-hero-btn"
              onClick={() => setShowProfileModal(true)}
            >
              View profile
            </button>
          </section>

          {/* Main Dashboard Title Row */}
          <div className="autocare-garage-title-row">
            <div>
              <h1 className="autocare-garage-main-title">Garage Service Management</h1>
              <p className="autocare-garage-main-subtitle">
                Tamper-proof ledger publisher portal and diagnostic scanning metrics.
              </p>
            </div>

            <button
              type="button"
              className="autocare-garage-btn-primary"
              onClick={handleAddServiceEntry}
            >
              <Plus size={16} />
              <span>Add Service Entry</span>
            </button>
          </div>

          {/* KPI Cards Grid */}
          <section className="autocare-garage-kpis-grid" aria-label="Garage Key Metrics">
            {MOCK_GARAGE_KPIS.map((kpi) => (
              <div key={kpi.id} className="autocare-garage-kpi-card">
                <div className="autocare-garage-kpi-label">{kpi.label}</div>
                <div
                  className={`autocare-garage-kpi-val ${kpi.value.startsWith('Rs') ? 'is-currency' : ''
                    }`}
                >
                  {kpi.value}
                </div>
                <p
                  className={`autocare-garage-kpi-subtext is-${kpi.subtextType}`}
                >
                  {kpi.subtext}
                </p>
              </div>
            ))}
          </section>

          {/* Middle Two-Column Grid: Recent Entries + AI OCR Queue */}
          <div className="autocare-garage-middle-grid">
            {/* Left Column: Recent Verified Entries */}
            <section
              className="autocare-garage-panel"
              aria-label="Recent Verified Entries"
            >
              <h2 className="autocare-garage-panel-title">Recent Verified Entries</h2>

              <div className="autocare-garage-entries-list">
                {MOCK_RECENT_ENTRIES.map((entry) => (
                  <div key={entry.id} className="autocare-garage-entry-item">
                    <div className="autocare-garage-entry-left">
                      <span className="autocare-garage-entry-vehicle">
                        {entry.vehicleTitle} ({entry.regNumber})
                      </span>
                      <span className="autocare-garage-entry-details">
                        {entry.mileage} • {entry.serviceDescription}
                      </span>
                    </div>

                    <span
                      className={`autocare-garage-status-badge ${entry.status === 'COMMITTED'
                          ? 'is-committed'
                          : 'is-pending'
                        }`}
                    >
                      {entry.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Right Column: Active AI OCR Queue */}
            <section
              className="autocare-garage-panel"
              aria-label="Active AI OCR Queue"
            >
              <h2 className="autocare-garage-panel-title">Active AI OCR Queue</h2>

              {/* In-progress OCR item */}
              <div
                className="autocare-garage-ocr-box"
                onClick={handleOcrClick}
                role="button"
                tabIndex={0}
                title="Click to inspect OCR scanning breakdown"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleOcrClick();
                }}
              >
                <div className="autocare-garage-ocr-dot" aria-hidden="true" />
                <div>
                  <div className="autocare-garage-ocr-scan">
                    Invoice Scan {MOCK_OCR_QUEUE.scanNumber}
                  </div>
                  <div className="autocare-garage-ocr-vehicle">
                    {MOCK_OCR_QUEUE.vehicleTitle} ({MOCK_OCR_QUEUE.regNumber}) - Processing{' '}
                    {MOCK_OCR_QUEUE.progressPercent}%
                  </div>
                </div>
              </div>

              {/* Warning Notice Box */}
              <div
                className="autocare-garage-warning-box"
                onClick={handleOcrWarningClick}
                role="button"
                tabIndex={0}
                title="Click for validation error logs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleOcrWarningClick();
                }}
              >
                <AlertTriangle size={18} className="autocare-garage-warning-icon" />
                <div>
                  <div className="autocare-garage-warning-title">
                    {MOCK_OCR_WARNING.title}
                  </div>
                  <div className="autocare-garage-warning-desc">
                    {MOCK_OCR_WARNING.message}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Bottom Section: Records Table Panel */}
          <section
            className="autocare-garage-records-panel"
            aria-label="Service Records Ledger"
          >
            <h2 className="autocare-garage-records-title">Records</h2>

            <table className="autocare-garage-records-table">
              <tbody>
                {MOCK_GARAGE_RECORDS.map((rec) => (
                  <tr key={rec.id}>
                    <td className="autocare-garage-td-ref">{rec.vehicleRef}</td>
                    <td className="autocare-garage-td-customer">{rec.customerName}</td>
                    <td className="autocare-garage-td-date">{rec.date}</td>
                    <td
                      className={`autocare-garage-td-status is-${rec.statusColor}`}
                    >
                      {rec.status}
                    </td>
                    <td className="autocare-garage-td-actions">
                      <button
                        type="button"
                        className="autocare-garage-action-link"
                        onClick={() => handleViewPassport(rec)}
                        title={`View Digital Passport for ${rec.vehicleRef}`}
                      >
                        View Passport
                      </button>
                      <span className="autocare-garage-action-separator">·</span>
                      <button
                        type="button"
                        className="autocare-garage-action-link"
                        onClick={() => handleAddRecord(rec)}
                        title={`Add Record for ${rec.vehicleRef}`}
                      >
                        Add Record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>

        {/* AutoCare 360 Standard Footer */}
        <Footer />
      </div>

      {/* ====================================================================
          MODALS & TOASTS
          ==================================================================== */}
      {/* Garage Profile Modal */}
      {showProfileModal && (
        <div
          className="autocare-garage-modal-backdrop"
          onClick={() => setShowProfileModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="autocare-garage-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="autocare-garage-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20} />
                <h3>Verified Garage Profile</h3>
              </div>
              <button
                type="button"
                className="autocare-garage-modal-close-btn"
                onClick={() => setShowProfileModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="autocare-garage-modal-body">
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 800,
                    marginBottom: '10px'
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>SLT-CERTIFIED LEVEL 4 REPAIR WORKSHOP</span>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>
                  Perera Auto Works (Pvt) Ltd
                </h2>
                <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
                  Authorized Inspection &amp; Ledger Maintenance Station
                </p>
              </div>

              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Business Reg. (BR)</span>
                <span className="autocare-garage-profile-spec-val">PV-102948-BR03</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Operating Location</span>
                <span className="autocare-garage-profile-spec-val">Havelock Road, Colombo 05</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Lead Certifier</span>
                <span className="autocare-garage-profile-spec-val">Kaveesha Perera (Master Tech)</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Blockchain Key Signature</span>
                <span className="autocare-garage-profile-spec-val">0x9f4a...81c2 (Active)</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Accreditation Expiry</span>
                <span className="autocare-garage-profile-spec-val">31 December 2026</span>
              </div>
            </div>

            <div className="autocare-garage-modal-footer">
              <button
                type="button"
                className="autocare-garage-btn-primary"
                onClick={() => setShowProfileModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Toast Notification */}
      {toast.show && (
        <div className="autocare-garage-toast" role="alert">
          <CheckCircle2 size={18} style={{ color: '#00B4EB', flexShrink: 0 }} />
          <span>{toast.message}</span>
          <button
            type="button"
            className="autocare-garage-toast-close"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            aria-label="Dismiss toast"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default GarageDashboardPage;
