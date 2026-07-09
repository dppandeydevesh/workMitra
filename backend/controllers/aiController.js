/**
 * aiController.js
 * Handles all AI-powered routes: Gemini CV review, ATS check, chat,
 * semantic matching (Pinecone), and recommendation engine.
 * Extracted from server.js inline handlers for maintainability.
 */

const User = require('../models/User');
const Project = require('../models/Project');
const AiService = require('../services/AiService');
const pdfParse = require('pdf-parse');
const { matchProjectsForStudent, backfillAllProjects } = require('../utils/pinecone');

// =========================================================================
// 🧠 Pinecone semantic match — top projects for a student
// =========================================================================
exports.semanticMatch = async (req, res) => {
  try {
    const { email } = req.params;
    if (req.user.email !== email) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const matches = await matchProjectsForStudent(user, 5);
    if (!matches) {
      return res.status(200).json({ pinecone: false, matches: [] });
    }

    const projectIds = matches.map(m => m.projectId);
    const projects = await Project.find({ _id: { $in: projectIds }, status: 'Published' })
      .populate('companyId', 'email companyName');

    const enriched = matches
      .map(m => {
        const project = projects.find(p => p._id.toString() === m.projectId);
        if (!project) return null;
        return { ...project.toObject(), semanticScore: m.score };
      })
      .filter(Boolean);

    res.status(200).json({ pinecone: true, matches: enriched });
  } catch (err) {
    console.error('[Semantic Match]', err);
    res.status(500).json({ error: 'Semantic match failed.' });
  }
};

// =========================================================================
// 🔄 Admin — backfill all existing projects into Pinecone
// =========================================================================
exports.pineconeBackfill = async (req, res) => {
  if (req.user.userRole !== 'admin') return res.status(403).json({ error: 'Admin only.' });
  try {
    const count = await backfillAllProjects(Project);
    res.status(200).json({ message: `Backfill complete. ${count} projects indexed.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =========================================================================
// 💡 AI Top Picks — personalised project recommendations for a student
// =========================================================================
exports.getRecommendations = async (req, res) => {
  try {
    const { email } = req.params;
    if (req.user.email !== email) {
      return res.status(403).json({ error: 'Unauthorized access.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userSkills = user.targetSkills || '';
    const projects = await Project.find({ status: 'Published' });
    if (!projects || projects.length === 0) {
      return res.status(200).json([]);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is missing.' });
    }

    const projectsList = projects.map(p => ({
      id: p._id.toString(),
      title: p.title,
      description: p.description,
      skills: p.requiredSkills?.join(', ') || ''
    }));

    const prompt = `You are an AI recommendations engine. 
Here is the user's skill profile:
Skills/Interests: ${userSkills}
Resume Summary: ${user.resumeText ? user.resumeText.substring(0, 500) : 'N/A'}

Here is a list of active projects available:
${JSON.stringify(projectsList)}

Select the top 3 project IDs that best match the user's profile.
Return ONLY a valid JSON array of strings (the 3 project IDs). No markdown, no explanation. Example: ["id1", "id2", "id3"]`;

    const result = await AiService.callGemini(prompt, { responseMimeType: 'application/json', temperature: 0.2 });

    let recommendedIds = [];
    if (result?.text) {
      try {
        recommendedIds = JSON.parse(result.text.trim());
// eslint-disable-next-line no-unused-vars
      } catch (e) {
        console.error('Failed to parse Gemini recommendations response:', result.text);
      }
    }

    if (!Array.isArray(recommendedIds)) recommendedIds = [];
    recommendedIds = recommendedIds.slice(0, 3);

    const recommendedProjects = await Project.find({ _id: { $in: recommendedIds } });
    const orderedProjects = recommendedIds
      .map(id => recommendedProjects.find(p => p._id.toString() === id))
      .filter(Boolean);

    res.status(200).json(orderedProjects);
  } catch (err) {
    console.error('AI Recommendations error:', err.message);
    res.status(500).json({ error: 'Failed to fetch AI recommendations.' });
  }
};

// =========================================================================
// 🤖 AI Assistant Chat (Mitra AI)
// =========================================================================
exports.chat = async (req, res) => {
  try {
    const { message, history, context } = req.body;
    const name = context?.name || 'User';
    const role = req.user.userRole || 'user';
    const pagePath = context?.path || 'unknown';

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is missing.' });
    }

    const systemPrompt = `You are Mitra AI, a helpful, enthusiastic, and highly knowledgeable assistant for the workMitra platform. The user's name is ${name}. They are a ${role}. They are currently on the page: ${pagePath}. Use this context to answer their query...`;

    const contents = [];
    if (history && Array.isArray(history)) {
      history.forEach(msg => {
        const msgRole = msg.role === 'ai' || msg.role === 'model' ? 'model' : 'user';
        const msgText = msg.text || msg.message || '';
        if (msgText) {
          contents.push({ role: msgRole, parts: [{ text: msgText }] });
        }
      });
    }
    if (message) {
      contents.push({ role: 'user', parts: [{ text: message }] });
    }

    const result = await AiService.callGeminiWithHistory(systemPrompt, contents, { temperature: 0.7 });
    const responseText = result?.text || "I'm sorry, I couldn't generate a response.";

    res.status(200).json({ text: responseText });
  } catch (err) {
    console.error('AI Chat error:', err.message);
    res.status(500).json({ error: 'Failed to process AI chat request.' });
  }
};

// =========================================================================
// 🧠 CV Review — Gemini-powered resume critique
// =========================================================================
exports.reviewCV = async (req, res) => {
  try {
    const { email, resumeText } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    if (req.user.email !== email) {
      return res.status(403).json({ error: 'Unauthorized CV review request.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const textToAnalyze = resumeText || user.resumeText;
    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
      return res.status(400).json({ error: 'No CV text available for analysis. Please paste your CV details first.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured in the server.' });
    }

    const prompt = `You are an expert recruiter and CV critique specialist.
Review the following CV text carefully. Assess its layout, impact, clarity, skills showcase, and actionable achievements.
Provide your response strictly in the following JSON format without any surrounding markdown formatting, code blocks, or extra text.

JSON Structure:
{
  "score": 85,
  "strengths": [
    "Clear structure and formatting",
    "Quantified accomplishments in previous projects",
    "Strong technical skills section"
  ],
  "improvements": [
    "Add more action-oriented verbs",
    "Include links to live projects or code repositories",
    "Expand details on university level contributions"
  ],
  "recommendations": "Overall, your CV is in good shape. To stand out to companies on workMitra, we recommend emphasizing specific engineering metrics and ensuring your Git links are visible."
}

CV Text to analyze:
${textToAnalyze}`;

    const result = await AiService.callGemini(prompt, { responseMimeType: 'application/json', temperature: 0 });

    if (!result?.text) {
      return res.status(500).json({ error: 'Empty response from AI engine.' });
    }

    let reviewReport;
    try {
      reviewReport = JSON.parse(result.text.trim());
// eslint-disable-next-line no-unused-vars
    } catch (parseErr) {
      reviewReport = {
        score: 70,
        strengths: ['Raw CV text submitted successfully'],
        improvements: ['Could not parse structured AI review output'],
        recommendations: 'Please try reviewing again with a more standard CV layout. Raw output: ' + result.text.slice(0, 200)
      };
    }

    user.resumeText = textToAnalyze;
    user.cvReviewReport = reviewReport;
    await user.save();

    res.status(200).json({
      message: 'CV reviewed successfully by workMitra AI!',
      report: reviewReport
    });
  } catch (err) { console.error(err);
    res.status(500).json({ error: 'Failed to execute AI resume scan.' });
  }
};

// =========================================================================
// 📄 ATS Resume Check against Job Role (file upload endpoint)
// =========================================================================
exports.resumeCheck = async (req, res) => {
  try {
    const { jobRole } = req.body;
    if (!jobRole) {
      return res.status(400).json({ error: 'jobRole is required.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'resume file is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured.' });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from the provided PDF.' });
    }

    const prompt = `You are an expert Applicant Tracking System (ATS).
Review the following resume text against the job role: "${jobRole}".
Provide your response strictly in the following JSON format without any surrounding markdown formatting or code blocks.

JSON Structure:
{
  "score": 85,
  "missingKeywords": ["Docker", "Kubernetes", "Agile"],
  "feedback": "The candidate has strong backend skills but lacks cloud deployment experience required for this role."
}

Resume Text:
${resumeText}`;

    const result = await AiService.callGemini(prompt, { responseMimeType: 'application/json', temperature: 0.2 });

    if (!result?.text) {
      return res.status(500).json({ error: 'Empty response from AI engine.' });
    }

    let atsReport;
    try {
      atsReport = JSON.parse(result.text.trim());
// eslint-disable-next-line no-unused-vars
    } catch (parseErr) {
      return res.status(500).json({ error: 'Failed to parse AI response into JSON.' });
    }

    res.status(200).json(atsReport);
  } catch (err) {
    console.error('ATS Resume Check error:', err.message);
    res.status(500).json({ error: 'Failed to execute ATS resume check.' });
  }
};
