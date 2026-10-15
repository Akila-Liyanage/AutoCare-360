export interface ServicePartWorkItem {
  task: string;
  certification: string;
}

export interface ServiceRecordItem {
  id: string;
  title: string;
  cost: number;
  currency: string;
  date: string;
  mileage: string;
  isVerified: boolean;
  type: 'verified' | 'self-reported';
  ledgerId: string;
  garage: {
    name: string;
    partnerId: string;
    technician: string;
  };
  workPerformed: ServicePartWorkItem[];
  invoice: {
    number: string;
    paymentMethod: string;
    fileName: string;
    fileSize: string;
    fileType: string;
  };
}

export const MOCK_SERVICE_RECORDS: ServiceRecordItem[] = [
  {
    id: 'rec-001',
    title: 'Cabin Filter & AC Service',
    cost: 12000.0,
    currency: 'LKR',
    date: 'Aug 12, 2025',
    mileage: '34,102 mi',
    isVerified: true,
    type: 'verified',
    ledgerId: '0xf23b486b8882 ... e4a02293',
    garage: {
      name: 'Apex Tech Service Center',
      partnerId: '#APX-928',
      technician: 'Sarah Chen',
    },
    workPerformed: [
      {
        task: 'Replaced High-Efficiency Cabin Microfilter',
        certification: 'OEM Certified Tesla Part',
      },
      {
        task: 'Full Evaporator Core Disinfection & Flush',
        certification: 'Authorized Service Agent Program',
      },
      {
        task: 'Odometer Audit Points Logged',
        certification: 'Ledger Update Confirmed',
      },
    ],
    invoice: {
      number: 'INV-2025-0812',
      paymentMethod: 'Paid via Visa ending 4242',
      fileName: 'certified-invoice.pdf',
      fileSize: '1.2 MB',
      fileType: 'Cryptographic PDF',
    },
  },
  {
    id: 'rec-002',
    title: 'Tesla Safety Check',
    cost: 1000.0,
    currency: 'LKR',
    date: 'May 04, 2025',
    mileage: '28,450 mi',
    isVerified: true,
    type: 'verified',
    ledgerId: '0xa19c72e411b0 ... d981ff32',
    garage: {
      name: 'Apex Tech Service Center',
      partnerId: '#APX-928',
      technician: 'Marcus Vance',
    },
    workPerformed: [
      {
        task: 'Full Multi-Point Safety Inspection',
        certification: 'Factory Standards Spec 2025',
      },
      {
        task: 'High-Voltage Interlock Integrity Check',
        certification: 'OEM Diagnostic Protocol',
      },
      {
        task: 'Tire Pressure & Tread Depth Certification',
        certification: 'Verified Safe (7.2mm)',
      },
    ],
    invoice: {
      number: 'INV-2025-0504',
      paymentMethod: 'Paid via Mastercard ending 1109',
      fileName: 'safety-check-report.pdf',
      fileSize: '850 KB',
      fileType: 'Cryptographic PDF',
    },
  },
  {
    id: 'rec-003',
    title: 'Brake Calibration & Pads',
    cost: 45000.0,
    currency: 'LKR',
    date: 'Jan 19, 2025',
    mileage: '22,110 mi',
    isVerified: true,
    type: 'verified',
    ledgerId: '0x78bd0234e891 ... b10c4921',
    garage: {
      name: 'Perera Auto Works',
      partnerId: '#PAW-410',
      technician: 'Nalin Perera',
    },
    workPerformed: [
      {
        task: 'Ceramic Brake Pads Replacement (Front & Rear)',
        certification: 'Brembo High Performance Spec',
      },
      {
        task: 'Brake Fluid Flushed & Bleeded',
        certification: 'DOT 4 Low Viscosity Standard',
      },
      {
        task: 'Electronic Parking Brake Recalibration',
        certification: 'Digital Diagnostic Signed',
      },
    ],
    invoice: {
      number: 'INV-2025-0119',
      paymentMethod: 'Paid via Bank Transfer',
      fileName: 'brake-service-invoice.pdf',
      fileSize: '1.4 MB',
      fileType: 'Cryptographic PDF',
    },
  },
  {
    id: 'rec-004',
    title: 'Front Motor Coolant Flush',
    cost: 320000.0,
    currency: 'LKR',
    date: 'Oct 12, 2024',
    mileage: '14,800 mi',
    isVerified: true,
    type: 'verified',
    ledgerId: '0x44fa9201bc66 ... 8e30b144',
    garage: {
      name: 'Ceylon Electric Motors Hub',
      partnerId: '#CEM-104',
      technician: 'Kavinda Senanayake',
    },
    workPerformed: [
      {
        task: 'Drive Unit Coolant Extraction & Replacement',
        certification: 'G-48 Ethylene Glycol Spec',
      },
      {
        task: 'Thermal Management System Pressure Test',
        certification: 'Zero Leakage Certified',
      },
      {
        task: 'Degas Bottle & Sensor Calibration',
        certification: 'Firmware 2024.32 Compatible',
      },
    ],
    invoice: {
      number: 'INV-2024-1012',
      paymentMethod: 'Paid via Corporate Amex ending 8021',
      fileName: 'motor-coolant-flush.pdf',
      fileSize: '2.1 MB',
      fileType: 'Cryptographic PDF',
    },
  },
  {
    id: 'rec-005',
    title: 'Annual Safety & Electronics Diagnostics',
    cost: 28500.0,
    currency: 'LKR',
    date: 'Aug 14, 2024',
    mileage: '12,500 mi',
    isVerified: true,
    type: 'verified',
    ledgerId: '0x99ea78b301c2 ... f440a120',
    garage: {
      name: 'Apex Tech Service Center',
      partnerId: '#APX-928',
      technician: 'Sarah Chen',
    },
    workPerformed: [
      {
        task: 'ECU Firmware Audit & Diagnostic Scanner Log',
        certification: 'Factory Approved Software',
      },
      {
        task: '12V Auxiliary Battery Health Check & Terminals Clean',
        certification: 'Voltage Stable at 13.8V',
      },
      {
        task: 'Steering Angle Sensor Zero Calibration',
        certification: 'Telemetry Verified',
      },
    ],
    invoice: {
      number: 'INV-2024-0814',
      paymentMethod: 'Paid via Visa ending 4242',
      fileName: 'annual-diagnostic-cert.pdf',
      fileSize: '1.1 MB',
      fileType: 'Cryptographic PDF',
    },
  },
  {
    id: 'rec-006',
    title: 'Tyre Safety Check & Rotation',
    cost: 8500.0,
    currency: 'LKR',
    date: 'Jul 03, 2024',
    mileage: '10,200 mi',
    isVerified: true,
    type: 'verified',
    ledgerId: '0x12bb432c9081 ... a77209ff',
    garage: {
      name: 'Perera Auto Works',
      partnerId: '#PAW-410',
      technician: 'Nalin Perera',
    },
    workPerformed: [
      {
        task: '4-Wheel Dynamic Rotation (Front-to-Rear Cross)',
        certification: 'Standard Radial Tire Practice',
      },
      {
        task: 'Tire Pressure Monitoring Sensors (TPMS) Re-learn',
        certification: 'All 4 Sensors Synced',
      },
      {
        task: 'Wheel Hub Surface Cleaning & Anti-Seize Applied',
        certification: 'Workshop Safety Check Passed',
      },
    ],
    invoice: {
      number: 'INV-2024-0703',
      paymentMethod: 'Paid via Cashless QR',
      fileName: 'tire-rotation-report.pdf',
      fileSize: '650 KB',
      fileType: 'Cryptographic PDF',
    },
  },
  {
    id: 'rec-007',
    title: 'Wheel Alignment & 4-Wheel Balancing',
    cost: 14000.0,
    currency: 'LKR',
    date: 'May 22, 2024',
    mileage: '8,400 mi',
    isVerified: true,
    type: 'verified',
    ledgerId: '0x33fc90a21102 ... e1190bc4',
    garage: {
      name: 'Colombo Precision Wheel Alignment',
      partnerId: '#CPW-205',
      technician: 'Dhammika Bandara',
    },
    workPerformed: [
      {
        task: '3D Laser Alignment & Camber/Caster Adjustment',
        certification: 'Within +/- 0.05 Deg Factory Tolerance',
      },
      {
        task: 'High-Speed Road Force Balancing (4 Wheels)',
        certification: 'Hunter Road Force Certified',
      },
    ],
    invoice: {
      number: 'INV-2024-0522',
      paymentMethod: 'Paid via Visa ending 4242',
      fileName: 'wheel-alignment-laser.pdf',
      fileSize: '920 KB',
      fileType: 'Cryptographic PDF',
    },
  },
  {
    id: 'rec-008',
    title: 'Suspension & Strut Inspection',
    cost: 18500.0,
    currency: 'LKR',
    date: 'Mar 10, 2024',
    mileage: '6,100 mi',
    isVerified: true,
    type: 'verified',
    ledgerId: '0x88cd223199bc ... fa210087',
    garage: {
      name: 'Apex Tech Service Center',
      partnerId: '#APX-928',
      technician: 'Sarah Chen',
    },
    workPerformed: [
      {
        task: 'Front & Rear Dampers Rebound / Compression Test',
        certification: 'Passed 94% Efficiency',
      },
      {
        task: 'Sway Bar End Links & Bushings Inspection',
        certification: 'No Play or Wear Detected',
      },
    ],
    invoice: {
      number: 'INV-2024-0310',
      paymentMethod: 'Paid via Mastercard ending 1109',
      fileName: 'suspension-inspection.pdf',
      fileSize: '1.3 MB',
      fileType: 'Cryptographic PDF',
    },
  },
  {
    id: 'rec-009',
    title: 'Battery Health & Telemetry Calibration',
    cost: 35000.0,
    currency: 'LKR',
    date: 'Jan 05, 2024',
    mileage: '4,200 mi',
    isVerified: true,
    type: 'verified',
    ledgerId: '0x22ab884109fa ... b2300ff1',
    garage: {
      name: 'Ceylon Electric Motors Hub',
      partnerId: '#CEM-104',
      technician: 'Kavinda Senanayake',
    },
    workPerformed: [
      {
        task: 'High-Voltage Pack Cell Balancing Cycle',
        certification: 'Max Cell Deviation: 4mV (Excellent)',
      },
      {
        task: 'BMS State of Health (SoH) Telemetry Logging',
        certification: 'Current SoH: 98.4%',
      },
    ],
    invoice: {
      number: 'INV-2024-0105',
      paymentMethod: 'Paid via Corporate Amex ending 8021',
      fileName: 'battery-health-audit.pdf',
      fileSize: '1.8 MB',
      fileType: 'Cryptographic PDF',
    },
  },
  {
    id: 'rec-010',
    title: 'Brake Fluid Replacement & Flush',
    cost: 16500.0,
    currency: 'LKR',
    date: 'Nov 18, 2023',
    mileage: '2,800 mi',
    isVerified: true,
    type: 'verified',
    ledgerId: '0x55dc991022ef ... a1102948',
    garage: {
      name: 'Apex Tech Service Center',
      partnerId: '#APX-928',
      technician: 'Marcus Vance',
    },
    workPerformed: [
      {
        task: 'Pressure Bleed System & Replace Moisture Contaminated Fluid',
        certification: 'Boiling Point > 260°C Verified',
      },
      {
        task: 'Master Cylinder Reservoir Seal Inspection',
        certification: 'Hermetic Seal Intact',
      },
    ],
    invoice: {
      number: 'INV-2023-1118',
      paymentMethod: 'Paid via Visa ending 4242',
      fileName: 'brake-fluid-service.pdf',
      fileSize: '780 KB',
      fileType: 'Cryptographic PDF',
    },
  },
  {
    id: 'rec-011',
    title: 'High-Voltage System Inspection',
    cost: 22000.0,
    currency: 'LKR',
    date: 'Sep 09, 2023',
    mileage: '1,500 mi',
    isVerified: true,
    type: 'verified',
    ledgerId: '0x66eb331008ab ... c7719283',
    garage: {
      name: 'Ceylon Electric Motors Hub',
      partnerId: '#CEM-104',
      technician: 'Kavinda Senanayake',
    },
    workPerformed: [
      {
        task: 'High-Voltage Cable Insulation Resistance Test (Megger)',
        certification: 'Resistance > 500 MOhm (Optimal)',
      },
      {
        task: 'Manual Service Disconnect (MSD) Fuse Check',
        certification: 'Fuse Continuity Verified',
      },
    ],
    invoice: {
      number: 'INV-2023-0909',
      paymentMethod: 'Paid via Bank Transfer',
      fileName: 'hv-system-inspection.pdf',
      fileSize: '1.5 MB',
      fileType: 'Cryptographic PDF',
    },
  },
  {
    id: 'rec-012',
    title: 'Wiper Blades & Windshield Washer Flush',
    cost: 6500.0,
    currency: 'LKR',
    date: 'Jul 15, 2023',
    mileage: '500 mi',
    isVerified: true,
    type: 'verified',
    ledgerId: '0x77fa221088bc ... 9901aa44',
    garage: {
      name: 'Apex Tech Service Center',
      partnerId: '#APX-928',
      technician: 'Sarah Chen',
    },
    workPerformed: [
      {
        task: 'All-Weather Silicon Wiper Blades Installed',
        certification: 'OEM Beam Blade Spec',
      },
      {
        task: 'Anti-Smear Screenwash Reservoir Flush & Refill',
        certification: 'Hydrophobic Coating Applied',
      },
    ],
    invoice: {
      number: 'INV-2023-0715',
      paymentMethod: 'Paid via Cashless QR',
      fileName: 'wiper-service-receipt.pdf',
      fileSize: '540 KB',
      fileType: 'Cryptographic PDF',
    },
  },
  {
    id: 'rec-013',
    title: 'Owner Tire Pressure & Tread Depth Log',
    cost: 0.0,
    currency: 'LKR',
    date: 'May 15, 2025',
    mileage: '29,100 mi',
    isVerified: false,
    type: 'self-reported',
    ledgerId: '0xself-9941a802 ... 118bc001',
    garage: {
      name: 'Owner Self-Log',
      partnerId: 'Self-Reported Entry',
      technician: 'Vehicle Owner',
    },
    workPerformed: [
      {
        task: 'Cold tire pressure adjusted to 42 PSI all around',
        certification: 'Digital Calibrated Pressure Gauge',
      },
      {
        task: 'Visual inspection of tread depths and sidewall condition',
        certification: 'Uniform 6.8mm Tread, No Sidewall Bulges',
      },
    ],
    invoice: {
      number: 'SELF-LOG-2025-0515',
      paymentMethod: 'Owner Maintenance Routine (No Charge)',
      fileName: 'tire-depth-log.pdf',
      fileSize: '340 KB',
      fileType: 'Owner Log Entry',
    },
  },
  {
    id: 'rec-014',
    title: 'Emergency Puncture Repair - Mobile Tyre Service',
    cost: 4500.0,
    currency: 'LKR',
    date: 'Nov 02, 2024',
    mileage: '16,200 mi',
    isVerified: false,
    type: 'self-reported',
    ledgerId: '0xself-1092b771 ... f44901ab',
    garage: {
      name: 'Roadside Quick Fix Mobile',
      partnerId: 'Independent Unaccredited Workshop',
      technician: 'Mobile Roadside Tech',
    },
    workPerformed: [
      {
        task: 'Rear right tire nail puncture extraction & mushroom patch',
        certification: 'Radial Patch Plug Standard',
      },
      {
        task: 'Emergency bead seal and rim inspection',
        certification: 'Zero Air Pressure Loss in 24h',
      },
    ],
    invoice: {
      number: 'RECEIPT-9912',
      paymentMethod: 'Paid in Cash',
      fileName: 'puncture-repair-receipt.pdf',
      fileSize: '410 KB',
      fileType: 'Scanned Cash Receipt',
    },
  },
];
