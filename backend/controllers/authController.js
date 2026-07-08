const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const jwt = require('jsonwebtoken');
const swot = require('swot-node');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendWebhookNotification } = require('../utils/webhook');
const { verifyTurnstile } = require('../utils/verifyTurnstile');

const JWT_SECRET = process.env.JWT_SECRET;

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

const register = async (req, res) => {
  try {
    const { fullName, companyName, email, password, userRole, mobile, collegeName, enrollmentNumber, departmentName, turnstileToken } = req.body;

    // Verify Cloudflare Turnstile token
    const isTokenValid = await verifyTurnstile(turnstileToken, req.realIP);
    if (!isTokenValid) {
      return res.status(400).json({ error: "Security verification failed. Please try again." });
    }

    if (!email || !password || !mobile || !userRole) {
      return res.status(400).json({ error: "Email, Password, Mobile Number, and User Role are required parameters." });
    }

    if (!["student", "company", "college"].includes(userRole)) {
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

    if (userRole === "college") {
      if (!fullName || !collegeName || !departmentName) {
        return res.status(400).json({ error: "Full Name, University Name, and Department are required for college administrators." });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered." });
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
      collegeName: userRole === "student" || userRole === "college" ? collegeName : null,
      departmentName: userRole === "college" ? departmentName : null,
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
    res.status(500).json({ error: "Failed to initiate registration." });
  }
};

const verifyOtp = async (req, res) => {
  try {
    // Accept either emailOtp or otp field for frontend compatibility
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
      collegeName: userRole === "student" || userRole === "college" ? collegeName : null,
      departmentName: userRole === "college" ? departmentName : null,
      enrollmentNumber: userRole === "student" ? enrollmentNumber : null,
      userRole
    });

    await newUser.save();
    await PendingUser.findOneAndDelete({ email });

    // Notify via webhook asynchronously
    sendWebhookNotification(`🚀 New user registered: ${newUser.email} (${newUser.userRole})`);

    const token = jwt.sign(
      { userId: newUser._id.toString(), email: newUser.email, userRole: newUser.userRole },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

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
    console.error(err);
    res.status(500).json({ error: `Failed to verify registration: ${err.message}` });
  }
};

const login = async (req, res) => {
    try {
        const { email, password, portalRole, turnstileToken } = req.body;

        // Verify Cloudflare Turnstile token
        const isTokenValid = await verifyTurnstile(turnstileToken, req.realIP);
        if (!isTokenValid) {
            return res.status(400).json({ error: "Security verification failed. Please try again." });
        }

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are mandatory parameters." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid email or account password." });
        }

        // Allow admins to login through any portal to access their dashboard
        if (portalRole && user.userRole !== portalRole && user.userRole !== "admin") {
            return res.status(403).json({ error: `Access Denied: This account belongs to a ${user.userRole}. Please login through the correct portal.` });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid email or account password." });
        }

        const token = jwt.sign(
          { userId: user._id.toString(), email: user.email, userRole: user.userRole },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

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
        console.error(err);
        res.status(500).json({ error: "Failed to log in." });
    }
};

const forgotPassword = async (req, res) => {
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

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      console.error("🚨 Configuration Error: FRONTEND_URL environment variable is missing.");
      return res.status(500).json({ error: "Server configuration error. Cannot generate reset link." });
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
    console.error(err);
    res.status(500).json({ error: `Failed to process forgot password request: ${err.message}` });
  }
};

const resetPassword = async (req, res) => {
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

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

const me = async (req, res) => {
  try {
    const User = require("../models/User");
    const user = await User.findOne({ email: req.user.email }).select("-password -__v");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  register,
  verifyOtp,
  login,
  forgotPassword,
  resetPassword,
  logout,
  me
};
