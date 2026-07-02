const User = require('../models/User');
const Project = require('../models/Project');
const PendingUser = require('../models/PendingUser');
const Application = require('../models/Application');

exports.getStudents = async (req, res) => {
  try {
    const { collegeName } = req.params;
    const collegeUser = await User.findOne({ email: req.user.email });
    if (!collegeUser || collegeUser.userRole !== "college") {
      return res.status(403).json({ error: "Unauthorized access: College role required." });
    }

    const students = await User.find({ userRole: "student", collegeName: collegeUser.companyName }).select("-password");
    
    // Merge application stats
    const studentStats = await Promise.all(students.map(async (student) => {
      const apps = await Application.find({ studentId: student.email });
      return {
        ...student.toObject(),
        applicationsCount: apps.length,
        hiredCount: apps.filter(a => ["Approved", "Submitted", "Completed"].includes(a.status)).length
      };
    }));

    res.status(200).json(studentStats);
  } catch (err) {
    console.error("Failed to fetch college students:", err);
    res.status(500).json({ error: "Failed to load student directory." });
  }
};

exports.endorseStudent = async (req, res) => {
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
  } catch (err) {
    res.status(500).json({ error: "Failed to update endorsement status." });
  }
};

exports.getCompanies = async (req, res) => {
  try {
    const collegeUser = await User.findOne({ email: req.user.email });
    if (!collegeUser || collegeUser.userRole !== "college") {
      return res.status(403).json({ error: "College administrator role required." });
    }

    const allCompanies = await User.find({ userRole: "company" }).select("-password");
    
    const companyStats = await Promise.all(allCompanies.map(async (company) => {
      const companyEmail = company.email;
      const projects = await Project.find({ companyId: companyEmail });
      
      let hiredFromCollege = 0;
      const apps = await Application.find({ companyId: companyEmail, status: { $in: ["Approved", "Submitted", "Completed"] }});
      
      for (const app of apps) {
        const stu = await User.findOne({ email: app.studentId });
        if (stu && stu.collegeName === collegeUser.companyName) {
          hiredFromCollege++;
        }
      }

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
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch companies." });
  }
};

exports.toggleCompanyStatus = async (req, res) => {
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
  } catch (err) {
    res.status(500).json({ error: "Failed to update company status." });
  }
};

exports.bulkImportStudents = async (req, res) => {
  try {
    const { students } = req.body; 
    const collegeUser = await User.findOne({ email: req.user.email });
    if (!collegeUser || collegeUser.userRole !== "college") {
      return res.status(403).json({ error: "College administrator role required." });
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

      const existingRoll = await User.findOne({ collegeName: collegeUser.companyName, enrollmentNumber: student.enrollmentNumber, userRole: "student" });
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
        collegeName: collegeUser.companyName,
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
  } catch (err) {
    res.status(500).json({ error: "Failed to process bulk import." });
  }
};
