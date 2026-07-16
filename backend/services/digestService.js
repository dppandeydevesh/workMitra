/**
 * digestService.js
 * Daily 8:00 AM IST engagement digest for students:
 *   - new projects from the last 24h that match their skills
 *   - application status changes (Approved / Rejected)
 *   - streak-at-risk reminder + today's daily question nudge
 * Runs in-process on a self-rescheduling timer — no external cron needed on
 * a single Render instance.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');
const Application = require('../models/Application');
const { sendEmail } = require('../utils/email');

const DIGEST_HOUR_UTC = 2; // 08:00 IST == 02:30 UTC
const DIGEST_MINUTE_UTC = 30;
const BATCH_DELAY_MS = 700; // stay under Resend's ~2 req/s free-tier limit

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const istYesterday = () => {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const anchor = new Date(`${today}T00:00:00Z`);
  anchor.setUTCDate(anchor.getUTCDate() - 1);
  return anchor.toISOString().slice(0, 10);
};

const skillSetOf = (user) =>
  new Set(
    (user.preferredTechStack || [])
      .concat((user.targetSkills || '').split(','))
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );

const matchProjects = (projects, studentSkills) => {
  const scored = projects.map((p) => {
    const required = (p.requiredSkills || []).map((s) => s.trim().toLowerCase());
    const matches = required.filter((s) => studentSkills.has(s)).length;
    return { p, matches };
  });
  scored.sort((a, b) => b.matches - a.matches);
  return scored.slice(0, 3).map((s) => s.p);
};

const buildDigestHtml = ({ fullName, newProjects, statusChanges, streakAtRisk, streak, unsubUrl, appUrl }) => {
  const projectRows = newProjects
    .map(
      (p) => `
        <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
          <a href="${appUrl}/project/${p._id}" style="color:#1B2333;font-weight:bold;text-decoration:none;">${p.title}</a><br/>
          <span style="color:#6B7280;font-size:12px;">${(p.requiredSkills || []).slice(0, 4).join(' · ')}${p.workType ? ` · ${p.workType}` : ''}</span>
        </td></tr>`
    )
    .join('');

  const statusRows = statusChanges
    .map(
      (a) => `
        <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
          <span style="font-weight:bold;color:${a.status === 'Approved' ? '#16a34a' : '#dc2626'};">${a.status}</span>
          — ${a.projectId?.title || 'a project you applied to'}
        </td></tr>`
    )
    .join('');

  return `
  <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px;">
    <h2 style="color:#F5A623;margin-top:0;">Good morning, ${fullName?.split(' ')[0] || 'there'} ☀️</h2>
    ${
      streakAtRisk
        ? `<div style="background:#FFF7E8;border:1px solid #F5A623;border-radius:8px;padding:12px;margin-bottom:16px;">
             🔥 <b>Your ${streak}-day streak is on the line!</b> Complete today's 3 tasks to keep it alive.
           </div>`
        : `<p style="color:#374151;">Today's placement question is live — take 2 minutes and keep your prep moving.</p>`
    }
    ${
      newProjects.length
        ? `<h3 style="color:#1B2333;margin-bottom:4px;">✨ New projects for you</h3>
           <table style="width:100%;border-collapse:collapse;">${projectRows}</table>`
        : ''
    }
    ${
      statusChanges.length
        ? `<h3 style="color:#1B2333;margin-bottom:4px;">📬 Application updates</h3>
           <table style="width:100%;border-collapse:collapse;">${statusRows}</table>`
        : ''
    }
    <div style="text-align:center;margin:24px 0 8px;">
      <a href="${appUrl}/dashboard" style="background:#F5A623;color:#fff;text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:10px;display:inline-block;">
        Open workMitra
      </a>
    </div>
    <p style="color:#9CA3AF;font-size:11px;text-align:center;margin-top:20px;">
      You're receiving this daily digest from workMitra.
      <a href="${unsubUrl}" style="color:#9CA3AF;">Unsubscribe</a>
    </p>
  </div>`;
};

const sendDailyDigests = async () => {
  if (!process.env.RESEND_API_KEY) {
    console.log('[digest] RESEND_API_KEY not set — skipping digest run.');
    return;
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const appUrl = process.env.FRONTEND_URL || 'https://workmitra.me';
  const yesterday = istYesterday();

  try {
    const [students, newProjects] = await Promise.all([
      User.find({ userRole: 'student', emailDigestOptOut: { $ne: true } }).select(
        'email fullName targetSkills preferredTechStack dailyStreak lastStreakDate'
      ),
      Project.find({ createdAt: { $gte: since }, status: 'Published' }).select(
        'title requiredSkills workType'
      ),
    ]);

    let sent = 0;
    for (const student of students) {
      try {
        const statusChanges = await Application.find({
          studentEmail: student.email,
          status: { $in: ['Approved', 'Rejected'] },
          updatedAt: { $gte: since },
        })
          .populate('projectId', 'title')
          .limit(5);

        const streakAtRisk = student.lastStreakDate === yesterday && student.dailyStreak > 0;
        const matched = matchProjects(newProjects, skillSetOf(student));

        // Never send an empty email — only mail when there is something new
        // to say (fresh projects, an application update, or a streak to save).
        if (!matched.length && !statusChanges.length && !streakAtRisk) continue;

        const unsubToken = jwt.sign(
          { email: student.email, purpose: 'digest-unsub' },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: '90d' }
        );
        const unsubUrl = `${appUrl}/api/daily/digest/unsubscribe?token=${unsubToken}`;

        const subjectBits = [];
        if (matched.length) subjectBits.push(`${matched.length} new project${matched.length > 1 ? 's' : ''}`);
        if (statusChanges.length) subjectBits.push('application updates');
        if (streakAtRisk) subjectBits.push(`your ${student.dailyStreak}-day streak`);

        const ok = await sendEmail({
          to: student.email,
          subject: `☀️ workMitra daily: ${subjectBits.join(' + ')}`,
          html: buildDigestHtml({
            fullName: student.fullName,
            newProjects: matched,
            statusChanges,
            streakAtRisk,
            streak: student.dailyStreak,
            unsubUrl,
            appUrl,
          }),
        });
        if (ok) sent += 1;
        await sleep(BATCH_DELAY_MS);
      } catch (err) {
        console.error(`[digest] Failed for ${student.email}:`, err.message);
      }
    }
    console.log(`[digest] Run complete — ${sent}/${students.length} digests sent.`);
  } catch (err) {
    console.error('[digest] Run failed:', err.message);
  }
};

const msUntilNextRun = () => {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(DIGEST_HOUR_UTC, DIGEST_MINUTE_UTC, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next - now;
};

const startDigestScheduler = () => {
  const schedule = () => {
    const delay = msUntilNextRun();
    console.log(`[digest] Next digest run in ${Math.round(delay / 60000)} minutes.`);
    setTimeout(async () => {
      await sendDailyDigests();
      schedule();
    }, delay);
  };
  schedule();
};

module.exports = { startDigestScheduler, sendDailyDigests };
