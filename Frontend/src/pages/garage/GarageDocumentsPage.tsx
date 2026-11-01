import React from 'react';
import { FileText } from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import '../../styles/garage-dashboard.css';

export const GarageDocumentsPage: React.FC = () => {
  return (
    <GarageLayout activeItem="Documents" breadcrumbCurrent="Documents">
      <div className="autocare-garage-title-row">
        <div>
          <h1 className="autocare-garage-main-title">Garage Documents</h1>
          <p className="autocare-garage-main-subtitle">
            Manage inspection reports, invoices, and vehicle certification documents.
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
          <FileText size={32} />
        </div>
        <h2 style={{ fontSize: '19px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          No Documents Uploaded
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '460px', margin: '0 auto 20px auto' }}>
          All dummy document entries have been permanently removed. Documents linked to customer vehicle services will appear here.
        </p>
      </div>
    </GarageLayout>
  );
};

export default GarageDocumentsPage;
