import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  CheckCircle2,
  X,
  Upload,
  Eye,
  Car,
  Image as ImageIcon,
  ShieldCheck,
  FileCheck,
  Download,
  Printer,
  FilePlus,
} from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import {
  MOCK_GARAGE_VEHICLES,
} from './garageData';
import '../../styles/garage-dashboard.css';

export interface GarageDocumentItem {
  id: string;
  name: string;
  category: 'SERVICE_DOC' | 'INVOICE' | 'IMAGE' | 'REGULATORY';
  type: string;
  fileSize: string;
  issueDate: string;
  expiryDate?: string;
  status: 'Valid' | 'Expiring Soon' | 'Expired' | 'Signed';
  vehicleId: string;
  vehicleRef: string;
  customerName: string;
  hash: string;
}

const INITIAL_GARAGE_DOCUMENTS: GarageDocumentItem[] = [
  {
    id: 'doc-101',
    name: 'Pre-Service Electronic Diagnostic Report',
    category: 'SERVICE_DOC',
    type: 'Diagnostic Scan (PDF)',
    fileSize: '2.4 MB',
    issueDate: '21 Sep 2026',
    status: 'Valid',
    vehicleId: 'veh-1',
    vehicleRef: 'WP ABC-1234',
    customerName: 'Nimal Perera',
    hash: '0x8829f01ab293e847192837465019283746501928',
  },
  {
    id: 'doc-102',
    name: 'Tax Invoice & Work Order INV-2026-8492',
    category: 'INVOICE',
    type: 'Cryptographic Invoice (PDF)',
    fileSize: '1.1 MB',
    issueDate: '21 Sep 2026',
    status: 'Signed',
    vehicleId: 'veh-1',
    vehicleRef: 'WP ABC-1234',
    customerName: 'Nimal Perera',
    hash: '0x3a4b9f88102eac91d84920aa029148572e01b2a9',
  },
  {
    id: 'doc-103',
    name: 'Engine Bay & Filter Replacement Photo',
    category: 'IMAGE',
    type: 'High-Res Inspection Image (JPG)',
    fileSize: '4.8 MB',
    issueDate: '21 Sep 2026',
    status: 'Valid',
    vehicleId: 'veh-1',
    vehicleRef: 'WP ABC-1234',
    customerName: 'Nimal Perera',
    hash: '0x7716253443526172839405968716253443526172',
  },
  {
    id: 'doc-104',
    name: 'Annual Revenue License 2026-2027',
    category: 'REGULATORY',
    type: 'Government Regulatory Certificate',
    fileSize: '1.8 MB',
    issueDate: '15 Jan 2026',
    expiryDate: '14 Jan 2027',
    status: 'Valid',
    vehicleId: 'veh-1',
    vehicleRef: 'WP ABC-1234',
    customerName: 'Nimal Perera',
    hash: '0x9920192837465019283746501928374650192837',
  },
  {
    id: 'doc-105',
    name: 'Brake Caliper Pad Thickness Verification Image',
    category: 'IMAGE',
    type: 'Technical Telemetry Image (PNG)',
    fileSize: '3.2 MB',
    issueDate: '02 Sep 2026',
    status: 'Valid',
    vehicleId: 'veh-3',
    vehicleRef: 'WP CAD-1212',
    customerName: 'Kasun Bandara',
    hash: '0x4455667788990011223344556677889900112233',
  },
  {
    id: 'doc-106',
    name: 'Comprehensive Motor Insurance Policy',
    category: 'REGULATORY',
    type: 'SLIC Comprehensive Policy (PDF)',
    fileSize: '3.5 MB',
    issueDate: '01 Nov 2025',
    expiryDate: '31 Oct 2026',
    status: 'Expiring Soon',
    vehicleId: 'veh-1',
    vehicleRef: 'WP ABC-1234',
    customerName: 'Nimal Perera',
    hash: '0x1234567890abcdef1234567890abcdef12345678',
  },
  {
    id: 'doc-107',
    name: 'Signed Service Invoice INV-2026-8109',
    category: 'INVOICE',
    type: 'Official Receipt (PDF)',
    fileSize: '950 KB',
    issueDate: '18 Jul 2026',
    status: 'Signed',
    vehicleId: 'veh-2',
    vehicleRef: 'WP CAS-9988',
    customerName: 'Anura Fernando',
    hash: '0xfe09dcba98765432fe09dcba98765432fe09dcba',
  },
  {
    id: 'doc-108',
    name: 'Drive Green Vehicle Emission Certificate',
    category: 'REGULATORY',
    type: 'DriveGreen Certificate (PDF)',
    fileSize: '1.2 MB',
    issueDate: '10 Feb 2026',
    expiryDate: '09 Feb 2027',
    status: 'Valid',
    vehicleId: 'veh-2',
    vehicleRef: 'WP CAS-9988',
    customerName: 'Anura Fernando',
    hash: '0x5566778899aabbccddeeff001122334455667788',
  },
];

interface ToastState {
  show: boolean;
  message: string;
}

export const GarageDocumentsPage: React.FC = () => {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<GarageDocumentItem[]>(INITIAL_GARAGE_DOCUMENTS);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected Document for Inspection Modal
  const [selectedDoc, setSelectedDoc] = useState<GarageDocumentItem | null>(null);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadVehicleId, setUploadVehicleId] = useState<string>(MOCK_GARAGE_VEHICLES[0].id);
  const [uploadCategory, setUploadCategory] = useState<GarageDocumentItem['category']>('SERVICE_DOC');
  const [uploadDocName, setUploadDocName] = useState<string>('');
  const [uploadFileName] = useState<string>('Job_Sheet_Scan_Oct2026.pdf');

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  // Filtered Documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((item) => {
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && item.status.toUpperCase() !== statusFilter.toUpperCase()) return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      return (
        item.name.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.vehicleRef.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q)
      );
    });
  }, [documents, categoryFilter, statusFilter, searchQuery]);

  // Handle local simulated upload
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDocName.trim()) {
      showToast('Please provide a document title.');
      return;
    }

    const targetVeh = MOCK_GARAGE_VEHICLES.find((v) => v.id === uploadVehicleId) || MOCK_GARAGE_VEHICLES[0];
    const newDoc: GarageDocumentItem = {
      id: `doc-${Date.now()}`,
      name: uploadDocName.trim(),
      category: uploadCategory,
      type: uploadCategory === 'IMAGE' ? 'High-Res Photo (JPG)' : 'Encrypted Document (PDF)',
      fileSize: '1.9 MB',
      issueDate: new Date().toISOString().split('T')[0],
      status: 'Valid',
      vehicleId: targetVeh.id,
      vehicleRef: targetVeh.registration,
      customerName: targetVeh.customer.name,
      hash: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setShowUploadModal(false);
    setUploadDocName('');
    showToast(`Document "${newDoc.name}" uploaded and linked to ${targetVeh.registration}.`);
  };

  const getStatusStyle = (status: GarageDocumentItem['status']) => {
    switch (status) {
      case 'Valid':
        return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
      case 'Signed':
        return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
      case 'Expiring Soon':
        return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
      case 'Expired':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
    }
  };

  const getCategoryIcon = (category: GarageDocumentItem['category']) => {
    switch (category) {
      case 'SERVICE_DOC':
        return <FileCheck size={20} style={{ color: '#0056a2' }} />;
      case 'INVOICE':
        return <FileText size={20} style={{ color: '#059669' }} />;
      case 'IMAGE':
        return <ImageIcon size={20} style={{ color: '#7c3aed' }} />;
      case 'REGULATORY':
        return <ShieldCheck size={20} style={{ color: '#d97706' }} />;
      default:
        return <FileText size={20} style={{ color: '#64748b' }} />;
    }
  };

  return (
    <GarageLayout activeItem="Documents" breadcrumbCurrent="Documents Vault">
      {/* Title & Actions Row */}
      <div className="autocare-garage-title-row">
        <div>
          <h1 className="autocare-garage-main-title">Client Vehicle Documents Vault</h1>
          <p className="autocare-garage-main-subtitle">
            Secure regulatory files, diagnostic inspection photos, and cryptographically verified invoices.
          </p>
        </div>

        <button
          type="button"
          className="autocare-garage-btn-primary"
          onClick={() => setShowUploadModal(true)}
        >
          <Upload size={16} />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '8px 14px',
            flex: '1 1 280px',
            maxWidth: '460px',
          }}
        >
          <Search size={16} style={{ color: '#64748b', flexShrink: 0 }} />
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
              fontSize: '13px',
              color: '#0f172a',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Status:</span>
          {['ALL', 'VALID', 'SIGNED', 'EXPIRING SOON', 'EXPIRED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                background: statusFilter === st ? '#003874' : '#f1f5f9',
                color: statusFilter === st ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: statusFilter === st ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Category:</span>
        {[
          { key: 'ALL', label: 'All Documents' },
          { key: 'SERVICE_DOC', label: 'Service Diagnostic Reports' },
          { key: 'INVOICE', label: 'Invoices & Receipts' },
          { key: 'IMAGE', label: 'Inspection Images' },
          { key: 'REGULATORY', label: 'Regulatory & Compliance' },
        ].map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setCategoryFilter(cat.key)}
            style={{
              background: categoryFilter === cat.key ? '#eff6ff' : '#ffffff',
              color: categoryFilter === cat.key ? '#0056a2' : '#64748b',
              border: categoryFilter === cat.key ? '1px solid #93c5fd' : '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: categoryFilter === cat.key ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Documents Grid Display */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '18px',
        }}
      >
        {filteredDocuments.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '48px 20px',
              textAlign: 'center',
            }}
          >
            <FileText size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#0f172a' }}>
              No documents match your query
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Try adjusting your search terms or clearing the category filters.
            </p>
          </div>
        ) : (
          filteredDocuments.map((doc) => {
            const stStyle = getStatusStyle(doc.status);
            return (
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
                  transition: 'box-shadow 0.2s ease',
                }}
              >
                <div>
                  {/* Top row: category icon, status badge, filesize */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {getCategoryIcon(doc.category)}
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: stStyle.bg,
                            color: stStyle.color,
                            border: `1px solid ${stStyle.border}`,
                          }}
                        >
                          {doc.status}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{doc.fileSize}</span>
                  </div>

                  {/* Title & vehicle info */}
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                    {doc.name}
                  </h3>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '10px' }}>
                    {doc.type}
                  </div>

                  <div
                    style={{
                      background: '#f8fafc',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '12px',
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '12px',
                    }}
                  >
                    <Car size={14} style={{ color: '#0056a2' }} />
                    <span>
                      Linked to: <strong>{doc.vehicleRef}</strong> ({doc.customerName})
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Issued: {doc.issueDate}</span>
                    {doc.expiryDate && <span>Expires: <strong>{doc.expiryDate}</strong></span>}
                  </div>
                </div>

                {/* Footer action buttons */}
                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <button
                    type="button"
                    className="autocare-garage-action-link"
                    onClick={() => setSelectedDoc(doc)}
                    style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
                  >
                    <Eye size={14} />
                    <span>View / Inspect</span>
                  </button>

                  <button
                    type="button"
                    className="autocare-garage-action-link"
                    onClick={() => navigate(`/garage/vehicles/${doc.vehicleId}`)}
                    style={{ fontSize: '12.5px', color: '#64748b' }}
                  >
                    Vehicle Details →
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ====================================================================
          VIEW / INSPECT DOCUMENT MODAL
          ==================================================================== */}
      {selectedDoc && (
        <div
          className="autocare-garage-modal-backdrop"
          onClick={() => setSelectedDoc(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="autocare-garage-modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="autocare-garage-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={20} style={{ color: '#0056a2' }} />
                <h3>Document Inspection: {selectedDoc.name}</h3>
              </div>
              <button
                type="button"
                className="autocare-garage-modal-close-btn"
                onClick={() => setSelectedDoc(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="autocare-garage-modal-body">
              {/* Document Preview Box */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px dashed #cbd5e1',
                  borderRadius: '10px',
                  padding: '30px 20px',
                  textAlign: 'center',
                  marginBottom: '18px',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                  }}
                >
                  {getCategoryIcon(selectedDoc.category)}
                </div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#0f172a' }}>{selectedDoc.name}</h4>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                  {selectedDoc.type} · {selectedDoc.fileSize}
                </p>
              </div>

              {/* Document metadata table */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  fontSize: '13px',
                  color: '#334155',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Vehicle:</span>
                  <strong>{selectedDoc.vehicleRef}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Registered Owner:</span>
                  <strong>{selectedDoc.customerName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Issuance Date:</span>
                  <span>{selectedDoc.issueDate}</span>
                </div>
                {selectedDoc.expiryDate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Expiry Date:</span>
                    <strong>{selectedDoc.expiryDate}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Verification Status:</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>VERIFIED (DEMO)</span>
                </div>
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>
                    SAMPLE DOCUMENT CHECKSUM:
                  </span>
                  <code style={{ fontSize: '11px', color: '#0056a2', wordBreak: 'break-all' }}>
                    {selectedDoc.hash}
                  </code>
                </div>
              </div>
            </div>

            <div className="autocare-garage-modal-footer">
              <button
                type="button"
                className="autocare-garage-hero-btn"
                style={{ background: '#f1f5f9', color: '#475569', marginRight: '8px' }}
                onClick={() => {
                  showToast(`Document ${selectedDoc.name} downloaded locally.`);
                }}
              >
                <Download size={14} style={{ marginRight: '4px' }} />
                <span>Download</span>
              </button>

              <button
                type="button"
                className="autocare-garage-btn-primary"
                onClick={() => {
                  showToast(`Printing job sent for ${selectedDoc.name}.`);
                }}
              >
                <Printer size={14} />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          UPLOAD DOCUMENT UI MODAL
          ==================================================================== */}
      {showUploadModal && (
        <div
          className="autocare-garage-modal-backdrop"
          onClick={() => setShowUploadModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="autocare-garage-modal" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="autocare-garage-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FilePlus size={20} style={{ color: '#0056a2' }} />
                <h3>Upload Client Document to Vault</h3>
              </div>
              <button
                type="button"
                className="autocare-garage-modal-close-btn"
                onClick={() => setShowUploadModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <div className="autocare-garage-modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Select Vehicle */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Assign to Client Vehicle *
                    </label>
                    <select
                      value={uploadVehicleId}
                      onChange={(e) => setUploadVehicleId(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                      required
                    >
                      {MOCK_GARAGE_VEHICLES.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.registration} · {v.make} {v.model} ({v.customer.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Document Category */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Document Classification *
                    </label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value as GarageDocumentItem['category'])}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                      required
                    >
                      <option value="SERVICE_DOC">Service Diagnostic Report</option>
                      <option value="INVOICE">Service Invoice / Work Order</option>
                      <option value="IMAGE">Technical Inspection Photo</option>
                      <option value="REGULATORY">Regulatory &amp; Compliance Document</option>
                    </select>
                  </div>

                  {/* Document Title */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Document Title / Name *
                    </label>
                    <input
                      type="text"
                      value={uploadDocName}
                      onChange={(e) => setUploadDocName(e.target.value)}
                      placeholder="e.g. Brake Disc Caliper Measurement Report"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                      required
                    />
                  </div>

                  {/* Drag and Drop Box Placeholder */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Choose File (PDF, PNG, JPG up to 10MB) *
                    </label>
                    <div
                      style={{
                        border: '1.5px dashed #cbd5e1',
                        borderRadius: '8px',
                        padding: '24px 16px',
                        textAlign: 'center',
                        background: '#f8fafc',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        showToast(`File selected: ${uploadFileName}`);
                      }}
                    >
                      <Upload size={28} style={{ color: '#0284c7', margin: '0 auto 8px auto' }} />
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                        Click to select file or drag and drop
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        Selected: <strong>{uploadFileName}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="autocare-garage-modal-footer">
                <button
                  type="button"
                  className="autocare-garage-hero-btn"
                  style={{ background: '#f1f5f9', color: '#475569', marginRight: '8px' }}
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="autocare-garage-btn-primary">
                  Upload &amp; Encrypt Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Toast Notification */}
      {toast.show && (
        <div className="autocare-garage-toast" role="alert">
          <CheckCircle2 size={18} style={{ color: '#00B4EB', flexShrink: 0 }} />
          <span>{toast.message}</span>
        </div>
      )}
    </GarageLayout>
  );
};

export default GarageDocumentsPage;
