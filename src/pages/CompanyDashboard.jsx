import { useState, useEffect} from"react";
import { useNavigate} from"react-router-dom";
import { API_BASE_URL} from"../config";
import { useToast} from"../components/Toast";
import { useTranslation} from"react-i18next";
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

 useEffect(() => {const savedUser = JSON.parse(localStorage.getItem("user") ||"{}");
 setCurrentUser(savedUser);

 if (!savedUser.email || savedUser.userRole !=="company") {toast.error(t("companyDashboard.toastCorporateSessionRequired"));
 navigate("/login");
 return;
}

 fetchDashboardData(savedUser.email);
}, []);

 const fetchDashboardData = async (email) => {setLoading(true);
 try {const [statsRes, activityRes] = await Promise.all([
 fetch(`${API_BASE_URL}/api/dashboard/company-stats/${email}`, { credentials:"include",
 headers: {}
}),
 fetch(`${API_BASE_URL}/api/dashboard/recent-activity/${email}`, { credentials:"include",
 headers: {}
})
 ]);

 if (statsRes.ok) {const statsData = await statsRes.json();
 setStats(statsData);
}
 if (activityRes.ok) {const activityData = await activityRes.json();
 setRecentActivity(activityData);
}
} catch (err) {console.error("Failed to load dashboard data:", err);
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

 const containerVariants = {hidden: { opacity: 0},
 show: {opacity: 1,
 transition: { staggerChildren: 0.1}
}
};

 const itemVariants = {hidden: { opacity: 0, y: 20},
 show: { opacity: 1, y: 0, transition: { duration: 0.5}}
};

 return (
 <div className="min-h-screen bg-transparent font-sans">
 <motion.div 
 className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"variants={containerVariants}
 initial="hidden"animate="show">
 {/* Welcome Header */}
 <motion.div variants={itemVariants} className="bg-gradient-to-r from-marigold-600 via-purple-600 to-marigold-600 rounded-xl shadow-sm p-6 sm:p-8 mb-8 text-white relative overflow-hidden">
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
 <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
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
 <motion.div variants={itemVariants} className="wm-panel p-5 rounded-xl">
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
 <motion.div variants={itemVariants} className="wm-panel p-5 rounded-xl">
 <h3 className="text-[10px] font-black text-ink-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
 <Trophy className="w-4 h-4" /> {t("companyDashboard.topPerformers")}
 </h3>
 {(!stats?.topPerformers || stats.topPerformers.length === 0) ? (
 <p className="text-xs text-ink-400 italic">{t("companyDashboard.noTopPerformers")}</p>
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
 <motion.div variants={itemVariants} className="wm-panel p-5 sm:p-6 rounded-xl">
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
 <div className="text-center py-12 wm-panel border-dashed rounded-xl text-ink-400">
 <Inbox className="w-12 h-12 mx-auto mb-3 text-ink-300" />
 <p className="text-xs font-medium">{t("companyDashboard.noRecentActivity")}</p>
 <p className="text-[10px] text-ink-300 mt-1">{t("companyDashboard.deployFirstProject")}</p>
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
 <motion.div variants={itemVariants} className="wm-panel p-5 sm:p-6 rounded-xl">
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