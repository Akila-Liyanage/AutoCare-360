import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Bell,
  ShieldCheck,
  Pencil,
  Zap,
  CheckCircle2,
  LayoutGrid,
  X,
  AlertCircle,
  Loader2,
  Ban,
  RefreshCw,
  Car,
  ArrowRightLeft,
  Inbox,
  Check,
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import defaultHeroImg from '../../assets/vehicles/default-vehicle-hero.png';
import { resolveImageUrl } from '../../utils/imageUrl';
import { useAuth } from '../../hooks/useAuth';
import { getVehicleById, getMyVehicles, type Vehicle } from '../../services/vehicleService';
import {
  createTransferRequest,
  getOutgoingTransfers,
  getIncomingTransfers,
  acceptTransfer,
  rejectTransfer,
  cancelTransfer,
  type TransferRequest,
  type CreateTransferPayload,
} from '../../services/transferService';
import '../../styles/transfer.css';

interface ToastState {
  message: string;
  type: 'success' | 'info';
}

interface TransferFormData {
  recipientName: string;
  recipientNic: string;
  recipientEmail: string;
  recipientPhone: string;
  transferDate: string;
  transferNotes: string;
  acknowledged: boolean;
}

interface FormErrors {
  recipientName?: string;
  recipientNic?: string;
  recipientEmail?: string;
  acknowledged?: string;
}

export const TransferVehiclePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');

  // Page level loading and error
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Active Vehicle State
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  // Transfer records for this vehicle
  const [vehicleTransfers, setVehicleTransfers] = useState<TransferRequest[]>([]);
  const [activePendingTransfer, setActivePendingTransfer] = useState<TransferRequest | null>(null);

  // Transfer Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formApiError, setFormApiError] = useState<string | null>(null);

  // Cancel action state
  const [isCancelling, setIsCancelling] = useState(false);

  // Transfer Tabs: 'outgoing' (Sent Transfers) | 'incoming' (Incoming Transfers)
  const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming'>('outgoing');

  // Incoming Transfers State
  const [incomingTransfers, setIncomingTransfers] = useState<TransferRequest[]>([]);
  const [incomingLoading, setIncomingLoading] = useState<boolean>(false);
  const [incomingError, setIncomingError] = useState<string | null>(null);

  // Processing transfer ID and action (for loading indicators on Accept / Reject)
  const [processingTransferId, setProcessingTransferId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<'accept' | 'reject' | null>(null);

  // Rejection dialog state
  const [rejectingTransfer, setRejectingTransfer] = useState<TransferRequest | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Transfer Form State
  const [formData, setFormData] = useState<TransferFormData>({
    recipientName: '',
    recipientNic: '',
    recipientEmail: '',
    recipientPhone: '',
    transferDate: new Date().toISOString().split('T')[0],
    transferNotes: '',
    acknowledged: false,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Ownership Ledger State
  const [currentOwner, setCurrentOwner] = useState('Registered Owner');
  const [ownerHash, setOwnerHash] = useState('0x81ac2 ... b652');
  const [transferStatus, setTransferStatus] = useState<'compliant' | 'pending' | 'transferred'>('compliant');
  const [transferStatusText, setTransferStatusText] = useState('● FULLY COMPLIANT');
  const [auditSubtext, setAuditSubtext] = useState('Audit status verified 100% complete');

  // Toast feedback state
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  /**
   * Load vehicle passport data and real transfer history
   */
  const loadPageData = useCallback(async (targetVehicleId?: string) => {
    try {
      setPageError(null);

      let currentVehicle: Vehicle | null = null;

      // 1. Resolve vehicle
      if (targetVehicleId && targetVehicleId.length === 24) {
        try {
          currentVehicle = await getVehicleById(targetVehicleId);
        } catch {
          // If direct fetch fails, fallback to getMyVehicles
        }
      }

      if (!currentVehicle) {
        const myVehicles = await getMyVehicles();
        if (targetVehicleId) {
          currentVehicle =
            myVehicles.find(
              (v) => v._id === targetVehicleId || v.registrationNumber === targetVehicleId
            ) || null;
        }
        if (!currentVehicle && myVehicles.length > 0) {
          currentVehicle = myVehicles[0];
        }
      }

      if (!currentVehicle) {
        try {
          const incoming = await getIncomingTransfers();
          setIncomingTransfers(incoming);
          if (incoming.length > 0) {
            setActiveTab('incoming');
            setPageLoading(false);
            return;
          }
        } catch {
          // ignore
        }
        setPageError('No registered vehicles found for your account. Please add a vehicle first, or check incoming transfers.');
        setPageLoading(false);
        return;
      }

      setVehicle(currentVehicle);

      // Compute display hash from vehicle ID
      const vId = currentVehicle._id;
      setOwnerHash(`0x${vId.slice(0, 6)} ... ${vId.slice(-4)}`);

      // 2. Fetch outgoing transfers to detect real transfer status for this vehicle
      const outgoing = await getOutgoingTransfers();
      const forThisVehicle = outgoing.filter((t) => {
        const tVehId = typeof t.vehicleId === 'object' && t.vehicleId !== null ? t.vehicleId._id : t.vehicleId;
        return tVehId === currentVehicle?._id;
      });

      setVehicleTransfers(forThisVehicle);

      const pending = forThisVehicle.find((t) => t.status === 'pending');
      setActivePendingTransfer(pending || null);

      const latest = forThisVehicle[0];

      const realOwnerName =
        typeof currentVehicle.ownerId === 'object' && currentVehicle.ownerId !== null && (currentVehicle.ownerId as { fullName?: string }).fullName
          ? (currentVehicle.ownerId as { fullName?: string }).fullName || user?.fullName || 'Current Registered Owner'
          : user?.fullName || 'Current Registered Owner';

      if (pending) {
        setCurrentOwner(`${pending.recipientName || pending.recipientEmail} (Pending Handover)`);
        setTransferStatus('pending');
        setTransferStatusText('● PENDING RECIPIENT ACCEPTANCE');
        setAuditSubtext(
          `Transfer request #${pending._id.slice(-6).toUpperCase()} initiated to ${pending.recipientEmail}`
        );
      } else if (latest && latest.status === 'completed') {
        setCurrentOwner(`${latest.recipientName || 'New Owner'}`);
        setTransferStatus('transferred');
        setTransferStatusText('● OWNERSHIP TRANSFERRED');
        setAuditSubtext(
          `Ownership transferred to ${latest.recipientEmail} on ${new Date(
            latest.completedAt || latest.updatedAt
          ).toLocaleDateString()}`
        );
      } else if (latest && latest.status === 'rejected') {
        setCurrentOwner(realOwnerName);
        setTransferStatus('compliant');
        setTransferStatusText('● TRANSFER REJECTED');
        setAuditSubtext(
          `Previous transfer was declined by recipient${latest.notes ? `: "${latest.notes}"` : ''}`
        );
      } else if (latest && latest.status === 'cancelled') {
        setCurrentOwner(realOwnerName);
        setTransferStatus('compliant');
        setTransferStatusText('● TRANSFER CANCELLED');
        setAuditSubtext(
          `Transfer was cancelled on ${new Date(
            latest.respondedAt || latest.updatedAt
          ).toLocaleDateString()}`
        );
      } else {
        setCurrentOwner(realOwnerName);
        setTransferStatus('compliant');
        setTransferStatusText('● FULLY COMPLIANT');
        setAuditSubtext('Audit status verified 100% complete');
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to retrieve vehicle transfer details. Please check your network.';
      setPageError(msg);
    } finally {
      setPageLoading(false);
    }
  }, [user]);

  const loadIncomingTransfers = useCallback(async () => {
    setIncomingLoading(true);
    setIncomingError(null);
    try {
      const incoming = await getIncomingTransfers();
      setIncomingTransfers(incoming);
    } catch (err: unknown) {
      console.warn('Failed to load incoming transfers:', err);
      const msg = err instanceof Error ? err.message : 'Unable to load incoming transfers.';
      setIncomingError(msg);
    } finally {
      setIncomingLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const locState = location.state as { vehicleId?: string; vehicle?: Vehicle } | null;
      const resolvedId = id || locState?.vehicleId || locState?.vehicle?._id;
      if (isMounted) {
        await Promise.allSettled([
          loadPageData(resolvedId),
          loadIncomingTransfers(),
        ]);
      }
    };

    void init();

    return () => {
      isMounted = false;
    };
  }, [id, location.state, loadPageData, loadIncomingTransfers]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
      if (formErrors.acknowledged) {
        setFormErrors((prev) => ({ ...prev, acknowledged: undefined }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (formErrors[name as keyof FormErrors]) {
        setFormErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    }
    if (formApiError) {
      setFormApiError(null);
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.recipientName.trim()) {
      errors.recipientName = 'Recipient full name is required.';
    }

    if (!formData.recipientNic.trim()) {
      errors.recipientNic = 'Recipient NIC / Passport number is required.';
    }

    if (!formData.recipientEmail.trim()) {
      errors.recipientEmail = 'Recipient email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipientEmail.trim())) {
      errors.recipientEmail = 'Please provide a valid email address.';
    }

    if (!formData.acknowledged) {
      errors.acknowledged = 'You must confirm ownership transfer terms.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!vehicle) {
      setFormApiError('Vehicle record not loaded. Please try again.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormApiError(null);

      const payload: CreateTransferPayload = {
        vehicleId: vehicle._id,
        recipientEmail: formData.recipientEmail.trim().toLowerCase(),
        recipientName: formData.recipientName.trim(),
        transferReason: formData.transferNotes.trim() || 'Vehicle Ownership Transfer',
        message:
          formData.transferNotes.trim() ||
          `Ownership transfer initiated for vehicle ${vehicle.registrationNumber}`,
        notes: formData.recipientNic
          ? `NIC: ${formData.recipientNic}${
              formData.recipientPhone ? `, Phone: ${formData.recipientPhone}` : ''
            }`
          : undefined,
      };

      await createTransferRequest(payload);

      setIsModalOpen(false);
      showToast(
        `Transfer passport request for ${vehicle.registrationNumber} dispatched to ${formData.recipientName}!`,
        'success'
      );

      // Reset form fields
      setFormData({
        recipientName: '',
        recipientNic: '',
        recipientEmail: '',
        recipientPhone: '',
        transferDate: new Date().toISOString().split('T')[0],
        transferNotes: '',
        acknowledged: false,
      });

      // Reload real transfer & vehicle state
      await loadPageData(vehicle._id);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errorObj?.response?.data?.message ||
        errorObj?.message ||
        'Failed to dispatch vehicle transfer request.';

      setFormApiError(msg);
      showToast(msg, 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelTransfer = async (transferId: string) => {
    if (!window.confirm('Are you sure you want to cancel this pending transfer request?')) {
      return;
    }

    try {
      setIsCancelling(true);
      await cancelTransfer(transferId);
      showToast('Pending vehicle transfer request cancelled.', 'success');
      if (vehicle) {
        await loadPageData(vehicle._id);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errorObj?.response?.data?.message ||
        errorObj?.message ||
        'Failed to cancel transfer request.';
      showToast(msg, 'info');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleAcceptTransfer = async (transferId: string) => {
    setProcessingTransferId(transferId);
    setProcessingAction('accept');
    try {
      await acceptTransfer(transferId);
      showToast('Ownership transfer accepted! The vehicle passport has been reassigned to your account.', 'success');
      await loadIncomingTransfers();
      const myVehicles = await getMyVehicles();
      if (myVehicles.length > 0) {
        setVehicle(myVehicles[0]);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errorObj?.response?.data?.message ||
        errorObj?.message ||
        'Failed to accept transfer request. This feature may require backend completion.';
      showToast(msg, 'info');
    } finally {
      setProcessingTransferId(null);
      setProcessingAction(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingTransfer) return;
    setProcessingTransferId(rejectingTransfer._id);
    setProcessingAction('reject');
    try {
      await rejectTransfer(rejectingTransfer._id, rejectReason.trim() || undefined);
      showToast('Transfer request declined.', 'info');
      setRejectingTransfer(null);
      setRejectReason('');
      await loadIncomingTransfers();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errorObj?.response?.data?.message ||
        errorObj?.message ||
        'Failed to decline transfer request.';
      showToast(msg, 'info');
    } finally {
      setProcessingTransferId(null);
      setProcessingAction(null);
    }
  };

  const handleCancelBack = () => {
    navigate(`/vehicles/${vehicle?._id || id || ''}`);
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Safe vehicle ID for navigation
  const backNavId = vehicle?._id || id || '';

  return (
    <div className="autocare-transfer-page">
      <Navbar />

      <main className="autocare-transfer-main">
        <div className="autocare-transfer-container">
          {/* Back Navigation Button */}
          <div className="autocare-transfer-back-nav">
            <Link
              to={`/vehicles/${backNavId}`}
              className="autocare-transfer-back-btn"
              title="Return to vehicle details"
            >
              <ArrowLeft size={16} />
              <span>Back to vehicle details</span>
            </Link>
          </div>

          {/* Top Header Row Matching Figma */}
          <header className="autocare-transfer-header-row">
            <h1 className="autocare-transfer-title">Transfer vehicle records</h1>

            <div className="autocare-transfer-toolbar">
              {/* Search Box */}
              <div className="autocare-transfer-search-box">
                <Search size={18} className="autocare-transfer-search-icon" />
                <input
                  type="text"
                  className="autocare-transfer-search-input"
                  placeholder="Search VINs, service records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search VINs or service records"
                />
              </div>

              {/* Notification Bell Button */}
              <button
                type="button"
                className="autocare-transfer-bell-btn"
                title="Notifications"
                onClick={() => navigate('/notifications')}
                aria-label="View notifications"
              >
                <Bell size={18} />
              </button>

              {/* AutoCare Verified Registry Capsule Pill */}
              <div className="autocare-transfer-badge-secured" role="status">
                <span className="autocare-transfer-dot-secured" aria-hidden="true" />
                <span>AutoCare Verified Registry</span>
              </div>
            </div>
          </header>

          {/* Transfer Tabs: Sent Transfers vs. Incoming Transfers */}
          <div
            className="autocare-transfer-tabs-bar"
            role="tablist"
            style={{
              display: 'flex',
              gap: '12px',
              borderBottom: '2px solid #e2e8f0',
              marginBottom: '24px',
              paddingBottom: '0',
            }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'outgoing'}
              onClick={() => setActiveTab('outgoing')}
              style={{
                padding: '12px 20px',
                fontSize: '14.5px',
                fontWeight: 700,
                color: activeTab === 'outgoing' ? '#0056a2' : '#64748b',
                borderBottom: activeTab === 'outgoing' ? '3px solid #0056a2' : '3px solid transparent',
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '-2px',
                transition: 'all 0.2s ease',
              }}
            >
              <Zap size={16} />
              <span>Sent Transfers</span>
              {vehicleTransfers.length > 0 && (
                <span
                  style={{
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {vehicleTransfers.length}
                </span>
              )}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'incoming'}
              onClick={() => {
                setActiveTab('incoming');
                if (incomingTransfers.length === 0) {
                  void loadIncomingTransfers();
                }
              }}
              style={{
                padding: '12px 20px',
                fontSize: '14.5px',
                fontWeight: 700,
                color: activeTab === 'incoming' ? '#0056a2' : '#64748b',
                borderBottom: activeTab === 'incoming' ? '3px solid #0056a2' : '3px solid transparent',
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '-2px',
                transition: 'all 0.2s ease',
              }}
            >
              <ArrowRightLeft size={16} />
              <span>Incoming Transfers</span>
              {incomingTransfers.length > 0 && (
                <span
                  style={{
                    backgroundColor: '#fef3c7',
                    color: '#b45309',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {incomingTransfers.filter((t) => t.status === 'pending').length || incomingTransfers.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'outgoing' && (
            <>
              {/* Page Loading State */}
              {pageLoading && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 0',
                gap: '12px',
                color: '#64748b',
              }}
            >
              <Loader2 size={32} className="spin" style={{ color: '#0056A2' }} />
              <p style={{ fontSize: '15px', fontWeight: 600 }}>Loading vehicle digital passport...</p>
            </div>
          )}

          {/* Page Error State */}
          {!pageLoading && pageError && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '24px',
                margin: '20px 0',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                color: '#991b1b',
              }}
              role="alert"
            >
              <AlertCircle size={24} style={{ flexShrink: 0, color: '#dc2626' }} />
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700 }}>
                  Unable to load vehicle transfer records
                </h3>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>{pageError}</p>
                <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => loadPageData(backNavId)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <RefreshCw size={14} />
                    <span>Try Again</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/vehicles')}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#64748b',
                      border: '1px solid #cbd5e1',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <span>My Vehicles</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {!pageLoading && !pageError && vehicle && (
            <>
              {/* 1. Hero Vehicle Summary Card */}
              <section className="autocare-transfer-hero-card" aria-label="Selected Vehicle Information">
                <div className="autocare-transfer-hero-left">
                  <div className="autocare-transfer-hero-thumb">
                    {resolveImageUrl(vehicle.imageUrl) ? (
                      <img
                        src={resolveImageUrl(vehicle.imageUrl)}
                        alt={`${vehicle.manufacturer} ${vehicle.model}`}
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = defaultHeroImg;
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%',
                          backgroundColor: '#f1f5f9',
                          color: '#64748b',
                          gap: '4px',
                          textAlign: 'center',
                          padding: '12px',
                        }}
                      >
                        <Car size={32} style={{ color: '#94a3b8' }} />
                        <span style={{ fontSize: '11px', fontWeight: 600 }}>No vehicle image</span>
                      </div>
                    )}
                  </div>

                  <div className="autocare-transfer-hero-info">
                    <div className="autocare-transfer-hero-title-row">
                      <h2 className="autocare-transfer-hero-title">
                        {vehicle.manufacturer} {vehicle.model}
                      </h2>
                      <span className="autocare-transfer-hero-badge">
                        <CheckCircle2 size={13} />
                        <span>AI Trust Score: 98%</span>
                      </span>
                    </div>
                    <p className="autocare-transfer-hero-hash">
                      Global Immutable Record: <code>{ownerHash}</code>
                    </p>
                  </div>
                </div>

                <div className="autocare-transfer-hero-actions">
                  <button
                    type="button"
                    className="autocare-transfer-btn-edit"
                    onClick={handleCancelBack}
                    title="Edit vehicle details"
                  >
                    <Pencil size={15} />
                    <span>Edit Details</span>
                  </button>

                  <button
                    type="button"
                    className="autocare-transfer-btn-passport"
                    onClick={() => setIsModalOpen(true)}
                    title="Transfer vehicle passport records"
                  >
                    <Zap size={16} />
                    <span>Transfer Passport</span>
                  </button>
                </div>
              </section>

              {/* 2. Ownership & Cryptographic Integrity Ledger Card */}
              <section
                className="autocare-transfer-ownership-card"
                aria-label="Ownership and Cryptographic Ledger"
              >
                <h2 className="autocare-transfer-card-heading">
                  Ownership &amp; Cryptographic Integrity Ledger
                </h2>

                <div className="autocare-transfer-ownership-grid">
                  {/* Left Box: Current Verified Owner */}
                  <div className="autocare-transfer-ledger-box">
                    <span className="autocare-transfer-ledger-label">Current Verified Owner</span>
                    <span className="autocare-transfer-ledger-val">{currentOwner}</span>
                    <span className="autocare-transfer-ledger-sub">Owner Hash: {ownerHash}</span>
                  </div>

                  {/* Right Box: Trust Verification Status */}
                  <div className="autocare-transfer-ledger-box">
                    <span className="autocare-transfer-ledger-label">Trust Verification Status</span>
                    <span
                      className={`autocare-transfer-ledger-val ${
                        transferStatus === 'compliant' ? 'is-green' : ''
                      }`}
                      style={{
                        color:
                          transferStatus === 'compliant'
                            ? '#15803d'
                            : transferStatus === 'pending'
                            ? '#d97706'
                            : '#0284c7',
                      }}
                    >
                      {transferStatusText}
                    </span>
                    <span className="autocare-transfer-ledger-sub" style={{ fontFamily: 'inherit' }}>
                      {auditSubtext}
                    </span>

                    {/* Quick Cancel button for pending active request */}
                    {activePendingTransfer && (
                      <button
                        type="button"
                        onClick={() => handleCancelTransfer(activePendingTransfer._id)}
                        disabled={isCancelling}
                        style={{
                          marginTop: '10px',
                          alignSelf: 'flex-start',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#b91c1c',
                          backgroundColor: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: '8px',
                          cursor: isCancelling ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        title="Cancel active transfer request"
                      >
                        {isCancelling ? <Loader2 size={13} className="spin" /> : <Ban size={13} />}
                        <span>{isCancelling ? 'Cancelling...' : 'Cancel Pending Transfer'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </section>

              {/* 3. Middle Split Section: Specifications (Left) + Scores (Right) */}
              <section
                className="autocare-transfer-middle-grid"
                aria-label="Official Specifications and Trust Score"
              >
                {/* Left Column: Official Registration Specifications */}
                <div className="autocare-transfer-specs-card">
                  <h2 className="autocare-transfer-card-heading">
                    Official Registration Specifications
                  </h2>

                  <div className="autocare-transfer-specs-list">
                    <div className="autocare-transfer-specs-row">
                      <span className="autocare-transfer-specs-label">Registration Number</span>
                      <span className="autocare-transfer-specs-value">{vehicle.registrationNumber}</span>
                    </div>
                    <div className="autocare-transfer-specs-row">
                      <span className="autocare-transfer-specs-label">VIN / Chassis No</span>
                      <span className="autocare-transfer-specs-value is-mono">{vehicle.vin}</span>
                    </div>
                    <div className="autocare-transfer-specs-row">
                      <span className="autocare-transfer-specs-label">Engine Number</span>
                      <span className="autocare-transfer-specs-value is-mono">
                        {vehicle.engineNumber || 'N/A'}
                      </span>
                    </div>
                    <div className="autocare-transfer-specs-row">
                      <span className="autocare-transfer-specs-label">Vehicle Category</span>
                      <span className="autocare-transfer-specs-value">
                        {vehicle.vehicleType || 'Motor Car'}
                      </span>
                    </div>
                    <div className="autocare-transfer-specs-row">
                      <span className="autocare-transfer-specs-label">Manufacturer</span>
                      <span className="autocare-transfer-specs-value">{vehicle.manufacturer}</span>
                    </div>
                    <div className="autocare-transfer-specs-row">
                      <span className="autocare-transfer-specs-label">Model &amp; Variant</span>
                      <span className="autocare-transfer-specs-value">{vehicle.model}</span>
                    </div>
                    <div className="autocare-transfer-specs-row">
                      <span className="autocare-transfer-specs-label">Year of Manufacture</span>
                      <span className="autocare-transfer-specs-value">{vehicle.manufacturingYear}</span>
                    </div>
                    <div className="autocare-transfer-specs-row">
                      <span className="autocare-transfer-specs-label">Current Recorded Mileage</span>
                      <span className="autocare-transfer-specs-value">
                        {vehicle.currentMileage ? vehicle.currentMileage.toLocaleString() : '0'} km
                        (Verified)
                      </span>
                    </div>
                    <div className="autocare-transfer-specs-row">
                      <span className="autocare-transfer-specs-label">Current Registered Owner</span>
                      <span className="autocare-transfer-specs-value">
                        {user?.fullName || 'Registered Owner'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Passport Trust Score & Odometer Authenticity */}
                <div className="autocare-transfer-right-stack">
                  {/* Card 1: Passport Trust Score */}
                  <div className="autocare-transfer-score-card">
                    <h2 className="autocare-transfer-card-heading">Passport Trust Score</h2>

                    <div className="autocare-transfer-circle-container">
                      <svg
                        width="128"
                        height="128"
                        viewBox="0 0 120 120"
                        className="autocare-transfer-circle-svg"
                        aria-hidden="true"
                      >
                        <circle
                          cx="60"
                          cy="60"
                          r="48"
                          strokeWidth="11"
                          fill="transparent"
                          className="autocare-transfer-circle-bg"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="48"
                          strokeWidth="11"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 48}
                          strokeDashoffset="0"
                          className="autocare-transfer-circle-progress"
                        />
                      </svg>
                      <span className="autocare-transfer-circle-text">100%</span>
                    </div>

                    <p className="autocare-transfer-score-subtext">
                      Data sources verified on decentralised cluster ledger. No discrepancy found.
                    </p>
                  </div>

                  {/* Card 2: Odometer Authenticity */}
                  <div className="autocare-transfer-odometer-card">
                    <div className="autocare-transfer-odometer-header">
                      <LayoutGrid size={20} className="autocare-transfer-odometer-icon" />
                      <h3 className="autocare-transfer-odometer-title">Odometer Authenticity</h3>
                    </div>

                    <p className="autocare-transfer-odometer-desc">
                      Telemetry cross-analysis confirms odometer sequence consistency against verified check-ins.
                    </p>

                    <div className="autocare-transfer-odometer-badge">
                      MILEAGE RATING: PERFECT (A+)
                    </div>
                  </div>
                </div>
              </section>

              {/* 4. Bottom Dark Navy Card: Verified Ledger Records & Transfer History */}
              <section
                className="autocare-transfer-records-card"
                aria-label="Verified Ledger Records Authorized For Viewer"
              >
                <h2 className="autocare-transfer-records-heading">
                  Verified Ledger Records (Authorized For Viewer)
                </h2>

                <div className="autocare-transfer-records-list">
                  {vehicleTransfers && vehicleTransfers.length > 0 ? (
                    vehicleTransfers.map((t, idx) => (
                      <React.Fragment key={t._id}>
                        {idx > 0 && <div className="autocare-transfer-record-divider" />}
                        <div className="autocare-transfer-record-item">
                          <div className="autocare-transfer-record-info">
                            <span className="autocare-transfer-record-title">
                              Ownership Transfer to {t.recipientName || t.recipientEmail}
                            </span>
                            <span className="autocare-transfer-record-meta">
                              {new Date(t.requestedAt || t.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              • {t.transferReason || 'Ownership Reassignment'}
                            </span>
                          </div>
                          <span
                            className="autocare-transfer-badge-certified"
                            style={{
                              backgroundColor:
                                t.status === 'completed'
                                  ? '#16a34a'
                                  : t.status === 'pending'
                                  ? '#d97706'
                                  : t.status === 'rejected'
                                  ? '#dc2626'
                                  : '#64748b',
                            }}
                          >
                            {t.status === 'completed'
                              ? 'Certified'
                              : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                          </span>
                        </div>
                      </React.Fragment>
                    ))
                  ) : (
                    <>
                      {/* Certified passport establishment records */}
                      <div className="autocare-transfer-record-item">
                        <div className="autocare-transfer-record-info">
                          <span className="autocare-transfer-record-title">
                            Vehicle Digital Passport Registration
                          </span>
                          <span className="autocare-transfer-record-meta">
                            AutoCare 360 Decentralized Registry • Sovereign Ownership
                          </span>
                        </div>
                        <span className="autocare-transfer-badge-certified">Certified</span>
                      </div>

                      <div className="autocare-transfer-record-divider" />

                      <div className="autocare-transfer-record-item">
                        <div className="autocare-transfer-record-info">
                          <span className="autocare-transfer-record-title">
                            Annual Safety &amp; Electronic Diagnostics Check
                          </span>
                          <span className="autocare-transfer-record-meta">
                            Telemetry Cross-Analysis Check • Certified Inspection
                          </span>
                        </div>
                        <span className="autocare-transfer-badge-certified">Certified</span>
                      </div>
                    </>
                  )}
                </div>
              </section>
            </>
          )}
        </>
      )}

      {/* 5. Incoming Transfers Tab Content */}
      {activeTab === 'incoming' && (
        <section className="autocare-incoming-transfers-section" aria-label="Incoming Ownership Transfers">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                Incoming Ownership Transfers
              </h2>
              <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
                Vehicles assigned to your registered account by previous owners. Review and accept to transfer sovereign digital passport.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadIncomingTransfers()}
              disabled={incomingLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: '#ffffff',
                color: '#0056a2',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: incomingLoading ? 'not-allowed' : 'pointer',
              }}
            >
              <RefreshCw
                size={14}
                className={incomingLoading ? 'spin' : ''}
                style={incomingLoading ? { animation: 'spin 1s linear infinite' } : {}}
              />
              <span>Refresh List</span>
            </button>
          </div>

          {incomingLoading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <Loader2
                size={32}
                className="spin"
                style={{ color: '#0056A2', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }}
              />
              <p style={{ fontSize: '14px', fontWeight: 600 }}>Loading incoming transfer records...</p>
            </div>
          )}

          {!incomingLoading && incomingError && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                color: '#991b1b',
                marginBottom: '20px',
              }}
            >
              <AlertCircle size={20} style={{ flexShrink: 0, color: '#dc2626' }} />
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700 }}>
                  Unable to fetch incoming transfers
                </h4>
                <p style={{ margin: 0, fontSize: '13.5px' }}>{incomingError}</p>
              </div>
            </div>
          )}

          {!incomingLoading && !incomingError && incomingTransfers.length === 0 && (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '52px 24px',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#eff6ff',
                  color: '#0056a2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Inbox size={30} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                No Incoming Transfers Found
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: '#64748b',
                  maxWidth: '440px',
                  margin: '0 auto 20px',
                  lineHeight: 1.5,
                }}
              >
                You have no pending ownership transfer requests. When another vehicle owner initiates an ownership handover to your email ({user?.email || 'your email'}), it will appear here.
              </p>
            </div>
          )}

          {!incomingLoading && !incomingError && incomingTransfers.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {incomingTransfers.map((t) => {
                const veh = typeof t.vehicleId === 'object' && t.vehicleId !== null ? t.vehicleId : null;
                const sender = typeof t.fromOwnerId === 'object' && t.fromOwnerId !== null ? t.fromOwnerId : null;
                const isPending = t.status === 'pending';
                const isProcessingThis = processingTransferId === t._id;

                const vehTitle = veh
                  ? `${veh.manufacturer} ${veh.model}`
                  : 'Vehicle Digital Passport';
                const regPlate = veh?.registrationNumber || 'Registration Pending';
                const vin = veh?.vin || 'VIN on file';
                const senderName =
                  sender?.fullName ||
                  sender?.email ||
                  (typeof t.fromOwnerId === 'string' ? t.fromOwnerId : 'Previous Registered Owner');
                const dateStr = new Date(t.requestedAt || t.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div
                    key={t._id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '24px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            {vehTitle}
                          </h3>
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.4px',
                              backgroundColor:
                                t.status === 'completed' || t.status === 'accepted'
                                  ? '#ecfdf5'
                                  : t.status === 'pending'
                                  ? '#fffbeb'
                                  : t.status === 'rejected'
                                  ? '#fef2f2'
                                  : '#f1f5f9',
                              color:
                                t.status === 'completed' || t.status === 'accepted'
                                  ? '#047857'
                                  : t.status === 'pending'
                                  ? '#b45309'
                                  : t.status === 'rejected'
                                  ? '#b91c1c'
                                  : '#64748b',
                              border:
                                t.status === 'completed' || t.status === 'accepted'
                                  ? '1px solid #a7f3d0'
                                  : t.status === 'pending'
                                  ? '1px solid #fde68a'
                                  : t.status === 'rejected'
                                  ? '1px solid #fecaca'
                                  : '1px solid #cbd5e1',
                            }}
                          >
                            {t.status.toUpperCase()}
                          </span>
                        </div>

                        <div style={{ fontSize: '13.5px', color: '#475569', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                          <span>Reg: <strong>{regPlate}</strong></span>
                          <span>•</span>
                          <span>
                            VIN: <code style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>{vin}</code>
                          </span>
                        </div>
                      </div>

                      {isPending && (
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => handleAcceptTransfer(t._id)}
                            disabled={isProcessingThis}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '9px 18px',
                              backgroundColor: '#16a34a',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '13.5px',
                              fontWeight: 700,
                              cursor: isProcessingThis ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {isProcessingThis && processingAction === 'accept' ? (
                              <Loader2 size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <Check size={14} />
                            )}
                            <span>Accept Transfer</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setRejectingTransfer(t);
                              setRejectReason('');
                            }}
                            disabled={isProcessingThis}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '9px 18px',
                              backgroundColor: '#ffffff',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              borderRadius: '8px',
                              fontSize: '13.5px',
                              fontWeight: 600,
                              cursor: isProcessingThis ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Ban size={14} />
                            <span>Decline</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '12px',
                        backgroundColor: '#f8fafc',
                        padding: '14px 18px',
                        borderRadius: '10px',
                        fontSize: '13px',
                      }}
                    >
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                          Transfer Initiated By
                        </span>
                        <span style={{ color: '#1e293b', fontWeight: 600 }}>{senderName}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                          Request Date
                        </span>
                        <span style={{ color: '#1e293b', fontWeight: 600 }}>{dateStr}</span>
                      </div>
                      {t.transferReason && (
                        <div>
                          <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                            Reason / Handover Note
                          </span>
                          <span style={{ color: '#1e293b', fontWeight: 500 }}>{t.transferReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  </main>

      {/* 5. Transfer Ownership Modal / Dialog */}
      {isModalOpen && vehicle && (
        <div
          className="autocare-transfer-modal-backdrop"
          onClick={() => !isSubmitting && setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="transfer-modal-title"
        >
          <div className="autocare-transfer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="autocare-transfer-modal-header">
              <div className="autocare-transfer-modal-title-group">
                <h2 id="transfer-modal-title">Transfer Vehicle Ownership &amp; Records</h2>
                <p>
                  Reassign decentralized vehicle passport and maintenance logs to the new legal owner.
                </p>
              </div>

              <button
                type="button"
                className="autocare-transfer-modal-close"
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                aria-label="Close transfer modal"
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit}>
              <div className="autocare-transfer-modal-body">
                {/* Form API Error Alert */}
                {formApiError && (
                  <div
                    style={{
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: '#991b1b',
                      fontSize: '13px',
                      lineHeight: '1.45',
                    }}
                    role="alert"
                  >
                    <AlertCircle size={18} style={{ flexShrink: 0, color: '#dc2626' }} />
                    <span>{formApiError}</span>
                  </div>
                )}

                {/* Warning if already pending */}
                {activePendingTransfer && (
                  <div
                    style={{
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: '#92400e',
                      fontSize: '13px',
                      lineHeight: '1.45',
                    }}
                  >
                    <AlertCircle size={18} style={{ flexShrink: 0, color: '#d97706' }} />
                    <span>
                      An active transfer to{' '}
                      <strong>{activePendingTransfer.recipientEmail}</strong> is currently pending.
                      You must resolve or cancel it before initiating another transfer.
                    </span>
                  </div>
                )}

                {/* Current Owner Banner */}
                <div className="autocare-transfer-current-owner-banner">
                  <div className="autocare-transfer-current-owner-info">
                    <span className="autocare-transfer-current-owner-title">Current Legal Owner</span>
                    <span className="autocare-transfer-current-owner-name">
                      {user?.fullName || 'Verified Owner'}
                    </span>
                  </div>
                  <span className="autocare-transfer-current-owner-hash">{ownerHash}</span>
                </div>

                {/* Recipient Full Name */}
                <div className="autocare-transfer-form-group">
                  <label htmlFor="recipientName" className="autocare-transfer-form-label">
                    <span>
                      New Owner Full Name <span className="autocare-transfer-form-required">*</span>
                    </span>
                  </label>
                  <input
                    id="recipientName"
                    name="recipientName"
                    type="text"
                    className={`autocare-transfer-form-input ${
                      formErrors.recipientName ? 'is-error' : ''
                    }`}
                    placeholder="e.g. David Silva"
                    value={formData.recipientName}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                  {formErrors.recipientName && (
                    <span className="autocare-transfer-error-msg">{formErrors.recipientName}</span>
                  )}
                </div>

                {/* Recipient NIC & Email in 2 columns */}
                <div className="autocare-transfer-form-row-2">
                  <div className="autocare-transfer-form-group">
                    <label htmlFor="recipientNic" className="autocare-transfer-form-label">
                      <span>
                        Recipient NIC / ID <span className="autocare-transfer-form-required">*</span>
                      </span>
                    </label>
                    <input
                      id="recipientNic"
                      name="recipientNic"
                      type="text"
                      className={`autocare-transfer-form-input ${
                        formErrors.recipientNic ? 'is-error' : ''
                      }`}
                      placeholder="e.g. 199412345678"
                      value={formData.recipientNic}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                    {formErrors.recipientNic && (
                      <span className="autocare-transfer-error-msg">{formErrors.recipientNic}</span>
                    )}
                  </div>

                  <div className="autocare-transfer-form-group">
                    <label htmlFor="recipientEmail" className="autocare-transfer-form-label">
                      <span>
                        Recipient Email <span className="autocare-transfer-form-required">*</span>
                      </span>
                    </label>
                    <input
                      id="recipientEmail"
                      name="recipientEmail"
                      type="email"
                      className={`autocare-transfer-form-input ${
                        formErrors.recipientEmail ? 'is-error' : ''
                      }`}
                      placeholder="e.g. testowner_david@autocare360.lk"
                      value={formData.recipientEmail}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                    {formErrors.recipientEmail && (
                      <span className="autocare-transfer-error-msg">{formErrors.recipientEmail}</span>
                    )}
                  </div>
                </div>

                {/* Phone & Date in 2 columns */}
                <div className="autocare-transfer-form-row-2">
                  <div className="autocare-transfer-form-group">
                    <label htmlFor="recipientPhone" className="autocare-transfer-form-label">
                      <span>Recipient Contact Phone</span>
                    </label>
                    <input
                      id="recipientPhone"
                      name="recipientPhone"
                      type="tel"
                      className="autocare-transfer-form-input"
                      placeholder="e.g. +94 77 123 4567"
                      value={formData.recipientPhone}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="autocare-transfer-form-group">
                    <label htmlFor="transferDate" className="autocare-transfer-form-label">
                      <span>Transfer Effective Date</span>
                    </label>
                    <input
                      id="transferDate"
                      name="transferDate"
                      type="date"
                      className="autocare-transfer-form-input"
                      value={formData.transferDate}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Transfer Notes */}
                <div className="autocare-transfer-form-group">
                  <label htmlFor="transferNotes" className="autocare-transfer-form-label">
                    <span>Transfer Notes &amp; Handover Details</span>
                  </label>
                  <textarea
                    id="transferNotes"
                    name="transferNotes"
                    rows={3}
                    className="autocare-transfer-form-textarea"
                    placeholder="e.g. Ownership transfer following vehicle sales deed completion. Digital maintenance history transferred."
                    value={formData.transferNotes}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Cryptographic Security Callout */}
                <div className="autocare-transfer-security-callout">
                  <ShieldCheck size={20} className="autocare-transfer-security-icon" />
                  <div className="autocare-transfer-security-text">
                    <strong>Decentralized Ownership Reassignment Protocol</strong>
                    Reassigning this vehicle passport will transfer sovereignty of all verified maintenance
                    logs and telemetry entries to the designated recipient. An immutable audit event will be
                    logged to the AutoCare Blockchain ledger.
                  </div>
                </div>

                {/* Confirmation Checkbox */}
                <div className="autocare-transfer-form-group">
                  <label className="autocare-transfer-checkbox-label">
                    <input
                      type="checkbox"
                      name="acknowledged"
                      checked={formData.acknowledged}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                    <span>
                      I verify that I am authorized to transfer this vehicle passport and agree to hand over
                      cryptographic records to the designated recipient.
                    </span>
                  </label>
                  {formErrors.acknowledged && (
                    <span className="autocare-transfer-error-msg">{formErrors.acknowledged}</span>
                  )}
                </div>
              </div>

              <div className="autocare-transfer-modal-footer">
                <button
                  type="button"
                  className="autocare-transfer-btn-cancel"
                  onClick={() => !isSubmitting && setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="autocare-transfer-btn-submit"
                  disabled={isSubmitting}
                  style={{
                    opacity: isSubmitting ? 0.7 : 1,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <Zap size={16} />
                  )}
                  <span>{isSubmitting ? 'Broadcasting...' : 'Confirm & Transfer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Decline Incoming Transfer Modal */}
      {rejectingTransfer && (
        <div
          className="autocare-transfer-modal-backdrop"
          onClick={() => !processingTransferId && setRejectingTransfer(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="autocare-transfer-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="autocare-transfer-modal-header">
              <div className="autocare-transfer-modal-title-group">
                <h2>Decline Transfer Request</h2>
                <p>Are you sure you want to decline this incoming vehicle ownership handover?</p>
              </div>
              <button
                type="button"
                className="autocare-transfer-modal-close"
                onClick={() => !processingTransferId && setRejectingTransfer(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="autocare-transfer-modal-body">
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Decline Reason (Optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Unrecognized vehicle or wrong recipient email"
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>
            <div
              className="autocare-transfer-modal-footer"
              style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}
            >
              <button
                type="button"
                onClick={() => setRejectingTransfer(null)}
                disabled={!!processingTransferId}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={!!processingTransferId}
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: processingTransferId ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {processingTransferId === rejectingTransfer._id && processingAction === 'reject' ? (
                  <Loader2 size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Ban size={14} />
                )}
                <span>Confirm Decline</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`autocare-transfer-toast is-${toast.type}`}
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
            className="autocare-transfer-toast-close"
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

export default TransferVehiclePage;
