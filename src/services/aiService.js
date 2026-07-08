import { fetchWithAuth } from './apiClient';
import { API_BASE_URL } from '../config';

/**
 * Fetch AI semantic matches (Pinecone) for a student.
 * @param {string} email - student email
 */
export async function fetchSemanticMatches(email) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/ai/semantic-match/${email}`);
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * Fetch Gemini-powered AI project recommendations for a student.
 * @param {string} email - student email
 */
export async function fetchAIRecommendations(email) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/projects/recommendations/${email}`);
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * Review a CV with AI and return a quality report.
 * @param {string} email
 * @param {string} resumeText
 */
export async function reviewCV(email, resumeText) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/ai/review-cv`, {
    credentials: 'include',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, resumeText }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}
