import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Car,
  Calendar,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  Plus,
  Trash2,
  Lock,
} from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import {
  MOCK_GARAGE_VEHICLES,
  getGarageVehicleById,
  type GarageVehicle,
} from './garageData';
import '../../styles/garage-dashboard.css';

interface InvoiceErrors {
  vehicleId?: string;
  serviceType?: string;
  odometer?: string;
  workPerformed?: string;
  labourCost?: string;
  partsCost?: string;
  consent?: string;
}

interface ToastState {
  show: boolean;
  message: string;
}

export const GarageInvoicePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Vehicle Context
  const initialVehicleId = searchParams.get('vehicleId') || MOCK_GARAGE_VEHICLES[0].id;
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(initialVehicleId);

  const selectedVehicle: GarageVehicle = useMemo(() => {
    return getGarageVehicleById(selectedVehicleId);
  }, [selectedVehicleId]);

  // Invoice identifiers & metadata
  const invoiceNumber = 'INV-2026-9182';
  const todayStr = new Date().toISOString().split('T')[0];
  const [invoiceDate] = useState<string>(todayStr);
  const [paymentTerms, setPaymentTerms] = useState<string>('Immediate / On-Collection');

  // Service Details State
  const [serviceDate, setServiceDate] = useState<string>(todayStr);
  const [odometer, setOdometer] = useState<string>(
    String(selectedVehicle.mileage ? selectedVehicle.mileage + 150 : 85000)
  );
  const [serviceType, setServiceType] = useState<string>('Periodic Maintenance Service');
  const [technician, setTechnician] = useState<string>('Kaveesha Perera (Master Tech #PAW-01)');

  // Work Performed & Replaced Parts
  const [workPerformed, setWorkPerformed] = useState<string>(
    'Executed scheduled 40,000 km preventative maintenance. Replaced synthetic engine oil and OEM filter cartridge. Inspected suspension bushings, torqued wheel nuts to spec, and executed multi-system OBD-II electronic diagnostic scan.'
  );
  const [partsList, setPartsList] = useState<string[]>([
    'Toyota Genuine 0W-20 Motor Oil (4 Litres)',
    'OEM Oil Filter Element 04152-YZZA6',
    'Cabin HEPA Air Conditioning Filter',
  ]);
  const [newPartInput, setNewPartInput] = useState<string>('');

  // Cost items
  const [labourCost, setLabourCost] = useState<string>('9500');
  const [partsCost, setPartsCost] = useState<string>('18500');
  const [applyVat, setApplyVat] = useState<boolean>(true);
  const vatRate = 0.18;

  // Authorization checkbox
  const [ownerAuthorized, setOwnerAuthorized] = useState<boolean>(true);

  // Form Validation & UI states
  const [errors, setErrors] = useState<InvoiceErrors>({});
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [signedTxHash, setSignedTxHash] = useState<string>('');

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  // Calculations
  const numericLabour = Math.max(0, parseFloat(labourCost) || 0);
  const numericParts = Math.max(0, parseFloat(partsCost) || 0);
  const subtotal = numericLabour + numericParts;
  const taxAmount = applyVat ? Math.round(subtotal * vatRate) : 0;
  const grandTotal = subtotal + taxAmount;

  // Parts handling
  const handleAddPart = () => {
    const trimmed = newPartInput.trim();
    if (!trimmed) return;
    if (partsList.includes(trimmed)) {
      showToast('Part item already added.');
      return;
    }
    setPartsList([...partsList, trimmed]);
    setNewPartInput('');
  };

  const handleRemovePart = (partToRemove: string) => {
    setPartsList(partsList.filter((p) => p !== partToRemove));
  };

  // AI OCR Demo Extractor
  const handleSimulateOcr = () => {
    setWorkPerformed(
      'AI OCR Extraction from PAW Physical Job Card: Routine service completed. Transmission oil flushed and replenished. Front brake pads renewed with Akebono Pro ceramics. Brake fluid bled and renewed.'
    );
    setPartsList([
      'Mobil 1 ESP 0W-20 (4.2L)',
      'OEM Micro-Guard Oil Filter',
      'Akebono Ceramic Front Brake Pads',
      'DOT 4 Brake Fluid (1L)',
    ]);
    setLabourCost('12000');
    setPartsCost('24500');
    showToast('AI OCR successfully parsed paper invoice and synchronized line items!');
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: InvoiceErrors = {};

    if (!selectedVehicleId) {
      newErrors.vehicleId = 'Vehicle selection is required.';
    }

    if (!serviceType.trim()) {
      newErrors.serviceType = 'Service type is required.';
    }

    if (odometer === '' || isNaN(Number(odometer)) || Number(odometer) < 0) {
      newErrors.odometer = 'Odometer reading must be non-negative (>= 0).';
    }

    if (!workPerformed.trim() || workPerformed.trim().length < 5) {
      newErrors.workPerformed = 'Description of work performed is required (min 5 characters).';
    }

    if (labourCost !== '' && (isNaN(Number(labourCost)) || Number(labourCost) < 0)) {
      newErrors.labourCost = 'Labour cost must be >= 0.';
    }

    if (partsCost !== '' && (isNaN(Number(partsCost)) || Number(partsCost) < 0)) {
      newErrors.partsCost = 'Parts cost must be >= 0.';
    }

    if (!ownerAuthorized) {
      newErrors.consent = 'Customer cryptographic authorization is required before publishing invoice.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save Draft (frontend simulated)
  const handleSaveDraft = () => {
    showToast(`Invoice draft ${invoiceNumber} saved locally.`);
  };

  // Sign & Publish Invoice Record
  const handlePublishInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please correct validation issues before publishing invoice.');
      return;
    }

    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      const generatedHash = `0x${Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;
      setSignedTxHash(generatedHash);
      setShowSuccessModal(true);
    }, 750);
  };

  return (
    <GarageLayout activeItem="Vehicles" breadcrumbCurrent="Invoice Generator">
      {/* Header and Back Action */}
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
            Generate &amp; Publish Service Invoice
          </h1>
          <p className="autocare-garage-main-subtitle">
            Cryptographically signed invoice record anchored to the vehicle digital passport under BR-03.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.4px',
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              padding: '5px 12px',
              borderRadius: '6px',
            }}
          >
            INVOICE: {invoiceNumber}
          </span>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1fr)',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* ====================================================================
            LEFT COLUMN: INVOICE GENERATOR FORM
            ==================================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* AI OCR Scanner Visual Placeholder Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #003874 0%, #0056a2 100%)',
              borderRadius: '12px',
              padding: '18px 22px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
              boxShadow: '0 4px 12px rgba(0, 56, 116, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={22} style={{ color: '#38bdf8' }} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 800 }}>
                  Simulate OCR Extraction (Job Sheet &amp; Parts)
                </h3>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.85)' }}>
                  Auto-fill work completed, part codes, and labour tallies from paper job sheets.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSimulateOcr}
              className="autocare-garage-hero-btn"
              style={{
                background: '#ffffff',
                color: '#003874',
                fontWeight: 700,
                fontSize: '13px',
                padding: '8px 16px',
              }}
            >
              Simulate OCR Extraction
            </button>
          </div>

          {/* Section 1: Verified Vehicle Lookup */}
          <section className="autocare-garage-panel">
            <h2 className="autocare-garage-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Car size={18} style={{ color: '#0056a2' }} />
              <span>1. Verified Vehicle Lookup</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label
                  htmlFor="invoice-vehicle-select"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
                >
                  Client Vehicle *
                </label>
                <select
                  id="invoice-vehicle-select"
                  value={selectedVehicleId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedVehicleId(nextId);
                    const veh = getGarageVehicleById(nextId);
                    if (veh) {
                      setOdometer(String(veh.mileage + 150));
                    }
                  }}
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

              {/* Verified Identity Snapshot Pill */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                  fontSize: '12.5px',
                  color: '#475569',
                }}
              >
                <span>
                  <strong>Owner:</strong> {selectedVehicle.customer.name} ({selectedVehicle.customer.phone})
                </span>
                <span>
                  <strong>VIN:</strong> <code style={{ color: '#0056a2' }}>{selectedVehicle.vin}</code>
                </span>
                <span>
                  <strong>Digital Ledger:</strong> <span style={{ color: '#059669', fontWeight: 700 }}>VERIFIED</span>
                </span>
              </div>
            </div>
          </section>

          {/* Section 2: Service Details & Odometer */}
          <section className="autocare-garage-panel">
            <h2 className="autocare-garage-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} style={{ color: '#0056a2' }} />
              <span>2. Service Details &amp; Telemetry</span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label
                  htmlFor="invoice-service-date"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
                >
                  Service Date *
                </label>
                <input
                  id="invoice-service-date"
                  type="date"
                  max={todayStr}
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                  }}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="invoice-odometer"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
                >
                  Odometer Reading (km) *
                </label>
                <input
                  id="invoice-odometer"
                  type="number"
                  min="0"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: errors.odometer ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                    fontSize: '14px',
                  }}
                  required
                />
                {errors.odometer && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ef4444' }}>{errors.odometer}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="invoice-service-type"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
                >
                  Service Type *
                </label>
                <select
                  id="invoice-service-type"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: errors.serviceType ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                    fontSize: '14px',
                  }}
                >
                  <option value="Periodic Maintenance Service">Periodic Maintenance Service</option>
                  <option value="Brake System Overhaul">Brake System Overhaul</option>
                  <option value="Transmission Fluid Flush">Transmission Fluid Flush</option>
                  <option value="Engine Diagnostics & Tune-up">Engine Diagnostics & Tune-up</option>
                  <option value="Suspension & Steering Overhaul">Suspension & Steering Overhaul</option>
                  <option value="Hybrid Battery Health Check">Hybrid Battery Health Check</option>
                  <option value="Air Conditioning Repair">Air Conditioning Repair</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="invoice-technician"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
                >
                  Assigned Technician
                </label>
                <input
                  id="invoice-technician"
                  type="text"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
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
                htmlFor="invoice-work-performed"
                style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
              >
                Work Performed &amp; Maintenance Scope *
              </label>
              <textarea
                id="invoice-work-performed"
                rows={3}
                value={workPerformed}
                onChange={(e) => setWorkPerformed(e.target.value)}
                placeholder="Detail mechanical, electrical, and inspection procedures executed..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: errors.workPerformed ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  boxSizing: 'border-box',
                }}
                required
              />
              {errors.workPerformed && (
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ef4444' }}>{errors.workPerformed}</p>
              )}
            </div>
          </section>

          {/* Section 3: Replaced Parts & Financials */}
          <section className="autocare-garage-panel">
            <h2 className="autocare-garage-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} style={{ color: '#0056a2' }} />
              <span>3. Replaced Parts &amp; Itemized Costs</span>
            </h2>

            {/* Interactive Parts Manager */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Replaced OEM Parts List
              </label>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="text"
                  value={newPartInput}
                  onChange={(e) => setNewPartInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPart();
                    }
                  }}
                  placeholder="e.g. NGK Iridium Spark Plug Set, Denso Alternator..."
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddPart}
                  className="autocare-garage-btn-primary"
                  style={{ padding: '8px 14px', fontSize: '13px' }}
                >
                  <Plus size={15} />
                  <span>Add Part</span>
                </button>
              </div>

              {/* Chips Display */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {partsList.map((part) => (
                  <span
                    key={part}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '12.5px',
                      color: '#0f172a',
                    }}
                  >
                    <span>{part}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePart(part)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Remove part"
                    >
                      <Trash2 size={13} style={{ color: '#ef4444' }} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Financials Input Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label
                  htmlFor="invoice-labour-cost"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
                >
                  Labour &amp; Inspection (LKR) *
                </label>
                <input
                  id="invoice-labour-cost"
                  type="number"
                  min="0"
                  step="100"
                  value={labourCost}
                  onChange={(e) => setLabourCost(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: errors.labourCost ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                    fontSize: '14px',
                  }}
                  required
                />
                {errors.labourCost && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ef4444' }}>{errors.labourCost}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="invoice-parts-cost"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
                >
                  Parts &amp; Consumables (LKR) *
                </label>
                <input
                  id="invoice-parts-cost"
                  type="number"
                  min="0"
                  step="100"
                  value={partsCost}
                  onChange={(e) => setPartsCost(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: errors.partsCost ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                    fontSize: '14px',
                  }}
                  required
                />
                {errors.partsCost && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ef4444' }}>{errors.partsCost}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="invoice-payment-terms"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
                >
                  Payment Terms
                </label>
                <select
                  id="invoice-payment-terms"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                  }}
                >
                  <option value="Immediate / On-Collection">Immediate / On-Collection</option>
                  <option value="Corporate Net 14 Days">Corporate Net 14 Days</option>
                  <option value="Corporate Net 30 Days">Corporate Net 30 Days</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 4: Owner Authorization */}
          <section className="autocare-garage-panel">
            <h2 className="autocare-garage-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} style={{ color: '#16a34a' }} />
              <span>4. Customer Authorization &amp; Cryptographic Attestation</span>
            </h2>

            <div
              style={{
                background: '#f8fafc',
                border: errors.consent ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px 16px',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={ownerAuthorized}
                  onChange={(e) => setOwnerAuthorized(e.target.checked)}
                  style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: '#003874' }}
                />
                <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                  <strong>Client Certified Authorization:</strong> The vehicle owner ({selectedVehicle.customer.name}) has inspected the completed work, verified odometer telemetry ({odometer} km), and cryptographically countersigned this invoice ledger entry.
                </div>
              </label>
              {errors.consent && (
                <p style={{ margin: '6px 0 0 26px', fontSize: '12px', color: '#ef4444' }}>{errors.consent}</p>
              )}
            </div>
          </section>
        </div>

        {/* ====================================================================
            RIGHT COLUMN: LIVE INVOICE SUMMARY
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
                  Live Invoice Total
                </h3>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: '#ecfdf5',
                  color: '#059669',
                }}
              >
                UNCOMMITTED
              </span>
            </div>

            {/* Vehicle spec summary */}
            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>BILL TO</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                {selectedVehicle.customer.name}
              </div>
              <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px' }}>
                {selectedVehicle.registration} · {selectedVehicle.make} {selectedVehicle.model}
              </div>
            </div>

            {/* Itemized financial preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#475569' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Invoice Date:</span>
                <strong>{invoiceDate}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Recorded Odometer:</span>
                <strong>{odometer} km</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Labour Cost:</span>
                <strong>LKR {numericLabour.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Parts Cost:</span>
                <strong>LKR {numericParts.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Items Subtotal:</span>
                <strong>LKR {subtotal.toLocaleString()}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={applyVat}
                    onChange={(e) => setApplyVat(e.target.checked)}
                  />
                  <span>VAT (18%):</span>
                </label>
                <strong>LKR {taxAmount.toLocaleString()}</strong>
              </div>
            </div>

            {/* Grand Total */}
            <div
              style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1.5px solid #003874',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '18px',
                fontWeight: 800,
                color: '#003874',
              }}
            >
              <span>Invoice Total:</span>
              <span>LKR {grandTotal.toLocaleString()}</span>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '22px' }}>
              <button
                type="button"
                onClick={handlePublishInvoice}
                disabled={isPublishing}
                className="autocare-garage-btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '12px 18px',
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                <Lock size={16} />
                <span>{isPublishing ? 'Issuing...' : 'Sign & Issue Invoice Record (Demo)'}</span>
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
                Save Invoice Draft
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Invoice Published Success Modal */}
      {showSuccessModal && (
        <div
          className="autocare-garage-modal-backdrop"
          onClick={() => setShowSuccessModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="autocare-garage-modal" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="autocare-garage-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={24} style={{ color: '#16a34a' }} />
                <h3>Invoice Anchored to Digital Passport</h3>
              </div>
            </div>

            <div className="autocare-garage-modal-body">
              <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                Invoice <strong>{invoiceNumber}</strong> (total <strong>LKR {grandTotal.toLocaleString()}</strong>) for vehicle <strong>{selectedVehicle.registration}</strong> has been sealed cryptographically on the SLT Mobitel Trust Network.
              </p>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontFamily: 'monospace',
                  fontSize: '11.5px',
                  color: '#0056a2',
                  wordBreak: 'break-all',
                  marginBottom: '16px',
                }}
              >
                TX_HASH: {signedTxHash}
              </div>

              <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>• Customer digital passport updated with verified telemetry</div>
                <div>• Receipt PDF dispatched to {selectedVehicle.customer.email}</div>
                <div>• Station certified by Perera Auto Works [BR-03]</div>
              </div>
            </div>

            <div className="autocare-garage-modal-footer">
              <button
                type="button"
                className="autocare-garage-hero-btn"
                style={{ background: '#f1f5f9', color: '#475569', marginRight: '8px' }}
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate(`/garage/vehicles/${selectedVehicle.id}`);
                }}
              >
                Back to Vehicle
              </button>

              <button
                type="button"
                className="autocare-garage-btn-primary"
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/garage/service-records');
                }}
              >
                Go to Service Records
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

export default GarageInvoicePage;
