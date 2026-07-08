const validateEnv = require('./utils/validateEnv');
validateEnv(); // Fail fast if any required env var is missing

const express = require('express');
const ws = require('ws');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const jwt = require('jsonwebtoken');
const swot = require('swot-node');
const cookieParser = require('cookie-parser');

const JWT_SECRET = process.env.JWT_SECRET; // Already validated by validateEnv()

global.wsClients = new Map(); // Global WebSocket client registry

const app = express();


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
// Request body size limit
app.use(express.json({ limit: '1mb' }));

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

const errorHandler = require('./middleware/errorHandler');
// Global error handler must be last
app.use(errorHandler);



const PORT = process.env.PORT || 5000;



// Database Connection
const seedAdmin = require('./utils/seedAdmin');
const dbURI = process.env.MONGO_URI;

mongoose.connect(dbURI)
  .then(() => {
    console.log('🔌 Connected to MongoDB Successfully!');
    seedAdmin();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Fail fast — DB is required for the app to function
  });



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


const server = app.listen(PORT, () => {
    console.log(`🚀 Server running smoothly on http://localhost:${PORT}`);
});

// =========================================================================
// 💬 WEBSOCKET CHAT ENGINE (Real-time Messaging Gateway)
// =========================================================================
const wss = new ws.Server({ server });



wss.on("connection", (socket, req) => {
  socket.req = req;
  let userEmail = null;

  socket.on("message", async (messageStr) => {
    try {
      const data = JSON.parse(messageStr);

      if (data.type === "auth") {
        let token = data.token;
        const cookieString = socket.req.headers.cookie;
        if (!token && cookieString) {
          const match = cookieString.match(/token=([^;]+)/);
          if (match) token = match[1];
        }

        if (!token) {
          socket.send(JSON.stringify({ type: "error", message: "JWT token is required for chat authentication." }));
          socket.close();
          return;
        }

        jwt.verify(token, JWT_SECRET, (err, decoded) => {
          if (err) {
            socket.send(JSON.stringify({ type: "error", message: "Invalid JWT token." }));
            socket.close();
            return;
          }

          userEmail = decoded.email;
          global.wsClients.set(userEmail, socket);
          console.log(`💬 WebSocket connection authenticated for: ${userEmail}`);
          socket.send(JSON.stringify({ type: "status", status: "connected" }));
        });
        return;
      }

      if (data.type === "chat") {
        const { sender, receiver, text } = data;
        if (!sender || !receiver || !text) return;

        // Verify sender email matches current socket user identity
        if (sender !== userEmail) {
          socket.send(JSON.stringify({ type: "error", message: "Unauthorized sender context." }));
          return;
        }

        // Save message to MongoDB
        const Message = require("./models/Message");
        const newMessage = new Message({ sender, receiver, text });
        await newMessage.save();

        const payload = {
          type: "message",
          _id: newMessage._id,
          sender,
          receiver,
          text,
          timestamp: newMessage.timestamp
        };

        // Send to receiver if online
        const receiverSocket = global.wsClients.get(receiver);
        if (receiverSocket && receiverSocket.readyState === ws.OPEN) {
          receiverSocket.send(JSON.stringify(payload));
        }

        // Echo back to sender
        socket.send(JSON.stringify(payload));
      }

      if (data.type === "typing") {
        const { sender, receiver, isTyping } = data;
        if (!sender || !receiver) return;
        if (sender !== userEmail) return;

        const receiverSocket = global.wsClients.get(receiver);
        if (receiverSocket && receiverSocket.readyState === ws.OPEN) {
          receiverSocket.send(
            JSON.stringify({
              type: "typing",
              sender,
              isTyping
            })
          );
        }
      }
    } catch (err) {
      console.error("❌ WebSocket message error:", err.message);
    }
  });

  socket.on("close", () => {
    if (userEmail) {
      global.wsClients.delete(userEmail);
      console.log(`🔌 WebSocket connection closed for: ${userEmail}`);
    }
  });
});