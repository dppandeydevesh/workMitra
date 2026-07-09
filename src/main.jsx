import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import './i18n.js';
import { API_BASE_URL } from './config';
import * as Sentry from '@sentry/react';
import posthog from 'posthog-js';
import { HelmetProvider } from 'react-helmet-async';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.2,
});

posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: 'https://app.posthog.com',
  autocapture: false,
});

// 🔒 Intercept window.fetch to automatically append JWT Token to Authorization headers
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  options.credentials = 'include';
  return originalFetch(url, options);
};

// 🎨 Intercept window.alert to automatically show a beautiful toast instead
window.alert = (message) => {
  if (window.showToast) {
    let type = 'info';
    const lower = String(message).toLowerCase();
    if (
      lower.includes('success') ||
      lower.includes('saved') ||
      lower.includes('completed') ||
      lower.includes('approved')
    ) {
      type = 'success';
    } else if (
      lower.includes('fail') ||
      lower.includes('error') ||
      lower.includes('invalid') ||
      lower.includes('missing')
    ) {
      type = 'error';
    } else if (lower.includes('warning') || lower.includes('attention')) {
      type = 'warning';
    }
    window.showToast(message, type);
  } else {
    console.warn('Toast system not ready. Alert content:', message);
  }
};

import { ToastProvider } from './components/Toast.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </HelmetProvider>
  </StrictMode>
);
