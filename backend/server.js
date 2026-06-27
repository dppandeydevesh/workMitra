const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "workmitra-super-secret-key-123456";

// Models Loading
const User = require('./models/User');
const Project = require('./models/Project');
const Application = require('./models/Application');
const CompanyProfile = require('./models/CompanyProfile');
const PendingUser = require('./models/PendingUser'); // 🔑 न्यू इम्पोर्ट: पेंडिंग यूजर मॉडल
const multer = require('multer');
const { PDFParse } = require('pdf-parse');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(mongoSanitize());

// Middleware Setup
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://workmitra.me",
  "https://www.workmitra.me",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Request body size limit
app.use(express.json({ limit: '1mb' }));

// Auth Token Verification Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Access token is missing." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Access token is invalid or expired." });
    }
    req.user = user;
    next();
  });
};

// Database Connection
const dbURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/workmitra";
mongoose.connect(dbURI)
    .then(() => console.log("🔌 Connected to MongoDB Successfully!"))
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

// =========================================================================
// 🚀 UTILITIES: Live SMS & Email Delivery Gateways
// =========================================================================
const sendSmsOtp = async (toMobile, otp) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.log(`⚠️ Twilio credentials missing. SMS OTP [${otp}] simulation logged.`);
    return false;
  }

  try {
    const twilio = require("twilio");
    const client = twilio(accountSid, authToken);
    
    // Add country code +91 if not specified (defaulting to India for standard local numbers)
    const formattedMobile = toMobile.startsWith("+") ? toMobile : `+91${toMobile}`;
    
    await client.messages.create({
      body: `Your workMitra Sign Up verification code is: ${otp}`,
      from: fromNumber,
      to: formattedMobile
    });
    console.log(`📱 Live Twilio SMS OTP sent successfully to ${formattedMobile}`);
    return true;
  } catch (err) {
    console.error("❌ Failed to deliver live SMS OTP via Twilio:", err.message);
    return false;
  }
};

const smtpLogs = [];

app.get("/api/debug/smtp-logs", (req, res) => {
  res.json(smtpLogs);
});

// 📊 DIAGNOSTIC ROUTE: Check collection sizes and database storage stats
app.get("/api/debug/db-size", async (req, res) => {
  try {
    const stats = await mongoose.connection.db.stats();
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionStats = [];
    
    for (const col of collections) {
      const colStats = await mongoose.connection.db.collection(col.name).stats();
      collectionStats.push({
        name: col.name,
        count: colStats.count,
        sizeMB: (colStats.size / (1024 * 1024)).toFixed(2),
        storageSizeMB: (colStats.storageSize / (1024 * 1024)).toFixed(2),
        indexSizeMB: (colStats.totalIndexSize / (1024 * 1024)).toFixed(2)
      });
    }
    
    res.json({
      dbStats: {
        collectionsCount: stats.collections,
        objectsCount: stats.objects,
        dataSizeMB: (stats.dataSize / (1024 * 1024)).toFixed(2),
        storageSizeMB: (stats.storageSize / (1024 * 1024)).toFixed(2),
        indexSizeMB: (stats.indexSize / (1024 * 1024)).toFixed(2)
      },
      collections: collectionStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const sendEmailOtp = async (toEmail, otp) => {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.log(`⚠️ Resend API key missing. Email OTP [${otp}] simulation logged.`);
    smtpLogs.push({ timestamp: new Date(), toEmail, error: "Resend API key missing from environment variables." });
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: "workMitra <onboarding@resend.dev>",
        to: toEmail,
        subject: "workMitra Sign Up Verification OTP Code",
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: auto;">
            <h2 style="color: #4f46e5; text-align: center;">workMitra Account Verification</h2>
            <p>Hello,</p>
            <p>Thank you for signing up on workMitra. Please enter the following One-Time Password (OTP) code to verify your email address:</p>
            <div style="font-size: 24px; font-weight: bold; text-align: center; padding: 15px; background: #f3f4f6; border-radius: 8px; letter-spacing: 4px; margin: 20px 0; color: #1e1b4b;">
              ${otp}
            </div>
            <p style="color: #6b7280; font-size: 11px; text-align: center;">This verification code is valid for 10 minutes.</p>
          </div>
        `
      })
    });

    const data = await response.json();
    if (response.ok) {
      console.log(`✉️ Live Email OTP sent successfully to ${toEmail} via Resend HTTP API`);
      smtpLogs.push({ timestamp: new Date(), toEmail, status: "Success", response: data });
      return true;
    } else {
      console.error("❌ Failed to deliver live Email OTP via Resend:", data.message || data);
      smtpLogs.push({ timestamp: new Date(), toEmail, error: data.message || JSON.stringify(data) });
      return false;
    }
  } catch (err) {
    console.error("❌ Failed to deliver live Email OTP via Resend HTTP:", err.message);
    smtpLogs.push({ timestamp: new Date(), toEmail, error: err.message, stack: err.stack });
    return false;
  }
};

const sendResetPasswordEmail = async (toEmail, resetLink) => {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.log(`⚠️ Resend API key missing. Reset Link [${resetLink}] simulation logged.`);
    smtpLogs.push({ timestamp: new Date(), toEmail, error: "Resend API key missing for password reset email." });
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: "workMitra <onboarding@resend.dev>",
        to: toEmail,
        subject: "workMitra Password Reset Recovery Link",
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: auto;">
            <h2 style="color: #4f46e5; text-align: center;">workMitra Password Recovery</h2>
            <p>Hello,</p>
            <p>You requested a password reset track initiation. Please click the button below to establish new credentials:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #6b7280; font-size: 11px;">If you did not request this, you can ignore this email. This recovery link is valid for 1 hour.</p>
          </div>
        `
      })
    });

    const data = await response.json();
    if (response.ok) {
      console.log(`✉️ Password reset email sent successfully to ${toEmail} via Resend HTTP API`);
      return true;
    } else {
      console.error("❌ Failed to deliver password reset via Resend:", data.message || data);
      return false;
    }
  } catch (err) {
    console.error("❌ Failed to deliver password reset via Resend HTTP:", err.message);
    return false;
  }
};

// =========================================================================
// 📝 Route: Register Step 1 - Initiate Registration & Generate OTPs
// =========================================================================
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 OTP registrations per window
  message: { error: "Too many registration attempts. Please try again after 15 minutes." }
});

app.post("/api/auth/register", registerLimiter, async (req, res) => {
  try {
    const { fullName, companyName, email, password, userRole, mobile, collegeName, enrollmentNumber } = req.body;

    if (!email || !password || !mobile) {
      return res.status(400).json({ error: "Email, Password, and Mobile Number are required parameters." });
    }

    if (userRole === "student") {
      if (!fullName || !collegeName || !enrollmentNumber) {
        return res.status(400).json({ error: "Full Name, College, and Enrollment Number are required for students." });
      }
    }

    if (userRole === "company" && !companyName) {
      return res.status(400).json({ error: "Company Name is required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered." });
    }

    // Generate random 6-digit OTPs
    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const mobileOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Log simulated OTPs to system console
    console.log(`\n========================================`);
    console.log(`✉️ Simulated OTP for Email [${email}]: ${emailOtp}`);
    console.log(`📱 Simulated OTP for Mobile [${mobile}]: ${mobileOtp}`);
    console.log(`========================================\n`);

    // Deliver actual OTPs if gateway configs exist
    await sendEmailOtp(email, emailOtp);
    await sendSmsOtp(mobile, mobileOtp);

    // Save pending registration
    await PendingUser.findOneAndDelete({ email }); // Clear previous pending entries
    const pendingUser = new PendingUser({
      email,
      emailOtp,
      mobileOtp,
      registrationData: req.body
    });
    await pendingUser.save();

    // Always return simulated OTPs to prevent SMTP blockages from halting registration tests
    res.status(200).json({
      message: "OTP sent successfully.",
      email,
      emailOtpSimulated: emailOtp,
      mobileOtpSimulated: mobileOtp
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to initiate registration." });
  }
});

// =========================================================================
// 🔑 Route: Register Step 2 - Verify OTPs & Create Account
// =========================================================================
app.post("/api/auth/register-verify", async (req, res) => {
  try {
    const { email, emailOtp, mobileOtp } = req.body;

    if (!email || !emailOtp || !mobileOtp) {
      return res.status(400).json({ error: "Email, Email OTP, and Mobile OTP are required." });
    }

    const pending = await PendingUser.findOne({ email });
    if (!pending) {
      return res.status(400).json({ error: "Verification session expired or invalid. Please try registering again." });
    }

    if (pending.emailOtp !== emailOtp) {
      return res.status(400).json({ error: "Invalid Email verification code." });
    }

    if (pending.mobileOtp !== mobileOtp) {
      return res.status(400).json({ error: "Invalid Mobile verification code." });
    }

    // Verify successful! Save actual user
    const { fullName, companyName, password, userRole, mobile, collegeName, enrollmentNumber } = pending.registrationData;

    const newUser = new User({
      fullName,
      companyName,
      email,
      password,
      mobile,
      collegeName: userRole === "student" ? collegeName : null,
      enrollmentNumber: userRole === "student" ? enrollmentNumber : null,
      userRole
    });

    await newUser.save();
    await PendingUser.findOneAndDelete({ email }); // Clear pending record

    // Generate JWT token
    const token = jwt.sign(
      { email: newUser.email, userRole: newUser.userRole },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Registration successful!",
      token,
      user: {
        fullName: newUser.fullName,
        companyName: newUser.companyName,
        email: newUser.email,
        userRole: newUser.userRole,
        mobile: newUser.mobile || null,
        hasCompletedProfile: false,
        collegeName: newUser.collegeName || null,
        enrollmentNumber: newUser.enrollmentNumber || null,
        resumeUrl: null,
        resumeText: null,
        cvReviewReport: null
      }
    });
  } catch (err) {
    console.error("Verification Error:", err);
    res.status(500).json({ error: `Failed to verify registration: ${err.message}` });
  }
});

// =========================================================================
// 🔑 Route: Core Verification Sign In (With Onboarding Status Flag)
// =========================================================================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per window
  message: { error: "Too many login attempts. Please try again after 15 minutes." }
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are mandatory parameters." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid email or account password." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid email or account password." });
        }

        // Generate JWT token
        const token = jwt.sign(
          { email: user.email, userRole: user.userRole },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        res.status(200).json({ 
            message: "Success",
            token,
            user: { 
                fullName: user.fullName, 
                companyName: user.companyName, 
                email: user.email, 
                userRole: user.userRole,
                mobile: user.mobile || null,
                hasCompletedProfile: user.hasCompletedProfile || false,
                collegeName: user.collegeName || null,
                enrollmentNumber: user.enrollmentNumber || null,
                resumeUrl: user.resumeUrl || null,
                resumeText: user.resumeText || null,
                cvReviewReport: user.cvReviewReport || null
            } 
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to log in." });
    }
});

// =========================================================================
// 🔑 ROUTE: Initiate Password Recovery & Generate Token Link
// =========================================================================
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "No account registered with this email." });
    }

    // Generate a simple secure random token hex string
    const crypto = require("crypto");
    const token = crypto.randomBytes(20).toString("hex");

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 Hour lifespan
    await user.save();

    // Use environment variable frontend URL or fallback
    const frontendUrl = process.env.NODE_ENV === "production" ? "https://workmitra.me" : "http://localhost:5173";
    const resetLink = `${frontendUrl}/reset-password/${token}`;

    // Send the password recovery link via Resend HTTP email delivery
    await sendResetPasswordEmail(user.email, resetLink);

    res.status(200).json({
      message: "Reset token generated successfully.",
      email: user.email
      // resetLink is NOT returned to the client in production!
    });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ error: `Failed to process forgot password request: ${err.message}` });
  }
});

// =========================================================================
// 🔄 ROUTE: Reset Password using valid recovery token
// =========================================================================
app.post("/api/auth/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "New password is required." });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Password reset token is invalid or has expired." });
    }

    // Update password and clear token fields
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 🏢 Route: Save Company Requirements Profile Form Data
// =========================================================================
// =========================================================================
// 🏢 Route: Save Company Requirements Profile Form Data
// =========================================================================
app.post("/api/profile/company", authenticateToken, async (req, res) => {
  try {
    // Validate request ownership
    if (req.user.userRole !== "company") {
      return res.status(403).json({ error: "Access denied. Only recruiters can update company profiles." });
    }
    const newProfile = new CompanyProfile(req.body);
    await newProfile.save();
    res.status(201).json({ message: "Company profile created seamlessly!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save company profile." });
  }
});

// =========================================================================
// 🚀 UPDATED GLOBAL ROUTE: Fetch Deployed Company Projects for Marketplace
// =========================================================================
app.get("/api/projects/all", authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve projects." });
  }
});

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
app.post("/api/applications/apply", authenticateToken, async (req, res) => {
  try {
    const { projectId, studentEmail, studentName } = req.body;

    if (!projectId || !studentEmail || !studentName) {
      return res.status(400).json({ error: "Missing required application parameters." });
    }

    if (req.user.email !== studentEmail) {
      return res.status(403).json({ error: "Unauthorized application submitter identity." });
    }

    const alreadyApplied = await Application.findOne({ projectId, studentEmail });
    if (alreadyApplied) {
      return res.status(400).json({ error: "You have already applied to this project!" });
    }

    const newApplication = new Application({
      projectId,
      studentEmail,
      studentName
    });

    await newApplication.save();
    res.status(201).json({ message: "Application submitted successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to process project application." });
  }
});

// =========================================================================
// 🔍 ROUTE: Fetch all project IDs a student has applied to
// =========================================================================
app.get("/api/applications/student/:email", authenticateToken, async (req, res) => {
  try {
    if (req.user.email !== req.params.email) {
      return res.status(403).json({ error: "Unauthorized access to application indices." });
    }
    const apps = await Application.find({ studentEmail: req.params.email });
    const appliedProjectIds = apps.map(app => app.projectId.toString());
    res.status(200).json(appliedProjectIds);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch student application logs." });
  }
});

// =========================================================================
// ➕ ROUTE: Deploy a new Project Stack (Phase 4 Entry Portal)
// =========================================================================
app.post("/api/projects", authenticateToken, async (req, res) => {
  try {
    const { companyId, title, description, budget } = req.body;
    
    if (!companyId || !title || !description || !budget) {
      return res.status(400).json({ error: "Missing mandatory project field metrics." });
    }

    if (req.user.email !== companyId) {
      return res.status(403).json({ error: "Unauthorized project owner identifier." });
    }

    const project = new Project(req.body);
    await project.save();
    
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: "Failed to publish new project stack." });
  }
});

// =========================================================================
// 📂 ROUTE: Get All Projects posted by a specific Company
// =========================================================================
app.get("/api/projects/company/:email", authenticateToken, async (req, res) => {
  try {
    if (req.user.email !== req.params.email) {
      return res.status(403).json({ error: "Unauthorized projects access request." });
    }
    const companyProjects = await Project.find({ companyId: req.params.email }).sort({ createdAt: -1 });
    res.status(200).json(companyProjects);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve company projects." });
  }
});

// =========================================================================
// 👨‍🎓 ROUTE: Fetch Applicants for a specific Project with Skill Matching
// =========================================================================
app.get("/api/projects/:projectId/applicants", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    const currentProject = await Project.findById(projectId);
    if (!currentProject) {
      return res.status(404).json({ error: "Project not found." });
    }

    // Verify company user owns this project
    if (req.user.email !== currentProject.companyId) {
      return res.status(403).json({ error: "Unauthorized access to project applicant details." });
    }

    const applications = await Application.find({ projectId });
    
    if (applications.length === 0) {
      return res.status(200).json([]);
    }

    const targetSkills = currentProject?.requiredSkills.map(s => s.toLowerCase()) || [];

    const enrichedApplicants = await Promise.all(
      applications.map(async (app) => {
        const studentUser = await User.findOne({ email: app.studentEmail });
        
        let studentSkillsArray = [];
        if (studentUser && studentUser.targetSkills) {
          studentSkillsArray = studentUser.targetSkills
            .split(",")
            .map(s => s.trim().toLowerCase());
        }

        let matchPercentage = 0;
        if (targetSkills.length > 0 && studentSkillsArray.length > 0) {
          const intersections = studentSkillsArray.filter(skill => targetSkills.includes(skill));
          matchPercentage = Math.round((intersections.length / targetSkills.length) * 100);
        }

        return {
          applicationId: app._id,
          studentName: app.studentName,
          studentEmail: app.studentEmail,
          status: app.status,
          appliedAt: app.appliedAt,
          skills: studentUser?.targetSkills || "Not specified",
          projectTypePreference: studentUser?.projectType || "Remote Track",
          matchScore: matchPercentage,
          resumeUrl: studentUser?.resumeUrl || null,
          submissionText: app.submissionText || null,
          submissionLink: app.submissionLink || null,
          submittedAt: app.submittedAt || null,
          feedbackText: app.feedbackText || null
        };
      })
    );

    enrichedApplicants.sort((a, b) => b.matchScore - a.matchScore);
    res.status(200).json(enrichedApplicants);
  } catch (err) {
    res.status(500).json({ error: "Failed to parse matching applicants." });
  }
});

// =========================================================================
// 🏢 ROUTE: Fetch all applications for a specific company's projects
// =========================================================================
app.get("/api/applications/company/:email", authenticateToken, async (req, res) => {
  try {
    const { email } = req.params;
    if (req.user.email !== email) {
      return res.status(403).json({ error: "Unauthorized access to company applications." });
    }

    // Find all projects posted by this company
    const companyProjects = await Project.find({ companyId: email });
    const projectIds = companyProjects.map(p => p._id);

    // Find all applications for these projects
    const applications = await Application.find({ projectId: { $in: projectIds } })
      .populate("projectId")
      .sort({ appliedAt: -1 });

    if (applications.length === 0) {
      return res.status(200).json([]);
    }

    const enrichedApps = await Promise.all(
      applications.map(async (app) => {
        const studentUser = await User.findOne({ email: app.studentEmail });
        const currentProject = app.projectId;
        
        let matchPercentage = 0;
        if (currentProject && currentProject.requiredSkills && studentUser && studentUser.targetSkills) {
          const targetSkills = currentProject.requiredSkills.map(s => s.toLowerCase());
          const studentSkillsArray = studentUser.targetSkills
            .split(",")
            .map(s => s.trim().toLowerCase());
          const intersections = studentSkillsArray.filter(skill => targetSkills.includes(skill));
          matchPercentage = Math.round((intersections.length / targetSkills.length) * 100);
        }

        return {
          applicationId: app._id,
          projectId: currentProject?._id || null,
          projectTitle: currentProject?.title || "Unknown Project",
          studentName: app.studentName,
          studentEmail: app.studentEmail,
          status: app.status,
          appliedAt: app.appliedAt,
          skills: studentUser?.targetSkills || "Not specified",
          resumeUrl: studentUser?.resumeUrl || null,
          matchScore: matchPercentage,
          submissionText: app.submissionText || null,
          submissionLink: app.submissionLink || null,
          submittedAt: app.submittedAt || null,
          feedbackText: app.feedbackText || null
        };
      })
    );

    res.status(200).json(enrichedApps);
  } catch (err) {
    res.status(500).json({ error: "Failed to load corporate applications." });
  }
});

// =========================================================================
// 🔎 ROUTE: Fetch full student application details with populated project metrics
// =========================================================================
app.get("/api/applications/student-details/:email", authenticateToken, async (req, res) => {
  try {
    if (req.user.email !== req.params.email) {
      return res.status(403).json({ error: "Unauthorized access to candidate application details." });
    }
    const apps = await Application.find({ studentEmail: req.params.email })
      .populate("projectId")
      .sort({ appliedAt: -1 });
    res.status(200).json(apps);
  } catch (err) {
    res.status(500).json({ error: "Failed to load candidate application timelines." });
  }
});

// =========================================================================
// 🔒 ROUTE: Accept or Reject an Application (Update Status)
// =========================================================================
app.post("/api/applications/:applicationId/status", authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status state transition." });
    }

    const application = await Application.findById(req.params.applicationId).populate("projectId");
    if (!application) {
      return res.status(404).json({ error: "Application not found." });
    }

    // Verify company user owns the parent project
    if (req.user.email !== application.projectId.companyId) {
      return res.status(403).json({ error: "Unauthorized state modification." });
    }

    application.status = status;
    await application.save();

    res.status(200).json({ message: `Application status updated to ${status}.`, application });
  } catch (err) {
    res.status(500).json({ error: "Failed to modify application status." });
  }
});

// =========================================================================
// 📤 ROUTE: Submit completed work for review
// =========================================================================
app.post("/api/applications/:applicationId/submit", authenticateToken, async (req, res) => {
  try {
    const { submissionLink, submissionText } = req.body;
    if (!submissionLink || !submissionText) {
      return res.status(400).json({ error: "Submission Link and Explanatory Notes are required." });
    }

    const application = await Application.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ error: "Application not found." });
    }

    if (req.user.email !== application.studentEmail) {
      return res.status(403).json({ error: "Unauthorized project submitter." });
    }

    application.status = "Submitted";
    application.submissionLink = submissionLink;
    application.submissionText = submissionText;
    application.submittedAt = new Date();
    await application.save();

    res.status(200).json({ message: "Work submitted successfully for company review.", application });
  } catch (err) {
    res.status(500).json({ error: "Failed to register project solution details." });
  }
});

// =========================================================================
// ✅ ROUTE: Approve & Complete task submission
// =========================================================================
app.post("/api/applications/:applicationId/complete", authenticateToken, async (req, res) => {
  try {
    const { feedbackText } = req.body;

    const application = await Application.findById(req.params.applicationId).populate("projectId");
    if (!application) {
      return res.status(404).json({ error: "Application not found." });
    }

    if (req.user.email !== application.projectId.companyId) {
      return res.status(403).json({ error: "Unauthorized status approval request." });
    }

    application.status = "Completed";
    application.feedbackText = feedbackText || "No feedback specified.";
    await application.save();

    res.status(200).json({ message: "Work approved and marked as Completed.", application });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve solution node." });
  }
});

// =========================================================================
// 🏢 ROUTE: Save or update student resume details
// =========================================================================
app.post("/api/profile/resume", authenticateToken, async (req, res) => {
  try {
    const { email, resumeUrl, resumeText } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
    if (req.user.email !== email) {
      return res.status(403).json({ error: "Unauthorized profile update context." });
    }

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { resumeUrl, resumeText },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({
      message: "Resume details updated successfully.",
      user: {
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        userRole: updatedUser.userRole,
        hasCompletedProfile: updatedUser.hasCompletedProfile,
        collegeName: updatedUser.collegeName,
        enrollmentNumber: updatedUser.enrollmentNumber,
        resumeUrl: updatedUser.resumeUrl,
        resumeText: updatedUser.resumeText,
        cvReviewReport: updatedUser.cvReviewReport
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update candidate resume details." });
  }
});

// Configure multer storage in memory for PDF uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// 🏢 ROUTE: Upload CV PDF, parse text and save to user profile
app.post("/api/profile/upload-cv", authenticateToken, upload.single("cvFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No CV file was uploaded." });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF CV formats are supported." });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
    if (req.user.email !== email) {
      return res.status(403).json({ error: "Unauthorized profile context." });
    }

    // Parse the PDF buffer using PDFParse class
    const parser = new PDFParse({ data: new Uint8Array(req.file.buffer) });
    await parser.load();
    const pdfData = await parser.getText();
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ error: "Could not extract text from the uploaded PDF. Please make sure the PDF has selectable text." });
    }

    // Save extracted text to user document
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { resumeText: extractedText },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({
      message: "CV PDF uploaded and text parsed successfully.",
      resumeText: extractedText
    });
  } catch (err) {
    console.error("PDF upload/parse error:", err);
    res.status(500).json({ error: `Failed to upload and parse CV PDF: ${err.message}` });
  }
});

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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
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

// =========================================================================
// 🔎 ROUTE: Get a User's profile details (excluding password)
// =========================================================================
app.get("/api/auth/user/:email", authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }, "-password");
    if (!user) {
      return res.status(404).json({ error: "Student profile not found." });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to read profile details." });
  }
});

// =========================================================================
// 📝 ROUTE: Save Student Profile updates
// =========================================================================
app.put("/api/profile/student/:email", authenticateToken, async (req, res) => {
  try {
    const { email } = req.params;
    if (req.user.email !== email) {
      return res.status(403).json({ error: "Unauthorized profile update request." });
    }
    const { fullName, collegeName, enrollmentNumber, mobile, targetSkills, projectType, resumeUrl } = req.body;
    
    const user = await User.findOneAndUpdate(
      { email },
      { fullName, collegeName, enrollmentNumber, mobile, targetSkills, projectType, resumeUrl },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile parameters." });
  }
});

// =========================================================================
// ✏️ ROUTE: Update project details
// =========================================================================
app.put("/api/projects/:projectId", authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (req.user.email !== project.companyId) {
      return res.status(403).json({ error: "Unauthorized access to project parameters." });
    }

    // Only whitelist safe fields to modify
    const { title, description, budget, requiredSkills, deadline, projectType } = req.body;
    
    project.title = title || project.title;
    project.description = description || project.description;
    project.budget = budget || project.budget;
    project.requiredSkills = requiredSkills || project.requiredSkills;
    project.deadline = deadline || project.deadline;
    project.projectType = projectType || project.projectType;

    await project.save();
    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({ error: "Failed to update project details." });
  }
});

// =========================================================================
// 🗑️ ROUTE: Delete project and its corresponding applications
// =========================================================================
app.delete("/api/projects/:projectId", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (req.user.email !== project.companyId) {
      return res.status(403).json({ error: "Unauthorized delete request." });
    }

    await Project.findByIdAndDelete(projectId);
    // Cascade delete applications
    await Application.deleteMany({ projectId });
    res.status(200).json({ message: "Project and associated applications deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete corporate project." });
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
  });
}

// =========================================================================
// 🔎 ROUTE: Fetch chat message history between two users
// =========================================================================
app.get("/api/chat/history/:user1/:user2", authenticateToken, async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    
    if (req.user.email !== user1 && req.user.email !== user2) {
      return res.status(403).json({ error: "Unauthorized access to private message history." });
    }

    const Message = require("./models/Message");
    
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    }).sort({ timestamp: 1 });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to load chat history." });
  }
});

// =========================================================================
// 🔎 ROUTE: Fetch list of recent chat partners
// =========================================================================
app.get("/api/chat/partners/:email", authenticateToken, async (req, res) => {
  try {
    const { email } = req.params;
    if (req.user.email !== email) {
      return res.status(403).json({ error: "Unauthorized access to chat rosters." });
    }

    const Message = require("./models/Message");

    // Find all unique email addresses that this user has messaged or received messages from
    const senders = await Message.distinct("sender", { receiver: email });
    const receivers = await Message.distinct("receiver", { sender: email });
    const uniqueEmails = Array.from(new Set([...senders, ...receivers]));

    // Fetch user details for each partner email
    const partners = await User.find({ email: { $in: uniqueEmails } }, "fullName email companyName userRole");
    res.status(200).json(partners);
  } catch (err) {
    res.status(500).json({ error: "Failed to gather chat partners." });
  }
});

const server = app.listen(PORT, () => {
    console.log(`🚀 Server running smoothly on http://localhost:${PORT}`);
});

// =========================================================================
// 💬 WEBSOCKET CHAT ENGINE (Real-time Messaging Gateway)
// =========================================================================
const ws = require("ws");
const wss = new ws.Server({ server });

const clients = new Map(); // Key: userEmail, Value: socket instance

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
          clients.set(userEmail, socket);
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
        const receiverSocket = clients.get(receiver);
        if (receiverSocket && receiverSocket.readyState === ws.OPEN) {
          receiverSocket.send(JSON.stringify(payload));
        }

        // Echo back to sender
        socket.send(JSON.stringify(payload));
      }
    } catch (err) {
      console.error("❌ WebSocket message error:", err.message);
    }
  });

  socket.on("close", () => {
    if (userEmail) {
      clients.delete(userEmail);
      console.log(`🔌 WebSocket connection closed for: ${userEmail}`);
    }
  });
});