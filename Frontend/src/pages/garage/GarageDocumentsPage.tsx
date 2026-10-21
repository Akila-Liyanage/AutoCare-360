import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  ExternalLink,
  CheckCircle2,
  X,
  Upload,
} from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import {
  MOCK_GARAGE_VEHICLES,
  type GarageVehicleDocumentItem,
  type GarageVehicle,
} from './garageData';
import '../../styles/garage-dashboard.css';

interface ToastState {
  show: boolean;
  message: string;
}

export const GarageDocumentsPage: React.FC = () => {
  const navigate = useNavigate();

  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<{
    doc: GarageVehicleDocumentItem;
    vehicle: GarageVehicle;
  } | null>(null);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  const allDocuments = React.useMemo(() => {
    const list: Array<{
      doc: GarageVehicleDocumentItem;
      vehicle: GarageVehicle;
    }> = [];

    MOCK_GARAGE_VEHICLES.forEach((v) => {
      v.documents.forEach((d) => {
        list.push({ doc: d, vehicle: v });
      });
    });

    return list.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        item.doc.name.toLowerCase().includes(q) ||
        item.doc.type.toLowerCase().includes(q) ||
        item.vehicle.registration.toLowerCase().includes(q) ||
        item.vehicle.customer.name.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  return (
    <GarageLayout activeItem="Documents" breadcrumbCurrent="Documents Vault">
      <div className="autocare-garage-title-row">
        <div>
          <h1 className="autocare-garage-main-title">Client Vehicle Documents Vault</h1>
          <p className="autocare-garage-main-subtitle">
            Secure regulatory files, revenue licenses, and SLT-certified inspection reports.
          </p>
        </div>

        <button
          type="button"
          className="autocare-garage-btn-primary"
          onClick={() => showToast('Direct file scanner initialized. Select PDF or image to link to vehicle.')}
        >
          <Upload size={16} />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Search Bar */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '560px',
        }}
      >
        <Search size={18} style={{ color: '#64748b' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by document name, type, or vehicle registration..."
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            width: '100%',
            fontSize: '13.5px',
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Grid of Documents */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '18px',
        }}
      >
        {allDocuments.map(({ doc, vehicle }) => (
          <div
            key={doc.id}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background:
                      doc.status === 'Valid'
                        ? '#ecfdf5'
                        : doc.status === 'Expiring Soon'
                        ? '#fffbeb'
                        : '#fef2f2',
                    color:
                      doc.status === 'Valid'
                        ? '#059669'
                        : doc.status === 'Expiring Soon'
                        ? '#d97706'
                        : '#dc2626',
                  }}
                >
                  {doc.status}
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{doc.fileSize}</span>
              </div>

              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                {doc.name}
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 12px 0' }}>
                Assigned to: <strong>{vehicle.registration}</strong> ({vehicle.customer.name})
              </p>

              <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>Issued: {doc.issueDate}</span>
                <span>Expires: <strong>{doc.expiryDate}</strong></span>
              </div>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="autocare-garage-action-link"
                onClick={() => setSelectedDoc({ doc, vehicle })}
                style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <ExternalLink size={13} />
                <span>Inspect</span>
              </button>

              <button
                type="button"
                className="autocare-garage-action-link"
                onClick={() => navigate(`/garage/vehicles/${vehicle.id}`)}
                style={{ fontSize: '13px' }}
              >
                View Vehicle →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Inspect Document Modal */}
      {selectedDoc && (
        <div
          className="autocare-garage-modal-backdrop"
          onClick={() => setSelectedDoc(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="autocare-garage-modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="autocare-garage-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} />
                <h3>{selectedDoc.doc.name}</h3>
              </div>
              <button
                type="button"
                className="autocare-garage-modal-close-btn"
                onClick={() => setSelectedDoc(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="autocare-garage-modal-body">
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Vehicle Registration</span>
                <span className="autocare-garage-profile-spec-val">{selectedDoc.vehicle.registration}</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Registered Owner</span>
                <span className="autocare-garage-profile-spec-val">{selectedDoc.vehicle.customer.name}</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Document Category</span>
                <span className="autocare-garage-profile-spec-val">{selectedDoc.doc.type}</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Expiration Date</span>
                <span className="autocare-garage-profile-spec-val">{selectedDoc.doc.expiryDate}</span>
              </div>
              <div className="autocare-garage-profile-spec-row">
                <span className="autocare-garage-profile-spec-label">Verification Hash</span>
                <span className="autocare-garage-profile-spec-val" style={{ fontFamily: 'monospace' }}>
                  0x78ab...e019 (Verified)
                </span>
              </div>
            </div>

            <div className="autocare-garage-modal-footer">
              <button
                type="button"
                className="autocare-garage-btn-primary"
                onClick={() => {
                  setSelectedDoc(null);
                  showToast(`Decrypted and downloaded ${selectedDoc.doc.name}.`);
                }}
              >
                Download Verified PDF
              </button>
            </div>
          </div>
        </div>
      )}

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

export default GarageDocumentsPage;
