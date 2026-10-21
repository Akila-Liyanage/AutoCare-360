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

export interface GarageInvoiceListItem {
  id: string;
  invoiceNo: string;
  customerName: string;
  vehicleRef: string;
  vehicleId: string;
  date: string;
  serviceType: string;
  labourCost: number;
  partsCost: number;
  tax: number;
  total: number;
  status: 'PAID' | 'PENDING' | 'DRAFT';
}

const INITIAL_INVOICES: GarageInvoiceListItem[] = [
  {
    id: 'inv-1',
    invoiceNo: 'INV-2026-9182',
    customerName: 'Nimal Perera',
    vehicleRef: 'WP ABC-1234 · Toyota Aqua',
    vehicleId: 'veh-1',
    date: '21 Sep 2026',
    serviceType: '40,000 km Periodic Maintenance',
    labourCost: 9500,
    partsCost: 18500,
    tax: 5040,
    total: 33040,
    status: 'PAID',
  },
  {
    id: 'inv-2',
    invoiceNo: 'INV-2026-8109',
    customerName: 'Ruwan Dissanayake',
    vehicleRef: 'WP CAS-9988 · Honda Vezel',
    vehicleId: 'veh-2',
    date: '18 Jul 2026',
    serviceType: 'Dual Clutch & Actuator Service',
    labourCost: 12000,
    partsCost: 30000,
    tax: 7560,
    total: 49560,
    status: 'PAID',
  },
  {
    id: 'inv-3',
    invoiceNo: 'INV-2026-0902',
    customerName: 'Kasun Bandara',
    vehicleRef: 'WP CAD-1212 · Suzuki Wagon R',
    vehicleId: 'veh-3',
    date: '02 Sep 2026',
    serviceType: 'Spark Plug & Throttle Service',
    labourCost: 6500,
    partsCost: 15000,
    tax: 3870,
    total: 25370,
    status: 'PENDING',
  },
  {
    id: 'inv-4',
    invoiceNo: 'INV-2026-0812',
    customerName: 'Dhammika Fernando',
    vehicleRef: 'WP CAR-8282 · Toyota Prius',
    vehicleId: 'veh-4',
    date: '12 Aug 2026',
    serviceType: 'Inverter Coolant Flush',
    labourCost: 5500,
    partsCost: 14300,
    tax: 3564,
    total: 23364,
    status: 'PAID',
  },
  {
    id: 'inv-5',
    invoiceNo: 'DRAFT-2026-1019',
    customerName: 'Nimal Perera',
    vehicleRef: 'WP ABC-1234 · Toyota Aqua',
    vehicleId: 'veh-1',
    date: '19 Oct 2026',
    serviceType: 'HVAC Air Purification & Filter',
    labourCost: 4500,
    partsCost: 6500,
    tax: 1980,
    total: 12980,
    status: 'DRAFT',
  },
];

interface ToastState {
  show: boolean;
  message: string;
}

export const GarageInvoicesListPage: React.FC = () => {
  const navigate = useNavigate();

  const [invoices] = useState<GarageInvoiceListItem[]>(INITIAL_INVOICES);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<GarageInvoiceListItem | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const term = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !term ||
        inv.invoiceNo.toLowerCase().includes(term) ||
        inv.customerName.toLowerCase().includes(term) ||
        inv.vehicleRef.toLowerCase().includes(term) ||
        inv.serviceType.toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  return (
    <GarageLayout activeItem="Invoices" breadcrumbCurrent="Invoices & Billing">
      {/* Title Row */}
      <div className="autocare-garage-title-row">
        <div>
          <h1 className="autocare-garage-main-title">Invoices &amp; Billing</h1>
          <p className="autocare-garage-main-subtitle">
            Manage official service invoices, customer payment settlements, and billing records.
          </p>
        </div>

        <button
          type="button"
          className="autocare-garage-btn-primary"
          onClick={() => navigate('/garage/invoice/new')}
        >
          <Plus size={16} />
          <span>+ Create Invoice</span>
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
            placeholder="Search invoice #, customer, vehicle, or service..."
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
          {['ALL', 'PAID', 'PENDING', 'DRAFT'].map((st) => (
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

      {/* Responsive Table Panel */}
      <section className="autocare-garage-records-panel" aria-label="Invoices Ledger Table">
        <div className="autocare-garage-table-responsive">
          <table className="autocare-garage-records-table">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  INVOICE # &amp; DATE
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  CUSTOMER &amp; VEHICLE
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  SERVICE SCOPE
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  LABOUR + PARTS
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                  TOTAL (LKR)
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
              {filteredInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ padding: '14px 14px' }}>
                    <div style={{ fontWeight: 700, color: '#0056a2', fontSize: '13.5px' }}>
                      {inv.invoiceNo}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {inv.date}
                    </div>
                  </td>

                  <td style={{ padding: '14px 14px' }}>
                    <strong style={{ fontSize: '13.5px', color: '#0f172a', display: 'block' }}>
                      {inv.customerName}
                    </strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{inv.vehicleRef}</span>
                  </td>

                  <td style={{ padding: '14px 14px', fontSize: '13px', color: '#475569' }}>
                    {inv.serviceType}
                  </td>

                  <td style={{ padding: '14px 14px', fontSize: '12.5px', color: '#64748b' }}>
                    <div>Labour: LKR {inv.labourCost.toLocaleString()}</div>
                    <div>Parts: LKR {inv.partsCost.toLocaleString()}</div>
                  </td>

                  <td style={{ padding: '14px 14px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                      LKR {inv.total.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '11px', color: '#059669' }}>
                      Incl. 18% VAT
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
                          inv.status === 'PAID'
                            ? '#ecfdf5'
                            : inv.status === 'PENDING'
                            ? '#fffbeb'
                            : '#f1f5f9',
                        color:
                          inv.status === 'PAID'
                            ? '#059669'
                            : inv.status === 'PENDING'
                            ? '#d97706'
                            : '#475569',
                        border: `1px solid ${
                          inv.status === 'PAID'
                            ? '#a7f3d0'
                            : inv.status === 'PENDING'
                            ? '#fde68a'
                            : '#cbd5e1'
                        }`,
                      }}
                    >
                      {inv.status}
                    </span>
                  </td>

                  <td style={{ padding: '14px 14px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="autocare-garage-action-link"
                        onClick={() => setSelectedInvoice(inv)}
                        style={{ fontSize: '12.5px', fontWeight: 600 }}
                      >
                        Inspect
                      </button>
                      <span className="autocare-garage-action-separator">·</span>
                      <button
                        type="button"
                        className="autocare-garage-action-link"
                        onClick={() => {
                          showToast(`Printing invoice ${inv.invoiceNo}...`);
                          window.print();
                        }}
                        style={{ fontSize: '12.5px', fontWeight: 600, color: '#0056a2' }}
                        title="Print official invoice"
                      >
                        Print
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div
          className="autocare-garage-modal-backdrop"
          onClick={() => setSelectedInvoice(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="autocare-garage-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="autocare-garage-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} />
                <h3>Invoice Details {selectedInvoice.invoiceNo}</h3>
              </div>
              <button
                type="button"
                className="autocare-garage-modal-close-btn"
                onClick={() => setSelectedInvoice(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="autocare-garage-modal-body">
              <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', marginBottom: '16px' }}>
                <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>
                  {selectedInvoice.customerName}
                </strong>
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>{selectedInvoice.vehicleRef}</span>
              </div>

              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Service Type</span>
                <span className="autocare-garage-profile-spec-val">{selectedInvoice.serviceType}</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Invoice Date</span>
                <span className="autocare-garage-profile-spec-val">{selectedInvoice.date}</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Labour Cost</span>
                <span className="autocare-garage-profile-spec-val">LKR {selectedInvoice.labourCost.toLocaleString()}</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Parts Cost</span>
                <span className="autocare-garage-profile-spec-val">LKR {selectedInvoice.partsCost.toLocaleString()}</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">VAT / Tax (18%)</span>
                <span className="autocare-garage-profile-spec-val">LKR {selectedInvoice.tax.toLocaleString()}</span>
              </div>
              <div className="autocare-garage-profile-spec-row" style={{ borderTop: '2px solid #e2e8f0', marginTop: '8px', paddingTop: '8px' }}>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>Invoice Total</strong>
                <strong style={{ fontSize: '15px', color: '#059669' }}>LKR {selectedInvoice.total.toLocaleString()}</strong>
              </div>
            </div>

            <div className="autocare-garage-modal-footer">
              <button
                type="button"
                className="autocare-garage-hero-btn"
                onClick={() => {
                  showToast(`Invoice PDF ${selectedInvoice.invoiceNo} prepared for download.`);
                }}
              >
                Download PDF
              </button>
              <button
                type="button"
                className="autocare-garage-btn-primary"
                onClick={() => {
                  window.print();
                }}
              >
                Print Invoice
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

export default GarageInvoicesListPage;
