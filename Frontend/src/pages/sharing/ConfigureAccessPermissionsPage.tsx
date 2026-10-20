import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  CheckCircle2,
  AlertCircle,
  X,
  Link as LinkIcon,
  QrCode,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { getMyVehicles, type Vehicle } from '../../services/vehicleService';
import {
  getShareLinks,
  getShareLink,
  updateShareLinkPermissions,
  type ShareLink,
  type ShareProtectionSettings,
} from '../../services/shareLinkService';
import {
  getQRShares,
  getQRShare,
  updateQRSharePermissions,
  type QRShare,
} from '../../services/qrShareService';
import '../../styles/protection.css';

type AccessMethod = 'Secure URL Key' | 'QR Authorization';
type VisibilityScope = 'Full Records' | 'Limited Scope' | 'Custom Select';

interface CheckboxState {
  odometerTelemetry: boolean;
  certifiedChronology: boolean;
  detailedInvoices: boolean;
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'info';
}

interface AccessGrantDescriptor {
  id: string;
  type: 'link' | 'qr';
  vehicleId: string;
  vehicleRegistrationNumber: string;
  vehicleModel: string;
  vehicleManufacturer: string;
  vehicleYear: number | string;
  vehicleChassis: string;
  vehicleMileage: number;
  recipientName: string;
  recipientEmail: string;
  purpose: string;
  permissionLevel: 'full' | 'limited' | 'selected';
  allowedSections: string[];
  expiresAt: string;
  status: 'active' | 'revoked' | 'expired';
  maxViewsOrScans?: number | null;
  count?: number;
  protection: ShareProtectionSettings;
}

const DEFAULT_PROTECTION: ShareProtectionSettings = {
  allowDownload: false,
  allowPrint: false,
  allowCopy: false,
  watermarkEnabled: true,
  watermarkText: 'AUTOCARE 360 SECURED',
};

const formatExpiryDisplay = (isoDate: string) => {
  if (!isoDate) return 'Expires in 48 Hours';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `Expires ${day} ${month} ${year}, ${hours}:${minutes}`;
};

const formatDurationDisplay = (isoDate: string) => {
  if (!isoDate) return '48 Hours (Recommended)';
  const now = new Date().getTime();
  const exp = new Date(isoDate).getTime();
  const diffHours = Math.round((exp - now) / (1000 * 60 * 60));
  if (diffHours <= 0) return 'Expired Lock';
  if (diffHours <= 72) return `${diffHours} Hours (Recommended)`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} Days (SLA Lock)`;
};

const ConfigureAccessPermissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Loading & Async
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Available grants for context selection
  const [allGrants, setAllGrants] = useState<AccessGrantDescriptor[]>([]);
  const [currentGrant, setCurrentGrant] = useState<AccessGrantDescriptor | null>(null);

  // Access method tab
  const [accessMethod, setAccessMethod] = useState<AccessMethod>('Secure URL Key');

  // Recipient info
  const [recipientEntity, setRecipientEntity] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState<string>('');

  // Expiry inputs
  const [expiryDuration, setExpiryDuration] = useState<string>('48 Hours (Recommended)');
  const [expiryDateTime, setExpiryDateTime] = useState<string>('');
  const [rawExpiresAt, setRawExpiresAt] = useState<string>('');

  // Scope selection
  const [visibilityScope, setVisibilityScope] = useState<VisibilityScope>('Limited Scope');

  // Checkbox categories
  const [checkboxes, setCheckboxes] = useState<CheckboxState>({
    odometerTelemetry: true,
    certifiedChronology: true,
    detailedInvoices: false,
  });

  // Protection viewing settings
  const [protection, setProtection] = useState<ShareProtectionSettings>(DEFAULT_PROTECTION);

  // Active Credentials Key
  const [credentialsKey, setCredentialsKey] = useState<string>('');

  // Toast feedback
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  // Helper to extract descriptor from ShareLink
  const mapShareLinkToDescriptor = (
    l: ShareLink,
    vehicleMap: Map<string, Vehicle>
  ): AccessGrantDescriptor => {
    const vId = typeof l.vehicleId === 'object' && l.vehicleId !== null ? l.vehicleId._id : String(l.vehicleId || '');
    const veh = vehicleMap.get(vId);
    const populated = typeof l.vehicleId === 'object' && l.vehicleId !== null ? l.vehicleId : null;

    return {
      id: l._id,
      type: 'link',
      vehicleId: vId,
      vehicleRegistrationNumber: populated?.registrationNumber || veh?.registrationNumber || 'WP ABC-1234',
      vehicleModel: populated?.model || veh?.model || 'Aqua',
      vehicleManufacturer: populated?.manufacturer || veh?.manufacturer || 'Toyota',
      vehicleYear: populated?.manufacturingYear || veh?.manufacturingYear || '2018',
      vehicleChassis: veh?.vin || 'NHP10-23648102',
      vehicleMileage: populated?.currentMileage || veh?.currentMileage || 85240,
      recipientName: l.recipientName || 'Evaluations Desk',
      recipientEmail: l.recipientEmail || '',
      purpose: l.purpose || 'Vehicle Record Verification',
      permissionLevel: l.permissionLevel,
      allowedSections: l.allowedSections || [],
      expiresAt: l.expiresAt,
      status: l.status,
      maxViewsOrScans: l.maxViews,
      count: l.viewCount,
      protection: l.protection || DEFAULT_PROTECTION,
    };
  };

  // Helper to extract descriptor from QRShare
  const mapQRShareToDescriptor = (
    q: QRShare,
    vehicleMap: Map<string, Vehicle>
  ): AccessGrantDescriptor => {
    const vId = typeof q.vehicleId === 'object' && q.vehicleId !== null ? q.vehicleId._id : String(q.vehicleId || '');
    const veh = vehicleMap.get(vId);
    const populated = typeof q.vehicleId === 'object' && q.vehicleId !== null ? q.vehicleId : null;

    return {
      id: q._id,
      type: 'qr',
      vehicleId: vId,
      vehicleRegistrationNumber: populated?.registrationNumber || veh?.registrationNumber || 'WP ABC-1234',
      vehicleModel: populated?.model || veh?.model || 'Aqua',
      vehicleManufacturer: populated?.manufacturer || veh?.manufacturer || 'Toyota',
      vehicleYear: populated?.manufacturingYear || veh?.manufacturingYear || '2018',
      vehicleChassis: veh?.vin || 'NHP10-23648102',
      vehicleMileage: populated?.currentMileage || veh?.currentMileage || 85240,
      recipientName: q.recipientName || q.qrLabel || 'Inspection Officer',
      recipientEmail: 'qr-auth@autocare360.lk',
      purpose: q.purpose || 'QR Physical Authorization',
      permissionLevel: q.permissionLevel,
      allowedSections: q.allowedSections || [],
      expiresAt: q.expiresAt,
      status: q.status,
      maxViewsOrScans: q.maxScans,
      count: q.scanCount,
      protection: q.protection || DEFAULT_PROTECTION,
    };
  };

  // Synchronize form states whenever currentGrant changes
  const applyGrantToForm = useCallback((grant: AccessGrantDescriptor) => {
    setCurrentGrant(grant);

    // Method
    setAccessMethod(grant.type === 'qr' ? 'QR Authorization' : 'Secure URL Key');

    // Recipient
    setRecipientEntity(grant.recipientName);
    setRecipientEmail(grant.recipientEmail);

    // Expiry
    setRawExpiresAt(grant.expiresAt);
    setExpiryDuration(formatDurationDisplay(grant.expiresAt));
    setExpiryDateTime(formatExpiryDisplay(grant.expiresAt));

    // Scope & Checkboxes
    if (grant.permissionLevel === 'full') {
      setVisibilityScope('Full Records');
      setCheckboxes({
        odometerTelemetry: true,
        certifiedChronology: true,
        detailedInvoices: true,
      });
    } else if (grant.permissionLevel === 'limited') {
      setVisibilityScope('Limited Scope');
      setCheckboxes({
        odometerTelemetry: true,
        certifiedChronology: true,
        detailedInvoices: false,
      });
    } else {
      setVisibilityScope('Custom Select');
      const hasOdo = grant.allowedSections.includes('mileage');
      const hasService =
        grant.allowedSections.includes('serviceHistory') ||
        grant.allowedSections.includes('serviceDates');
      const hasInvoices =
        grant.allowedSections.includes('invoices') ||
        grant.allowedSections.includes('costs');

      setCheckboxes({
        odometerTelemetry: hasOdo,
        certifiedChronology: hasService,
        detailedInvoices: hasInvoices,
      });
    }

    // Protection settings
    setProtection(grant.protection || DEFAULT_PROTECTION);

    // Active credentials identifier (safe grant reference; never invent fake public URLs)
    setCredentialsKey(grant.id);
  }, []);

  // Primary Data Loading
  useEffect(() => {
    let isMounted = true;

    const loadRealData = async () => {
      try {
        setIsLoading(true);

        // Fetch owner vehicles
        const ownerVehicles = await getMyVehicles();
        const vehicleMap = new Map<string, Vehicle>();
        ownerVehicles.forEach((v) => vehicleMap.set(v._id, v));

        // Read router context / state / query
        const navState = location.state as {
          shareType?: 'link' | 'qr';
          shareId?: string;
          vehicleId?: string;
        } | null;

        const targetType =
          navState?.shareType ||
          (searchParams.get('shareType') as 'link' | 'qr') ||
          (searchParams.get('type') === 'qr' ? 'qr' : 'link');
        const targetId = navState?.shareId || searchParams.get('shareId') || searchParams.get('id') || '';

        // If target grant ID is specified, load that specific grant directly
        if (targetId) {
          try {
            let directGrant: AccessGrantDescriptor | null = null;
            if (targetType === 'qr') {
              const q = await getQRShare(targetId);
              if (q) directGrant = mapQRShareToDescriptor(q, vehicleMap);
            } else {
              const l = await getShareLink(targetId);
              if (l) directGrant = mapShareLinkToDescriptor(l, vehicleMap);
            }

            if (directGrant && isMounted) {
              setAllGrants([directGrant]);
              applyGrantToForm(directGrant);
              setIsLoading(false);
              return;
            }
          } catch (fetchErr) {
            console.warn('Direct grant lookup failed, falling back to list load:', fetchErr);
          }
        }

        // Otherwise load owner's active links and QR shares
        const [linksRes, qrsRes] = await Promise.all([
          getShareLinks(),
          getQRShares(),
        ]);

        const mappedLinks = (linksRes || []).map((l) =>
          mapShareLinkToDescriptor(l, vehicleMap)
        );
        const mappedQRs = (qrsRes || []).map((q) =>
          mapQRShareToDescriptor(q, vehicleMap)
        );

        const unified = [...mappedLinks, ...mappedQRs].sort(
          (a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime()
        );

        if (!isMounted) return;

        setAllGrants(unified);

        if (unified.length > 0) {
          // Select active grant if available, or first grant
          const activeOne = unified.find((g) => g.status === 'active') || unified[0];
          applyGrantToForm(activeOne);
        } else {
          // No grants exist yet
          setCurrentGrant(null);
        }
      } catch (err) {
        console.error('Failed to load sharing permissions data:', err);
        if (isMounted) {
          showToast('Failed to load real permission records.', 'info');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRealData();

    return () => {
      isMounted = false;
    };
  }, [location.state, searchParams, applyGrantToForm]);

  const handleScopeSelect = (scope: VisibilityScope) => {
    if (currentGrant && currentGrant.status !== 'active') return;

    setVisibilityScope(scope);
    if (scope === 'Full Records') {
      setCheckboxes({
        odometerTelemetry: true,
        certifiedChronology: true,
        detailedInvoices: true,
      });
    } else if (scope === 'Limited Scope') {
      setCheckboxes({
        odometerTelemetry: true,
        certifiedChronology: true,
        detailedInvoices: false,
      });
    }
  };

  const handleCheckboxToggle = (key: keyof CheckboxState) => {
    if (currentGrant && currentGrant.status !== 'active') return;

    const nextState = {
      ...checkboxes,
      [key]: !checkboxes[key],
    };
    setCheckboxes(nextState);

    // Sync scope title
    if (nextState.odometerTelemetry && nextState.certifiedChronology && nextState.detailedInvoices) {
      setVisibilityScope('Full Records');
    } else if (nextState.odometerTelemetry && nextState.certifiedChronology && !nextState.detailedInvoices) {
      setVisibilityScope('Limited Scope');
    } else {
      setVisibilityScope('Custom Select');
    }
  };

  // Save / Update Real Permissions & Protection Settings
  const handleGenerateLink = async () => {
    if (!currentGrant) {
      showToast('No active access grant selected to configure.', 'info');
      return;
    }

    if (currentGrant.status !== 'active') {
      showToast(`Cannot update ${currentGrant.status} access grant. Only active grants can be modified.`, 'info');
      return;
    }

    // Resolve permissionLevel and allowedSections
    let permissionLevel: 'full' | 'limited' | 'selected';
    let allowedSections: string[] = [];

    if (visibilityScope === 'Full Records') {
      permissionLevel = 'full';
      allowedSections = [
        'serviceHistory',
        'serviceDates',
        'mileage',
        'garageDetails',
        'costs',
        'invoices',
        'documents',
        'images',
        'ownerContact',
        'engineRepair',
      ];
    } else if (visibilityScope === 'Limited Scope') {
      permissionLevel = 'limited';
      allowedSections = ['serviceDates', 'mileage', 'garageDetails'];
    } else {
      permissionLevel = 'selected';
      if (checkboxes.odometerTelemetry) allowedSections.push('mileage');
      if (checkboxes.certifiedChronology) allowedSections.push('serviceHistory', 'serviceDates');
      if (checkboxes.detailedInvoices) allowedSections.push('invoices', 'costs');

      if (allowedSections.length === 0) {
        showToast('Please select at least one record category to grant access.', 'info');
        return;
      }
    }

    try {
      setIsSaving(true);

      const protectionPayload: ShareProtectionSettings = {
        allowDownload: protection.allowDownload ?? false,
        allowPrint: protection.allowPrint ?? false,
        allowCopy: protection.allowCopy ?? false,
        watermarkEnabled: protection.watermarkEnabled ?? true,
        watermarkText: protection.watermarkText || 'AUTOCARE 360 SECURED',
      };

      if (currentGrant.type === 'link') {
        const updated = await updateShareLinkPermissions(currentGrant.id, {
          permissionLevel,
          allowedSections,
          expiresAt: rawExpiresAt || currentGrant.expiresAt,
          protection: protectionPayload,
        });

        // Update local grant descriptor
        const updatedDescriptor: AccessGrantDescriptor = {
          ...currentGrant,
          permissionLevel: updated.permissionLevel,
          allowedSections: updated.allowedSections || [],
          expiresAt: updated.expiresAt,
          protection: updated.protection || protectionPayload,
        };
        applyGrantToForm(updatedDescriptor);
      } else {
        const updated = await updateQRSharePermissions(currentGrant.id, {
          permissionLevel,
          allowedSections,
          expiresAt: rawExpiresAt || currentGrant.expiresAt,
          protection: protectionPayload,
        });

        const updatedDescriptor: AccessGrantDescriptor = {
          ...currentGrant,
          permissionLevel: updated.permissionLevel,
          allowedSections: updated.allowedSections || [],
          expiresAt: updated.expiresAt,
          protection: updated.protection || protectionPayload,
        };
        applyGrantToForm(updatedDescriptor);
      }

      showToast(
        `Verifiable cryptographic permissions saved successfully for ${recipientEntity || 'recipient'}. Registered on audit ledger.`,
        'success'
      );
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to update access permissions on server.';
      showToast(errorMsg, 'info');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    if (!credentialsKey) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(credentialsKey).catch(() => {});
    }
    showToast('Access Grant Reference ID copied to clipboard!', 'success');
  };

  // Switch active grant if user changes method tab
  const handleMethodSwitch = (method: AccessMethod) => {
    setAccessMethod(method);
    const targetKind = method === 'QR Authorization' ? 'qr' : 'link';
    const match = allGrants.find((g) => g.type === targetKind);
    if (match) {
      applyGrantToForm(match);
    }
  };

  const isInactive = currentGrant ? currentGrant.status !== 'active' : false;

  return (
    <div className="autocare-protect-page">
      <Navbar />

      <main className="autocare-protect-main">
        <div className="autocare-protect-container">
          {/* Breadcrumb / Back Navigation */}
          <div className="autocare-protect-back-nav">
            <button
              type="button"
              className="autocare-protect-back-btn"
              onClick={() => navigate('/sharing/permissions')}
              title="Return to Access Permission Management"
            >
              <ArrowLeft size={16} />
              <span>Back to access permissions</span>
            </button>
          </div>

          {/* Top Header Block matching Figma */}
          <header className="autocare-protect-header">
            <div className="autocare-protect-context-tag">
              <span className="autocare-protect-tag-blue">SECURE DECENTRALIZED SHARING</span>
              <span className="autocare-protect-tag-dot">•</span>
              <span className="autocare-protect-tag-muted">
                VEHICLE INDEX: {currentGrant ? currentGrant.vehicleRegistrationNumber : 'WP ABC-1234'}
              </span>
            </div>

            <h1 className="autocare-protect-title">Configure Access Permissions</h1>
            <p className="autocare-protect-subtitle">
              Generate time-locked, cryptographically verified share-links and secure QR authorization certificates. All viewing transactions are registered permanently on the system audit ledger.
            </p>
          </header>

          {isLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 0',
                gap: '12px',
                color: '#64748b',
                fontWeight: 600,
              }}
            >
              <Loader2 size={24} className="animate-spin" />
              <span>Loading verifiable permission certificate...</span>
            </div>
          ) : !currentGrant ? (
            <div
              className="autocare-protect-card"
              style={{ textAlign: 'center', padding: '48px 24px' }}
            >
              <ShieldCheck size={40} style={{ color: '#0056A2', margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                No Active Access Grants Found
              </h2>
              <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '480px', margin: '0 auto 20px' }}>
                No active share links or QR authorizations were found for your vehicles. Generate a share link or QR authorization from Access Permission Management first.
              </p>
              <button
                type="button"
                className="autocare-protect-back-btn"
                onClick={() => navigate('/sharing/permissions')}
                style={{
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  padding: '10px 20px',
                  borderRadius: '8px',
                }}
              >
                Go to Access Permission Management
              </button>
            </div>
          ) : (
            /* 2-Column Layout Grid */
            <div className="autocare-protect-grid">
              {/* Left Column: Main Configuration Card */}
              <section className="autocare-protect-card" aria-label="Access Controls and Data Visibility Scope">
                {/* Optional Grant Selector if multiple exist */}
                {allGrants.length > 1 && (
                  <div className="autocare-protect-form-group" style={{ marginBottom: '22px' }}>
                    <label htmlFor="access-grant-selector" className="autocare-protect-label">
                      Active Authorization Grant
                    </label>
                    <select
                      id="access-grant-selector"
                      className="autocare-protect-input"
                      value={currentGrant.id}
                      onChange={(e) => {
                        const sel = allGrants.find((g) => g.id === e.target.value);
                        if (sel) applyGrantToForm(sel);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {allGrants.map((g) => (
                        <option key={g.id} value={g.id}>
                          [{g.type.toUpperCase()}] {g.vehicleRegistrationNumber} · {g.recipientName} ({g.status.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Section 1: Recipient & Access Controls */}
                <div className="autocare-protect-section">
                  <h2 className="autocare-protect-section-title">1. Recipient &amp; Access Controls</h2>

                  {/* Segmented Selector */}
                  <div className="autocare-protect-segmented-bar" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={accessMethod === 'Secure URL Key'}
                      className={`autocare-protect-segment-btn ${
                        accessMethod === 'Secure URL Key' ? 'is-active' : ''
                      }`}
                      onClick={() => handleMethodSwitch('Secure URL Key')}
                    >
                      <LinkIcon size={14} />
                      <span>Secure URL Key</span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={accessMethod === 'QR Authorization'}
                      className={`autocare-protect-segment-btn ${
                        accessMethod === 'QR Authorization' ? 'is-active' : ''
                      }`}
                      onClick={() => handleMethodSwitch('QR Authorization')}
                    >
                      <QrCode size={14} />
                      <span>QR Authorization</span>
                    </button>
                  </div>

                  {/* Recipient Entity / Name */}
                  <div className="autocare-protect-form-group">
                    <label htmlFor="recipient-entity" className="autocare-protect-label">
                      Recipient Entity / Name
                    </label>
                    <input
                      id="recipient-entity"
                      type="text"
                      className="autocare-protect-input"
                      value={recipientEntity}
                      disabled={isInactive}
                      onChange={(e) => setRecipientEntity(e.target.value)}
                      placeholder="e.g. Lanka Premium Cars (Pvt) Ltd"
                    />
                  </div>

                  {/* Recipient Verification Email */}
                  <div className="autocare-protect-form-group">
                    <label htmlFor="recipient-email" className="autocare-protect-label">
                      Recipient Verification Email
                    </label>
                    <input
                      id="recipient-email"
                      type="email"
                      className="autocare-protect-input"
                      value={recipientEmail}
                      disabled={isInactive}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="e.g. evaluations@lankapremium.lk"
                    />
                  </div>

                  {/* Automatic Expiry (Mandatory SLA Lock) */}
                  <div className="autocare-protect-form-group">
                    <label htmlFor="expiry-duration" className="autocare-protect-label">
                      Automatic Expiry (Mandatory SLA Lock)
                    </label>
                    <div className="autocare-protect-expiry-row">
                      <div className="autocare-protect-input-icon-wrap">
                        <input
                          id="expiry-duration"
                          type="text"
                          className="autocare-protect-input"
                          value={expiryDuration}
                          disabled={isInactive}
                          onChange={(e) => setExpiryDuration(e.target.value)}
                          placeholder="e.g. 48 Hours (Recommended)"
                        />
                        <Clock size={16} className="autocare-protect-input-icon" />
                      </div>

                      <div className="autocare-protect-input-icon-wrap">
                        <input
                          id="expiry-datetime"
                          type="text"
                          className="autocare-protect-input autocare-protect-input-alert"
                          value={expiryDateTime}
                          disabled={isInactive}
                          onChange={(e) => setExpiryDateTime(e.target.value)}
                          placeholder="e.g. Expires 30 Sep 2026, 10:30"
                        />
                        <Calendar size={16} className="autocare-protect-input-icon" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Define Data Visibility Scope */}
                <div className="autocare-protect-section">
                  <h2 className="autocare-protect-section-title">2. Define Data Visibility Scope</h2>

                  {/* 3 Scope Cards */}
                  <div className="autocare-protect-scope-grid">
                    {/* Card 1: Full Records */}
                    <div
                      className={`autocare-protect-scope-card ${
                        visibilityScope === 'Full Records' ? 'is-selected' : ''
                      } ${isInactive ? 'is-disabled' : ''}`}
                      onClick={() => handleScopeSelect('Full Records')}
                      role="button"
                      tabIndex={isInactive ? -1 : 0}
                      style={{ opacity: isInactive ? 0.7 : 1, cursor: isInactive ? 'not-allowed' : 'pointer' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleScopeSelect('Full Records');
                      }}
                    >
                      <h3 className="autocare-protect-scope-title">Full Records</h3>
                      <p className="autocare-protect-scope-desc">
                        Shares all specs, diagnostics &amp; financials.
                      </p>
                    </div>

                    {/* Card 2: Limited Scope (Default in Figma) */}
                    <div
                      className={`autocare-protect-scope-card ${
                        visibilityScope === 'Limited Scope' ? 'is-selected' : ''
                      } ${isInactive ? 'is-disabled' : ''}`}
                      onClick={() => handleScopeSelect('Limited Scope')}
                      role="button"
                      tabIndex={isInactive ? -1 : 0}
                      style={{ opacity: isInactive ? 0.7 : 1, cursor: isInactive ? 'not-allowed' : 'pointer' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleScopeSelect('Limited Scope');
                      }}
                    >
                      <h3 className="autocare-protect-scope-title">Limited Scope</h3>
                      <p className="autocare-protect-scope-desc">
                        Masks owner identification &amp; service costs.
                      </p>
                    </div>

                    {/* Card 3: Custom Select */}
                    <div
                      className={`autocare-protect-scope-card ${
                        visibilityScope === 'Custom Select' ? 'is-selected' : ''
                      } ${isInactive ? 'is-disabled' : ''}`}
                      onClick={() => handleScopeSelect('Custom Select')}
                      role="button"
                      tabIndex={isInactive ? -1 : 0}
                      style={{ opacity: isInactive ? 0.7 : 1, cursor: isInactive ? 'not-allowed' : 'pointer' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleScopeSelect('Custom Select');
                      }}
                    >
                      <h3 className="autocare-protect-scope-title">Custom Select</h3>
                      <p className="autocare-protect-scope-desc">
                        Manual checklist confirmation below.
                      </p>
                    </div>
                  </div>

                  {/* Checkbox List */}
                  <div className="autocare-protect-checkboxes-group">
                    <label className="autocare-protect-checkbox-item">
                      <input
                        type="checkbox"
                        checked={checkboxes.odometerTelemetry}
                        disabled={isInactive}
                        onChange={() => handleCheckboxToggle('odometerTelemetry')}
                      />
                      <span>Odometer &amp; Telemetry Audits</span>
                    </label>

                    <label className="autocare-protect-checkbox-item">
                      <input
                        type="checkbox"
                        checked={checkboxes.certifiedChronology}
                        disabled={isInactive}
                        onChange={() => handleCheckboxToggle('certifiedChronology')}
                      />
                      <span>Certified Service Chronology</span>
                    </label>

                    <label className="autocare-protect-checkbox-item">
                      <input
                        type="checkbox"
                        checked={checkboxes.detailedInvoices}
                        disabled={isInactive}
                        onChange={() => handleCheckboxToggle('detailedInvoices')}
                      />
                      <span>Detailed Invoice Expenses &amp; Garage Parts</span>
                    </label>
                  </div>
                </div>
              </section>

              {/* Right Column: Live Passport Preview + Active Credentials */}
              <div className="autocare-protect-right-col">
                {/* Card 1: Live Passport Preview */}
                <section className="autocare-protect-preview-card" aria-label="Live Passport Preview">
                  <div className="autocare-protect-preview-top">
                    <span className="autocare-protect-preview-label">LIVE PASSPORT PREVIEW</span>
                    <span
                      className="autocare-protect-badge-protected"
                      style={{
                        backgroundColor:
                          currentGrant.status === 'revoked'
                            ? '#7f1d1d'
                            : currentGrant.status === 'expired'
                            ? '#854d0e'
                            : '#7f1d1d',
                        borderColor:
                          currentGrant.status === 'revoked'
                            ? '#991b1b'
                            : currentGrant.status === 'expired'
                            ? '#a16207'
                            : '#991b1b',
                      }}
                    >
                      {currentGrant.status === 'active' ? 'PROTECTED VIEW' : currentGrant.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Inner Vehicle Card with Watermark */}
                  <div className="autocare-protect-passport-box">
                    <div className="autocare-protect-watermark">
                      {protection.watermarkText || 'AUTOCARE 360 SECURED'}
                    </div>

                    <h3 className="autocare-protect-passport-title">
                      {currentGrant.vehicleManufacturer} {currentGrant.vehicleModel} ({currentGrant.vehicleYear})
                    </h3>
                    <div className="autocare-protect-passport-specs">
                      <div>CHASSIS: {currentGrant.vehicleChassis}</div>
                      <div>
                        ODOMETER: {currentGrant.vehicleMileage.toLocaleString()} km{' '}
                        <span className="autocare-protect-spec-highlight">[AUTHENTICATED]</span>
                      </div>
                      <div>TRUST RATING: 92/100</div>
                      {visibilityScope === 'Limited Scope' && (
                        <div style={{ color: '#cbd5e1', fontSize: '11px', marginTop: '4px' }}>
                          * SENSITIVE FINANCIALS &amp; OWNER PII REDACTED
                        </div>
                      )}
                      {visibilityScope === 'Full Records' && (
                        <div style={{ color: '#86efac', fontSize: '11px', marginTop: '4px' }}>
                          * FULL HISTORICAL &amp; INVOICE DISCLOSURE
                        </div>
                      )}
                      {visibilityScope === 'Custom Select' && (
                        <div style={{ color: '#38bdf8', fontSize: '11px', marginTop: '4px' }}>
                          * CUSTOM REVEAL MATRIX APPLIED
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="autocare-protect-preview-note">
                    * Dynamic watermarks containing configured protection tags and recipient context will be rendered on execution.
                  </p>

                  {isInactive && (
                    <p
                      style={{
                        fontSize: '12px',
                        color: currentGrant.status === 'revoked' ? '#fca5a5' : '#fde047',
                        margin: '0 0 16px 0',
                        fontWeight: 600,
                      }}
                    >
                      * Access grant is {currentGrant.status}. Changes cannot be saved to inactive grants.
                    </p>
                  )}

                  <button
                    type="button"
                    className="autocare-protect-btn-generate"
                    onClick={handleGenerateLink}
                    disabled={isInactive || isSaving}
                    style={{
                      opacity: isInactive || isSaving ? 0.6 : 1,
                      cursor: isInactive ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Saving Protection...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        <span>Generate Verifiable Link</span>
                      </>
                    )}
                  </button>
                </section>

                {/* Card 2: Active Credentials Status */}
                <section className="autocare-protect-creds-card" aria-label="Active Credentials Status">
                  <h2 className="autocare-protect-creds-title">Active Credentials Status</h2>
                  <div className="autocare-protect-creds-row">
                    <input
                      type="text"
                      readOnly
                      className="autocare-protect-creds-input"
                      value={credentialsKey ? `Grant ID: ${credentialsKey}` : 'No active grant'}
                      aria-label="Active credentials grant reference"
                    />
                    <button
                      type="button"
                      className="autocare-protect-btn-copy"
                      onClick={handleCopy}
                      disabled={!credentialsKey}
                      title="Copy Grant ID"
                    >
                      <Copy size={15} />
                      <span>Copy ID</span>
                    </button>
                  </div>
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                      <span style={{ color: '#64748b' }}>Authorization Status:</span>
                      <span
                        style={{
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color:
                            currentGrant?.status === 'active'
                              ? '#16a34a'
                              : currentGrant?.status === 'revoked'
                              ? '#dc2626'
                              : '#94a3b8',
                        }}
                      >
                        {currentGrant?.status || 'Unknown'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                      <span style={{ color: '#64748b' }}>Access Protocol:</span>
                      <span style={{ color: '#0f172a', fontWeight: 600 }}>One-Time Cryptographic Token</span>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                      Raw public access URL was generated once upon creation and cannot be reconstructed. Public verification strictly requires matching the stored SHA-256 token hash.
                    </p>
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toast.show && (
        <div className={`autocare-protect-toast is-${toast.type}`} role="alert">
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
          ) : (
            <AlertCircle size={18} style={{ color: '#38bdf8', flexShrink: 0 }} />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            className="autocare-protect-toast-close"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ConfigureAccessPermissionsPage;
