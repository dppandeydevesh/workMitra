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

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-fallback-not-for-production';
if (!process.env.JWT_SECRET) {
  console.warn("⚠️ WARNING: JWT_SECRET environment variable is missing. Using insecure fallback.");
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

// Seed default admin account
const seedAdmin = async () => {
  try {
    const User = require("./models/User");
    const adminEmail = process.env.ADMIN_EMAIL || "admin@workmitra.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const newAdmin = new User({
        fullName: "Super Admin",
        email: adminEmail,
        password: adminPassword,
        userRole: "admin",
        mobile: "9999999999",
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

// smtpLogs proxy to avoid ReferenceErrors during mail sending and prevent memory leaks (capped at 50 logs)
const smtpLogs = new Proxy([], {
  get(target, prop) {
    if (prop === 'push') {
      return function(...args) {
        const res = target.push(...args);
        if (target.length > 50) target.shift();
        return res;
      };
    }
    return target[prop];
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
        from: "workMitra <noreply@workmitra.me>",
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
        from: "workMitra <noreply@workmitra.me>",
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

    if (!email || !password || !mobile || !userRole) {
      return res.status(400).json({ error: "Email, Password, Mobile Number, and User Role are required parameters." });
    }

    if (!["student", "company"].includes(userRole)) {
      return res.status(400).json({ error: "Invalid user role registration attempt." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
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

    // Fix 7: Check for duplicate mobile number
    if (mobile) {
      const existingMobile = await User.findOne({ mobile });
      if (existingMobile) {
        return res.status(400).json({ error: "Mobile number already registered." });
      }
    }

    // Generate random 6-digit OTPs
    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const mobileOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Log simulated OTPs to system console (suppressed in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n========================================`);
      console.log(`✉️ Simulated OTP for Email [${email}]: ${emailOtp}`);
      console.log(`📱 Simulated OTP for Mobile [${mobile}]: ${mobileOtp}`);
      console.log(`========================================\n`);
    }

    // Deliver actual OTPs if gateway configs exist
    await sendEmailOtp(email, emailOtp);
    await sendSmsOtp(mobile, mobileOtp);

    // Save pending registration (F48: hash password before storing in cache)
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const registrationData = {
      fullName,
      companyName,
      email,
      password: hashedPassword,
      userRole,
      mobile,
      collegeName: userRole === "student" ? collegeName : null,
      enrollmentNumber: userRole === "student" ? enrollmentNumber : null
    };

    await PendingUser.findOneAndDelete({ email });
    const pendingUser = new PendingUser({
      email,
      emailOtp,
      mobileOtp,
      registrationData
    });
    await pendingUser.save();

    // OTPs are stored server-side only — NOT sent to the client
    res.status(200).json({
      message: "OTP sent successfully.",
      email
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
      { userId: newUser._id.toString(), email: newUser.email, userRole: newUser.userRole },
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
          { userId: user._id.toString(), email: user.email, userRole: user.userRole },
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
      // Return generic message to prevent user enumeration
      return res.status(200).json({ message: "If an account exists with this email, a reset link has been sent.", email });
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

    const responsePayload = {
      message: "Reset token generated successfully.",
      email: user.email
    };
    if (process.env.NODE_ENV !== "production") {
      responsePayload.resetLink = resetLink;
    }
    res.status(200).json(responsePayload);
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
    const profileData = { ...req.body, companyEmail: req.user.email };
    const profile = await CompanyProfile.findOneAndUpdate(
      { companyEmail: req.user.email },
      profileData,
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json({ message: "Company profile saved successfully!", profile });
  } catch (err) {
    res.status(500).json({ error: "Failed to save company profile." });
  }
});

// =========================================================================
// 🏢 Route: Get Company Profile for authenticated user
// =========================================================================
app.get("/api/profile/company", authenticateToken, async (req, res) => {
  try {
    const profile = await CompanyProfile.findOne({ companyEmail: req.user.email });
    if (!profile) {
      return res.status(404).json({ error: "Company profile not found." });
    }
    res.status(200).json(profile);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve company profile." });
  }
});

// =========================================================================
// 🚀 UPDATED GLOBAL ROUTE: Fetch Deployed Company Projects for Marketplace
// =========================================================================
app.get("/api/projects/all", authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    let blockedCompanyEmails = [];
    if (req.user.userRole === "student") {
      const student = await User.findOne({ email: req.user.email });
      if (student && student.collegeName) {
        const collegeAdmin = await User.findOne({ userRole: "college", collegeName: student.collegeName });
        if (collegeAdmin && collegeAdmin.collegeBlockedCompanies) {
          blockedCompanyEmails = collegeAdmin.collegeBlockedCompanies;
        }
      }
    }
    
    let queryConditions = {};
    if (blockedCompanyEmails.length > 0) {
      queryConditions.companyId = { $nin: blockedCompanyEmails };
    }

    let query = Project.find(queryConditions).sort({ createdAt: -1 });
    
    if (page && limit) {
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
    }
    
    const projects = await query;
    const projectsWithCounts = await Promise.all(projects.map(async (p) => {
      const applicantCount = await Application.countDocuments({ projectId: p._id });
      return {
        ...p.toObject(),
        applicantCount
      };
    }));
    res.status(200).json(projectsWithCounts);
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
    // Fix 6: Only students can apply to projects
    if (req.user.userRole !== 'student') {
      return res.status(403).json({ error: 'Only students can apply to projects' });
    }

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

    const project = await Project.findById(projectId);
    const studentUser = await User.findOne({ email: studentEmail });

    // Compute standard match score fallback
    let matchScore = 0;
    let aiRationale = "Calculated using skill matches.";

    if (project && project.requiredSkills && studentUser && studentUser.targetSkills) {
      const targetSkills = project.requiredSkills.map(s => s.toLowerCase());
      const studentSkillsArray = studentUser.targetSkills.split(",").map(s => s.trim().toLowerCase());
      const intersections = studentSkillsArray.filter(skill => targetSkills.includes(skill));
      if (targetSkills.length > 0) {
        matchScore = Math.round((intersections.length / targetSkills.length) * 100);
      }
    }

    // Attempt Gemini AI evaluation if resume is uploaded
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && studentUser && studentUser.resumeText && project) {
      try {
        const prompt = `Analyze this candidate's resume text against the project description and required skills. Estimate a match percentage (integer 0 to 100) and provide a concise, one-sentence rationale. Return ONLY a valid JSON object matching this schema:
{
  "matchScore": number,
  "aiRationale": "string"
}

Required Skills: ${project.requiredSkills.join(", ")}
Project Description: ${project.description}
Candidate Resume Text: ${studentUser.resumeText}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (aiText) {
            const aiData = JSON.parse(aiText);
            if (typeof aiData.matchScore === "number") {
              matchScore = aiData.matchScore;
              aiRationale = aiData.aiRationale;
            }
          }
        }
      } catch (aiErr) {
        console.error("Gemini applicant match score evaluation bypassed:", aiErr.message);
      }
    }

    const newApplication = new Application({
      projectId,
      studentEmail,
      studentName,
      matchScore,
      aiRationale
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
    if (req.user.userRole !== "company" && req.user.userRole !== "admin") {
      return res.status(403).json({ error: "Access denied. Only recruiters can publish projects." });
    }

    const { companyId, title, description, budget, requiredSkills, duration, deadline, workType, complexity, targetUniversity, hasPpiBadge, departmentName } = req.body;
    
    if (!companyId || !title || !description || !budget) {
      return res.status(400).json({ error: "Missing mandatory project field metrics." });
    }

    if (req.user.email !== companyId) {
      return res.status(403).json({ error: "Unauthorized project owner identifier." });
    }

    const parsedBudget = Number(budget);
    if (isNaN(parsedBudget) || parsedBudget <= 0) {
      return res.status(400).json({ error: "Budget must be a positive number." });
    }

    const project = new Project({
      companyId,
      title,
      description,
      budget: parsedBudget,
      requiredSkills,
      duration,
      deadline,
      workType,
      complexity,
      targetUniversity,
      hasPpiBadge,
      departmentName,
      status: "Published"
    });
    
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: "Failed to publish new project stack." });
  }
});

// =========================================================================
// 📂 ROUTE: Get Specific Project by ID
// =========================================================================
app.get("/api/projects/:projectId", authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }
    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve project details." });
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

        let matchPercentage = app.matchScore !== null && app.matchScore !== undefined ? app.matchScore : 0;
        if (app.matchScore === null || app.matchScore === undefined) {
          if (targetSkills.length > 0 && studentSkillsArray.length > 0) {
            const intersections = studentSkillsArray.filter(skill => targetSkills.includes(skill));
            matchPercentage = Math.round((intersections.length / targetSkills.length) * 100);
          }
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
          aiRationale: app.aiRationale || "Calculated using skill matches.",
          resumeUrl: studentUser?.resumeUrl || null,
          githubUrl: studentUser?.githubUrl || null,
          linkedinUrl: studentUser?.linkedinUrl || null,
          portfolioUrl: studentUser?.portfolioUrl || null,
          submissionText: app.submissionText || null,
          submissionLink: app.submissionLink || null,
          submittedAt: app.submittedAt || null,
          feedbackText: app.feedbackText || null,
          rating: app.rating || null,
          ratingReview: app.ratingReview || null
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
        
        let matchPercentage = app.matchScore !== null && app.matchScore !== undefined ? app.matchScore : 0;
        if (app.matchScore === null || app.matchScore === undefined) {
          if (currentProject && currentProject.requiredSkills && studentUser && studentUser.targetSkills) {
            const targetSkills = currentProject.requiredSkills.map(s => s.toLowerCase());
            const studentSkillsArray = studentUser.targetSkills
              .split(",")
              .map(s => s.trim().toLowerCase());
            const intersections = studentSkillsArray.filter(skill => targetSkills.includes(skill));
            matchPercentage = Math.round((intersections.length / targetSkills.length) * 100);
          }
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
          githubUrl: studentUser?.githubUrl || null,
          linkedinUrl: studentUser?.linkedinUrl || null,
          portfolioUrl: studentUser?.portfolioUrl || null,
          matchScore: matchPercentage,
          aiRationale: app.aiRationale || "Calculated using skill matches.",
          submissionText: app.submissionText || null,
          submissionLink: app.submissionLink || null,
          submittedAt: app.submittedAt || null,
          feedbackText: app.feedbackText || null,
          rating: app.rating || null,
          ratingReview: app.ratingReview || null
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

    // Push live real-time notification alert if student is online
    try {
      const receiverSocket = global.wsClients.get(application.studentEmail);
      const ws = require("ws");
      if (receiverSocket && receiverSocket.readyState === ws.OPEN) {
        receiverSocket.send(
          JSON.stringify({
            type: "notification",
            statusUpdate: true,
            message: {
              id: application._id,
              title: status === "Approved" ? "🎉 Proposal Approved!" : "😞 Application Update",
              message: status === "Approved"
                ? `Your application for "${application.projectId.title}" was approved by the company.`
                : `Your application for "${application.projectId.title}" was rejected.`,
              type: status === "Approved" ? "success" : "danger"
            }
          })
        );
      }
    } catch (wsErr) {
      console.error("Failed to push real-time status update socket alert:", wsErr.message);
    }

    res.status(200).json({ message: `Application status updated to ${status}.`, application });
  } catch (err) {
    res.status(500).json({ error: "Failed to modify application status." });
  }
});

// =========================================================================
// 📤 ROUTE: Submit completed work for review
// =========================================================================
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, "");
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (s1 === s2) return 100;
  
  const getBigrams = (str) => {
    const bigrams = new Set();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };

  const b1 = getBigrams(s1);
  const b2 = getBigrams(s2);
  if (b1.size === 0 || b2.size === 0) return 0;

  let intersection = 0;
  b1.forEach(bg => {
    if (b2.has(bg)) intersection++;
  });

  return Math.round((2 * intersection) / (b1.size + b2.size) * 100);
}

function runLinter(code) {
  const warnings = [];
  if (!code) return warnings;

  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    warnings.push(`Syntax Warning: Unbalanced braces detected (${openBraces} open vs ${closeBraces} close).`);
  }

  if (code.includes("console.log")) {
    warnings.push("Style Warning: Avoid leaving debugging tags 'console.log' in production code.");
  }

  if (code.match(/\{\s*\}/)) {
    warnings.push("Refactor Warning: Empty block statement detected. Implement logic or clear block.");
  }

  if (code.includes("const ") && !code.includes(";")) {
    warnings.push("Formatting Warning: Missing semicolon line delimiters.");
  }

  return warnings;
}

app.post("/api/applications/:applicationId/submit", authenticateToken, async (req, res) => {
  try {
    const { submissionLink, submissionText, githubRepoUrl, liveDeploymentUrl, aiDeclaration, selfAssessment } = req.body;
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

    if (application.status !== "Approved" && application.status !== "Revision Requested" && application.status !== "Submitted" && application.status !== "Flagged") {
      return res.status(403).json({ error: "Cannot submit work for this application. You must be approved for the task first." });
    }

    application.submissionLink = submissionLink;
    application.githubRepoUrl = githubRepoUrl || null;
    application.liveDeploymentUrl = liveDeploymentUrl || null;
    application.submissionText = submissionText;
    application.submittedAt = new Date();

    // 1. Check Plagiarism (compare with other submissions for this project)
    let plagiarismScore = 0;
    const siblingApplications = await Application.find({
      projectId: application.projectId,
      status: { $in: ["Submitted", "Completed"] },
      _id: { $ne: application._id }
    });
    for (const sib of siblingApplications) {
      if (sib.submissionText) {
        const sim = calculateSimilarity(submissionText, sib.submissionText);
        if (sim > plagiarismScore) plagiarismScore = sim;
      }
    }
    application.plagiarismScore = plagiarismScore;
    
    // Set status to Flagged if plagiarism score exceeds 70%
    if (plagiarismScore > 70) {
      application.status = "Flagged";
    } else {
      application.status = "Submitted";
    }

    // 2. Run Linter Simulation
    const lintWarnings = runLinter(submissionText);
    application.lintWarnings = lintWarnings;

    // 3. AI Code Auditor (Google Gemini)
    let matchScore = null;
    let aiRationale = null;
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const prompt = `Analyze this student's task submission code against the requirements. Grade the solution's code quality, correct implementation, and completeness on a scale of 0 to 100. Also write a one-sentence critique/rationale. Return ONLY a valid JSON object matching this schema:
{
  "score": number,
  "rationale": "string"
}

Submission Code: ${submissionText}
Explanatory details: ${submissionText}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (aiText) {
            const aiData = JSON.parse(aiText);
            if (typeof aiData.score === "number") {
              matchScore = aiData.score;
              aiRationale = aiData.rationale;
            }
          }
        }
      } catch (aiErr) {
        console.error("Gemini AI code auditor bypassed:", aiErr.message);
      }
    }
    if (matchScore !== null) {
      application.matchScore = matchScore;
      application.aiRationale = aiRationale;
    }

    // Push version history node
    application.submissionVersions.push({
      submissionLink,
      githubRepoUrl: githubRepoUrl || null,
      liveDeploymentUrl: liveDeploymentUrl || null,
      submissionText,
      aiDeclaration: aiDeclaration || { usedAi: false, aiPercentage: 0, toolsUsed: "" },
      selfAssessment: selfAssessment || {},
      submittedAt: new Date()
    });

    await application.save();

    res.status(200).json({ message: "Work submitted successfully for company review.", application });
  } catch (err) {
    console.error("Submission error:", err.message);
    res.status(500).json({ error: "Failed to register project solution details." });
  }
});

// =========================================================================
// ⏳ ROUTE: Request Deadline Extension (Phase 12)
// =========================================================================
app.post("/api/applications/:applicationId/request-extension", authenticateToken, async (req, res) => {
  try {
    const { requestedDays, reason } = req.body;
    if (!requestedDays || !reason) {
      return res.status(400).json({ error: "Requested days and extension reason are required." });
    }

    const application = await Application.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ error: "Application not found." });
    }

    if (req.user.email !== application.studentEmail) {
      return res.status(403).json({ error: "Unauthorized operation." });
    }

    application.extensionRequests.push({
      requestedDays: Number(requestedDays),
      reason,
      status: "Pending",
      requestedAt: new Date()
    });

    await application.save();
    res.status(200).json({ message: "Deadline extension requested.", application });
  } catch (err) {
    console.error("Request extension error:", err.message);
    res.status(500).json({ error: "Failed to submit deadline extension request." });
  }
});

// =========================================================================
// ⏳ ROUTE: Review Deadline Extension (Phase 12)
// =========================================================================
app.post("/api/applications/:applicationId/review-extension", authenticateToken, async (req, res) => {
  try {
    const { requestId, status } = req.body; // status: 'Approved' | 'Rejected'
    if (!requestId || !status) {
      return res.status(400).json({ error: "Request ID and review status are required." });
    }

    const application = await Application.findById(req.params.applicationId).populate("projectId");
    if (!application) {
      return res.status(404).json({ error: "Application not found." });
    }

    const reqIndex = application.extensionRequests.findIndex(r => r._id.toString() === requestId);
    if (reqIndex === -1) {
      return res.status(404).json({ error: "Extension request not found." });
    }

    application.extensionRequests[reqIndex].status = status;
    application.extensionRequests[reqIndex].reviewedAt = new Date();

    if (status === "Approved") {
      const days = application.extensionRequests[reqIndex].requestedDays;
      // Update extended deadline. Default base is project deadline or current extendedDeadline
      const baseDate = application.extendedDeadline || application.projectId?.deadline || new Date();
      const newDeadline = new Date(baseDate);
      newDeadline.setDate(newDeadline.getDate() + days);
      application.extendedDeadline = newDeadline;
    }

    await application.save();

    // Trigger real-time alert via WebSocket if student is connected
    const studentSocket = global.wsClients.get(application.studentEmail);
    if (studentSocket && studentSocket.readyState === ws.OPEN) {
      studentSocket.send(
        JSON.stringify({
          type: "notification",
          statusUpdate: true,
          message: {
            title: `Deadline Extension ${status}!`,
            message: status === "Approved"
              ? `Your extension request was approved. New deadline: ${new Date(application.extendedDeadline).toLocaleDateString()}`
              : `Your extension request was rejected by the recruiter.`
          }
        })
      );
    }

    res.status(200).json({ message: `Extension request has been ${status.toLowerCase()}.`, application });
  } catch (err) {
    console.error("Review extension error:", err.message);
    res.status(500).json({ error: "Failed to review deadline extension request." });
  }
});

// =========================================================================
// ✅ ROUTE: Approve & Complete task submission
// =========================================================================
app.post("/api/applications/:applicationId/complete", authenticateToken, async (req, res) => {
  try {
    const { feedbackText, rating, ratingReview } = req.body;

    const application = await Application.findById(req.params.applicationId).populate("projectId");
    if (!application) {
      return res.status(404).json({ error: "Application not found." });
    }

    if (req.user.email !== application.projectId.companyId) {
      return res.status(403).json({ error: "Unauthorized status approval request." });
    }

    application.status = "Completed";
    application.feedbackText = feedbackText || "No feedback specified.";
    if (rating !== undefined && rating !== null) {
      application.rating = parseInt(rating);
    }
    if (ratingReview !== undefined && ratingReview !== null) {
      application.ratingReview = ratingReview;
    }
    await application.save();

    // Auto-update student targetSkills based on project requiredSkills (Item 4)
    try {
      const User = require("./models/User");
      const student = await User.findOne({ email: application.studentEmail });
      if (student) {
        let existingSkills = student.targetSkills 
          ? student.targetSkills.split(",").map(s => s.trim().toLowerCase()) 
          : [];
        let newSkills = application.projectId.requiredSkills || [];
        newSkills.forEach(ns => {
          let clean = ns.trim().toLowerCase();
          if (clean && !existingSkills.includes(clean)) {
            existingSkills.push(clean);
          }
        });
        student.targetSkills = existingSkills
          .map(s => s.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "))
          .join(", ");
        await student.save();
      }
    } catch (tagErr) {
      console.error("Failed to auto-assign verified skill tags:", tagErr.message);
    }

    // Push live real-time notification alert if student is online
    try {
      const receiverSocket = global.wsClients.get(application.studentEmail);
      const ws = require("ws");
      if (receiverSocket && receiverSocket.readyState === ws.OPEN) {
        receiverSocket.send(
          JSON.stringify({
            type: "notification",
            statusUpdate: true,
            message: {
              id: application._id,
              title: "🏆 Gig Completed!",
              message: `Your work for "${application.projectId.title}" has been reviewed, approved, and marked completed.`,
              type: "success"
            }
          })
        );
      }
    } catch (wsErr) {
      console.error("Failed to push real-time task complete socket alert:", wsErr.message);
    }

    res.status(200).json({ message: "Work approved and marked as Completed.", application });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve solution node." });
  }
});

// =========================================================================
// 🔄 ROUTE: Request revision for a task submission
// =========================================================================
app.post("/api/applications/:applicationId/revision", authenticateToken, async (req, res) => {
  try {
    const { feedbackText } = req.body;
    if (!feedbackText) {
      return res.status(400).json({ error: "Revision feedback explanation is required." });
    }

    const application = await Application.findById(req.params.applicationId).populate("projectId");
    if (!application) {
      return res.status(404).json({ error: "Application not found." });
    }

    if (req.user.email !== application.projectId.companyId) {
      return res.status(403).json({ error: "Unauthorized status revision request." });
    }

    application.status = "Revision Requested";
    application.feedbackText = feedbackText;
    await application.save();

    // Push live WS alert
    try {
      const receiverSocket = global.wsClients.get(application.studentEmail);
      const ws = require("ws");
      if (receiverSocket && receiverSocket.readyState === ws.OPEN) {
        receiverSocket.send(
          JSON.stringify({
            type: "notification",
            statusUpdate: true,
            message: {
              id: application._id,
              title: "🔄 Revision Requested",
              message: `Recruiter requested revision for "${application.projectId.title}".`,
              type: "warning"
            }
          })
        );
      }
    } catch (wsErr) {
      console.error("Failed to push revision request socket alert:", wsErr.message);
    }

    res.status(200).json({ message: "Revision requested successfully.", application });
  } catch (err) {
    res.status(500).json({ error: "Failed to request task revision." });
  }
});

// =========================================================================
// ⚠️ ROUTE: Flag and Dispute task submission
// =========================================================================
app.post("/api/applications/:applicationId/dispute", authenticateToken, async (req, res) => {
  try {
    const { feedbackText } = req.body;
    if (!feedbackText) {
      return res.status(400).json({ error: "Dispute explanation feedback is required." });
    }

    const application = await Application.findById(req.params.applicationId).populate("projectId");
    if (!application) {
      return res.status(404).json({ error: "Application not found." });
    }

    if (req.user.email !== application.projectId.companyId) {
      return res.status(403).json({ error: "Unauthorized status modification request." });
    }

    application.status = "Disputed";
    application.feedbackText = feedbackText;
    await application.save();

    // Push live real-time notification warning alert if student is online
    try {
      const receiverSocket = global.wsClients.get(application.studentEmail);
      const ws = require("ws");
      if (receiverSocket && receiverSocket.readyState === ws.OPEN) {
        receiverSocket.send(
          JSON.stringify({
            type: "notification",
            statusUpdate: true,
            message: {
              id: application._id,
              title: "⚠️ Submission Disputed!",
              message: `Your solution for "${application.projectId.title}" was flagged by the recruiter. Check dashboard feedback.`,
              type: "danger"
            }
          })
        );
      }
    } catch (wsErr) {
      console.error("Failed to push real-time dispute socket alert:", wsErr.message);
    }

    res.status(200).json({ message: "Task solution disputed successfully.", application });
  } catch (err) {
    res.status(500).json({ error: "Failed to dispute solution node." });
  }
});

// =========================================================================
// 👑 ADMIN ROUTES: Control Panel Management endpoints
// =========================================================================
app.get("/api/admin/metrics", authenticateToken, async (req, res) => {
  if (req.user.userRole !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }

  try {
    const User = require("./models/User");
    const Project = require("./models/Project");
    const Application = require("./models/Application");

    const totalStudents = await User.countDocuments({ userRole: "student" });
    const totalCompanies = await User.countDocuments({ userRole: "company" });
    const totalProjects = await Project.countDocuments();
    
    // Escrow metrics
    const applications = await Application.find().populate("projectId");
    const lockedEscrow = applications
      .filter(app => ["Approved", "Submitted"].includes(app.status))
      .reduce((sum, app) => sum + (app.projectId?.budget || 0), 0);
      
    const completedEscrow = applications
      .filter(app => app.status === "Completed")
      .reduce((sum, app) => sum + (app.projectId?.budget || 0), 0);

    const disputedEscrow = applications
      .filter(app => app.status === "Disputed")
      .reduce((sum, app) => sum + (app.projectId?.budget || 0), 0);

    res.status(200).json({
      totalStudents,
      totalCompanies,
      totalProjects,
      lockedEscrow,
      completedEscrow,
      disputedEscrow
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load admin statistics." });
  }
});

app.get("/api/admin/disputes", authenticateToken, async (req, res) => {
  if (req.user.userRole !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }

  try {
    const Application = require("./models/Application");
    const disputes = await Application.find({ status: "Disputed" }).populate("projectId");
    res.status(200).json(disputes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch disputed items." });
  }
});

app.post("/api/admin/disputes/:applicationId/resolve", authenticateToken, async (req, res) => {
  if (req.user.userRole !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }

  const { decision } = req.body; // 'release' (Complete) or 'refund' (Reject)
  if (!["release", "refund"].includes(decision)) {
    return res.status(400).json({ error: "Invalid dispute resolution decision." });
  }

  try {
    const Application = require("./models/Application");
    const application = await Application.findById(req.params.applicationId).populate("projectId");
    if (!application) {
      return res.status(404).json({ error: "Application not found." });
    }

    application.status = decision === "release" ? "Completed" : "Rejected";
    application.feedbackText = `Dispute resolved by Admin: ${decision === "release" ? "Escrow funds released to student." : "Escrow funds refunded to recruiter."}`;
    await application.save();

    // Push live real-time notification alert to both recruiter and student if online
    const sendNotification = (email, title, message, type) => {
      try {
        const receiverSocket = global.wsClients.get(email);
        const ws = require("ws");
        if (receiverSocket && receiverSocket.readyState === ws.OPEN) {
          receiverSocket.send(
            JSON.stringify({
              type: "notification",
              statusUpdate: true,
              message: { id: application._id, title, message, type }
            })
          );
        }
      } catch (wsErr) {
        console.error("Failed to push real-time dispute resolution socket alert:", wsErr.message);
      }
    };

    sendNotification(
      application.studentEmail,
      "⚖️ Dispute Resolved!",
      `The dispute for "${application.projectId.title}" was resolved. Decision: ${decision === "release" ? "Escrow funds released!" : "Funds refunded to company."}`,
      decision === "release" ? "success" : "danger"
    );

    sendNotification(
      application.projectId.companyId,
      "⚖️ Dispute Resolved!",
      `The dispute for "${application.projectId.title}" was resolved. Decision: ${decision === "release" ? "Funds released to student." : "Funds refunded to your balance."}`,
      decision === "release" ? "info" : "success"
    );

    res.status(200).json({ message: "Dispute resolved successfully.", application });
  } catch (err) {
    res.status(500).json({ error: "Failed to resolve dispute." });
  }
});

app.get("/api/admin/companies", authenticateToken, async (req, res) => {
  if (req.user.userRole !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }

  try {
    const User = require("./models/User");
    const companies = await User.find({ userRole: "company" }, "fullName email companyName mobile isVerified createdAt");
    res.status(200).json(companies);
  } catch (err) {
    res.status(500).json({ error: "Failed to load corporate registrations." });
  }
});

app.post("/api/admin/companies/:companyEmail/verify", authenticateToken, async (req, res) => {
  if (req.user.userRole !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }

  try {
    const User = require("./models/User");
    const updatedCompany = await User.findOneAndUpdate(
      { email: req.params.companyEmail, userRole: "company" },
      { isVerified: true },
      { new: true }
    );
    if (!updatedCompany) {
      return res.status(404).json({ error: "Company not found." });
    }
    res.status(200).json({ message: "Company verified successfully.", company: updatedCompany });
  } catch (err) {
    res.status(500).json({ error: "Failed to verify corporate credentials." });
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

    // Parse the PDF buffer
    const pdfData = await pdfParse(req.file.buffer);
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

app.post("/api/profile/vouch", authenticateToken, async (req, res) => {
  try {
    const { studentEmail, skills, comment } = req.body;
    if (!studentEmail || !skills || !comment) {
      return res.status(400).json({ error: "Required vouch payload parameters missing." });
    }
    const student = await User.findOne({ email: studentEmail });
    if (!student) {
      return res.status(404).json({ error: "Recipient student user not found." });
    }
    if (req.user.email === studentEmail) {
      return res.status(400).json({ error: "You cannot vouch for your own profile." });
    }
    
    // F9: Prevent duplicate vouches
    const hasAlreadyVouched = student.softSkillsVouches.some(v => v.vouchedBy === req.user.email);
    if (hasAlreadyVouched) {
      return res.status(400).json({ error: "You have already vouched for this student." });
    }

    student.softSkillsVouches.push({
      vouchedBy: req.user.email,
      skills,
      comment
    });
    await student.save();

    // Sanitize user object response
    const sanitizedStudent = student.toObject();
    delete sanitizedStudent.password;
    delete sanitizedStudent.resetPasswordToken;
    delete sanitizedStudent.resetPasswordExpires;

    res.status(200).json({ message: "Vouch endorsement submitted successfully!", student: sanitizedStudent });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit vouch endorsement." });
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
    const { 
      fullName, collegeName, enrollmentNumber, mobile, targetSkills, 
      projectType, resumeUrl, githubUrl, linkedinUrl, portfolioUrl, bio, interests,
      isProfilePrivate, major, currentSemester, vanityUsername, videoPitchUrl,
      extracurriculars, availabilitySlots, preferredTechStack
    } = req.body;
    
    // Check vanity uniqueness if modified
    if (vanityUsername) {
      const existing = await User.findOne({ vanityUsername, email: { $ne: email } });
      if (existing) {
        return res.status(400).json({ error: "Vanity URL handle is already taken." });
      }
    }
    
    const user = await User.findOneAndUpdate(
      { email },
      { 
        fullName, collegeName, enrollmentNumber, mobile, targetSkills, 
        projectType, resumeUrl, githubUrl, linkedinUrl, portfolioUrl, bio, interests,
        isProfilePrivate, major, currentSemester, vanityUsername, videoPitchUrl,
        extracurriculars, availabilitySlots, preferredTechStack
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const sanitized = user.toObject();
    delete sanitized.password;
    delete sanitized.resetPasswordToken;
    delete sanitized.resetPasswordExpires;

    res.status(200).json({ user: sanitized });
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
    
    project.title = title !== undefined ? title : project.title;
    project.description = description !== undefined ? description : project.description;
    project.budget = budget !== undefined ? budget : project.budget;
    project.requiredSkills = requiredSkills !== undefined ? requiredSkills : project.requiredSkills;
    project.deadline = deadline !== undefined ? deadline : project.deadline;
    project.projectType = projectType !== undefined ? projectType : project.projectType;

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
    
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    
    let query = Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    });

    if (page && limit) {
      const skip = (page - 1) * limit;
      // Fetch latest messages first, then reverse so they render chronologically
      const messages = await query.sort({ timestamp: -1 }).skip(skip).limit(limit);
      res.status(200).json(messages.reverse());
    } else {
      const messages = await query.sort({ timestamp: 1 });
      res.status(200).json(messages);
    }
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
    
    const partnersWithUnread = await Promise.all(
      partners.map(async (partner) => {
        const unreadCount = await Message.countDocuments({
          sender: partner.email,
          receiver: email,
          read: false
        });
        return {
          _id: partner._id,
          fullName: partner.fullName,
          email: partner.email,
          companyName: partner.companyName,
          userRole: partner.userRole,
          unreadCount
        };
      })
    );
    
    res.status(200).json(partnersWithUnread);
  } catch (err) {
    res.status(500).json({ error: "Failed to load recent chat partners." });
  }
});

// =========================================================================
// 🔒 ROUTE: Mark all messages from a specific partner as read
// =========================================================================
app.post("/api/chat/read", authenticateToken, async (req, res) => {
  try {
    const { sender } = req.body;
    if (!sender) {
      return res.status(400).json({ error: "Sender email is required." });
    }
    const Message = require("./models/Message");
    await Message.updateMany(
      { sender, receiver: req.user.email, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark messages as read." });
  }
});

// =========================================================================
// 📊 ROUTE: Company Dashboard KPI Stats Aggregation (Phase 10)
// =========================================================================
app.get("/api/dashboard/company-stats/:email", authenticateToken, async (req, res) => {
  try {
    const companyEmail = req.params.email;
    if (req.user.email !== companyEmail) {
      return res.status(403).json({ error: "Unauthorized stats access." });
    }

    const projects = await Project.find({ companyId: companyEmail });
    const projectIds = projects.map(p => p._id);
    const applications = await Application.find({ projectId: { $in: projectIds } }).populate("projectId");

    const totalProjects = projects.length;
    const totalApplications = applications.length;
    const submittedCount = applications.filter(a => a.status === "Submitted").length;
    const completedCount = applications.filter(a => a.status === "Completed").length;
    const pendingCount = applications.filter(a => a.status === "Pending").length;
    const approvedCount = applications.filter(a => a.status === "Approved").length;
    const rejectedCount = applications.filter(a => a.status === "Rejected").length;
    const revisionCount = applications.filter(a => a.status === "Revision Requested").length;

    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const ratedApps = applications.filter(a => a.rating && a.rating > 0);
    const avgRating = ratedApps.length > 0
      ? (ratedApps.reduce((sum, a) => sum + a.rating, 0) / ratedApps.length).toFixed(1)
      : "0.0";

    // Top 3 performers
    const completedApps = applications.filter(a => a.status === "Completed" && a.rating > 0);
    completedApps.sort((a, b) => b.rating - a.rating);
    const topPerformers = completedApps.slice(0, 3).map(a => ({
      studentEmail: a.studentEmail,
      studentName: a.studentName,
      rating: a.rating,
      projectTitle: a.projectId?.title || "Unknown"
    }));

    res.status(200).json({
      totalProjects,
      totalApplications,
      submittedCount,
      completedCount,
      pendingCount,
      approvedCount,
      rejectedCount,
      revisionCount,
      totalBudget,
      avgRating,
      topPerformers
    });
  } catch (err) {
    console.error("Company stats aggregation error:", err.message);
    res.status(500).json({ error: "Failed to aggregate company dashboard stats." });
  }
});

// =========================================================================
// 🕑 ROUTE: Recent Activity Feed (Phase 10)
// =========================================================================
app.get("/api/dashboard/recent-activity/:email", authenticateToken, async (req, res) => {
  try {
    const companyEmail = req.params.email;
    if (req.user.email !== companyEmail) {
      return res.status(403).json({ error: "Unauthorized activity access." });
    }

    const projects = await Project.find({ companyId: companyEmail });
    const projectIds = projects.map(p => p._id);
    const recentApps = await Application.find({ projectId: { $in: projectIds } })
      .populate("projectId")
      .sort({ updatedAt: -1 })
      .limit(10);

    const feed = recentApps.map(a => ({
      id: a._id,
      studentName: a.studentName,
      studentEmail: a.studentEmail,
      projectTitle: a.projectId?.title || "Unknown",
      status: a.status,
      updatedAt: a.updatedAt || a.createdAt,
      feedbackText: a.feedbackText || null,
      rating: a.rating || null
    }));

    res.status(200).json(feed);
  } catch (err) {
    console.error("Recent activity feed error:", err.message);
    res.status(500).json({ error: "Failed to load recent activity." });
  }
});

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

// =========================================================================
// 🏛️ ROUTE: Get College Students Roster & Calculate Scores (Phase 11)
// =========================================================================
app.get("/api/college/students/:collegeName", authenticateToken, async (req, res) => {
  try {
    const { collegeName } = req.params;
    const collegeUser = await User.findOne({ email: req.user.email });
    if (!collegeUser || collegeUser.userRole !== "college") {
      return res.status(403).json({ error: "Unauthorized access: College role required." });
    }

    const students = await User.find({ userRole: "student", collegeName });
    const studentsWithScores = await Promise.all(students.map(async (student) => {
      const studentApps = await Application.find({ studentEmail: student.email });
      const completedTasks = studentApps.filter(a => a.status === "Completed");
      const ratedTasks = completedTasks.filter(a => a.rating > 0);
      const avgRating = ratedTasks.length > 0
        ? (ratedTasks.reduce((sum, a) => sum + a.rating, 0) / ratedTasks.length)
        : 0;

      // Completeness fields matching student profile
      const completenessFields = [
        student.fullName, student.mobile, student.collegeName,
        student.enrollmentNumber, student.targetSkills, student.bio || student.companyBio, // fallback bio
        student.githubUrl, student.linkedinUrl, student.portfolioUrl
      ];
      const profileCompleteness = completenessFields.filter(Boolean).length / 9;

      const readinessScore = Math.min(
        1000,
        Math.round(200 + (completedTasks.length * 150) + (avgRating * 80) + (profileCompleteness * 100))
      );

      return {
        fullName: student.fullName,
        email: student.email,
        enrollmentNumber: student.enrollmentNumber,
        currentSemester: student.currentSemester || "N/A",
        major: student.major || "N/A",
        targetSkills: student.targetSkills || "",
        completedTasksCount: completedTasks.length,
        avgRating: avgRating.toFixed(1),
        readinessScore,
        isEndorsed: collegeUser.collegeEndorsedStudents.includes(student.email)
      };
    }));

    res.status(200).json(studentsWithScores);
  } catch (err) {
    console.error("Failed to load college students roster:", err.message);
    res.status(500).json({ error: "Failed to load college students roster." });
  }
});

// =========================================================================
// 🏛️ ROUTE: Endorse Student by Professor (Phase 11)
// =========================================================================
app.post("/api/college/endorse", authenticateToken, async (req, res) => {
  try {
    const { studentEmail, endorse } = req.body;
    const collegeUser = await User.findOne({ email: req.user.email });
    if (!collegeUser || collegeUser.userRole !== "college") {
      return res.status(403).json({ error: "College administrator role required." });
    }

    if (endorse) {
      if (!collegeUser.collegeEndorsedStudents.includes(studentEmail)) {
        collegeUser.collegeEndorsedStudents.push(studentEmail);
      }
    } else {
      collegeUser.collegeEndorsedStudents = collegeUser.collegeEndorsedStudents.filter(e => e !== studentEmail);
    }

    await collegeUser.save();
    res.status(200).json({ message: "Student endorsement updated.", collegeEndorsedStudents: collegeUser.collegeEndorsedStudents });
  } catch (err) {
    console.error("Endorsement error:", err.message);
    res.status(500).json({ error: "Failed to update student endorsement." });
  }
});

// =========================================================================
// 🏛️ ROUTE: Get Recruiter Companies with College Statuses (Phase 11)
// =========================================================================
app.get("/api/college/companies", authenticateToken, async (req, res) => {
  try {
    const collegeUser = await User.findOne({ email: req.user.email });
    if (!collegeUser || collegeUser.userRole !== "college") {
      return res.status(403).json({ error: "College administrator role required." });
    }

    const companies = await User.find({ userRole: "company" });
    const formattedCompanies = companies.map(c => {
      let status = "Pending";
      if (collegeUser.collegeApprovedCompanies.includes(c.email)) {
        status = "Approved";
      } else if (collegeUser.collegeBlockedCompanies.includes(c.email)) {
        status = "Blocked";
      }
      return {
        companyName: c.companyName || c.fullName,
        email: c.email,
        mobile: c.mobile,
        industryVertical: c.industryVertical || "Other",
        teamSize: c.teamSize || "1-10",
        status
      };
    });

    res.status(200).json(formattedCompanies);
  } catch (err) {
    console.error("Failed to load companies for college:", err.message);
    res.status(500).json({ error: "Failed to load companies." });
  }
});

// =========================================================================
// 🏛️ ROUTE: Toggle Company Approval (Phase 11)
// =========================================================================
app.post("/api/college/toggle-company", authenticateToken, async (req, res) => {
  try {
    const { companyEmail, status } = req.body; // status: 'Approved' | 'Blocked' | 'Pending'
    const collegeUser = await User.findOne({ email: req.user.email });
    if (!collegeUser || collegeUser.userRole !== "college") {
      return res.status(403).json({ error: "College administrator role required." });
    }

    // Clean up existing lists
    collegeUser.collegeApprovedCompanies = collegeUser.collegeApprovedCompanies.filter(e => e !== companyEmail);
    collegeUser.collegeBlockedCompanies = collegeUser.collegeBlockedCompanies.filter(e => e !== companyEmail);

    if (status === "Approved") {
      collegeUser.collegeApprovedCompanies.push(companyEmail);
    } else if (status === "Blocked") {
      collegeUser.collegeBlockedCompanies.push(companyEmail);
    }

    await collegeUser.save();
    res.status(200).json({ message: "Company recruitment permissions updated." });
  } catch (err) {
    console.error("Toggle company error:", err.message);
    res.status(500).json({ error: "Failed to toggle company permissions." });
  }
});

// =========================================================================
// 🏛️ ROUTE: Bulk Student Importer Simulator (Phase 11)
// =========================================================================
app.post("/api/college/bulk-import", authenticateToken, async (req, res) => {
  try {
    const { students } = req.body; // array: [{ fullName, email, enrollmentNumber }]
    const collegeUser = await User.findOne({ email: req.user.email });
    if (!collegeUser || collegeUser.userRole !== "college") {
      return res.status(403).json({ error: "College administrator role required." });
    }

    let importedCount = 0;
    let duplicateCount = 0;
    let invalidDomainCount = 0;

    for (const student of students) {
      const emailLower = student.email.trim().toLowerCase();
      const academicTLDs = [".edu", ".edu.in", ".ac.in", ".ac.uk", ".edu.au", ".edu.pk", ".edu.bd", ".edu.np", ".edu.lk", ".edu.cn", ".edu.sg", ".edu.my", ".ac.nz", ".ac.jp", ".ac.kr", ".ac.za", ".edu.br", ".edu.mx", ".edu.co", ".edu.ar", ".edu.pe", ".edu.eg", ".edu.ng", ".edu.gh", ".edu.ke", ".edu.et", ".edu.tz", ".ac.ke", ".org.in", ".res.in", ".ernet.in", ".ac.id", ".edu.tr", ".edu.sa", ".edu.ph", ".edu.vn", ".ac.th", ".edu.iq", ".edu.jo", ".ac.il", ".edu.ru", ".edu.ua", ".edu.pl", ".edu.es", ".edu.pt", ".ac.be", ".edu.eu"];
      const privateUniversityDomains = ["lpu.co.in", "cumail.in", "christuniversity.in", "manipal.edu", "snu.edu.in", "bennett.edu.in", "jiit.ac.in", "ddn.upes.ac.in", "galgotiasuniversity.edu.in", "lnmiit.ac.in", "thapar.edu", "bml.edu.in", "rframed.in"];
      const domainPart = emailLower.split("@")[1] || "";
      const isAcademic = academicTLDs.some(d => emailLower.endsWith(d)) || privateUniversityDomains.some(d => domainPart === d || domainPart.endsWith("." + d));
      if (!isAcademic) {
        invalidDomainCount++;
        continue;
      }

      const existingUser = await User.findOne({ email: emailLower });
      if (existingUser) {
        duplicateCount++;
        continue;
      }

      // Seed student user (F20: Secure random passwords)
      const randomPassword = "WM-" + Math.random().toString(36).slice(-8) + "-Secure!";
      const newUser = new User({
        fullName: student.fullName.trim(),
        email: emailLower,
        password: randomPassword,
        collegeName: collegeUser.collegeName,
        enrollmentNumber: student.enrollmentNumber.trim(),
        userRole: "student",
        hasCompletedProfile: true // set true to bypass onboarding preferences
      });

      await newUser.save();
      importedCount++;
    }

    res.status(200).json({
      message: `Bulk onboarding process completed.`,
      importedCount,
      duplicateCount,
      invalidDomainCount
    });
  } catch (err) {
    console.error("Bulk import error:", err.message);
    res.status(500).json({ error: "Failed to complete bulk student onboarding." });
  }
});

// =========================================================================
// 🧠 ROUTE: Suggested Recommended Matches for Student (Phase 13)
// =========================================================================
app.get("/api/projects/recommended", authenticateToken, async (req, res) => {
  try {
    const studentUser = await User.findOne({ email: req.user.email });
    if (!studentUser || studentUser.userRole !== "student") {
      return res.status(403).json({ error: "Student profile context required." });
    }

    // Load college blocking constraints
    let blockedCompanies = [];
    if (studentUser.collegeName) {
      const collegeUser = await User.findOne({ userRole: "college", collegeName: studentUser.collegeName });
      if (collegeUser) {
        blockedCompanies = collegeUser.collegeBlockedCompanies || [];
      }
    }

    const projects = await Project.find({ companyId: { $nin: blockedCompanies } });
    
    // Parse student skills
    const studentSkills = new Set(
      (studentUser.preferredTechStack || [])
        .concat((studentUser.targetSkills || "").split(","))
        .map(s => s.trim().toLowerCase())
        .filter(Boolean)
    );

    const scoredProjects = projects.map(p => {
      const projectSkills = (p.requiredSkills || []).map(s => s.trim().toLowerCase());
      if (projectSkills.length === 0) {
        return { project: p, score: 30 }; // default baseline score
      }

      let matches = 0;
      projectSkills.forEach(s => {
        if (studentSkills.has(s)) matches++;
      });

      const score = Math.round((matches / projectSkills.length) * 100);
      return { project: p, score };
    });

    // Sort by match score descending
    scoredProjects.sort((a, b) => b.score - a.score);

    res.status(200).json(scoredProjects);
  } catch (err) {
    console.error("Recommended match list query error:", err.message);
    res.status(500).json({ error: "Failed to query recommended gig matches." });
  }
});

// =========================================================================
// 💼 ROUTE: Recruiter Extend Placement Offer (Phase 13)
// =========================================================================
app.post("/api/applications/:applicationId/offer-placement", authenticateToken, async (req, res) => {
  try {
    const { offerText } = req.body;
    const recruiterUser = await User.findOne({ email: req.user.email });
    if (!recruiterUser || recruiterUser.userRole !== "company") {
      return res.status(403).json({ error: "Corporate recruiter session context required." });
    }

    const application = await Application.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ error: "Application record not found." });
    }

    const studentUser = await User.findOne({ email: application.studentEmail });
    if (!studentUser) {
      return res.status(404).json({ error: "Target student account not found." });
    }

    // Append to student's offers
    studentUser.companyOffers.push({
      companyEmail: recruiterUser.email,
      companyName: recruiterUser.companyName || recruiterUser.fullName,
      offerText: offerText || "We would love to extend a placement offer to join our corporate tech team!",
      status: "Pending",
      offeredAt: new Date()
    });

    studentUser.placementStatus = "Offered";
    await studentUser.save();

    // Trigger real-time alert via WebSocket
    const studentSocket = global.wsClients.get(studentUser.email);
    if (studentSocket && studentSocket.readyState === ws.OPEN) {
      studentSocket.send(
        JSON.stringify({
          type: "notification",
          statusUpdate: true,
          message: {
            title: "💼 Career Offer Extended!",
            message: `Congratulations! ${recruiterUser.companyName || "A company recruiter"} has extended a job placement offer.`
          }
        })
      );
    }

    const sanitizedStudent = studentUser.toObject();
    delete sanitizedStudent.password;
    delete sanitizedStudent.resetPasswordToken;
    delete sanitizedStudent.resetPasswordExpires;

    res.status(200).json({ message: "Placement offer extended successfully.", studentUser: sanitizedStudent });
  } catch (err) {
    console.error("Offer extension error:", err.message);
    res.status(500).json({ error: "Failed to extend placement job offer." });
  }
});

// =========================================================================
// 💼 ROUTE: Student Resolve Placement Offer (Phase 13)
// =========================================================================
app.post("/api/applications/:applicationId/resolve-offer", authenticateToken, async (req, res) => {
  try {
    const { offerId, status } = req.body; // status: 'Accepted' | 'Rejected'
    if (!offerId || !status) {
      return res.status(400).json({ error: "Offer ID and resolution status are required." });
    }

    const studentUser = await User.findOne({ email: req.user.email });
    if (!studentUser || studentUser.userRole !== "student") {
      return res.status(403).json({ error: "Student authorization context required." });
    }

    const offerIndex = studentUser.companyOffers.findIndex(o => o._id.toString() === offerId);
    if (offerIndex === -1) {
      return res.status(404).json({ error: "Placement offer not found." });
    }

    studentUser.companyOffers[offerIndex].status = status;

    if (status === "Accepted") {
      studentUser.placementStatus = "Placed";
      // Auto reject all other pending offers
      studentUser.companyOffers.forEach((o, i) => {
        if (i !== offerIndex && o.status === "Pending") {
          o.status = "Rejected";
        }
      });
    } else {
      // If student rejects, and has no other pending/accepted offers, revert to Not Placed
      const hasPending = studentUser.companyOffers.some(o => o.status === "Pending");
      const hasAccepted = studentUser.companyOffers.some(o => o.status === "Accepted");
      if (hasAccepted) {
        studentUser.placementStatus = "Placed";
      } else if (hasPending) {
        studentUser.placementStatus = "Offered";
      } else {
        studentUser.placementStatus = "Not Placed";
      }
    }

    await studentUser.save();
    const sanitizedStudent = studentUser.toObject();
    delete sanitizedStudent.password;
    delete sanitizedStudent.resetPasswordToken;
    delete sanitizedStudent.resetPasswordExpires;

    res.status(200).json({ message: `Offer has been ${status.toLowerCase()}.`, studentUser: sanitizedStudent });
  } catch (err) {
    console.error("Resolve offer error:", err.message);
    res.status(500).json({ error: "Failed to resolve placement offer." });
  }
});

app.post("/api/applications/:applicationId/update-pipeline", authenticateToken, async (req, res) => {
  try {
    const { status } = req.body; // Applied, Shortlisted, Interviewing, Offered, Placed
    if (!status) {
      return res.status(400).json({ error: "Target pipeline status required." });
    }

    const application = await Application.findById(req.params.applicationId).populate("projectId");
    if (!application) {
      return res.status(404).json({ error: "Application not found." });
    }

    if (!application.projectId) {
      return res.status(400).json({ error: "Underlying project details missing." });
    }

    // Verify company owner status
    if (req.user.email !== application.projectId.companyId && req.user.userRole !== "admin") {
      return res.status(403).json({ error: "Unauthorized: Only the project owner can update candidate pipelines." });
    }

    // Set matching application status
    if (status === "Offered") {
      application.status = "Approved"; // Keep consistent with application states
    }
    
    application.pipelineStage = status; // new field for visual Kanban tracking
    await application.save();

    res.status(200).json({ message: "Placement pipeline stage updated.", application });
  } catch (err) {
    res.status(500).json({ error: "Failed to update pipeline stage." });
  }
});

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