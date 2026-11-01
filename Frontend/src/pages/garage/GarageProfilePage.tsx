import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Lock,
  Building2,
  Info,
  Edit3,
  X,
} from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/garage-dashboard.css';

export const GarageProfilePage: React.FC = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState({
    fullName: user?.fullName || user?.displayName || 'Kaveesha P.',
    displayName: user?.displayName || user?.fullName || 'Perera Auto Works',
    workshopName: 'Perera Auto Works',
    email: user?.email || 'kaveesha.p@example.com',
    phone: user?.phone || '+94 77 000 1234',
    role: 'Garage administrator',
    status: 'active',
    garageIdentifier: 'BR-03',
    validThrough: '31 Dec 2026',
    registrationType: 'Verified Garage Partner',
    businessRegistrationNumber: 'PV-PAW-2024-0318',
    city: user?.city || 'Colombo 05, Western Province',
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({ ...profile });
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const res = await api.get('/garage/profile');
        if (isMounted && res.data?.data?.profile) {
          setProfile(res.data.data.profile);
          setEditForm(res.data.data.profile);
        }
      } catch {
        // Fallback to authenticated user info
      }
    };
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      await api.put('/garage/profile', {
        fullName: editForm.fullName,
        displayName: editForm.displayName,
        phone: editForm.phone,
        city: editForm.city,
      });
      setProfile({ ...editForm });
      setIsEditing(false);
      setSuccessMsg('Workshop profile details updated successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <GarageLayout activeItem="Profile" breadcrumbCurrent="Profile">
      {/* Page Title Row */}
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
              color: '#0A1128',
              margin: '0 0 4px 0',
            }}
          >
            Profile
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
            Your account, workshop identity and partner accreditation in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(true)}
          style={{
            background: '#0056A2',
            borderRadius: '7px',
            padding: '9px 16px',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '13.5px',
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 86, 162, 0.22)',
          }}
        >
          <Edit3 size={15} />
          <span>Edit Profile</span>
        </button>
      </div>

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

      {/* ====================================================================
          HERO BANNER (Figma Image 4)
          ==================================================================== */}
      <section
        style={{
          background: '#01427C',
          borderRadius: '12px',
          padding: '24px',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '22px',
          boxShadow: '0 2px 10px rgba(1, 66, 124, 0.15)',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {/* Workshop Thumbnail Icon */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.25)',
            }}
          >
            <Building2 size={36} />
          </div>

          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#50B748',
                color: '#FFFFFF',
                borderRadius: '12px',
                padding: '2px 9px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.4px',
                marginBottom: '6px',
              }}
            >
              <CheckCircle2 size={12} />
              Verified Garage Partner
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px 0', color: '#FFFFFF' }}>
              {profile.workshopName}
            </h2>
            <p style={{ fontSize: '13px', color: '#B9CAE0', margin: 0 }}>
              {profile.city} · {profile.garageIdentifier}
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.75)',
              letterSpacing: '0.5px',
              fontWeight: 600,
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}
          >
            ACCREDITATION VALID THROUGH
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
            {profile.validThrough}
          </div>
        </div>
      </section>

      {/* ====================================================================
          2x2 GRID (Figma Image 4)
          ==================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px',
          marginBottom: '22px',
        }}
      >
        {/* Card 1: Account & Contact Information */}
        <section
          style={{
            background: '#FFFFFF',
            border: '1px solid #DCE5EF',
            borderRadius: '14px',
            padding: '22px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: '#0A1128' }}>
            Account & contact information
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748B' }}>
            Primary representative for your garage workspace.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginBottom: '3px' }}>
                Full Name / Representative
              </span>
              <strong style={{ fontSize: '13.5px', color: '#0A1128' }}>{profile.fullName}</strong>
            </div>

            <div>
              <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginBottom: '3px' }}>
                Account role
              </span>
              <strong style={{ fontSize: '13.5px', color: '#0A1128' }}>{profile.role}</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginBottom: '3px' }}>
                Email Address
              </span>
              <strong style={{ fontSize: '13.5px', color: '#0A1128' }}>{profile.email}</strong>
            </div>

            <div>
              <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginBottom: '3px' }}>
                Phone Number
              </span>
              <strong style={{ fontSize: '13.5px', color: '#0A1128' }}>{profile.phone}</strong>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: '11.5px', color: '#94A3B8' }}>
            Design sample contact details - not verified personal information.
          </p>
        </section>

        {/* Card 2: Partner Verification */}
        <section
          style={{
            background: '#FFFFFF',
            border: '1px solid #DCE5EF',
            borderRadius: '14px',
            padding: '22px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0', color: '#0A1128' }}>
            Partner verification
          </h3>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#DCFCE7',
              color: '#15803D',
              borderRadius: '12px',
              padding: '3px 9px',
              fontSize: '11.5px',
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            <CheckCircle2 size={13} />
            Verified business
          </div>

          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginBottom: '2px' }}>
              Garage identifier
            </span>
            <strong style={{ fontSize: '14px', color: '#0A1128' }}>{profile.garageIdentifier}</strong>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginBottom: '2px' }}>
              Valid through
            </span>
            <strong style={{ fontSize: '14px', color: '#0A1128' }}>{profile.validThrough}</strong>
          </div>

          <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: '16px' }}>
            Accredited to publish verified service records to the AutoCare 360 ledger.
          </p>
        </section>

        {/* Card 3: Workshop Accreditation Details */}
        <section
          style={{
            background: '#FFFFFF',
            border: '1px solid #DCE5EF',
            borderRadius: '14px',
            padding: '22px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', color: '#0A1128' }}>
            Workshop accreditation details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginBottom: '3px' }}>
                Workshop / Business Legal Name
              </span>
              <strong style={{ fontSize: '13.5px', color: '#0A1128' }}>{profile.workshopName}</strong>
            </div>

            <div>
              <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginBottom: '3px' }}>
                Registration type
              </span>
              <strong style={{ fontSize: '13.5px', color: '#0A1128' }}>{profile.registrationType}</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginBottom: '3px' }}>
                Business Registration (BRN / License)
              </span>
              <strong style={{ fontSize: '13.5px', color: '#0A1128' }}>{profile.businessRegistrationNumber}</strong>
            </div>

            <div>
              <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginBottom: '3px' }}>
                City / Region
              </span>
              <strong style={{ fontSize: '13.5px', color: '#0A1128' }}>{profile.city}</strong>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: '11.5px', color: '#94A3B8' }}>
            BRN shown as illustrative design content.
          </p>
        </section>

        {/* Card 4: Account Security */}
        <section
          style={{
            background: '#FFFFFF',
            border: '1px solid #DCE5EF',
            borderRadius: '14px',
            padding: '22px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', color: '#0A1128' }}>
            Account security
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Lock size={16} style={{ color: '#0056A2' }} />
            <strong style={{ fontSize: '13.5px', color: '#0A1128' }}>Password protected</strong>
          </div>

          <p style={{ margin: '0 0 16px 0', fontSize: '12.5px', color: '#64748B', lineHeight: '18px' }}>
            Manage your password securely from Edit Profile. Your password is never displayed.
          </p>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            style={{
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              padding: '7px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            Update password
          </button>
        </section>
      </div>

      {/* ====================================================================
          INFORMATION NOTICE (Figma Image 4)
          ==================================================================== */}
      <div
        style={{
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '10px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <Info size={18} style={{ color: '#0056A2', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ fontSize: '13px', color: '#0A1128', display: 'block', marginBottom: '3px' }}>
            Keep your workshop information up to date
          </strong>
          <p style={{ margin: 0, fontSize: '12px', color: '#334155', lineHeight: '18px' }}>
            Changes to your legal business name or BRN / License may require a new accreditation review. Existing committed service records remain unchanged.
          </p>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 17, 40, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.16)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#0A1128' }}>
                Edit Workshop Profile
              </h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Representative Full Name
                </label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
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
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
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
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  City / Location
                </label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  style={{
                    background: '#0056A2',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    cursor: saveLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </GarageLayout>
  );
};

export default GarageProfilePage;
