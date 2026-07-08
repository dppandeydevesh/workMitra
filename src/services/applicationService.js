import { fetchWithAuth } from './apiClient';
import { API_BASE_URL } from '../config';

/**
 * Recruiter updates application status.
 * @param {string} applicationId
 * @param {string} status - 'Approved' | 'Rejected' etc.
 */
export async function updateApplicationStatus(applicationId, status) {
  const res = await fetchWithAuth(
    `${API_BASE_URL}/api/applications/${applicationId}/status`,
    {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }
  );
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * Recruiter resolves extension request.
 * @param {string} applicationId
 * @param {string} requestId
 * @param {string} status - 'Approved' | 'Rejected'
 */
export async function reviewExtension(applicationId, requestId, status) {
  const res = await fetchWithAuth(
    `${API_BASE_URL}/api/applications/${applicationId}/review-extension`,
    {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, status }),
    }
  );
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * Recruiter completes task review.
 * @param {string} applicationId
 * @param {string} feedbackText
 * @param {number} rating
 * @param {string} ratingReview
 */
export async function completeApplication(applicationId, feedbackText, rating, ratingReview) {
  const res = await fetchWithAuth(
    `${API_BASE_URL}/api/applications/${applicationId}/complete`,
    {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedbackText, rating, ratingReview }),
    }
  );
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * Request application revision.
 * @param {string} applicationId
 * @param {string} feedbackText
 */
export async function requestRevision(applicationId, feedbackText) {
  const res = await fetchWithAuth(
    `${API_BASE_URL}/api/applications/${applicationId}/revision`,
    {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedbackText }),
    }
  );
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * File dispute on application.
 * @param {string} applicationId
 * @param {string} feedbackText
 */
export async function fileDispute(applicationId, feedbackText) {
  const res = await fetchWithAuth(
    `${API_BASE_URL}/api/applications/${applicationId}/dispute`,
    {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedbackText }),
    }
  );
  const data = await res.json();
  return { ok: res.ok, data };
}
