import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function ChatPage() {
  const { recipientEmail } = useParams();
  const navigate = useNavigate();

  // Active logged-in user
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "null");

  // State Management
  const [partners, setPartners] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

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
      const res = await fetch(`${API_BASE_URL}/api/chat/partners/${loggedInUser.email}`);
      if (res.ok) {
        const data = await res.json();
        setPartners(data);

        // If recipientEmail was passed in route parameters, check if they exist in partners.
        // If not, fetch their details so we can add them to the partner list view dynamically.
        if (recipientEmail && recipientEmail !== loggedInUser.email) {
          const partnerExists = data.some(p => p.email === recipientEmail);
          if (!partnerExists) {
            const userRes = await fetch(`${API_BASE_URL}/api/auth/user/${recipientEmail}`);
            if (userRes.ok) {
              const userData = await userRes.json();
              setPartners(prev => [userData, ...prev]);
              setActivePartner(userData);
            }
          } else {
            const partnerObj = data.find(p => p.email === recipientEmail);
            setActivePartner(partnerObj);
          }
        } else if (data.length > 0 && !activePartner) {
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
  }, [recipientEmail]);

  // Fetch conversation history when active partner changes
  useEffect(() => {
    const fetchHistory = async () => {
      if (!loggedInUser || !activePartner) return;
      setLoadingHistory(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/chat/history/${loggedInUser.email}/${activePartner.email}`
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error("Error loading chat history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [activePartner]);

  // Initialize WebSocket Connection
  useEffect(() => {
    if (!loggedInUser) return;

    // Resolve ws/wss protocol dynamically based on API_BASE_URL
    const getWsUrl = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      if (API_BASE_URL) {
        const wsProtocol = API_BASE_URL.startsWith("https") ? "wss:" : "ws:";
        const host = API_BASE_URL.replace(/^https?:\/\//, "");
        return `${wsProtocol}//${host}`;
      }
      return `${protocol}//${window.location.host}`;
    };

    const wsUrl = getWsUrl();
    const wsSocket = new WebSocket(wsUrl);
    socketRef.current = wsSocket;

    wsSocket.onopen = () => {
      // Authenticate socket session
      wsSocket.send(
        JSON.stringify({
          type: "auth",
          email: loggedInUser.email
        })
      );
    };

    wsSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "status" && data.status === "connected") {
        setWsConnected(true);
        return;
      }

      if (data.type === "message") {
        // If message relates to current active partner, append to messages
        if (
          (data.sender === activePartner?.email && data.receiver === loggedInUser.email) ||
          (data.sender === loggedInUser.email && data.receiver === activePartner?.email)
        ) {
          setMessages((prev) => [...prev, data]);
        }
        
        // Refresh partner list to bubble up recent messages/partners
        fetchPartners();
      }
    };

    wsSocket.onclose = () => {
      setWsConnected(false);
      console.log("WebSocket connection disconnected.");
    };

    return () => {
      if (wsSocket) wsSocket.close();
    };
  }, [activePartner, loggedInUser]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingHistory]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activePartner || !socketRef.current) return;

    const payload = {
      type: "chat",
      sender: loggedInUser.email,
      receiver: activePartner.email,
      text: messageInput.trim()
    };

    socketRef.current.send(JSON.stringify(payload));
    setMessageInput("");
  };

  if (!loggedInUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 p-4 md:p-8 flex flex-col">
      <div className="max-w-6xl w-full mx-auto bg-white/60 backdrop-blur-xl rounded-[40px] shadow-[0_30px_60px_rgba(100,50,150,0.1)] border border-white/80 flex flex-col md:flex-row flex-1 overflow-hidden min-h-[600px]">
        
        {/* ========================================================================= */}
        {/* 📇 LEFT SIDEBAR: Active Chat Partners List                               */}
        {/* ========================================================================= */}
        <div className="w-full md:w-80 border-r border-purple-100 flex flex-col bg-white/40">
          <div className="p-6 border-b border-purple-100">
            <h2 className="text-xl font-black text-purple-950">Messages</h2>
            <p className="text-xs text-gray-400 mt-1">Connect with recruiters and students</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
                      navigate(`/chat/${partner.email}`);
                    }}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition text-left ${
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
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 💬 RIGHT CONTAINER: Chat Conversation                                    */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col bg-white/20">
          {activePartner ? (
            <>
              {/* Top Conversation Status Header */}
              <div className="p-6 border-b border-purple-100 flex items-center justify-between bg-white/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {activePartner.fullName ? activePartner.fullName.charAt(0).toUpperCase() : activePartner.companyName?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-purple-950">
                      {activePartner.fullName || activePartner.companyName}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${wsConnected ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                      <span className="text-[10px] text-gray-400">
                        {wsConnected ? "Real-time Gateway Online" : "Connecting..."}
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
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Typing and Send Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-purple-100 bg-white/40 flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
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
