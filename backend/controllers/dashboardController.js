const User = require('../models/User');
const Application = require('../models/Application');
const Project = require('../models/Project');

exports.routeHandler0 = async (req, res) => {
  try {
    const companyEmail = req.params.email;
    if (req.user.email !== companyEmail) {
      return res.status(403).json({ error: "Unauthorized stats access." });
    }

    const projects = await Project.find({ companyId: req.user.userId });
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
};

exports.routeHandler1 = async (req, res) => {
  try {
    const companyEmail = req.params.email;
    if (req.user.email !== companyEmail) {
      return res.status(403).json({ error: "Unauthorized activity access." });
    }

    const projects = await Project.find({ companyId: req.user.userId });
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
};

