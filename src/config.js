export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error("🚨 Configuration Error: VITE_API_BASE_URL environment variable is missing in frontend build.");
}
