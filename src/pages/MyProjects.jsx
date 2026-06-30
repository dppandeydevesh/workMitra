import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { useToast } from "../components/Toast";

export default function MyProjects() {
  const navigate = useNavigate();
  const toast = useToast();


  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeAppToReview, setActiveAppToReview] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState(5);
  const [ratingReview, setRatingReview] = useState("");

  // Edit Project States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const companyEmail = savedUser.email;

    if (!companyEmail) {
      setErrorMessage("Corporate user session context missing.");
      setLoadingProjects(false);
      return;
    }

    const fetchCompanyData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/projects/company/${companyEmail}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) setProjects(data);
      } catch (err) {
        setErrorMessage("Failed to synchronize projects dashboard registry.");
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchCompanyData();
  }, []);

  const handleInspectApplicants = async (project) => {
    setSelectedProject(project);
    setLoadingApplicants(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/projects/${project._id}/applicants`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setApplicants(data);
    } catch (err) {
      toast.error("Error building analytics pipeline array maps.");
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleAcceptApplicant = async (applicationId) => {
    if (!window.confirm("Are you sure you want to approve this application?")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/status`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: "Approved" })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Candidate accepted successfully!");
        if (selectedProject) {
          handleInspectApplicants(selectedProject);
        }
      } else {
        toast.error(data.error || "Failed to accept candidate.");
      }
    } catch (err) {
      toast.error("Error sending status payload.");
    }
  };

  const handleRejectApplicant = async (applicationId) => {
    if (!window.confirm("Are you sure you want to reject this application?")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/status`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: "Rejected" })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Candidate rejected successfully.");
        if (selectedProject) {
          handleInspectApplicants(selectedProject);
        }
      } else {
        toast.error(data.error || "Failed to reject candidate.");
      }
    } catch (err) {
      toast.error("Error sending status payload.");
    }
  };

  const handleOpenReviewModal = (app) => {
    setActiveAppToReview(app);
    setFeedbackText(app.feedbackText || "");
    setRating(app.rating || 5);
    setRatingReview(app.ratingReview || "");
    setShowReviewModal(true);
  };

  const handleCompleteTask = async (e) => {
    e.preventDefault();
    if (!activeAppToReview) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/applications/${activeAppToReview.applicationId}/complete`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ feedbackText, rating, ratingReview })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Task approved and marked as Completed!");
        setShowReviewModal(false);
        setFeedbackText("");
        if (selectedProject) {
          handleInspectApplicants(selectedProject);
        }
      } else {
        toast.error(data.error || "Failed to complete task.");
      }
    } catch (err) {
      toast.error("Error sending completion payload.");
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you absolutely sure you want to delete this project? This will permanently delete all applicant submissions and cannot be undone.")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success("Project stack deleted successfully.");
        setSelectedProject(null);
        // Refresh project list
        const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (savedUser.email) {
          const res = await fetch(`${API_BASE_URL}/api/projects/company/${savedUser.email}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) setProjects(data);
        }
      } else {
        toast.error("Failed to delete project stack.");
      }
    } catch (err) {
      toast.error("Error sending delete payload.");
    }
  };

  const handleOpenEditModal = (proj) => {
    setEditTitle(proj.title);
    setEditDescription(proj.description);
    setEditSkills(proj.requiredSkills?.join(", ") || "");
    setEditBudget(proj.budget);
    setEditDuration(proj.duration);
    setEditDeadline(proj.deadline);
    setShowEditModal(true);
  };

  const handleSaveEditProject = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    setSubmittingEdit(true);

    const payload = {
      title: editTitle,
      description: editDescription,
      requiredSkills: editSkills.split(",").map(s => s.trim()).filter(Boolean),
      budget: Number(editBudget),
      duration: editDuration,
      deadline: editDeadline
    };

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/projects/${selectedProject._id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Project updated successfully!");
        setSelectedProject(data);
        setShowEditModal(false);
        // Refresh project list
        const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (savedUser.email) {
          const res = await fetch(`${API_BASE_URL}/api/projects/company/${savedUser.email}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const projectsData = await res.json();
          if (res.ok) setProjects(projectsData);
        }
      } else {
        toast.error("Failed to update project.");
      }
    } catch (err) {
      toast.error("Error saving project details.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 font-sans select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation back home Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Project Analysis Hub</h1>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Audit historical requirements and evaluate student application match rates.</p>
          </div>
          <button onClick={() => navigate("/company-dashboard")} className="w-full sm:w-auto text-center text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition shadow-sm">
            ← Command Center
          </button>
        </div>

        {errorMessage && <div className="p-4 mb-6 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100">⚠️ {errorMessage}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Historical Deployments List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 px-1">Active Deployments</h3>
            
            {loadingProjects ? (
              <div className="text-center py-6 text-xs text-gray-500 font-medium animate-pulse">Syncing nodes...</div>
            ) : projects.length === 0 ? (
              <div className="bg-white p-6 rounded-xl text-center text-xs text-gray-400 border font-medium">No live projects found.</div>
            ) : (
              projects.map((proj) => (
                <div 
                  key={proj._id} 
                  onClick={() => handleInspectApplicants(proj)}
                  className={`p-5 rounded-xl border bg-white shadow-sm cursor-pointer transition transform hover:-translate-y-0.5 ${selectedProject?._id === proj._id ? "ring-2 ring-blue-500 border-transparent" : "hover:border-blue-300"}`}
                >
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{proj.title}</h4>
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mb-3">{proj.description}</p>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wide border-t pt-2.5">
                    <span>💼 {proj.workType}</span>
                    <span className="text-blue-600">Inspect Applications →</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Column: Applicants Table and Match Analytics Display */}
          <div className="lg:col-span-2">
            {!selectedProject ? (
              <div className="bg-white rounded-2xl border-2 border-dashed p-12 text-center text-gray-400 font-medium h-full flex flex-col justify-center items-center">
                <span>📁 Select a deployed project card on the left grid panel to unpack live applicant metrics.</span>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="border-b pb-4 mb-6">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">Selected Stream</span>
                      <h2 className="text-xl font-bold text-gray-900 mt-2">{selectedProject.title}</h2>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOpenEditModal(selectedProject)}
                        className="px-2.5 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        title="Edit Project Details"
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteProject(selectedProject._id)}
                        className="px-2.5 py-1.5 border border-red-100 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        title="Delete Project Stack"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">Duration: {selectedProject.duration} | Budget: ₹{selectedProject.budget.toLocaleString()}</p>
                </div>

                {loadingApplicants ? (
                  <div className="text-center py-12 text-xs text-gray-500 font-medium animate-pulse">Parsing applicant capability indices...</div>
                ) : applicants.length === 0 ? (
                  <div className="text-center py-12 text-xs text-gray-400 font-medium">No students have applied to this project stack yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-600">
                      <thead>
                        <tr className="bg-gray-50 uppercase text-[10px] font-bold text-gray-400 border-b tracking-wider">
                          <th className="p-3">Student Name</th>
                          <th className="p-3">Skills Inventory</th>
                          <th className="p-3 text-center">Smart Match</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                        {applicants.map((app) => (
                          <tr key={app.applicationId} className="hover:bg-gray-50/80 transition">
                            <td className="p-3">
                              <p className="font-bold text-gray-900">{app.studentName}</p>
                              <p className="text-[10px] text-gray-400">{app.studentEmail}</p>
                              {app.resumeUrl ? (
                                <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 font-bold hover:underline block mt-0.5">
                                  📄 View Resume ↗
                                </a>
                              ) : (
                                <span className="text-[9px] text-gray-400 italic block mt-0.5">No resume provided</span>
                              )}

                              {/* Social/Portfolio Links Grid */}
                              <div className="flex items-center gap-2 mt-1 text-[9px]">
                                {app.githubUrl && (
                                  <a href={app.githubUrl} target="_blank" rel="noreferrer" className="text-gray-600 hover:text-purple-600 font-bold" title="GitHub">
                                    <span>💻 GitHub</span>
                                  </a>
                                )}
                                {app.linkedinUrl && (
                                  <a href={app.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-purple-600 font-bold" title="LinkedIn">
                                    <span>👔 LinkedIn</span>
                                  </a>
                                )}
                                {app.portfolioUrl && (
                                  <a href={app.portfolioUrl} target="_blank" rel="noreferrer" className="text-green-600 hover:text-purple-600 font-bold" title="Portfolio">
                                    <span>🌐 Web</span>
                                  </a>
                                )}
                              </div>

                              {app.aiRationale && (
                                <p className="text-[9px] text-purple-600 font-semibold leading-normal max-w-[150px] truncate mt-1" title={app.aiRationale}>
                                  🤖 {app.aiRationale}
                                </p>
                              )}
                            </td>
                            <td className="p-3 max-w-[180px] truncate">{app.skills}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${app.matchScore >= 75 ? "bg-green-100 text-green-800" : app.matchScore >= 40 ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600"}`}>
                                {app.matchScore}%
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                app.status === "Completed" ? "bg-green-100 text-green-800" :
                                app.status === "Submitted" ? "bg-amber-100 text-amber-800" :
                                app.status === "Approved" ? "bg-blue-100 text-blue-800" :
                                app.status === "Rejected" ? "bg-red-100 text-red-800" :
                                "bg-gray-100 text-gray-600"
                              }`}>
                                {app.status}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              {app.status === "Pending" && (
                                <>
                                  <button onClick={() => handleAcceptApplicant(app.applicationId)} className="text-[10px] font-bold bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition shadow-sm">
                                    Accept
                                  </button>
                                  <button onClick={() => handleRejectApplicant(app.applicationId)} className="text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition shadow-sm">
                                    Reject
                                  </button>
                                </>
                              )}
                              {app.status === "Approved" && (
                                <span className="text-[11px] text-blue-600 font-semibold">Working</span>
                              )}
                              {app.status === "Submitted" && (
                                <button onClick={() => handleOpenReviewModal(app)} className="text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded transition shadow-sm">
                                  Review Work
                                </button>
                              )}
                              {app.status === "Completed" && (
                                <span className="text-[11px] text-green-600 font-bold block">✓ Approved</span>
                              )}
                              {app.status === "Rejected" && (
                                <span className="text-[11px] text-red-600 font-medium">Rejected</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 🔍 WORK SUBMISSION REVIEW OVERLAY MODAL                                   */}
          {/* ========================================================================= */}
          {showReviewModal && activeAppToReview && (
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border animate-fade-in text-left">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                  <h3 className="font-bold text-base text-gray-900">Review Work Submission</h3>
                  <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400">Candidate</p>
                    <p className="text-xs font-bold text-gray-900">{activeAppToReview.studentName} ({activeAppToReview.studentEmail})</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400">Submission Link</p>
                    <a href={activeAppToReview.submissionLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-bold hover:underline break-all">
                      {activeAppToReview.submissionLink} ↗
                    </a>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400">Student Explanation Notes</p>
                    <p className="text-xs text-gray-700 bg-gray-50 border p-3 rounded-xl whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto">
                      {activeAppToReview.submissionText}
                    </p>
                  </div>
                  <form onSubmit={handleCompleteTask} className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Company Feedback / Review Notes</label>
                      <textarea
                        placeholder="Write feedback for the student (e.g. Excellent job, clean code, etc.). This will show on their profile."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        rows={2}
                        className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                        required
                      />
                    </div>

                    {/* Public Star Rating and Review */}
                    <div className="border-t pt-2 space-y-2">
                      <div>
                        <label className="block text-[9px] font-extrabold text-purple-950 uppercase tracking-wider mb-0.5">Candidate Rating</label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className={`text-xl transition-all outline-none ${star <= rating ? "text-amber-400 scale-105" : "text-gray-200"}`}
                            >
                              ★
                            </button>
                          ))}
                          <span className="text-[9px] text-gray-400 font-extrabold ml-1.5">({rating} / 5)</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-extrabold text-purple-950 uppercase tracking-wider mb-0.5">Performance Review Notes</label>
                        <textarea
                          placeholder="Provide a public rating review statement for the candidate..."
                          value={ratingReview}
                          onChange={(e) => setRatingReview(e.target.value)}
                          rows={1}
                          className="w-full bg-gray-50 border border-gray-200 text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                        />
                      </div>
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
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                      >
                        Approve & Complete
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
          {/* ========================================================================= */}

          {/* ========================================================================= */}
          {/* ✏️ PROJECT EDIT OVERLAY MODAL                                            */}
          {/* ========================================================================= */}
          {showEditModal && selectedProject && (
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 border animate-fade-in text-left">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                  <h3 className="font-bold text-base text-gray-900 font-sans">Edit Project Stack details</h3>
                  <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
                </div>
                <form onSubmit={handleSaveEditProject} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Project Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Description</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Budget Payout (₹)</label>
                      <input
                        type="number"
                        value={editBudget}
                        onChange={(e) => setEditBudget(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Duration</label>
                      <input
                        type="text"
                        value={editDuration}
                        onChange={(e) => setEditDuration(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Deadline Date</label>
                      <input
                        type="text"
                        value={editDeadline}
                        onChange={(e) => setEditDeadline(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Required Skills (Comma separated)</label>
                      <input
                        type="text"
                        value={editSkills}
                        onChange={(e) => setEditSkills(e.target.value)}
                        placeholder="React, Python, Figma"
                        className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingEdit}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                    >
                      {submittingEdit ? "Saving..." : "Save Changes"}
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