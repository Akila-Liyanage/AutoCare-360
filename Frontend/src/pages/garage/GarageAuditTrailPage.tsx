import React, { useState } from 'react';
import {
  FileText,
  Search,
  ShieldCheck,
  CheckCircle2,
  X,
  Download,
  Ban,
  ArrowLeft,
  ChevronRight,
  Calendar,
  Share2
} from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import '../../styles/garage-audit.css';

interface ToastState {
  show: boolean;
  message: string;
}

interface AuditEvent {
  id: string;
  actorName: string;
  actorRole: string;
  actorEntity: string;
  date: string;
  time: string;
  accessType: string;
  device: string;
  ipAddress: string;
  network: string;
  location: string;
  geoCoords: string;
  securityLevel: string;
  purpose: string;
  vehicleRef: string;
  vehicleTitle: string;
  status: 'VERIFIED' | 'REVOKED' | 'FLAGGED';
  category: 'VIEWS' | 'DOWNLOADS' | 'EXPORTS' | 'REVOKED';
  authRef: string;
  authorizedBy: string;
  expiresText: string;
  viewsUsed: string;
  txHash: string;
}

const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'EVT-9482',
    actorName: 'H. Fernando',
    actorRole: 'Authorized Claims Evaluator',
    actorEntity: 'Ceylinco Insurance',
    date: '20 Sep 2026',
    time: '15:42:18',
    accessType: 'Full view (QR)',
    device: 'Safari 17.4 • Windows PC',
    ipAddress: '112.134.8.45',
    network: 'Dialog Broadband Networks',
    location: 'Colombo, LK (Verified)',
    geoCoords: '6.9271° N, 79.8612° E',
    securityLevel: 'TLS 1.3 • HMAC SHA-256',
    purpose: 'Claims assessment',
    vehicleRef: 'WP CAR-1010',
    vehicleTitle: 'Tesla Model S Plaid',
    status: 'VERIFIED',
    category: 'VIEWS',
    authRef: 'AUTH-99182',
    authorizedBy: 'Kasun Perera',
    expiresText: '20 Sep 2026 • 18:00',
    viewsUsed: '2 of 3 views used',
    txHash: '0x812d4a991823ef0b847291a9283746152435914c',
  },
  {
    id: 'EVT-9481',
    actorName: 'Kasun Perera',
    actorRole: 'Lead Certified Master Technician',
    actorEntity: 'Perera Auto Works',
    date: '18 Sep 2026',
    time: '11:20:05',
    accessType: 'Record commit',
    device: 'Chrome 128 • macOS',
    ipAddress: '124.43.12.9',
    network: 'SLT Fibre Broadband',
    location: 'Colombo 05, LK',
    geoCoords: '6.8850° N, 79.8650° E',
    securityLevel: 'TLS 1.3 • Ed25519 Sign',
    purpose: 'Service authentication',
    vehicleRef: 'WP CAR-1010',
    vehicleTitle: 'Tesla Model S Plaid',
    status: 'VERIFIED',
    category: 'EXPORTS',
    authRef: 'AUTH-89211',
    authorizedBy: 'Workshop Lead',
    expiresText: 'Permanent record',
    viewsUsed: 'N/A',
    txHash: '0x3a4b9f88102eac91d84920aa029148572e01b2a9',
  },
  {
    id: 'EVT-9479',
    actorName: 'Central Motors (Pvt) Ltd',
    actorRole: 'Inspecting Garage Assessor',
    actorEntity: 'Central Motors Network',
    date: '15 Sep 2026',
    time: '09:14:32',
    accessType: 'Export PDF',
    device: 'Firefox 129 • Ubuntu Linux',
    ipAddress: '175.157.88.21',
    network: 'SLT Megaline',
    location: 'Kandy, LK',
    geoCoords: '7.2906° N, 80.6337° E',
    securityLevel: 'TLS 1.3 • RSA-4096',
    purpose: 'Buyer inspection',
    vehicleRef: 'WP CAB-8899',
    vehicleTitle: 'Toyota Prius Hybrid',
    status: 'VERIFIED',
    category: 'DOWNLOADS',
    authRef: 'AUTH-77319',
    authorizedBy: 'Perera Auto Works',
    expiresText: '16 Sep 2026',
    viewsUsed: '1 of 1 view used',
    txHash: '0x99201a884fe0bba8381928374615243546574839',
  },
  {
    id: 'EVT-9475',
    actorName: 'K. Jayawardena',
    actorRole: 'Prospective Vehicle Buyer',
    actorEntity: 'Private Individual',
    date: '12 Sep 2026',
    time: '18:30:12',
    accessType: 'Passport view (Link)',
    device: 'Chrome Mobile • Android 14',
    ipAddress: '112.134.190.11',
    network: 'Mobitel 4G LTE',
    location: 'Gampaha, LK',
    geoCoords: '7.0840° N, 79.9940° E',
    securityLevel: 'TLS 1.2 • Token Access',
    purpose: 'Purchase evaluation',
    vehicleRef: 'WP CAB-8899',
    vehicleTitle: 'Toyota Prius Hybrid',
    status: 'FLAGGED',
    category: 'VIEWS',
    authRef: 'AUTH-66120',
    authorizedBy: 'Vehicle Owner',
    expiresText: 'Expired 12 Sep 2026',
    viewsUsed: '3 of 3 views used',
    txHash: '0x5514283920194857610293847561029384756102',
  },
  {
    id: 'EVT-9470',
    actorName: 'Global Fleet Assist',
    actorRole: 'Enterprise Fleet Auditor',
    actorEntity: 'Commercial Fleet API',
    date: '10 Sep 2026',
    time: '14:05:44',
    accessType: 'API check',
    device: 'Python-requests • Cloud Server',
    ipAddress: '54.254.120.88',
    network: 'AWS AP-South-1',
    location: 'Singapore Gateway',
    geoCoords: '1.3521° N, 103.8198° E',
    securityLevel: 'mTLS • API Bearer Token',
    purpose: 'Fleet telemetry',
    vehicleRef: 'WP CAS-9988',
    vehicleTitle: 'Nissan Leaf EV',
    status: 'VERIFIED',
    category: 'EXPORTS',
    authRef: 'AUTH-55410',
    authorizedBy: 'Enterprise License',
    expiresText: '31 Dec 2026',
    viewsUsed: 'Unlimited',
    txHash: '0x7728192837465019283746501928374650192837',
  },
  {
    id: 'EVT-9462',
    actorName: 'Suspicious External IP',
    actorRole: 'Unauthorized Proxy Query',
    actorEntity: 'Unknown Tor Exit Node',
    date: '08 Sep 2026',
    time: '23:11:09',
    accessType: 'Token probe',
    device: 'Unknown Client',
    ipAddress: '185.220.101.5',
    network: 'Anonymous Tor Relay',
    location: 'Frankfurt, DE',
    geoCoords: '50.1109° N, 8.6821° E',
    securityLevel: 'Blocked by Anti-tamper',
    purpose: 'Scraping attempt',
    vehicleRef: 'WP CAR-1010',
    vehicleTitle: 'Tesla Model S Plaid',
    status: 'REVOKED',
    category: 'REVOKED',
    authRef: 'AUTH-REVOKED',
    authorizedBy: 'System Firewall',
    expiresText: 'Revoked immediately',
    viewsUsed: '0 views',
    txHash: '0x0000000000000000000000000000000000000000',
  },
];

export const GarageAuditTrailPage: React.FC = () => {
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const filteredEvents = MOCK_AUDIT_EVENTS.filter((e) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      e.id.toLowerCase().includes(q) ||
      e.actorName.toLowerCase().includes(q) ||
      e.actorEntity.toLowerCase().includes(q) ||
      e.vehicleRef.toLowerCase().includes(q) ||
      e.ipAddress.toLowerCase().includes(q) ||
      e.txHash.toLowerCase().includes(q);

    const matchesCategory =
      activeCategory === 'ALL' || e.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const handleExportAuditReport = () => {
    const headers = [
      'Event ID',
      'Date',
      'Time',
      'Actor',
      'Entity',
      'Vehicle Ref',
      'Access Type',
      'IP Address',
      'Purpose',
      'Status',
      'Ledger Hash',
    ];
    const rows = filteredEvents.map((e) => [
      `"${e.id}"`,
      `"${e.date}"`,
      `"${e.time}"`,
      `"${e.actorName}"`,
      `"${e.actorEntity}"`,
      `"${e.vehicleRef}"`,
      `"${e.accessType}"`,
      `"${e.ipAddress}"`,
      `"${e.purpose}"`,
      `"${e.status}"`,
      `"${e.txHash}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `AutoCare360_Garage_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredEvents.length} audit trail records as CSV.`);
  };

  return (
    <GarageLayout activeItem="Audit trail" breadcrumbCurrent="Audit Trail">
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

      {/* ====================================================================
          SCREEN 2: EVENT DETAIL VIEW (When an event is selected)
          ==================================================================== */}
      {selectedEvent ? (
        <div>
          {/* Top Title Row with Back Button */}
          <div className="autocare-garage-title-row">
            <div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: '#0056A2',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  marginBottom: '8px',
                }}
              >
                <ArrowLeft size={16} />
                <span>Back to audit trail list</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="autocare-audit-badge">AUDIT TRAIL • EVENT DETAIL</span>
              </div>
              <h1 className="autocare-garage-main-title" style={{ margin: '0 0 4px 0' }}>
                Audit event {selectedEvent.id}
              </h1>
              <p className="autocare-garage-main-subtitle">
                BR-08 - Verified record access event for {selectedEvent.vehicleTitle} • {selectedEvent.vehicleRef}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="autocare-garage-btn-secondary"
                onClick={() => showToast(`Audit activity report for ${selectedEvent.id} exported.`)}
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
                <Download size={15} />
                <span>Export activity</span>
              </button>

              <button
                type="button"
                className="autocare-garage-btn-primary"
                onClick={() => {
                  showToast(`Token access for ${selectedEvent.actorName} revoked immediately.`);
                  setSelectedEvent((prev) => prev ? { ...prev, status: 'REVOKED' } : null);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #ef4444',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Ban size={15} />
                <span>Revoke access</span>
              </button>
            </div>
          </div>

          {/* Grid Layout: Left Main Card + Right Stacked Cards */}
          <div className="autocare-event-detail-grid">
            {/* Left Column (Wide) */}
            <div className="autocare-event-main-card">
              {/* Actor Banner */}
              <div className="autocare-event-actor-banner">
                <div className="autocare-event-avatar">
                  {selectedEvent.actorName.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 className="autocare-event-actor-name">{selectedEvent.actorName} · {selectedEvent.actorEntity}</h2>
                    <span className={`autocare-audit-pill is-${selectedEvent.status.toLowerCase()}`}>
                      {selectedEvent.status}
                    </span>
                  </div>
                  <p className="autocare-event-actor-role">
                    {selectedEvent.actorRole} • Authorized Operations
                  </p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#64748b' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedEvent.date}</div>
                  <div>{selectedEvent.time}</div>
                </div>
              </div>

              {/* Access Context Grid */}
              <h3 className="autocare-event-section-title">Access Context</h3>
              <div className="autocare-event-context-grid">
                <div className="autocare-event-context-cell">
                  <span className="autocare-event-context-lbl">Device &amp; Client</span>
                  <span className="autocare-event-context-val">{selectedEvent.device}</span>
                </div>
                <div className="autocare-event-context-cell">
                  <span className="autocare-event-context-lbl">IP Address</span>
                  <span className="autocare-event-context-val" style={{ fontFamily: 'monospace' }}>
                    {selectedEvent.ipAddress}
                  </span>
                </div>
                <div className="autocare-event-context-cell">
                  <span className="autocare-event-context-lbl">Network Carrier</span>
                  <span className="autocare-event-context-val">{selectedEvent.network}</span>
                </div>
                <div className="autocare-event-context-cell">
                  <span className="autocare-event-context-lbl">Location (Geo)</span>
                  <span className="autocare-event-context-val">{selectedEvent.location}</span>
                </div>
                <div className="autocare-event-context-cell">
                  <span className="autocare-event-context-lbl">Coordinates</span>
                  <span className="autocare-event-context-val" style={{ fontFamily: 'monospace' }}>
                    {selectedEvent.geoCoords}
                  </span>
                </div>
                <div className="autocare-event-context-cell">
                  <span className="autocare-event-context-lbl">Security Level</span>
                  <span className="autocare-event-context-val" style={{ color: '#059669' }}>
                    {selectedEvent.securityLevel}
                  </span>
                </div>
              </div>

              {/* Records Viewed Section */}
              <h3 className="autocare-event-section-title">Records viewed</h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 12px 0' }}>
                The request granted full access viewing of the following items:
              </p>
              <div className="autocare-event-viewed-list">
                <div className="autocare-event-viewed-item">
                  <div>
                    <h4 className="autocare-event-viewed-item-title">Verified service chronology</h4>
                    <p className="autocare-event-viewed-item-sub">18 periodic inspection records and parts logs</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0056A2' }}>03:42 m</span>
                    <span className="autocare-audit-pill is-verified" style={{ marginLeft: '10px' }}>
                      COMPLETED
                    </span>
                  </div>
                </div>

                <div className="autocare-event-viewed-item">
                  <div>
                    <h4 className="autocare-event-viewed-item-title">Mileage and health history</h4>
                    <p className="autocare-event-viewed-item-sub">Monotonic odometer audit curve</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0056A2' }}>01:15 m</span>
                    <span className="autocare-audit-pill is-verified" style={{ marginLeft: '10px' }}>
                      COMPLETED
                    </span>
                  </div>
                </div>

                <div className="autocare-event-viewed-item">
                  <div>
                    <h4 className="autocare-event-viewed-item-title">Part &amp; line specifications</h4>
                    <p className="autocare-event-viewed-item-sub">Invoice receipts and garage authorization stamps</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0056A2' }}>00:54 m</span>
                    <span className="autocare-audit-pill is-verified" style={{ marginLeft: '10px' }}>
                      COMPLETED
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification Timeline */}
              <h3 className="autocare-event-section-title">Verification timeline</h3>
              <div className="autocare-event-timeline">
                <div className="autocare-event-timeline-item">
                  <span className="autocare-event-timeline-time">15:42:02</span>
                  <div className="autocare-event-timeline-dot" />
                  <div className="autocare-event-timeline-content">
                    <h5>Secure link opened</h5>
                    <p>Recipient accessed tokenized secure link from authorized email/SMS gateway.</p>
                  </div>
                </div>

                <div className="autocare-event-timeline-item">
                  <span className="autocare-event-timeline-time">15:42:04</span>
                  <div className="autocare-event-timeline-dot" style={{ background: '#059669' }} />
                  <div className="autocare-event-timeline-content">
                    <h5>Actor identity verified</h5>
                    <p>2FA OTP pin authenticated &amp; verified against insurance organization roster.</p>
                  </div>
                </div>

                <div className="autocare-event-timeline-item">
                  <span className="autocare-event-timeline-time">15:42:10</span>
                  <div className="autocare-event-timeline-dot" style={{ background: '#0891b2' }} />
                  <div className="autocare-event-timeline-content">
                    <h5>Protected view initialized</h5>
                    <p>Watermark generated with dynamic IP stamp: 112.134.8.45.</p>
                  </div>
                </div>

                <div className="autocare-event-timeline-item">
                  <span className="autocare-event-timeline-time">15:45:56</span>
                  <div className="autocare-event-timeline-dot" style={{ background: '#64748b' }} />
                  <div className="autocare-event-timeline-content">
                    <h5>Session closed</h5>
                    <p>Total session duration 3m 54s. All security policies satisfied.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (Cards Stack) */}
            <div>
              {/* Permission Basis Card */}
              <div className="autocare-event-side-card">
                <h4 style={{ fontSize: '14.5px', fontWeight: 700, margin: '0 0 14px 0', color: '#0f172a' }}>
                  Permission basis
                </h4>
                <div className="autocare-event-side-row">
                  <span className="autocare-event-side-label">Scope</span>
                  <span className="autocare-event-side-val">Full view permission</span>
                </div>
                <div className="autocare-event-side-row">
                  <span className="autocare-event-side-label">Authorized by</span>
                  <span className="autocare-event-side-val">{selectedEvent.authorizedBy}</span>
                </div>
                <div className="autocare-event-side-row">
                  <span className="autocare-event-side-label">Reference</span>
                  <span className="autocare-event-side-val" style={{ fontFamily: 'monospace' }}>
                    {selectedEvent.authRef}
                  </span>
                </div>
                <div className="autocare-event-side-row">
                  <span className="autocare-event-side-label">Expires</span>
                  <span className="autocare-event-side-val">{selectedEvent.expiresText}</span>
                </div>
                <div className="autocare-event-side-row">
                  <span className="autocare-event-side-label">View usage</span>
                  <span className="autocare-event-side-val">{selectedEvent.viewsUsed}</span>
                </div>
                <div className="autocare-event-side-row">
                  <span className="autocare-event-side-label">Watermark</span>
                  <span className="autocare-audit-pill is-verified">ENABLED</span>
                </div>
              </div>

              {/* Sharing Status Card */}
              <div className="autocare-event-side-card">
                <h4 style={{ fontSize: '14.5px', fontWeight: 700, margin: '0 0 10px 0', color: '#0f172a' }}>
                  Sharing status
                </h4>
                <div style={{ marginBottom: '12px' }}>
                  <span className={`autocare-audit-pill is-${selectedEvent.status.toLowerCase()}`}>
                    {selectedEvent.status === 'VERIFIED' ? 'ACTIVE (EXPIRES IN 2H 18M)' : selectedEvent.status}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                  Access is active and currently monitored. You can revoke it immediately if suspicious activity is noticed.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    showToast('Access token revoked.');
                    setSelectedEvent((prev) => prev ? { ...prev, status: 'REVOKED' } : null);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #fee2e2',
                    background: '#fef2f2',
                    color: '#dc2626',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Revoke this token
                </button>
              </div>

              {/* Ledger Verification Card (Deep Navy) */}
              <div className="autocare-event-ledger-card">
                <h4 className="autocare-event-ledger-title">Ledger verification</h4>
                <p className="autocare-event-ledger-desc">
                  Cryptographically anchored event hash verified across workshop nodes.
                </p>
                <div className="autocare-event-ledger-hash">
                  {selectedEvent.txHash}
                </div>
                <button
                  type="button"
                  className="autocare-event-ledger-btn"
                  onClick={() => showToast('Cryptographic signature verified across AutoCare ledger.')}
                >
                  Confirm authenticity &amp; sign
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ====================================================================
           SCREEN 1: MAIN AUDIT TRAIL LIST VIEW
           ==================================================================== */
        <>
          {/* Title Row */}
          <div className="autocare-garage-title-row">
            <div>
              <span className="autocare-audit-badge">AUDIT TRAIL &amp; LOGS</span>
              <h1 className="autocare-garage-main-title">Audit trail</h1>
              <p className="autocare-garage-main-subtitle">
                BR-08 - Cryptographic audit trail of every download, view, and authorization activity.
              </p>
            </div>

            <button
              type="button"
              className="autocare-garage-btn-primary"
              onClick={handleExportAuditReport}
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
              <Download size={16} />
              <span>Export audit report</span>
            </button>
          </div>

          {/* 4 KPI Summary Cards */}
          <div className="autocare-audit-kpi-grid">
            {/* KPI 1 */}
            <div className="autocare-audit-kpi-card">
              <div className="autocare-audit-kpi-head">
                <span className="autocare-audit-kpi-lbl">Total actions recorded</span>
                <div className="autocare-audit-kpi-icon">
                  <FileText size={16} />
                </div>
              </div>
              <div className="autocare-audit-kpi-val">47</div>
            </div>

            {/* KPI 2 */}
            <div className="autocare-audit-kpi-card">
              <div className="autocare-audit-kpi-head">
                <span className="autocare-audit-kpi-lbl">Verification rate</span>
                <div className="autocare-audit-kpi-icon is-green">
                  <ShieldCheck size={16} />
                </div>
              </div>
              <div className="autocare-audit-kpi-val">98%</div>
            </div>

            {/* KPI 3 */}
            <div className="autocare-audit-kpi-card">
              <div className="autocare-audit-kpi-head">
                <span className="autocare-audit-kpi-lbl">Active sharing sessions</span>
                <div className="autocare-audit-kpi-icon is-amber">
                  <Share2 size={16} />
                </div>
              </div>
              <div className="autocare-audit-kpi-val">3</div>
            </div>

            {/* KPI 4 */}
            <div className="autocare-audit-kpi-card">
              <div className="autocare-audit-kpi-head">
                <span className="autocare-audit-kpi-lbl">Revoked authorizations</span>
                <div className="autocare-audit-kpi-icon is-red">
                  <Ban size={16} />
                </div>
              </div>
              <div className="autocare-audit-kpi-val">1</div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="autocare-audit-toolbar">
            <div className="autocare-audit-search-box">
              <Search size={16} style={{ color: '#64748b', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search by actor, vehicle, IP or hash..."
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#475569',
                }}
              >
                <Calendar size={14} />
                <span>Date range: Last 7 days</span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="autocare-audit-tabs">
              <button
                type="button"
                className={`autocare-audit-tab ${activeCategory === 'ALL' ? 'is-active' : ''}`}
                onClick={() => setActiveCategory('ALL')}
              >
                ALL EVENTS (47)
              </button>
              <button
                type="button"
                className={`autocare-audit-tab ${activeCategory === 'VIEWS' ? 'is-active' : ''}`}
                onClick={() => setActiveCategory('VIEWS')}
              >
                VIEWS (21)
              </button>
              <button
                type="button"
                className={`autocare-audit-tab ${activeCategory === 'DOWNLOADS' ? 'is-active' : ''}`}
                onClick={() => setActiveCategory('DOWNLOADS')}
              >
                DOWNLOADS (11)
              </button>
              <button
                type="button"
                className={`autocare-audit-tab ${activeCategory === 'EXPORTS' ? 'is-active' : ''}`}
                onClick={() => setActiveCategory('EXPORTS')}
              >
                EXPORTS (8)
              </button>
              <button
                type="button"
                className={`autocare-audit-tab ${activeCategory === 'REVOKED' ? 'is-active' : ''}`}
                onClick={() => setActiveCategory('REVOKED')}
              >
                REVOKED (1)
              </button>
            </div>
          </div>

          {/* Main Table Panel */}
          <div className="autocare-audit-table-panel">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                Recent access activity
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Showing {filteredEvents.length} events
              </span>
            </div>

            <table className="autocare-audit-table">
              <thead>
                <tr>
                  <th>ACTOR &amp; ENTITY</th>
                  <th>DATE &amp; TIME</th>
                  <th>ACCESS TYPE &amp; IP</th>
                  <th>PURPOSE</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((evt) => (
                  <tr key={evt.id} onClick={() => setSelectedEvent(evt)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: '#eff6ff',
                            color: '#0056A2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '12px',
                          }}
                        >
                          {evt.actorName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                            {evt.actorName} - {evt.actorEntity}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                            {evt.actorRole} · {evt.vehicleRef}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{evt.date}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>{evt.time}</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{evt.accessType}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'monospace' }}>
                        {evt.ipAddress} · {evt.device.split('•')[0]}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontWeight: 600, color: '#334155' }}>{evt.purpose}</span>
                    </td>

                    <td>
                      <span className={`autocare-audit-pill is-${evt.status.toLowerCase()}`}>
                        {evt.status}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(evt);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#0056A2',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px',
                        }}
                        title="View Event Details"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </GarageLayout>
  );
};

export default GarageAuditTrailPage;
