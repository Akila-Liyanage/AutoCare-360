import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Camera, 
  PlusCircle, 
  Calendar, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Zap, 
  Car 
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../hooks/useAuth';
import { 
  getMyVehicles, 
  createVehicle, 
  uploadVehicleImage, 
  type Vehicle, 
  type CreateVehiclePayload 
} from '../../services/vehicleService';
import { resolveImageUrl } from '../../utils/imageUrl';

export const AddVehiclePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialVeh = (
    location.state as {
      initialVehicle?: {
        manufacturer?: string;
        model?: string;
        manufacturingYear?: string | number;
        vin?: string;
        registrationNumber?: string;
        currentMileage?: string | number;
      };
    } | null
  )?.initialVehicle;

  // Top Preview Section State (GET /api/vehicles)
  const [existingVehicles, setExistingVehicles] = useState<Vehicle[]>([]);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(true);

  // Form State
  const [formData, setFormData] = useState(() => ({
    manufacturer: initialVeh?.manufacturer || '',
    model: initialVeh?.model || '',
    manufacturingYear: initialVeh?.manufacturingYear ? Number(initialVeh.manufacturingYear) : 2024,
    vehicleType: 'Sedan',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'Deep Metallic Blue',
    customColor: '',
    vin: initialVeh?.vin || '',
    registrationNumber: initialVeh?.registrationNumber || '',
    engineNumber: '',
    registrationJurisdiction: 'Western Province, Sri Lanka',
    currentMileage: initialVeh?.currentMileage ?? ('' as string | number),
    lastServiceDate: '',
    nextServiceMileage: '' as string | number,
    contactPhone: user?.phone || '',
  }));

  // Local Image Upload Preview State (Object URL for memory safety and zero network bloat)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const imagePreviewRef = useRef<string | null>(null);

  // Validation & Submission States
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [vinError, setVinError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Keep ref synchronized for unmount cleanup
  useEffect(() => {
    imagePreviewRef.current = imagePreview;
  }, [imagePreview]);

  // Clean up Object URL on unmount to prevent browser memory leaks
  useEffect(() => {
    return () => {
      if (imagePreviewRef.current && imagePreviewRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewRef.current);
      }
    };
  }, []);

  // Load existing vehicles for the top preview section
  useEffect(() => {
    let isMounted = true;
    getMyVehicles()
      .then((data) => {
        if (isMounted) {
          setExistingVehicles(data);
          setLoadingPreview(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadingPreview(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // VIN live uppercase and validation
  const handleVinChange = (val: string) => {
    const uppercaseVal = val.toUpperCase().trim();
    setFormData((prev) => ({ ...prev, vin: uppercaseVal }));

    // VIN validation (17 characters alphanumeric without I, O, Q)
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    if (uppercaseVal.length === 0) {
      setVinError(null);
    } else if (uppercaseVal.length !== 17) {
      setVinError('VIN must be exactly 17 alphanumeric characters.');
    } else if (!vinRegex.test(uppercaseVal)) {
      setVinError('Invalid VIN format (letters I, O, and Q are prohibited by ISO 3779).');
    } else {
      setVinError(null);
    }
  };

  // Image Selection Handler (stores file for upload and generates object URL preview)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setSubmitError('Please select a valid image file (PNG, JPG, WEBP).');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setSubmitError('Image size must be less than 10MB. Please choose a smaller photo.');
        return;
      }

      // Revoke old object URL if present to release memory
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }

      setSelectedImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
      setSelectedFile(file);
      setSubmitError(null);
    }
  };

  // Preset Colors from Figma
  const colorPresets = [
    'Deep Metallic Blue',
    'Arctic White',
    'Solid Black Metallic',
    'Chalk Crayon Grey',
    'Guards Red',
  ];

  // Development-Only Quick Fill Helper
  const handleQuickFill = () => {
    setFormData({
      registrationNumber: 'CAA-1234',
      vin: 'JTDKN3DU5F1234567',
      manufacturer: 'Toyota',
      model: 'Corolla',
      manufacturingYear: 2022,
      currentMileage: 24500,
      vehicleType: 'Sedan',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      engineNumber: '2ZRFE98765',
      color: 'Pearl White',
      customColor: 'Pearl White',
      registrationJurisdiction: 'Western Province, Sri Lanka',
      lastServiceDate: '2026-05-15',
      nextServiceMileage: 29500,
      contactPhone: user?.phone || '077-0603956',
    });
    setVinError(null);
    setSubmitError(null);
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccessBanner(null);

    // Basic Validation
    if (!formData.manufacturer.trim()) {
      setSubmitError('Manufacturer / Make is required.');
      return;
    }
    if (!formData.model.trim()) {
      setSubmitError('Model & Specification Trim is required.');
      return;
    }
    const currentYear = new Date().getFullYear();
    const yearNum = Number(formData.manufacturingYear);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
      setSubmitError(`Manufacturing Year must be between 1900 and ${currentYear + 1}.`);
      return;
    }
    if (!formData.vin.trim()) {
      setVinError('Vehicle Identification Number (VIN) is required.');
      return;
    }
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    if (!vinRegex.test(formData.vin.trim())) {
      setVinError('Invalid VIN Number. Must be 17 characters excluding letters I, O, and Q.');
      return;
    }
    if (!formData.registrationNumber.trim()) {
      setSubmitError('License Plate / Registration is required.');
      return;
    }
    if (formData.currentMileage === '' || isNaN(Number(formData.currentMileage)) || Number(formData.currentMileage) < 0) {
      setSubmitError('Current Odometer Mileage must be a valid non-negative number.');
      return;
    }

    const effectiveColor = formData.customColor.trim() || formData.color;

    setSubmitting(true);
    try {
      const fileToUpload = selectedFile || selectedImageFile;
      let uploadedImageUrl = '';
      if (fileToUpload) {
        uploadedImageUrl = await uploadVehicleImage(fileToUpload);
      }

      const payload: CreateVehiclePayload = {
        registrationNumber: formData.registrationNumber.trim().toUpperCase(),
        vin: formData.vin.trim().toUpperCase(),
        engineNumber: formData.engineNumber.trim().toUpperCase() || undefined,
        vehicleType: formData.vehicleType,
        manufacturer: formData.manufacturer.trim(),
        model: formData.model.trim(),
        manufacturingYear: Number(formData.manufacturingYear),
        currentMileage: Number(formData.currentMileage),
        fuelType: formData.fuelType,
        transmission: formData.transmission,
        color: effectiveColor,
        registrationJurisdiction: formData.registrationJurisdiction.trim() || 'Western Province, Sri Lanka',
        lastServiceDate: formData.lastServiceDate ? formData.lastServiceDate : null,
        nextServiceMileage: formData.nextServiceMileage ? Number(formData.nextServiceMileage) : null,
        imageUrl: uploadedImageUrl || '',
        status: 'Active',
      };

      await createVehicle(payload);
      setSuccessBanner('Vehicle digital passport created successfully! Redirecting...');
      setTimeout(() => {
        navigate('/vehicles');
      }, 1000);
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : 'Unable to create vehicle passport. Please try again.';
      if (
        msg.includes('11000') ||
        msg.toLowerCase().includes('duplicate') ||
        msg.toLowerCase().includes('already registered') ||
        msg.toLowerCase().includes('already exists')
      ) {
        msg = 'A vehicle with this VIN or Registration Number is already registered in the system.';
      } else if (
        msg.toLowerCase().includes('entity too large') ||
        msg.toLowerCase().includes('payload too large') ||
        msg.includes('413')
      ) {
        msg = 'The selected image is too large. Please choose another image.';
      }
      setSubmitError(msg);
      setSubmitting(false);
    }
  };

  // Helper for top preview mileage formatting
  const formatMileage = (km?: number): string => {
    if (km === undefined || km === null || isNaN(km)) return '0 km';
    return `${km.toLocaleString()} km`;
  };

  return (
    <div className="autocare-add-vehicle-page">
      <Navbar />

      <main className="autocare-add-vehicle-main">
        <div className="autocare-add-vehicle-container">
          
          {/* ========================================================
              TOP SECTION: My Vehicles Preview Area (Matching Figma)
              ======================================================== */}
          <section className="autocare-add-page-preview-section">
            <div className="autocare-my-vehicles-header">
              <h2 className="autocare-my-vehicles-title">My Vehicles</h2>
              <Link to="/vehicles" className="autocare-my-vehicles-view-all">
                View All
              </Link>
            </div>

            {loadingPreview ? (
              <div className="autocare-vehicles-grid">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="autocare-vehicle-card is-skeleton">
                    <div className="autocare-card-image-wrapper is-skeleton-box" />
                    <div className="autocare-card-body is-skeleton-body">
                      <div className="autocare-skeleton-line is-title" />
                      <div className="autocare-skeleton-line is-meta" />
                    </div>
                    <div className="autocare-card-edit-btn is-skeleton-btn" />
                  </div>
                ))}
              </div>
            ) : existingVehicles.length > 0 ? (
              <div className="autocare-vehicles-grid">
                {existingVehicles.slice(0, 3).map((v) => {
                  const seed = (v.manufacturingYear || 2022) + (v.model?.length || 0);
                  const isHigh = seed % 2 === 0;
                  const score = isHigh ? 92 : 78;
                  const resolvedImg = resolveImageUrl(v.imageUrl?.trim());

                  return (
                    <div key={v._id} className="autocare-vehicle-card">
                      <div className="autocare-card-image-wrapper">
                        {resolvedImg ? (
                          <img 
                            src={resolvedImg} 
                            alt={`${v.manufacturer} ${v.model}`} 
                            className="autocare-card-img"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '100%',
                              height: '100%',
                              backgroundColor: '#f1f5f9',
                              color: '#64748b',
                              gap: '6px'
                            }}
                          >
                            <Car size={32} style={{ color: '#94a3b8' }} />
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>No vehicle image</span>
                          </div>
                        )}
                        <button
                          type="button"
                          className="autocare-card-remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            alert('Vehicle deletion is restricted in this phase.');
                          }}
                          title="Remove Vehicle"
                        >
                          <Trash2 size={12} />
                          <span>Remove</span>
                        </button>
                      </div>

                      <div className="autocare-card-body">
                        <div className="autocare-card-title-row">
                          <h3 className="autocare-card-title">
                            {v.manufacturer} {v.model} {v.manufacturingYear}
                          </h3>
                          <span className={`autocare-trust-score-badge ${isHigh ? 'is-high' : 'is-mid'}`}>
                            {score}%
                          </span>
                        </div>
                        <div className="autocare-card-meta-row">
                          <span className="autocare-card-reg-number">{v.registrationNumber}</span>
                          <span className="autocare-card-mileage">{formatMileage(v.currentMileage)}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="autocare-card-edit-btn"
                        onClick={() => navigate(`/vehicles/${v._id}`)}
                      >
                        <Edit3 size={15} />
                        <span>Edit</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>


          {/* ========================================================
              MAIN FORM CONTAINER (Matching "Add vehicle(1).png")
              ======================================================== */}
          <div className="autocare-form-card-container">
            {/* Top Navigation Row: Back Link & Digital Onboarding Badge */}
            <div className="autocare-form-top-nav">
              <Link to="/vehicles" className="autocare-form-back-link">
                <ArrowLeft size={16} />
                <span>Back To Passport</span>
              </Link>
              <span className="autocare-onboarding-badge">
                Digital Vehicle Onboarding
              </span>
            </div>

            {/* Form Main Heading & Subtitle */}
            <div className="autocare-form-heading-block">
              <h1 className="autocare-form-main-title">
                Add New Vehicle To Digital Passport
              </h1>
              <p className="autocare-form-main-subtitle">
                Register A New Vehicle With Verified VIN, Chassis Telemetry, Ownership Records, And Custom Image Upload.
              </p>
            </div>

            {/* Error Banner */}
            {submitError && (
              <div className="autocare-error-banner" role="alert">
                <span>{submitError}</span>
                <button type="button" onClick={() => setSubmitError(null)} aria-label="Close error">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Success Banner */}
            {successBanner && (
              <div className="autocare-success-banner" role="status">
                <Check size={18} />
                <span>{successBanner}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              
              {/* ----------------------------------------------------
                  SECTION 1: Image Uploading Options
                  ---------------------------------------------------- */}
              <div className="autocare-form-section">
                <div className="autocare-section-title-row">
                  <div className="autocare-section-num-circle">1</div>
                  <div>
                    <h2 className="autocare-section-heading">Image Uploading Options</h2>
                    <p className="autocare-section-subtext">
                      Upload Your Vehicle&apos;s Photo Or Choose From Certified High-Res Vehicle Presets.
                    </p>
                  </div>
                </div>

                <div 
                  className="autocare-upload-box"
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      fileInputRef.current?.click();
                    }
                  }}
                  aria-label="Upload vehicle photo"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                    accept="image/*"
                    style={{ display: 'none' }} 
                  />

                  {imagePreview ? (
                    <div className="autocare-upload-preview-wrap">
                      <img 
                        src={imagePreview} 
                        alt="Vehicle preview" 
                        className="autocare-upload-preview-img" 
                      />
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center', marginTop: '8px' }}>
                        <span className="autocare-upload-change-text" style={{ margin: 0 }}>
                          Click to change photo
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (imagePreview && imagePreview.startsWith('blob:')) {
                              URL.revokeObjectURL(imagePreview);
                            }
                            setImagePreview(null);
                            setSelectedFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          style={{
                            background: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fca5a5',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Remove Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="autocare-upload-placeholder">
                      <Camera size={38} className="autocare-upload-camera-icon" />
                      <strong className="autocare-upload-prompt-title">Upload Vehicle Photo</strong>
                      <span className="autocare-upload-prompt-sub">Include front view &amp; license plate</span>
                    </div>
                  )}
                </div>

                <div className="autocare-upload-document-link-row">
                  <button 
                    type="button" 
                    className="autocare-upload-document-link"
                    onClick={() => alert('Document attachment will be enabled in Phase 2E.')}
                  >
                    Add vihical document
                  </button>
                </div>
              </div>


              {/* ----------------------------------------------------
                  SECTION 2: Core Vehicle Specifications
                  ---------------------------------------------------- */}
              <div className="autocare-form-section">
                <div className="autocare-section-title-row">
                  <div className="autocare-section-num-circle">2</div>
                  <div>
                    <h2 className="autocare-section-heading">Core Vehicle Specifications</h2>
                    <p className="autocare-section-subtext">
                      Specify Manufacturer, Model, Body Archetype, And Powertrain Configuration.
                    </p>
                  </div>
                </div>

                <div className="autocare-form-grid is-3-cols">
                  {/* Manufacturer / Make */}
                  <div className="autocare-form-field">
                    <label className="autocare-field-label">
                      Manufacturer / Make <span className="autocare-required">*</span>
                    </label>
                    <input
                      type="text"
                      className="autocare-field-input"
                      placeholder="e.g. Porsche, Tesla, BMW, Toyota"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      required
                    />
                  </div>

                  {/* Model & Specification Trim */}
                  <div className="autocare-form-field">
                    <label className="autocare-field-label">
                      Model &amp; Specification Trim <span className="autocare-required">*</span>
                    </label>
                    <input
                      type="text"
                      className="autocare-field-input"
                      placeholder="e.g. Taycan 4S Cross Turismo"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      required
                    />
                  </div>

                  {/* Manufacturing Year */}
                  <div className="autocare-form-field">
                    <label className="autocare-field-label">
                      Manufacturing Year <span className="autocare-required">*</span>
                    </label>
                    <select
                      className="autocare-field-select"
                      value={formData.manufacturingYear}
                      onChange={(e) => setFormData({ ...formData, manufacturingYear: Number(e.target.value) })}
                    >
                      {Array.from({ length: 35 }, (_, idx) => 2026 - idx).map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="autocare-form-grid is-3-cols">
                  {/* Body & Vehicle Category */}
                  <div className="autocare-form-field">
                    <label className="autocare-field-label">Body &amp; Vehicle Category</label>
                    <select
                      className="autocare-field-select"
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    >
                      <option value="Sedan">Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="Hatchback">Hatchback</option>
                      <option value="Van">Van</option>
                      <option value="Pickup Truck">Pickup Truck</option>
                      <option value="Coupe">Coupe</option>
                      <option value="Wagon">Wagon</option>
                      <option value="Convertible">Convertible</option>
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Powertrain & Fuel Type */}
                  <div className="autocare-form-field">
                    <label className="autocare-field-label">Powertrain &amp; Fuel Type</label>
                    <select
                      className="autocare-field-select"
                      value={formData.fuelType}
                      onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Electric">Electric (Battery EV)</option>
                      <option value="Plug-in Hybrid">Plug-in Hybrid</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Transmission */}
                  <div className="autocare-form-field">
                    <label className="autocare-field-label">Transmission</label>
                    <select
                      className="autocare-field-select"
                      value={formData.transmission}
                      onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                    >
                      <option value="Automatic">Automatic transmission</option>
                      <option value="Manual">Manual transmission</option>
                      <option value="CVT">CVT</option>
                      <option value="Dual-Clutch">Dual-Clutch</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Exterior Color Finish Chips */}
                <div className="autocare-form-field" style={{ marginTop: '14px' }}>
                  <label className="autocare-field-label">Exterior Color Finish</label>
                  <div className="autocare-color-chips-row">
                    {colorPresets.map((preset) => {
                      const isSelected = formData.color === preset && !formData.customColor;
                      return (
                        <button
                          key={preset}
                          type="button"
                          className={`autocare-color-chip ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => setFormData({ ...formData, color: preset, customColor: '' })}
                        >
                          {preset}
                        </button>
                      );
                    })}

                    {/* Custom Color Input Chip */}
                    <input
                      type="text"
                      placeholder="Other Color..."
                      className="autocare-custom-color-input"
                      value={formData.customColor}
                      onChange={(e) => setFormData({ ...formData, customColor: e.target.value })}
                    />
                  </div>
                </div>
              </div>


              {/* ----------------------------------------------------
                  SECTION 3: Government & Chassis Identifiers (BR-01)
                  ---------------------------------------------------- */}
              <div className="autocare-form-section">
                <div className="autocare-section-title-row">
                  <div className="autocare-section-num-circle">3</div>
                  <div>
                    <h2 className="autocare-section-heading">Government &amp; Chassis Identifiers (BR-01)</h2>
                    <p className="autocare-section-subtext">
                      Crucial Tamper-Proof Identifiers Matching The Vehicle Title And Chassis Plate.
                    </p>
                  </div>
                </div>

                <div className="autocare-form-grid is-2-cols">
                  {/* VIN with live 0/17 counter */}
                  <div className="autocare-form-field">
                    <div className="autocare-field-label-row">
                      <label className="autocare-field-label">
                        Vehicle Identification Number (VIN) <span className="autocare-required">*</span>
                      </label>
                      <span className="autocare-vin-counter">
                        {formData.vin.length}/17 Characters
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={17}
                      className={`autocare-field-input ${vinError ? 'is-error' : ''}`}
                      placeholder="E.G. WPOAA2Y18RSA91823"
                      value={formData.vin}
                      onChange={(e) => handleVinChange(e.target.value)}
                      required
                    />
                    <span className="autocare-field-subtext">
                      Standard 17-Character ISO 3779 Compliant Serial Stamped On The Driver-Side Door Jamb And Windshield.
                    </span>
                  </div>

                  {/* License Plate / Registration */}
                  <div className="autocare-form-field">
                    <label className="autocare-field-label">
                      License Plate / Registration <span className="autocare-required">*</span>
                    </label>
                    <input
                      type="text"
                      className="autocare-field-input"
                      placeholder="e.g. cab-9241 or zh-891044"
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                </div>

                <div className="autocare-form-grid is-2-cols" style={{ marginTop: '16px' }}>
                  {/* Engine # / Motor Serial */}
                  <div className="autocare-form-field">
                    <label className="autocare-field-label">
                      Engine # / Motor Serial <span className="autocare-required">*</span>
                    </label>
                    <input
                      type="text"
                      className="autocare-field-input"
                      placeholder="E.G. ENG-2024-8849"
                      value={formData.engineNumber}
                      onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  {/* Registration Jurisdiction / Region */}
                  <div className="autocare-form-field">
                    <label className="autocare-field-label">Registration Jurisdiction / Region</label>
                    <input
                      type="text"
                      className="autocare-field-input"
                      placeholder="Western Province, Sri Lanka"
                      value={formData.registrationJurisdiction}
                      onChange={(e) => setFormData({ ...formData, registrationJurisdiction: e.target.value })}
                    />
                  </div>
                </div>

                {/* Inline Error Banner matching Figma "Invalid VIN Number" */}
                {vinError && (
                  <div className="autocare-vin-error-banner" role="alert">
                    <span>{vinError}</span>
                  </div>
                )}
              </div>


              {/* ----------------------------------------------------
                  SECTION 4: Odometer Mileage & Service Calibration
                  ---------------------------------------------------- */}
              <div className="autocare-form-section">
                <div className="autocare-section-title-row">
                  <div className="autocare-section-num-circle">4</div>
                  <div>
                    <h2 className="autocare-section-heading">Odometer Mileage &amp; Service Calibration</h2>
                    <p className="autocare-section-subtext">
                      Establishes The Anti-Rollback Cryptographic Baseline For Vehicle Health Indexing.
                    </p>
                  </div>
                </div>

                <div className="autocare-form-grid is-3-cols">
                  {/* Current Odometer Mileage */}
                  <div className="autocare-form-field">
                    <label className="autocare-field-label">
                      Current Odometer Mileage (Km) <span className="autocare-required">*</span>
                    </label>
                    <div className="autocare-input-with-badge">
                      <input
                        type="number"
                        min="0"
                        className="autocare-field-input"
                        placeholder="14500"
                        value={formData.currentMileage}
                        onChange={(e) => setFormData({ ...formData, currentMileage: e.target.value })}
                        required
                      />
                      <span className="autocare-input-unit-badge">KM</span>
                    </div>
                  </div>

                  {/* Last Service Date */}
                  <div className="autocare-form-field">
                    <label className="autocare-field-label">Last Service Date</label>
                    <div className="autocare-input-with-icon">
                      <input
                        type="date"
                        className="autocare-field-input"
                        value={formData.lastServiceDate}
                        onChange={(e) => setFormData({ ...formData, lastServiceDate: e.target.value })}
                      />
                      <Calendar size={18} className="autocare-input-inside-icon" />
                    </div>
                  </div>

                  {/* Next Service Target Due */}
                  <div className="autocare-form-field">
                    <label className="autocare-field-label">
                      Next Service Target Due (Km) <span className="autocare-required">*</span>
                    </label>
                    <div className="autocare-input-with-badge">
                      <input
                        type="number"
                        min="0"
                        className="autocare-field-input"
                        placeholder="22500"
                        value={formData.nextServiceMileage}
                        onChange={(e) => setFormData({ ...formData, nextServiceMileage: e.target.value })}
                      />
                      <span className="autocare-input-unit-badge">KM</span>
                    </div>
                  </div>
                </div>

                {/* Automatic AI Baseline Container (Visual Placeholder Only) */}
                <div className="autocare-ai-baseline-box">
                  <h3 className="autocare-ai-baseline-title">
                    Automatic AI Health &amp; Trust Score Baseline: 95/100
                  </h3>
                  <p className="autocare-ai-baseline-desc">
                    Onboarding Initializes An Accredited Delivery Certificate And Guarantees That Any Subsequent Workshop Entries Adhere To Monotonic Odometer Increments.
                  </p>
                </div>
              </div>


              {/* ----------------------------------------------------
                  SECTION 5: Registered Ownership Credentials
                  ---------------------------------------------------- */}
              <div className="autocare-form-section">
                <div className="autocare-section-title-row">
                  <div className="autocare-section-num-circle">5</div>
                  <div>
                    <h2 className="autocare-section-heading">Registered Ownership Credentials</h2>
                    <p className="autocare-section-subtext">
                      Owner Contact For Vehicle Passport Administration And Authorized Sharing Access.
                    </p>
                  </div>
                </div>

                <div className="autocare-form-grid is-3-cols">
                  {/* Owner Full Name (Auto-populated from AuthContext) */}
                  <div className="autocare-form-field">
                    <label className="autocare-field-label">
                      Owner Full Name <span className="autocare-required">*</span>
                    </label>
                    <input
                      type="text"
                      className="autocare-field-input is-readonly"
                      value={user?.fullName || 'David Silva'}
                      readOnly
                    />
                  </div>

                  {/* Contact Phone # */}
                  <div className="autocare-form-field">
                    <label className="autocare-field-label">Contact Phone #</label>
                    <input
                      type="text"
                      className="autocare-field-input"
                      placeholder="077-0603956"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    />
                  </div>

                  {/* Email Address (Auto-populated from AuthContext) */}
                  <div className="autocare-form-field">
                    <label className="autocare-field-label">Email Address</label>
                    <input
                      type="email"
                      className="autocare-field-input is-readonly"
                      value={user?.email || 'david.silva@autocare.io'}
                      readOnly
                    />
                  </div>
                </div>
              </div>


              {/* ----------------------------------------------------
                  FINAL SECTION: Ready To Create Digital Passport?
                  ---------------------------------------------------- */}
              <div className="autocare-form-footer-card">
                <div>
                  <h3 className="autocare-footer-card-title">
                    Ready To Create Digital Passport?
                  </h3>
                  <p className="autocare-footer-card-sub">
                    Vehicle Will Be Immediately Accessible In Your Owner Passport Dashboard.
                  </p>
                </div>

                <div className="autocare-footer-card-actions">
                  {/* Development-Only Quick Fill Helper */}
                  {import.meta.env.DEV && (
                    <button
                      type="button"
                      className="autocare-btn-quickfill"
                      onClick={handleQuickFill}
                      title="Development Only: Populate form with sample test data"
                    >
                      <Zap size={15} />
                      <span>Quick Fill (Dev)</span>
                    </button>
                  )}

                  {/* Main Add Vehicle Submit Button */}
                  <button
                    type="submit"
                    className="autocare-btn-add-vehicle"
                    disabled={submitting}
                  >
                    <PlusCircle size={20} />
                    <span>{submitting ? 'Creating Passport...' : 'Add Vehicle'}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AddVehiclePage;
