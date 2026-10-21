import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  X,
  Share2,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import { MOCK_GARAGE_VEHICLES } from './garageData';
import '../../styles/garage-dashboard.css';

interface ToastState {
  show: boolean;
  message: string;
}

export const GarageSharingPage: React.FC = () => {
  const navigate = useNavigate();
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  return (
    <GarageLayout activeItem="Sharing & access" breadcrumbCurrent="Sharing & Access">
      <div className="autocare-garage-title-row">
        <div>
          <h1 className="autocare-garage-main-title">Garage Access &amp; Inspection Sharing</h1>
          <p className="autocare-garage-main-subtitle">
            Cryptographic QR scan keys and temporary inspection passes for customer digital passports.
          </p>
        </div>

        <button
          type="button"
          className="autocare-garage-btn-primary"
          onClick={() => {
            showToast('Inspection QR scanner activated. Scan vehicle physical sticker or QR code.');
          }}
        >
          <QrCode size={16} />
          <span>Scan Client QR</span>
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        {/* Card 1: Garage Inspection Terminal Key */}
        <div className="autocare-garage-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <KeyRound size={22} style={{ color: '#0056a2' }} />
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
              Station Inspection Key
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
            Your station terminal is authorized under BR-03 to publish certified records and decrypt owner-shared inspection packets.
          </p>
          <div
            style={{
              background: '#f8fafc',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#0f172a',
              wordBreak: 'break-all',
              marginBottom: '14px',
            }}
          >
            PUBKEY: 0x9f4a88bc39d84920aa029148572e01b2a94f81c2
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="autocare-garage-hero-btn"
              style={{ background: '#f1f5f9', color: '#0f172a', fontSize: '12.5px' }}
              onClick={() => showToast('Station terminal public key copied to clipboard.')}
            >
              Copy Public Key
            </button>
          </div>
        </div>

        {/* Card 2: Active Shared Vehicle Access Grants */}
        <div className="autocare-garage-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <ShieldCheck size={22} style={{ color: '#16a34a' }} />
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
              Active Client Grants
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
            Clients currently delegating read/write ledger maintenance permissions to Perera Auto Works:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {MOCK_GARAGE_VEHICLES.slice(0, 3).map((v) => (
              <div
                key={v.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  background: '#f8fafc',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                <div>
                  <strong>{v.registration}</strong> · {v.customer.name}
                </div>
                <span style={{ color: '#059669', fontWeight: 700, fontSize: '11.5px' }}>
                  ACTIVE (FULL)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links section */}
      <section className="autocare-garage-records-panel">
        <h2 className="autocare-garage-records-title">Access Shortcuts</h2>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="autocare-garage-hero-btn"
            style={{ background: '#f8fafc', color: '#003874', border: '1px solid #cbd5e1' }}
            onClick={() => navigate('/sharing/qr')}
          >
            <Share2 size={15} style={{ marginRight: '6px' }} />
            <span>Open Global QR Sharing Portal</span>
          </button>
          <button
            type="button"
            className="autocare-garage-hero-btn"
            style={{ background: '#f8fafc', color: '#003874', border: '1px solid #cbd5e1' }}
            onClick={() => navigate('/buyer-qr')}
          >
            <ExternalLink size={15} style={{ marginRight: '6px' }} />
            <span>Buyer Public Record Viewer</span>
          </button>
        </div>
      </section>

      {/* Toast */}
      {toast.show && (
        <div className="autocare-garage-toast" role="alert">
          <CheckCircle2 size={18} style={{ color: '#00B4EB', flexShrink: 0 }} />
          <span>{toast.message}</span>
          <button
            type="button"
            className="autocare-garage-toast-close"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </GarageLayout>
  );
};

export default GarageSharingPage;
