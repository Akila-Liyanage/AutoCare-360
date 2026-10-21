const fs = require('fs');
const path = require('path');

function createSimplePdf(filePath, title, bodyLines) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const content = [
    '%PDF-1.4',
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    '4 0 obj << /Length 1200 >> stream',
    'BT',
    '/F1 18 Tf',
    '50 720 Td',
    '(' + title.replace(/[()]/g, '') + ') Tj',
    '/F1 11 Tf',
    '0 -30 Td',
  ];
  bodyLines.forEach(line => {
    content.push('(' + line.replace(/[()]/g, '') + ') Tj');
    content.push('0 -18 Td');
  });
  content.push(
    'ET',
    'endstream',
    'endobj',
    'xref',
    '0 6',
    '0000000000 65535 f ',
    '0000000010 00000 n ',
    '0000000060 00000 n ',
    '0000000117 00000 n ',
    '0000000280 00000 n ',
    '0000000220 00000 n ',
    'trailer << /Size 6 /Root 1 0 R >>',
    'startxref',
    '800',
    '%%EOF'
  );
  fs.writeFileSync(filePath, content.join('\n'));
}

// 1x1 transparent PNG / simple JPEG dummy for image serving
const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function createSampleImage(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, Buffer.from(samplePngBase64, 'base64'));
}

const baseUploads = path.join(__dirname, '../uploads');

// Documents
createSimplePdf(path.join(baseUploads, 'documents/Revenue_License_WP_CAR_1010.pdf'), 'WESTERN PROVINCE MOTOR REVENUE LICENSE 2026/2027', [
  'AutoCare 360 Certified Digital Vehicle Passport Certificate',
  '--------------------------------------------------------------------------------',
  'Registration Number: WP CAR-1010',
  'Chassis / VIN: JT2BF28K4W0129481',
  'Engine Number: 2ZR-FXE-4819201',
  'Make & Model: Toyota Corolla Cross Hybrid',
  'Issuing Authority: Department of Motor Traffic - Western Province',
  'Issue Date: 15 April 2026',
  'Valid Until: 14 April 2027',
  'Tax Fee Paid: LKR 7,800.00',
  'Status: ACTIVE & LEGALLY VALID',
  '--------------------------------------------------------------------------------',
  'Cryptographic Hash: 0x8a91f32c0d5e89b21a7c4901b8e1f0a289dc62a1'
]);

createSimplePdf(path.join(baseUploads, 'documents/Comprehensive_Insurance_Policy.pdf'), 'COMPREHENSIVE MOTOR VEHICLE INSURANCE POLICY', [
  'Sri Lanka Insurance Corporation - Motor Department',
  '--------------------------------------------------------------------------------',
  'Policyholder: Chathura Perera',
  'Insured Vehicle: WP CAR-1010 (Toyota Corolla Cross 2022)',
  'Policy Number: SLIC-MOT-2026-88192',
  'Cover Type: Comprehensive Class 1 Private Motor Cover',
  'Sum Insured: LKR 18,500,000.00',
  'Period of Insurance: 01 April 2026 to 31 March 2027',
  'Premium Paid: LKR 88,500.00',
  'Status: ACTIVE & IN FORCE',
  '--------------------------------------------------------------------------------',
  '24/7 Roadside Assistance: 011 235 7357'
]);

createSimplePdf(path.join(baseUploads, 'documents/Emission_Test_Certificate.pdf'), 'VEHICLE EMISSION COMPLIANCE CERTIFICATE', [
  'CleanCo Lanka (Pvt) Ltd - DriveGreen Vehicle Emission Testing',
  '--------------------------------------------------------------------------------',
  'Registration Number: WP CAR-1010',
  'Chassis Number: JT2BF28K4W0129481',
  'Fuel Type: Petrol / Hybrid',
  'Test Result: PASSED (All Exhaust Emission Thresholds within Limit)',
  'CO Reading: 0.12% (Standard Max: 0.50%)',
  'HC Reading: 42 ppm (Standard Max: 200 ppm)',
  'Issue Date: 05 April 2026',
  'Valid Until: 04 April 2027',
  'Testing Center: DriveGreen Colombo 05 Station',
  'Status: CERTIFIED PASS'
]);

createSimplePdf(path.join(baseUploads, 'documents/CR_Book_Copy_WP_CAR_1010.pdf'), 'CERTIFICATE OF REGISTRATION - TITLE DEED', [
  'Department of Motor Traffic - Democratic Socialist Republic of Sri Lanka',
  '--------------------------------------------------------------------------------',
  'Registration Mark: WP CAR-1010',
  'Registered Owner: Chathura Perera',
  'Identity Card: 891234567V',
  'Address: No 45, Flower Road, Colombo 07',
  'Vehicle Classification: Dual Purpose / SUV',
  'Manufacturer: Toyota Motor Corporation',
  'Model: Corolla Cross 1.8 Hybrid',
  'Year of Manufacture: 2022',
  'Status: ORIGINAL TITLE DEED VERIFIED'
]);

// Invoices
createSimplePdf(path.join(baseUploads, 'invoices/PAW_INV_10200.pdf'), 'TAX INVOICE - PERERA AUTO WORKS (PVT) LTD', [
  'Invoice No: INV-2024-10200',
  'Customer: Chathura Perera | Vehicle: WP CAR-1010',
  'Service: Periodic 10,000 km Maintenance & Oil Service',
  'Labour Cost: LKR 4,500.00',
  'Parts Cost: LKR 14,500.00 (Toyota 0W-20, OEM Filter)',
  'Total Amount: LKR 19,000.00',
  'Payment Method: Credit Card (Settled)',
  'Master Technician: Kaveesha Perera'
]);

createSimplePdf(path.join(baseUploads, 'invoices/PAW_INV_20450.pdf'), 'TAX INVOICE - PERERA AUTO WORKS (PVT) LTD', [
  'Invoice No: INV-2025-20450',
  'Customer: Chathura Perera | Vehicle: WP CAR-1010',
  'Service: 20,000 km Major Routine Service & Hybrid Care',
  'Labour Cost: LKR 6,500.00',
  'Parts Cost: LKR 18,500.00 (Mobil 1 0W-20, Filters, Wipers)',
  'Total Amount: LKR 25,000.00',
  'Payment Method: Credit Card (Settled)'
]);

createSimplePdf(path.join(baseUploads, 'invoices/PAW_INV_31800.pdf'), 'TAX INVOICE - PERERA AUTO WORKS (PVT) LTD', [
  'Invoice No: INV-2026-31800',
  'Customer: Chathura Perera | Vehicle: WP CAR-1010',
  'Service: 30,000 km Comprehensive Service & Brake Calipers',
  'Labour Cost: LKR 8,500.00',
  'Parts Cost: LKR 23,500.00 (Castrol EDGE, Ceramic Pads, Rotor Skim)',
  'Total Amount: LKR 32,000.00',
  'Payment Method: Direct Bank Transfer (Settled)'
]);

// Images
createSampleImage(path.join(baseUploads, 'vehicles/engine_bay_10k.jpg'));
createSampleImage(path.join(baseUploads, 'vehicles/hybrid_fan_cleaning.jpg'));
createSampleImage(path.join(baseUploads, 'vehicles/brake_pads_new.jpg'));
createSampleImage(path.join(baseUploads, 'vehicles/engine_bay_clean.jpg'));

console.log('✓ All sample document PDFs, invoices, and photos generated successfully on disk!');
