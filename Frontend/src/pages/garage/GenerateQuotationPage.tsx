import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Search,
  Eye,
  FileText,
  RefreshCw,
  Car,
  User,
  Calendar,
  Check,
  X,
} from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import api from '../../services/api';
import '../../styles/garage-dashboard.css';

interface LineItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
}

interface QuotationItem {
  _id?: string;
  quotationNumber: string;
  vehicleId?: {
    _id?: string;
    registrationNumber: string;
    manufacturer?: string;
    model?: string;
    ownerId?: {
      fullName?: string;
      email?: string;
      phone?: string;
    };
  };
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  totalAmount: number;
  validUntil: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';
  notes?: string;
  createdAt: string;
}

export const GenerateQuotationPage: React.FC = () => {
  // Builder State
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [vehicleReg, setVehicleReg] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>(
    'All parts quoted are genuine OEM components with 6-month or 10,000 km warranty. Prices valid for 14 days.'
  );

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: 'Synthetic Motor Oil 0W-20 (4L)', qty: 1, unitPrice: 14500 },
    { id: '2', description: 'OEM Oil Filter Cartridge', qty: 1, unitPrice: 3200 },
    { id: '3', description: 'Front Ceramic Brake Pads (Set)', qty: 1, unitPrice: 18500 },
  ]);

  const [vehiclesList, setVehiclesList] = useState<any[]>([]);
  const [quotationsList, setQuotationsList] = useState<QuotationItem[]>([]);
  const [loadingQuotations, setLoadingQuotations] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedQuotation, setSelectedQuotation] = useState<QuotationItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const subtotal = lineItems.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);
  const tax = Math.round(subtotal * 0.08); // 8% VAT
  const grandTotal = subtotal + tax;

  // Load available vehicles for fast selection
  const fetchVehicles = useCallback(async () => {
    try {
      const res = await api.get('/garage/vehicles');
      const list = res.data?.data?.vehicles || [];
      setVehiclesList(list);
      if (list.length > 0 && !vehicleReg) {
        setSelectedVehicleId(list[0]._id || '');
        setVehicleReg(list[0].registrationNumber || '');
        if (list[0].ownerId?.fullName) {
          setCustomerName(list[0].ownerId.fullName);
        }
      }
    } catch {
      // Fallback
    }
  }, [vehicleReg]);

  // Load official quotations issued by this garage
  const fetchQuotations = useCallback(async () => {
    setLoadingQuotations(true);
    try {
      const res = await api.get('/garage/quotations');
      const list = res.data?.data?.quotations || [];
      setQuotationsList(list);
    } catch (err: any) {
      console.warn('Could not fetch garage quotations:', err?.message);
    } finally {
      setLoadingQuotations(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
    fetchQuotations();
  }, [fetchVehicles, fetchQuotations]);

  const handleSelectVehicle = (reg: string) => {
    setVehicleReg(reg);
    const found = vehiclesList.find(
      (v) => (v.registrationNumber || '').toLowerCase() === reg.toLowerCase()
    );
    if (found) {
      setSelectedVehicleId(found._id || '');
      if (found.ownerId?.fullName) {
        setCustomerName(found.ownerId.fullName);
      }
    }
  };

  const handleAddItem = () => {
    setLineItems([
      ...lineItems,
      { id: String(Date.now()), description: 'New Service Item', qty: 1, unitPrice: 5000 },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof LineItem, val: any) => {
    setLineItems(
      lineItems.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleSaveQuotation = async (asDraft: boolean = false) => {
    if (!vehicleReg.trim()) {
      setFeedback({ type: 'error', msg: 'Please provide a vehicle registration number.' });
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const payload = {
        vehicleId: selectedVehicleId || undefined,
        registrationNumber: vehicleReg.trim().toUpperCase(),
        vehicleReg: vehicleReg.trim().toUpperCase(),
        customerName: customerName.trim(),
        lineItems,
        items: lineItems.map((it) => ({
          description: it.description,
          quantity: it.qty,
          unitPrice: it.unitPrice,
          total: it.qty * it.unitPrice,
        })),
        subtotal,
        tax,
        totalAmount: grandTotal,
        notes,
        validUntil,
        status: asDraft ? 'draft' : 'sent',
      };

      const res = await api.post('/garage/quotations', payload);
      const newQuotation = res.data?.data?.quotation;

      setFeedback({
        type: 'success',
        msg: asDraft
          ? 'Quotation saved as Draft!'
          : 'Quotation created and dispatched to vehicle owner! Status: Pending Owner Approval',
      });

      // Refresh list
      fetchQuotations();

      // Scroll to tracker
      const trackerEl = document.getElementById('quotations-tracker-section');
      if (trackerEl) {
        trackerEl.scrollIntoView({ behavior: 'smooth' });
      }

      if (newQuotation) {
        setSelectedQuotation(newQuotation);
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || 'Failed to dispatch quotation. Please verify vehicle registration.';
      setFeedback({ type: 'error', msg: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuotationStatus = async (
    quotationId: string,
    newStatus: 'accepted' | 'declined' | 'sent'
  ) => {
    try {
      await api.patch(`/garage/quotations/${quotationId}/status`, { status: newStatus });
      setQuotationsList((prev) =>
        prev.map((q) => (q._id === quotationId ? { ...q, status: newStatus } : q))
      );
      if (selectedQuotation && selectedQuotation._id === quotationId) {
        setSelectedQuotation({ ...selectedQuotation, status: newStatus });
      }
      setFeedback({
        type: 'success',
        msg: `Quotation status updated to ${newStatus.toUpperCase()}!`,
      });
    } catch {
      alert('Failed to update quotation status.');
    }
  };

  // Filtered Quotations
  const filteredQuotations = quotationsList.filter((q) => {
    const matchesFilter =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending'
        ? q.status === 'sent'
        : q.status === statusFilter;

    const reg = q.vehicleId?.registrationNumber || '';
    const num = q.quotationNumber || '';
    const owner = q.vehicleId?.ownerId?.fullName || '';
    const qTerm = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !qTerm ||
      reg.toLowerCase().includes(qTerm) ||
      num.toLowerCase().includes(qTerm) ||
      owner.toLowerCase().includes(qTerm);

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              background: '#DCFCE7',
              color: '#15803D',
              border: '1px solid #86EFAC',
            }}
          >
            <CheckCircle2 size={13} />
            Accepted by Owner
          </span>
        );
      case 'declined':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              background: '#FEE2E2',
              color: '#B91C1C',
              border: '1px solid #FCA5A5',
            }}
          >
            <XCircle size={13} />
            Declined by Owner
          </span>
        );
      case 'sent':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              background: '#FEF3C7',
              color: '#B45309',
              border: '1px solid #FCD34D',
            }}
          >
            <Clock size={13} />
            Pending Owner Approval
          </span>
        );
      case 'draft':
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              background: '#F1F5F9',
              color: '#475569',
              border: '1px solid #CBD5E1',
            }}
          >
            <FileText size={13} />
            Draft
          </span>
        );
    }
  };

  return (
    <GarageLayout activeItem="Generate quotation" breadcrumbCurrent="Generate Quotation">
      {/* Top Heading & Actions */}
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
              color: '#15263D',
              margin: '0 0 4px 0',
            }}
          >
            Quotations & Estimates
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: '13.5px',
              lineHeight: '18px',
              color: '#617187',
              margin: 0,
            }}
          >
            Create official repair estimates, dispatch to vehicle owners, and track real-time approval status.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => handleSaveQuotation(true)}
            disabled={loading}
            style={{
              background: '#FFFFFF',
              border: '1px solid #DCE5EF',
              borderRadius: '7px',
              padding: '8px 16px',
              color: '#15263D',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
            }}
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSaveQuotation(false)}
            disabled={loading}
            style={{
              background: '#0056A2',
              borderRadius: '7px',
              padding: '8px 18px',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '13.5px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 86, 162, 0.22)',
            }}
          >
            {loading ? 'Dispatching...' : 'Send Quotation'}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            padding: '12px 16px',
            background: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: feedback.type === 'success' ? '#15803d' : '#b91c1c',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13.5px',
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Two-Column Quotation Workspace */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.7fr) minmax(300px, 1fr)',
          gap: '20px',
          marginBottom: '36px',
        }}
      >
        {/* Left Column: Builder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Card 1: Customer & Vehicle */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #DCE5EF',
              boxShadow: '0px 2px 8px rgba(18, 52, 90, 0.04)',
              borderRadius: '12px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 700,
                  fontSize: '15.5px',
                  color: '#15263D',
                  margin: 0,
                }}
              >
                Customer & vehicle
              </h3>
              {vehiclesList.length > 0 && (
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  {vehiclesList.length} registered vehicles available
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#617187', marginBottom: '5px' }}>
                  Customer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chathura Perera"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #DCE5EF',
                    borderRadius: '6px',
                    fontSize: '13.5px',
                    color: '#15263D',
                    boxSizing: 'border-box',
                    height: '38px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#617187', marginBottom: '5px' }}>
                  Vehicle Reg. Number
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="e.g. WP CAR-1010"
                    value={vehicleReg}
                    onChange={(e) => handleSelectVehicle(e.target.value)}
                    list="registered-vehicles-list"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #DCE5EF',
                      borderRadius: '6px',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: '#15263D',
                      boxSizing: 'border-box',
                      height: '38px',
                    }}
                  />
                  <datalist id="registered-vehicles-list">
                    {vehiclesList.map((v) => (
                      <option key={v._id} value={v.registrationNumber}>
                        {v.manufacturer} {v.model} - {v.ownerId?.fullName || 'Owner'}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Quotation Line Items */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #DCE5EF',
              boxShadow: '0px 2px 8px rgba(18, 52, 90, 0.04)',
              borderRadius: '12px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 700,
                  fontSize: '15.5px',
                  color: '#15263D',
                  margin: 0,
                }}
              >
                Quotation line items
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #DCE5EF',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  color: '#15263D',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} />
                <span>Add Item</span>
              </button>
            </div>

            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #DCE5EF' }}>
                    <th style={{ padding: '8px 10px', color: '#617187', fontSize: '12px', fontWeight: 600 }}>Description</th>
                    <th style={{ padding: '8px 10px', color: '#617187', fontSize: '12px', fontWeight: 600, width: '60px' }}>Qty</th>
                    <th style={{ padding: '8px 10px', color: '#617187', fontSize: '12px', fontWeight: 600, width: '110px' }}>Unit (LKR)</th>
                    <th style={{ padding: '8px 10px', color: '#617187', fontSize: '12px', fontWeight: 600, width: '110px' }}>Amount</th>
                    <th style={{ padding: '8px 10px', width: '36px' }} />
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #DCE5EF' }}>
                      <td style={{ padding: '8px 10px' }}>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            border: '1px solid #DCE5EF',
                            borderRadius: '6px',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => handleUpdateItem(item.id, 'qty', Number(e.target.value) || 1)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            border: '1px solid #DCE5EF',
                            borderRadius: '6px',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(item.id, 'unitPrice', Number(e.target.value) || 0)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            border: '1px solid #DCE5EF',
                            borderRadius: '6px',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#15263D', fontSize: '13px' }}>
                        Rs. {(item.qty * item.unitPrice).toLocaleString()}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 3: Tax & Totals */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #DCE5EF',
              boxShadow: '0px 2px 8px rgba(18, 52, 90, 0.04)',
              borderRadius: '12px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <h3
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: '15.5px',
                color: '#15263D',
                margin: 0,
              }}
            >
              Tax & totals
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid #DCE5EF',
                  fontSize: '13.5px',
                  color: '#15263D',
                }}
              >
                <span>Subtotal</span>
                <strong>Rs. {subtotal.toLocaleString()}</strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid #DCE5EF',
                  fontSize: '13.5px',
                  color: '#15263D',
                }}
              >
                <span>Applicable VAT / Tax (8%)</span>
                <strong>Rs. {tax.toLocaleString()}</strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0 0 0',
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#0056A2',
                }}
              >
                <span>Estimated Total</span>
                <span>Rs. {grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Notes to Customer */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #DCE5EF',
              boxShadow: '0px 2px 8px rgba(18, 52, 90, 0.04)',
              borderRadius: '12px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <h3
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: '15.5px',
                color: '#15263D',
                margin: 0,
              }}
            >
              Notes to customer
            </h3>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #DCE5EF',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#15263D',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Right Column: Summary Rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Card 1: Quotation Summary */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #DCE5EF',
              boxShadow: '0px 2px 8px rgba(18, 52, 90, 0.04)',
              borderRadius: '12px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <h3
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: '15.5px',
                color: '#15263D',
                margin: 0,
              }}
            >
              Quotation summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: '#15263D' }}>
                Customer: <strong>{customerName || 'Pending selection'}</strong>
              </span>
              <span style={{ fontSize: '13px', color: '#15263D' }}>
                Vehicle: <strong>{vehicleReg || 'Pending entry'}</strong>
              </span>
              <span style={{ fontSize: '13px', color: '#15263D' }}>
                Items count: <strong>{lineItems.length} lines</strong>
              </span>
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#15263D',
                  marginTop: '4px',
                }}
              >
                Rs. {grandTotal.toLocaleString()}
              </span>
            </div>

            <div
              style={{
                display: 'inline-block',
                background: '#FFF6DF',
                color: '#B76A00',
                borderRadius: '20px',
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 700,
                width: 'fit-content',
              }}
            >
              ESTIMATE DRAFT
            </div>
          </div>

          {/* Card 2: Validity */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #DCE5EF',
              boxShadow: '0px 2px 8px rgba(18, 52, 90, 0.04)',
              borderRadius: '12px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <h3
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: '15.5px',
                color: '#15263D',
                margin: 0,
              }}
            >
              Validity
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#617187', marginBottom: '5px' }}>
                Valid Until
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #DCE5EF',
                  borderRadius: '6px',
                  fontSize: '13.5px',
                  color: '#15263D',
                  boxSizing: 'border-box',
                  height: '38px',
                }}
              />
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
              Standard 14-day validity lock for automotive parts and verified labour rates.
            </p>
          </div>

          {/* Card 3: Ledger Notice (Figma #0B1F3A) */}
          <div
            style={{
              background: '#0B1F3A',
              borderRadius: '12px',
              padding: '18px 20px',
              color: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} style={{ color: '#00B4EB' }} />
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                Ledger notice
              </h4>
            </div>

            <p style={{ margin: 0, fontSize: '12px', lineHeight: '18px', color: '#C4D3E5' }}>
              Dispatching this quotation registers an off-chain cryptographic intent on the vehicle
              history tree. The customer will receive an immediate notification to review, accept, or decline.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION: Live Quotations History & Status Tracker Table (BR-03, BR-04)
          ========================================================================= */}
      <div
        id="quotations-tracker-section"
        style={{
          background: '#FFFFFF',
          border: '1px solid #DCE5EF',
          borderRadius: '12px',
          boxShadow: '0px 2px 8px rgba(18, 52, 90, 0.04)',
          overflow: 'hidden',
          marginBottom: '40px',
        }}
      >
        {/* Header & Controls */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 800,
                fontSize: '18px',
                color: '#15263D',
                margin: '0 0 4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>Quotations Status Tracker</span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  background: '#F1F5F9',
                  color: '#475569',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                {quotationsList.length} Total
              </span>
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
              Monitor live owner approvals, pending estimates, and declined quotations in real-time.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search Box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '6px 12px',
                minWidth: '220px',
              }}
            >
              <Search size={15} color="#94A3B8" />
              <input
                type="text"
                placeholder="Search plate, #, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '13px',
                  color: '#1E293B',
                  width: '100%',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <X size={14} color="#94A3B8" />
                </button>
              )}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchQuotations}
              disabled={loadingQuotations}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Refresh list"
            >
              <RefreshCw size={14} className={loadingQuotations ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 24px',
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'all', label: 'All Quotations', count: quotationsList.length },
            {
              id: 'pending',
              label: 'Pending Owner Approval',
              count: quotationsList.filter((q) => q.status === 'sent').length,
            },
            {
              id: 'accepted',
              label: 'Accepted by Owner',
              count: quotationsList.filter((q) => q.status === 'accepted').length,
            },
            {
              id: 'declined',
              label: 'Declined',
              count: quotationsList.filter((q) => q.status === 'declined').length,
            },
            {
              id: 'draft',
              label: 'Draft',
              count: quotationsList.filter((q) => q.status === 'draft').length,
            },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: isActive ? '1px solid #0056A2' : '1px solid #E2E8F0',
                  background: isActive ? '#0056A2' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#475569',
                  fontSize: '12.5px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: isActive ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                    color: isActive ? '#FFFFFF' : '#64748B',
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table Content */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                  QUOTATION #
                </th>
                <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                  TARGET VEHICLE
                </th>
                <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                  CUSTOMER
                </th>
                <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                  TOTAL AMOUNT
                </th>
                <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                  VALID UNTIL
                </th>
                <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                  STATUS
                </th>
                <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: '#64748B', textAlign: 'right' }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {loadingQuotations ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                    <RefreshCw size={22} className="spin" style={{ marginBottom: '8px' }} />
                    <div>Loading quotations records...</div>
                  </td>
                </tr>
              ) : filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: '#94A3B8' }}>
                    <FileText size={32} style={{ marginBottom: '10px', color: '#CBD5E1' }} />
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#475569' }}>
                      No quotations found
                    </div>
                    <div style={{ fontSize: '13px', marginTop: '4px' }}>
                      {statusFilter !== 'all'
                        ? `No quotations with status "${statusFilter}".`
                        : 'Create your first service quotation above and dispatch it to a vehicle owner.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => {
                  const regNo = q.vehicleId?.registrationNumber || 'Unknown Reg';
                  const makeModel = q.vehicleId
                    ? `${q.vehicleId.manufacturer || ''} ${q.vehicleId.model || ''}`.trim()
                    : '';
                  const ownerName = q.vehicleId?.ownerId?.fullName || 'Registered Owner';
                  const ownerPhone = q.vehicleId?.ownerId?.phone || '';

                  return (
                    <tr
                      key={q._id || q.quotationNumber}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                    >
                      {/* Quotation Number & Date */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0056A2' }}>
                          {q.quotationNumber}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                          {new Date(q.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Target Vehicle */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Car size={15} color="#0056A2" />
                          <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#1E293B' }}>
                            {regNo}
                          </span>
                        </div>
                        {makeModel && (
                          <div style={{ fontSize: '12px', color: '#64748B', marginLeft: '21px' }}>
                            {makeModel}
                          </div>
                        )}
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={14} color="#64748B" />
                          <span style={{ fontWeight: 600, fontSize: '13px', color: '#334155' }}>
                            {ownerName}
                          </span>
                        </div>
                        {ownerPhone && (
                          <div style={{ fontSize: '11.5px', color: '#94A3B8', marginLeft: '20px' }}>
                            {ownerPhone}
                          </div>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 800, fontSize: '14px', color: '#15263D' }}>
                          Rs. {q.totalAmount?.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                          {q.items?.length || 0} line items
                        </div>
                      </td>

                      {/* Valid Until */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#475569' }}>
                          <Calendar size={13} color="#94A3B8" />
                          <span>
                            {new Date(q.validUntil).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '14px 18px' }}>{getStatusBadge(q.status)}</td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedQuotation(q)}
                            style={{
                              background: '#F1F5F9',
                              border: '1px solid #CBD5E1',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              color: '#334155',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="View Quotation Details"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>

                          {q.status === 'sent' && q._id && (
                            <button
                              type="button"
                              onClick={() => handleUpdateQuotationStatus(q._id!, 'accepted')}
                              style={{
                                background: '#ECFDF5',
                                border: '1px solid #A7F3D0',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                color: '#047857',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Customer approved verbally / offline"
                            >
                              <Check size={13} />
                              <span>Mark Accepted</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL: Quotation Details Inspection Modal
          ========================================================================= */}
      {selectedQuotation && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setSelectedQuotation(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              padding: '24px 28px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px solid #E2E8F0',
                paddingBottom: '16px',
                marginBottom: '20px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 800,
                      fontSize: '20px',
                      color: '#15263D',
                      margin: 0,
                    }}
                  >
                    Quotation #{selectedQuotation.quotationNumber}
                  </h3>
                  {getStatusBadge(selectedQuotation.status)}
                </div>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                  Issued on{' '}
                  {new Date(selectedQuotation.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}{' '}
                  • Valid until{' '}
                  {new Date(selectedQuotation.validUntil).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedQuotation(null)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Target Vehicle Details */}
            <div
              style={{
                background: '#F8FAFC',
                borderRadius: '10px',
                padding: '14px 16px',
                marginBottom: '20px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                  Target Vehicle
                </div>
                <div style={{ fontWeight: 800, fontSize: '15px', color: '#0056A2', marginTop: '2px' }}>
                  {selectedQuotation.vehicleId?.registrationNumber || 'N/A'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  {selectedQuotation.vehicleId?.manufacturer} {selectedQuotation.vehicleId?.model}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                  Customer Details
                </div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#1E293B', marginTop: '2px' }}>
                  {selectedQuotation.vehicleId?.ownerId?.fullName || customerName || 'Registered Owner'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  {selectedQuotation.vehicleId?.ownerId?.phone || selectedQuotation.vehicleId?.ownerId?.email || 'Contact on file'}
                </div>
              </div>
            </div>

            {/* Items Breakdown Table */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 700, color: '#15263D' }}>
                Itemized Estimate Breakdown
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: '#64748B' }}>Description</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', color: '#64748B', width: '60px' }}>Qty</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', color: '#64748B', width: '100px' }}>Unit</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', color: '#64748B', width: '110px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedQuotation.items || []).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px', color: '#1E293B', fontWeight: 500 }}>{item.description}</td>
                      <td style={{ padding: '10px', textAlign: 'center', color: '#64748B' }}>{item.quantity}</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#64748B' }}>
                        Rs. {item.unitPrice?.toLocaleString()}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#15263D' }}>
                        Rs. {item.total?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: '14px',
                  paddingTop: '10px',
                  borderTop: '2px solid #E2E8F0',
                }}
              >
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>Grand Total (Inclusive of VAT)</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0056A2' }}>
                    Rs. {selectedQuotation.totalAmount?.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes if present */}
            {selectedQuotation.notes && (
              <div
                style={{
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '20px',
                  fontSize: '12.5px',
                  color: '#92400E',
                }}
              >
                <strong>Notes:</strong> {selectedQuotation.notes}
              </div>
            )}

            {/* Modal Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #E2E8F0',
                paddingTop: '16px',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedQuotation.status !== 'accepted' && selectedQuotation._id && (
                  <button
                    type="button"
                    onClick={() => handleUpdateQuotationStatus(selectedQuotation._id!, 'accepted')}
                    style={{
                      background: '#059669',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '7px',
                      padding: '8px 14px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Check size={14} />
                    <span>Approve (Customer Accepted)</span>
                  </button>
                )}

                {selectedQuotation.status !== 'declined' && selectedQuotation._id && (
                  <button
                    type="button"
                    onClick={() => handleUpdateQuotationStatus(selectedQuotation._id!, 'declined')}
                    style={{
                      background: '#FEF2F2',
                      color: '#DC2626',
                      border: '1px solid #FCA5A5',
                      borderRadius: '7px',
                      padding: '8px 14px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <X size={14} />
                    <span>Mark Declined</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedQuotation(null)}
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: '7px',
                  padding: '8px 18px',
                  color: '#334155',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </GarageLayout>
  );
};

export default GenerateQuotationPage;
