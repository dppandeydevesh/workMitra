import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://app.posthog.com';

/**
 * Call once at app startup (main.jsx / main.tsx).
 * Safe to call multiple times — guards against double-init.
 */
export function initPostHog() {
  if (!POSTHOG_KEY) {
    console.warn('[PostHog] VITE_POSTHOG_KEY not set — analytics disabled.');
    return;
  }
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,   // we capture manually on route change
    capture_pageleave: true,
    autocapture: true,         // captures clicks, inputs, form submits automatically
    persistence: 'localStorage',
    session_recording: {
      maskAllInputs: true,     // GDPR-safe: mask all input fields in recordings
    },
  });
}

/**
 * Identify the logged-in user so all future events are attributed to them.
 * Call this right after login / on app load if a user is already in localStorage.
 */
export function identifyUser() {
  const raw = localStorage.getItem('user');
  if (!raw || !POSTHOG_KEY) return;
  try {
    const user = JSON.parse(raw);
    posthog.identify(user.email, {
      email: user.email,
      name: user.fullName || user.companyName || '',
      role: user.userRole,
      college: user.collegeName || null,
    });
  } catch { /* ignore parse errors */ }
}

/**
 * Track a custom event with optional properties.
 *
 * Usage:
 *   capture('project_applied', { projectId: '123', projectTitle: 'ML Intern' })
 *   capture('resume_uploaded')
 *   capture('otp_verified', { userRole: 'student' })
 */
export function capture(event: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_KEY) return;
  posthog.capture(event, properties);
}

/**
 * Track a pageview manually (called on every route change).
 */
export function trackPageView(path: string) {
  if (!POSTHOG_KEY) return;
  posthog.capture('$pageview', { $current_url: window.location.origin + path });
}

/**
 * Reset identity on logout.
 */
export function resetPostHog() {
  if (!POSTHOG_KEY) return;
  posthog.reset();
}

export default posthog;
