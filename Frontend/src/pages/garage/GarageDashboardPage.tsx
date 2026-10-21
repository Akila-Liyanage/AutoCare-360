import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  FileText,
  Plus,
  Sparkles,
  X,
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

export const GarageDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // ============================================================
  // OCR MODAL
  // ============================================================

  const [showOcrModal, setShowOcrModal] =
    useState<boolean>(false);

  // ============================================================
  // DASHBOARD DATA
  // Real backend data with mock fallback
  // ============================================================

  const [kpis, setKpis] =
    useState<GarageKPI[]>(MOCK_GARAGE_KPIS);

  const [recentEntries, setRecentEntries] =
    useState<RecentVerifiedEntry[]>(
      MOCK_RECENT_ENTRIES
    );

  const [loadingDashboard, setLoadingDashboard] =
    useState<boolean>(true);

  // ============================================================
  // LOAD REAL GARAGE DASHBOARD DATA
  // ============================================================

  useEffect(() => {
    let isMounted = true;

    const fetchGarageStats = async () => {
      try {
        const response =
          await api.get(
            '/garage/dashboard-stats'
          );

        const data =
          response.data?.data;

        if (!isMounted || !data) {
          return;
        }

        if (
          Array.isArray(data.kpis) &&
          data.kpis.length > 0
        ) {
          setKpis(data.kpis);
        }

        if (
          Array.isArray(
            data.recentEntries
          ) &&
          data.recentEntries.length > 0
        ) {
          setRecentEntries(
            data.recentEntries
          );
        }
      } catch (error) {
        // Dashboard remains usable with the
        // existing mock/demo data when the API
        // is unavailable.
        console.warn(
          'Garage dashboard API unavailable. Using fallback data.',
          error
        );
      } finally {
        if (isMounted) {
          setLoadingDashboard(false);
        }
      }
    };

    fetchGarageStats();

    return () => {
      isMounted = false;
    };
  }, []);

  // ============================================================
  // VEHICLE NAVIGATION HELPERS
  // ============================================================

  const handleViewPassport = (
    record: GarageRecordItem
  ) => {
    navigate(
      `/garage/vehicles/${record.vehicleId}`
    );
  };

  const getVehicleIdFromRecentEntry = (
    entry: RecentVerifiedEntry
  ) => {
    /*
     * Real API entries may provide vehicleId.
     * The fallback demo records use registration
     * numbers, so keep the old mapping for them.
     */

    const entryWithVehicleId =
      entry as RecentVerifiedEntry & {
        vehicleId?: string;
        _id?: string;
      };

    if (
      entryWithVehicleId.vehicleId
    ) {
      return entryWithVehicleId.vehicleId;
    }

    if (
      entry.regNumber.includes(
        'ABC-1234'
      )
    ) {
      return 'veh-1';
    }

    if (
      entry.regNumber.includes(
        'CAS-9988'
      )
    ) {
      return 'veh-2';
    }

    return 'veh-3';
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <GarageLayout
      activeItem="Overview"
      breadcrumbCurrent="Overview"
    >
      {/* ========================================================
          BUSINESS VERIFICATION HERO
          ======================================================== */}

      <section
        className="autocare-garage-hero-card"
        aria-label="Garage Verification Status"
      >
        <div>
          <p className="autocare-garage-hero-sub">
            Business verification
          </p>

          <span className="autocare-garage-hero-verified-badge">
            VERIFIED BUSINESS
          </span>

          <h2 className="autocare-garage-hero-title">
            Perera Auto Works
          </h2>

          <p className="autocare-garage-hero-desc">
            BR-03 · Verified through 31 Dec
            2026 · Colombo 05
          </p>
        </div>

        <button
          type="button"
          className="autocare-garage-hero-btn"
          onClick={() =>
            navigate('/garage/profile')
          }
          title="View verified accreditation profile and certificate"
        >
          Accreditation details
        </button>
      </section>

      {/* ========================================================
          DASHBOARD TITLE
          ======================================================== */}

      <div className="autocare-garage-title-row">
        <div>
          <h1 className="autocare-garage-main-title">
            Garage Service Management
          </h1>

          <p className="autocare-garage-main-subtitle">
            Garage Service &amp; Workshop
            Management Portal and diagnostic
            inspection console.
          </p>

          {loadingDashboard && (
            <span
              style={{
                fontSize: '12px',
                color: '#64748b',
              }}
            >
              Refreshing garage statistics...
            </span>
          )}
        </div>

        <button
          type="button"
          className="autocare-garage-btn-primary"
          onClick={() =>
            navigate(
              '/garage/maintenance/new'
            )
          }
        >
          <Plus size={16} />

          <span>
            Add Service Entry
          </span>
        </button>
      </div>

      {/* ========================================================
          KPI CARDS
          ======================================================== */}

      <section
        className="autocare-garage-kpis-grid"
        aria-label="Garage Key Metrics"
      >
        {kpis.map((kpi) => (
          <div
            key={kpi.id}
            className="autocare-garage-kpi-card"
          >
            <div className="autocare-garage-kpi-label">
              {kpi.label}
            </div>

            <div
              className={`autocare-garage-kpi-val ${
                kpi.value.startsWith(
                  'Rs'
                )
                  ? 'is-currency'
                  : ''
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

      {/* ========================================================
          MIDDLE SECTION
          Recent entries + OCR queue
          ======================================================== */}

      <div className="autocare-garage-middle-grid">
        {/* ======================================================
            RECENT VERIFIED ENTRIES
            ====================================================== */}

        <section
          className="autocare-garage-panel"
          aria-label="Recent Verified Entries"
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              marginBottom: '18px',
            }}
          >
            <h2
              className="autocare-garage-panel-title"
              style={{
                margin: 0,
              }}
            >
              Recent Verified Entries
            </h2>

            <button
              type="button"
              className="autocare-garage-action-link"
              onClick={() =>
                navigate(
                  '/garage/service-records'
                )
              }
              style={{
                fontSize: '12.5px',
              }}
            >
              View all
            </button>
          </div>

          <div className="autocare-garage-entries-list">
            {recentEntries.length === 0 ? (
              <p
                style={{
                  color: '#64748b',
                  fontSize: '13px',
                  margin: 0,
                }}
              >
                No recent service entries.
              </p>
            ) : (
              recentEntries.map(
                (entry) => {
                  const vehicleId =
                    getVehicleIdFromRecentEntry(
                      entry
                    );

                  const entryKey =
                    (
                      entry as RecentVerifiedEntry & {
                        _id?: string;
                      }
                    )._id ||
                    entry.id;

                  return (
                    <div
                      key={entryKey}
                      className="autocare-garage-entry-item"
                      onClick={() =>
                        navigate(
                          `/garage/vehicles/${vehicleId}`
                        )
                      }
                      style={{
                        cursor:
                          'pointer',
                      }}
                      title={`View vehicle passport for ${entry.vehicleTitle} (${entry.regNumber})`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(
                        event
                      ) => {
                        if (
                          event.key ===
                            'Enter' ||
                          event.key === ' '
                        ) {
                          navigate(
                            `/garage/vehicles/${vehicleId}`
                          );
                        }
                      }}
                    >
                      <div className="autocare-garage-entry-left">
                        <span className="autocare-garage-entry-vehicle">
                          {
                            entry.vehicleTitle
                          }{' '}
                          (
                          {
                            entry.regNumber
                          }
                          )
                        </span>

                        <span className="autocare-garage-entry-details">
                          {
                            entry.mileage
                          }{' '}
                          •{' '}
                          {
                            entry.serviceDescription
                          }
                        </span>
                      </div>

                      <span
                        className={`autocare-garage-status-badge ${
                          entry.status ===
                          'COMMITTED'
                            ? 'is-committed'
                            : 'is-pending'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </div>
                  );
                }
              )
            )}
          </div>
        </section>

        {/* ======================================================
            OCR QUEUE
            ====================================================== */}

        <section
          className="autocare-garage-panel"
          aria-label="Active OCR Queue"
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              marginBottom: '18px',
            }}
          >
            <h2
              className="autocare-garage-panel-title"
              style={{
                margin: 0,
              }}
            >
              Active OCR Queue (Demo)
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
              <span className="autocare-garage-ocr-scan-num">
                {
                  MOCK_OCR_QUEUE.scanNumber
                }
              </span>

              <span className="autocare-garage-ocr-status">
                {
                  MOCK_OCR_QUEUE.status
                }
              </span>
            </div>

            <div className="autocare-garage-ocr-vehicle">
              {
                MOCK_OCR_QUEUE.vehicleTitle
              }{' '}
              (
              {
                MOCK_OCR_QUEUE.regNumber
              }
              )
            </div>

            <div className="autocare-garage-ocr-progress-bar">
              <div
                className="autocare-garage-ocr-progress-fill"
                style={{
                  width: `${MOCK_OCR_QUEUE.progressPercent}%`,
                }}
              />
            </div>

            <div className="autocare-garage-ocr-footer">
              <span className="autocare-garage-ocr-time">
                Time remaining: ~
                {
                  MOCK_OCR_QUEUE.estimatedTimeRemaining
                }
              </span>

              <button
                type="button"
                className="autocare-garage-action-link"
                onClick={() =>
                  setShowOcrModal(
                    true
                  )
                }
              >
                Inspect scan details
              </button>
            </div>
          </div>

          {/* Warning */}

          <div
            className="autocare-garage-warning-box"
            onClick={() =>
              navigate(
                '/garage/vehicles/veh-4'
              )
            }
            role="button"
            tabIndex={0}
            title="Click to view telemetry disparity on Toyota Prius (WP CAR-8282)"
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' ||
                event.key === ' '
              ) {
                navigate(
                  '/garage/vehicles/veh-4'
                );
              }
            }}
            style={{
              cursor: 'pointer',
            }}
          >
            <AlertTriangle
              size={18}
              className="autocare-garage-warning-icon"
            />

            <div>
              <div className="autocare-garage-warning-title">
                {
                  MOCK_OCR_WARNING.title
                }
              </div>

              <div className="autocare-garage-warning-desc">
                {
                  MOCK_OCR_WARNING.message
                }{' '}
                Click to open WP
                CAR-8282 passport.
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ========================================================
          SERVICE RECORDS
          ======================================================== */}

      <section
        className="autocare-garage-records-panel"
        aria-label="Service Records Ledger"
      >
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            marginBottom: '18px',
          }}
        >
          <h2
            className="autocare-garage-records-title"
            style={{
              margin: 0,
            }}
          >
            Recent Service Records
          </h2>

          <button
            type="button"
            className="autocare-garage-action-link"
            onClick={() =>
              navigate(
                '/garage/vehicles'
              )
            }
          >
            Browse all vehicles →
          </button>
        </div>

        <div className="autocare-garage-table-responsive">
          <table className="autocare-garage-records-table">
            <thead>
              <tr
                style={{
                  background:
                    '#f8fafc',
                  borderBottom:
                    '1px solid #e2e8f0',
                }}
              >
                <th
                  style={{
                    padding:
                      '10px 10px',
                    textAlign:
                      'left',
                    fontSize:
                      '12px',
                    color:
                      '#64748b',
                  }}
                >
                  VEHICLE
                </th>

                <th
                  style={{
                    padding:
                      '10px 10px',
                    textAlign:
                      'left',
                    fontSize:
                      '12px',
                    color:
                      '#64748b',
                  }}
                >
                  CUSTOMER
                </th>

                <th
                  style={{
                    padding:
                      '10px 10px',
                    textAlign:
                      'left',
                    fontSize:
                      '12px',
                    color:
                      '#64748b',
                  }}
                >
                  DATE
                </th>

                <th
                  style={{
                    padding:
                      '10px 10px',
                    textAlign:
                      'left',
                    fontSize:
                      '12px',
                    color:
                      '#64748b',
                  }}
                >
                  STATUS
                </th>

                <th
                  style={{
                    padding:
                      '10px 10px',
                    textAlign:
                      'right',
                    fontSize:
                      '12px',
                    color:
                      '#64748b',
                  }}
                >
                  ACTIONS
                </th>
              </tr>
            </thead>

            <tbody>
              {MOCK_GARAGE_RECORDS.map(
                (record) => (
                  <tr
                    key={
                      record.id
                    }
                  >
                    <td className="autocare-garage-td-ref">
                      {
                        record.vehicleRef
                      }
                    </td>

                    <td className="autocare-garage-td-customer">
                      {
                        record.customerName
                      }
                    </td>

                    <td className="autocare-garage-td-date">
                      {
                        record.date
                      }
                    </td>

                    <td
                      className={`autocare-garage-td-status is-${record.statusColor}`}
                    >
                      {
                        record.status
                      }
                    </td>

                    <td className="autocare-garage-td-actions">
                      <button
                        type="button"
                        className="autocare-garage-action-link"
                        onClick={() =>
                          handleViewPassport(
                            record
                          )
                        }
                        title={`View Digital Passport for ${record.vehicleRef}`}
                      >
                        View Passport
                      </button>

                      <span className="autocare-garage-action-separator">
                        ·
                      </span>

                      <button
                        type="button"
                        className="autocare-garage-action-link"
                        onClick={() =>
                          navigate(
                            `/garage/maintenance/new?vehicleId=${record.vehicleId}`
                          )
                        }
                        title={`Add Record for ${record.vehicleRef}`}
                      >
                        Add Record
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================
          OCR DETAILS MODAL
          ======================================================== */}

      {showOcrModal && (
        <div
          className="autocare-garage-modal-backdrop"
          onClick={() =>
            setShowOcrModal(false)
          }
          role="dialog"
          aria-modal="true"
        >
          <div
            className="autocare-garage-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="autocare-garage-modal-header">
              <div
                style={{
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: '8px',
                }}
              >
                <Sparkles
                  size={20}
                />

                <h3>
                  AI Invoice Scanner{' '}
                  {
                    MOCK_OCR_QUEUE.scanNumber
                  }
                </h3>
              </div>

              <button
                type="button"
                className="autocare-garage-modal-close-btn"
                onClick={() =>
                  setShowOcrModal(
                    false
                  )
                }
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="autocare-garage-modal-body">
              <div
                style={{
                  background:
                    '#f8fafc',
                  padding: '16px',
                  borderRadius:
                    '10px',
                  border:
                    '1px solid #e2e8f0',
                  marginBottom:
                    '16px',
                }}
              >
                <div
                  style={{
                    display:
                      'flex',
                    alignItems:
                      'center',
                    gap: '8px',
                    marginBottom:
                      '8px',
                  }}
                >
                  <FileText
                    size={18}
                    style={{
                      color:
                        '#0056a2',
                    }}
                  />

                  <strong
                    style={{
                      fontSize:
                        '14px',
                      color:
                        '#0f172a',
                    }}
                  >
                    {
                      MOCK_OCR_QUEUE.vehicleTitle
                    }{' '}
                    (
                    {
                      MOCK_OCR_QUEUE.regNumber
                    }
                    )
                  </strong>
                </div>

                <p
                  style={{
                    fontSize:
                      '13px',
                    color:
                      '#64748b',
                    margin: 0,
                  }}
                >
                  Optical Recognition
                  Confidence:{' '}
                  <strong>
                    {
                      MOCK_OCR_QUEUE.progressPercent
                    }
                    %
                  </strong>
                </p>
              </div>

              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">
                  Detected Invoice No.
                </span>

                <span className="autocare-garage-profile-spec-val">
                  INV-8492-PAW
                </span>
              </div>

              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">
                  Extracted Subtotal
                </span>

                <span className="autocare-garage-profile-spec-val">
                  LKR 46,500.00
                </span>
              </div>

              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">
                  Odometer Reading
                </span>

                <span className="autocare-garage-profile-spec-val">
                  98,712 km
                </span>
              </div>

              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">
                  Matched Parts
                </span>

                <span className="autocare-garage-profile-spec-val">
                  Inverter Coolant (5L),
                  Water Pump
                </span>
              </div>
            </div>

            <div className="autocare-garage-modal-footer">
              <button
                type="button"
                className="autocare-garage-btn-primary"
                onClick={() => {
                  setShowOcrModal(
                    false
                  );

                  navigate(
                    '/garage/maintenance/new?vehicleId=veh-4',
                    {
                      state: {
                        ocrExtracted:
                          true,

                        workPerformed:
                          'Full synthetic periodic lube service, replacement of engine oil & filter, brake caliper inspection, hybrid fan cleaning.',

                        partsList: [
                          'Mobil 1 0W-20 Advanced Fuel Economy (4L)',
                          'Toyota Genuine Oil Filter 04152-YZZA6',
                          'Cabin Micro-Air Filter',
                        ],

                        labourCost:
                          '9500',

                        partsCost:
                          '18500',
                      },
                    }
                  );
                }}
              >
                Accept OCR &amp;
                Create Maintenance
                Record
              </button>
            </div>
          </div>
        </div>
      )}
    </GarageLayout>
  );
};

export default GarageDashboardPage;