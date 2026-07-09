import { fetchWithAuth } from './apiClient';
import { API_BASE_URL } from '../config';

/**
 * Authenticate a user with email/password.
 * @param {string} email
 * @param {string} password
 * @param {string} portalRole - 'student' | 'company'
 * @param {string} turnstileToken - Cloudflare Turnstile token
 */
export async function login(email, password, portalRole, turnstileToken) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, portalRole, turnstileToken }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * Register a new user.
 * @param {object} registrationData - full registration payload
 */
export async function registerUser(registrationData) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registrationData),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * Verify an OTP for email verification.
 * @param {string} email
 * @param {string} otp
 */
export async function verifyOtp(email, otp) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/auth/register-verify`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, emailOtp: otp }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * Request a password reset email.
 * @param {string} email
 */
export async function forgotPassword(email) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * Reset user password using a token.
 * @param {string} token - reset token from email link
 * @param {string} password - new password
 */
export async function resetPassword(token, password) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/auth/reset-password/${token}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * Get the currently authenticated user from session/cookie.
 */
export async function getMe() {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/auth/me`);
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * Get a user's profile by email.
 * @param {string} email
 */
export async function getUserByEmail(email) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/auth/user/${email}`);
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * Update resume URL and text on user profile (auth-scoped profile endpoint).
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
 * Review a CV with AI and store the report against the user.
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
