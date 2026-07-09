const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticateToken = require('../middleware/authMiddleware');
const paymentWebhookController = require('../controllers/paymentWebhookController');
router.post('/create-order', authenticateToken, paymentController.createOrder);
router.post('/verify', authenticateToken, paymentController.verifyPayment);

// Critical: Use express.raw() so we can verify the signature against the raw buffer
router.post('/webhook', express.raw({ type: 'application/json' }), paymentWebhookController.handleWebhook);

module.exports = router;
