const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: function() { return !this.googleId && !this.facebookId; } }, 
    userRole: { type: String, default: "freelancer" }, // freelancer or client
    
    // 🏢 Extra properties fields parsed perfectly by the frontend logic
    companyName: { type: String, default: null },
    targetSkills: { type: String, default: null },
    projectType: { type: String, default: null },
    collegeName: { type: String, default: null },
    enrollmentNumber: { type: String, default: null },
    resumeUrl: { type: String, default: null },
    resumeText: { type: String, default: null },
    cvReviewReport: { type: mongoose.Schema.Types.Mixed, default: null },
    
    // 🚀 NEW FEATURE: Boolean tracking flag for single-time form onboarding
    hasCompletedProfile: { type: Boolean, default: false },
    
    googleId: { type: String, default: null },
    facebookId: { type: String, default: null },
    
    // 🔑 Password reset tokens
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);