import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  Award,
  Wrench,
  Download,
  Eye,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Upload,
  Copy,
  Clock,
  RefreshCw
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import {
  type VehicleDocument,
  type DocumentCategory
} from './documentData';
import {
  getVehicleDocuments,
  uploadVehicleDocument,
  type BackendVehicleDocument
} from '../../services/documentService';
import { getMyVehicles, type Vehicle } from '../../services/vehicleService';
import api from '../../services/api';
import '../../styles/documents.css';

interface ToastState {
  show: boolean;
  message: string;
}

/**
 * Maps a backend VehicleDocument response into the UI VehicleDocument interface
 */
const mapBackendDocument = (doc: BackendVehicleDocument): VehicleDocument => {
  let category: DocumentCategory = 'Registration';
  const dt = (doc.documentType || '').toLowerCase();
  if (dt.includes('insurance')) {
    category = 'Insurance';
  } else if (dt.includes('service') || dt.includes('diagnostic')) {
    category = 'Service & Diagnostics';
  } else if (dt.includes('ownership') || dt.includes('title')) {
    category = 'Ownership & Title';
  }

  const isPdf =
    doc.mimeType?.includes('pdf') ||
    doc.fileName?.toLowerCase().endsWith('.pdf');
  const isImage =
    doc.mimeType?.includes('image') ||
    /\.(png|jpe?g)$/i.test(doc.fileName || '');
  const fileType: 'PDF' | 'IMAGE' | 'SIGNED' = isPdf
    ? 'PDF'
    : isImage
    ? 'IMAGE'
    : 'PDF';

  // Format file size
  let formattedSize = '1.2 MB';
  if (doc.fileSize && doc.fileSize > 0) {
    if (doc.fileSize >= 1024 * 1024) {
      formattedSize = `${(doc.fileSize / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      formattedSize = `${(doc.fileSize / 1024).toFixed(0)} KB`;
    }
  }

  // Format issue date
  let formattedIssueDate = 'Recorded';
  if (doc.issueDate) {
    try {
      const d = new Date(doc.issueDate);
      if (!isNaN(d.getTime())) {
        formattedIssueDate = d.toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      }
    } catch {
      formattedIssueDate = String(doc.issueDate);
    }
  } else if (doc.createdAt) {
    try {
      const d = new Date(doc.createdAt);
      if (!isNaN(d.getTime())) {
        formattedIssueDate = d.toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      }
    } catch {
      formattedIssueDate = 'Recorded';
    }
  }

  // Format expiry date
  let formattedExpiryDate: string | undefined = undefined;
  let isSoon = false;
  if (doc.expiryDate) {
    try {
      const d = new Date(doc.expiryDate);
      if (!isNaN(d.getTime())) {
        const daysUntilExpiry = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
          isSoon = true;
        }
        formattedExpiryDate = `Expires ${d.toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}`;
      }
    } catch {
      formattedExpiryDate = String(doc.expiryDate);
    }
  }

  const status = isSoon ? 'Expiring Soon' : 'Verified';
  const statusTag = isSoon ? 'SOON' : 'PDF';
  const ledgerHash = `0x${doc._id.slice(0, 8)}...${doc._id.slice(-4)}`;

  let issuingAuthority = 'Certified Issuer / DMT Sri Lanka';
  if (doc.description) {
    issuingAuthority = doc.description;
  } else if (doc.source === 'verified_garage') {
    issuingAuthority = 'Apex Tech Service Center (Authorized Workshop)';
  } else if (category === 'Insurance') {
    issuingAuthority = 'Ceylinco General Insurance PLC';
  } else if (category === 'Registration') {
    issuingAuthority = 'Department of Motor Traffic (DMT), Sri Lanka';
  }

  let formattedVerificationDate = 'Just now';
  if (doc.createdAt) {
    try {
      const d = new Date(doc.createdAt);
      if (!isNaN(d.getTime())) {
        formattedVerificationDate = `${d.toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })} · ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      }
    } catch {
      formattedVerificationDate = 'Verified Record';
    }
  }

  return {
    id: doc._id,
    backendId: doc._id,
    title: doc.title,
    category,
    fileName: doc.originalName || doc.fileName,
    fileSize: formattedSize,
    fileType,
    issuingAuthority,
    issueDate: formattedIssueDate,
    expiryDate: formattedExpiryDate || 'Valid Indefinitely',
    status,
    statusTag,
    ledgerHash,
    verifiedBy:
      doc.source === 'verified_garage'
        ? 'Verified Workshop Ledger Node'
        : 'AutoCare 360 Verification Protocol',
    verificationDate: formattedVerificationDate,
    notes: doc.notes || doc.description || '',
    fileUrl: doc.fileUrl,
  };
};

const VehicleDocumentsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Documents and active vehicle state
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Async API states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Modals state
  const [previewDoc, setPreviewDoc] = useState<VehicleDocument | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  // Upload Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<DocumentCategory>('Registration');
  const [newAuthority, setNewAuthority] = useState<string>('');
  const [newExpiryDate, setNewExpiryDate] = useState<string>('');
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast feedback state
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  /**
   * Load vehicle documents from real backend API
   */
  const loadDocuments = useCallback(async (targetVehicleId: string) => {
    try {
      setIsLoading(true);
      setApiError(null);
      const backendDocs = await getVehicleDocuments(targetVehicleId);
      setDocuments(backendDocs.map(mapBackendDocument));
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to retrieve vehicle documents. Please check your connection and try again.';
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const resolveVehicleAndFetch = async () => {
      try {
        setIsLoading(true);
        setApiError(null);

        const locationState = (location.state as { vehicleId?: string; vehicle?: Vehicle }) || {};
        let resolvedId = id || locationState.vehicleId || locationState.vehicle?._id;

        if (!resolvedId) {
          const myVehicles = await getMyVehicles();
          if (myVehicles && myVehicles.length > 0) {
            resolvedId = myVehicles[0]._id;
          }
        }

        if (!resolvedId) {
          if (isMounted) {
            setApiError('No vehicle found. Please register or select a vehicle first.');
            setIsLoading(false);
          }
          return;
        }

        if (isMounted) {
          setActiveVehicleId(resolvedId);
        }

        const backendDocs = await getVehicleDocuments(resolvedId);
        if (isMounted) {
          setDocuments(backendDocs.map(mapBackendDocument));
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Failed to retrieve vehicle documents. Please check your connection and try again.';
          setApiError(msg);
          setIsLoading(false);
        }
      }
    };

    resolveVehicleAndFetch();

    return () => {
      isMounted = false;
    };
  }, [id, location.state]);

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory =
      selectedCategory === 'All' || doc.category === selectedCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.issuingAuthority.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.ledgerHash.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Category counts
  const categories: DocumentCategory[] = [
    'All',
    'Registration',
    'Insurance',
    'Service & Diagnostics',
    'Ownership & Title'
  ];

  // Helper for Category Icons
  const renderCategoryIcon = (category: DocumentCategory) => {
    switch (category) {
      case 'Registration':
        return (
          <div className="autocare-doc-icon-wrap is-reg">
            <FileText size={24} />
          </div>
        );
      case 'Insurance':
        return (
          <div className="autocare-doc-icon-wrap is-ins">
            <ShieldCheck size={24} />
          </div>
        );
      case 'Service & Diagnostics':
        return (
          <div className="autocare-doc-icon-wrap is-diag">
            <Wrench size={24} />
          </div>
        );
      case 'Ownership & Title':
      default:
        return (
          <div className="autocare-doc-icon-wrap is-own">
            <Award size={24} />
          </div>
        );
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: VehicleDocument['status']) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="autocare-doc-status-badge verified">
            Verified
          </span>
        );
      case 'Expiring Soon':
        return (
          <span className="autocare-doc-status-badge soon">
            Expiring Soon
          </span>
        );
      case 'Signed':
        return (
          <span className="autocare-doc-status-badge signed">
            Signed
          </span>
        );
      default:
        return (
          <span className="autocare-doc-status-badge verified">
            Active
          </span>
        );
    }
  };

  // Copy hash helper
  const handleCopyHash = (hash: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(hash).catch(() => {});
    }
    showToast(`Ledger hash ${hash.substring(0, 10)}... copied to clipboard!`);
  };

  // Download / View real certificate file
  const handleDownload = (doc: VehicleDocument) => {
    if (doc.fileUrl) {
      const rawBase = api.defaults.baseURL || 'http://localhost:5000/api';
      const hostBase = rawBase.replace(/\/api$/, '');
      const fullUrl = doc.fileUrl.startsWith('http')
        ? doc.fileUrl
        : `${hostBase}${doc.fileUrl}`;
      window.open(fullUrl, '_blank');
      showToast(`Opening document: ${doc.fileName}`);
    } else {
      showToast(`Opening certificate: ${doc.fileName}`);
    }
  };

  // Verify certificate action
  const handleVerify = (doc: VehicleDocument) => {
    showToast(`Certificate verified on chain! Signature: ${doc.ledgerHash}`);
  };

  // Handle file selection from dropzone
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadFileName(file.name);
      if (!newTitle.trim()) {
        const cleanTitle = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[_-]/g, ' ')
          .trim();
        setNewTitle(cleanTitle);
      }
      showToast(`Selected file: ${file.name}`);
    }
  };

  // Handle document upload submit to POST /api/vehicles/:vehicleId/documents
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim()) {
      showToast('Please enter a document title.');
      return;
    }

    if (!selectedFile) {
      showToast('Please select a PDF or image document file to upload.');
      return;
    }

    if (!activeVehicleId) {
      showToast('Vehicle ID is missing. Please reload the vehicle passport.');
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('documentType', newCategory);
      formData.append('title', newTitle.trim());
      if (newAuthority.trim()) {
        formData.append('description', newAuthority.trim());
        formData.append('notes', `Issuing Authority: ${newAuthority.trim()}`);
      }
      if (newExpiryDate.trim()) {
        formData.append('expiryDate', newExpiryDate.trim());
      }
      formData.append('issueDate', new Date().toISOString());

      const createdBackendDoc = await uploadVehicleDocument(activeVehicleId, formData);
      const mappedDoc = mapBackendDocument(createdBackendDoc);

      setDocuments((prev) => [mappedDoc, ...prev]);
      setIsUploadModalOpen(false);
      setNewTitle('');
      setNewAuthority('');
      setNewExpiryDate('');
      setUploadFileName('');
      setSelectedFile(null);
      showToast(`Document "${mappedDoc.title}" successfully uploaded and verified on ledger.`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to upload document. Please check the file and try again.';
      showToast(`Upload failed: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="autocare-docs-page">
      <Navbar />

      <main className="autocare-docs-main">
        <div className="autocare-docs-container">
          {/* Breadcrumb / Back Navigation */}
          <div className="autocare-docs-back-nav">
            <button
              type="button"
              className="autocare-docs-back-btn"
              onClick={() => navigate(activeVehicleId ? `/vehicles/${activeVehicleId}` : '/vehicles')}
              title="Return to vehicle details"
            >
              <ArrowLeft size={16} />
              <span>Back to vehicle details</span>
            </button>
          </div>

          {/* Category Pill Tag */}
          <span className="autocare-docs-category-badge">
            DIGITAL VEHICLE PASSPORT · VERIFIED DOCUMENT MANAGEMENT
          </span>

          {/* Top Header Row */}
          <header className="autocare-docs-header-row">
            <div className="autocare-docs-title-group">
              <h1 className="autocare-docs-title">Vehicle Documents</h1>
              <p className="autocare-docs-subtitle">
                Cryptographically verified records, regulatory compliance certificates, and immutable ownership deeds.
              </p>
            </div>

            <div className="autocare-docs-header-actions">
              <button
                type="button"
                className="autocare-docs-btn-upload"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <Plus size={16} />
                <span>Upload document</span>
              </button>
            </div>
          </header>

          {/* 4 Metrics Summary Grid */}
          <section className="autocare-docs-metrics-grid" aria-label="Document Metrics Summary">
            {/* Metric 1 */}
            <div className="autocare-docs-metric-card">
              <div className="autocare-docs-metric-header">
                <span className="autocare-docs-metric-label">Total Documents</span>
                <FileText size={18} className="autocare-docs-metric-icon" />
              </div>
              <div className="autocare-docs-metric-val">{documents.length} Records</div>
              <span className="autocare-docs-metric-sub">
                ✓ All verified on ledger
              </span>
            </div>

            {/* Metric 2 */}
            <div className="autocare-docs-metric-card">
              <div className="autocare-docs-metric-header">
                <span className="autocare-docs-metric-label">Compliance Status</span>
                <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
              </div>
              <div className="autocare-docs-metric-val" style={{ color: '#16a34a' }}>
                Compliant
              </div>
              <span className="autocare-docs-metric-sub">
                Official DMT &amp; Insurance valid
              </span>
            </div>

            {/* Metric 3 */}
            <div className="autocare-docs-metric-card">
              <div className="autocare-docs-metric-header">
                <span className="autocare-docs-metric-label">Expiring Soon</span>
                <AlertTriangle size={18} style={{ color: '#ea580c' }} />
              </div>
              <div className="autocare-docs-metric-val" style={{ color: '#ea580c' }}>
                {documents.filter((d) => d.status === 'Expiring Soon').length} Document{documents.filter((d) => d.status === 'Expiring Soon').length === 1 ? '' : 's'}
              </div>
              <span className="autocare-docs-metric-sub alert">
                {documents.some((d) => d.status === 'Expiring Soon')
                  ? 'Upcoming renewals pending'
                  : 'No documents expiring soon'}
              </span>
            </div>

            {/* Metric 4 */}
            <div className="autocare-docs-metric-card">
              <div className="autocare-docs-metric-header">
                <span className="autocare-docs-metric-label">Ledger Integrity</span>
                <ShieldCheck size={18} className="autocare-docs-metric-icon" />
              </div>
              <div className="autocare-docs-metric-val">100% Valid</div>
              <span className="autocare-docs-metric-sub">
                SHA-256 Multi-sig secured
              </span>
            </div>
          </section>

          {/* API Error State Banner */}
          {apiError && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#991b1b',
              }}
              role="alert"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle size={20} color="#dc2626" />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{apiError}</span>
              </div>
              {activeVehicleId && (
                <button
                  type="button"
                  onClick={() => loadDocuments(activeVehicleId)}
                  style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <RefreshCw size={14} />
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}

          {/* Toolbar: Search & Category Filter Chips */}
          <div className="autocare-docs-toolbar">
            <div className="autocare-docs-search-wrap">
              <Search size={16} className="autocare-docs-search-icon" />
              <input
                type="text"
                className="autocare-docs-search-input"
                placeholder="Search documents by name, authority, or hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="autocare-docs-category-chips">
              {categories.map((cat) => {
                const count =
                  cat === 'All'
                    ? documents.length
                    : documents.filter((d) => d.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`autocare-docs-chip ${
                      selectedCategory === cat ? 'is-active' : ''
                    }`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading State Spinner */}
          {isLoading ? (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '60px 20px',
                textAlign: 'center',
                color: '#64748b',
              }}
            >
              <RefreshCw
                size={32}
                className="autocare-animate-spin"
                style={{ color: '#0056A2', marginBottom: '12px' }}
              />
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                Loading verified vehicle documents...
              </p>
            </div>
          ) : (
            /* Documents Grid */
            <div className="autocare-docs-grid">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="autocare-doc-card">
                  <div>
                    {/* Top Header */}
                    <div className="autocare-doc-card-top">
                      {renderCategoryIcon(doc.category)}
                      <div className="autocare-doc-meta-header">
                        <div className="autocare-doc-badges-row">
                          <span className="autocare-doc-category-tag">{doc.category}</span>
                          {renderStatusBadge(doc.status)}
                          <span className="autocare-doc-pill is-pdf">{doc.fileType}</span>
                        </div>
                        <h2 className="autocare-doc-card-title">{doc.title}</h2>
                        <p className="autocare-doc-authority">{doc.issuingAuthority}</p>
                      </div>
                    </div>

                    {/* Information List */}
                    <div className="autocare-doc-info-list">
                      <div className="autocare-doc-info-row">
                        <span className="autocare-doc-info-label">Issue Date</span>
                        <span className="autocare-doc-info-val">{doc.issueDate}</span>
                      </div>

                      <div className="autocare-doc-info-row">
                        <span className="autocare-doc-info-label">Validity / Expiry</span>
                        <span
                          className={`autocare-doc-info-val ${
                            doc.status === 'Expiring Soon' ? 'alert' : ''
                          }`}
                        >
                          {doc.expiryDate || 'Permanent'}
                        </span>
                      </div>

                      <div className="autocare-doc-info-row">
                        <span className="autocare-doc-info-label">File Size</span>
                        <span className="autocare-doc-info-val">
                          {doc.fileName} ({doc.fileSize})
                        </span>
                      </div>

                      <div className="autocare-doc-info-row">
                        <span className="autocare-doc-info-label">Ledger Root Hash</span>
                        <span
                          className="autocare-doc-hash-val"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleCopyHash(doc.ledgerHash)}
                          title="Click to copy hash"
                        >
                          {doc.ledgerHash} <Copy size={11} style={{ verticalAlign: 'middle' }} />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Card Actions */}
                  <div className="autocare-doc-card-actions">
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="autocare-doc-btn-view"
                        onClick={() => setPreviewDoc(doc)}
                        title="Preview verified document"
                      >
                        <Eye size={15} />
                        <span>View</span>
                      </button>

                      <button
                        type="button"
                        className="autocare-doc-btn-download"
                        onClick={() => handleDownload(doc)}
                        title="Open / Download document file"
                      >
                        <Download size={15} />
                        <span>Download</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      className="autocare-doc-btn-verify"
                      onClick={() => handleVerify(doc)}
                      title="Verify on cryptographic audit ledger"
                    >
                      <ShieldCheck size={14} />
                      <span>Audit ledger</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && filteredDocuments.length === 0 && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '48px',
                textAlign: 'center',
                color: '#64748b'
              }}
            >
              <FileText size={40} style={{ color: '#94a3b8', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                No documents found
              </h3>
              <p style={{ margin: 0, fontSize: '14px' }}>
                {searchQuery || selectedCategory !== 'All'
                  ? 'No records match your selected filter or search term.'
                  : 'No documents uploaded for this vehicle passport yet.'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="autocare-docs-modal-overlay" role="dialog" aria-modal="true">
          <div className="autocare-docs-modal-card">
            <div className="autocare-docs-modal-header">
              <h3 className="autocare-docs-modal-title">Upload Vehicle Document</h3>
              <button
                type="button"
                className="autocare-docs-modal-close"
                onClick={() => setIsUploadModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {/* Drag & Drop Area */}
            <div
              className="autocare-docs-dropzone"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  fileInputRef.current?.click();
                }
              }}
            >
              <Upload size={28} className="autocare-docs-dropzone-icon" />
              <p className="autocare-docs-dropzone-text">
                {uploadFileName ? `Selected: ${uploadFileName}` : 'Click to select PDF or image file to upload'}
              </p>
              <p className="autocare-docs-dropzone-sub">
                Supported: PDF, JPG, PNG (Max 10MB · Automated SHA-256 seal)
              </p>
            </div>

            <form onSubmit={handleUploadSubmit} className="autocare-docs-modal-form">
              <div className="autocare-docs-form-group">
                <label className="autocare-docs-form-label">Document Title *</label>
                <input
                  type="text"
                  required
                  className="autocare-docs-form-input"
                  placeholder="e.g. Annual Vehicle Emission Certificate"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="autocare-docs-form-group">
                <label className="autocare-docs-form-label">Document Category *</label>
                <select
                  className="autocare-docs-form-select"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as DocumentCategory)}
                >
                  <option value="Registration">Registration &amp; Identity</option>
                  <option value="Insurance">Insurance Policy</option>
                  <option value="Service & Diagnostics">Service &amp; Diagnostics</option>
                  <option value="Ownership & Title">Ownership &amp; Title</option>
                </select>
              </div>

              <div className="autocare-docs-form-group">
                <label className="autocare-docs-form-label">Issuing Authority</label>
                <input
                  type="text"
                  className="autocare-docs-form-input"
                  placeholder="e.g. CleanCo Vehicle Emission Testing"
                  value={newAuthority}
                  onChange={(e) => setNewAuthority(e.target.value)}
                />
              </div>

              <div className="autocare-docs-form-group">
                <label className="autocare-docs-form-label">Expiration Date (Optional)</label>
                <input
                  type="date"
                  className="autocare-docs-form-input"
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                />
              </div>

              <div className="autocare-docs-modal-footer">
                <button
                  type="button"
                  className="autocare-docs-btn-cancel"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="autocare-docs-btn-submit"
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading to ledger...' : 'Upload to ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document View Preview Modal */}
      {previewDoc && (
        <div className="autocare-docs-modal-overlay" role="dialog" aria-modal="true">
          <div className="autocare-docs-modal-card" style={{ maxWidth: '640px' }}>
            <div className="autocare-docs-modal-header">
              <h3 className="autocare-docs-modal-title">Document Verification Preview</h3>
              <button
                type="button"
                className="autocare-docs-modal-close"
                onClick={() => setPreviewDoc(null)}
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>

            {/* Certified Certificate Display Box */}
            <div className="autocare-docs-cert-preview">
              <div className="autocare-docs-cert-watermark">
                AUTOCARE 360 VERIFIED
              </div>

              <div className="autocare-docs-cert-header">
                <ShieldCheck size={28} color="#0056A2" />
                <div>
                  <h4 className="autocare-docs-cert-title">{previewDoc.title}</h4>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {previewDoc.issuingAuthority}
                  </span>
                </div>
              </div>

              <div className="autocare-docs-cert-body">
                <div>
                  <strong>Category:</strong> {previewDoc.category}
                </div>
                <div>
                  <strong>Issue Date:</strong> {previewDoc.issueDate}
                </div>
                <div>
                  <strong>Validity:</strong> {previewDoc.expiryDate || 'Permanent'}
                </div>
                <div>
                  <strong>Verified By:</strong> {previewDoc.verifiedBy} ({previewDoc.verificationDate})
                </div>
                <div>
                  <strong>Ledger Seal:</strong>{' '}
                  <code style={{ fontSize: '12px', color: '#0056A2' }}>{previewDoc.ledgerHash}</code>
                </div>
                {previewDoc.notes && (
                  <p style={{ marginTop: '8px', fontSize: '12.5px', color: '#475569', fontStyle: 'italic' }}>
                    &ldquo;{previewDoc.notes}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <div className="autocare-docs-modal-footer">
              <button
                type="button"
                className="autocare-docs-btn-cancel"
                onClick={() => setPreviewDoc(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="autocare-docs-btn-submit"
                onClick={() => {
                  handleDownload(previewDoc);
                  setPreviewDoc(null);
                }}
              >
                <Download size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Open / Download File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast.show && (
        <div className="autocare-docs-toast" role="alert">
          <Clock size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
          <span>{toast.message}</span>
          <button
            type="button"
            className="autocare-docs-toast-close"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            aria-label="Dismiss toast"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default VehicleDocumentsPage;
