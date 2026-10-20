import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
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
  X,
  Loader2,
  RotateCw,
  ArrowLeft
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import {
  type ServiceRecordItem,
  type ServicePartWorkItem
} from './serviceData';
import {
  getVehicleServiceRecords,
  type BackendServiceRecord
} from '../../services/serviceService';
import {
  getMyVehicles,
  type Vehicle
} from '../../services/vehicleService';
import '../../styles/services.css';

type ServiceTab = 'all' | 'verified' | 'self-reported';

interface LocationState {
  vehicleId?: string;
  vehicle?: Vehicle;
}

/**
 * Transforms Backend ServiceRecord model document into UI ServiceRecordItem structure
 */
const mapBackendRecordToItem = (record: BackendServiceRecord): ServiceRecordItem => {
  const isVerified =
    record.recordSource === 'verified_garage' && record.verificationStatus === 'verified';

  // Format work items and replaced components
  const workItems: ServicePartWorkItem[] = [];
  if (record.workPerformed) {
    workItems.push({
      task: record.workPerformed,
      certification: isVerified ? 'Certified Workshop Protocol' : 'Self-Reported Entry',
    });
  }

  if (Array.isArray(record.partsReplaced) && record.partsReplaced.length > 0) {
    record.partsReplaced.forEach((part) => {
      workItems.push({
        task: `Replaced: ${part}`,
        certification: isVerified ? 'OEM Specified Part' : 'Owner Recorded Item',
      });
    });
  }

  if (workItems.length === 0) {
    workItems.push({
      task: record.serviceType,
      certification: isVerified ? 'Verified Service' : 'Self-Reported Entry',
    });
  }

  // Format date safely
  let formattedDate = record.serviceDate;
  try {
    const d = new Date(record.serviceDate);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
    }
  } catch {
    // Keep raw string fallback
  }

  const invoiceNumber = `INV-${record._id.slice(-6).toUpperCase()}`;
  const totalCost = record.totalCost ?? (record.labourCost || 0) + (record.partsCost || 0);

  return {
    id: record._id,
    title: record.serviceType,
    cost: totalCost,
    currency: 'LKR',
    date: formattedDate,
    mileage: `${record.mileage.toLocaleString()} km`,
    isVerified,
    type: isVerified ? 'verified' : 'self-reported',
    ledgerId: `0x${record._id.slice(0, 10)} ... ${record._id.slice(-6)}`,
    garage: {
      name: record.garageName || (isVerified ? 'Certified Partner Garage' : 'Owner Self-Reported'),
      partnerId: isVerified
        ? `#GAR-${(record.garageId || record._id).slice(-4).toUpperCase()}`
        : 'Self-Reported Entry',
      technician: record.technicianName || (isVerified ? 'Certified Technician' : 'Vehicle Owner'),
    },
    workPerformed: workItems,
    invoice: {
      number: invoiceNumber,
      paymentMethod: isVerified ? 'Electronic Settlement' : 'Owner Maintenance Routine',
      fileName: record.invoiceUrl
        ? record.invoiceUrl.split('/').pop() || 'certified-invoice.pdf'
        : isVerified
        ? 'certified-invoice.pdf'
        : 'service-log-entry.pdf',
      fileSize: 'Digital Record',
      fileType: isVerified ? 'Cryptographic PDF' : 'Owner Log Entry',
    },
  };
};

export const ServiceHistoryPage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const locationState = (location.state as LocationState) || {};

  // State
  const [activeTab, setActiveTab] = useState<ServiceTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [records, setRecords] = useState<ServiceRecordItem[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Async data & vehicle states
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  /**
   * Helper to load service records for a target vehicle
   */
  const fetchRecords = useCallback(
    async (vehicleToLoad: Vehicle) => {
      try {
        const backendRecords = await getVehicleServiceRecords(vehicleToLoad._id);
        const mapped = backendRecords.map(mapBackendRecordToItem);
        setRecords(mapped);
        if (mapped.length > 0) {
          setSelectedRecordId(mapped[0].id);
        } else {
          setSelectedRecordId('');
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Failed to retrieve service records. Please check your connection and try again.';
        setApiError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Manual refresh handler triggered by user action
   */
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setApiError(null);

    const targetVehicleId = locationState.vehicleId || searchParams.get('vehicleId');
    const targetVehicle = locationState.vehicle || currentVehicle;

    if (!targetVehicle && !targetVehicleId) {
      getMyVehicles()
        .then((vehicles) => {
          if (vehicles.length > 0) {
            setCurrentVehicle(vehicles[0]);
            fetchRecords(vehicles[0]);
          } else {
            setIsLoading(false);
          }
        })
        .catch((err: unknown) => {
          setApiError(err instanceof Error ? err.message : 'Failed to retrieve vehicles.');
          setIsLoading(false);
        });
      return;
    }

    if (targetVehicle) {
      fetchRecords(targetVehicle);
    } else if (targetVehicleId) {
      getMyVehicles()
        .then((vehicles) => {
          const match = vehicles.find((v) => v._id === targetVehicleId) || vehicles[0];
          if (match) {
            setCurrentVehicle(match);
            fetchRecords(match);
          } else {
            setIsLoading(false);
          }
        })
        .catch((err: unknown) => {
          setApiError(err instanceof Error ? err.message : 'Failed to retrieve vehicles.');
          setIsLoading(false);
        });
    }
  }, [currentVehicle, fetchRecords, locationState.vehicle, locationState.vehicleId, searchParams]);

  /**
   * Initial data synchronization on page mount
   */
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        let targetVehicleId = locationState.vehicleId || searchParams.get('vehicleId');
        let targetVehicle = locationState.vehicle || null;

        if (!targetVehicleId || !targetVehicle) {
          const vehicles = await getMyVehicles();
          if (vehicles.length > 0) {
            if (targetVehicleId) {
              targetVehicle = vehicles.find((v) => v._id === targetVehicleId) || vehicles[0];
            } else {
              targetVehicle = vehicles[0];
            }
            targetVehicleId = targetVehicle._id;
          }
        }

        if (!isMounted) return;

        if (!targetVehicleId || !targetVehicle) {
          setCurrentVehicle(null);
          setRecords([]);
          setIsLoading(false);
          return;
        }

        setCurrentVehicle(targetVehicle);

        const backendRecords = await getVehicleServiceRecords(targetVehicleId);
        if (!isMounted) return;

        const mapped = backendRecords.map(mapBackendRecordToItem);
        setRecords(mapped);
        if (mapped.length > 0) {
          setSelectedRecordId(mapped[0].id);
        } else {
          setSelectedRecordId('');
        }
        setIsLoading(false);
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg =
          err instanceof Error
            ? err.message
            : 'Failed to retrieve service records. Please check your connection and try again.';
        setApiError(msg);
        setIsLoading(false);
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [locationState.vehicle, locationState.vehicleId, searchParams]);

  // Tab counts
  const allCount = records.length;
  const verifiedCount = useMemo(
    () => records.filter((r) => r.type === 'verified').length,
    [records]
  );
  const selfReportedCount = useMemo(
    () => records.filter((r) => r.type === 'self-reported').length,
    [records]
  );

  // Filtered records by tab and search query
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
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
  }, [records, activeTab, searchQuery]);

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
    const nextFiltered = records.filter((r) => {
      if (tab === 'verified') return r.type === 'verified';
      if (tab === 'self-reported') return r.type === 'self-reported';
      return true;
    });
    if (nextFiltered.length > 0) {
      setSelectedRecordId(nextFiltered[0].id);
    }
  };

  const formatCost = (val: number, cur: string) => {
    return `${cur} ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="autocare-services-page">
      <Navbar />

      <main className="autocare-services-main">
        <div className="autocare-services-container">
          {/* Back Navigation */}
          <div style={{ marginBottom: '14px' }}>
            <Link
              to={currentVehicle ? `/vehicles/${currentVehicle._id}` : '/vehicles'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                border: 'none',
                color: '#0056A2',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <ArrowLeft size={16} />
              <span>{currentVehicle ? 'Back to vehicle details' : 'Back to My Vehicles'}</span>
            </Link>
          </div>

          {/* Top Header Row (Title + Vehicle Identity + Toolbar) */}
          <div className="autocare-services-header-row">
            <div>
              <h1 className="autocare-services-title">
                Maintenance &amp; Service Records History
              </h1>
              {currentVehicle && (
                <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#64748b' }}>
                  Vehicle:{' '}
                  <strong style={{ color: '#0f172a' }}>
                    {currentVehicle.manufacturer} {currentVehicle.model} ({currentVehicle.manufacturingYear})
                  </strong>{' '}
                  • Plate:{' '}
                  <span style={{ fontWeight: 600, color: '#0056a2' }}>
                    {currentVehicle.registrationNumber}
                  </span>
                </p>
              )}
            </div>

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
                  disabled={isLoading}
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

              {/* Refresh Records Button */}
              <button
                type="button"
                className="autocare-services-bell-btn"
                onClick={handleRefresh}
                aria-label="Refresh service records"
                title="Refresh records"
                disabled={isLoading}
              >
                <RotateCw size={17} className={isLoading ? 'animate-spin' : ''} />
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
                  'Backend service APIs are active! Modal form integration for adding service records is scheduled in the upcoming sprint.'
                )
              }
            >
              <Plus size={16} />
              <span>Add Manual Record</span>
            </button>
          </div>

          {/* API Error State Banner */}
          {apiError && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '20px 24px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
              }}
              role="alert"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertCircle size={22} style={{ color: '#ef4444', flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14.5px', fontWeight: 700, color: '#991b1b' }}>
                    Unable to Load Service Records
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#b91c1c' }}>{apiError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                style={{
                  backgroundColor: '#0056a2',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Main Two-Column Grid */}
          <div className="autocare-services-grid">
            {/* Left Column: Service Records Stack */}
            <section className="autocare-services-list" aria-label="Service Records List">
              {isLoading ? (
                /* Loading State */
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '48px 24px',
                    textAlign: 'center',
                    color: '#64748b',
                  }}
                >
                  <Loader2
                    size={28}
                    style={{
                      animation: 'spin 1s linear infinite',
                      color: '#0056a2',
                      margin: '0 auto 12px auto',
                      display: 'block',
                    }}
                  />
                  <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>
                    Connecting to AutoCare Ledger...
                  </p>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                    Retrieving certified service history from database.
                  </p>
                </div>
              ) : !currentVehicle ? (
                /* No Vehicle Registered State */
                <div className="autocare-services-empty" style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Wrench size={32} style={{ color: '#94a3b8', margin: '0 auto 10px auto' }} />
                  <p style={{ fontWeight: 600, margin: '0 0 6px 0', color: '#0f172a' }}>
                    No Vehicle Registered
                  </p>
                  <p style={{ fontSize: '13px', margin: 0, color: '#64748b' }}>
                    Please add a vehicle to view its maintenance passport.
                  </p>
                </div>
              ) : filteredRecords.length === 0 ? (
                /* Empty Records State */
                <div className="autocare-services-empty" style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Wrench size={32} style={{ color: '#94a3b8', margin: '0 auto 10px auto' }} />
                  <p style={{ fontWeight: 600, margin: '0 0 6px 0', color: '#0f172a' }}>
                    {records.length === 0 ? 'No Service Records Found' : 'No Matching Records'}
                  </p>
                  <p style={{ fontSize: '13px', margin: 0, color: '#64748b' }}>
                    {records.length === 0
                      ? 'No maintenance history has been logged for this vehicle yet.'
                      : 'Try clearing your search query or switching tabs.'}
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
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '80px 24px', color: '#64748b' }}>
                  <Loader2
                    size={28}
                    style={{
                      animation: 'spin 1s linear infinite',
                      color: '#0056a2',
                      margin: '0 auto 12px auto',
                      display: 'block',
                    }}
                  />
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    Loading record details...
                  </p>
                </div>
              ) : selectedRecord ? (
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
                        {selectedRecord.isVerified
                          ? `Certified Garage Partner ${selectedRecord.garage.partnerId} • `
                          : `${selectedRecord.garage.partnerId} • `}
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
                  <Wrench size={32} style={{ color: '#94a3b8', margin: '0 auto 12px auto' }} />
                  <p style={{ fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0' }}>
                    No Record Selected
                  </p>
                  <p style={{ fontSize: '13px', margin: 0 }}>
                    Please select a service record to view full details.
                  </p>
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
