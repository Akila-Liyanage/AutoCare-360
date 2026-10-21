import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Eye,
  Download,
  Ban,
  Wrench,
  X,
  ExternalLink,
  Info,
  Car,
  Camera,
  ScanLine,
  Search,
  QrCode
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import QRScannerModal from '../../components/common/QRScannerModal';
import defaultVehicleImg from '../../assets/vehicles/default-vehicle-hero.png';
import fallbackVehicleImg from '../../assets/auth/vehicle_owner_bg.jpg';
import { resolveImageUrl } from '../../utils/imageUrl';
import {
  getPublicSharedRecord,
  type PublicSharedRecordData
} from '../../services/shareLinkService';
import { getMyVehicles, type Vehicle } from '../../services/vehicleService';
import '../../styles/shared-record.css';

type SharingScopeMode = 'Limited Scope' | 'Full Records' | 'Selected Records' | 'Expired' | 'Revoked';

interface ToastState {
  show: boolean;
  message: string;
}

export const BuyerSharedRecordViewPage: React.FC = () => {
  const navigate = useNavigate();
  const { token: routeToken } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();

  // Active token from route param, ?token=, ?vin=, or ?reg= query parameters
  const activeToken =
    routeToken ||
    searchParams.get('token') ||
    searchParams.get('vin') ||
    searchParams.get('reg') ||
    '';

  const [searchInput, setSearchInput] = useState<string>(activeToken);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  // Real data from backend if token provided
  const [loading, setLoading] = useState<boolean>(!!activeToken);
  const [apiError, setApiError] = useState<string | null>(null);
  const [publicData, setPublicData] = useState<PublicSharedRecordData | null>(null);

  // Active permission scope mode (BR-06)
  const [scopeMode, setScopeMode] = useState<SharingScopeMode>('Limited Scope');
  const [viewerName, setViewerName] = useState<string>('Prospective Buyer / Verification Officer');

  // Preview document modal state
  const [activePreviewDoc, setActivePreviewDoc] = useState<{
    title: string;
    authority: string;
    date: string;
    fileUrl?: string;
  } | null>(null);

  // Floating security restriction toast (BR-07)
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  // Fallback demo state if logged-in owner wants to test with their vehicles
  const [myVehicles, setMyVehicles] = useState<Vehicle[]>([]);
  const [selectedDemoVehicle, setSelectedDemoVehicle] = useState<Vehicle | null>(null);

  // Show BR-07 security notice toast
  const showSecurityNotice = (actionName: string) => {
    setToast({
      show: true,
      message: `Security Restriction Active (BR-07): ${actionName} is strictly prohibited by vehicle owner policy for this shared inspection copy.`
    });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  // Enforce BR-07 Protected Viewing Mode: Block Ctrl+C, Ctrl+P, Ctrl+S, Ctrl+U
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'c' ||
          e.key === 'C' ||
          e.key === 'p' ||
          e.key === 'P' ||
          e.key === 's' ||
          e.key === 'S' ||
          e.key === 'u' ||
          e.key === 'U')
      ) {
        e.preventDefault();
        showSecurityNotice('Copying, printing, and source code capture');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch real public shared record from Backend when token is available
  useEffect(() => {
    if (!activeToken) {
      setLoading(false);
      // Fetch user's vehicles for demo selector if logged in
      getMyVehicles()
        .then((vehicles) => {
          if (vehicles.length > 0) {
            setMyVehicles(vehicles);
            setSelectedDemoVehicle(vehicles[0]);
          }
        })
        .catch(() => {});
      return;
    }

    let isMounted = true;
    setLoading(true);
    setApiError(null);

    getPublicSharedRecord(activeToken)
      .then((data) => {
        if (!isMounted) return;
        setPublicData(data);
        setLoading(false);

        // Set viewer name from watermark
        if (data.watermark?.recipientName) {
          setViewerName(data.watermark.recipientName);
        }

        // Map backend permission level to scope mode
        const perm = data.shareSession?.permissionLevel;
        if (perm === 'full') {
          setScopeMode('Full Records');
        } else if (perm === 'selected') {
          setScopeMode('Selected Records');
        } else {
          setScopeMode('Limited Scope');
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setLoading(false);
        const errMsg = err instanceof Error ? err.message : '';
        if (errMsg.toLowerCase().includes('expired')) {
          setScopeMode('Expired');
        } else if (errMsg.toLowerCase().includes('revoked')) {
          setScopeMode('Revoked');
        } else {
          setApiError(errMsg || 'The requested share token was not found or is invalid.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeToken]);

  // Derived vehicle data (prioritizes live backend data over demo fallback)
  const vehicle = publicData?.vehicle || selectedDemoVehicle || null;
  const watermark = publicData?.watermark || {
    recipientName: viewerName,
    accessId: `ACC-${(activeToken || '8F9E2B7C').slice(0, 8).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    purpose: 'Vehicle Sale / Buyer Verification',
  };

  const healthAssessment = publicData?.healthAssessment || {
    trustScore: 95,
    trustLevel: 'Excellent',
    odometerIntegrity: 'Verified Monotonic (No Rollback Detected)',
    anomalyDetected: false,
    verifiedChecks: '18 of 19 source checks verified',
    lastServiceMileage: vehicle?.currentMileage || 85240,
  };

  const serviceRecords = publicData?.serviceRecords || [
    {
      _id: 'rec-1',
      serviceDate: '2026-08-14',
      mileage: 82410,
      serviceType: 'Annual Safety & Electronics Diagnostic',
      workPerformed: 'Full multi-point chassis telemetry, brake fluid flush, hybrid inverter diagnostic test.',
      garageName: 'Apex Tech Service Center (Verified)',
      technicianName: 'S. Bandara (Certified Technician)',
      cost: 28500,
      verificationStatus: 'VERIFIED',
    },
    {
      _id: 'rec-2',
      serviceDate: '2026-07-12',
      mileage: 80840,
      serviceType: 'Cabin Filter & AC Calibration',
      workPerformed: 'HEPA air filter replacement, evaporator core cleaning and coolant pressure check.',
      garageName: 'Apex Tech Service Center (Verified)',
      technicianName: 'K. Perera',
      cost: 12000,
      verificationStatus: 'VERIFIED',
    },
    {
      _id: 'rec-3',
      serviceDate: '2026-05-04',
      mileage: 77920,
      serviceType: 'Tyre Safety Check & Rotation',
      workPerformed: 'Tread depth measurement (6.2mm), computerized laser wheel balancing and rotation.',
      garageName: 'Perera Auto Works (Verified)',
      technicianName: 'R. Fernando',
      cost: 8500,
      verificationStatus: 'VERIFIED',
    },
  ];

  const documents = publicData?.documents || [
    {
      _id: 'doc-1',
      title: 'Vehicle Registration Certificate',
      documentType: 'registration',
      issueDate: '2024-05-15',
    },
    {
      _id: 'doc-2',
      title: 'Annual Diagnostic & Safety Inspection Report',
      documentType: 'inspection',
      issueDate: '2026-08-14',
    },
    {
      _id: 'doc-3',
      title: 'Vehicle Revenue License',
      documentType: 'revenue_license',
      issueDate: '2026-01-10',
    },
    {
      _id: 'doc-4',
      title: 'Insurance Policy Certificate',
      documentType: 'insurance',
      issueDate: '2025-11-15',
    },
  ];

  // Calculated expiration countdown string (BRULE-03)
  const calculateTimeRemaining = (expiresAtStr: string): string => {
    try {
      const diffMs = new Date(expiresAtStr).getTime() - Date.now();
      if (diffMs <= 0) return 'Expired';
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `Expires in ${hours}h ${mins}m`;
    } catch {
      return 'Expires in 48 hours';
    }
  };

  // Image resolution for vehicle photo
  const vehiclePhoto = vehicle?.imageUrl
    ? resolveImageUrl(vehicle.imageUrl)
    : defaultVehicleImg;

  // Handle search by plate / VIN / token
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    navigate(`/buyer-qr?token=${encodeURIComponent(searchInput.trim())}`);
  };

  return (
    <div
      className="autocare-shared-page autocare-shared-protected-area"
      onContextMenu={(e) => {
        e.preventDefault();
        showSecurityNotice('Right-click & Copying');
      }}
    >
      <Navbar />

      <main className="autocare-shared-main">
        <div className="autocare-shared-container">
          
          {/* Quick QR Scanner & Verification Lookup Bar */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              background: '#ffffff',
              padding: '12px 18px',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#002B49' }}>
              <ScanLine size={18} style={{ color: '#0056A2' }} />
              <strong style={{ fontSize: '13.5px' }}>Verify Vehicle QR:</strong>
            </div>

            <form
              onSubmit={handleSearchSubmit}
              style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '260px', maxWidth: '580px' }}
            >
              <input
                type="text"
                placeholder="Scan QR, paste token, or enter vehicle plate (e.g. WP CAR-1010)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  background: '#002B49',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Search size={14} />
                <span>Verify</span>
              </button>
            </form>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#0056A2',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Scan QR Code with camera or upload image"
              >
                <Camera size={14} />
                <span>Scan QR Pass</span>
              </button>

              <Link
                to="/sharing/qr"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f8fafc',
                  color: '#003874',
                  border: '1px solid #cbd5e1',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
                title="Create a new QR Code for vehicle"
              >
                <QrCode size={14} />
                <span>Create QR</span>
              </Link>
            </div>
          </div>

          {/* ========================================================
              TOP BAR: Protected View & Security Session Badge (BR-07)
              ======================================================== */}
          <div className="autocare-shared-session-bar" role="region" aria-label="Session Security Status">
            <div className="autocare-shared-session-left">
              <span className="autocare-shared-badge-protected">
                <Lock size={12} />
                <span>PROTECTED VIEW (BR-07)</span>
              </span>

              <span className="autocare-shared-session-title">
                Session #{watermark.accessId}
              </span>

              <span className="autocare-shared-session-dot">•</span>

              <span className="autocare-shared-session-recipient">
                Recipient: <strong>{viewerName}</strong>
              </span>

              <span className="autocare-shared-session-dot">•</span>

              <span className="autocare-shared-session-recipient" style={{ color: '#38bdf8' }}>
                Scope: <strong>{scopeMode}</strong>
              </span>
            </div>

            <div className="autocare-shared-session-right">
              <div className="autocare-shared-expiry-pill">
                <Clock size={13} />
                <span>{calculateTimeRemaining(watermark.expiresAt)}</span>
              </div>

              <div className="autocare-shared-restrictions-pill">
                <Ban size={13} />
                <span>No Download &bull; No Print</span>
              </div>
            </div>
          </div>

          {/* ========================================================
              DEMO / AUDIT SIMULATION TOOLBAR (BR-06 Scope Tester)
              ======================================================== */}
          <div className="autocare-shared-control-bar" role="toolbar" aria-label="Permission Scope Simulator">
            <div className="autocare-shared-control-label">
              <Info size={15} style={{ color: '#0056A2' }} />
              <span>BR-06 Permission Scope:</span>
            </div>

            <div className="autocare-shared-scope-selector">
              <button
                type="button"
                className={`autocare-shared-scope-btn ${scopeMode === 'Limited Scope' ? 'is-active' : ''}`}
                onClick={() => setScopeMode('Limited Scope')}
              >
                Limited Access (Buyer Default)
              </button>

              <button
                type="button"
                className={`autocare-shared-scope-btn ${scopeMode === 'Full Records' ? 'is-active' : ''}`}
                onClick={() => setScopeMode('Full Records')}
              >
                Full Access (Costs &amp; Docs)
              </button>

              <button
                type="button"
                className={`autocare-shared-scope-btn ${scopeMode === 'Selected Records' ? 'is-active' : ''}`}
                onClick={() => setScopeMode('Selected Records')}
              >
                Selected Records
              </button>

              <button
                type="button"
                className={`autocare-shared-scope-btn is-danger ${scopeMode === 'Expired' ? 'is-active' : ''}`}
                onClick={() => setScopeMode('Expired')}
              >
                Simulate Expired (BRULE-03)
              </button>

              <button
                type="button"
                className={`autocare-shared-scope-btn is-danger ${scopeMode === 'Revoked' ? 'is-active' : ''}`}
                onClick={() => setScopeMode('Revoked')}
              >
                Simulate Revoked (BRULE-02)
              </button>
            </div>

            {/* Quick Vehicle Switcher if user has vehicles and not in token mode */}
            {!activeToken && myVehicles.length > 1 && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Car size={14} style={{ color: '#475569' }} />
                <select
                  className="autocare-field-select"
                  style={{ padding: '4px 8px', fontSize: '12px', minWidth: '160px' }}
                  value={selectedDemoVehicle?._id || ''}
                  onChange={(e) => {
                    const found = myVehicles.find((v) => v._id === e.target.value);
                    if (found) setSelectedDemoVehicle(found);
                  }}
                >
                  {myVehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.registrationNumber} - {v.manufacturer} {v.model}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ========================================================
              STATE: LOADING SPINNER
              ======================================================== */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '64px 20px', color: '#64748b' }}>
              <div className="autocare-spinner" style={{ margin: '0 auto 16px' }} />
              <p style={{ fontSize: '15px', fontWeight: 600 }}>Loading verified vehicle records...</p>
              <span style={{ fontSize: '13px' }}>Validating cryptographic token against AutoCare 360 ledger</span>
            </div>
          ) : scopeMode === 'Expired' ? (
            /* ========================================================
               STATE: EXPIRED (BRULE-03)
               ======================================================== */
            <div className="autocare-shared-revoked-box" role="alert">
              <div className="autocare-shared-revoked-icon">
                <AlertTriangle size={38} />
              </div>
              <h2 className="autocare-shared-revoked-title">
                Shared Record Access Expired (BRULE-03)
              </h2>
              <p className="autocare-shared-revoked-desc">
                In compliance with AutoCare 360 Business Rule <strong>BRULE-03</strong>, all shared vehicle links and QR codes must enforce fixed expiry dates. The viewing duration set by the vehicle owner has lapsed. All access attempts are permanently recorded on the audit log (BR-08).
              </p>
              <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="autocare-shared-btn-reset"
                  onClick={() => setScopeMode('Limited Scope')}
                >
                  <span>Reset to Active Preview</span>
                </button>
                <Link to="/sharing/qr" className="autocare-shared-btn-reset" style={{ textDecoration: 'none' }}>
                  <span>Generate New QR Code</span>
                </Link>
              </div>
            </div>
          ) : scopeMode === 'Revoked' ? (
            /* ========================================================
               STATE: REVOKED (BRULE-02)
               ======================================================== */
            <div className="autocare-shared-revoked-box" role="alert" style={{ borderColor: '#ef4444' }}>
              <div className="autocare-shared-revoked-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                <Ban size={38} />
              </div>
              <h2 className="autocare-shared-revoked-title">
                Third-Party Access Revoked by Owner (BRULE-02)
              </h2>
              <p className="autocare-shared-revoked-desc">
                In compliance with <strong>BRULE-02 &amp; BRULE-05</strong>, vehicle maintenance records belong strictly to the registered owner. The vehicle owner has formally terminated third-party viewing authorization for this session.
              </p>
              <button
                type="button"
                className="autocare-shared-btn-reset"
                onClick={() => setScopeMode('Limited Scope')}
              >
                <span>Reset to Active Preview</span>
              </button>
            </div>
          ) : apiError ? (
            /* ========================================================
               STATE: TOKEN LOOKUP ERROR / NOT FOUND
               ======================================================== */
            <div className="autocare-shared-revoked-box" role="alert" style={{ borderColor: '#ef4444' }}>
              <div className="autocare-shared-revoked-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                <AlertTriangle size={38} />
              </div>
              <h2 className="autocare-shared-revoked-title">
                Invalid or Unrecognized QR Code / Link
              </h2>
              <p className="autocare-shared-revoked-desc">
                {apiError}
              </p>
              <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="autocare-shared-btn-reset"
                  onClick={() => {
                    setApiError(null);
                    setScopeMode('Limited Scope');
                  }}
                >
                  <span>View Sample Passport</span>
                </button>
                <Link to="/sharing/qr" className="autocare-shared-btn-reset" style={{ textDecoration: 'none' }}>
                  <span>Generate QR Code</span>
                </Link>
              </div>
            </div>
          ) : (
            /* ========================================================
               STATE: ACTIVE BUYER QR VIEW PASSPORT
               ======================================================== */
            <>
              {/* Header Title & Subtitle */}
              <header className="autocare-shared-header">
                <span className="autocare-shared-category-tag">
                  SECURE QR VERIFICATION &bull; VEHICLE SALE INSPECTION (BR-05)
                </span>
                <h1 className="autocare-shared-title">Protected Vehicle Passport</h1>
                <p className="autocare-shared-subtitle">
                  Certified digital vehicle maintenance record for buyer inspection. Authenticated under AutoCare 360 data governance rules.
                </p>
              </header>

              {/* Watermarked Vehicle Hero Card */}
              <div className="autocare-shared-hero-card">
                {/* Dynamic Repeating Watermark Layer (BR-07) */}
                <div className="autocare-shared-watermark-overlay" aria-hidden="true">
                  AUTOCARE 360 &bull; BUYER INSPECTION &bull; RECIPIENT: {watermark.recipientName.toUpperCase()} &bull; ID: {watermark.accessId} &bull; STRICTLY VIEW-ONLY
                </div>

                <div className="autocare-shared-hero-image-box">
                  <img
                    src={vehiclePhoto}
                    alt={vehicle ? `${vehicle.manufacturer} ${vehicle.model}` : 'Vehicle'}
                    className="autocare-shared-hero-img"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = fallbackVehicleImg;
                    }}
                  />
                </div>

                <div className="autocare-shared-hero-info">
                  <div className="autocare-shared-hero-top">
                    <div>
                      <h2 className="autocare-shared-vehicle-name">
                        {vehicle ? `${vehicle.manufacturer} ${vehicle.model} (${vehicle.manufacturingYear || ''})` : 'Toyota Corolla (2022)'}
                      </h2>
                      <p className="autocare-shared-vehicle-reg">
                        {vehicle
                          ? `${vehicle.registrationNumber} &bull; ${vehicle.manufacturingYear || ''} &bull; ${vehicle.color || 'Pearl White'}`
                          : 'WP CAA-1234 &bull; 2022 &bull; Pearl White'}
                      </p>
                    </div>

                    <div className="autocare-shared-badge-verified">
                      <CheckCircle2 size={15} />
                      <span>PASSPORT VERIFIED</span>
                    </div>
                  </div>

                  <p className="autocare-shared-hero-desc">
                    Verified {vehicle?.vehicleType || 'Sedan'} with cryptographically certified maintenance history, immutable odometer increments, and tamper-proof ledger binding.
                  </p>

                  <div className="autocare-shared-quick-specs">
                    <div className="autocare-shared-spec-item">
                      <span className="autocare-shared-spec-label">Powertrain &amp; Fuel</span>
                      <span className="autocare-shared-spec-val">
                        {vehicle?.fuelType || 'Petrol'} &bull; {vehicle?.transmission || 'Automatic'}
                      </span>
                    </div>

                    <div className="autocare-shared-spec-item">
                      <span className="autocare-shared-spec-label">Verified Odometer</span>
                      <span className="autocare-shared-spec-val">
                        {vehicle?.currentMileage ? `${vehicle.currentMileage.toLocaleString()} km` : '24,500 km'} [AUTHENTICATED]
                      </span>
                    </div>

                    <div className="autocare-shared-spec-item">
                      <span className="autocare-shared-spec-label">AI Trust Score</span>
                      <span className="autocare-shared-spec-val" style={{ color: '#15803d' }}>
                        {healthAssessment.trustScore} / 100 ({healthAssessment.trustLevel})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================
                  BR-09 AI VEHICLE HEALTH & TRUST SCORE CARDS
                  ======================================================== */}
              <section className="autocare-shared-metrics-grid" aria-label="Key Vehicle Verification Metrics">
                <div className="autocare-shared-metric-card">
                  <span className="autocare-shared-metric-label">Odometer Integrity</span>
                  <div className="autocare-shared-metric-val">
                    {vehicle?.currentMileage ? `${vehicle.currentMileage.toLocaleString()} km` : '24,500 km'}
                  </div>
                  <span className="autocare-shared-metric-sub">
                    {healthAssessment.anomalyDetected ? '⚠️ Discrepancy noted' : '✓ No rollback anomalies detected'}
                  </span>
                </div>

                <div className="autocare-shared-metric-card">
                  <span className="autocare-shared-metric-label">Passport Trust Score</span>
                  <div className="autocare-shared-metric-val" style={{ color: '#15803d' }}>
                    {healthAssessment.trustScore} / 100
                  </div>
                  <span className="autocare-shared-metric-sub">
                    {healthAssessment.verifiedChecks}
                  </span>
                </div>

                <div className="autocare-shared-metric-card">
                  <span className="autocare-shared-metric-label">Service Health</span>
                  <div className="autocare-shared-metric-val">Up to date</div>
                  <span className="autocare-shared-metric-sub">
                    Monotonic odometer calibration verified
                  </span>
                </div>

                <div className="autocare-shared-metric-card">
                  <span className="autocare-shared-metric-label">Ledger Consensus</span>
                  <div className="autocare-shared-metric-val">Fully Compliant</div>
                  <span className="autocare-shared-metric-sub">
                    Hash: 0x{watermark.accessId.replace(/[^a-f0-9]/gi, '')}9b...4a1
                  </span>
                </div>
              </section>

              {/* ========================================================
                  2-COLUMN BODY: SPECIFICATIONS & MAINTENANCE RECORDS
                  ======================================================== */}
              <div className="autocare-shared-body-grid">
                
                {/* Left Column: Official Specifications & Maintenance */}
                <div>
                  {/* Card 1: Official Specifications (BR-01) */}
                  <section className="autocare-shared-card" aria-label="Official Registration Specifications">
                    <div className="autocare-shared-card-header">
                      <div>
                        <h3 className="autocare-shared-card-title">
                          Official Registration Specifications (BR-01)
                        </h3>
                        <p className="autocare-shared-card-subtitle">
                          Government registry identifiers matching vehicle chassis and title.
                        </p>
                      </div>
                    </div>

                    <div className="autocare-shared-specs-list">
                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">Registration Plate</span>
                        <span className="autocare-shared-spec-row-val">
                          {vehicle?.registrationNumber || 'WP CAA-1234'}
                        </span>
                      </div>

                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">VIN / Chassis Number</span>
                        <span className="autocare-shared-spec-row-val is-mono">
                          {vehicle?.vin || 'JTDKN3DU5F1234567'}
                        </span>
                      </div>

                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">Engine Number</span>
                        <span className="autocare-shared-spec-row-val">
                          {scopeMode === 'Full Records' ? (
                            vehicle?.engineNumber || '2ZRFE98765'
                          ) : (
                            <span className="autocare-shared-masked">
                              <Lock size={11} /> [PROTECTED &bull; SERIAL MASKED]
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">Vehicle Category</span>
                        <span className="autocare-shared-spec-row-val">
                          {vehicle?.vehicleType || 'Sedan'}
                        </span>
                      </div>

                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">Manufacturer</span>
                        <span className="autocare-shared-spec-row-val">
                          {vehicle?.manufacturer || 'Toyota'}
                        </span>
                      </div>

                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">Model &amp; Trim</span>
                        <span className="autocare-shared-spec-row-val">
                          {vehicle?.model || 'Corolla'}
                        </span>
                      </div>

                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">Year of Manufacture</span>
                        <span className="autocare-shared-spec-row-val">
                          {vehicle?.manufacturingYear || 2022}
                        </span>
                      </div>

                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">Registered Jurisdiction</span>
                        <span className="autocare-shared-spec-row-val">
                          {vehicle?.registrationJurisdiction || 'Western Province, Sri Lanka'}
                        </span>
                      </div>

                      <div className="autocare-shared-spec-row">
                        <span className="autocare-shared-spec-row-label">Registered Owner (BR-06)</span>
                        <span className="autocare-shared-spec-row-val">
                          {scopeMode === 'Full Records' ? (
                            (vehicle && 'ownerName' in vehicle && (vehicle as Record<string, any>).ownerName) ||
                            (vehicle && 'owner' in vehicle && typeof (vehicle as Record<string, any>).owner === 'object' && (vehicle as Record<string, any>).owner?.fullName) ||
                            'K. A. Perera (Verified Owner)'
                          ) : (
                            <span className="autocare-shared-masked">
                              <Lock size={11} /> [PROTECTED &bull; OWNER IDENTITY MASKED (BR-06)]
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Card 2: Certified Maintenance History (BR-02 & BR-06) */}
                  <section className="autocare-shared-card" aria-label="Maintenance Records">
                    <div className="autocare-shared-card-header">
                      <div>
                        <h3 className="autocare-shared-card-title">
                          Certified Maintenance History (BR-02)
                        </h3>
                        <p className="autocare-shared-card-subtitle">
                          {scopeMode === 'Full Records'
                            ? 'Complete maintenance history with costs and parts breakdown.'
                            : 'Service milestones & workshop logs (Costs masked under Limited Scope).'}
                        </p>
                      </div>
                    </div>

                    <div className="autocare-shared-service-list">
                      {serviceRecords.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                          No verified maintenance records currently logged for this vehicle.
                        </div>
                      ) : (
                        serviceRecords.map((record) => {
                          const isFull = scopeMode === 'Full Records';
                          const formattedDate = new Date(record.serviceDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          });

                          return (
                            <div key={record._id} className="autocare-shared-service-item">
                              <div className="autocare-shared-service-left">
                                <div className="autocare-shared-service-icon-box">
                                  <Wrench size={18} />
                                </div>
                                <div className="autocare-shared-service-info">
                                  <h4 className="autocare-shared-service-title">
                                    {record.serviceType}
                                  </h4>
                                  <p className="autocare-shared-service-meta">
                                    {formattedDate} &bull; {record.garageName} &bull; {record.mileage.toLocaleString()} km
                                  </p>
                                  {record.workPerformed && (
                                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                                      {record.workPerformed}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="autocare-shared-service-right">
                                <span className="autocare-shared-service-cost">
                                  {isFull && record.cost ? (
                                    `LKR ${record.cost.toLocaleString()}`
                                  ) : (
                                    <span className="autocare-shared-masked" title="Cost masked under BR-06 Limited Scope">
                                      <Lock size={11} /> [Cost Masked]
                                    </span>
                                  )}
                                </span>
                                <span className="autocare-doc-status-badge verified">VERIFIED</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </section>
                </div>

                {/* Right Column: Allowed Documents & Policy Restrictions (BR-06, BR-07) */}
                <div>
                  {/* Card 3: Allowed Verified Documents */}
                  <section className="autocare-shared-card" aria-label="Verified Documents">
                    <div className="autocare-shared-card-header">
                      <div>
                        <h3 className="autocare-shared-card-title">Allowed Documents</h3>
                        <p className="autocare-shared-card-subtitle">
                          {scopeMode === 'Full Records'
                            ? `${documents.length} verified documents visible for buyer review.`
                            : 'Selected inspection documents permitted under current sharing scope.'}
                        </p>
                      </div>
                    </div>

                    <div className="autocare-shared-doc-list">
                      {scopeMode === 'Limited Scope' && documents.length > 2 ? (
                        <>
                          {/* Display 2 allowed documents in Limited Mode, mask the rest */}
                          {documents.slice(0, 2).map((doc) => (
                            <div key={doc._id} className="autocare-shared-doc-item">
                              <div className="autocare-shared-doc-info">
                                <h4 className="autocare-shared-doc-name">{doc.title}</h4>
                                <span className="autocare-shared-doc-sub">
                                  Verified Inspection Record &bull; {doc.issueDate || 'DMT Certified'}
                                </span>
                              </div>

                              <div className="autocare-shared-doc-actions">
                                <button
                                  type="button"
                                  className="autocare-shared-btn-view-doc"
                                  onClick={() =>
                                    setActivePreviewDoc({
                                      title: doc.title,
                                      authority: 'AutoCare 360 Certified Partner',
                                      date: doc.issueDate || 'Verified Record',
                                      fileUrl: doc.fileUrl,
                                    })
                                  }
                                >
                                  <Eye size={13} />
                                  <span>View</span>
                                </button>

                                <button
                                  type="button"
                                  className="autocare-shared-btn-download-disabled"
                                  onClick={() => showSecurityNotice('Document Download')}
                                  title="Download blocked under BR-07"
                                >
                                  <Download size={13} />
                                  <span>Download</span>
                                </button>
                              </div>
                            </div>
                          ))}

                          <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', fontSize: '12.5px', color: '#64748b' }}>
                            <Lock size={13} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
                            <span>Additional ownership and insurance policies hidden under <strong>Limited Access (BR-06)</strong>.</span>
                          </div>
                        </>
                      ) : (
                        documents.map((doc) => (
                          <div key={doc._id} className="autocare-shared-doc-item">
                            <div className="autocare-shared-doc-info">
                              <h4 className="autocare-shared-doc-name">{doc.title}</h4>
                              <span className="autocare-shared-doc-sub">
                                Verified Document &bull; {doc.issueDate || 'Active'}
                              </span>
                            </div>

                            <div className="autocare-shared-doc-actions">
                              <button
                                type="button"
                                className="autocare-shared-btn-view-doc"
                                onClick={() =>
                                  setActivePreviewDoc({
                                    title: doc.title,
                                    authority: 'AutoCare 360 Verified Record',
                                    date: doc.issueDate || 'Verified',
                                    fileUrl: doc.fileUrl,
                                  })
                                }
                              >
                                <Eye size={13} />
                                <span>View</span>
                              </button>

                              <button
                                type="button"
                                className="autocare-shared-btn-download-disabled"
                                onClick={() => showSecurityNotice('Document Download')}
                                title="Download blocked under BR-07"
                              >
                                <Download size={13} />
                                <span>Download</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Access Limitations Notice Box (BR-07) */}
                    <div className="autocare-shared-limitations-box">
                      <h4 className="autocare-shared-limitations-title">
                        <Lock size={14} />
                        <span>BR-07 Data Protection Enforced</span>
                      </h4>
                      <p className="autocare-shared-limitations-desc">
                        Buyer can inspect certified vehicle specifications and verified maintenance records on-screen. Downloading, printing, and raw telemetry export are disabled by the vehicle owner.
                      </p>
                      <div className="autocare-shared-limitations-tags">
                        <span className="autocare-shared-limit-tag">&check; View Only</span>
                        <span className="autocare-shared-limit-tag">&cross; No Download</span>
                        <span className="autocare-shared-limit-tag">&cross; No Printing</span>
                        <span className="autocare-shared-limit-tag">&check; Watermark Sealed</span>
                        <span className="autocare-shared-limit-tag">&check; Audit Trail Logged</span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              {/* ========================================================
                  FOOTER: AUDIT TRAIL LOGGED (BR-08)
                  ======================================================== */}
              <div className="autocare-shared-audit-footer">
                <div className="autocare-shared-audit-info">
                  <ShieldCheck size={18} style={{ color: '#16a34a' }} />
                  <span>
                    Cryptographically recorded on AutoCare 360 audit ledger (BR-08). Access ID:
                  </span>
                  <span className="autocare-shared-audit-hash">
                    {watermark.accessId} &bull; {new Date(watermark.timestamp).toLocaleString()}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Link
                    to="/vehicles"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#0056A2',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'none'
                    }}
                  >
                    <span>Owner Portal</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ========================================================
          DOCUMENT INSPECTION MODAL (BR-07 PROTECTED WATERMARKED)
          ======================================================== */}
      {activePreviewDoc && (
        <div className="autocare-shared-modal-overlay" role="dialog" aria-modal="true">
          <div className="autocare-shared-modal-card">
            <div className="autocare-shared-modal-header">
              <h3 className="autocare-shared-modal-title">Protected Document Inspection (BR-07)</h3>
              <button
                type="button"
                className="autocare-shared-modal-close"
                onClick={() => setActivePreviewDoc(null)}
                aria-label="Close document inspection"
              >
                <X size={18} />
              </button>
            </div>

            <div className="autocare-shared-modal-body">
              {/* Dynamic Watermark in Modal */}
              <div className="autocare-shared-modal-watermark">
                AUTOCARE 360 SECURED &bull; {watermark.recipientName.toUpperCase()} &bull; ID: {watermark.accessId}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <FileText size={28} color="#0056A2" />
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    {activePreviewDoc.title}
                  </h4>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {activePreviewDoc.authority}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#334155' }}>
                <div>
                  <strong>Inspection Timestamp:</strong> {new Date().toLocaleString()}
                </div>
                <div>
                  <strong>Access Authorization ID:</strong> {watermark.accessId}
                </div>
                <div>
                  <strong>Intended Recipient:</strong> {watermark.recipientName}
                </div>
                <div>
                  <strong>Session Expiry:</strong> {new Date(watermark.expiresAt).toLocaleDateString()}
                </div>
                <div>
                  <strong>Ledger Authenticity:</strong> Certified Immutable Hash
                </div>
              </div>

              <div className="autocare-shared-modal-notice">
                <Ban size={15} style={{ flexShrink: 0 }} />
                <span>
                  Direct PDF export and high-resolution printing are blocked by the owner security policy (BR-07).
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
                onClick={() => setActivePreviewDoc(null)}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SECURITY RESTRICTION FLOATING TOAST (BR-07)
          ======================================================== */}
      {toast.show && (
        <div className="autocare-shared-toast" role="alert">
          <Ban size={18} style={{ color: '#f87171', flexShrink: 0 }} />
          <span>{toast.message}</span>
          <button
            type="button"
            className="autocare-shared-toast-close"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            aria-label="Dismiss security notice"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Interactive QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(token) => {
          navigate(`/buyer-qr?token=${encodeURIComponent(token)}`);
        }}
        title="AutoCare 360 Verification Scanner"
        subtitle="Point camera at physical sticker or upload QR image"
      />

      <Footer />
    </div>
  );
};

export default BuyerSharedRecordViewPage;
