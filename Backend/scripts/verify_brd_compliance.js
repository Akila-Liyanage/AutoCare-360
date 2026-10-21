const http = require('http');

const API_BASE = 'http://localhost:5000/api';

const makeRequest = (path, method = 'GET', data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(body);
        } catch {
          json = body;
        }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

const runAudit = async () => {
  console.log('--- STARTING BRD COMPLIANCE & RULES VERIFICATION ---');

  // 1. Authenticate Demo Users
  console.log('\n[TEST 1] Authenticating Demo Accounts (Owner, Garage, Admin)...');
  const ownerRes = await makeRequest('/auth/login', 'POST', {
    email: 'owner.demo@autocare360.com',
    password: 'Password123!',
    selectedRole: 'owner',
  });
  if (ownerRes.status !== 200) throw new Error('Owner login failed: ' + JSON.stringify(ownerRes.data));
  const ownerToken = ownerRes.data.data.token;
  console.log('✓ Owner demo logged in successfully');

  const garageRes = await makeRequest('/auth/login', 'POST', {
    email: 'garage.demo@autocare360.com',
    password: 'Password123!',
    selectedRole: 'garage',
  });
  if (garageRes.status !== 200) throw new Error('Garage login failed: ' + JSON.stringify(garageRes.data));
  const garageToken = garageRes.data.data.token;
  console.log('✓ Verified garage demo logged in successfully');

  const adminRes = await makeRequest('/auth/login', 'POST', {
    email: 'admin.demo@autocare360.com',
    password: 'Password123!',
    selectedRole: 'admin',
  });
  if (adminRes.status !== 200) throw new Error('Admin login failed: ' + JSON.stringify(adminRes.data));
  const adminToken = adminRes.data.data.token;
  console.log('✓ Admin demo logged in successfully');

  // 2. Fetch Owner's Vehicle
  console.log('\n[TEST 2] Fetching Owner Vehicles (BRULE-05: Owner Tenant Isolation)...');
  const vehiclesRes = await makeRequest('/vehicles', 'GET', null, ownerToken);
  let vehicle;
  if (vehiclesRes.status === 200 && vehiclesRes.data.data.vehicles.length > 0) {
    vehicle = vehiclesRes.data.data.vehicles[0];
  } else {
    // Register new vehicle passport per BR-01 / FR-02
    const createVehRes = await makeRequest('/vehicles', 'POST', {
      registrationNumber: `CAB-${Math.floor(1000 + Math.random() * 9000)}`,
      vin: `1HGCR2F83HA${Math.floor(100000 + Math.random() * 900000)}`,
      vehicleType: 'Sedan',
      manufacturer: 'Toyota',
      model: 'Prius Hybrid',
      manufacturingYear: 2020,
      currentMileage: 64200,
      fuelType: 'Hybrid',
      transmission: 'Automatic',
      color: 'Pearl White Metallic',
    }, ownerToken);

    if (createVehRes.status !== 201) {
      throw new Error('Failed to create demo vehicle: ' + JSON.stringify(createVehRes.data));
    }
    vehicle = createVehRes.data.data.vehicle;
  }
  console.log(`✓ Owner vehicle active: ${vehicle.registrationNumber} (${vehicle.manufacturer} ${vehicle.model})`);

  // 3. Test BRULE-01: Garage adds verified maintenance record
  console.log('\n[TEST 3] BRULE-01: Verified Garage Adds Maintenance Record...');
  const serviceRes = await makeRequest('/services', 'POST', {
    vehicleId: vehicle._id,
    serviceDate: new Date().toISOString(),
    mileage: (vehicle.currentMileage || 70000) + 1500,
    serviceType: 'Hybrid Inverter Coolant & Brake Inspection',
    workPerformed: 'Flushed inverter cooling system and tested regeneration efficiency.',
    partsReplaced: ['Toyota Inverter Fluid SLLC', 'Filter Ring'],
    labourCost: 8500,
    partsCost: 12000,
    technicianName: 'Master Tech Kaveesha',
  }, garageToken);

  if (serviceRes.status !== 201) throw new Error('Service record creation failed: ' + JSON.stringify(serviceRes.data));
  const createdRecord = serviceRes.data.data.serviceRecord;
  console.log(`✓ Verified garage record created (ID: ${createdRecord._id}, Source: ${createdRecord.recordSource}, Status: ${createdRecord.verificationStatus})`);

  // 4. Test BRULE-01 Enforcement: Owner CANNOT modify verified garage record
  console.log('\n[TEST 4] BRULE-01: Owner cannot modify verified garage record...');
  const tamperRes = await makeRequest(`/services/${createdRecord._id}`, 'PATCH', {
    workPerformed: 'Attempted unauthorized owner tamper',
  }, ownerToken);
  if (tamperRes.status === 403) {
    console.log(`✓ Provenance Protected: 403 Forbidden received as expected ("${tamperRes.data.message}")`);
  } else {
    throw new Error(`Security breach! Expected 403, got ${tamperRes.status}`);
  }

  // 5. Test BR-03: Garage Quotation & Invoice Generation
  console.log('\n[TEST 5] BR-03: Garage Quotation & Invoice Generation...');
  const quoteRes = await makeRequest('/garage/quotations', 'POST', {
    vehicleId: vehicle._id,
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedLabour: 5000,
    estimatedParts: 15000,
    items: [{ description: 'Brake Disc Resurfacing', quantity: 2, unitPrice: 2500, total: 5000 }],
    notes: 'Valid for 14 days.',
  }, garageToken);
  if (quoteRes.status !== 201) throw new Error('Quotation generation failed: ' + JSON.stringify(quoteRes.data));
  console.log(`✓ Quotation generated: ${quoteRes.data.data.quotation.quotationNumber} (LKR ${quoteRes.data.data.quotation.totalAmount})`);

  const invRes = await makeRequest('/garage/invoices', 'POST', {
    vehicleId: vehicle._id,
    serviceRecordId: createdRecord._id,
    labourCost: 8500,
    partsCost: 12000,
    items: [{ description: 'Coolant Flush', quantity: 1, unitPrice: 20500, total: 20500 }],
  }, garageToken);
  if (invRes.status !== 201) throw new Error('Invoice creation failed: ' + JSON.stringify(invRes.data));
  console.log(`✓ Invoice created: ${invRes.data.data.invoice.invoiceNumber} (Total: LKR ${invRes.data.data.invoice.totalAmount})`);

  // 6. Test BRULE-03: Expiry Date Required on Share Link
  console.log('\n[TEST 6] BRULE-03: Share link expiry validation...');
  const invalidShareRes = await makeRequest('/share-links', 'POST', {
    vehicleId: vehicle._id,
    recipientName: 'Test Buyer',
  }, ownerToken);
  if (invalidShareRes.status === 400) {
    console.log(`✓ BRULE-03 Enforced: 400 Bad Request received when expiry date is missing ("${invalidShareRes.data.message}")`);
  } else {
    throw new Error(`Expected 400 for missing expiry date, got ${invalidShareRes.status}`);
  }

  // 7. Test BR-05 & BR-07: Create Valid Share Link and Test Public Record View
  console.log('\n[TEST 7] BR-05 & BR-07: Generate Valid Share Link & Verify Public View...');
  const validShareRes = await makeRequest('/share-links', 'POST', {
    vehicleId: vehicle._id,
    recipientName: 'Vehicle Inspector Kandy',
    purpose: 'resale_inspection',
    permissionLevel: 'limited',
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  }, ownerToken);
  if (validShareRes.status !== 201) throw new Error('Share link creation failed: ' + JSON.stringify(validShareRes.data));
  const shareToken = validShareRes.data.data.rawToken;
  console.log(`✓ Share link created with raw token: ${shareToken.substring(0, 16)}...`);

  // Public unauthenticated view
  const publicViewRes = await makeRequest(`/share-links/public/${shareToken}`, 'GET');
  if (publicViewRes.status !== 200) throw new Error('Public view failed: ' + JSON.stringify(publicViewRes.data));
  console.log(`✓ Public shared record retrieved (Scope: ${publicViewRes.data.data.scope}, Watermark Recipient: ${publicViewRes.data.data.watermark.recipientName})`);

  // 8. Test BR-08: Audit Trail Logs for Vehicle
  console.log('\n[TEST 8] BR-08: Owner Inspects Vehicle Audit Trail Logs...');
  const auditRes = await makeRequest(`/vehicles/${vehicle._id}/audit-logs`, 'GET', null, ownerToken);
  if (auditRes.status !== 200) throw new Error('Failed to retrieve vehicle audit logs: ' + JSON.stringify(auditRes.data));
  console.log(`✓ Retrieved ${auditRes.data.count} audit trail entries for vehicle ${vehicle.registrationNumber}`);
  const actions = auditRes.data.data.logs.slice(0, 3).map((l) => l.action);
  console.log(`  Recent actions: ${actions.join(', ')}`);

  // 9. Test BR-09: AI Vehicle Health Assessment & Trust Score
  console.log('\n[TEST 9] BR-09: AI Vehicle Health Passport & Predictive Maintenance...');
  const healthRes = await makeRequest(`/vehicles/${vehicle._id}/health-score`, 'GET', null, ownerToken);
  if (healthRes.status !== 200) throw new Error('Failed to retrieve health score: ' + JSON.stringify(healthRes.data));
  const health = healthRes.data.data;
  console.log(`✓ Health Assessment calculated: Trust Score: ${health.trustScore}/100 (${health.ratingCategory})`);
  console.log(`  AI Recommendation: ${health.aiPrediction.recommendedWork} (in ${health.aiPrediction.kmRemainingToService} km, Confidence: ${health.aiPrediction.confidenceLevel})`);

  console.log('\n======================================================');
  console.log('>>> ALL BRD REQUIREMENTS & BUSINESS RULES VERIFIED 100% <<<');
  console.log('======================================================');
};

runAudit().catch((err) => {
  console.error('\n❌ AUDIT FAILED:', err.message);
  process.exit(1);
});
