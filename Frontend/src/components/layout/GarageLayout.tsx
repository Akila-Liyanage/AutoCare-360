import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  X,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Menu,
  LogOut,
} from 'lucide-react';
import Footer from './Footer';
import logoImg from '../../assets/auth/download (27) (1) 2.png';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/garage-dashboard.css';

export interface GarageLayoutProps {
  activeItem?:
    | 'Overview'
    | 'Vehicles'
    | 'Maintenance'
    | 'Service records'
    | 'Quotations'
    | 'Invoices'
    | 'Documents'
    | 'Sharing'
    | 'Sharing & access'
    | 'Audit trail'
    | 'Profile'
    | string;
  breadcrumbCurrent?: string;
  children: React.ReactNode;
}

interface ToastState {
  show: boolean;
  message: string;
}

export const GarageLayout: React.FC<GarageLayoutProps> = ({
  activeItem,
  breadcrumbCurrent,
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleSignOut = () => {
    setShowProfileModal(false);
    logout();
    navigate('/login');
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setShowProfileModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMobileMenuOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Figma 8 Navigation Items
  const sidebarMenuItems: Array<{
    id: string;
    label: string;
    path: string;
  }> = [
    { id: 'Overview', label: 'Overview', path: '/garage/dashboard' },
    { id: 'Vehicles', label: 'Vehicles', path: '/garage/vehicles' },
    { id: 'Service records', label: 'Service records', path: '/garage/service-records' },
    { id: 'Generate quotation', label: 'Generate quotation', path: '/garage/quotations' },
    { id: 'Invoice generator', label: 'Invoice generator', path: '/garage/invoices' },
    { id: 'Audit trail', label: 'Audit trail', path: '/garage/audit' },
    { id: 'Notifications', label: 'Notifications', path: '/garage/notifications' },
    { id: 'Profile', label: 'Profile', path: '/garage/profile' },
  ];

  const currentActive =
    activeItem ||
    (location.pathname.startsWith('/garage/vehicles')
      ? 'Vehicles'
      : location.pathname.startsWith('/garage/service-records') || location.pathname.startsWith('/garage/maintenance')
      ? 'Service records'
      : location.pathname.startsWith('/garage/quotations')
      ? 'Generate quotation'
      : location.pathname.startsWith('/garage/invoices')
      ? 'Invoice generator'
      : location.pathname.startsWith('/garage/audit')
      ? 'Audit trail'
      : location.pathname.startsWith('/garage/notifications')
      ? 'Notifications'
      : location.pathname.startsWith('/garage/profile') || location.pathname.startsWith('/profile')
      ? 'Profile'
      : 'Overview');

  const handleNavClick = (item: (typeof sidebarMenuItems)[0]) => {
    setMobileMenuOpen(false);
    navigate(item.path);
  };

  const displayName = user?.fullName || user?.displayName || 'Perera Auto Works';
  const displayLocation = 'Colombo 05 · BR-03';
  const avatarInitials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'PA';

  return (
    <div className="autocare-garage-layout" style={{ background: '#F3F3F3' }}>
      {mobileMenuOpen && (
        <div
          className="autocare-garage-sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ====================================================================
          LEFT SIDEBAR — Exact Figma #01427C Specification
          ==================================================================== */}
      <aside
        id="autocare-garage-sidebar"
        className={`autocare-garage-sidebar ${mobileMenuOpen ? 'is-mobile-open' : ''}`}
        aria-label="Garage Navigation Sidebar"
        style={{ background: '#01427C' }}
      >
        <div>
          {/* Logo Card */}
          <div className="autocare-garage-sidebar-header-row">
            <Link
              to="/garage/dashboard"
              className="autocare-garage-logo-card"
              aria-label="AutoCare 360 Garage Dashboard"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                background: '#FFFFFF',
                borderRadius: '18px',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img src={logoImg} alt="AutoCare 360" style={{ height: '42px', width: 'auto' }} />
            </Link>
            <button
              type="button"
              className="autocare-garage-sidebar-close-btn"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close Navigation Sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Menu (8 Items) */}
          <nav className="autocare-garage-menu" aria-label="Garage Navigation">
            {sidebarMenuItems.map((item) => {
              const isActive = currentActive === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`autocare-garage-menu-item ${isActive ? 'is-active' : ''}`}
                  onClick={() => handleNavClick(item)}
                  style={{
                    borderRadius: '8px',
                    background: isActive ? 'rgba(255, 255, 255, 0.21)' : 'transparent',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#FFFFFF',
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  <span
                    className="autocare-garage-menu-dot"
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: isActive ? '#00B4EB' : '#BEDBFF',
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  />
                  <span style={{ fontSize: '13.5px' }}>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Garage Identity Card (Figma Style) */}
        <div
          className="autocare-garage-badge-card"
          onClick={() => setShowProfileModal(true)}
          role="button"
          tabIndex={0}
          title="Click to view garage profile"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setShowProfileModal(true);
          }}
          style={{
            background: 'rgba(10, 17, 40, 0.59)',
            borderRadius: '12px',
            padding: '14px 16px',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              background: '#46A84F',
              color: '#FFFFFF',
              borderRadius: '20px',
              padding: '3px 10px',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              marginBottom: '8px',
            }}
          >
            VERIFIED GARAGE
          </div>
          <h4
            className="autocare-garage-badge-name"
            style={{ color: '#FFFFFF', fontSize: '14.5px', fontWeight: 700, margin: '0 0 2px 0' }}
          >
            {displayName}
          </h4>
          <p
            className="autocare-garage-badge-location"
            style={{ color: '#9FB0C4', fontSize: '12px', margin: 0 }}
          >
            {displayLocation}
          </p>
        </div>
      </aside>

      {/* ====================================================================
          MAIN RIGHT AREA — Top Bar + Content + Footer
          ==================================================================== */}
      <div className="autocare-garage-main-wrapper">
        {/* Top Header */}
        <header
          className="autocare-garage-topbar"
          style={{
            background: '#FFFFFF',
            borderBottom: '1px solid #DCE5EF',
            height: '56px',
            padding: '0 24px',
          }}
        >
          <div className="autocare-garage-breadcrumb">
            <button
              type="button"
              className="autocare-garage-sidebar-toggle"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close Navigation Sidebar' : 'Open Navigation Sidebar'}
              aria-expanded={mobileMenuOpen}
              aria-controls="autocare-garage-sidebar"
            >
              <Menu size={18} />
            </button>
            <Link to="/garage/dashboard" className="autocare-garage-crumb-parent" style={{ color: '#617187', fontSize: '13px' }}>
              AutoCare 360
            </Link>
            <span className="autocare-garage-crumb-separator">/</span>
            <Link to="/garage/dashboard" className="autocare-garage-crumb-parent" style={{ color: '#617187', fontSize: '13px' }}>
              Garage
            </Link>
            <span className="autocare-garage-crumb-separator">/</span>
            <span className="autocare-garage-crumb-current" style={{ color: '#15263D', fontWeight: 600, fontSize: '13px' }}>
              {breadcrumbCurrent || currentActive}
            </span>
          </div>

          <div className="autocare-garage-topbar-actions" style={{ gap: '16px' }}>
            <Link
              to="/notifications"
              className="autocare-garage-notify-btn"
              aria-label="Garage Notifications"
              title="Notifications"
            >
              <Bell size={18} style={{ color: '#617187' }} />
              <span className="autocare-garage-notify-dot" aria-hidden="true" />
            </Link>

            <div
              className="autocare-garage-user-pill"
              onClick={() => setShowProfileModal(true)}
              title="View Garage Profile"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setShowProfileModal(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <span className="autocare-garage-user-name" style={{ color: '#15263D', fontWeight: 600, fontSize: '13.5px' }}>
                {displayName}
              </span>
              <div
                className="autocare-garage-user-avatar"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: '#0056A2',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                {avatarInitials}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="autocare-garage-content" style={{ padding: '24px 28px 48px 28px' }}>
          {children}
        </main>

        <Footer />
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div
          className="autocare-garage-modal-backdrop"
          onClick={() => setShowProfileModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="autocare-garage-modal" onClick={(e) => e.stopPropagation()}>
            <div className="autocare-garage-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20} />
                <h3>Garage Account Profile</h3>
              </div>
              <button
                type="button"
                className="autocare-garage-modal-close-btn"
                onClick={() => setShowProfileModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="autocare-garage-modal-body">
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#EDF8EC',
                    color: '#50B748',
                    border: '1px solid #bbf7d0',
                    padding: '6px 14px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '10px',
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>SLT-CERTIFIED LEVEL 4 REPAIR WORKSHOP</span>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>
                  {displayName}
                </h2>
                <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
                  {displayLocation}
                </p>
              </div>

              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Role</span>
                <span className="autocare-garage-profile-spec-val">{user?.role || 'garage'}</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Accreditation</span>
                <span className="autocare-garage-profile-spec-val" style={{ color: '#50B748', fontWeight: 600 }}>
                  Active through 31 Dec 2026
                </span>
              </div>
            </div>

            <div className="autocare-garage-modal-footer">
              <button
                type="button"
                className="autocare-garage-btn-signout"
                onClick={handleSignOut}
                title="Sign out"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
              <button
                type="button"
                className="autocare-garage-btn-primary"
                onClick={() => setShowProfileModal(false)}
                style={{ background: '#0056A2' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Toast */}
      {toast.show && (
        <div className="autocare-garage-toast" role="alert">
          <CheckCircle2 size={18} style={{ color: '#00B4EB', flexShrink: 0 }} />
          <span>{toast.message}</span>
          <button
            type="button"
            className="autocare-garage-toast-close"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            aria-label="Dismiss toast"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default GarageLayout;
