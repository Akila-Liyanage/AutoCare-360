/**
 * Automated Verification Script for AutoCare 360 QR Subsystem (Using native fetch)
 */

const BASE_URL = 'http://localhost:5000/api';
const OWNER_CREDENTIALS = {
  email: 'owner@gmail.com',
  password: 'Password123!',
};

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

async function run() {
  console.log('====================================================');
  console.log('   AutoCare 360 - QR Subsystem End-to-End Tests     ');
  console.log('====================================================\n');

  try {
    // 1. Owner Login
    console.log('Step 1: Logging in as registered vehicle owner...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(OWNER_CREDENTIALS),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.data?.token, 'Owner login successful');
    const token = loginData.data.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 2. Retrieve Owner Vehicles
    console.log('\nStep 2: Retrieving registered owner vehicles...');
    const vehRes = await fetch(`${BASE_URL}/vehicles`, { headers: authHeaders });
    const vehData = await vehRes.json();
    const vehicles = vehData.data?.vehicles || vehData.data || [];
    assert(vehicles.length > 0, `Retrieved ${vehicles.length} owner vehicle(s) from MongoDB`);
    const targetVehicle = vehicles[0];
    console.log(`Target Vehicle: ${targetVehicle.registrationNumber} - ${targetVehicle.manufacturer} ${targetVehicle.model}`);

    // 3. Create Purpose-Bound QR Share Link
    console.log('\nStep 3: Creating purpose-bound QR share link...');
    const sharePayload = {
      vehicleId: targetVehicle._id,
      recipientName: 'Automated Inspector / Prospective Buyer',
      purpose: 'Vehicle sale',
      permissionLevel: 'limited',
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      maxViews: 10,
    };
    const createRes = await fetch(`${BASE_URL}/share-links`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(sharePayload),
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, 'Share link created with HTTP 201');
    const { rawToken, shareUrl, qrCodeDataUrl } = createData.data;
    assert(!!rawToken && rawToken.length === 64, `Raw token generated (${rawToken.slice(0, 16)}...)`);
    assert(!!shareUrl && shareUrl.includes('/buyer-qr?token='), `Share URL generated: ${shareUrl}`);
    assert(!!qrCodeDataUrl && qrCodeDataUrl.startsWith('data:image/png;base64,'), 'High-res QR code base64 data URL generated');

    // 4. Stream Public QR Code Image PNG
    console.log('\nStep 4: Requesting public streamed QR PNG endpoint...');
    const qrImageRes = await fetch(`${BASE_URL}/share-links/public/${rawToken}/qr`);
    assert(qrImageRes.status === 200, 'Public QR image returned HTTP 200');
    assert(qrImageRes.headers.get('content-type') === 'image/png', 'Content-Type header is image/png');
    const arrayBuffer = await qrImageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    assert(isPng && buffer.length > 1000, `Valid binary PNG received (${buffer.length} bytes)`);

    // 5. Public Record Retrieval via Token
    console.log('\nStep 5: Retrieving public shared record using token...');
    const publicRes = await fetch(`${BASE_URL}/share-links/public/${rawToken}`);
    const publicBody = await publicRes.json();
    assert(publicRes.status === 200, 'Public record retrieved with HTTP 200');
    const publicData = publicBody.data;
    assert(publicData.vehicle?.registrationNumber === targetVehicle.registrationNumber, 'Vehicle registration matches');
    assert(publicData.watermark?.recipientName === 'Automated Inspector / Prospective Buyer', 'Watermark recipient matches');
    assert(publicData.healthAssessment?.trustScore >= 40, `AI Trust Score calculated: ${publicData.healthAssessment?.trustScore}/100`);
    assert(publicData.shareSession?.permissionLevel === 'limited', 'Permission level enforced as limited (BR-06)');

    // 6. Public Record Retrieval by Registration Plate (Fallback Lookup)
    console.log(`\nStep 6: Testing public vehicle lookup by registration number (${targetVehicle.registrationNumber})...`);
    const regLookupRes = await fetch(`${BASE_URL}/share-links/public/${encodeURIComponent(targetVehicle.registrationNumber)}`);
    const regLookupBody = await regLookupRes.json();
    assert(regLookupRes.status === 200, 'Registration plate lookup returned HTTP 200');
    assert(regLookupBody.data?.vehicle?.registrationNumber === targetVehicle.registrationNumber, 'Vehicle record correctly resolved by plate number');

    // 7. Verify Privacy Masking
    console.log('\nStep 7: Validating BR-06 privacy masking in limited scope...');
    const records = publicData.serviceRecords || [];
    let hasCostLeaked = false;
    for (const r of records) {
      if (r.cost !== undefined && r.cost !== null) {
        hasCostLeaked = true;
      }
    }
    assert(!hasCostLeaked, 'Service costs successfully masked in limited scope (BR-06 compliant)');

    console.log('\n====================================================');
    console.log(`   QR Subsystem Verification: ${passed} PASSED / ${failed} FAILED `);
    console.log('====================================================\n');

    process.exit(failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('Test execution failed:', error.message);
    process.exit(1);
  }
}

run();
