import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/logo.png" alt="workMitra Logo" className="h-10 object-contain cursor-pointer" onClick={() => navigate("/company-dashboard")} />
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-700 hover:text-indigo-600 font-bold flex items-center gap-1 text-xs md:text-sm" onClick={() => navigate("/company-dashboard")}>
                <span>🏠</span>
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button className="text-gray-700 hover:text-indigo-600 font-bold flex items-center gap-1 text-xs md:text-sm" onClick={() => navigate("/company-preferences")}>
                <span>👤</span>
                <span className="hidden sm:inline">Profile</span>
              </button>
              <button className="text-gray-700 hover:text-red-600 font-bold flex items-center gap-1 text-xs md:text-sm" onClick={() => { localStorage.clear(); navigate("/login"); }}>
                <span>🚪</span>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="border-b pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                <span>📈 Recruiter Analytics Hub</span>
              </h1>
              <p className="text-gray-500 mt-1 text-sm">Monitor corporate track health, budget distributions, student success rates, and skill demands.</p>
            </div>
            <button
              onClick={() => navigate("/company-dashboard")}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
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
                <div className="bg-purple-50 border border-purple-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
                  <div className="text-2xl mb-3">🎯</div>
                  <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider block">Conversion Rate</span>
                  <span className="text-3xl font-black text-purple-950 block mt-1">{conversionPercentage}%</span>
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

              {/* 📊 Visual Graph Widget Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Panel 1: Application Status Breakdown */}
                <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-800 mb-1">Application Lifecycle</h3>
                    <p className="text-xs text-gray-400 mb-6">Status distribution of student applications.</p>

                    <div className="space-y-4">
                      {/* Completed */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-gray-700">
                          <span>✓ Verified Solutions (Completed)</span>
                          <span>{statusCounts.Completed}</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-green-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${totalApplicationsCount > 0 ? (statusCounts.Completed / totalApplicationsCount) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Approved */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-gray-700">
                          <span>🔵 Approved Gigs (In Progress)</span>
                          <span>{statusCounts.Approved}</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${totalApplicationsCount > 0 ? (statusCounts.Approved / totalApplicationsCount) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Submitted */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-gray-700">
                          <span>🟡 Submissions under Audit</span>
                          <span>{statusCounts.Submitted}</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${totalApplicationsCount > 0 ? (statusCounts.Submitted / totalApplicationsCount) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Pending */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-gray-700">
                          <span>📭 New Applicants (Pending)</span>
                          <span>{statusCounts.Pending}</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-gray-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${totalApplicationsCount > 0 ? (statusCounts.Pending / totalApplicationsCount) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-4 mt-6 text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Total Interactions: {totalApplicationsCount}
                  </div>
                </div>

                {/* Panel 2: Budget Leaderboard */}
                <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-800 mb-1">Budget Payout Leaderboard</h3>
                    <p className="text-xs text-gray-400 mb-6">Top 5 highest funded deployed project stacks.</p>

                    {topProjectsLeaderboard.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-8">No deployed projects yet</p>
                    ) : (
                      <div className="space-y-3.5">
                        {topProjectsLeaderboard.map((project, idx) => (
                          <div key={project._id} className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2 max-w-[70%]">
                              <span className="bg-gray-100 text-gray-800 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">
                                {idx + 1}
                              </span>
                              <p className="font-bold text-gray-800 truncate" title={project.title}>
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
                <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-800 mb-1">Skill Demand Index</h3>
                    <p className="text-xs text-gray-400 mb-6">Most requested skills across your deployed projects.</p>

                    {topSkillsList.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-8">No required skills specified yet</p>
                    ) : (
                      <div className="space-y-4">
                        {topSkillsList.map(([skill, count]) => (
                          <div key={skill} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-gray-700">
                              <span className="bg-gray-50 px-2 py-0.5 rounded border text-[10px] text-gray-600">{skill}</span>
                              <span className="text-[10px] text-gray-400 uppercase font-black">{count} {count > 1 ? 'Projects' : 'Project'}</span>
                            </div>
                            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${(count / totalProjectsCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
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
