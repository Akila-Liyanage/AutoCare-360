import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  X,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Menu,
} from 'lucide-react';
import Footer from './Footer';
import logoImg from '../../assets/auth/download (27) (1) 2.png';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/garage-dashboard.css';

export interface GarageLayoutProps {
  activeItem?: 'Overview' | 'Vehicles' | 'Service records' | 'Documents' | 'Sharing & access' | 'Audit trail' | 'Notifications';
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
  const { user } = useAuth();

  // Mobile menu drawer toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Floating Action Toast State
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  const sidebarMenuItems: Array<{
    id: 'Overview' | 'Vehicles' | 'Service records' | 'Documents' | 'Sharing & access' | 'Audit trail' | 'Notifications';
    label: string;
    path: string;
  }> = [
    { id: 'Overview', label: 'Overview', path: '/garage/dashboard' },
    { id: 'Vehicles', label: 'Vehicles', path: '/garage/vehicles' },
    { id: 'Service records', label: 'Service records', path: '/garage/service-records' },
    { id: 'Documents', label: 'Documents', path: '/garage/documents' },
    { id: 'Sharing & access', label: 'Sharing & access', path: '/garage/sharing' },
    { id: 'Audit trail', label: 'Audit trail', path: '/garage/audit' },
    { id: 'Notifications', label: 'Notifications', path: '/notifications' },
  ];

  // Determine current active item from prop or URL
  const currentActive =
    activeItem ||
    (location.pathname.startsWith('/garage/vehicles')
      ? 'Vehicles'
      : location.pathname.startsWith('/garage/service-records')
      ? 'Service records'
      : location.pathname.startsWith('/garage/documents')
      ? 'Documents'
      : location.pathname.startsWith('/garage/sharing')
      ? 'Sharing & access'
      : location.pathname.startsWith('/garage/audit')
      ? 'Audit trail'
      : location.pathname.startsWith('/notifications')
      ? 'Notifications'
      : 'Overview');

  const handleNavClick = (item: (typeof sidebarMenuItems)[0]) => {
    setMobileMenuOpen(false);
    navigate(item.path);
  };

  return (
    <div className="autocare-garage-layout">
      {/* ====================================================================
          LEFT SIDEBAR — Verified Garage Navigation
          ==================================================================== */}
      <aside
        className={`autocare-garage-sidebar ${mobileMenuOpen ? 'is-mobile-open' : ''}`}
        aria-label="Garage Navigation Sidebar"
      >
        <div>
          {/* Logo Card */}
          <Link
            to="/garage/dashboard"
            className="autocare-garage-logo-card"
            aria-label="AutoCare 360 Garage Dashboard"
          >
            <img src={logoImg} alt="AutoCare 360" />
          </Link>

          {/* Sidebar Menu Items */}
          <nav className="autocare-garage-menu" aria-label="Garage Navigation">
            {sidebarMenuItems.map((item) => {
              const isActive = currentActive === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`autocare-garage-menu-item ${isActive ? 'is-active' : ''}`}
                  onClick={() => handleNavClick(item)}
                >
                  <span className="autocare-garage-menu-dot" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Verified Garage Badge Card */}
        <div
          className="autocare-garage-badge-card"
          onClick={() => setShowProfileModal(true)}
          role="button"
          tabIndex={0}
          title="Click to view verified accreditation details"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setShowProfileModal(true);
          }}
          style={{ cursor: 'pointer' }}
        >
          <span className="autocare-garage-verified-pill">VERIFIED GARAGE</span>
          <h4 className="autocare-garage-badge-name">Perera Auto Works</h4>
          <p className="autocare-garage-badge-location">Colombo 05 · BR-03</p>
        </div>
      </aside>

      {/* ====================================================================
          MAIN RIGHT AREA — Top Bar + Content + Footer
          ==================================================================== */}
      <div className="autocare-garage-main-wrapper">
        {/* Top Header */}
        <header className="autocare-garage-topbar">
          <div className="autocare-garage-breadcrumb">
            <button
              type="button"
              className="autocare-garage-sidebar-toggle"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle Navigation Sidebar"
              style={{ display: 'none', marginRight: '8px' }}
            >
              <Menu size={20} />
            </button>
            <Link to="/garage/dashboard" className="autocare-garage-crumb-parent">
              AutoCare 360
            </Link>
            <span className="autocare-garage-crumb-separator">/</span>
            <Link to="/garage/dashboard" className="autocare-garage-crumb-parent">
              Garage
            </Link>
            <span className="autocare-garage-crumb-separator">/</span>
            <span className="autocare-garage-crumb-current">
              {breadcrumbCurrent || currentActive}
            </span>
          </div>

          <div className="autocare-garage-topbar-actions">
            <Link
              to="/notifications"
              className="autocare-garage-notify-btn"
              aria-label="Garage Notifications"
              title="Notifications"
            >
              <Bell size={18} />
              <span className="autocare-garage-notify-dot" aria-hidden="true" />
            </Link>

            <div
              className="autocare-garage-user-pill"
              onClick={() => setShowProfileModal(true)}
              title="View Garage Representative Profile"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setShowProfileModal(true);
              }}
            >
              <span className="autocare-garage-user-name">{user?.fullName || 'Kaveesha P.'}</span>
              <div className="autocare-garage-user-avatar">
                {user?.fullName
                  ? user.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                  : 'KP'}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="autocare-garage-content">{children}</main>

        {/* AutoCare Standard Footer */}
        <Footer />
      </div>

      {/* ====================================================================
          SHARED MODALS & TOASTS
          ==================================================================== */}
      {/* Verified Garage Profile Modal */}
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
                <h3>Verified Garage Profile</h3>
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
                    background: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 800,
                    marginBottom: '10px',
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>SLT-CERTIFIED LEVEL 4 REPAIR WORKSHOP</span>
                </div>
                <h2
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    margin: '0 0 4px 0',
                    color: '#0f172a',
                  }}
                >
                  Perera Auto Works (Pvt) Ltd
                </h2>
                <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
                  Authorized Inspection &amp; Ledger Maintenance Station
                </p>
              </div>

              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Business Reg. (BR)</span>
                <span className="autocare-garage-profile-spec-val">PV-102948-BR03</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Operating Location</span>
                <span className="autocare-garage-profile-spec-val">Havelock Road, Colombo 05</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Lead Certifier</span>
                <span className="autocare-garage-profile-spec-val">
                  Kaveesha Perera (Master Tech)
                </span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Blockchain Key Signature</span>
                <span className="autocare-garage-profile-spec-val">0x9f4a...81c2 (Active)</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Accreditation Expiry</span>
                <span className="autocare-garage-profile-spec-val">31 December 2026</span>
              </div>
            </div>

            <div className="autocare-garage-modal-footer">
              <button
                type="button"
                className="autocare-garage-btn-primary"
                onClick={() => {
                  setShowProfileModal(false);
                  showToast('Accreditation certificate verified on SLT Mobitel Trust Network.');
                }}
              >
                Close
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
