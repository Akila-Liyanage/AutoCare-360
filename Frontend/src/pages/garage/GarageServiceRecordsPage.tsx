import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Wrench, Search } from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import ServiceRecordDetailsModal, { type ServiceRecordDetailData } from '../../components/modals/ServiceRecordDetailsModal';
import api from '../../services/api';
import '../../styles/garage-dashboard.css';

interface ApiRecord {
  _id: string;
  vehicleId?: {
    _id?: string;
    manufacturer?: string;
    model?: string;
    registrationNumber?: string;
  };
  serviceDate: string;
  serviceType?: string;
  notes?: string;
  totalCost?: number;
  verificationStatus?: string;
}

export const GarageServiceRecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<ServiceRecordDetailData | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchRecords = async () => {
      try {
        const res = await api.get('/garage/my-records');
        if (isMounted && res.data?.data?.records && Array.isArray(res.data.data.records)) {
          setRecords(res.data.data.records);
        }
      } catch {
        if (isMounted) setRecords([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchRecords();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = records.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.serviceType?.toLowerCase().includes(q) ||
      r.vehicleId?.registrationNumber?.toLowerCase().includes(q) ||
      r.vehicleId?.model?.toLowerCase().includes(q)
    );
  });

  return (
    <GarageLayout activeItem="Service records" breadcrumbCurrent="Service records">
      <div className="autocare-garage-title-row">
        <div>
          <h1 className="autocare-garage-main-title">Service Records</h1>
          <p className="autocare-garage-main-subtitle">
            Verified maintenance logs published to vehicle digital passports.
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

      {records.length > 0 ? (
        <div style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '16px', maxWidth: '400px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by vehicle or service type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 38px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((record) => (
              <div
                key={record._id}
                onClick={() => setSelectedRecord({
                  ...record,
                  regNumber: record.vehicleId?.registrationNumber,
                  vehicleModel: record.vehicleId ? `${record.vehicleId.manufacturer} ${record.vehicleId.model}` : 'Vehicle',
                  vehicleId: record.vehicleId?._id,
                })}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0056A2')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, fontSize: '15.5px', fontWeight: 700, color: '#0A1128' }}>
                      {record.serviceType || 'Maintenance Record'}
                    </h4>
                    <span
                      style={{
                        background: '#DCFCE7',
                        color: '#15803D',
                        padding: '2px 7px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      ● Verified
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    Vehicle: <strong>{record.vehicleId ? `${record.vehicleId.registrationNumber} (${record.vehicleId.manufacturer} ${record.vehicleId.model})` : 'Vehicle'}</strong> · {new Date(record.serviceDate).toLocaleDateString()}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {record.totalCost && (
                    <span style={{ fontWeight: 800, fontSize: '15px', color: '#0056A2' }}>
                      Rs. {record.totalCost.toLocaleString()}
                    </span>
                  )}
                  <button
                    type="button"
                    style={{
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      padding: '5px 12px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: '#0056A2',
                      cursor: 'pointer',
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '56px 24px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            marginTop: '20px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              background: '#f1f5f9',
              color: '#64748b',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <Wrench size={32} />
          </div>
          <h2 style={{ fontSize: '19px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            No Service Records Yet
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '460px', margin: '0 auto 20px auto' }}>
            {loading
              ? 'Loading service records...'
              : 'All dummy service records have been removed. Create a new service entry to start publishing verified records.'}
          </p>
          <button
            type="button"
            className="autocare-garage-btn-primary"
            onClick={() => navigate('/garage/maintenance/new')}
          >
            <Plus size={16} />
            <span>Create First Service Record</span>
          </button>
        </div>
      )}

      {/* Service Record Details Modal */}
      <ServiceRecordDetailsModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </GarageLayout>
  );
};

export default GarageServiceRecordsPage;
