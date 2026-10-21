import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  X,
  Menu,
  LogOut,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import Footer from './Footer';
import { useAuth } from '../../hooks/useAuth';
import { useGarageUnreadCount } from '../../pages/garage/garageNotificationStore';
import logoImg from '../../assets/auth/download (27) (1) 2.png';
import '../../styles/garage-dashboard.css';

export interface GarageLayoutProps {
  activeItem?:
    | 'Overview'
    | 'Vehicles'
    | 'Service records'
    | 'Quotations'
    | 'Invoices'
    | 'Documents'
    | 'Sharing & access'
    | 'Audit trail'
    | 'Notifications';
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
  const unreadCount = useGarageUnreadCount();

  // Mobile menu drawer toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // User Dropdown State
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Floating Action Toast State
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer and dropdown on route change
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setMobileMenuOpen(false);
    setShowDropdown(false);
  }

  const sidebarMenuItems: Array<{
    id:
      | 'Overview'
      | 'Vehicles'
      | 'Service records'
      | 'Quotations'
      | 'Invoices'
      | 'Documents'
      | 'Sharing & access'
      | 'Audit trail'
      | 'Notifications';
    label: string;
    path: string;
  }> = [
    { id: 'Overview', label: 'Overview', path: '/garage/dashboard' },
    { id: 'Vehicles', label: 'Vehicles', path: '/garage/vehicles' },
    { id: 'Service records', label: 'Service records', path: '/garage/service-records' },
    { id: 'Quotations', label: 'Quotations', path: '/garage/quotations' },
    { id: 'Invoices', label: 'Invoices', path: '/garage/invoices' },
    { id: 'Documents', label: 'Documents', path: '/garage/documents' },
    { id: 'Sharing & access', label: 'Sharing & access', path: '/garage/sharing' },
    { id: 'Audit trail', label: 'Audit trail', path: '/garage/audit' },
    { id: 'Notifications', label: 'Notifications', path: '/garage/notifications' },
  ];

  // Determine current active item from prop or URL
  const currentActive =
    activeItem ||
    (location.pathname.startsWith('/garage/vehicles')
      ? 'Vehicles'
      : location.pathname.startsWith('/garage/service-records')
      ? 'Service records'
      : location.pathname.startsWith('/garage/quotations') || location.pathname.startsWith('/garage/quotation/new')
      ? 'Quotations'
      : location.pathname.startsWith('/garage/invoices') || location.pathname.startsWith('/garage/invoice/new')
      ? 'Invoices'
      : location.pathname.startsWith('/garage/documents')
      ? 'Documents'
      : location.pathname.startsWith('/garage/sharing')
      ? 'Sharing & access'
      : location.pathname.startsWith('/garage/audit')
      ? 'Audit trail'
      : location.pathname.startsWith('/garage/notifications')
      ? 'Notifications'
      : 'Overview');

  const handleNavClick = (item: (typeof sidebarMenuItems)[0]) => {
    setMobileMenuOpen(false);
    navigate(item.path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.fullName || 'Kaveesha P.';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'KP';

  return (
    <div className="autocare-garage-layout">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="autocare-garage-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ====================================================================
          LEFT SIDEBAR — Verified Garage Navigation
          ==================================================================== */}
      <aside
        className={`autocare-garage-sidebar ${mobileMenuOpen ? 'is-mobile-open' : ''}`}
        aria-label="Garage Navigation Sidebar"
      >
        <div>
          {/* Logo Card with Mobile Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <Link
              to="/garage/dashboard"
              className="autocare-garage-logo-card"
              style={{ marginBottom: 0, flex: 1 }}
              aria-label="AutoCare 360 Garage Dashboard"
            >
              <img src={logoImg} alt="AutoCare 360" />
            </Link>
            <button
              type="button"
              className="autocare-garage-sidebar-close"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close Navigation Drawer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Sidebar Menu Items */}
          <nav className="autocare-garage-menu" aria-label="Garage Navigation">
            {sidebarMenuItems.map((item) => {
              const isActive = currentActive === item.id;
              const isNotification = item.id === 'Notifications';
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`autocare-garage-menu-item ${isActive ? 'is-active' : ''}`}
                  onClick={() => handleNavClick(item)}
                >
                  <span className="autocare-garage-menu-dot" aria-hidden="true" />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {isNotification && unreadCount > 0 && (
                    <span
                      style={{
                        background: '#ef4444',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '1px 7px',
                        borderRadius: '10px',
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Verified Garage Badge Card — Links to Profile */}
        <div
          className="autocare-garage-badge-card"
          onClick={() => navigate('/garage/profile')}
          role="button"
          tabIndex={0}
          title="Click to view & edit workshop accreditation profile"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') navigate('/garage/profile');
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
            {/* Notification Bell with Dynamic Unread Counter */}
            <Link
              to="/garage/notifications"
              className="autocare-garage-notify-btn"
              aria-label={`Garage Notifications (${unreadCount} unread)`}
              title={`Notifications (${unreadCount} unread)`}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="autocare-garage-notify-badge" aria-label={`${unreadCount} unread`}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* User Profile Pill with Interactive Dropdown Menu */}
            <div className="autocare-garage-user-wrapper" ref={dropdownRef}>
              <div
                className="autocare-garage-user-pill"
                onClick={() => setShowDropdown((prev) => !prev)}
                title="Account menu"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setShowDropdown((prev) => !prev);
                }}
              >
                <span className="autocare-garage-user-name">{displayName}</span>
                <div className="autocare-garage-user-avatar">{initials}</div>
              </div>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="autocare-garage-user-dropdown" role="menu">
                  <div className="autocare-garage-user-dropdown-header">
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
                      {displayName}
                    </strong>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Perera Auto Works · BR-03
                    </span>
                  </div>

                  <button
                    type="button"
                    className="autocare-garage-dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      setShowDropdown(false);
                      navigate('/garage/profile');
                    }}
                  >
                    <Building2 size={15} />
                    <span>Workshop Profile</span>
                  </button>

                  <button
                    type="button"
                    className="autocare-garage-dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      setShowDropdown(false);
                      navigate('/garage/notifications');
                    }}
                  >
                    <Bell size={15} />
                    <span>Notifications ({unreadCount})</span>
                  </button>

                  <button
                    type="button"
                    className="autocare-garage-dropdown-item is-logout"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <LogOut size={15} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="autocare-garage-content">{children}</main>

        {/* AutoCare Standard Footer */}
        <Footer />
      </div>

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
