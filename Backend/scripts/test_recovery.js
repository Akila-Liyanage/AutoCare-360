const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE = 'http://localhost:5000/api/auth';

async function requestJson(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const res = await fetch(url, { ...options, headers });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // non-json body
  }
  return { status: res.status, ok: res.ok, data };
}

async function runRecoveryE2ETests() {
  console.log('====================================================');
  console.log('AUTOCARE 360 - PASSWORD RECOVERY E2E VERIFICATION');
  console.log('Testing against running server connected to MongoDB Atlas');
  console.log('====================================================\n');

  const testEmail = `recovery.tester.${Date.now()}@autocare360.com`;
  const initialPassword = 'OriginalPass123!';
  const updatedPassword = 'BrandNewPass2026!';

  let testPassedCount = 0;
  const testTotalCount = 12;

  try {
    // 0. Setup: Register fresh user in Atlas
    console.log(`[Setup] Registering user in Atlas: ${testEmail}`);
    const regRes = await requestJson(`${API_BASE}/register`, {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Recovery Tester',
        email: testEmail,
        phone: '0771234567',
        password: initialPassword,
        role: 'owner'
      })
    });
    console.log('[Setup] Register response:', regRes.status, regRes.data?.message);
    if (regRes.status !== 201) {
      throw new Error(`Failed to create test user: ${JSON.stringify(regRes.data)}`);
    }

    // ----------------------------------------------------
    // TEST 1: Forgot password request for valid user
    // ----------------------------------------------------
    console.log('\n--- TEST 1: Forgot password request for valid user ---');
    const fpValidRes = await requestJson(`${API_BASE}/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email: testEmail })
    });
    console.log('Response Status:', fpValidRes.status);
    console.log('Response Message:', fpValidRes.data?.message);
    console.log('DevCode received:', fpValidRes.data?.devCode);
    const validDevCode = fpValidRes.data?.devCode;
    if (fpValidRes.status === 200 && validDevCode && validDevCode.length === 6) {
      console.log('✓ TEST 1 PASSED: Code generated for valid user.');
      testPassedCount++;
    } else {
      console.error('✗ TEST 1 FAILED');
    }

    // ----------------------------------------------------
    // TEST 2: Forgot password for unknown email without unsafe account enumeration
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Anti-Account Enumeration for unknown email ---');
    const ghostEmail = `nonexistent.${Date.now()}@autocare360.com`;
    const fpUnknownRes = await requestJson(`${API_BASE}/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email: ghostEmail })
    });
    console.log('Unknown email response status:', fpUnknownRes.status);
    console.log('Unknown email response message:', fpUnknownRes.data?.message);
    console.log('Unknown email devCode (must be undefined):', fpUnknownRes.data?.devCode);
    if (
      fpUnknownRes.status === 200 &&
      fpUnknownRes.data?.message === fpValidRes.data?.message &&
      !fpUnknownRes.data?.devCode
    ) {
      console.log('✓ TEST 2 PASSED: Uniform message returned with zero account enumeration.');
      testPassedCount++;
    } else {
      console.error('✗ TEST 2 FAILED');
    }

    // ----------------------------------------------------
    // TEST 3: Verification code format & security
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Verification code format (6-digit numeric) ---');
    const isSixDigitNumeric = /^\d{6}$/.test(validDevCode);
    console.log('Is 6-digit numeric string:', isSixDigitNumeric);
    if (isSixDigitNumeric) {
      console.log('✓ TEST 3 PASSED: Code conforms to 6-digit numeric specification.');
      testPassedCount++;
    } else {
      console.error('✗ TEST 3 FAILED');
    }

    // ----------------------------------------------------
    // TEST 4: Invalid code rejected (400 Bad Request)
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Invalid code rejected ---');
    const badCodeRes = await requestJson(`${API_BASE}/verify-code`, {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        code: '000000'
      })
    });
    console.log('Status code for wrong code:', badCodeRes.status, badCodeRes.data?.message);
    if (badCodeRes.status === 400 && badCodeRes.data?.message?.includes('Invalid')) {
      console.log('✓ TEST 4 PASSED: Invalid code rejected with 400.');
      testPassedCount++;
    } else {
      console.error('✗ TEST 4 FAILED');
    }

    // ----------------------------------------------------
    // TEST 5: Resend code works
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Resend code generates fresh code ---');
    const resendRes = await requestJson(`${API_BASE}/resend-code`, {
      method: 'POST',
      body: JSON.stringify({ email: testEmail })
    });
    console.log('Resend status:', resendRes.status);
    console.log('Resend devCode:', resendRes.data?.devCode);
    const newDevCode = resendRes.data?.devCode;
    if (resendRes.status === 200 && newDevCode && newDevCode.length === 6 && newDevCode !== validDevCode) {
      console.log('✓ TEST 5 PASSED: Resend issued fresh code distinct from previous code.');
      testPassedCount++;
    } else {
      console.error('✗ TEST 5 FAILED');
    }

    // ----------------------------------------------------
    // TEST 6: Old code invalid after resend
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Old code invalid after resend ---');
    const oldCodeRes = await requestJson(`${API_BASE}/verify-code`, {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        code: validDevCode // Previous code
      })
    });
    console.log('Status for previous code after resend:', oldCodeRes.status, oldCodeRes.data?.message);
    if (oldCodeRes.status === 400) {
      console.log('✓ TEST 6 PASSED: Previous code invalidated upon resend.');
      testPassedCount++;
    } else {
      console.error('✗ TEST 6 FAILED');
    }

    // ----------------------------------------------------
    // TEST 7: Valid code accepted & resetToken issued
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Valid code accepted ---');
    const verifyRes = await requestJson(`${API_BASE}/verify-code`, {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        code: newDevCode
      })
    });
    console.log('Verify status:', verifyRes.status);
    console.log('Reset token received:', !!verifyRes.data?.data?.resetToken);
    const resetToken = verifyRes.data?.data?.resetToken;
    if (verifyRes.status === 200 && resetToken && resetToken.length === 64) {
      console.log('✓ TEST 7 PASSED: Valid code accepted and 64-char hex reset token issued.');
      testPassedCount++;
    } else {
      console.error('✗ TEST 7 FAILED');
    }

    // ----------------------------------------------------
    // TEST 8: Set new password
    // ----------------------------------------------------
    console.log('\n--- TEST 8: Set new password ---');
    const resetPassRes = await requestJson(`${API_BASE}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        resetToken: resetToken,
        newPassword: updatedPassword
      })
    });
    console.log('Reset password status:', resetPassRes.status);
    console.log('Reset password response:', resetPassRes.data?.message);
    if (resetPassRes.status === 200 && resetPassRes.data?.success === true) {
      console.log('✓ TEST 8 PASSED: Password reset endpoint accepted update.');
      testPassedCount++;
    } else {
      console.error('✗ TEST 8 FAILED');
    }

    // ----------------------------------------------------
    // TEST 9: Old password login rejected
    // ----------------------------------------------------
    console.log('\n--- TEST 9: Old password login rejected ---');
    const oldLoginRes = await requestJson(`${API_BASE}/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: initialPassword,
        selectedRole: 'owner'
      })
    });
    console.log('Old password login status:', oldLoginRes.status, oldLoginRes.data?.message);
    if (oldLoginRes.status === 401) {
      console.log('✓ TEST 9 PASSED: Old password rejected with 401 Unauthorized.');
      testPassedCount++;
    } else {
      console.error('✗ TEST 9 FAILED');
    }

    // ----------------------------------------------------
    // TEST 10: New password login succeeds with JWT
    // ----------------------------------------------------
    console.log('\n--- TEST 10: New password login succeeds ---');
    const newLoginRes = await requestJson(`${API_BASE}/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: updatedPassword,
        selectedRole: 'owner'
      })
    });
    console.log('New password login status:', newLoginRes.status);
    console.log('JWT Token received:', !!newLoginRes.data?.data?.token);
    console.log('User Role returned:', newLoginRes.data?.data?.user?.role);
    if (newLoginRes.status === 200 && newLoginRes.data?.data?.token && newLoginRes.data?.data?.user?.email === testEmail) {
      console.log('✓ TEST 10 PASSED: New password successfully authenticated in MongoDB Atlas.');
      testPassedCount++;
    } else {
      console.error('✗ TEST 10 FAILED');
    }

    // ----------------------------------------------------
    // TEST 11: Used reset token cannot be reused
    // ----------------------------------------------------
    console.log('\n--- TEST 11: Used reset token cannot be reused ---');
    const reusedRes = await requestJson(`${API_BASE}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        resetToken: resetToken,
        newPassword: 'AnotherPassword999!'
      })
    });
    console.log('Status on reused token attempt:', reusedRes.status, reusedRes.data?.message);
    if (reusedRes.status === 400) {
      console.log('✓ TEST 11 PASSED: Token reuse blocked; recovery record purged upon completion.');
      testPassedCount++;
    } else {
      console.error('✗ TEST 11 FAILED');
    }

    // ----------------------------------------------------
    // TEST 12: GET /api/auth/me verifies authenticated state
    // ----------------------------------------------------
    console.log('\n--- TEST 12: Authenticated session verification via /api/auth/me ---');
    const meRes = await requestJson(`${API_BASE}/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${newLoginRes.data?.data?.token}`
      }
    });
    console.log('Me status:', meRes.status);
    console.log('Authenticated user in Atlas:', meRes.data?.data?.user?.email);
    if (meRes.status === 200 && meRes.data?.data?.user?.email === testEmail) {
      console.log('✓ TEST 12 PASSED: Protected endpoint /me successfully verifies new session.');
      testPassedCount++;
    } else {
      console.error('✗ TEST 12 FAILED');
    }

  } catch (err) {
    console.error('Test execution error:', err);
  }

  console.log('\n====================================================');
  console.log(`FINAL RESULT: ${testPassedCount} / ${testTotalCount} TESTS PASSED`);
  console.log('====================================================');

  if (testPassedCount === testTotalCount) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runRecoveryE2ETests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
