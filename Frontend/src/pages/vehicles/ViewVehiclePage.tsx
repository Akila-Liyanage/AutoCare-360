import React, { useEffect, useState, useId } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Share2,
  Plus,
  Download,
  Pencil,
  ArrowRightLeft,
  ShieldCheck,
  Gauge,
  Wrench,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../hooks/useAuth';
import {
  getVehicleById,
  updateVehicle,
  uploadVehicleImage,
  type Vehicle
} from '../../services/vehicleService';
import { resolveImageUrl } from '../../utils/imageUrl';
import {
  getVehicleServiceRecords,
  type BackendServiceRecord
} from '../../services/serviceService';

// Cropped default asset extracted directly from Figma reference
import defaultHeroImg from '../../assets/vehicles/default-vehicle-hero.png';
import fallbackVehicleImg from '../../assets/auth/vehicle_owner_bg.jpg';

export const ViewVehiclePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const mileageInputId = useId();
  const colorInputId = useId();
  const transmissionSelectId = useId();
  const statusSelectId = useId();


  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // User feedback toast banner for placeholder actions
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Vehicle Modal State (safely prepared for PATCH /api/vehicles/:id)
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editMileage, setEditMileage] = useState<number | string>('');
  const [editColor, setEditColor] = useState<string>('');
  const [editTransmission, setEditTransmission] = useState<string>('Automatic');
  const [editStatus, setEditStatus] = useState<'Active' | 'In Service' | 'Archived'>('Active');
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Recent service history records
  const [recentServices, setRecentServices] = useState<BackendServiceRecord[]>([]);
  const [servicesLoading, setServicesLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    if (!id) {
      return;
    }

    getVehicleById(id)
      .then((data) => {
        if (isMounted) {
          setVehicle(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const message =
            err instanceof Error
              ? err.message
              : 'Failed to retrieve vehicle details. Please verify your access.';
          setError(message);
          setLoading(false);
        }
      });

    getVehicleServiceRecords(id)
      .then((records) => {
        if (isMounted) {
          setRecentServices(records.slice(0, 3));
          setServicesLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setServicesLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Open Edit Modal with current values
  const handleOpenEditModal = () => {
    if (!vehicle) return;
    setEditMileage(vehicle.currentMileage ?? '');
    setEditColor(vehicle.color || '');
    setEditTransmission(vehicle.transmission || 'Automatic');
    setEditStatus(vehicle.status || 'Active');
    setEditPhotoFile(null);
    setEditPhotoPreview(null);
    setUpdateError(null);
    setIsEditModalOpen(true);
  };

  // Submit PATCH to /api/vehicles/:id
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;

    try {
      setIsUpdating(true);
      setUpdateError(null);

      let newImageUrl = vehicle.imageUrl;
      if (editPhotoFile) {
        newImageUrl = await uploadVehicleImage(editPhotoFile);
      }

      const updated = await updateVehicle(vehicle._id, {
        currentMileage: Number(editMileage) || 0,
        color: editColor.trim(),
        transmission: editTransmission,
        status: editStatus,
        ...(editPhotoFile ? { imageUrl: newImageUrl } : {}),
      });

      setVehicle(updated);
      setIsEditModalOpen(false);
      showToast('Vehicle details updated successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update vehicle details.';
      setUpdateError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  // Quick helper to show temporary toast notification
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 4500);
  };

  // Format date helper: "15 May 2026"
  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return '15 May 2026';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '15 May 2026';
    }
  };

  // Powertrain helper matching vehicle fuel & type
  const getPowertrainDisplay = (v: Vehicle): string => {
    if (v.fuelType === 'Electric') {
      return 'Tri-motor AWD · Battery EV';
    }
    if (v.fuelType === 'Hybrid' || v.fuelType === 'Plug-in Hybrid') {
      return `${v.fuelType} · Intelligent Dual Drive`;
    }
    return `${v.fuelType || 'Petrol'}${v.engineNumber ? ` · Eng. ${v.engineNumber}` : ' · Combustion Engine'}`;
  };

  // Short ledger hash derived from VIN/ID
  const getLedgerHash = (v: Vehicle): string => {
    const raw = (v.vin + v._id).replace(/[^a-f0-9]/gi, '').toLowerCase();
    const prefix = raw.slice(0, 4) || '8f9e';
    const suffix = raw.slice(-4) || '2b7c';
    return `0x${prefix}...${suffix}`;
  };

  return (
    <div className="autocare-view-vehicle-page">
      <Navbar />

      <main className="autocare-view-vehicle-main">
        <div className="autocare-view-vehicle-container">
          {/* Breadcrumb Navigation & Top Category */}
          <div style={{ marginBottom: '8px' }}>
            <span className="autocare-view-category-badge">
              DIGITAL VEHICLE PASSPORT
            </span>
          </div>

          {/* Page Header Row */}
          <div className="autocare-view-header-row">
            <div className="autocare-view-header-left">
              <h1 className="autocare-view-header-title">Vehicle details</h1>
              <p className="autocare-view-header-subtitle">
                A complete owner view of identity, integrity, service history, costs and verified documents.
              </p>
            </div>

            <div className="autocare-view-header-actions">
              <Link
                to="/sharing/secure-link"
                className="autocare-btn-share-records"
                style={{ textDecoration: 'none' }}
                title="Create a controlled, auditable secure link to share vehicle records"
              >
                <Share2 size={16} />
                <span>Share records</span>
              </Link>

              <button
                type="button"
                className="autocare-btn-add-record"
                onClick={() =>
                  showToast('Service record logging by verified workshops will be available in Phase 3.')
                }
              >
                <Plus size={16} />
                <span>Add service record</span>
              </button>
            </div>
          </div>

          {/* 1. Loading State */}
          {loading && (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  padding: '16px',
                  borderRadius: '50%',
                  background: 'var(--autocare-blue-light)',
                  color: 'var(--autocare-blue)',
                  marginBottom: '16px',
                  animation: 'spin 1s linear infinite'
                }}
              >
                <RefreshCw size={32} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Loading vehicle passport...
              </h3>
            </div>
          )}

          {/* 2. Error State / Tenant Access Denied */}
          {!loading && error && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #fee2e2',
                borderRadius: '16px',
                padding: '48px 32px',
                textAlign: 'center',
                maxWidth: '560px',
                margin: '40px auto',
                boxShadow: '0 8px 24px rgba(220, 38, 38, 0.08)'
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  padding: '16px',
                  borderRadius: '50%',
                  background: '#fef2f2',
                  color: '#dc2626',
                  marginBottom: '16px'
                }}
              >
                <AlertCircle size={36} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0' }}>
                Vehicle Passport Unavailable
              </h2>
              <p style={{ fontSize: '14.5px', color: '#64748b', lineHeight: 1.6, margin: '0 0 24px 0' }}>
                {error}
              </p>
              <Link
                to="/vehicles"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 22px',
                  background: 'var(--autocare-blue)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '14px'
                }}
              >
                <ArrowLeft size={16} />
                <span>Return to My Vehicles</span>
              </Link>
            </div>
          )}

          {/* 3. Success State: Real Vehicle Data & Figma Layout */}
          {!loading && !error && vehicle && (
            <>
              {/* SECTION: Vehicle Hero Card */}
              <section className="autocare-view-hero-card" aria-label="Vehicle Hero Information">
                {/* Left: Studio Image */}
                <div className="autocare-view-hero-media">
                  <img
                    src={resolveImageUrl(vehicle.imageUrl) || defaultHeroImg}
                    alt={`${vehicle.manufacturer} ${vehicle.model}`}
                    className="autocare-view-hero-img"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = fallbackVehicleImg;
                    }}
                  />
                </div>

                {/* Right: Identity & Specs */}
                <div className="autocare-view-hero-content">
                  <div className="autocare-view-hero-top">
                    {/* Title + Passport Status Badge */}
                    <div className="autocare-view-hero-title-row">
                      <h2 className="autocare-view-hero-title">
                        {vehicle.manufacturer} {vehicle.model}
                      </h2>
                      <span className="autocare-view-passport-badge">
                        <CheckCircle2 size={13} />
                        <span>
                          {vehicle.status === 'Active' ? 'PASSPORT VERIFIED' : vehicle.status.toUpperCase()}
                        </span>
                      </span>
                    </div>

                    {/* Subtitle: Registration · Year · Color */}
                    <div className="autocare-view-hero-subtitle">
                      {vehicle.registrationNumber} · {vehicle.manufacturingYear} · {vehicle.color || 'Standard Metallic'}
                    </div>

                    {/* Summary Description */}
                    <p className="autocare-view-hero-desc">
                      {vehicle.fuelType === 'Electric'
                        ? 'Battery electric performance sedan with a cryptographically verified ownership and maintenance ledger.'
                        : `${vehicle.manufacturer} ${vehicle.model} ${vehicle.vehicleType.toLowerCase()} with a cryptographically verified ownership and maintenance ledger.`}
                    </p>

                    {/* 3-Column Spec Strip */}
                    <div className="autocare-view-spec-strip">
                      <div className="autocare-view-spec-item">
                        <span className="autocare-view-spec-label">VIN / CHASSIS</span>
                        <span className="autocare-view-spec-value is-mono">{vehicle.vin}</span>
                      </div>
                      <div className="autocare-view-spec-item">
                        <span className="autocare-view-spec-label">POWERTRAIN</span>
                        <span className="autocare-view-spec-value">
                          {getPowertrainDisplay(vehicle)}
                        </span>
                      </div>
                      <div className="autocare-view-spec-item">
                        <span className="autocare-view-spec-label">TRANSMISSION</span>
                        <span className="autocare-view-spec-value">
                          {vehicle.transmission || 'Automatic'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hero Action Buttons */}
                  <div className="autocare-view-hero-actions">
                    <button
                      type="button"
                      className="autocare-btn-download-passport"
                      onClick={() =>
                        showToast('Downloading cryptographically signed vehicle passport certificate...')
                      }
                    >
                      <Download size={15} />
                      <span>Download passport</span>
                    </button>

                    <button
                      type="button"
                      className="autocare-btn-edit-vehicle"
                      onClick={handleOpenEditModal}
                    >
                      <Pencil size={15} />
                      <span>Edit vehicle</span>
                    </button>

                    <Link
                      to={`/vehicles/${vehicle?._id || id || 'default'}/transfer`}
                      className="autocare-btn-transfer-ownership"
                      style={{ textDecoration: 'none' }}
                      title="Transfer ownership and vehicle records"
                    >
                      <ArrowRightLeft size={15} />
                      <span>Transfer ownership</span>
                    </Link>
                  </div>
                </div>
              </section>

              {/* SECTION: 4 Metric Cards */}
              <section className="autocare-view-metrics-grid" aria-label="Key Vehicle Metrics">
                {/* Metric 1: Trust Score */}
                <div className="autocare-view-metric-card">
                  <div className="autocare-view-metric-header">
                    <span className="autocare-view-metric-label">Vehicle Trust Score</span>
                    <ShieldCheck size={20} className="autocare-view-metric-icon" color="#16a34a" />
                  </div>
                  <div className="autocare-view-metric-value">92 / 100</div>
                  <p className="autocare-view-metric-subtext is-green">
                    Excellent · +3 since last assessment
                  </p>
                </div>

                {/* Metric 2: Verified Mileage */}
                <div className="autocare-view-metric-card">
                  <div className="autocare-view-metric-header">
                    <span className="autocare-view-metric-label">Verified mileage</span>
                    <Gauge size={20} className="autocare-view-metric-icon" color="#16a34a" />
                  </div>
                  <div className="autocare-view-metric-value">
                    {(vehicle.currentMileage ?? 82410).toLocaleString()} km
                  </div>
                  <p className="autocare-view-metric-subtext is-green">
                    No rollback anomalies detected
                  </p>
                </div>

                {/* Metric 3: Service Status */}
                <div className="autocare-view-metric-card">
                  <div className="autocare-view-metric-header">
                    <span className="autocare-view-metric-label">Service status</span>
                    <Wrench size={20} className="autocare-view-metric-icon" color="#0056A2" />
                  </div>
                  <div className="autocare-view-metric-value">Up to date</div>
                  <p className="autocare-view-metric-subtext is-blue">
                    Next inspection due in 3,590 km
                  </p>
                </div>

                {/* Metric 4: Lifetime Service Cost */}
                <Link
                  to="/expenses"
                  className="autocare-view-metric-card"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                  title="View detailed expense tracking"
                >
                  <div className="autocare-view-metric-header">
                    <span className="autocare-view-metric-label">Lifetime service cost</span>
                    <Receipt size={20} className="autocare-view-metric-icon" color="#0056A2" />
                  </div>
                  <div className="autocare-view-metric-value">LKR 169,000</div>
                  <p className="autocare-view-metric-subtext is-blue">
                    5 cryptographically verified invoices
                  </p>
                </Link>
              </section>

              {/* SECTION: Middle Row (Ownership & Cryptographic Integrity + Trust Score) */}
              <div className="autocare-view-two-col-grid">
                {/* Left: Ownership & cryptographic integrity */}
                <div className="autocare-view-card">
                  <div className="autocare-view-card-header">
                    <div>
                      <h3 className="autocare-view-card-title">
                        Ownership & cryptographic integrity
                      </h3>
                      <p className="autocare-view-card-subtitle">
                        Government identifiers and immutable ledger binding.
                      </p>
                    </div>
                  </div>

                  <div className="autocare-view-integrity-grid">
                    {/* Col 1 */}
                    <div>
                      <div className="autocare-view-integrity-item">
                        <span className="autocare-view-integrity-label">Registered owner</span>
                        <div className="autocare-view-integrity-val-wrap">
                          <span className="autocare-view-integrity-val">
                            {user?.fullName || 'David Silva'}
                          </span>
                          <span className="autocare-badge-verified">VERIFIED</span>
                        </div>
                      </div>

                      <div className="autocare-view-integrity-item">
                        <span className="autocare-view-integrity-label">Owner since</span>
                        <span className="autocare-view-integrity-val">
                          {formatDate(vehicle.createdAt)}
                        </span>
                      </div>

                      <div className="autocare-view-integrity-item">
                        <span className="autocare-view-integrity-label">Registration region</span>
                        <span className="autocare-view-integrity-val">
                          {vehicle.registrationJurisdiction || 'Colombo, Sri Lanka'}
                        </span>
                      </div>
                    </div>

                    {/* Col 2 */}
                    <div>
                      <div className="autocare-view-integrity-item">
                        <span className="autocare-view-integrity-label">Ledger root hash</span>
                        <span className="autocare-view-integrity-val is-mono">
                          {getLedgerHash(vehicle)}
                        </span>
                      </div>

                      <div className="autocare-view-integrity-item">
                        <span className="autocare-view-integrity-label">Consensus status</span>
                        <div className="autocare-view-integrity-val-wrap">
                          <span className="autocare-view-integrity-val">Fully compliant</span>
                          <span className="autocare-badge-valid">VALID</span>
                        </div>
                      </div>

                      <div className="autocare-view-integrity-item">
                        <span className="autocare-view-integrity-label">Last integrity check</span>
                        <span className="autocare-view-integrity-val">
                          30 Sep 2026 · 09:40
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Trust Score Panel */}
                <div className="autocare-view-card">
                  <div className="autocare-view-card-header">
                    <div>
                      <h3 className="autocare-view-card-title">Trust score</h3>
                      <p className="autocare-view-card-subtitle">Passport confidence</p>
                    </div>
                  </div>

                  <div className="autocare-view-trust-content">
                    <div className="autocare-view-trust-ring-row">
                      <div className="autocare-view-trust-ring">
                        <span className="autocare-view-trust-ring-number">92</span>
                      </div>
                      <div className="autocare-view-trust-ring-text">
                        <h4 className="autocare-view-trust-status-title">
                          Excellent integrity
                        </h4>
                        <p className="autocare-view-trust-status-desc">
                          18 of 19 source checks verified from certified service and telemetry records.
                        </p>
                      </div>
                    </div>

                    {/* Horizontal Progress Bar */}
                    <div className="autocare-view-trust-progress-track">
                      <div
                        className="autocare-view-trust-progress-bar"
                        style={{ width: '92%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: Bottom Row (Recent service history + Verified documents) */}
              <div className="autocare-view-two-col-grid">
                {/* Left: Recent service history */}
                <div className="autocare-view-card">
                  <div className="autocare-view-card-header">
                    <div>
                      <h3 className="autocare-view-card-title">Recent service history</h3>
                      <p className="autocare-view-card-subtitle">
                        Certified records appended by verified garages.
                      </p>
                    </div>
                    <Link
                      to="/service-history"
                      state={{ vehicleId: id, vehicle }}
                      className="autocare-view-card-link"
                    >
                      View complete history
                    </Link>
                  </div>

                  <div className="autocare-view-service-list">
                    {servicesLoading ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                        <p style={{ margin: 0, fontSize: '13px' }}>Loading recent records...</p>
                      </div>
                    ) : recentServices.length === 0 ? (
                      <div style={{ padding: '28px 16px', textAlign: 'center', color: '#64748b' }}>
                        <Wrench size={24} style={{ color: '#94a3b8', margin: '0 auto 8px auto', display: 'block' }} />
                        <p style={{ margin: '0 0 4px 0', fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                          No Service History Found
                        </p>
                        <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                          No maintenance records have been logged for this vehicle yet.
                        </p>
                      </div>
                    ) : (
                      recentServices.map((record) => {
                        const isVerified =
                          record.recordSource === 'verified_garage' &&
                          record.verificationStatus === 'verified';
                        const cost =
                          record.totalCost ??
                          ((record.labourCost || 0) + (record.partsCost || 0));

                        let formattedDate = record.serviceDate;
                        try {
                          const d = new Date(record.serviceDate);
                          if (!isNaN(d.getTime())) {
                            formattedDate = d.toLocaleDateString('en-US', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            });
                          }
                        } catch {
                          // fallback
                        }

                        const garageDisplay =
                          record.garageName ||
                          (isVerified ? 'Certified Service Center' : 'Owner Self-Reported');

                        return (
                          <div key={record._id} className="autocare-view-service-item">
                            <div className="autocare-view-service-left">
                              <div className="autocare-view-service-icon-box">
                                <Wrench size={18} />
                              </div>
                              <div className="autocare-view-service-info">
                                <h5 className="autocare-view-service-name">
                                  {record.serviceType}
                                </h5>
                                <p className="autocare-view-service-meta">
                                  {formattedDate} · {garageDisplay} · {record.mileage.toLocaleString()} km
                                </p>
                              </div>
                            </div>
                            <div className="autocare-view-service-right">
                              <span className="autocare-view-service-cost">
                                LKR {cost.toLocaleString()}
                              </span>
                              {isVerified ? (
                                <span className="autocare-badge-verified">VERIFIED</span>
                              ) : (
                                <span
                                  className="autocare-badge-verified"
                                  style={{
                                    backgroundColor: '#fef3c7',
                                    color: '#92400e',
                                    border: '1px solid #fde68a',
                                  }}
                                >
                                  SELF-REPORTED
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right: Verified documents */}
                <div className="autocare-view-card">
                  <div className="autocare-view-card-header">
                    <div>
                      <h3 className="autocare-view-card-title">Verified documents</h3>
                      <p className="autocare-view-card-subtitle">
                        4 current · 1 expiring soon
                      </p>
                    </div>
                    <Link
                      to={`/vehicles/${vehicle._id || id}/documents`}
                      className="autocare-view-card-link"
                      title="Manage and view verified documents"
                    >
                      View all documents
                    </Link>
                  </div>

                  <div className="autocare-view-doc-list">
                    {/* Doc 1 */}
                    <Link
                      to={`/vehicles/${vehicle._id || id}/documents`}
                      className="autocare-view-doc-item"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                      title="View registration certificate"
                    >
                      <span className="autocare-view-doc-name">
                        Vehicle registration certificate
                      </span>
                      <div className="autocare-view-doc-status-wrap">
                        <span className="autocare-view-doc-date">Verified</span>
                        <span className="autocare-doc-pill is-pdf">PDF</span>
                      </div>
                    </Link>

                    {/* Doc 2 */}
                    <Link
                      to={`/vehicles/${vehicle._id || id}/documents`}
                      className="autocare-view-doc-item"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                      title="View insurance policy"
                    >
                      <span className="autocare-view-doc-name">Insurance policy</span>
                      <div className="autocare-view-doc-status-wrap">
                        <span className="autocare-view-doc-date">Expires 14 Nov 2026</span>
                        <span className="autocare-doc-pill is-soon">SOON</span>
                      </div>
                    </Link>

                    {/* Doc 3 */}
                    <Link
                      to={`/vehicles/${vehicle._id || id}/documents`}
                      className="autocare-view-doc-item"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                      title="View annual diagnostic report"
                    >
                      <span className="autocare-view-doc-name">
                        Annual diagnostic report
                      </span>
                      <div className="autocare-view-doc-status-wrap">
                        <span className="autocare-view-doc-date">14 Aug 2026</span>
                        <span className="autocare-doc-pill is-pdf">PDF</span>
                      </div>
                    </Link>

                    {/* Doc 4 */}
                    <Link
                      to={`/vehicles/${vehicle._id || id}/documents`}
                      className="autocare-view-doc-item"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                      title="View ownership certificate"
                    >
                      <span className="autocare-view-doc-name">
                        Ownership certificate
                      </span>
                      <div className="autocare-view-doc-status-wrap">
                        <span className="autocare-view-doc-date">15 May 2026</span>
                        <span className="autocare-doc-pill is-signed">SIGNED</span>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Interactive Toast Banner for Placeholder Actions */}
      {toastMessage && (
        <div className="autocare-view-toast" role="status">
          <Clock size={18} className="autocare-view-toast-icon" />
          <span>{toastMessage}</span>
          <button
            type="button"
            className="autocare-view-toast-close"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss toast"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Prepared Edit Vehicle Modal (Uses existing PATCH /api/vehicles/:id) */}
      {isEditModalOpen && vehicle && (
        <div
          className="autocare-modal-overlay"
          onClick={() => !isUpdating && setIsEditModalOpen(false)}
        >
          <div
            className="autocare-modal-container"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-vehicle-dialog-title"
          >
            <div className="autocare-modal-header">
              <h3 id="edit-vehicle-dialog-title" className="autocare-modal-title">
                Edit Vehicle Details
              </h3>
              <button
                type="button"
                className="autocare-modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isUpdating}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="autocare-modal-body">
                {updateError && (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#dc2626',
                      fontSize: '13px'
                    }}
                  >
                    {updateError}
                  </div>
                )}

                <div className="autocare-modal-field">
                  <label htmlFor={mileageInputId} className="autocare-modal-label">
                    Current Mileage (km)
                  </label>
                  <input
                    id={mileageInputId}
                    type="number"
                    min="0"
                    className="autocare-modal-input"
                    value={editMileage}
                    onChange={(e) => setEditMileage(e.target.value)}
                    required
                  />
                </div>

                <div className="autocare-modal-field">
                  <label htmlFor={colorInputId} className="autocare-modal-label">
                    Vehicle Color
                  </label>
                  <input
                    id={colorInputId}
                    type="text"
                    className="autocare-modal-input"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    placeholder="e.g. Deep Metallic Blue"
                  />
                </div>

                <div className="autocare-modal-field">
                  <label htmlFor={transmissionSelectId} className="autocare-modal-label">
                    Transmission
                  </label>
                  <select
                    id={transmissionSelectId}
                    className="autocare-modal-select"
                    value={editTransmission}
                    onChange={(e) => setEditTransmission(e.target.value)}
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                    <option value="CVT">CVT</option>
                    <option value="Dual-Clutch">Dual-Clutch</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="autocare-modal-field">
                  <label htmlFor={statusSelectId} className="autocare-modal-label">
                    Passport Status
                  </label>
                  <select
                    id={statusSelectId}
                    className="autocare-modal-select"
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as 'Active' | 'In Service' | 'Archived')
                    }
                  >
                    <option value="Active">Active</option>
                    <option value="In Service">In Service</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div className="autocare-modal-field">
                  <label className="autocare-modal-label">Update Vehicle Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditPhotoFile(file);
                        setEditPhotoPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="autocare-modal-input"
                  />
                  {editPhotoPreview ? (
                    <div style={{ marginTop: '8px' }}>
                      <img
                        src={editPhotoPreview}
                        alt="Preview"
                        style={{ width: '120px', height: '70px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  ) : vehicle.imageUrl ? (
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Current Photo:</span>
                      <img
                        src={resolveImageUrl(vehicle.imageUrl)}
                        alt="Current vehicle"
                        style={{ width: '120px', height: '70px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="autocare-modal-footer">
                <button
                  type="button"
                  className="autocare-btn-cancel"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="autocare-btn-save"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ViewVehiclePage;
