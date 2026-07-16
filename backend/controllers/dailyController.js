const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DailyChallenge = require('../models/DailyChallenge');
const DailyProgress = require('../models/DailyProgress');
const AiService = require('../services/AiService');

// All "days" are IST calendar days — the user base is in India, and a UTC
// boundary would roll the streak over at 5:30 AM local time.
const istToday = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

const istYesterday = (dateStr) => {
  const anchor = new Date(`${dateStr}T00:00:00Z`);
  anchor.setUTCDate(anchor.getUTCDate() - 1);
  return anchor.toISOString().slice(0, 10);
};

const CATEGORIES = ['DSA', 'Aptitude', 'CS Fundamentals', 'HR Interview', 'Verbal Ability'];

// Served when Gemini is unavailable so the daily loop never breaks.
const FALLBACK_QUESTIONS = [
  {
    category: 'DSA',
    question: 'What is the average-case time complexity of searching in a balanced binary search tree with n nodes?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctIndex: 1,
    explanation: 'A balanced BST halves the search space at every level, giving O(log n) on average and in the worst case.',
  },
  {
    category: 'Aptitude',
    question: 'A train 150 m long crosses a pole in 15 seconds. What is its speed in km/h?',
    options: ['30 km/h', '36 km/h', '40 km/h', '45 km/h'],
    correctIndex: 1,
    explanation: 'Speed = 150 m / 15 s = 10 m/s. Multiply by 3.6 to convert: 36 km/h.',
  },
  {
    category: 'CS Fundamentals',
    question: 'Which of these is NOT a necessary condition for a deadlock to occur?',
    options: ['Mutual exclusion', 'Hold and wait', 'Preemption', 'Circular wait'],
    correctIndex: 2,
    explanation: 'Deadlock requires NO preemption. The four Coffman conditions are mutual exclusion, hold and wait, no preemption, and circular wait.',
  },
  {
    category: 'HR Interview',
    question: 'An interviewer asks "Tell me about a time you failed." What is the strongest structure for your answer?',
    options: [
      'Explain why the failure was not your fault',
      'Describe the situation, your action, the result, and what you learned',
      'Pick a fake failure that is secretly a strength',
      'Say you have never really failed at anything',
    ],
    correctIndex: 1,
    explanation: 'The STAR structure (Situation, Task, Action, Result) plus an explicit lesson shows self-awareness — the trait the question is testing.',
  },
  {
    category: 'Verbal Ability',
    question: 'Choose the word most nearly OPPOSITE in meaning to "candid":',
    options: ['Frank', 'Evasive', 'Blunt', 'Sincere'],
    correctIndex: 1,
    explanation: '"Candid" means open and honest; "evasive" — avoiding direct answers — is its opposite. The other options are synonyms.',
  },
  {
    category: 'DSA',
    question: 'Which data structure is most suitable for implementing an undo feature in a text editor?',
    options: ['Queue', 'Stack', 'Heap', 'Hash map'],
    correctIndex: 1,
    explanation: 'Undo reverses the most recent action first — last in, first out — which is exactly what a stack provides.',
  },
  {
    category: 'Aptitude',
    question: 'If 12 workers finish a job in 20 days, how many days will 15 workers take at the same rate?',
    options: ['14 days', '15 days', '16 days', '18 days'],
    correctIndex: 2,
    explanation: 'Total work = 12 × 20 = 240 worker-days. With 15 workers: 240 / 15 = 16 days.',
  },
  {
    category: 'CS Fundamentals',
    question: 'In SQL, which JOIN returns all rows from the left table even when there is no match in the right table?',
    options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'CROSS JOIN'],
    correctIndex: 1,
    explanation: 'LEFT JOIN keeps every row of the left table, filling unmatched right-table columns with NULL.',
  },
  {
    category: 'HR Interview',
    question: '"Why do you want to join our company?" is best answered by:',
    options: [
      'Praising the salary and benefits package',
      'Saying you will join any company that hires you',
      'Connecting the company’s work to your specific skills and goals',
      'Repeating the job description back to the interviewer',
    ],
    correctIndex: 2,
    explanation: 'Interviewers look for evidence you researched the company and can map your skills to their needs — specificity beats flattery.',
  },
  {
    category: 'Verbal Ability',
    question: 'Identify the grammatically correct sentence:',
    options: [
      'Each of the students have submitted their reports.',
      'Each of the students has submitted their report.',
      'Each of the students have submitted his report.',
      'Each of the student has submitted their reports.',
    ],
    correctIndex: 1,
    explanation: '"Each" is singular, so it takes the singular verb "has". Singular "their" is the accepted neutral pronoun.',
  },
];

const dayOfYear = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 0));
  return Math.floor((d - start) / 86400000);
};

const generateQuestionWithGemini = async (category) => {
  const prompt = `Generate ONE multiple-choice question for Indian engineering students preparing for campus placements.
Category: ${category}.
Difficulty: moderate (final-year B.Tech level). Keep the question under 60 words.
Respond with ONLY valid JSON, no markdown fences, in exactly this shape:
{"question": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0, "explanation": "one or two sentences explaining the answer"}`;

  const result = await AiService.callGemini(prompt, {
    temperature: 0.9,
    responseMimeType: 'application/json',
  });
  if (!result?.text) return null;

  try {
    const cleaned = result.text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (
      typeof parsed.question === 'string' &&
      Array.isArray(parsed.options) &&
      parsed.options.length === 4 &&
      Number.isInteger(parsed.correctIndex) &&
      parsed.correctIndex >= 0 &&
      parsed.correctIndex <= 3
    ) {
      return {
        question: parsed.question,
        options: parsed.options.map(String),
        correctIndex: parsed.correctIndex,
        explanation: String(parsed.explanation || ''),
      };
    }
  } catch (err) {
    console.error('[daily] Failed to parse Gemini question JSON:', err.message);
  }
  return null;
};

// Find today's challenge, generating (and caching) it on first request.
const getOrCreateTodaysChallenge = async () => {
  const date = istToday();
  const existing = await DailyChallenge.findOne({ date });
  if (existing) return existing;

  const category = CATEGORIES[dayOfYear(date) % CATEGORIES.length];
  const generated = await generateQuestionWithGemini(category);
  const fallback = FALLBACK_QUESTIONS[dayOfYear(date) % FALLBACK_QUESTIONS.length];

  const doc = generated
    ? { date, category, ...generated, source: 'gemini' }
    : { date, category: fallback.category, ...fallback, source: 'fallback' };

  try {
    return await DailyChallenge.create(doc);
  } catch (err) {
    // Two students raced the first request of the day — the unique index on
    // date makes one insert lose; serve the winner's document.
    if (err.code === 11000) return DailyChallenge.findOne({ date });
    throw err;
  }
};

const getOrCreateProgress = async (userId, date) => {
  try {
    return await DailyProgress.findOneAndUpdate(
      { userId, date },
      { $setOnInsert: { userId, date } },
      { new: true, upsert: true }
    );
  } catch (err) {
    if (err.code === 11000) return DailyProgress.findOne({ userId, date });
    throw err;
  }
};

// Effective streak treats a missed day as broken without needing a cron to
// reset it: the stored count only "counts" if the last completed day is
// today or yesterday.
const effectiveStreak = (user, today) => {
  if (!user.lastStreakDate) return 0;
  if (user.lastStreakDate === today || user.lastStreakDate === istYesterday(today)) {
    return user.dailyStreak;
  }
  return 0;
};

// When all three tasks are done for the first time today, extend the streak.
const applyCompletionIfDone = async (progress, userId, today) => {
  const { question, explore, improve } = progress.tasks;
  if (progress.completedAll || !question || !explore || !improve) return null;

  progress.completedAll = true;
  await progress.save();

  const user = await User.findById(userId);
  if (!user || user.lastStreakDate === today) return user;

  const continuing = user.lastStreakDate === istYesterday(today);
  user.dailyStreak = continuing ? user.dailyStreak + 1 : 1;
  user.longestStreak = Math.max(user.longestStreak || 0, user.dailyStreak);
  user.lastStreakDate = today;
  await user.save();
  return user;
};

// =========================================================================
// GET /api/daily/status — streak + today's checklist state
// =========================================================================
exports.getStatus = async (req, res, next) => {
  try {
    if (req.user.userRole !== 'student') {
      return res.status(403).json({ error: 'Daily tasks are available for students only.' });
    }
    const today = istToday();
    const [user, progress] = await Promise.all([
      User.findById(req.user.userId).select('dailyStreak longestStreak lastStreakDate'),
      DailyProgress.findOne({ userId: req.user.userId, date: today }),
    ]);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.status(200).json({
      date: today,
      streak: effectiveStreak(user, today),
      longestStreak: user.longestStreak || 0,
      completedAll: progress?.completedAll || false,
      tasks: {
        question: progress?.tasks?.question || false,
        explore: progress?.tasks?.explore || false,
        improve: progress?.tasks?.improve || false,
      },
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

// =========================================================================
// GET /api/daily/question — today's question (without the answer)
// =========================================================================
exports.getQuestion = async (req, res, next) => {
  try {
    if (req.user.userRole !== 'student') {
      return res.status(403).json({ error: 'Daily tasks are available for students only.' });
    }
    const today = istToday();
    const [challenge, progress] = await Promise.all([
      getOrCreateTodaysChallenge(),
      DailyProgress.findOne({ userId: req.user.userId, date: today }),
    ]);

    const alreadyAnswered = progress?.tasks?.question || false;
    res.status(200).json({
      date: challenge.date,
      category: challenge.category,
      question: challenge.question,
      options: challenge.options,
      attemptCount: challenge.attemptCount,
      alreadyAnswered,
      // After answering, it's fine to reveal the result again on refresh
      ...(alreadyAnswered && {
        correctIndex: challenge.correctIndex,
        explanation: challenge.explanation,
        yourAnswerIndex: progress.questionAnswerIndex,
        yourAnswerCorrect: progress.questionCorrect,
        correctPercent:
          challenge.attemptCount > 0
            ? Math.round((challenge.correctCount / challenge.attemptCount) * 100)
            : 0,
      }),
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

// =========================================================================
// POST /api/daily/question/answer — submit answer, get result + streak update
// =========================================================================
exports.answerQuestion = async (req, res, next) => {
  try {
    if (req.user.userRole !== 'student') {
      return res.status(403).json({ error: 'Daily tasks are available for students only.' });
    }
    const { answerIndex } = req.body;
    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) {
      return res.status(400).json({ error: 'answerIndex must be an integer between 0 and 3.' });
    }

    const today = istToday();
    const challenge = await getOrCreateTodaysChallenge();
    const progress = await getOrCreateProgress(req.user.userId, today);

    if (progress.tasks.question) {
      return res.status(400).json({ error: 'You have already answered today’s question.' });
    }

    const correct = answerIndex === challenge.correctIndex;
    progress.tasks.question = true;
    progress.questionAnswerIndex = answerIndex;
    progress.questionCorrect = correct;
    await progress.save();

    challenge.attemptCount += 1;
    if (correct) challenge.correctCount += 1;
    await challenge.save();

    const user = await applyCompletionIfDone(progress, req.user.userId, today);

    res.status(200).json({
      correct,
      correctIndex: challenge.correctIndex,
      explanation: challenge.explanation,
      attemptCount: challenge.attemptCount,
      correctPercent: Math.round((challenge.correctCount / challenge.attemptCount) * 100),
      completedAll: progress.completedAll,
      ...(user && { streak: effectiveStreak(user, today) }),
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

// =========================================================================
// POST /api/daily/track — mark the explore/improve task done for today
// =========================================================================
exports.trackTask = async (req, res, next) => {
  try {
    if (req.user.userRole !== 'student') {
      return res.status(403).json({ error: 'Daily tasks are available for students only.' });
    }
    const { task } = req.body;
    if (!['explore', 'improve'].includes(task)) {
      return res.status(400).json({ error: 'task must be "explore" or "improve".' });
    }

    const today = istToday();
    const progress = await getOrCreateProgress(req.user.userId, today);
    if (!progress.tasks[task]) {
      progress.tasks[task] = true;
      await progress.save();
    }

    const user = await applyCompletionIfDone(progress, req.user.userId, today);
    const freshUser =
      user || (await User.findById(req.user.userId).select('dailyStreak lastStreakDate longestStreak'));

    res.status(200).json({
      tasks: progress.tasks,
      completedAll: progress.completedAll,
      streak: effectiveStreak(freshUser, today),
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

// =========================================================================
// GET /api/daily/digest/unsubscribe?token=... — one-click digest opt-out
// (no auth — the signed token in the email link is the credential)
// =========================================================================
exports.unsubscribeDigest = async (req, res) => {
  try {
    const { token } = req.query;
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (payload.purpose !== 'digest-unsub') throw new Error('wrong token purpose');

    await User.updateOne({ email: payload.email }, { $set: { emailDigestOptOut: true } });
    res
      .status(200)
      .send(
        '<html><body style="font-family:sans-serif;text-align:center;padding:60px;"><h2>You’re unsubscribed ✅</h2><p>You will no longer receive the workMitra daily digest.</p></body></html>'
      );
  } catch {
    res.status(400).send('Invalid or expired unsubscribe link.');
  }
};
