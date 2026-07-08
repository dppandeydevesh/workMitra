import React, { useState} from'react';
import { useToast} from'./Toast';
import { useTranslation} from'react-i18next';
import { fetchWithAuth} from'../services/apiClient';

const PremiumCheckoutModal = ({setShowCheckoutModal, 
 currentUser, 
 setCurrentUser, 
 API_BASE_URL}) => {const { t} = useTranslation();
 const toast = useToast();
 const [checkingOutPass, setCheckingOutPass] = useState(false);

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <div 
 className="absolute inset-0 bg-ink-900/40"onClick={() => setShowCheckoutModal(false)}
 ></div>
 <div className="relative bg-white rounded-xl w-full max-w-sm overflow-hidden shadow-sm animate-fade-in-up border border-ink-200">
 
 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-marigold-500 to-purple-500"></div>

 <div className="flex justify-between items-center p-4 border-b border-ink-100 bg-ink-50">
 <h2 className="text-xs font-bold text-ink-500 uppercase tracking-wider">{t("dashboard.premiumRequired")}</h2>
 <button 
 onClick={() => setShowCheckoutModal(false)}
 className="text-ink-400 hover:text-ink-700 font-extrabold text-sm transition">
 ✕
 </button>
 </div>

 <div className="p-6 space-y-4">
 <div className="text-center">
 <span className="text-3xl">🛡️</span>
 <h3 className="text-base font-black text-ink-800 mt-2">{t("dashboard.unlockPremium")}</h3>
 <p className="text-xs text-ink-400 mt-1">{t("dashboard.unlockPremiumDesc")}</p>
 </div>
 
 <div className="border border-marigold-100 bg-marigold-50/50 p-4 rounded-xl flex justify-between items-center">
 <div>
 <span className="text-[10px] font-black text-marigold-700 uppercase">{t("dashboard.premiumPlan")}</span>
 <span className="text-xs font-semibold text-ink-600 block mt-0.5">{t("dashboard.thirtyDaysAccess")}</span>
 </div>
 <span className="text-xl font-black text-ink-800">{t("dashboard.priceAmount")}</span>
 </div>

 <button
 onClick={async () => {try {setCheckingOutPass(true);
 const orderRes = await fetchWithAuth(`${API_BASE_URL}/api/payments/create-order`, {method:"POST",
 headers: {"Content-Type":"application/json"},
 body: JSON.stringify({ planId:"premium"})
});
 const order = await orderRes.json();
 if (!orderRes.ok) throw new Error(order.error ||"Failed to create order");

 const loaded = await new Promise((resolve) => {if (window.Razorpay) return resolve(true);
 const script = document.createElement("script");
 script.src ="https://checkout.razorpay.com/v1/checkout.js";
 script.onload = () => resolve(true);
 script.onerror = () => resolve(false);
 document.body.appendChild(script);
});
 if (!loaded) throw new Error("Razorpay SDK failed to load.");

 const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
 if (!razorpayKey) throw new Error("Payment is not configured. Please contact support.");

 const options = {key: razorpayKey,
 amount: order.amount,
 currency: order.currency,
 name:"workMitra",
 description: t("dashboard.thirtyDaysAccess"),
 order_id: order.id,
 handler: async function (response) {try {const verifyRes = await fetchWithAuth(`${API_BASE_URL}/api/payments/verify`, {method:"POST",
 headers: {"Content-Type":"application/json"},
 body: JSON.stringify({razorpay_order_id: response.razorpay_order_id,
 razorpay_payment_id: response.razorpay_payment_id,
 razorpay_signature: response.razorpay_signature
})
});
 const verifyData = await verifyRes.json();
 if (verifyRes.ok) {const updatedUser = { ...currentUser, hasPaidPass: true};
 localStorage.setItem("user", JSON.stringify(updatedUser));
 localStorage.setItem("hasPaidPass","true");
 setCurrentUser(updatedUser);
 setShowCheckoutModal(false);
 toast.success("🎉" + t("dashboard.premiumUnlocked"));
} else {toast.error(verifyData.error ||"Payment verification failed.");
}
} catch (err) {toast.error("Verification error:" + err.message);
}
},
 prefill: {name: currentUser?.fullName ||"Student",
 email: currentUser?.email ||"",
 contact: currentUser?.mobile ||""
},
 theme: { color:"#4f46e5"},
 modal: {ondismiss: function () {setCheckingOutPass(false);
}
}
};
 const rzp = new window.Razorpay(options);
 rzp.open();
} catch (err) {toast.error(err.message);
} finally {setCheckingOutPass(false);
}
}}
 disabled={checkingOutPass}
 style={{ background: "#F5A623", color: "#1B2333" }} className="w-full py-3 rounded-xl text-xs font-black transition shadow disabled:opacity-50">
 {checkingOutPass ? t("dashboard.openingRazorpay") : t("dashboard.payViaRazorpay")}
 </button>
 <p className="text-[10px] text-center text-ink-400 font-medium">
 {t("dashboard.securePayment")}
 </p>
 </div>
 </div>
 </div>
 );
};
export default PremiumCheckoutModal;
