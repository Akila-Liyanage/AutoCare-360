import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  X,
  Upload,
  Trash2,
  Save,
  ArrowLeft,
  Users,
  } from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import '../../styles/garage-dashboard.css';

interface TechnicianItem {
  id: string;
  name: string;
  specialty: string;
  certNumber: string;
  status: 'ACTIVE' | 'ON LEAVE';
}

interface ToastState {
  show: boolean;
  message: string;
}

const INITIAL_PROFILE = {
  businessName: 'Perera Auto Works (Pvt) Ltd',
  legalName: 'Perera Automotive Holdings Lanka Limited',
  brn: 'PV-102948-BR03',
  taxNumber: 'VAT-901829481',
  phone: '+94 11 258 9102',
  altPhone: '+94 77 123 4567',
  email: 'service@pereraautoworks.lk',
  address: '45/2 Havelock Road',
  city: 'Colombo 05',
  postalCode: '00500',
  verificationStatus: 'SLT-CERTIFIED LEVEL 4 REPAIR WORKSHOP',
  accreditationId: 'AC360-ACC-2026-PAW',
  accreditationExpiry: '31 December 2026',
  workingHoursWeekday: '08:00 AM – 06:00 PM',
  workingHoursSaturday: '08:30 AM – 02:00 PM',
  workingHoursSunday: 'Closed (Emergency On-Call)',
};

const INITIAL_TECHNICIANS: TechnicianItem[] = [
  {
    id: 'tech-1',
    name: 'Kaveesha Perera',
    specialty: 'Master Diagnostic Technician & Hybrid Specialist',
    certNumber: 'SLT-TECH-4091',
    status: 'ACTIVE',
  },
  {
    id: 'tech-2',
    name: 'Sunil Weerasinghe',
    specialty: 'Brake, Suspension & Steering Systems',
    certNumber: 'SLT-TECH-3810',
    status: 'ACTIVE',
  },
  {
    id: 'tech-3',
    name: 'Chaminda Rathnayake',
    specialty: 'Transmission, Dual Clutch & Powertrain',
    certNumber: 'SLT-TECH-4112',
    status: 'ACTIVE',
  },
];

export const GarageProfilePage: React.FC = () => {
  const navigate = useNavigate();

  // Profile Form State
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [technicians, setTechnicians] = useState<TechnicianItem[]>(INITIAL_TECHNICIANS);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Add Tech Modal
  const [showAddTechModal, setShowAddTechModal] = useState<boolean>(false);
  const [newTechName, setNewTechName] = useState<string>('');
  const [newTechSpecialty, setNewTechSpecialty] = useState<string>('Periodic Maintenance Tech');
  const [newTechCert, setNewTechCert] = useState<string>('');

  // Toast
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  const handleInputChange = (field: keyof typeof INITIAL_PROFILE, val: string) => {
    setProfile((prev) => ({ ...prev, [field]: val }));
  };

  const handleAddTechnician = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechName.trim()) {
      showToast('Technician name is required.');
      return;
    }
    const item: TechnicianItem = {
      id: `tech-${Date.now()}`,
      name: newTechName.trim(),
      specialty: newTechSpecialty.trim(),
      certNumber: newTechCert.trim() || `SLT-TECH-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'ACTIVE',
    };
    setTechnicians((prev) => [...prev, item]);
    setNewTechName('');
    setNewTechCert('');
    setShowAddTechModal(false);
    showToast(`Technician ${item.name} added successfully.`);
  };

  const handleRemoveTechnician = (id: string, name: string) => {
    setTechnicians((prev) => prev.filter((t) => t.id !== id));
    showToast(`Technician ${name} removed from active roster.`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.businessName.trim() || !profile.phone.trim() || !profile.email.trim()) {
      showToast('Please fill all required business contact details.');
      return;
    }
    showToast('Workshop profile and credentials updated successfully.');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
      showToast('Workshop logo updated (local preview).');
    }
  };

  return (
    <GarageLayout activeItem="Overview" breadcrumbCurrent="Garage Profile">
      {/* Top Header */}
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
            onClick={() => navigate('/garage/dashboard')}
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
            <span>Back to Dashboard</span>
          </button>
          <h1 className="autocare-garage-main-title" style={{ margin: 0 }}>
            Workshop Profile &amp; Accreditation
          </h1>
          <p className="autocare-garage-main-subtitle">
            Manage your certified repair facility details, operating hours, and authorized technicians.
          </p>
        </div>

        <button
          type="button"
          className="autocare-garage-btn-primary"
          onClick={handleSaveProfile}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Save size={16} />
          <span>Save Profile Changes</span>
        </button>
      </div>

      {/* Main Grid: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Left Column: Workshop Identity & Contact */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card 1: Business Identity */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '22px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <Building2 size={20} style={{ color: '#003874' }} />
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Workshop Identity
              </h2>
            </div>

            {/* Logo Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '12px',
                  background: '#f1f5f9',
                  border: '1px dashed #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Workshop Logo"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Building2 size={32} style={{ color: '#94a3b8' }} />
                )}
              </div>
              <div>
                <label
                  htmlFor="garage-logo-upload"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: '#003874',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Upload size={14} />
                  <span>Upload Logo</span>
                </label>
                <input
                  id="garage-logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
                <p style={{ fontSize: '11.5px', color: '#64748b', margin: '6px 0 0 0' }}>
                  PNG or JPG up to 2MB. Recommended 400x400px.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Business Display Name *
                </label>
                <input
                  type="text"
                  value={profile.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    color: '#0f172a',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Registered Entity Name (Legal)
                </label>
                <input
                  type="text"
                  value={profile.legalName}
                  onChange={(e) => handleInputChange('legalName', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    color: '#0f172a',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Business Reg. Number (BRN)
                  </label>
                  <input
                    type="text"
                    value={profile.brn}
                    onChange={(e) => handleInputChange('brn', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      color: '#0f172a',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Tax Identification / VAT
                  </label>
                  <input
                    type="text"
                    value={profile.taxNumber}
                    onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      color: '#0f172a',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Contact & Operating Location */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '22px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <MapPin size={20} style={{ color: '#003874' }} />
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Contact &amp; Location
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Physical Workshop Address
                </label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    color: '#0f172a',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    City / Region
                  </label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      color: '#0f172a',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={profile.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      color: '#0f172a',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Primary Phone
                  </label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      color: '#0f172a',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      color: '#0f172a',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Accreditation, Working Hours, Technicians */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card 3: Accreditation & Status */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '22px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <ShieldCheck size={20} style={{ color: '#059669' }} />
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Network Accreditation &amp; Trust
              </h2>
            </div>

            <div
              style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '13px', color: '#065f46', display: 'block' }}>
                  {profile.verificationStatus}
                </strong>
                <span style={{ fontSize: '11.5px', color: '#047857' }}>
                  Certificate ID: {profile.accreditationId} · Valid through {profile.accreditationExpiry}
                </span>
              </div>
            </div>

            <div className="autocare-garage-profile-spec-row">
              <span className="autocare-garage-profile-spec-label">Accreditation Tier</span>
              <span className="autocare-garage-profile-spec-val">Authorized Inspection &amp; Maintenance Station</span>
            </div>
            <div className="autocare-garage-profile-spec-row">
              <span className="autocare-garage-profile-spec-label">Issuing Network</span>
              <span className="autocare-garage-profile-spec-val">AutoCare 360 Verified Network</span>
            </div>
            <div className="autocare-garage-profile-spec-row">
              <span className="autocare-garage-profile-spec-label">Audit Frequency</span>
              <span className="autocare-garage-profile-spec-val">Annual Physical Inspection &amp; Compliance Check</span>
            </div>
          </div>

          {/* Card 4: Working Hours */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '22px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Clock size={20} style={{ color: '#003874' }} />
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Operating Hours
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                  Monday – Friday
                </label>
                <input
                  type="text"
                  value={profile.workingHoursWeekday}
                  onChange={(e) => handleInputChange('workingHoursWeekday', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#0f172a',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                  Saturday
                </label>
                <input
                  type="text"
                  value={profile.workingHoursSaturday}
                  onChange={(e) => handleInputChange('workingHoursSaturday', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#0f172a',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                  Sunday &amp; Public Holidays
                </label>
                <input
                  type="text"
                  value={profile.workingHoursSunday}
                  onChange={(e) => handleInputChange('workingHoursSunday', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#0f172a',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card 5: Certified Technicians */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '22px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={20} style={{ color: '#003874' }} />
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Authorized Technicians ({technicians.length})
                </h2>
              </div>
              <button
                type="button"
                className="autocare-garage-action-link"
                style={{ fontSize: '13px', fontWeight: 700 }}
                onClick={() => setShowAddTechModal(true)}
              >
                + Add Technician
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {technicians.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '13.5px', color: '#0f172a', display: 'block' }}>
                      {t.name}
                    </strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {t.specialty} · <code style={{ fontSize: '11px', background: '#e2e8f0', padding: '1px 4px', borderRadius: '4px' }}>{t.certNumber}</code>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveTechnician(t.id, t.name)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    title={`Remove ${t.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Tech Modal */}
      {showAddTechModal && (
        <div
          className="autocare-garage-modal-backdrop"
          onClick={() => setShowAddTechModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="autocare-garage-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="autocare-garage-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} />
                <h3>Add Authorized Technician</h3>
              </div>
              <button
                type="button"
                className="autocare-garage-modal-close-btn"
                onClick={() => setShowAddTechModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTechnician}>
              <div className="autocare-garage-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newTechName}
                    onChange={(e) => setNewTechName(e.target.value)}
                    placeholder="e.g. Ruwan Jayawardena"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Specialty / Role
                  </label>
                  <input
                    type="text"
                    value={newTechSpecialty}
                    onChange={(e) => setNewTechSpecialty(e.target.value)}
                    placeholder="e.g. Electrical & Telemetry Specialist"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Accreditation / Certificate ID
                  </label>
                  <input
                    type="text"
                    value={newTechCert}
                    onChange={(e) => setNewTechCert(e.target.value)}
                    placeholder="e.g. SLT-TECH-4521"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                    }}
                  />
                </div>
              </div>

              <div className="autocare-garage-modal-footer">
                <button
                  type="button"
                  className="autocare-garage-hero-btn"
                  onClick={() => setShowAddTechModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="autocare-garage-btn-primary">
                  Add Technician
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
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

export default GarageProfilePage;
