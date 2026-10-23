import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  FileText,
  Car,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { getMyVehicles, type Vehicle } from '../../services/vehicleService';
import { resolveImageUrl } from '../../utils/imageUrl';

export const MyVehiclesPage: React.FC = () => {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getMyVehicles()
      .then((data) => {
        if (isMounted) {
          setVehicles(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Unable to load vehicle records. Please try again.';
          setError(message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleReload = () => {
    setLoading(true);
    setError(null);
    getMyVehicles()
      .then((data) => {
        setVehicles(data);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to load vehicle records. Please try again.';
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Format mileage as "45,230 km"
  const formatMileage = (km?: number): string => {
    if (km === undefined || km === null || isNaN(km)) return '0 km';
    return `${km.toLocaleString()} km`;
  };

  // Visual placeholder for Trust Score percentage matching Figma (92%, 78%)
  // Note: FR-10 AI calculation is NOT implemented yet; this is a temporary visual-only badge.
  const getDisplayTrustScore = (vehicle: Vehicle): { score: number; isHigh: boolean } => {
    const seed = (vehicle.manufacturingYear || 2022) + (vehicle.model?.length || 0);
    const score = seed % 2 === 0 ? 92 : 78;
    return {
      score,
      isHigh: score >= 85,
    };
  };

  return (
    <div className="autocare-my-vehicles-page">
      <Navbar />

      <main className="autocare-my-vehicles-main">
        <div className="autocare-my-vehicles-container">
          {/* Header Row: "My Vehicles" and "View All" */}
          <div className="autocare-my-vehicles-header">
            <h1 className="autocare-my-vehicles-title">My Vehicles</h1>
            <button
              type="button"
              className="autocare-my-vehicles-view-all"
              onClick={handleReload}
              title="Refresh vehicle list"
            >
              View All
            </button>
          </div>

          {/* 1. Loading State */}
          {loading && (
            <div className="autocare-vehicles-loading-state">
              <div className="autocare-vehicles-grid">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="autocare-vehicle-card is-skeleton">
                    <div className="autocare-card-image-wrapper is-skeleton-box" />
                    <div className="autocare-card-body is-skeleton-body">
                      <div className="autocare-skeleton-line is-title" />
                      <div className="autocare-skeleton-line is-meta" />
                    </div>
                    <div className="autocare-card-edit-btn is-skeleton-btn" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Error State */}
          {!loading && error && (
            <div className="autocare-vehicles-error-state">
              <AlertCircle size={40} className="autocare-error-icon" />
              <h3 className="autocare-error-title">Unable to Load Vehicles</h3>
              <p className="autocare-error-desc">
                {error}
              </p>
              <button
                type="button"
                className="autocare-btn-primary"
                onClick={handleReload}
              >
                <RefreshCw size={16} />
                <span>Try Again</span>
              </button>
            </div>
          )}

          {/* 3. Empty State */}
          {!loading && !error && vehicles.length === 0 && (
            <div className="autocare-vehicles-empty-state">
              <div className="autocare-empty-icon-wrap">
                <Car size={48} />
              </div>
              <h3 className="autocare-empty-title">No vehicles registered yet</h3>
              <p className="autocare-empty-desc">
                You have not registered any vehicle digital passports yet. Register your vehicle to track maintenance, verify mileage, and protect resale value.
              </p>
              <Link to="/vehicles/add" className="autocare-add-vehicle-main-btn">
                <PlusCircle size={20} />
                <span>Add Vehicle</span>
              </Link>
            </div>
          )}

          {/* 4. Success State — 3-Column Grid Matching Figma */}
          {!loading && !error && vehicles.length > 0 && (
            <>
              <div className="autocare-vehicles-grid">
                {vehicles.map((vehicle) => {
                  const trust = getDisplayTrustScore(vehicle);
                  const resolvedImg = resolveImageUrl(vehicle.imageUrl?.trim());

                  return (
                    <div
                      key={vehicle._id}
                      className="autocare-vehicle-card"
                      onClick={() => navigate(`/vehicles/${vehicle._id}`)}
                      style={{ cursor: 'pointer' }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          navigate(`/vehicles/${vehicle._id}`);
                        }
                      }}
                      aria-label={`View passport for ${vehicle.manufacturer} ${vehicle.model}`}
                    >
                      {/* Top: Image Area with Red Remove Button */}
                      <div className="autocare-card-image-wrapper">
                        {resolvedImg ? (
                          <img
                            src={resolvedImg}
                            alt={`${vehicle.manufacturer} ${vehicle.model}`}
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
                            <Car size={34} style={{ color: '#94a3b8' }} />
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>No vehicle image</span>
                          </div>
                        )}

                        {/* Top-Right: Truthful Vehicle Status Badge */}
                        <span
                          className="autocare-card-status-badge"
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px',
                            backgroundColor: vehicle.status === 'Archived' ? '#f1f5f9' : '#ecfdf5',
                            color: vehicle.status === 'Archived' ? '#64748b' : '#047857',
                            border: vehicle.status === 'Archived' ? '1px solid #cbd5e1' : '1px solid #a7f3d0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            zIndex: 2,
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: vehicle.status === 'Archived' ? '#94a3b8' : '#10b981',
                            }}
                          />
                          {vehicle.status || 'Active'}
                        </span>
                      </div>

                      {/* Middle: Vehicle Metadata */}
                      <div className="autocare-card-body">
                        {/* Top Row: Title + Trust Badge */}
                        <div className="autocare-card-title-row">
                          <h2 className="autocare-card-title">
                            {vehicle.manufacturer} {vehicle.model} {vehicle.manufacturingYear}
                          </h2>
                          <span
                            className={`autocare-trust-score-badge ${trust.isHigh ? 'is-high' : 'is-mid'
                              }`}
                          >
                            {trust.score}%
                          </span>
                        </div>

                        {/* Bottom Row: Reg Number + Mileage */}
                        <div className="autocare-card-meta-row">
                          <span className="autocare-card-reg-number">
                            {vehicle.registrationNumber}
                          </span>
                          <span className="autocare-card-mileage">
                            {formatMileage(vehicle.currentMileage)}
                          </span>
                        </div>
                      </div>

                      {/* Bottom: Blue Full-Width View Passport Action Bar */}
                      <button
                        type="button"
                        className="autocare-card-edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/vehicles/${vehicle._id}`);
                        }}
                        aria-label={`View passport for ${vehicle.manufacturer} ${vehicle.model}`}
                      >
                        <FileText size={16} />
                        <span>View Passport</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Large Centered "+ Add Vehicle" Button Below Grid */}
              <div className="autocare-my-vehicles-cta-section">
                <Link to="/vehicles/add" className="autocare-add-vehicle-main-btn">
                  <PlusCircle size={22} />
                  <span>Add Vehicle</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyVehiclesPage;
