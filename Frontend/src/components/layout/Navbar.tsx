import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  LogOut,
  User,
  Menu,
  X,
  ShieldCheck,
  FileText,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import logoImg from '../../assets/auth/download (27) (1) 2.png';

const resolveImageUrl = (img?: string): string | undefined => {
  if (!img) return undefined;
  if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('blob:')) return img;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
  return `${base}${img.startsWith('/') ? '' : '/'}${img}`;
};

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const userAvatarUrl = resolveImageUrl(user?.profileImage || user?.avatar);
  const showUserAvatar = !!userAvatarUrl && failedAvatarUrl !== userAvatarUrl;

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  // Get user initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return 'AC';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const navLinks =
    user?.role === 'admin'
      ? [
          { label: 'Home', path: '/' },
          { label: 'Garage Verification', path: '/admin/garages' },
        ]
      : user?.role === 'garage'
        ? user.status === 'pending'
          ? [
              { label: 'Home', path: '/' },
              { label: 'Verification Status', path: '/garage/verification-pending' },
            ]
          : user.status === 'suspended'
            ? [
                { label: 'Home', path: '/' },
              ]
            : [
                { label: 'Home', path: '/' },
                { label: 'Dashboard', path: '/garage/dashboard' },
                { label: 'Customer Vehicles', path: '/garage/vehicles' },
                { label: 'Service Records', path: '/garage/service-records' },
              ]
        : [
            { label: 'Home', path: '/' },
            { label: 'Vehicle Passport', path: '/vehicles' },
            { label: 'Buyer QR View', path: '/buyer-qr' },
            { label: 'Add Vehicle', path: '/vehicles/add' },
          ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="autocare-navbar-wrapper">
      <div className="autocare-navbar-container">
        {/* Left: AutoCare 360 Logo */}
        <Link to="/" className="autocare-navbar-brand" aria-label="AutoCare 360 Home">
          <img
            src={logoImg}
            alt="AutoCare 360"
            className="autocare-navbar-logo"
          />
        </Link>

        {/* Center: White Nav Pill Capsule Area */}
        <div className="autocare-nav-pill-wrapper">
          <nav className="autocare-navbar-nav" aria-label="Primary Navigation">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`autocare-nav-link ${isActive(link.path) ? 'is-active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: Notification Bell & User Avatar/Dropdown */}
        <div className="autocare-navbar-actions">
          {isAuthenticated && user ? (
            <>
              {/* Notification Bell */}
              <Link
                to="/notifications"
                className="autocare-nav-icon-btn"
                aria-label="System Notifications"
                title="Notifications"
              >
                <Bell size={19} />
                <span className="autocare-nav-badge-dot" aria-hidden="true" />
              </Link>

              {/* User Avatar Dropdown */}
              <div className="autocare-nav-user-dropdown" ref={dropdownRef}>
                <button
                  type="button"
                  className="autocare-nav-profile-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="autocare-nav-avatar">
                    {showUserAvatar ? (
                      <img
                        key={userAvatarUrl}
                        src={userAvatarUrl}
                        alt={user.fullName || 'User'}
                        className="autocare-nav-avatar-img"
                        onError={() => setFailedAvatarUrl(userAvatarUrl || '')}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '50%',
                        }}
                      />
                    ) : (
                      getInitials(user.fullName)
                    )}
                  </div>
                  <div className="autocare-nav-user-meta">
                    <span className="autocare-nav-user-name">
                      {user.fullName || 'Vehicle Owner'}
                    </span>
                    <span className="autocare-nav-user-role">
                      {user.role === 'garage'
                        ? user.status === 'pending'
                          ? 'Verification Pending'
                          : user.status === 'suspended'
                            ? 'Garage Suspended'
                            : 'Verified Garage'
                        : user.role === 'admin'
                          ? 'System Admin'
                          : 'Vehicle Owner'}
                    </span>
                  </div>
                  <ChevronDown
                    size={15}
                    className={`autocare-nav-chevron ${dropdownOpen ? 'is-open' : ''}`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="autocare-profile-menu">
                    <div className="autocare-profile-menu-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div
                          className="autocare-nav-avatar"
                          style={{ width: '38px', height: '38px', flexShrink: 0 }}
                        >
                          {showUserAvatar ? (
                            <img
                              src={userAvatarUrl}
                              alt={user.fullName || 'User'}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                            />
                          ) : (
                            getInitials(user.fullName)
                          )}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <p className="autocare-profile-menu-name" style={{ margin: 0 }}>{user.fullName}</p>
                          <p className="autocare-profile-menu-email" style={{ margin: 0 }}>{user.email}</p>
                        </div>
                      </div>
                      <span className="autocare-profile-role-tag">
                        {user.role === 'garage' && user.status === 'pending' ? (
                          <>
                            <Clock size={12} />
                            PENDING REVIEW
                          </>
                        ) : user.role === 'garage' && user.status === 'suspended' ? (
                          <>
                            <AlertCircle size={12} />
                            SUSPENDED
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={12} />
                            {user.role.toUpperCase()}
                          </>
                        )}
                      </span>
                    </div>

                    <div className="autocare-profile-menu-divider" />

                    <Link
                      to="/profile"
                      className="autocare-profile-menu-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User size={16} /> My Profile
                    </Link>
                    {user?.role === 'owner' && (
                      <Link
                        to="/vehicles"
                        className="autocare-profile-menu-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FileText size={16} /> My Vehicles
                      </Link>
                    )}
                    {user?.role === 'garage' && user.status === 'active' && (
                      <Link
                        to="/garage/dashboard"
                        className="autocare-profile-menu-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <ShieldCheck size={16} /> Garage Dashboard
                      </Link>
                    )}
                    {user?.role === 'garage' && user.status === 'pending' && (
                      <Link
                        to="/garage/verification-pending"
                        className="autocare-profile-menu-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <Clock size={16} /> Verification Status
                      </Link>
                    )}
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin/garages"
                        className="autocare-profile-menu-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <ShieldCheck size={16} /> Admin Console
                      </Link>
                    )}

                    <div className="autocare-profile-menu-divider" />

                    <button
                      type="button"
                      className="autocare-profile-menu-item is-logout"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="autocare-nav-auth-buttons">
              <Link to="/login" className="autocare-nav-btn-secondary">
                Sign In
              </Link>
              <Link to="/register" className="autocare-nav-btn-primary">
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="autocare-nav-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="autocare-mobile-drawer">
          <nav className="autocare-mobile-nav">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`autocare-mobile-link ${isActive(link.path) ? 'is-active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated && user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', marginBottom: '8px' }}>
                  <div className="autocare-nav-avatar" style={{ width: '36px', height: '36px', flexShrink: 0 }}>
                    {showUserAvatar ? (
                      <img
                        src={userAvatarUrl}
                        alt={user.fullName || 'User'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
                    ) : (
                      getInitials(user.fullName)
                    )}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13.5px' }}>{user.fullName}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{user.email}</div>
                  </div>
                </div>
                <Link
                  to="/profile"
                  className="autocare-mobile-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Profile
                </Link>
                {user?.role === 'garage' && user.status === 'active' && (
                  <Link
                    to="/garage/dashboard"
                    className="autocare-mobile-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Garage Dashboard
                  </Link>
                )}
                {user?.role === 'garage' && user.status === 'pending' && (
                  <Link
                    to="/garage/verification-pending"
                    className="autocare-mobile-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Verification Status
                  </Link>
                )}
                {user?.role === 'admin' && (
                  <Link
                    to="/admin/garages"
                    className="autocare-mobile-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Console
                  </Link>
                )}
                <button
                  type="button"
                  className="autocare-mobile-link is-logout"
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="autocare-mobile-auth-actions">
                <Link
                  to="/login"
                  className="autocare-btn-secondary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="autocare-btn-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
