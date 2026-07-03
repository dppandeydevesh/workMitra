const fetch = require("node-fetch");

class AiService {
  static async evaluateResumeMatch(project, studentUser) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !studentUser || !studentUser.resumeText || !project) {
      return { matchScore: null, aiRationale: null };
    }

    try {
      const prompt = `Analyze this candidate's resume text against the project description and required skills. Estimate a match percentage (integer 0 to 100) and provide a concise, one-sentence rationale. Return ONLY a valid JSON object matching this schema:
{
  "matchScore": number,
  "aiRationale": "string"
}

Required Skills: ${project.requiredSkills.join(", ")}
Project Description: ${project.description}
Candidate Resume Text: ${studentUser.resumeText}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText) {
          const aiData = JSON.parse(aiText);
          if (typeof aiData.matchScore === "number") {
            return { matchScore: aiData.matchScore, aiRationale: aiData.aiRationale };
          }
        }
      }
    } catch (err) {
      console.error("AiService.evaluateResumeMatch error:", err.message);
    }
    return { matchScore: null, aiRationale: null };
  }

  static async auditSubmission(submissionText) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !submissionText) return { matchScore: null, aiRationale: null };

    try {
      const prompt = `Analyze this student's task submission code against the requirements. Grade the solution's code quality, correct implementation, and completeness on a scale of 0 to 100. Also write a one-sentence critique/rationale. Return ONLY a valid JSON object matching this schema:
{
  "score": number,
  "rationale": "string"
}

Submission Code: ${submissionText}
Explanatory details: ${submissionText}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText) {
          const aiData = JSON.parse(aiText);
          if (typeof aiData.score === "number") {
            return { matchScore: aiData.score, aiRationale: aiData.rationale };
          }
        }
      }
    } catch (err) {
      console.error("AiService.auditSubmission error:", err.message);
    }
    return { matchScore: null, aiRationale: null };
  }
}

module.exports = AiService;
