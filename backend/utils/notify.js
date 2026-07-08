/**
 * notify.js
 * Safe WebSocket notification utility.
 * Wraps all global.wsClients access with readyState checks and error isolation
 * so that a disconnected or stale socket never crashes a controller.
 */

const ws = require('ws');

/**
 * Send a JSON payload to a user's active WebSocket connection.
 * Silently no-ops if the user is offline or the socket is not OPEN.
 *
 * @param {string} email   - The email address of the recipient user
 * @param {object} payload - The JSON-serialisable object to send
 * @returns {boolean}      - true if the message was sent, false otherwise
 */
function notifyUser(email, payload) {
  if (!email || !payload) return false;

  try {
    const socket = global.wsClients?.get(email);
    if (!socket || socket.readyState !== ws.OPEN) return false;

    socket.send(JSON.stringify(payload));
    return true;
  } catch (err) {
    // Log but never propagate — a notification failure must never crash a controller
    console.error(`[notify] Failed to send WebSocket notification to ${email}:`, err.message);
    return false;
  }
}

module.exports = { notifyUser };
