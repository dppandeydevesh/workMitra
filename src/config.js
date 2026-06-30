export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn("⚠️ VITE_API_BASE_URL is missing. Defaulting to relative paths (same-origin).");
}
