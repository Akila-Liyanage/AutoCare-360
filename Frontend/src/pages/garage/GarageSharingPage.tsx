import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  X,
  Share2,
  KeyRound,
  ExternalLink,
  Plus,
  Search,
} from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import { MOCK_GARAGE_VEHICLES } from './garageData';
import '../../styles/garage-dashboard.css';

export interface GarageAccessGrant {
  id: string;
  vehicleId: string;
  vehicleRef: string;
  customerName: string;
  customerPhone: string;
  grantType: 'Full Digital Passport' | 'Service Records Only' | 'Inspection Diagnostic Pass' | 'Emergency Read-Only';
  permissionLevel: 'Read & Publish Records' | 'Read Only' | 'Diagnostic Telemetry Sync';
  grantedDate: string;
  expiryDate: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'PENDING SIGNATURE';
}

const INITIAL_GRANTS: GarageAccessGrant[] = [
  {
    id: 'grant-01',
    vehicleId: 'veh-1',
    vehicleRef: 'WP ABC-1234',
    customerName: 'Nimal Perera',
    customerPhone: '+94 77 123 4567',
    grantType: 'Full Digital Passport',
    permissionLevel: 'Read & Publish Records',
    grantedDate: '01 Sep 2026',
    expiryDate: '31 Dec 2026',
    status: 'ACTIVE',
  },
  {
    id: 'grant-02',
    vehicleId: 'veh-2',
    vehicleRef: 'WP CAS-9988',
    customerName: 'Anura Fernando',
    customerPhone: '+94 71 987 6543',
    grantType: 'Service Records Only',
    permissionLevel: 'Read & Publish Records',
    grantedDate: '15 Sep 2026',
    expiryDate: '15 Oct 2026',
    status: 'ACTIVE',
  },
  {
    id: 'grant-03',
    vehicleId: 'veh-3',
    vehicleRef: 'WP CAD-1212',
    customerName: 'Kasun Bandara',
    customerPhone: '+94 76 555 1234',
    grantType: 'Inspection Diagnostic Pass',
    permissionLevel: 'Diagnostic Telemetry Sync',
    grantedDate: '20 Sep 2026',
    expiryDate: '27 Sep 2026',
    status: 'PENDING SIGNATURE',
  },
  {
    id: 'grant-04',
    vehicleId: 'veh-1',
    vehicleRef: 'WP ABC-1234',
    customerName: 'Nimal Perera',
    customerPhone: '+94 77 123 4567',
    grantType: 'Emergency Read-Only',
    permissionLevel: 'Read Only',
    grantedDate: '10 Jun 2026',
    expiryDate: '17 Jun 2026',
    status: 'EXPIRED',
  },
  {
    id: 'grant-05',
    vehicleId: 'veh-2',
    vehicleRef: 'WP CAS-9988',
    customerName: 'Anura Fernando',
    customerPhone: '+94 71 987 6543',
    grantType: 'Full Digital Passport',
    permissionLevel: 'Read & Publish Records',
    grantedDate: '01 Jan 2026',
    expiryDate: '01 Jul 2026',
    status: 'REVOKED',
  },
];

interface ToastState {
  show: boolean;
  message: string;
}

export const GarageSharingPage: React.FC = () => {
  const navigate = useNavigate();

  const [grants, setGrants] = useState<GarageAccessGrant[]>(INITIAL_GRANTS);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Grant Modal State
  const [showGrantModal, setShowGrantModal] = useState<boolean>(false);
  const [modalVehicleId, setModalVehicleId] = useState<string>(MOCK_GARAGE_VEHICLES[0].id);
  const [modalGrantType, setModalGrantType] = useState<GarageAccessGrant['grantType']>('Full Digital Passport');
  const [modalValidityDays, setModalValidityDays] = useState<number>(30);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  // Revoke grant (frontend simulated)
  const handleRevoke = (id: string, ref: string) => {
    setGrants((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status: 'REVOKED' } : g))
    );
    showToast(`Access grant for ${ref} has been revoked.`);
  };

  // Extend grant (frontend simulated)
  const handleExtend = (id: string, ref: string) => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    const newExpiry = d.toISOString().split('T')[0];
    setGrants((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, expiryDate: newExpiry, status: 'ACTIVE' } : g
      )
    );
    showToast(`Access grant for ${ref} extended until ${newExpiry}.`);
  };

  // Handle create new grant
  const handleCreateGrant = (e: React.FormEvent) => {
    e.preventDefault();
    const v = MOCK_GARAGE_VEHICLES.find((veh) => veh.id === modalVehicleId) || MOCK_GARAGE_VEHICLES[0];
    const d = new Date();
    d.setDate(d.getDate() + modalValidityDays);

    const newGrant: GarageAccessGrant = {
      id: `grant-${Date.now()}`,
      vehicleId: v.id,
      vehicleRef: v.registration,
      customerName: v.customer.name,
      customerPhone: v.customer.phone,
      grantType: modalGrantType,
      permissionLevel:
        modalGrantType === 'Emergency Read-Only'
          ? 'Read Only'
          : modalGrantType === 'Inspection Diagnostic Pass'
          ? 'Diagnostic Telemetry Sync'
          : 'Read & Publish Records',
      grantedDate: new Date().toISOString().split('T')[0],
      expiryDate: d.toISOString().split('T')[0],
      status: 'ACTIVE',
    };

    setGrants((prev) => [newGrant, ...prev]);
    setShowGrantModal(false);
    showToast(`Access permission granted for ${v.registration} (${modalGrantType}).`);
  };

  // Filtered grants
  const filteredGrants = useMemo(() => {
    return grants.filter((g) => {
      if (statusFilter !== 'ALL' && g.status !== statusFilter) return false;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        g.vehicleRef.toLowerCase().includes(q) ||
        g.customerName.toLowerCase().includes(q) ||
        g.grantType.toLowerCase().includes(q)
      );
    });
  }, [grants, statusFilter, searchQuery]);

  const getStatusBadge = (status: GarageAccessGrant['status']) => {
    switch (status) {
      case 'ACTIVE':
        return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
      case 'PENDING SIGNATURE':
        return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
      case 'EXPIRED':
        return { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' };
      case 'REVOKED':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
    }
  };

  return (
    <GarageLayout activeItem="Sharing & access" breadcrumbCurrent="Sharing & Access">
      {/* Title & Action Row */}
      <div className="autocare-garage-title-row">
        <div>
          <h1 className="autocare-garage-main-title">Client Access &amp; Permission Delegation</h1>
          <p className="autocare-garage-main-subtitle">
            Manage owner-delegated digital passport credentials, temporary diagnostic keys, and inspection passes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="autocare-garage-hero-btn"
            style={{ background: '#f8fafc', color: '#003874', border: '1px solid #cbd5e1' }}
            onClick={() => showToast('Station inspection QR scanner opened.')}
          >
            <QrCode size={16} />
            <span>Scan Client QR</span>
          </button>

          <button
            type="button"
            className="autocare-garage-btn-primary"
            onClick={() => setShowGrantModal(true)}
          >
            <Plus size={16} />
            <span>Request Vehicle Access</span>
          </button>
        </div>
      </div>

      {/* Top Cards: Station Inspection Key & Active Grants Overview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        {/* Card 1: Garage Inspection Terminal Key */}
        <div className="autocare-garage-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <KeyRound size={22} style={{ color: '#0056a2' }} />
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
              Station Inspection Key
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px 0', lineHeight: 1.5 }}>
            Your station terminal is authorized under BR-03 to publish certified records and decrypt owner-shared inspection packets.
          </p>
          <div
            style={{
              background: '#f8fafc',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontFamily: 'monospace',
              fontSize: '11.5px',
              color: '#0f172a',
              wordBreak: 'break-all',
              marginBottom: '14px',
            }}
          >
            PUBKEY: 0x9f4a88bc39d84920aa029148572e01b2a94f81c2
          </div>
          <button
            type="button"
            className="autocare-garage-hero-btn"
            style={{ background: '#f1f5f9', color: '#0f172a', fontSize: '12.5px' }}
            onClick={() => showToast('Station terminal public key copied to clipboard.')}
          >
            Copy Terminal Public Key
          </button>
        </div>

        {/* Card 2: Cryptographic Access Security */}
        <div className="autocare-garage-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <ShieldCheck size={22} style={{ color: '#16a34a' }} />
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
              Access Policy &amp; Data Protection
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px 0', lineHeight: 1.5 }}>
            Every permission grant is end-to-end encrypted. Vehicle owners may revoke service delegation at any moment via their mobile app.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', color: '#475569' }}>
            <div>• Read/Write permissions expire automatically on due date</div>
            <div>• All record modifications are logged to immutable audit ledger</div>
            <div>• Real-time SMS push on every diagnostic lookup</div>
          </div>
        </div>
      </div>

      {/* Access Grants Ledger Panel */}
      <section className="autocare-garage-records-panel" aria-label="Access Grants Ledger">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <h2 className="autocare-garage-records-title" style={{ margin: 0 }}>
            Delegated Client Access Permissions
          </h2>

          {/* Search & Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '6px 10px',
              }}
            >
              <Search size={14} style={{ color: '#64748b' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search grants..."
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12.5px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              {['ALL', 'ACTIVE', 'PENDING SIGNATURE', 'EXPIRED', 'REVOKED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    background: statusFilter === st ? '#003874' : '#f1f5f9',
                    color: statusFilter === st ? '#ffffff' : '#475569',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: statusFilter === st ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table of grants */}
        <div className="autocare-garage-table-responsive">
          <table className="autocare-garage-records-table">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  VEHICLE
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  CLIENT / OWNER
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  GRANT TYPE
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  PERMISSION SCOPE
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  EXPIRY
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  STATUS
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', color: '#64748b' }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGrants.map((grant) => {
                const st = getStatusBadge(grant.status);
                return (
                  <tr key={grant.id}>
                    <td style={{ padding: '12px' }}>
                      <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{grant.vehicleRef}</strong>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                        {grant.customerName}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>{grant.customerPhone}</div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '12.5px', fontWeight: 600, color: '#0056a2' }}>
                      {grant.grantType}
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#475569' }}>
                      {grant.permissionLevel}
                    </td>
                    <td style={{ padding: '12px', fontSize: '12.5px', color: '#0f172a' }}>
                      {grant.expiryDate}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: st.bg,
                          color: st.color,
                          border: `1px solid ${st.border}`,
                        }}
                      >
                        {grant.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {grant.status === 'ACTIVE' && (
                        <>
                          <button
                            type="button"
                            className="autocare-garage-action-link"
                            onClick={() => handleExtend(grant.id, grant.vehicleRef)}
                            style={{ fontSize: '12px' }}
                          >
                            Extend (+30d)
                          </button>
                          <span className="autocare-garage-action-separator">·</span>
                          <button
                            type="button"
                            onClick={() => handleRevoke(grant.id, grant.vehicleRef)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#ef4444',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            Revoke
                          </button>
                        </>
                      )}

                      {grant.status !== 'ACTIVE' && (
                        <button
                          type="button"
                          className="autocare-garage-action-link"
                          onClick={() => handleExtend(grant.id, grant.vehicleRef)}
                          style={{ fontSize: '12px' }}
                        >
                          Re-activate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Access Shortcuts Panel */}
      <section className="autocare-garage-records-panel" style={{ marginTop: '20px' }}>
        <h2 className="autocare-garage-records-title">Portal Shortcuts</h2>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="autocare-garage-hero-btn"
            style={{ background: '#f8fafc', color: '#003874', border: '1px solid #cbd5e1' }}
            onClick={() => navigate('/sharing/qr')}
          >
            <Share2 size={15} style={{ marginRight: '6px' }} />
            <span>Open Global QR Sharing Portal</span>
          </button>
          <button
            type="button"
            className="autocare-garage-hero-btn"
            style={{ background: '#f8fafc', color: '#003874', border: '1px solid #cbd5e1' }}
            onClick={() => navigate('/buyer-qr')}
          >
            <ExternalLink size={15} style={{ marginRight: '6px' }} />
            <span>Buyer Public Record Viewer</span>
          </button>
        </div>
      </section>

      {/* Grant Temporary Access Modal */}
      {showGrantModal && (
        <div
          className="autocare-garage-modal-backdrop"
          onClick={() => setShowGrantModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="autocare-garage-modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="autocare-garage-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} style={{ color: '#0056a2' }} />
                <h3>Request Client Access Permission</h3>
              </div>
              <button
                type="button"
                className="autocare-garage-modal-close-btn"
                onClick={() => setShowGrantModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGrant}>
              <div className="autocare-garage-modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Client Vehicle *
                    </label>
                    <select
                      value={modalVehicleId}
                      onChange={(e) => setModalVehicleId(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                      required
                    >
                      {MOCK_GARAGE_VEHICLES.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.registration} — {v.make} {v.model} ({v.customer.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Grant Type &amp; Permission Scope *
                    </label>
                    <select
                      value={modalGrantType}
                      onChange={(e) => setModalGrantType(e.target.value as GarageAccessGrant['grantType'])}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                      required
                    >
                      <option value="Full Digital Passport">Full Digital Passport (Read &amp; Publish)</option>
                      <option value="Service Records Only">Service Records Only</option>
                      <option value="Inspection Diagnostic Pass">Inspection Diagnostic Pass</option>
                      <option value="Emergency Read-Only">Emergency Read-Only</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Validity Duration (Days) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={modalValidityDays}
                      onChange={(e) => setModalValidityDays(parseInt(e.target.value, 10) || 1)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="autocare-garage-modal-footer">
                <button
                  type="button"
                  className="autocare-garage-hero-btn"
                  style={{ background: '#f1f5f9', color: '#475569', marginRight: '8px' }}
                  onClick={() => setShowGrantModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="autocare-garage-btn-primary">
                  Dispatch Access Request OTP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Toast Notification */}
      {toast.show && (
        <div className="autocare-garage-toast" role="alert">
          <CheckCircle2 size={18} style={{ color: '#00B4EB', flexShrink: 0 }} />
          <span>{toast.message}</span>
        </div>
      )}
    </GarageLayout>
  );
};

export default GarageSharingPage;
