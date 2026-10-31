import React, { useState } from 'react';
import {
  FileCheck2,
  Search,
  ShieldCheck,
  CheckCircle2,
  X,
} from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import '../../styles/garage-dashboard.css';

interface ToastState {
  show: boolean;
  message: string;
}

const MOCK_AUDIT_LOGS = [
  {
    id: 'tx-89410',
    timestamp: '21 Sep 2026 14:32:10',
    action: 'SERVICE_RECORD_PUBLISHED',
    vehicleRef: 'WP ABC-1234',
    actor: 'Kaveesha P. (Lead Certifier)',
    txHash: '0x3a4b9f88102eac91d84920aa029148572e01b2a9',
    status: 'COMMITTED',
  },
  {
    id: 'tx-89409',
    timestamp: '21 Sep 2026 14:31:05',
    action: 'CUSTOMER_OTP_VERIFIED',
    vehicleRef: 'WP ABC-1234',
    actor: 'Customer SMS Gateway (+94 77 123 4567)',
    txHash: '0x99201a884fe0bba8381928374615243546574839',
    status: 'VERIFIED',
  },
  {
    id: 'tx-89405',
    timestamp: '02 Sep 2026 11:15:44',
    action: 'INSPECTION_SCAN_COMPLETED',
    vehicleRef: 'WP CAD-1212',
    actor: 'Perera Auto Works Terminal #1',
    txHash: '0x5514283920194857610293847561029384756102',
    status: 'COMMITTED',
  },
  {
    id: 'tx-89390',
    timestamp: '18 Jul 2026 16:48:22',
    action: 'SERVICE_RECORD_PUBLISHED',
    vehicleRef: 'WP CAS-9988',
    actor: 'Chaminda R. (Senior Tech)',
    txHash: '0x7728192837465019283746501928374650192837',
    status: 'COMMITTED',
  },
];

export const GarageAuditTrailPage: React.FC = () => {
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const [searchQuery, setSearchQuery] = useState<string>('');

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  const filteredLogs = MOCK_AUDIT_LOGS.filter((l) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      l.action.toLowerCase().includes(q) ||
      l.vehicleRef.toLowerCase().includes(q) ||
      l.actor.toLowerCase().includes(q) ||
      l.txHash.toLowerCase().includes(q)
    );
  });

  return (
    <GarageLayout activeItem="Audit trail" breadcrumbCurrent="Audit Trail">
      <div className="autocare-garage-title-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 className="autocare-garage-main-title" style={{ margin: 0 }}>Garage Activity &amp; Audit Trail</h1>
            <span className="autocare-badge-verified" style={{ background: '#f1f5f9', color: '#475569', fontSize: '11px' }}>
              Preview / Sample
            </span>
          </div>
          <p className="autocare-garage-main-subtitle">
            Activity and record log tracking garage service entries, verifications, and scans.
          </p>
        </div>

        <button
          type="button"
          className="autocare-garage-btn-primary"
          onClick={() => showToast('Audit trail verified: 0 disparities across logged entries.')}
        >
          <ShieldCheck size={16} />
          <span>Verify Activity Logs</span>
        </button>
      </div>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '560px',
        }}
      >
        <Search size={18} style={{ color: '#64748b' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter audit log by transaction hash, vehicle, or event type..."
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            width: '100%',
            fontSize: '13.5px',
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <section className="autocare-garage-records-panel" aria-label="Audit Ledger Table">
        <table className="autocare-garage-records-table">
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                TIMESTAMP
              </th>
              <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                EVENT TYPE &amp; VEHICLE
              </th>
              <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                ACTOR / SOURCE
              </th>
              <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                LEDGER TX HASH
              </th>
              <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '12px', color: '#64748b' }}>
                STATUS
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id}>
                <td style={{ padding: '14px 14px', fontSize: '13px', color: '#64748b' }}>
                  {log.timestamp}
                </td>
                <td style={{ padding: '14px 14px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13.5px' }}>
                    {log.action}
                  </div>
                  <div style={{ fontSize: '12px', color: '#0056a2', marginTop: '2px', fontWeight: 600 }}>
                    {log.vehicleRef}
                  </div>
                </td>
                <td style={{ padding: '14px 14px', fontSize: '13px', color: '#334155' }}>
                  {log.actor}
                </td>
                <td style={{ padding: '14px 14px', fontFamily: 'monospace', fontSize: '12px', color: '#475569' }}>
                  <button
                    type="button"
                    className="autocare-garage-action-link"
                    onClick={() => showToast(`Transaction ${log.txHash} verified on SLT Mobitel Trust Network.`)}
                    style={{ fontFamily: 'monospace', fontSize: '12px' }}
                  >
                    {log.txHash.slice(0, 16)}...
                  </button>
                </td>
                <td style={{ padding: '14px 14px', textAlign: 'right' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: '#ecfdf5',
                      color: '#059669',
                      border: '1px solid #a7f3d0',
                    }}
                  >
                    <FileCheck2 size={12} />
                    <span>{log.status}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Toast */}
      {toast.show && (
        <div className="autocare-garage-toast" role="alert">
          <CheckCircle2 size={18} style={{ color: '#00B4EB', flexShrink: 0 }} />
          <span>{toast.message}</span>
          <button
            type="button"
            className="autocare-garage-toast-close"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </GarageLayout>
  );
};

export default GarageAuditTrailPage;
