const User = require('../models/User');
// Mock Razorpay integration for UP, India localized context
exports.createOrder = async (req, res) => {
    try {
        const { planId } = req.body;
        // In a real Razorpay integration, we'd use Razorpay instance to create an order
        // For MVP, we mock the order creation
        const amount = planId === 'premium' ? 999 : 499; // INR
        const mockOrderId = "order_" + Math.random().toString(36).substr(2, 9);
        
        res.status(200).json({
            id: mockOrderId,
            amount: amount * 100, // paise
            currency: "INR"
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to create payment order." });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId, signature } = req.body;
        // In a real app, verify signature using crypto module and razorpay secret
        
        // Mock verification success
        const user = await User.findOneAndUpdate(
            { email: req.user.email },
            { hasPaidPass: true }, // Upgrade user to paid pass
            { new: true }
        );
        
        const sanitized = user.toObject();
        delete sanitized.password;
        
        res.status(200).json({ success: true, message: "Payment verified, pass activated!", user: sanitized });
    } catch (err) {
        res.status(500).json({ error: "Payment verification failed." });
    }
};
