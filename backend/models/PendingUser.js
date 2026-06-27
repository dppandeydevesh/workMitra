const mongoose = require("mongoose");

const pendingUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  emailOtp: { type: String, required: true },
  mobileOtp: { type: String, required: true },
  registrationData: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } // Auto-deletes after 10 minutes
});

module.exports = mongoose.model("PendingUser", pendingUserSchema);
