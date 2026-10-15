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
  FileText
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import logoImg from '../../assets/auth/download (27) (1) 2.png';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const navLinks = [
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
              <button 
                type="button" 
                className="autocare-nav-icon-btn" 
                aria-label="System Notifications"
                title="Notifications"
              >
                <Bell size={19} />
                <span className="autocare-nav-badge-dot" aria-hidden="true" />
              </button>

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
                    {getInitials(user.fullName)}
                  </div>
                  <div className="autocare-nav-user-meta">
                    <span className="autocare-nav-user-name">
                      {user.fullName || 'Vehicle Owner'}
                    </span>
                    <span className="autocare-nav-user-role">
                      {user.role === 'garage' 
                        ? 'Verified Garage' 
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
                      <p className="autocare-profile-menu-name">{user.fullName}</p>
                      <p className="autocare-profile-menu-email">{user.email}</p>
                      <span className="autocare-profile-role-tag">
                        <ShieldCheck size={12} />
                        {user.role.toUpperCase()}
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
                    <Link 
                      to="/vehicles" 
                      className="autocare-profile-menu-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <FileText size={16} /> My Vehicles
                    </Link>

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

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="autocare-mobile-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Profile
                </Link>
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
