import React, { useState, useMemo } from 'react';
import {
  Search,
  Bell,
  Plus,
  CheckCircle2,
  AlertCircle,
  Wrench,
  ShieldCheck,
  FileText,
  Clock,
  X
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import {
  MOCK_SERVICE_RECORDS,
  type ServiceRecordItem
} from './serviceData';
import '../../styles/services.css';

type ServiceTab = 'all' | 'verified' | 'self-reported';

export const ServiceHistoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ServiceTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    MOCK_SERVICE_RECORDS[0]?.id || ''
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tab counts
  const allCount = MOCK_SERVICE_RECORDS.length;
  const verifiedCount = useMemo(
    () => MOCK_SERVICE_RECORDS.filter((r) => r.type === 'verified').length,
    []
  );
  const selfReportedCount = useMemo(
    () => MOCK_SERVICE_RECORDS.filter((r) => r.type === 'self-reported').length,
    []
  );

  // Filtered records by tab and search query
  const filteredRecords = useMemo(() => {
    return MOCK_SERVICE_RECORDS.filter((record) => {
      // Tab filter
      if (activeTab === 'verified' && record.type !== 'verified') return false;
      if (activeTab === 'self-reported' && record.type !== 'self-reported') return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = record.title.toLowerCase().includes(query);
        const matchesGarage = record.garage.name.toLowerCase().includes(query);
        const matchesTechnician = record.garage.technician.toLowerCase().includes(query);
        const matchesInvoice = record.invoice.number.toLowerCase().includes(query);
        const matchesLedger = record.ledgerId.toLowerCase().includes(query);
        const matchesMileage = record.mileage.toLowerCase().includes(query);
        return (
          matchesTitle ||
          matchesGarage ||
          matchesTechnician ||
          matchesInvoice ||
          matchesLedger ||
          matchesMileage
        );
      }

      return true;
    });
  }, [activeTab, searchQuery]);

  // Selected Record resolution
  const selectedRecord: ServiceRecordItem | undefined = useMemo(() => {
    const found = filteredRecords.find((r) => r.id === selectedRecordId);
    return found || filteredRecords[0];
  }, [filteredRecords, selectedRecordId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const handleTabChange = (tab: ServiceTab) => {
    setActiveTab(tab);
    // Auto-select first item in that tab if available
    const nextFiltered = MOCK_SERVICE_RECORDS.filter((r) => {
      if (tab === 'verified') return r.type === 'verified';
      if (tab === 'self-reported') return r.type === 'self-reported';
      return true;
    });
    if (nextFiltered.length > 0) {
      setSelectedRecordId(nextFiltered[0].id);
    }
  };

  const formatCost = (val: number, cur: string) => {
    return `${cur} ${val.toFixed(2)}`;
  };

  return (
    <div className="autocare-services-page">
      <Navbar />

      <main className="autocare-services-main">
        <div className="autocare-services-container">
          {/* Top Header Row (Title + Toolbar) */}
          <div className="autocare-services-header-row">
            <h1 className="autocare-services-title">
              Maintenance &amp; Service Records History
            </h1>

            <div className="autocare-services-toolbar">
              {/* Search Field */}
              <div className="autocare-services-search-box">
                <Search size={18} className="autocare-services-search-icon" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search VINs, service records..."
                  className="autocare-services-search-input"
                  aria-label="Search service records"
                />
              </div>

              {/* Notification Bell */}
              <button
                type="button"
                className="autocare-services-bell-btn"
                onClick={() => showToast('No new service telemetry notifications.')}
                aria-label="Service notifications"
                title="Notifications"
              >
                <Bell size={18} />
              </button>

              {/* Security / Status Badge */}
              <div className="autocare-services-security-badge" role="status">
                <span className="autocare-services-security-dot" />
                <span>AutoCare Blockchain Secured</span>
              </div>
            </div>
          </div>

          <hr className="autocare-services-divider" />

          {/* Controls Bar (Filter Tabs + Add Manual Record Button) */}
          <div className="autocare-services-controls-bar">
            {/* Filter Tabs */}
            <div className="autocare-services-tabs" role="tablist" aria-label="Service Record Categories">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'all'}
                className={`autocare-services-tab-btn ${activeTab === 'all' ? 'is-active' : ''}`}
                onClick={() => handleTabChange('all')}
              >
                All Logs ({allCount})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'verified'}
                className={`autocare-services-tab-btn ${activeTab === 'verified' ? 'is-active' : ''}`}
                onClick={() => handleTabChange('verified')}
              >
                Verified Garages ({verifiedCount})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'self-reported'}
                className={`autocare-services-tab-btn ${activeTab === 'self-reported' ? 'is-active' : ''}`}
                onClick={() => handleTabChange('self-reported')}
              >
                Self-Reported ({selfReportedCount})
              </button>
            </div>

            {/* Add Manual Record Button */}
            <button
              type="button"
              className="autocare-btn-add-manual"
              onClick={() =>
                showToast(
                  'Backend integration pending: Manual service entry creation by vehicle owners will be connected to the API in the next phase.'
                )
              }
            >
              <Plus size={16} />
              <span>Add Manual Record</span>
            </button>
          </div>

          {/* Main Two-Column Grid */}
          <div className="autocare-services-grid">
            {/* Left Column: Service Records Stack */}
            <section
              className="autocare-services-list"
              aria-label="Service Records List"
            >
              {filteredRecords.length === 0 ? (
                <div className="autocare-services-empty">
                  <p style={{ fontWeight: 600, margin: '0 0 6px 0', color: '#0f172a' }}>
                    No matching service logs
                  </p>
                  <p style={{ fontSize: '13px', margin: 0 }}>
                    Try clearing the search query or changing the filter tab.
                  </p>
                </div>
              ) : (
                filteredRecords.map((record) => {
                  const isSelected = selectedRecord?.id === record.id;
                  return (
                    <button
                      key={record.id}
                      type="button"
                      className={`autocare-service-card ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setSelectedRecordId(record.id)}
                      aria-pressed={isSelected}
                    >
                      <div className="autocare-service-card-top">
                        <h3 className="autocare-service-card-title">{record.title}</h3>
                        <span className="autocare-service-card-cost">
                          {formatCost(record.cost, record.currency)}
                        </span>
                      </div>

                      <div className="autocare-service-card-bottom">
                        <span className="autocare-service-card-meta">
                          {record.date} • {record.mileage}
                        </span>

                        {record.isVerified ? (
                          <span className="autocare-service-pill-verified">
                            <CheckCircle2 size={12} />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="autocare-service-pill-self">
                            <AlertCircle size={12} />
                            <span>Self-Reported</span>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </section>

            {/* Right Column: Service Detail Panel */}
            <section
              className="autocare-service-detail-panel"
              aria-label="Selected Service Record Details"
            >
              {selectedRecord ? (
                <>
                  {/* Detail Panel Header */}
                  <div className="autocare-detail-header">
                    <div className="autocare-detail-title-group">
                      <h2 className="autocare-detail-title">
                        {selectedRecord.title} Record
                      </h2>
                      <p className="autocare-detail-ledger-id">
                        Service Ledger ID: {selectedRecord.ledgerId}
                      </p>
                    </div>

                    {selectedRecord.isVerified ? (
                      <span className="autocare-badge-certified">
                        <CheckCircle2 size={14} />
                        <span>Cryptographically Certified</span>
                      </span>
                    ) : (
                      <span className="autocare-badge-self-detail">
                        <AlertCircle size={14} />
                        <span>Self-Reported Entry</span>
                      </span>
                    )}
                  </div>

                  <hr className="autocare-detail-divider" />

                  {/* Garage / Technician Information */}
                  <div className="autocare-garage-info-row">
                    <div className="autocare-garage-avatar" aria-hidden="true">
                      <Wrench size={22} />
                    </div>
                    <div className="autocare-garage-text">
                      <h4 className="autocare-garage-name">
                        {selectedRecord.garage.name}
                      </h4>
                      <p className="autocare-garage-sub">
                        Certified Garage Partner {selectedRecord.garage.partnerId} •
                        Technician: {selectedRecord.garage.technician}
                      </p>
                    </div>
                  </div>

                  {/* Work Performed & Parts Swapped Section */}
                  <div className="autocare-work-section">
                    <h5 className="autocare-section-eyebrow">
                      WORK PERFORMED &amp; PARTS SWAPPED
                    </h5>

                    <div className="autocare-work-items-box">
                      {selectedRecord.workPerformed.map((item, idx) => (
                        <div key={idx} className="autocare-work-item-row">
                          <p className="autocare-work-task">{item.task}</p>
                          <p className="autocare-work-cert">{item.certification}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Billing & Payment Status Section */}
                  <div className="autocare-billing-section">
                    <h5 className="autocare-section-eyebrow">
                      BILLING &amp; PAYMENT STATUS
                    </h5>

                    <div className="autocare-billing-row">
                      <div className="autocare-billing-amount-group">
                        <div className="autocare-billing-amount">
                          {formatCost(selectedRecord.cost, selectedRecord.currency)}
                          <span className="autocare-billing-total-label">Total</span>
                        </div>
                        <p className="autocare-billing-meta">
                          Invoice #{selectedRecord.invoice.number} •{' '}
                          {selectedRecord.invoice.paymentMethod}
                        </p>
                      </div>

                      {/* Invoice Document Card */}
                      <button
                        type="button"
                        className="autocare-invoice-card"
                        onClick={() =>
                          showToast(
                            `Opening certified invoice document (${selectedRecord.invoice.fileName})...`
                          )
                        }
                        title={`Download or View ${selectedRecord.invoice.fileName}`}
                      >
                        <div className="autocare-invoice-icon-box" aria-hidden="true">
                          {selectedRecord.isVerified ? (
                            <ShieldCheck size={20} />
                          ) : (
                            <FileText size={20} />
                          )}
                        </div>
                        <div className="autocare-invoice-info">
                          <span className="autocare-invoice-name">
                            {selectedRecord.invoice.fileName}
                          </span>
                          <span className="autocare-invoice-sub">
                            {selectedRecord.invoice.fileType} ({selectedRecord.invoice.fileSize})
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                  <p>Please select a service record to view full details.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Interactive Toast Notification Banner */}
      {toastMessage && (
        <div className="autocare-services-toast" role="status">
          <Clock size={18} className="autocare-services-toast-icon" />
          <span>{toastMessage}</span>
          <button
            type="button"
            className="autocare-services-toast-close"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss toast"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ServiceHistoryPage;
