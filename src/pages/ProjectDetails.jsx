import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { useToast } from "../components/Toast";
import { fetchWithAuth } from "../services/apiClient";

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState(null); // 'Pending', 'Approved', etc.
  const [applying, setApplying] = useState(false);
  
  // Phase 9 States
  const [studentApps, setStudentApps] = useState([]);
  const [showNdaModal, setShowNdaModal] = useState(false);
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});

  const fetchProjectAndAppState = useCallback(async (userEmail) => {
    setLoading(true);
    try {
      // 1. Fetch project details
      const projectRes = await fetchWithAuth(`${API_BASE_URL}/api/projects/${projectId}`);
      const projectData = await projectRes.json();

      if (projectRes.ok) {
        setProject(projectData);
      } else {
        setErrorMessage(projectData.error || "Failed to load project details.");
      }

      // 2. Fetch student applications to check if applied
      const appsRes = await fetchWithAuth(`${API_BASE_URL}/api/applications/student-details/${userEmail}`);
      if (appsRes.ok) {
        const apps = await appsRes.json();
        setStudentApps(apps);
        const existingApp = apps.find(app => app.projectId?._id === projectId);
        if (existingApp) {
          setApplicationStatus(existingApp.status);
        }
      }
    } catch (err) {
      setErrorMessage("Error connecting to server gateway.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    setCurrentUser(savedUser);

    if (!savedUser) {
      navigate("/login");
      return;
    }

    fetchProjectAndAppState(savedUser.email);
  }, [projectId, fetchProjectAndAppState]);

  const handleApply = () => {
    if (!currentUser) return;

    // Calculate readiness score
    const profileCompleteness = [
      currentUser.fullName, currentUser.mobile, currentUser.collegeName,
      currentUser.enrollmentNumber, currentUser.targetSkills, currentUser.bio,
      currentUser.githubUrl, currentUser.linkedinUrl, currentUser.portfolioUrl
    ].filter(Boolean).length / 9;

    const completedCount = studentApps.filter(a => a.status === "Completed").length;
    const ratingApps = studentApps.filter(a => a.status === "Completed" && a.rating > 0);
    const avgRating = ratingApps.length > 0 
      ? ratingApps.reduce((sum, a) => sum + a.rating, 0) / ratingApps.length 
      : 0;

    const readinessScore = Math.min(
      1000,
      Math.round(200 + (completedCount * 150) + (avgRating * 80) + (profileCompleteness * 100))
    );

    // Prerequisite score tier check
    if (project.minReadinessScore && readinessScore < project.minReadinessScore) {
      toast.error(`Prerequisite score mismatch: This task requires a minimum WorkMitra Score of ${project.minReadinessScore}. Your score is ${readinessScore}.`);
      return;
    }

    // Targeted University suffix check
    if (project.targetUniversity && !currentUser.email.toLowerCase().endsWith(project.targetUniversity.toLowerCase())) {
      toast.error(`Broadcast mismatch: This task is restricted exclusively to students of domain "${project.targetUniversity}".`);
      return;
    }

    // Pre-Test quiz checks
    if (project.preTestQuestions && project.preTestQuestions.length > 0 && !showQuizModal && Object.keys(quizAnswers).length === 0) {
      setShowQuizModal(true);
      return;
    }

    // NDA check
    if (project.isNdaRequired && !ndaAccepted) {
      setShowNdaModal(true);
      return;
    }

    executeApplyAPI();
  };

  const executeApplyAPI = async () => {
    setApplying(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/applications/apply`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          projectId,
          companyId: typeof project.companyId === 'object' ? project.companyId._id : project.companyId
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Application submitted successfully! Recruiter has been notified.");
        setApplicationStatus("Pending");
      } else {
        toast.error(data.error || "Failed to submit application.");
      }
    } catch (err) {
      toast.error("Error communicating with server.");
    } finally {
      setApplying(false);
      setShowNdaModal(false);
      setShowQuizModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center py-16 text-gray-500 font-medium animate-pulse flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Synchronizing gig specifications...</span>
        </div>
      </div>
    );
  }

  if (errorMessage || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Failed to load Project</h2>
          <p className="text-sm text-gray-500 mb-6">{errorMessage || "The project details could not be found."}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  // Calculate skills intersection
  const studentSkills = currentUser?.skills || [];
  const requiredSkills = project.requiredSkills || [];
  const matchingSkills = requiredSkills.filter(skill => 
    studentSkills.some(studentSkill => studentSkill.toLowerCase() === skill.toLowerCase())
  );
  const matchPercentage = requiredSkills.length > 0 
    ? Math.round((matchingSkills.length / requiredSkills.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Link */}
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-6 px-4 py-2 bg-white/80 hover:bg-white text-gray-600 rounded-xl text-xs font-bold transition shadow-sm border border-gray-100 flex items-center gap-1.5"
        >
          ← Back to Marketplace
        </button>

        {/* Project Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-6 mb-6 gap-4">
            <div>
              <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-lg">
                {project.workType || "Freelance"}
              </span>
              {project.hasPpiBadge && (
                <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[8px] font-extrabold uppercase rounded-md tracking-wider">
                  🚀 +PPI Offered
                </span>
              )}
              {project.targetUniversity && (
                <span className="ml-2 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[8px] font-extrabold uppercase rounded-md tracking-wider">
                  🎓 {project.targetUniversity} Only
                </span>
              )}
              <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight mt-2.5">
                {project.title}
              </h1>
              <p className="text-xs text-gray-400 mt-1 font-semibold uppercase tracking-wider">
                Posted by {project.companyId?.email || project.companyId} • <span className="text-indigo-500">{project.departmentName || "Core Team"}</span>
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-2xl text-center min-w-[140px] shadow-sm">
              <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Gig Budget</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-950 block mt-0.5">
                ₹{project.budget?.toLocaleString() || "0"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 border border-gray-100/50 p-4 rounded-2xl shadow-inner text-left">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Timeline Duration</span>
              <span className="text-xs font-extrabold text-gray-800 mt-1 block">⏱️ {project.duration || "N/A"}</span>
            </div>

            <div className="bg-gray-50 border border-gray-100/50 p-4 rounded-2xl shadow-inner text-left">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Time Remaining</span>
              <span className="text-xs font-extrabold text-gray-800 mt-1 block">
                ⏱️ {(() => {
                  const diff = new Date(project.deadline) - new Date();
                  if (diff <= 0) return <span className="text-red-500 font-black">Expired</span>;
                  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                  return <span className="text-indigo-600 font-black">{days} Days left</span>;
                })()}
              </span>
            </div>

            <div className="bg-gray-50 border border-gray-100/50 p-4 rounded-2xl shadow-inner text-left">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Student Capacity</span>
              <span className="text-xs font-extrabold text-gray-800 mt-1 block">👥 {project.studentsNeeded || 1} slots</span>
            </div>

            <div className="bg-gray-50 border border-gray-100/50 p-4 rounded-2xl shadow-inner text-left">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Complexity Tier</span>
              <span className="text-xs font-extrabold text-gray-800 mt-1 block">🏷️ {project.complexity || "Intermediate"}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">Gig Details & Context</h3>
            <p className="text-sm text-gray-600 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100 whitespace-pre-line">
              {project.description}
            </p>
          </div>

          {/* Requirements & Matching Score */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">Required Technical Stack</h3>
              <div className="flex flex-wrap gap-2">
                {requiredSkills.map((skill) => {
                  const matches = studentSkills.some(studentSkill => studentSkill.toLowerCase() === skill.toLowerCase());
                  return (
                    <span 
                      key={skill} 
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        matches 
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" 
                          : "bg-gray-50 border-gray-200 text-gray-500"
                      }`}
                    >
                      {skill} {matches && "✓"}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/50 border border-indigo-100/50 p-5 rounded-2xl">
              <h3 className="text-sm font-black text-indigo-900/50 uppercase tracking-wider mb-2.5">AI Skills Match Rating</h3>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex items-center justify-center bg-white rounded-full shadow-sm border border-indigo-100">
                  <span className="text-sm font-black text-indigo-700">{matchPercentage}%</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700">
                    You match {matchingSkills.length} out of {requiredSkills.length} required skills.
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    Higher matching percentages increase resume visibility to the recruitment dashboard metrics.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Overlay */}
          <div className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              {applicationStatus ? (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping"></span>
                  <span className="text-xs font-extrabold text-gray-600">
                    Current application tracking status: 
                    <span className={`ml-1 px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase ${
                      applicationStatus === 'Approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                      applicationStatus === 'Rejected' ? 'bg-rose-50 border-rose-100 text-rose-800' :
                      applicationStatus === 'Completed' ? 'bg-blue-50 border-blue-100 text-blue-800' :
                      'bg-amber-50 border-amber-100 text-amber-800'
                    }`}>
                      {applicationStatus}
                    </span>
                  </span>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Ensure your profile details are fully configured before applying.</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              
              {!applicationStatus && (
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black transition shadow disabled:opacity-50"
                >
                  {applying ? "Submitting application payload..." : "Apply to Gig Now"}
                </button>
              )}
            </div>
          </div>
        </div>
      {/* 🔒 Digital NDA Verification Modal Overlay */}
      {showNdaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 border text-left flex flex-col animate-fade-in select-none">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">🔒 Non-Disclosure Agreement (NDA)</h3>
              <button onClick={() => setShowNdaModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>
            <div className="bg-slate-50 border p-4 rounded-2xl text-xs text-slate-600 leading-relaxed max-h-60 overflow-y-auto space-y-2">
              <p className="font-extrabold text-slate-800 text-[13px]">CONFIDENTIALITY & CODE DISCLOSURE RULES</p>
              <p>This micro-internship task involves access to proprietary codebases, credentials, or corporate strategies of the issuing company. By applying, you agree:</p>
              <ul className="list-decimal list-inside space-y-1.5 font-semibold">
                <li>Not to copy, download, distribute or upload this codebase to any public repository except verified WorkMitra endpoints.</li>
                <li>To treat all designs, logic, and text outputs as strictly confidential under active corporate NDA rules.</li>
                <li>That any infraction will result in immediate university disciplinary action and platform blacklisting.</li>
              </ul>
            </div>
            
            <div className="flex items-center gap-3 mt-5 p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
              <input
                type="checkbox"
                id="ndaConfirm"
                checked={ndaAccepted}
                onChange={(e) => setNdaAccepted(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
              <label htmlFor="ndaConfirm" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                I accept and sign this digital NDA. I agree to treat this gig and its resources as strictly confidential.
              </label>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t mt-4">
              <button
                type="button"
                onClick={() => setShowNdaModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!ndaAccepted) {
                    toast.error("Please accept the NDA constraints before submitting.");
                    return;
                  }
                  setShowNdaModal(false);
                  handleApply();
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition shadow"
              >
                Complete Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📝 Pre-Test MCQ Screening Overlay Modal */}
      {showQuizModal && project.preTestQuestions && project.preTestQuestions.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 border text-left flex flex-col animate-fade-in select-none">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">📝 Pre-Test Screening Quiz</h3>
              <button onClick={() => setShowQuizModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>
            
            <p className="text-xs text-slate-500 mb-4 font-semibold">Verify your proficiency by answering these quiz screening checks correctly:</p>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {project.preTestQuestions.map((q, qIdx) => (
                <div key={qIdx} className="border p-4 rounded-2xl bg-slate-50/50 space-y-2">
                  <p className="text-xs font-bold text-slate-800">
                    Q{qIdx + 1}: {q.question}
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = quizAnswers[qIdx] === opt;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => setQuizAnswers({ ...quizAnswers, [qIdx]: opt })}
                          className={`text-left text-xs p-2.5 rounded-xl border transition-all ${
                            isSelected 
                              ? "bg-indigo-600 text-white border-indigo-700 font-bold" 
                              : "bg-white text-slate-600 border-gray-200 hover:bg-slate-50"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t mt-4">
              <button
                type="button"
                onClick={() => setShowQuizModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  let allCorrect = true;
                  project.preTestQuestions.forEach((q, qIdx) => {
                    if (quizAnswers[qIdx] !== q.correctAnswer) {
                      allCorrect = false;
                    }
                  });

                  if (Object.keys(quizAnswers).length < project.preTestQuestions.length) {
                    toast.error("Please answer all screening questions.");
                    return;
                  }

                  if (!allCorrect) {
                    toast.error("Screening Failed: One or more answers are incorrect. Review and try again!");
                    return;
                  }

                  toast.success("✓ Screening pre-test cleared successfully!");
                  setShowQuizModal(false);
                  handleApply();
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition shadow"
              >
                Submit Answers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
