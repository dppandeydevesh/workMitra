import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { useToast } from "../components/Toast";

export default function ApplicantsHub() {
  const navigate = useNavigate();
  const toast = useToast();
  const renderStepper = (status) => {
    const steps = [
      { label: "Applied", statusVal: "Pending" },
      { label: "Approved", statusVal: "Approved" },
      { label: "Submitted", statusVal: "Submitted" },
      { label: "Completed", statusVal: "Completed" }
    ];

    if (status === "Rejected") {
      return (
        <span className="bg-red-100 text-red-800 text-[9px] font-bold px-2 py-0.5 rounded border border-red-200 uppercase tracking-wider">
          Rejected
        </span>
      );
    }

    if (status === "Disputed") {
      return (
        <span className="bg-rose-100 text-rose-800 text-[9px] font-black px-2.5 py-0.5 rounded-lg border border-rose-200 uppercase tracking-wider animate-pulse">
          ⚠️ Flagged / Disputed
        </span>
      );
    }

    let activeIdx = 0;
    if (status === "Approved") activeIdx = 1;
    if (status === "Submitted") activeIdx = 2;
    if (status === "Completed") activeIdx = 3;

    return (
      <div className="flex items-center space-x-1 text-[8px] sm:text-[9px]">
        {steps.map((step, idx) => {
          const isCompleted = idx <= activeIdx;
          const isActive = idx === activeIdx;
          return (
            <div key={idx} className="flex items-center space-x-1">
              <span className={`px-1.5 py-0.5 rounded font-extrabold transition-all uppercase tracking-wider ${
                isActive ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm" :
                isCompleted ? "bg-purple-100 text-purple-700 font-semibold" :
                "bg-gray-100 dark:bg-slate-800 text-gray-400 font-normal"
              }`}>
                {step.label}
              </span>
              {idx < steps.length - 1 && (
                <span className={isCompleted ? "text-purple-400 font-bold" : "text-gray-300"}>➔</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [sortBy, setSortBy] = useState("match"); // 'match' or 'date'
  const [isBlindMode, setIsBlindMode] = useState(false);

  // Task Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeAppToReview, setActiveAppToReview] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState(5);
  const [ratingReview, setRatingReview] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const [activeFile, setActiveFile] = useState("App.js");
  const [selectedVerIdx, setSelectedVerIdx] = useState(-1);

  useEffect(() => {
    if (activeAppToReview) {
      const versions = activeAppToReview.submissionVersions || [];
      setSelectedVerIdx(versions.length > 0 ? versions.length - 1 : -1);
    } else {
      setSelectedVerIdx(-1);
    }
  }, [activeAppToReview]);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(savedUser);

    if (!savedUser.email || savedUser.userRole !== "company") {
      setErrorMessage("Corporate user session context missing.");
      setLoading(false);
      return;
    }

    fetchCompanyApplications(savedUser.email);
  }, []);

  const fetchCompanyApplications = async (companyEmail) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/applications/company/${companyEmail}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setApplications(data);
      } else {
        setErrorMessage(data.error || "Failed to fetch corporate applications.");
      }
    } catch (err) {
      setErrorMessage("Error connecting to server gateway.");
    } finally {
      setLoading(false);
    }
  };

  // Recruiter actions
  const handleUpdateStatus = async (applicationId, status) => {
    if (!window.confirm(`Are you sure you want to change the status of this application to ${status}?`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/status`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Candidate application status updated to ${status}!`);
        if (currentUser) fetchCompanyApplications(currentUser.email);
      } else {
        toast.error(data.error || "Failed to update status.");
      }
    } catch (err) {
      toast.error("Error sending status payload.");
    }
  };

  const getMockCodeFiles = (projectTitle) => {
    const cleanTitle = (projectTitle || "Project Solutions").toLowerCase();
    if (cleanTitle.includes("react") || cleanTitle.includes("web") || cleanTitle.includes("frontend")) {
      return {
        "App.js": `import React, { useState } from 'react';\nimport './App.css';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n  return (\n    <div className="app-container">\n      <h1>workMitra Verified Solution</h1>\n      <p>Click count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>Increment</button>\n    </div>\n  );\n}`,
        "index.html": `<!DOCTYPE html>\n<html>\n<head>\n  <title>workMitra Sandbox Output</title>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>`,
        "App.css": `.app-container {\n  font-family: sans-serif;\n  text-align: center;\n  padding: 40px;\n  background: #f8fafc;\n  border-radius: 20px;\n}`
      };
    }
    if (cleanTitle.includes("python") || cleanTitle.includes("script") || cleanTitle.includes("data") || cleanTitle.includes("backend")) {
      return {
        "main.py": `import sys\nimport os\n\ndef calculate_match_insights(cv_text, job_details):\n    print("Analyzing student solution metrics...")\n    score = 85\n    return {\n        "status": "Verified",\n        "score": score,\n        "insights": "Candidate matches frontend requirements perfectly."\n    }\n\nif __name__ == "__main__":\n    result = calculate_match_insights("CV PDF Text", "Job Specs")\n    print("Compliance Results:", result)`,
        "requirements.txt": `numpy>=1.22.0\npandas>=1.4.0\nscikit-learn>=1.0.0\n`,
        "README.md": `# Python Solution Script\n\nRun with:\n\`\`\`bash\npython main.py\n\`\`\`\n`
      };
    }
    return {
      "solution.js": `// Deployed Solution Script\nconsole.log("Loading student verification solution logs...");\n\nfunction verifyTaskNode() {\n  return {\n    verified: true,\n    timestamp: new Date().toISOString(),\n    message: "workMitra Automated Escrow check complete."\n  };\n}\n\nconsole.log(verifyTaskNode());`,
      "README.md": `# Task Solution Repository\n\nThis is a verified solution uploaded via workMitra client pipeline.\n`
    };
  };

  const handleDisputeApplication = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      toast.error("Please explain your dispute feedback details first.");
      return;
    }
    if (!window.confirm("Are you sure you want to flag this submission as Disputed? This will hold the project budget in escrow.")) return;
    
    setSubmittingReview(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/applications/${activeAppToReview._id}/dispute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ feedbackText })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Dispute registered. Escrow funds hold active.");
        setShowReviewModal(false);
        if (currentUser) fetchCompanyApplications(currentUser.email);
      } else {
        toast.error(data.error || "Failed to submit dispute.");
      }
    } catch (err) {
      toast.error("Error communicating with server gateway.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleOpenReviewModal = (app) => {
    setActiveAppToReview(app);
    setFeedbackText(app.feedbackText || "");
    setRating(app.rating || 5);
    setRatingReview(app.ratingReview || "");
    setShowReviewModal(true);
  };

  const handleRequestRevision = async (e) => {
    e.preventDefault();
    if (!activeAppToReview) return;
    if (!feedbackText.trim()) {
      toast.error("Please provide revision feedback explanation notes first.");
      return;
    }
    setSubmittingReview(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/applications/${activeAppToReview._id}/revision`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ feedbackText })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Revision request submitted successfully to the candidate!");
        setShowReviewModal(false);
        if (currentUser) fetchCompanyApplications(currentUser.email);
      } else {
        toast.error(data.error || "Failed to submit revision request.");
      }
    } catch (err) {
      toast.error("Error submitting revision request.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReviewExtension = async (applicationId, requestId, status) => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this deadline extension request?`)) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/review-extension`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ requestId, status })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Extension request ${status.toLowerCase()} successfully!`);
        if (currentUser) fetchCompanyApplications(currentUser.email);
      } else {
        toast.error(data.error || "Failed to resolve extension request.");
      }
    } catch (err) {
      toast.error("Network error during extension request review.");
    }
  };

  const handleCompleteReview = async (e) => {
    e.preventDefault();
    if (!activeAppToReview) return;
    setSubmittingReview(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/applications/${activeAppToReview._id}/complete`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ feedbackText, rating, ratingReview })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Task approved and marked as Completed!");
        setShowReviewModal(false);
        if (currentUser) fetchCompanyApplications(currentUser.email);
      } else {
        toast.error(data.error || "Failed to submit review.");
      }
    } catch (err) {
      toast.error("Error submitting task completion.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Extract unique project titles for the dropdown filter
  const uniqueProjectTitles = [
    ...new Set(applications.map((app) => app.projectTitle).filter(Boolean))
  ];

  // Filtering & Sorting pipeline
  const filteredApps = applications
    .filter((app) => {
      // 1. Text Search (name, email, skills)
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        (app.studentName || "").toLowerCase().includes(query) ||
        (app.studentEmail || "").toLowerCase().includes(query) ||
        (app.skills || "").toLowerCase().includes(query);

      // 2. Status Filter
      const matchesStatus = statusFilter === "All" || app.status === statusFilter;

      // 3. Project Filter
      const matchesProject = projectFilter === "All" || app.projectTitle === projectFilter;

      return matchesSearch && matchesStatus && matchesProject;
    })
    .sort((a, b) => {
      if (sortBy === "match") {
        return b.matchScore - a.matchScore;
      } else {
        return new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0);
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="border-b pb-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-800 dark:text-gray-200 tracking-tight flex items-center gap-2">
                <span>👨‍🎓 Applicants Command Center</span>
              </h1>
              <p className="text-gray-500 mt-1 text-sm">Audit candidate applications, inspect matching scores, review task submissions, and approve talent nodes.</p>
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

          {/* Search and Filters panel */}
          <div className="bg-gray-50/60 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search Input */}
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Search Candidate</label>
              <input
                type="text"
                placeholder="Name, email, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Project Filter */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Filter by Project</label>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="All">All Projects</option>
                {uniqueProjectTitles.map((title, idx) => (
                  <option key={idx} value={title}>{title}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Submitted">Submitted (Review pending)</option>
                <option value="Completed">Completed (Approved)</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Sort Candidates By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="match">Match Score (Highest first)</option>
                <option value="date">Application Date (Newest first)</option>
              </select>
            </div>

            {/* Blind Review Mode Toggle */}
            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="blindModeToggle"
                checked={isBlindMode}
                onChange={(e) => setIsBlindMode(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
              <label htmlFor="blindModeToggle" className="text-[9px] font-black text-gray-500 uppercase cursor-pointer select-none">
                🙈 Blind Review (Anonymize Names)
              </label>
            </div>
          </div>

          {/* Table / List layout */}
          {loading ? (
            <div className="text-center py-12 text-gray-500 font-medium animate-pulse flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>🔄 Loading candidates from the system registry...</span>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl text-gray-400 font-medium bg-gray-50/50">
              📭 No candidate applications match your current filter settings.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApps.map((app) => (
                <div
                  key={app.applicationId}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition duration-300 flex flex-col lg:flex-row justify-between gap-6"
                >
                  {/* Left block: student details & project */}
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase border border-indigo-100">
                        📁 {app.projectTitle}
                      </span>
                      {renderStepper(app.status)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 
                          onClick={() => {
                            if (!isBlindMode) navigate(`/student-profile/${app.studentEmail}`);
                          }}
                          className={`text-lg font-bold text-gray-900 dark:text-gray-200 ${isBlindMode ? "" : "hover:text-blue-600 cursor-pointer hover:underline"}`}
                        >
                          {isBlindMode ? `Developer #${app.applicationId.slice(-4).toUpperCase()}` : app.studentName}
                        </h4>
                        {!isBlindMode && (
                          <button
                            onClick={() => navigate(`/chat/${app.studentEmail}`)}
                            className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold border border-purple-200 dark:border-slate-800/50 px-2.5 py-0.5 rounded-full transition shadow-sm"
                          >
                            Chat
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-medium">
                        {isBlindMode ? "university-student@college.edu.in" : app.studentEmail}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Declared Skills</span>
                      <div className="flex flex-wrap gap-1">
                        {(app.skills || "").split(",").map(s => s.trim()).filter(Boolean).map((skill, idx) => (
                          <span key={idx} className="bg-gray-50 dark:bg-slate-900 text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded border border-gray-100 dark:border-slate-800">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {app.aiRationale && (
                      <div className="bg-purple-50/40 border border-purple-100 dark:border-slate-800/65 p-3 rounded-xl text-left max-w-lg mt-2">
                        <p className="text-[9px] font-extrabold text-purple-950 dark:text-purple-200 flex items-center gap-1 uppercase tracking-wider">
                          <span>🤖</span> AI Matching Insights
                        </p>
                        <p className="text-[10px] text-purple-700 font-semibold leading-relaxed mt-0.5">
                          {app.aiRationale}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Middle block: Matching Score Gauge */}
                  <div className="flex flex-row lg:flex-col justify-between lg:justify-center items-center gap-2 border-t lg:border-t-0 lg:border-l lg:border-r border-gray-100 dark:border-slate-800 pt-4 lg:pt-0 px-0 lg:px-8 min-w-[120px]">
                    <div className="text-left lg:text-center">
                      <span className="text-[9px] uppercase font-bold text-gray-400 block">Match Score</span>
                      <span className={`text-2xl font-black ${
                        app.matchScore >= 75 ? "text-green-600" :
                        app.matchScore >= 50 ? "text-amber-500" :
                        "text-gray-400"
                      }`}>
                        {app.matchScore}%
                      </span>
                    </div>
                    
                    <div className="w-16 bg-gray-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          app.matchScore >= 75 ? "bg-green-500" :
                          app.matchScore >= 50 ? "bg-amber-400" :
                          "bg-gray-300"
                        }`}
                        style={{ width: `${app.matchScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Right block: Action links & buttons */}
                  <div className="flex flex-col justify-between items-stretch lg:items-end gap-4 border-t lg:border-t-0 border-gray-100 dark:border-slate-800 pt-4 lg:pt-0 min-w-[200px]">
                    <div className="text-left lg:text-right space-y-1.5">
                      <p className="text-[10px] text-gray-400 font-bold">Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
                      {app.resumeUrl ? (
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 hover:underline"
                        >
                          📄 View Candidate Resume ↗
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No resume URL uploaded</span>
                      )}

                      {/* Social/Portfolio Links Grid */}
                      <div className="flex items-center lg:justify-end gap-3 mt-1.5 text-[10px]">
                        {app.githubUrl && (
                          <a href={app.githubUrl} target="_blank" rel="noreferrer" className="text-gray-600 hover:text-purple-600 font-semibold flex items-center gap-0.5" title="GitHub">
                            <span>💻</span> <span className="hover:underline">GitHub</span>
                          </a>
                        )}
                        {app.linkedinUrl && (
                          <a href={app.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-purple-600 font-semibold flex items-center gap-0.5" title="LinkedIn">
                            <span>👔</span> <span className="hover:underline">LinkedIn</span>
                          </a>
                        )}
                        {app.portfolioUrl && (
                          <a href={app.portfolioUrl} target="_blank" rel="noreferrer" className="text-green-600 hover:text-purple-600 font-semibold flex items-center gap-0.5" title="Portfolio">
                            <span>🌐</span> <span className="hover:underline">Portfolio</span>
                          </a>
                        )}
                      </div>
                    </div>
 
                    {/* Render pending extension requests if any */}
                    {app.extensionRequests && app.extensionRequests.length > 0 && app.extensionRequests[app.extensionRequests.length - 1].status === "Pending" && (
                      <div className="mt-3 bg-indigo-50 border border-indigo-100 p-3.5 rounded-2xl text-xs text-slate-800 space-y-2 animate-fade-in w-full text-left">
                        <div>
                          <span className="font-extrabold text-indigo-700 block mb-0.5">🕒 Extension Requested</span>
                          <p className="text-[11px] text-slate-600 leading-normal">
                            Wants <strong>{app.extensionRequests[app.extensionRequests.length - 1].requestedDays} more days</strong>. Reason: "{app.extensionRequests[app.extensionRequests.length - 1].reason}"
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReviewExtension(app.applicationId, app.extensionRequests[app.extensionRequests.length - 1]._id, "Rejected")}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[10px] font-bold rounded-lg transition"
                          >
                            Deny
                          </button>
                          <button
                            onClick={() => handleReviewExtension(app.applicationId, app.extensionRequests[app.extensionRequests.length - 1]._id, "Approved")}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition shadow-sm"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Button matrices based on application states */}
                    <div className="flex gap-2 mt-2 w-full">
                      {app.status === "Pending" && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(app.applicationId, "Rejected")}
                            className="flex-1 lg:flex-initial px-3.5 py-2 border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs rounded-xl transition"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(app.applicationId, "Approved")}
                            className="flex-1 lg:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
                          >
                            Accept
                          </button>
                        </>
                      )}

                      {app.status === "Approved" && (
                        <div className="w-full text-left">
                          <span className="text-xs font-bold text-blue-600/80 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 inline-block">
                            ✓ Approved (Awaiting Submission)
                          </span>
                          {app.extendedDeadline && (
                            <p className="text-[10px] text-indigo-600 mt-1 font-bold">
                              🗓️ Extended Deadline: {new Date(app.extendedDeadline).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}

                      {app.status === "Submitted" && (
                        <button
                          onClick={() => handleOpenReviewModal(app)}
                          className="w-full lg:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition shadow-sm"
                        >
                          🔍 Audit & Approve Work
                        </button>
                      )}

                      {app.status === "Flagged" && (
                        <button
                          onClick={() => handleOpenReviewModal(app)}
                          className="w-full lg:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-sm animate-pulse"
                        >
                          🚨 Plagiarism Alert ({app.plagiarismScore || 0}%)
                        </button>
                      )}

                      {app.status === "Completed" && (
                        <div className="text-left lg:text-right">
                          <span className="text-xs font-extrabold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 block mb-1">
                            ✓ Task Verified & Completed
                          </span>
                          {app.feedbackText && (
                            <p className="text-[10px] text-gray-400 italic max-w-[200px] truncate" title={app.feedbackText}>
                              "{app.feedbackText}"
                            </p>
                          )}
                        </div>
                      )}

                      {app.status === "Rejected" && (
                        <span className="text-xs font-bold text-red-600/80 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                          ✕ Rejected
                        </span>
                      )}

                      {app.status === "Revision Requested" && (
                        <span className="text-xs font-bold text-amber-600/80 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                          🔄 Revision Requested
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Audit Review Overlay Modal */}
      {showReviewModal && activeAppToReview && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl p-6 border animate-fade-in">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-200">Verify Student Solution: {activeAppToReview.studentName}</h3>
              <button onClick={() => { setShowReviewModal(false); setFeedbackText(""); setRating(0); setRatingReview(""); }} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
            </div>
            
            {/* Version History Selector */}
            {activeAppToReview.submissionVersions && activeAppToReview.submissionVersions.length > 1 && (
              <div className="mb-3 flex items-center justify-between bg-indigo-50/50 border border-indigo-100 p-2.5 rounded-xl text-xs">
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">Solution Iterations:</span>
                <select
                  value={selectedVerIdx}
                  onChange={(e) => setSelectedVerIdx(Number(e.target.value))}
                  className="bg-white dark:bg-slate-900 border text-xs px-2 py-1 rounded-lg outline-none font-bold cursor-pointer"
                >
                  {activeAppToReview.submissionVersions.map((v, i) => (
                    <option key={i} value={i}>
                      Version {i + 1} ({new Date(v.submittedAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Submission information summary */}
            {(() => {
              const hasVersions = activeAppToReview.submissionVersions && activeAppToReview.submissionVersions.length > 0;
              const currentVer = hasVersions && selectedVerIdx >= 0 && selectedVerIdx < activeAppToReview.submissionVersions.length
                ? activeAppToReview.submissionVersions[selectedVerIdx]
                : activeAppToReview;

              return (
                <div className="bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-4 rounded-xl mb-4 space-y-3 text-xs">
                  <p className="text-gray-700 dark:text-gray-200">
                    <strong className="text-gray-900 dark:text-gray-200">Project Gigs:</strong> {activeAppToReview.projectTitle}
                  </p>
                  <div className="flex justify-between items-center gap-2">
                    <p className="text-gray-700 dark:text-gray-200 truncate flex-1">
                      <strong className="text-gray-900 dark:text-gray-200">Submitted URL:</strong>{" "}
                      <a href={currentVer.submissionLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all font-bold">
                        {currentVer.submissionLink} ↗
                      </a>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const files = getMockCodeFiles(activeAppToReview.projectTitle);
                        setActiveFile(Object.keys(files)[0] || "App.js");
                        setShowSandbox(true);
                      }}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9px] font-bold transition shadow-sm shrink-0"
                    >
                      🖥️ Audit Code Sandbox
                    </button>
                  </div>
                  {currentVer.githubRepoUrl && (
                    <p className="text-gray-700 dark:text-gray-200">
                      <strong className="text-gray-900 dark:text-gray-200">GitHub Code Repo:</strong>{" "}
                      <a href={currentVer.githubRepoUrl} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline break-all font-bold">
                        {currentVer.githubRepoUrl} ↗
                      </a>
                    </p>
                  )}
                  {currentVer.liveDeploymentUrl && (
                    <p className="text-gray-700 dark:text-gray-200">
                      <strong className="text-gray-900 dark:text-gray-200">Live Preview URL:</strong>{" "}
                      <a href={currentVer.liveDeploymentUrl} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline break-all font-bold">
                        {currentVer.liveDeploymentUrl} ↗
                      </a>
                    </p>
                  )}
                  <p className="text-gray-700 dark:text-gray-200 leading-normal">
                    <strong className="text-gray-900 dark:text-gray-200">Solution Description:</strong> {currentVer.submissionText}
                  </p>

                  {/* Rubric display */}
                  {currentVer.selfAssessment && (
                    <div className="bg-white dark:bg-slate-900 border rounded-xl p-3 space-y-1.5">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Student Rubric Self-Ratings:</span>
                      <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                        <div className="bg-slate-50 p-1.5 rounded-lg">
                          <p className="text-slate-400 font-bold">Code Quality</p>
                          <p className="font-extrabold text-indigo-700 mt-0.5">{currentVer.selfAssessment.codeQuality || "N/A"}/10</p>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-lg">
                          <p className="text-slate-400 font-bold">Correctness</p>
                          <p className="font-extrabold text-indigo-700 mt-0.5">{currentVer.selfAssessment.correctness || "N/A"}/10</p>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-lg">
                          <p className="text-slate-400 font-bold">Docs</p>
                          <p className="font-extrabold text-indigo-700 mt-0.5">{currentVer.selfAssessment.documentation || "N/A"}/10</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Declaration summary */}
                  {currentVer.aiDeclaration && (
                    <div className={`p-2.5 rounded-xl border text-[11px] ${
                      currentVer.aiDeclaration.usedAi
                        ? "bg-amber-50 border-amber-100 text-amber-900"
                        : "bg-green-50/50 border-green-100 text-green-800"
                    }`}>
                      <p className="font-bold">
                        {currentVer.aiDeclaration.usedAi
                          ? `🤖 AI-Coauthored Solution: Estimated ${currentVer.aiDeclaration.aiPercentage}% generated using: ${currentVer.aiDeclaration.toolsUsed}`
                          : "✓ Pure Human Coauthored: Solution developed fully manually without AI assistant co-authors."}
                      </p>
                    </div>
                  )}

                  {/* Plagiarism Checker readout */}
                  {activeAppToReview.plagiarismScore > 0 && (
                    <div className={`p-2.5 rounded-xl border text-[11px] ${
                      activeAppToReview.plagiarismScore > 70
                        ? "bg-red-50 border-red-100 text-red-800 font-extrabold"
                        : "bg-slate-50 border-slate-200 dark:border-slate-800 text-slate-700"
                    }`}>
                      <p>
                        ⚠️ Code Similarity Audit: Match score {activeAppToReview.plagiarismScore}%.
                        {activeAppToReview.plagiarismScore > 70 && " WARNING: High match score indicates potential direct copy-pasting code submission plagiarism."}
                      </p>
                    </div>
                  )}

                  {/* Automated Linter readout */}
                  {activeAppToReview.lintWarnings && activeAppToReview.lintWarnings.length > 0 && (
                    <div className="bg-amber-50/50 border border-amber-150 text-amber-900 p-2.5 rounded-xl text-[11px] text-left">
                      <p className="font-extrabold mb-1">⚠️ Syntax Lint Advisories:</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {activeAppToReview.lintWarnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* AI Auditor Feedback readout */}
                  {activeAppToReview.matchScore !== null && activeAppToReview.matchScore !== undefined && (
                    <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl text-[11px] text-indigo-950 text-left">
                      <p className="font-extrabold">🤖 AI Code Auditor Report:</p>
                      <p className="mt-0.5">Grade: <strong>{activeAppToReview.matchScore}/100</strong>. Rationale: "{activeAppToReview.aiRationale || 'No description'}"</p>
                    </div>
                  )}

                  {/* Figma Live Embed preview */}
                  {currentVer.submissionLink && (currentVer.submissionLink.includes("figma.com") || currentVer.submissionLink.includes("figma.fun")) && (
                    <div className="border rounded-xl overflow-hidden mt-3 shadow-sm bg-white dark:bg-slate-900">
                      <p className="text-[9px] uppercase font-bold text-gray-400 bg-slate-100 px-3 py-1.5 border-b select-none">🎨 Figma Interactive Live Preview</p>
                      <iframe
                        src={`https://www.figma.com/embed?embed_host=workmitra&url=${encodeURIComponent(currentVer.submissionLink)}`}
                        width="100%"
                        height="260"
                        allowFullScreen
                        className="bg-slate-50 border-0"
                      />
                    </div>
                  )}

                  <p className="text-gray-400 text-[10px] pt-1">
                    Submitted on: {new Date(currentVer.submittedAt || activeAppToReview.submittedAt).toLocaleString()}
                  </p>
                </div>
              );
            })()}

            <form onSubmit={handleCompleteReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Verify Feedback & Payout Review Notes</label>
                <textarea
                  placeholder="Provide constructive feedback on code structure, features completed, and mark this task verified..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  required
                />
              </div>

              {/* Public Star Rating and Review */}
              <div className="border-t pt-3 space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-purple-950 dark:text-purple-200 uppercase tracking-wider mb-1">Candidate Rating</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl transition-all outline-none ${star <= rating ? "text-amber-400 scale-105" : "text-gray-200"}`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-[10px] text-gray-400 font-extrabold ml-2">({rating} / 5 stars)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-purple-950 dark:text-purple-200 uppercase tracking-wider mb-1">Performance Review Notes</label>
                  <textarea
                    placeholder="Provide a public rating review statement for the candidate (e.g. Excellent delivery timeline, proactive communication)..."
                    value={ratingReview}
                    onChange={(e) => setRatingReview(e.target.value)}
                    rows={2}
                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs px-3.5 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center w-full pt-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRequestRevision}
                    disabled={submittingReview}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50"
                  >
                    Request Revision
                  </button>
                  <button
                    type="button"
                    onClick={handleDisputeApplication}
                    disabled={submittingReview}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50"
                  >
                    Flag Dispute
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowReviewModal(false); setFeedbackText(""); setRating(0); setRatingReview(""); }}
                    className="px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 dark:bg-slate-900 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                  >
                    {submittingReview ? "Processing..." : "Verify & Complete Solution"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 💻 Code Sandbox Drawer Overlay */}
      {showSandbox && activeAppToReview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-end p-0 animate-fade-in select-none">
          <div className="bg-slate-955 text-slate-100 w-full max-w-4xl h-full flex flex-col shadow-2xl border-l border-slate-800">
            
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase text-indigo-400">Interactive Solution Sandbox</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Auditing: {activeAppToReview.projectTitle} (by {activeAppToReview.studentName})</p>
              </div>
              <button 
                onClick={() => setShowSandbox(false)}
                className="text-slate-400 hover:text-white font-extrabold text-sm transition"
              >
                Close Sandbox ✕
              </button>
            </div>

            {/* Split Panel: Sidebar (left) and Editor + Checklist (right) */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* File tree sidebar explorer */}
              <div className="w-56 bg-slate-900/50 border-r border-slate-800 p-4 space-y-4 overflow-y-auto">
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Workspace Files</span>
                  <div className="space-y-1.5 text-xs">
                    {Object.keys(getMockCodeFiles(activeAppToReview.projectTitle)).map(filename => (
                      <button
                        key={filename}
                        onClick={() => setActiveFile(filename)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition ${
                          activeFile === filename 
                            ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30" 
                            : "text-slate-400 hover:text-slate-200 border border-transparent"
                        }`}
                      >
                        <span>📄</span>
                        <span className="truncate">{filename}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Checklist Audit</span>
                  <div className="space-y-2 text-[10px] text-slate-400 font-semibold">
                    <p className="flex items-center gap-1.5 text-emerald-500 font-bold">✓ Security: Clean</p>
                    <p className="flex items-center gap-1.5 text-emerald-500 font-bold">✓ Lint: Standard OK</p>
                    <p className="flex items-center gap-1.5 text-emerald-500 font-bold">✓ Dependencies: Verified</p>
                  </div>
                </div>
              </div>

              {/* Editor panel */}
              <div className="flex-1 flex flex-col bg-slate-950 font-mono text-xs select-text">
                
                {/* File title tab */}
                <div className="bg-slate-900/30 border-b border-slate-800/60 px-4 py-2 text-[11px] text-indigo-400 font-bold">
                  Tab: {activeFile}
                </div>

                {/* Raw Code output area */}
                <pre className="flex-1 p-6 overflow-y-auto leading-relaxed text-slate-300 bg-slate-950/50 whitespace-pre-wrap">
                  <code>
                    {getMockCodeFiles(activeAppToReview.projectTitle)[activeFile] || "// File not found."}
                  </code>
                </pre>
              </div>

            </div>

            {/* Footer containing quick actions */}
            <div className="bg-slate-900 border-t border-slate-800 px-6 py-4 flex justify-between items-center gap-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Simulation Escrow Active (🔒 Locked)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowSandbox(false);
                    // Open dispute form notes
                    setFeedbackText("Flagged in Sandbox audit: Code review failed due to ");
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow"
                >
                  Flag / Dispute
                </button>
                <button
                  onClick={() => {
                    setShowSandbox(false);
                    setFeedbackText("Sandbox code verification check: Passed. All checks completed.");
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow"
                >
                  Approve Solution
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
