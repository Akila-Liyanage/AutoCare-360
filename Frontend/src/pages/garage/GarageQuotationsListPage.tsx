import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Plus,
  CheckCircle2,
  X,
} from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import '../../styles/garage-dashboard.css';

export interface GarageQuoteItem {
  id: string;
  quoteNo: string;
  customerName: string;
  vehicleRef: string;
  vehicleId: string;
  date: string;
  validUntil: string;
  subtotal: number;
  tax: number;
  total: number;
  status: 'SENT' | 'ACCEPTED' | 'DRAFT' | 'EXPIRED';
  itemsSummary: string;
}

const INITIAL_QUOTATIONS: GarageQuoteItem[] = [
  {
    id: 'qt-1',
    quoteNo: 'QT-2026-8492',
    customerName: 'Nimal Perera',
    vehicleRef: 'WP ABC-1234 · Toyota Aqua',
    vehicleId: 'veh-1',
    date: '21 Sep 2026',
    validUntil: '05 Oct 2026',
    subtotal: 43300,
    tax: 7794,
    total: 51094,
    status: 'SENT',
    itemsSummary: '40,000 km Periodic Lube, Ceramic Front Pads, Filters & Inspection',
  },
  {
    id: 'qt-2',
    quoteNo: 'QT-2026-8480',
    customerName: 'Ruwan Dissanayake',
    vehicleRef: 'WP CAS-9988 · Honda Vezel',
    vehicleId: 'veh-2',
    date: '18 Jul 2026',
    validUntil: '01 Aug 2026',
    subtotal: 52000,
    tax: 9360,
    total: 61360,
    status: 'ACCEPTED',
    itemsSummary: 'Dual Clutch Actuator Fluid, Pack Calibration, Front Stabilizer Links',
  },
  {
    id: 'qt-3',
    quoteNo: 'QT-2026-8415',
    customerName: 'Kasun Bandara',
    vehicleRef: 'WP CAD-1212 · Suzuki Wagon R',
    vehicleId: 'veh-3',
    date: '02 Sep 2026',
    validUntil: '16 Sep 2026',
    subtotal: 21500,
    tax: 3870,
    total: 25370,
    status: 'ACCEPTED',
    itemsSummary: 'NGK Laser Iridium Plugs (x3), Throttle Ultrasonic Cleansing',
  },
  {
    id: 'qt-4',
    quoteNo: 'QT-2026-8390',
    customerName: 'Dhammika Fernando',
    vehicleRef: 'WP CAR-8282 · Toyota Prius',
    vehicleId: 'veh-4',
    date: '12 Aug 2026',
    validUntil: '26 Aug 2026',
    subtotal: 38000,
    tax: 6840,
    total: 44840,
    status: 'EXPIRED',
    itemsSummary: 'Inverter Coolant Flush, Auxiliary Battery Testing & Water Pump',
  },
  {
    id: 'qt-5',
    quoteNo: 'QT-2026-8310',
    customerName: 'Saman Kumara',
    vehicleRef: 'CP CAA-5544 · Toyota Axio',
    vehicleId: 'veh-5',
    date: '28 Jun 2026',
    validUntil: '12 Jul 2026',
    subtotal: 48500,
    tax: 8730,
    total: 57230,
    status: 'DRAFT',
    itemsSummary: 'Suspension Bushing Renewal, Arm Bushes & 4-Wheel Alignment',
  },
];

interface ToastState {
  show: boolean;
  message: string;
}

export const GarageQuotationsListPage: React.FC = () => {
  const navigate = useNavigate();

  const [quotations] = useState<GarageQuoteItem[]>(INITIAL_QUOTATIONS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedQuote, setSelectedQuote] = useState<GarageQuoteItem | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  const filteredQuotes = useMemo(() => {
    return quotations.filter((q) => {
      const term = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !term ||
        q.quoteNo.toLowerCase().includes(term) ||
        q.customerName.toLowerCase().includes(term) ||
        q.vehicleRef.toLowerCase().includes(term) ||
        q.itemsSummary.toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotations, searchQuery, statusFilter]);

  return (
    <GarageLayout activeItem="Quotations" breadcrumbCurrent="Quotations & Estimates">
      {/* Title Row */}
      <div className="autocare-garage-title-row">
        <div>
          <h1 className="autocare-garage-main-title">Quotations &amp; Estimates</h1>
          <p className="autocare-garage-main-subtitle">
            Prepare, dispatch, and track customer service estimates and repair quotations.
          </p>
        </div>

        <button
          type="button"
          className="autocare-garage-btn-primary"
          onClick={() => navigate('/garage/quotation/new')}
        >
          <Plus size={16} />
          <span>+ Create Quotation</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '22px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '8px 14px',
            flex: '1',
            minWidth: '260px',
            maxWidth: '480px',
          }}
        >
          <Search size={18} style={{ color: '#64748b' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search quotation #, customer, vehicle, or items..."
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Status:</span>
          {['ALL', 'SENT', 'ACCEPTED', 'DRAFT', 'EXPIRED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                background: statusFilter === st ? '#003874' : '#f1f5f9',
                color: statusFilter === st ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table Panel */}
      <section className="autocare-garage-records-panel" aria-label="Quotations Table">
        <div className="autocare-garage-table-responsive">
          <table className="autocare-garage-records-table">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  QUOTE # &amp; DATE
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  CUSTOMER &amp; VEHICLE
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  ITEMS SUMMARY
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  AMOUNT (LKR)
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  STATUS
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '12px', color: '#64748b' }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map((q) => (
                <tr key={q.id}>
                  <td style={{ padding: '14px 14px' }}>
                    <div style={{ fontWeight: 700, color: '#0056a2', fontSize: '13.5px' }}>
                      {q.quoteNo}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Issued: {q.date}
                    </div>
                  </td>

                  <td style={{ padding: '14px 14px' }}>
                    <strong style={{ fontSize: '13.5px', color: '#0f172a', display: 'block' }}>
                      {q.customerName}
                    </strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{q.vehicleRef}</span>
                  </td>

                  <td style={{ padding: '14px 14px', fontSize: '13px', color: '#475569', maxWidth: '300px' }}>
                    {q.itemsSummary}
                  </td>

                  <td style={{ padding: '14px 14px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                      LKR {q.total.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Subtotal: LKR {q.subtotal.toLocaleString()}
                    </div>
                  </td>

                  <td style={{ padding: '14px 14px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background:
                          q.status === 'ACCEPTED'
                            ? '#ecfdf5'
                            : q.status === 'SENT'
                            ? '#eff6ff'
                            : q.status === 'DRAFT'
                            ? '#fffbeb'
                            : '#fef2f2',
                        color:
                          q.status === 'ACCEPTED'
                            ? '#059669'
                            : q.status === 'SENT'
                            ? '#2563eb'
                            : q.status === 'DRAFT'
                            ? '#d97706'
                            : '#dc2626',
                        border: `1px solid ${
                          q.status === 'ACCEPTED'
                            ? '#a7f3d0'
                            : q.status === 'SENT'
                            ? '#bfdbfe'
                            : q.status === 'DRAFT'
                            ? '#fde68a'
                            : '#fecaca'
                        }`,
                      }}
                    >
                      {q.status}
                    </span>
                  </td>

                  <td style={{ padding: '14px 14px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="autocare-garage-action-link"
                        onClick={() => setSelectedQuote(q)}
                        style={{ fontSize: '12.5px', fontWeight: 600 }}
                      >
                        View
                      </button>
                      <span className="autocare-garage-action-separator">·</span>
                      <button
                        type="button"
                        className="autocare-garage-action-link"
                        onClick={() => navigate(`/garage/invoice/new?vehicleId=${q.vehicleId}`)}
                        style={{ fontSize: '12.5px', fontWeight: 600, color: '#059669' }}
                        title="Convert quotation to verified invoice"
                      >
                        Invoice
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* View Quote Modal */}
      {selectedQuote && (
        <div
          className="autocare-garage-modal-backdrop"
          onClick={() => setSelectedQuote(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="autocare-garage-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="autocare-garage-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} />
                <h3>Quotation {selectedQuote.quoteNo}</h3>
              </div>
              <button
                type="button"
                className="autocare-garage-modal-close-btn"
                onClick={() => setSelectedQuote(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="autocare-garage-modal-body">
              <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', marginBottom: '16px' }}>
                <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>
                  {selectedQuote.customerName}
                </strong>
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>{selectedQuote.vehicleRef}</span>
              </div>

              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Issued Date</span>
                <span className="autocare-garage-profile-spec-val">{selectedQuote.date}</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Valid Until</span>
                <span className="autocare-garage-profile-spec-val">{selectedQuote.validUntil}</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Work Scope</span>
                <span className="autocare-garage-profile-spec-val">{selectedQuote.itemsSummary}</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Subtotal</span>
                <span className="autocare-garage-profile-spec-val">LKR {selectedQuote.subtotal.toLocaleString()}</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">VAT (18%)</span>
                <span className="autocare-garage-profile-spec-val">LKR {selectedQuote.tax.toLocaleString()}</span>
              </div>
              <div className="autocare-garage-profile-spec-row" style={{ borderTop: '2px solid #e2e8f0', marginTop: '8px', paddingTop: '8px' }}>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>Grand Total</strong>
                <strong style={{ fontSize: '15px', color: '#0056a2' }}>LKR {selectedQuote.total.toLocaleString()}</strong>
              </div>
            </div>

            <div className="autocare-garage-modal-footer">
              <button
                type="button"
                className="autocare-garage-hero-btn"
                onClick={() => {
                  setSelectedQuote(null);
                  showToast(`Quotation ${selectedQuote.quoteNo} resent to customer (Demo).`);
                }}
              >
                Resend Quotation
              </button>
              <button
                type="button"
                className="autocare-garage-btn-primary"
                onClick={() => {
                  setSelectedQuote(null);
                  navigate(`/garage/invoice/new?vehicleId=${selectedQuote.vehicleId}`);
                }}
              >
                Generate Invoice
              </button>
            </div>
          </div>
        </div>
      )}

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

export default GarageQuotationsListPage;
