// =========================================================================
// 🤖 In-process AI job runner
//
// Replaces the previous BullMQ + Redis implementation. BullMQ workers poll
// Redis continuously even when idle, which exhausted the Upstash free-tier
// command quota (500k/month) and broke every Redis consumer in production.
// We run a single server instance and the only queued work is short-lived
// Gemini calls, so an in-memory queue is simpler, free, and just as correct.
// Trade-off: pending jobs are lost on restart/deploy — the frontend already
// handles that (polling gives up after ~60s and asks the user to retry).
// =========================================================================
const crypto = require('crypto');
const AiService = require('../services/AiService');

const CONCURRENCY = 2; // mirror the old BullMQ worker setting
const JOB_TTL_MS = 30 * 60 * 1000; // forget finished jobs after 30 minutes

const jobs = new Map(); // id -> { id, state, returnvalue, failedReason, createdAt }
const waiting = [];
let activeCount = 0;

// Periodically drop old jobs so the map never grows unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > JOB_TTL_MS) jobs.delete(id);
  }
}, 5 * 60 * 1000).unref();

async function processJob(job) {
  const { type, payload } = job;

  if (type === 'cv-review' || type === 'resume-check') {
    const prompt = `You are an expert Applicant Tracking System (ATS).
Review the following resume text against the job role: "${payload.jobRole || payload.jobDescription}".
Provide your response strictly in the following JSON format without any surrounding markdown formatting or code blocks.

JSON Structure:
{
  "score": 85,
  "missingKeywords": ["Docker", "Kubernetes", "Agile"],
  "feedback": "The candidate has strong backend skills but lacks cloud deployment experience required for this role."
}

Resume Text:
${payload.resumeText || payload.cvText}`;

    const result = await AiService.callGemini(prompt, { responseMimeType: 'application/json', temperature: 0.2 });

    if (!result?.text) {
      throw new Error('Empty response from AI engine.');
    }

    try {
      return JSON.parse(result.text.trim());
    } catch (parseErr) {
      console.error(parseErr);
      throw new Error('Failed to parse AI response into JSON.');
    }
  }

  if (type === 'job-match') {
    const prompt = `You are an AI recommendations engine.
Here is the user's skill profile:
Skills/Interests: ${payload.studentProfile}
Resume Summary: ${payload.resumeText || 'N/A'}

Here is a list of active projects available:
${JSON.stringify(payload.projects)}

Select the top 3 project IDs that best match the user's profile.
Return ONLY a valid JSON array of strings (the 3 project IDs). No markdown, no explanation. Example: ["id1", "id2", "id3"]`;

    const result = await AiService.callGemini(prompt, { responseMimeType: 'application/json', temperature: 0.2 });

    let recommendedIds = [];
    if (result?.text) {
      try {
        recommendedIds = JSON.parse(result.text.trim());
      } catch (e) {
        throw new Error('Failed to parse Gemini recommendations response: ' + e.message);
      }
    } else {
      throw new Error('Empty response from AI engine for job match.');
    }

    if (!Array.isArray(recommendedIds)) recommendedIds = [];
    return recommendedIds.slice(0, 3);
  }

  throw new Error(`Unknown AI job type: ${type}`);
}

function runNext() {
  if (activeCount >= CONCURRENCY) return;
  const job = waiting.shift();
  if (!job) return;

  activeCount++;
  job.state = 'active';
  processJob(job)
    .then((result) => {
      job.state = 'completed';
      job.returnvalue = result;
      console.log(`AI job ${job.id} completed`);
    })
    .catch((err) => {
      job.state = 'failed';
      job.failedReason = err.message;
      console.error(`AI job ${job.id} failed:`, err.message);
    })
    .finally(() => {
      activeCount--;
      runNext();
    });
}

/**
 * Enqueue an AI job. Returns immediately with `{ id }`; callers poll getJob().
 * Random UUIDs (not sequential ids) so one user cannot guess another's job id.
 */
function addJob(type, payload) {
  const job = {
    id: crypto.randomUUID(),
    type,
    payload,
    state: 'waiting',
    returnvalue: null,
    failedReason: null,
    createdAt: Date.now(),
  };
  jobs.set(job.id, job);
  waiting.push(job);
  setImmediate(runNext);
  return job;
}

function getJob(id) {
  return jobs.get(String(id)) || null;
}

module.exports = { addJob, getJob };
