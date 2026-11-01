import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import api from '../../services/api';
import '../../styles/garage-dashboard.css';

interface CustomerVehicle {
  _id: string;
  registrationNumber: string;
  manufacturer: string;
  model: string;
}

export const GarageAddExpensePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialVehicleId = searchParams.get('vehicleId') || '';

  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [formData, setFormData] = useState({
    expenseDate: new Date().toISOString().slice(0, 10),
    category: 'Parts & work',
    title: '',
    description: '',
    vendor: '',
    reference: '',
    amount: '',
    paymentMethod: 'Debit card',
    paymentStatus: 'Paid',
    vehicleId: initialVehicleId,
    notes: '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await api.get('/garage/customer-vehicles');
        const list =
          (Array.isArray(res.data?.data) && res.data.data) ||
          (Array.isArray(res.data?.vehicles) && res.data.vehicles) ||
          [];
        setVehicles(list);
      } catch (err) {
        console.error('Failed to load vehicles for expense linkage:', err);
      }
    };
    fetchVehicles();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.title || !formData.amount || !formData.expenseDate) {
      setErrorMsg('Please fill in all required fields (Date, Category, Description / Title, and Amount).');
      return;
    }

    const numAmount = Number(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Amount must be a valid positive number.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/garage/expenses', {
        expenseDate: formData.expenseDate,
        category: formData.category,
        title: formData.title,
        description: formData.description || (formData.reference ? `Ref: ${formData.reference}` : ''),
        vendor: formData.vendor,
        reference: formData.reference,
        amount: numAmount,
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentStatus,
        vehicleId: formData.vehicleId || undefined,
        notes: formData.notes,
      });

      setSuccessMsg('Expense successfully recorded to workshop operating ledger.');
      setTimeout(() => {
        if (formData.vehicleId) {
          navigate(`/garage/vehicles/${formData.vehicleId}`);
        } else {
          navigate('/garage/vehicles');
        }
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to record expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const parsedAmount = Number(formData.amount) || 0;

  return (
    <GarageLayout activeItem="Vehicles" breadcrumbCurrent="Add Expense">
      {/* Back button */}
      <div style={{ marginBottom: '14px' }}>
        <button
          type="button"
          onClick={() => navigate('/garage/vehicles')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            border: 'none',
            background: 'none',
            color: '#0056A2',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            fontSize: '13px',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Vehicles</span>
        </button>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
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
          Add Expense
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
          Record an operating cost for Perera Auto Works.
        </p>
      </div>

      {/* Feedback Alerts */}
      {errorMsg && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#991B1B',
            fontSize: '13px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#166534',
            fontSize: '13px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.8fr) minmax(280px, 1fr)',
            gap: '20px',
          }}
        >
          {/* ====================================================================
              LEFT COLUMN: EXPENSE DETAILS FORM
              ==================================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Box 1: Expense Details */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #DCE5EF',
                borderRadius: '14px',
                padding: '22px',
              }}
            >
              <h2 style={{ fontSize: '15.5px', fontWeight: 700, margin: '0 0 16px 0', color: '#0A1128' }}>
                Expense details
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Expense date *
                  </label>
                  <input
                    type="date"
                    name="expenseDate"
                    value={formData.expenseDate}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      background: '#FFFFFF',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Parts & work">Parts & work</option>
                    <option value="Lubricants / Oil">Lubricants / Oil</option>
                    <option value="Tools & Equipment">Tools & Equipment</option>
                    <option value="Workshop Utilities">Workshop Utilities</option>
                    <option value="Staff & Labour">Staff & Labour</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Description / Title *
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. Engine oil & filter - 5L + synthetic blend"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Supplier / Vendor
                  </label>
                  <input
                    type="text"
                    name="vendor"
                    placeholder="e.g. Uditha Lubricants"
                    value={formData.vendor}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Reference / Invoice number
                  </label>
                  <input
                    type="text"
                    name="reference"
                    placeholder="e.g. UL18352"
                    value={formData.reference}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Amount (LKR) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    placeholder="12000.00"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    min="1"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Payment method
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      background: '#FFFFFF',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Debit card">Debit card</option>
                    <option value="Bank transfer">Bank transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Box 2: Vehicle & Service Linkage */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #DCE5EF',
                borderRadius: '14px',
                padding: '22px',
              }}
            >
              <h2 style={{ fontSize: '15.5px', fontWeight: 700, margin: '0 0 16px 0', color: '#0A1128' }}>
                Vehicle & service linkage
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Link to vehicle (optional)
                  </label>
                  <select
                    name="vehicleId"
                    value={formData.vehicleId}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      background: '#FFFFFF',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="">Vehicle general workshop expense</option>
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.registrationNumber} - {v.manufacturer} {v.model}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Link to service record (optional)
                  </label>
                  <select
                    disabled
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                      fontSize: '13px',
                      background: '#F8FAFC',
                      color: '#94A3B8',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option>No vehicle record linked</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Box 3: Receipt & Notes */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #DCE5EF',
                borderRadius: '14px',
                padding: '22px',
              }}
            >
              <h2 style={{ fontSize: '15.5px', fontWeight: 700, margin: '0 0 16px 0', color: '#0A1128' }}>
                Receipt & notes
              </h2>

              <div
                style={{
                  border: '1.5px dashed #CBD5E1',
                  borderRadius: '10px',
                  padding: '24px',
                  textAlign: 'center',
                  background: '#F8FAFC',
                  cursor: 'pointer',
                  marginBottom: '16px',
                }}
              >
                <Upload size={24} style={{ color: '#0056A2', margin: '0 auto 8px auto' }} />
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0A1128' }}>
                  Click to upload or drag and drop a receipt
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                  PNG, JPG, PDF up to 10MB
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Notes (optional)
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="A summary of 0W-20 engine oil for workshop stock. Not assigned to a specific version."
                  value={formData.notes}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => navigate('/garage/vehicles')}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  padding: '9px 18px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: '#0056A2',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '9px 22px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 86, 162, 0.22)',
                }}
              >
                {loading ? 'Saving...' : 'Save Expense'}
              </button>
            </div>
          </div>

          {/* ====================================================================
              RIGHT COLUMN: ENTRY SUMMARY & WORKSHOP IMPACT
              ==================================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Entry Summary */}
            <section
              style={{
                background: '#FFFFFF',
                border: '1px solid #DCE5EF',
                borderRadius: '14px',
                padding: '20px',
              }}
            >
              <h3 style={{ fontSize: '14.5px', fontWeight: 700, margin: '0 0 14px 0', color: '#0A1128' }}>
                Entry summary
              </h3>

              <div
                style={{
                  display: 'inline-block',
                  background: '#EFF6FF',
                  color: '#0056A2',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  marginBottom: '10px',
                }}
              >
                ● {formData.category}
              </div>

              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0A1128', marginBottom: '4px' }}>
                {formData.title || 'Expense description'}
              </div>

              <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '14px' }}>
                {formData.vendor ? `Supplier: ${formData.vendor}` : 'General supplier'} · {formData.paymentMethod}
              </div>

              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                <span style={{ fontSize: '11.5px', color: '#64748B', textTransform: 'uppercase' }}>Total Amount</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0A1128', marginTop: '2px' }}>
                  LKR {parsedAmount.toLocaleString()}
                </div>
              </div>
            </section>

            {/* Impact Box */}
            <section
              style={{
                background: '#FFFFFF',
                border: '1px solid #DCE5EF',
                borderRadius: '14px',
                padding: '20px',
              }}
            >
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px 0', color: '#0A1128' }}>
                Monthly workshop impact
              </h3>
              <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748B' }}>
                Operating spend for current fiscal period.
              </p>

              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0A1128' }}>
                LKR {(parsedAmount + 32000).toLocaleString()}
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#50B748' }}>
                On track for workshop budget
              </p>
            </section>

            {/* Internal Expense Notice */}
            <section
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0A1128', marginBottom: '6px' }}>
                Internal expense record
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: '17px' }}>
                This entry assists workshop planning and ledger audits. It does not alter or create an entry in an owner passport.
              </p>
            </section>
          </div>
        </div>
      </form>
    </GarageLayout>
  );
};

export default GarageAddExpensePage;
