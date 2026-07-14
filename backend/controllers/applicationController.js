const User = require('../models/User');
const Project = require('../models/Project');
const Application = require('../models/Application');
  // eslint-disable-next-line no-unused-vars
const swot = require('swot-node');
const { notifyUser } = require('../utils/notify');

function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  let match = 0;
  for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) match++;
  }
  return match / Math.max(s1.length, s2.length);
}

// Stub for future GitHub linter integration (not currently wired)
 
function _runGithubLinter(githubUrl, fileTypes) {
  let score = 95;
  let issues = ["No syntax errors found.", "Variables well named."];
  if (fileTypes.includes("python")) {
    issues.push("Suggestion: Add more type hints.");
  }
  return { score, issues };
}


exports.applyForProject = async (req, res, next) => {
  try {
    // Fix 6: Only students can apply to projects
    if (req.user.userRole !== 'student') {
      return res.status(403).json({ error: 'Only students can apply to projects' });
    }

    const { projectId } = req.body;
    const studentEmail = req.user.email;

    if (!projectId) {
      return res.status(400).json({ error: "Missing required application parameters." });
    }

    const alreadyApplied = await Application.findOne({ projectId, studentEmail });
    if (alreadyApplied) {
      return res.status(400).json({ error: "You have already applied to this project!" });
    }

    const project = await Project.findById(projectId);
    const studentUser = await User.findOne({ email: studentEmail });
    
    if (!studentUser) {
      return res.status(404).json({ error: "Student not found." });
    }
    
    // Strict Server-Side Validation: Ensure Paid Pass is active for Student Applications.
    // Faculty-posted academic projects are exempt — students shouldn't need a paid
    // pass to apply for their own professor's coursework project.
    const poster = project ? await User.findById(project.companyId).select("userRole") : null;
    const isAcademicProject = poster?.userRole === "faculty";
    
    // 1 Month = 30 Days Free Trial Check
    const trialDurationMs = 30 * 24 * 60 * 60 * 1000;
    const isTrialActive = (Date.now() - new Date(studentUser.createdAt).getTime()) < trialDurationMs;
    
    if (!studentUser.hasPaidPass && !isTrialActive && !isAcademicProject) {
      return res.status(403).json({ error: "Premium Pass is required to apply for projects." });
    }
    const studentName = studentUser.fullName;

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

    // Delegate to AiService
    const AiService = require("../services/AiService");
    const aiResult = await AiService.evaluateResumeMatch(project, studentUser);
    if (aiResult.matchScore !== null) {
      matchScore = aiResult.matchScore;
      aiRationale = aiResult.aiRationale;
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
  } catch (err) { console.error(err);
    next(err);
  }
};

// =========================================================================
// 🔍 ROUTE: Fetch all project IDs a student has applied to
// =========================================================================
exports.getStudentApplications = async (req, res, next) => {
  try {
    // V2 routes carry no :email param — default to the authenticated user's own
    // identity. Legacy :email routes must still match the caller.
    const targetEmail = req.params.email || req.user.email;
    if (req.user.email !== targetEmail) {
      return res.status(403).json({ error: "Unauthorized access to application indices." });
    }
    const apps = await Application.find({ studentEmail: targetEmail });
    const appliedProjectIds = apps.map(app => app.projectId.toString());
    res.status(200).json(appliedProjectIds);
  } catch (err) { console.error(err);
    next(err);
  }
};

// =========================================================================
// 👨‍🎓 ROUTE: Fetch Applicants for a specific Project with Skill Matching

// =========================================================================
// 🏢 ROUTE: Fetch all applications for a specific company's projects
// =========================================================================
exports.getCompanyApplications = async (req, res, next) => {
  try {
    // V2 route carries no :email param — default to the authenticated company.
    const targetEmail = req.params.email || req.user.email;
    if (req.user.email !== targetEmail) {
      return res.status(403).json({ error: "Unauthorized access to company applications." });
    }

    const companyProjects = await Project.find({ companyId: req.user.userId });
    const projectIds = companyProjects.map(p => p._id);

    const applications = await Application.find({ projectId: { $in: projectIds } })
      .populate("projectId")
      .sort({ appliedAt: -1 });

    if (applications.length === 0) {
      return res.status(200).json([]);
    }

    const studentEmails = [...new Set(applications.map(app => app.studentEmail))];
    const students = await User.find({ email: { $in: studentEmails } });
    const studentMap = {};
    students.forEach(s => { studentMap[s.email] = s; });

    const enrichedApps = applications.map((app) => {
      const studentUser = studentMap[app.studentEmail];
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
        ratingReview: app.ratingReview || null,
        collegeName: studentUser?.collegeName || null
      };
    });

    res.status(200).json(enrichedApps);
  } catch (err) { console.error(err);
    next(err);
  }
};

// =========================================================================
// 🔎 ROUTE: Fetch full student application details with populated project metrics
// =========================================================================
exports.getStudentDetails = async (req, res, next) => {
  try {
    // V2 route carries no :email param — default to the authenticated student.
    const targetEmail = req.params.email || req.user.email;
    if (req.user.email !== targetEmail) {
      return res.status(403).json({ error: "Unauthorized access to candidate application details." });
    }
    const apps = await Application.find({ studentEmail: targetEmail })
      .populate("projectId")
      .sort({ appliedAt: -1 });
    res.status(200).json(apps);
  } catch (err) { console.error(err);
    next(err);
  }
};

// =========================================================================
// 🔒 ROUTE: Accept or Reject an Application (Update Status)
// =========================================================================
exports.updateStatus = async (req, res, next) => {
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
    if (req.user.userId !== application.projectId.companyId.toString()) {
      return res.status(403).json({ error: "Unauthorized state modification." });
    }

    application.status = status;
    await application.save();

    // Push live real-time notification alert if student is online
    notifyUser(application.studentEmail, {
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
    });

    res.status(200).json({ message: `Application status updated to ${status}.`, application });
  } catch (err) { console.error(err);
    next(err);
  }
};


// =========================================================================
// 📤 Submit completed work for review
// =========================================================================

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

exports.submitApplicationWork = async (req, res, next) => {
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

    // Auto-reject if plagiarism score exceeds 20% (as per Terms of Service policy).
    // calculateSimilarity() returns a 0–1 ratio, so 20% == 0.2.
    if (plagiarismScore > 0.2) {
      application.status = "Flagged";
    } else {
      application.status = "Submitted";
    }

    // 2. Run Linter Simulation
    const lintWarnings = runLinter(submissionText);
    application.lintWarnings = lintWarnings;

    // 3. AI Code Auditor (Google Gemini) - Delegated to AiService
    const AiService = require("../services/AiService");
    let matchScore = null;
    let aiRationale = null;
    const auditResult = await AiService.auditSubmission(submissionText);
    if (auditResult.matchScore !== null) {
      matchScore = auditResult.matchScore;
      aiRationale = auditResult.aiRationale;
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
    next(err);
  }
};

// =========================================================================
// ⏳ ROUTE: Request Deadline Extension (Phase 12)
// =========================================================================
exports.requestExtension = async (req, res, next) => {
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
    next(err);
  }
};

// =========================================================================
// ⏳ ROUTE: Review Deadline Extension (Phase 12)
// =========================================================================
exports.reviewExtension = async (req, res, next) => {
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
    notifyUser(application.studentEmail, {
      type: "notification",
      statusUpdate: true,
      message: {
        title: `Deadline Extension ${status}!`,
        message: status === "Approved"
          ? `Your extension request was approved. New deadline: ${new Date(application.extendedDeadline).toLocaleDateString()}`
          : `Your extension request was rejected by the recruiter.`
      }
    });

    res.status(200).json({ message: `Extension request has been ${status.toLowerCase()}.`, application });
  } catch (err) {
    console.error("Review extension error:", err.message);
    next(err);
  }
};

// =========================================================================
// ✅ ROUTE: Approve & Complete task submission
// =========================================================================
exports.completeApplication = async (req, res, next) => {
  try {
    const { feedbackText, rating, ratingReview } = req.body;

    const application = await Application.findById(req.params.applicationId).populate("projectId");
    if (!application) {
      return res.status(404).json({ error: "Application not found." });
    }

    if (req.user.userId !== application.projectId.companyId.toString()) {
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
      const User = require("../models/User");
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
    notifyUser(application.studentEmail, {
      type: "notification",
      statusUpdate: true,
      message: {
        id: application._id,
        title: "🏆 Gig Completed!",
        message: `Your work for "${application.projectId.title}" has been reviewed, approved, and marked completed.`,
        type: "success"
      }
    });

    res.status(200).json({ message: "Work approved and marked as Completed.", application });
  } catch (err) { console.error(err);
    next(err);
  }
};

// =========================================================================
// 🔄 ROUTE: Request revision for a task submission
// =========================================================================
exports.requestRevision = async (req, res, next) => {
  try {
    const { feedbackText } = req.body;
    if (!feedbackText) {
      return res.status(400).json({ error: "Revision feedback explanation is required." });
    }

    const application = await Application.findById(req.params.applicationId).populate("projectId");
    if (!application) {
      return res.status(404).json({ error: "Application not found." });
    }

    if (req.user.userId !== application.projectId.companyId.toString()) {
      return res.status(403).json({ error: "Unauthorized status revision request." });
    }

    application.status = "Revision Requested";
    application.feedbackText = feedbackText;
    await application.save();

    // Push live WS alert
    notifyUser(application.studentEmail, {
      type: "notification",
      statusUpdate: true,
      message: {
        id: application._id,
        title: "🔄 Revision Requested",
        message: `Recruiter requested revision for "${application.projectId.title}".`,
        type: "warning"
      }
    });

    res.status(200).json({ message: "Revision requested successfully.", application });
  } catch (err) { console.error(err);
    next(err);
  }
};

// =========================================================================
// ⚠️ ROUTE: Flag and Dispute task submission
// =========================================================================
exports.withdrawApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: "Application not found." });
    }

    if (req.user.email !== application.studentEmail) {
      return res.status(403).json({ error: "Unauthorized. Only the applying student can withdraw." });
    }

    if (application.status !== "Pending" && application.status !== "Submitted") {
      return res.status(400).json({ error: "Only Pending or Submitted applications can be withdrawn." });
    }

    application.status = "Withdrawn";
    await application.save();
    res.status(200).json(application);
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.fileDispute = async (req, res, next) => {
  try {
    const { feedbackText } = req.body;
    if (!feedbackText) {
      return res.status(400).json({ error: "Dispute explanation feedback is required." });
    }

    const application = await Application.findById(req.params.applicationId).populate("projectId");
    if (!application) {
      return res.status(404).json({ error: "Application not found." });
    }

    if (req.user.userId !== application.projectId.companyId.toString()) {
      return res.status(403).json({ error: "Unauthorized status modification request." });
    }

    application.status = "Disputed";
    application.feedbackText = feedbackText;
    await application.save();

    // Push live real-time notification warning alert if student is online
    notifyUser(application.studentEmail, {
      type: "notification",
      statusUpdate: true,
      message: {
        id: application._id,
        title: "⚠️ Submission Disputed!",
        message: `Your solution for "${application.projectId.title}" was flagged by the recruiter. Check dashboard feedback.`,
        type: "danger"
      }
    });

    res.status(200).json({ message: "Task solution disputed successfully.", application });
  } catch (err) { console.error(err);
    next(err);
  }
};





// =========================================================================
// 🏛️ ROUTE: Get College Students Roster & Calculate Scores (Phase 11)
// =========================================================================
exports.offerPlacement = async (req, res, next) => {
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
    notifyUser(studentUser.email, {
      type: "notification",
      statusUpdate: true,
      message: {
        title: "💼 Career Offer Extended!",
        message: `Congratulations! ${recruiterUser.companyName || "A company recruiter"} has extended a job placement offer.`
      }
    });

    const sanitizedStudent = studentUser.toObject();
    delete sanitizedStudent.password;
    delete sanitizedStudent.resetPasswordToken;
    delete sanitizedStudent.resetPasswordExpires;

    res.status(200).json({ message: "Placement offer extended successfully.", studentUser: sanitizedStudent });
  } catch (err) {
    console.error("Offer extension error:", err.message);
    next(err);
  }
};

// =========================================================================
// 💼 ROUTE: Student Resolve Placement Offer (Phase 13)
// =========================================================================
exports.resolvePlacementOffer = async (req, res, next) => {
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
    next(err);
  }
};

exports.updatePipelineStatus = async (req, res, next) => {
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
    if (req.user.userId !== application.projectId.companyId.toString() && req.user.userRole !== "admin") {
      return res.status(403).json({ error: "Unauthorized: Only the project owner can update candidate pipelines." });
    }

    // Set matching application status
    if (status === "Offered") {
      application.status = "Approved"; // Keep consistent with application states
    }
    
    application.pipelineStage = status; // new field for visual Kanban tracking
    await application.save();

    res.status(200).json({ message: "Placement pipeline stage updated.", application });
  } catch (err) { console.error(err);
    next(err);
  }
};
