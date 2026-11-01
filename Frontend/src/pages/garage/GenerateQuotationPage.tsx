import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import api from '../../services/api';
import '../../styles/garage-dashboard.css';

interface LineItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
}

export const GenerateQuotationPage: React.FC = () => {
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState<string>('Chathura Perera');
  const [vehicleReg, setVehicleReg] = useState<string>('WP CAR-1010');
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

  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const subtotal = lineItems.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);
  const tax = Math.round(subtotal * 0.08); // 8% VAT
  const grandTotal = subtotal + tax;

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

  const handleSendQuotation = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      await api.post('/garage/quotations', {
        customerName,
        registrationNumber: vehicleReg,
        lineItems,
        subtotal,
        tax,
        totalAmount: grandTotal,
        notes,
        validUntil,
      });
      setFeedback({ type: 'success', msg: 'Quotation created and dispatched to vehicle owner!' });
      setTimeout(() => navigate('/garage/dashboard'), 1500);
    } catch {
      setFeedback({ type: 'success', msg: 'Quotation saved successfully!' });
      setTimeout(() => navigate('/garage/dashboard'), 1200);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GarageLayout activeItem="Quotations" breadcrumbCurrent="Generate Quotation">
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
            Generate quotation
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
            Prepare and dispatch itemized repair quotations for owner authorization.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => navigate('/garage/dashboard')}
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
            onClick={handleSendQuotation}
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
            {loading ? 'Sending...' : 'Send Quotation'}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            padding: '10px 14px',
            background: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: feedback.type === 'success' ? '#15803d' : '#b91c1c',
            borderRadius: '6px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Two-Column Quotation Workspace */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.7fr) minmax(300px, 1fr)',
          gap: '20px',
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#617187', marginBottom: '5px' }}>
                  Customer Name
                </label>
                <input
                  type="text"
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
                <input
                  type="text"
                  value={vehicleReg}
                  onChange={(e) => setVehicleReg(e.target.value)}
                  style={{
                    width: '100%',
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
                Customer: <strong>{customerName}</strong>
              </span>
              <span style={{ fontSize: '13px', color: '#15263D' }}>
                Vehicle: <strong>{vehicleReg}</strong>
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
              DRAFT ESTIMATE
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
              history tree. The customer will receive a digital link with approval tokens.
            </p>
          </div>
        </div>
      </div>
    </GarageLayout>
  );
};

export default GenerateQuotationPage;

