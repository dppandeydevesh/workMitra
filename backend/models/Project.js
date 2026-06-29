const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  companyId: { 
    type: String, 
    required: true // Tracks which company email posted the project
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  requiredSkills: { type: [String], default: [] },
  studentsNeeded: { type: Number, default: 1 },
  workType: { type: String, default: "Internship" },
  budget: { type: Number, required: true },
  duration: { type: String, required: true },
  deadline: { type: String, required: true },
  status: { type: String, default: "Published" }, // Published or Draft
  complexity: { type: String, default: "Intermediate" }, // Beginner, Intermediate, Advanced
  minReadinessScore: { type: Number, default: 0 },
  targetUniversity: { type: String, default: "" }, // targeted broadcast domain
  isNdaRequired: { type: Boolean, default: false },
  hasPpiBadge: { type: Boolean, default: false },
  departmentName: { type: String, default: "Core Team" },
  preTestQuestions: [{
    question: { type: String },
    options: { type: [String] },
    correctAnswer: { type: String }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Project", projectSchema);