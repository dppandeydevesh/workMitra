import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) =>
    error ? prom.reject(error) : prom.resolve(token)
  );
  failedQueue = [];
};

// A 401 from these endpoints is a credential/verification failure, NOT an
// expired session — refreshing and auto-retrying would resend a consumed
// (single-use) Turnstile token and mask the real error from the user.
const NO_REFRESH_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/register-verify',
  '/api/auth/resend-otp',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthCall = NO_REFRESH_ENDPOINTS.some((p) =>
      (original?.url || '').includes(p)
    );
    if (error.response?.status === 401 && !original._retry && !isAuthCall) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        localStorage.setItem('accessToken', data.accessToken);
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        // CRITICAL: Clear all auth state, not just token, to prevent infinite redirect loop
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('hasPaidPass');
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Fallback wrapper that emulates `fetch` so we don't break existing components immediately
// while still getting the silent refresh benefits. We'll migrate components natively over time.
export const fetchWithAuth = async (endpoint, options = {}) => {
  try {
    const response = await api({
      url: endpoint.replace(API_BASE_URL, ''),
      method: options.method || 'GET',
      data: options.body
        ? typeof options.body === 'string'
          ? JSON.parse(options.body)
          : options.body
        : undefined,
      headers: options.headers,
    });
    return {
      ok: true,
      status: response.status,
      json: async () => response.data,
      text: async () => JSON.stringify(response.data),
    };
  } catch (error) {
    if (error.response) {
      return {
        ok: false,
        status: error.response.status,
        json: async () => error.response.data,
        text: async () => JSON.stringify(error.response.data),
      };
    }
    throw error;
  }
};

export default api;
