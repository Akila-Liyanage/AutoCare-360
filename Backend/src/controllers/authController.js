const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

module.exports = {
  register,
  login,
  getMe,
};
