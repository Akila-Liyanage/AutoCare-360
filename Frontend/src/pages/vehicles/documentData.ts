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
}

export const MOCK_VEHICLE_DOCUMENTS: VehicleDocument[] = [
  {
    id: 'doc-001',
    title: 'Vehicle Registration Certificate (CR)',
    category: 'Registration',
    fileName: 'DMT_CR_WP_ABC1234.pdf',
    fileSize: '2.4 MB',
    fileType: 'PDF',
    issuingAuthority: 'Department of Motor Traffic (DMT), Sri Lanka',
    issueDate: '15 May 2024',
    expiryDate: 'Permanent Registration',
    status: 'Verified',
    statusTag: 'PDF',
    ledgerHash: '0x8f9e2b7c4a1d0092...bf489',
    verifiedBy: 'DMT Verified Registry Node #01',
    verificationDate: '15 May 2024 · 10:15 AM',
    notes: 'Certified original Certificate of Registration with official vehicle classification, engine and chassis binding.'
  },
  {
    id: 'doc-002',
    title: 'Insurance Policy (Comprehensive Coverage)',
    category: 'Insurance',
    fileName: 'Ceylinco_Policy_CP_88291.pdf',
    fileSize: '1.8 MB',
    fileType: 'PDF',
    issuingAuthority: 'Ceylinco General Insurance PLC',
    issueDate: '15 Nov 2025',
    expiryDate: 'Expires 14 Nov 2026',
    status: 'Expiring Soon',
    statusTag: 'SOON',
    ledgerHash: '0x4e7a8829bc14df90...2284b',
    verifiedBy: 'Ceylinco API Integration Ledger',
    verificationDate: '15 Nov 2025 · 02:30 PM',
    notes: 'Comprehensive motor insurance coverage including third-party liability, passenger cover, and natural disaster indemnity.'
  },
  {
    id: 'doc-003',
    title: 'Annual Diagnostic & Safety Inspection Report',
    category: 'Service & Diagnostics',
    fileName: 'ApexTech_Diagnostics_2026_82410km.pdf',
    fileSize: '3.1 MB',
    fileType: 'PDF',
    issuingAuthority: 'Apex Tech Service Center (Authorized Workshop)',
    issueDate: '14 Aug 2026',
    expiryDate: '14 Aug 2027',
    status: 'Verified',
    statusTag: 'PDF',
    ledgerHash: '0x2293e4a0f23b486b...9017a',
    verifiedBy: 'Apex Tech Certified Tech #49',
    verificationDate: '14 Aug 2026 · 11:45 AM',
    notes: '38-point full vehicle diagnostics including powertrain scan, brake rotor runout, high-voltage battery health (96.4%), and tyre tread depth.'
  },
  {
    id: 'doc-004',
    title: 'Certificate of Ownership & Title Deed',
    category: 'Ownership & Title',
    fileName: 'Ownership_Title_Deed_0x9d15dc86.pdf',
    fileSize: '1.2 MB',
    fileType: 'SIGNED',
    issuingAuthority: 'AutoCare 360 Decentralized Ledger & SL Transport',
    issueDate: '15 May 2026',
    expiryDate: 'Indefinite (Current Registered Owner)',
    status: 'Signed',
    statusTag: 'SIGNED',
    ledgerHash: '0x9d15dc86bf489001...8b52c',
    verifiedBy: 'Multi-Party Smart Contract Consensus',
    verificationDate: '15 May 2026 · 09:00 AM',
    notes: 'Cryptographically signed ownership transfer token registered immutably on the AutoCare 360 vehicle ledger.'
  }
];
