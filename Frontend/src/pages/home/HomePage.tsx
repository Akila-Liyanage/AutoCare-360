import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Search, 
  ArrowRight, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  QrCode, 
  Gauge,
  Brain, 
  Building2, 
  FileX2,
  FileSearch,
  Eye,
  Activity,
  Check
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

// Approved Local Asset Imports
import carHeroImg from '../../assets/auth/Home page car 1.png';
import fadeBgImg from '../../assets/auth/Home page fade bg 1.png';
import garageWorkshopImg from '../../assets/auth/garage_service_bg.jpg';

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleVerifySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/buyer-qr?vin=${encodeURIComponent(searchQuery.trim().toUpperCase())}`);
    }
  };

  return (
    <div className="autocare-home-page">
      <Navbar />

      <main className="autocare-home-main">
        {/* ========================================================
            1. HERO SECTION (Aligned to Approved Figma)
            ======================================================== */}
        <section 
          className="autocare-hero-section"
          style={{ backgroundImage: `url("${fadeBgImg}")` }}
        >
          <div className="autocare-hero-container">
            {/* Left Content Column */}
            <div className="autocare-hero-content">
              {/* Badge */}
              <div className="autocare-hero-badge">
                <span className="autocare-hero-badge-dot" />
                <span className="autocare-hero-badge-text">
                  Universal Digital Vehicle Maintenance Passport
                </span>
              </div>

              {/* Exact Figma Heading with required line breaks */}
              <h1 className="autocare-hero-title">
                Every vehicle deserves a<br />
                lifetime digital<br />
                <span className="autocare-hero-title-accent">Passport.</span>
              </h1>

              {/* Supporting Paragraph */}
              <p className="autocare-hero-desc">
                Replace fragmented paper invoices, unverified odometer claims, and disputed repair records with an owner-sovereign, tamper-resistant digital passport anchored to the vehicle’s VIN.
              </p>

              {/* Verification Panel: "VERIFY ANY VEHICLE IN REAL TIME" */}
              <div className="autocare-verification-panel">
                <span className="autocare-verification-panel-label">
                  VERIFY ANY VEHICLE IN REAL TIME
                </span>
                <form className="autocare-hero-search-box" onSubmit={handleVerifySearch}>
                  <div className="autocare-hero-search-input-wrapper">
                    <Search size={18} className="autocare-hero-search-icon" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter 17-character VIN or License Plate (e.g. CAA-1234)"
                      className="autocare-hero-search-input"
                      aria-label="VIN or License Plate"
                    />
                  </div>
                  <button type="submit" className="autocare-hero-search-btn">
                    <span>Inspect</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>

              {/* Trust Badges */}
              <div className="autocare-hero-trust-row">
                <div className="autocare-trust-badge-item">
                  <Check size={15} className="autocare-trust-icon" />
                  <span>Verified Garages Only</span>
                </div>
                <div className="autocare-trust-badge-item">
                  <Check size={15} className="autocare-trust-icon" />
                  <span>Timed Expiry QR Links</span>
                </div>
                <div className="autocare-trust-badge-item">
                  <Check size={15} className="autocare-trust-icon" />
                  <span>AI Predictive Care</span>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="autocare-hero-cta-group">
                <Link 
                  to={isAuthenticated ? "/vehicles/add" : "/register"} 
                  className="autocare-btn-primary"
                >
                  <span>Create Free Passport</span>
                  <ArrowRight size={18} />
                </Link>
                <Link to="/buyer-qr" className="autocare-btn-secondary">
                  <QrCode size={18} />
                  <span>Verify Chassis / VIN</span>
                </Link>
              </div>
            </div>

            {/* Right Visual Column — Approved White Sports Car Asset */}
            <div className="autocare-hero-visual-col">
              <div className="autocare-hero-car-wrapper">
                <img 
                  src={carHeroImg} 
                  alt="AutoCare 360 Digital Vehicle Passport" 
                  className="autocare-hero-car-img" 
                />
              </div>
            </div>
          </div>
        </section>


        {/* ========================================================
            2. CORE CAPABILITIES (3x2 Layout Matching Figma)
            ======================================================== */}
        <section className="autocare-capabilities-section">
          <div className="autocare-section-container">
            <div className="autocare-section-header">
              <span className="autocare-section-eyebrow">CORE CAPABILITIES</span>
              <h2 className="autocare-section-title">
                Complete Security & Diagnostics Platform
              </h2>
              <p className="autocare-section-subtitle">
                A unified ecosystem connecting vehicle owners, accredited workshops, and prospective buyers under cryptographic proof of provenance.
              </p>
            </div>

            <div className="autocare-capabilities-grid">
              {/* Card 1: Immutable Audit Ledger */}
              <div className="autocare-cap-card">
                <div className="autocare-cap-icon-box is-blue">
                  <Lock size={22} />
                </div>
                <h3 className="autocare-cap-title">Immutable Audit Ledger</h3>
                <p className="autocare-cap-desc">
                  Every maintenance entry, inspection timestamp, and part replacement is permanently anchored. Zero retroactive manipulation or undocumented gaps.
                </p>
              </div>

              {/* Card 2: Smart Odometer Verification */}
              <div className="autocare-cap-card">
                <div className="autocare-cap-icon-box is-green">
                  <Gauge size={22} />
                </div>
                <h3 className="autocare-cap-title">Smart Odometer Verification</h3>
                <p className="autocare-cap-desc">
                  Algorithmic regression checks detect mileage discrepancies between consecutive garage visits, permanently eliminating odometer rollback fraud.
                </p>
              </div>

              {/* Card 3: AI-Powered Health Score */}
              <div className="autocare-cap-card">
                <div className="autocare-cap-icon-box is-cyan">
                  <Brain size={22} />
                </div>
                <h3 className="autocare-cap-title">AI-Powered Health Score</h3>
                <p className="autocare-cap-desc">
                  Multi-variable scoring index (0–100) evaluating service cadence, OEM parts compliance, certified garage ratio, and structural component wear.
                </p>
              </div>

              {/* Card 4: Government Integration */}
              <div className="autocare-cap-card">
                <div className="autocare-cap-icon-box is-blue">
                  <Building2 size={22} />
                </div>
                <h3 className="autocare-cap-title">Government Integration</h3>
                <p className="autocare-cap-desc">
                  Engineered for seamless interoperability with provincial vehicle registries, RMV databases, and national inspection standards.
                </p>
              </div>

              {/* Card 5: Instant QR Share */}
              <div className="autocare-cap-card">
                <div className="autocare-cap-icon-box is-cyan">
                  <QrCode size={22} />
                </div>
                <h3 className="autocare-cap-title">Instant QR Share</h3>
                <p className="autocare-cap-desc">
                  Generate secure, watermarked QR passports with customized expiration periods for windshield display, prospective buyers, or garage handoffs.
                </p>
              </div>

              {/* Card 6: Certified Garages Network */}
              <div className="autocare-cap-card">
                <div className="autocare-cap-icon-box is-green">
                  <ShieldCheck size={22} />
                </div>
                <h3 className="autocare-cap-title">Certified Garages Network</h3>
                <p className="autocare-cap-desc">
                  Only KYC-validated, accredited workshop facilities are granted cryptographic signing rights to append official service records.
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* ========================================================
            3. THREE STEPS SECTION (Full-Width Dark Blue Block)
            ======================================================== */}
        <section className="autocare-steps-section">
          <div className="autocare-section-container">
            <div className="autocare-steps-header">
              <span className="autocare-steps-eyebrow">HOW IT WORKS</span>
              <h2 className="autocare-steps-title">
                Three Steps to Complete Verification
              </h2>
              <p className="autocare-steps-subtitle">
                Effortless digital onboarding designed to permanently protect lifetime vehicle resale value.
              </p>
            </div>

            <div className="autocare-steps-grid">
              {/* Step 01 */}
              <div className="autocare-step-column">
                <div className="autocare-step-number">01</div>
                <h3 className="autocare-step-heading">Claim Passport</h3>
                <p className="autocare-step-copy">
                  Register your vehicle using its unique 17-digit VIN. Establish your sovereign digital ownership record in seconds.
                </p>
              </div>

              {/* Step 02 */}
              <div className="autocare-step-column">
                <div className="autocare-step-number">02</div>
                <h3 className="autocare-step-heading">Record Services</h3>
                <p className="autocare-step-copy">
                  Certified partner garages sign off on routine servicing, genuine parts serials, and diagnostic inspections directly to your cloud passport.
                </p>
              </div>

              {/* Step 03 */}
              <div className="autocare-step-column">
                <div className="autocare-step-number">03</div>
                <h3 className="autocare-step-heading">Unlock Value</h3>
                <p className="autocare-step-copy">
                  Command premium resale valuation by sharing instant, tamper-proof maintenance proof via dynamic QR with potential buyers.
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* ========================================================
            4. TRANSFORMATION SECTION (AS-IS vs TO-BE)
            ======================================================== */}
        <section className="autocare-transformation-section">
          <div className="autocare-section-container">
            <div className="autocare-section-header">
              <span className="autocare-section-eyebrow">THE DIGITAL VEHICLE TRANSFORMATION</span>
              <h2 className="autocare-section-title">
                From Fragmented Paper Clutter To A Verified Universal Passport
              </h2>
              <p className="autocare-section-subtitle">
                Comparing the risks of legacy paper maintenance versus AutoCare 360's cryptographically certified ecosystem.
              </p>
            </div>

            <div className="autocare-comparison-grid">
              {/* LEFT: Legacy Method (AS-IS) - Red/Pink Card */}
              <div className="autocare-comparison-card is-asis">
                <div className="autocare-comparison-card-badge is-asis">
                  <FileX2 size={16} />
                  <span>Legacy Method (AS-IS)</span>
                </div>
                <ul className="autocare-comparison-list">
                  <li>
                    <AlertTriangle size={18} className="autocare-comp-icon is-red" />
                    <span>Thermal paper receipts faded, misplaced, and lost in glove compartments</span>
                  </li>
                  <li>
                    <AlertTriangle size={18} className="autocare-comp-icon is-red" />
                    <span>Unverifiable odometer rollbacks during private used vehicle transactions</span>
                  </li>
                  <li>
                    <AlertTriangle size={18} className="autocare-comp-icon is-red" />
                    <span>Unverified backyard repairs without parts serial tracking or accountability</span>
                  </li>
                  <li>
                    <AlertTriangle size={18} className="autocare-comp-icon is-red" />
                    <span>Exposing private customer bills and repair expenditures to all prospective buyers</span>
                  </li>
                  <li>
                    <AlertTriangle size={18} className="autocare-comp-icon is-red" />
                    <span>Manual guesswork on critical fluid intervals, timing belts, and brake wear</span>
                  </li>
                </ul>
              </div>

              {/* RIGHT: AutoCare 360 (TO-BE) - Green/Light Card */}
              <div className="autocare-comparison-card is-tobe">
                <div className="autocare-comparison-card-badge is-tobe">
                  <ShieldCheck size={16} />
                  <span>AutoCare 360 (TO-BE)</span>
                </div>
                <ul className="autocare-comparison-list">
                  <li>
                    <CheckCircle2 size={18} className="autocare-comp-icon is-green" />
                    <span>Lifetime cloud-backed digital maintenance passport indexed per VIN</span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="autocare-comp-icon is-green" />
                    <span>Cryptographically verified odometer progression flagged at every visit</span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="autocare-comp-icon is-green" />
                    <span>Only KYC-validated, accredited garages can sign off on records</span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="autocare-comp-icon is-green" />
                    <span>Granular privacy permissions: share verified summary with costs redacted</span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="autocare-comp-icon is-green" />
                    <span>Automated predictive maintenance alerts & algorithmic Trust Score (0–100)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>


        {/* ========================================================
            5. AI VEHICLE HEALTH PANEL (Dark Rectangular Workshop Panel)
            ======================================================== */}
        <section className="autocare-ai-panel-section">
          <div className="autocare-section-container">
            <div className="autocare-ai-panel-card">
              {/* Left Column: Heading, Paragraph, 3 Feature Boxes, 2 CTAs */}
              <div className="autocare-ai-panel-content">
                <div className="autocare-ai-panel-badge">
                  <Brain size={14} />
                  <span>AI-POWERED DIAGNOSTICS & PREDICTIVE TELEMETRY</span>
                </div>

                <h2 className="autocare-ai-panel-title">
                  AI Vehicle Health Assessment &<br />
                  Telemetry Predictions
                </h2>

                <p className="autocare-ai-panel-desc">
                  Algorithmic telemetry cross-references maintenance frequency, OEM part usage, and diagnostic sensor telemetry to forecast component wear before critical road failures occur.
                </p>

                {/* 3 Feature Boxes: OCR Scanning, Audit Trail, Watermark Mode */}
                <div className="autocare-ai-features-row">
                  <div className="autocare-ai-feature-box">
                    <div className="autocare-ai-feature-icon">
                      <FileSearch size={18} />
                    </div>
                    <div>
                      <h4 className="autocare-ai-feature-title">OCR Scanning</h4>
                      <p className="autocare-ai-feature-text">Automated invoice data extraction</p>
                    </div>
                  </div>

                  <div className="autocare-ai-feature-box">
                    <div className="autocare-ai-feature-icon">
                      <Lock size={18} />
                    </div>
                    <div>
                      <h4 className="autocare-ai-feature-title">Audit Trail</h4>
                      <p className="autocare-ai-feature-text">Cryptographic hash chain integrity</p>
                    </div>
                  </div>

                  <div className="autocare-ai-feature-box">
                    <div className="autocare-ai-feature-icon">
                      <Eye size={18} />
                    </div>
                    <div>
                      <h4 className="autocare-ai-feature-title">Watermark Mode</h4>
                      <p className="autocare-ai-feature-text">Dynamic anti-tamper inspection</p>
                    </div>
                  </div>
                </div>

                {/* Two Action CTAs */}
                <div className="autocare-ai-cta-row">
                  <Link 
                    to={isAuthenticated ? "/vehicles" : "/register"} 
                    className="autocare-ai-btn-primary"
                  >
                    <span>Explore Health Telemetry</span>
                    <ArrowRight size={16} />
                  </Link>
                  <Link to="/buyer-qr" className="autocare-ai-btn-secondary">
                    <Activity size={16} />
                    <span>View Sample Prediction</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Approved Garage / Workshop Image */}
              <div className="autocare-ai-panel-visual">
                <div className="autocare-ai-workshop-wrapper">
                  <img 
                    src={garageWorkshopImg} 
                    alt="AutoCare 360 Certified Workshop Diagnostics" 
                    className="autocare-ai-workshop-img" 
                  />
                  <div className="autocare-ai-telemetry-badge">
                    <span className="autocare-ai-badge-dot" />
                    <span>Certified Diagnostic Terminal Connected • 98% Confidence</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
