import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function ApplicantsHub() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [sortBy, setSortBy] = useState("match"); // 'match' or 'date'

  // Task Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeAppToReview, setActiveAppToReview] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

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
      const res = await fetch(`${API_BASE_URL}/api/applications/company/${companyEmail}`);
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
    try {
      const res = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Candidate application status updated to ${status}!`);
        if (currentUser) fetchCompanyApplications(currentUser.email);
      } else {
        alert(data.error || "Failed to update status.");
      }
    } catch (err) {
      alert("Error sending status payload.");
    }
  };

  const handleOpenReviewModal = (app) => {
    setActiveAppToReview(app);
    setFeedbackText(app.feedbackText || "");
    setShowReviewModal(true);
  };

  const handleCompleteReview = async (e) => {
    e.preventDefault();
    if (!activeAppToReview) return;
    setSubmittingReview(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/applications/${activeAppToReview.applicationId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackText })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Task approved and marked as Completed!");
        setShowReviewModal(false);
        if (currentUser) fetchCompanyApplications(currentUser.email);
      } else {
        alert(data.error || "Failed to submit review.");
      }
    } catch (err) {
      alert("Error submitting task completion.");
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
        app.studentName.toLowerCase().includes(query) ||
        app.studentEmail.toLowerCase().includes(query) ||
        app.skills.toLowerCase().includes(query);

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
        return new Date(b.appliedAt) - new Date(a.appliedAt);
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/logo.png" alt="workMitra Logo" className="h-10 object-contain cursor-pointer" onClick={() => navigate("/company-dashboard")} />
            </div>
            <div className="flex space-x-4">
              <button className="text-gray-700 hover:text-blue-600 font-medium" onClick={() => navigate("/company-dashboard")}>Dashboard</button>
              <button className="text-gray-700 hover:text-blue-600 font-medium" onClick={() => navigate("/company-preferences")}>Profile</button>
              <button className="text-gray-700 hover:text-blue-600 font-medium" onClick={() => { localStorage.clear(); navigate("/login"); }}>Logout</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="border-b pb-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                <span>👨‍🎓 Applicants Command Center</span>
              </h1>
              <p className="text-gray-500 mt-1 text-sm">Audit candidate applications, inspect matching scores, review task submissions, and approve talent nodes.</p>
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

          {/* Search and Filters panel */}
          <div className="bg-gray-50/60 border border-gray-100 p-5 rounded-2xl mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Search Candidate</label>
              <input
                type="text"
                placeholder="Name, email, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Project Filter */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Filter by Project</label>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="w-full bg-white border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                className="w-full bg-white border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                className="w-full bg-white border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="match">Match Score (Highest first)</option>
                <option value="date">Application Date (Newest first)</option>
              </select>
            </div>
          </div>

          {/* Table / List layout */}
          {loading ? (
            <div className="text-center py-12 text-gray-500 font-medium animate-pulse flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>🔄 Loading candidates from the system registry...</span>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-medium bg-gray-50/50">
              📭 No candidate applications match your current filter settings.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApps.map((app) => (
                <div
                  key={app.applicationId}
                  className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition duration-300 flex flex-col lg:flex-row justify-between gap-6"
                >
                  {/* Left block: student details & project */}
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase border border-indigo-100">
                        📁 {app.projectTitle}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                        app.status === "Completed" ? "bg-green-150 text-green-800" :
                        app.status === "Submitted" ? "bg-amber-100 text-amber-800" :
                        app.status === "Approved" ? "bg-blue-100 text-blue-800" :
                        app.status === "Rejected" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {app.status === "Submitted" ? "Review Pending" : app.status}
                      </span>
                    </div>

                    <div>
                      <h4 
                        onClick={() => navigate(`/student-profile/${app.studentEmail}`)}
                        className="text-lg font-bold text-gray-900 hover:text-blue-600 cursor-pointer hover:underline"
                      >
                        {app.studentName}
                      </h4>
                      <p className="text-xs text-gray-400 font-medium">{app.studentEmail}</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Declared Skills</span>
                      <div className="flex flex-wrap gap-1">
                        {app.skills.split(",").map((skill, idx) => (
                          <span key={idx} className="bg-gray-50 text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded border border-gray-100">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Middle block: Matching Score Gauge */}
                  <div className="flex flex-row lg:flex-col justify-between lg:justify-center items-center gap-2 border-t lg:border-t-0 lg:border-l lg:border-r border-gray-100 pt-4 lg:pt-0 px-0 lg:px-8 min-w-[120px]">
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
                    
                    <div className="w-16 bg-gray-100 h-1.5 rounded-full overflow-hidden">
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
                  <div className="flex flex-col justify-between items-stretch lg:items-end gap-4 border-t lg:border-t-0 border-gray-100 pt-4 lg:pt-0 min-w-[200px]">
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
                    </div>

                    {/* Button matrices based on application states */}
                    <div className="flex gap-2">
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
                        <span className="text-xs font-bold text-blue-600/80 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                          ✓ Approved (Awaiting Submission)
                        </span>
                      )}

                      {app.status === "Submitted" && (
                        <button
                          onClick={() => handleOpenReviewModal(app)}
                          className="w-full lg:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition shadow-sm"
                        >
                          🔍 Audit & Approve Work
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
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 border animate-fade-in">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-bold text-base text-gray-900">Verify Student Solution: {activeAppToReview.studentName}</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
            </div>
            
            {/* Submission information summary */}
            <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl mb-4 space-y-2 text-xs">
              <p className="text-gray-700">
                <strong className="text-gray-900">Project Gigs:</strong> {activeAppToReview.projectTitle}
              </p>
              <p className="text-gray-700">
                <strong className="text-gray-900">Submitted URL:</strong>{" "}
                <a href={activeAppToReview.submissionLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all font-bold">
                  {activeAppToReview.submissionLink} ↗
                </a>
              </p>
              <p className="text-gray-700">
                <strong className="text-gray-900">Solution Description:</strong> {activeAppToReview.submissionText}
              </p>
              <p className="text-gray-400 text-[10px]">
                Submitted on: {new Date(activeAppToReview.submittedAt).toLocaleString()}
              </p>
            </div>

            <form onSubmit={handleCompleteReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Verify Feedback & Payout Review Notes</label>
                <textarea
                  placeholder="Provide constructive feedback on code structure, features completed, and mark this task verified..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition"
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
