import React, { useState } from 'react';
import { toast } from 'react-toastify';
import '../styles/Pricing.css';

const Pricing = ({ onClose, onUpgrade }) => {
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchase = async (planId) => {
    setLoading(true);
    try {
      // 1. Create Order on Backend
      const res = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId })
      });
      const order = await res.json();
      
      if (!res.ok) throw new Error(order.error || "Failed to create order");

      // 2. Load Razorpay script
      toast.info("Opening secure payment gateway...");
      const resScript = await loadRazorpayScript();
      if (!resScript) {
        throw new Error("Razorpay SDK failed to load. Are you online?");
      }

      // 3. Configure and open Razorpay Modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "", // Passed from env
        amount: order.amount,
        currency: order.currency,
        name: "workMitra",
        description: `Upgrade to ${planId === 'premium' ? 'Pro' : 'Standard'} Pass`,
        order_id: order.id,
        handler: async function (response) {
          try {
            // 4. Verify Payment on Backend
            const verifyRes = await fetch(`${API_BASE_URL}/api/payments/verify`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                razorpay_order_id: response.razorpay_order_id, 
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
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
          } catch (err) {
            toast.error("Verification failed: " + err.message);
          }
        },
        prefill: {
          name: "User",
          email: "user@example.com",
        },
        theme: {
          color: "#4f46e5"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (err) {
      toast.error(err.message);
    } finally {
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
