import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowLeft,
  Building2,
  User,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Clock,
  Check,
  FileText,
  ExternalLink,
  X,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import adminService, { type AdminGarage, type GarageStatus } from '../../services/adminService';
import '../../styles/admin.css';

export const AdminGarageDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [garage, setGarage] = useState<AdminGarage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(id));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Approval modal
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState<boolean>(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4500);
  }, []);

  const loadGarageDetails = useCallback(async () => {
    if (!id) return;
    try {
      const data = await adminService.getGarageById(id);
      setGarage(data);
      setErrorMessage(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve garage partner details.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    adminService
      .getGarageById(id)
      .then((data) => {
        if (isMounted) {
          setGarage(data);
          setErrorMessage(null);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to retrieve garage partner details.';
          setErrorMessage(msg);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Handle Approve
  const handleApproveConfirm = async () => {
    if (!garage) return;
    setIsApproving(true);
    try {
      await adminService.approveGarage(garage._id);
      showToast(`Workshop "${garage.workshopName || garage.fullName}" has been verified and activated.`);
      setGarage((prev) => (prev ? { ...prev, status: 'active' } : prev));
      setShowApproveModal(false);
      loadGarageDetails();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve garage partner.';
      showToast(msg, 'error');
    } finally {
      setIsApproving(false);
    }
  };

  // Handle Reject / Suspend
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!garage) return;

    const trimmed = rejectionReason.trim();
    if (!trimmed || trimmed.length < 5) {
      setRejectionError('Please provide a specific justification reason (minimum 5 characters).');
      return;
    }

    setIsRejecting(true);
    setRejectionError(null);
    try {
      await adminService.rejectGarage(garage._id, trimmed);
      showToast(`Workshop status has been updated to Suspended.`);
      setGarage((prev) =>
        prev ? { ...prev, status: 'suspended', rejectionReason: trimmed } : prev
      );
      setShowRejectModal(false);
      setRejectionReason('');
      loadGarageDetails();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to suspend garage partner.';
      setRejectionError(msg);
    } finally {
      setIsRejecting(false);
    }
  };

  const renderStatusBadge = (status: GarageStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="autocare-status-badge status-active">
            <CheckCircle2 size={14} aria-hidden="true" /> Verified & Active
          </span>
        );
      case 'suspended':
        return (
          <span className="autocare-status-badge status-suspended">
            <Ban size={14} aria-hidden="true" /> Suspended Partner
          </span>
        );
      default:
        return (
          <span className="autocare-status-badge status-pending">
            <Clock size={14} aria-hidden="true" /> Pending Verification Review
          </span>
        );
    }
  };

  return (
    <div className="autocare-admin-page">
      <Navbar />

      <main className="autocare-admin-main" id="main-content">
        <div className="autocare-admin-container">
          {/* Toast */}
          {feedbackToast && (
            <div
              style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 1000,
                backgroundColor: feedbackToast.type === 'error' ? '#ef4444' : '#10b981',
                color: '#ffffff',
                padding: '12px 20px',
                borderRadius: '8px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                fontWeight: 600,
                animation: 'fadeIn 0.2s ease',
              }}
              role="alert"
            >
              {feedbackToast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              <span>{feedbackToast.message}</span>
            </div>
          )}

          {/* Navigation Back */}
          <div style={{ marginBottom: '18px' }}>
            <Link to="/admin/garages" className="autocare-admin-back-btn">
              <ArrowLeft size={16} /> Back to Garage Verification Queue
            </Link>
          </div>

          {isLoading ? (
            <div className="autocare-admin-state-box" aria-live="polite">
              <Loader2 size={38} style={{ animation: 'spin 1s linear infinite', color: '#0056A2' }} />
              <p className="autocare-admin-state-text">Retrieving garage partner file...</p>
            </div>
          ) : errorMessage || !garage ? (
            <div className="autocare-admin-state-box">
              <div className="autocare-admin-state-icon is-error">
                <AlertCircle size={28} />
              </div>
              <h2 className="autocare-admin-state-title">Garage Partner Not Found</h2>
              <p className="autocare-admin-state-text">
                {errorMessage || 'The requested garage record does not exist or may have been unlinked.'}
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={loadGarageDetails}
                  className="autocare-admin-btn autocare-admin-btn-secondary"
                >
                  <RefreshCw size={14} /> Retry
                </button>
                <Link to="/admin/garages" className="autocare-admin-btn autocare-admin-btn-primary">
                  Return to Garages
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <header className="autocare-admin-header">
                <div className="autocare-admin-top-meta">
                  <span className="autocare-admin-badge">
                    <ShieldCheck size={14} aria-hidden="true" /> Certified Partner Dossier
                  </span>
                  {renderStatusBadge(garage.status)}
                </div>
                <h1 className="autocare-admin-title">
                  {garage.workshopName || garage.displayName || garage.fullName}
                </h1>
                <p className="autocare-admin-subtitle">
                  Partner ID: <code style={{ fontSize: '13px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{garage._id}</code> • Registered on{' '}
                  {garage.createdAt ? new Date(garage.createdAt).toLocaleDateString('en-GB') : 'N/A'}
                </p>
              </header>

              {/* Suspension / Rejection Banner if available */}
              {garage.status === 'suspended' && (
                <div className="autocare-admin-rejection-banner" role="alert">
                  <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h3 className="autocare-admin-rejection-title">Partner Account Currently Suspended</h3>
                    <p className="autocare-admin-rejection-text">
                      <strong>Recorded Reason:</strong> {garage.rejectionReason || 'Administrative suspension enforced.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Two-column layout: Details + Administrative Actions */}
              <div className="autocare-admin-details-grid">
                {/* Left Column: Business & Contact Details */}
                <div>
                  {/* Workshop Profile */}
                  <section className="autocare-admin-section-card" aria-labelledby="section-biz-info">
                    <div className="autocare-admin-section-header">
                      <h2 id="section-biz-info" className="autocare-admin-section-title">
                        <Building2 size={18} style={{ color: '#0056A2' }} /> Business & Workshop Profile
                      </h2>
                    </div>

                    <div className="autocare-admin-field-list">
                      <div className="autocare-admin-field-item">
                        <span className="autocare-admin-field-label">Workshop / Business Name</span>
                        <span className="autocare-admin-field-value">
                          {garage.workshopName || garage.displayName || garage.fullName}
                        </span>
                      </div>

                      <div className="autocare-admin-field-item">
                        <span className="autocare-admin-field-label">Business Registration (BRN)</span>
                        <span className="autocare-admin-field-value highlight">
                          {garage.businessRegNumber || 'N/A'}
                        </span>
                      </div>

                      <div className="autocare-admin-field-item">
                        <span className="autocare-admin-field-label">City / Region</span>
                        <span className="autocare-admin-field-value">
                          {garage.city || 'Sri Lanka'}
                        </span>
                      </div>

                      <div className="autocare-admin-field-item">
                        <span className="autocare-admin-field-label">Country</span>
                        <span className="autocare-admin-field-value">
                          {garage.country || 'Sri Lanka'}
                        </span>
                      </div>

                      {garage.address && (
                        <div className="autocare-admin-field-item full-width">
                          <span className="autocare-admin-field-label">Physical Address</span>
                          <span className="autocare-admin-field-value">{garage.address}</span>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Representative Contact Information */}
                  <section className="autocare-admin-section-card" aria-labelledby="section-contact-info">
                    <div className="autocare-admin-section-header">
                      <h2 id="section-contact-info" className="autocare-admin-section-title">
                        <User size={18} style={{ color: '#0056A2' }} /> Authorized Representative Contact
                      </h2>
                    </div>

                    <div className="autocare-admin-field-list">
                      <div className="autocare-admin-field-item">
                        <span className="autocare-admin-field-label">Representative Full Name</span>
                        <span className="autocare-admin-field-value">{garage.fullName}</span>
                      </div>

                      <div className="autocare-admin-field-item">
                        <span className="autocare-admin-field-label">Verified Contact Phone</span>
                        <span className="autocare-admin-field-value">{garage.phone || 'N/A'}</span>
                      </div>

                      <div className="autocare-admin-field-item full-width">
                        <span className="autocare-admin-field-label">Account & Billing Email</span>
                        <span className="autocare-admin-field-value">{garage.email}</span>
                      </div>
                    </div>
                  </section>

                  {/* Verification Governance & Audit Metadata */}
                  <section className="autocare-admin-section-card" aria-labelledby="section-gov-info">
                    <div className="autocare-admin-section-header">
                      <h2 id="section-gov-info" className="autocare-admin-section-title">
                        <ShieldCheck size={18} style={{ color: '#0056A2' }} /> Governance & Audit Record
                      </h2>
                    </div>

                    <div className="autocare-admin-field-list">
                      <div className="autocare-admin-field-item">
                        <span className="autocare-admin-field-label">Current Partner Status</span>
                        <span className="autocare-admin-field-value" style={{ textTransform: 'capitalize' }}>
                          {garage.status}
                        </span>
                      </div>

                      <div className="autocare-admin-field-item">
                        <span className="autocare-admin-field-label">System Role</span>
                        <span className="autocare-admin-field-value">Authorized Garage Partner</span>
                      </div>

                      <div className="autocare-admin-field-item">
                        <span className="autocare-admin-field-label">Account Created At</span>
                        <span className="autocare-admin-field-value">
                          {garage.createdAt ? new Date(garage.createdAt).toLocaleString('en-GB') : 'N/A'}
                        </span>
                      </div>

                      <div className="autocare-admin-field-item">
                        <span className="autocare-admin-field-label">Last Record Updated</span>
                        <span className="autocare-admin-field-value">
                          {garage.updatedAt ? new Date(garage.updatedAt).toLocaleString('en-GB') : 'N/A'}
                        </span>
                      </div>

                      {garage.verifiedAt && (
                        <div className="autocare-admin-field-item">
                          <span className="autocare-admin-field-label">Verification Timestamp</span>
                          <span className="autocare-admin-field-value">
                            {new Date(garage.verifiedAt).toLocaleString('en-GB')}
                          </span>
                        </div>
                      )}

                      {garage.verifiedBy && (
                        <div className="autocare-admin-field-item">
                          <span className="autocare-admin-field-label">Verified By Admin</span>
                          <span className="autocare-admin-field-value">{garage.verifiedBy}</span>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Verification Documents (Only if actually in response) */}
                  <section className="autocare-admin-section-card" aria-labelledby="section-docs-info">
                    <div className="autocare-admin-section-header">
                      <h2 id="section-docs-info" className="autocare-admin-section-title">
                        <FileText size={18} style={{ color: '#0056A2' }} /> Trade Licenses & Certificates
                      </h2>
                    </div>

                    {garage.documents && garage.documents.length > 0 ? (
                      <div className="autocare-admin-doc-list">
                        {garage.documents.map((doc, idx) => (
                          <div key={idx} className="autocare-admin-doc-item">
                            <div className="autocare-admin-doc-name">
                              <FileText size={16} style={{ color: '#0056A2' }} />
                              <span>{doc.name || `Document ${idx + 1}`}</span>
                            </div>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="autocare-admin-btn autocare-admin-btn-secondary"
                            >
                              <ExternalLink size={13} /> View Document
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
                        No digital trade license or certificates are currently attached to this workshop partner profile.
                      </p>
                    )}
                  </section>
                </div>

                {/* Right Column: Administrative Actions Sidebar */}
                <aside aria-label="Administrative Actions">
                  <div className="autocare-admin-action-card">
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                      Partner Certification Actions
                    </h3>

                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                      Manage verification status per AutoCare 360 platform standards. All status changes are logged to the administrative audit trail.
                    </p>

                    <div className="autocare-admin-action-buttons">
                      {garage.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => setShowApproveModal(true)}
                          className="autocare-admin-btn autocare-admin-btn-success"
                        >
                          <Check size={16} /> Approve & Activate Garage
                        </button>
                      )}

                      {garage.status === 'suspended' && (
                        <button
                          type="button"
                          onClick={() => setShowApproveModal(true)}
                          className="autocare-admin-btn autocare-admin-btn-success"
                        >
                          <Check size={16} /> Re-activate Partner
                        </button>
                      )}

                      {garage.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowRejectModal(true);
                            setRejectionReason('');
                            setRejectionError(null);
                          }}
                          className="autocare-admin-btn autocare-admin-btn-danger"
                        >
                          <Ban size={16} /> Reject Application
                        </button>
                      )}

                      {garage.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowRejectModal(true);
                            setRejectionReason('');
                            setRejectionError(null);
                          }}
                          className="autocare-admin-btn autocare-admin-btn-danger"
                        >
                          <Ban size={16} /> Suspend Garage Partner
                        </button>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                      <Link
                        to="/admin/garages"
                        className="autocare-admin-btn autocare-admin-btn-secondary"
                        style={{ width: '100%' }}
                      >
                        <ArrowLeft size={14} /> Back to Garage List
                      </Link>
                    </div>
                  </div>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Approve Confirmation Modal */}
      {showApproveModal && garage && (
        <div className="autocare-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="details-approve-title">
          <div className="autocare-modal-card">
            <div className="autocare-modal-header">
              <h2 id="details-approve-title" className="autocare-modal-title">
                <CheckCircle2 size={20} style={{ color: '#059669' }} /> Verify & Activate Garage
              </h2>
              <button
                type="button"
                className="autocare-modal-close"
                onClick={() => setShowApproveModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="autocare-modal-body">
              <p>
                Confirm official verification for <strong>{garage.workshopName || garage.fullName}</strong>.
              </p>
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                }}
              >
                <div><strong>Business:</strong> {garage.workshopName || garage.fullName}</div>
                <div><strong>Email:</strong> {garage.email}</div>
                <div><strong>City:</strong> {garage.city || 'Sri Lanka'}</div>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                This grants active workshop permissions to issue authorized maintenance entries and workshop quotations.
              </p>
            </div>

            <div className="autocare-modal-footer">
              <button
                type="button"
                className="autocare-admin-btn autocare-admin-btn-secondary"
                onClick={() => setShowApproveModal(false)}
                disabled={isApproving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="autocare-admin-btn autocare-admin-btn-success"
                onClick={handleApproveConfirm}
                disabled={isApproving}
              >
                {isApproving ? <Loader2 size={16} className="autocare-spin" /> : <Check size={16} />}
                Confirm & Activate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject / Suspend Modal */}
      {showRejectModal && garage && (
        <div className="autocare-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="details-reject-title">
          <div className="autocare-modal-card">
            <form onSubmit={handleRejectSubmit}>
              <div className="autocare-modal-header">
                <h2 id="details-reject-title" className="autocare-modal-title">
                  <AlertTriangle size={20} style={{ color: '#e11d48' }} />
                  {garage.status === 'active' ? 'Suspend Garage Partner' : 'Reject Partner Application'}
                </h2>
                <button
                  type="button"
                  className="autocare-modal-close"
                  onClick={() => setShowRejectModal(false)}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="autocare-modal-body">
                <p>
                  You are about to {garage.status === 'active' ? 'suspend' : 'reject'}{' '}
                  <strong>{garage.workshopName || garage.fullName}</strong>.
                  Please specify a justification reason below.
                </p>

                {rejectionError && (
                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: '#fff1f2',
                      border: '1px solid #fecdd3',
                      borderRadius: '8px',
                      color: '#be123c',
                      fontSize: '13px',
                      fontWeight: 500,
                    }}
                    role="alert"
                  >
                    {rejectionError}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="detail-reject-reason"
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: '6px',
                    }}
                  >
                    Justification Reason <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <textarea
                    id="detail-reject-reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide details (e.g., Incomplete trade license, unverified tax identification, regulatory violation)..."
                    className="autocare-modal-textarea"
                    required
                    rows={4}
                  />
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', textAlign: 'right' }}>
                    {rejectionReason.trim().length} / 5 min characters
                  </div>
                </div>
              </div>

              <div className="autocare-modal-footer">
                <button
                  type="button"
                  className="autocare-admin-btn autocare-admin-btn-secondary"
                  onClick={() => setShowRejectModal(false)}
                  disabled={isRejecting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="autocare-admin-btn autocare-admin-btn-danger"
                  disabled={isRejecting}
                >
                  {isRejecting ? <Loader2 size={16} className="autocare-spin" /> : <Ban size={16} />}
                  {garage.status === 'active' ? 'Confirm Suspension' : 'Confirm Rejection'}
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

export default AdminGarageDetailsPage;
