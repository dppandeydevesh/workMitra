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
    default: "Pending" 
  },
  submissionText: {
    type: String,
    default: null
  },
  submissionLink: {
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
  appliedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Prevent duplicate applications
applicationSchema.index({ projectId: 1, studentEmail: 1 }, { unique: true });

// 🎯 CRUCIAL FIX: Make sure this exact line is at the bottom!
module.exports = mongoose.model("Application", applicationSchema);