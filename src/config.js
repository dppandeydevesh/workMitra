// In production, always use same-origin relative paths because the backend serves the frontend
export const API_BASE_URL = import.meta.env.PROD ?"" : (import.meta.env.VITE_API_BASE_URL ||"");

if (!import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {console.warn("⚠️ VITE_API_BASE_URL is missing in development. Defaulting to same-origin.");
}
