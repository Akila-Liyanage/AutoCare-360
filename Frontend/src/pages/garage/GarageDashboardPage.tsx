import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertTriangle } from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import ServiceRecordDetailsModal, { type ServiceRecordDetailData } from '../../components/modals/ServiceRecordDetailsModal';
import api from '../../services/api';
import {
  FIGMA_GARAGE_KPIS,
  FIGMA_RECENT_ENTRIES,
  FIGMA_OCR_QUEUE,
  FIGMA_OCR_WARNING,
  FIGMA_GARAGE_RECORDS,
  type GarageKPI,
  type RecentVerifiedEntry,
  type GarageRecordItem,
} from './garageData';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/garage-dashboard.css';

export const GarageDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [kpis, setKpis] = useState<GarageKPI[]>(FIGMA_GARAGE_KPIS);
  const [recentEntries, setRecentEntries] = useState<RecentVerifiedEntry[]>(FIGMA_RECENT_ENTRIES);
  const [records, setRecords] = useState<GarageRecordItem[]>(FIGMA_GARAGE_RECORDS);
  const [selectedRecord, setSelectedRecord] = useState<ServiceRecordDetailData | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchLiveStats = async () => {
      try {
        const res = await api.get('/garage/dashboard-stats');
        if (isMounted && res.data?.data) {
          if (Array.isArray(res.data.data.kpis) && res.data.data.kpis.length > 0) {
            setKpis(res.data.data.kpis);
          }
          if (Array.isArray(res.data.data.recentEntries) && res.data.data.recentEntries.length > 0) {
            setRecentEntries(res.data.data.recentEntries);
          }
          const loadedRecords = res.data.data.records || res.data.data.tableRecords;
          if (Array.isArray(loadedRecords) && loadedRecords.length > 0) {
            setRecords(loadedRecords);
          }
        }
      } catch {
        // Fallback to exact Figma specification
      }
    };
    fetchLiveStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = user?.fullName || user?.displayName || 'Perera Auto Works';

  return (
    <GarageLayout activeItem="Overview" breadcrumbCurrent="Overview">
      {/* ====================================================================
          BUSINESS VERIFICATION CARD
          ==================================================================== */}
      <section
        className="autocare-garage-hero-card"
        style={{
          background: '#01427C',
          borderRadius: '10px',
          padding: '16px 20px',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(1, 66, 124, 0.12)',
        }}
        aria-label="Garage Verification Status"
      >
        <div>
          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 600 }}>
            Business verification
          </p>
          <div
            style={{
              display: 'inline-block',
              background: '#50B748',
              color: '#FFFFFF',
              borderRadius: '20px',
              padding: '2px 9px',
              fontSize: '10.5px',
              fontWeight: 700,
              letterSpacing: '0.4px',
              marginBottom: '6px',
            }}
          >
            VERIFIED BUSINESS
          </div>
          <h2 style={{ fontSize: '19px', fontWeight: 800, margin: '0 0 3px 0', color: '#FFFFFF' }}>
            {displayName}
          </h2>
          <p style={{ fontSize: '12.5px', color: '#B9CAE0', margin: 0 }}>
            BR-03 · Verified through 31 Dec 2026 · Colombo 05
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/garage/profile')}
          style={{
            background: '#FFFFFF',
            border: '1px solid #DCE5EF',
            borderRadius: '6px',
            padding: '8px 14px',
            color: '#15263D',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Accreditation details
        </button>
      </section>

      {/* ====================================================================
          MAIN TITLE ROW
          ==================================================================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800,
              fontSize: '22px',
              lineHeight: '28px',
              color: '#0A1128',
              margin: '0 0 4px 0',
            }}
          >
            Garage Service Management
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: '13.5px',
              lineHeight: '18px',
              color: '#64748B',
              margin: 0,
            }}
          >
            Tamper-proof ledger publisher portal and diagnostic scanning metrics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/garage/maintenance/new')}
          style={{
            background: '#0056A2',
            borderRadius: '7px',
            padding: '9px 16px',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '13.5px',
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 86, 162, 0.22)',
          }}
        >
          <Plus size={16} />
          <span>Add Service Entry</span>
        </button>
      </div>

      {/* ====================================================================
          METRIC CARDS (4 Cards Grid)
          ==================================================================== */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '22px',
        }}
        aria-label="Key Performance Indicators"
      >
        {kpis.map((kpi) => (
          <div
            key={kpi.id}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: '11.5px',
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              {kpi.label}
            </span>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 800,
                fontSize: '24px',
                lineHeight: '30px',
                color: '#0A1128',
              }}
            >
              {kpi.value}
            </div>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 400,
                fontSize: '12px',
                margin: 0,
                color:
                  kpi.subtextType === 'positive'
                    ? '#50B748'
                    : kpi.subtextType === 'info'
                    ? '#0056A2'
                    : '#B45309',
              }}
            >
              {kpi.subtext}
            </p>
          </div>
        ))}
      </section>

      {/* ====================================================================
          SPLITS ROW (Recent Entries + Active AI OCR Queue)
          ==================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          marginBottom: '22px',
        }}
      >
        {/* Left Column: Recent Verified Entries */}
        <section
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
          }}
          aria-label="Recent Verified Entries"
        >
          <h2
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: '16px',
              lineHeight: '20px',
              color: '#0A1128',
              margin: 0,
            }}
          >
            Recent Verified Entries
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentEntries.map((entry, idx) => (
              <div
                key={entry.id || idx}
                onClick={() => setSelectedRecord(entry as any)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 8px',
                  borderRadius: '6px',
                  borderBottom: idx < recentEntries.length - 1 ? '1px solid #E2E8F0' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                title="Click to view verified record details"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <h4
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 700,
                      fontSize: '13.5px',
                      color: '#0A1128',
                      margin: 0,
                    }}
                  >
                    {entry.vehicleTitle} ({entry.regNumber})
                  </h4>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                      fontSize: '12px',
                      color: '#64748B',
                      margin: 0,
                    }}
                  >
                    {entry.mileage} • {entry.serviceDescription}
                  </p>
                </div>

                <span
                  style={{
                    background: entry.status === 'COMMITTED' ? '#DCFCE7' : '#FEF3C7',
                    color: entry.status === 'COMMITTED' ? '#15803D' : '#B45309',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Active AI OCR Queue */}
        <section
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
          }}
          aria-label="Active AI OCR Queue"
        >
          <h2
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: '16px',
              lineHeight: '20px',
              color: '#0A1128',
              margin: 0,
            }}
          >
            Active AI OCR Queue
          </h2>

          {/* Queue Indicator Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 12px',
              gap: '12px',
              background: '#F4F6FA',
              borderRadius: '7px',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#0056A2',
                flexShrink: 0,
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 700,
                  fontSize: '13px',
                  color: '#0A1128',
                }}
              >
                Invoice Scan {FIGMA_OCR_QUEUE.scanNumber}
              </span>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: '12px',
                  color: '#64748B',
                }}
              >
                {FIGMA_OCR_QUEUE.vehicleTitle} ({FIGMA_OCR_QUEUE.regNumber}) - Processing {FIGMA_OCR_QUEUE.progressPercent}%
              </span>
            </div>
          </div>

          {/* Queue Warning Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 12px',
              gap: '12px',
              background: '#FEF3C7',
              borderRadius: '7px',
              color: '#B45309',
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, color: '#B45309' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 700,
                  fontSize: '12.5px',
                  color: '#B45309',
                }}
              >
                {FIGMA_OCR_WARNING.title}
              </span>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: '11.5px',
                  color: '#B45309',
                }}
              >
                {FIGMA_OCR_WARNING.message}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* ====================================================================
          RECORDS TABLE
          ==================================================================== */}
      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid #DCE5EF',
          borderRadius: '12px',
          boxShadow: '0px 2px 8px rgba(18, 52, 90, 0.04)',
          padding: '20px',
        }}
        aria-label="Registered Vehicle Records"
      >
        <h3
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: '16px',
            color: '#15263D',
            margin: '0 0 14px 0',
          }}
        >
          Records
        </h3>

        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #DCE5EF' }}>
                <th style={{ padding: '10px 14px', color: '#617187', fontSize: '12.5px', fontWeight: 600 }}>
                  Vehicle Reference
                </th>
                <th style={{ padding: '10px 14px', color: '#617187', fontSize: '12.5px', fontWeight: 600 }}>
                  Customer Name
                </th>
                <th style={{ padding: '10px 14px', color: '#617187', fontSize: '12.5px', fontWeight: 600 }}>
                  Service Date
                </th>
                <th style={{ padding: '10px 14px', color: '#617187', fontSize: '12.5px', fontWeight: 600 }}>
                  Passport Status
                </th>
                <th style={{ padding: '10px 14px', color: '#617187', fontSize: '12.5px', fontWeight: 600, textAlign: 'right' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '28px 14px', textAlign: 'center', color: '#64748B', fontSize: '13.5px' }}>
                    No service records found. Click <strong>Add Service Entry</strong> to log verified maintenance.
                  </td>
                </tr>
              ) : (
                records.map((rec, idx) => (
                  <tr
                    key={rec.id || (rec as any)._id || idx}
                    style={{ borderBottom: '1px solid #DCE5EF', cursor: 'pointer', transition: 'background 0.15s ease' }}
                    onClick={() => setSelectedRecord(rec as any)}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 14px', color: '#15263D', fontSize: '13px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#0056A2', fontWeight: 700 }}>
                          {rec.vehicleRef}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#15263D', fontSize: '13px' }}>
                      {rec.customerName}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#15263D', fontSize: '13px' }}>
                      {rec.date}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          background: rec.status === 'Verified' ? '#DCFCE7' : '#FEF3C7',
                          color: rec.status === 'Verified' ? '#15803D' : '#B45309',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(rec as any);
                        }}
                        style={{
                          background: '#F1F5F9',
                          border: '1px solid #DCE5EF',
                          borderRadius: '5px',
                          color: '#0056A2',
                          fontWeight: 700,
                          fontSize: '12px',
                          padding: '4px 10px',
                          cursor: 'pointer',
                          marginRight: '8px',
                        }}
                        title="View Record Details"
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(rec.vehicleId ? `/garage/vehicles/${rec.vehicleId}` : `/garage/maintenance/new`);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748B',
                          fontWeight: 600,
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        {rec.vehicleId ? 'Passport →' : 'Add'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Service Record Details Modal */}
      <ServiceRecordDetailsModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </GarageLayout>
  );
};

export default GarageDashboardPage;
