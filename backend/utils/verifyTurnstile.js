const verifyTurnstile = async (token, ip) => {
  // Allow bypass in local dev if secret key is not set
  if (!process.env.CF_TURNSTILE_SECRET_KEY) {
    console.warn("⚠️ Warning: CF_TURNSTILE_SECRET_KEY is missing from environment. Bypassing Turnstile validation.");
    return true;
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v1/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.CF_TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: ip,
      }),
    });
    const data = await response.json();
    return !!data.success;
  } catch (err) {
    console.error("❌ Cloudflare Turnstile Verification HTTP error:", err.message);
    return false;
  }
};

module.exports = { verifyTurnstile };
