const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const jwt = require('jsonwebtoken');
const swot = require('swot-node');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendWebhookNotification } = require('../utils/webhook');
const { verifyTurnstile } = require('../utils/verifyTurnstile');


const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

const generateTokens = (userId, email, role) => {
  const accessToken = jwt.sign(
    { userId, email, userRole: role },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  const refreshToken = jwt.sign(
    { userId, email, userRole: role },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  return { accessToken, refreshToken };
};

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

const sendEmailOtp = async (toEmail, otp, mobileOtp = null) => {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {

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
        from: process.env.EMAIL_FROM || "workMitra <noreply@workmitra.me>",
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
            ${mobileOtp ? `
            <p style="margin-top: 20px;">For your convenience, your Mobile verification code is:</p>
            <div style="font-size: 24px; font-weight: bold; text-align: center; padding: 15px; background: #e0e7ff; border-radius: 8px; letter-spacing: 4px; margin: 10px 0; color: #3730a3;">
              ${mobileOtp}
            </div>
            ` : ""}
            <p style="color: #6b7280; font-size: 11px; text-align: center; margin-top: 30px;">This verification code is valid for 10 minutes.</p>
          </div>
        `
      })
    });

    const data = await response.json();
    if (response.ok) {

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

// SMS OTP removed — single email OTP is used for all verifications.
// Twilio trial restriction (verified numbers only) made this unusable at scale.

const sendResetPasswordEmail = async (toEmail, resetLink) => {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {

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
        from: process.env.EMAIL_FROM || "workMitra <noreply@workmitra.me>",
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

const register = async (req, res, next) => {
  try {
    const { fullName, companyName, email, password, userRole, mobile, collegeName, enrollmentNumber, departmentName, turnstileToken } = req.body;

    // Verify Cloudflare Turnstile token
    const isTokenValid = await verifyTurnstile(turnstileToken, req.realIP);
    if (!isTokenValid) {
      return res.status(400).json({ error: "Security check expired — it refreshes automatically. Please wait a moment and try again." });
    }

    if (!email || !password || !mobile || !userRole) {
      return res.status(400).json({ error: "Email, Password, Mobile Number, and User Role are required parameters." });
    }

    if (!["student", "company", "college", "faculty"].includes(userRole)) {
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

      // 🔒 ENFORCE ROLL NO UNIQUENESS PER COLLEGE
      const existingStudent = await User.findOne({ 
        collegeName, 
        enrollmentNumber, 
        userRole: "student" 
      });
      if (existingStudent) {
        return res.status(400).json({ error: `Enrollment number ${enrollmentNumber} is already registered at ${collegeName}.` });
      }

      const isAcademic = await swot.isAcademic(email);
      if (!isAcademic) {
        const academicTLDFallback = [".edu", ".edu.in", ".ac.in", ".ac.uk", ".ac.jp", ".ac.kr", ".ac.nz", ".ac.za", ".ac.id", ".ac.th", ".ac.il", ".ac.ke", ".ac.be", ".org.in", ".res.in", ".ernet.in"];
        const domainPart = email.toLowerCase().split("@")[1] || "";
        const matchesFallback = academicTLDFallback.some(d => domainPart.endsWith(d));
        if (!matchesFallback) {
          return res.status(400).json({ error: "Please use an official academic email address from your university. If your domain is not recognized, contact support." });
        }
      }
    }

    if (userRole === "company" && !companyName) {
      return res.status(400).json({ error: "Company Name is required." });
    }

    if (userRole === "college" || userRole === "faculty") {
      if (!fullName || !collegeName || !departmentName) {
        return res.status(400).json({ error: "Full Name, University Name, and Department are required for academic staff." });
      }
      // Faculty post projects students apply to — hold them to the same
      // academic-email requirement as students to stop fake professor signups.
      if (userRole === "faculty") {
        const isAcademic = await swot.isAcademic(email);
        if (!isAcademic) {
          const academicTLDFallback = [".edu", ".edu.in", ".ac.in", ".ac.uk", ".ac.jp", ".ac.kr", ".ac.nz", ".ac.za", ".ac.id", ".ac.th", ".ac.il", ".ac.ke", ".ac.be", ".org.in", ".res.in", ".ernet.in"];
          const domainPart = email.toLowerCase().split("@")[1] || "";
          const matchesFallback = academicTLDFallback.some(d => domainPart.endsWith(d));
          if (!matchesFallback) {
            return res.status(400).json({ error: "Please use an official academic email address from your university. If your domain is not recognized, contact support." });
          }
        }
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered." });
    }

    if (mobile) {
      const existingMobile = await User.findOne({ mobile });
      if (existingMobile) {
        return res.status(400).json({ error: "Mobile number already registered." });
      }
    }

    // Single email OTP — no SMS required, works for any user on any plan
    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const emailSuccess = await sendEmailOtp(email, emailOtp);
    if (!emailSuccess) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEVELOPMENT] Resend not configured. Bypassed OTP dispatch. Generated OTP for ${email}: ${emailOtp}`);
      } else {
        return res.status(400).json({ error: "Failed to deliver OTP. Please check your email address and try again." });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const registrationData = {
      fullName,
      companyName,
      email,
      password: hashedPassword,
      userRole,
      mobile,
      collegeName: ["student", "college", "faculty"].includes(userRole) ? collegeName : null,
      departmentName: ["college", "faculty"].includes(userRole) ? departmentName : null,
      enrollmentNumber: userRole === "student" ? enrollmentNumber : null
    };

    await PendingUser.findOneAndDelete({ email });
    const pendingUser = new PendingUser({
      email,
      emailOtp,
      mobileOtp: emailOtp, // kept for schema compat — same value, verified as one code
      registrationData
    });
    await pendingUser.save();

    res.status(200).json({
      message: "OTP sent successfully.",
      email
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    // Accept either emailOtp or otp field for frontend compatibility
  // eslint-disable-next-line no-unused-vars
    const { email, emailOtp, otp, mobileOtp } = req.body;
    const submittedOtp = emailOtp || otp;

    if (!email || !submittedOtp) {
      return res.status(400).json({ error: "Email and verification code are required." });
    }

    const pending = await PendingUser.findOne({ email });
    if (!pending) {
      return res.status(400).json({ error: "Verification session expired or invalid. Please try registering again." });
    }

    // Accept OTP if it matches the email OTP (mobileOtp is same value for backward compat)
    if (pending.emailOtp !== submittedOtp && pending.mobileOtp !== submittedOtp) {
      return res.status(400).json({ error: "Invalid verification code. Please check your email." });
    }

    const { fullName, companyName, password, userRole, mobile, collegeName, enrollmentNumber, departmentName } = pending.registrationData;

    const newUser = new User({
      fullName,
      companyName,
      email,
      password,
      mobile,
      collegeName: ["student", "college", "faculty"].includes(userRole) ? collegeName : null,
      departmentName: ["college", "faculty"].includes(userRole) ? departmentName : null,
      enrollmentNumber: userRole === "student" ? enrollmentNumber : null,
      userRole
    });

    await newUser.save();
    await PendingUser.findOneAndDelete({ email });

    // Notify via webhook asynchronously
    sendWebhookNotification(`🚀 New user registered: ${newUser.email} (${newUser.userRole})`);

    const { accessToken, refreshToken } = generateTokens(newUser._id.toString(), newUser.email, newUser.userRole);
    
    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      message: "Registration successful!",
      accessToken,
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
    next(err);
  }
};

const login = async (req, res, next) => {
    try {
        const { email, password, portalRole, turnstileToken } = req.body;

        // Verify Cloudflare Turnstile token
        const isTokenValid = await verifyTurnstile(turnstileToken, req.realIP);
        if (!isTokenValid) {
            return res.status(400).json({ error: "Security check expired — it refreshes automatically. Please wait a moment and try again." });
        }

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are mandatory parameters." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "Invalid email or account password." });
        }

        // Allow admins to login through any portal to access their dashboard
        if (portalRole && user.userRole !== portalRole && user.userRole !== "admin") {
            return res.status(403).json({ error: `Access Denied: This account belongs to a ${user.userRole}. Please login through the correct portal.` });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            // Same status + message as the "user not found" branch above so an
            // attacker cannot enumerate which emails are registered.
            return res.status(401).json({ error: "Invalid email or account password." });
        }

        const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.email, user.userRole);

        user.refreshToken = refreshToken;
        await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

        res.status(200).json({ 
            message: "Success",
            accessToken,
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
        console.error(err);
        next(err);
    }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: "If an account exists with this email, a reset link has been sent.", email });
    }

    const token = crypto.randomBytes(20).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      console.error("🚨 Configuration Error: FRONTEND_URL environment variable is missing.");
      return next(new Error("Server configuration error. Cannot generate reset link."));
    }
    const resetLink = `${frontendUrl}/reset-password/${token}`;

    const emailSuccess = await sendResetPasswordEmail(user.email, resetLink);
    if (!emailSuccess) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[DEVELOPMENT] Resend delivery failed. Generated reset link for local testing: ${resetLink}`);
      } else {
        return res.status(502).json({ error: "Failed to dispatch password recovery email. Please try again later." });
      }
    }

    const responsePayload = {
      message: "Reset token generated successfully.",
      email: user.email
    };
    if (process.env.NODE_ENV !== "production") {
      responsePayload.resetLink = resetLink;
    }
    res.status(200).json(responsePayload);
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "New password is required." });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Password reset token is invalid or has expired." });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const logout = async (req, res, _next) => {
  const token = req.cookies.refreshToken;
  if (token) {
    await User.findOneAndUpdate({ refreshToken: token }, { refreshToken: null });
  }
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

const me = async (req, res, next) => {
  try {
    const User = require("../models/User");
    const user = await User.findOne({ email: req.user.email }).select("-password -__v");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) { console.error(err);
    next(err);
  }
};

// =========================================================================
// 👤 Get user profile by email (used by student profiles, recruiter views)
// =========================================================================
const getUserByEmail = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findOne({ email: req.params.email }, '-password');
    if (!user) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }
    // Restrict private profiles — owners and company/admin roles can always view
    if (user.isProfilePrivate && req.user.email !== req.params.email && req.user.userRole !== 'company' && req.user.userRole !== 'admin') {
      return res.status(403).json({ error: 'This profile has been marked private by the student.' });
    }
    const userObj = user.toObject();
    let isEndorsed = false;
    if (user.collegeName) {
      const collegeAdmin = await User.findOne({ userRole: 'college', collegeName: user.collegeName });
      if (collegeAdmin && collegeAdmin.collegeEndorsedStudents) {
        isEndorsed = collegeAdmin.collegeEndorsedStudents.includes(user.email);
      }
    }
    userObj.isEndorsed = isEndorsed;
    res.status(200).json(userObj);
  } catch (err) { console.error(err);
    next(err);
  }
};

// =========================================================================
// 🔗 Get user profile by vanity username
// =========================================================================
const getVanityProfile = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findOne({ vanityUsername: req.params.username }, '-password');
    if (!user) {
      return res.status(404).json({ error: 'Student profile username not found.' });
    }
    if (user.isProfilePrivate && req.user.email !== user.email && req.user.userRole !== 'company' && req.user.userRole !== 'admin') {
      return res.status(403).json({ error: 'This profile has been marked private by the student.' });
    }
    const userObj = user.toObject();
    let isEndorsed = false;
    if (user.collegeName) {
      const collegeAdmin = await User.findOne({ userRole: 'college', collegeName: user.collegeName });
      if (collegeAdmin && collegeAdmin.collegeEndorsedStudents) {
        isEndorsed = collegeAdmin.collegeEndorsedStudents.includes(user.email);
      }
    }
    userObj.isEndorsed = isEndorsed;
    res.status(200).json(userObj);
  } catch (err) { console.error(err);
    next(err);
  }
};

// =========================================================================
// 🔒 Lock onboarding profile flag (so the form won't re-appear on next login)
// =========================================================================
const completeProfile = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'User email parameter is required.' });
    }
    if (req.user.email !== email) {
      return res.status(403).json({ error: 'Unauthorized profile update request.' });
    }
    await User.findOneAndUpdate({ email }, { hasCompletedProfile: true });
    res.status(200).json({ message: 'Profile onboarding flag locked successfully.' });
  } catch (err) { console.error(err);
    next(err);
  }
};

// =========================================================================
// ⚙️ Update company profile settings
// =========================================================================
const updateCompanyProfile = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const { companyBio, companyLogoUrl, companyWebsite, companyLinkedin, industryVertical, teamSize, defaultComplexity, autoApproveApplications } = req.body;
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }
    if (user.userRole !== 'company') {
      return res.status(403).json({ error: 'Only company accounts can update company profiles.' });
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
    res.status(200).json({ message: 'Company profile updated successfully.', user: sanitizedUser });
  } catch (err) {
    console.error('Company profile update error:', err.message);
    next(err);
  }
};

// =========================================================================
// ⚙️ Update faculty profile settings
// =========================================================================
const updateFacultyProfile = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const { fullName, departmentName, mobile, bio, website, linkedinUrl } = req.body;
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }
    if (user.userRole !== 'faculty') {
      return res.status(403).json({ error: 'Only faculty accounts can update faculty profiles.' });
    }
    if (fullName !== undefined) user.fullName = fullName;
    if (departmentName !== undefined) user.departmentName = departmentName;
    if (mobile !== undefined) user.mobile = mobile;
    if (bio !== undefined) user.bio = bio;
    if (website !== undefined) user.website = website;
    if (linkedinUrl !== undefined) user.linkedinUrl = linkedinUrl;
    
    await user.save();
    const sanitizedUser = user.toObject();
    delete sanitizedUser.password;
    res.status(200).json({ message: 'Faculty profile updated successfully.', user: sanitizedUser });
  } catch (err) {
    console.error('Faculty profile update error:', err.message);
    next(err);
  }
};


const refreshAccessToken = async (req, res, _next) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: 'No refresh token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ error: 'Invalid refresh token.' });
    }

    // Disable strict refresh token rotation to support concurrent multi-tab refreshes
    const { accessToken } = generateTokens(user._id.toString(), user.email, user.userRole);

    res.json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: 'Expired or invalid refresh token.' });
  }
};

// =========================================================================
// 🔁 Resend registration OTP — reuses the pending registration created by
// register(). Issues a fresh code so an undelivered email doesn't force the
// user to abandon signup and re-enter the whole form.
// =========================================================================
const resendRegistrationOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const pending = await PendingUser.findOne({ email });
    if (!pending) {
      return res.status(400).json({ error: "Verification session expired or invalid. Please try registering again." });
    }

    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const emailSuccess = await sendEmailOtp(email, emailOtp);
    if (!emailSuccess) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEVELOPMENT] Resend not configured. Bypassed OTP dispatch. Regenerated OTP for ${email}: ${emailOtp}`);
      } else {
        return res.status(400).json({ error: "Failed to deliver OTP. Please check your email address and try again." });
      }
    }

    pending.emailOtp = emailOtp;
    pending.mobileOtp = emailOtp;
    // Reset the 10-minute TTL so the fresh code doesn't expire early
    pending.createdAt = new Date();
    await pending.save();

    res.status(200).json({ message: "A new verification code has been sent." });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const sendContactEmail = async (req, res, next) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn('[contact] RESEND_API_KEY not set — contact form submission dropped.');
      return res.status(200).json({ message: 'Message received.' });
    }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: 'WorkMitra Support <support@workmitra.me>',
        to: ['adminWorkMitra@gmail.com'],
        subject: `[Contact] ${name} — ${email}`,
        html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, '<br/>')}</p>`,
      }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      console.error('[contact] Resend error:', data);
      return res.status(500).json({ error: 'Failed to send message. Please try again.' });
    }
    res.status(200).json({ message: 'Your message has been sent. We will reply within 24 hours.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  refreshAccessToken,
  register,
  verifyOtp,
  resendRegistrationOtp,
  login,
  forgotPassword,
  resetPassword,
  logout,
  me,
  getUserByEmail,
  getVanityProfile,
  completeProfile,
  updateCompanyProfile,
  updateFacultyProfile,
  sendContactEmail,
};

