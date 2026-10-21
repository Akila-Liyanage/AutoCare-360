import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Pencil,
  Plus,
  Car,
  Trash2,
  Info,
  X
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../hooks/useAuth';
import { getMyVehicles, type Vehicle } from '../../services/vehicleService';
import '../../styles/profile.css';

const resolveImageUrl = (img?: string): string | undefined => {
  if (!img) return undefined;
  if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('blob:')) return img;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
  return `${base}${img.startsWith('/') ? '' : '/'}${img}`;
};

export const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState<boolean>(true);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [failedImgUrl, setFailedImgUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(() => {
    return (location.state as { successMessage?: string })?.successMessage || null;
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    let isMounted = true;

    getMyVehicles()
      .then((data) => {
        if (isMounted) {
          setVehicles(data);
          setLoadingVehicles(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Unable to load vehicle records.';
          setVehicleError(message);
          setLoadingVehicles(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute initials avatar from real name
  const getInitials = (name?: string) => {
    if (!name) return 'AC';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Safe user image check
  const rawUserImg = (user as unknown as { profileImage?: string; avatar?: string })?.profileImage ||
                     (user as unknown as { profileImage?: string; avatar?: string })?.avatar;
  const userImg = resolveImageUrl(rawUserImg);
  const canShowAvatar = !!userImg && failedImgUrl !== userImg;

  // Deterministic display Owner ID from real MongoDB _id
  const ownerId = user?._id
    ? `AC360-OW-${user._id.slice(-5).toUpperCase()}`
    : 'AC360-OW-00000';

  // Format real member since date
  const formatMemberSince = (isoDate?: string) => {
    if (!isoDate) return 'Not available';
    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) return 'Not available';
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Not available';
    }
  };

  const handleRemoveVehicle = (e: React.MouseEvent, vehicle: Vehicle) => {
    e.preventDefault();
    e.stopPropagation();
    setNotice(
      `Deletion for "${vehicle.manufacturer} ${vehicle.model} (${vehicle.registrationNumber})" is restricted in this phase. Vehicle passport removal will be integrated in subsequent releases.`
    );
  };

  const roleLabel = user?.role === 'garage'
    ? 'Verified Garage'
    : user?.role === 'admin'
    ? 'System Admin'
    : 'Verified vehicle owner';

  return (
    <div className="autocare-profile-page">
      <Navbar />

      <main className="autocare-profile-main">
        <div className="autocare-profile-container">
          {/* Main Page Header */}
          <div className="autocare-profile-page-header">
            <div className="autocare-profile-header-text">
              <span className="autocare-profile-eyebrow">OWNER MANAGEMENT</span>
              <h1 className="autocare-profile-title">Profile</h1>
              <p className="autocare-profile-desc">
                Manage your vehicle-owner identity, contact details, security and linked digital passports.
              </p>
            </div>
            <button
              type="button"
              className="autocare-profile-edit-btn"
              onClick={() => navigate('/profile/edit')}
            >
              <Pencil size={15} />
              Edit profile
            </button>
          </div>

          {/* Optional Action Notice */}
          {notice && (
            <div className="autocare-profile-notice" role="alert">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={16} />
                <span>{notice}</span>
              </div>
              <button
                type="button"
                className="autocare-profile-notice-close"
                onClick={() => setNotice(null)}
                aria-label="Dismiss notice"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Main Grid: Left Identity Card + Right Detail Cards */}
          <div className="autocare-profile-main-grid">
            {/* LEFT OWNER IDENTITY CARD */}
            <section className="autocare-profile-identity-card" aria-label="Owner Identity Card">
              <div className="autocare-profile-avatar-wrapper">
                <div className="autocare-profile-avatar-outer">
                  <div className="autocare-profile-avatar-inner">
                    {canShowAvatar && userImg ? (
                      <img
                        key={userImg}
                        src={userImg}
                        alt={user?.fullName || 'User'}
                        className="autocare-profile-avatar-img"
                        onError={() => setFailedImgUrl(userImg)}
                      />
                    ) : (
                      <span className="autocare-profile-avatar-initials">
                        {getInitials(user?.fullName)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="autocare-profile-avatar-edit-badge"
                  onClick={() => navigate('/profile/edit')}
                  aria-label="Edit profile photo"
                  title="Edit profile photo"
                >
                  <Pencil size={14} />
                </button>
              </div>

              <h2 className="autocare-profile-owner-name">{user?.fullName || 'Vehicle Owner'}</h2>
              <p className="autocare-profile-owner-role">{roleLabel}</p>
              <span className="autocare-profile-verified-badge">IDENTITY VERIFIED</span>

              <div className="autocare-profile-id-divider" />

              <div className="autocare-profile-meta-list">
                <div className="autocare-profile-meta-row">
                  <span className="autocare-profile-meta-label">Owner ID</span>
                  <span className="autocare-profile-meta-value autocare-mono">{ownerId}</span>
                </div>
                <div className="autocare-profile-meta-row">
                  <span className="autocare-profile-meta-label">Member since</span>
                  <span className="autocare-profile-meta-value">
                    {formatMemberSince(user?.createdAt)}
                  </span>
                </div>
                <div className="autocare-profile-meta-row">
                  <span className="autocare-profile-meta-label">Primary region</span>
                  <span className="autocare-profile-meta-value">
                    {user?.city && user?.country
                      ? `${user.city}, ${user.country}`
                      : user?.city || user?.country || 'Not provided'}
                  </span>
                </div>
              </div>
            </section>

            {/* RIGHT COLUMN DETAILS */}
            <div className="autocare-profile-details-col">
              {/* Personal & Contact Information Card */}
              <section className="autocare-profile-card" aria-label="Personal and Contact Information">
                <div className="autocare-profile-card-header">
                  <h3 className="autocare-profile-card-title">Personal & contact information</h3>
                  <p className="autocare-profile-card-subtitle">
                    Registration details used for owner verification and authorized sharing.
                  </p>
                </div>

                <div className="autocare-profile-fields-grid">
                  <div className="autocare-profile-field-item">
                    <span className="autocare-profile-field-label">Full name</span>
                    <div className="autocare-profile-field-content">
                      <span className="autocare-profile-field-value">
                        {user?.fullName || 'Not provided'}
                      </span>
                    </div>
                  </div>

                  <div className="autocare-profile-field-item">
                    <span className="autocare-profile-field-label">Contact phone</span>
                    <div className="autocare-profile-field-content">
                      <span className="autocare-profile-field-value">
                        {user?.phone || 'Not provided'}
                      </span>
                    </div>
                  </div>

                  <div className="autocare-profile-field-item">
                    <span className="autocare-profile-field-label">Email address</span>
                    <div className="autocare-profile-field-content">
                      <span className="autocare-profile-field-value">
                        {user?.email || 'Not provided'}
                      </span>
                      {user?.status === 'active' && (
                        <span className="autocare-profile-status-pill">VERIFIED</span>
                      )}
                    </div>
                  </div>

                  <div className="autocare-profile-field-item">
                    <span className="autocare-profile-field-label">Preferred language</span>
                    <div className="autocare-profile-field-content">
                      <span className="autocare-profile-field-value">
                        {user?.preferredLanguage || 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Account & Security Card */}
              <section className="autocare-profile-card" aria-label="Account and Security">
                <div className="autocare-profile-card-header-flex">
                  <div>
                    <h3 className="autocare-profile-card-title">Account & security</h3>
                    <p className="autocare-profile-card-subtitle">
                      Your owner identity is protected and cryptographically bound to each vehicle passport.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="autocare-profile-security-btn"
                    onClick={() =>
                      setNotice('Security credentials management will be available in future releases.')
                    }
                  >
                    Security settings
                  </button>
                </div>

                <div className="autocare-profile-fields-grid">
                  <div className="autocare-profile-field-item">
                    <span className="autocare-profile-field-label">Password</span>
                    <div className="autocare-profile-field-content">
                      <span className="autocare-profile-field-value">Protected</span>
                    </div>
                  </div>

                  <div className="autocare-profile-field-item">
                    <span className="autocare-profile-field-label">Last sign in</span>
                    <div className="autocare-profile-field-content">
                      <span className="autocare-profile-field-value">Not available</span>
                    </div>
                  </div>

                  <div className="autocare-profile-field-item">
                    <span className="autocare-profile-field-label">Two-factor authentication</span>
                    <div className="autocare-profile-field-content">
                      <span className="autocare-profile-field-value">Not configured</span>
                    </div>
                  </div>

                  <div className="autocare-profile-field-item">
                    <span className="autocare-profile-field-label">Trusted devices</span>
                    <div className="autocare-profile-field-content">
                      <span className="autocare-profile-field-value">Not available</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* BOTTOM: LINKED VEHICLES SECTION */}
          <section className="autocare-profile-vehicles-section" aria-label="Linked Vehicles">
            <div className="autocare-profile-vehicles-header">
              <div>
                <h3 className="autocare-profile-card-title">Linked vehicles</h3>
                <p className="autocare-profile-card-subtitle">
                  Vehicle passports administered by this owner account.
                </p>
              </div>
              <button
                type="button"
                className="autocare-profile-add-vehicle-btn"
                onClick={() => navigate('/vehicles/add')}
              >
                <Plus size={16} />
                Add vehicle
              </button>
            </div>

            {loadingVehicles ? (
              <div className="autocare-profile-loading-state">
                <div className="autocare-profile-spinner" />
                <span>Loading linked vehicle passports...</span>
              </div>
            ) : vehicleError ? (
              <div className="autocare-profile-empty-vehicles">
                <p style={{ color: '#dc2626' }}>{vehicleError}</p>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="autocare-profile-empty-vehicles">
                <Car size={36} className="autocare-profile-empty-icon" />
                <h4>No vehicles linked to this account yet</h4>
                <p>Register your first vehicle to generate its cryptographic digital passport.</p>
                <button
                  type="button"
                  className="autocare-profile-add-vehicle-btn"
                  onClick={() => navigate('/vehicles/add')}
                  style={{ marginTop: '8px' }}
                >
                  <Plus size={16} />
                  Add vehicle
                </button>
              </div>
            ) : (
              <div className="autocare-profile-vehicles-grid">
                {vehicles.map((v) => (
                  <div key={v._id} className="autocare-profile-vehicle-card">
                    {resolveImageUrl(v.imageUrl) ? (
                      <img
                        src={resolveImageUrl(v.imageUrl)}
                        alt={`${v.manufacturer} ${v.model}`}
                        className="autocare-profile-vehicle-thumb"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        className="autocare-profile-vehicle-thumb"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f1f5f9',
                          color: '#64748b',
                          gap: '4px',
                        }}
                      >
                        <Car size={24} style={{ color: '#94a3b8' }} />
                        <span style={{ fontSize: '11px', fontWeight: 600 }}>No image</span>
                      </div>
                    )}
                    <div className="autocare-profile-vehicle-info">
                      <div className="autocare-profile-vehicle-top">
                        <h4 className="autocare-profile-vehicle-name">
                          {v.manufacturer} {v.model} {v.manufacturingYear}
                        </h4>
                        <span className="autocare-profile-trust-pending">
                          Trust score pending
                        </span>
                      </div>
                      <p className="autocare-profile-vehicle-meta">
                        {v.registrationNumber} · {v.currentMileage ? v.currentMileage.toLocaleString() + ' km' : '0 km'}
                      </p>
                      <div className="autocare-profile-vehicle-actions">
                        <Link
                          to={`/vehicles/${v._id}`}
                          className="autocare-profile-passport-link"
                        >
                          Open vehicle passport →
                        </Link>
                        <button
                          type="button"
                          className="autocare-profile-vehicle-remove-btn"
                          onClick={(e) => handleRemoveVehicle(e, v)}
                          title="Remove vehicle"
                        >
                          <Trash2 size={11} />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
