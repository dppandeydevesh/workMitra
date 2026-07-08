import { fetchWithAuth } from './apiClient';
import { API_BASE_URL } from '../config';

/**
 * Fetch projects list (recommended for students, all for companies).
 * @param {object} userObj - current user object from localStorage
 * @param {number} page - current page number
 * @param {number} limit - items per page
 */
export async function fetchProjects(userObj, page, limit) {
  const isStudent = userObj && userObj.userRole === 'student';
  const url = isStudent
    ? `${API_BASE_URL}/api/projects/recommended?page=${page}&limit=${limit}`
    : `${API_BASE_URL}/api/projects/all?page=${page}&limit=${limit}`;
  const res = await fetchWithAuth(url);
  const data = await res.json();
  return { ok: res.ok, data };
}

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
 * Fetch a student's applied project IDs.
 * @param {string} email - student email
 */
export async function fetchAppliedProjectIds(email) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/applications/student/${email}`);
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * Fetch detailed application objects for a student.
 * @param {string} email - student email
 */
export async function fetchUserApplications(email) {
  const res = await fetchWithAuth(
    `${API_BASE_URL}/api/applications/student-details/${email}`,
    { credentials: 'include', headers: {} }
  );
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * Apply to a project.
 * @param {string} projectId
 * @param {object} studentData - payload (email, etc.)
 */
export async function applyToProject(projectId, studentData) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/applications/${projectId}/apply`, {
    credentials: 'include',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentData),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * Submit work for an approved application.
 * @param {string} applicationId
 * @param {object} submissionData - { submissionLink, submissionText, githubRepoUrl, liveDeploymentUrl, aiDeclaration, selfAssessment }
 */
export async function submitWork(applicationId, submissionData) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/applications/${applicationId}/submit`, {
    credentials: 'include',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submissionData),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * Request a deadline extension for an application.
 * @param {string} applicationId
 * @param {number} days - number of extra days requested
 * @param {string} reason - reason for extension
 */
export async function requestExtension(applicationId, days, reason) {
  const res = await fetchWithAuth(
    `${API_BASE_URL}/api/applications/${applicationId}/request-extension`,
    {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestedDays: Number(days), reason }),
    }
  );
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * Upload a CV PDF file and extract resume text.
 * @param {string} email
 * @param {File} file
 */
export async function uploadCVFile(email, file) {
  const formData = new FormData();
  formData.append('cvFile', file);
  formData.append('email', email);
  const res = await fetchWithAuth(`${API_BASE_URL}/api/profile/upload-cv`, {
    credentials: 'include',
    method: 'POST',
    headers: {},
    body: formData,
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * Save resume URL and text to user profile.
 * @param {string} email
 * @param {string} resumeUrl
 * @param {string} resumeText
 */
export async function updateResumeDetails(email, resumeUrl, resumeText) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/profile/resume`, {
    credentials: 'include',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, resumeUrl, resumeText }),
  });
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
