import React from 'react';
import { Share2 } from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import '../../styles/garage-audit.css';

export const GarageSharingPage: React.FC = () => {
  return (
    <GarageLayout activeItem="Sharing & access" breadcrumbCurrent="Sharing & access">
      <div className="autocare-garage-title-row">
        <div>
          <h1 className="autocare-garage-main-title">Sharing & Access Permissions</h1>
          <p className="autocare-garage-main-subtitle">
            Manage granular access grants and temporary link sharing for vehicle records.
          </p>
        </div>
      </div>

      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '56px 24px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          marginTop: '20px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            background: '#f1f5f9',
            color: '#64748b',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}
        >
          <Share2 size={32} />
        </div>
        <h2 style={{ fontSize: '19px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          No Active Sharing Links
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '460px', margin: '0 auto 20px auto' }}>
          All mock access tokens and sample shared links have been permanently removed. Active share grants created for vehicle records will appear here.
        </p>
      </div>
    </GarageLayout>
  );
};

export default GarageSharingPage;
