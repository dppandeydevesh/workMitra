const verifyTurnstile = async (token, ip) => {
  // Allow bypass in local dev if secret key is not set
  if (!process.env.CF_TURNSTILE_SECRET_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn("⚠️ Warning: CF_TURNSTILE_SECRET_KEY is missing from environment. Bypassing Turnstile validation.");
      return true;
    } else {
      console.error("❌ Critical Error: CF_TURNSTILE_SECRET_KEY is missing in production!");
      return false;
    }
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', process.env.CF_TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    if (ip) formData.append('remoteip', ip);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    return !!data.success;
  } catch (err) {
    console.error("❌ Cloudflare Turnstile Verification HTTP error:", err.message);
    return false;
  }
};

module.exports = { verifyTurnstile };
