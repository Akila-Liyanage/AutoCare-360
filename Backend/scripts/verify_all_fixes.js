const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5000';

async function runTestSuite() {
  console.log('====================================================');
  console.log('   AUTOCARE 360 FULL SYSTEM VERIFICATION SUITE      ');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] (${totalTests}) ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] (${totalTests}) ${testName}`);
    }
  }

  // 1. Authenticate All 3 Roles
  console.log('--- TEST GROUP 1: AUTHENTICATION FOR ALL 3 ROLES ---');
  let garageToken, ownerToken, adminToken;

  try {
    const gRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'garage@gmail.com', password: 'Password123!' }),
    });
    const gData = await gRes.json();
    garageToken = gData.data?.token;
    assert(gRes.status === 200 && !!garageToken, 'Garage login (garage@gmail.com)');
  } catch (err) {
    assert(false, `Garage login error: ${err.message}`);
  }

  try {
    const oRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@gmail.com', password: 'Password123!' }),
    });
    const oData = await oRes.json();
    ownerToken = oData.data?.token;
    assert(oRes.status === 200 && !!ownerToken, 'Owner login (owner@gmail.com)');
  } catch (err) {
    assert(false, `Owner login error: ${err.message}`);
  }

  try {
    const aRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'Password123!' }),
    });
    const aData = await aRes.json();
    adminToken = aData.data?.token;
    assert(aRes.status === 200 && !!adminToken, 'Admin login (admin@gmail.com)');
  } catch (err) {
    assert(false, `Admin login error: ${err.message}`);
  }

  // 2. Real File Upload to /api/services/upload
  console.log('\n--- TEST GROUP 2: REAL FILE UPLOADS (PDF & IMAGES) ---');
  let uploadedInvoiceUrl = '';
  let uploadedPhotoUrl = '';

  try {
    const formData = new FormData();
    const invoicePdfBlob = new Blob(
      ['%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'],
      { type: 'application/pdf' }
    );
    const photoBlob = new Blob(['fake image bytes for test'], { type: 'image/jpeg' });

    formData.append('invoice', invoicePdfBlob, 'Verified_Work_Invoice_PAW_Test.pdf');
    formData.append('photos', photoBlob, 'engine_bay_after_service.jpg');

    const uploadRes = await fetch(`${BASE_URL}/api/services/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${garageToken}` },
      body: formData,
    });
    const uploadData = await uploadRes.json();
    uploadedInvoiceUrl = uploadData.data?.invoiceUrl;
    uploadedPhotoUrl = uploadData.data?.photoUrls?.[0];

    assert(
      uploadRes.status === 200 &&
      !!uploadedInvoiceUrl &&
      uploadedInvoiceUrl.endsWith('.pdf') &&
      uploadData.data?.files?.length === 2,
      'POST /api/services/upload multi-file upload (PDF invoice + inspection photo)'
    );

    // Verify static HTTP serving of the newly uploaded file
    const serveRes = await fetch(`${BASE_URL}${uploadedInvoiceUrl}`);
    assert(
      serveRes.status === 200 && serveRes.headers.get('content-type') === 'application/pdf',
      `Static serving of uploaded PDF (${uploadedInvoiceUrl}) returns HTTP 200 application/pdf`
    );
  } catch (err) {
    assert(false, `File upload error: ${err.message}`);
  }

  // 3. Publishing Service Record via Garage Portal
  console.log('\n--- TEST GROUP 3: ADD SERVICE ENTRY COMMIT TO MONGODB ---');
  let createdRecordId = '';
  const testMileage = 34500;

  try {
    const servicePayload = {
      vehicleId: '6ad8a02b9ba9651cdcf01886', // WP CAR-1010
      serviceDate: new Date().toISOString().split('T')[0],
      mileage: testMileage,
      serviceType: 'Comprehensive 35,000 km Hybrid Service',
      workPerformed: 'Replaced full synthetic engine oil & filter, brake inspection, hybrid fan cleaning.',
      partsReplaced: [
        'Mobil 1 0W-20 Full Synthetic (4L)',
        'OEM Oil Filter Element',
        'Hybrid Inverter Coolant (1L)',
      ],
      labourCost: 8000,
      partsCost: 17000,
      totalCost: 25000,
      invoiceUrl: uploadedInvoiceUrl,
      serviceImages: [uploadedPhotoUrl],
      technicianName: 'Kaveesha Perera (Master Tech)',
      garageName: 'Perera Auto Works (Pvt) Ltd',
      notes: 'Certified routine maintenance logged via Verified Garage Portal [BR-03].',
    };

    const postRes = await fetch(`${BASE_URL}/api/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${garageToken}`,
      },
      body: JSON.stringify(servicePayload),
    });
    const postData = await postRes.json();
    createdRecordId = postData.data?.serviceRecord?._id;

    assert(
      postRes.status === 201 &&
      !!createdRecordId &&
      postData.data?.serviceRecord?.recordSource === 'verified_garage',
      'POST /api/services successfully created certified service record in MongoDB'
    );
  } catch (err) {
    assert(false, `Create service record error: ${err.message}`);
  }

  // 4. Verify MongoDB Side-Effects (Vehicle, Expense, Notification, VehicleDocument)
  console.log('\n--- TEST GROUP 4: DATABASE SYNCHRONIZATION & SIDE EFFECTS ---');
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // A. Vehicle current mileage updated
    const vehicle = await mongoose.connection.collection('vehicles').findOne({
      _id: new mongoose.Types.ObjectId('6ad8a02b9ba9651cdcf01886'),
    });
    assert(
      vehicle && vehicle.currentMileage >= testMileage,
      `Vehicle WP CAR-1010 currentMileage updated to ${vehicle?.currentMileage} km`
    );

    // B. Expense auto-synced
    const expense = await mongoose.connection.collection('expenses').findOne({
      serviceRecordId: new mongoose.Types.ObjectId(createdRecordId),
    });
    assert(
      expense && expense.amount === 25000,
      `Expense auto-synced for Vehicle Owner (Amount: LKR ${expense?.amount})`
    );

    // C. Notification auto-synced
    const notif = await mongoose.connection.collection('notifications').findOne({
      relatedServiceRecordId: new mongoose.Types.ObjectId(createdRecordId),
    });
    assert(
      notif && notif.type === 'service',
      `Notification auto-synced for Owner: "${notif?.title}"`
    );

    // D. VehicleDocument auto-synced
    const doc = await mongoose.connection.collection('vehicledocuments').findOne({
      fileUrl: uploadedInvoiceUrl,
    });
    assert(
      doc && doc.documentType === 'Invoice',
      `VehicleDocument auto-synced: "${doc?.title}"`
    );
  } catch (err) {
    assert(false, `Database check error: ${err.message}`);
  } finally {
    await mongoose.disconnect();
  }

  // 5. Test Live Records Feeds for Dashboard
  console.log('\n--- TEST GROUP 5: LIVE MONGODB DATA FEEDS (NO DUMMY DATA) ---');
  try {
    const myRecsRes = await fetch(`${BASE_URL}/api/garage/my-records`, {
      headers: { Authorization: `Bearer ${garageToken}` },
    });
    const myRecsData = await myRecsRes.json();
    const records = myRecsData.data?.records || [];
    const hasNewRecord = records.some((r) => r._id === createdRecordId);
    assert(
      myRecsRes.status === 200 && records.length > 0 && hasNewRecord,
      `GET /api/garage/my-records returned ${records.length} live records including newly created record`
    );

    const statsRes = await fetch(`${BASE_URL}/api/garage/dashboard-stats`, {
      headers: { Authorization: `Bearer ${garageToken}` },
    });
    const statsData = await statsRes.json();
    assert(
      statsRes.status === 200 &&
      Array.isArray(statsData.data?.kpis) &&
      statsData.data.kpis.length >= 4,
      'GET /api/garage/dashboard-stats returned live calculated KPIs'
    );
  } catch (err) {
    assert(false, `Live records feed error: ${err.message}`);
  }

  // 6. Test Downloads & Physical Document Availability
  console.log('\n--- TEST GROUP 6: DOWNLOAD BUTTONS & PHYSICAL DOCUMENTS ---');
  const sampleDocs = [
    '/uploads/documents/Revenue_License_WP_CAR_1010.pdf',
    '/uploads/documents/Comprehensive_Insurance_Policy.pdf',
    '/uploads/documents/Emission_Test_Certificate.pdf',
    '/uploads/documents/CR_Book_Copy_WP_CAR_1010.pdf',
    '/uploads/invoices/PAW_INV_31800.pdf',
  ];

  for (const docPath of sampleDocs) {
    try {
      const res = await fetch(`${BASE_URL}${docPath}`);
      assert(
        res.status === 200 && res.headers.get('content-type') === 'application/pdf',
        `Physical downloadable file exists: ${path.basename(docPath)} (HTTP 200 application/pdf)`
      );
    } catch (err) {
      assert(false, `Error fetching ${docPath}: ${err.message}`);
    }
  }

  console.log('\n====================================================');
  console.log(`   FINAL RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite();
