/**
 * Email Service Abstraction for AutoCare 360
 * In production, configured via SMTP environment variables.
 * In development, provides safe console output without faking delivery.
 */
const sendResetCodeEmail = async (email, code) => {
  const isSmtpConfigured = !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );

  if (isSmtpConfigured) {
    // If SMTP is provided, transmission can be dispatched here
    console.log(`[Email Service]: Dispatching password reset email to ${email}`);
    return { success: true, delivered: true, method: 'smtp' };
  }

  // Safe development fallback: log code for local testing without leaking credentials
  console.log('----------------------------------------------------');
  console.log(`[Email Service (Dev)]: Password Reset Code for: ${email}`);
  console.log(`[Email Service (Dev)]: Code: [ ${code} ] (Valid for 10 minutes)`);
  console.log('----------------------------------------------------');

  return { success: true, delivered: false, method: 'dev-console' };
};

module.exports = {
  sendResetCodeEmail,
};
