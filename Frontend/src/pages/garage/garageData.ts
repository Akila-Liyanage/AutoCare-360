export interface GarageKPI {
  id: string;
  label: string;
  value: string;
  subtext: string;
  subtextType: 'positive' | 'info' | 'warning';
}

export interface RecentVerifiedEntry {
  id: string;
  _id?: string;
  vehicleTitle: string;
  regNumber: string;
  mileage: string;
  serviceDescription: string;
  status: 'COMMITTED' | 'PENDING SMS CODE';
}

export interface OCRQueueItem {
  id: string;
  scanNumber: string;
  vehicleTitle: string;
  regNumber: string;
  progressPercent: number;
  status?: string;
  estimatedTimeRemaining?: string;
}

export interface OCRWarningItem {
  id: string;
  title: string;
  message: string;
}

export interface GarageRecordItem {
  id: string;
  vehicleId: string;
  vehicleRef: string;
  customerName: string;
  date: string;
  status: 'Verified' | 'Pending link' | 'Service due';
  statusColor: 'green' | 'amber' | 'red';
}

export interface QuotationLineItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

export const FIGMA_GARAGE_KPIS: GarageKPI[] = [
  {
    id: 'kpi-customers',
    label: 'TOTAL CUSTOMERS',
    value: '0',
    subtext: '0 Lifetime Customers',
    subtextType: 'positive',
  },
  {
    id: 'kpi-serviced',
    label: 'VEHICLES SERVICED',
    value: '0',
    subtext: 'LKR 0 Ledger Value',
    subtextType: 'info',
  },
  {
    id: 'kpi-entries',
    label: 'PENDING ENTRIES',
    value: '0',
    subtext: 'All entries certified',
    subtextType: 'positive',
  },
  {
    id: 'kpi-revenue',
    label: 'MONTHLY REVENUE',
    value: 'Rs. 0',
    subtext: 'Certified Maintenance Ledger',
    subtextType: 'positive',
  },
];

export const FIGMA_RECENT_ENTRIES: RecentVerifiedEntry[] = [];

export const FIGMA_OCR_QUEUE: OCRQueueItem = {
  id: 'ocr-0492',
  scanNumber: '#0492',
  vehicleTitle: 'Toyota Prius',
  regNumber: 'WP CAR-8282',
  progressPercent: 88,
  status: 'In Progress (88%)',
  estimatedTimeRemaining: '12 seconds',
};

export const FIGMA_OCR_WARNING: OCRWarningItem = {
  id: 'warn-1',
  title: 'OCR Validation Warning',
  message: 'Manual check required for odometer match.',
};

export const FIGMA_GARAGE_RECORDS: GarageRecordItem[] = [];
