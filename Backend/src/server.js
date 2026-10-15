require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');

const app = express();

// Safe CORS using FRONTEND_URL
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
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

// Mount Vehicle Digital Passport Routes
app.use('/api/vehicles', vehicleRoutes);

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
