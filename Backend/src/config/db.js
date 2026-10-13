const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/autocare360';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB Connected]: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    throw error;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB Event]: Database connection disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB Event]: Database connection reconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB Event Error]:', err.message);
});

module.exports = connectDB;

