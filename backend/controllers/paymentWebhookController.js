const crypto = require('crypto');
const User = require('../models/User');

exports.handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];

    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      return next(new Error('Webhook secret missing'));
    }

    const rawBody = req.body.toString('utf8');

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const parsedBody = JSON.parse(rawBody);
    const event = parsedBody.event;
    const payment = parsedBody.payload.payment.entity;

    if (event === 'payment.captured') {
      const userEmail = payment.notes?.userEmail;
      const orderId = payment.order_id;
      if (userEmail) {
        await User.findOneAndUpdate(
          { email: userEmail },
          { hasPaidPass: true }
        );
        console.log(`Payment captured for order ${orderId}. Pass activated for ${userEmail}.`);
      } else {
        console.warn(`Payment captured for order ${orderId} but no userEmail found in notes.`);
      }
    } else if (event === 'payment.failed') {
      console.log(`Payment failed for order ${payment.order_id}`);
      // Handle failed payment if needed
    }

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
};
