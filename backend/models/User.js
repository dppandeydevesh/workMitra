const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: function() { return !this.googleId && !this.facebookId; } }, 
    userRole: { type: String, default: "student", enum: ["student", "company", "college", "admin"] }, // student, company, college, or admin
    
    // 🏢 Extra properties fields parsed perfectly by the frontend logic
    companyName: { type: String, default: null },
    targetSkills: { type: String, default: null },
    projectType: { type: String, default: null },
    collegeName: { type: String, default: null },
    enrollmentNumber: { type: String, default: null },
    mobile: { type: String, default: null, unique: true, sparse: true },
    resumeUrl: { type: String, default: null },
    resumeText: { type: String, default: null },
    cvReviewReport: { type: mongoose.Schema.Types.Mixed, default: null },
    githubUrl: { type: String, default: null },
    linkedinUrl: { type: String, default: null },
    portfolioUrl: { type: String, default: null },
    
    // 🏛️ College Profile & Controls (Phase 11)
    departmentName: { type: String, default: null },
    collegeEndorsedStudents: { type: [String], default: [] },
    collegeApprovedCompanies: { type: [String], default: [] },
    collegeBlockedCompanies: { type: [String], default: [] },
    
    // 💼 Placement attributes (Phase 13)
    placementStatus: { type: String, default: "Not Placed" }, // Not Placed | Offered | Placed
    companyOffers: [{
        companyEmail: { type: String },
        companyName: { type: String },
        offerText: { type: String },
        status: { type: String, default: "Pending" }, // Pending | Accepted | Rejected
        offeredAt: { type: Date, default: Date.now }
    }],

    // 🚀 NEW FEATURE: Boolean tracking flag for single-time form onboarding
    hasCompletedProfile: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isProfilePrivate: { type: Boolean, default: false },
    major: { type: String, default: "" },
    currentSemester: { type: String, default: "" },
    vanityUsername: { type: String, default: null, unique: true, sparse: true },
    videoPitchUrl: { type: String, default: "" },
    extracurriculars: { type: [String], default: [] },
    availabilitySlots: { type: [String], default: [] },
    preferredTechStack: { type: [String], default: [] },
    softSkillsVouches: [{
        vouchedBy: { type: String }, // student email
        skills: { type: [String] },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now }
    }],
    
    googleId: { type: String, default: null },
    facebookId: { type: String, default: null },
    
    // 🏢 Company Profile Metadata (Phase 10)
    companyBio: { type: String, default: "" },
    companyLogoUrl: { type: String, default: "" },
    companyWebsite: { type: String, default: "" },
    companyLinkedin: { type: String, default: "" },
    industryVertical: { type: String, default: "Technology" },
    teamSize: { type: String, default: "1-10" },
    defaultComplexity: { type: String, default: "Intermediate" },
    autoApproveApplications: { type: Boolean, default: false },

    // 🔑 Password reset tokens
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Hash password before saving if modified
UserSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    if (this.password && (this.password.startsWith('$2a$') || this.password.startsWith('$2b$'))) return;
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw err;
    }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);