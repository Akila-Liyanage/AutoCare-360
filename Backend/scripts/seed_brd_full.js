const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Require actual backend models
const User = require('../src/models/User');
const Vehicle = require('../src/models/Vehicle');
const ServiceRecord = require('../src/models/ServiceRecord');
const Expense = require('../src/models/Expense');
const Notification = require('../src/models/Notification');
const VehicleDocument = require('../src/models/VehicleDocument');
const ShareLink = require('../src/models/ShareLink');
const Quotation = require('../src/models/Quotation');
const GarageInvoice = require('../src/models/GarageInvoice');
const AuditLog = require('../src/models/AuditLog');

async function seedBRDFull() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    const defaultPassword = 'Password123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 1. Ensure or update the 3 exact accounts requested by user
    // A. Vehicle Owner: owner@gmail.com
    let owner = await User.findOne({ email: 'owner@gmail.com' });
    if (!owner) {
      owner = await User.create({
        fullName: 'Chathura Perera',
        email: 'owner@gmail.com',
        phone: '+94 77 123 4567',
        password: hashedPassword,
        role: 'owner',
        status: 'active',
        displayName: 'Chathura P.',
        city: 'Colombo',
      });
      console.log('✓ Created owner@gmail.com');
    } else {
      owner.password = hashedPassword;
      owner.status = 'active';
      owner.fullName = 'Chathura Perera';
      owner.displayName = 'Chathura P.';
      await owner.save();
      console.log('✓ Updated owner@gmail.com');
    }

    // B. Garage Partner: garage@gmail.com
    let garage = await User.findOne({ email: 'garage@gmail.com' });
    if (!garage) {
      garage = await User.create({
        fullName: 'Perera Auto Works (Pvt) Ltd',
        email: 'garage@gmail.com',
        phone: '+94 11 258 9632',
        password: hashedPassword,
        role: 'garage',
        status: 'active',
        displayName: 'Perera Auto Works',
        city: 'Colombo 05',
      });
      console.log('✓ Created garage@gmail.com (active verified)');
    } else {
      garage.password = hashedPassword;
      garage.status = 'active';
      garage.fullName = 'Perera Auto Works (Pvt) Ltd';
      garage.displayName = 'Perera Auto Works';
      await garage.save();
      console.log('✓ Updated garage@gmail.com (active verified)');
    }

    // C. Administrator: admin@gmail.com
    let admin = await User.findOne({ email: 'admin@gmail.com' });
    if (!admin) {
      admin = await User.create({
        fullName: 'AutoCare System Director',
        email: 'admin@gmail.com',
        phone: '+94 11 200 1000',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        displayName: 'AutoCare Director',
        city: 'Colombo',
      });
      console.log('✓ Created admin@gmail.com');
    } else {
      admin.password = hashedPassword;
      admin.status = 'active';
      admin.fullName = 'AutoCare System Director';
      admin.displayName = 'AutoCare Director';
      await admin.save();
      console.log('✓ Updated admin@gmail.com');
    }

    // 2. Clean old data for this owner to ensure a clean, rich state
    const oldVehicles = await Vehicle.find({ ownerId: owner._id });
    const oldVehicleIds = oldVehicles.map(v => v._id);

    await ServiceRecord.deleteMany({ vehicleId: { $in: oldVehicleIds } });
    await Expense.deleteMany({ vehicleId: { $in: oldVehicleIds } });
    await Notification.deleteMany({ userId: owner._id });
    await VehicleDocument.deleteMany({ vehicleId: { $in: oldVehicleIds } });
    await ShareLink.deleteMany({ vehicleId: { $in: oldVehicleIds } });
    await Quotation.deleteMany({ garageId: garage._id });
    await GarageInvoice.deleteMany({ garageId: garage._id });
    await Vehicle.deleteMany({ ownerId: owner._id });

    console.log('✓ Cleaned existing records for fresh BRD seed');

    // 3. Create 2 realistic vehicles for owner@gmail.com (BR-01 Digital Vehicle Record Management)
    const vehicle1 = await Vehicle.create({
      ownerId: owner._id,
      registrationNumber: 'WP CAR-1010',
      vin: 'JT2BF28K4W0129481',
      engineNumber: '2ZR-FXE-4819201',
      vehicleType: 'SUV',
      manufacturer: 'Toyota',
      model: 'Corolla Cross Hybrid',
      manufacturingYear: 2022,
      currentMileage: 32500,
      fuelType: 'Hybrid',
      transmission: 'Automatic',
      color: 'Pearl White',
      registrationJurisdiction: 'Western Province',
      status: 'Active',
      lastServiceDate: new Date('2026-09-15'),
      nextServiceMileage: 40000,
    });

    const vehicle2 = await Vehicle.create({
      ownerId: owner._id,
      registrationNumber: 'WP CAS-4521',
      vin: 'JHMRU3850MC204192',
      engineNumber: 'LEB-H1-9104821',
      vehicleType: 'SUV',
      manufacturer: 'Honda',
      model: 'Vezel e:HEV Z-Grade',
      manufacturingYear: 2021,
      currentMileage: 48200,
      fuelType: 'Hybrid',
      transmission: 'Dual-Clutch',
      color: 'Crystal Black Pearl',
      registrationJurisdiction: 'Western Province',
      status: 'Active',
      lastServiceDate: new Date('2026-08-10'),
      nextServiceMileage: 55000,
    });

    console.log(`✓ Seeded vehicles: ${vehicle1.registrationNumber} & ${vehicle2.registrationNumber}`);

    // 4. Create Service Records for WP CAR-1010 (BR-02 Complete Maintenance History)
    // Milestone 1: 10,000 km
    const srv1 = await ServiceRecord.create({
      vehicleId: vehicle1._id,
      garageId: garage._id,
      garageName: garage.fullName,
      technicianName: 'Kaveesha Perera (Master Tech)',
      serviceDate: new Date('2024-06-10'),
      mileage: 10200,
      serviceType: 'Periodic 10,000 km Maintenance & Oil Service',
      workPerformed: 'Full synthetic motor oil renewal, OEM oil filter replacement, 40-point safety check, brake lining inspection, tire rotation.',
      partsReplaced: ['Toyota Genuine 0W-20 Motor Oil (4L)', 'OEM Oil Filter 04152-YZZA6', 'Washer Drain Plug'],
      labourCost: 4500,
      partsCost: 14500,
      totalCost: 19000,
      recordSource: 'verified_garage',
      verificationStatus: 'verified',
      invoiceUrl: '/uploads/invoices/PAW_INV_10200.pdf',
      serviceImages: ['/uploads/vehicles/engine_bay_10k.jpg'],
      notes: 'Initial break-in inspection completed. Vehicle in pristine mechanical condition.',
    });

    // Milestone 2: 20,000 km
    const srv2 = await ServiceRecord.create({
      vehicleId: vehicle1._id,
      garageId: garage._id,
      garageName: garage.fullName,
      technicianName: 'Kaveesha Perera (Master Tech)',
      serviceDate: new Date('2025-05-20'),
      mileage: 20450,
      serviceType: '20,000 km Major Routine Service & Hybrid Care',
      workPerformed: 'Full synthetic oil & filter change, cabin micro-air filter replacement, cleaned hybrid battery cooling intake fan, brake fluid moisture test, suspension bushing inspection.',
      partsReplaced: ['Mobil 1 0W-20 Full Synthetic (4L)', 'OEM Oil Filter', 'Cabin Air Filter', 'Windshield Wiper Blades'],
      labourCost: 6500,
      partsCost: 18500,
      totalCost: 25000,
      recordSource: 'verified_garage',
      verificationStatus: 'verified',
      invoiceUrl: '/uploads/invoices/PAW_INV_20450.pdf',
      serviceImages: ['/uploads/vehicles/hybrid_fan_cleaning.jpg'],
      notes: 'Hybrid battery telemetry healthy: 99.2% state of health.',
    });

    // Milestone 3: 30,000 km
    const srv3 = await ServiceRecord.create({
      vehicleId: vehicle1._id,
      garageId: garage._id,
      garageName: garage.fullName,
      technicianName: 'Kaveesha Perera (Master Tech)',
      serviceDate: new Date('2026-09-15'),
      mileage: 31800,
      serviceType: '30,000 km Comprehensive Service & Brake Caliper Servicing',
      workPerformed: 'Full synthetic oil renewal, front ceramic brake pad replacement, rotor skimming, brake caliper pin lubrication, computerized ECU diagnostic fault scan.',
      partsReplaced: ['Castrol EDGE 0W-20 Full Synthetic (4.2L)', 'Toyota Genuine Oil Filter', 'Front Ceramic Brake Pads OEM', 'DOT4 Brake Fluid (1L)'],
      labourCost: 8500,
      partsCost: 23500,
      totalCost: 32000,
      recordSource: 'verified_garage',
      verificationStatus: 'verified',
      invoiceUrl: '/uploads/invoices/PAW_INV_31800.pdf',
      serviceImages: ['/uploads/vehicles/brake_pads_new.jpg', 'engine_bay_clean.jpg'],
      notes: 'Brake pads bedded in properly. All electronic diagnostic systems zero error codes.',
    });

    console.log('✓ Seeded 3 verified service records for WP CAR-1010');

    // 5. Create Expenses for owner@gmail.com (BR-04 Vehicle Owner Control: Track Expenses)
    // A. Linked to service records
    await Expense.create({
      vehicleId: vehicle1._id,
      ownerId: owner._id,
      serviceRecordId: srv1._id,
      category: 'Maintenance',
      title: 'Periodic 10,000 km Service',
      description: srv1.workPerformed,
      amount: srv1.totalCost,
      expenseDate: srv1.serviceDate,
      vendor: garage.fullName,
      paymentMethod: 'Credit Card',
      source: 'service_record',
      notes: 'Certified service at Perera Auto Works',
    });

    await Expense.create({
      vehicleId: vehicle1._id,
      ownerId: owner._id,
      serviceRecordId: srv2._id,
      category: 'Maintenance',
      title: '20,000 km Routine Service & Hybrid Care',
      description: srv2.workPerformed,
      amount: srv2.totalCost,
      expenseDate: srv2.serviceDate,
      vendor: garage.fullName,
      paymentMethod: 'Credit Card',
      source: 'service_record',
      notes: 'Certified service at Perera Auto Works',
    });

    await Expense.create({
      vehicleId: vehicle1._id,
      ownerId: owner._id,
      serviceRecordId: srv3._id,
      category: 'Maintenance',
      title: '30,000 km Comprehensive Service & Brakes',
      description: srv3.workPerformed,
      amount: srv3.totalCost,
      expenseDate: srv3.serviceDate,
      vendor: garage.fullName,
      paymentMethod: 'Bank Transfer',
      source: 'service_record',
      notes: 'Certified service at Perera Auto Works',
    });

    // B. Real fuel & operating expenses
    await Expense.create({
      vehicleId: vehicle1._id,
      ownerId: owner._id,
      category: 'Fuel',
      title: 'Petrol 95 Octane (48 Litres)',
      description: 'Full tank refill at Colombo 07 station',
      amount: 18720,
      expenseDate: new Date('2026-10-14'),
      vendor: 'Ceypetco Fuel Station',
      paymentMethod: 'Card',
      source: 'manual',
      notes: 'Odometer at 32,450 km',
    });

    await Expense.create({
      vehicleId: vehicle1._id,
      ownerId: owner._id,
      category: 'Insurance',
      title: 'Annual Comprehensive Motor Insurance',
      description: 'Comprehensive policy renewal covering accidental damage, third party, natural perils',
      amount: 88500,
      expenseDate: new Date('2026-04-01'),
      vendor: 'Sri Lanka Insurance Corporation',
      paymentMethod: 'Online Bank Transfer',
      source: 'manual',
      notes: 'Policy No: SLIC-MOT-2026-88192',
    });

    await Expense.create({
      vehicleId: vehicle1._id,
      ownerId: owner._id,
      category: 'Taxes',
      title: 'Western Province Annual Revenue License',
      description: 'Department of Motor Traffic revenue license renewal 2026/2027',
      amount: 7800,
      expenseDate: new Date('2026-04-15'),
      vendor: 'Department of Motor Traffic',
      paymentMethod: 'Cash / DMT Counter',
      source: 'manual',
    });

    console.log('✓ Seeded realistic expense ledger for owner');

    // 6. Create Vehicle Documents (BR-04 Document storage)
    await VehicleDocument.create({
      vehicleId: vehicle1._id,
      ownerId: owner._id,
      uploadedBy: owner._id,
      documentType: 'Revenue License',
      title: 'Western Province Revenue License 2026/2027',
      description: 'Official annual road revenue certificate issued by the DMT',
      fileName: 'Revenue_License_WP_CAR_1010.pdf',
      originalName: 'Revenue_License_WP_CAR_1010.pdf',
      fileUrl: '/uploads/documents/Revenue_License_WP_CAR_1010.pdf',
      mimeType: 'application/pdf',
      fileSize: 420100,
      issueDate: new Date('2026-04-15'),
      expiryDate: new Date('2027-04-14'),
      issuingAuthority: 'Department of Motor Traffic (WP)',
      verificationStatus: 'verified',
    });

    await VehicleDocument.create({
      vehicleId: vehicle1._id,
      ownerId: owner._id,
      uploadedBy: owner._id,
      documentType: 'Insurance Certificate',
      title: 'Comprehensive Motor Insurance Policy',
      description: 'Class 1 Private Comprehensive Insurance cover note',
      fileName: 'Comprehensive_Insurance_Policy.pdf',
      originalName: 'Comprehensive_Insurance_Policy.pdf',
      fileUrl: '/uploads/documents/Comprehensive_Insurance_Policy.pdf',
      mimeType: 'application/pdf',
      fileSize: 890500,
      issueDate: new Date('2026-04-01'),
      expiryDate: new Date('2027-03-31'),
      issuingAuthority: 'Sri Lanka Insurance Corporation',
      verificationStatus: 'verified',
    });

    await VehicleDocument.create({
      vehicleId: vehicle1._id,
      ownerId: owner._id,
      uploadedBy: owner._id,
      documentType: 'Emission Test',
      title: 'DriveGreen Vehicle Emission Certificate',
      description: 'Passed annual automotive exhaust emission compliance test',
      fileName: 'Emission_Test_Certificate.pdf',
      originalName: 'Emission_Test_Certificate.pdf',
      fileUrl: '/uploads/documents/Emission_Test_Certificate.pdf',
      mimeType: 'application/pdf',
      fileSize: 310200,
      issueDate: new Date('2026-04-05'),
      expiryDate: new Date('2027-04-04'),
      issuingAuthority: 'CleanCo Lanka (DriveGreen)',
      verificationStatus: 'verified',
    });

    await VehicleDocument.create({
      vehicleId: vehicle1._id,
      ownerId: owner._id,
      uploadedBy: owner._id,
      documentType: 'Registration Certificate',
      title: 'Certificate of Registration (CR Book Copy)',
      description: 'Government motor vehicle title deed and registration confirmation',
      fileName: 'CR_Book_Copy_WP_CAR_1010.pdf',
      originalName: 'CR_Book_Copy_WP_CAR_1010.pdf',
      fileUrl: '/uploads/documents/CR_Book_Copy_WP_CAR_1010.pdf',
      mimeType: 'application/pdf',
      fileSize: 1250000,
      issueDate: new Date('2022-03-10'),
      issuingAuthority: 'Department of Motor Traffic (Sri Lanka)',
      verificationStatus: 'verified',
    });

    console.log('✓ Seeded official vehicle documents');

    // 7. Create Reminders & Notifications for owner (BR-04 Receive reminders / FR-06)
    await Notification.create({
      userId: owner._id,
      vehicleId: vehicle1._id,
      title: 'Upcoming 40,000 km Periodic Service',
      message: 'Your Toyota Corolla Cross (WP CAR-1010) is due for 40,000 km major service in approx 7,500 km or 4 months.',
      type: 'service',
      priority: 'medium',
      status: 'unread',
      source: 'service',
      relatedServiceRecordId: srv3._id,
    });

    await Notification.create({
      userId: owner._id,
      vehicleId: vehicle1._id,
      title: 'Certified Service Record Committed',
      message: 'Perera Auto Works (Pvt) Ltd has certified and published service record #PAW-30K into your digital vehicle passport.',
      type: 'service',
      priority: 'low',
      status: 'read',
      source: 'service',
      relatedServiceRecordId: srv3._id,
    });

    await Notification.create({
      userId: owner._id,
      vehicleId: vehicle1._id,
      title: 'Vehicle Health Assessment: 98/100',
      message: 'AI Vehicle Passport analyzed your maintenance chronology. Excellent service consistency and zero mileage anomalies detected.',
      type: 'system',
      priority: 'low',
      status: 'unread',
      source: 'system',
    });

    console.log('✓ Seeded owner notifications and reminders');

    // 8. Create Quotations & Invoices for garage@gmail.com (BR-03 Garage Service Management)
    await Quotation.create({
      garageId: garage._id,
      vehicleId: vehicle1._id,
      quotationNumber: 'QT-2026-1021-01',
      items: [
        { description: 'Synthetic Motor Oil 0W-20 (4L)', quantity: 1, unitPrice: 15500, total: 15500 },
        { description: 'Toyota Genuine Oil Filter Element', quantity: 1, unitPrice: 3200, total: 3200 },
        { description: 'Labour: 40,000km Periodic Major Inspection', quantity: 1, unitPrice: 8500, total: 8500 },
      ],
      estimatedLabour: 8500,
      estimatedParts: 18700,
      totalAmount: 27200,
      validUntil: new Date('2026-11-20'),
      status: 'sent',
      notes: 'Includes free hybrid cooling fan inspection & diagnostic ECU scan.',
    });

    await GarageInvoice.create({
      garageId: garage._id,
      vehicleId: vehicle1._id,
      serviceRecordId: srv3._id,
      invoiceNumber: 'INV-2026-31800',
      items: [
        { description: 'Castrol EDGE 0W-20 Full Synthetic (4.2L)', quantity: 1, unitPrice: 16500, total: 16500 },
        { description: 'Toyota Genuine Oil Filter', quantity: 1, unitPrice: 3500, total: 3500 },
        { description: 'Front Ceramic Brake Pads OEM', quantity: 1, unitPrice: 20000, total: 20000 },
        { description: 'Skimming front brake rotors', quantity: 2, unitPrice: 2000, total: 4000 },
        { description: 'Technician Labour (3.5 hours)', quantity: 1, unitPrice: 8500, total: 8500 },
      ],
      labourCost: 8500,
      partsCost: 40000,
      taxAmount: 0,
      discountAmount: 16500,
      totalAmount: 32000,
      status: 'paid',
      notes: 'Paid via direct bank transfer at Perera Auto Works service counter.',
    });

    console.log('✓ Seeded garage quotations and invoices');

    // 9. Create Secure Sharing Link & QR Code (BR-05, BR-06, BR-07)
    const crypto = require('crypto');
    const demoToken = 'demo-buyer-pass-2026';
    const tokenHash = crypto.createHash('sha256').update(demoToken).digest('hex');

    const shareLink = await ShareLink.create({
      vehicleId: vehicle1._id,
      ownerId: owner._id,
      createdBy: owner._id,
      tokenHash,
      recipientName: 'Prospective Buyer (Sampath Bank Lease Inspection)',
      recipientEmail: 'inspections@sampath.lk',
      purpose: 'Vehicle Resale Verification & Lease Approval',
      permissionLevel: 'full',
      allowedSections: ['vehicleInfo', 'serviceHistory', 'mileageTelemetry', 'documents', 'healthScore'],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days valid
      status: 'active',
      passcodeHash: null,
      maxViews: 50,
      viewCount: 3,
      lastAccessedAt: new Date('2026-10-20'),
      notes: 'CONFIDENTIAL: Sample Bank Lease Inspection · Validated on AutoCare 360',
    });

    console.log(`✓ Seeded secure share link with token: ${demoToken}`);

    // 10. Audit Trail Logs (BR-08 Audit Trail Management & BRULE-04)
    await AuditLog.create({
      action: 'USER_LOGIN',
      actorId: owner._id,
      actorRole: 'owner',
      actorName: owner.fullName,
      status: 'success',
      details: { email: owner.email, ip: '127.0.0.1' },
    });

    await AuditLog.create({
      action: 'USER_LOGIN',
      actorId: garage._id,
      actorRole: 'garage',
      actorName: garage.fullName,
      status: 'success',
      details: { email: garage.email, ip: '127.0.0.1' },
    });

    await AuditLog.create({
      action: 'SERVICE_RECORD_CREATED',
      vehicleId: vehicle1._id,
      actorId: garage._id,
      actorRole: 'garage',
      actorName: garage.fullName,
      status: 'success',
      details: {
        recordId: srv3._id,
        recordSource: 'verified_garage',
        mileage: srv3.mileage,
        totalCost: srv3.totalCost,
      },
    });

    await AuditLog.create({
      action: 'SHARE_LINK_VIEWED',
      vehicleId: vehicle1._id,
      shareLinkId: shareLink._id,
      actorRole: 'guest',
      actorName: 'Prospective Buyer / Lease Officer',
      recipientInfo: 'inspections@sampath.lk',
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'success',
      details: {
        permissionLevel: 'full',
        viewMode: 'protected_watermarked',
      },
    });

    console.log('✓ Seeded comprehensive audit trail logs');
    console.log('\n======================================================');
    console.log('BRD SEEDING COMPLETED SUCCESSFULLY!');
    console.log(`Owner Account:  owner@gmail.com   / Password123!`);
    console.log(`Garage Account: garage@gmail.com  / Password123!`);
    console.log(`Admin Account:  admin@gmail.com   / Password123!`);
    console.log(`Vehicle 1:      WP CAR-1010 (${vehicle1._id})`);
    console.log(`Vehicle 2:      WP CAS-4521 (${vehicle2._id})`);
    console.log(`Share Link:     Token=${demoToken}`);
    console.log('======================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error during BRD seeding:', err);
    process.exit(1);
  }
}

seedBRDFull();
