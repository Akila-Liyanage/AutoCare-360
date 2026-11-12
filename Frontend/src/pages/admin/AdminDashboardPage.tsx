import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Shield,
  AlertCircle
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import adminService, { type AdminGarage, type AdminUser } from '../../services/adminService';
import '../../styles/admin.css';

export const AdminDashboardPage: React.FC = () => {
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [suspendedCount, setSuspendedCount] = useState<number | null>(null);
  const [totalUsersCount, setTotalUsersCount] = useState<number | null>(null);

  const [recentGarages, setRecentGarages] = useState<AdminGarage[]>([]);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshDashboardData = useCallback(() => {
    setIsRefreshing(true);
    Promise.allSettled([
      adminService.getGarages('all'),
      adminService.getUsers(),
    ])
      .then(([garagesResult, usersResult]) => {
        setErrorMessage(null);

        if (garagesResult.status === 'fulfilled' && Array.isArray(garagesResult.value)) {
          const garages = garagesResult.value;
          setPendingCount(garages.filter((g) => g.status === 'pending').length);
          setActiveCount(garages.filter((g) => g.status === 'active').length);
          setSuspendedCount(garages.filter((g) => g.status === 'suspended').length);

          const sortedGarages = [...garages].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
          setRecentGarages(sortedGarages.slice(0, 4));
        } else {
          setPendingCount(null);
          setActiveCount(null);
          setSuspendedCount(null);
          setRecentGarages([]);
        }

        if (usersResult.status === 'fulfilled' && usersResult.value) {
          const usersData = usersResult.value;
          const total = typeof usersData.total === 'number'
            ? usersData.total
            : Array.isArray(usersData.users)
              ? usersData.users.length
              : null;
          setTotalUsersCount(total);

          if (Array.isArray(usersData.users)) {
            const sortedUsers = [...usersData.users].sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            });
            setRecentUsers(sortedUsers.slice(0, 4));
          } else {
            setRecentUsers([]);
          }
        } else {
          setTotalUsersCount(null);
          setRecentUsers([]);
        }
      })
      .catch((err: unknown) => {
        console.warn('Admin dashboard fetch error:', err);
        setErrorMessage('Unable to retrieve administrative metrics. You can still manage records directly.');
        setPendingCount(null);
        setActiveCount(null);
        setSuspendedCount(null);
        setTotalUsersCount(null);
      })
      .finally(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      });
  }, []);

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      adminService.getGarages('all'),
      adminService.getUsers(),
    ])
      .then(([garagesResult, usersResult]) => {
        if (!isMounted) return;
        setErrorMessage(null);

        if (garagesResult.status === 'fulfilled' && Array.isArray(garagesResult.value)) {
          const garages = garagesResult.value;
          setPendingCount(garages.filter((g) => g.status === 'pending').length);
          setActiveCount(garages.filter((g) => g.status === 'active').length);
          setSuspendedCount(garages.filter((g) => g.status === 'suspended').length);

          const sortedGarages = [...garages].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
          setRecentGarages(sortedGarages.slice(0, 4));
        } else {
          setPendingCount(null);
          setActiveCount(null);
          setSuspendedCount(null);
          setRecentGarages([]);
        }

        if (usersResult.status === 'fulfilled' && usersResult.value) {
          const usersData = usersResult.value;
          const total = typeof usersData.total === 'number'
            ? usersData.total
            : Array.isArray(usersData.users)
              ? usersData.users.length
              : null;
          setTotalUsersCount(total);

          if (Array.isArray(usersData.users)) {
            const sortedUsers = [...usersData.users].sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            });
            setRecentUsers(sortedUsers.slice(0, 4));
          } else {
            setRecentUsers([]);
          }
        } else {
          setTotalUsersCount(null);
          setRecentUsers([]);
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        console.warn('Admin dashboard fetch error:', err);
        setErrorMessage('Unable to retrieve administrative metrics. You can still manage records directly.');
        setPendingCount(null);
        setActiveCount(null);
        setSuspendedCount(null);
        setTotalUsersCount(null);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = () => {
    refreshDashboardData();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recent';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="autocare-admin-page">
      <Navbar />

      <main className="autocare-admin-main">
        <div className="autocare-admin-container">
          {/* Header & Meta */}
          <header className="autocare-admin-header">
            <div className="autocare-admin-top-meta">
              <span className="autocare-admin-badge">
                <ShieldCheck size={14} />
                <span>System Administration</span>
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="autocare-admin-action-btn autocare-admin-btn-secondary"
                  title="Refresh administrative metrics"
                  aria-label="Refresh metrics"
                >
                  <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
                  <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
                </button>
              </div>
            </div>

            <div>
              <h1 className="autocare-admin-title">System Administration</h1>
              <p className="autocare-admin-subtitle">
                Manage users, review garage applications and monitor platform access.
              </p>
            </div>
          </header>

          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '10px',
                color: '#b91c1c',
                marginBottom: '20px',
                fontSize: '13.5px',
              }}
            >
              <AlertCircle size={18} flex-shrink={0} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Summary Metric Cards */}
          <section className="autocare-metrics-grid" aria-label="System Summary Metrics">
            {/* Card 1: Pending Garages */}
            <Link
              to="/admin/garages"
              className="autocare-metric-card"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="autocare-metric-card-top">
                <span className="autocare-metric-label">Pending Garages</span>
                <div className="autocare-metric-icon-wrap is-amber">
                  <Clock size={19} />
                </div>
              </div>
              <div className="autocare-metric-value">
                {isLoading ? (
                  <span style={{ fontSize: '18px', color: '#94a3b8' }}>Loading...</span>
                ) : pendingCount !== null ? (
                  pendingCount
                ) : (
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#0056A2' }}>View Records</span>
                )}
              </div>
              <p className="autocare-metric-subtext">Awaiting accreditation review</p>
            </Link>

            {/* Card 2: Active Garages */}
            <Link
              to="/admin/garages"
              className="autocare-metric-card"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="autocare-metric-card-top">
                <span className="autocare-metric-label">Active Garages</span>
                <div className="autocare-metric-icon-wrap is-emerald">
                  <CheckCircle2 size={19} />
                </div>
              </div>
              <div className="autocare-metric-value">
                {isLoading ? (
                  <span style={{ fontSize: '18px', color: '#94a3b8' }}>Loading...</span>
                ) : activeCount !== null ? (
                  activeCount
                ) : (
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#0056A2' }}>View Records</span>
                )}
              </div>
              <p className="autocare-metric-subtext">Verified workshop partners</p>
            </Link>

            {/* Card 3: Suspended Garages */}
            <Link
              to="/admin/garages"
              className="autocare-metric-card"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="autocare-metric-card-top">
                <span className="autocare-metric-label">Suspended Garages</span>
                <div className="autocare-metric-icon-wrap" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                  <AlertTriangle size={19} />
                </div>
              </div>
              <div className="autocare-metric-value">
                {isLoading ? (
                  <span style={{ fontSize: '18px', color: '#94a3b8' }}>Loading...</span>
                ) : suspendedCount !== null ? (
                  suspendedCount
                ) : (
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#0056A2' }}>View Records</span>
                )}
              </div>
              <p className="autocare-metric-subtext">Restricted or flagged workshops</p>
            </Link>

            {/* Card 4: Total Users */}
            <Link
              to="/admin/users"
              className="autocare-metric-card"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="autocare-metric-card-top">
                <span className="autocare-metric-label">Total Users</span>
                <div className="autocare-metric-icon-wrap is-blue">
                  <Users size={19} />
                </div>
              </div>
              <div className="autocare-metric-value">
                {isLoading ? (
                  <span style={{ fontSize: '18px', color: '#94a3b8' }}>Loading...</span>
                ) : totalUsersCount !== null ? (
                  totalUsersCount
                ) : (
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#0056A2' }}>View Records</span>
                )}
              </div>
              <p className="autocare-metric-subtext">Registered platform accounts</p>
            </Link>
          </section>

          {/* Section 2: Dedicated Quick Actions */}
          <section aria-label="Administrative Quick Actions" style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
              Administrative Workspaces
            </h2>

            <div className="autocare-admin-quick-actions-grid">
              {/* Action 1: Garage Verification */}
              <div className="autocare-admin-quick-card">
                <div>
                  <div className="autocare-admin-quick-header">
                    <div className="autocare-admin-quick-icon" style={{ backgroundColor: '#eff6ff', color: '#0056A2' }}>
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h3 className="autocare-admin-quick-title">Garage Verification</h3>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#0284c7' }}>
                        Accreditation Review Console
                      </span>
                    </div>
                  </div>
                  <p className="autocare-admin-quick-desc">
                    Review submitted workshop accreditation documents, verify business registration certificates, and approve, reject, or suspend partner workshops.
                  </p>
                </div>
                <div>
                  <Link
                    to="/admin/garages"
                    className="autocare-admin-quick-btn"
                    style={{ background: '#0056A2', color: '#ffffff' }}
                  >
                    <span>Open Garage Verification</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>

              {/* Action 2: User Management */}
              <div className="autocare-admin-quick-card">
                <div>
                  <div className="autocare-admin-quick-header">
                    <div className="autocare-admin-quick-icon" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>
                      <Shield size={24} />
                    </div>
                    <div>
                      <h3 className="autocare-admin-quick-title">User Management</h3>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#6366f1' }}>
                        Platform Accounts & Access
                      </span>
                    </div>
                  </div>
                  <p className="autocare-admin-quick-desc">
                    Search and filter platform users across vehicle owners, garage partners, and administrators. Manage user status, assign roles, and view user analytics.
                  </p>
                </div>
                <div>
                  <Link
                    to="/admin/users"
                    className="autocare-admin-quick-btn"
                    style={{ background: '#4338ca', color: '#ffffff' }}
                  >
                    <span>Open User Management</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Recent Activity (From existing adminService data) */}
          <section aria-label="Recent Platform Records">
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
              Recent Platform Records
            </h2>

            <div className="autocare-admin-activity-grid">
              {/* Left Column: Recent Garage Partner Applications */}
              <div className="autocare-admin-activity-card">
                <div className="autocare-admin-activity-header">
                  <h3 className="autocare-admin-activity-title">
                    <Building2 size={16} color="#0056A2" />
                    <span>Recent Garage Applications</span>
                  </h3>
                  <Link
                    to="/admin/garages"
                    style={{ fontSize: '13px', fontWeight: 600, color: '#0056A2', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>View all</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>

                {recentGarages.length > 0 ? (
                  <div className="autocare-admin-activity-list">
                    {recentGarages.map((garage, idx) => {
                      const id = garage._id || garage.id || '';
                      return (
                        <Link
                          key={id || garage.businessRegNumber || `garage-${idx}`}
                          to={id ? `/admin/garages/${id}` : '/admin/garages'}
                          className="autocare-admin-activity-item"
                        >
                          <div className="autocare-admin-activity-info">
                            <span className="autocare-admin-activity-name">
                              {garage.workshopName || garage.fullName || 'Workshop Partner'}
                            </span>
                            <span className="autocare-admin-activity-sub">
                              {garage.city ? `${garage.city} · ` : ''}
                              {garage.businessRegNumber ? `BRN: ${garage.businessRegNumber}` : garage.email}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <span
                              className={`autocare-status-badge status-${garage.status || 'pending'}`}
                              style={{ textTransform: 'capitalize' }}
                            >
                              {garage.status || 'pending'}
                            </span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {formatDate(garage.createdAt)}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 16px', color: '#64748b', fontSize: '13.5px' }}>
                    <Building2 size={32} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
                    <p style={{ margin: 0 }}>No recent garage applications loaded.</p>
                    <Link to="/admin/garages" style={{ color: '#0056A2', fontWeight: 600, marginTop: '8px', display: 'inline-block' }}>
                      Check Garage Verification
                    </Link>
                  </div>
                )}
              </div>

              {/* Right Column: Recent Registered Users */}
              <div className="autocare-admin-activity-card">
                <div className="autocare-admin-activity-header">
                  <h3 className="autocare-admin-activity-title">
                    <Users size={16} color="#4338ca" />
                    <span>Recent Registered Users</span>
                  </h3>
                  <Link
                    to="/admin/users"
                    style={{ fontSize: '13px', fontWeight: 600, color: '#4338ca', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>View all</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>

                {recentUsers.length > 0 ? (
                  <div className="autocare-admin-activity-list">
                    {recentUsers.map((u, idx) => {
                      const id = u._id || u.id || '';
                      return (
                        <div
                          key={id || u.email || `user-${idx}`}
                          className="autocare-admin-activity-item"
                        >
                          <div className="autocare-admin-activity-info">
                            <span className="autocare-admin-activity-name">
                              {u.fullName || u.displayName || 'System User'}
                            </span>
                            <span className="autocare-admin-activity-sub">
                              {u.email} {u.phone ? `· ${u.phone}` : ''}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                backgroundColor: u.role === 'admin' ? '#e0e7ff' : u.role === 'garage' ? '#fef3c7' : '#eff6ff',
                                color: u.role === 'admin' ? '#4338ca' : u.role === 'garage' ? '#b45309' : '#0056A2',
                              }}
                            >
                              {u.role}
                            </span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {formatDate(u.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 16px', color: '#64748b', fontSize: '13.5px' }}>
                    <Users size={32} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
                    <p style={{ margin: 0 }}>No recent user records loaded.</p>
                    <Link to="/admin/users" style={{ color: '#4338ca', fontWeight: 600, marginTop: '8px', display: 'inline-block' }}>
                      Check User Management
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboardPage;
