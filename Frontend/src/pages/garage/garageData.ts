export interface GarageKPI {
  id: string;
  label: string;
  value: string;
  subtext: string;
  subtextType: 'positive' | 'info' | 'warning';
}

export interface RecentVerifiedEntry {
  id: string;
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
}

export interface OCRWarningItem {
  id: string;
  title: string;
  message: string;
}

export interface GarageRecordItem {
  id: string;
  vehicleRef: string;
  customerName: string;
  date: string;
  status: 'Verified' | 'Pending link' | 'Service due';
  statusColor: 'green' | 'amber' | 'red';
}

export const MOCK_GARAGE_KPIS: GarageKPI[] = [
  {
    id: 'kpi-customers',
    label: 'TOTAL CUSTOMERS',
    value: '125',
    subtext: '↑ 12% New this month',
    subtextType: 'positive'
  },
  {
    id: 'kpi-serviced',
    label: 'VEHICLES SERVICED',
    value: '240',
    subtext: 'LKR 4.2M Ledger Value',
    subtextType: 'info'
  },
  {
    id: 'kpi-pending',
    label: 'PENDING ENTRIES',
    value: '18',
    subtext: 'Awaiting Owner Signature OTP',
    subtextType: 'warning'
  },
  {
    id: 'kpi-revenue',
    label: 'MONTHLY REVENUE',
    value: 'Rs. 850,000',
    subtext: 'On track for targets',
    subtextType: 'positive'
  }
];

export const MOCK_RECENT_ENTRIES: RecentVerifiedEntry[] = [
  {
    id: 'entry-1',
    vehicleTitle: 'Toyota Aqua',
    regNumber: 'WP ABC-1234',
    mileage: '85,240 km',
    serviceDescription: 'Engine Oil & Filter Swap',
    status: 'COMMITTED'
  },
  {
    id: 'entry-2',
    vehicleTitle: 'Honda Vezel',
    regNumber: 'WP CAS-9988',
    mileage: '112,450 km',
    serviceDescription: 'Dual Clutch Fluid Replacement',
    status: 'COMMITTED'
  },
  {
    id: 'entry-3',
    vehicleTitle: 'Suzuki Wagon R',
    regNumber: 'WP CAD-1212',
    mileage: '42,100 km',
    serviceDescription: 'Spark Plug Configuration',
    status: 'PENDING SMS CODE'
  }
];

export const MOCK_OCR_QUEUE: OCRQueueItem = {
  id: 'ocr-0492',
  scanNumber: '#0492',
  vehicleTitle: 'Toyota Prius',
  regNumber: 'WP CAR-8282',
  progressPercent: 88
};

export const MOCK_OCR_WARNING: OCRWarningItem = {
  id: 'warn-1',
  title: 'OCR Validation Warning',
  message: 'Manual check required for odometer match.'
};

export const MOCK_GARAGE_RECORDS: GarageRecordItem[] = [
  {
    id: 'rec-1',
    vehicleRef: 'WP ABC-1234 · Toyota Aqua',
    customerName: 'Kaveesha P.',
    date: '21 Sep 2026',
    status: 'Verified',
    statusColor: 'green'
  },
  {
    id: 'rec-2',
    vehicleRef: 'WP CBD-5521 · Suzuki Wagon R',
    customerName: 'Nadeesha S.',
    date: '02 Sep 2026',
    status: 'Pending link',
    statusColor: 'amber'
  },
  {
    id: 'rec-3',
    vehicleRef: 'WP CDE-9080 · Honda Vezel',
    customerName: 'Ruwan D.',
    date: '18 Jul 2026',
    status: 'Service due',
    statusColor: 'red'
  }
];
