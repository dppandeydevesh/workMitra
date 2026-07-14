const Project = require('../models/Project');
const Application = require('../models/Application');
const User = require('../models/User');
const { upsertProject: pineconeUpsert, deleteProject: pineconeDelete } = require('../utils/pinecone');

const resolveBlockedCompanyIds = async (blockedEmails) => {
  if (!blockedEmails || blockedEmails.length === 0) return [];
  const companies = await User.find({ email: { $in: blockedEmails }, userRole: 'company' }).select('_id');
  return companies.map((c) => c._id);
};

const getBlockedCompanyIdsForStudent = async (student) => {
  if (!student?.collegeName) return [];
  const collegeAdmin = await User.findOne({ userRole: 'college', collegeName: student.collegeName });
  if (!collegeAdmin?.collegeBlockedCompanies?.length) return [];
  return resolveBlockedCompanyIds(collegeAdmin.collegeBlockedCompanies);
};

const getAllProjects = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    let queryConditions = {};
    if (req.user.userRole === 'student') {
      const student = await User.findOne({ email: req.user.email });
      const blockedCompanyIds = await getBlockedCompanyIdsForStudent(student);
      if (blockedCompanyIds.length > 0) {
        queryConditions.companyId = { $nin: blockedCompanyIds };
      }
    }

    let aggregatePipeline = [
      { $match: queryConditions },
      { $sort: { createdAt: -1 } }
    ];

    if (page && limit) {
      aggregatePipeline.push({ $skip: (page - 1) * limit });
      aggregatePipeline.push({ $limit: limit });
    }

    // 1. Lookup applications to count them efficiently without breaching 16MB document limit
    aggregatePipeline.push({
      $lookup: {
        from: "applications",
        let: { pId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$projectId", "$$pId"] } } },
          { $count: "count" }
        ],
        as: "appCountData"
      }
    });

    aggregatePipeline.push({
      $addFields: {
        applicantCount: { 
          $cond: { 
            if: { $gt: [{ $size: "$appCountData" }, 0] }, 
            then: { $arrayElemAt: ["$appCountData.count", 0] }, 
            else: 0 
          } 
        }
      }
    });

    // 2. Lookup company user data to match Mongoose populate('companyId', 'email companyName')
    aggregatePipeline.push({
      $lookup: {
        from: "users",
        localField: "companyId",
        foreignField: "_id",
        as: "companyInfo"
      }
    });
    
    aggregatePipeline.push({
      $unwind: { path: "$companyInfo", preserveNullAndEmptyArrays: true }
    });

    aggregatePipeline.push({
      $addFields: {
        companyId: {
          _id: "$companyInfo._id",
          email: "$companyInfo.email",
          companyName: "$companyInfo.companyName"
        }
      }
    });

    // Clean up temporary fields
    aggregatePipeline.push({
      $project: {
        appCountData: 0,
        companyInfo: 0
      }
    });

    const projectsWithCounts = await Project.aggregate(aggregatePipeline);
    res.status(200).json(projectsWithCounts);
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const createProject = async (req, res, next) => {
  try {
    const isFaculty = req.user.userRole === "faculty";
    if (req.user.userRole !== "company" && req.user.userRole !== "admin" && !isFaculty) {
      return res.status(403).json({ error: "Access denied. Only recruiters and faculty can publish projects." });
    }

    const { title, description, budget, requiredSkills, skills, duration, deadline, workType, complexity, targetUniversity, hasPpiBadge, departmentName } = req.body;

    // Use the authenticated user's ObjectId instead of relying on frontend email payload
    const companyId = req.user.userId;

    if (!title || !description || budget === undefined || budget === null) {
      return res.status(400).json({ error: "Missing mandatory project field metrics." });
    }

    const parsedBudget = Number(budget);
    if (isNaN(parsedBudget) || parsedBudget < 0) {
      return res.status(400).json({ error: "Budget must be a non-negative number (stipend amount or marks)." });
    }

    // Faculty posts are academic assignments: accept either skills/requiredSkills
    // key and default the schedule fields the shorter faculty form omits
    // (duration/deadline are required by the schema).
    const project = new Project({
      companyId,
      title,
      description,
      budget: parsedBudget,
      requiredSkills: requiredSkills || skills || [],
      duration: duration || (isFaculty ? "1 Semester" : duration),
      deadline: deadline || (isFaculty ? "Open until filled" : deadline),
      workType: workType || (isFaculty ? "Academic" : undefined),
      complexity,
      targetUniversity,
      hasPpiBadge,
      departmentName,
      status: "Published"
    });
    
    await project.save();
    // 📌 Pinecone: index project for semantic search (fire-and-forget)
    pineconeUpsert(project).catch(err => console.error('[Pinecone] createProject upsert error:', err.message));
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId).populate('companyId', 'email companyName');
    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }
    res.status(200).json(project);
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const getProjectsByCompany = async (req, res, next) => {
  try {
    if (req.user.email !== req.params.email) {
      return res.status(403).json({ error: "Unauthorized projects access request." });
    }
    const companyProjects = await Project.find({ companyId: req.user.userId }).populate('companyId', 'email companyName').sort({ createdAt: -1 });
    res.status(200).json(companyProjects);
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const getProjectApplicants = async (req, res, next) => {
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
    next(err);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const projectCompanyIdStr = project.companyId._id ? project.companyId._id.toString() : project.companyId.toString();
    if (req.user.userId !== projectCompanyIdStr) {
      return res.status(403).json({ error: "Unauthorized access to project parameters." });
    }

    const { title, description, budget, requiredSkills, deadline, workType } = req.body;
    
    project.title = title !== undefined ? title : project.title;
    project.description = description !== undefined ? description : project.description;
    project.budget = budget !== undefined ? budget : project.budget;
    project.requiredSkills = requiredSkills !== undefined ? requiredSkills : project.requiredSkills;
    project.deadline = deadline !== undefined ? deadline : project.deadline;
    project.workType = workType !== undefined ? workType : project.workType;

    await project.save();
    // 📌 Pinecone: re-index updated project (fire-and-forget)
    pineconeUpsert(project).catch(err => console.error('[Pinecone] updateProject upsert error:', err.message));
    res.status(200).json(project);
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const deleteProject = async (req, res, next) => {
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
    // 📌 Pinecone: remove deleted project from index (fire-and-forget)
    pineconeDelete(projectId).catch(err => console.error('[Pinecone] deleteProject error:', err.message));
    res.status(200).json({ message: "Project and associated applications deleted successfully." });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const getRecommendedProjects = async (req, res, next) => {
  try {
    const studentUser = await User.findOne({ email: req.user.email });
    if (!studentUser || studentUser.userRole !== "student") {
      return res.status(403).json({ error: "Student profile context required." });
    }

    const blockedCompanyIds = await getBlockedCompanyIdsForStudent(studentUser);
    const queryConditions = blockedCompanyIds.length > 0
      ? { companyId: { $nin: blockedCompanyIds } }
      : {};

    const projects = await Project.find(queryConditions).populate('companyId', 'email companyName');
    
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
    next(err);
  }
};

const archiveProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const projectCompanyIdStr = project.companyId._id ? project.companyId._id.toString() : project.companyId.toString();
    if (req.user.userId !== projectCompanyIdStr) {
      return res.status(403).json({ error: "Unauthorized archive request." });
    }

    project.status = "Archived";
    await project.save();
    // 📌 Pinecone: remove archived project from index (fire-and-forget)
    pineconeDelete(project._id).catch(err => console.error('[Pinecone] archiveProject error:', err.message));
    res.status(200).json(project);
  } catch (err) {
    console.error(err);
    next(err);
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
  getRecommendedProjects,
  archiveProject
};

