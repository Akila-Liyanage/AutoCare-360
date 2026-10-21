import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  LogOut,
  RefreshCw,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import adminService, { type AdminGarageItem } from '../../services/adminService';
import logoImg from '../../assets/auth/download (27) (1) 2.png';
import '../../styles/garage-dashboard.css';

export const AdminGarageVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [garages, setGarages] = useState<AdminGarageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'pending' | 'active' | 'suspended'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadGarages = () => {
    setLoading(true);
    setError(null);
    adminService
      .getGarages()
      .then((data) => {
        setGarages(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load garage partners.';
        setError(msg);
        setLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    adminService
      .getGarages()
      .then((data) => {
        if (isMounted) {
          setGarages(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to load garage partners.';
          setError(msg);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Counts
  const counts = useMemo(() => {
    return {
      all: garages.length,
      pending: garages.filter((g) => g.status === 'pending').length,
      active: garages.filter((g) => g.status === 'active').length,
      suspended: garages.filter((g) => g.status === 'suspended').length,
    };
  }, [garages]);

  // Filtered rows
  const filteredGarages = useMemo(() => {
    return garages.filter((g) => {
      // Tab filter
      if (activeTab !== 'ALL' && g.status !== activeTab) {
        return false;
      }

      // Search query
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      return (
        g.workshopName.toLowerCase().includes(q) ||
        g.fullName.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.phone.toLowerCase().includes(q) ||
        g.businessRegNumber.toLowerCase().includes(q) ||
        g.city.toLowerCase().includes(q)
      );
    });
  }, [garages, activeTab, searchQuery]);

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
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.02em' }}>
                AutoCare 360
              </span>
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
                Admin Verification Portal
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
              Official Garage Partner Accreditation &amp; Access Control
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#131e33',
              padding: '6px 14px',
              borderRadius: '24px',
              border: '1px solid #1e293b',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '12px',
                color: '#ffffff',
              }}
            >
              {user?.fullName?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div style={{ fontSize: '13px' }}>
              <span style={{ fontWeight: 600, color: '#f8fafc', display: 'block', lineHeight: 1.2 }}>
                {user?.fullName || 'Administrator'}
              </span>
              <span style={{ fontSize: '11px', color: '#38bdf8' }}>Role: Admin</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: '1px solid #334155',
              color: '#cbd5e1',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1e293b';
              e.currentTarget.style.borderColor = '#475569';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = '#334155';
            }}
          >
            <LogOut size={15} />
            <span>Log Out</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main style={{ flex: 1, padding: '28px', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {/* Title and stats bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>
              Garage Partner Verification Queue
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
              Review business registration documentation and grant authorization to publish verified maintenance records.
            </p>
          </div>

          <button
            type="button"
            onClick={loadGarages}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#131e33',
              border: '1px solid #1e293b',
              color: '#38bdf8',
              padding: '9px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh List</span>
          </button>
        </div>

        {/* Error notice */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
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

        {/* Filter Controls: Tabs + Search Bar */}
        <div
          style={{
            background: '#0d1524',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                color: activeTab === 'pending' ? '#fbbf24' : '#94a3b8',
                border: activeTab === 'pending' ? '1px solid #f59e0b' : '1px solid transparent',
              }}
            >
              <Clock size={15} />
              <span>Pending Verification</span>
              <span
                style={{
                  background: activeTab === 'pending' ? '#f59e0b' : '#1e293b',
                  color: activeTab === 'pending' ? '#0f172a' : '#cbd5e1',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 800,
                }}
              >
                {counts.pending}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('active')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: activeTab === 'active' ? '#34d399' : '#94a3b8',
                border: activeTab === 'active' ? '1px solid #10b981' : '1px solid transparent',
              }}
            >
              <CheckCircle2 size={15} />
              <span>Active Garages</span>
              <span
                style={{
                  background: activeTab === 'active' ? '#10b981' : '#1e293b',
                  color: activeTab === 'active' ? '#0f172a' : '#cbd5e1',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 800,
                }}
              >
                {counts.active}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('suspended')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === 'suspended' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                color: activeTab === 'suspended' ? '#f87171' : '#94a3b8',
                border: activeTab === 'suspended' ? '1px solid #ef4444' : '1px solid transparent',
              }}
            >
              <XCircle size={15} />
              <span>Suspended / Rejected</span>
              <span
                style={{
                  background: activeTab === 'suspended' ? '#ef4444' : '#1e293b',
                  color: activeTab === 'suspended' ? '#0f172a' : '#cbd5e1',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 800,
                }}
              >
                {counts.suspended}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === 'ALL' ? '#1e293b' : 'transparent',
                color: activeTab === 'ALL' ? '#ffffff' : '#94a3b8',
                border: activeTab === 'ALL' ? '1px solid #334155' : '1px solid transparent',
              }}
            >
              <span>All ({counts.all})</span>
            </button>
          </div>

          {/* Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#131e33',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '6px 14px',
              minWidth: '280px',
              maxWidth: '420px',
              flex: 1,
            }}
          >
            <Search size={16} style={{ color: '#64748b' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search garage, BRN, contact, city..."
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '13.5px',
                outline: 'none',
                width: '100%',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Garages Table */}
        <section
          style={{
            background: '#0d1524',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <div className="autocare-garage-table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
              <thead>
                <tr style={{ background: '#131e33', borderBottom: '1px solid #1e293b' }}>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>
                    WORKSHOP / BUSINESS NAME
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>
                    CONTACT / OWNER
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>
                    BUSINESS REG (BRN)
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>
                    CITY / REGION
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>
                    REGISTERED ON
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>
                    STATUS
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textAlign: 'right' }}>
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          border: '3px solid #1e293b',
                          borderTopColor: '#38bdf8',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                          margin: '0 auto 12px auto',
                        }}
                      />
                      <span>Loading garage partners from registry...</span>
                    </td>
                  </tr>
                ) : filteredGarages.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '56px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <Building2 size={40} style={{ color: '#334155', margin: '0 auto 12px auto' }} />
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#f1f5f9' }}>
                        No garage partner records found
                      </h3>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        {searchQuery
                          ? 'No garages matched your current filter criteria.'
                          : `There are currently no ${activeTab} garage accounts in the verification queue.`}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredGarages.map((garage) => {
                    const statusColor =
                      garage.status === 'active'
                        ? { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' }
                        : garage.status === 'suspended'
                        ? { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' }
                        : { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };

                    const dateFormatted = new Date(garage.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });

                    return (
                      <tr
                        key={garage.id || garage._id}
                        style={{
                          borderBottom: '1px solid #131e33',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#111a2d')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: 'rgba(56, 189, 248, 0.1)',
                                border: '1px solid rgba(56, 189, 248, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#38bdf8',
                              }}
                            >
                              <Building2 size={18} />
                            </div>
                            <div>
                              <strong style={{ fontSize: '14px', color: '#ffffff', display: 'block' }}>
                                {garage.workshopName}
                              </strong>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>
                                ID: {garage.id || garage._id}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ fontSize: '13.5px', color: '#f1f5f9', fontWeight: 600 }}>
                            {garage.fullName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                            {garage.email}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {garage.phone}
                          </div>
                        </td>

                        <td style={{ padding: '16px 18px', fontSize: '13px' }}>
                          {garage.businessRegNumber ? (
                            <code
                              style={{
                                background: '#131e33',
                                border: '1px solid #1e293b',
                                color: '#38bdf8',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 700,
                              }}
                            >
                              {garage.businessRegNumber}
                            </code>
                          ) : (
                            <span style={{ color: '#64748b', fontStyle: 'italic' }}>Pending submission</span>
                          )}
                        </td>

                        <td style={{ padding: '16px 18px', fontSize: '13px', color: '#cbd5e1' }}>
                          {garage.city || <span style={{ color: '#64748b' }}>Not specified</span>}
                        </td>

                        <td style={{ padding: '16px 18px', fontSize: '13px', color: '#94a3b8' }}>
                          {dateFormatted}
                        </td>

                        <td style={{ padding: '16px 18px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background: statusColor.bg,
                              color: statusColor.text,
                              border: `1px solid ${statusColor.border}`,
                            }}
                          >
                            {garage.status === 'active' && <ShieldCheck size={12} />}
                            {garage.status === 'pending' && <Clock size={12} />}
                            {garage.status === 'suspended' && <XCircle size={12} />}
                            <span>{garage.status}</span>
                          </span>
                        </td>

                        <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/garages/${garage.id || garage._id}`)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: '#0284c7',
                              border: 'none',
                              color: '#ffffff',
                              padding: '7px 14px',
                              borderRadius: '6px',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'background 0.2s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#0369a1')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#0284c7')}
                          >
                            <span>Review Details</span>
                            <ExternalLink size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminGarageVerificationPage;
