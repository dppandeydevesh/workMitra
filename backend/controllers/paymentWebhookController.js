const crypto = require('crypto');
const User = require('../models/User');

exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing signature' });
    }

    // req.body is the raw buffer due to express.raw()
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const payload = JSON.parse(req.body.toString());
    const event = payload.event;
    const payment = payload.payload.payment.entity;

    if (event === 'payment.captured') {
      await User.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        { hasPaidPass: true }
      );
    }

    if (event === 'payment.failed') {
      await User.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        { hasPaidPass: false }
      );
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
