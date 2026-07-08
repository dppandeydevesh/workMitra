import React, { useState, useEffect, useRef} from'react';
import ReactMarkdown from'react-markdown';
import { useTranslation} from'react-i18next';
import { API_BASE_URL} from'../config';

const AIAssistant = () => {const { t} = useTranslation();
 const [isOpen, setIsOpen] = useState(false);
 const [messages, setMessages] = useState([]);
 const [inputText, setInputText] = useState('');
 const [isTyping, setIsTyping] = useState(false);
 const messagesEndRef = useRef(null);

 // Auto-scroll to bottom of messages
 const scrollToBottom = () => {messagesEndRef.current?.scrollIntoView({ behavior:'smooth'});
};

 useEffect(() => {scrollToBottom();
}, [messages, isTyping]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const name = currentUser?.fullName?.split(" ")[0] || "Devesh";
      setMessages([{ sender: 'ai', text: t("dashboard.aiAssistantGreeting", { name }) }]);
    }
  };

  const sendMessageText = async (text) => {
    if (isTyping) return;
    const userMessage = { sender: 'user', text };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        credentials: "include",
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage.text,
          history: messages,
          context: {
            path: window.location.pathname,
            name: JSON.parse(localStorage.getItem('user'))?.fullName || 'User'
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response from AI');
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: data.text || data.reply || data.message || t('Sorry, I could not process that.') }]);
    } catch (error) {
      console.error('Error in AI Assistant chat:', error);
      setMessages((prev) => [...prev, { sender: 'ai', text: `⚠️ ${error.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    await sendMessageText(text);
  };

  const handleChipClick = (chipText) => {
    sendMessageText(chipText);
  };

 return (
 <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
 {/* Chat Window Panel */}
 {isOpen && (
 <div className="mb-4 w-80 sm:w-96 h-[500px] max-h-[70vh] flex flex-col rounded-xl overflow-hidden shadow-sm bg-white/70 border border-white/20 transition-all duration-300">
 
 {/* Header */}
 <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-marigold-600 to-marigold-600 text-white shadow-md">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
 </svg>
 </div>
 <div>
 <h3 className="font-semibold text-sm">{t('AI Assistant')}</h3>
 <p className="text-xs text-marigold-100 opacity-90">{t('Always here to help')}</p>
 </div>
 </div>
 <button 
 onClick={toggleChat}
 className="p-1 hover:bg-white/20 rounded-full transition-colors"aria-label={t("Close chat")}
 >
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>

 {/* Messages Area */}
 <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
 {messages.map((msg, index) => (
 <div 
 key={index} 
 className={`flex ${msg.sender ==='user' ?'justify-end' :'justify-start'}`}
 >
 <div 
 className={`max-w-[85%] rounded-xl px-4 py-2 ${msg.sender ==='user'?'bg-marigold-500 text-white rounded-tr-sm shadow-md':'bg-white/90 text-ink-800 rounded-tl-sm shadow-sm border border-ink-100'
}`}
 >
 {msg.sender ==='ai' ? (
 <div className="prose prose-sm prose-p:my-1 prose-ul:my-1 max-w-none break-words">
 <ReactMarkdown>{msg.text}</ReactMarkdown>
 {index === 0 && (
    <div className="flex flex-wrap gap-2 mt-3 select-none">
      {[t("dashboard.chipFindGigs"), t("dashboard.chipReviewProfile"), t("dashboard.chipInterviewTips")].map((chipText) => (
        <button
          key={chipText}
          type="button"
          onClick={() => handleChipClick(chipText)}
          className="border border-[#E1E2DC] rounded-[20px] px-3.5 py-1 text-[11px] text-[#3D4A5C] bg-white hover:bg-[#F6F7F4] active:scale-95 cursor-pointer shadow-sm font-medium transition"
        >
          {chipText}
        </button>
      ))}
    </div>
  )}
 </div>
 ) : (
 <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
 )}
 </div>
 </div>
 ))}
 
 {/* Typing Indicator */}
 {isTyping && (
 <div className="flex justify-start">
 <div className="bg-white/90 rounded-xl rounded-tl-sm px-4 py-3 shadow-sm border border-ink-100 flex items-center gap-1.5">
 <div className="w-2 h-2 rounded-full bg-ink-400 animate-bounce" style={{ animationDelay:'0ms'}}></div>
 <div className="w-2 h-2 rounded-full bg-ink-400 animate-bounce" style={{ animationDelay:'150ms'}}></div>
 <div className="w-2 h-2 rounded-full bg-ink-400 animate-bounce" style={{ animationDelay:'300ms'}}></div>
 </div>
 </div>
 )}
 <div ref={messagesEndRef} />
 </div>

 {/* Input Area */}
 <form 
 onSubmit={handleSendMessage}
 className="p-3 bg-white/50 border-t border-ink-200">
 <div className="relative flex items-center">
 <input
 type="text"value={inputText}
 onChange={(e) => setInputText(e.target.value)}
 placeholder={t("Ask me anything...")}
 className="w-full bg-white text-ink-900 rounded-full pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-marigold-500/50 border border-ink-200 shadow-inner"/>
 <button
 type="submit"disabled={!inputText.trim() || isTyping}
 className="absolute right-1.5 p-1.5 bg-marigold-500 text-white rounded-full hover:bg-marigold-600 disabled:opacity-50 disabled:hover:bg-marigold-500 transition-colors shadow-sm">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
 </svg>
 </button>
 </div>
 </form>
 </div>
 )}

 {/* Floating Action Button */}
 <button
 onClick={toggleChat}
 className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${isOpen 
 ?'bg-ink-800 hover:bg-ink-900 text-white scale-90':'bg-gradient-to-r from-marigold-600 to-marigold-600 hover:scale-105 text-white animate-pulse-glow'
}`}
 aria-label={t("Toggle AI Assistant")}
 >
 {isOpen ? (
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
 </svg>
 ) : (
 <svg className="w-7 h-7 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
 </svg>
 )}
 </button>
 
 {/* Custom Styles */}
 <style dangerouslySetInnerHTML={{__html:`.custom-scrollbar::-webkit-scrollbar {width: 6px;
}
 .custom-scrollbar::-webkit-scrollbar-track {background: transparent;
}
 .custom-scrollbar::-webkit-scrollbar-thumb {background-color: rgba(156, 163, 175, 0.5);
 border-radius: 20px;
}
 .animate-pulse-glow {box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7);
 animation: pulse-glow 2s infinite;
}
 @keyframes pulse-glow {0% {box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7);
}
 70% {box-shadow: 0 0 0 15px rgba(79, 70, 229, 0);
}
 100% {box-shadow: 0 0 0 0 rgba(79, 70, 229, 0);
}
}
`}} />
 </div>
 );
};

export default AIAssistant;
