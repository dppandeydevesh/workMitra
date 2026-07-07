const sendWebhookNotification = async (message) => {
  try {
    if (process.env.WEBHOOK_URL) {
      await fetch(process.env.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: message })
      });
    }
  } catch (err) {
    console.error("Failed to send webhook notification:", err);
  }
};

module.exports = {
  sendWebhookNotification
};
