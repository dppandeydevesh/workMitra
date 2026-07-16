import { API_BASE_URL } from '../config';
import { fetchWithAuth } from '../services/apiClient';

/**
 * Fire-and-forget marker for the daily checklist ("explore" a project /
 * "improve" your profile). Never throws and never blocks the calling page.
 */
export const trackDailyTask = (task) => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?.userRole !== 'student') return;
    fetchWithAuth(`${API_BASE_URL}/api/daily/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task }),
    }).catch(() => {});
  } catch {
    // tracking must never break the page
  }
};
