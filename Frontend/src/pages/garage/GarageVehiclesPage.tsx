import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Car,
  Calendar,
  Gauge,
  User,
  CheckCircle2,
  X,
  Eye,
  Wrench,
} from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import {
  MOCK_GARAGE_VEHICLES,
  type GarageVehicle,
} from './garageData';
import '../../styles/garage-dashboard.css';

interface ToastState {
  show: boolean;
  message: string;
}

export const GarageVehiclesPage: React.FC = () => {
  const navigate = useNavigate();

  // Vehicles state (allows local adding of client vehicles)
  const [vehicles, setVehicles] = useState<GarageVehicle[]>(MOCK_GARAGE_VEHICLES);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Register Modal State
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [newReg, setNewReg] = useState<string>('');
  const [newVin, setNewVin] = useState<string>('');
  const [newMake, setNewMake] = useState<string>('Toyota');
  const [newModel, setNewModel] = useState<string>('');
  const [newCustomer, setNewCustomer] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newMileage, setNewMileage] = useState<string>('45000');
  const [formError, setFormError] = useState<string>('');

  // Interactive Toast State
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  // Register Client Vehicle Handler
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const regTrimmed = newReg.trim();
    const custTrimmed = newCustomer.trim();
    const mNum = parseInt(newMileage, 10);

    if (!regTrimmed) {
      setFormError('Vehicle registration number is required.');
      return;
    }
    if (!custTrimmed) {
      setFormError('Customer/Owner name is required.');
      return;
    }
    if (isNaN(mNum) || mNum < 0) {
      setFormError('Current mileage must be a non-negative number.');
      return;
    }

    const newVehItem: GarageVehicle = {
      id: `veh-${Date.now()}`,
      registration: regTrimmed.toUpperCase(),
      vin: newVin.trim().toUpperCase() || `VIN-${Date.now().toString().slice(-8)}`,
      make: newMake.trim() || 'Toyota',
      model: newModel.trim() || 'Custom Vehicle',
      year: new Date().getFullYear(),
      color: 'Standard Silver',
      fuelType: 'Hybrid / Petrol',
      transmission: 'Automatic',
      engineCapacity: '1,500 cc',
      mileage: mNum,
      lastService: 'Just Registered',
      lastServiceType: 'Initial Workshop Intake',
      status: 'Active',
      statusColor: 'green',
      customer: {
        id: `cust-${Date.now()}`,
        name: custTrimmed,
        phone: newPhone.trim() || '+94 77 000 0000',
        email: `${custTrimmed.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        address: 'Colombo, Sri Lanka',
        memberSince: 'October 2026',
        loyaltyTier: 'Standard',
      },
      serviceHistory: [],
      documents: [],
    };

    setVehicles((prev) => [newVehItem, ...prev]);
    setShowRegisterModal(false);
    setNewReg('');
    setNewVin('');
    setNewModel('');
    setNewCustomer('');
    setNewPhone('');
    showToast(`Vehicle ${newVehItem.registration} successfully linked to workshop registry.`);
  };

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        v.registration.toLowerCase().includes(q) ||
        v.vin.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.customer.name.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'ALL' ||
        v.status.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchQuery, statusFilter]);

  return (
    <GarageLayout activeItem="Vehicles" breadcrumbCurrent="Customer Vehicles">
      {/* Page Title Row */}
      <div className="autocare-garage-title-row">
        <div>
          <h1 className="autocare-garage-main-title">Customer Vehicles</h1>
          <p className="autocare-garage-main-subtitle">
            Manage verified client vehicle passports, telemetry logs, and maintenance histories.
          </p>
        </div>

        <button
          type="button"
          className="autocare-garage-btn-primary"
          onClick={() => setShowRegisterModal(true)}
        >
          <Plus size={16} />
          <span>+ Register Client Vehicle</span>
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
            maxWidth: '520px',
          }}
        >
          <Search size={18} style={{ color: '#64748b', flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by registration (e.g. WP ABC), VIN, or customer name..."
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

        {/* Status Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Status:</span>
          {['ALL', 'ACTIVE', 'IN SERVICE', 'SERVICE DUE', 'QUOTATION SENT'].map((st) => (
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
        Showing <strong>{filteredVehicles.length}</strong> of{' '}
        <strong>{MOCK_GARAGE_VEHICLES.length}</strong> client vehicles
      </div>

      {/* Vehicles Table Card */}
      <section className="autocare-garage-records-panel" aria-label="Customer Vehicles Table">
        {filteredVehicles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <Car size={40} style={{ color: '#94a3b8', margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#0f172a' }}>
              No client vehicles match your search
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              Try searching for a different registration plate, VIN, or customer name.
            </p>
            <button
              type="button"
              className="autocare-garage-hero-btn"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="autocare-garage-table-responsive">
            <table className="autocare-garage-records-table">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  REGISTRATION &amp; MODEL
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  CUSTOMER / OWNER
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  ODOMETER
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  LAST SERVICE
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
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  {/* Registration & Model */}
                  <td style={{ padding: '14px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: '#e0f2fe',
                          color: '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Car size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                          {vehicle.registration}
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '1px' }}>
                          {vehicle.make} {vehicle.model} ({vehicle.year})
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Customer Info */}
                  <td style={{ padding: '14px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} style={{ color: '#64748b' }} />
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>
                        {vehicle.customer.name}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {vehicle.customer.phone}
                    </div>
                  </td>

                  {/* Mileage */}
                  <td style={{ padding: '14px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Gauge size={14} style={{ color: '#64748b' }} />
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                        {vehicle.mileage.toLocaleString()} km
                      </span>
                    </div>
                  </td>

                  {/* Last Service */}
                  <td style={{ padding: '14px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} style={{ color: '#64748b' }} />
                      <span style={{ fontSize: '13px', color: '#334155' }}>
                        {vehicle.lastService}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                      {vehicle.lastServiceType}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td style={{ padding: '14px 14px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background:
                          vehicle.status === 'Active'
                            ? '#ecfdf5'
                            : vehicle.status === 'In Service'
                            ? '#eff6ff'
                            : vehicle.status === 'Service Due'
                            ? '#fef2f2'
                            : '#fffbeb',
                        color:
                          vehicle.status === 'Active'
                            ? '#059669'
                            : vehicle.status === 'In Service'
                            ? '#2563eb'
                            : vehicle.status === 'Service Due'
                            ? '#dc2626'
                            : '#d97706',
                        border: `1px solid ${
                          vehicle.status === 'Active'
                            ? '#a7f3d0'
                            : vehicle.status === 'In Service'
                            ? '#bfdbfe'
                            : vehicle.status === 'Service Due'
                            ? '#fecaca'
                            : '#fde68a'
                        }`,
                      }}
                    >
                      {vehicle.status}
                    </span>
                  </td>

                  {/* Action Buttons */}
                  <td style={{ padding: '14px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      className="autocare-garage-action-link"
                      onClick={() => navigate(`/garage/vehicles/${vehicle.id}`)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 700,
                      }}
                      title={`View full details for ${vehicle.registration}`}
                    >
                      <Eye size={14} />
                      <span>View Vehicle</span>
                    </button>
                    <span className="autocare-garage-action-separator">·</span>
                    <button
                      type="button"
                      className="autocare-garage-action-link"
                      onClick={() => navigate(`/garage/maintenance/new?vehicleId=${vehicle.id}`)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title={`Log service for ${vehicle.registration}`}
                    >
                      <Wrench size={13} />
                      <span>Add Entry</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </section>

      {/* Register Client Vehicle Modal */}
      {showRegisterModal && (
        <div
          className="autocare-garage-modal-backdrop"
          onClick={() => setShowRegisterModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="autocare-garage-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="autocare-garage-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Car size={18} />
                <h3>Register Client Vehicle</h3>
              </div>
              <button
                type="button"
                className="autocare-garage-modal-close-btn"
                onClick={() => setShowRegisterModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit}>
              <div className="autocare-garage-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {formError && (
                  <div
                    style={{
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                    }}
                  >
                    {formError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Registration Number *
                    </label>
                    <input
                      type="text"
                      value={newReg}
                      onChange={(e) => setNewReg(e.target.value)}
                      placeholder="e.g. WP CBB-4422"
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      VIN / Chassis Number
                    </label>
                    <input
                      type="text"
                      value={newVin}
                      onChange={(e) => setNewVin(e.target.value)}
                      placeholder="e.g. NZE161-90281"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Manufacturer (Make)
                    </label>
                    <input
                      type="text"
                      value={newMake}
                      onChange={(e) => setNewMake(e.target.value)}
                      placeholder="e.g. Toyota"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Model &amp; Edition
                    </label>
                    <input
                      type="text"
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      placeholder="e.g. Yaris Cross G-Spec"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Customer / Owner Name *
                    </label>
                    <input
                      type="text"
                      value={newCustomer}
                      onChange={(e) => setNewCustomer(e.target.value)}
                      placeholder="e.g. Dilan Perera"
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Customer Phone Number
                    </label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="e.g. +94 77 889 0011"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Current Odometer (km) *
                  </label>
                  <input
                    type="number"
                    value={newMileage}
                    onChange={(e) => setNewMileage(e.target.value)}
                    min="0"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              <div className="autocare-garage-modal-footer">
                <button
                  type="button"
                  className="autocare-garage-hero-btn"
                  onClick={() => setShowRegisterModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="autocare-garage-btn-primary">
                  Save &amp; Link Vehicle
                </button>
              </div>
            </form>
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

export default GarageVehiclesPage;
