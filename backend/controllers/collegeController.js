const User = require('../models/User');
const Project = require('../models/Project');
const PendingUser = require('../models/PendingUser');
const Application = require('../models/Application');

const getInstitutionName = (collegeUser) => collegeUser.collegeName || collegeUser.companyName;

exports.getStudents = async (req, res, next) => {
  try {
    const collegeUser = await User.findOne({ email: req.user.email });
    if (!collegeUser || collegeUser.userRole !== "college") {
      return res.status(403).json({ error: "Unauthorized access: College role required." });
    }

    const institutionName = getInstitutionName(collegeUser);
    if (!institutionName) {
      return res.status(400).json({ error: "College institution name is not configured for this account." });
    }

    const students = await User.find({ userRole: "student", collegeName: institutionName }).select("-password");
    
    // Merge application stats
    const studentStats = await Promise.all(students.map(async (student) => {
      const apps = await Application.find({ studentEmail: student.email });
      return {
        ...student.toObject(),
        applicationsCount: apps.length,
        hiredCount: apps.filter(a => ["Approved", "Submitted", "Completed"].includes(a.status)).length
      };
    }));

    res.status(200).json(studentStats);
  } catch (err) {
    console.error("Failed to fetch college students:", err);
    next(err);
  }
};

exports.endorseStudent = async (req, res, next) => {
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
    res.status(200).json({ message: `Student ${endorse ? 'endorsed' : 'un-endorsed'} successfully.`, endorsedList: collegeUser.collegeEndorsedStudents });
  } catch (err) { console.error(err);
    next(err);
  }
};

exports.getCompanies = async (req, res, next) => {
  try {
    const collegeUser = await User.findOne({ email: req.user.email });
    if (!collegeUser || collegeUser.userRole !== "college") {
      return res.status(403).json({ error: "College administrator role required." });
    }

    const institutionName = getInstitutionName(collegeUser);

    const allCompanies = await User.find({ userRole: "company" }).select("-password");
    
    const companyStats = await Promise.all(allCompanies.map(async (company) => {
  // eslint-disable-next-line no-unused-vars
      const companyIdStr = company._id.toString();
      const projects = await Project.find({ companyId: company._id });
      
      let hiredFromCollege = 0;
      
      // Find all project IDs for this company
      const projectIds = projects.map(p => p._id);
      const apps = await Application.find({ 
        projectId: { $in: projectIds }, 
        status: { $in: ["Approved", "Submitted", "Completed"] }
      });
      
      const studentEmails = apps.map(app => app.studentEmail);
      hiredFromCollege = await User.countDocuments({
        email: { $in: studentEmails },
        collegeName: institutionName
      });

      return {
        ...company.toObject(),
        projectsPosted: projects.length,
        hiredFromCollege
      };
    }));

    res.status(200).json({
      companies: companyStats,
      approved: collegeUser.collegeApprovedCompanies || [],
      blocked: collegeUser.collegeBlockedCompanies || []
    });
  } catch (err) { console.error(err);
    next(err);
  }
};

exports.toggleCompanyStatus = async (req, res, next) => {
  try {
    const { companyEmail, status } = req.body; 
    const collegeUser = await User.findOne({ email: req.user.email });
    if (!collegeUser || collegeUser.userRole !== "college") {
      return res.status(403).json({ error: "College administrator role required." });
    }

    collegeUser.collegeApprovedCompanies = collegeUser.collegeApprovedCompanies.filter(e => e !== companyEmail);
    collegeUser.collegeBlockedCompanies = collegeUser.collegeBlockedCompanies.filter(e => e !== companyEmail);

    if (status === "Approved") collegeUser.collegeApprovedCompanies.push(companyEmail);
    if (status === "Blocked") collegeUser.collegeBlockedCompanies.push(companyEmail);

    await collegeUser.save();
    res.status(200).json({ message: `Company status updated to ${status}` });
  } catch (err) { console.error(err);
    next(err);
  }
};

exports.bulkImportStudents = async (req, res, next) => {
  try {
    const { students } = req.body; 
    const collegeUser = await User.findOne({ email: req.user.email });
    if (!collegeUser || collegeUser.userRole !== "college") {
      return res.status(403).json({ error: "College administrator role required." });
    }

    const institutionName = getInstitutionName(collegeUser);
    if (!institutionName) {
      return res.status(400).json({ error: "College institution name is not configured for this account." });
    }

    let importedCount = 0;
    let failedCount = 0;
    let errors = [];

    for (const student of students) {
      if (!student.email || !student.fullName || !student.enrollmentNumber) {
        failedCount++;
        errors.push({ email: student.email, reason: "Missing required fields." });
        continue;
      }
      
      const existingUser = await User.findOne({ email: student.email });
      if (existingUser) {
        failedCount++;
        errors.push({ email: student.email, reason: "Email already registered." });
        continue;
      }

      const existingRoll = await User.findOne({ collegeName: institutionName, enrollmentNumber: student.enrollmentNumber, userRole: "student" });
      if (existingRoll) {
        failedCount++;
        errors.push({ email: student.email, reason: "Enrollment number already exists in this college." });
        continue;
      }

      const dummyPassword = Math.random().toString(36).slice(-10);
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(dummyPassword, salt);

      const newUser = new User({
        fullName: student.fullName,
        email: student.email,
        password: hashedPassword,
        userRole: "student",
        collegeName: institutionName,
        enrollmentNumber: student.enrollmentNumber
      });
      
      await newUser.save();
      importedCount++;
    }

    res.status(200).json({ 
      message: `Bulk import completed. Imported: ${importedCount}, Failed: ${failedCount}`,
      importedCount,
      failedCount,
      errors 
    });
  } catch (err) { console.error(err);
    next(err);
  }
};
