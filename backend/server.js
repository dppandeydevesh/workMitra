const express = require('express');
const ws = require('ws');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const swot = require('swot-node');
const cookieParser = require('cookie-parser');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("🚨 FATAL ERROR: JWT_SECRET environment variable is missing. Server cannot start securely.");
  process.exit(1);
}

global.wsClients = new Map(); // Global registry for WebSocket client sockets

// Models Loading
const User = require('./models/User');
const Project = require('./models/Project');
const Application = require('./models/Application');
const CompanyProfile = require('./models/CompanyProfile');
const PendingUser = require('./models/PendingUser'); // 🔑 न्यू इम्पोर्ट: पेंडिंग यूजर मॉडल
const multer = require('multer');
const pdfParse = require('pdf-parse');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(mongoSanitize());

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);
const collegeRoutes = require('./routes/collegeRoutes');
app.use('/api/college', collegeRoutes);
const applicationRoutes = require('./routes/applicationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const profileRoutes = require('./routes/profileRoutes');
app.use('/api/applications', applicationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
const authenticateToken = require('./middleware/authMiddleware');

app.use('/api/auth', authRoutes);

// =========================================================================
// 💡 ROUTE: Get AI Top Picks for a student
// =========================================================================
app.get("/api/projects/recommendations/:email", authenticateToken, async (req, res) => {
  try {
    const { email } = req.params;
    if (req.user.email !== email) {
      return res.status(403).json({ error: "Unauthorized access." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const userSkills = user.targetSkills || "";
    
    // Fetch all Published projects
    const projects = await Project.find({ status: "Published" });
    if (!projects || projects.length === 0) {
      return res.status(200).json([]);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key is missing." });
    }

    const projectsList = projects.map(p => ({
      id: p._id.toString(),
      title: p.title,
      description: p.description,
      skills: p.requiredSkills?.join(", ") || ""
    }));

    const prompt = `You are an AI recommendations engine. 
Here is the user's skill profile:
Skills/Interests: ${userSkills}
Resume Summary: ${user.resumeText ? user.resumeText.substring(0, 500) : "N/A"}

Here is a list of active projects available:
${JSON.stringify(projectsList)}

Select the top 3 project IDs that best match the user's profile.
Return ONLY a valid JSON array of strings (the 3 project IDs). No markdown, no explanation. Example: ["id1", "id2", "id3"]`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      throw new Error("Failed to fetch from Gemini");
    }
    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    let recommendedIds = [];
    if (aiText) {
      try {
        recommendedIds = JSON.parse(aiText.trim());
      } catch (e) {
        console.error("Failed to parse Gemini response:", aiText);
      }
    }

    if (!Array.isArray(recommendedIds)) {
      recommendedIds = [];
    }
    recommendedIds = recommendedIds.slice(0, 3);

    const recommendedProjects = await Project.find({ _id: { $in: recommendedIds } });
    const orderedProjects = recommendedIds.map(id => recommendedProjects.find(p => p._id.toString() === id)).filter(Boolean);

    res.status(200).json(orderedProjects);
  } catch (err) {
    console.error("AI Recommendations error:", err.message);
    res.status(500).json({ error: "Failed to fetch AI recommendations." });
  }
});

// =========================================================================
// 🤖 ROUTE: AI Assistant Chat
// =========================================================================
app.post("/api/ai/chat", authenticateToken, async (req, res) => {
  try {
    const { message, history, context } = req.body;
    
    const name = context?.name || "User";
    const role = req.user.userRole || "user";
    const path = context?.path || "unknown";

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key is missing." });
    }

    const systemPrompt = `You are Mitra AI, a helpful, enthusiastic, and highly knowledgeable assistant for the workMitra platform. The user's name is ${name}. They are a ${role}. They are currently on the page: ${path}. Use this context to answer their query...`;

    // Construct history for Gemini API
    const contents = [];
    if (history && Array.isArray(history)) {
      history.forEach(msg => {
        const msgRole = msg.role === 'ai' || msg.role === 'model' ? 'model' : 'user';
        const msgText = msg.text || msg.message || "";
        if (msgText) {
          contents.push({ role: msgRole, parts: [{ text: msgText }] });
        }
      });
    }

    if (message) {
      contents.push({ role: "user", parts: [{ text: message }] });
    }

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.7
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errData = await response.text();
      console.error("Gemini API error:", errData);
      throw new Error("Failed to fetch from Gemini");
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

    res.status(200).json({ text: responseText });
  } catch (err) {
    console.error("AI Chat error:", err.message);
    res.status(500).json({ error: "Failed to process AI chat request." });
  }
});

app.use('/api/projects', projectRoutes);

const PORT = process.env.PORT || 5000;



// Auth Token Verification Middleware
// Seed default admin account
const seedAdmin = async () => {
  try {
    const User = require("./models/User");
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      console.error("🚨 FATAL ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.");
      process.exit(1);
    }
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      // Generate a random 10-digit mobile number to avoid unique index collisions with older mock admins
      const randomMobile = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      const newAdmin = new User({
        fullName: "Super Admin",
        email: adminEmail,
        password: adminPassword,
        userRole: "admin",
        mobile: randomMobile,
        hasCompletedProfile: true,
        isVerified: true
      });
      await newAdmin.save();
      console.log("👑 Seeded administrator account successfully.");
    }
  } catch (err) {
    console.error("Failed to seed admin:", err.message);
  }
};

// Database Connection
const dbURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/workmitra";
mongoose.connect(dbURI)
    .then(() => {
        console.log("🔌 Connected to MongoDB Successfully!");
        seedAdmin();
    })
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
        if (dbURI !== "mongodb://127.0.0.1:27017/workmitra") {
            console.log("🔄 Falling back to local MongoDB at mongodb://127.0.0.1:27017/workmitra...");
            mongoose.disconnect()
                .catch(() => {})
                .finally(() => {
                    mongoose.connect("mongodb://127.0.0.1:27017/workmitra")
                        .then(() => console.log("🔌 Connected to fallback local MongoDB Successfully!"))
                        .catch((localErr) => console.error("❌ Fallback local MongoDB connection also failed:", localErr));
                });
        }
    });

// smtpLogs proxy to avoid ReferenceErrors during mail sending and prevent memory leaks (capped at 50 logs)
// =========================================================================
// 🏢 Route: Save Company Requirements Profile Form Data
// =========================================================================
// =========================================================================
// 🏢 Route: Save Company Requirements Profile Form Data
// =========================================================================


// =========================================================================
// 🏢 Route: Get Company Profile for authenticated user
// =========================================================================


// =========================================================================
// 🚀 UPDATED GLOBAL ROUTE: Fetch Deployed Company Projects for Marketplace
// =========================================================================
// 🔒 Route: Lock Onboarding Flag (Form won't reappear)
// =========================================================================
app.post("/api/auth/complete-profile", authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "User email parameter is required." });
    }
    if (req.user.email !== email) {
      return res.status(403).json({ error: "Unauthorized profile update request." });
    }
    
    await User.findOneAndUpdate({ email }, { hasCompletedProfile: true });
    res.status(200).json({ message: "Profile onboarding flag locked successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to lock profile onboarding state." });
  }
});

// =========================================================================
// 📥 ROUTE: Submit a new Project Application
// =========================================================================
// =========================================================================
// 👑 ADMIN ROUTES: Control Panel Management endpoints
// =========================================================================


const fsSync = require('fs');

// Configure multer storage on disk to prevent RAM exhaustion
const uploadDir = path.join(__dirname, 'uploads');
if (!fsSync.existsSync(uploadDir)) {
  fsSync.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + '.pdf');
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// 🏢 ROUTE: Upload CV PDF, parse text and save to user profile


// =========================================================================
// 🧠 ROUTE: Review CV text using Google Gemini 1.5 Flash
// =========================================================================
app.post("/api/ai/review-cv", authenticateToken, async (req, res) => {
  try {
    const { email, resumeText } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
    if (req.user.email !== email) {
      return res.status(403).json({ error: "Unauthorized CV review request." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const textToAnalyze = resumeText || user.resumeText;
    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
      return res.status(400).json({ error: "No CV text available for analysis. Please paste your CV details first." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key is not configured in the server. Please add GEMINI_API_KEY to your .env file." });
    }

    const prompt = `You are an expert recruiter and CV critique specialist.
Review the following CV text carefully. Assess its layout, impact, clarity, skills showcase, and actionable achievements.
Provide your response strictly in the following JSON format without any surrounding markdown formatting, code blocks, or extra text.

JSON Structure:
{
  "score": 85, // Integer from 0 to 100 representing the quality of the CV
  "strengths": [
    "Clear structure and formatting",
    "Quantified accomplishments in previous projects",
    "Strong technical skills section"
  ],
  "improvements": [
    "Add more action-oriented verbs",
    "Include links to live projects or code repositories",
    "Expand details on university level contributions"
  ],
  "recommendations": "Overall, your CV is in good shape. To stand out to companies on workMitra, we recommend emphasizing specific engineering metrics and ensuring your Git links are visible."
}

CV Text to analyze:
${textToAnalyze}`;

    // Send API key inside a custom headers configuration instead of URL query parameter
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0 // Set temperature to 0 for deterministic, consistent evaluation scores
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || "Failed to communicate with Gemini API." });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) {
      return res.status(500).json({ error: "Empty response from AI engine." });
    }

    let reviewReport;
    try {
      reviewReport = JSON.parse(aiText.trim());
    } catch (parseErr) {
      reviewReport = {
        score: 70,
        strengths: ["Raw CV text submitted successfully"],
        improvements: ["Could not parse structured AI review output"],
        recommendations: "Please try reviewing again with a more standard CV layout. Raw output: " + aiText.slice(0, 200)
      };
    }

    user.resumeText = textToAnalyze;
    user.cvReviewReport = reviewReport;
    await user.save();

    res.status(200).json({
      message: "CV reviewed successfully by workMitra AI!",
      report: reviewReport
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to execute AI resume scan." });
  }
});

app.get("/api/auth/user/:email", authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }, "-password");
    if (!user) {
      return res.status(404).json({ error: "Student profile not found." });
    }

    // Only restrict if it's private, NOT the owner, and NOT a company/admin recruiter
    if (user.isProfilePrivate && req.user.email !== req.params.email && req.user.userRole !== "company" && req.user.userRole !== "admin") {
      return res.status(403).json({ error: "This profile has been marked private by the student." });
    }

    const userObj = user.toObject();
    let isEndorsed = false;
    if (user.collegeName) {
      const collegeAdmin = await User.findOne({ userRole: "college", collegeName: user.collegeName });
      if (collegeAdmin && collegeAdmin.collegeEndorsedStudents) {
        isEndorsed = collegeAdmin.collegeEndorsedStudents.includes(user.email);
      }
    }
    userObj.isEndorsed = isEndorsed;

    res.status(200).json(userObj);
  } catch (err) {
    res.status(500).json({ error: "Failed to read profile details." });
  }
});

app.get("/api/auth/student/vanity/:username", authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ vanityUsername: req.params.username }, "-password");
    if (!user) {
      return res.status(404).json({ error: "Student profile username not found." });
    }
    if (user.isProfilePrivate && req.user.email !== user.email && req.user.userRole !== "company" && req.user.userRole !== "admin") {
      return res.status(403).json({ error: "This profile has been marked private by the student." });
    }

    const userObj = user.toObject();
    let isEndorsed = false;
    if (user.collegeName) {
      const collegeAdmin = await User.findOne({ userRole: "college", collegeName: user.collegeName });
      if (collegeAdmin && collegeAdmin.collegeEndorsedStudents) {
        isEndorsed = collegeAdmin.collegeEndorsedStudents.includes(user.email);
      }
    }
    userObj.isEndorsed = isEndorsed;

    res.status(200).json(userObj);
  } catch (err) {
    res.status(500).json({ error: "Failed to read vanity profile." });
  }
});



// =========================================================================
// 📝 ROUTE: Save Student Profile updates
// =========================================================================




// =========================================================================
// 🔎 ROUTE: Fetch chat message history between two users
// =========================================================================


// =========================================================================
// 🔎 ROUTE: Fetch list of recent chat partners
// =========================================================================


// =========================================================================
// 🔒 ROUTE: Mark all messages from a specific partner as read
// =========================================================================


// =========================================================================
// 📊 ROUTE: Company Dashboard KPI Stats Aggregation (Phase 10)
// =========================================================================


// =========================================================================
// 🕑 ROUTE: Recent Activity Feed (Phase 10)
// =========================================================================


// =========================================================================
// ⚙️ ROUTE: Update Company Profile Settings (Phase 10)
// =========================================================================
app.put("/api/auth/company-profile", authenticateToken, async (req, res) => {
  try {
    const { companyBio, companyLogoUrl, companyWebsite, companyLinkedin, industryVertical, teamSize, defaultComplexity, autoApproveApplications } = req.body;

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ error: "User account not found." });
    }
    if (user.userRole !== "company") {
      return res.status(403).json({ error: "Only company accounts can update company profiles." });
    }

    if (companyBio !== undefined) user.companyBio = companyBio;
    if (companyLogoUrl !== undefined) user.companyLogoUrl = companyLogoUrl;
    if (companyWebsite !== undefined) user.companyWebsite = companyWebsite;
    if (companyLinkedin !== undefined) user.companyLinkedin = companyLinkedin;
    if (industryVertical !== undefined) user.industryVertical = industryVertical;
    if (teamSize !== undefined) user.teamSize = teamSize;
    if (defaultComplexity !== undefined) user.defaultComplexity = defaultComplexity;
    if (autoApproveApplications !== undefined) user.autoApproveApplications = autoApproveApplications;

    await user.save();
    const sanitizedUser = user.toObject();
    delete sanitizedUser.password;
    delete sanitizedUser.resetPasswordToken;
    delete sanitizedUser.resetPasswordExpires;
    res.status(200).json({ message: "Company profile updated successfully.", user: sanitizedUser });
  } catch (err) {
    console.error("Company profile update error:", err.message);
    res.status(500).json({ error: "Failed to update company profile." });
  }
});

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



wss.on("connection", (socket) => {
  let userEmail = null;

  socket.on("message", async (messageStr) => {
    try {
      const data = JSON.parse(messageStr);

      if (data.type === "auth") {
        // Authenticate WebSocket connection using JWT verification check
        if (!data.token) {
          socket.send(JSON.stringify({ type: "error", message: "JWT token is required for chat authentication." }));
          socket.close();
          return;
        }

        jwt.verify(data.token, JWT_SECRET, (err, decoded) => {
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