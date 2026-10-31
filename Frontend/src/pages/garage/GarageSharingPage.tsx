import React, { useState } from 'react';
import {
  Share2,
  Plus,
  Search,
  CheckCircle2,
  X,
  Copy,
  Ban,
  Clock,
  Code2,
  Lock,
  Eye
} from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import '../../styles/garage-audit.css';

interface ToastState {
  show: boolean;
  message: string;
}

interface SharingRecord {
  id: string;
  token: string;
  recipientName: string;
  recipientOrg: string;
  purpose: string;
  vehicleRef: string;
  vehicleTitle: string;
  permissionsLevel: 'Full access' | 'Limited view' | 'Selected specs';
  expiryDate: string;
  viewsUsed: number;
  maxViews: number;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  allowedChronology: boolean;
  allowedRepairs: boolean;
  allowedInvoices: boolean;
  allowedFinancials: boolean;
}

const MOCK_SHARING_RECORDS: SharingRecord[] = [
  {
    id: 'shr-1',
    token: 'tok_ceylinco_claims_9482',
    recipientName: 'H. Fernando',
    recipientOrg: 'Ceylinco Insurance',
    purpose: 'Claims assessment',
    vehicleRef: 'WP CAR-1010',
    vehicleTitle: 'Tesla Model S Plaid',
    permissionsLevel: 'Full access',
    expiryDate: '20 Sep 2026 • 18:00',
    viewsUsed: 2,
    maxViews: 3,
    status: 'ACTIVE',
    allowedChronology: true,
    allowedRepairs: true,
    allowedInvoices: true,
    allowedFinancials: false,
  },
  {
    id: 'shr-2',
    token: 'tok_central_motors_insp',
    recipientName: 'Central Motors Inspection',
    recipientOrg: 'Central Motors Network',
    purpose: 'Pre-purchase check',
    vehicleRef: 'WP CAB-8899',
    vehicleTitle: 'Toyota Prius Hybrid',
    permissionsLevel: 'Limited view',
    expiryDate: '24 Sep 2026 • 12:00',
    viewsUsed: 1,
    maxViews: 5,
    status: 'ACTIVE',
    allowedChronology: true,
    allowedRepairs: true,
    allowedInvoices: false,
    allowedFinancials: false,
  },
  {
    id: 'shr-3',
    token: 'tok_buyer_jayawardena',
    recipientName: 'K. Jayawardena',
    recipientOrg: 'Prospective Buyer',
    purpose: 'Evaluation view',
    vehicleRef: 'WP CAB-8899',
    vehicleTitle: 'Toyota Prius Hybrid',
    permissionsLevel: 'Limited view',
    expiryDate: '12 Sep 2026 • 18:00',
    viewsUsed: 3,
    maxViews: 3,
    status: 'EXPIRED',
    allowedChronology: true,
    allowedRepairs: false,
    allowedInvoices: false,
    allowedFinancials: false,
  },
  {
    id: 'shr-4',
    token: 'tok_fleet_assist_telemetry',
    recipientName: 'Global Fleet Assist',
    recipientOrg: 'Commercial API Node',
    purpose: 'Fleet telemetry sync',
    vehicleRef: 'WP CAS-9988',
    vehicleTitle: 'Nissan Leaf EV',
    permissionsLevel: 'Full access',
    expiryDate: '01 Sep 2026',
    viewsUsed: 1,
    maxViews: 1,
    status: 'REVOKED',
    allowedChronology: true,
    allowedRepairs: true,
    allowedInvoices: true,
    allowedFinancials: true,
  },
  {
    id: 'shr-5',
    token: 'tok_sl_leasing_portal',
    recipientName: 'People\'s Leasing Co.',
    recipientOrg: 'Financial Operations',
    purpose: 'Asset collateral check',
    vehicleRef: 'WP CAD-1212',
    vehicleTitle: 'Honda Vezel Hybrid',
    permissionsLevel: 'Selected specs',
    expiryDate: '28 Aug 2026',
    viewsUsed: 0,
    maxViews: 2,
    status: 'REVOKED',
    allowedChronology: true,
    allowedRepairs: false,
    allowedInvoices: false,
    allowedFinancials: false,
  },
  {
    id: 'shr-6',
    token: 'tok_tor_suspicious_query',
    recipientName: 'Unauthorized External',
    recipientOrg: 'Scraper / Proxy',
    purpose: 'Untrusted probe',
    vehicleRef: 'WP CAR-1010',
    vehicleTitle: 'Tesla Model S Plaid',
    permissionsLevel: 'Limited view',
    expiryDate: '08 Sep 2026',
    viewsUsed: 0,
    maxViews: 1,
    status: 'REVOKED',
    allowedChronology: false,
    allowedRepairs: false,
    allowedInvoices: false,
    allowedFinancials: false,
  },
];

export const GarageSharingPage: React.FC = () => {
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [records, setRecords] = useState<SharingRecord[]>(MOCK_SHARING_RECORDS);
  const [selectedRecord, setSelectedRecord] = useState<SharingRecord>(MOCK_SHARING_RECORDS[0]);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleCopyLink = (record: SharingRecord) => {
    const url = `${window.location.origin}/shared/vehicle/${record.token}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    showToast(`Access link for ${record.recipientName} copied: ${url}`);
  };

  const handleRevoke = (record: SharingRecord) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === record.id ? { ...r, status: 'REVOKED' } : r))
    );
    if (selectedRecord.id === record.id) {
      setSelectedRecord((prev) => ({ ...prev, status: 'REVOKED' }));
    }
    showToast(`Access token for ${record.recipientName} has been revoked.`);
  };

  const filteredRecords = records.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.recipientName.toLowerCase().includes(q) ||
      r.recipientOrg.toLowerCase().includes(q) ||
      r.vehicleRef.toLowerCase().includes(q) ||
      r.token.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'ALL' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <GarageLayout activeItem="Sharing & access" breadcrumbCurrent="Sharing & Access">
      {/* Toast Notification */}
      {toast.show && (
        <div className="autocare-garage-toast" role="alert">
          <CheckCircle2 size={18} style={{ color: '#00B4EB', flexShrink: 0 }} />
          <span>{toast.message}</span>
          <button
            type="button"
            className="autocare-garage-toast-close"
            onClick={() => setToast({ show: false, message: '' })}
            aria-label="Dismiss toast"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Title Row */}
      <div className="autocare-garage-title-row">
        <div>
          <span className="autocare-audit-badge">BR-05 / BR-06 / BR-07</span>
          <h1 className="autocare-garage-main-title">Sharing &amp; access activity</h1>
          <p className="autocare-garage-main-subtitle">
            BR-05 - Manage actively shared links, QR tokens, security controls and view real-time recipient activity.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="autocare-garage-btn-secondary"
            onClick={() => showToast('Sharing API documentation & mTLS endpoints opened.')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#1e293b',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Code2 size={15} />
            <span>Sharing API</span>
          </button>

          <button
            type="button"
            className="autocare-garage-btn-primary"
            onClick={() => showToast('Create Access Link modal initialized.')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '8px',
              background: '#0056A2',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            <span>Create access link</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="autocare-audit-kpi-grid">
        <div className="autocare-audit-kpi-card">
          <div className="autocare-audit-kpi-head">
            <span className="autocare-audit-kpi-lbl">Active share links</span>
            <div className="autocare-audit-kpi-icon is-green">
              <Share2 size={16} />
            </div>
          </div>
          <div className="autocare-audit-kpi-val">2</div>
        </div>

        <div className="autocare-audit-kpi-card">
          <div className="autocare-audit-kpi-head">
            <span className="autocare-audit-kpi-lbl">Expired sessions</span>
            <div className="autocare-audit-kpi-icon is-amber">
              <Clock size={16} />
            </div>
          </div>
          <div className="autocare-audit-kpi-val">1</div>
        </div>

        <div className="autocare-audit-kpi-card">
          <div className="autocare-audit-kpi-head">
            <span className="autocare-audit-kpi-lbl">Total link views</span>
            <div className="autocare-audit-kpi-icon">
              <Eye size={16} />
            </div>
          </div>
          <div className="autocare-audit-kpi-val">7</div>
        </div>

        <div className="autocare-audit-kpi-card">
          <div className="autocare-audit-kpi-head">
            <span className="autocare-audit-kpi-lbl">Revoked tokens</span>
            <div className="autocare-audit-kpi-icon is-red">
              <Ban size={16} />
            </div>
          </div>
          <div className="autocare-audit-kpi-val">3</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="autocare-audit-toolbar">
        <div className="autocare-audit-search-box">
          <Search size={16} style={{ color: '#64748b', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search token, recipient, vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="autocare-audit-tabs">
          <button
            type="button"
            className={`autocare-audit-tab ${statusFilter === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            ALL TOKENS (6)
          </button>
          <button
            type="button"
            className={`autocare-audit-tab ${statusFilter === 'ACTIVE' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('ACTIVE')}
          >
            ACTIVE (2)
          </button>
          <button
            type="button"
            className={`autocare-audit-tab ${statusFilter === 'EXPIRED' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('EXPIRED')}
          >
            EXPIRED (1)
          </button>
          <button
            type="button"
            className={`autocare-audit-tab ${statusFilter === 'REVOKED' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('REVOKED')}
          >
            REVOKED (3)
          </button>
        </div>
      </div>

      {/* Split Grid: Left Table + Right Recipient Inspector */}
      <div className="autocare-sharing-split-grid">
        {/* Left: Table of Sharing Records */}
        <div className="autocare-audit-table-panel">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              Sharing records
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Showing {filteredRecords.length} records
            </span>
          </div>

          <table className="autocare-audit-table">
            <thead>
              <tr>
                <th>RECIPIENT &amp; PURPOSE</th>
                <th>VEHICLE REF</th>
                <th>PERMISSIONS</th>
                <th>EXPIRY &amp; ACCESS</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r) => {
                const isSelected = selectedRecord?.id === r.id;
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRecord(r)}
                    style={{
                      background: isSelected ? '#f8fafc' : undefined,
                      borderLeft: isSelected ? '3px solid #0056A2' : '3px solid transparent',
                    }}
                  >
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                        {r.recipientName}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                        {r.recipientOrg} · {r.purpose}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{r.vehicleRef}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>{r.vehicleTitle}</div>
                    </td>

                    <td>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: '#0056A2',
                          background: '#eff6ff',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {r.permissionsLevel}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontSize: '12px', color: '#1e293b' }}>{r.expiryDate}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                        Views: {r.viewsUsed} / {r.maxViews}
                      </div>
                    </td>

                    <td>
                      <span className={`autocare-audit-pill is-${r.status.toLowerCase()}`}>
                        {r.status}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyLink(r);
                          }}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: 'pointer',
                            color: '#334155',
                          }}
                          title="Copy Link"
                        >
                          <Copy size={13} />
                        </button>

                        {r.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRevoke(r);
                            }}
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              padding: '6px',
                              cursor: 'pointer',
                              color: '#dc2626',
                            }}
                            title="Revoke Access"
                          >
                            <Ban size={13} />
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

        {/* Right: Active Recipient Details Preview Card */}
        {selectedRecord && (
          <div className="autocare-sharing-recipient-card">
            <div className="autocare-sharing-recipient-head">
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#eff6ff',
                  color: '#0056A2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '16px',
                }}
              >
                {selectedRecord.recipientName.slice(0, 2).toUpperCase()}
              </div>
              <div className="autocare-sharing-recipient-info">
                <h4>{selectedRecord.recipientName}</h4>
                <p>{selectedRecord.recipientOrg}</p>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>
                Vehicle Access Subject
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                {selectedRecord.vehicleTitle} • {selectedRecord.vehicleRef}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => handleCopyLink(selectedRecord)}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: '#0056A2',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Copy size={14} />
                <span>Copy link</span>
              </button>

              {selectedRecord.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => handleRevoke(selectedRecord)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Ban size={14} />
                  <span>Revoke</span>
                </button>
              )}
            </div>

            <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px 0', color: '#0f172a' }}>
              Scoped access permissions
            </h4>
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginBottom: '20px' }}>
              <div className={`autocare-sharing-perm-item ${selectedRecord.allowedChronology ? 'is-allowed' : 'is-denied'}`}>
                {selectedRecord.allowedChronology ? '✓' : '✕'} Verified service chronology
              </div>
              <div className={`autocare-sharing-perm-item ${selectedRecord.allowedRepairs ? 'is-allowed' : 'is-denied'}`}>
                {selectedRecord.allowedRepairs ? '✓' : '✕'} Repair and maintenance records
              </div>
              <div className={`autocare-sharing-perm-item ${selectedRecord.allowedInvoices ? 'is-allowed' : 'is-denied'}`}>
                {selectedRecord.allowedInvoices ? '✓' : '✕'} Parts &amp; invoice ledger
              </div>
              <div className={`autocare-sharing-perm-item ${selectedRecord.allowedFinancials ? 'is-allowed' : 'is-denied'}`}>
                {selectedRecord.allowedFinancials ? '✓' : '✕'} Financial and ledger hashes
              </div>
            </div>

            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '11.5px',
                color: '#1e3a8a',
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '2px' }}>
                <Lock size={13} />
                <span>Protected Viewing Mode</span>
              </div>
              Anti-tamper dynamic watermark and tokenized one-time authentication active under BR-07.
            </div>
          </div>
        )}
      </div>
    </GarageLayout>
  );
};

export default GarageSharingPage;
