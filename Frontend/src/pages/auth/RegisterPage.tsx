import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  Car, 
  Wrench, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import registerBg from '../../assets/auth/bg register 2.png';
import { createVehicle } from '../../services/vehicleService';

export type RegisterRole = 'owner' | 'garage';

interface RegistrationFormData {
  // Section 1: Account & Contact
  fullName: string;
  email: string;
  phone: string;
  password: string;

  // Section 2 - Owner: First Vehicle Registration
  manufacturer: string;
  model: string;
  year: string;
  vin: string;
  licensePlate: string;
  odometer: string;

  // Section 2 - Garage: Workshop Accreditation Details
  workshopName: string;
  businessRegNumber: string;
  city: string;

  // Consent
  agreeTerms: boolean;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  manufacturer?: string;
  model?: string;
  year?: string;
  vin?: string;
  licensePlate?: string;
  odometer?: string;
  workshopName?: string;
  businessRegNumber?: string;
  city?: string;
  agreeTerms?: string;
}

const INITIAL_FORM_DATA: RegistrationFormData = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  manufacturer: '',
  model: '',
  year: '',
  vin: '',
  licensePlate: '',
  odometer: '',
  workshopName: '',
  businessRegNumber: '',
  city: '',
  agreeTerms: false,
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [selectedRole, setSelectedRole] = useState<RegisterRole>('owner');
  const [formData, setFormData] = useState<RegistrationFormData>(INITIAL_FORM_DATA);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // API Interaction States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  const handleRoleChange = (role: RegisterRole) => {
    setSelectedRole(role);
    setErrors({});
    setApiError(null);
    setApiSuccess(null);
  };

  const handleInputChange = (field: keyof RegistrationFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Section 1: Account & Contact
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name / representative name is required.';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter a valid full name.';
    }

    const emailTrimmed = formData.email.trim();
    if (!emailTrimmed) {
      newErrors.email = 'Account email address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrimmed)) {
        newErrors.email = 'Please enter a valid email address.';
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else {
      const cleanPhone = formData.phone.trim().replace(/[\s-]/g, '');
      const phoneRegex = /^(\+?\d{9,15}|0\d{9})$/;
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.phone = 'Please enter a valid phone number (e.g. 0771234567 or +94771234567).';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Account password is required.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    // Section 2: Role-Specific Details
    if (selectedRole === 'owner') {
      if (!formData.manufacturer.trim()) {
        newErrors.manufacturer = 'Manufacturer is required.';
      }
      if (!formData.model.trim()) {
        newErrors.model = 'Model is required.';
      }
      if (!formData.year.trim()) {
        newErrors.year = 'Manufacturing year is required.';
      } else {
        const yearNum = Number(formData.year.trim());
        const currentYear = new Date().getFullYear();
        if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
          newErrors.year = `Enter a valid year (1900 - ${currentYear + 1}).`;
        }
      }
      if (!formData.vin.trim()) {
        newErrors.vin = 'VIN / Chassis number is required.';
      } else {
        const cleanVin = formData.vin.trim().toUpperCase();
        const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
        if (!vinRegex.test(cleanVin)) {
          newErrors.vin = 'VIN must be exactly 17 characters excluding letters I, O, and Q.';
        }
      }
      if (!formData.licensePlate.trim()) {
        newErrors.licensePlate = 'License plate number is required.';
      }
      if (!formData.odometer.trim()) {
        newErrors.odometer = 'Current odometer reading is required.';
      } else {
        const odoNum = Number(formData.odometer.replace(/,/g, '').trim());
        if (isNaN(odoNum) || odoNum < 0 || !Number.isInteger(odoNum)) {
          newErrors.odometer = 'Odometer reading must be a whole non-negative number.';
        }
      }
    } else {
      // Verified Garage Partner
      if (!formData.workshopName.trim()) {
        newErrors.workshopName = 'Workshop / Business legal name is required.';
      }
      if (!formData.businessRegNumber.trim()) {
        newErrors.businessRegNumber = 'Business registration number (BRN) is required.';
      }
      if (!formData.city.trim()) {
        newErrors.city = 'City / Region is required.';
      }
    }

    // Consent
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the Universal Maintenance Terms to proceed.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);

    const isValid = validateForm();
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const response = await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: selectedRole,
      });

      if (selectedRole === 'owner') {
        const hasVehicleData =
          Boolean(formData.manufacturer.trim()) &&
          Boolean(formData.model.trim()) &&
          Boolean(formData.licensePlate.trim());

        if (hasVehicleData) {
          try {
            const yearNum = Number(formData.year.trim()) || new Date().getFullYear();
            const odoNum = Number(formData.odometer.replace(/,/g, '').trim()) || 0;

            const createdVehicle = await createVehicle({
              manufacturer: formData.manufacturer.trim(),
              model: formData.model.trim(),
              manufacturingYear: yearNum,
              vin: formData.vin.trim().toUpperCase() || 'UNKNOWN_VIN',
              registrationNumber: formData.licensePlate.trim().toUpperCase(),
              currentMileage: odoNum,
              status: 'Active',
              vehicleType: 'Car',
            });

            setApiSuccess('Owner account and vehicle passport registered successfully!');
            setTimeout(() => {
              if (createdVehicle?._id) {
                navigate(`/vehicles/${createdVehicle._id}`);
              } else {
                navigate('/vehicles');
              }
            }, 1200);
            return;
          } catch (vehErr: unknown) {
            console.warn('Initial vehicle registration after user creation failed:', vehErr);
            setApiSuccess('Account created! Forwarding you to finalize your vehicle passport registration.');
            setTimeout(() => {
              navigate('/vehicles/add', {
                state: {
                  initialVehicle: {
                    manufacturer: formData.manufacturer.trim(),
                    model: formData.model.trim(),
                    manufacturingYear: formData.year.trim(),
                    vin: formData.vin.trim(),
                    registrationNumber: formData.licensePlate.trim(),
                    currentMileage: formData.odometer.trim(),
                  },
                },
              });
            }, 1500);
            return;
          }
        } else {
          setApiSuccess('Vehicle owner account registered successfully.');
          setTimeout(() => {
            navigate('/vehicles');
          }, 1000);
          return;
        }
      } else {
        // Verified Garage Partner
        setApiSuccess(
          response.message || 'Garage partner registration received and pending accreditation review.'
        );
        setTimeout(() => {
          navigate('/garage/verification-pending');
        }, 1200);
        return;
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Registration failed. Please check your information and network connection.';
      setApiError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout bgImage={registerBg} layoutMode="centered" hideFade={true}>
      <div className="autocare-auth-card is-register">
        {/* Card Header matching Figma */}
        <header className="autocare-auth-header autocare-auth-card-header">
          <div className="autocare-card-pill-badge" aria-label="BRD Reference">
            BRD FR-01 REGISTRATION
          </div>
          <h1 className="autocare-auth-card-title">Create Your AutoCare 360 Account</h1>
          <p className="autocare-auth-card-subtitle">
            Join the universal digital vehicle maintenance network with verified records and cryptographic sharing.
          </p>
        </header>

        {/* Card Body */}
        <div className="autocare-auth-card-body">
          {/* Reusable Registration Role Selector */}
          <div className="autocare-role-section">
            <span className="autocare-role-eyebrow" id="reg-role-label">
              Select Registration Type
            </span>
            <div 
              className="autocare-register-role-grid" 
              role="group" 
              aria-labelledby="reg-role-label"
            >
              {/* Option 1: Vehicle Owner */}
              <button
                type="button"
                className={`autocare-register-role-card ${selectedRole === 'owner' ? 'is-owner-active' : ''}`}
                onClick={() => handleRoleChange('owner')}
                aria-pressed={selectedRole === 'owner'}
              >
                <div className="autocare-register-role-header">
                  <Car size={16} />
                  <span>Vehicle Owner</span>
                </div>
                <p className="autocare-register-role-desc">
                  Register personal or family vehicles, track maintenance, and generate buyer QR links.
                </p>
              </button>

              {/* Option 2: Verified Garage Partner */}
              <button
                type="button"
                className={`autocare-register-role-card ${selectedRole === 'garage' ? 'is-garage-active' : ''}`}
                onClick={() => handleRoleChange('garage')}
                aria-pressed={selectedRole === 'garage'}
              >
                <div className="autocare-register-role-header">
                  <Wrench size={16} />
                  <span>Verified Garage Partner</span>
                </div>
                <p className="autocare-register-role-desc">
                  Accredited auto workshops logging verified digital service records and invoices.
                </p>
              </button>
            </div>
          </div>

          {/* Registration Form */}
          <form className="autocare-register-form" onSubmit={handleSubmit} noValidate>
            {/* Section 1: Account & Contact Information */}
            <div className="autocare-form-section-title">
              <User className="autocare-section-icon" />
              <span>Account & Contact Information</span>
            </div>

            <div className="autocare-grid-2">
              {/* Full Name */}
              <div className="autocare-form-field">
                <label htmlFor="reg-fullname" className="autocare-field-label">
                  Full Name / Representative
                </label>
                <div className="autocare-input-container">
                  <input
                    id="reg-fullname"
                    type="text"
                    className={`autocare-text-input ${errors.fullName ? 'input-invalid' : ''}`}
                    placeholder="Enter full name"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
                {errors.fullName && (
                  <div className="autocare-inline-error" role="alert">
                    <AlertCircle size={13} /> {errors.fullName}
                  </div>
                )}
              </div>

              {/* Email Address */}
              <div className="autocare-form-field">
                <label htmlFor="reg-email" className="autocare-field-label">
                  Email Address
                </label>
                <div className="autocare-input-container">
                  <input
                    id="reg-email"
                    type="email"
                    className={`autocare-text-input ${errors.email ? 'input-invalid' : ''}`}
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                {errors.email && (
                  <div className="autocare-inline-error" role="alert">
                    <AlertCircle size={13} /> {errors.email}
                  </div>
                )}
              </div>
            </div>

            <div className="autocare-grid-2">
              {/* Phone Number */}
              <div className="autocare-form-field">
                <label htmlFor="reg-phone" className="autocare-field-label">
                  Phone Number
                </label>
                <div className="autocare-input-container">
                  <input
                    id="reg-phone"
                    type="tel"
                    className={`autocare-text-input ${errors.phone ? 'input-invalid' : ''}`}
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    autoComplete="tel"
                    required
                  />
                </div>
                {errors.phone && (
                  <div className="autocare-inline-error" role="alert">
                    <AlertCircle size={13} /> {errors.phone}
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="autocare-form-field">
                <label htmlFor="reg-password" className="autocare-field-label">
                  Create Password
                </label>
                <div className="autocare-input-container">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`autocare-text-input has-toggle ${errors.password ? 'input-invalid' : ''}`}
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="autocare-eye-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <div className="autocare-inline-error" role="alert">
                    <AlertCircle size={13} /> {errors.password}
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Role-Specific Details */}
            {selectedRole === 'owner' ? (
              <>
                <div className="autocare-form-section-title">
                  <Car className="autocare-section-icon" />
                  <span>First Vehicle Registration</span>
                </div>

                {/* 3-Column: Manufacturer, Model, Year */}
                <div className="autocare-grid-3">
                  <div className="autocare-form-field">
                    <label htmlFor="veh-manufacturer" className="autocare-field-label">
                      Manufacturer
                    </label>
                    <input
                      id="veh-manufacturer"
                      type="text"
                      className={`autocare-text-input ${errors.manufacturer ? 'input-invalid' : ''}`}
                      placeholder="e.g. Tesla"
                      value={formData.manufacturer}
                      onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                      required
                    />
                    {errors.manufacturer && (
                      <div className="autocare-inline-error" role="alert">
                        <AlertCircle size={12} /> {errors.manufacturer}
                      </div>
                    )}
                  </div>

                  <div className="autocare-form-field">
                    <label htmlFor="veh-model" className="autocare-field-label">
                      Model
                    </label>
                    <input
                      id="veh-model"
                      type="text"
                      className={`autocare-text-input ${errors.model ? 'input-invalid' : ''}`}
                      placeholder="e.g. Model 3"
                      value={formData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      required
                    />
                    {errors.model && (
                      <div className="autocare-inline-error" role="alert">
                        <AlertCircle size={12} /> {errors.model}
                      </div>
                    )}
                  </div>

                  <div className="autocare-form-field">
                    <label htmlFor="veh-year" className="autocare-field-label">
                      Year
                    </label>
                    <input
                      id="veh-year"
                      type="text"
                      maxLength={4}
                      className={`autocare-text-input ${errors.year ? 'input-invalid' : ''}`}
                      placeholder="2024"
                      value={formData.year}
                      onChange={(e) => handleInputChange('year', e.target.value)}
                      required
                    />
                    {errors.year && (
                      <div className="autocare-inline-error" role="alert">
                        <AlertCircle size={12} /> {errors.year}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2-Column: VIN & License Plate */}
                <div className="autocare-grid-2">
                  <div className="autocare-form-field">
                    <label htmlFor="veh-vin" className="autocare-field-label">
                      VIN (Chassis Number)
                    </label>
                    <input
                      id="veh-vin"
                      type="text"
                      maxLength={17}
                      className={`autocare-text-input ${errors.vin ? 'input-invalid' : ''}`}
                      placeholder="17-digit VIN"
                      value={formData.vin}
                      onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())}
                      required
                    />
                    {errors.vin && (
                      <div className="autocare-inline-error" role="alert">
                        <AlertCircle size={12} /> {errors.vin}
                      </div>
                    )}
                  </div>

                  <div className="autocare-form-field">
                    <label htmlFor="veh-plate" className="autocare-field-label">
                      License Plate
                    </label>
                    <input
                      id="veh-plate"
                      type="text"
                      className={`autocare-text-input ${errors.licensePlate ? 'input-invalid' : ''}`}
                      placeholder="e.g. ABC-1234"
                      value={formData.licensePlate}
                      onChange={(e) => handleInputChange('licensePlate', e.target.value.toUpperCase())}
                      required
                    />
                    {errors.licensePlate && (
                      <div className="autocare-inline-error" role="alert">
                        <AlertCircle size={12} /> {errors.licensePlate}
                      </div>
                    )}
                  </div>
                </div>

                {/* 1-Column: Odometer */}
                <div className="autocare-form-field">
                  <label htmlFor="veh-odometer" className="autocare-field-label">
                    Current Odometer (Kilometers / Miles)
                  </label>
                  <input
                    id="veh-odometer"
                    type="text"
                    className={`autocare-text-input ${errors.odometer ? 'input-invalid' : ''}`}
                    placeholder="e.g. 15,000"
                    value={formData.odometer}
                    onChange={(e) => handleInputChange('odometer', e.target.value)}
                    required
                  />
                  {errors.odometer && (
                    <div className="autocare-inline-error" role="alert">
                      <AlertCircle size={12} /> {errors.odometer}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Verified Garage Partner Section */}
                <div className="autocare-form-section-title">
                  <FileCheck className="autocare-section-icon is-garage" />
                  <span>Workshop Accreditation Details</span>
                </div>

                {/* Full Width: Legal Workshop Name */}
                <div className="autocare-form-field">
                  <label htmlFor="garage-name" className="autocare-field-label">
                    Workshop / Business Legal Name
                  </label>
                  <input
                    id="garage-name"
                    type="text"
                    className={`autocare-text-input ${errors.workshopName ? 'input-invalid' : ''}`}
                    placeholder="e.g. Apex Precision Auto Engineering Ltd"
                    value={formData.workshopName}
                    onChange={(e) => handleInputChange('workshopName', e.target.value)}
                    required
                  />
                  {errors.workshopName && (
                    <div className="autocare-inline-error" role="alert">
                      <AlertCircle size={12} /> {errors.workshopName}
                    </div>
                  )}
                </div>

                {/* 2-Column: Business Registration & City */}
                <div className="autocare-grid-2">
                  <div className="autocare-form-field">
                    <label htmlFor="garage-brn" className="autocare-field-label">
                      Business Registration (BRN / License)
                    </label>
                    <input
                      id="garage-brn"
                      type="text"
                      className={`autocare-text-input ${errors.businessRegNumber ? 'input-invalid' : ''}`}
                      placeholder="e.g. BRN-8492019-X"
                      value={formData.businessRegNumber}
                      onChange={(e) => handleInputChange('businessRegNumber', e.target.value)}
                      required
                    />
                    {errors.businessRegNumber && (
                      <div className="autocare-inline-error" role="alert">
                        <AlertCircle size={12} /> {errors.businessRegNumber}
                      </div>
                    )}
                  </div>

                  <div className="autocare-form-field">
                    <label htmlFor="garage-city" className="autocare-field-label">
                      City / Region
                    </label>
                    <input
                      id="garage-city"
                      type="text"
                      className={`autocare-text-input ${errors.city ? 'input-invalid' : ''}`}
                      placeholder="e.g. London / South East"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      required
                    />
                    {errors.city && (
                      <div className="autocare-inline-error" role="alert">
                        <AlertCircle size={12} /> {errors.city}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Terms and Privacy Consent Checkbox */}
            <div className="autocare-form-field">
              <div className="autocare-terms-row">
                <input
                  id="reg-terms"
                  type="checkbox"
                  className="autocare-terms-checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
                  required
                />
                <label htmlFor="reg-terms" className="autocare-terms-text">
                  I agree to the{' '}
                  <span className="autocare-terms-link">AutoCare 360 Universal Maintenance Terms</span>. 
                  I understand all records are cryptographic, tamper-proof, and subject to audit logs.
                </label>
              </div>
              {errors.agreeTerms && (
                <div className="autocare-inline-error" role="alert">
                  <AlertCircle size={12} /> {errors.agreeTerms}
                </div>
              )}
            </div>

            {/* Real API Error Notice */}
            {apiError && (
              <div 
                className="autocare-dev-status-notice" 
                style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}
                role="alert"
              >
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{apiError}</span>
              </div>
            )}

            {/* Real API Success Notice */}
            {apiSuccess && (
              <div 
                className="autocare-dev-status-notice" 
                style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' }}
                role="status"
              >
                <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '1px', color: '#16a34a' }} />
                <span>{apiSuccess}</span>
              </div>
            )}

            {/* Primary Submit Button matching Figma */}
            <button 
              type="submit" 
              className="autocare-primary-button"
              disabled={isSubmitting}
            >
              <span>
                {isSubmitting
                  ? 'Creating Account...'
                  : selectedRole === 'owner'
                  ? 'Complete Registration As Vehicle Owner'
                  : 'Complete Registration As Verified Garage'}
              </span>
              <ArrowRight size={15} />
            </button>
          </form>
        </div>

        {/* Card Footer matching Figma */}
        <footer className="autocare-auth-card-footer">
          <div className="autocare-footer-branding-label">
            <span>AutoCare 360</span>
            <span className="autocare-footer-vms-pill">Universal VMR</span>
          </div>
          <p className="autocare-footer-register-prompt">
            Already Registered?
            <Link to="/login" className="autocare-footer-register-link">
              Sign In To Your Account
            </Link>
          </p>
        </footer>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
