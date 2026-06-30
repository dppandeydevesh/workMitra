import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { useWebSocket } from "../components/WebSocketContext";

export default function ChatPage() {
  const { recipientEmail } = useParams();
  const navigate = useNavigate();

  // Active logged-in user (useState with lazy initializer to avoid parsing on every render)
  const [loggedInUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));

  // State Management
  const [partners, setPartners] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(!!recipientEmail);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  const { wsConnected, addListener, sendMessage } = useWebSocket();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const activePartnerRef = useRef(activePartner);

  // Keep activePartnerRef updated with current activePartner state
  useEffect(() => {
    activePartnerRef.current = activePartner;
  }, [activePartner]);

  // Redirect if not logged in
  useEffect(() => {
    if (!loggedInUser) {
      navigate("/");
    }
  }, [loggedInUser, navigate]);

  // Fetch recent chat partners
  const fetchPartners = async () => {
    if (!loggedInUser) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/chat/partners/${loggedInUser.email}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPartners(data);

        // If recipientEmail was passed in route parameters, check if they exist in partners.
        // If not, fetch their details so we can add them to the partner list view dynamically.
        if (recipientEmail && recipientEmail !== loggedInUser.email) {
          const partnerExists = data.some(p => p.email === recipientEmail);
          if (!partnerExists) {
            const userRes = await fetch(`${API_BASE_URL}/api/auth/user/${recipientEmail}`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              setPartners(prev => [userData, ...prev]);
              setActivePartner(userData);
              setShowMobileChat(true);
            }
          } else {
            const partnerObj = data.find(p => p.email === recipientEmail);
            setActivePartner(partnerObj);
            setShowMobileChat(true);
          }
        } else if (data.length > 0 && !activePartnerRef.current) {
          // Default to first chat partner if none selected
          setActivePartner(data[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching chat partners:", err);
    }
  };

  useEffect(() => {
    fetchPartners();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientEmail]);

  // Fetch conversation history when active partner changes
  useEffect(() => {
    const fetchHistory = async () => {
      if (!loggedInUser || !activePartner) return;
      setLoadingHistory(true);
      try {
        const token = localStorage.getItem("token");
        
        // 1. Mark existing partner messages as read
        await fetch(`${API_BASE_URL}/api/chat/read`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ sender: activePartner.email })
        });
        
        // 2. Refresh partners list to clear local unread counts immediately
        const partnerRes = await fetch(`${API_BASE_URL}/api/chat/partners/${loggedInUser.email}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (partnerRes.ok) {
          const updatedPartners = await partnerRes.json();
          setPartners(updatedPartners);
        }

        // 3. Fetch conversation logs
        const res = await fetch(
          `${API_BASE_URL}/api/chat/history/${loggedInUser.email}/${activePartner.email}`, {
            headers: { "Authorization": `Bearer ${token}` }
          }
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
          setIsPartnerTyping(false); // Reset typing status on channel swap
        }
      } catch (err) {
        console.error("Error loading chat history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePartner]);

  // Initialize WebSocket Connection (runs once, stabilized connection)
  useEffect(() => {
    if (!loggedInUser) return;

    const handleIncomingData = (data) => {
      if (data.type === "typing") {
        const currentActivePartner = activePartnerRef.current;
        if (data.sender === currentActivePartner?.email) {
          setIsPartnerTyping(data.isTyping);
        }
        return;
      }

      if (data.type === "message") {
        const currentActivePartner = activePartnerRef.current;
        // If message relates to current active partner, append to messages
        if (
          (data.sender === currentActivePartner?.email && data.receiver === loggedInUser.email) ||
          (data.sender === loggedInUser.email && data.receiver === currentActivePartner?.email)
        ) {
          setMessages((prev) => [...prev, data]);
          
          // Mark incoming active partner messages as read immediately
          if (data.sender === currentActivePartner?.email) {
            fetch(`${API_BASE_URL}/api/chat/read`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
              },
              body: JSON.stringify({ sender: data.sender })
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
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingHistory]);

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    // Send typing notification to active contact
    if (wsConnected && activePartner) {
      sendMessage({
        type: "typing",
        sender: loggedInUser.email,
        receiver: activePartner.email,
        isTyping: true
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (wsConnected && activePartner) {
          sendMessage({
            type: "typing",
            sender: loggedInUser.email,
            receiver: activePartner.email,
            isTyping: false
          });
        }
      }, 3000);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activePartner) return;

    // Reset typing status on send
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (wsConnected) {
      sendMessage({
        type: "typing",
        sender: loggedInUser.email,
        receiver: activePartner.email,
        isTyping: false
      });
    }

    const payload = {
      type: "chat",
      sender: loggedInUser.email,
      receiver: activePartner.email,
      text: messageInput.trim()
    };

    sendMessage(payload);
    setMessageInput("");
  };

  if (!loggedInUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 p-4 md:p-8 flex flex-col font-sans">
      {/* 🧭 TOP HEADER BAR */}
      <div className="max-w-6xl w-full mx-auto flex justify-between items-center mb-6 bg-white/40 backdrop-blur-md px-5 py-3 sm:px-6 sm:py-4 rounded-3xl border border-white/60 shadow-sm">
        <img 
          src="/logo.png" 
          alt="workMitra Logo" 
          className="h-8 sm:h-9 object-contain cursor-pointer" 
          onClick={() => navigate(loggedInUser.userRole === "company" ? "/company-dashboard" : "/dashboard")} 
        />
        <button 
          onClick={() => navigate(loggedInUser.userRole === "company" ? "/company-dashboard" : "/dashboard")}
          className="text-xs font-bold bg-purple-950/10 hover:bg-purple-950/20 text-purple-950 px-3.5 py-2 rounded-xl transition"
        >
          ← Dashboard
        </button>
      </div>

      <div className="max-w-6xl w-full mx-auto bg-white/60 backdrop-blur-xl rounded-[32px] sm:rounded-[40px] shadow-[0_30px_60px_rgba(100,50,150,0.1)] border border-white/80 flex flex-col md:flex-row flex-1 overflow-hidden min-h-[500px] sm:min-h-[600px]">
        
        {/* ========================================================================= */}
        {/* 📇 LEFT SIDEBAR: Active Chat Partners List                               */}
        {/* ========================================================================= */}
        <div className={`w-full md:w-80 border-r border-purple-100 flex-col bg-white/40 ${showMobileChat ? "hidden md:flex" : "flex"}`}>
          <div className="p-5 sm:p-6 border-b border-purple-100">
            <h2 className="text-lg sm:text-xl font-black text-purple-950">Messages</h2>
            <p className="text-[11px] sm:text-xs text-gray-400 mt-1">Connect with recruiters and students</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
            {partners.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400">
                💬 No conversations started yet.
              </div>
            ) : (
              partners.map((partner) => {
                const isActive = activePartner?.email === partner.email;
                return (
                  <button
                    key={partner.email}
                    onClick={() => {
                      setActivePartner(partner);
                      setShowMobileChat(true);
                      navigate(`/chat/${partner.email}`);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition text-left ${
                      isActive 
                        ? "bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-200/50" 
                        : "hover:bg-white/40 border border-transparent"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                      {partner.fullName ? partner.fullName.charAt(0).toUpperCase() : partner.companyName?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-purple-950 truncate">
                        {partner.fullName || partner.companyName}
                      </h4>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider truncate">
                        {partner.userRole === "company" ? "Recruiter" : "Student"}
                      </p>
                    </div>
                    {partner.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
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
        {/* 💬 RIGHT CONTAINER: Chat Conversation                                    */}
        {/* ========================================================================= */}
        <div className={`flex-1 flex-col bg-white/20 ${!showMobileChat ? "hidden md:flex" : "flex"}`}>
          {activePartner ? (
            <>
              {/* Top Conversation Status Header */}
              <div className="p-4 sm:p-6 border-b border-purple-100 flex items-center justify-between bg-white/40">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setShowMobileChat(false);
                      navigate("/chat");
                    }} 
                    className="md:hidden text-purple-600 hover:text-pink-600 font-bold mr-1 text-sm p-1.5 rounded-lg hover:bg-purple-100/30 transition flex items-center justify-center"
                    title="Back to list"
                  >
                    ◀
                  </button>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-sm">
                    {activePartner.fullName ? activePartner.fullName.charAt(0).toUpperCase() : activePartner.companyName?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-purple-950">
                      {activePartner.fullName || activePartner.companyName}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${wsConnected ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                      <span className="text-[10px] text-gray-400">
                        {isPartnerTyping ? (
                          <span className="text-pink-600 font-extrabold animate-pulse">typing...</span>
                        ) : wsConnected ? (
                          "Real-time Gateway Online"
                        ) : (
                          "Connecting..."
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Message History Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingHistory ? (
                  <div className="text-center text-xs text-gray-400 py-12">
                    Loading chat logs...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-xs text-gray-400 py-12">
                    👋 Wave hello! Start your conversation.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOutgoing = msg.sender === loggedInUser.email;
                    return (
                      <div
                        key={msg._id || Math.random()}
                        className={`flex ${isOutgoing ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-sm text-xs leading-relaxed ${
                            isOutgoing
                              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-none"
                              : "bg-white text-purple-950 border border-purple-100/50 rounded-tl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          <span
                            className={`text-[8px] block mt-1 text-right ${
                              isOutgoing ? "text-purple-100" : "text-gray-400"
                            }`}
                          >
                            {msg.timestamp ? (() => {
                              const d = new Date(msg.timestamp);
                              return isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                            })() : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {isPartnerTyping && (
                <div className="px-6 py-2 text-xs text-pink-600 italic animate-pulse bg-white/30 border-t border-purple-100">
                  {activePartner.fullName || activePartner.companyName} is typing...
                </div>
              )}

              {/* Message Typing and Send Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-purple-100 bg-white/40 flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  className="flex-1 bg-white border border-purple-100 text-xs px-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white font-bold text-xs uppercase px-6 rounded-2xl shadow-md transition"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-lg font-black text-purple-950">No Conversation Selected</h3>
              <p className="text-xs text-gray-400 max-w-xs mt-1">
                Select a message thread from the sidebar or click Chat on recruiter profiles/applicants.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
