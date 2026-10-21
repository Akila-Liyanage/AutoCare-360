import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  User,
  Check,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';
import adminService, { type AdminGarageItem } from '../../services/adminService';
import logoImg from '../../assets/auth/download (27) (1) 2.png';
import '../../styles/garage-dashboard.css';

export const AdminGarageDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [garage, setGarage] = useState<AdminGarageItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    adminService
      .getGarageById(id)
      .then((data) => {
        if (isMounted) {
          setGarage(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to load garage details.';
          setError(msg);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Handle Approve
  const handleApprove = async () => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      setActionSuccess(null);
      setError(null);
      const updated = await adminService.approveGarage(id);
      setGarage(updated);
      setActionSuccess('Garage partner successfully approved! Account is now active.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve garage.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reject / Suspend
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!rejectReason.trim()) {
      setRejectError('Please specify a rejection reason explaining the decision to the garage owner.');
      return;
    }

    try {
      setIsSubmitting(true);
      setRejectError(null);
      const updated = await adminService.rejectGarage(id, rejectReason.trim());
      setGarage(updated);
      setShowRejectModal(false);
      setRejectReason('');
      setActionSuccess('Garage partner account has been suspended/rejected.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reject garage.';
      setRejectError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#090e17', color: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
      {/* Minimal Admin Header */}
      <header
        style={{
          background: '#0d1524',
          borderBottom: '1px solid #1e293b',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src={logoImg} alt="AutoCare 360 Logo" style={{ height: '36px', objectFit: 'contain' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8' }}>AutoCare 360</span>
              <span
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                Admin Review
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
              Garage Account Review &amp; Official Verification
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={() => navigate('/admin/garages')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#131e33',
              border: '1px solid #1e293b',
              color: '#38bdf8',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={15} />
            <span>Back to Garages Queue</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, padding: '28px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
          <Link to="/admin/garages" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
            Garages Queue
          </Link>
          <span>/</span>
          <span style={{ color: '#cbd5e1' }}>{garage?.workshopName || 'Garage Review'}</span>
        </div>

        {/* Action success alert */}
        {actionSuccess && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              padding: '14px 18px',
              borderRadius: '10px',
              marginBottom: '20px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={18} />
              <span>{actionSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionSuccess(null)}
              style={{ background: 'transparent', border: 'none', color: '#34d399', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Error alert */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              padding: '14px 18px',
              borderRadius: '10px',
              marginBottom: '20px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid #1e293b',
                borderTopColor: '#38bdf8',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px auto',
              }}
            />
            <span>Fetching verification dossier...</span>
          </div>
        ) : !garage ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <AlertCircle size={40} style={{ color: '#ef4444', margin: '0 auto 14px auto' }} />
            <h2 style={{ color: '#ffffff', margin: '0 0 8px 0' }}>Garage Account Not Found</h2>
            <p style={{ margin: '0 0 20px 0' }}>The requested garage partner ID does not exist in the database.</p>
            <button
              type="button"
              onClick={() => navigate('/admin/garages')}
              style={{
                background: '#0284c7',
                border: 'none',
                color: '#ffffff',
                padding: '9px 18px',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Return to Garages Queue
            </button>
          </div>
        ) : (
          <div>
            {/* Top Identity Hero Card */}
            <div
              style={{
                background: '#0d1524',
                border: '1px solid #1e293b',
                borderRadius: '14px',
                padding: '24px 28px',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '14px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1.5px solid rgba(56, 189, 248, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8',
                  }}
                >
                  <Building2 size={32} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
                      {garage.workshopName}
                    </h1>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        background:
                          garage.status === 'active'
                            ? 'rgba(16, 185, 129, 0.2)'
                            : garage.status === 'suspended'
                            ? 'rgba(239, 68, 68, 0.2)'
                            : 'rgba(245, 158, 11, 0.2)',
                        color:
                          garage.status === 'active'
                            ? '#34d399'
                            : garage.status === 'suspended'
                            ? '#f87171'
                            : '#fbbf24',
                        border: `1px solid ${
                          garage.status === 'active'
                            ? 'rgba(16, 185, 129, 0.4)'
                            : garage.status === 'suspended'
                            ? 'rgba(239, 68, 68, 0.4)'
                            : 'rgba(245, 158, 11, 0.4)'
                        }`,
                      }}
                    >
                      {garage.status}
                    </span>
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '13px', color: '#94a3b8', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span>Account ID: <code style={{ color: '#38bdf8' }}>{garage.id || garage._id}</code></span>
                    <span>•</span>
                    <span>Role: <strong style={{ color: '#f1f5f9' }}>Garage Partner</strong></span>
                    <span>•</span>
                    <span>Joined: {new Date(garage.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {garage.status !== 'active' && (
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#10b981',
                      border: 'none',
                      color: '#ffffff',
                      padding: '11px 22px',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#059669')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#10b981')}
                  >
                    <Check size={16} />
                    <span>Approve &amp; Activate Garage</span>
                  </button>
                )}

                {garage.status !== 'suspended' && (
                  <button
                    type="button"
                    onClick={() => {
                      setRejectReason('');
                      setRejectError(null);
                      setShowRejectModal(true);
                    }}
                    disabled={isSubmitting}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid #ef4444',
                      color: '#f87171',
                      padding: '11px 22px',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#ef4444';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                      e.currentTarget.style.color = '#f87171';
                    }}
                  >
                    <X size={16} />
                    <span>Reject / Suspend Garage</span>
                  </button>
                )}

                {garage.status === 'active' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#34d399',
                      fontSize: '13px',
                      fontWeight: 700,
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '8px 16px',
                      borderRadius: '8px',
                    }}
                  >
                    <ShieldCheck size={16} />
                    <span>Active &amp; Authorized</span>
                  </div>
                )}
              </div>
            </div>

            {/* Two Column Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              {/* Card 1: Business Information & Legal Credentials */}
              <section
                style={{
                  background: '#0d1524',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  padding: '22px',
                }}
              >
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={17} />
                  <span>Business &amp; Registry Credentials</span>
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>BUSINESS / WORKSHOP NAME</span>
                    <strong style={{ color: '#f1f5f9', fontSize: '15px' }}>{garage.workshopName}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>BUSINESS REGISTRATION NUMBER (BRN)</span>
                    {garage.businessRegNumber ? (
                      <code
                        style={{
                          background: '#131e33',
                          border: '1px solid #1e293b',
                          color: '#38bdf8',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 700,
                          display: 'inline-block',
                          marginTop: '4px',
                        }}
                      >
                        {garage.businessRegNumber}
                      </code>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Pending submission by garage partner</span>
                    )}
                  </div>

                  <div>
                    <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>PHYSICAL WORKSHOP ADDRESS</span>
                    <span style={{ color: '#cbd5e1' }}>{garage.address || 'Not registered'}</span>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>CITY / REGION</span>
                    <span style={{ color: '#cbd5e1' }}>{garage.city || 'Not specified'}</span>
                  </div>
                </div>
              </section>

              {/* Card 2: Contact Person Details */}
              <section
                style={{
                  background: '#0d1524',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  padding: '22px',
                }}
              >
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={17} />
                  <span>Owner &amp; Representative Contacts</span>
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>REGISTERED ACCOUNT HOLDER</span>
                    <strong style={{ color: '#f1f5f9', fontSize: '15px' }}>{garage.fullName}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Mail size={16} style={{ color: '#38bdf8' }} />
                    <div>
                      <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>OFFICIAL EMAIL ADDRESS</span>
                      <a href={`mailto:${garage.email}`} style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
                        {garage.email}
                      </a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Phone size={16} style={{ color: '#38bdf8' }} />
                    <div>
                      <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>TELEPHONE CONTACT</span>
                      <span style={{ color: '#f1f5f9' }}>{garage.phone}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Calendar size={16} style={{ color: '#38bdf8' }} />
                    <div>
                      <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>ACCOUNT CREATION TIMESTAMP</span>
                      <span style={{ color: '#cbd5e1' }}>
                        {new Date(garage.createdAt).toLocaleString('en-GB')}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Verification Metadata & Decision Audit Box */}
            <section
              style={{
                background: '#0d1524',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                padding: '22px',
              }}
            >
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} />
                <span>Verification Audit &amp; Compliance Log</span>
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '16px',
                  background: '#131e33',
                  padding: '18px',
                  borderRadius: '10px',
                  border: '1px solid #1e293b',
                  fontSize: '13px',
                }}
              >
                <div>
                  <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>CURRENT ACCOUNT STATUS</span>
                  <strong
                    style={{
                      color:
                        garage.status === 'active'
                          ? '#34d399'
                          : garage.status === 'suspended'
                          ? '#f87171'
                          : '#fbbf24',
                      fontSize: '14px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {garage.status}
                  </strong>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>VERIFICATION DATE</span>
                  <span style={{ color: '#f1f5f9' }}>
                    {garage.verifiedAt ? new Date(garage.verifiedAt).toLocaleString('en-GB') : 'Not yet verified'}
                  </span>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>VERIFIED BY ADMINISTRATOR</span>
                  <span style={{ color: '#f1f5f9' }}>
                    {garage.verifiedBy ? (
                      typeof garage.verifiedBy === 'object' ? (
                        `${garage.verifiedBy.fullName} (${garage.verifiedBy.email})`
                      ) : (
                        garage.verifiedBy
                      )
                    ) : (
                      'Pending review'
                    )}
                  </span>
                </div>
              </div>

              {garage.rejectionReason && (
                <div
                  style={{
                    marginTop: '16px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '14px 18px',
                    borderRadius: '8px',
                    color: '#f87171',
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '12.5px', marginBottom: '4px' }}>
                    REJECTION / SUSPENSION REASON:
                  </strong>
                  <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.5, color: '#fca5a5' }}>
                    {garage.rejectionReason}
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Reject / Suspend Reason Modal */}
      {showRejectModal && (
        <div
          className="autocare-garage-modal-backdrop"
          onClick={() => setShowRejectModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="autocare-garage-modal"
            style={{ maxWidth: '520px', background: '#0d1524', border: '1px solid #1e293b', color: '#f1f5f9' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="autocare-garage-modal-header" style={{ borderBottomColor: '#1e293b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <XCircle size={22} style={{ color: '#ef4444' }} />
                <h3 style={{ margin: 0, color: '#ffffff', fontSize: '17px' }}>
                  Reject / Suspend Garage Partner
                </h3>
              </div>
              <button
                type="button"
                className="autocare-garage-modal-close"
                onClick={() => setShowRejectModal(false)}
                style={{ color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmReject}>
              <div className="autocare-garage-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.5 }}>
                  Please state the official reason for rejecting or suspending{' '}
                  <strong style={{ color: '#ffffff' }}>{garage?.workshopName}</strong>. This feedback will be recorded in the audit log.
                </p>

                {rejectError && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#fca5a5',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      fontSize: '13px',
                    }}
                  >
                    {rejectError}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                    REJECTION / SUSPENSION REASON <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => {
                      setRejectReason(e.target.value);
                      if (rejectError) setRejectError(null);
                    }}
                    placeholder="e.g. Business registration document expired, invalid workshop address provided, or regulatory inspection disparity."
                    style={{
                      width: '100%',
                      background: '#131e33',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div className="autocare-garage-modal-footer" style={{ borderTopColor: '#1e293b' }}>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#cbd5e1',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: '#ef4444',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 18px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGarageDetailsPage;
