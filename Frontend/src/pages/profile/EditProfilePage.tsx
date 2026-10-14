import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  UploadCloud,
  Trash2,
  Info,
  ChevronDown,
  Mail,
  Phone,
  Clock,
  Camera,
  AlertCircle
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../hooks/useAuth';
import type { UserProfile } from '../../services/authService';
import '../../styles/profile.css';

interface FormState {
  fullName: string;
  displayName: string;
  preferredLanguage: string;
  timezone: string;
  phone: string;
  city: string;
  country: string;
}

const EditProfileForm: React.FC<{ user: UserProfile }> = ({ user }) => {
  const navigate = useNavigate();
  const { updateUserProfile } = useAuth();

  const [formData, setFormData] = useState<FormState>(() => ({
    fullName: user.fullName || '',
    displayName: user.displayName || '',
    preferredLanguage: user.preferredLanguage || 'English',
    timezone: user.timezone || 'Sri Lanka Standard Time (UTC+05:30)',
    phone: user.phone || '',
    city: user.city || '',
    country: user.country || 'Sri Lanka',
  }));

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount or URL change
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Initials computation
  const getInitials = (name?: string) => {
    if (!name) return 'AC';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setImageError('Only JPG or PNG images are permitted.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image size exceeds 5 MB limit.');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setImageError(null);
  };

  const validateForm = (): boolean => {
    const newErrors: { fullName?: string; phone?: string } = {};

    const trimmedFullName = formData.fullName.trim();
    if (!trimmedFullName) {
      newErrors.fullName = 'Full name is required.';
    } else if (trimmedFullName.length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters.';
    }

    const trimmedPhone = formData.phone.trim();
    const phonePattern = /^(\+?[0-9\s\-()]{9,16})$/;
    if (!trimmedPhone) {
      newErrors.phone = 'Contact phone number is required.';
    } else if (!phonePattern.test(trimmedPhone)) {
      newErrors.phone = 'Please enter a valid phone number (e.g. 077-0603956 or +94770603956).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await updateUserProfile({
        fullName: formData.fullName.trim(),
        displayName: formData.displayName.trim() || undefined,
        preferredLanguage: formData.preferredLanguage,
        timezone: formData.timezone,
        phone: formData.phone.trim(),
        city: formData.city.trim() || undefined,
        country: formData.country,
      });

      // Navigate to /profile with success feedback
      navigate('/profile', {
        state: {
          successMessage: 'Owner profile details updated successfully.',
        },
      });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to update profile. Please try again.';
      setErrors((prev) => ({
        ...prev,
        general: errorMsg,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="autocare-profile-container">
      {/* Page Header matching Figma Edit profile(2).png */}
      <div className="autocare-profile-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--autocare-blue, #0056a2)',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}
            >
              OWNER MANAGEMENT
            </span>
          </div>
          <h1 className="autocare-profile-title">Edit profile</h1>
          <p className="autocare-profile-subtitle">
            Update the owner information displayed across your digital vehicle passports.
          </p>
        </div>
      </div>

      {/* Information Banner matching Figma */}
      <div className="autocare-edit-banner">
        <div className="autocare-edit-banner-text">
          <h2 className="autocare-edit-banner-title">Ready to update your owner profile?</h2>
          <p className="autocare-edit-banner-desc">
            Vehicle ownership records and audit history remain unchanged. Only your account contact details will be updated.
          </p>
        </div>
        <div className="autocare-edit-banner-actions">
          <button
            type="button"
            className="autocare-btn-cancel"
            onClick={() => navigate('/profile')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="autocare-btn-save"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <Check size={16} />
            {isSubmitting ? 'Saving changes...' : 'Save changes'}
          </button>
        </div>
      </div>

      {errors.general && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={18} />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Main Two-Column Grid */}
      <form onSubmit={handleSubmit} className="autocare-profile-main-grid">
        {/* Left Column: Profile image card */}
        <section className="autocare-profile-card autocare-profile-identity-card" aria-label="Profile image card">
          <div className="autocare-profile-card-header" style={{ marginBottom: '16px' }}>
            <h2 className="autocare-profile-card-title">Profile image</h2>
            <p className="autocare-profile-card-subtitle">
              Shown in your owner account and sharing activity.
            </p>
          </div>

          {/* Avatar Circle Display */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0 20px 0' }}>
            <div style={{ width: '132px', height: '132px' }}>
              <div className="autocare-profile-avatar-outer">
                <div className="autocare-profile-avatar-inner">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Avatar Preview"
                      className="autocare-profile-avatar-img"
                    />
                  ) : (
                    <span className="autocare-profile-avatar-initials" style={{ fontSize: '38px' }}>
                      {getInitials(formData.fullName || user.fullName)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dashed Upload Trigger Box */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div
            className="autocare-upload-dashed-box"
            tabIndex={0}
            role="button"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                fileInputRef.current?.click();
              }
            }}
          >
            <UploadCloud size={28} color="#0056a2" />
            <span className="autocare-upload-title">Upload a new image</span>
            <span className="autocare-upload-subtext">JPG or PNG · maximum 5 MB</span>
          </div>

          {imageError && (
            <p className="autocare-edit-error" style={{ textAlign: 'center', marginBottom: '10px' }}>
              {imageError}
            </p>
          )}

          {/* Change and Remove Buttons */}
          <div className="autocare-avatar-btn-row">
            <button
              type="button"
              className="autocare-btn-avatar-change"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={15} />
              Change
            </button>
            <button
              type="button"
              className="autocare-btn-avatar-remove"
              onClick={handleRemoveImage}
            >
              <Trash2 size={15} />
              Remove
            </button>
          </div>

          {/* Helper Notice Card */}
          <div className="autocare-avatar-notice-card">
            <Info size={16} color="#0056a2" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p className="autocare-avatar-notice-text">
              Use a clear, front-facing photo. Identity verification remains linked to your account after the image changes.
            </p>
          </div>
        </section>

        {/* Right Column: Personal & Contact Information Cards */}
        <div className="autocare-profile-details-col">
          {/* 1. Personal Information Card */}
          <section className="autocare-profile-card" aria-label="Personal information">
            <div className="autocare-profile-card-header">
              <h2 className="autocare-profile-card-title">Personal information</h2>
              <p className="autocare-profile-card-subtitle">
                Your legal name must match the vehicle ownership credentials on file.
              </p>
            </div>

            <div className="autocare-edit-form-grid">
              {/* Full Name */}
              <div className="autocare-edit-field-group">
                <label htmlFor="fullName" className="autocare-edit-field-label">
                  Full name *
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className="autocare-edit-input"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                />
                {errors.fullName ? (
                  <span className="autocare-edit-error">{errors.fullName}</span>
                ) : null}
              </div>

              {/* Display Name */}
              <div className="autocare-edit-field-group">
                <label htmlFor="displayName" className="autocare-edit-field-label">
                  Display name
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  className="autocare-edit-input"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="e.g. David"
                />
                <span className="autocare-edit-helper">
                  Used in account menus and activity logs.
                </span>
              </div>

              {/* Preferred Language */}
              <div className="autocare-edit-field-group">
                <label htmlFor="preferredLanguage" className="autocare-edit-field-label">
                  Preferred language
                </label>
                <div className="autocare-edit-input-wrapper">
                  <select
                    id="preferredLanguage"
                    name="preferredLanguage"
                    className="autocare-edit-select"
                    value={formData.preferredLanguage}
                    onChange={handleChange}
                  >
                    <option value="English">English</option>
                    <option value="Sinhala">Sinhala (සිංහල)</option>
                    <option value="Tamil">Tamil (தமிழ்)</option>
                  </select>
                  <div className="autocare-edit-select-arrow">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {/* Time Zone */}
              <div className="autocare-edit-field-group">
                <label htmlFor="timezone" className="autocare-edit-field-label">
                  Time zone
                </label>
                <div className="autocare-edit-input-wrapper">
                  <div className="autocare-edit-input-icon">
                    <Clock size={16} />
                  </div>
                  <select
                    id="timezone"
                    name="timezone"
                    className="autocare-edit-select has-icon"
                    value={formData.timezone}
                    onChange={handleChange}
                  >
                    <option value="Sri Lanka Standard Time (UTC+05:30)">
                      Sri Lanka Standard Time (UTC+05:30)
                    </option>
                    <option value="India Standard Time (UTC+05:30)">
                      India Standard Time (UTC+05:30)
                    </option>
                    <option value="Singapore Time (UTC+08:00)">
                      Singapore Time (UTC+08:00)
                    </option>
                    <option value="UTC (Coordinated Universal Time)">
                      UTC (Coordinated Universal Time)
                    </option>
                  </select>
                  <div className="autocare-edit-select-arrow">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Contact Information Card */}
          <section className="autocare-profile-card" aria-label="Contact information">
            <div className="autocare-profile-card-header">
              <h2 className="autocare-profile-card-title">Contact information</h2>
              <p className="autocare-profile-card-subtitle">
                Changes to verified channels require a one-time confirmation code.
              </p>
            </div>

            <div className="autocare-edit-form-grid">
              {/* Email Address */}
              <div className="autocare-edit-field-group">
                <label htmlFor="email" className="autocare-edit-field-label">
                  Email address *
                </label>
                <div className="autocare-edit-input-wrapper">
                  <div className="autocare-edit-input-icon">
                    <Mail size={16} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="autocare-edit-input has-icon"
                    value={user.email || ''}
                    disabled
                    readOnly
                  />
                </div>
                <span className="autocare-edit-helper">
                  Email changes require verification.
                </span>
              </div>

              {/* Contact Phone */}
              <div className="autocare-edit-field-group">
                <label htmlFor="phone" className="autocare-edit-field-label">
                  Contact phone *
                </label>
                <div className="autocare-edit-input-wrapper">
                  <div className="autocare-edit-input-icon">
                    <Phone size={16} />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="autocare-edit-input has-icon"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. 077-0603956"
                    required
                  />
                </div>
                {errors.phone ? (
                  <span className="autocare-edit-error">{errors.phone}</span>
                ) : (
                  <span className="autocare-edit-helper">
                    Sri Lankan mobile number used for security alerts.
                  </span>
                )}
              </div>

              {/* City */}
              <div className="autocare-edit-field-group">
                <label htmlFor="city" className="autocare-edit-field-label">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  className="autocare-edit-input"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Colombo"
                />
              </div>

              {/* Country / Region */}
              <div className="autocare-edit-field-group">
                <label htmlFor="country" className="autocare-edit-field-label">
                  Country / region
                </label>
                <div className="autocare-edit-input-wrapper">
                  <select
                    id="country"
                    name="country"
                    className="autocare-edit-select"
                    value={formData.country}
                    onChange={handleChange}
                  >
                    <option value="Sri Lanka">Sri Lanka</option>
                    <option value="India">India</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="autocare-edit-select-arrow">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </form>
    </main>
  );
};

export const EditProfilePage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Authentication guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading || !user) {
    return (
      <div className="autocare-profile-page-wrapper">
        <Navbar />
        <main
          className="autocare-profile-container"
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p style={{ color: '#64748b', fontSize: '15px', fontWeight: 600 }}>
            Loading owner profile...
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="autocare-profile-page-wrapper">
      <Navbar />
      <EditProfileForm key={user._id} user={user} />
      <Footer />
    </div>
  );
};

export default EditProfilePage;
