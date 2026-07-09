const validateEnv = require('./utils/validateEnv');
validateEnv(); // Fail fast if any required env var is missing

const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const JWT_SECRET = process.env.JWT_SECRET; // Already validated by validateEnv()

global.wsClients = new Map(); // Global WebSocket client registry

const app = express();

// Start background workers
require('./queues/aiQueue');

const Sentry = require('@sentry/node');
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2,
});

// Configure trust proxy for Cloudflare
app.set('trust proxy', [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
]);

// Capture real IP from Cloudflare header
const realIP = (req, res, next) => {
  req.realIP = req.headers['cf-connecting-ip'] || req.ip;
  next();
};
app.use(realIP);

// Security Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(xss());
app.use(mongoSanitize());
app.use(hpp());

// Middleware Setup
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : [];

app.use(cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false, // Block CORS if not explicitly configured
    credentials: true
}));

app.use(cookieParser());
// Request body size limit (skip for webhook so express.raw works)
app.use((req, res, next) => {
  if (req.originalUrl.includes('/webhook')) {
    return next();
  }
  express.json({ limit: '1mb' })(req, res, next);
});

const prerender = require('prerender-node');
app.use(prerender.set('prerenderToken', process.env.PRERENDER_TOKEN));

// =========================================================================
// 🛣️  ROUTE MOUNTING
// All domain routers are required and mounted here in dependency order.
// =========================================================================
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const collegeRoutes = require('./routes/collegeRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const profileRoutes = require('./routes/profileRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const fileRoutes = require('./routes/fileRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/college', collegeRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/files', fileRoutes);

Sentry.setupExpressErrorHandler(app);
const errorHandler = require('./middleware/errorHandler');
// Global error handler must be last
app.use(errorHandler);



const PORT = process.env.PORT || 5000;



// Database Connection
const seedAdmin = require('./utils/seedAdmin');
const dbURI = process.env.MONGO_URI;

if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(dbURI)
    .then(() => {
      console.log('🔌 Connected to MongoDB Successfully!');
      seedAdmin();
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err.message);
      process.exit(1); // Fail fast — DB is required for the app to function
    });
}


// =========================================================================
// 📝 NOTE: All inline route handlers have been migrated to their
//          respective controller + router files (Phase 1 refactor).
// =========================================================================

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
  });
}

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
      console.log(`🚀 Server running smoothly on http://localhost:${PORT}`);
  });

  // =========================================================================
  // 💬 WEBSOCKET CHAT ENGINE (Real-time Messaging Gateway)
  // =========================================================================
  const initWebSocketServer = require('./services/websocketService');
  initWebSocketServer(server, JWT_SECRET);
}

module.exports = app;