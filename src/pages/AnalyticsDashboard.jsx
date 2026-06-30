import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(savedUser);

    if (!savedUser.email || savedUser.userRole !== "company") {
      setErrorMessage("Corporate user session context missing.");
      setLoading(false);
      return;
    }

    fetchAnalyticsData(savedUser.email);
  }, []);

  const fetchAnalyticsData = async (companyEmail) => {
    setLoading(true);
    try {
      // Fetch both projects and applications concurrently
      const [projectsRes, appsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/projects/company/${companyEmail}`),
        fetch(`${API_BASE_URL}/api/applications/company/${companyEmail}`)
      ]);

      const projectsData = await projectsRes.json();
      const appsData = await appsRes.json();

      if (projectsRes.ok && appsRes.ok) {
        setProjects(projectsData);
        setApplications(appsData);
      } else {
        setErrorMessage("Failed to synchronize analytics backend databases.");
      }
    } catch (err) {
      setErrorMessage("Error connecting to server gateway.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 📊 ANALYTICS CALCULATIONS & DATA MAPPING
  // ==========================================
  const totalProjectsCount = projects.length;
  const totalApplicationsCount = applications.length;

  // 1. Payout Budget Calculations
  const totalBudgetInvested = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const averageBudget = totalProjectsCount > 0 ? Math.round(totalBudgetInvested / totalProjectsCount) : 0;

  // 1.1 Escrow calculations
  const lockedEscrow = applications
    .filter(app => ["Approved", "Submitted"].includes(app.status))
    .reduce((sum, app) => sum + (app.projectId?.budget || 0), 0);

  const releasedPayouts = applications
    .filter(app => app.status === "Completed")
    .reduce((sum, app) => sum + (app.projectId?.budget || 0), 0);

  const disputedEscrow = applications
    .filter(app => app.status === "Disputed")
    .reduce((sum, app) => sum + (app.projectId?.budget || 0), 0);

  // 2. Status Breakdown counts
  const statusCounts = applications.reduce(
    (acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    },
    { Pending: 0, Approved: 0, Submitted: 0, Completed: 0, Rejected: 0 }
  );

  const conversionPercentage =
    totalApplicationsCount > 0
      ? Math.round(((statusCounts.Completed + statusCounts.Approved) / totalApplicationsCount) * 100)
      : 0;

  // 3. Leaderboard of Top Budget Projects (sorted descending)
  const topProjectsLeaderboard = [...projects]
    .sort((a, b) => b.budget - a.budget)
    .slice(0, 5);

  // 4. Skills Frequency Analysis
  const skillFrequency = projects.reduce((acc, p) => {
    if (p.requiredSkills && Array.isArray(p.requiredSkills)) {
      p.requiredSkills.forEach((skill) => {
        const cleanSkill = skill.trim();
        if (cleanSkill) {
          acc[cleanSkill] = (acc[cleanSkill] || 0) + 1;
        }
      });
    }
    return acc;
  }, {});

  const topSkillsList = Object.entries(skillFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="min-h-screen dark:bg-slate-950 dark:bg-none bg-gradient-to-br from-blue-50 to-indigo-100 font-sans">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="border-b pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-800 dark:text-gray-200 tracking-tight flex items-center gap-2">
                <span>📈 Recruiter Analytics Hub</span>
              </h1>
              <p className="text-gray-500 mt-1 text-sm">Monitor corporate track health, budget distributions, student success rates, and skill demands.</p>
            </div>
            <button
              onClick={() => navigate("/company-dashboard")}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              ← Back to Command Center
            </button>
          </div>

          {errorMessage && (
            <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl shadow-sm">
              ⚠️ {errorMessage}
            </div>
          )}

          {loading ? (
            <div className="text-center py-16 text-gray-500 font-medium animate-pulse flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span>📊 Aggregating workspace charts and project metrics...</span>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 🌐 Grid of Key Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Metric 1 */}
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
                  <div className="text-2xl mb-3">💼</div>
                  <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider block">Gigs Deployed</span>
                  <span className="text-3xl font-black text-blue-950 block mt-1">{totalProjectsCount}</span>
                  <p className="text-xs text-blue-800/70 mt-1">Active project stack nodes</p>
                </div>

                {/* Metric 2 */}
                <div className="bg-green-50 border border-green-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
                  <div className="text-2xl mb-3">👨‍🎓</div>
                  <span className="text-[10px] font-extrabold text-green-700 uppercase tracking-wider block">Applications Received</span>
                  <span className="text-3xl font-black text-green-950 block mt-1">{totalApplicationsCount}</span>
                  <p className="text-xs text-green-800/70 mt-1">Student submissions registered</p>
                </div>

                {/* Metric 3 */}
                <div className="bg-purple-50 border border-purple-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
                  <div className="text-2xl mb-3">🎯</div>
                  <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider block">Conversion Rate</span>
                  <span className="text-3xl font-black text-purple-950 dark:text-purple-200 block mt-1">{conversionPercentage}%</span>
                  <p className="text-xs text-purple-800/70 mt-1">Approved or completed rates</p>
                </div>

                {/* Metric 4 */}
                <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
                  <div className="text-2xl mb-3">💸</div>
                  <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">Average Gig Budget</span>
                  <span className="text-3xl font-black text-amber-950 block mt-1">₹{averageBudget.toLocaleString()}</span>
                  <p className="text-xs text-amber-800/70 mt-1">Total: ₹{totalBudgetInvested.toLocaleString()}</p>
                </div>
              </div>

              {/* 🔒 Escrow Protection Ledgers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-inner">
                <div className="flex items-center gap-4">
                  <div className="text-3xl bg-blue-100 p-3 rounded-2xl text-blue-700">🔒</div>
                  <div>
                    <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">Locked in Escrow Protection</span>
                    <span className="text-2xl font-black text-gray-800 dark:text-gray-200 block mt-0.5">₹{lockedEscrow.toLocaleString()}</span>
                    <p className="text-[11px] text-gray-400 mt-0.5">Funds safely registered for approved/submitted tasks.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-3xl bg-emerald-100 p-3 rounded-2xl text-emerald-700">💸</div>
                  <div>
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">Total Payouts Released</span>
                    <span className="text-2xl font-black text-gray-800 dark:text-gray-200 block mt-0.5">₹{releasedPayouts.toLocaleString()}</span>
                    <p className="text-[11px] text-gray-400 mt-0.5">Direct compensation disbursed to student developers.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-3xl bg-rose-100 p-3 rounded-2xl text-rose-700">⚠️</div>
                  <div>
                    <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider block">Escrow locked under Dispute</span>
                    <span className="text-2xl font-black text-gray-800 dark:text-gray-200 block mt-0.5">₹{disputedEscrow.toLocaleString()}</span>
                    <p className="text-[11px] text-gray-400 mt-0.5">Disputed funds currently on hold.</p>
                  </div>
                </div>
              </div>

              {/* 📊 Visual Graph Widget Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Panel 1: Application Status Breakdown */}
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-1">Application Lifecycle</h3>
                    <p className="text-xs text-gray-400 mb-6">Status distribution of student applications.</p>

                    {totalApplicationsCount === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-16">No applications received yet</p>
                    ) : (
                      <div className="flex flex-col items-center">
                        {/* Recharts Donut */}
                        <div className="relative w-full h-48 flex items-center justify-center mb-6">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Completed', value: statusCounts.Completed, color: '#10b981' },
                                  { name: 'Approved', value: statusCounts.Approved, color: '#3b82f6' },
                                  { name: 'Submitted', value: statusCounts.Submitted, color: '#f59e0b' },
                                  { name: 'Pending', value: statusCounts.Pending, color: '#9ca3af' },
                                  { name: 'Rejected', value: statusCounts.Rejected, color: '#ef4444' }
                                ].filter(entry => entry.value > 0)}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                dataKey="value"
                                stroke="none"
                              >
                                {
                                  [
                                    { name: 'Completed', value: statusCounts.Completed, color: '#10b981' },
                                    { name: 'Approved', value: statusCounts.Approved, color: '#3b82f6' },
                                    { name: 'Submitted', value: statusCounts.Submitted, color: '#f59e0b' },
                                    { name: 'Pending', value: statusCounts.Pending, color: '#9ca3af' },
                                    { name: 'Rejected', value: statusCounts.Rejected, color: '#ef4444' }
                                  ].filter(entry => entry.value > 0).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))
                                }
                              </Pie>
                              <RechartsTooltip />
                            </PieChart>
                          </ResponsiveContainer>
                          {/* Inner center text overlay */}
                          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xl font-black text-gray-800 dark:text-gray-200">{totalApplicationsCount}</span>
                            <span className="text-[9px] uppercase font-bold text-gray-400">Total</span>
                          </div>
                        </div>

                        {/* Color Coded Legends */}
                        <div className="w-full grid grid-cols-2 gap-x-4 gap-y-2.5 text-[11px] font-bold text-gray-600 mt-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-[#10b981] rounded-full inline-block"></span>
                            <span>Completed: {statusCounts.Completed}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-[#3b82f6] rounded-full inline-block"></span>
                            <span>Approved: {statusCounts.Approved}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-[#f59e0b] rounded-full inline-block"></span>
                            <span>Audit: {statusCounts.Submitted}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-[#9ca3af] rounded-full inline-block"></span>
                            <span>Pending: {statusCounts.Pending}</span>
                          </div>
                          {statusCounts.Rejected > 0 && (
                            <div className="flex items-center gap-1.5 col-span-2 justify-center mt-1 border-t pt-2 border-dashed border-gray-100 dark:border-slate-800">
                              <span className="w-2.5 h-2.5 bg-[#ef4444] rounded-full inline-block"></span>
                              <span>Rejected Solutions: {statusCounts.Rejected}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="border-t pt-4 mt-6 text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Metrics Loop Complete
                  </div>
                </div>

                {/* Panel 2: Budget Leaderboard */}
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-1">Budget Payout Leaderboard</h3>
                    <p className="text-xs text-gray-400 mb-6">Top 5 highest funded deployed project stacks.</p>

                    {topProjectsLeaderboard.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-8">No deployed projects yet</p>
                    ) : (
                      <div className="space-y-3.5">
                        {topProjectsLeaderboard.map((project, idx) => (
                          <div key={project._id} className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2 max-w-[70%]">
                              <span className="bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">
                                {idx + 1}
                              </span>
                              <p className="font-bold text-gray-800 dark:text-gray-200 truncate" title={project.title}>
                                {project.title}
                              </p>
                            </div>
                            <span className="font-black text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                              ₹{project.budget.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="border-t pt-4 mt-6 text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Max: ₹{(topProjectsLeaderboard[0]?.budget || 0).toLocaleString()}
                  </div>
                </div>

                {/* Panel 3: In-Demand Skills */}
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-1">Skill Demand Index</h3>
                    <p className="text-xs text-gray-400 mb-6">Most requested skills across your deployed projects.</p>

                    {topSkillsList.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-8">No required skills specified yet</p>
                    ) : (
                      <div className="w-full h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topSkillsList.map(([skill, count]) => ({ name: skill, count: count }))} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                            <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{fontSize: '12px', borderRadius: '8px'}} />
                            <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={12} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                  <div className="border-t pt-4 mt-6 text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Distinct Requirements: {Object.keys(skillFrequency).length}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
