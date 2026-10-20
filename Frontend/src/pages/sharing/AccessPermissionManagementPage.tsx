import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  X,
  ShieldCheck,
  AlertCircle,
  Sliders,
  Ban,
  Loader2,
  Link as LinkIcon,
  QrCode,
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { getMyVehicles, type Vehicle } from '../../services/vehicleService';
import {
  getShareLinks,
  revokeShareLink,
  updateShareLinkPermissions,
  type ShareLinkPermissionLevel,
} from '../../services/shareLinkService';
import {
  getQRShares,
  revokeQRShare,
  updateQRSharePermissions,
  type QRSharePermissionLevel,
} from '../../services/qrShareService';
import '../../styles/permissions.css';

type PermissionMode = 'Full Access' | 'Limited Access' | 'Selected Records';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'info';
}

export interface UnifiedAccessGrant {
  id: string;
  type: 'link' | 'qr';
  vehicle: string;
  vehicleId: string;
  recipientName: string;
  recipientEmail?: string;
  purpose: string;
  permissionLevel: 'full' | 'limited' | 'selected';
  allowedSections: string[];
  expiresAt: string;
  status: 'active' | 'revoked' | 'expired';
  createdAt: string;
  maxViews?: number | null;
  viewCount?: number;
  maxScans?: number | null;
  scanCount?: number;
}

const AccessPermissionManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Vehicles state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [loadingVehicles, setLoadingVehicles] = useState<boolean>(true);

  // Unified access grants state
  const [unifiedGrants, setUnifiedGrants] = useState<UnifiedAccessGrant[]>([]);
  const [selectedGrantId, setSelectedGrantId] = useState<string>('');
  const [selectedGrant, setSelectedGrant] = useState<UnifiedAccessGrant | null>(null);
  const [loadingGrants, setLoadingGrants] = useState<boolean>(false);

  // Active editable permission parameters
  const [selectedMode, setSelectedMode] = useState<PermissionMode>('Selected Records');
  const [allowedSections, setAllowedSections] = useState<string[]>(['serviceDates', 'engineRepair']);
  const [expiresDateTime, setExpiresDateTime] = useState<string>('');

  // Async action states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRevoking, setIsRevoking] = useState<boolean>(false);

  // Toast notification state
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

  // Helper to format ISO date string for datetime-local input
  const toDateTimeLocalValue = (isoStr: string) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Helper to format display date string for summary table
  const getFormattedExpiryDisplay = (dtStr: string) => {
    if (!dtStr) return 'Not set';
    const d = new Date(dtStr);
    if (isNaN(d.getTime())) return dtStr;
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Apply selected grant to component form state
  const applyGrantToState = useCallback((grant: UnifiedAccessGrant) => {
    setSelectedGrant(grant);
    setSelectedGrantId(grant.id);

    if (grant.permissionLevel === 'full') {
      setSelectedMode('Full Access');
    } else if (grant.permissionLevel === 'limited') {
      setSelectedMode('Limited Access');
    } else {
      setSelectedMode('Selected Records');
    }

    setAllowedSections(
      grant.allowedSections && grant.allowedSections.length > 0
        ? grant.allowedSections
        : ['serviceDates', 'engineRepair']
    );

    setExpiresDateTime(toDateTimeLocalValue(grant.expiresAt));
  }, []);

  // Fetch all ShareLinks and QRShares for the target vehicle
  const loadGrantsForVehicle = useCallback(
    async (vehicleId: string, currentVeh?: Vehicle, preferredGrantId?: string) => {
      if (!vehicleId) {
        setUnifiedGrants([]);
        setSelectedGrant(null);
        setSelectedGrantId('');
        return;
      }

      try {
        setLoadingGrants(true);
        const vObj = currentVeh || vehicles.find((v) => v._id === vehicleId);
        const vStr = vObj
          ? `${vObj.registrationNumber} · ${vObj.manufacturer} ${vObj.model}`
          : 'Selected Vehicle';

        const [links, qrs] = await Promise.all([
          getShareLinks({ vehicleId }).catch(() => []),
          getQRShares({ vehicleId }).catch(() => []),
        ]);

        const mappedLinks: UnifiedAccessGrant[] = (links || []).map((l) => ({
          id: l._id,
          type: 'link',
          vehicle: vStr,
          vehicleId,
          recipientName: l.recipientName || 'Secure Share Link',
          recipientEmail: l.recipientEmail || '',
          purpose: l.purpose || 'Pre-purchase Inspection',
          permissionLevel: l.permissionLevel,
          allowedSections: l.allowedSections || [],
          expiresAt: l.expiresAt,
          status: l.status,
          createdAt: l.createdAt,
          maxViews: l.maxViews,
          viewCount: l.viewCount,
        }));

        const mappedQRs: UnifiedAccessGrant[] = (qrs || []).map((q) => ({
          id: q._id,
          type: 'qr',
          vehicle: vStr,
          vehicleId,
          recipientName: q.recipientName || q.qrLabel || 'QR Authorization Certificate',
          recipientEmail: '',
          purpose: q.purpose || 'QR Window Sticker Verification',
          permissionLevel: q.permissionLevel,
          allowedSections: q.allowedSections || [],
          expiresAt: q.expiresAt,
          status: q.status,
          createdAt: q.createdAt,
          maxScans: q.maxScans,
          scanCount: q.scanCount,
        }));

        // Combine into unified list and sort newest first
        const combined = [...mappedLinks, ...mappedQRs].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setUnifiedGrants(combined);

        if (combined.length > 0) {
          const targetId = preferredGrantId || selectedGrantId;
          const match = combined.find((g) => g.id === targetId) || combined[0];
          applyGrantToState(match);
        } else {
          setSelectedGrantId('');
          setSelectedGrant(null);
          // Set a default 48-hour future date for the expiry input if no grant is active
          const future = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
          setExpiresDateTime(toDateTimeLocalValue(future));
        }
      } catch (err: unknown) {
        console.error('Failed to load vehicle access grants:', err);
        showToast('Failed to load sharing records for this vehicle.', 'info');
      } finally {
        setLoadingGrants(false);
      }
    },
    [vehicles, selectedGrantId, applyGrantToState]
  );

  // Initial load: Owner vehicles
  useEffect(() => {
    let isMounted = true;

    const fetchVehicles = async () => {
      try {
        setLoadingVehicles(true);
        const data = await getMyVehicles();
        const vList = data || [];
        if (!isMounted) return;
        setVehicles(vList);

        if (vList.length > 0) {
          // Check if passed via location state
          const stateVehicleId = (location.state as { vehicleId?: string })?.vehicleId;
          const initialVehicleId =
            stateVehicleId && vList.some((v) => v._id === stateVehicleId)
              ? stateVehicleId
              : vList[0]._id;

          setSelectedVehicleId(initialVehicleId);
          const initialVeh = vList.find((v) => v._id === initialVehicleId);
          loadGrantsForVehicle(initialVehicleId, initialVeh);
        }
      } catch (err: unknown) {
        console.error('Failed to load owner vehicles:', err);
        showToast('Failed to load registered vehicles.', 'info');
      } finally {
        if (isMounted) setLoadingVehicles(false);
      }
    };

    fetchVehicles();

    return () => {
      isMounted = false;
    };
  }, [location.state, loadGrantsForVehicle]);

  // Mode selection handler
  const handleModeSelect = (mode: PermissionMode) => {
    if (selectedGrant && selectedGrant.status !== 'active') {
      showToast(
        `Cannot change permissions. This grant is currently ${selectedGrant.status}.`,
        'info'
      );
      return;
    }
    setSelectedMode(mode);
    if (mode === 'Selected Records' && allowedSections.length === 0) {
      setAllowedSections(['serviceDates', 'engineRepair']);
    }
  };

  // Toggle category section for Selected Records
  const toggleSection = (sectionKey: string) => {
    if (selectedGrant && selectedGrant.status !== 'active') return;
    setAllowedSections((prev) =>
      prev.includes(sectionKey)
        ? prev.filter((s) => s !== sectionKey)
        : [...prev, sectionKey]
    );
  };

  // Save / Update Permissions
  const handleUpdatePermissions = async () => {
    if (!selectedGrant) {
      showToast('Please select an active access grant to update.', 'info');
      return;
    }

    if (selectedGrant.status !== 'active') {
      showToast(
        `Cannot update permissions on a ${selectedGrant.status} access grant.`,
        'info'
      );
      return;
    }

    const expDate = new Date(expiresDateTime);
    if (isNaN(expDate.getTime()) || expDate <= new Date()) {
      showToast('Expiration date/time must be a valid future date.', 'info');
      return;
    }

    const permissionLevel: ShareLinkPermissionLevel | QRSharePermissionLevel =
      selectedMode === 'Full Access'
        ? 'full'
        : selectedMode === 'Limited Access'
        ? 'limited'
        : 'selected';

    if (permissionLevel === 'selected' && allowedSections.length === 0) {
      showToast(
        'Please select at least one record category for Selected Records.',
        'info'
      );
      return;
    }

    try {
      setIsSubmitting(true);

      if (selectedGrant.type === 'link') {
        const updatedLink = await updateShareLinkPermissions(selectedGrant.id, {
          permissionLevel,
          allowedSections: permissionLevel === 'selected' ? allowedSections : [],
          expiresAt: expDate.toISOString(),
        });
        showToast(
          `Permissions updated successfully for "${updatedLink.recipientName || 'Share Link'}".`,
          'success'
        );
      } else {
        const updatedQR = await updateQRSharePermissions(selectedGrant.id, {
          permissionLevel,
          allowedSections: permissionLevel === 'selected' ? allowedSections : [],
          expiresAt: expDate.toISOString(),
        });
        showToast(
          `Permissions updated successfully for "${updatedQR.recipientName || updatedQR.qrLabel || 'QR Certificate'}".`,
          'success'
        );
      }

      await loadGrantsForVehicle(selectedVehicleId, undefined, selectedGrant.id);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to update access permissions.';
      showToast(errorMsg, 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Revoke Access
  const handleRevokeGrant = async () => {
    if (!selectedGrant) return;

    if (selectedGrant.status !== 'active') {
      showToast(`Cannot revoke grant with status "${selectedGrant.status}".`, 'info');
      return;
    }

    try {
      setIsRevoking(true);
      if (selectedGrant.type === 'link') {
        await revokeShareLink(selectedGrant.id);
      } else {
        await revokeQRShare(selectedGrant.id);
      }

      showToast(
        `Access grant for "${selectedGrant.recipientName || 'grant'}" has been revoked successfully.`,
        'success'
      );
      await loadGrantsForVehicle(selectedVehicleId, undefined, selectedGrant.id);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to revoke access.';
      showToast(errorMsg, 'info');
    } finally {
      setIsRevoking(false);
    }
  };

  // Dynamic summary metadata based on selected permission mode
  const getSummaryData = () => {
    switch (selectedMode) {
      case 'Full Access':
        return {
          allowed: 'Complete service history, Costs and invoices, Documents and images',
          hidden: 'None (Full visibility granted)',
          categoriesCount: 'All record categories visible',
        };
      case 'Limited Access':
        return {
          allowed: 'Service dates, Mileage readings, Garage details',
          hidden: 'Costs, Invoices, Documents and images',
          categoriesCount: 'Basic operational categories visible',
        };
      case 'Selected Records':
      default: {
        const allowedList: string[] = [];
        const hiddenList: string[] = [];

        if (allowedSections.includes('serviceDates')) allowedList.push('Periodic service');
        else hiddenList.push('Periodic service');

        if (allowedSections.includes('engineRepair')) allowedList.push('Engine repairs');
        else hiddenList.push('Engine repairs');

        if (allowedSections.includes('documents')) allowedList.push('Insurance & docs');
        else hiddenList.push('Insurance & docs');

        if (allowedSections.includes('invoices')) allowedList.push('Invoices & costs');
        else hiddenList.push('Invoices & costs');

        return {
          allowed: allowedList.length > 0 ? allowedList.join(', ') : 'None selected',
          hidden: hiddenList.length > 0 ? hiddenList.join(', ') : 'None',
          categoriesCount: `${allowedList.length} record categories visible`,
        };
      }
    }
  };

  const summary = getSummaryData();
  const currentVeh = vehicles.find((v) => v._id === selectedVehicleId);

  return (
    <div className="autocare-perm-page">
      <Navbar />

      <main className="autocare-perm-main">
        <div className="autocare-perm-container">
          {/* Breadcrumb / Back Navigation */}
          <div className="autocare-perm-back-nav">
            <button
              type="button"
              className="autocare-perm-back-btn"
              onClick={() => navigate(-1)}
              title="Return to previous screen"
            >
              <ArrowLeft size={16} />
              <span>Back to sharing options</span>
            </button>
          </div>

          {/* Top Header Row matching Figma target */}
          <header className="autocare-perm-header-row">
            <div className="autocare-perm-title-group">
              <h1 className="autocare-perm-title">Access Permission Management</h1>
              <p className="autocare-perm-subtitle">
                BR-06 · Grant the minimum record access needed.
              </p>
            </div>

            <div className="autocare-perm-header-actions">
              <Link
                to="/sharing/protection"
                state={{
                  shareType: selectedGrant?.type || 'link',
                  shareId: selectedGrant?.id || '',
                  vehicleId: selectedVehicleId || '',
                }}
                className="autocare-perm-back-btn"
                style={{
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0056A2',
                  padding: '9px 18px',
                  borderRadius: '8px',
                }}
                title="Configure advanced protection"
              >
                <Sliders size={15} />
                <span>Configure protection</span>
              </Link>

              <button
                type="button"
                className="autocare-perm-btn-grant"
                onClick={handleUpdatePermissions}
                disabled={
                  isSubmitting ||
                  isRevoking ||
                  !selectedGrant ||
                  selectedGrant.status !== 'active'
                }
                style={{
                  opacity: selectedGrant?.status === 'active' ? 1 : 0.6,
                  cursor: selectedGrant?.status === 'active' ? 'pointer' : 'not-allowed',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="spin-icon" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Update permissions</span>
                  </>
                )}
              </button>
            </div>
          </header>

          {/* Card 1: Target Vehicle and Access Grants Selector */}
          <section className="autocare-perm-recipient-card" aria-label="Target Vehicle and Active Grant Context">
            <h2 className="autocare-perm-recipient-title">Target vehicle &amp; access grant</h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                marginBottom: '18px',
              }}
            >
              <div>
                <label
                  htmlFor="perm-vehicle-select"
                  className="autocare-perm-label"
                  style={{ display: 'block', marginBottom: '6px' }}
                >
                  Select Vehicle
                </label>
                {loadingVehicles ? (
                  <div
                    className="autocare-perm-input"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}
                  >
                    <Loader2 size={15} className="spin-icon" />
                    <span>Loading vehicles...</span>
                  </div>
                ) : (
                  <select
                    id="perm-vehicle-select"
                    className="autocare-perm-input"
                    value={selectedVehicleId}
                    onChange={(e) => {
                      const vId = e.target.value;
                      setSelectedVehicleId(vId);
                      const targetVeh = vehicles.find((v) => v._id === vId);
                      loadGrantsForVehicle(vId, targetVeh);
                    }}
                  >
                    {vehicles.length === 0 ? (
                      <option value="">No vehicles found</option>
                    ) : (
                      vehicles.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.registrationNumber} · {v.manufacturer} {v.model}
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>

              <div>
                <label
                  htmlFor="perm-grant-select"
                  className="autocare-perm-label"
                  style={{ display: 'block', marginBottom: '6px' }}
                >
                  Select Access Grant ({unifiedGrants.length})
                </label>
                {loadingGrants ? (
                  <div
                    className="autocare-perm-input"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}
                  >
                    <Loader2 size={15} className="spin-icon" />
                    <span>Loading grants...</span>
                  </div>
                ) : (
                  <select
                    id="perm-grant-select"
                    className="autocare-perm-input"
                    value={selectedGrantId}
                    onChange={(e) => {
                      const gId = e.target.value;
                      setSelectedGrantId(gId);
                      const g = unifiedGrants.find((item) => item.id === gId);
                      if (g) applyGrantToState(g);
                    }}
                    disabled={unifiedGrants.length === 0}
                  >
                    {unifiedGrants.length === 0 ? (
                      <option value="">No active or historical grants for this vehicle</option>
                    ) : (
                      unifiedGrants.map((g) => (
                        <option key={g.id} value={g.id}>
                          [{g.type.toUpperCase()}] {g.recipientName} · {g.status.toUpperCase()} ({g.permissionLevel.toUpperCase()})
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>
            </div>

            {/* Recipient Context Display */}
            <div className="autocare-perm-recipient-row">
              <div className="autocare-perm-recipient-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span className="autocare-perm-recipient-name">
                    {selectedGrant
                      ? selectedGrant.recipientName
                      : loadingGrants
                      ? 'Loading grants...'
                      : 'No access grant selected'}
                  </span>
                  {selectedGrant && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: selectedGrant.type === 'link' ? '#eff6ff' : '#f5f3ff',
                        color: selectedGrant.type === 'link' ? '#0056A2' : '#7c3aed',
                        border: `1px solid ${selectedGrant.type === 'link' ? '#bfdbfe' : '#ddd6fe'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {selectedGrant.type === 'link' ? <LinkIcon size={11} /> : <QrCode size={11} />}
                      <span>{selectedGrant.type === 'link' ? 'SECURE LINK' : 'QR AUTHORIZATION'}</span>
                    </span>
                  )}
                </div>

                <span className="autocare-perm-recipient-role">
                  {selectedGrant ? (
                    <>
                      {selectedGrant.purpose || 'Vehicle Inspection & Verification'}
                      {selectedGrant.recipientEmail ? ` · ${selectedGrant.recipientEmail}` : ''}
                      {selectedGrant.type === 'link' && selectedGrant.maxViews
                        ? ` · ${selectedGrant.viewCount ?? 0}/${selectedGrant.maxViews} views`
                        : ''}
                      {selectedGrant.type === 'qr' && selectedGrant.maxScans
                        ? ` · ${selectedGrant.scanCount ?? 0}/${selectedGrant.maxScans} scans`
                        : ''}
                    </>
                  ) : (
                    'Select an active vehicle access grant above to configure permission policies'
                  )}
                </span>
              </div>

              {selectedGrant && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor:
                      selectedGrant.status === 'active'
                        ? '#eaf7ec'
                        : selectedGrant.status === 'revoked'
                        ? '#fef2f2'
                        : '#fff7ed',
                    border: `1px solid ${
                      selectedGrant.status === 'active'
                        ? '#d1f2d4'
                        : selectedGrant.status === 'revoked'
                        ? '#fecaca'
                        : '#fed7aa'
                    }`,
                    color:
                      selectedGrant.status === 'active'
                        ? '#15803d'
                        : selectedGrant.status === 'revoked'
                        ? '#dc2626'
                        : '#c2410c',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}
                >
                  {selectedGrant.status === 'active' ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <AlertCircle size={14} />
                  )}
                  <span>{selectedGrant.status.toUpperCase()}</span>
                </div>
              )}
            </div>
          </section>

          {/* Card Stack 2: 3 Permission Option Cards */}
          <section className="autocare-perm-options-grid" aria-label="Permission Options">
            {/* Card Option 1: Full Access */}
            <div
              className={`autocare-perm-option-card ${
                selectedMode === 'Full Access' ? 'is-selected' : ''
              }`}
              onClick={() => handleModeSelect('Full Access')}
              role="button"
              tabIndex={0}
              style={{
                cursor: selectedGrant?.status === 'active' ? 'pointer' : 'not-allowed',
                opacity: selectedGrant?.status === 'active' ? 1 : 0.8,
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleModeSelect('Full Access');
              }}
            >
              <div className="autocare-perm-option-header">
                <h3 className="autocare-perm-option-title">Full Access</h3>
                <p className="autocare-perm-option-desc">
                  Complete service history, costs and documents
                </p>
              </div>

              <div className="autocare-perm-option-list">
                <div className="autocare-perm-list-bullet">
                  <span>•</span>
                  <span>Complete service history</span>
                </div>
                <div className="autocare-perm-list-bullet">
                  <span>•</span>
                  <span>Costs and invoices</span>
                </div>
                <div className="autocare-perm-list-bullet">
                  <span>•</span>
                  <span>Documents and images</span>
                </div>
              </div>

              <div className="autocare-perm-option-footer">
                <span
                  className={`autocare-perm-pill-status ${
                    selectedMode === 'Full Access' ? 'selected' : 'not-selected'
                  }`}
                >
                  {selectedMode === 'Full Access' ? 'SELECTED' : 'NOT SELECTED'}
                </span>
              </div>
            </div>

            {/* Card Option 2: Limited Access */}
            <div
              className={`autocare-perm-option-card ${
                selectedMode === 'Limited Access' ? 'is-selected' : ''
              }`}
              onClick={() => handleModeSelect('Limited Access')}
              role="button"
              tabIndex={0}
              style={{
                cursor: selectedGrant?.status === 'active' ? 'pointer' : 'not-allowed',
                opacity: selectedGrant?.status === 'active' ? 1 : 0.8,
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleModeSelect('Limited Access');
              }}
            >
              <div className="autocare-perm-option-header">
                <h3 className="autocare-perm-option-title">Limited Access</h3>
                <p className="autocare-perm-option-desc">
                  Essential operational history only
                </p>
              </div>

              <div className="autocare-perm-option-list">
                <div className="autocare-perm-list-bullet">
                  <span>•</span>
                  <span>Service dates</span>
                </div>
                <div className="autocare-perm-list-bullet">
                  <span>•</span>
                  <span>Mileage readings</span>
                </div>
                <div className="autocare-perm-list-bullet">
                  <span>•</span>
                  <span>Garage details</span>
                </div>
              </div>

              <div className="autocare-perm-option-footer">
                <span
                  className={`autocare-perm-pill-status ${
                    selectedMode === 'Limited Access' ? 'selected' : 'not-selected'
                  }`}
                >
                  {selectedMode === 'Limited Access' ? 'SELECTED' : 'NOT SELECTED'}
                </span>
              </div>
            </div>

            {/* Card Option 3: Selected Records */}
            <div
              className={`autocare-perm-option-card ${
                selectedMode === 'Selected Records' ? 'is-selected' : ''
              }`}
              onClick={() => handleModeSelect('Selected Records')}
              role="button"
              tabIndex={0}
              style={{
                cursor: selectedGrant?.status === 'active' ? 'pointer' : 'not-allowed',
                opacity: selectedGrant?.status === 'active' ? 1 : 0.8,
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleModeSelect('Selected Records');
              }}
            >
              <div className="autocare-perm-option-header">
                <h3 className="autocare-perm-option-title">Selected Records</h3>
                <p className="autocare-perm-option-desc">
                  Precisely control individual categories
                </p>
              </div>

              <div className="autocare-perm-option-list">
                {selectedMode === 'Selected Records' ? (
                  <>
                    <div
                      className={
                        allowedSections.includes('engineRepair')
                          ? 'autocare-perm-list-allowed'
                          : 'autocare-perm-list-hidden'
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection('engineRepair');
                      }}
                      style={{
                        cursor: selectedGrant?.status === 'active' ? 'pointer' : 'default',
                        userSelect: 'none',
                      }}
                      title="Toggle engine repair history"
                    >
                      {allowedSections.includes('engineRepair') ? (
                        <Check size={15} />
                      ) : (
                        <X size={15} />
                      )}
                      <span>
                        Engine repair history —{' '}
                        {allowedSections.includes('engineRepair') ? 'allowed' : 'hidden'}
                      </span>
                    </div>

                    <div
                      className={
                        allowedSections.includes('documents')
                          ? 'autocare-perm-list-allowed'
                          : 'autocare-perm-list-hidden'
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection('documents');
                      }}
                      style={{
                        cursor: selectedGrant?.status === 'active' ? 'pointer' : 'default',
                        userSelect: 'none',
                      }}
                      title="Toggle insurance & documents"
                    >
                      {allowedSections.includes('documents') ? (
                        <Check size={15} />
                      ) : (
                        <X size={15} />
                      )}
                      <span>
                        Insurance documents —{' '}
                        {allowedSections.includes('documents') ? 'allowed' : 'hidden'}
                      </span>
                    </div>

                    <div
                      className={
                        allowedSections.includes('serviceDates')
                          ? 'autocare-perm-list-allowed'
                          : 'autocare-perm-list-hidden'
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection('serviceDates');
                      }}
                      style={{
                        cursor: selectedGrant?.status === 'active' ? 'pointer' : 'default',
                        userSelect: 'none',
                      }}
                      title="Toggle periodic service records"
                    >
                      {allowedSections.includes('serviceDates') ? (
                        <Check size={15} />
                      ) : (
                        <X size={15} />
                      )}
                      <span>
                        Periodic service records —{' '}
                        {allowedSections.includes('serviceDates') ? 'allowed' : 'hidden'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="autocare-perm-list-allowed">
                      <Check size={15} />
                      <span>Engine repair history — allowed</span>
                    </div>
                    <div className="autocare-perm-list-hidden">
                      <X size={15} />
                      <span>Insurance documents — hidden</span>
                    </div>
                    <div className="autocare-perm-list-bullet">
                      <Check size={15} style={{ color: '#10b981' }} />
                      <span>Periodic service records</span>
                    </div>
                  </>
                )}
              </div>

              <div className="autocare-perm-option-footer">
                <span
                  className={`autocare-perm-pill-status ${
                    selectedMode === 'Selected Records' ? 'selected' : 'not-selected'
                  }`}
                >
                  {selectedMode === 'Selected Records' ? 'SELECTED' : 'NOT SELECTED'}
                </span>
              </div>
            </div>
          </section>

          {/* Bottom Split Section: Permission Summary (Left) + Review Panel (Right) */}
          <div className="autocare-perm-bottom-grid">
            {/* Left: Permission Summary Card */}
            <section className="autocare-perm-summary-card" aria-label="Permission Summary">
              <h2 className="autocare-perm-summary-title">Permission summary</h2>

              <div className="autocare-perm-summary-table">
                <div className="autocare-perm-summary-row">
                  <span className="autocare-perm-summary-label">Vehicle</span>
                  <span className="autocare-perm-summary-val">
                    {selectedGrant
                      ? selectedGrant.vehicle
                      : currentVeh
                      ? `${currentVeh.registrationNumber} · ${currentVeh.manufacturer} ${currentVeh.model}`
                      : 'None'}
                  </span>
                </div>

                <div className="autocare-perm-summary-row">
                  <span className="autocare-perm-summary-label">Access Mode</span>
                  <span className="autocare-perm-summary-val">
                    {selectedMode}{' '}
                    {selectedGrant
                      ? `(${selectedGrant.type === 'link' ? 'Share Link' : 'QR Code'})`
                      : ''}
                  </span>
                </div>

                <div className="autocare-perm-summary-row">
                  <span className="autocare-perm-summary-label">Allowed</span>
                  <span className="autocare-perm-summary-val">{summary.allowed}</span>
                </div>

                <div className="autocare-perm-summary-row">
                  <span className="autocare-perm-summary-label">Hidden</span>
                  <span className="autocare-perm-summary-val">{summary.hidden}</span>
                </div>

                <div className="autocare-perm-summary-row">
                  <span className="autocare-perm-summary-label">Expiration</span>
                  <span className="autocare-perm-summary-val">
                    {getFormattedExpiryDisplay(expiresDateTime)}
                  </span>
                </div>
              </div>
            </section>

            {/* Right: Review Panel Card */}
            <section className="autocare-perm-review-card" aria-label="Review Panel">
              <h2 className="autocare-perm-review-title">Review panel</h2>

              <div
                className="autocare-perm-badge-ready"
                style={{
                  backgroundColor:
                    !selectedGrant
                      ? '#f1f5f9'
                      : selectedGrant.status === 'active'
                      ? '#eaf7ec'
                      : selectedGrant.status === 'revoked'
                      ? '#fef2f2'
                      : '#fff7ed',
                  borderColor:
                    !selectedGrant
                      ? '#cbd5e1'
                      : selectedGrant.status === 'active'
                      ? '#d1f2d4'
                      : selectedGrant.status === 'revoked'
                      ? '#fecaca'
                      : '#fed7aa',
                  color:
                    !selectedGrant
                      ? '#64748b'
                      : selectedGrant.status === 'active'
                      ? '#15803d'
                      : selectedGrant.status === 'revoked'
                      ? '#dc2626'
                      : '#c2410c',
                }}
              >
                {!selectedGrant
                  ? 'NO GRANT SELECTED'
                  : selectedGrant.status === 'active'
                  ? 'READY TO UPDATE'
                  : selectedGrant.status === 'revoked'
                  ? 'GRANT REVOKED'
                  : 'GRANT EXPIRED'}
              </div>

              <div className="autocare-perm-review-headline">
                {summary.categoriesCount}
              </div>

              <p className="autocare-perm-review-desc">
                {selectedGrant?.status === 'active'
                  ? 'Recipient can view according to configured scope. Every access event is registered in BR-08 Audit Trail.'
                  : `This access certificate is currently ${selectedGrant?.status || 'inactive'}. No external viewing sessions are permitted.`}
              </p>

              <div className="autocare-perm-form-group">
                <label htmlFor="perm-expiration-input" className="autocare-perm-label">
                  Expiration
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="perm-expiration-input"
                    type="datetime-local"
                    className="autocare-perm-input"
                    value={expiresDateTime}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={(e) => setExpiresDateTime(e.target.value)}
                    disabled={isSubmitting || isRevoking || !selectedGrant || selectedGrant.status !== 'active'}
                    style={{
                      cursor: selectedGrant?.status === 'active' ? 'text' : 'not-allowed',
                      opacity: selectedGrant?.status === 'active' ? 1 : 0.75,
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                className="autocare-perm-btn-panel-grant"
                onClick={handleUpdatePermissions}
                disabled={
                  isSubmitting ||
                  isRevoking ||
                  !selectedGrant ||
                  selectedGrant.status !== 'active'
                }
                style={{
                  opacity: selectedGrant?.status === 'active' ? 1 : 0.6,
                  cursor: selectedGrant?.status === 'active' ? 'pointer' : 'not-allowed',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="spin-icon" />
                    <span>Updating permissions...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>
                      {selectedGrant?.status === 'active'
                        ? 'Update permissions'
                        : 'Editing disabled'}
                    </span>
                  </>
                )}
              </button>

              {/* Revoke Button for active grants */}
              {selectedGrant && selectedGrant.status === 'active' && (
                <button
                  type="button"
                  onClick={handleRevokeGrant}
                  disabled={isRevoking || isSubmitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: '10px',
                    background: '#ffffff',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    fontSize: '13px',
                    fontWeight: 700,
                    padding: '9px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    width: '100%',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                  }}
                  title="Immediately revoke this access grant"
                >
                  {isRevoking ? (
                    <>
                      <Loader2 size={14} className="spin-icon" />
                      <span>Revoking access...</span>
                    </>
                  ) : (
                    <>
                      <Ban size={14} />
                      <span>Revoke access</span>
                    </>
                  )}
                </button>
              )}

              <Link
                to="/sharing/protection"
                state={{
                  shareType: selectedGrant?.type || 'link',
                  shareId: selectedGrant?.id || '',
                  vehicleId: selectedVehicleId || '',
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '10px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#0056A2',
                  fontSize: '13px',
                  fontWeight: 700,
                  padding: '9px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                title="Configure advanced data protection"
              >
                <Sliders size={14} />
                <span>Configure protection</span>
              </Link>
            </section>
          </div>
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toast.show && (
        <div className={`autocare-perm-toast is-${toast.type}`} role="alert">
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
          ) : (
            <AlertCircle size={18} style={{ color: '#38bdf8', flexShrink: 0 }} />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            className="autocare-perm-toast-close"
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

export default AccessPermissionManagementPage;

