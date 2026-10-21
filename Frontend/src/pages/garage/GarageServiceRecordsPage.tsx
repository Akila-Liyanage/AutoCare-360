import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  X,
  Eye,
  Edit,
  Wrench,
  FileText,
  Car,
} from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import {
  MOCK_GARAGE_VEHICLES,
  type GarageVehicle,
  type GarageVehicleServiceHistoryItem,
} from './garageData';
import '../../styles/garage-dashboard.css';

interface ToastState {
  show: boolean;
  message: string;
}

interface ServiceRecordRow {
  vehicle: GarageVehicle;
  record: GarageVehicleServiceHistoryItem;
}

export const GarageServiceRecordsPage: React.FC = () => {
  const navigate = useNavigate();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Selected Record Modal State
  const [selectedRecord, setSelectedRecord] = useState<ServiceRecordRow | null>(null);
  const [editRecord, setEditRecord] = useState<ServiceRecordRow | null>(null);

  // Edit Modal Form State
  const [editWork, setEditWork] = useState<string>('');
  const [editCost, setEditCost] = useState<string>('');

  // Toast Notification
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  // Compile records from all vehicles into local mutable state
  const [recordsList, setRecordsList] = useState<ServiceRecordRow[]>(() => {
    const rows: ServiceRecordRow[] = [];
    MOCK_GARAGE_VEHICLES.forEach((v) => {
      v.serviceHistory.forEach((sh) => {
        rows.push({
          vehicle: v,
          record: { ...sh },
        });
      });
    });
    return rows;
  });

  // Filtered rows
  const filteredRows = useMemo(() => {
    return recordsList.filter(({ vehicle, record }) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        vehicle.registration.toLowerCase().includes(q) ||
        vehicle.make.toLowerCase().includes(q) ||
        vehicle.model.toLowerCase().includes(q) ||
        vehicle.customer.name.toLowerCase().includes(q) ||
        record.serviceType.toLowerCase().includes(q) ||
        record.technician.toLowerCase().includes(q) ||
        record.workPerformed.toLowerCase().includes(q) ||
        record.invoiceNo.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'ALL' ||
        record.status.toUpperCase() === statusFilter.toUpperCase();

      const matchesType =
        typeFilter === 'ALL' || record.serviceType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [recordsList, searchQuery, statusFilter, typeFilter]);

  const handleOpenEdit = (row: ServiceRecordRow) => {
    setEditRecord(row);
    setEditWork(row.record.workPerformed);
    setEditCost(String(row.record.totalCost));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecord) return;
    const newCost = parseFloat(editCost) || editRecord.record.totalCost;
    setRecordsList((prev) =>
      prev.map((item) => {
        if (item.record.id === editRecord.record.id) {
          return {
            ...item,
            record: {
              ...item.record,
              workPerformed: editWork.trim() || item.record.workPerformed,
              totalCost: newCost,
            },
          };
        }
        return item;
      })
    );
    showToast(
      `Service record ${editRecord.record.invoiceNo} for ${editRecord.vehicle.registration} updated successfully.`
    );
    setEditRecord(null);
  };

  return (
    <GarageLayout activeItem="Service records" breadcrumbCurrent="Service Records">
      {/* Title Row */}
      <div className="autocare-garage-title-row">
        <div>
          <h1 className="autocare-garage-main-title">Service &amp; Maintenance Records</h1>
          <p className="autocare-garage-main-subtitle">
            Cryptographically anchored service records, parts specifications, and customer authorizations.
          </p>
        </div>

        <button
          type="button"
          className="autocare-garage-btn-primary"
          onClick={() => navigate('/garage/maintenance/new')}
        >
          <Plus size={16} />
          <span>Add Maintenance Record</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '22px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '8px 14px',
            flex: '1',
            minWidth: '280px',
            maxWidth: '500px',
          }}
        >
          <Search size={18} style={{ color: '#64748b', flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vehicle, customer, technician, or invoice..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              fontSize: '13.5px',
              color: '#0f172a',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: 0,
              }}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Status:</span>
          {['ALL', 'VERIFIED', 'DRAFT', 'PENDING SIGNATURE'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                background: statusFilter === st ? '#003874' : '#f1f5f9',
                color: statusFilter === st ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: statusFilter === st ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div style={{ marginBottom: '14px', fontSize: '13px', color: '#64748b' }}>
        Showing <strong>{filteredRows.length}</strong> of <strong>{recordsList.length}</strong> total records
      </div>

      {/* Records Table */}
      <section className="autocare-garage-records-panel" aria-label="Service Records Ledger Table">
        {filteredRows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <Wrench size={40} style={{ color: '#94a3b8', margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#0f172a' }}>
              No service records match your filters
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              Try adjusting your search query or status filter.
            </p>
            <button
              type="button"
              className="autocare-garage-hero-btn"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setTypeFilter('ALL');
              }}
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="autocare-garage-table-responsive">
            <table className="autocare-garage-records-table">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  VEHICLE
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  CUSTOMER
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  DATE &amp; ODOMETER
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  SERVICE TYPE
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  GARAGE &amp; TECHNICIAN
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  COST (LKR)
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  STATUS
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '12px', color: '#64748b' }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(({ vehicle, record }) => (
                <tr key={record.id}>
                  {/* Vehicle */}
                  <td style={{ padding: '14px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Car size={16} style={{ color: '#0056a2', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                          {vehicle.registration}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {vehicle.make} {vehicle.model}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Customer */}
                  <td style={{ padding: '14px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#334155', fontSize: '13.5px' }}>
                      {vehicle.customer.name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      {vehicle.customer.phone}
                    </div>
                  </td>

                  {/* Date & Odometer */}
                  <td style={{ padding: '14px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} style={{ color: '#64748b' }} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                        {record.serviceDate}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                      {record.mileage.toLocaleString()} km
                    </div>
                  </td>

                  {/* Service Type & Invoice Link */}
                  <td style={{ padding: '14px 14px' }}>
                    <span
                      style={{
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: '#003874',
                        background: '#eff6ff',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'inline-block',
                      }}
                    >
                      {record.serviceType}
                    </span>
                    <button
                      type="button"
                      className="autocare-garage-action-link"
                      onClick={() => navigate(`/garage/invoice/new?vehicleId=${vehicle.id}`)}
                      style={{
                        display: 'block',
                        fontSize: '11.5px',
                        color: '#0284c7',
                        marginTop: '4px',
                        fontWeight: 600,
                      }}
                      title={`Open Invoice ${record.invoiceNo} in Invoice Generator`}
                    >
                      {record.invoiceNo} →
                    </button>
                  </td>

                  {/* Garage & Technician */}
                  <td style={{ padding: '14px 14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                      {record.technician}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      {record.garageName || 'Perera Auto Works'}
                    </div>
                  </td>

                  {/* Cost */}
                  <td style={{ padding: '14px 14px', fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                    LKR {record.totalCost.toLocaleString()}
                  </td>

                  {/* Status Badge */}
                  <td style={{ padding: '14px 14px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background:
                          record.status === 'Verified'
                            ? '#ecfdf5'
                            : record.status === 'Draft'
                            ? '#fef3c7'
                            : '#fffbeb',
                        color:
                          record.status === 'Verified'
                            ? '#059669'
                            : record.status === 'Draft'
                            ? '#b45309'
                            : '#d97706',
                        border: `1px solid ${
                          record.status === 'Verified'
                            ? '#a7f3d0'
                            : record.status === 'Draft'
                            ? '#fde68a'
                            : '#fde68a'
                        }`,
                      }}
                    >
                      <ShieldCheck size={12} />
                      <span>{record.status}</span>
                    </span>
                  </td>

                  {/* Actions: View & Edit */}
                  <td style={{ padding: '14px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      className="autocare-garage-action-link"
                      onClick={() => setSelectedRecord({ vehicle, record })}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                      title="View complete record breakdown"
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </button>
                    <span className="autocare-garage-action-separator">·</span>
                    <button
                      type="button"
                      className="autocare-garage-action-link"
                      onClick={() => handleOpenEdit({ vehicle, record })}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                      title="Edit record parameters"
                    >
                      <Edit size={13} />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </section>

      {/* ====================================================================
          VIEW RECORD DETAILS MODAL
          ==================================================================== */}
      {selectedRecord && (
        <div
          className="autocare-garage-modal-backdrop"
          onClick={() => setSelectedRecord(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="autocare-garage-modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="autocare-garage-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} />
                <h3>Service Record Details</h3>
              </div>
              <button
                type="button"
                className="autocare-garage-modal-close-btn"
                onClick={() => setSelectedRecord(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="autocare-garage-modal-body">
              <div
                style={{
                  background: '#f8fafc',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', color: '#0f172a' }}>
                    {selectedRecord.vehicle.registration} · {selectedRecord.vehicle.make} {selectedRecord.vehicle.model}
                  </h4>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                    Customer: {selectedRecord.vehicle.customer.name} ({selectedRecord.vehicle.customer.phone})
                  </p>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: selectedRecord.record.status === 'Verified' ? '#ecfdf5' : '#fef3c7',
                    color: selectedRecord.record.status === 'Verified' ? '#059669' : '#b45309',
                  }}
                >
                  {selectedRecord.record.status}
                </span>
              </div>

              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Service Date</span>
                <span className="autocare-garage-profile-spec-val">{selectedRecord.record.serviceDate}</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Odometer Reading</span>
                <span className="autocare-garage-profile-spec-val">
                  {selectedRecord.record.mileage.toLocaleString()} km
                </span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Service Category</span>
                <span className="autocare-garage-profile-spec-val">{selectedRecord.record.serviceType}</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Lead Technician</span>
                <span className="autocare-garage-profile-spec-val">{selectedRecord.record.technician}</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Invoice Ref</span>
                <span className="autocare-garage-profile-spec-val">{selectedRecord.record.invoiceNo}</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Total Amount Billed</span>
                <span className="autocare-garage-profile-spec-val" style={{ color: '#003874', fontSize: '15px' }}>
                  LKR {selectedRecord.record.totalCost.toLocaleString()}
                </span>
              </div>

              <div style={{ marginTop: '14px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#64748b' }}>Work Performed Description:</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#334155', lineHeight: '1.4' }}>
                  {selectedRecord.record.workPerformed}
                </p>
              </div>

              {selectedRecord.record.partsReplaced && selectedRecord.record.partsReplaced.length > 0 && (
                <div style={{ marginTop: '14px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#64748b' }}>Parts Installed:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {selectedRecord.record.partsReplaced.map((part) => (
                      <span
                        key={part}
                        style={{
                          background: '#f1f5f9',
                          color: '#334155',
                          borderRadius: '12px',
                          padding: '3px 10px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                        }}
                      >
                        {part}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="autocare-garage-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="autocare-garage-hero-btn"
                  style={{ background: '#f8fafc', color: '#003874', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                  onClick={() => {
                    const vId = selectedRecord.vehicle.id;
                    setSelectedRecord(null);
                    navigate(`/garage/quotation/new?vehicleId=${vId}`);
                  }}
                >
                  + Quotation
                </button>
                <button
                  type="button"
                  className="autocare-garage-hero-btn"
                  style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '12.5px' }}
                  onClick={() => {
                    const vId = selectedRecord.vehicle.id;
                    setSelectedRecord(null);
                    navigate(`/garage/invoice/new?vehicleId=${vId}`);
                  }}
                >
                  + Invoice
                </button>
              </div>

              <button
                type="button"
                className="autocare-garage-btn-primary"
                onClick={() => {
                  setSelectedRecord(null);
                  navigate(`/garage/vehicles/${selectedRecord.vehicle.id}`);
                }}
              >
                Open Vehicle Digital Passport
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          EDIT RECORD MODAL
          ==================================================================== */}
      {editRecord && (
        <div
          className="autocare-garage-modal-backdrop"
          onClick={() => setEditRecord(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="autocare-garage-modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="autocare-garage-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit size={20} />
                <h3>Edit Record: {editRecord.record.invoiceNo}</h3>
              </div>
              <button
                type="button"
                className="autocare-garage-modal-close-btn"
                onClick={() => setEditRecord(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="autocare-garage-modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
                    <strong>Vehicle:</strong> {editRecord.vehicle.registration} ({editRecord.vehicle.make} {editRecord.vehicle.model})
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Work Performed Description
                    </label>
                    <textarea
                      rows={3}
                      value={editWork}
                      onChange={(e) => setEditWork(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Total Cost (LKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editCost}
                      onChange={(e) => setEditCost(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        boxSizing: 'border-box',
                      }}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="autocare-garage-modal-footer">
                <button
                  type="button"
                  className="autocare-garage-hero-btn"
                  style={{ background: '#f1f5f9', color: '#475569', marginRight: '8px' }}
                  onClick={() => setEditRecord(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="autocare-garage-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="autocare-garage-toast" role="alert">
          <CheckCircle2 size={18} style={{ color: '#00B4EB', flexShrink: 0 }} />
          <span>{toast.message}</span>
          <button
            type="button"
            className="autocare-garage-toast-close"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </GarageLayout>
  );
};

export default GarageServiceRecordsPage;
