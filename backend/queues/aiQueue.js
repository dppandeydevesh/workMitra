const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const AiService = require('../services/AiService');

let redisUrl = process.env.REDIS_URL || '';
// Upstash non-ACL databases reject the 'default' username from IORedis connection strings
if (redisUrl.includes('rediss://default:')) {
  redisUrl = redisUrl.replace('rediss://default:', 'rediss://:');
}

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
});

const aiQueue = new Queue('ai-tasks', { connection });

const aiWorker = new Worker('ai-tasks', async (job) => {
  const { type, payload } = job.data;

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
        console.error('Failed to parse Gemini recommendations response:', result.text);
      }
    }

    if (!Array.isArray(recommendedIds)) recommendedIds = [];
    return recommendedIds.slice(0, 3);
  }
}, { connection, concurrency: 2 });

aiWorker.on('completed', (job, result) => {
  console.log(`AI job ${job.id} completed`);
});

aiWorker.on('failed', (job, err) => {
  console.error(`AI job ${job.id} failed:`, err.message);
});

module.exports = { aiQueue, aiWorker };
