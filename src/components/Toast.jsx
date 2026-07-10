import { createContext, useContext, useState, useCallback} from"react";

const ToastContext = createContext(null);

export function ToastProvider({ children}) {const [toasts, setToasts] = useState([]);

 const addToast = useCallback((message, type ="success", duration = 4000) => {const id = Math.random().toString(36).substr(2, 9);
 setToasts((prev) => [...prev, { id, message, type}]);

 setTimeout(() => {setToasts((prev) => prev.filter((t) => t.id !== id));
}, duration);
}, []);

 const removeToast = useCallback((id) => {setToasts((prev) => prev.filter((t) => t.id !== id));
}, []);

 const toast = {success: (msg) => addToast(msg,"success"),
 error: (msg) => addToast(msg,"error"),
 info: (msg) => addToast(msg,"info"),
 warning: (msg) => addToast(msg,"warning"),
};

 return (
 <ToastContext.Provider value={toast}>
 {children}
 {/* Toast Overlay Container */}
 <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full">
 {toasts.map((t) => (
 <div
 key={t.id}
 onClick={() => removeToast(t.id)}
 className={`cursor-pointer px-4 py-3 rounded-xl shadow-sm border flex items-center gap-3 transition-all transform translate-y-0 scale-100 hover:scale-[1.02] active:scale-95 animate-slide-in-up text-xs font-bold ${t.type ==="success" ?"bg-emerald-50/95 border-emerald-100 text-emerald-800" :
 t.type ==="error" ?"bg-rose-50/95 border-rose-100 text-rose-800" :
 t.type ==="warning" ?"bg-amber-50/95 border-amber-100 text-amber-800" :
"bg-marigold-50/95 border-marigold-100 text-marigold-800"
}`}
 >
 <span className="text-base">
 {t.type ==="success" ?"✨" :
 t.type ==="error" ?"⚠️" :
 t.type ==="warning" ?"🔔" :"ℹ️"}
 </span>
 <div className="flex-1">{t.message}</div>
 <button className="text-ink-400 hover:text-ink-600 font-extrabold text-sm ml-2">×</button>
 </div>
 ))}
 </div>
 </ToastContext.Provider>
 );
}

export function useToast() {const context = useContext(ToastContext);
 if (!context) {throw new Error("useToast must be used within a ToastProvider");
}
 return context;
}
