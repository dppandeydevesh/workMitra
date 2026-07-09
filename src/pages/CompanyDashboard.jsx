import { useState, useEffect} from"react";
import { useNavigate} from"react-router-dom";
import { API_BASE_URL} from"../config";
import { useToast} from"../components/Toast";
import { useTranslation} from"react-i18next";
// eslint-disable-next-line no-unused-vars
import { motion} from"framer-motion";
import {Folder, Inbox, Search, CheckCircle, DollarSign, Star, 
 Plus, Users, BarChart2, Calendar, Settings, Trophy, Clock,
 Building2, FileText, PieChart, Activity
} from"lucide-react";

export default function CompanyDashboard() {const navigate = useNavigate();
 const toast = useToast();
 const { t} = useTranslation();

 const [currentUser, setCurrentUser] = useState(null);
 const [stats, setStats] = useState(null);
 const [recentActivity, setRecentActivity] = useState([]);
 const [loading, setLoading] = useState(true);
 const [errorMessage, setErrorMessage] = useState("");

 useEffect(() => {const savedUser = JSON.parse(localStorage.getItem("user") ||"{}");
 setCurrentUser(savedUser);

 if (!savedUser.email || savedUser.userRole !=="company") {toast.error(t("companyDashboard.toastCorporateSessionRequired"));
 navigate("/login");
 return;
}

 fetchDashboardData(savedUser.email);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const fetchDashboardData = async (email) => {setLoading(true);
  setErrorMessage("");
  try {const [statsRes, activityRes] = await Promise.all([
  fetch(`${API_BASE_URL}/api/dashboard/company-stats/${email}`, { credentials:"include",
  headers: {}
 }),
  fetch(`${API_BASE_URL}/api/dashboard/recent-activity/${email}`, { credentials:"include",
  headers: {}
 })
  ]);

  if (statsRes.ok && activityRes.ok) {const statsData = await statsRes.json();
  setStats(statsData);
  const activityData = await activityRes.json();
  setRecentActivity(activityData);
} else {
  setErrorMessage(t("companyDashboard.toastFailedToLoadDashboard"));
}
} catch (err) {
  setErrorMessage(t("companyDashboard.toastFailedToLoadDashboard"));
  console.error("Failed to load dashboard data:", err);
} finally {setLoading(false);
}
};

 const getStatusEmoji = (status) => {const map = {
"Pending":"⏳",
"Approved":"✅",
"Submitted":"📤",
"Completed":"🏆",
"Rejected":"❌",
"Disputed":"⚠️",
"Revision Requested":"🔄"
};
 return map[status] ||"📌";
};

 const getStatusColor = (status) => {const map = {
"Pending":"text-amber-600 bg-amber-50 border-amber-100",
"Approved":"text-marigold-500 bg-marigold-50 border-marigold-100",
"Submitted":"text-purple-600 bg-purple-50 border-purple-100",
"Completed":"text-green-600 bg-green-50 border-green-100",
"Rejected":"text-red-600 bg-red-50 border-red-100",
"Disputed":"text-orange-600 bg-orange-50 border-orange-100",
"Revision Requested":"text-amber-600 bg-amber-50 border-amber-100"
};
 return map[status] ||"text-ink-600 bg-ink-50 border-ink-100";
};

 const getTimeAgo = (dateStr) => {const diff = Date.now() - new Date(dateStr).getTime();
 const mins = Math.floor(diff / 60000);
 if (mins < 1) return t("companyDashboard.timeJustNow");
 if (mins < 60) return t("companyDashboard.timeMinsAgo", { mins});
 const hrs = Math.floor(mins / 60);
 if (hrs < 24) return t("companyDashboard.timeHrsAgo", { hrs});
 const days = Math.floor(hrs / 24);
 return t("companyDashboard.timeDaysAgo", { days});
};

 if (errorMessage) {
     return (
       <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
         <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 border border-ink-100 text-center space-y-4">
           <span className="text-4xl block">⚠️</span>
           <h2 className="text-lg font-bold text-ink-800">{t("companyDashboard.toastFailedToLoadDashboard")}</h2>
           <p className="text-xs text-ink-500">{errorMessage}</p>
           <button
             onClick={() => fetchDashboardData(currentUser?.email || JSON.parse(localStorage.getItem("user") || "{}").email)}
             style={{ background: "#F5A623", color: "#1B2333" }} className="px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
           >
             Retry
           </button>
         </div>
       </div>
     );
   }

   if (loading) {return (
 <div className="min-h-screen bg-transparent p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
 <div className="h-40 skeleton-loader rounded-xl w-full" />
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
 {[...Array(6)].map((_, i) => (
 <div key={i} className="h-28 skeleton-loader rounded-xl" />
 ))}
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="space-y-6 lg:col-span-1">
 <div className="h-64 skeleton-loader rounded-xl" />
 <div className="h-64 skeleton-loader rounded-xl" />
 </div>
 <div className="lg:col-span-2 space-y-6">
 <div className="h-96 skeleton-loader rounded-xl" />
 </div>
 </div>
 </div>
 );
}

  // eslint-disable-next-line no-unused-vars
 const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.15 } } };

  // eslint-disable-next-line no-unused-vars
 const itemVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.15 } } };

 return (
 <div className="min-h-screen bg-transparent font-sans">
 <motion.div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
 {/* Welcome Header */}
 <motion.div className="bg-gradient-to-r from-marigold-600 via-purple-600 to-marigold-600 rounded-xl shadow-sm p-6 sm:p-8 mb-8 text-white relative overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
 <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-2xl" />
 <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full blur-xl" />
 <div className="relative z-10">
 <p className="text-marigold-200 text-[10px] font-extrabold uppercase tracking-widest mb-1">{t("companyDashboard.commandCenter")}</p>
 <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
 {t("companyDashboard.welcomeBack", { name: currentUser?.companyName || currentUser?.fullName || t("companyDashboard.defaultRecruiterName")})} 👋
 </h1>
 <p className="text-marigold-100 text-sm mt-1 max-w-xl">
 {t("companyDashboard.dashboardDescription")}
 </p>
 <div className="flex flex-wrap gap-3 mt-5">
 <span className="wm-panel px-3 py-1.5 rounded-xl text-[10px] font-extrabold flex items-center gap-1.5 text-white border-white/20">
 <Folder className="w-3.5 h-3.5" /> {t("companyDashboard.statProjects", { count: stats?.totalProjects || 0})}
 </span>
 <span className="wm-panel px-3 py-1.5 rounded-xl text-[10px] font-extrabold flex items-center gap-1.5 text-white border-white/20">
 <Users className="w-3.5 h-3.5" /> {t("companyDashboard.statApplications", { count: stats?.totalApplications || 0})}
 </span>
 <span className="wm-panel px-3 py-1.5 rounded-xl text-[10px] font-extrabold flex items-center gap-1.5 text-white border-white/20">
 <Star className="w-3.5 h-3.5 text-marigold-300 fill-current" /> {t("companyDashboard.statAvgRating", { rating: stats?.avgRating ||"0.0"})}
 </span>
 </div>
 </div>
 </motion.div>

 {/* KPI Stats Row */}
 <motion.div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
 {[
 { label: t("companyDashboard.kpiTotalProjects"), value: stats?.totalProjects || 0, icon: <Folder className="w-4 h-4" />, color:"from-marigold-500 to-marigold-600"},
 { label: t("companyDashboard.kpiActiveApplications"), value: stats?.totalApplications || 0, icon: <Inbox className="w-4 h-4" />, color:"from-purple-500 to-purple-600"},
 { label: t("companyDashboard.kpiUnderReview"), value: stats?.submittedCount || 0, icon: <Search className="w-4 h-4" />, color:"from-amber-500 to-amber-600"},
 { label: t("companyDashboard.kpiCompletedTasks"), value: stats?.completedCount || 0, icon: <CheckCircle className="w-4 h-4" />, color:"from-green-500 to-green-600"},
 { label: t("companyDashboard.kpiTotalBudget"), value:`₹${(stats?.totalBudget || 0).toLocaleString()}`, icon: <DollarSign className="w-4 h-4" />, color:"from-emerald-500 to-emerald-600"},
 { label: t("companyDashboard.kpiAvgRating"), value:`${stats?.avgRating ||"0.0"}`, icon: <Star className="w-4 h-4" />, color:"from-pink-500 to-pink-600"}
 ].map((kpi, idx) => (
 <div key={idx} className="wm-panel wm-card p-4 group rounded-xl">
 <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white text-sm mb-3 group-hover:scale-110 transition-transform`}>
 {kpi.icon}
 </div>
 <p className="text-[9px] font-extrabold text-ink-400 uppercase tracking-wider">{kpi.label}</p>
 <div className="flex items-center gap-1 mt-0.5">
 <p className="text-lg font-black text-ink-800">{kpi.value}</p>
 {kpi.label === t("companyDashboard.kpiAvgRating") && <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />}
 </div>
 </div>
 ))}
 </motion.div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Left Column: Quick Actions + Top Performers */}
 <div className="lg:col-span-1 space-y-6">
 {/* Quick Actions */}
 <motion.div className="wm-panel p-5 rounded-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
 <h3 className="text-[10px] font-black text-ink-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
 <Activity className="w-4 h-4" /> {t("companyDashboard.quickActions")}
 </h3>
 <div className="space-y-2.5">
 {[
 { label: t("companyDashboard.actionDeploy"), icon: <Plus className="w-4 h-4" />, path:"/add-project", style:"bg-gradient-to-r from-marigold-600 to-marigold-600 text-white shadow-md hover:shadow-lg"},
 { label: t("companyDashboard.actionMyProjects"), icon: <Folder className="w-4 h-4" />, path:"/my-projects", style:"wm-panel wm-card text-marigold-700"},
 { label: t("companyDashboard.actionApplicantsHub"), icon: <Users className="w-4 h-4" />, path:"/applicants", style:"wm-panel wm-card text-green-700"},
 { label: t("companyDashboard.actionAnalytics"), icon: <BarChart2 className="w-4 h-4" />, path:"/analytics", style:"wm-panel wm-card text-purple-700"},
 { label: t("companyDashboard.actionCalendar"), icon: <Calendar className="w-4 h-4" />, path:"/calendar", style:"wm-panel wm-card text-amber-700"},
 { label: t("companyDashboard.actionSettings"), icon: <Settings className="w-4 h-4" />, path:"/company-settings", style:"wm-panel wm-card text-ink-700"}
 ].map((action, idx) => (
 <button
 key={idx}
 onClick={() => navigate(action.path)}
 className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition flex items-center gap-3 ${action.style}`}
 >
 {action.icon}
 {action.label}
 </button>
 ))}
 </div>
 </motion.div>

 {/* Top Performers */}
 <motion.div className="wm-panel p-5 rounded-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
 <h3 className="text-[10px] font-black text-ink-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
 <Trophy className="w-4 h-4" /> {t("companyDashboard.topPerformers")}
 </h3>
 {(!stats?.topPerformers || stats.topPerformers.length === 0) ? (
     <div className="p-6 text-center flex flex-col items-center justify-center">
       <div className="w-[40px] h-[40px] rounded-xl bg-[#FBE7C4] flex items-center justify-center text-[#F5A623] shadow-sm mb-3">
         <Trophy size={20} />
       </div>
       <p className="text-[12px] font-medium text-[#1B2333] mb-[2px]">{t("companyDashboard.noTopPerformers")}</p>
       <p className="text-[11px] text-[#6B7280] leading-normal max-w-[200px] mx-auto">
         Complete gigs to rank high-performing students on your roster.
       </p>
     </div>
   ) : (
 <div className="space-y-3">
 {stats.topPerformers.map((perf, idx) => (
 <div
 key={idx}
 onClick={() => navigate(`/student-profile/${perf.studentEmail}`)}
 className="flex items-center gap-3 p-3 wm-panel wm-card rounded-xl cursor-pointer">
 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs ${idx === 0 ?"bg-amber-400" : idx === 1 ?"bg-ink-400" :"bg-amber-700"
}`}>
 #{idx + 1}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-xs font-bold text-ink-800 truncate">{perf.studentName}</p>
 <p className="text-[10px] text-ink-400 truncate flex items-center gap-1 mt-0.5"><FileText className="w-3 h-3" /> {perf.projectTitle}</p>
 </div>
 <div className="text-right shrink-0 flex items-center gap-0.5">
 <span className="text-xs font-black text-amber-500">{perf.rating}</span>
 <Star className="w-3 h-3 text-amber-500 fill-current" />
 </div>
 </div>
 ))}
 </div>
 )}
 </motion.div>
 </div>

 {/* Right Column: Recent Activity Feed */}
 <div className="lg:col-span-2 space-y-6">
 <motion.div className="wm-panel p-5 sm:p-6 rounded-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
 <div className="flex justify-between items-center mb-5">
 <h3 className="text-[10px] font-black text-ink-400 uppercase tracking-wider flex items-center gap-1.5">
 <Clock className="w-4 h-4" /> {t("companyDashboard.recentActivity")}
 </h3>
 <button
 onClick={() => navigate("/applicants")}
 className="text-[10px] text-marigold-500 font-extrabold hover:underline">
 {t("companyDashboard.viewAll")} →
 </button>
 </div>

 {recentActivity.length === 0 ? (
     <div className="wm-panel p-[32px_16px] text-center max-w-sm mx-auto my-4 flex flex-col items-center justify-center">
       <div className="w-[40px] h-[40px] rounded-xl bg-[#FBE7C4] flex items-center justify-center text-[#F5A623] shadow-sm mb-3">
         <Inbox size={20} />
       </div>
       <div>
         <h4 className="text-[14px] font-semibold text-[#1B2333] mb-[4px]">{t("companyDashboard.noRecentActivity")}</h4>
         <p className="text-[12px] text-[#6B7280] leading-normal max-w-[200px] mx-auto">
           {t("companyDashboard.deployFirstProject")}
         </p>
       </div>
     </div>
   ) : (
 <div className="space-y-3">
 {recentActivity.map((event, idx) => (
 <div
 key={idx}
 className="flex items-start gap-3 p-3.5 wm-panel wm-card rounded-xl group">
 {/* Status indicator */}
 <div className="shrink-0 mt-0.5">
 <span className="text-lg">{getStatusEmoji(event.status)}</span>
 </div>

 {/* Event details */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5">
 <p className="text-xs font-bold text-ink-800 truncate flex items-center gap-1.5">
 <Building2 className="w-3.5 h-3.5" /> {event.studentName}
 </p>
 <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${getStatusColor(event.status)}`}>
 {event.status}
 </span>
 </div>
 <p className="text-[11px] text-ink-500 truncate flex items-center gap-1.5 mt-1">
 <Folder className="w-3 h-3" /> {event.projectTitle}
 </p>
 {event.feedbackText && (
 <p className="text-[10px] text-ink-400 mt-1 italic truncate max-w-md">
"{event.feedbackText}"</p>
 )}
 </div>

 {/* Timestamp + Rating */}
 <div className="text-right shrink-0">
 <p className="text-[10px] text-ink-400 font-semibold">{getTimeAgo(event.updatedAt)}</p>
 {event.rating && (
 <p className="text-[10px] font-bold text-amber-500 mt-0.5 flex items-center justify-end gap-0.5">
 {event.rating} <Star className="w-3 h-3 fill-current" />
 </p>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </motion.div>

 {/* Pipeline Status Breakdown */}
 {stats && (
 <motion.div className="wm-panel p-5 sm:p-6 rounded-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
 <h3 className="text-[10px] font-black text-ink-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
 <PieChart className="w-4 h-4" /> {t("companyDashboard.applicationPipeline")}
 </h3>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 {[
 { label: t("companyDashboard.statusPending"), count: stats.pendingCount, color:"bg-amber-500"},
 { label: t("companyDashboard.statusApproved"), count: stats.approvedCount, color:"bg-marigold-500"},
 { label: t("companyDashboard.statusSubmitted"), count: stats.submittedCount, color:"bg-purple-500"},
 { label: t("companyDashboard.statusCompleted"), count: stats.completedCount, color:"bg-green-500"},
 { label: t("companyDashboard.statusRejected"), count: stats.rejectedCount, color:"bg-red-500"},
 { label: t("companyDashboard.statusInRevision"), count: stats.revisionCount, color:"bg-orange-500"}
 ].map((item, idx) => (
 <div key={idx} className="wm-panel wm-card rounded-xl p-3 text-center">
 <div className={`w-2 h-2 ${item.color} rounded-full mx-auto mb-2`} />
 <p className="text-lg font-black text-ink-800">{item.count || 0}</p>
 <p className="text-[9px] font-extrabold text-ink-400 uppercase tracking-wider">{item.label}</p>
 </div>
 ))}
 </div>
 </motion.div>
 )}
 </div>
 </div>
 </motion.div>
 </div>
 );
}