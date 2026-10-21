import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Wrench,
  Car,
  ShieldCheck,
  CheckCircle2,
  X,
  Upload,
  Sparkles,
  FileText,
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import {
  MOCK_GARAGE_VEHICLES,
  getGarageVehicleById,
  type GarageVehicle,
} from './garageData';
import '../../styles/garage-dashboard.css';

interface FormErrors {
  vehicleId?: string;
  serviceDate?: string;
  mileage?: string;
  serviceType?: string;
  workPerformed?: string;
  labourCost?: string;
  partsCost?: string;
  consent?: string;
}

interface ToastState {
  show: boolean;
  message: string;
}

export const AddMaintenanceRecordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Selected vehicle from query parameter or default
  const initialVehicleId = searchParams.get('vehicleId') || MOCK_GARAGE_VEHICLES[0].id;
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(initialVehicleId);

  const selectedVehicle: GarageVehicle = useMemo(() => {
    return getGarageVehicleById(selectedVehicleId);
  }, [selectedVehicleId]);

  // Form Fields State
  const todayStr = new Date().toISOString().split('T')[0];
  const [serviceDate, setServiceDate] = useState<string>(todayStr);
  const [mileage, setMileage] = useState<string>(
    String(selectedVehicle.mileage ? selectedVehicle.mileage + 200 : 85000)
  );
  const [serviceType, setServiceType] = useState<string>('Routine Maintenance');

  // Garage & Technician Details
  const garageName = 'Perera Auto Works (Pvt) Ltd — Colombo 05 [BR-03]';
  const [technician, setTechnician] = useState<string>('Kaveesha Perera (Master Tech)');

  // Work & Parts State
  const [workPerformed, setWorkPerformed] = useState<string>('');
  const [partsList, setPartsList] = useState<string[]>([
    'Mobil 1 0W-20 Full Synthetic Oil (4L)',
    'OEM Oil Filter Element',
  ]);
  const [newPartInput, setNewPartInput] = useState<string>('');
  const [labourCost, setLabourCost] = useState<string>('8500');
  const [partsCost, setPartsCost] = useState<string>('16500');

  // Documents & Service Images State
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([
    'Invoice_Scan_PAW-2026-1021.pdf',
  ]);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([
    'engine_bay_before.jpg',
    'oil_filter_replaced.jpg',
  ]);

  // Owner consent checkbox
  const [ownerConsent, setOwnerConsent] = useState<boolean>(true);

  // Validation & UI State
  const [errors, setErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [publishedTxHash, setPublishedTxHash] = useState<string>('');

  // Dynamic Total Calculation: total = labour + parts
  const computedTotal = useMemo(() => {
    const l = parseFloat(labourCost) || 0;
    const p = parseFloat(partsCost) || 0;
    return Math.max(0, l + p);
  }, [labourCost, partsCost]);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  // Add Part handler
  const handleAddPart = () => {
    const trimmed = newPartInput.trim();
    if (!trimmed) return;
    if (partsList.includes(trimmed)) {
      showToast('Part already in list.');
      return;
    }
    setPartsList([...partsList, trimmed]);
    setNewPartInput('');
  };

  // Remove Part handler
  const handleRemovePart = (partToRemove: string) => {
    setPartsList(partsList.filter((p) => p !== partToRemove));
  };

  // AI OCR Demo simulation
  const handleSimulateOcr = () => {
    setWorkPerformed(
      'Full synthetic periodic lube service, replacement of engine oil & filter, brake caliper inspection, hybrid fan cleaning.'
    );
    setPartsList([
      'Mobil 1 0W-20 Advanced Fuel Economy (4L)',
      'Toyota Genuine Oil Filter 04152-YZZA6',
      'Cabin Micro-Air Filter',
    ]);
    setLabourCost('9500');
    setPartsCost('18500');
    if (!uploadedFiles.includes('AI_Extracted_PAW_JobSheet.pdf')) {
      setUploadedFiles([...uploadedFiles, 'AI_Extracted_PAW_JobSheet.pdf']);
    }
    showToast('AI OCR successfully parsed job sheet! Fields auto-populated with 98% confidence.');
  };

  // Validation function
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!selectedVehicleId) {
      newErrors.vehicleId = 'Please select a client vehicle.';
    }

    if (!serviceDate) {
      newErrors.serviceDate = 'Service date is required.';
    } else {
      const selected = new Date(serviceDate);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      if (selected > endOfToday) {
        newErrors.serviceDate = 'Service date cannot be in the future.';
      }
    }

    if (mileage === '' || isNaN(Number(mileage)) || Number(mileage) < 0) {
      newErrors.mileage = 'Odometer reading must be a non-negative number (>= 0).';
    }

    if (!serviceType.trim()) {
      newErrors.serviceType = 'Service type is required.';
    }

    if (!workPerformed.trim() || workPerformed.trim().length < 5) {
      newErrors.workPerformed = 'Description of work performed is required (min 5 characters).';
    }

    if (labourCost !== '' && (isNaN(Number(labourCost)) || Number(labourCost) < 0)) {
      newErrors.labourCost = 'Labour cost must be non-negative.';
    }

    if (partsCost !== '' && (isNaN(Number(partsCost)) || Number(partsCost) < 0)) {
      newErrors.partsCost = 'Parts cost must be non-negative.';
    }

    if (!ownerConsent) {
      newErrors.consent = 'Owner consent certification is required to publish service record (Demo Mode).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save Draft Handler (Frontend simulated)
  const handleSaveDraft = () => {
    showToast(
      `Draft record for ${selectedVehicle.registration} saved locally. You can resume editing anytime.`
    );
  };

  // Publish Verified Record Handler
  const handlePublishRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please correct validation errors before publishing.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const generatedHash = `0x${Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;
      setPublishedTxHash(generatedHash);
      setShowSuccessModal(true);
    }, 800);
  };

  return (
    <GarageLayout activeItem="Service records" breadcrumbCurrent="Add Maintenance Record">
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
            onClick={() => navigate('/garage/service-records')}
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
            <span>Back to Service Records</span>
          </button>
          <h1 className="autocare-garage-main-title" style={{ margin: 0 }}>
            Add Verified Maintenance Record
          </h1>
          <p className="autocare-garage-main-subtitle">
            Commit immutable maintenance entries to the client's Digital Passport on the SLT Mobitel Trust Network.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 800,
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              background: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fde68a',
              padding: '4px 10px',
              borderRadius: '6px',
            }}
          >
            DRAFT · NOT COMMITTED
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1fr)',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* ====================================================================
            LEFT COLUMN: FORM SECTIONS
            ==================================================================== */}
        <form onSubmit={handlePublishRecord} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* AI OCR Scanner Banner / Drop-Zone */}
          <div
            style={{
              background: 'linear-gradient(135deg, #003874 0%, #0056a2 100%)',
              borderRadius: '12px',
              padding: '20px 22px',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(0, 56, 116, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', maxWidth: '520px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.15)',
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
                  Scan Physical Job Card / Invoice (Simulate OCR Extraction)
                </h3>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.85)' }}>
                  Optical recognition extracts parts, labour, and odometer telemetry automatically.
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
              Simulate Demo OCR Scan
            </button>
          </div>

          {/* Section 1: Vehicle & service */}
          <section className="autocare-garage-panel">
            <h2 className="autocare-garage-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Car size={18} style={{ color: '#0056a2' }} />
              <span>1. Vehicle &amp; Service Information</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Vehicle Selector */}
              <div>
                <label
                  htmlFor="vehicle-select"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
                >
                  Client Vehicle *
                </label>
                <select
                  id="vehicle-select"
                  value={selectedVehicleId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedVehicleId(nextId);
                    const veh = getGarageVehicleById(nextId);
                    if (veh) {
                      setMileage(String(veh.mileage + 200));
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

                {/* Selected vehicle quick snapshot pill */}
                <div
                  style={{
                    marginTop: '10px',
                    padding: '10px 14px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '14px',
                    fontSize: '12.5px',
                    color: '#475569',
                  }}
                >
                  <span>
                    <strong>VIN:</strong> <code style={{ color: '#0056a2' }}>{selectedVehicle.vin}</code>
                  </span>
                  <span>
                    <strong>Registered Owner:</strong> {selectedVehicle.customer.name} ({selectedVehicle.customer.phone})
                  </span>
                  <span>
                    <strong>Last Known Odometer:</strong> {selectedVehicle.mileage.toLocaleString()} km
                  </span>
                </div>
              </div>

              {/* Date, Odometer, Service Type Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                {/* Service Date */}
                <div>
                  <label
                    htmlFor="service-date"
                    style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
                  >
                    Service Date *
                  </label>
                  <input
                    id="service-date"
                    type="date"
                    max={todayStr}
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: errors.serviceDate ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      boxSizing: 'border-box',
                    }}
                  />
                  {errors.serviceDate ? (
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ef4444' }}>{errors.serviceDate}</p>
                  ) : (
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>Future dates blocked</span>
                  )}
                </div>

                {/* Odometer */}
                <div>
                  <label
                    htmlFor="odometer-input"
                    style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
                  >
                    Odometer (km) *
                  </label>
                  <input
                    id="odometer-input"
                    type="number"
                    min="0"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder="e.g. 85500"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: errors.mileage ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      boxSizing: 'border-box',
                    }}
                  />
                  {errors.mileage ? (
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ef4444' }}>{errors.mileage}</p>
                  ) : (
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>Must be non-negative</span>
                  )}
                </div>

                {/* Service Type */}
                <div>
                  <label
                    htmlFor="service-type-select"
                    style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
                  >
                    Service Type *
                  </label>
                  <select
                    id="service-type-select"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: errors.serviceType ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: '13.5px',
                    }}
                  >
                    <option value="Routine Maintenance">Routine Maintenance</option>
                    <option value="Major Overhaul">Major Overhaul</option>
                    <option value="Brake System Overhaul">Brake System Overhaul</option>
                    <option value="Transmission Fluid Flush">Transmission Fluid Flush</option>
                    <option value="Hybrid Battery Conditioning">Hybrid Battery Conditioning</option>
                    <option value="Suspension & Steering Repair">Suspension &amp; Steering Repair</option>
                    <option value="Engine Diagnostics & Tune">Engine Diagnostics &amp; Tune</option>
                    <option value="Electrical Repair">Electrical Repair</option>
                    <option value="AC & HVAC Service">AC &amp; HVAC Service</option>
                  </select>
                  {errors.serviceType && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ef4444' }}>{errors.serviceType}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Garage & technician details */}
          <section className="autocare-garage-panel">
            <h2 className="autocare-garage-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} style={{ color: '#0056a2' }} />
              <span>2. Garage &amp; Technician Details</span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Authorized Inspection Station
                </label>
                <input
                  type="text"
                  value={garageName}
                  disabled
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f1f5f9',
                    color: '#334155',
                    fontSize: '13px',
                    fontWeight: 600,
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 600, marginTop: '4px', display: 'inline-block' }}>
                  ✓ SLT-Certified Level 4 Repair Workshop (BR-03)
                </span>
              </div>

              <div>
                <label
                  htmlFor="tech-select"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
                >
                  Assigned Lead Technician *
                </label>
                <select
                  id="tech-select"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                  }}
                >
                  <option value="Kaveesha Perera (Master Tech)">Kaveesha Perera (Master Tech)</option>
                  <option value="Chaminda Rathnayake (Senior Tech)">Chaminda Rathnayake (Senior Tech)</option>
                  <option value="Sunil Weerasinghe (Electrical Specialist)">Sunil Weerasinghe (Electrical Specialist)</option>
                  <option value="Dinesh Gamage (Brake Specialist)">Dinesh Gamage (Brake Specialist)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 3: Work & parts */}
          <section className="autocare-garage-panel">
            <h2 className="autocare-garage-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wrench size={18} style={{ color: '#0056a2' }} />
              <span>3. Work Performed &amp; Parts Ledger</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Work Performed Description */}
              <div>
                <label
                  htmlFor="work-performed-input"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
                >
                  Work Performed Description *
                </label>
                <textarea
                  id="work-performed-input"
                  rows={4}
                  value={workPerformed}
                  onChange={(e) => setWorkPerformed(e.target.value)}
                  placeholder="Detail the mechanical or electrical actions completed, diagnostics run, and fluid specs..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: errors.workPerformed ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
                {errors.workPerformed && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ef4444' }}>{errors.workPerformed}</p>
                )}
              </div>

              {/* Parts Replaced */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Parts Replaced / Installed
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
                    placeholder="Enter part name / part number (e.g. Front Brake Pads Ceramic)"
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
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    <Plus size={15} />
                    <span>Add Part</span>
                  </button>
                </div>

                {/* Parts Tag Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {partsList.map((part) => (
                    <span
                      key={part}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#f1f5f9',
                        color: '#1e293b',
                        border: '1px solid #cbd5e1',
                        borderRadius: '20px',
                        padding: '4px 12px',
                        fontSize: '12.5px',
                        fontWeight: 600,
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
                          color: '#64748b',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        aria-label={`Remove part ${part}`}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  {partsList.length === 0 && (
                    <span style={{ fontSize: '12.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                      No parts added yet.
                    </span>
                  )}
                </div>
              </div>

              {/* Cost Inputs & Dynamic Calculation */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '16px',
                  alignItems: 'center',
                }}
              >
                <div>
                  <label
                    htmlFor="labour-cost-input"
                    style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}
                  >
                    Labour Cost (LKR)
                  </label>
                  <input
                    id="labour-cost-input"
                    type="number"
                    min="0"
                    value={labourCost}
                    onChange={(e) => setLabourCost(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: errors.labourCost ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                  {errors.labourCost && (
                    <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#ef4444' }}>{errors.labourCost}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="parts-cost-input"
                    style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}
                  >
                    Parts Cost (LKR)
                  </label>
                  <input
                    id="parts-cost-input"
                    type="number"
                    min="0"
                    value={partsCost}
                    onChange={(e) => setPartsCost(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: errors.partsCost ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                  {errors.partsCost && (
                    <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#ef4444' }}>{errors.partsCost}</p>
                  )}
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Calculated Total (LKR)
                  </span>
                  <div
                    style={{
                      padding: '9px 14px',
                      borderRadius: '8px',
                      background: '#003874',
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>LKR</span>
                    <span>{computedTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Documents & service images */}
          <section className="autocare-garage-panel">
            <h2 className="autocare-garage-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} style={{ color: '#0056a2' }} />
              <span>4. Documents &amp; Service Images</span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {/* Document upload drop-zone */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Attached Invoices &amp; Inspection Reports
                </label>
                <div
                  onClick={() => {
                    const newDoc = `Invoice_PAW_${Date.now().toString().slice(-4)}.pdf`;
                    setUploadedFiles([...uploadedFiles, newDoc]);
                    showToast(`Simulated upload of ${newDoc}`);
                  }}
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Upload size={20} style={{ color: '#0056a2', margin: '0 auto 6px auto' }} />
                  <p style={{ margin: 0, fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>
                    Click to add Invoice / Work Order PDF
                  </p>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>PDF, PNG, JPG up to 10MB</span>
                </div>

                {/* Uploaded files list */}
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: '#f1f5f9',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    >
                      <span style={{ color: '#334155', fontWeight: 600 }}>{file}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx));
                        }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service images placeholder */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Before &amp; After Inspection Photos
                </label>
                <div
                  onClick={() => {
                    const newPhoto = `repair_photo_${Date.now().toString().slice(-4)}.jpg`;
                    setUploadedPhotos([...uploadedPhotos, newPhoto]);
                    showToast(`Simulated photo attachment: ${newPhoto}`);
                  }}
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ImageIcon size={20} style={{ color: '#059669', margin: '0 auto 6px auto' }} />
                  <p style={{ margin: 0, fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>
                    Click to attach component photos
                  </p>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Geo-tagged and hash-verified</span>
                </div>

                {/* Attached photos chips */}
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {uploadedPhotos.map((photo, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#ecfdf5',
                        color: '#065f46',
                        border: '1px solid #a7f3d0',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                      }}
                    >
                      <span>{photo}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== idx));
                        }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0 }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Owner consent & certification */}
          <section
            style={{
              background: '#ffffff',
              border: errors.consent ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '18px 22px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={ownerConsent}
                onChange={(e) => setOwnerConsent(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  marginTop: '2px',
                  cursor: 'pointer',
                }}
              />
              <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.45' }}>
                <strong style={{ color: '#0f172a' }}>Owner Authorization &amp; Cryptographic Certification:</strong>{' '}
                I certify that the vehicle owner ({selectedVehicle.customer.name}) has authorized these repairs and the
                information accurately reflects work performed at Perera Auto Works. An OTP verification notification
                will be sent to the owner's phone ({selectedVehicle.customer.phone}).
              </div>
            </label>
            {errors.consent && (
              <p style={{ margin: '8px 0 0 30px', fontSize: '12px', color: '#ef4444' }}>{errors.consent}</p>
            )}
          </section>
        </form>

        {/* ====================================================================
            RIGHT COLUMN: STICKY RECORD SUMMARY CARD
            ==================================================================== */}
        <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Summary Card */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '22px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '14px',
                borderBottom: '1px solid #f1f5f9',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Record Summary
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  background: '#ecfdf5',
                  color: '#059669',
                  padding: '2px 8px',
                  borderRadius: '10px',
                }}
              >
                READY TO AUDIT
              </span>
            </div>

            {/* Vehicle & Customer summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Vehicle</span>
                <strong style={{ color: '#0f172a' }}>{selectedVehicle.registration}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Model</span>
                <span style={{ color: '#334155' }}>
                  {selectedVehicle.make} {selectedVehicle.model}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Customer</span>
                <strong style={{ color: '#0f172a' }}>{selectedVehicle.customer.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Service Date</span>
                <strong style={{ color: '#0056a2' }}>{serviceDate || '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Odometer</span>
                <strong style={{ color: '#0f172a' }}>
                  {mileage ? `${Number(mileage).toLocaleString()} km` : '—'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Category</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#0284c7',
                    background: '#e0f2fe',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {serviceType}
                </span>
              </div>
            </div>

            {/* Financial Ledger Section */}
            <div
              style={{
                marginTop: '16px',
                paddingTop: '14px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Labour Cost</span>
                <span>LKR {(parseFloat(labourCost) || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Parts ({partsList.length} items)</span>
                <span>LKR {(parseFloat(partsCost) || 0).toLocaleString()}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px dashed #cbd5e1',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#0f172a',
                }}
              >
                <span>Total Ledger Amount</span>
                <span style={{ color: '#003874' }}>LKR {computedTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Blockchain Node Proof Preview */}
            <div
              style={{
                marginTop: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
                padding: '12px',
                border: '1px solid #e2e8f0',
                fontSize: '11.5px',
                color: '#64748b',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 700, marginBottom: '4px' }}>
                <ShieldCheck size={14} />
                <span>Security & Verification Audit Anchor (Demo)</span>
              </div>
              <div>Station Node: <code>SLT-PAW-COL05-NODE</code></div>
              <div>Payload Hash: <code>0x7f2a...981c</code></div>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={handlePublishRecord}
                disabled={isSubmitting}
                className="autocare-garage-btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                <ShieldCheck size={18} />
                <span>{isSubmitting ? 'Publishing Record...' : 'Publish Service Record'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                className="autocare-garage-hero-btn"
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  padding: '10px',
                }}
              >
                Save Draft
              </button>

              {/* Optional Next Actions */}
              <div
                style={{
                  marginTop: '10px',
                  paddingTop: '10px',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <button
                  type="button"
                  onClick={() => navigate(`/garage/quotation/new?vehicleId=${selectedVehicle.id}`)}
                  className="autocare-garage-action-link"
                  style={{ fontSize: '11.5px', color: '#0056a2', fontWeight: 600 }}
                >
                  + Generate Quotation
                </button>
                <span style={{ color: '#cbd5e1' }}>·</span>
                <button
                  type="button"
                  onClick={() => navigate(`/garage/invoice/new?vehicleId=${selectedVehicle.id}`)}
                  className="autocare-garage-action-link"
                  style={{ fontSize: '11.5px', color: '#059669', fontWeight: 600 }}
                >
                  + Create Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          SUCCESS PUBLISHED MODAL
          ==================================================================== */}
      {showSuccessModal && (
        <div
          className="autocare-garage-modal-backdrop"
          onClick={() => setShowSuccessModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="autocare-garage-modal"
            style={{ maxWidth: '520px', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="autocare-garage-modal-body" style={{ padding: '32px 24px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}
              >
                <Check size={36} />
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                Maintenance Record Published!
              </h2>
              <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 20px 0' }}>
                Tamper-proof entry committed to <strong>{selectedVehicle.registration}</strong> digital passport ledger.
              </p>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px',
                  textAlign: 'left',
                  fontSize: '12.5px',
                  marginBottom: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Vehicle</span>
                  <strong>{selectedVehicle.registration} ({selectedVehicle.make} {selectedVehicle.model})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Amount Billed</span>
                  <strong>LKR {computedTotal.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Ledger Transaction</span>
                  <code style={{ fontSize: '11px', color: '#0056a2' }}>{publishedTxHash.slice(0, 16)}...</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Customer OTP Verification</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>SMS Sent to {selectedVehicle.customer.phone}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="autocare-garage-btn-primary"
                    onClick={() => navigate('/garage/service-records')}
                  >
                    View in Service Records
                  </button>
                  <button
                    type="button"
                    className="autocare-garage-hero-btn"
                    style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}
                    onClick={() => navigate(`/garage/vehicles/${selectedVehicle.id}`)}
                  >
                    View Vehicle Passport
                  </button>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '4px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                    Optional Next Steps for {selectedVehicle.registration}:
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="autocare-garage-hero-btn"
                      style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontSize: '12.5px' }}
                      onClick={() => navigate(`/garage/invoice/new?vehicleId=${selectedVehicle.id}`)}
                    >
                      <FileText size={14} style={{ marginRight: '4px' }} />
                      <span>Create Invoice</span>
                    </button>
                    <button
                      type="button"
                      className="autocare-garage-hero-btn"
                      style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', fontSize: '12.5px' }}
                      onClick={() => navigate(`/garage/quotation/new?vehicleId=${selectedVehicle.id}`)}
                    >
                      <Plus size={14} style={{ marginRight: '4px' }} />
                      <span>Generate Quotation</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
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

export default AddMaintenanceRecordPage;
