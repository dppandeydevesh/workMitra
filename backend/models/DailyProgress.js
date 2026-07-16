const mongoose = require('mongoose');

// Per-student, per-day record of the "Today's 3 Tasks" checklist.
const dailyProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD in Asia/Kolkata
    tasks: {
      question: { type: Boolean, default: false }, // answered today's challenge
      explore: { type: Boolean, default: false }, // opened a project's details
      improve: { type: Boolean, default: false }, // resume check or profile update
    },
    questionAnswerIndex: { type: Number, default: null },
    questionCorrect: { type: Boolean, default: null },
    completedAll: { type: Boolean, default: false },
  },
  { timestamps: true }
);

dailyProgressSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports =
  mongoose.models.DailyProgress || mongoose.model('DailyProgress', dailyProgressSchema);
