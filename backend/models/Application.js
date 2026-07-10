const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Project", // Changed from CompanyProfile to Project to match your new schema
    required: true 
  },
  studentEmail: { 
    type: String, 
    required: true 
  },
  studentName: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    default: "Pending",
    enum: ["Pending", "Approved", "Rejected", "Submitted", "Completed", "Disputed", "Flagged", "Revision Requested", "Withdrawn", "Resolved"]
  },
  submissionText: {
    type: String,
    default: null
  },
  submissionLink: {
    type: String,
    default: null
  },
  githubRepoUrl: {
    type: String,
    default: null
  },
  liveDeploymentUrl: {
    type: String,
    default: null
  },
  submittedAt: {
    type: Date,
    default: null
  },
  feedbackText: {
    type: String,
    default: null
  },
  matchScore: {
    type: Number,
    default: null
  },
  aiRationale: {
    type: String,
    default: null
  },
  plagiarismScore: {
    type: Number,
    default: 0
  },
  lintWarnings: {
    type: [String],
    default: []
  },
  rating: {
    type: Number,
    default: null
  },
  ratingReview: {
    type: String,
    default: null
  },
  appliedAt: { 
    type: Date, 
    default: Date.now 
  },
  
  // 📥 Phase 12: Work Environment, Submissions & Extensions
  submissionVersions: [{
    submissionLink: { type: String },
    githubRepoUrl: { type: String },
    liveDeploymentUrl: { type: String },
    submissionText: { type: String },
    aiDeclaration: {
      usedAi: { type: Boolean, default: false },
      aiPercentage: { type: Number, default: 0 },
      toolsUsed: { type: String, default: "" }
    },
    selfAssessment: { type: mongoose.Schema.Types.Mixed, default: {} },
    submittedAt: { type: Date, default: Date.now }
  }],
  
  extensionRequests: [{
    requestedDays: { type: Number, required: true },
    reason: { type: String, required: true },
    status: { type: String, default: "Pending" }, // Pending | Approved | Rejected
    requestedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null }
  }],
  
  extendedDeadline: {
    type: Date,
    default: null
  },
  pipelineStage: {
    type: String,
    default: "Application Received"
  },
  timeline: [{
    action: String,
    date: { type: Date, default: Date.now },
    by: String,
    note: String
  }]
});

// Performance indexes for frequent queries
applicationSchema.index({ studentEmail: 1 });
applicationSchema.index({ status: 1 });

// Prevent duplicate applications
applicationSchema.index({ projectId: 1, studentEmail: 1 }, { unique: true });

// 🎯 CRUCIAL FIX: Make sure this exact line is at the bottom!
module.exports = mongoose.model("Application", applicationSchema);