import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Plus,
  X,
  FileText,
  Sparkles,
} from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import {
  MOCK_GARAGE_KPIS,
  MOCK_RECENT_ENTRIES,
  MOCK_OCR_QUEUE,
  MOCK_OCR_WARNING,
  MOCK_GARAGE_RECORDS,
  type GarageRecordItem,
} from './garageData';
import '../../styles/garage-dashboard.css';



export const GarageDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  

  // OCR details modal state
  const [showOcrModal, setShowOcrModal] = useState<boolean>(false);

  

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
          onClick={() => navigate('/garage/profile')}
          title="View verified accreditation profile and certificate"
        >
          Accreditation details
        </button>
      </section>

      {/* Main Dashboard Title Row */}
      <div className="autocare-garage-title-row">
        <div>
          <h1 className="autocare-garage-main-title">Garage Service Management</h1>
          <p className="autocare-garage-main-subtitle">
            Garage Service &amp; Workshop Management Portal and diagnostic inspection console.
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
        {MOCK_GARAGE_KPIS.map((kpi) => (
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
            {MOCK_RECENT_ENTRIES.map((entry) => {
              const targetVehId = entry.regNumber.includes('ABC-1234')
                ? 'veh-1'
                : entry.regNumber.includes('CAS-9988')
                ? 'veh-2'
                : 'veh-3';
              return (
                <div
                  key={entry.id}
                  className="autocare-garage-entry-item"
                  onClick={() => navigate(`/garage/vehicles/${targetVehId}`)}
                  style={{ cursor: 'pointer' }}
                  title={`View vehicle passport for ${entry.vehicleTitle} (${entry.regNumber})`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`/garage/vehicles/${targetVehId}`);
                    }
                  }}
                >
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
              );
            })}
          </div>
        </section>

        {/* Right Column: Active AI OCR Queue */}
        <section className="autocare-garage-panel" aria-label="Active OCR Queue">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h2 className="autocare-garage-panel-title" style={{ margin: 0 }}>
              Active OCR Queue (Demo)
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#0284c7',
                background: '#e0f2fe',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              1 SCANNING
            </span>
          </div>

          {/* In-progress OCR item */}
          <div
            className="autocare-garage-ocr-box"
            onClick={() => setShowOcrModal(true)}
            role="button"
            tabIndex={0}
            title="Click to inspect OCR scanning breakdown"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setShowOcrModal(true);
            }}
          >
            <div className="autocare-garage-ocr-dot" aria-hidden="true" />
            <div style={{ flex: 1 }}>
              <div className="autocare-garage-ocr-scan">
                Invoice Scan {MOCK_OCR_QUEUE.scanNumber}
              </div>
              <div className="autocare-garage-ocr-vehicle">
                {MOCK_OCR_QUEUE.vehicleTitle} ({MOCK_OCR_QUEUE.regNumber}) - Processing{' '}
                {MOCK_OCR_QUEUE.progressPercent}%
              </div>
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  background: '#e2e8f0',
                  borderRadius: '2px',
                  marginTop: '8px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${MOCK_OCR_QUEUE.progressPercent}%`,
                    height: '100%',
                    background: '#0284c7',
                    borderRadius: '2px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Warning Notice Box */}
          <div
            className="autocare-garage-warning-box"
            onClick={() => navigate('/garage/vehicles/veh-4')}
            role="button"
            tabIndex={0}
            title="Click to view telemetry disparity on Toyota Prius (WP CAR-8282)"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate('/garage/vehicles/veh-4');
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <AlertTriangle size={18} className="autocare-garage-warning-icon" />
            <div>
              <div className="autocare-garage-warning-title">{MOCK_OCR_WARNING.title}</div>
              <div className="autocare-garage-warning-desc">
                {MOCK_OCR_WARNING.message} Click to open WP CAR-8282 passport.
              </div>
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

        <div className="autocare-garage-table-responsive">
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
        </div>
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
                  navigate('/garage/maintenance/new?vehicleId=veh-4', {
                    state: {
                      ocrExtracted: true,
                      workPerformed:
                        'Full synthetic periodic lube service, replacement of engine oil & filter, brake caliper inspection, hybrid fan cleaning.',
                      partsList: [
                        'Mobil 1 0W-20 Advanced Fuel Economy (4L)',
                        'Toyota Genuine Oil Filter 04152-YZZA6',
                        'Cabin Micro-Air Filter',
                      ],
                      labourCost: '9500',
                      partsCost: '18500',
                    },
                  });
                }}
              >
                Accept OCR &amp; Create Maintenance Record
              </button>
            </div>
          </div>
        </div>
      )}

      
    </GarageLayout>
  );
};

export default GarageDashboardPage;
