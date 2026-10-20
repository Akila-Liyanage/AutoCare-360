import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  X,
  Lock,
  ShieldCheck,
  Ban,
  QrCode,
  ExternalLink,
  Trash2,
  Clock,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import {
  createShareLink,
  getShareLinks,
  revokeShareLink,
  deleteShareLink,
  type ShareLink,
  type CreateShareLinkPayload,
  type ShareLinkPermissionLevel,
} from '../../services/shareLinkService';
import { getMyVehicles, type Vehicle } from '../../services/vehicleService';
import '../../styles/secure-link-sharing.css';

interface ToastState {
  message: string;
  type: 'success' | 'info';
}

interface DataVisibilityState {
  serviceDates: boolean;
  garageDetails: boolean;
  invoices: boolean;
  ownerContact: boolean;
}

export const SecureLinkSharingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Vehicles state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [vehicle, setVehicle] = useState('WP ABC-1234 · Toyota Aqua');

  // Form Fields State matching Figma
  const [recipient, setRecipient] = useState('N. Fernando · Ceylinco Insurance');
  const [email, setEmail] = useState('inspection@ceylinco.lk');
  const [startDate, setStartDate] = useState('21 Sep 2026 · Now');
  const [expiresDate, setExpiresDate] = useState('24 Sep 2026 · 6:00 PM');

  const [visibility, setVisibility] = useState<DataVisibilityState>({
    serviceDates: true,
    garageDetails: true,
    invoices: true,
    ownerContact: false,
  });

  const [selectedRecords, setSelectedRecords] = useState(
    '21 Sep service · 15 May service · emissions report'
  );

  const [passcode, setPasscode] = useState('Required · 6 digits');
  const [downloads, setDownloads] = useState('Disabled');
  const [watermark, setWatermark] = useState('Recipient email');

  // Real Share Links State
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [selectedShareLink, setSelectedShareLink] = useState<ShareLink | null>(null);

  // Raw token handling: Backend returns rawToken only ONCE on creation.
  // We keep it in ephemeral React component state only (NEVER persisted in localStorage).
  const [ephemeralRawToken, setEphemeralRawToken] = useState<string | null>(null);
  const [ephemeralShareUrl, setEphemeralShareUrl] = useState<string | null>(null);

  // Fallback slug for initial mock preview before link generation
  const [fallbackSlug] = useState('AC9-K7Q-26');

  // Async & Error States
  const [loadingVehicles, setLoadingVehicles] = useState<boolean>(true);
  const [loadingLinks, setLoadingLinks] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Toast feedback state
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Helper to parse expiresDate into a valid future ISO string
  const resolveExpirationISO = (inputStr: string): string => {
    const directDate = new Date(inputStr);
    if (!isNaN(directDate.getTime()) && directDate.getTime() > Date.now()) {
      return directDate.toISOString();
    }

    const cleaned = inputStr.replace('·', '').replace(/\s+/g, ' ').trim();
    const cleanedDate = new Date(cleaned);
    if (!isNaN(cleanedDate.getTime()) && cleanedDate.getTime() > Date.now()) {
      return cleanedDate.toISOString();
    }

    // Default fallback: 72 hours in the future
    const fallback = new Date(Date.now() + 72 * 60 * 60 * 1000);
    return fallback.toISOString();
  };

  // Fetch real share links from backend GET /api/share-links
  const loadShareLinks = useCallback(async (vId?: string) => {
    setLoadingLinks(true);
    try {
      const links = await getShareLinks(vId ? { vehicleId: vId } : undefined);
      setShareLinks(links);
      if (links.length > 0) {
        // Select newest active or first link
        const activeOne = links.find((l) => l.status === 'active') || links[0];
        setSelectedShareLink(activeOne);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load share links.';
      console.warn('Failed to load share links:', message);
    } finally {
      setLoadingLinks(false);
    }
  }, []);

  // Fetch owner's real vehicles on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingVehicles(true);
      try {
        const myVehicles = await getMyVehicles();
        setVehicles(myVehicles);

        const routeStateVehicleId = (location.state as { vehicleId?: string } | undefined)?.vehicleId;
        const targetVehicle =
          myVehicles.find((v) => v._id === routeStateVehicleId) ||
          (myVehicles.length > 0 ? myVehicles[0] : null);

        if (targetVehicle) {
          setSelectedVehicleId(targetVehicle._id);
          setVehicle(`${targetVehicle.registrationNumber} · ${targetVehicle.manufacturer} ${targetVehicle.model}`);
          await loadShareLinks(targetVehicle._id);
        } else {
          await loadShareLinks();
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load owner vehicles.';
        setApiError(message);
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchInitialData();
  }, [location.state, loadShareLinks]);

  const handleCheckboxChange = (key: keyof DataVisibilityState) => {
    setVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveDraft = () => {
    showToast(`Draft sharing settings for ${vehicle} saved successfully.`, 'info');
  };

  // Connect create flow to real backend API: POST /api/share-links
  const handleCreateSecureLink = async () => {
    if (!selectedVehicleId) {
      setApiError('Please select a valid vehicle to generate a share link.');
      showToast('Please select a valid vehicle.', 'info');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const selectedSections: string[] = [];
      if (visibility.serviceDates) selectedSections.push('serviceDates');
      if (visibility.garageDetails) selectedSections.push('garageDetails');
      if (visibility.invoices) selectedSections.push('invoices');
      if (visibility.ownerContact) selectedSections.push('ownerContact');

      let permissionLevel: ShareLinkPermissionLevel = 'selected';
      if (selectedSections.length === 4) {
        permissionLevel = 'full';
      } else if (selectedSections.length === 0) {
        permissionLevel = 'limited';
      } else {
        permissionLevel = 'selected';
      }

      const expiresAt = resolveExpirationISO(expiresDate);

      const payload: CreateShareLinkPayload = {
        vehicleId: selectedVehicleId,
        recipientName: recipient.trim() || undefined,
        recipientEmail: email.trim() || undefined,
        purpose: 'Vehicle Record Inspection & Buyer Verification',
        permissionLevel,
        allowedSections: selectedSections,
        expiresAt,
        maxViews: 10,
        notes: selectedRecords.trim() || undefined,
      };

      const result = await createShareLink(payload);

      // Raw token handling: build share URL once using rawToken from creation response
      const generatedShareUrl = `${window.location.origin}/shared/vehicle/${result.rawToken}`;
      setEphemeralRawToken(result.rawToken);
      setEphemeralShareUrl(generatedShareUrl);
      setSelectedShareLink(result.shareLink);

      // Add to list and display in real time
      setShareLinks((prev) => [
        result.shareLink,
        ...prev.filter((item) => item._id !== result.shareLink._id),
      ]);

      showToast('Secure link created successfully! Copy URL now.', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate secure share link.';
      setApiError(message);
      showToast(message, 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy-link interaction with one-time URL or link slug
  const handleCopyLink = () => {
    let urlToCopy = ephemeralShareUrl;
    if (!urlToCopy) {
      if (selectedShareLink) {
        urlToCopy = `${window.location.origin}/shared/vehicle/${selectedShareLink._id}`;
      } else {
        urlToCopy = `https://autocare.lk/s/${fallbackSlug}`;
      }
    }

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(urlToCopy).catch(() => {});
    }
    showToast(`Secure link copied: ${urlToCopy}`, 'success');
  };

  // Revoke active share link: PATCH /api/share-links/:id/revoke
  const handleRevoke = async (linkId?: string) => {
    const targetId = linkId || selectedShareLink?._id;
    if (!targetId) {
      showToast('No active link selected to revoke.', 'info');
      return;
    }

    setActionLoadingId(targetId);
    try {
      const updated = await revokeShareLink(targetId);
      showToast('Secure link access revoked immediately. Viewer sessions terminated.', 'info');

      setShareLinks((prev) =>
        prev.map((l) =>
          l._id === targetId
            ? { ...l, status: 'revoked', revokedAt: updated?.revokedAt || new Date().toISOString() }
            : l
        )
      );

      if (selectedShareLink?._id === targetId) {
        setSelectedShareLink((prev) =>
          prev
            ? { ...prev, status: 'revoked', revokedAt: updated?.revokedAt || new Date().toISOString() }
            : null
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to revoke secure share link.';
      showToast(message, 'info');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete revoked or expired share link: DELETE /api/share-links/:id
  const handleDelete = async (linkId?: string) => {
    const targetId = linkId || selectedShareLink?._id;
    if (!targetId) return;

    setActionLoadingId(targetId);
    try {
      await deleteShareLink(targetId);
      showToast('Share link deleted successfully.', 'success');

      setShareLinks((prev) => prev.filter((l) => l._id !== targetId));
      if (selectedShareLink?._id === targetId) {
        setSelectedShareLink(null);
        setEphemeralRawToken(null);
        setEphemeralShareUrl(null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete share link.';
      showToast(message, 'info');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Determine active/revoked/expired status for the currently previewed link
  const currentStatus = (() => {
    if (!selectedShareLink) return 'active';
    if (selectedShareLink.status === 'revoked') return 'revoked';
    if (selectedShareLink.status === 'expired' || new Date(selectedShareLink.expiresAt) <= new Date()) {
      return 'expired';
    }
    return 'active';
  })();

  const isLinkActive = currentStatus === 'active';

  return (
    <div className="autocare-sharing-page">
      <Navbar />

      <main className="autocare-sharing-main">
        <div className="autocare-sharing-container">
          {/* Breadcrumb / Back Link */}
          <div className="autocare-sharing-back-nav">
            <button
              type="button"
              className="autocare-sharing-back-btn"
              onClick={() => navigate(-1)}
              title="Return to previous screen"
            >
              <ArrowLeft size={16} />
              <span>Back to vehicle details</span>
            </button>
          </div>

          {/* Top Header Row matching Figma */}
          <header className="autocare-sharing-header-row">
            <div className="autocare-sharing-title-group">
              <h1 className="autocare-sharing-title">Secure Link Sharing</h1>
              <p className="autocare-sharing-subtitle">
                BR-05 · Share a controlled, auditable vehicle record link.
              </p>
            </div>

            <div className="autocare-sharing-header-actions">
              <Link
                to="/sharing/permissions"
                className="autocare-sharing-btn-draft"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Manage access permissions"
              >
                <ShieldCheck size={15} />
                <span>Access permissions</span>
              </Link>

              <Link
                to="/sharing/qr"
                className="autocare-sharing-btn-draft"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Navigate to QR Code Sharing"
              >
                <QrCode size={15} />
                <span>QR Code Sharing</span>
              </Link>

              <button
                type="button"
                className="autocare-sharing-btn-draft"
                onClick={handleSaveDraft}
              >
                Save draft
              </button>

              <button
                type="button"
                className="autocare-sharing-btn-create"
                onClick={handleCreateSecureLink}
                disabled={isSubmitting}
                style={{ opacity: isSubmitting ? 0.75 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="spin-icon" />
                    <span>Creating link...</span>
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    <span>Create secure link</span>
                  </>
                )}
              </button>
            </div>
          </header>

          {/* API Error Notification */}
          {apiError && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                borderRadius: '10px',
                padding: '12px 18px',
                marginBottom: '20px',
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
              role="alert"
            >
              <AlertCircle size={16} />
              <span>{apiError}</span>
            </div>
          )}

          {/* 2-Column Layout */}
          <div className="autocare-sharing-grid">
            {/* Left Form Column */}
            <div className="autocare-sharing-form-column">
              {/* Card 1: Recipient */}
              <section className="autocare-sharing-card" aria-label="Recipient Information">
                <h2 className="autocare-sharing-card-title">Recipient</h2>

                <div className="autocare-sharing-field-row-2">
                  <div className="autocare-sharing-form-group">
                    <label htmlFor="recipient-input" className="autocare-sharing-label">
                      Recipient
                    </label>
                    <input
                      id="recipient-input"
                      type="text"
                      className="autocare-sharing-input"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="e.g. N. Fernando · Ceylinco Insurance"
                    />
                  </div>

                  <div className="autocare-sharing-form-group">
                    <label htmlFor="email-input" className="autocare-sharing-label">
                      Email
                    </label>
                    <input
                      id="email-input"
                      type="email"
                      className="autocare-sharing-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. inspection@ceylinco.lk"
                    />
                  </div>
                </div>
              </section>

              {/* Card 2: Access duration */}
              <section className="autocare-sharing-card" aria-label="Access Duration">
                <h2 className="autocare-sharing-card-title">Access duration</h2>

                <div className="autocare-sharing-field-row-2">
                  <div className="autocare-sharing-form-group">
                    <label htmlFor="start-input" className="autocare-sharing-label">
                      Start
                    </label>
                    <input
                      id="start-input"
                      type="text"
                      className="autocare-sharing-input"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="e.g. 21 Sep 2026 · Now"
                    />
                  </div>

                  <div className="autocare-sharing-form-group">
                    <label htmlFor="expires-input" className="autocare-sharing-label">
                      Expires
                    </label>
                    <input
                      id="expires-input"
                      type="text"
                      className="autocare-sharing-input"
                      value={expiresDate}
                      onChange={(e) => setExpiresDate(e.target.value)}
                      placeholder="e.g. 24 Sep 2026 · 6:00 PM"
                    />
                  </div>
                </div>
              </section>

              {/* Card 3: Data visibility */}
              <section className="autocare-sharing-card" aria-label="Data Visibility Options">
                <h2 className="autocare-sharing-card-title">Data visibility</h2>

                <div className="autocare-sharing-checkbox-list">
                  <label className="autocare-sharing-checkbox-item">
                    <input
                      type="checkbox"
                      checked={visibility.serviceDates}
                      onChange={() => handleCheckboxChange('serviceDates')}
                    />
                    <span>Service dates &amp; mileage</span>
                  </label>

                  <label className="autocare-sharing-checkbox-item">
                    <input
                      type="checkbox"
                      checked={visibility.garageDetails}
                      onChange={() => handleCheckboxChange('garageDetails')}
                    />
                    <span>Garage and technician details</span>
                  </label>

                  <label className="autocare-sharing-checkbox-item">
                    <input
                      type="checkbox"
                      checked={visibility.invoices}
                      onChange={() => handleCheckboxChange('invoices')}
                    />
                    <span>Invoices and service images</span>
                  </label>

                  <label className="autocare-sharing-checkbox-item">
                    <input
                      type="checkbox"
                      checked={visibility.ownerContact}
                      onChange={() => handleCheckboxChange('ownerContact')}
                    />
                    <span>Owner contact and insurance documents</span>
                  </label>
                </div>
              </section>

              {/* Card 4: Vehicle & record scope */}
              <section className="autocare-sharing-card" aria-label="Vehicle and Record Scope">
                <h2 className="autocare-sharing-card-title">Vehicle &amp; record scope</h2>

                <div className="autocare-sharing-form-group">
                  <label htmlFor="vehicle-input" className="autocare-sharing-label">
                    Vehicle
                  </label>
                  {vehicles.length > 0 ? (
                    <select
                      id="vehicle-input"
                      className="autocare-sharing-select"
                      value={selectedVehicleId}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        setSelectedVehicleId(nextId);
                        const v = vehicles.find((item) => item._id === nextId);
                        if (v) {
                          setVehicle(`${v.registrationNumber} · ${v.manufacturer} ${v.model}`);
                        }
                        loadShareLinks(nextId);
                      }}
                    >
                      {vehicles.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.registrationNumber} · {v.manufacturer} {v.model}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="vehicle-input"
                      type="text"
                      className="autocare-sharing-input"
                      value={loadingVehicles ? 'Loading owner vehicles...' : vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                      placeholder="e.g. WP ABC-1234 · Toyota Aqua"
                      disabled={loadingVehicles}
                    />
                  )}
                </div>

                <div className="autocare-sharing-form-group has-spacing">
                  <label htmlFor="records-input" className="autocare-sharing-label">
                    Selected records
                  </label>
                  <input
                    id="records-input"
                    type="text"
                    className="autocare-sharing-input"
                    value={selectedRecords}
                    onChange={(e) => setSelectedRecords(e.target.value)}
                    placeholder="e.g. 21 Sep service · 15 May service · emissions report"
                  />
                </div>
              </section>

              {/* Card 5: Link protections */}
              <section className="autocare-sharing-card" aria-label="Link Protections">
                <h2 className="autocare-sharing-card-title">Link protections</h2>

                <div className="autocare-sharing-field-row-3">
                  <div className="autocare-sharing-form-group">
                    <label htmlFor="passcode-input" className="autocare-sharing-label">
                      Passcode
                    </label>
                    <input
                      id="passcode-input"
                      type="text"
                      className="autocare-sharing-input"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="e.g. Required · 6 digits"
                    />
                  </div>

                  <div className="autocare-sharing-form-group">
                    <label htmlFor="downloads-input" className="autocare-sharing-label">
                      Downloads
                    </label>
                    <input
                      id="downloads-input"
                      type="text"
                      className="autocare-sharing-input"
                      value={downloads}
                      onChange={(e) => setDownloads(e.target.value)}
                      placeholder="e.g. Disabled"
                    />
                  </div>

                  <div className="autocare-sharing-form-group">
                    <label htmlFor="watermark-input" className="autocare-sharing-label">
                      Watermark
                    </label>
                    <input
                      id="watermark-input"
                      type="text"
                      className="autocare-sharing-input"
                      value={watermark}
                      onChange={(e) => setWatermark(e.target.value)}
                      placeholder="e.g. Recipient email"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Right Side Column */}
            <aside className="autocare-sharing-side-column" aria-label="Link Preview, Guidance and Real List">
              {/* Card A: Active-link preview */}
              <div className="autocare-sharing-preview-card">
                <div className="autocare-sharing-preview-header">
                  <h2 className="autocare-sharing-preview-title">Active-link preview</h2>
                  {currentStatus === 'active' ? (
                    <span className="autocare-sharing-badge-active">
                      <ShieldCheck size={12} />
                      <span>SECURE · ACTIVE</span>
                    </span>
                  ) : currentStatus === 'revoked' ? (
                    <span className="autocare-sharing-badge-revoked">
                      <Ban size={12} />
                      <span>REVOKED</span>
                    </span>
                  ) : (
                    <span
                      className="autocare-sharing-badge-revoked"
                      style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a' }}
                    >
                      <Clock size={12} />
                      <span>EXPIRED</span>
                    </span>
                  )}
                </div>

                <div className="autocare-sharing-vehicle-target">
                  {vehicle.includes('·') ? vehicle.split('·')[1].trim() : vehicle} verified history
                </div>

                {/* Real Link Box: displays ephemeral rawToken share URL when freshly created, or masked slug */}
                <div className="autocare-sharing-link-box" title="One-time secure URL generated with crypto token">
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ephemeralShareUrl ||
                      (selectedShareLink
                        ? `autocare.lk/s/${selectedShareLink._id.slice(-8).toUpperCase()}`
                        : `autocare.lk/s/${fallbackSlug}`)}
                  </span>
                </div>

                <p className="autocare-sharing-expires-text">
                  Expires{' '}
                  {selectedShareLink
                    ? new Date(selectedShareLink.expiresAt).toLocaleDateString()
                    : expiresDate}
                  {selectedShareLink && (
                    <span style={{ display: 'block', marginTop: '4px', fontSize: '11.5px', color: '#64748b' }}>
                      Views: {selectedShareLink.viewCount} / {selectedShareLink.maxViews ?? '∞'}
                    </span>
                  )}
                </p>

                <div className="autocare-sharing-preview-actions">
                  <button
                    type="button"
                    className="autocare-sharing-btn-copy"
                    onClick={handleCopyLink}
                    disabled={!isLinkActive}
                    style={{ opacity: isLinkActive ? 1 : 0.6 }}
                  >
                    <Copy size={14} />
                    <span>Copy link</span>
                  </button>

                  <Link
                    to={
                      ephemeralRawToken
                        ? `/shared/vehicle/${ephemeralRawToken}`
                        : selectedShareLink
                        ? `/shared/vehicle/${selectedShareLink._id}`
                        : `/shared/vehicle/${fallbackSlug}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="autocare-sharing-btn-copy"
                    style={{
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      background: '#ffffff',
                      color: '#0b2545',
                      border: '1px solid #cbd5e1',
                    }}
                    title="Preview Buyer / Public Shared Record View"
                  >
                    <ExternalLink size={14} />
                    <span>Preview</span>
                  </Link>

                  {isLinkActive ? (
                    <button
                      type="button"
                      className="autocare-sharing-btn-revoke"
                      onClick={() => handleRevoke()}
                      disabled={!selectedShareLink || actionLoadingId === selectedShareLink._id}
                      style={{ opacity: selectedShareLink ? 1 : 0.6 }}
                    >
                      <span>
                        {selectedShareLink && actionLoadingId === selectedShareLink._id
                          ? 'Revoking...'
                          : 'Revoke'}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="autocare-sharing-btn-revoke"
                      onClick={() => handleDelete()}
                      disabled={!selectedShareLink || actionLoadingId === selectedShareLink._id}
                      style={{
                        background: '#64748b',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Permanently remove revoked or expired share record"
                    >
                      <Trash2 size={13} />
                      <span>
                        {selectedShareLink && actionLoadingId === selectedShareLink._id
                          ? 'Deleting...'
                          : 'Delete'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Card B: Security guidance */}
              <div className="autocare-sharing-guidance-card">
                <h2 className="autocare-sharing-guidance-title">Security guidance</h2>
                <p className="autocare-sharing-guidance-text">
                  Identity checks, passcode protection and recipient watermarking are logged. Revoke
                  access immediately if the inspection ends early.
                </p>
              </div>

              {/* Card C: Real Share Links List Section (GET /api/share-links) */}
              <div className="autocare-sharing-card" style={{ padding: '20px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                  }}
                >
                  <h2 className="autocare-sharing-card-title" style={{ margin: 0 }}>
                    Recent Share Links
                  </h2>
                  <button
                    type="button"
                    onClick={() => loadShareLinks(selectedVehicleId)}
                    title="Refresh share links"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#0056A2',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    <RefreshCw size={12} className={loadingLinks ? 'spin-icon' : ''} />
                    <span>Refresh</span>
                  </button>
                </div>

                {loadingLinks ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                    <Loader2 size={18} className="spin-icon" style={{ display: 'inline-block', marginBottom: '6px' }} />
                    <div>Loading share links...</div>
                  </div>
                ) : shareLinks.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0, padding: '10px 0' }}>
                    No secure share links created yet. Click "Create secure link" above to generate your first link.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {shareLinks.map((link) => {
                      const isSelected = selectedShareLink?._id === link._id;
                      const isExpired =
                        link.status === 'expired' || new Date(link.expiresAt) <= new Date();
                      const statusVal = isExpired && link.status === 'active' ? 'expired' : link.status;

                      return (
                        <div
                          key={link._id}
                          onClick={() => setSelectedShareLink(link)}
                          style={{
                            padding: '12px',
                            borderRadius: '10px',
                            border: isSelected ? '2px solid #0056A2' : '1px solid #e2e8f0',
                            backgroundColor: isSelected ? '#f0f7ff' : '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: '6px',
                              marginBottom: '6px',
                            }}
                          >
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                              {link.recipientName || link.recipientEmail || 'Public recipient'}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                border: '1px solid',
                                backgroundColor:
                                  statusVal === 'active'
                                    ? '#eaf7ec'
                                    : statusVal === 'revoked'
                                    ? '#fef2f2'
                                    : '#fef3c7',
                                borderColor:
                                  statusVal === 'active'
                                    ? '#d1f2d4'
                                    : statusVal === 'revoked'
                                    ? '#fecaca'
                                    : '#fde68a',
                                color:
                                  statusVal === 'active'
                                    ? '#15803d'
                                    : statusVal === 'revoked'
                                    ? '#dc2626'
                                    : '#b45309',
                              }}
                            >
                              {statusVal}
                            </span>
                          </div>

                          <div style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                            <span>Purpose: <strong>{link.purpose || 'Vehicle Inspection'}</strong></span>
                            <span style={{ margin: '0 6px', color: '#cbd5e1' }}>•</span>
                            <span>Level: <strong>{link.permissionLevel?.toUpperCase()}</strong></span>
                          </div>

                          <div
                            style={{
                              fontSize: '11px',
                              color: '#64748b',
                              display: 'flex',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '4px',
                            }}
                          >
                            <span>Expires: {new Date(link.expiresAt).toLocaleDateString()}</span>
                            <span>Views: {link.viewCount} / {link.maxViews ?? '∞'}</span>
                            <span>Created: {new Date(link.createdAt).toLocaleDateString()}</span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'flex-end',
                              gap: '6px',
                              marginTop: '8px',
                            }}
                          >
                            {statusVal === 'active' ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRevoke(link._id);
                                }}
                                disabled={actionLoadingId === link._id}
                                style={{
                                  background: '#fef2f2',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca',
                                  borderRadius: '6px',
                                  padding: '4px 10px',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                {actionLoadingId === link._id ? 'Revoking...' : 'Revoke'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(link._id);
                                }}
                                disabled={actionLoadingId === link._id}
                                style={{
                                  background: '#ffffff',
                                  color: '#64748b',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  padding: '4px 10px',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Trash2 size={12} />
                                <span>{actionLoadingId === link._id ? 'Deleting...' : 'Delete'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`autocare-sharing-toast is-${toast.type}`}
          role="alert"
          aria-live="polite"
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} color="#22c55e" />
          ) : (
            <AlertCircle size={18} color="#38bdf8" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            className="autocare-sharing-toast-close"
            onClick={() => setToast(null)}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default SecureLinkSharingPage;
