import React, { useState } from 'react';
import {
  QrCode,
  Plus,
  Search,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Car,
  X,
} from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import '../../styles/garage-dashboard.css';

interface SharingRecord {
  id: string;
  vehicleReg: string;
  vehicleModel: string;
  recipient: string;
  recipientRole: string;
  scope: string;
  issuedDate: string;
  expiryDate: string;
  status: 'active' | 'revoked' | 'expired' | 'pending';
  accessLogsCount: number;
}

export const GarageSharingPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'REQUESTS'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedShare, setSelectedShare] = useState<SharingRecord | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [shares, setShares] = useState<SharingRecord[]>([
    {
      id: 'SH-8821',
      vehicleReg: 'WP ABC-1234',
      vehicleModel: 'Toyota Aqua (2015)',
      recipient: 'N. Fernando - Ceylinco Insurance',
      recipientRole: 'Insurance Assessor',
      scope: 'Service + Odometer history',
      issuedDate: '20 Sep 2026',
      expiryDate: '30 Sep 2026',
      status: 'active',
      accessLogsCount: 4,
    },
    {
      id: 'SH-7940',
      vehicleReg: 'WP CBD-5521',
      vehicleModel: 'Suzuki Wagon R (2018)',
      recipient: 'Lahiru Perera (Prospective Buyer)',
      recipientRole: 'Buyer Verification',
      scope: 'Full Service Chronology',
      issuedDate: '18 Sep 2026',
      expiryDate: '25 Sep 2026',
      status: 'active',
      accessLogsCount: 2,
    },
    {
      id: 'SH-6112',
      vehicleReg: 'WP CDE-9080',
      vehicleModel: 'Honda Vezel e:HEV (2019)',
      recipient: 'Allianz Insurance Claim Team',
      recipientRole: 'Claim Verification',
      scope: 'Periodic Ledger Inspections',
      issuedDate: '10 Aug 2026',
      expiryDate: '17 Aug 2026',
      status: 'expired',
      accessLogsCount: 6,
    },
    {
      id: 'SH-5401',
      vehicleReg: 'WP CAF-2412',
      vehicleModel: 'Toyota Prius (2020)',
      recipient: 'Unknown External IP / Request',
      recipientRole: 'External Third Party',
      scope: 'Odometer Telemetry Only',
      issuedDate: '01 Aug 2026',
      expiryDate: '08 Aug 2026',
      status: 'revoked',
      accessLogsCount: 1,
    },
    {
      id: 'SH-4920',
      vehicleReg: 'WP CEG-7710',
      vehicleModel: 'Nissan March (2016)',
      recipient: 'Sri Lanka Transport Authority Inspector',
      recipientRole: 'Roadworthiness Audit',
      scope: 'Full Legal Passport & Ledger',
      issuedDate: '25 Sep 2026',
      expiryDate: '02 Oct 2026',
      status: 'pending',
      accessLogsCount: 0,
    },
  ]);

  const [newShareForm, setNewShareForm] = useState({
    vehicleReg: 'WP ABC-1234',
    recipient: '',
    recipientRole: 'Insurance Assessor',
    scope: 'Service + Odometer history',
    validityDays: '7',
  });

  const handleRevoke = (id: string) => {
    setShares((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'revoked' } : s))
    );
    if (selectedShare?.id === id) {
      setSelectedShare((prev) => (prev ? { ...prev, status: 'revoked' } : null));
    }
  };

  const handleCopyLink = (id: string) => {
    navigator.clipboard?.writeText?.(`https://autocare360.lk/verify/share/${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCreateShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShareForm.recipient.trim()) return;

    const newId = `SH-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const expiry = new Date(now.getTime() + parseInt(newShareForm.validityDays) * 24 * 60 * 60 * 1000);

    const record: SharingRecord = {
      id: newId,
      vehicleReg: newShareForm.vehicleReg,
      vehicleModel: 'Toyota Aqua (2015)',
      recipient: newShareForm.recipient.trim(),
      recipientRole: newShareForm.recipientRole,
      scope: newShareForm.scope,
      issuedDate: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      expiryDate: expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'active',
      accessLogsCount: 0,
    };

    setShares([record, ...shares]);
    setShowCreateModal(false);
    setNewShareForm({
      vehicleReg: 'WP ABC-1234',
      recipient: '',
      recipientRole: 'Insurance Assessor',
      scope: 'Service + Odometer history',
      validityDays: '7',
    });
  };

  const filteredShares = shares.filter((s) => {
    if (activeFilter === 'ACTIVE' && s.status !== 'active') return false;
    if (activeFilter === 'REVOKED' && s.status !== 'revoked') return false;
    if (activeFilter === 'EXPIRED' && s.status !== 'expired') return false;
    if (activeFilter === 'REQUESTS' && s.status !== 'pending') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        s.vehicleReg.toLowerCase().includes(q) ||
        s.recipient.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const activeCount = shares.filter((s) => s.status === 'active').length;
  const revokedCount = shares.filter((s) => s.status === 'revoked').length;
  const expiredCount = shares.filter((s) => s.status === 'expired').length;
  const requestsCount = shares.filter((s) => s.status === 'pending').length;

  return (
    <GarageLayout activeItem="Sharing & access" breadcrumbCurrent="Sharing & access activity">
      {/* ====================================================================
          PAGE HEADER
          ==================================================================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800,
              fontSize: '22px',
              lineHeight: '28px',
              color: '#0A1128',
              margin: '0 0 4px 0',
            }}
          >
            Sharing & access activity
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: '13.5px',
              lineHeight: '18px',
              color: '#64748B',
              margin: 0,
            }}
          >
            BR-03 · Manage sharing invitations and revoke active viewer tokens across your customer records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            style={{
              background: '#FFFFFF',
              border: '1.2px solid #E2E8F0',
              borderRadius: '7px',
              padding: '9px 15px',
              color: '#0A1128',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <QrCode size={15} color="#0056A2" />
            <span>Share by QR</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={{
              background: '#0056A2',
              borderRadius: '7px',
              padding: '9px 16px',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '13.5px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0, 86, 162, 0.22)',
            }}
          >
            <Plus size={16} />
            <span>Create new share</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          METRIC CARDS (4 STATS)
          ==================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '22px',
        }}
      >
        {/* Active Shares */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1.2px solid #E2E8F0',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>
            ACTIVE SHARES
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#0A1128', margin: '4px 0 2px 0' }}>
            {activeCount}
          </div>
          <div style={{ fontSize: '12px', color: '#50B748', fontWeight: 500 }}>
            Currently active with full access
          </div>
        </div>

        {/* Revoked Permissions */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1.2px solid #E2E8F0',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>
            REVOKED PERMISSIONS
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#0A1128', margin: '4px 0 2px 0' }}>
            {revokedCount}
          </div>
          <div style={{ fontSize: '12px', color: '#DC2626', fontWeight: 500 }}>
            Tokens manually terminated
          </div>
        </div>

        {/* Expired Access */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1.2px solid #E2E8F0',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>
            EXPIRED ACCESS
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#0A1128', margin: '4px 0 2px 0' }}>
            {expiredCount}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
            Past validity cut-off
          </div>
        </div>

        {/* Access Requests */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1.2px solid #E2E8F0',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>
            ACCESS REQUESTS
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#0A1128', margin: '4px 0 2px 0' }}>
            {requestsCount}
          </div>
          <div style={{ fontSize: '12px', color: '#B45309', fontWeight: 500 }}>
            Awaiting garage approval
          </div>
        </div>
      </div>

      {/* ====================================================================
          FILTERS & SEARCH ROW
          ==================================================================== */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1.2px solid #E2E8F0',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: `All (${shares.length})` },
            { key: 'ACTIVE', label: `Active (${activeCount})` },
            { key: 'REVOKED', label: `Revoked (${revokedCount})` },
            { key: 'EXPIRED', label: `Expired (${expiredCount})` },
            { key: 'REQUESTS', label: `Requests (${requestsCount})` },
          ].map((tab) => {
            const isSel = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key as any)}
                style={{
                  background: isSel ? '#0056A2' : '#F1F5F9',
                  color: isSel ? '#FFFFFF' : '#475569',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '5px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94A3B8',
            }}
          />
          <input
            type="text"
            placeholder="Search records, recipients or token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 12px 7px 34px',
              fontSize: '12.5px',
              border: '1.2px solid #E2E8F0',
              borderRadius: '7px',
              outline: 'none',
              background: '#F8FAFC',
            }}
          />
        </div>
      </div>

      {/* ====================================================================
          MAIN SPLIT VIEW (TABLE + SIDEBAR)
          ==================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* Table Card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1.2px solid #E2E8F0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0A1128', margin: 0 }}>
                Sharing records
              </h2>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Manage access across customer vehicles
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#0056A2', fontWeight: 600 }}>
              {filteredShares.length} records matching
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1.2px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>
                    TARGET VEHICLE
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>
                    RECIPIENT / ORGANISATION
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>
                    ACCESS SCOPE
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>
                    ISSUED / EXPIRY
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>
                    STATUS
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em', textAlign: 'right' }}>
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredShares.map((s) => {
                  const isSelected = selectedShare?.id === s.id;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedShare(s)}
                      style={{
                        borderBottom: '1px solid #E2E8F0',
                        background: isSelected ? '#EFF6FF' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Car size={15} color="#0056A2" />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: '#0A1128' }}>
                              {s.vehicleReg}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                              {s.vehicleModel}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0A1128' }}>
                          {s.recipient}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                          {s.recipientRole}
                        </div>
                      </td>

                      <td style={{ padding: '13px 16px', fontSize: '12px', color: '#334155' }}>
                        {s.scope}
                      </td>

                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontSize: '12px', color: '#0A1128', fontWeight: 600 }}>
                          {s.issuedDate}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          Exp: {s.expiryDate}
                        </div>
                      </td>

                      <td style={{ padding: '13px 16px' }}>
                        <span
                          style={{
                            padding: '3px 9px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background:
                              s.status === 'active'
                                ? '#ECFDF5'
                                : s.status === 'revoked'
                                ? '#FEF2F2'
                                : s.status === 'pending'
                                ? '#EFF6FF'
                                : '#F1F5F9',
                            color:
                              s.status === 'active'
                                ? '#059669'
                                : s.status === 'revoked'
                                ? '#DC2626'
                                : s.status === 'pending'
                                ? '#0056A2'
                                : '#64748B',
                          }}
                        >
                          {s.status === 'active' && <CheckCircle2 size={11} />}
                          {s.status === 'revoked' && <XCircle size={11} />}
                          {s.status === 'expired' && <Clock size={11} />}
                          {s.status === 'pending' && <AlertTriangle size={11} />}
                          {s.status.toUpperCase()}
                        </span>
                      </td>

                      <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(s.id)}
                            title="Copy link"
                            style={{
                              background: '#F1F5F9',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '5px 8px',
                              color: '#334155',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Copy size={12} />
                            {copiedId === s.id ? 'Copied!' : 'Link'}
                          </button>
                          {s.status === 'active' && (
                            <button
                              type="button"
                              onClick={() => handleRevoke(s.id)}
                              style={{
                                background: '#FEF2F2',
                                border: '1px solid #FCA5A5',
                                borderRadius: '6px',
                                padding: '5px 8px',
                                color: '#DC2626',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Info Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Active Record Card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1.2px solid #E2E8F0',
              padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em', marginBottom: '8px' }}>
              CURRENT FOCUS
            </div>
            {selectedShare ? (
              <div>
                <div style={{ fontWeight: 800, fontSize: '15px', color: '#0A1128' }}>
                  {selectedShare.recipient}
                </div>
                <div style={{ fontSize: '12.5px', color: '#0056A2', fontWeight: 600, marginTop: '2px' }}>
                  {selectedShare.vehicleReg} · {selectedShare.vehicleModel}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
                  Token ID: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedShare.id}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Scope: {selectedShare.scope}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Expires: {selectedShare.expiryDate}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(selectedShare.id)}
                    style={{
                      flex: 1,
                      background: '#0056A2',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {copiedId === selectedShare.id ? 'Copied' : 'Copy Access Link'}
                  </button>
                  {selectedShare.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(selectedShare.id)}
                      style={{
                        background: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FCA5A5',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#64748B', padding: '12px 0' }}>
                Select any record in the table to view sharing credentials, verify tokens or revoke immediately.
              </div>
            )}
          </div>

          {/* Access Protections Box */}
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: '12px',
              border: '1.2px solid #E2E8F0',
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <ShieldCheck size={18} color="#0056A2" />
              <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0A1128' }}>
                Access protections
              </div>
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#475569', lineHeight: '20px' }}>
              <li>Single-use dynamic cryptographic tokens</li>
              <li>Hardware footprint & IP verification logging</li>
              <li>Time-limited ledger access windows</li>
              <li>Instant remote revocation with zero cached access</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ====================================================================
          CREATE NEW SHARE MODAL
          ==================================================================== */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 17, 40, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontWeight: 800, fontSize: '17px', color: '#0A1128' }}>
                Create Sharing Invitation
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateShare}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  TARGET VEHICLE
                </label>
                <select
                  value={newShareForm.vehicleReg}
                  onChange={(e) => setNewShareForm({ ...newShareForm, vehicleReg: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    borderRadius: '7px',
                    border: '1.2px solid #CBD5E1',
                    outline: 'none',
                    background: '#FFFFFF',
                  }}
                >
                  <option value="WP ABC-1234">WP ABC-1234 — Toyota Aqua (2015)</option>
                  <option value="WP CBD-5521">WP CBD-5521 — Suzuki Wagon R (2018)</option>
                  <option value="WP CDE-9080">WP CDE-9080 — Honda Vezel e:HEV</option>
                  <option value="WP CAB-7890">WP CAB-7890 — Toyota Prius Prime</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  RECIPIENT NAME / ORGANISATION
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ceylinco Insurance / Suneth Silva"
                  value={newShareForm.recipient}
                  onChange={(e) => setNewShareForm({ ...newShareForm, recipient: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    borderRadius: '7px',
                    border: '1.2px solid #CBD5E1',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  ACCESS SCOPE
                </label>
                <select
                  value={newShareForm.scope}
                  onChange={(e) => setNewShareForm({ ...newShareForm, scope: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    borderRadius: '7px',
                    border: '1.2px solid #CBD5E1',
                    outline: 'none',
                    background: '#FFFFFF',
                  }}
                >
                  <option value="Service + Odometer history">Service + Odometer history</option>
                  <option value="Full Service Chronology">Full Service Chronology</option>
                  <option value="Complete Vehicle Ledger">Complete Vehicle Ledger</option>
                  <option value="Odometer & Diagnostic Telemetry">Odometer & Diagnostic Telemetry</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  EXPIRY WINDOW
                </label>
                <select
                  value={newShareForm.validityDays}
                  onChange={(e) => setNewShareForm({ ...newShareForm, validityDays: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    borderRadius: '7px',
                    border: '1.2px solid #CBD5E1',
                    outline: 'none',
                    background: '#FFFFFF',
                  }}
                >
                  <option value="3">3 Days</option>
                  <option value="7">7 Days (Recommended)</option>
                  <option value="14">14 Days</option>
                  <option value="30">30 Days</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    background: '#F1F5F9',
                    border: 'none',
                    borderRadius: '7px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#0056A2',
                    border: 'none',
                    borderRadius: '7px',
                    padding: '8px 18px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  Generate Share Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          QR CODE MODAL
          ==================================================================== */}
      {showQrModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 17, 40, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowQrModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '380px',
              padding: '28px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                width: '160px',
                height: '160px',
                margin: '8px auto 16px auto',
                background: '#F8FAFC',
                border: '2px solid #E2E8F0',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QrCode size={120} color="#0056A2" />
            </div>

            <div style={{ fontWeight: 800, fontSize: '16px', color: '#0A1128', marginBottom: '4px' }}>
              Instant Mobile Verification
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748B', margin: '0 0 16px 0', lineHeight: '18px' }}>
              Scan with any mobile camera to securely access verified vehicle passport logs via temporary session token.
            </p>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              style={{
                background: '#0056A2',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '7px',
                padding: '9px 20px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </GarageLayout>
  );
};

export default GarageSharingPage;
