import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { useToast } from "../components/Toast";

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const toast = useToast();

  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(savedUser);

    if (!savedUser.email || savedUser.userRole !== "company") {
      toast.error("Corporate session required.");
      navigate("/login");
      return;
    }

    fetchDashboardData(savedUser.email);
  }, []);

  const fetchDashboardData = async (email) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [statsRes, activityRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/dashboard/company-stats/${email}`, {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/dashboard/recent-activity/${email}`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setRecentActivity(activityData);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusEmoji = (status) => {
    const map = {
      "Pending": "⏳",
      "Approved": "✅",
      "Submitted": "📤",
      "Completed": "🏆",
      "Rejected": "❌",
      "Disputed": "⚠️",
      "Revision Requested": "🔄"
    };
    return map[status] || "📌";
  };

  const getStatusColor = (status) => {
    const map = {
      "Pending": "text-amber-600 bg-amber-50 border-amber-100",
      "Approved": "text-blue-600 bg-blue-50 border-blue-100",
      "Submitted": "text-purple-600 bg-purple-50 border-purple-100",
      "Completed": "text-green-600 bg-green-50 border-green-100",
      "Rejected": "text-red-600 bg-red-50 border-red-100",
      "Disputed": "text-orange-600 bg-orange-50 border-orange-100",
      "Revision Requested": "text-amber-600 bg-amber-50 border-amber-100"
    };
    return map[status] || "text-gray-600 bg-gray-50 border-gray-100";
  };

  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center text-gray-500 font-medium animate-pulse flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Synchronizing command center data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-3xl shadow-xl p-6 sm:p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-xl" />
          <div className="relative z-10">
            <p className="text-blue-200 text-[10px] font-extrabold uppercase tracking-widest mb-1">Company Command Center</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {currentUser?.companyName || currentUser?.fullName || "Recruiter"} 👋
            </h1>
            <p className="text-blue-100 text-sm mt-1 max-w-xl">
              Deploy tasks, review applicant submissions, and manage your talent pipeline from a single unified dashboard.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <span className="bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-extrabold border border-white/20">
                📁 {stats?.totalProjects || 0} Projects
              </span>
              <span className="bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-extrabold border border-white/20">
                👥 {stats?.totalApplications || 0} Applications
              </span>
              <span className="bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-extrabold border border-white/20">
                ⭐ {stats?.avgRating || "0.0"} Avg Rating
              </span>
            </div>
          </div>
        </div>

        {/* KPI Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
          {[
            { label: "Total Projects", value: stats?.totalProjects || 0, icon: "📁", color: "from-blue-500 to-blue-600" },
            { label: "Active Applications", value: stats?.totalApplications || 0, icon: "📨", color: "from-purple-500 to-purple-600" },
            { label: "Under Review", value: stats?.submittedCount || 0, icon: "🔍", color: "from-amber-500 to-amber-600" },
            { label: "Completed Tasks", value: stats?.completedCount || 0, icon: "✅", color: "from-green-500 to-green-600" },
            { label: "Total Budget (₹)", value: `₹${(stats?.totalBudget || 0).toLocaleString()}`, icon: "💰", color: "from-emerald-500 to-emerald-600" },
            { label: "Avg. Rating", value: `${stats?.avgRating || "0.0"} ★`, icon: "⭐", color: "from-pink-500 to-pink-600" }
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100/50 p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white text-sm mb-3 group-hover:scale-110 transition-transform`}>
                {kpi.icon}
              </div>
              <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">{kpi.label}</p>
              <p className="text-lg font-black text-gray-800 mt-0.5">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Quick Actions + Top Performers */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 p-5">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-4">⚡ Quick Actions</h3>
              <div className="space-y-2.5">
                {[
                  { label: "Deploy New Task", icon: "➕", path: "/add-project", style: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md" },
                  { label: "My Projects", icon: "📂", path: "/my-projects", style: "bg-blue-50 border border-blue-100 text-blue-700" },
                  { label: "Applicants Hub", icon: "👨‍🎓", path: "/applicants", style: "bg-green-50 border border-green-100 text-green-700" },
                  { label: "Analytics", icon: "📊", path: "/analytics", style: "bg-purple-50 border border-purple-100 text-purple-700" },
                  { label: "Calendar", icon: "📅", path: "/calendar", style: "bg-amber-50 border border-amber-100 text-amber-700" },
                  { label: "Settings", icon: "⚙️", path: "/company-settings", style: "bg-slate-50 border border-slate-100 text-slate-700" }
                ].map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(action.path)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition hover:opacity-90 hover:-translate-y-0.5 transform flex items-center gap-3 ${action.style}`}
                  >
                    <span className="text-base">{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 p-5">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-4">🏆 Top Performers</h3>
              {(!stats?.topPerformers || stats.topPerformers.length === 0) ? (
                <p className="text-xs text-gray-400 italic">No completed tasks with ratings yet.</p>
              ) : (
                <div className="space-y-3">
                  {stats.topPerformers.map((perf, idx) => (
                    <div
                      key={idx}
                      onClick={() => navigate(`/student-profile/${perf.studentEmail}`)}
                      className="flex items-center gap-3 p-3 bg-slate-50/50 border border-slate-100 rounded-xl hover:bg-slate-100/50 transition cursor-pointer"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs ${
                        idx === 0 ? "bg-amber-400" : idx === 1 ? "bg-gray-400" : "bg-amber-700"
                      }`}>
                        #{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{perf.studentName}</p>
                        <p className="text-[10px] text-gray-400 truncate">{perf.projectTitle}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-amber-500">{perf.rating}★</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Recent Activity Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 p-5 sm:p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">🕑 Recent Activity</h3>
                <button
                  onClick={() => navigate("/applicants")}
                  className="text-[10px] text-indigo-600 font-extrabold hover:underline"
                >
                  View All →
                </button>
              </div>

              {recentActivity.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl text-gray-400">
                  <span className="text-3xl block mb-3">📭</span>
                  <p className="text-xs font-medium">No recent application activity yet.</p>
                  <p className="text-[10px] text-gray-300 mt-1">Deploy your first project to start receiving applications!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((event, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3.5 bg-slate-50/30 border border-slate-100/50 rounded-xl hover:bg-slate-50 transition group"
                    >
                      {/* Status indicator */}
                      <div className="shrink-0 mt-0.5">
                        <span className="text-lg">{getStatusEmoji(event.status)}</span>
                      </div>

                      {/* Event details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-bold text-gray-800 truncate">
                            {event.studentName}
                          </p>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${getStatusColor(event.status)}`}>
                            {event.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">
                          📁 {event.projectTitle}
                        </p>
                        {event.feedbackText && (
                          <p className="text-[10px] text-gray-400 mt-1 italic truncate max-w-md">
                            "{event.feedbackText}"
                          </p>
                        )}
                      </div>

                      {/* Timestamp + Rating */}
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-gray-400 font-semibold">{getTimeAgo(event.updatedAt)}</p>
                        {event.rating && (
                          <p className="text-[10px] font-bold text-amber-500 mt-0.5">{event.rating}★</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pipeline Status Breakdown */}
            {stats && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 p-5 sm:p-6 mt-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-4">📊 Application Pipeline</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Pending", count: stats.pendingCount, color: "bg-amber-500" },
                    { label: "Approved", count: stats.approvedCount, color: "bg-blue-500" },
                    { label: "Submitted", count: stats.submittedCount, color: "bg-purple-500" },
                    { label: "Completed", count: stats.completedCount, color: "bg-green-500" },
                    { label: "Rejected", count: stats.rejectedCount, color: "bg-red-500" },
                    { label: "In Revision", count: stats.revisionCount, color: "bg-orange-500" }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 text-center">
                      <div className={`w-2 h-2 ${item.color} rounded-full mx-auto mb-2`} />
                      <p className="text-lg font-black text-gray-800">{item.count}</p>
                      <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}