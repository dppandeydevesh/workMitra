const User = require('../models/User');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay conditionally (allows server to boot even if keys are missing)
let razorpayInstance = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

exports.createOrder = async (req, res) => {
    try {
        if (!razorpayInstance) {
            return res.status(500).json({ error: "Razorpay API keys are missing. Payment gateway is offline." });
        }

        const { planId } = req.body;
        const premiumPrice = parseInt(process.env.PRICE_PREMIUM || "299", 10);
        const standardPrice = parseInt(process.env.PRICE_STANDARD || "199", 10);
        const amount = planId === 'premium' ? premiumPrice : standardPrice; // INR

        const options = {
            amount: amount * 100, // amount in smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_order_${Math.random().toString(36).substr(2, 9)}`,
            notes: {
                userEmail: req.user.email
            }
        };

        const order = await razorpayInstance.orders.create(options);
        
        // The order ID is no longer saved to the user document to prevent multi-tab concurrency overwrite bugs.
        // The webhook will extract the userEmail from the payment notes directly.

        res.status(200).json(order);
    } catch (err) {
        console.error("Razorpay Create Order Error:", err);
        res.status(500).json({ error: "Failed to create payment order." });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({ error: "Razorpay Secret is missing." });
        }

        // Verify signature using crypto module and razorpay secret
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ error: "Invalid payment signature. Payment verification failed." });
        }
        
        // The DB update is now handled strictly by the secure webhook. 
        // We just tell the frontend that signature matches.
        res.status(200).json({ success: true, message: "Payment verified successfully! Background webhook will activate pass." });
    } catch (err) {
        console.error("Razorpay Verify Error:", err);
        res.status(500).json({ error: "Payment verification failed." });
    }
};
