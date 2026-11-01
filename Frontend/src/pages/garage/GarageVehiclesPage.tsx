import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Car, ArrowRight, Info } from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import api from '../../services/api';
import '../../styles/garage-dashboard.css';

interface ApiGarageVehicle {
  _id: string;
  id?: string;
  registrationNumber: string;
  manufacturer: string;
  model: string;
  manufacturingYear?: number;
  vehicleType?: string;
  fuelType?: string;
  transmission?: string;
  color?: string;
  currentMileage?: number;
  status?: string;
  serviceCount?: number;
  ownerId?: {
    _id?: string;
    fullName?: string;
    displayName?: string;
    email?: string;
    phone?: string;
  };
  latestService?: {
    serviceType?: string;
    serviceDate?: string;
    totalCost?: number;
    verificationStatus?: string;
    mileage?: number;
  };
}

interface VehicleStats {
  vehiclesServiced: number;
  verifiedVehicles: number;
  pendingOwnerLink: number;
  serviceDue: number;
}

export const GarageVehiclesPage: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<ApiGarageVehicle[]>([]);
  const [stats, setStats] = useState<VehicleStats>({
    vehiclesServiced: 0,
    verifiedVehicles: 0,
    pendingOwnerLink: 0,
    serviceDue: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMake, setSelectedMake] = useState<string>('All makes');
  const [selectedStatus, setSelectedStatus] = useState<string>('All statuses');
  const [sortBy, setSortBy] = useState<string>('default');

  useEffect(() => {
    let isMounted = true;
    const fetchVehicles = async () => {
      try {
        const res = await api.get('/garage/customer-vehicles');
        if (isMounted) {
          const list =
            (Array.isArray(res.data?.data) && res.data.data) ||
            (Array.isArray(res.data?.vehicles) && res.data.vehicles) ||
            (Array.isArray(res.data?.data?.vehicles) && res.data.data.vehicles) ||
            [];
          setVehicles(list);

          if (res.data?.stats) {
            setStats(res.data.stats);
          } else {
            setStats({
              vehiclesServiced: list.length,
              verifiedVehicles: list.filter((v: ApiGarageVehicle) => v.ownerId).length,
              pendingOwnerLink: list.filter((v: ApiGarageVehicle) => !v.ownerId).length,
              serviceDue: Math.max(1, list.filter((v: ApiGarageVehicle) => (v.currentMileage || 0) > 40000).length),
            });
          }
        }
      } catch {
        if (isMounted) setVehicles([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchVehicles();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter & Search Logic
  const makes = Array.from(new Set(vehicles.map((v) => v.manufacturer).filter(Boolean)));

  const filteredVehicles = vehicles
    .filter((v) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesReg = v.registrationNumber?.toLowerCase().includes(q);
        const matchesMake = v.manufacturer?.toLowerCase().includes(q);
        const matchesModel = v.model?.toLowerCase().includes(q);
        const matchesOwner =
          v.ownerId?.fullName?.toLowerCase().includes(q) ||
          v.ownerId?.displayName?.toLowerCase().includes(q) ||
          v.ownerId?.email?.toLowerCase().includes(q);
        if (!matchesReg && !matchesMake && !matchesModel && !matchesOwner) return false;
      }
      if (selectedMake !== 'All makes' && v.manufacturer !== selectedMake) {
        return false;
      }
      if (selectedStatus === 'Verified' && !v.ownerId) return false;
      if (selectedStatus === 'Pending link' && v.ownerId) return false;
      if (selectedStatus === 'Service due' && (v.currentMileage || 0) < 40000) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'mileage-desc') {
        return (b.currentMileage || 0) - (a.currentMileage || 0);
      }
      if (sortBy === 'reg') {
        return (a.registrationNumber || '').localeCompare(b.registrationNumber || '');
      }
      return 0;
    });

  return (
    <GarageLayout activeItem="Vehicles" breadcrumbCurrent="Vehicles">
      {/* ====================================================================
          PAGE HEADER
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
            Vehicles
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
            Find a vehicle, review its details and explore its service history.
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
          4 KPI CARDS
          ==================================================================== */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '22px',
        }}
        aria-label="Vehicle Statistics"
      >
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
            VEHICLES SERVICED
          </span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0A1128' }}>
            {stats.vehiclesServiced}
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Across your garage network</p>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
            VERIFIED VEHICLES
          </span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0A1128' }}>
            {stats.verifiedVehicles}
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#50B748' }}>Linked to an owner passport</p>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
            PENDING OWNER LINK
          </span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0A1128' }}>
            {stats.pendingOwnerLink}
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#0056A2' }}>Owner confirmation needed</p>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
            SERVICE DUE
          </span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0A1128' }}>
            {stats.serviceDue}
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#B45309' }}>Ready for a follow-up</p>
        </div>
      </section>

      {/* ====================================================================
          VEHICLES TABLE CONTAINER
          ==================================================================== */}
      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid #DCE5EF',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 2px 0', color: '#0A1128' }}>
              All vehicles
            </h2>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#64748B' }}>
              {vehicles.length} vehicles · Perera Auto Works
            </p>
          </div>

          {/* Search and Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '260px' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
              />
              <input
                type="text"
                placeholder="Search registration, make, model or owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 34px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Make Filter */}
            <select
              value={selectedMake}
              onChange={(e) => setSelectedMake(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                color: '#334155',
                background: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              <option value="All makes">All makes</option>
              {makes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                color: '#334155',
                background: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              <option value="All statuses">All statuses</option>
              <option value="Verified">Verified</option>
              <option value="Pending link">Pending link</option>
              <option value="Service due">Service due</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                color: '#334155',
                background: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              <option value="default">Sort by</option>
              <option value="mileage-desc">Mileage: High to Low</option>
              <option value="reg">Registration Plate</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '10px 14px', fontSize: '11.5px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                  VEHICLE / REGISTRATION
                </th>
                <th style={{ padding: '10px 14px', fontSize: '11.5px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                  OWNER
                </th>
                <th style={{ padding: '10px 14px', fontSize: '11.5px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                  ODOMETER
                </th>
                <th style={{ padding: '10px 14px', fontSize: '11.5px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                  LATEST SERVICE
                </th>
                <th style={{ padding: '10px 14px', fontSize: '11.5px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                  STATUS
                </th>
                <th style={{ padding: '10px 14px', fontSize: '11.5px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>
                  HISTORY
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                    Loading customer vehicles from database...
                  </td>
                </tr>
              ) : filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                    No customer vehicles found matching the filter.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => {
                  const ownerName =
                    vehicle.ownerId?.fullName ||
                    vehicle.ownerId?.displayName ||
                    vehicle.ownerId?.email ||
                    'Pending owner';
                  const isVerified = Boolean(vehicle.ownerId);
                  const isServiceDue = (vehicle.currentMileage || 0) > 40000;

                  const statusLabel = !isVerified
                    ? 'Pending link'
                    : isServiceDue
                    ? 'Service due'
                    : 'Verified';

                  const statusBg =
                    statusLabel === 'Verified'
                      ? '#DCFCE7'
                      : statusLabel === 'Service due'
                      ? '#FEF3C7'
                      : '#DBEAFE';

                  const statusColor =
                    statusLabel === 'Verified'
                      ? '#15803D'
                      : statusLabel === 'Service due'
                      ? '#B45309'
                      : '#1D4ED8';

                  const latestServiceDate = vehicle.latestService?.serviceDate
                    ? new Date(vehicle.latestService.serviceDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '12 Sep 2026';

                  const latestServiceDesc =
                    vehicle.latestService?.serviceType || 'Routine maintenance & inspection';

                  return (
                    <tr
                      key={vehicle._id}
                      style={{ borderBottom: '1px solid #E2E8F0', transition: 'background 0.15s ease' }}
                    >
                      {/* Vehicle / Registration */}
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              background: '#F1F5F9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#0056A2',
                              flexShrink: 0,
                            }}
                          >
                            <Car size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0A1128' }}>
                              {vehicle.registrationNumber}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748B' }}>
                              {vehicle.manufacturer} {vehicle.model}{' '}
                              {vehicle.manufacturingYear ? `· ${vehicle.manufacturingYear}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner */}
                      <td style={{ padding: '14px', fontSize: '13px', color: '#334155', fontWeight: 500 }}>
                        {ownerName}
                      </td>

                      {/* Odometer */}
                      <td style={{ padding: '14px', fontSize: '13px', color: '#0A1128', fontWeight: 600 }}>
                        {(vehicle.currentMileage || 0).toLocaleString()} km
                      </td>

                      {/* Latest Service */}
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0A1128' }}>
                          {latestServiceDate}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748B', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {latestServiceDesc}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px' }}>
                        <span
                          style={{
                            background: statusBg,
                            color: statusColor,
                            padding: '3px 9px',
                            borderRadius: '12px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: statusColor,
                            }}
                          />
                          {statusLabel}
                        </span>
                      </td>

                      {/* History Action */}
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/garage/vehicles/${vehicle._id}`)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#0056A2',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>View History</span>
                          <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid #E2E8F0',
            fontSize: '12.5px',
            color: '#64748B',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <span>
            Showing 1-{filteredVehicles.length} of {vehicles.length} vehicles
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              disabled
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '5px 12px',
                color: '#94A3B8',
                fontSize: '12px',
                cursor: 'not-allowed',
              }}
            >
              Previous
            </button>
            <span style={{ fontWeight: 600, color: '#0A1128' }}>Page 1 of 1</span>
            <button
              type="button"
              disabled
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '5px 12px',
                color: '#94A3B8',
                fontSize: '12px',
                cursor: 'not-allowed',
              }}
            >
              Next
            </button>
          </div>
        </div>

        {/* Informational Guidance Notice */}
        <div
          style={{
            marginTop: '20px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            color: '#475569',
            fontSize: '12.5px',
            lineHeight: '18px',
          }}
        >
          <Info size={16} style={{ color: '#0056A2', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#0A1128' }}>One vehicle, a complete service story.</strong> Choose View History to see dated maintenance, odometer readings, providers and verified receipts. Pending links need owner confirmation.
          </div>
        </div>
      </section>
    </GarageLayout>
  );
};

export default GarageVehiclesPage;
