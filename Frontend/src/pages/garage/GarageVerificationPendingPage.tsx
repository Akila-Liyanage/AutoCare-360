import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Clock, ShieldAlert, RefreshCw, LogOut, Building2 } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

export const GarageVerificationPendingPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleRefresh = async () => {
    setChecking(true);
    setFeedback(null);
    try {
      const updatedUser = await refreshUser();
      if (updatedUser?.status === 'active') {
        navigate('/garage/dashboard');
        return;
      }
      setFeedback('Status checked: Your garage partner accreditation is still under review.');
    } catch {
      setFeedback('Unable to check status at this time. Please try again later.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      <Navbar />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div
          style={{
            maxWidth: '560px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '40px 32px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.06), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              backgroundColor: '#eff6ff',
              color: '#0056A2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              border: '2px solid #bfdbfe',
            }}
          >
            <Clock size={36} />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: '#fffbeb',
              color: '#b45309',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '16px',
            }}
          >
            <ShieldAlert size={14} />
            <span>Verification Pending</span>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
            Workshop Accreditation Under Review
          </h1>

          <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
            Thank you for registering with AutoCare 360. Your workshop partner application ({user?.fullName || 'Garage Partner'}) is currently queued for administrator accreditation to protect the integrity of the universal vehicle passport ledger.
          </p>

          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px 20px',
              textAlign: 'left',
              marginBottom: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Building2 size={18} style={{ color: '#0056a2' }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                Accreditation Review Checklist:
              </span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#64748b', lineHeight: 1.7 }}>
              <li>Business Registration Number (BRN) validity check</li>
              <li>Workshop physical address and contact verification</li>
              <li>Official service certification credentials assignment</li>
            </ul>
          </div>

          {feedback && (
            <div
              style={{
                backgroundColor: '#eff6ff',
                color: '#1e40af',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                padding: '10px 16px',
                fontSize: '13px',
                marginBottom: '20px',
              }}
            >
              {feedback}
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={checking}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 22px',
                backgroundColor: '#0056a2',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: checking ? 'not-allowed' : 'pointer',
              }}
            >
              <RefreshCw
                size={16}
                style={checking ? { animation: 'spin 1s linear infinite' } : {}}
              />
              <span>{checking ? 'Checking Status...' : 'Check Status Again'}</span>
            </button>

            <button
              type="button"
              onClick={logout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 22px',
                backgroundColor: '#ffffff',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GarageVerificationPendingPage;
