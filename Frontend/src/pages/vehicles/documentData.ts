export type DocumentCategory =
  | 'All'
  | 'Registration'
  | 'Insurance'
  | 'Service & Diagnostics'
  | 'Ownership & Title';

export type DocumentStatus = 'Verified' | 'Expiring Soon' | 'Signed' | 'Pending';

export interface VehicleDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  fileName: string;
  fileSize: string;
  fileType: 'PDF' | 'IMAGE' | 'SIGNED';
  issuingAuthority: string;
  issueDate: string;
  expiryDate?: string;
  status: DocumentStatus;
  statusTag: 'PDF' | 'SOON' | 'SIGNED' | 'VERIFIED';
  ledgerHash: string;
  verifiedBy: string;
  verificationDate: string;
  notes?: string;
  fileUrl?: string;
  backendId?: string;
}
