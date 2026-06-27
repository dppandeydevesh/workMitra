const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Models Loading
const User = require('./models/User');
const Project = require('./models/Project');
const Application = require('./models/Application');
const CompanyProfile = require('./models/CompanyProfile');
const PendingUser = require('./models/PendingUser'); // 🔑 न्यू इम्पोर्ट: पेंडिंग यूजर मॉडल

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Setup
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());

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

const sendEmailOtp = async (toEmail, otp) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.log(`⚠️ Email SMTP credentials missing. Email OTP [${otp}] simulation logged.`);
    return false;
  }

  try {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    const mailOptions = {
      from: `"workMitra Portal" <${emailUser}>`,
      to: toEmail,
      subject: "workMitra Sign Up Verification OTP Code",
      text: `Your workMitra email verification code is: ${otp}. This code expires in 10 minutes.`,
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
    };

    await transporter.sendMail(mailOptions);
    console.log(`✉️ Live Email OTP sent successfully to ${toEmail}`);
    return true;
  } catch (err) {
    console.error("❌ Failed to deliver live Email OTP via Nodemailer:", err.message);
    return false;
  }
};

// =========================================================================
// 📝 Route: Register Step 1 - Initiate Registration & Generate OTPs
// =========================================================================
app.post("/api/auth/register", async (req, res) => {
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

    res.status(200).json({
      message: "OTP sent successfully to both email and mobile.",
      email,
      emailOtpSimulated: emailOtp,
      mobileOtpSimulated: mobileOtp
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    res.status(201).json({
      message: "Registration successful!",
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
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 🔑 Route: Core Verification Sign In (With Onboarding Status Flag)
// =========================================================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are mandatory parameters." });
        }

        const user = await User.findOne({ email });
        if (!user || user.password !== password) {
            return res.status(400).json({ error: "Invalid email or account password." });
        }

        res.status(200).json({ 
            message: "Success", 
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
        res.status(500).json({ error: err.message });
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

    // In local dev, we return the reset link directly in the response payload
    const resetLink = `http://localhost:5173/reset-password/${token}`;
    
    res.status(200).json({
      message: "Reset token generated successfully.",
      resetLink,
      email: user.email
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
app.post("/api/profile/company", async (req, res) => {
  try {
    const newProfile = new CompanyProfile(req.body);
    await newProfile.save();
    res.status(201).json({ message: "Company profile created seamlessly!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 🚀 UPDATED GLOBAL ROUTE: Fetch Deployed Company Projects for Marketplace
// =========================================================================
app.get("/api/projects/all", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 🔒 Route: Lock Onboarding Flag (Form won't reappear)
// =========================================================================
app.post("/api/auth/complete-profile", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "User email parameter is required." });
    }
    
    await User.findOneAndUpdate({ email }, { hasCompletedProfile: true });
    res.status(200).json({ message: "Profile onboarding flag locked successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 📥 ROUTE: Submit a new Project Application
// =========================================================================
app.post("/api/applications/apply", async (req, res) => {
  try {
    const { projectId, studentEmail, studentName } = req.body;

    if (!projectId || !studentEmail || !studentName) {
      return res.status(400).json({ error: "Missing required application parameters." });
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
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 🔍 ROUTE: Fetch all project IDs a student has applied to
// =========================================================================
app.get("/api/applications/student/:email", async (req, res) => {
  try {
    const apps = await Application.find({ studentEmail: req.params.email });
    const appliedProjectIds = apps.map(app => app.projectId.toString());
    res.status(200).json(appliedProjectIds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// ➕ ROUTE: Deploy a new Project Stack (Phase 4 Entry Portal)
// =========================================================================
app.post("/api/projects", async (req, res) => {
  try {
    const { companyId, title, description, budget } = req.body;
    
    if (!companyId || !title || !description || !budget) {
      return res.status(400).json({ error: "Missing mandatory project field metrics." });
    }

    const project = new Project(req.body);
    await project.save();
    
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 📂 ROUTE: Get All Projects posted by a specific Company
// =========================================================================
app.get("/api/projects/company/:email", async (req, res) => {
  try {
    const companyProjects = await Project.find({ companyId: req.params.email }).sort({ createdAt: -1 });
    res.status(200).json(companyProjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 👨‍🎓 ROUTE: Fetch Applicants for a specific Project with Skill Matching
// =========================================================================
app.get("/api/projects/:projectId/applicants", async (req, res) => {
  try {
    const { projectId } = req.params;

    const applications = await Application.find({ projectId });
    
    if (applications.length === 0) {
      return res.status(200).json([]);
    }

    const currentProject = await Project.findById(projectId);
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
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 🏢 ROUTE: Fetch all applications for a specific company's projects
// =========================================================================
app.get("/api/applications/company/:email", async (req, res) => {
  try {
    const { email } = req.params;

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
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 🔎 ROUTE: Fetch full student application details with populated project metrics
// =========================================================================
app.get("/api/applications/student-details/:email", async (req, res) => {
  try {
    const apps = await Application.find({ studentEmail: req.params.email })
      .populate("projectId")
      .sort({ appliedAt: -1 });
    res.status(200).json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 🔒 ROUTE: Accept or Reject an Application (Update Status)
// =========================================================================
app.post("/api/applications/:applicationId/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status state transition." });
    }
    const updatedApp = await Application.findByIdAndUpdate(
      req.params.applicationId,
      { status },
      { new: true }
    );
    res.status(200).json({ message: `Application status updated to ${status}.`, application: updatedApp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 📤 ROUTE: Submit completed work for review
// =========================================================================
app.post("/api/applications/:applicationId/submit", async (req, res) => {
  try {
    const { submissionLink, submissionText } = req.body;
    if (!submissionLink || !submissionText) {
      return res.status(400).json({ error: "Submission Link and Explanatory Notes are required." });
    }
    const updatedApp = await Application.findByIdAndUpdate(
      req.params.applicationId,
      {
        status: "Submitted",
        submissionLink,
        submissionText,
        submittedAt: new Date()
      },
      { new: true }
    );
    res.status(200).json({ message: "Work submitted successfully for company review.", application: updatedApp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// ✅ ROUTE: Approve & Complete task submission
// =========================================================================
app.post("/api/applications/:applicationId/complete", async (req, res) => {
  try {
    const { feedbackText } = req.body;
    const updatedApp = await Application.findByIdAndUpdate(
      req.params.applicationId,
      {
        status: "Completed",
        feedbackText: feedbackText || "No feedback specified."
      },
      { new: true }
    );
    res.status(200).json({ message: "Work approved and marked as Completed.", application: updatedApp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 🏢 ROUTE: Save or update student resume details
// =========================================================================
app.post("/api/profile/resume", async (req, res) => {
  try {
    const { email, resumeUrl, resumeText } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { resumeUrl, resumeText },
      { new: true }
    );
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
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 🧠 ROUTE: Review CV text using Google Gemini 1.5 Flash
// =========================================================================
app.post("/api/ai/review-cv", async (req, res) => {
  try {
    const { email, resumeText } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
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
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 🔎 ROUTE: Get a User's profile details (excluding password)
// =========================================================================
app.get("/api/auth/user/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }, "-password");
    if (!user) {
      return res.status(404).json({ error: "Student profile not found." });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 📝 ROUTE: Save Student Profile updates
// =========================================================================
app.put("/api/profile/student/:email", async (req, res) => {
  try {
    const { email } = req.params;
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
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// ✏️ ROUTE: Update project details
// =========================================================================
app.put("/api/projects/:projectId", async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.projectId, req.body, { new: true });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 🗑️ ROUTE: Delete project and its corresponding applications
// =========================================================================
app.delete("/api/projects/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findByIdAndDelete(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    // Cascade delete applications
    await Application.deleteMany({ projectId });
    res.status(200).json({ message: "Project and associated applications deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
  });
}

app.listen(PORT, () => {
    console.log(`🚀 Server running smoothly on http://localhost:${PORT}`);
});