require('dotenv').config();
const dns = require('dns');

// Reliable DNS resolution fallback for Windows/hotspot environments
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const originalLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  originalLookup(hostname, options, (err, address, family) => {
    if (err && (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN')) {
      dns.resolve4(hostname, (resErr, addresses) => {
        if (!resErr && addresses && addresses.length > 0) {
          if (options && options.all) {
            return callback(null, addresses.map((a) => ({ address: a, family: 4 })));
          }
          return callback(null, addresses[0], 4);
        }
        return callback(err, address, family);
      });
    } else {
      return callback(err, address, family);
    }
  });
};

const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const documentRoutes = require('./routes/documentRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const transferRoutes = require('./routes/transferRoutes');
const shareLinkRoutes = require('./routes/shareLinkRoutes');
const garageRoutes = require('./routes/garageRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Safe CORS using FRONTEND_URL
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error('CORS blocked: Origin not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Health Check Route
app.get('/', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'ok',
    service: 'AutoCare 360 Backend API',
    database: isConnected ? 'connected' : 'disconnected',
    readyState: mongoose.connection.readyState,
    host: isConnected ? mongoose.connection.host : null,
    name: isConnected ? mongoose.connection.name : null,
  });
});

// Fail-fast guard for database-dependent API routes
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database service is temporarily unavailable. Please try again.',
    });
  }
  next();
});

// Mount Authentication Routes
app.use('/api/auth', authRoutes);

// Mount Service & Maintenance Records Routes
app.use('/api/services', serviceRoutes);
app.use('/api/vehicles/:vehicleId/services', serviceRoutes);

// Mount Vehicle Documents Routes
app.use('/api/documents', documentRoutes);
app.use('/api/vehicles/:vehicleId/documents', documentRoutes);

// Static serving for uploaded files (vehicles, documents, and uploads root)
app.use('/uploads/vehicles', express.static(path.join(__dirname, '../uploads/vehicles')));
app.use('/uploads/documents', express.static(path.join(__dirname, '../uploads/documents')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount Vehicle Expense Tracking Routes
app.use('/api/expenses', expenseRoutes);
app.use('/api/vehicles/:vehicleId/expenses', expenseRoutes);

// Mount Notifications Routes
app.use('/api/notifications', notificationRoutes);

// Mount Vehicle Ownership Transfer Routes
app.use('/api/transfers', transferRoutes);

// Mount Secure Vehicle Link Sharing Routes
app.use('/api/share-links', shareLinkRoutes);

// Mount Vehicle Digital Passport Routes
app.use('/api/vehicles', vehicleRoutes);

// Mount Verified Garage Operations & Dashboard Routes (BR-03)
app.use('/api/garage', garageRoutes);

// Mount System Administrator & Audit Trail Routes (FR-05, BR-08)
app.use('/api/admin', adminRoutes);

// 404 JSON Handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err.message);

  // Fail-safe protection against Mongoose buffering timeout leaks
  if (err.name === 'MongooseError' && err.message.includes('buffering timed out')) {
    return res.status(503).json({
      success: false,
      message: 'Database service is temporarily unavailable. Please try again.',
    });
  }

  // Graceful handling of oversized payloads (413 Payload Too Large)
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      success: false,
      message: 'The submitted request payload is too large. Please reduce the size or choose another file.',
    });
  }

  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Startup handling with awaited database connection
const startServer = async () => {
  const PORT = process.env.PORT || 5000;

  try {
    console.log('[AutoCare 360]: Awaiting MongoDB database connection...');
    const conn = await connectDB();
    app.locals.dbConnected = true;
    console.log(`[AutoCare 360]: MongoDB ready on ${conn.connection.host}`);
  } catch (error) {
    app.locals.dbConnected = false;
    console.error(`[AutoCare 360 Startup Notice]: Database connection failed: ${error.message}`);
    if (
      error.message.includes('whitelist') ||
      error.message.includes('Could not connect') ||
      error.message.includes('ETIMEOUT')
    ) {
      console.error(
        '[AutoCare 360 Blocker]: MongoDB Atlas rejected connection. Ensure current machine IP is whitelisted in MongoDB Atlas Network Access.'
      );
    }
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[AutoCare 360 Fatal]: Port ${PORT} is already in use by another process.`);
    } else {
      console.error(`[AutoCare 360 Server Error]:`, err.message);
    }
  });
};

startServer();

module.exports = app;
