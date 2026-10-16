import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Clock
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import {
  MOCK_VEHICLE_DOCUMENTS,
  type VehicleDocument,
  type DocumentCategory
} from './documentData';
import '../../styles/documents.css';

interface ToastState {
  show: boolean;
  message: string;
}

const VehicleDocumentsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Document state (initialized from typed mock data, allows local upload addition)
  const [documents, setDocuments] = useState<VehicleDocument[]>(MOCK_VEHICLE_DOCUMENTS);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [previewDoc, setPreviewDoc] = useState<VehicleDocument | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  // Upload Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<DocumentCategory>('Registration');
  const [newAuthority, setNewAuthority] = useState<string>('');
  const [newExpiryDate, setNewExpiryDate] = useState<string>('');
  const [uploadFileName, setUploadFileName] = useState<string>('');

  // Toast feedback state
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

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

  // Mock download action
  const handleDownload = (doc: VehicleDocument) => {
    showToast(`Downloading verified certificate: ${doc.fileName}`);
  };

  // Verify certificate action
  const handleVerify = (doc: VehicleDocument) => {
    showToast(`Certificate verified on chain! Signature: ${doc.ledgerHash}`);
  };

  // Handle document upload submit
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Please enter a document title.');
      return;
    }

    const randomHash = `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`;
    const newDoc: VehicleDocument = {
      id: `doc-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      fileName: uploadFileName.trim() || `${newTitle.trim().replace(/\s+/g, '_')}.pdf`,
      fileSize: '1.5 MB',
      fileType: 'PDF',
      issuingAuthority: newAuthority.trim() || 'Certified Issuer',
      issueDate: 'Today',
      expiryDate: newExpiryDate.trim() || 'Valid Indefinitely',
      status: 'Verified',
      statusTag: 'PDF',
      ledgerHash: randomHash,
      verifiedBy: 'AutoCare 360 Verification Protocol',
      verificationDate: 'Just now',
      notes: 'User-uploaded document bound to local digital passport ledger preview.'
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setIsUploadModalOpen(false);
    setNewTitle('');
    setNewAuthority('');
    setNewExpiryDate('');
    setUploadFileName('');
    showToast(`Document "${newDoc.title}" successfully added to verified records.`);
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
              onClick={() => navigate(id ? `/vehicles/${id}` : '/vehicles')}
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
                1 Document
              </div>
              <span className="autocare-docs-metric-sub alert">
                Insurance renewal in 29 days
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

          {/* Documents Grid */}
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
                      title="Download PDF file"
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

          {filteredDocuments.length === 0 && (
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
                No records match your selected filter or search term.
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

            {/* Drag & Drop Simulation */}
            <div
              className="autocare-docs-dropzone"
              onClick={() => {
                const sampleFiles = [
                  'Vehicle_Emissions_Test_2026.pdf',
                  'Revenue_License_2026_2027.pdf',
                  'Customs_Clearance_Declaration.pdf'
                ];
                const picked = sampleFiles[Math.floor(Math.random() * sampleFiles.length)];
                setUploadFileName(picked);
                showToast(`Selected file: ${picked}`);
              }}
            >
              <Upload size={28} className="autocare-docs-dropzone-icon" />
              <p className="autocare-docs-dropzone-text">
                {uploadFileName ? `Selected: ${uploadFileName}` : 'Click or drag PDF document to upload'}
              </p>
              <p className="autocare-docs-dropzone-sub">
                Supported: PDF, JPG, PNG (Max 15MB · Automated SHA-256 seal)
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
                  type="text"
                  className="autocare-docs-form-input"
                  placeholder="e.g. 15 Sep 2027"
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                />
              </div>

              <div className="autocare-docs-modal-footer">
                <button
                  type="button"
                  className="autocare-docs-btn-cancel"
                  onClick={() => setIsUploadModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="autocare-docs-btn-submit">
                  Upload to ledger
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
                Download PDF
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
