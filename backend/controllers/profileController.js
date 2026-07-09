  // eslint-disable-next-line no-unused-vars
const fsSync = require('fs');
const pdfParse = require('pdf-parse');

const User = require('../models/User');
const { supabase } = require('../utils/supabase');
const Application = require('../models/Application');
const Project = require('../models/Project');

exports.routeHandler0 = async (req, res) => {
  try {
    // Validate request ownership
    if (req.user.userRole !== "company") {
      return res.status(403).json({ error: "Access denied. Only recruiters can update company profiles." });
    }
    const profileData = { ...req.body, companyEmail: req.user.email };
    const profile = await User.findOneAndUpdate(
      { email: req.user.email },
      profileData,
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json({ message: "Company profile saved successfully!", profile });
  } catch (err) { console.error(err);
    res.status(500).json({ error: "Failed to save company profile." });
  }
};

exports.routeHandler1 = async (req, res) => {
  try {
    const profile = await User.findOne({ email: req.user.email }).select("-password");
    if (!profile) {
      return res.status(404).json({ error: "Company profile not found." });
    }
    res.status(200).json(profile);
  } catch (err) { console.error(err);
    res.status(500).json({ error: "Failed to retrieve company profile." });
  }
};

exports.routeHandler2 = async (req, res) => {
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
  } catch (err) { console.error(err);
    res.status(500).json({ error: "Failed to update candidate resume details." });
  }
};

exports.routeHandler3 = async (req, res) => {
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

    // Read the PDF from memory buffer
    const fileBuffer = req.file.buffer;
    const pdfData = await pdfParse(fileBuffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ error: "Could not extract text from the uploaded PDF. Please make sure the PDF has selectable text." });
    }

    const filename = `${Date.now()}-${req.file.originalname}`;
    
    if (supabase) {
  // eslint-disable-next-line no-unused-vars
      const { data, error } = await supabase.storage
        .from('resumes')
        .upload(filename, fileBuffer, {
          contentType: req.file.mimetype,
          upsert: true
        });

      if (error) {
        throw new Error(`Supabase upload failed: ${error.message}`);
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ error: "Storage service is offline. File upload failed." });
      } else {
        const fs = require('fs');
        const path = require('path');
        const dir = path.join(__dirname, '../uploads/resumes');
        if (!fs.existsSync(dir)){
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(path.join(dir, filename), fileBuffer);
        console.warn("⚠️ Warning: Supabase Storage is not configured. Bypassed to local disk storage in development.");
      }
    }

    const fileUrl = `/api/files/resumes/${filename}`;

    // Save extracted text and local file URL to user document
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { resumeText: extractedText, resumeUrl: fileUrl },
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
};

exports.routeHandler4 = async (req, res) => {
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
  } catch (err) { console.error(err);
    res.status(500).json({ error: "Failed to submit vouch endorsement." });
  }
};

exports.routeHandler5 = async (req, res) => {
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
  } catch (err) { console.error(err);
    res.status(500).json({ error: "Failed to update profile parameters." });
  }
};

