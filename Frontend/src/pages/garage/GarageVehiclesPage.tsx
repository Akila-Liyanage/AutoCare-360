import React, { useState, useMemo, useEffect } from 'react';
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
import api from '../../services/api';
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

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Interactive Toast State
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  // Vehicles state with API fetching and mock fallback
  const [vehiclesList, setVehiclesList] = useState<GarageVehicle[]>(MOCK_GARAGE_VEHICLES);

  useEffect(() => {
    let isMounted = true;
    const fetchVehicles = async () => {
      try {
        const res = await api.get('/garage/customer-vehicles');
        if (
          isMounted &&
          res.data?.data?.vehicles &&
          Array.isArray(res.data.data.vehicles) &&
          res.data.data.vehicles.length > 0
        ) {
          const apiVehicles: GarageVehicle[] = res.data.data.vehicles.map((v: any) => ({
            id: v._id,
            registration: v.registrationNumber,
            vin: v.vin,
            make: v.manufacturer,
            model: v.model,
            year: v.manufacturingYear,
            color: v.color || 'Pearl White',
            fuelType: v.fuelType || 'Hybrid',
            transmission: v.transmission || 'Automatic',
            engineCapacity: v.engineNumber ? `Engine ${v.engineNumber}` : '1,800 cc',
            mileage: v.currentMileage || 30000,
            lastService: v.lastServiceDate
              ? new Date(v.lastServiceDate).toLocaleDateString('en-GB')
              : 'Recent',
            lastServiceType: 'Certified Routine Maintenance',
            status: v.status || 'Active',
            statusColor: 'green',
            customer: {
              id: v.ownerId?._id || 'cust-owner',
              name: v.ownerId?.fullName || v.ownerId?.displayName || 'Vehicle Owner',
              phone: v.ownerId?.phone || '+94 77 123 4567',
              email: v.ownerId?.email || 'owner@gmail.com',
              address: 'Colombo, Western Province',
              memberSince: 'March 2022',
              loyaltyTier: 'Platinum',
            },
            serviceHistory: [],
            documents: [],
          }));

          const apiIds = new Set(apiVehicles.map((v) => v.id));
          const remainingMock = MOCK_GARAGE_VEHICLES.filter((m) => !apiIds.has(m.id));
          setVehiclesList([...apiVehicles, ...remainingMock]);
        }
      } catch {
        // Fallback to MOCK_GARAGE_VEHICLES
      }
    };
    fetchVehicles();
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

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    return vehiclesList.filter((v) => {
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
  }, [vehiclesList, searchQuery, statusFilter]);

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
          onClick={() => {
            showToast('Client Vehicle Registration portal initialized. Ready to link new VIN.');
          }}
        >
          <Plus size={16} />
          <span>Register Client Vehicle</span>
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
        )}
      </section>

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
