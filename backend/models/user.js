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
    
    googleId: { type: String, default: null },
    facebookId: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);