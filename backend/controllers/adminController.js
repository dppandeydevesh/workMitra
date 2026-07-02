const User = require('../models/User');
const Project = require('../models/Project');
const Application = require('../models/Application');

exports.getMetrics = async (req, res) => {
  if (req.user.userRole !== "admin") return res.status(403).json({ error: "Access denied. Admins only." });
  try {
    const totalStudents = await User.countDocuments({ userRole: "student" });
    const totalCompanies = await User.countDocuments({ userRole: "company" });
    const totalProjects = await Project.countDocuments();
    const applications = await Application.find().populate("projectId");
    
    const lockedEscrow = applications.filter(app => ["Approved", "Submitted"].includes(app.status)).reduce((sum, app) => sum + (app.projectId?.budget || 0), 0);
    const completedEscrow = applications.filter(app => app.status === "Completed").reduce((sum, app) => sum + (app.projectId?.budget || 0), 0);
    const disputedEscrow = applications.filter(app => app.status === "Disputed").reduce((sum, app) => sum + (app.projectId?.budget || 0), 0);

    res.status(200).json({ totalStudents, totalCompanies, totalProjects, lockedEscrow, completedEscrow, disputedEscrow });
  } catch (err) {
    res.status(500).json({ error: "Failed to load admin statistics." });
  }
};

exports.getDisputes = async (req, res) => {
  if (req.user.userRole !== "admin") return res.status(403).json({ error: "Access denied. Admins only." });
  try {
    const disputes = await Application.find({ status: "Disputed" }).populate("projectId");
    res.status(200).json(disputes);
  } catch (err) {
    res.status(500).json({ error: "Failed to load disputes." });
  }
};

exports.resolveDispute = async (req, res) => {
  if (req.user.userRole !== "admin") return res.status(403).json({ error: "Access denied. Admins only." });
  try {
    const { applicationId } = req.params;
    const { resolution, refundPercentage, adminNotes } = req.body;
    const app = await Application.findById(applicationId);
    if (!app) return res.status(404).json({ error: "Application not found." });
    
    app.status = "Resolved";
    app.timeline.push({ status: "Resolved", comment: `Admin Resolution: ${resolution}. Refund: ${refundPercentage}%. Notes: ${adminNotes}`, date: new Date() });
    await app.save();
    res.status(200).json({ message: "Dispute resolved successfully.", application: app });
  } catch (err) {
    res.status(500).json({ error: "Failed to resolve dispute." });
  }
};

exports.getCompanies = async (req, res) => {
  if (req.user.userRole !== "admin") return res.status(403).json({ error: "Access denied. Admins only." });
  try {
    const companies = await User.find({ userRole: "company" }).select("-password");
    res.status(200).json(companies);
  } catch (err) {
    res.status(500).json({ error: "Failed to load companies." });
  }
};

exports.verifyCompany = async (req, res) => {
  if (req.user.userRole !== "admin") return res.status(403).json({ error: "Access denied. Admins only." });
  try {
    const { companyEmail } = req.params;
    const { isVerified } = req.body;
    const company = await User.findOneAndUpdate({ email: companyEmail, userRole: "company" }, { isVerified }, { new: true });
    if (!company) return res.status(404).json({ error: "Company not found." });
    res.status(200).json({ message: `Company ${isVerified ? 'verified' : 'unverified'} successfully.`, company });
  } catch (err) {
    res.status(500).json({ error: "Failed to verify company." });
  }
};
