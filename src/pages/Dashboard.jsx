import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { useToast } from "../components/Toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();

  const alert = (msg) => {
    if (msg.toLowerCase().includes("success") || msg.toLowerCase().includes("completed") || msg.toLowerCase().includes("approved") || msg.toLowerCase().includes("extracted")) {
      toast.success(msg);
    } else if (msg.toLowerCase().includes("fail") || msg.toLowerCase().includes("error") || msg.toLowerCase().includes("invalid")) {
      toast.error(msg);
    } else {
      toast.info(msg);
    }
  };

  const renderStepper = (status) => {
    const steps = [
      { label: "Applied", statusVal: "Pending" },
      { label: "Approved", statusVal: "Approved" },
      { label: "Submitted", statusVal: "Submitted" },
      { label: "Completed", statusVal: "Completed" }
    ];

    if (status === "Rejected") {
      return (
        <span className="bg-red-100 text-red-800 text-[9px] font-bold px-2 py-0.5 rounded border border-red-200">
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
              <span className={`px-1.5 py-0.5 rounded font-extrabold transition-all uppercase ${
                isActive ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm" :
                isCompleted ? "bg-purple-100 text-purple-700 font-semibold" :
                "bg-gray-100 text-gray-400 font-normal"
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
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [liveDeploymentUrl, setLiveDeploymentUrl] = useState("");

  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [cvReport, setCvReport] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [updatingResume, setUpdatingResume] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [skillFilter, setSkillFilter] = useState("All");
  const [workTypeFilter, setWorkTypeFilter] = useState("All");
  const [maxBudgetFilter, setMaxBudgetFilter] = useState(10000);
  const [sortBy, setSortBy] = useState("latest");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkingOutPass, setCheckingOutPass] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);

  // 📥 Phase 12 States & Auto-Save
  const [codeQualityRubric, setCodeQualityRubric] = useState(5);
  const [correctnessRubric, setCorrectnessRubric] = useState(5);
  const [documentationRubric, setDocumentationRubric] = useState(5);
  const [usedAi, setUsedAi] = useState(false);
  const [aiPercentage, setAiPercentage] = useState(0);
  const [aiToolsUsed, setAiToolsUsed] = useState("");

  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [activeAppToExtend, setActiveAppToExtend] = useState(null);
  const [extensionDays, setExtensionDays] = useState(3);
  const [extensionReason, setExtensionReason] = useState("");
  const [requestingExtension, setRequestingExtension] = useState(false);

  useEffect(() => {
    if (activeAppToSubmit) {
      const draft = JSON.parse(localStorage.getItem(`workmitra_draft_${activeAppToSubmit._id}`) || "{}");
      setSubmissionLink(draft.submissionLink || "");
      setSubmissionText(draft.submissionText || "");
      setGithubRepoUrl(draft.githubRepoUrl || "");
      setLiveDeploymentUrl(draft.liveDeploymentUrl || "");
      setCodeQualityRubric(draft.codeQualityRubric || 5);
      setCorrectnessRubric(draft.correctnessRubric || 5);
      setDocumentationRubric(draft.documentationRubric || 5);
      setUsedAi(draft.usedAi || false);
      setAiPercentage(draft.aiPercentage || 0);
      setAiToolsUsed(draft.aiToolsUsed || "");
    }
  }, [activeAppToSubmit]);

  const saveDraft = (updatedFields) => {
    if (!activeAppToSubmit) return;
    const currentDraft = JSON.parse(localStorage.getItem(`workmitra_draft_${activeAppToSubmit._id}`) || "{}");
    const newDraft = {
      submissionLink,
      submissionText,
      githubRepoUrl,
      liveDeploymentUrl,
      codeQualityRubric,
      correctnessRubric,
      documentationRubric,
      usedAi,
      aiPercentage,
      aiToolsUsed,
      ...updatedFields
    };
    localStorage.setItem(`workmitra_draft_${activeAppToSubmit._id}`, JSON.stringify(newDraft));
  };

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
        if (userObj) {
          const token = localStorage.getItem("token");
          const userRes = await fetch(`${API_BASE_URL}/api/auth/user/${userObj.email}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (userRes.ok) {
            const latestUser = await userRes.json();
            setCurrentUser(latestUser);
            localStorage.setItem("user", JSON.stringify(latestUser));
          }
        }

        // 🚀 UPDATED: Fetching from our fresh global project collection route
        const token = localStorage.getItem("token");
        const isStudent = userObj && userObj.userRole === "student";
        const projectsUrl = isStudent 
          ? `${API_BASE_URL}/api/projects/recommended` 
          : `${API_BASE_URL}/api/projects/all`;

        const projectsRes = await fetch(projectsUrl, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const projectsData = await projectsRes.json();
        
        if (projectsRes.ok) {
          if (isStudent) {
            const unpacked = projectsData.map(item => ({
              ...item.project,
              aiRecommendationScore: item.score
            }));
            setProjects(unpacked);
          } else {
            setProjects(projectsData);
          }
        } else {
          setErrorMessage(projectsData.error || "Failed to load deployed projects.");
        }

        // If logged-in user is a student, fetch their tracking list of existing applications
        if (userObj && userObj.userRole !== "company") {
          const appsRes = await fetch(`${API_BASE_URL}/api/applications/student/${userObj.email}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
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

  const handleUploadCVFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Only PDF formats are supported for automatic CV text extraction.");
      return;
    }

    setUploadingCV(true);
    const formData = new FormData();
    formData.append("cvFile", file);
    formData.append("email", currentUser.email);

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/upload-cv`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setResumeText(data.resumeText);
        alert("CV PDF uploaded and text extracted successfully! You can now review the extracted details or click 'Review CV' to run the AI critique.");
        
        const updatedUser = {
          ...currentUser,
          resumeText: data.resumeText
        };
        setCurrentUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } else {
        alert(data.error || "Failed to upload and parse CV PDF.");
      }
    } catch (err) {
      alert("Error communicating with server upload gateway.");
    } finally {
      setUploadingCV(false);
    }
  };

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
      const token = localStorage.getItem("token");
      const detailsRes = await fetch(`${API_BASE_URL}/api/applications/student-details/${userEmail}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
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
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/applications/${activeAppToSubmit._id}/submit`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          submissionLink,
          submissionText,
          githubRepoUrl,
          liveDeploymentUrl,
          aiDeclaration: {
            usedAi,
            aiPercentage,
            toolsUsed: aiToolsUsed
          },
          selfAssessment: {
            codeQuality: codeQualityRubric,
            correctness: correctnessRubric,
            documentation: documentationRubric
          }
        })
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Work submitted successfully!");
        localStorage.removeItem(`workmitra_draft_${activeAppToSubmit._id}`);
        setShowSubmitModal(false);
        setSubmissionLink("");
        setGithubRepoUrl("");
        setLiveDeploymentUrl("");
        setSubmissionText("");
        setUsedAi(false);
        setAiPercentage(0);
        setAiToolsUsed("");
        setCodeQualityRubric(5);
        setCorrectnessRubric(5);
        setDocumentationRubric(5);
        if (currentUser) {
          fetchApplications(currentUser.email);
        }
      } else {
        toast.error(data.error || "Submission failed.");
      }
    } catch (err) {
      toast.error("Error sending submission payload.");
    }
  };

  const handleRequestExtensionSubmit = async (e) => {
    e.preventDefault();
    if (!activeAppToExtend) return;

    setRequestingExtension(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/applications/${activeAppToExtend._id}/request-extension`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ requestedDays: Number(extensionDays), reason: extensionReason })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Deadline extension requested successfully!");
        setShowExtensionModal(false);
        setExtensionReason("");
        if (currentUser) {
          fetchApplications(currentUser.email);
        }
      } else {
        toast.error(data.error || "Failed to submit extension request.");
      }
    } catch (err) {
      toast.error("Network error requesting extension.");
    } finally {
      setRequestingExtension(false);
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
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/applications/apply`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
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
    
    const budgetVal = project.budget || 0;
    const matchesBudget = maxBudgetFilter >= 10000 || budgetVal <= maxBudgetFilter;
    
    return matchesSearch && matchesSkill && matchesWorkType && matchesBudget;
  }).sort((a, b) => {
    if (sortBy === "budgetHigh") return (b.budget || 0) - (a.budget || 0);
    if (sortBy === "budgetLow") return (a.budget || 0) - (b.budget || 0);
    if (sortBy === "latest") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    return 0;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-6 mb-6 gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2 flex items-center flex-wrap gap-2">
                Welcome, {currentUser?.fullName || "Student"}!
                {currentUser?.isEndorsed && (
                  <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-full select-none">
                    Faculty Endorsed 🎓
                  </span>
                )}
              </h1>
              {currentUser?.collegeName && (
                <p className="text-sm font-semibold text-indigo-600">
                  🎓 Verified Student of {currentUser.collegeName} (ID: {currentUser.enrollmentNumber})
                </p>
              )}
            </div>

            {/* Membership Pass Panel Card */}
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
              <span className="text-2xl">🎟️</span>
              <div>
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider block">Membership Pass Status</span>
                {localStorage.getItem("hasPaidPass") === "true" ? (
                  <span className="text-xs font-bold text-emerald-600 block mt-0.5">✓ Premium Activated (₹39/mo)</span>
                ) : (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-red-500">Free Trial Active</span>
                    <button
                      onClick={() => {
                        setCheckoutStep(1);
                        setShowCheckoutModal(true);
                      }}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-bold transition shadow-sm"
                    >
                      Upgrade Plan
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="text-gray-600">You have successfully logged in to workMitra portal.</p>
          
          {/* Old Feature Cards (Interactive) */}
          <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            <button 
              onClick={() => scrollToSection("gigs-section")}
              className="group text-left bg-blue-50 p-4 sm:p-6 rounded-xl hover:bg-blue-100/70 hover:-translate-y-0.5 transition-all duration-200 shadow-sm border border-blue-100/30"
            >
              <h3 className="font-bold text-lg text-blue-950 mb-2 group-hover:text-blue-700">My Gigs</h3>
              <p className="text-gray-600 text-xs">Manage and view your applied gigs</p>
            </button>
            <button 
              onClick={() => scrollToSection("projects-section")}
              className="group text-left bg-green-50 p-4 sm:p-6 rounded-xl hover:bg-green-100/70 hover:-translate-y-0.5 transition-all duration-200 shadow-sm border border-green-100/30"
            >
              <h3 className="font-bold text-lg text-green-950 mb-2 group-hover:text-green-700">Orders</h3>
              <p className="text-gray-600 text-xs">Explore new projects in the marketplace</p>
            </button>
            <button 
              onClick={() => navigate("/chat")}
              className="group text-left bg-purple-50 p-4 sm:p-6 rounded-xl hover:bg-purple-100/70 hover:-translate-y-0.5 transition-all duration-200 shadow-sm border border-purple-100/30"
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
              <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-2">My Gigs & Applications</h2>
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
                            {renderStepper(app.status)}
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 mb-1">{project.title}</h4>
                          <p className="text-xs text-gray-400 mb-2">Company: {project.companyId ? project.companyId.split("@")[0].toUpperCase() : "COMPANY"}</p>
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-4">{project.description}</p>
                        </div>
                        
                        {app.status === "Revision Requested" && app.feedbackText && (
                          <div className="text-[10px] text-amber-600 mt-2 font-medium bg-amber-50 border border-amber-100 p-2 rounded-xl text-left">
                            <strong>Revision Requested:</strong> "{app.feedbackText}"
                          </div>
                        )}

                        <div className="border-t pt-3 mt-2 flex flex-col gap-3">
                          <div className="flex justify-between items-center text-[10px]">
                            <div>
                              <p className="text-[9px] uppercase font-bold text-gray-400">Budget</p>
                              <p className="font-bold text-green-600 text-xs">₹{project.budget.toLocaleString()}</p>
                            </div>
                            {(app.status === "Approved" || app.status === "Revision Requested") && (
                              <div className="text-right">
                                <p className="text-[9px] uppercase font-bold text-gray-400">Deadline Date</p>
                                <p className="font-extrabold text-indigo-600">
                                  {new Date(app.extendedDeadline || project.deadline).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>

                          {app.extensionRequests && app.extensionRequests.length > 0 && (
                            <div className="text-[10px] bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                              <span className="text-slate-400 font-bold">Extension status:</span>
                              <span className={`font-black uppercase text-[9px] ${
                                app.extensionRequests[app.extensionRequests.length - 1].status === "Approved"
                                  ? "text-green-600"
                                  : app.extensionRequests[app.extensionRequests.length - 1].status === "Rejected"
                                  ? "text-red-500"
                                  : "text-amber-600 animate-pulse"
                              }`}>
                                {app.extensionRequests[app.extensionRequests.length - 1].status}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center border-t pt-2.5">
                            <div>
                              {app.status === "Approved" && (
                                <button
                                  onClick={() => { setActiveAppToExtend(app); setShowExtensionModal(true); }}
                                  className="text-[10px] text-indigo-600 font-extrabold hover:underline"
                                >
                                  Request Extension 🕒
                                </button>
                              )}
                            </div>
                            
                            {(app.status === "Approved" || app.status === "Revision Requested") && (
                              <button
                                onClick={() => { setActiveAppToSubmit(app); setShowSubmitModal(true); }}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition shadow-sm animate-fade-in"
                              >
                                {app.status === "Approved" ? "Submit Work" : "Submit V2 Revision"}
                              </button>
                            )}
                            {app.status === "Submitted" && (
                              <span className="text-[11px] text-amber-600 font-semibold italic">Under review</span>
                            )}
                            {app.status === "Completed" && (
                              <div className="text-right w-full">
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
            <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-100 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
              {/* Left Panel: Inputs for CV share link and Raw Text */}
              <div className="lg:col-span-1 bg-white border border-gray-200 p-4 sm:p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                    <span>🧠 AI CV Reviewer</span>
                    <span className="bg-indigo-100 text-indigo-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase">pro</span>
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">Upload or paste your resume details below to critique its quality and check match capabilities.</p>

                  <form onSubmit={handleUpdateResumeDetails} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Upload CV PDF (Auto-Extract Details)</label>
                      <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-3 text-center hover:border-indigo-400 transition cursor-pointer bg-gray-50/50">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleUploadCVFile}
                          disabled={uploadingCV}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {uploadingCV ? (
                          <div className="flex flex-col items-center justify-center space-y-1.5 py-1">
                            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[10px] text-indigo-600 font-bold">Extracting text...</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-base">📄</div>
                            <div className="text-[10px] font-bold text-gray-700">Drag & Drop or Click to Upload PDF</div>
                            <div className="text-[9px] text-gray-400">PDF format up to 5MB</div>
                          </div>
                        )}
                      </div>
                    </div>
                    {resumeText ? (
                      <div className="bg-emerald-50 border border-emerald-200/50 p-3 rounded-xl text-left flex items-center gap-2">
                        <span className="text-emerald-600 text-sm">✅</span>
                        <div>
                          <div className="text-[10px] font-bold text-emerald-800">CV PDF Loaded</div>
                          <div className="text-[9px] text-emerald-600/80">Ready for AI review critique</div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200/50 p-3 rounded-xl text-left flex items-center gap-2">
                        <span className="text-amber-500 text-sm">⚠️</span>
                        <div>
                          <div className="text-[10px] font-bold text-amber-800">No CV Uploaded</div>
                          <div className="text-[9px] text-amber-600/80">Please upload a PDF to begin</div>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleReviewCVWithAI}
                      disabled={loadingReview || !resumeText}
                      className={`w-full py-3 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-md ${
                        !resumeText || loadingReview 
                          ? "bg-gray-300 cursor-not-allowed" 
                          : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]"
                      }`}
                    >
                      {loadingReview ? "Analyzing..." : "Review CV"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Panel: Quality Report Display */}
              <div className="lg:col-span-2 bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-4 sm:p-6 rounded-2xl shadow-xl flex flex-col justify-between min-h-[250px] sm:min-h-[350px]">
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

                    {/* Skill Gap Analyzer */}
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-left">
                      <h5 className="text-[10px] font-extrabold uppercase text-indigo-300 mb-2 flex items-center gap-1.5 justify-between">
                        <span>🔍 Skill Gap Analyzer</span>
                        <span className="bg-indigo-500/20 text-indigo-300 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Live Demands</span>
                      </h5>
                      {(() => {
                        const userSkills = new Set(
                          (currentUser?.preferredTechStack || [])
                            .concat((currentUser?.targetSkills || "").split(","))
                            .map(s => s.trim().toLowerCase())
                            .filter(Boolean)
                        );
                        const gapCounts = {};
                        projects.forEach(p => {
                          (p.requiredSkills || []).forEach(s => {
                            const skillLower = s.trim().toLowerCase();
                            if (!userSkills.has(skillLower)) {
                              gapCounts[s.trim()] = (gapCounts[s.trim()] || 0) + 1;
                            }
                          });
                        });
                        const sortedGaps = Object.entries(gapCounts)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 4);

                        if (sortedGaps.length === 0) {
                          return <p className="text-[10px] text-slate-400 italic">No skill gaps detected! Your profile matches all active corporate project requirements.</p>;
                        }

                        return (
                          <div className="space-y-2">
                            <p className="text-[10px] text-slate-300 leading-normal">
                              Top high-demand skills missing from your profile based on active company postings:
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {sortedGaps.map(([skill, count]) => (
                                <span key={skill} className="bg-slate-900 border border-slate-700/30 text-indigo-300 text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1.5" title={`${count} active projects require this`}>
                                  {skill}
                                  <span className="bg-indigo-900/60 text-indigo-400 text-[8px] font-black px-1 py-0.5 rounded">+{count} gigs</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
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
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-2">Deployed Company Projects</h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">Explore the latest real-world tasks deployed by verified companies.</p>

            {/* Marketplace Filters Panel */}
            <div className="bg-gray-50/60 border border-gray-100 p-4 rounded-2xl mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Search Keywords</label>
                <input
                  type="text"
                  placeholder="Search title, details, or company..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setShowSearchSuggestions(true); }}
                  onFocus={() => setShowSearchSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 250)}
                  className="w-full bg-white border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {showSearchSuggestions && searchTerm && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto text-left dark:bg-slate-950 dark:border-slate-800">
                    {(() => {
                      const query = searchTerm.toLowerCase();
                      const suggestions = [];
                      projects.forEach(p => {
                        if (p.title && p.title.toLowerCase().includes(query) && !suggestions.includes(p.title)) {
                          suggestions.push(p.title);
                        }
                        if (p.requiredSkills) {
                          p.requiredSkills.forEach(s => {
                            if (s.toLowerCase().includes(query) && !suggestions.includes(s)) {
                              suggestions.push(s);
                            }
                          });
                        }
                      });
                      if (suggestions.length === 0) return null;
                      return suggestions.slice(0, 5).map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => { setSearchTerm(suggestion); setShowSearchSuggestions(false); }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 transition border-b border-slate-50 last:border-b-0 font-medium dark:text-slate-300 dark:hover:bg-slate-900 dark:border-slate-800"
                        >
                          🔍 {suggestion}
                        </button>
                      ));
                    })()}
                  </div>
                )}
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
                  <option value="Part-Time">Part-Time</option>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Micro Tasks">Micro Tasks</option>
                </select>
              </div>

              {/* Slider for Max Budget */}
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">
                  Max Budget: {maxBudgetFilter >= 10000 ? "Unlimited" : `₹${maxBudgetFilter.toLocaleString()}`}
                </label>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="1000"
                  value={maxBudgetFilter}
                  onChange={(e) => setMaxBudgetFilter(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-3"
                />
              </div>

              {/* Sort By Select */}
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Sort Deployed Gigs</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="latest">Latest Gigs First</option>
                  <option value="budgetHigh">Highest Budget</option>
                  <option value="budgetLow">Lowest Budget</option>
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
                      className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition-all duration-200"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md">
                            🏢 {project.companyId ? project.companyId.split("@")[0].toUpperCase() : "COMPANY"}
                          </span>
                          {project.aiRecommendationScore !== undefined && (
                            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-lg border border-indigo-100/50 flex items-center gap-0.5">
                              🧠 {project.aiRecommendationScore}% Match
                            </span>
                          )}
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
                          <div className="flex gap-2 flex-wrap">
                            {currentUser?.userRole === "company" ? (
                              <button className="bg-gray-100 text-gray-500 font-bold text-xs px-4 py-2 rounded-lg cursor-not-allowed border" disabled>
                                Company View
                              </button>
                            ) : (
                              <button 
                                onClick={() => navigate(`/project/${project._id}`)}
                                className={`font-bold text-xs px-4 py-2 rounded-lg transition shadow-sm ${
                                  isAlreadyApplied 
                                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200/50" 
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                }`}
                              >
                                {isAlreadyApplied ? "✓ Applied (Details)" : "View Details"}
                              </button>
                            )}

                            {currentUser?.userRole === "student" && (
                              <button
                                onClick={() => navigate(`/chat/${project.companyId}`)}
                                className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs px-4 py-2 rounded-lg transition shadow-sm"
                              >
                                Chat
                              </button>
                            )}
                          </div>
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
              <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 border overflow-y-auto max-h-[90vh] animate-fade-in text-left">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                  <h3 className="font-black text-sm text-gray-900 uppercase tracking-wider">Submit Work: {activeAppToSubmit.projectId.title}</h3>
                  <button onClick={() => setShowSubmitModal(false)} className="text-gray-400 hover:text-gray-600 text-lg font-black">×</button>
                </div>
                <form onSubmit={handleSubmitWork} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Submission / Verify Link (Drive or generic link)</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={submissionLink}
                      onChange={(e) => { setSubmissionLink(e.target.value); saveDraft({ submissionLink: e.target.value }); }}
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">GitHub Repository Link (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://github.com/username/repo"
                      value={githubRepoUrl}
                      onChange={(e) => { setGithubRepoUrl(e.target.value); saveDraft({ githubRepoUrl: e.target.value }); }}
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Live Vercel / Netlify Deployment Link (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://project.vercel.app"
                      value={liveDeploymentUrl}
                      onChange={(e) => { setLiveDeploymentUrl(e.target.value); saveDraft({ liveDeploymentUrl: e.target.value }); }}
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Explanatory Notes / Description of Work</label>
                    <textarea
                      placeholder="Explain what you implemented, details of the task, and any installation steps..."
                      value={submissionText}
                      onChange={(e) => { setSubmissionText(e.target.value); saveDraft({ submissionText: e.target.value }); }}
                      rows={3}
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                      required
                    />
                  </div>

                  {/* Rubric Self Assessment */}
                  <div className="border-t pt-3 space-y-3">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">📊 Rubric Self-Assessment</h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between font-bold text-slate-700">
                          <span>Code Quality:</span>
                          <span>{codeQualityRubric}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={codeQualityRubric}
                          onChange={(e) => { setCodeQualityRubric(Number(e.target.value)); saveDraft({ codeQualityRubric: Number(e.target.value) }); }}
                          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between font-bold text-slate-700">
                          <span>Functional Correctness:</span>
                          <span>{correctnessRubric}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={correctnessRubric}
                          onChange={(e) => { setCorrectnessRubric(Number(e.target.value)); saveDraft({ correctnessRubric: Number(e.target.value) }); }}
                          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between font-bold text-slate-700">
                          <span>Documentation:</span>
                          <span>{documentationRubric}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={documentationRubric}
                          onChange={(e) => { setDocumentationRubric(Number(e.target.value)); saveDraft({ documentationRubric: Number(e.target.value) }); }}
                          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* AI Declaration */}
                  <div className="border-t pt-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="usedAiCheckbox"
                        checked={usedAi}
                        onChange={(e) => { setUsedAi(e.target.checked); saveDraft({ usedAi: e.target.checked }); }}
                        className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                      />
                      <label htmlFor="usedAiCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                        🤖 I used generative AI tools in this solution
                      </label>
                    </div>

                    {usedAi && (
                      <div className="space-y-3 bg-slate-50 border p-3.5 rounded-xl animate-fade-in text-xs">
                        <div>
                          <div className="flex justify-between font-bold text-slate-700">
                            <span>Estimated AI Contribution:</span>
                            <span>{aiPercentage}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={aiPercentage}
                            onChange={(e) => { setAiPercentage(Number(e.target.value)); saveDraft({ aiPercentage: Number(e.target.value) }); }}
                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">AI Tools Used & Details</label>
                          <input
                            type="text"
                            placeholder="e.g. Gemini 2.5, GitHub Copilot"
                            value={aiToolsUsed}
                            onChange={(e) => { setAiToolsUsed(e.target.value); saveDraft({ aiToolsUsed: e.target.value }); }}
                            className="w-full bg-white border border-gray-200 text-xs px-3.5 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          />
                        </div>
                      </div>
                    )}
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
                      className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-black transition shadow-md"
                    >
                      Submit Work
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ⏳ DEADLINE EXTENSION REQUEST MODAL */}
          {showExtensionModal && activeAppToExtend && (
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border animate-fade-in text-left">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                  <h3 className="font-bold text-base text-gray-900">Request Deadline Extension</h3>
                  <button onClick={() => setShowExtensionModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
                </div>
                <form onSubmit={handleRequestExtensionSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Requested Days Extension (1-7 days)</label>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      value={extensionDays}
                      onChange={(e) => setExtensionDays(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason for Extension</label>
                    <textarea
                      placeholder="Explain why you need more time to complete this gig..."
                      value={extensionReason}
                      onChange={(e) => setExtensionReason(e.target.value)}
                      rows={4}
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none resize-none"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowExtensionModal(false)}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={requestingExtension}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                    >
                      {requestingExtension ? "Requesting..." : "Submit Request"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* ========================================================================= */}

          {/* 💳 Razorpay Gateway Simulation Checkout Modal */}
          {showCheckoutModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in select-none">
              <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col text-left">
                
                {/* Razorpay branding header bar */}
                <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500 font-extrabold text-sm tracking-wide">Razorpay</span>
                    <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[8px] font-black uppercase rounded">Secured</span>
                  </div>
                  <button 
                    onClick={() => setShowCheckoutModal(false)}
                    className="text-slate-400 hover:text-white font-extrabold text-sm transition"
                  >
                    ✕
                  </button>
                </div>

                {/* Step 1: Details and plan selection */}
                {checkoutStep === 1 && (
                  <div className="p-6 space-y-4">
                    <div className="text-center">
                      <span className="text-3xl">🛡️</span>
                      <h3 className="text-base font-black text-gray-800 mt-2">Unlock Student Premium Pass</h3>
                      <p className="text-xs text-gray-400 mt-1">Unlock premium AI match resume scores and priority applications.</p>
                    </div>
                    
                    <div className="border border-indigo-100 bg-indigo-50/50 p-4 rounded-2xl flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-black text-indigo-700 uppercase">Premium Plan</span>
                        <span className="text-xs font-semibold text-gray-600 block mt-0.5">30-Days Unlimited Access</span>
                      </div>
                      <span className="text-xl font-black text-gray-800">₹39</span>
                    </div>

                    <div className="space-y-2.5">
                      <label className="block text-[9px] font-bold text-gray-400 uppercase">Enter Billing Contact</label>
                      <input
                        type="text"
                        placeholder="Mobile number (10-digits)"
                        defaultValue={currentUser?.mobile || ""}
                        className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    <button
                      onClick={() => setCheckoutStep(2)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition shadow"
                    >
                      Proceed to Payment
                    </button>
                  </div>
                )}

                {/* Step 2: Payment options selector and simulated pin input */}
                {checkoutStep === 2 && (
                  <div className="p-6 space-y-4">
                    <div>
                      <h4 className="text-xs font-extrabold text-gray-400 uppercase mb-2">Simulate UPI Payout</h4>
                      <div className="border border-gray-100 p-3 rounded-xl flex items-center justify-between text-xs bg-slate-50">
                        <span className="font-bold text-gray-700">UPI ID:</span>
                        <span className="text-gray-500 font-semibold">{currentUser?.email || "student"}@paymitra</span>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200/50 p-3.5 rounded-xl text-[10px] text-amber-800 leading-relaxed font-semibold">
                      ⚠️ This is a simulated Razorpay payment gateway checkout interface. No actual monetary deductions are made.
                    </div>

                    <button
                      onClick={() => {
                        setCheckingOutPass(true);
                        setTimeout(() => {
                          setCheckingOutPass(false);
                          setCheckoutStep(3);
                          localStorage.setItem("hasPaidPass", "true");
                        }, 1500);
                      }}
                      disabled={checkingOutPass}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow disabled:opacity-50"
                    >
                      {checkingOutPass ? "Verifying Transaction..." : "Simulate ₹39 Payment Approval"}
                    </button>
                  </div>
                )}

                {/* Step 3: Transaction Receipt Success Screen */}
                {checkoutStep === 3 && (
                  <div className="p-6 text-center space-y-4">
                    <span className="text-4xl bg-emerald-100 p-3 rounded-full text-emerald-600 inline-block">✓</span>
                    <div>
                      <h3 className="text-base font-black text-gray-800">Payment Successful!</h3>
                      <p className="text-xs text-gray-400 mt-1">Transaction Ref: TXN_SIM_{Math.floor(Math.random()*10000000)}</p>
                    </div>

                    <div className="text-xs text-left bg-slate-50 border p-3 rounded-xl space-y-1 text-gray-600">
                      <p>• <b>Merchant:</b> workMitra Escrow Portal</p>
                      <p>• <b>Amount Paid:</b> ₹39.00</p>
                      <p>• <b>Membership Plan:</b> Premium Pass Enabled</p>
                    </div>

                    <button
                      onClick={() => {
                        setShowCheckoutModal(false);
                        toast.success("Premium features unlocked!");
                      }}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition"
                    >
                      Complete Checkout & Go Back
                    </button>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}