
/**
 * Network Event Log Analyzer - Backend Server
 * Express.js + MongoDB + Authentication + FSM
 * Academic Project
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const logRoutes = require('./routes/logRoutes');
const alertRoutes = require('./routes/alertRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/network_log_analyzer';

// --------------------
// Middleware
// --------------------

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// --------------------
// MongoDB Connection
// --------------------

let dbStatusInfo = {
  connected: false,
  error: null
};

async function connectDatabase() {
  try {
    const safeURI = MONGODB_URI.replace(
      /:([^:@]{3,})@/,
      ':****@'
    );

    console.log(`Connecting to MongoDB at: ${safeURI}`);

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 4000
    });

    dbStatusInfo.connected = true;
    dbStatusInfo.error = null;

    console.log('✓ Successfully connected to MongoDB.');

  } catch (err) {
    dbStatusInfo.connected = false;
    dbStatusInfo.error = err.message;

    console.error('MongoDB Connection Error:', err.message);
  }
}

mongoose.connection.on('connected', () => {
  dbStatusInfo.connected = true;
  dbStatusInfo.error = null;
  console.log('[MongoDB Event] Connected');
});

mongoose.connection.on('disconnected', () => {
  dbStatusInfo.connected = false;
  console.warn('[MongoDB Event] Disconnected');
});

mongoose.connection.on('error', (err) => {
  dbStatusInfo.connected = false;
  dbStatusInfo.error = err.message;
  console.error('[MongoDB Event Error]', err.message);
});

// --------------------
// API Routes
// --------------------

// Existing Routes
app.use('/api/logs', logRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Login and Register Routes
app.use('/api/auth', authRoutes);

// --------------------
// Health Check
// --------------------

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    appName: 'Network Event Log Analyzer API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),

    database: {
      connected: mongoose.connection.readyState === 1,
      readyState: mongoose.connection.readyState,
      uri: MONGODB_URI.replace(
        /:([^:@]{3,})@/,
        ':****@'
      ),
      error: dbStatusInfo.error,
      guide: mongoose.connection.readyState === 1
        ? 'MongoDB is connected and persisting logs.'
        : 'MongoDB is disconnected.'
    }
  });
});

// --------------------
// Root Welcome Route
// --------------------

app.get('/', (req, res) => {
  res.json({
    message: 'Network Event Log Analyzer Backend API is running.',

    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      analyze: 'POST /api/logs/analyze',
      logs: 'GET /api/logs',
      logById: 'GET /api/logs/:id',
      alerts: 'GET /api/alerts',
      dashboardStats: 'GET /api/dashboard/stats',
      sampleScenarios: 'GET /api/logs/samples',
      clearLogs: 'DELETE /api/logs',
      health: 'GET /api/health'
    }
  });
});

// --------------------
// Central Error Handler
// --------------------

app.use(errorHandler);

// --------------------
// Start Server
// --------------------

connectDatabase().finally(() => {
  app.listen(PORT, () => {
    console.log('====================================================');
    console.log('Network Event Log Analyzer Backend Server');
    console.log(`Port: http://localhost:${PORT}`);
    console.log(`Health Check: http://localhost:${PORT}/api/health`);
    console.log('Authentication: /api/auth');
    console.log('====================================================');
  });
});

module.exports = app;
