const User = require('../models/User');

const checkPassOrTrial = async (req, res, next) => {
  try {
    // Only restrict student users
    if (req.user.userRole !== 'student') {
      return next();
    }

    const student = await User.findOne({ email: req.user.email });
    if (!student) {
      return res.status(404).json({ error: 'Student account not found.' });
    }

    // 1 Month = 30 Days Free Trial
    const trialDurationMs = 30 * 24 * 60 * 60 * 1000;
    const isTrialActive = (Date.now() - new Date(student.createdAt).getTime()) < trialDurationMs;

    if (student.hasPaidPass || isTrialActive) {
      return next();
    }

    return res.status(403).json({ 
      error: "Premium Pass required", 
      requiresPass: true,
      message: "Premium Pass is required to access AI features and apply for startup gigs. Purchase a pass for just ₹99." 
    });
  } catch (err) {
    console.error('checkPassOrTrial error:', err);
    next(err);
  }
};

module.exports = checkPassOrTrial;
