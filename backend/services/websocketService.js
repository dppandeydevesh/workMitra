const ws = require('ws');
const jwt = require('jsonwebtoken');

/**
 * Initialize and mount the WebSocket Chat Server on top of the HTTP/HTTPS server.
 * Handles client authentication, real-time message forwarding, and typing status notifications.
 * @param {object} server - HTTP/HTTPS server instance
 * @param {string} jwtSecret - JWT Secret Key
 */
function initWebSocketServer(server, jwtSecret) {
  const wss = new ws.Server({ server });

  wss.on('connection', (socket, req) => {
    socket.req = req;
    let userEmail = null;

    socket.on('message', async (messageStr) => {
      try {
        const data = JSON.parse(messageStr);

        if (data.type === 'auth') {
          let token = data.token;
          const cookieString = socket.req.headers.cookie;
          if (!token && cookieString) {
            const match = cookieString.match(/token=([^;]+)/);
            if (match) token = match[1];
          }

          if (!token) {
            socket.send(
              JSON.stringify({
                type: 'error',
                message: 'JWT token is required for chat authentication.',
              })
            );
            socket.close();
            return;
          }

          jwt.verify(token, jwtSecret, (err, decoded) => {
            if (err) {
              socket.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Invalid JWT token.',
                })
              );
              socket.close();
              return;
            }

            userEmail = decoded.email;
            global.wsClients.set(userEmail, socket);
            console.log(`💬 WebSocket connection authenticated for: ${userEmail}`);
            socket.send(JSON.stringify({ type: 'status', status: 'connected' }));
          });
          return;
        }

        if (data.type === 'chat') {
          const { sender, receiver, text } = data;
          if (!sender || !receiver || !text) return;

          // Verify sender email matches current socket user identity
          if (sender !== userEmail) {
            socket.send(
              JSON.stringify({
                type: 'error',
                message: 'Unauthorized sender context.',
              })
            );
            return;
          }

          // Save message to MongoDB
          const Message = require('../models/Message');
          const { getLinkPreview } = require('../utils/linkPreviewHelper');
          const preview = await getLinkPreview(text);

          const newMessage = new Message({
            sender,
            receiver,
            text,
            linkPreview: preview || undefined,
          });
          await newMessage.save();

          const payload = {
            type: 'message',
            _id: newMessage._id,
            sender,
            receiver,
            text,
            timestamp: newMessage.timestamp,
            linkPreview: newMessage.linkPreview,
          };

          // Send to receiver if online
          const receiverSocket = global.wsClients.get(receiver);
          if (receiverSocket && receiverSocket.readyState === ws.OPEN) {
            receiverSocket.send(JSON.stringify(payload));
          }

          // Echo back to sender
          socket.send(JSON.stringify(payload));
        }

        if (data.type === 'typing') {
          const { sender, receiver, isTyping } = data;
          if (!sender || !receiver) return;
          if (sender !== userEmail) return;

          const receiverSocket = global.wsClients.get(receiver);
          if (receiverSocket && receiverSocket.readyState === ws.OPEN) {
            receiverSocket.send(
              JSON.stringify({
                type: 'typing',
                sender,
                isTyping,
              })
            );
          }
        }
      } catch (err) {
        console.error('❌ WebSocket message error:', err.message);
      }
    });

    socket.on('close', () => {
      if (userEmail) {
        global.wsClients.delete(userEmail);
        console.log(`🔌 WebSocket connection closed for: ${userEmail}`);
      }
    });
  });

  return wss;
}

module.exports = initWebSocketServer;
