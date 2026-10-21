import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Car,
  Plus,
  Trash2,
  Clock,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  Send,
  Save,
} from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import {
  MOCK_GARAGE_VEHICLES,
  getGarageVehicleById,
  type GarageVehicle,
} from './garageData';
import '../../styles/garage-dashboard.css';

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface QuotationErrors {
  vehicleId?: string;
  items?: string;
  validityDays?: string;
  customer?: string;
}

interface ToastState {
  show: boolean;
  message: string;
}

export const GarageQuotationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Selected vehicle from query parameter or default to first vehicle
  const initialVehicleId = searchParams.get('vehicleId') || MOCK_GARAGE_VEHICLES[0].id;
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(initialVehicleId);

  const selectedVehicle: GarageVehicle = useMemo(() => {
    return getGarageVehicleById(selectedVehicleId);
  }, [selectedVehicleId]);

  // Quotation Metadata
  const quoteReference = 'QT-2026-8492';
  const todayStr = new Date().toISOString().split('T')[0];
  const [quoteDate] = useState<string>(todayStr);
  const [validityDays, setValidityDays] = useState<number>(14);
  const [followUpDate, setFollowUpDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  // Quotation Line Items
  const [items, setItems] = useState<QuotationItem[]>([
    {
      id: 'item-1',
      description: 'Mobil 1 0W-20 Full Synthetic Engine Oil (4L Cask)',
      quantity: 1,
      unitPrice: 14500,
    },
    {
      id: 'item-2',
      description: 'OEM Dual-Stage Engine Oil Filter Element',
      quantity: 1,
      unitPrice: 3800,
    },
    {
      id: 'item-3',
      description: 'Front Disc Brake Pad Set (Akebono Ceramic Pro)',
      quantity: 1,
      unitPrice: 16500,
    },
    {
      id: 'item-4',
      description: 'Comprehensive 40-Point Periodic Inspection & Calibration Labour',
      quantity: 1,
      unitPrice: 8500,
    },
  ]);

  // Tax rate (default 18% VAT standard, toggleable)
  const [applyTax, setApplyTax] = useState<boolean>(true);
  const taxRatePercent = 18;

  // Notes to customer
  const [customerNotes, setCustomerNotes] = useState<string>(
    'Quotation based on 40,000 km periodic service interval. Genuine OEM parts backed by a 6-month / 10,000 km warranty. Prices include labor and environmental disposal fee.'
  );

  // UI state & modals
  const [errors, setErrors] = useState<QuotationErrors>({});
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const [showSendModal, setShowSendModal] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    if (!applyTax) return 0;
    return Math.round((subtotal * taxRatePercent) / 100);
  }, [subtotal, applyTax, taxRatePercent]);

  const grandTotal = useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  // Item management
  const handleAddItem = () => {
    const newItem: QuotationItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      showToast('A quotation must contain at least one item.');
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (
    id: string,
    field: keyof Omit<QuotationItem, 'id'>,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (field === 'description') {
          return { ...item, description: String(value) };
        }
        if (field === 'quantity') {
          const qty = Math.max(1, parseInt(String(value), 10) || 1);
          return { ...item, quantity: qty };
        }
        if (field === 'unitPrice') {
          const price = Math.max(0, parseFloat(String(value)) || 0);
          return { ...item, unitPrice: price };
        }
        return item;
      })
    );
  };

  // Form Validation
  const validate = (): boolean => {
    const newErrors: QuotationErrors = {};

    if (!selectedVehicleId) {
      newErrors.vehicleId = 'Please select a client vehicle.';
    }

    if (!selectedVehicle?.customer?.name) {
      newErrors.customer = 'Vehicle must have an associated customer.';
    }

    if (items.length === 0) {
      newErrors.items = 'At least one quotation line item is required.';
    } else {
      const hasEmptyDesc = items.some((it) => !it.description.trim());
      if (hasEmptyDesc) {
        newErrors.items = 'All quotation items must have a description.';
      }
      const hasInvalidPrice = items.some((it) => it.unitPrice < 0);
      if (hasInvalidPrice) {
        newErrors.items = 'Item prices must be non-negative.';
      }
    }

    if (!validityDays || validityDays <= 0) {
      newErrors.validityDays = 'Validity period must be greater than 0 days.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save Draft (frontend simulated)
  const handleSaveDraft = () => {
    showToast(
      `Quotation draft ${quoteReference} for ${selectedVehicle.registration} saved locally.`
    );
  };

  // Send Quotation to Customer (frontend simulated)
  const handleSendQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please resolve validation errors before sending quotation.');
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setShowSendModal(true);
    }, 700);
  };

  return (
    <GarageLayout activeItem="Vehicles" breadcrumbCurrent="Generate Quotation">
      {/* Top Header & Back Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '22px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <button
            type="button"
            onClick={() => navigate(`/garage/vehicles/${selectedVehicle.id}`)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: 'none',
              color: '#0056a2',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              padding: 0,
              marginBottom: '6px',
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Vehicle Details</span>
          </button>
          <h1 className="autocare-garage-main-title" style={{ margin: 0 }}>
            Generate Service Quotation
          </h1>
          <p className="autocare-garage-main-subtitle">
            Create an itemized formal estimate for client authorization before maintenance commences.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.4px',
              background: '#eff6ff',
              color: '#1e40af',
              border: '1px solid #bfdbfe',
              padding: '5px 12px',
              borderRadius: '6px',
            }}
          >
            REF: {quoteReference}
          </span>
        </div>
      </div>

      {/* Main 2-Column Responsive Form Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1fr)',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* ====================================================================
            LEFT COLUMN: QUOTATION BUILDER
            ==================================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Vehicle & Customer Identification */}
          <section className="autocare-garage-panel">
            <h2 className="autocare-garage-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Car size={18} style={{ color: '#0056a2' }} />
              <span>1. Client &amp; Vehicle Context</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label
                  htmlFor="quote-vehicle-select"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
                >
                  Select Client Vehicle *
                </label>
                <select
                  id="quote-vehicle-select"
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: errors.vehicleId ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                    fontSize: '14px',
                    background: '#ffffff',
                    color: '#0f172a',
                  }}
                >
                  {MOCK_GARAGE_VEHICLES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registration} — {v.make} {v.model} ({v.year}) · Owner: {v.customer.name}
                    </option>
                  ))}
                </select>
                {errors.vehicleId && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ef4444' }}>{errors.vehicleId}</p>
                )}
              </div>

              {/* Client Snapshot Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>CUSTOMER</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {selectedVehicle.customer.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>{selectedVehicle.customer.phone}</div>
                  <div style={{ fontSize: '12px', color: '#0284c7' }}>{selectedVehicle.customer.email}</div>
                </div>

                <div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>VEHICLE SPEC</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {selectedVehicle.registration}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>
                    {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    VIN: <code style={{ color: '#0056a2' }}>{selectedVehicle.vin}</code>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>ODOMETER READING</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {selectedVehicle.mileage.toLocaleString()} km
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: 600 }}>
                    Verified on Trust Network
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Quotation Line Items */}
          <section className="autocare-garage-panel">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <h2 className="autocare-garage-panel-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} style={{ color: '#0056a2' }} />
                <span>2. Quotation Line Items</span>
              </h2>

              <button
                type="button"
                className="autocare-garage-hero-btn"
                onClick={handleAddItem}
                style={{
                  background: '#f1f5f9',
                  color: '#003874',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px',
                  padding: '6px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={14} />
                <span>Add Item</span>
              </button>
            </div>

            {errors.items && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  marginBottom: '14px',
                }}
              >
                {errors.items}
              </div>
            )}

            {/* Table of items */}
            <div className="autocare-garage-table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <th style={{ padding: '10px 12px', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                      ITEM DESCRIPTION
                    </th>
                    <th style={{ padding: '10px 12px', fontSize: '12px', color: '#64748b', fontWeight: 700, width: '90px' }}>
                      QTY
                    </th>
                    <th style={{ padding: '10px 12px', fontSize: '12px', color: '#64748b', fontWeight: 700, width: '130px' }}>
                      UNIT PRICE (LKR)
                    </th>
                    <th style={{ padding: '10px 12px', fontSize: '12px', color: '#64748b', fontWeight: 700, width: '140px' }}>
                      LINE TOTAL (LKR)
                    </th>
                    <th style={{ padding: '10px 8px', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const lineTotal = item.quantity * item.unitPrice;
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                            placeholder={`e.g. Brake rotors, diagnostic labor (${idx + 1})`}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '13px',
                              color: '#0f172a',
                            }}
                          />
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '13px',
                              color: '#0f172a',
                            }}
                          />
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItem(item.id, 'unitPrice', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '13px',
                              color: '#0f172a',
                            }}
                          />
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                          LKR {lineTotal.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: '#ef4444',
                              padding: '4px',
                            }}
                            title="Remove line item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Subtotal, Tax, Total Summary Footer inside Panel */}
            <div
              style={{
                marginTop: '18px',
                paddingTop: '16px',
                borderTop: '1.5px dashed #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '280px', fontSize: '13px', color: '#475569' }}>
                <span>Items Subtotal:</span>
                <strong>LKR {subtotal.toLocaleString()}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '280px', fontSize: '13px', color: '#475569' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={applyTax}
                    onChange={(e) => setApplyTax(e.target.checked)}
                  />
                  <span>VAT ({taxRatePercent}%):</span>
                </label>
                <strong>LKR {taxAmount.toLocaleString()}</strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '280px',
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#003874',
                  paddingTop: '8px',
                  borderTop: '1px solid #cbd5e1',
                }}
              >
                <span>Estimated Total:</span>
                <span>LKR {grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </section>

          {/* Section 3: Quotation Terms & Customer Notes */}
          <section className="autocare-garage-panel">
            <h2 className="autocare-garage-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} style={{ color: '#0056a2' }} />
              <span>3. Validity &amp; Customer Directives</span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label
                  htmlFor="quote-validity-days"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
                >
                  Quote Validity (Days) *
                </label>
                <input
                  id="quote-validity-days"
                  type="number"
                  min="1"
                  max="90"
                  value={validityDays}
                  onChange={(e) => {
                    const days = parseInt(e.target.value, 10) || 1;
                    setValidityDays(days);
                    const d = new Date();
                    d.setDate(d.getDate() + days);
                    setFollowUpDate(d.toISOString().split('T')[0]);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: errors.validityDays ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                    fontSize: '14px',
                  }}
                />
                {errors.validityDays && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ef4444' }}>{errors.validityDays}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="quote-follow-up-date"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
                >
                  Follow-Up Expiry Date
                </label>
                <input
                  id="quote-follow-up-date"
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="quote-customer-notes"
                style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
              >
                Special Instructions &amp; Customer Notes
              </label>
              <textarea
                id="quote-customer-notes"
                rows={3}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Include payment terms, estimated turnaround, warranty conditions, or loaner car details..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </section>
        </div>

        {/* ====================================================================
            RIGHT COLUMN: STICKY QUOTATION SUMMARY CARD
            ==================================================================== */}
        <aside style={{ position: 'sticky', top: '90px' }}>
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              padding: '22px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} style={{ color: '#0056a2' }} />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 800 }}>
                  Quotation Summary
                </h3>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: '#fef3c7',
                  color: '#b45309',
                }}
              >
                DRAFT
              </span>
            </div>

            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>CLIENT</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                {selectedVehicle.customer.name}
              </div>
              <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '4px' }}>
                {selectedVehicle.registration} · {selectedVehicle.make} {selectedVehicle.model}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#475569' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Quotation Date:</span>
                <strong>{quoteDate}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Line Items:</span>
                <strong>{items.length} items</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Validity Window:</span>
                <strong>{validityDays} Days</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Expiry Deadline:</span>
                <strong style={{ color: '#b45309' }}>{followUpDate}</strong>
              </div>
            </div>

            <div
              style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                <span>Subtotal:</span>
                <span>LKR {subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                <span>Tax (18%):</span>
                <span>LKR {taxAmount.toLocaleString()}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#003874',
                  paddingTop: '6px',
                }}
              >
                <span>Grand Total:</span>
                <span>LKR {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '22px' }}>
              <button
                type="button"
                onClick={handleSendQuotation}
                disabled={isSending}
                className="autocare-garage-btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '12px 18px',
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                <Send size={16} />
                <span>{isSending ? 'Dispatching...' : 'Send Quotation to Client'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                className="autocare-garage-hero-btn"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  background: '#f8fafc',
                  color: '#003874',
                  border: '1px solid #cbd5e1',
                  padding: '10px 18px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                }}
              >
                <Save size={15} />
                <span>Save Draft Quotation</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Quotation Sent Confirmation Modal */}
      {showSendModal && (
        <div
          className="autocare-garage-modal-backdrop"
          onClick={() => setShowSendModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="autocare-garage-modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="autocare-garage-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={22} style={{ color: '#16a34a' }} />
                <h3>Quotation Marked as Sent (Demo)</h3>
              </div>
            </div>

            <div className="autocare-garage-modal-body">
              <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                Quotation <strong>{quoteReference}</strong> (estimated total <strong>LKR {grandTotal.toLocaleString()}</strong>) has been generated and sent to customer <strong>{selectedVehicle.customer.name}</strong>.
              </p>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '13px',
                  color: '#475569',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <strong>Customer SMS:</strong> Delivered to {selectedVehicle.customer.phone}
                </div>
                <div>
                  <strong>Email PDF:</strong> Sent to {selectedVehicle.customer.email}
                </div>
                <div>
                  <strong>Digital Passport Status:</strong> Pending Client Approval
                </div>
              </div>
            </div>

            <div className="autocare-garage-modal-footer">
              <button
                type="button"
                className="autocare-garage-hero-btn"
                style={{ background: '#f1f5f9', color: '#475569', marginRight: '8px' }}
                onClick={() => {
                  setShowSendModal(false);
                  navigate(`/garage/vehicles/${selectedVehicle.id}`);
                }}
              >
                Back to Vehicle
              </button>

              <button
                type="button"
                className="autocare-garage-btn-primary"
                onClick={() => {
                  setShowSendModal(false);
                  navigate('/garage/service-records');
                }}
              >
                View Service Records
              </button>
            </div>
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

export default GarageQuotationPage;
