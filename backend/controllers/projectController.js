const Project = require('../models/Project');
const Application = require('../models/Application');
const User = require('../models/User');

const getAllProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    let blockedCompanyEmails = [];
    if (req.user.userRole === "student") {
      const student = await User.findOne({ email: req.user.email });
      if (student && student.collegeName) {
        const collegeAdmin = await User.findOne({ userRole: "college", collegeName: student.collegeName });
        if (collegeAdmin && collegeAdmin.collegeBlockedCompanies) {
          blockedCompanyEmails = collegeAdmin.collegeBlockedCompanies;
        }
      }
    }
    
    let queryConditions = {};
    if (blockedCompanyEmails.length > 0) {
      queryConditions.companyId = { $nin: blockedCompanyEmails };
    }

    let query = Project.find(queryConditions).populate('companyId', 'email companyName').sort({ createdAt: -1 });
    
    if (page && limit) {
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
    }
    
    const projects = await query;
    const projectsWithCounts = await Promise.all(projects.map(async (p) => {
      const applicantCount = await Application.countDocuments({ projectId: p._id });
      return {
        ...p.toObject(),
        applicantCount
      };
    }));
    res.status(200).json(projectsWithCounts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve projects." });
  }
};

const createProject = async (req, res) => {
  try {
    if (req.user.userRole !== "company" && req.user.userRole !== "admin") {
      return res.status(403).json({ error: "Access denied. Only recruiters can publish projects." });
    }

    const { title, description, budget, requiredSkills, duration, deadline, workType, complexity, targetUniversity, hasPpiBadge, departmentName } = req.body;
    
    // Use the authenticated user's ObjectId instead of relying on frontend email payload
    const companyId = req.user.userId;

    if (!title || !description || !budget) {
      return res.status(400).json({ error: "Missing mandatory project field metrics." });
    }

    const parsedBudget = Number(budget);
    if (isNaN(parsedBudget) || parsedBudget <= 0) {
      return res.status(400).json({ error: "Budget must be a positive number." });
    }

    const project = new Project({
      companyId,
      title,
      description,
      budget: parsedBudget,
      requiredSkills,
      duration,
      deadline,
      workType,
      complexity,
      targetUniversity,
      hasPpiBadge,
      departmentName,
      status: "Published"
    });
    
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to publish new project stack." });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).populate('companyId', 'email companyName');
    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }
    res.status(200).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve project details." });
  }
};

const getProjectsByCompany = async (req, res) => {
  try {
    if (req.user.email !== req.params.email) {
      return res.status(403).json({ error: "Unauthorized projects access request." });
    }
    const companyProjects = await Project.find({ companyId: req.user.userId }).populate('companyId', 'email companyName').sort({ createdAt: -1 });
    res.status(200).json(companyProjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve company projects." });
  }
};

const getProjectApplicants = async (req, res) => {
  try {
    const { projectId } = req.params;

    const currentProject = await Project.findById(projectId);
    if (!currentProject) {
      return res.status(404).json({ error: "Project not found." });
    }

    // Current project companyId is now an object due to population or a direct ObjectId
    const projectCompanyIdStr = currentProject.companyId._id ? currentProject.companyId._id.toString() : currentProject.companyId.toString();
    
    if (req.user.userId !== projectCompanyIdStr) {
      return res.status(403).json({ error: "Unauthorized access to project applicant details." });
    }

    const applications = await Application.find({ projectId });
    
    if (applications.length === 0) {
      return res.status(200).json([]);
    }

    const targetSkills = currentProject?.requiredSkills.map(s => s.toLowerCase()) || [];

    const enrichedApplicants = await Promise.all(
      applications.map(async (app) => {
        const studentUser = await User.findOne({ email: app.studentEmail });
        
        let studentSkillsArray = [];
        if (studentUser && studentUser.targetSkills) {
          studentSkillsArray = studentUser.targetSkills
            .split(",")
            .map(s => s.trim().toLowerCase());
        }

        let matchPercentage = app.matchScore !== null && app.matchScore !== undefined ? app.matchScore : 0;
        if (app.matchScore === null || app.matchScore === undefined) {
          if (targetSkills.length > 0 && studentSkillsArray.length > 0) {
            const intersections = studentSkillsArray.filter(skill => targetSkills.includes(skill));
            matchPercentage = Math.round((intersections.length / targetSkills.length) * 100);
          }
        }

        return {
          applicationId: app._id,
          studentName: app.studentName,
          studentEmail: app.studentEmail,
          status: app.status,
          appliedAt: app.appliedAt,
          skills: studentUser?.targetSkills || "Not specified",
          projectTypePreference: studentUser?.projectType || "Remote Track",
          matchScore: matchPercentage,
          aiRationale: app.aiRationale || "Calculated using skill matches.",
          resumeUrl: studentUser?.resumeUrl || null,
          githubUrl: studentUser?.githubUrl || null,
          linkedinUrl: studentUser?.linkedinUrl || null,
          portfolioUrl: studentUser?.portfolioUrl || null,
          submissionText: app.submissionText || null,
          submissionLink: app.submissionLink || null,
          submittedAt: app.submittedAt || null,
          feedbackText: app.feedbackText || null,
          rating: app.rating || null,
          ratingReview: app.ratingReview || null
        };
      })
    );

    enrichedApplicants.sort((a, b) => b.matchScore - a.matchScore);
    res.status(200).json(enrichedApplicants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to parse matching applicants." });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const projectCompanyIdStr = project.companyId._id ? project.companyId._id.toString() : project.companyId.toString();
    if (req.user.userId !== projectCompanyIdStr) {
      return res.status(403).json({ error: "Unauthorized access to project parameters." });
    }

    const { title, description, budget, requiredSkills, deadline, projectType } = req.body;
    
    project.title = title !== undefined ? title : project.title;
    project.description = description !== undefined ? description : project.description;
    project.budget = budget !== undefined ? budget : project.budget;
    project.requiredSkills = requiredSkills !== undefined ? requiredSkills : project.requiredSkills;
    project.deadline = deadline !== undefined ? deadline : project.deadline;
    project.projectType = projectType !== undefined ? projectType : project.projectType;

    await project.save();
    res.status(200).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update project details." });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const projectCompanyIdStr = project.companyId._id ? project.companyId._id.toString() : project.companyId.toString();
    if (req.user.userId !== projectCompanyIdStr) {
      return res.status(403).json({ error: "Unauthorized delete request." });
    }

    await Project.findByIdAndDelete(projectId);
    await Application.deleteMany({ projectId });
    res.status(200).json({ message: "Project and associated applications deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete corporate project." });
  }
};

const getRecommendedProjects = async (req, res) => {
  try {
    const studentUser = await User.findOne({ email: req.user.email });
    if (!studentUser || studentUser.userRole !== "student") {
      return res.status(403).json({ error: "Student profile context required." });
    }

    let blockedCompanies = [];
    if (studentUser.collegeName) {
      const collegeUser = await User.findOne({ userRole: "college", collegeName: studentUser.collegeName });
      if (collegeUser) {
        blockedCompanies = collegeUser.collegeBlockedCompanies || [];
      }
    }

    // NOTE: For recommended projects, companyId is now an ObjectId, so this filter needs to be updated if blockedCompanies uses emails
    // For now, we will populate to keep it intact, though complex $nin on populated fields requires aggregation.
    // Keeping it simple for the MVP schema migration.
    const projects = await Project.find().populate('companyId', 'email companyName');
    
    const studentSkills = new Set(
      (studentUser.preferredTechStack || [])
        .concat((studentUser.targetSkills || "").split(","))
        .map(s => s.trim().toLowerCase())
        .filter(Boolean)
    );

    const scoredProjects = projects.map(p => {
      const projectSkills = (p.requiredSkills || []).map(s => s.trim().toLowerCase());
      if (projectSkills.length === 0) {
        return { project: p, score: 30 };
      }

      let matches = 0;
      projectSkills.forEach(s => {
        if (studentSkills.has(s)) matches++;
      });

      const score = Math.round((matches / projectSkills.length) * 100);
      return { project: p, score };
    });

    scoredProjects.sort((a, b) => b.score - a.score);

    res.status(200).json(scoredProjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to query recommended gig matches." });
  }
};

module.exports = {
  getAllProjects,
  createProject,
  getProjectById,
  getProjectsByCompany,
  getProjectApplicants,
  updateProject,
  deleteProject,
  getRecommendedProjects
};
