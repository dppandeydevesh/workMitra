/**
 * AiService.js
 * Centralized service for all Google Gemini API interactions.
 * All AI features should route through these methods instead of
 * directly calling the Gemini API to ensure consistent error handling.
 */

class AiService {
  static get _apiKey() {
    return process.env.GEMINI_API_KEY;
  }

  static get _apiUrl() {
    return process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  }

  // =========================================================================
  // 🔧 Core helper: Single-prompt Gemini call
  // Returns { text } on success, null on failure
  // =========================================================================
  static async callGemini(prompt, generationConfig = {}) {
    const apiKey = this._apiKey;
    if (!apiKey) {
      console.error('[AiService] GEMINI_API_KEY is not set.');
      return null;
    }

    try {
      const response = await fetch(this._apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig
        })
      });

      if (!response.ok) {
        const errData = await response.text();
        console.error('[AiService] Gemini API error:', errData);
        return null;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return text ? { text } : null;
    } catch (err) {
      console.error('[AiService] callGemini error:', err.message);
      return null;
    }
  }

  // =========================================================================
  // 🔧 Core helper: Multi-turn chat Gemini call (with history + system prompt)
  // Returns { text } on success, null on failure
  // =========================================================================
  static async callGeminiWithHistory(systemPrompt, contents, generationConfig = {}) {
    const apiKey = this._apiKey;
    if (!apiKey) {
      console.error('[AiService] GEMINI_API_KEY is not set.');
      return null;
    }

    try {
      const response = await fetch(this._apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig
        })
      });

      if (!response.ok) {
        const errData = await response.text();
        console.error('[AiService] Gemini chat API error:', errData);
        return null;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return text ? { text } : null;
    } catch (err) {
      console.error('[AiService] callGeminiWithHistory error:', err.message);
      return null;
    }
  }

  // =========================================================================
  // 📊 Resume vs. Project match scoring (used by applicationController)
  // =========================================================================
  static async evaluateResumeMatch(project, studentUser) {
    if (!studentUser?.resumeText || !project) {
      return { matchScore: null, aiRationale: null };
    }

    const prompt = `Analyze this candidate's resume text against the project description and required skills. Estimate a match percentage (integer 0 to 100) and provide a concise, one-sentence rationale. Return ONLY a valid JSON object matching this schema:
{
  "matchScore": number,
  "aiRationale": "string"
}

Required Skills: ${project.requiredSkills.join(', ')}
Project Description: ${project.description}
Candidate Resume Text: ${studentUser.resumeText}`;

    try {
      const result = await this.callGemini(prompt, { responseMimeType: 'application/json' });
      if (result?.text) {
        const aiData = JSON.parse(result.text);
        if (typeof aiData.matchScore === 'number') {
          return { matchScore: aiData.matchScore, aiRationale: aiData.aiRationale };
        }
      }
    } catch (err) {
      console.error('AiService.evaluateResumeMatch error:', err.message);
    }
    return { matchScore: null, aiRationale: null };
  }

  // =========================================================================
  // 🔍 Submission code quality audit (used by applicationController)
  // =========================================================================
  static async auditSubmission(submissionText) {
    if (!submissionText) return { matchScore: null, aiRationale: null };

    const prompt = `Analyze this student's task submission code against the requirements. Grade the solution's code quality, correct implementation, and completeness on a scale of 0 to 100. Also write a one-sentence critique/rationale. Return ONLY a valid JSON object matching this schema:
{
  "score": number,
  "rationale": "string"
}

Submission Code: ${submissionText}`;

    try {
      const result = await this.callGemini(prompt, { responseMimeType: 'application/json' });
      if (result?.text) {
        const aiData = JSON.parse(result.text);
        if (typeof aiData.score === 'number') {
          return { matchScore: aiData.score, aiRationale: aiData.rationale };
        }
      }
    } catch (err) {
      console.error('AiService.auditSubmission error:', err.message);
    }
    return { matchScore: null, aiRationale: null };
  }
}

module.exports = AiService;

