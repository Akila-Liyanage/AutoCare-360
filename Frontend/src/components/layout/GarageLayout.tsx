import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  LogOut,
  Menu,
  X,
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

type GarageMenuItem = {
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
};

export const GarageLayout: React.FC<GarageLayoutProps> = ({
  activeItem,
  breadcrumbCurrent,
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const unreadCount = useGarageUnreadCount();

  // ============================================================
  // MOBILE NAVIGATION
  // ============================================================

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState<boolean>(false);

  // ============================================================
  // USER MENU
  // ============================================================

  const [showDropdown, setShowDropdown] =
    useState<boolean>(false);

  const dropdownRef =
    useRef<HTMLDivElement>(null);

  // ============================================================
  // TOAST
  // ============================================================

  const [toast, setToast] =
    useState<ToastState>({
      show: false,
      message: '',
    });

  // ============================================================
  // CLOSE USER MENU WHEN CLICKING OUTSIDE
  // ============================================================

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  // ============================================================
  // CLOSE MOBILE MENU / DROPDOWN AFTER ROUTE CHANGE
  // ============================================================

  useEffect(() => {
    setMobileMenuOpen(false);
    setShowDropdown(false);
  }, [location.pathname]);

  // ============================================================
  // GARAGE SIDEBAR MENU
  // ============================================================

  const sidebarMenuItems: GarageMenuItem[] = [
    {
      id: 'Overview',
      label: 'Overview',
      path: '/garage/dashboard',
    },
    {
      id: 'Vehicles',
      label: 'Vehicles',
      path: '/garage/vehicles',
    },
    {
      id: 'Service records',
      label: 'Service records',
      path: '/garage/service-records',
    },
    {
      id: 'Quotations',
      label: 'Quotations',
      path: '/garage/quotations',
    },
    {
      id: 'Invoices',
      label: 'Invoices',
      path: '/garage/invoices',
    },
    {
      id: 'Documents',
      label: 'Documents',
      path: '/garage/documents',
    },
    {
      id: 'Sharing & access',
      label: 'Sharing & access',
      path: '/garage/sharing',
    },
    {
      id: 'Audit trail',
      label: 'Audit trail',
      path: '/garage/audit',
    },
    {
      id: 'Notifications',
      label: 'Notifications',
      path: '/garage/notifications',
    },
  ];

  // ============================================================
  // DETERMINE ACTIVE SIDEBAR ITEM
  // ============================================================

  const currentActive =
    activeItem ||
    (
      location.pathname.startsWith(
        '/garage/vehicles'
      )
        ? 'Vehicles'
        : location.pathname.startsWith(
              '/garage/service-records'
            )
          ? 'Service records'
          : location.pathname.startsWith(
                '/garage/quotations'
              ) ||
              location.pathname.startsWith(
                '/garage/quotation/new'
              )
            ? 'Quotations'
            : location.pathname.startsWith(
                  '/garage/invoices'
                ) ||
                location.pathname.startsWith(
                  '/garage/invoice/new'
                )
              ? 'Invoices'
              : location.pathname.startsWith(
                    '/garage/documents'
                  )
                ? 'Documents'
                : location.pathname.startsWith(
                      '/garage/sharing'
                    )
                  ? 'Sharing & access'
                  : location.pathname.startsWith(
                        '/garage/audit'
                      )
                    ? 'Audit trail'
                    : location.pathname.startsWith(
                          '/garage/notifications'
                        )
                      ? 'Notifications'
                      : 'Overview'
    );

  // ============================================================
  // NAVIGATION
  // ============================================================

  const handleNavClick = (
    item: GarageMenuItem
  ) => {
    setMobileMenuOpen(false);
    navigate(item.path);
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    logout();
    navigate('/login', {
      replace: true,
    });
  };

  // ============================================================
  // USER DISPLAY DETAILS
  // ============================================================

  const displayName =
    user?.fullName || 'Garage User';

  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .map((name) => name[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'GU';

  const garageName =
    user?.fullName || 'Perera Auto Works';

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="autocare-garage-layout">
      {/* ========================================================
          MOBILE BACKDROP
          ======================================================== */}

      {mobileMenuOpen && (
        <div
          className="autocare-garage-mobile-backdrop"
          onClick={() =>
            setMobileMenuOpen(false)
          }
          aria-hidden="true"
        />
      )}

      {/* ========================================================
          LEFT SIDEBAR
          ======================================================== */}

      <aside
        className={`autocare-garage-sidebar ${
          mobileMenuOpen
            ? 'is-mobile-open'
            : ''
        }`}
        aria-label="Garage Navigation Sidebar"
      >
        <div>
          {/* Logo */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'space-between',
              marginBottom: '24px',
            }}
          >
            <Link
              to="/garage/dashboard"
              className="autocare-garage-logo-card"
              style={{
                marginBottom: 0,
                flex: 1,
              }}
              aria-label="AutoCare 360 Garage Dashboard"
            >
              <img
                src={logoImg}
                alt="AutoCare 360"
              />
            </Link>

            <button
              type="button"
              className="autocare-garage-sidebar-close"
              onClick={() =>
                setMobileMenuOpen(false)
              }
              aria-label="Close Navigation Drawer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Menu */}

          <nav
            className="autocare-garage-menu"
            aria-label="Garage Navigation"
          >
            {sidebarMenuItems.map(
              (item) => {
                const isActive =
                  currentActive === item.id;

                const isNotification =
                  item.id ===
                  'Notifications';

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`autocare-garage-menu-item ${
                      isActive
                        ? 'is-active'
                        : ''
                    }`}
                    onClick={() =>
                      handleNavClick(item)
                    }
                  >
                    <span
                      className="autocare-garage-menu-dot"
                      aria-hidden="true"
                    />

                    <span
                      style={{
                        flex: 1,
                      }}
                    >
                      {item.label}
                    </span>

                    {isNotification &&
                      unreadCount > 0 && (
                        <span
                          style={{
                            background:
                              '#ef4444',
                            color:
                              '#ffffff',
                            fontSize:
                              '11px',
                            fontWeight:
                              800,
                            padding:
                              '1px 7px',
                            borderRadius:
                              '10px',
                          }}
                        >
                          {unreadCount > 99
                            ? '99+'
                            : unreadCount}
                        </span>
                      )}
                  </button>
                );
              }
            )}
          </nav>
        </div>

        {/* ======================================================
            GARAGE PROFILE / VERIFIED BADGE
            ====================================================== */}

        <div
          className="autocare-garage-badge-card"
          onClick={() =>
            navigate('/garage/profile')
          }
          role="button"
          tabIndex={0}
          title="View and edit garage profile"
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' ||
              event.key === ' '
            ) {
              navigate(
                '/garage/profile'
              );
            }
          }}
          style={{
            cursor: 'pointer',
          }}
        >
          <span className="autocare-garage-verified-pill">
            VERIFIED GARAGE
          </span>

          <h4 className="autocare-garage-badge-name">
            {garageName}
          </h4>

          <p className="autocare-garage-badge-location">
            AutoCare 360 Garage Partner
          </p>
        </div>
      </aside>

      {/* ========================================================
          RIGHT CONTENT AREA
          ======================================================== */}

      <div className="autocare-garage-main-wrapper">
        {/* ======================================================
            TOP HEADER
            ====================================================== */}

        <header className="autocare-garage-topbar">
          <div className="autocare-garage-breadcrumb">
            <button
              type="button"
              className="autocare-garage-sidebar-toggle"
              onClick={() =>
                setMobileMenuOpen(
                  (current) =>
                    !current
                )
              }
              aria-label="Toggle Navigation Sidebar"
            >
              <Menu size={20} />
            </button>

            <Link
              to="/garage/dashboard"
              className="autocare-garage-crumb-parent"
            >
              AutoCare 360
            </Link>

            <span className="autocare-garage-crumb-separator">
              /
            </span>

            <Link
              to="/garage/dashboard"
              className="autocare-garage-crumb-parent"
            >
              Garage
            </Link>

            <span className="autocare-garage-crumb-separator">
              /
            </span>

            <span className="autocare-garage-crumb-current">
              {breadcrumbCurrent ||
                currentActive}
            </span>
          </div>

          {/* ====================================================
              TOP RIGHT ACTIONS
              ==================================================== */}

          <div className="autocare-garage-topbar-actions">
            {/* Notifications */}

            <Link
              to="/garage/notifications"
              className="autocare-garage-notify-btn"
              aria-label={`Garage Notifications (${unreadCount} unread)`}
              title={`Notifications (${unreadCount} unread)`}
            >
              <Bell size={18} />

              {unreadCount > 0 && (
                <span
                  className="autocare-garage-notify-badge"
                  aria-label={`${unreadCount} unread`}
                >
                  {unreadCount > 9
                    ? '9+'
                    : unreadCount}
                </span>
              )}
            </Link>

            {/* User menu */}

            <div
              ref={dropdownRef}
              style={{
                position: 'relative',
              }}
            >
              <button
                type="button"
                className="autocare-garage-user-pill"
                onClick={() =>
                  setShowDropdown(
                    (current) =>
                      !current
                  )
                }
                aria-expanded={
                  showDropdown
                }
                aria-haspopup="menu"
                title="Garage account menu"
              >
                <span className="autocare-garage-user-name">
                  {displayName}
                </span>

                <div className="autocare-garage-user-avatar">
                  {initials}
                </div>
              </button>

              {showDropdown && (
                <div
                  role="menu"
                  style={{
                    position:
                      'absolute',
                    top:
                      'calc(100% + 10px)',
                    right: 0,
                    zIndex: 1000,
                    minWidth:
                      '190px',
                    padding: '8px',
                    background:
                      '#ffffff',
                    border:
                      '1px solid #e5e7eb',
                    borderRadius:
                      '12px',
                    boxShadow:
                      '0 10px 30px rgba(15, 23, 42, 0.14)',
                  }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowDropdown(
                        false
                      );

                      navigate(
                        '/garage/profile'
                      );
                    }}
                    style={{
                      width: '100%',
                      border: 'none',
                      background:
                        'transparent',
                      padding:
                        '10px 12px',
                      textAlign:
                        'left',
                      cursor:
                        'pointer',
                      borderRadius:
                        '8px',
                    }}
                  >
                    Garage Profile
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={
                      handleLogout
                    }
                    style={{
                      width: '100%',
                      border: 'none',
                      background:
                        'transparent',
                      padding:
                        '10px 12px',
                      textAlign:
                        'left',
                      cursor:
                        'pointer',
                      borderRadius:
                        '8px',
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap: '8px',
                    }}
                  >
                    <LogOut
                      size={16}
                    />

                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ======================================================
            PAGE CONTENT
            ====================================================== */}

        <main className="autocare-garage-content">
          {children}
        </main>

        {/* ======================================================
            FOOTER
            ====================================================== */}

        <Footer />
      </div>

      {/* ========================================================
          TOAST
          ======================================================== */}

      {toast.show && (
        <div
          className="autocare-garage-toast"
          role="alert"
        >
          <CheckCircle2
            size={18}
            style={{
              color: '#00B4EB',
              flexShrink: 0,
            }}
          />

          <span>
            {toast.message}
          </span>

          <button
            type="button"
            className="autocare-garage-toast-close"
            onClick={() =>
              setToast(
                (current) => ({
                  ...current,
                  show: false,
                })
              )
            }
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