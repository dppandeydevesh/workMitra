import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { useToast } from "./Toast";
import { useWebSocket } from "./WebSocketContext";
import { useTheme } from "./ThemeContext";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const toast = useToast();
  const { addListener } = useWebSocket();

  useEffect(() => {
    if (!addListener) return;

    const unsubscribe = addListener((data) => {
      if (data.type === "notification" && data.statusUpdate) {
        setNotifications((prev) => [data.message, ...prev]);

        if (data.message.type === "success") {
          toast.success(`${data.message.title}: ${data.message.message}`);
        } else {
          toast.info(`${data.message.title}: ${data.message.message}`);
        }
      }
    });

    return () => unsubscribe();
  }, [addListener]);


  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    setUser(savedUser);

    if (savedUser && savedUser.userRole === "student") {
      // Fetch student applications to extract status updates as notifications
      const fetchStudentNotifications = async () => {
        try {
                    const res = await fetch(`${API_BASE_URL}/api/applications/student-details/${savedUser.email}`, { credentials: "include",
            headers: {  }
          });
          if (res.ok) {
            const apps = await res.json();
            const list = apps
              .filter(app => ["Approved", "Rejected", "Completed"].includes(app.status))
              .map(app => {
                let title = "";
                let msg = "";
                let type = "info";
                if (app.status === "Approved") {
                  title = "🎉 Proposal Approved!";
                  msg = `Your application for "${app.projectId?.title || 'Unknown Gig'}" was approved by the company. You can start working on it!`;
                  type = "success";
                } else if (app.status === "Rejected") {
                  title = "😞 Application Update";
                  msg = `Your application for "${app.projectId?.title || 'Unknown Gig'}" was rejected. Keep trying!`;
                  type = "danger";
                } else if (app.status === "Completed") {
                  title = "🏆 Gig Completed!";
                  msg = `Your work for "${app.projectId?.title || 'Unknown Gig'}" has been reviewed, approved, and marked completed. Check your profile for rating!`;
                  type = "success";
                }
                return { id: app._id, title, message: msg, type };
              });
            setNotifications(list);
          }
        } catch (err) {
          console.error("Failed to fetch notifications:", err.message);
        }
      };
      fetchStudentNotifications();
    }
  }, [location.pathname]);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) { console.error(e); }
    localStorage.clear();
    window.location.href = '/login';
  };

  const companyLinks = [
    { label: t("Dashboard"), path: "/company-dashboard", icon: "🏠" },
    { label: t("Post Gig"), path: "/add-project", icon: "➕" },
    { label: t("Manage Gigs"), path: "/my-projects", icon: "📂" },
    { label: t("Applicants"), path: "/applicants", icon: "👨‍🎓" },
    { label: t("Analytics"), path: "/analytics", icon: "📈" },
    { label: t("Chat"), path: "/chat", icon: "💬" }
  ];

  const studentLinks = [
    { label: t("Marketplace"), path: "/dashboard", icon: "🏠" },
    { label: t("Profile"), path: `/student-profile/${user.email}`, icon: "👤" },
    { label: t("Chat"), path: "/chat", icon: "💬" }
  ];

  const adminLinks = [
    { label: t("Admin Console"), path: "/admin-dashboard", icon: "👑" },
    { label: t("Chat"), path: "/chat", icon: "💬" }
  ];

  const collegeLinks = [
    { label: t("College Portal"), path: "/college-dashboard", icon: "🎓" },
    { label: t("Career Tracks"), path: "/placement-pipeline", icon: "📋" },
    { label: t("Chat"), path: "/chat", icon: "💬" }
  ];

  let activeLinks = [...studentLinks];
  if (user.userRole === "company") {
    activeLinks = [...companyLinks];
  } else if (user.userRole === "faculty") {
    activeLinks = [{ path: "/faculty-dashboard", label: "Faculty Portal", icon: "🎓" }, ...studentLinks];
  } else if (user.userRole === "admin") {
    activeLinks = [...adminLinks, { path: "/faculty-dashboard", label: "Faculty Portal", icon: "🎓" }];
  } else if (user.userRole === "college") {
    activeLinks = [...collegeLinks];
  }

  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-md sticky top-0 z-50 transition-all border-b border-gray-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="workMitra Logo" 
              className="h-9 object-contain cursor-pointer transition hover:scale-105" 
              onClick={() => {
                if (user.userRole === "company") navigate("/company-dashboard");
                else if (user.userRole === "admin") navigate("/admin-dashboard");
                else if (user.userRole === "college") navigate("/college-dashboard");
                else navigate("/dashboard");
              }} 
            />
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1 relative">
            {activeLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              return (
                <button
                  key={link.path}
                  onClick={() => { navigate(link.path); setMobileMenuOpen(false); }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    isActive 
                      ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50" 
                      : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50 dark:bg-slate-900"
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </button>
              );
            })}

            {/* Notification Bell for Students */}
            {user.userRole === "student" && (
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative text-gray-500 hover:text-indigo-600 p-2 rounded-full hover:bg-gray-100 dark:bg-slate-800 transition focus:outline-none"
                >
                  <span className="text-lg">🔔</span>
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
                  )}
                </button>

                {/* Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 top-12 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 p-4 w-80 max-h-96 overflow-y-auto z-50 text-left animate-slide-in-up">
                    <h4 className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider mb-3">Notification Logs ({notifications.length})</h4>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-4">No recent status alerts</p>
                    ) : (
                      <div className="space-y-3">
                        {notifications.map(notif => (
                          <div key={notif.id} className={`p-2.5 rounded-xl border text-[11px] ${
                            notif.type === 'success' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' :
                            notif.type === 'danger' ? 'bg-rose-50/50 border-rose-100 text-rose-800' :
                            'bg-blue-50/50 border-blue-100 text-blue-800'
                          }`}>
                            <p className="font-extrabold">{notif.title}</p>
                            <p className="opacity-90 mt-0.5 leading-relaxed">{notif.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Language Toggle */}
            <button
              onClick={() => i18n.changeLanguage(i18n.language?.startsWith('en') ? 'hi' : 'en')}
              className="p-2 text-xs font-bold text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-800 transition focus:outline-none"
            >
              {i18n.language?.startsWith('en') ? 'हिन्दी' : 'EN'}
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-800 transition focus:outline-none"
              title="Toggle theme mode"
            >
              <span className="text-lg">{theme === "dark" ? "☀️" : "🌙"}</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-55 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ml-1"
            >
              <span>🚪</span>
              <span>{t("Logout")}</span>
            </button>
          </div>

          {/* Mobile Menu Buttons */}
          <div className="flex md:hidden items-center gap-2">
            {user.userRole === "student" && (
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative text-gray-500 hover:text-indigo-600 p-2 rounded-full hover:bg-gray-100 dark:bg-slate-800 transition focus:outline-none"
                >
                  <span className="text-lg">🔔</span>
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                  )}
                </button>
                
                {notificationsOpen && (
                  <div className="absolute right-0 top-12 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 p-4 w-72 max-h-96 overflow-y-auto z-50 text-left">
                    <h4 className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider mb-3">Notification Logs ({notifications.length})</h4>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-4">No recent status alerts</p>
                    ) : (
                      <div className="space-y-3">
                        {notifications.map(notif => (
                          <div key={notif.id} className={`p-2.5 rounded-xl border text-[11px] ${
                            notif.type === 'success' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' :
                            notif.type === 'danger' ? 'bg-rose-50/50 border-rose-100 text-rose-800' :
                            'bg-blue-50/50 border-blue-100 text-blue-800'
                          }`}>
                            <p className="font-extrabold">{notif.title}</p>
                            <p className="opacity-90 mt-0.5 leading-relaxed">{notif.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Language Toggle */}
            <button
              onClick={() => i18n.changeLanguage(i18n.language?.startsWith('en') ? 'hi' : 'en')}
              className="p-2 text-xs font-bold text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-800 transition focus:outline-none"
            >
              {i18n.language?.startsWith('en') ? 'हिन्दी' : 'EN'}
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-800 transition focus:outline-none"
              title="Toggle theme mode"
            >
              <span className="text-lg">{theme === "dark" ? "☀️" : "🌙"}</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-500 hover:text-indigo-600 p-2 rounded-lg hover:bg-gray-100 dark:bg-slate-800 transition focus:outline-none"
            >
              <span className="text-xl">{mobileMenuOpen ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 px-4 py-3 space-y-1.5 shadow-inner">
          {activeLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <button
                key={link.path}
                onClick={() => { navigate(link.path); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                  isActive 
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100/50" 
                    : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50 dark:bg-slate-900"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </button>
            );
          })}
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2.5 text-gray-600 hover:text-red-600 hover:bg-red-55 rounded-xl text-xs font-bold flex items-center gap-2 transition"
          >
            <span>🚪</span>
            <span>{t("Logout")}</span>
          </button>
        </div>
      )}
    </nav>
  );
}
