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
  vehicleId: string;
  vehicleRef: string;
  customerName: string;
  date: string;
  status: 'Verified' | 'Pending link' | 'Service due';
  statusColor: 'green' | 'amber' | 'red';
}

export interface GarageVehicleServiceHistoryItem {
  id: string;
  serviceDate: string;
  serviceType: string;
  mileage: number;
  workPerformed: string;
  partsReplaced: string[];
  labourCost?: number;
  partsCost?: number;
  totalCost: number;
  garageName?: string;
  technician: string;
  status: 'Verified' | 'Pending Signature' | 'Draft';
  invoiceNo: string;
}

export interface GarageVehicleDocumentItem {
  id: string;
  name: string;
  type: 'Revenue License' | 'Insurance Certificate' | 'Emission Test' | 'Inspection Report';
  issueDate: string;
  expiryDate: string;
  status: 'Valid' | 'Expiring Soon' | 'Expired';
  fileSize: string;
}

export interface GarageCustomerInfo {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  memberSince: string;
  loyaltyTier: 'Gold' | 'Platinum' | 'Standard';
}

export interface GarageVehicle {
  id: string;
  registration: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  color: string;
  fuelType: string;
  transmission: string;
  engineCapacity: string;
  mileage: number;
  lastService: string;
  lastServiceType: string;
  status: 'Active' | 'In Service' | 'Service Due' | 'Quotation Sent';
  statusColor: 'green' | 'blue' | 'red' | 'amber';
  customer: GarageCustomerInfo;
  serviceHistory: GarageVehicleServiceHistoryItem[];
  documents: GarageVehicleDocumentItem[];
}

export const MOCK_GARAGE_KPIS: GarageKPI[] = [
  {
    id: 'kpi-customers',
    label: 'TOTAL CUSTOMERS',
    value: '125',
    subtext: '↑ 12% New this month',
    subtextType: 'positive',
  },
  {
    id: 'kpi-serviced',
    label: 'VEHICLES SERVICED',
    value: '240',
    subtext: 'LKR 4.2M Ledger Value',
    subtextType: 'info',
  },
  {
    id: 'kpi-entries',
    label: 'SERVICE ENTRIES',
    value: '318',
    subtext: '18 Pending Verification',
    subtextType: 'warning',
  },
  {
    id: 'kpi-revenue',
    label: 'MONTHLY REVENUE',
    value: 'Rs. 850,000',
    subtext: 'On track for targets',
    subtextType: 'positive',
  },
];

export const MOCK_RECENT_ENTRIES: RecentVerifiedEntry[] = [
  {
    id: 'entry-1',
    vehicleTitle: 'Toyota Aqua',
    regNumber: 'WP ABC-1234',
    mileage: '85,240 km',
    serviceDescription: 'Engine Oil & Filter Swap',
    status: 'COMMITTED',
  },
  {
    id: 'entry-2',
    vehicleTitle: 'Honda Vezel',
    regNumber: 'WP CAS-9988',
    mileage: '112,450 km',
    serviceDescription: 'Dual Clutch Fluid Replacement',
    status: 'COMMITTED',
  },
  {
    id: 'entry-3',
    vehicleTitle: 'Suzuki Wagon R',
    regNumber: 'WP CAD-1212',
    mileage: '42,100 km',
    serviceDescription: 'Spark Plug Configuration',
    status: 'PENDING SMS CODE',
  },
];

export const MOCK_OCR_QUEUE: OCRQueueItem = {
  id: 'ocr-0492',
  scanNumber: '#0492',
  vehicleTitle: 'Toyota Prius',
  regNumber: 'WP CAR-8282',
  progressPercent: 88,
};

export const MOCK_OCR_WARNING: OCRWarningItem = {
  id: 'warn-1',
  title: 'OCR Validation Warning',
  message: 'Manual check required for odometer match.',
};

export const MOCK_GARAGE_RECORDS: GarageRecordItem[] = [
  {
    id: 'rec-1',
    vehicleId: 'veh-1',
    vehicleRef: 'WP ABC-1234 · Toyota Aqua',
    customerName: 'Kaveesha P.',
    date: '21 Sep 2026',
    status: 'Verified',
    statusColor: 'green',
  },
  {
    id: 'rec-2',
    vehicleId: 'veh-3',
    vehicleRef: 'WP CAD-1212 · Suzuki Wagon R',
    customerName: 'Nadeesha S.',
    date: '02 Sep 2026',
    status: 'Pending link',
    statusColor: 'amber',
  },
  {
    id: 'rec-3',
    vehicleId: 'veh-2',
    vehicleRef: 'WP CAS-9988 · Honda Vezel',
    customerName: 'Ruwan D.',
    date: '18 Jul 2026',
    status: 'Service due',
    statusColor: 'red',
  },
];

export const MOCK_GARAGE_VEHICLES: GarageVehicle[] = [
  {
    id: 'veh-1',
    registration: 'WP ABC-1234',
    vin: 'JT2BF28K4W0129481',
    make: 'Toyota',
    model: 'Aqua G-Grade',
    year: 2018,
    color: 'Pearl White',
    fuelType: 'Hybrid / Petrol',
    transmission: 'Automatic (e-CVT)',
    engineCapacity: '1,496 cc',
    mileage: 85240,
    lastService: '21 Sep 2026',
    lastServiceType: 'Full Synthetic Lube & Inspection',
    status: 'Active',
    statusColor: 'green',
    customer: {
      id: 'cust-1',
      name: 'Kaveesha Perera',
      phone: '+94 77 123 4567',
      email: 'kaveesha.p@gmail.com',
      address: '45/2 Havelock Road, Colombo 05',
      memberSince: 'January 2024',
      loyaltyTier: 'Platinum',
    },
    serviceHistory: [
      {
        id: 'srv-101',
        serviceDate: '21 Sep 2026',
        serviceType: 'Routine Maintenance',
        mileage: 85240,
        workPerformed: 'Replaced Mobil 1 0W-20 engine oil, OEM oil filter, hybrid cooling fan cleaning.',
        partsReplaced: ['Engine Oil (4L)', 'Oil Filter OEM', 'Cabin Filter'],
        totalCost: 28500,
        technician: 'Kaveesha Perera (Master Tech)',
        status: 'Verified',
        invoiceNo: 'INV-2026-0921',
      },
      {
        id: 'srv-102',
        serviceDate: '15 Mar 2026',
        serviceType: 'Brake Overhaul & Fluid Flush',
        mileage: 79800,
        workPerformed: 'Front ceramic brake pads replaced, rotor skimming, DOT4 brake fluid flush.',
        partsReplaced: ['Front Brake Pads', 'DOT4 Fluid (1L)'],
        totalCost: 34200,
        technician: 'Sunil Weerasinghe',
        status: 'Verified',
        invoiceNo: 'INV-2026-0315',
      },
      {
        id: 'srv-103',
        serviceDate: '10 Oct 2025',
        serviceType: 'Transmission Service',
        mileage: 72100,
        workPerformed: 'Toyota e-CVT fluid exchange with genuine WS transmission fluid.',
        partsReplaced: ['Toyota ATF WS (4L)', 'Drain Plug Gasket'],
        totalCost: 24800,
        technician: 'Kaveesha Perera (Master Tech)',
        status: 'Verified',
        invoiceNo: 'INV-2025-1010',
      },
      {
        id: 'srv-104',
        serviceDate: '19 Oct 2026',
        serviceType: 'HVAC Air Purification & Filter Replacement',
        mileage: 85900,
        workPerformed: 'Cabin air filter replaced, evaporator core sanitized, airflow checked.',
        partsReplaced: ['Carbon Cabin Air Filter', 'Sanitizer Spray'],
        labourCost: 4500,
        partsCost: 6500,
        totalCost: 11000,
        garageName: 'Perera Auto Works (BR-03)',
        technician: 'Kaveesha Perera (Master Tech)',
        status: 'Draft',
        invoiceNo: 'DRAFT-2026-1019',
      },
    ],
    documents: [
      {
        id: 'doc-1',
        name: 'Western Province Revenue License 2026/2027',
        type: 'Revenue License',
        issueDate: '01 Jan 2026',
        expiryDate: '31 Dec 2026',
        status: 'Valid',
        fileSize: '1.8 MB',
      },
      {
        id: 'doc-2',
        name: 'Sri Lanka Insurance Motor Comprehensive Policy',
        type: 'Insurance Certificate',
        issueDate: '15 Feb 2026',
        expiryDate: '14 Feb 2027',
        status: 'Valid',
        fileSize: '2.4 MB',
      },
      {
        id: 'doc-3',
        name: 'DriveGreen Annual Vehicle Emission Report',
        type: 'Emission Test',
        issueDate: '28 Dec 2025',
        expiryDate: '27 Dec 2026',
        status: 'Expiring Soon',
        fileSize: '890 KB',
      },
    ],
  },
  {
    id: 'veh-2',
    registration: 'WP CAS-9988',
    vin: 'RU3-1209384819283',
    make: 'Honda',
    model: 'Vezel Z-Orange Edition',
    year: 2019,
    color: 'Sunset Orange Pearl',
    fuelType: 'Hybrid / Petrol',
    transmission: '7-Speed Dual Clutch (DCT)',
    engineCapacity: '1,496 cc',
    mileage: 112450,
    lastService: '18 Jul 2026',
    lastServiceType: 'Dual Clutch Actuator Fluid & Tune',
    status: 'In Service',
    statusColor: 'blue',
    customer: {
      id: 'cust-2',
      name: 'Ruwan Dissanayake',
      phone: '+94 71 889 2211',
      email: 'ruwan.d@gmail.com',
      address: '12 Temple Lane, Nugegoda',
      memberSince: 'August 2023',
      loyaltyTier: 'Gold',
    },
    serviceHistory: [
      {
        id: 'srv-201',
        serviceDate: '18 Jul 2026',
        serviceType: 'Dual Clutch & Actuator Service',
        mileage: 112450,
        workPerformed: 'Replaced Honda Ultra DW-1 DCT fluid, calibrated clutch engagement points.',
        partsReplaced: ['Honda DW-1 Fluid (2L)', 'Actuator Seal Kit'],
        totalCost: 42000,
        technician: 'Chaminda Rathnayake',
        status: 'Verified',
        invoiceNo: 'INV-2026-0718',
      },
    ],
    documents: [
      {
        id: 'doc-201',
        name: 'Western Province Revenue License',
        type: 'Revenue License',
        issueDate: '10 Mar 2026',
        expiryDate: '09 Mar 2027',
        status: 'Valid',
        fileSize: '1.4 MB',
      },
    ],
  },
  {
    id: 'veh-3',
    registration: 'WP CAD-1212',
    vin: 'MH55S-82938102938',
    make: 'Suzuki',
    model: 'Wagon R FX Hybrid',
    year: 2020,
    color: 'Silky Silver Metallic',
    fuelType: 'Mild Hybrid / Petrol',
    transmission: 'CVT Automatic',
    engineCapacity: '658 cc',
    mileage: 42100,
    lastService: '02 Sep 2026',
    lastServiceType: 'Spark Plugs & Throttle Body Clean',
    status: 'Active',
    statusColor: 'green',
    customer: {
      id: 'cust-3',
      name: 'Nadeesha Silva',
      phone: '+94 75 432 9876',
      email: 'nadeesha.s@yahoo.com',
      address: '88 Station Road, Dehiwala',
      memberSince: 'March 2025',
      loyaltyTier: 'Standard',
    },
    serviceHistory: [
      {
        id: 'srv-301',
        serviceDate: '02 Sep 2026',
        serviceType: 'Spark Plug & Throttle Service',
        mileage: 42100,
        workPerformed: 'Installed 3 NGK Laser Iridium plugs, ultrasonic throttle body cleansing.',
        partsReplaced: ['NGK Laser Iridium Plugs (x3)', 'Throttle Gasket'],
        totalCost: 21500,
        technician: 'Kaveesha Perera (Master Tech)',
        status: 'Pending Signature',
        invoiceNo: 'INV-2026-0902',
      },
    ],
    documents: [
      {
        id: 'doc-301',
        name: 'Ceylinco VIP Comprehensive Insurance',
        type: 'Insurance Certificate',
        issueDate: '01 Jun 2026',
        expiryDate: '31 May 2027',
        status: 'Valid',
        fileSize: '2.1 MB',
      },
    ],
  },
  {
    id: 'veh-4',
    registration: 'WP CAR-8282',
    vin: 'ZVW50-29182938192',
    make: 'Toyota',
    model: 'Prius 4th Gen S-Touring',
    year: 2017,
    color: 'Attitude Black Mica',
    fuelType: 'Hybrid / Petrol',
    transmission: 'Automatic (e-CVT)',
    engineCapacity: '1,797 cc',
    mileage: 98700,
    lastService: '12 Aug 2026',
    lastServiceType: 'Inverter Coolant Flush & Checkup',
    status: 'Service Due',
    statusColor: 'red',
    customer: {
      id: 'cust-4',
      name: 'Dhammika Fernando',
      phone: '+94 77 900 1122',
      email: 'dhammika.f@gmail.com',
      address: '15 Gregory Road, Colombo 07',
      memberSince: 'November 2023',
      loyaltyTier: 'Gold',
    },
    serviceHistory: [
      {
        id: 'srv-401',
        serviceDate: '12 Aug 2026',
        serviceType: 'Inverter Coolant & Diagnostics',
        mileage: 98700,
        workPerformed: 'Flushed inverter cooling system with Toyota Super Long Life Coolant.',
        partsReplaced: ['Toyota SLLC Coolant (5L)'],
        totalCost: 19800,
        technician: 'Sunil Weerasinghe',
        status: 'Verified',
        invoiceNo: 'INV-2026-0812',
      },
    ],
    documents: [
      {
        id: 'doc-401',
        name: 'DriveGreen Vehicle Emission Certificate',
        type: 'Emission Test',
        issueDate: '15 Aug 2025',
        expiryDate: '14 Aug 2026',
        status: 'Expired',
        fileSize: '950 KB',
      },
    ],
  },
  {
    id: 'veh-5',
    registration: 'CP CAA-5544',
    vin: 'NZE141-9281928391',
    make: 'Toyota',
    model: 'Corolla Axio G',
    year: 2016,
    color: 'Silver Metallic',
    fuelType: 'Petrol',
    transmission: 'Super CVT-i',
    engineCapacity: '1,498 cc',
    mileage: 134200,
    lastService: '28 Jun 2026',
    lastServiceType: 'Suspension Bushing & Strut Replacement',
    status: 'Quotation Sent',
    statusColor: 'amber',
    customer: {
      id: 'cust-5',
      name: 'Saman Kumara',
      phone: '+94 76 554 4332',
      email: 'saman.k@outlook.com',
      address: '22 Peradeniya Road, Kandy',
      memberSince: 'February 2024',
      loyaltyTier: 'Standard',
    },
    serviceHistory: [
      {
        id: 'srv-501',
        serviceDate: '28 Jun 2026',
        serviceType: 'Suspension Overhaul',
        mileage: 134200,
        workPerformed: 'Replaced front stabilizer links, lower arm bushes, and 4-wheel laser alignment.',
        partsReplaced: ['Stabilizer Links (Pair)', 'Lower Arm Bushes (x4)'],
        totalCost: 48500,
        technician: 'Chaminda Rathnayake',
        status: 'Verified',
        invoiceNo: 'INV-2026-0628',
      },
    ],
    documents: [
      {
        id: 'doc-501',
        name: 'Central Province Revenue License',
        type: 'Revenue License',
        issueDate: '15 Jul 2026',
        expiryDate: '14 Jul 2027',
        status: 'Valid',
        fileSize: '1.2 MB',
      },
    ],
  },
];

export const getGarageVehicleById = (id?: string): GarageVehicle => {
  if (!id) return MOCK_GARAGE_VEHICLES[0];
  const found = MOCK_GARAGE_VEHICLES.find((v) => v.id === id || v.registration.toLowerCase() === id.toLowerCase());
  return found || MOCK_GARAGE_VEHICLES[0];
};
