const mongoose = require("mongoose");

const companyProfileSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  website: { type: String, required: true },
  industry: { type: String, required: true },
  companySize: { type: String, required: true },
  location: { type: String, required: true },

  requiredRoles: [String],
  requiredSkills: [String],

  projectTitle: { type: String, required: true },
  projectDescription: { type: String, required: true },
  projectDuration: { type: String, required: true },

  hiringType: { type: String, default: "Internship" },
  budgetMin: { type: Number, required: true },
  budgetMax: { type: Number, required: true },

  workMode: { type: String, default: "Remote" },
  studentsRequired: { type: String, default: "1" },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CompanyProfile", companyProfileSchema);