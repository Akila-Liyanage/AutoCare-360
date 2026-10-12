const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { sendResetCodeEmail } = require('../services/emailService');

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'autocare360_super_secret_jwt_key_2026_change_in_production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, role } = req.body;

    // Reject public registration of admin accounts
    if (role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot be created through public registration.',
      });
    }

    // Required fields check
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, phone number, and password are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    const assignedRole = role === 'garage' ? 'garage' : 'owner';
    const emailNormalized = email.toLowerCase().trim();

    // Check for existing user
    const existingUser = await User.findOne({ email: emailNormalized });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Owner accounts start active; Garage accounts start pending verification per BRD
    const status = assignedRole === 'garage' ? 'pending' : 'active';

    const user = await User.create({
      fullName: fullName.trim(),
      email: emailNormalized,
      phone: phone.trim(),
      password,
      role: assignedRole,
      status,
    });

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message:
        assignedRole === 'garage'
          ? 'Garage partner account created and pending verification.'
          : 'Vehicle owner account registered successfully.',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & return token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password, role, selectedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const emailNormalized = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailNormalized });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No account found with this email.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    // Role validation if client specified a role
    const requestedRole = role || selectedRole;
    if (requestedRole && user.role !== requestedRole) {
      return res.status(403).json({
        success: false,
        message: `Role mismatch. Your account is registered as '${user.role}', but you attempted to sign in as '${requestedRole}'.`,
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private (Bearer JWT)
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

// @desc    Request password recovery code
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your account email address.',
      });
    }

    const emailNormalized = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailNormalized });

    // Anti-enumeration protection: return uniform success response
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a 6-digit verification code has been sent.',
      });
    }

    // Invalidate existing recovery requests for this email
    await PasswordReset.deleteMany({ email: emailNormalized });

    // Generate secure 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await PasswordReset.create({
      email: emailNormalized,
      codeHash,
      expiresAt,
    });

    await sendResetCodeEmail(emailNormalized, code);

    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a 6-digit verification code has been sent.',
      ...(process.env.NODE_ENV === 'development' && { devCode: code }),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify 6-digit recovery code & issue one-time reset token
// @route   POST /api/auth/verify-code
// @access  Public
const verifyCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email address and 6-digit verification code are required.',
      });
    }

    const emailNormalized = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    const resetRecord = await PasswordReset.findOne({ email: emailNormalized }).sort({ createdAt: -1 });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'No active password recovery request found for this email. Please request a new code.',
      });
    }

    if (new Date() > resetRecord.expiresAt) {
      await PasswordReset.deleteMany({ email: emailNormalized });
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.',
      });
    }

    const candidateHash = crypto.createHash('sha256').update(cleanCode).digest('hex');
    if (candidateHash !== resetRecord.codeHash) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check and try again.',
      });
    }

    // Code matches: generate one-time cryptographically secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    resetRecord.resetToken = resetToken;
    resetRecord.isVerified = true;
    await resetRecord.save();

    return res.status(200).json({
      success: true,
      message: 'Verification code confirmed. You may now create a new password.',
      data: {
        resetToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend a new verification code
// @route   POST /api/auth/resend-code
// @access  Public
const resendCode = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your account email address.',
      });
    }

    const emailNormalized = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailNormalized });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a new verification code has been sent.',
      });
    }

    // Invalidate previous code
    await PasswordReset.deleteMany({ email: emailNormalized });

    // Generate fresh code
    const code = crypto.randomInt(100000, 999999).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await PasswordReset.create({
      email: emailNormalized,
      codeHash,
      expiresAt,
    });

    await sendResetCodeEmail(emailNormalized, code);

    return res.status(200).json({
      success: true,
      message: 'A new 6-digit verification code has been dispatched.',
      ...(process.env.NODE_ENV === 'development' && { devCode: code }),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set new password using verified reset token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset authorization token, and new password are required.',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.',
      });
    }

    const emailNormalized = email.toLowerCase().trim();

    const resetRecord = await PasswordReset.findOne({
      email: emailNormalized,
      resetToken,
      isVerified: true,
    });

    if (!resetRecord || new Date() > resetRecord.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset session. Please restart recovery.',
      });
    }

    const user = await User.findOne({ email: emailNormalized });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    // Set new password (pre-save hook hashes with bcryptjs automatically)
    user.password = newPassword;
    await user.save();

    // Invalidate reset tokens permanently to prevent reuse
    await PasswordReset.deleteMany({ email: emailNormalized });

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  verifyCode,
  resendCode,
  resetPassword,
};
