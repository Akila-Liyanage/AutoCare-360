import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import logoImg from '../../assets/auth/download (27) (1) 2.png';

export const Footer: React.FC = () => {
  return (
    <footer className="autocare-footer-wrapper">
      <div className="autocare-footer-container">
        {/* Brand & Mission Column */}
        <div className="autocare-footer-brand-col">
          <Link to="/" className="autocare-footer-logo-link">
            <img src={logoImg} alt="AutoCare 360" className="autocare-footer-logo" />
          </Link>
          <p className="autocare-footer-tagline">
            The Universal Digital Vehicle Maintenance Record Platform. Transforming fragmented paper invoices into verified, tamper-resistant digital vehicle passports.
          </p>
          {/* Green Security Indicator Pill */}
          <div className="autocare-footer-security-pill">
            <span className="autocare-footer-security-dot" />
            <span>System Operational • 100% Uptime • SSL 256-Bit Encrypted</span>
          </div>
        </div>

        {/* Column 1: Platform */}
        <div className="autocare-footer-col">
          <h4 className="autocare-footer-heading">Platform</h4>
          <ul className="autocare-footer-links">
            <li><Link to="/">Home Overview</Link></li>
            <li><Link to="/vehicles">Vehicle Digital Passport</Link></li>
            <li><Link to="/vehicles/add">Register Vehicle</Link></li>
            <li><Link to="/buyer-qr">Buyer QR Verification</Link></li>
            <li><span className="autocare-footer-link-disabled">Certified Garages Network</span></li>
          </ul>
        </div>

        {/* Column 2: Resources & Architecture */}
        <div className="autocare-footer-col">
          <h4 className="autocare-footer-heading">Resources</h4>
          <ul className="autocare-footer-links">
            <li><span>Immutable Audit Ledger</span></li>
            <li><span>Smart Odometer Rollback Guard</span></li>
            <li><span>Dynamic QR Watermarking</span></li>
            <li><span>Owner Data Sovereignty</span></li>
            <li><span>KYC Garage Verification</span></li>
          </ul>
        </div>

        {/* Column 3: Contact Details */}
        <div className="autocare-footer-col">
          <h4 className="autocare-footer-heading">Contact Details</h4>
          <ul className="autocare-footer-contact-list">
            <li>
              <MapPin size={16} className="autocare-footer-contact-icon" />
              <span>AutoCare 360 HQ, Colombo, Sri Lanka</span>
            </li>
            <li>
              <Mail size={16} className="autocare-footer-contact-icon" />
              <span>support@autocare360.lk</span>
            </li>
            <li>
              <Phone size={16} className="autocare-footer-contact-icon" />
              <span>+94 (11) 234-5678</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Sub-Footer Bar */}
      <div className="autocare-footer-bottom">
        <div className="autocare-footer-bottom-container">
          <p className="autocare-footer-copy">
            © 2026 AutoCare 360™. All rights reserved. Compliant with Sri Lanka Motor Traffic Digital Standards & BRD v1.0.
          </p>
          <div className="autocare-footer-legal-links">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Security Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
