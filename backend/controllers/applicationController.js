const User = require('../models/User');
const Project = require('../models/Project');
const Application = require('../models/Application');
const swot = require('swot-node');

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

function runLinter(githubUrl, fileTypes) {
  let score = 95;
  let issues = ["No syntax errors found.", "Variables well named."];
  if (fileTypes.includes("python")) {
    issues.push("Suggestion: Add more type hints.");
  }
  return { score, issues };
}

exports.applyForProject = async (req, res) => {
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

    // Attempt Gemini AI evaluation if resume is uploaded
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && studentUser && studentUser.resumeText && project) {
      try {
        const prompt = `Analyze this candidate's resume text against the project description and required skills. Estimate a match percentage (integer 0 to 100) and provide a concise, one-sentence rationale. Return ONLY a valid JSON object matching this schema:
{
  "matchScore": number,
  "aiRationale": "string"
}

Required Skills: ${project.requiredSkills.join(", ")}
Project Description: ${project.description}
Candidate Resume Text: ${studentUser.resumeText}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (aiText) {
            const aiData = JSON.parse(aiText);
            if (typeof aiData.matchScore === "number") {
              matchScore = aiData.matchScore;
              aiRationale = aiData.aiRationale;
            }
          }
        }
      } catch (aiErr) {
        console.error("Gemini applicant match score evaluation bypassed:", aiErr.message);
      }
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
  } catch (err) {
    res.status(500).json({ error: "Failed to process project application." });
  }
};

// =========================================================================
// 🔍 ROUTE: Fetch all project IDs a student has applied to
// =========================================================================
exports.getStudentApplications = async (req, res) => {
  try {
    if (req.user.email !== req.params.email) {
      return res.status(403).json({ error: "Unauthorized access to application indices." });
    }
    const apps = await Application.find({ studentEmail: req.params.email });
    const appliedProjectIds = apps.map(app => app.projectId.toString());
    res.status(200).json(appliedProjectIds);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch student application logs." });
  }
};

// =========================================================================
// 👨‍🎓 ROUTE: Fetch Applicants for a specific Project with Skill Matching

// =========================================================================
// 🏢 ROUTE: Fetch all applications for a specific company's projects
// =========================================================================
exports.getCompanyApplications = async (req, res) => {
  try {
    const { email } = req.params;
    if (req.user.email !== email) {
      return res.status(403).json({ error: "Unauthorized access to company applications." });
    }

    const companyProjects = await Project.find({ companyId: email });
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
        ratingReview: app.ratingReview || null
      };
    });

    res.status(200).json(enrichedApps);
  } catch (err) {
    res.status(500).json({ error: "Failed to load corporate applications." });
  }
};

// =========================================================================
// 🔎 ROUTE: Fetch full student application details with populated project metrics
// =========================================================================
exports.getStudentDetails = async (req, res) => {
  try {
    if (req.user.email !== req.params.email) {
      return res.status(403).json({ error: "Unauthorized access to candidate application details." });
    }
    const apps = await Application.find({ studentEmail: req.params.email })
      .populate("projectId")
      .sort({ appliedAt: -1 });
    res.status(200).json(apps);
  } catch (err) {
    res.status(500).json({ error: "Failed to load candidate application timelines." });
  }
};

// =========================================================================
// 🔒 ROUTE: Accept or Reject an Application (Update Status)
// =========================================================================
exports.updateStatus = async (req, res) => {
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
    if (req.user.email !== application.projectId.companyId) {
      return res.status(403).json({ error: "Unauthorized state modification." });
    }

    application.status = status;
    await application.save();

    // Push live real-time notification alert if student is online
    try {
      const receiverSocket = global.req.app.locals.wsClients?.get(application.studentEmail);
      const ws = require("ws");
      if (receiverSocket && receiverSocket.readyState === ws.OPEN) {
        receiverSocket.send(
          JSON.stringify({
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
          })
        );
      }
    } catch (wsErr) {
      console.error("Failed to push real-time status update socket alert:", wsErr.message);
    }

    res.status(200).json({ message: `Application status updated to ${status}.`, application });
  } catch (err) {
    res.status(500).json({ error: "Failed to modify application status." });
  }
};

// =========================================================================
// 📤 ROUTE: Submit completed work for review
// =========================================================================
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, "");
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (s1 === s2) return 100;
  
  const getBigrams = (str) => {
    const bigrams = new Set();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };

  const b1 = getBigrams(s1);
  const b2 = getBigrams(s2);
  if (b1.size === 0 || b2.size === 0) return 0;

  let intersection = 0;
  b1.forEach(bg => {
    if (b2.has(bg)) intersection++;
  });

  return Math.round((2 * intersection) / (b1.size + b2.size) * 100);
}

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

exports.submitApplicationWork = async (req, res) => {
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
    
    // Set status to Flagged if plagiarism score exceeds 70%
    if (plagiarismScore > 70) {
      application.status = "Flagged";
    } else {
      application.status = "Submitted";
    }

    // 2. Run Linter Simulation
    const lintWarnings = runLinter(submissionText);
    application.lintWarnings = lintWarnings;

    // 3. AI Code Auditor (Google Gemini)
    let matchScore = null;
    let aiRationale = null;
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const prompt = `Analyze this student's task submission code against the requirements. Grade the solution's code quality, correct implementation, and completeness on a scale of 0 to 100. Also write a one-sentence critique/rationale. Return ONLY a valid JSON object matching this schema:
{
  "score": number,
  "rationale": "string"
}

Submission Code: ${submissionText}
Explanatory details: ${submissionText}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (aiText) {
            const aiData = JSON.parse(aiText);
            if (typeof aiData.score === "number") {
              matchScore = aiData.score;
              aiRationale = aiData.rationale;
            }
          }
        }
      } catch (aiErr) {
        console.error("Gemini AI code auditor bypassed:", aiErr.message);
      }
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
    res.status(500).json({ error: "Failed to register project solution details." });
  }
};

// =========================================================================
// ⏳ ROUTE: Request Deadline Extension (Phase 12)
// =========================================================================
exports.requestExtension = async (req, res) => {
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
    res.status(500).json({ error: "Failed to submit deadline extension request." });
  }
};

// =========================================================================
// ⏳ ROUTE: Review Deadline Extension (Phase 12)
// =========================================================================
exports.reviewExtension = async (req, res) => {
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
    const studentSocket = global.req.app.locals.wsClients?.get(application.studentEmail);
    if (studentSocket && studentSocket.readyState === ws.OPEN) {
      studentSocket.send(
        JSON.stringify({
          type: "notification",
          statusUpdate: true,
          message: {
            title: `Deadline Extension ${status}!`,
            message: status === "Approved"
              ? `Your extension request was approved. New deadline: ${new Date(application.extendedDeadline).toLocaleDateString()}`
              : `Your extension request was rejected by the recruiter.`
          }
        })
      );
    }

    res.status(200).json({ message: `Extension request has been ${status.toLowerCase()}.`, application });
  } catch (err) {
    console.error("Review extension error:", err.message);
    res.status(500).json({ error: "Failed to review deadline extension request." });
  }
};

// =========================================================================
// ✅ ROUTE: Approve & Complete task submission
// =========================================================================
exports.completeApplication = async (req, res) => {
  try {
    const { feedbackText, rating, ratingReview } = req.body;

    const application = await Application.findById(req.params.applicationId).populate("projectId");
    if (!application) {
      return res.status(404).json({ error: "Application not found." });
    }

    if (req.user.email !== application.projectId.companyId) {
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
      const User = require("./models/User");
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
    try {
      const receiverSocket = global.req.app.locals.wsClients?.get(application.studentEmail);
      const ws = require("ws");
      if (receiverSocket && receiverSocket.readyState === ws.OPEN) {
        receiverSocket.send(
          JSON.stringify({
            type: "notification",
            statusUpdate: true,
            message: {
              id: application._id,
              title: "🏆 Gig Completed!",
              message: `Your work for "${application.projectId.title}" has been reviewed, approved, and marked completed.`,
              type: "success"
            }
          })
        );
      }
    } catch (wsErr) {
      console.error("Failed to push real-time task complete socket alert:", wsErr.message);
    }

    res.status(200).json({ message: "Work approved and marked as Completed.", application });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve solution node." });
  }
};

// =========================================================================
// 🔄 ROUTE: Request revision for a task submission
// =========================================================================
exports.requestRevision = async (req, res) => {
  try {
    const { feedbackText } = req.body;
    if (!feedbackText) {
      return res.status(400).json({ error: "Revision feedback explanation is required." });
    }

    const application = await Application.findById(req.params.applicationId).populate("projectId");
    if (!application) {
      return res.status(404).json({ error: "Application not found." });
    }

    if (req.user.email !== application.projectId.companyId) {
      return res.status(403).json({ error: "Unauthorized status revision request." });
    }

    application.status = "Revision Requested";
    application.feedbackText = feedbackText;
    await application.save();

    // Push live WS alert
    try {
      const receiverSocket = global.req.app.locals.wsClients?.get(application.studentEmail);
      const ws = require("ws");
      if (receiverSocket && receiverSocket.readyState === ws.OPEN) {
        receiverSocket.send(
          JSON.stringify({
            type: "notification",
            statusUpdate: true,
            message: {
              id: application._id,
              title: "🔄 Revision Requested",
              message: `Recruiter requested revision for "${application.projectId.title}".`,
              type: "warning"
            }
          })
        );
      }
    } catch (wsErr) {
      console.error("Failed to push revision request socket alert:", wsErr.message);
    }

    res.status(200).json({ message: "Revision requested successfully.", application });
  } catch (err) {
    res.status(500).json({ error: "Failed to request task revision." });
  }
};

// =========================================================================
// ⚠️ ROUTE: Flag and Dispute task submission
// =========================================================================
exports.withdrawApplication = async (req, res) => {
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
    res.status(500).json({ error: "Failed to withdraw application." });
  }
};

exports.fileDispute = async (req, res) => {
  try {
    const { feedbackText } = req.body;
    if (!feedbackText) {
      return res.status(400).json({ error: "Dispute explanation feedback is required." });
    }

    const application = await Application.findById(req.params.applicationId).populate("projectId");
    if (!application) {
      return res.status(404).json({ error: "Application not found." });
    }

    if (req.user.email !== application.projectId.companyId) {
      return res.status(403).json({ error: "Unauthorized status modification request." });
    }

    application.status = "Disputed";
    application.feedbackText = feedbackText;
    await application.save();

    // Push live real-time notification warning alert if student is online
    try {
      const receiverSocket = global.req.app.locals.wsClients?.get(application.studentEmail);
      const ws = require("ws");
      if (receiverSocket && receiverSocket.readyState === ws.OPEN) {
        receiverSocket.send(
          JSON.stringify({
            type: "notification",
            statusUpdate: true,
            message: {
              id: application._id,
              title: "⚠️ Submission Disputed!",
              message: `Your solution for "${application.projectId.title}" was flagged by the recruiter. Check dashboard feedback.`,
              type: "danger"
            }
          })
        );
      }
    } catch (wsErr) {
      console.error("Failed to push real-time dispute socket alert:", wsErr.message);
    }

    res.status(200).json({ message: "Task solution disputed successfully.", application });
  } catch (err) {
    res.status(500).json({ error: "Failed to dispute solution node." });
  }
};



