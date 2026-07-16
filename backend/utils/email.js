/**
 * email.js
 * Generic transactional email sender via the Resend API.
 * Returns true/false and never throws — email failures must not crash callers.
 */

const sendEmail = async ({ to, subject, html }) => {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('[email] RESEND_API_KEY is not set — skipping send to', to);
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'workMitra <noreply@workmitra.me>',
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`[email] Resend rejected mail to ${to}:`, errBody);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[email] Failed to send to ${to}:`, err.message);
    return false;
  }
};

module.exports = { sendEmail };
