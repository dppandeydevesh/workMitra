import React, { useState, useEffect, useRef} from"react";
import { useParams, useNavigate} from"react-router-dom";
import { API_BASE_URL} from"../config";
import { useWebSocket} from"../components/WebSocketContext";
import { useTranslation} from"react-i18next";
import { motion} from"framer-motion";
import { Send, User, Paperclip, Search, MessageSquare} from "lucide-react";

export default function ChatPage() {const { recipientEmail} = useParams();
 const navigate = useNavigate();
 const { t} = useTranslation();

 // Active logged-in user (useState with lazy initializer to avoid parsing on every render)
 const [loggedInUser] = useState(() => JSON.parse(localStorage.getItem("user") ||"null"));

 // State Management
 const [partners, setPartners] = useState([]);
 const [loadingPartners, setLoadingPartners] = useState(true);
 const [partnersError, setPartnersError] = useState("");
 const [activePartner, setActivePartner] = useState(null);
 const [messages, setMessages] = useState([]);
 const [messageInput, setMessageInput] = useState("");
 const [loadingHistory, setLoadingHistory] = useState(false);
 const [showMobileChat, setShowMobileChat] = useState(!!recipientEmail);
 const [isPartnerTyping, setIsPartnerTyping] = useState(false);

 const { wsConnected, addListener, sendMessage} = useWebSocket();
 const messagesEndRef = useRef(null);
 const typingTimeoutRef = useRef(null);
 const activePartnerRef = useRef(activePartner);

 // Keep activePartnerRef updated with current activePartner state
 useEffect(() => {activePartnerRef.current = activePartner;
}, [activePartner]);

 // Redirect if not logged in
 useEffect(() => {if (!loggedInUser) {navigate("/");
}
}, [loggedInUser, navigate]);

 // Fetch recent chat partners
 const fetchPartners = async () => {if (!loggedInUser) return;
  setLoadingPartners(true);
  setPartnersError("");
  try {const res = await fetch(`${API_BASE_URL}/api/chat/partners/${loggedInUser.email}`, { credentials:"include",
  headers: {}
 });
  if (res.ok) {const data = await res.json();
  setPartners(data);

  // If recipientEmail was passed in route parameters, check if they exist in partners.
  // If not, fetch their details so we can add them to the partner list view dynamically.
  if (recipientEmail && recipientEmail !== loggedInUser.email) {const partnerExists = data.some(p => p.email === recipientEmail);
  if (!partnerExists) {const userRes = await fetch(`${API_BASE_URL}/api/auth/user/${recipientEmail}`, { credentials:"include",
  headers: {}
 });
  if (userRes.ok) {const userData = await userRes.json();
  setPartners(prev => [userData, ...prev]);
  setActivePartner(userData);
  setShowMobileChat(true);
 }
 } else {const partnerObj = data.find(p => p.email === recipientEmail);
  setActivePartner(partnerObj);
  setShowMobileChat(true);
 }
 } else if (data.length > 0 && !activePartnerRef.current) {// Default to first chat partner if none selected
  setActivePartner(data[0]);
 }
 } else {
  setPartnersError(t("chat.failedToLoadPartners"));
 }
 } catch (err) {
  setPartnersError(t("chat.failedToLoadPartners"));
  console.error("Error fetching chat partners:", err);
 } finally {
  setLoadingPartners(false);
 }
 };

 useEffect(() => {fetchPartners();
 // eslint-disable-next-line react-hooks/exhaustive-deps
}, [recipientEmail]);

 // Fetch conversation history when active partner changes
 useEffect(() => {const fetchHistory = async () => {if (!loggedInUser || !activePartner) return;
 setLoadingHistory(true);
 try {// 1. Mark existing partner messages as read
 await fetch(`${API_BASE_URL}/api/chat/read`, { credentials:"include",
 method:"POST",
 headers: {
"Content-Type":"application/json",
},
 body: JSON.stringify({ sender: activePartner.email})
});
 
 // 2. Refresh partners list to clear local unread counts immediately
 const partnerRes = await fetch(`${API_BASE_URL}/api/chat/partners/${loggedInUser.email}`, { credentials:"include",
 headers: {}
});
 if (partnerRes.ok) {const updatedPartners = await partnerRes.json();
 setPartners(updatedPartners);
}

 // 3. Fetch conversation logs
 const res = await fetch(
`${API_BASE_URL}/api/chat/history/${loggedInUser.email}/${activePartner.email}`, { credentials:"include",
 headers: {}
}
 );
 if (res.ok) {const data = await res.json();
 setMessages(data);
 setIsPartnerTyping(false); // Reset typing status on channel swap
}
} catch (err) {console.error("Error loading chat history:", err);
} finally {setLoadingHistory(false);
}
};
 fetchHistory();
 // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activePartner]);

 // Initialize WebSocket Connection (runs once, stabilized connection)
 useEffect(() => {if (!loggedInUser) return;

 const handleIncomingData = (data) => {if (data.type ==="typing") {const currentActivePartner = activePartnerRef.current;
 if (data.sender === currentActivePartner?.email) {setIsPartnerTyping(data.isTyping);
}
 return;
}

 if (data.type ==="message") {const currentActivePartner = activePartnerRef.current;
 // If message relates to current active partner, append to messages
 if (
 (data.sender === currentActivePartner?.email && data.receiver === loggedInUser.email) ||
 (data.sender === loggedInUser.email && data.receiver === currentActivePartner?.email)
 ) {setMessages((prev) => [...prev, data]);
 
 // Mark incoming active partner messages as read immediately
 if (data.sender === currentActivePartner?.email) {fetch(`${API_BASE_URL}/api/chat/read`, { credentials:"include",
 method:"POST",
 headers: {
"Content-Type":"application/json",
"Authorization":`Bearer ${localStorage.getItem("token")}`
},
 body: JSON.stringify({ sender: data.sender})
}).catch(err => console.error("Failed to mark message as read:", err));
}
}
 
 // Refresh partner list to bubble up recent messages/partners and update badge counts
 fetchPartners();
}
};

 const unsubscribe = addListener(handleIncomingData);
 return () => unsubscribe();
 // eslint-disable-next-line react-hooks/exhaustive-deps
}, [loggedInUser, addListener]);

 // Scroll to bottom on new messages
 useEffect(() => {messagesEndRef.current?.scrollIntoView({ behavior:"smooth"});
}, [messages, loadingHistory]);

 const handleInputChange = (e) => {setMessageInput(e.target.value);

 // Send typing notification to active contact
 if (wsConnected && activePartner) {sendMessage({type:"typing",
 sender: loggedInUser.email,
 receiver: activePartner.email,
 isTyping: true
});

 if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
 typingTimeoutRef.current = setTimeout(() => {if (wsConnected && activePartner) {sendMessage({type:"typing",
 sender: loggedInUser.email,
 receiver: activePartner.email,
 isTyping: false
});
}
}, 3000);
}
};

 const handleSendMessage = (e) => {e.preventDefault();
 if (!messageInput.trim() || !activePartner) return;

 // Reset typing status on send
 if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
 if (wsConnected) {sendMessage({type:"typing",
 sender: loggedInUser.email,
 receiver: activePartner.email,
 isTyping: false
});
}

 const payload = {type:"chat",
 sender: loggedInUser.email,
 receiver: activePartner.email,
 text: messageInput.trim()
};

 sendMessage(payload);
 setMessageInput("");
};

 if (!loggedInUser) return null;

 return (
 <motion.div className="min-h-screen w-full flex flex-col p-4 sm:p-6 lg:p-8 z-0 relative font-sans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
 {/* 🧭 TOP HEADER BAR */}
 <div className="max-w-6xl w-full mx-auto wm-panel mb-6 px-5 py-4 flex justify-between items-center z-10">
 <div 
 className="logo-hook"onClick={() => navigate(loggedInUser.userRole ==="company" ?"/company-dashboard" :"/dashboard")}
 >
 <img 
 src="/logo.png"alt="workMitra Logo"className="h-7 sm:h-8 object-contain"/>
 </div>
 <button 
 onClick={() => navigate(loggedInUser.userRole ==="company" ?"/company-dashboard" :"/dashboard")}
 className="text-xs font-bold bg-ink-900/5 hover:bg-ink-900/10 text-ink-800 px-4 py-2 rounded-xl transition-all">
 ← {t("chat.dashboardBack")}
 </button>
 </div>

 <div className="max-w-6xl w-full mx-auto wm-panel flex flex-col md:flex-row flex-1 overflow-hidden min-h-[500px] sm:min-h-[600px] z-10">
 
 {/* ========================================================================= */}
 {/* 📇 LEFT SIDEBAR: Active Chat Partners List */}
 {/* ========================================================================= */}
 <div className={`w-full md:w-[340px] wm-panel border-r border-white/20 flex-col bg-white/30 ${showMobileChat ?"hidden md:flex" :"flex"}`}>
 <div className="p-5 sm:p-6 border-b border-white/20">
 <h2 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-marigold-600 to-marigold-600 bg-clip-text text-transparent">{t("chat.title")}</h2>
 <p className="text-xs text-ink-600 mt-1 font-medium">{t("chat.subtitle")}</p>
 </div>
 
 <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
  {loadingPartners ? (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 rounded-xl border border-white/20 skeleton-loader wm-panel"></div>
      ))}
    </div>
  ) : partnersError ? (
    <div className="p-4 text-center space-y-2.5">
      <p className="text-xs text-red-700 font-bold">{partnersError}</p>
      <button 
        onClick={() => fetchPartners()}
        className="px-3.5 py-1.5 bg-marigold-500 hover:bg-marigold-600 text-white rounded-lg font-bold text-[11px] transition active:scale-95 shadow-sm"
      >
        Retry
      </button>
    </div>
  ) : partners.length === 0 ? (
      <div className="wm-panel p-[24px_16px] text-center max-w-sm mx-auto my-4 flex flex-col items-center justify-center">
        <div className="w-[40px] h-[40px] rounded-xl bg-[#FBE7C4] flex items-center justify-center text-[#F5A623] shadow-sm mb-3">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-[14px] font-semibold text-[#1B2333] mb-[4px]">{t("chat.noConversations")}</h3>
          <p className="text-[12px] text-[#6B7280] leading-normal max-w-[200px] mx-auto">
            No messages active. Match with projects or contact recruiters to begin a conversation.
          </p>
        </div>
      </div>
    ) : (
 partners.map((partner) => {const isActive = activePartner?.email === partner.email;
 return (
 <button
 key={partner.email}
 onClick={() => {setActivePartner(partner);
 setShowMobileChat(true);
 navigate(`/chat/${partner.email}`);
}}
 className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all duration-300 text-left ${isActive 
 ?"bg-white/60 shadow-sm border border-white/40 scale-[1.02]":"hover:bg-white/40 border border-transparent"
}`}
 >
 <div className="relative">
 <div className="w-11 h-11 rounded-full bg-[#F5A623] text-white font-bold flex items-center justify-center text-lg shadow-md">
 {partner.fullName ? partner.fullName.charAt(0).toUpperCase() : partner.companyName?.charAt(0).toUpperCase() || <User size={20} />}
 </div>
 </div>
 <div className="flex-1 min-w-0">
 <h4 className={`text-sm font-bold truncate ${isActive ?"text-ink-900" :"text-ink-700"}`}>
 {partner.fullName || partner.companyName}
 </h4>
 <p className="text-[11px] text-ink-500 font-medium truncate mt-0.5 uppercase tracking-wider">
 {partner.userRole ==="company" ? t("chat.recruiter") : t("chat.student")}
 </p>
 </div>
 {partner.unreadCount > 0 && (
 <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-pulse">
 {partner.unreadCount}
 </span>
 )}
 </button>
 );
})
 )}
 </div>
 </div>

 {/* ========================================================================= */}
 {/* 💬 RIGHT CONTAINER: Chat Conversation */}
 {/* ========================================================================= */}
 <div className={`flex-1 wm-panel flex-col bg-white/40 relative ${!showMobileChat ?"hidden md:flex" :"flex"}`}>
 {activePartner ? (
 <>
 {/* Top Conversation Status Header */}
 <div className="p-4 sm:p-5 border-b border-white/20 flex items-center justify-between bg-white/50 z-10 sticky top-0">
 <div className="flex items-center gap-4">
 <button 
 onClick={() => {setShowMobileChat(false);
 navigate("/chat");
}} 
 className="md:hidden text-ink-600 hover:text-marigold-500 p-2 rounded-xl hover:bg-white/50 transition-colors"title={t("chat.backToList")}
 >
 ◀
 </button>
 <div className="relative">
 <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F5A623] text-white font-bold flex items-center justify-center text-sm shadow-md ring-2 ring-white/50">
 {activePartner.fullName ? activePartner.fullName.charAt(0).toUpperCase() : activePartner.companyName?.charAt(0).toUpperCase() || <User size={20} />}
 </div>
 {/* Seamless online status dot */}
 <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${wsConnected ?"bg-green-500" :"bg-ink-400"}`}></div>
 </div>
 <div>
 <h3 className="text-sm sm:text-base font-extrabold text-ink-900 leading-tight">
 {activePartner.fullName || activePartner.companyName}
 </h3>
 <div className="flex items-center gap-1.5 mt-0.5">
 <span className="text-[11px] font-medium text-ink-600">
 {isPartnerTyping ? (
 <span className="text-marigold-500 font-bold flex items-center gap-1">
 {t("chat.typing")}
 <span className="flex space-x-0.5 ml-1">
 <span className="w-1 h-1 bg-marigold-500 rounded-full animate-bounce" style={{ animationDelay:'0ms'}}></span>
 <span className="w-1 h-1 bg-marigold-500 rounded-full animate-bounce" style={{ animationDelay:'150ms'}}></span>
 <span className="w-1 h-1 bg-marigold-500 rounded-full animate-bounce" style={{ animationDelay:'300ms'}}></span>
 </span>
 </span>
 ) : wsConnected ? (
 <span className="text-green-600 font-medium">{t("chat.gatewayOnline")}</span>
 ) : (
 t("chat.connecting")
 )}
 </span>
 </div>
 </div>
 </div>
 </div>

 {/* Scrollable Message History Area */}
 <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
 {loadingHistory ? (
 <div className="flex items-center justify-center h-full">
 <div className="text-xs text-ink-500 font-medium bg-white/50 px-4 py-2 rounded-full animate-pulse">
 {t("chat.loadingLogs")}
 </div>
 </div>
 ) : messages.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-full text-ink-500">
 <div className="w-16 h-16 mb-4 text-4xl bg-white/50 flex items-center justify-center rounded-full shadow-sm animate-float-slow">
 👋
 </div>
 <p className="text-sm font-medium">{t("chat.waveHello")}</p>
 </div>
 ) : (
 messages.map((msg, index) => {const isOutgoing = msg.sender === loggedInUser.email;
 const prevMsg = messages[index - 1];
 const showAvatar = !isOutgoing && (!prevMsg || prevMsg.sender !== msg.sender);
 
 return (
 <motion.div key={msg._id || Math.random()} className={`flex ${isOutgoing ?"justify-end" :"justify-start"} items-end gap-2 animate-fade-in`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
 {!isOutgoing && (
 <div className={`w-6 h-6 rounded-full bg-[#F5A623] text-white font-bold flex items-center justify-center text-[10px] shadow-sm shrink-0 ${showAvatar ?"opacity-100" :"opacity-0"}`}>
 {showAvatar ? (activePartner.fullName ? activePartner.fullName.charAt(0).toUpperCase() : activePartner.companyName?.charAt(0).toUpperCase() || <User size={12} />) :""}
 </div>
 )}
 
 <div
 className={`max-w-[75%] px-4 py-3 shadow-sm text-[13px] leading-relaxed relative group ${isOutgoing
 ?"bg-[#F5A623] text-white rounded-xl rounded-br-sm":"bg-white/90 text-ink-800 border border-ink-200 rounded-xl rounded-bl-sm"
}`}
 >
 <p className="whitespace-pre-wrap">{msg.text}</p>
 <span
 className={`text-[9px] block font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute ${isOutgoing ?"-left-12 bottom-2 text-ink-500" :"-right-12 bottom-2 text-ink-500"
}`}
 >
 {msg.timestamp ? (() => {const d = new Date(msg.timestamp);
 return isNaN(d.getTime()) ?"" : d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit"});
})() :""}
 </span>
 </div>
 </motion.div>
 );
})
 )}
 
 {isPartnerTyping && (
 <motion.div className="flex justify-start items-end gap-2 animate-fade-in" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
 <div className="w-6 h-6 rounded-full bg-[#F5A623] text-white font-bold flex items-center justify-center text-[10px] shadow-sm shrink-0">
 {activePartner.fullName ? activePartner.fullName.charAt(0).toUpperCase() : activePartner.companyName?.charAt(0).toUpperCase() || <User size={12} />}
 </div>
 <div className="bg-white/90 border border-ink-200 rounded-xl rounded-bl-sm px-4 py-3.5 shadow-sm">
 <div className="flex space-x-1.5 items-center justify-center h-2">
 <div className="w-1.5 h-1.5 bg-ink-400 rounded-full animate-bounce" style={{ animationDelay:'0ms'}}></div>
 <div className="w-1.5 h-1.5 bg-ink-400 rounded-full animate-bounce" style={{ animationDelay:'150ms'}}></div>
 <div className="w-1.5 h-1.5 bg-ink-400 rounded-full animate-bounce" style={{ animationDelay:'300ms'}}></div>
 </div>
 </div>
 </motion.div>
 )}
 <div ref={messagesEndRef} className="h-2" />
 </div>

 {/* Message Typing and Send Form */}
 <div className="p-3 sm:p-4 border-t border-white/20 bg-white/50 z-10">
 <form onSubmit={handleSendMessage} className="flex gap-2 relative">
 <button type="button" className="p-3 text-ink-500 hover:text-ink-700 transition-colors">
 <Paperclip className="w-5 h-5" />
 </button>
 <input
 type="text"value={messageInput}
 onChange={handleInputChange}
 placeholder={t("chat.typeMessagePlaceholder")}
 className="flex-1 bg-white/70 border border-white/50 text-sm px-5 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-inner text-ink-800 placeholder-ink-500"required
 />
 <button
 type="submit"className="bg-gradient-to-r from-marigold-600 to-marigold-600 hover:from-marigold-700 hover:to-marigold-700 text-white font-bold text-sm px-5 sm:px-6 rounded-xl shadow-md transition-transform hover:scale-105 active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:hover:scale-100"disabled={!messageInput.trim()}
 >
 <span className="hidden sm:inline mr-1">{t("chat.sendButton")}</span>
 <Send className="w-5 h-5" />
 </button>
 </form>
 </div>
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-paper">
 <div className="w-12 h-12 rounded-xl bg-marigold-50 flex items-center justify-center text-marigold-500 shadow-sm border border-marigold-100 mb-4">
 <MessageSquare className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-sm font-semibold text-ink-900 tracking-tight">{t("chat.noConversationSelected")}</h3>
 <p className="text-xs text-ink-500 mt-1 max-w-xs leading-relaxed">
 {t("chat.noConversationDesc")}
 </p>
 </div>
 </div>
 )}
 </div>

 </div>
 </motion.div>
 );
}

