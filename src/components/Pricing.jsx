import React, { useState } from 'react';
import { toast } from 'react-toastify';
import '../styles/Pricing.css';

const Pricing = ({ onClose, onUpgrade }) => {
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const handlePurchase = async (planId) => {
    setLoading(true);
    try {
      // 1. Create Mock Order
      const res = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId })
      });
      const order = await res.json();
      
      if (!res.ok) throw new Error(order.error || "Failed to create order");

      // 2. Mock Razorpay Window Simulation (Loading state)
      toast.info("Opening secure payment gateway...");
      
      setTimeout(async () => {
        // 3. Verify Payment
        const verifyRes = await fetch(`${API_BASE_URL}/api/payments/verify`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            orderId: order.id, 
            paymentId: `pay_${Math.random().toString(36).substr(2, 9)}`,
            signature: "mock_signature_for_testing"
          })
        });
        const verifyData = await verifyRes.json();
        
        if (verifyRes.ok) {
          toast.success(verifyData.message);
          onUpgrade(verifyData.user);
          onClose();
        } else {
          toast.error(verifyData.error);
        }
        setLoading(false);
      }, 1500);

    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="pricing-modal-overlay">
      <div className="pricing-modal glass-panel">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2>Upgrade to Premium 🚀</h2>
        <p>Get exclusive access to premium placement opportunities and AI career reviews.</p>
        
        <div className="pricing-cards">
          <div className="price-card">
            <h3>Standard Pass</h3>
            <div className="price">₹499<span>/mo</span></div>
            <ul>
              <li>✅ Basic Project Recommendations</li>
              <li>✅ Up to 5 Applications/month</li>
              <li>❌ AI Resume Review</li>
            </ul>
            <button className="btn-primary" disabled={loading} onClick={() => handlePurchase('standard')}>
              {loading ? "Processing..." : "Get Standard"}
            </button>
          </div>
          
          <div className="price-card premium">
            <div className="best-value">Best Value</div>
            <h3>Pro Pass</h3>
            <div className="price">₹999<span>/mo</span></div>
            <ul>
              <li>✅ Unlimited Applications</li>
              <li>✅ Priority Placement Support</li>
              <li>✅ Unlimited AI Resume Reviews</li>
              <li>✅ Direct Company Messaging</li>
            </ul>
            <button className="btn-premium" disabled={loading} onClick={() => handlePurchase('premium')}>
              {loading ? "Processing..." : "Upgrade to Pro"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
