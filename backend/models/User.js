const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: function() { return !this.googleId && !this.facebookId; } }, 
    userRole: { type: String, default: "student" }, // student or company
    
    // 🏢 Extra properties fields parsed perfectly by the frontend logic
    companyName: { type: String, default: null },
    targetSkills: { type: String, default: null },
    projectType: { type: String, default: null },
    collegeName: { type: String, default: null },
    enrollmentNumber: { type: String, default: null },
    mobile: { type: String, default: null },
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
}, { timestamps: true });

// Hash password before saving if modified
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);