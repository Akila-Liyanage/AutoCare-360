import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  X,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Check,
  Ban,
  Clock,
  Building2,
  MapPin,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import adminService, { type AdminGarage, type GarageStatus } from '../../services/adminService';
import '../../styles/admin.css';

export const AdminGarageVerificationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'suspended' | 'all'>('pending');
  const [garages, setGarages] = useState<AdminGarage[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal states
  const [approvingGarage, setApprovingGarage] = useState<AdminGarage | null>(null);
  const [isApproving, setIsApproving] = useState<boolean>(false);

  const [rejectingGarage, setRejectingGarage] = useState<AdminGarage | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState<boolean>(false);

  // Notification helper
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4500);
  }, []);

  // Fetch Garages
  const loadGarages = useCallback(async () => {
    try {
      const data = await adminService.getGarages(activeTab, searchQuery);
      setGarages(data);
      setErrorMessage(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve garage partners.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    let isMounted = true;
    adminService
      .getGarages(activeTab, searchQuery)
      .then((data) => {
        if (isMounted) {
          setGarages(data);
          setErrorMessage(null);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to retrieve garage partners.';
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
  }, [activeTab, searchQuery]);

  // Tab counters (approximate or current view)
  const pendingCount = garages.filter((g) => g.status === 'pending').length;

  // Confirm and Execute Approval
  const handleApproveConfirm = async () => {
    if (!approvingGarage) return;
    setIsApproving(true);
    try {
      await adminService.approveGarage(approvingGarage._id);
      showToast(`Workshop "${approvingGarage.workshopName || approvingGarage.fullName}" has been verified and activated.`);
      // Optimistically update list
      setGarages((prev) =>
        prev.map((g) => (g._id === approvingGarage._id ? { ...g, status: 'active' } : g))
      );
      setApprovingGarage(null);
      // Reload in background
      loadGarages();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve garage partner.';
      showToast(msg, 'error');
    } finally {
      setIsApproving(false);
    }
  };

  // Confirm and Execute Rejection / Suspension
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingGarage) return;

    const trimmed = rejectionReason.trim();
    if (!trimmed || trimmed.length < 5) {
      setRejectionError('Please provide a specific justification reason (minimum 5 characters).');
      return;
    }

    setIsRejecting(true);
    setRejectionError(null);
    try {
      await adminService.rejectGarage(rejectingGarage._id, trimmed);
      showToast(`Workshop "${rejectingGarage.workshopName || rejectingGarage.fullName}" status updated to Suspended.`);
      // Optimistically update list
      setGarages((prev) =>
        prev.map((g) =>
          g._id === rejectingGarage._id
            ? { ...g, status: 'suspended', rejectionReason: trimmed }
            : g
        )
      );
      setRejectingGarage(null);
      setRejectionReason('');
      loadGarages();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update garage status.';
      setRejectionError(msg);
    } finally {
      setIsRejecting(false);
    }
  };

  // Helper for status badge
  const renderStatusBadge = (status: GarageStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="autocare-status-badge status-active">
            <CheckCircle2 size={13} aria-hidden="true" /> Active
          </span>
        );
      case 'suspended':
        return (
          <span className="autocare-status-badge status-suspended">
            <Ban size={13} aria-hidden="true" /> Suspended
          </span>
        );
      default:
        return (
          <span className="autocare-status-badge status-pending">
            <Clock size={13} aria-hidden="true" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="autocare-admin-page">
      <Navbar />

      <main className="autocare-admin-main" id="main-content">
        <div className="autocare-admin-container">
          {/* Toast Notification */}
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

          {/* Header */}
          <header className="autocare-admin-header">
            <div className="autocare-admin-top-meta">
              <span className="autocare-admin-badge">
                <ShieldCheck size={14} aria-hidden="true" /> System Administration Console
              </span>
            </div>
            <h1 className="autocare-admin-title">Garage Partner Verification</h1>
            <p className="autocare-admin-subtitle">
              Review, verify, and govern automotive workshop partners in accordance with AutoCare 360 certification standards (BRD BRULE-01, FR-05).
            </p>
          </header>

          {/* Controls Bar */}
          <section className="autocare-admin-controls" aria-label="Verification filters and search">
            {/* Tabs */}
            <div className="autocare-admin-tabs" role="tablist" aria-label="Filter by verification status">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'pending'}
                className={`autocare-admin-tab ${activeTab === 'pending' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                <Clock size={15} aria-hidden="true" />
                <span>Pending Review</span>
                {activeTab === 'pending' && pendingCount > 0 && (
                  <span className="autocare-admin-tab-count">{pendingCount}</span>
                )}
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'active'}
                className={`autocare-admin-tab ${activeTab === 'active' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                <CheckCircle2 size={15} aria-hidden="true" />
                <span>Active Partners</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'suspended'}
                className={`autocare-admin-tab ${activeTab === 'suspended' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('suspended')}
              >
                <Ban size={15} aria-hidden="true" />
                <span>Suspended</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'all'}
                className={`autocare-admin-tab ${activeTab === 'all' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <span>All Garages</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="autocare-admin-search-wrap">
              <div className="autocare-admin-search-input-wrap">
                <Search size={16} className="autocare-admin-search-icon" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search by name, email, BRN, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="autocare-admin-search-input"
                  aria-label="Search garages by workshop name, contact, registration number, or city"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="autocare-admin-search-clear"
                    aria-label="Clear search query"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={loadGarages}
                className="autocare-admin-refresh-btn"
                aria-label="Refresh garage partner list"
                title="Refresh list"
              >
                <RefreshCw size={16} className={isLoading ? 'autocare-spin' : ''} />
              </button>
            </div>
          </section>

          {/* Main Content Area */}
          {isLoading ? (
            <div className="autocare-admin-state-box" aria-live="polite">
              <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#0056A2' }} />
              <p className="autocare-admin-state-text">Loading garage partner records...</p>
            </div>
          ) : errorMessage ? (
            <div className="autocare-admin-state-box">
              <div className="autocare-admin-state-icon is-error">
                <AlertCircle size={28} />
              </div>
              <h2 className="autocare-admin-state-title">Unable to Load Garages</h2>
              <p className="autocare-admin-state-text">{errorMessage}</p>
              <button
                type="button"
                onClick={loadGarages}
                className="autocare-admin-btn autocare-admin-btn-primary"
              >
                <RefreshCw size={14} /> Try Again
              </button>
            </div>
          ) : garages.length === 0 ? (
            <div className="autocare-admin-state-box">
              <div className="autocare-admin-state-icon is-empty">
                <Building2 size={28} />
              </div>
              <h2 className="autocare-admin-state-title">No Garages Found</h2>
              <p className="autocare-admin-state-text">
                {searchQuery
                  ? `No garage partners matched the search criteria "${searchQuery}".`
                  : activeTab === 'pending'
                    ? 'There are currently no garage onboarding applications awaiting administrative review.'
                    : `No ${activeTab} garage partners found in the system registry.`}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="autocare-admin-btn autocare-admin-btn-secondary"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="autocare-admin-table-card">
                <div className="autocare-admin-table-wrap">
                  <table className="autocare-admin-table">
                    <thead>
                      <tr>
                        <th scope="col">Workshop / Business</th>
                        <th scope="col">Contact Person</th>
                        <th scope="col">Phone & Email</th>
                        <th scope="col">City / Location</th>
                        <th scope="col">Registered</th>
                        <th scope="col">Status</th>
                        <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {garages.map((garage) => (
                        <tr key={garage._id}>
                          <td>
                            <div className="autocare-admin-workshop-info">
                              <span className="autocare-admin-workshop-title">
                                {garage.workshopName || garage.displayName || garage.fullName}
                              </span>
                              {garage.businessRegNumber && (
                                <span className="autocare-admin-workshop-reg">
                                  BRN: {garage.businessRegNumber}
                                </span>
                              )}
                            </div>
                          </td>

                          <td>
                            <div className="autocare-admin-contact-info">
                              <span className="autocare-admin-contact-name">{garage.fullName}</span>
                              <span className="autocare-admin-contact-sub">Partner Representative</span>
                            </div>
                          </td>

                          <td>
                            <div className="autocare-admin-contact-info">
                              <span>{garage.email}</span>
                              <span className="autocare-admin-contact-sub">{garage.phone || 'N/A'}</span>
                            </div>
                          </td>

                          <td>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={13} style={{ color: '#64748b' }} aria-hidden="true" />
                              {garage.city || 'Sri Lanka'}
                            </span>
                          </td>

                          <td>
                            <span style={{ fontSize: '13px', color: '#64748b' }}>
                              {garage.createdAt
                                ? new Date(garage.createdAt).toLocaleDateString('en-GB')
                                : 'N/A'}
                            </span>
                          </td>

                          <td>{renderStatusBadge(garage.status)}</td>

                          <td style={{ textAlign: 'right' }}>
                            <div className="autocare-admin-actions-cell" style={{ justifyContent: 'flex-end' }}>
                              <Link
                                to={`/admin/garages/${garage._id}`}
                                className="autocare-admin-btn autocare-admin-btn-secondary"
                                aria-label={`View details for ${garage.workshopName || garage.fullName}`}
                              >
                                <Eye size={14} /> View
                              </Link>

                              {garage.status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => setApprovingGarage(garage)}
                                  className="autocare-admin-btn autocare-admin-btn-success"
                                  aria-label={`Approve ${garage.workshopName || garage.fullName}`}
                                >
                                  <Check size={14} /> Approve
                                </button>
                              )}

                              {garage.status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectingGarage(garage);
                                    setRejectionReason('');
                                    setRejectionError(null);
                                  }}
                                  className="autocare-admin-btn autocare-admin-btn-danger"
                                  aria-label={`Reject ${garage.workshopName || garage.fullName}`}
                                >
                                  <Ban size={14} /> Reject
                                </button>
                              )}

                              {garage.status === 'active' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectingGarage(garage);
                                    setRejectionReason('');
                                    setRejectionError(null);
                                  }}
                                  className="autocare-admin-btn autocare-admin-btn-danger"
                                  aria-label={`Suspend ${garage.workshopName || garage.fullName}`}
                                >
                                  <Ban size={14} /> Suspend
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards View */}
              <div className="autocare-admin-cards-view">
                {garages.map((garage) => (
                  <article key={garage._id} className="autocare-admin-card-item">
                    <div className="autocare-admin-card-header">
                      <div>
                        <h2 className="autocare-admin-workshop-title" style={{ fontSize: '15px' }}>
                          {garage.workshopName || garage.displayName || garage.fullName}
                        </h2>
                        {garage.businessRegNumber && (
                          <div className="autocare-admin-workshop-reg">
                            BRN: {garage.businessRegNumber}
                          </div>
                        )}
                      </div>
                      {renderStatusBadge(garage.status)}
                    </div>

                    <div className="autocare-admin-card-grid">
                      <div>
                        <div className="autocare-admin-card-label">Contact Person</div>
                        <div className="autocare-admin-card-value">{garage.fullName}</div>
                      </div>
                      <div>
                        <div className="autocare-admin-card-label">City</div>
                        <div className="autocare-admin-card-value">{garage.city || 'Sri Lanka'}</div>
                      </div>
                      <div>
                        <div className="autocare-admin-card-label">Email</div>
                        <div className="autocare-admin-card-value" style={{ fontSize: '12px' }}>
                          {garage.email}
                        </div>
                      </div>
                      <div>
                        <div className="autocare-admin-card-label">Phone</div>
                        <div className="autocare-admin-card-value">{garage.phone || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="autocare-admin-card-actions">
                      <Link
                        to={`/admin/garages/${garage._id}`}
                        className="autocare-admin-btn autocare-admin-btn-secondary"
                      >
                        <Eye size={14} /> View Details
                      </Link>

                      {garage.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => setApprovingGarage(garage)}
                          className="autocare-admin-btn autocare-admin-btn-success"
                        >
                          <Check size={14} /> Approve
                        </button>
                      )}

                      {garage.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingGarage(garage);
                            setRejectionReason('');
                            setRejectionError(null);
                          }}
                          className="autocare-admin-btn autocare-admin-btn-danger"
                        >
                          <Ban size={14} /> Reject
                        </button>
                      )}

                      {garage.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingGarage(garage);
                            setRejectionReason('');
                            setRejectionError(null);
                          }}
                          className="autocare-admin-btn autocare-admin-btn-danger"
                        >
                          <Ban size={14} /> Suspend
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Approve Confirmation Modal */}
      {approvingGarage && (
        <div className="autocare-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="approve-modal-title">
          <div className="autocare-modal-card">
            <div className="autocare-modal-header">
              <h2 id="approve-modal-title" className="autocare-modal-title">
                <CheckCircle2 size={20} style={{ color: '#059669' }} /> Approve Workshop Partner
              </h2>
              <button
                type="button"
                className="autocare-modal-close"
                onClick={() => setApprovingGarage(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="autocare-modal-body">
              <p>
                Are you sure you want to verify and approve{' '}
                <strong>{approvingGarage.workshopName || approvingGarage.fullName}</strong> as an authorized service partner?
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
                <div><strong>Business:</strong> {approvingGarage.workshopName || approvingGarage.fullName}</div>
                <div><strong>Representative:</strong> {approvingGarage.fullName} ({approvingGarage.email})</div>
                <div><strong>Location:</strong> {approvingGarage.city || 'Sri Lanka'}</div>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Upon approval, this workshop will immediately gain access to the official garage dashboard, quotation management, and authorized service ledger writing.
              </p>
            </div>

            <div className="autocare-modal-footer">
              <button
                type="button"
                className="autocare-admin-btn autocare-admin-btn-secondary"
                onClick={() => setApprovingGarage(null)}
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
      {rejectingGarage && (
        <div className="autocare-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="reject-modal-title">
          <div className="autocare-modal-card">
            <form onSubmit={handleRejectSubmit}>
              <div className="autocare-modal-header">
                <h2 id="reject-modal-title" className="autocare-modal-title">
                  <AlertTriangle size={20} style={{ color: '#e11d48' }} />
                  {rejectingGarage.status === 'active' ? 'Suspend Workshop Partner' : 'Reject Workshop Application'}
                </h2>
                <button
                  type="button"
                  className="autocare-modal-close"
                  onClick={() => setRejectingGarage(null)}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="autocare-modal-body">
                <p>
                  You are about to {rejectingGarage.status === 'active' ? 'suspend' : 'reject'}{' '}
                  <strong>{rejectingGarage.workshopName || rejectingGarage.fullName}</strong>.
                  Please state a clear justification reason.
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
                    htmlFor="rejection-reason"
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
                    id="rejection-reason"
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
                  onClick={() => setRejectingGarage(null)}
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
                  {rejectingGarage.status === 'active' ? 'Confirm Suspension' : 'Confirm Rejection'}
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

export default AdminGarageVerificationPage;
