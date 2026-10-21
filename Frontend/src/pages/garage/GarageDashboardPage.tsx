import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Plus,
  CheckCircle2,
  X,
  FileText,
  Sparkles,
} from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import api from '../../services/api';
import {
  MOCK_GARAGE_KPIS,
  MOCK_RECENT_ENTRIES,
  MOCK_OCR_QUEUE,
  MOCK_OCR_WARNING,
  MOCK_GARAGE_RECORDS,
  type GarageKPI,
  type RecentVerifiedEntry,
  type GarageRecordItem,
} from './garageData';
import '../../styles/garage-dashboard.css';

interface ToastState {
  show: boolean;
  message: string;
}

export const GarageDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Toast feedback state
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  // OCR details modal state
  const [showOcrModal, setShowOcrModal] = useState<boolean>(false);

  // Live KPI and recent entries state (backed by real API data with fallback)
  const [kpis, setKpis] = useState<GarageKPI[]>(MOCK_GARAGE_KPIS);
  const [recentEntries, setRecentEntries] = useState<RecentVerifiedEntry[]>(MOCK_RECENT_ENTRIES);

  useEffect(() => {
    let isMounted = true;
    const fetchGarageStats = async () => {
      try {
        const response = await api.get('/garage/dashboard-stats');
        if (isMounted && response.data?.data) {
          if (Array.isArray(response.data.data.kpis) && response.data.data.kpis.length > 0) {
            setKpis(response.data.data.kpis);
          }
          if (Array.isArray(response.data.data.recentEntries) && response.data.data.recentEntries.length > 0) {
            setRecentEntries(response.data.data.recentEntries);
          }
        }
      } catch {
        // Fallback gracefully to mock data
      }
    };
    fetchGarageStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  const handleViewPassport = (record: GarageRecordItem) => {
    navigate(`/garage/vehicles/${record.vehicleId}`);
  };

  return (
    <GarageLayout activeItem="Overview" breadcrumbCurrent="Overview">
      {/* Business Verification Hero Card */}
      <section className="autocare-garage-hero-card" aria-label="Garage Verification Status">
        <div>
          <p className="autocare-garage-hero-sub">Business verification</p>
          <span className="autocare-garage-hero-verified-badge">VERIFIED BUSINESS</span>
          <h2 className="autocare-garage-hero-title">Perera Auto Works</h2>
          <p className="autocare-garage-hero-desc">
            BR-03 · Verified through 31 Dec 2026 · Colombo 05
          </p>
        </div>

        <button
          type="button"
          className="autocare-garage-hero-btn"
          onClick={() => {
            showToast('Perera Auto Works accreditation valid on SLT Mobitel Trust Network.');
          }}
        >
          Accreditation details
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
          onClick={() => navigate('/garage/maintenance/new')}
        >
          <Plus size={16} />
          <span>Add Service Entry</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <section className="autocare-garage-kpis-grid" aria-label="Garage Key Metrics">
        {kpis.map((kpi) => (
          <div key={kpi.id} className="autocare-garage-kpi-card">
            <div className="autocare-garage-kpi-label">{kpi.label}</div>
            <div
              className={`autocare-garage-kpi-val ${
                kpi.value.startsWith('Rs') ? 'is-currency' : ''
              }`}
            >
              {kpi.value}
            </div>
            <p className={`autocare-garage-kpi-subtext is-${kpi.subtextType}`}>
              {kpi.subtext}
            </p>
          </div>
        ))}
      </section>

      {/* Middle Two-Column Grid: Recent Entries + AI OCR Queue */}
      <div className="autocare-garage-middle-grid">
        {/* Left Column: Recent Verified Entries */}
        <section className="autocare-garage-panel" aria-label="Recent Verified Entries">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h2 className="autocare-garage-panel-title" style={{ margin: 0 }}>
              Recent Verified Entries
            </h2>
            <button
              type="button"
              className="autocare-garage-action-link"
              onClick={() => navigate('/garage/service-records')}
              style={{ fontSize: '12.5px' }}
            >
              View all
            </button>
          </div>

          <div className="autocare-garage-entries-list">
            {recentEntries.map((entry) => (
              <div key={entry._id || entry.id} className="autocare-garage-entry-item">
                <div className="autocare-garage-entry-left">
                  <span className="autocare-garage-entry-vehicle">
                    {entry.vehicleTitle} ({entry.regNumber})
                  </span>
                  <span className="autocare-garage-entry-details">
                    {entry.mileage} • {entry.serviceDescription}
                  </span>
                </div>

                <span
                  className={`autocare-garage-status-badge ${
                    entry.status === 'COMMITTED' ? 'is-committed' : 'is-pending'
                  }`}
                >
                  {entry.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Active AI OCR Queue */}
        <section className="autocare-garage-panel" aria-label="Active AI OCR Queue">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h2 className="autocare-garage-panel-title" style={{ margin: 0 }}>
              Active AI OCR Queue
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#0056a2',
                background: '#f0f9ff',
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              AI PROCESSING
            </span>
          </div>

          <div className="autocare-garage-ocr-card">
            <div className="autocare-garage-ocr-header">
              <span className="autocare-garage-ocr-scan-num">{MOCK_OCR_QUEUE.scanNumber}</span>
              <span className="autocare-garage-ocr-status">{MOCK_OCR_QUEUE.status}</span>
            </div>

            <div className="autocare-garage-ocr-vehicle">
              {MOCK_OCR_QUEUE.vehicleTitle} ({MOCK_OCR_QUEUE.regNumber})
            </div>

            {/* Simulated progress bar */}
            <div className="autocare-garage-ocr-progress-bar">
              <div
                className="autocare-garage-ocr-progress-fill"
                style={{ width: `${MOCK_OCR_QUEUE.progressPercent}%` }}
              />
            </div>

            <div className="autocare-garage-ocr-footer">
              <span className="autocare-garage-ocr-time">
                Time remaining: ~{MOCK_OCR_QUEUE.estimatedTimeRemaining}
              </span>
              <button
                type="button"
                className="autocare-garage-action-link"
                onClick={() => setShowOcrModal(true)}
              >
                Inspect scan details
              </button>
            </div>
          </div>

          {/* Warning Notice Box */}
          <div
            className="autocare-garage-warning-box"
            onClick={() => {
              showToast(
                'Telemetry Disparity: Physical odometer shows 98,700 km, digital ECU scan shows 98,712 km (within 0.1% tolerance).'
              );
            }}
            role="button"
            tabIndex={0}
            title="Click for validation error logs"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                showToast('Telemetry Disparity: Physical odometer inspection log opened.');
              }
            }}
          >
            <AlertTriangle size={18} className="autocare-garage-warning-icon" />
            <div>
              <div className="autocare-garage-warning-title">{MOCK_OCR_WARNING.title}</div>
              <div className="autocare-garage-warning-desc">{MOCK_OCR_WARNING.message}</div>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Section: Records Table Panel */}
      <section className="autocare-garage-records-panel" aria-label="Service Records Ledger">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
          }}
        >
          <h2 className="autocare-garage-records-title" style={{ margin: 0 }}>
            Recent Service Records
          </h2>
          <button
            type="button"
            className="autocare-garage-action-link"
            onClick={() => navigate('/garage/vehicles')}
          >
            Browse all vehicles →
          </button>
        </div>

        <table className="autocare-garage-records-table">
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '10px 10px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                VEHICLE
              </th>
              <th style={{ padding: '10px 10px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                CUSTOMER
              </th>
              <th style={{ padding: '10px 10px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                DATE
              </th>
              <th style={{ padding: '10px 10px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                STATUS
              </th>
              <th style={{ padding: '10px 10px', textAlign: 'right', fontSize: '12px', color: '#64748b' }}>
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {MOCK_GARAGE_RECORDS.map((rec) => (
              <tr key={rec.id}>
                <td className="autocare-garage-td-ref">{rec.vehicleRef}</td>
                <td className="autocare-garage-td-customer">{rec.customerName}</td>
                <td className="autocare-garage-td-date">{rec.date}</td>
                <td className={`autocare-garage-td-status is-${rec.statusColor}`}>
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
                    onClick={() => navigate(`/garage/maintenance/new?vehicleId=${rec.vehicleId}`)}
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

      {/* ====================================================================
          MODALS & TOASTS
          ==================================================================== */}
      {/* OCR Scan Inspection Modal */}
      {showOcrModal && (
        <div
          className="autocare-garage-modal-backdrop"
          onClick={() => setShowOcrModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="autocare-garage-modal" onClick={(e) => e.stopPropagation()}>
            <div className="autocare-garage-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} />
                <h3>AI Invoice Scanner {MOCK_OCR_QUEUE.scanNumber}</h3>
              </div>
              <button
                type="button"
                className="autocare-garage-modal-close-btn"
                onClick={() => setShowOcrModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="autocare-garage-modal-body">
              <div
                style={{
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FileText size={18} style={{ color: '#0056a2' }} />
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                    {MOCK_OCR_QUEUE.vehicleTitle} ({MOCK_OCR_QUEUE.regNumber})
                  </strong>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Optical Recognition Confidence: <strong>{MOCK_OCR_QUEUE.progressPercent}%</strong>
                </p>
              </div>

              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Detected Invoice No.</span>
                <span className="autocare-garage-profile-spec-val">INV-8492-PAW</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Extracted Subtotal</span>
                <span className="autocare-garage-profile-spec-val">LKR 46,500.00</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Odometer Reading</span>
                <span className="autocare-garage-profile-spec-val">98,712 km</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Matched Parts</span>
                <span className="autocare-garage-profile-spec-val">Inverter Coolant (5L), Water Pump</span>
              </div>
            </div>

            <div className="autocare-garage-modal-footer">
              <button
                type="button"
                className="autocare-garage-btn-primary"
                onClick={() => {
                  setShowOcrModal(false);
                  showToast('Invoice fields successfully converted to ledger draft.');
                }}
              >
                Accept OCR Extracted Data
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
    </GarageLayout>
  );
};

export default GarageDashboardPage;
