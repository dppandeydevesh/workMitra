import { useState, useEffect} from"react";
import { useNavigate} from"react-router-dom";
import { API_BASE_URL} from"../config";
import { useToast} from"../components/Toast";
import { useTranslation} from"react-i18next";

export default function CalendarView() {const navigate = useNavigate();
 const toast = useToast();
 const { t} = useTranslation();

 const [projects, setProjects] = useState([]);
 const [loading, setLoading] = useState(true);
 const [errorMessage, setErrorMessage] = useState("");
 const [currentDate, setCurrentDate] = useState(new Date());
 const [selectedDay, setSelectedDay] = useState(null);

 const MONTH_NAMES = [
 t("calendar.months.january"), t("calendar.months.february"), t("calendar.months.march"), t("calendar.months.april"),
 t("calendar.months.may"), t("calendar.months.june"), t("calendar.months.july"), t("calendar.months.august"),
 t("calendar.months.september"), t("calendar.months.october"), t("calendar.months.november"), t("calendar.months.december")
 ];
 const DAY_NAMES = [
 t("calendar.days.sun"), t("calendar.days.mon"), t("calendar.days.tue"), t("calendar.days.wed"),
 t("calendar.days.thu"), t("calendar.days.fri"), t("calendar.days.sat")
 ];

 useEffect(() => {const savedUser = JSON.parse(localStorage.getItem("user") ||"{}");
 if (!savedUser.email || savedUser.userRole !=="company") {toast.error(t("calendar.corporateSessionRequired"));
 navigate("/login");
 return;
}
 fetchProjects(savedUser.email);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

 const fetchProjects = async (email) => {setLoading(true);
 setErrorMessage("");
 try {const res = await fetch(`${API_BASE_URL}/api/projects/company/${email}`, { credentials:"include",
 headers: {}
});
 if (res.ok) {const data = await res.json();
 setProjects(data);
} else {
 setErrorMessage(t("calendar.failedToLoad") || "Failed to load projects for calendar.");
}
} catch (err) {
 setErrorMessage(t("calendar.failedToLoad") || "Failed to load projects for calendar.");
 console.error("Failed to load projects for calendar:", err);
} finally {setLoading(false);
}
};

 const year = currentDate.getFullYear();
 const month = currentDate.getMonth();
 const daysInMonth = new Date(year, month + 1, 0).getDate();
 const firstDayOfWeek = new Date(year, month, 1).getDay();

 const today = new Date();
 const isToday = (day) =>
 today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

 const getProjectsForDay = (day) => {const dateStr =`${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
 return projects.filter(p => {if (!p.deadline) return false;
 const dl = new Date(p.deadline);
 const dlStr =`${dl.getFullYear()}-${String(dl.getMonth() + 1).padStart(2,"0")}-${String(dl.getDate()).padStart(2,"0")}`;
 return dlStr === dateStr;
});
};

 const handlePrevMonth = () => {setCurrentDate(new Date(year, month - 1, 1));
 setSelectedDay(null);
};

 const handleNextMonth = () => {setCurrentDate(new Date(year, month + 1, 1));
 setSelectedDay(null);
};

 // Build calendar cells
 const cells = [];
 for (let i = 0; i < firstDayOfWeek; i++) {cells.push(null);
}
 for (let d = 1; d <= daysInMonth; d++) {cells.push(d);
}

 const selectedDayProjects = selectedDay ? getProjectsForDay(selectedDay) : [];

 return (
 <div className="min-h-screen bg-transparent font-sans py-8">
 <div className="max-w-4xl mx-auto px-4">
 <button
 onClick={() => navigate("/company-dashboard")}
 className="mb-6 px-4 py-2 bg-white hover:bg-white text-ink-600 rounded-xl text-xs font-bold transition shadow-sm border border-ink-100 flex items-center gap-1.5">
 ← {t("calendar.backToCommandCenter")}
 </button>

 <div className="bg-white rounded-xl shadow-sm border border-ink-100 overflow-hidden">
 {/* Calendar Header */}
 <div className="bg-white border-b border-[#E1E2DC] px-6 py-5 flex justify-between items-center">
 <button
 onClick={handlePrevMonth}
 style={{ background: 'transparent', color: '#6B7280' }}
 className="px-3 py-1.5 hover:text-[#1B2333] text-xs font-bold transition">
 ← {t("calendar.prev")}
 </button>
 <h2 className="text-[#1B2333] font-medium text-lg sm:text-xl tracking-tight">
 📅 {MONTH_NAMES[month]} {year}
 </h2>
 <button
 onClick={handleNextMonth}
 style={{ background: 'transparent', color: '#6B7280' }}
 className="px-3 py-1.5 hover:text-[#1B2333] text-xs font-bold transition">
 {t("calendar.next")} →
 </button>
 </div>

 {loading ? (
  <div className="text-center py-16 text-ink-400 font-medium animate-pulse flex flex-col items-center gap-3">
  <div className="w-8 h-8 border-4 border-marigold-500 border-t-transparent rounded-full animate-spin" />
  <span>{t("calendar.loadingData")}</span>
  </div>
  ) : errorMessage ? (
    <div className="p-8 text-center space-y-4 max-w-md mx-auto my-12">
      <span className="text-4xl block">⚠️</span>
      <p className="text-red-700 font-bold">{errorMessage}</p>
      <button 
        onClick={() => fetchProjects(JSON.parse(localStorage.getItem("user") || "{}").email)} 
        style={{ background: "#F5A623", color: "#1B2333" }} className="px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
      >
        Retry
      </button>
    </div>
  ) : (
  <div className="p-4 sm:p-6">
 {/* Day headers */}
 <div className="grid grid-cols-7 gap-1 mb-2">
 {DAY_NAMES.map((d) => (
 <div key={d} style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }} className="text-center py-2">
 {d}
 </div>
 ))}
 </div>

 {/* Calendar grid */}
 <div className="grid grid-cols-7 gap-1">
 {cells.map((day, idx) => {if (day === null) {return <div key={`empty-${idx}`} className="h-14 sm:h-16" />;
}
 const dayProjects = getProjectsForDay(day);
 const hasDeadline = dayProjects.length > 0;
 const isTodayCell = isToday(day);
 const isSelected = selectedDay === day;

 return (
 <button
 key={`day-${day}`}
 onClick={() => setSelectedDay(isSelected ? null : day)}
 style={{ 
   background: isSelected ? '#F5A623' : isTodayCell ? '#FBE7C4' : '#FFFFFF', 
   color: isSelected ? '#1B2333' : isTodayCell ? '#7A4F00' : '#1B2333', 
   border: '0.5px solid #E1E2DC', 
   fontWeight: (isSelected || isTodayCell) ? 500 : 'normal' 
 }}
 className="h-14 sm:h-16 rounded-xl text-xs relative flex flex-col items-center justify-center gap-0.5 hover:bg-ink-50 transition"
 >
 <span className="text-sm">{day}</span>
 {hasDeadline && (
 <div className="flex gap-0.5">
 {dayProjects.slice(0, 3).map((_, pIdx) => (
 <span
 key={pIdx}
 style={{ background: '#E24B4A' }}
 className="w-1.5 h-1.5 rounded-full"
 />
 ))}
 </div>
 )}
 </button>
 );
})}
 </div>

 {/* Selected day detail panel */}
 {selectedDay && (
 <div className="mt-6 border-t pt-5 animate-fade-in">
 <h3 className="text-sm font-black text-ink-800 uppercase tracking-wider mb-3">
 📌 {t("calendar.deadlinesOn", { month: MONTH_NAMES[month], day: selectedDay, year})}
 </h3>
 {selectedDayProjects.length === 0 ? (
 <p className="text-xs text-ink-400 italic">{t("calendar.noDeadlines")}</p>
 ) : (
 <div className="space-y-2">
 {selectedDayProjects.map((p) => (
 <div
 key={p._id}
 className="flex justify-between items-center bg-ink-50 border border-ink-100 p-3.5 rounded-xl hover:bg-ink-100 transition">
 <div>
 <p className="text-xs font-bold text-ink-800">{p.title}</p>
 <p className="text-[10px] text-ink-400 font-semibold mt-0.5">
 {p.complexity || t("calendar.intermediate")} • {p.duration || t("calendar.na")} • {p.studentsNeeded || 1} {t("calendar.slots")}
 </p>
 </div>
 <span className="text-sm font-black text-marigold-700 font-mono">₹{p.budget?.toLocaleString()}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
