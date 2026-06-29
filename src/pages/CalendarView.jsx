import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { useToast } from "../components/Toast";

export default function CalendarView() {
  const navigate = useNavigate();
  const toast = useToast();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!savedUser.email || savedUser.userRole !== "company") {
      toast.error("Corporate session required.");
      navigate("/login");
      return;
    }
    fetchProjects(savedUser.email);
  }, []);

  const fetchProjects = async (email) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/projects/company/${email}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Failed to load projects for calendar:", err);
    } finally {
      setLoading(false);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const today = new Date();
  const isToday = (day) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const getProjectsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return projects.filter(p => {
      if (!p.deadline) return false;
      const dl = new Date(p.deadline);
      const dlStr = `${dl.getFullYear()}-${String(dl.getMonth() + 1).padStart(2, "0")}-${String(dl.getDate()).padStart(2, "0")}`;
      return dlStr === dateStr;
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  // Build calendar cells
  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  const selectedDayProjects = selectedDay ? getProjectsForDay(selectedDay) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => navigate("/company-dashboard")}
          className="mb-6 px-4 py-2 bg-white/80 hover:bg-white text-gray-600 rounded-xl text-xs font-bold transition shadow-sm border border-gray-100 flex items-center gap-1.5"
        >
          ← Back to Command Center
        </button>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100/50 overflow-hidden">
          {/* Calendar Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex justify-between items-center">
            <button
              onClick={handlePrevMonth}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition backdrop-blur-sm"
            >
              ← Prev
            </button>
            <h2 className="text-white font-black text-lg sm:text-xl tracking-tight">
              📅 {MONTH_NAMES[month]} {year}
            </h2>
            <button
              onClick={handleNextMonth}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition backdrop-blur-sm"
            >
              Next →
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400 font-medium animate-pulse flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading calendar data...</span>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-wider py-2">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {cells.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-14 sm:h-16" />;
                  }
                  const dayProjects = getProjectsForDay(day);
                  const hasDeadline = dayProjects.length > 0;
                  const isTodayCell = isToday(day);
                  const isSelected = selectedDay === day;

                  return (
                    <button
                      key={`day-${day}`}
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className={`h-14 sm:h-16 rounded-xl text-xs font-bold transition-all relative flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-lg scale-105"
                          : isTodayCell
                          ? "bg-indigo-50 text-indigo-700 ring-2 ring-indigo-400 ring-offset-1"
                          : "bg-gray-50/50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span className="text-sm font-extrabold">{day}</span>
                      {hasDeadline && (
                        <div className="flex gap-0.5">
                          {dayProjects.slice(0, 3).map((_, pIdx) => (
                            <span
                              key={pIdx}
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? "bg-white" : "bg-indigo-500"
                              }`}
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
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3">
                    📌 Deadlines on {MONTH_NAMES[month]} {selectedDay}, {year}
                  </h3>
                  {selectedDayProjects.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No project deadlines on this date.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDayProjects.map((p) => (
                        <div
                          key={p._id}
                          className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3.5 rounded-xl hover:bg-slate-100/70 transition"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800">{p.title}</p>
                            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                              {p.complexity || "Intermediate"} • {p.duration || "N/A"} • {p.studentsNeeded || 1} slots
                            </p>
                          </div>
                          <span className="text-sm font-black text-indigo-700 font-mono">₹{p.budget?.toLocaleString()}</span>
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
