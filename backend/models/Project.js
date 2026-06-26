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
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Project", projectSchema);