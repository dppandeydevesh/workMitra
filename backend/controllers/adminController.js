const User = require('../models/User');
const Project = require('../models/Project');
const Application = require('../models/Application');

exports.getMetrics = async (req, res, next) => {
  if (req.user.userRole !== "admin") return res.status(403).json({ error: "Access denied. Admins only." });
  try {
    const totalStudents = await User.countDocuments({ userRole: "student" });
    const totalCompanies = await User.countDocuments({ userRole: "company" });
    const totalProjects = await Project.countDocuments();
    const escrowStats = await Application.aggregate([
      {
        $match: { status: { $in: ["Approved", "Submitted", "Completed", "Disputed"] } }
      },
      {
        $lookup: {
          from: 'projects',
          localField: 'projectId',
          foreignField: '_id',
          as: 'project'
        }
      },
      { $unwind: '$project' },
      {
        $group: {
          _id: "$status",
          total: { $sum: "$project.budget" }
        }
      }
    ]);

    let lockedEscrow = 0;
    let completedEscrow = 0;
    let disputedEscrow = 0;

    escrowStats.forEach(stat => {
      if (["Approved", "Submitted"].includes(stat._id)) {
        lockedEscrow += stat.total;
      } else if (stat._id === "Completed") {
        completedEscrow += stat.total;
      } else if (stat._id === "Disputed") {
        disputedEscrow += stat.total;
      }
    });

    res.status(200).json({ totalStudents, totalCompanies, totalProjects, lockedEscrow, completedEscrow, disputedEscrow });
  } catch (err) { console.error(err);
    next(err);
  }
};

exports.getDisputes = async (req, res, next) => {
  if (req.user.userRole !== "admin") return res.status(403).json({ error: "Access denied. Admins only." });
  try {
    const disputes = await Application.find({ status: "Disputed" }).populate("projectId");
    res.status(200).json(disputes);
  } catch (err) { console.error(err);
    next(err);
  }
};

exports.resolveDispute = async (req, res, next) => {
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
  } catch (err) { console.error(err);
    next(err);
  }
};

exports.getCompanies = async (req, res, next) => {
  if (req.user.userRole !== "admin") return res.status(403).json({ error: "Access denied. Admins only." });
  try {
    const companies = await User.find({ userRole: "company" }).select("-password");
    res.status(200).json(companies);
  } catch (err) { console.error(err);
    next(err);
  }
};

exports.verifyCompany = async (req, res, next) => {
  if (req.user.userRole !== "admin") return res.status(403).json({ error: "Access denied. Admins only." });
  try {
    const { companyEmail } = req.params;
    const { isVerified } = req.body;
    const company = await User.findOneAndUpdate({ email: companyEmail, userRole: "company" }, { isVerified }, { new: true });
    if (!company) return res.status(404).json({ error: "Company not found." });
    res.status(200).json({ message: `Company ${isVerified ? 'verified' : 'unverified'} successfully.`, company });
  } catch (err) { console.error(err);
    next(err);
  }
};
