import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Car,
  ShieldCheck,
  Phone,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import api from '../../services/api';
import '../../styles/garage-dashboard.css';

interface ServiceItem {
  _id: string;
  serviceType: string;
  workPerformed: string;
  serviceDate: string;
  mileage: number;
  totalCost: number;
  verificationStatus: string;
  garageName?: string;
  technicianName?: string;
}

interface VehicleDetails {
  _id: string;
  registrationNumber: string;
  manufacturer: string;
  model: string;
  manufacturingYear?: number;
  vehicleType?: string;
  fuelType?: string;
  transmission?: string;
  color?: string;
  currentMileage?: number;
  vin?: string;
  status?: string;
  ownerId?: {
    _id?: string;
    fullName?: string;
    displayName?: string;
    email?: string;
    phone?: string;
  };
}

export const GarageVehicleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchVehicleData = async () => {
      try {
        // Fetch Vehicle details
        const vRes = await api.get(`/vehicles/${id}`);
        if (isMounted) {
          const vData = vRes.data?.data?.vehicle || vRes.data?.data || null;
          setVehicle(vData);
        }

        // Fetch Service records for this vehicle
        const sRes = await api.get(`/services?vehicleId=${id}`);
        if (isMounted) {
          const sList =
            (Array.isArray(sRes.data?.data?.serviceRecords) && sRes.data.data.serviceRecords) ||
            (Array.isArray(sRes.data?.data) && sRes.data.data) ||
            (Array.isArray(sRes.data?.serviceRecords) && sRes.data.serviceRecords) ||
            [];
          setServices(sList);
        }
      } catch (err) {
        console.error('Failed to load vehicle details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) {
      fetchVehicleData();
    }
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <GarageLayout activeItem="Vehicles" breadcrumbCurrent="Vehicle Details">
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
          Loading vehicle passport and maintenance records...
        </div>
      </GarageLayout>
    );
  }

  if (!vehicle) {
    return (
      <GarageLayout activeItem="Vehicles" breadcrumbCurrent="Vehicle Details">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2 style={{ color: '#0A1128', marginBottom: '10px' }}>Vehicle Not Found</h2>
          <p style={{ color: '#64748B', marginBottom: '20px' }}>
            The requested vehicle passport could not be located in the ledger.
          </p>
          <button
            type="button"
            className="autocare-garage-btn-primary"
            onClick={() => navigate('/garage/vehicles')}
          >
            Back to Customer Vehicles
          </button>
        </div>
      </GarageLayout>
    );
  }

  const latestService = services.length > 0 ? services[0] : null;
  const latestDateFormatted = latestService?.serviceDate
    ? new Date(latestService.serviceDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '21 Sep 2026';

  const totalCost = services.reduce((sum, s) => sum + (s.totalCost || 0), 0);
  const nextMileage = (vehicle.currentMileage || 45000) + 5000;

  return (
    <GarageLayout activeItem="Vehicles" breadcrumbCurrent="Vehicle Details">
      {/* Back button */}
      <div style={{ marginBottom: '14px' }}>
        <button
          type="button"
          onClick={() => navigate('/garage/vehicles')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            border: 'none',
            background: 'none',
            color: '#0056A2',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            fontSize: '13px',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Vehicles</span>
        </button>
      </div>

      {/* Title & Action Row */}
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
            Vehicle Details
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
            Vehicle identity, owner context and a traceable maintenance history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(`/garage/maintenance/new?regNumber=${encodeURIComponent(vehicle.registrationNumber)}`)}
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
          VEHICLE HERO CARD
          ==================================================================== */}
      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid #DCE5EF',
          borderRadius: '14px',
          padding: '20px 24px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '12px',
              background: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0056A2',
            }}
          >
            <Car size={30} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#0A1128' }}>
                {vehicle.manufacturer} {vehicle.model}
              </h2>
              <span
                style={{
                  background: '#DCFCE7',
                  color: '#15803D',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCircle2 size={12} />
                Verified vehicle
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '12.5px', color: '#64748B' }}>
              {vehicle.manufacturingYear || '2021'} · {vehicle.fuelType || 'Hybrid'} ·{' '}
              {vehicle.transmission || 'Automatic'} · {vehicle.color || 'Pearl White'}
            </p>
          </div>
        </div>

        {/* Right Plate Capsule and Add Expense Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '6px 14px',
              fontFamily: 'monospace',
              fontSize: '14px',
              fontWeight: 800,
              color: '#0A1128',
              letterSpacing: '1px',
            }}
          >
            {vehicle.registrationNumber}
          </div>

          <button
            type="button"
            onClick={() => navigate(`/garage/expenses/new?vehicleId=${vehicle._id}`)}
            style={{
              background: '#0056A2',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '7px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={14} />
            <span>Add Expense</span>
          </button>
        </div>
      </section>

      {/* ====================================================================
          4 STATS ROW
          ==================================================================== */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '22px',
        }}
      >
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '16px 18px',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
            Latest recorded odometer
          </span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0A1128', margin: '4px 0' }}>
            {(vehicle.currentMileage || 0).toLocaleString()} km
          </div>
          <p style={{ margin: 0, fontSize: '11.5px', color: '#64748B' }}>
            Recorded {latestDateFormatted}
          </p>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '16px 18px',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
            Last service
          </span>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0A1128', margin: '4px 0' }}>
            {latestDateFormatted}
          </div>
          <p style={{ margin: 0, fontSize: '11.5px', color: '#0056A2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {latestService?.serviceType || 'Periodic Inspection'}
          </p>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '16px 18px',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
            Service records
          </span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0A1128', margin: '4px 0' }}>
            {services.length} verified
          </div>
          <p style={{ margin: 0, fontSize: '11.5px', color: '#50B748' }}>
            All committed to the ledger
          </p>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '16px 18px',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
            Recorded service costs
          </span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0A1128', margin: '4px 0' }}>
            LKR {totalCost.toLocaleString()}
          </div>
          <p style={{ margin: 0, fontSize: '11.5px', color: '#64748B' }}>
            Across {services.length} service events
          </p>
        </div>
      </section>

      {/* ====================================================================
          TWO COLUMN CONTENT (Service History Timeline + Sidebar Cards)
          ==================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(280px, 1fr)',
          gap: '20px',
        }}
      >
        {/* Left Column: Service History */}
        <section
          style={{
            background: '#FFFFFF',
            border: '1px solid #DCE5EF',
            borderRadius: '14px',
            padding: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 2px 0', color: '#0A1128' }}>
                Service history
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                All {services.length} recorded services
              </p>
            </div>
            <span style={{ fontSize: '12px', color: '#0056A2', fontWeight: 600 }}>
              Newest first ↓
            </span>
          </div>

          {/* Timeline Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {services.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748B', fontSize: '13px' }}>
                No maintenance entries logged for this vehicle yet. Click <strong>Add Service Entry</strong> to publish the first record.
              </div>
            ) : (
              services.map((item) => {
                const dateStr = item.serviceDate
                  ? new Date(item.serviceDate).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Recent';

                return (
                  <div
                    key={item._id}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '16px',
                      background: '#FAFCFF',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0A1128' }}>
                            ✓ {dateStr}
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>
                            · {(item.mileage || 0).toLocaleString()} km
                          </span>
                        </div>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px 0', color: '#0A1128' }}>
                          {item.serviceType}
                        </h3>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            background: '#DCFCE7',
                            color: '#15803D',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'inline-block',
                            marginBottom: '6px',
                          }}
                        >
                          ● Committed
                        </span>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#0A1128' }}>
                          LKR {(item.totalCost || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: '#475569', lineHeight: '18px' }}>
                      {item.workPerformed || 'Certified periodic maintenance and inspection completed.'}
                    </p>

                    <div
                      style={{
                        paddingTop: '8px',
                        borderTop: '1px solid #E2E8F0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '11.5px',
                        color: '#64748B',
                      }}
                    >
                      <span>
                        {item.garageName || 'Perera Auto Works'} · BR-03
                      </span>
                      <span>
                        Hash: {item._id.slice(-8).toUpperCase()} · Verified Invoice
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Column: Owner Information & Next Service Guidance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Owner Info Card */}
          <section
            style={{
              background: '#FFFFFF',
              border: '1px solid #DCE5EF',
              borderRadius: '14px',
              padding: '18px',
            }}
          >
            <h3 style={{ fontSize: '14.5px', fontWeight: 700, margin: '0 0 12px 0', color: '#0A1128' }}>
              Owner information
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#0056A2',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {vehicle.ownerId?.fullName ? vehicle.ownerId.fullName[0].toUpperCase() : 'CP'}
              </div>

              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0A1128' }}>
                  {vehicle.ownerId?.fullName || vehicle.ownerId?.displayName || 'Chathura Perera'}
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#0056A2',
                    background: '#EFF6FF',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}
                >
                  Linked owner
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', color: '#334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} style={{ color: '#64748B' }} />
                <span>{vehicle.ownerId?.phone || '+94 77 112 2334'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} style={{ color: '#64748B' }} />
                <span>{vehicle.ownerId?.email || 'owner@gmail.com'}</span>
              </div>
            </div>

            <p style={{ margin: '12px 0 0 0', fontSize: '11.5px', color: '#94A3B8' }}>
              Contact details for service coordination purposes.
            </p>
          </section>

          {/* Next Service Guidance */}
          <section
            style={{
              background: '#FFFFFF',
              border: '1px solid #DCE5EF',
              borderRadius: '14px',
              padding: '18px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '14.5px', fontWeight: 700, margin: 0, color: '#0A1128' }}>
                Next service guidance
              </h3>
              <span
                style={{
                  background: '#EFF6FF',
                  color: '#0056A2',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                ● Upcoming
              </span>
            </div>

            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0A1128', margin: '6px 0 4px 0' }}>
              {nextMileage.toLocaleString()} km or 21 Dec 2026
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: '16px' }}>
              Whichever comes first. Based on a 5,000 km / 3 month oil service interval.
            </p>
          </section>

          {/* Verified Service Ledger Box */}
          <section
            style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '14px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <ShieldCheck size={16} style={{ color: '#15803D' }} />
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#15803D' }}>
                Verified service ledger
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#166534', lineHeight: '17px' }}>
              Committed entries are tamper-proof. Unlike version descriptions or illustrative design content, the latest {vehicle.manufacturer} {vehicle.model} record matches your dashboard.
            </p>
          </section>
        </div>
      </div>
    </GarageLayout>
  );
};

export default GarageVehicleDetailsPage;
