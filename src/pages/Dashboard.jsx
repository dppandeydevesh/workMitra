import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function Dashboard() {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // ==========================================
  // 📦 Hook States
  // ==========================================
  const [projects, setProjects] = useState([]);
  const [appliedProjectIds, setAppliedProjectIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [myApplications, setMyApplications] = useState([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [activeAppToSubmit, setActiveAppToSubmit] = useState(null);
  const [submissionLink, setSubmissionLink] = useState("");
  const [submissionText, setSubmissionText] = useState("");

  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [cvReport, setCvReport] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [updatingResume, setUpdatingResume] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [skillFilter, setSkillFilter] = useState("All");
  const [workTypeFilter, setWorkTypeFilter] = useState("All");

  // Notifications dropdown toggle state
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // 1. Get logged-in user context
    const savedUser = localStorage.getItem("user");
    let userObj = null;
    if (savedUser) {
      userObj = JSON.parse(savedUser);
      setCurrentUser(userObj);
      setResumeUrl(userObj.resumeUrl || "");
      setResumeText(userObj.resumeText || "");
      setCvReport(userObj.cvReviewReport || null);
    }

    // 2. Fetch live deployed projects AND student application state concurrently
    const initializeDashboardData = async () => {
      try {
        // 🚀 UPDATED: Fetching from our fresh global project collection route
        const projectsRes = await fetch(`${API_BASE_URL}/api/projects/all`);
        const projectsData = await projectsRes.json();
        
        if (projectsRes.ok) {
          setProjects(projectsData);
        } else {
          setErrorMessage(projectsData.error || "Failed to load deployed projects.");
        }

        // If logged-in user is a student, fetch their tracking list of existing applications
        if (userObj && userObj.userRole !== "company") {
          const appsRes = await fetch(`${API_BASE_URL}/api/applications/student/${userObj.email}`);
          if (appsRes.ok) {
            const appliedIds = await appsRes.json();
            setAppliedProjectIds(appliedIds);
          }
          await fetchApplications(userObj.email);
        }
      } catch (err) {
        setErrorMessage("Cannot connect to server gateway nodes.");
      } finally {
        setLoading(false);
      }
    };

    initializeDashboardData();
  }, []);

  const handleUpdateResumeDetails = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setUpdatingResume(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser.email,
          resumeUrl,
          resumeText
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert("Resume details updated successfully!");
        const updatedUser = {
          ...currentUser,
          resumeUrl: data.user.resumeUrl,
          resumeText: data.user.resumeText
        };
        setCurrentUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } else {
        alert(data.error || "Failed to update resume.");
      }
    } catch (err) {
      alert("Error connecting to server gateway.");
    } finally {
      setUpdatingResume(false);
    }
  };

  const handleReviewCVWithAI = async () => {
    if (!currentUser) return;
    if (!resumeText || resumeText.trim().length === 0) {
      alert("Please paste your CV text details first!");
      return;
    }
    setLoadingReview(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/review-cv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser.email,
          resumeText
        })
      });

      const data = await response.json();
      if (response.ok) {
        setCvReport(data.report);
        const updatedUser = {
          ...currentUser,
          resumeText,
          cvReviewReport: data.report
        };
        setCurrentUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } else {
        alert(data.error || "Failed to review CV.");
      }
    } catch (err) {
      alert("Error communicating with AI engine.");
    } finally {
      setLoadingReview(false);
    }
  };

  const fetchApplications = async (userEmail) => {
    try {
      const detailsRes = await fetch(`${API_BASE_URL}/api/applications/student-details/${userEmail}`);
      if (detailsRes.ok) {
        const details = await detailsRes.json();
        setMyApplications(details);
      }
    } catch (err) {
      console.error("Failed to refetch details");
    }
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!activeAppToSubmit) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/applications/${activeAppToSubmit._id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionLink, submissionText })
      });

      const data = await response.json();
      if (response.ok) {
        alert("Work submitted successfully!");
        setShowSubmitModal(false);
        setSubmissionLink("");
        setSubmissionText("");
        if (currentUser) {
          fetchApplications(currentUser.email);
        }
      } else {
        alert(data.error || "Submission failed.");
      }
    } catch (err) {
      alert("Error sending submission payload.");
    }
  };

  // ==========================================
  // ⚡ Application Submission Pipeline (Updated to link seamlessly with Company Dashboard)
  // ==========================================
  const handleApplyProject = async (projectId) => {
    if (!currentUser) {
      alert("Please log in to apply for projects!");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/applications/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: projectId.toString(), // 🎯 Strong typing string representation to prevent findOne crashes
          studentEmail: currentUser.email,
          studentName: currentUser.fullName || "Student User"
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Application submitted successfully! Recruiter has been notified.");
        // Update local state grid immediately to display "Applied" status without full reload
        setAppliedProjectIds(prev => [...prev, projectId.toString()]);
      } else {
        alert(data.error || "Application routing failed.");
      }
    } catch (err) {
      alert("Error sending tracking network application.");
    }
  };

  // Dynamic application notifications log feed
  const notificationsList = myApplications.map(app => {
    const project = app.projectId;
    if (!project) return null;
    if (app.status === "Approved") {
      return {
        id: app._id,
        title: "Application Approved! 🎉",
        message: `Your application for "${project.title}" was approved. You can now submit your solution.`,
        date: app.appliedAt,
        type: "info"
      };
    }
    if (app.status === "Completed") {
      return {
        id: app._id,
        title: "Gig Verified & Completed! 🏆",
        message: `Your solution for "${project.title}" was approved. Feedback: "${app.feedbackText || "Excellent work!"}"`,
        date: app.submittedAt || app.appliedAt,
        type: "success"
      };
    }
    if (app.status === "Rejected") {
      return {
        id: app._id,
        title: "Application Rejected ✕",
        message: `Your application for "${project.title}" was rejected.`,
        date: app.appliedAt,
        type: "danger"
      };
    }
    return null;
  }).filter(Boolean);

  const uniqueSkillsList = [
    ...new Set(projects.flatMap(p => p.requiredSkills || []).map(s => s.trim()))
  ];

  const filteredProjects = projects.filter((project) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      project.title.toLowerCase().includes(query) ||
      (project.companyId && project.companyId.toLowerCase().includes(query)) ||
      project.description.toLowerCase().includes(query);
      
    const matchesSkill = skillFilter === "All" || (project.requiredSkills && project.requiredSkills.includes(skillFilter));
    const matchesWorkType = workTypeFilter === "All" || project.workType === workTypeFilter;
    
    return matchesSearch && matchesSkill && matchesWorkType;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/logo.png" alt="workMitra Logo" className="h-10 object-contain" />
            </div>
            <div className="flex items-center space-x-4 relative">
              {/* Notification bell button */}
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative text-gray-500 hover:text-indigo-600 p-2 rounded-full hover:bg-gray-100 transition focus:outline-none"
              >
                <span className="text-lg">🔔</span>
                {notificationsList.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Notifications Dropdown menu */}
              {showNotifications && (
                <div className="absolute right-24 top-12 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-80 max-h-96 overflow-y-auto z-50 text-left animate-fade-in">
                  <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider mb-3">Notification Logs ({notificationsList.length})</h4>
                  {notificationsList.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-4">No recent status alerts</p>
                  ) : (
                    <div className="space-y-3">
                      {notificationsList.map(notif => (
                        <div key={notif.id} className={`p-2.5 rounded-xl border text-xs ${
                          notif.type === 'success' ? 'bg-green-50/50 border-green-100' :
                          notif.type === 'danger' ? 'bg-red-50/50 border-red-100' :
                          'bg-blue-50/50 border-blue-100'
                        }`}>
                          <p className="font-extrabold text-gray-900">{notif.title}</p>
                          <p className="text-gray-600 mt-0.5 leading-relaxed">{notif.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button className="text-gray-700 hover:text-blue-600 font-medium" onClick={() => navigate(`/student-profile/${currentUser?.email}`)}>Profile</button>
              <button className="text-gray-700 hover:text-blue-600 font-medium" onClick={() => { localStorage.clear(); navigate("/login"); }}>Logout</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Dashboard, {currentUser?.fullName || "Student"}!</h1>
          {currentUser?.collegeName && (
            <p className="text-sm font-semibold text-indigo-600 mb-4">
              🎓 Verified Student of {currentUser.collegeName} (ID: {currentUser.enrollmentNumber})
            </p>
          )}
          <p className="text-gray-600">You have successfully logged in to workMitra portal.</p>
          
          {/* Old Feature Cards (Interactive) */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <button 
              onClick={() => scrollToSection("gigs-section")}
              className="group text-left bg-blue-50 p-6 rounded-xl hover:bg-blue-100/70 hover:-translate-y-0.5 transition-all duration-200 shadow-sm border border-blue-100/30"
            >
              <h3 className="font-bold text-lg text-blue-950 mb-2 group-hover:text-blue-700">My Gigs</h3>
              <p className="text-gray-600 text-xs">Manage and view your applied gigs</p>
            </button>
            <button 
              onClick={() => scrollToSection("projects-section")}
              className="group text-left bg-green-50 p-6 rounded-xl hover:bg-green-100/70 hover:-translate-y-0.5 transition-all duration-200 shadow-sm border border-green-100/30"
            >
              <h3 className="font-bold text-lg text-green-950 mb-2 group-hover:text-green-700">Orders</h3>
              <p className="text-gray-600 text-xs">Explore new projects in the marketplace</p>
            </button>
            <button 
              onClick={() => alert("💬 Chat module integration hook: In production, this launches a WebSocket socket connection allowing students to chat with recruiters directly.")}
              className="group text-left bg-purple-50 p-6 rounded-xl hover:bg-purple-100/70 hover:-translate-y-0.5 transition-all duration-200 shadow-sm border border-purple-100/30"
            >
              <h3 className="font-bold text-lg text-purple-950 mb-2 group-hover:text-purple-700">Messages</h3>
              <p className="text-gray-600 text-xs">Chat directly with hiring managers</p>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* 🚀 STUDENT ACTIVE GIGS & APPLICATIONS SECTION                              */}
          {/* ========================================================================= */}
          {currentUser && currentUser.userRole !== "company" && (
            <div id="gigs-section" className="mt-12 pt-8 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">My Gigs & Applications</h2>
              <p className="text-sm text-gray-500 mb-6">Track your job applications and submit tasks for payout verification.</p>

              {myApplications.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl text-gray-400 font-medium bg-gray-50/50">
                  📭 You haven't applied to any gigs yet. Explore the marketplace below!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myApplications.map((app) => {
                    const project = app.projectId;
                    if (!project) return null;
                    return (
                      <div key={app._id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                              💼 {project.workType}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                              app.status === "Completed" ? "bg-green-100 text-green-800" :
                              app.status === "Submitted" ? "bg-amber-100 text-amber-800" :
                              app.status === "Approved" ? "bg-blue-100 text-blue-800" :
                              app.status === "Rejected" ? "bg-red-100 text-red-800" :
                              "bg-gray-100 text-gray-600"
                            }`}>
                              {app.status}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 mb-1">{project.title}</h4>
                          <p className="text-xs text-gray-400 mb-2">Company: {project.companyId ? project.companyId.split("@")[0].toUpperCase() : "COMPANY"}</p>
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-4">{project.description}</p>
                        </div>
                        
                        <div className="border-t pt-3 mt-2 flex justify-between items-center">
                          <div>
                            <p className="text-[9px] uppercase font-bold text-gray-400">Budget</p>
                            <p className="font-bold text-green-600 text-xs">₹{project.budget.toLocaleString()}</p>
                          </div>
                          
                          {app.status === "Approved" && (
                            <button
                              onClick={() => { setActiveAppToSubmit(app); setShowSubmitModal(true); }}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition shadow-sm"
                            >
                              Submit Work
                            </button>
                          )}
                          {app.status === "Submitted" && (
                            <span className="text-[11px] text-amber-600 font-semibold italic">Under review</span>
                          )}
                          {app.status === "Completed" && (
                            <div className="text-right">
                              <span className="text-[11px] text-green-600 font-bold block">✓ Approved</span>
                              {app.feedbackText && (
                                <p className="text-[10px] text-gray-400 max-w-[150px] truncate" title={app.feedbackText}>
                                  "{app.feedbackText}"
                                </p>
                              )}
                            </div>
                          )}
                          {app.status === "Pending" && (
                            <span className="text-[11px] text-gray-400 font-medium">Applied</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {/* ========================================================================= */}
          {/* 🧠 workMitra AI CV ANALYZER & CRITIQUE DASHBOARD                          */}
          {/* ========================================================================= */}
          {currentUser && currentUser.userRole !== "company" && (
            <div className="mt-12 pt-8 border-t border-gray-100 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Panel: Inputs for CV share link and Raw Text */}
              <div className="lg:col-span-1 bg-white border border-gray-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                    <span>🧠 AI CV Reviewer</span>
                    <span className="bg-indigo-100 text-indigo-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase">pro</span>
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">Upload or paste your resume details below to critique its quality and check match capabilities.</p>

                  <form onSubmit={handleUpdateResumeDetails} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Resume Cloud Link</label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/file/d/..."
                        value={resumeUrl}
                        onChange={(e) => setResumeUrl(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pasted Resume Text (For AI Parsing)</label>
                      <textarea
                        placeholder="Paste your skills, experience history, projects, and educational summary here..."
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        rows={6}
                        className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={updatingResume}
                        className="flex-1 bg-gray-150 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 rounded-xl transition shadow-sm border border-gray-200"
                      >
                        {updatingResume ? "Saving..." : "Save Details"}
                      </button>
                      <button
                        type="button"
                        onClick={handleReviewCVWithAI}
                        disabled={loadingReview}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-md"
                      >
                        {loadingReview ? "Analyzing..." : "Review CV"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right Panel: Quality Report Display */}
              <div className="lg:col-span-2 bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between min-h-[350px]">
                {loadingReview ? (
                  <div className="flex flex-col items-center justify-center h-full my-auto space-y-4">
                    <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-indigo-200 font-bold animate-pulse uppercase tracking-wider">workMitra AI is analyzing your CV layout & keywords...</p>
                  </div>
                ) : cvReport ? (
                  <div className="space-y-6">
                    {/* Header: Score Ring */}
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                      <div>
                        <h4 className="text-base font-bold text-white">AI Quality Critique Report</h4>
                        <p className="text-[10px] text-indigo-300 font-medium mt-0.5">Powered by Gemini 1.5 Flash</p>
                      </div>
                      <div className="flex items-center space-x-3 text-right">
                        <div>
                          <p className="text-[9px] uppercase font-bold text-indigo-300">Quality Score</p>
                          <p className="text-2xl font-black text-indigo-400">{cvReport.score}/100</p>
                        </div>
                        <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-white/10 border-2 border-indigo-400">
                          <span className="text-[11px] font-black">{cvReport.score}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="text-[11px] font-extrabold uppercase text-green-400 mb-2 flex items-center gap-1.5">
                          <span>✓ Strengths</span>
                        </h5>
                        <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                          {cvReport.strengths?.map((str, idx) => (
                            <li key={idx}>{str}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-[11px] font-extrabold uppercase text-amber-400 mb-2 flex items-center gap-1.5">
                          <span>⚠️ Areas of Improvement</span>
                        </h5>
                        <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                          {cvReport.improvements?.map((imp, idx) => (
                            <li key={idx}>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Recommendations Alert Box */}
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                      <h5 className="text-[10px] font-extrabold uppercase text-indigo-300 mb-1">workMitra AI Actionable Recommendations</h5>
                      <p className="text-xs text-slate-200 leading-relaxed italic">
                        "{cvReport.recommendations}"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full my-auto text-center p-8">
                    <span className="text-4xl mb-3">📄</span>
                    <h4 className="text-base font-bold text-indigo-200 mb-1">No Quality Report Generated Yet</h4>
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed">Paste your resume text details on the left and click "Review CV" to generate your first verified score.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* ========================================================================= */}

          {/* ========================================================================= */}
          {/* 🚀 DEPLOYED COMPANY PROJECTS MARKETPLACE BLOCK                            */}
          {/* ========================================================================= */}
          <div id="projects-section" className="mt-12 pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Deployed Company Projects</h2>
            <p className="text-sm text-gray-500 mb-6">Explore the latest real-world tasks deployed by verified companies.</p>

            {/* Marketplace Filters Panel */}
            <div className="bg-gray-50/60 border border-gray-100 p-4 rounded-2xl mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Search Keywords</label>
                <input
                  type="text"
                  placeholder="Search title, details, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Filter by Required Skill</label>
                <select
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="All">All Skills</option>
                  {uniqueSkillsList.map((skill, idx) => (
                    <option key={idx} value={skill}>{skill}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Filter by Work Type</label>
                <select
                  value={workTypeFilter}
                  onChange={(e) => setWorkTypeFilter(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="All">All Types</option>
                  <option value="Internship">Internship</option>
                  <option value="Project Track">Project Track</option>
                  <option value="Freelance Gig">Freelance Gig</option>
                </select>
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
                ⚠️ {errorMessage}
              </div>
            )}

            {loading ? (
              <div className="text-center py-8 text-gray-500 font-medium animate-pulse">
                🔄 Fetching live corporate projects from database...
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-medium bg-gray-50/50">
                📭 No projects match your current filter settings.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => {
                  // Standardize check against string tracking records
                  const isAlreadyApplied = appliedProjectIds.includes(project._id.toString());
                  return (
                    <div 
                      key={project._id} 
                      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition-all duration-200"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md">
                            🏢 {project.companyId ? project.companyId.split("@")[0].toUpperCase() : "COMPANY"}
                          </span>
                          <span className="bg-gray-100 text-gray-600 text-[11px] font-semibold px-2.5 py-1 rounded-md">
                            📍 {project.workType || "Internship"}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-gray-900 mb-2">
                          {project.title}
                        </h4>
                        
                        <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-3">
                          {project.description}
                        </p>
                      </div>

                      <div className="border-t pt-4 mt-2 space-y-3">
                        <div className="flex flex-wrap gap-1">
                          {project.requiredSkills?.map((skill, index) => (
                            <span key={index} className="bg-gray-50 text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded border border-gray-100">
                              {skill}
                            </span>
                          ))}
                        </div>

                        <div className="flex justify-between items-center text-xs pt-1">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400">Budget</p>
                            <p className="font-bold text-green-600 text-sm">
                              ₹{project.budget?.toLocaleString()}
                            </p>
                          </div>

                          {/* Interface State Management */}
                          {currentUser?.userRole === "company" ? (
                            <button className="bg-gray-100 text-gray-500 font-bold text-xs px-4 py-2 rounded-lg cursor-not-allowed border" disabled>
                              Company View
                            </button>
                          ) : isAlreadyApplied ? (
                            <button className="bg-emerald-100 text-emerald-700 font-extrabold text-xs px-4 py-2 rounded-lg border border-emerald-200 cursor-not-allowed" disabled>
                              ✓ Applied
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleApplyProject(project._id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition shadow-sm"
                            >
                              Apply Project
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* ========================================================================= */}
          {/* 📤 WORK SUBMISSION FORM OVERLAY MODAL                                    */}
          {/* ========================================================================= */}
          {showSubmitModal && activeAppToSubmit && (
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border animate-fade-in">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                  <h3 className="font-bold text-base text-gray-900">Submit Work for: {activeAppToSubmit.projectId.title}</h3>
                  <button onClick={() => setShowSubmitModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
                </div>
                <form onSubmit={handleSubmitWork} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Submission Link (GitHub, Drive, or Hosted URL)</label>
                    <input
                      type="url"
                      placeholder="https://github.com/username/project"
                      value={submissionLink}
                      onChange={(e) => setSubmissionLink(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Explanatory Notes / Description of Work</label>
                    <textarea
                      placeholder="Explain what you implemented, details of the task, and any installation steps..."
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      rows={4}
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(false)}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                    >
                      Submit Work
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* ========================================================================= */}

        </div>
      </div>
    </div>
  );
}