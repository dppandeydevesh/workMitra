import { useState, useEffect, useCallback} from"react";
import { useParams, useNavigate} from"react-router-dom";
import { API_BASE_URL} from"../config";
import { useToast} from"../components/Toast";
import { fetchWithAuth} from"../services/apiClient";
import { useTranslation} from"react-i18next";
import { track } from"../utils/analytics";

export default function ProjectDetails() {const { projectId} = useParams();
 const navigate = useNavigate();
 const toast = useToast();
 const { t} = useTranslation();

 const [project, setProject] = useState(null);
 const [loading, setLoading] = useState(true);
 const [errorMessage, setErrorMessage] = useState("");
 const [currentUser, setCurrentUser] = useState(null);
 const [applicationStatus, setApplicationStatus] = useState(null); //'Pending','Approved', etc.
 const [applying, setApplying] = useState(false);
 
 // Phase 9 States
 const [studentApps, setStudentApps] = useState([]);
 const [showNdaModal, setShowNdaModal] = useState(false);
 const [ndaAccepted, setNdaAccepted] = useState(false);
 const [showQuizModal, setShowQuizModal] = useState(false);
 const [quizAnswers, setQuizAnswers] = useState({});

 const fetchProjectAndAppState = useCallback(async (userEmail) => {setLoading(true);
 try {// 1. Fetch project details
 const projectRes = await fetchWithAuth(`${API_BASE_URL}/api/projects/${projectId}`);
 const projectData = await projectRes.json();

 if (projectRes.ok) {setProject(projectData);
} else {setErrorMessage(projectData.error || t("projectDetails.failedToLoadDetails"));
}

 // 2. Fetch student applications to check if applied
 const appsRes = await fetchWithAuth(`${API_BASE_URL}/api/applications/student-details/${userEmail}`);
 if (appsRes.ok) {const apps = await appsRes.json();
 setStudentApps(apps);
 const existingApp = apps.find(app => app.projectId?._id === projectId);
 if (existingApp) {setApplicationStatus(existingApp.status);
}
}
} catch (err) { console.error(err);setErrorMessage(t("projectDetails.errorConnecting"));
} finally {setLoading(false);
}
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [projectId]);

 useEffect(() => {const savedUser = JSON.parse(localStorage.getItem("user") ||"null");
 setCurrentUser(savedUser);

 if (!savedUser) {navigate("/login");
 return;
}

 fetchProjectAndAppState(savedUser.email);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [projectId, fetchProjectAndAppState]);

 const handleApply = () => {if (!currentUser) return;
 track('application_started', { projectId });

 // Calculate readiness score
 const profileCompleteness = [
 currentUser.fullName, currentUser.mobile, currentUser.collegeName,
 currentUser.enrollmentNumber, currentUser.targetSkills, currentUser.bio,
 currentUser.githubUrl, currentUser.linkedinUrl, currentUser.portfolioUrl
 ].filter(Boolean).length / 9;

 const completedCount = studentApps.filter(a => a.status ==="Completed").length;
 const ratingApps = studentApps.filter(a => a.status ==="Completed" && a.rating > 0);
 const avgRating = ratingApps.length > 0 
 ? ratingApps.reduce((sum, a) => sum + a.rating, 0) / ratingApps.length 
 : 0;

 const readinessScore = Math.min(
 1000,
 Math.round(200 + (completedCount * 150) + (avgRating * 80) + (profileCompleteness * 100))
 );

 // Prerequisite score tier check
 if (project.minReadinessScore && readinessScore < project.minReadinessScore) {toast.error(t("projectDetails.prerequisiteMismatch", { minScore: project.minReadinessScore, score: readinessScore}));
 return;
}

 // Targeted University suffix check
 if (project.targetUniversity && !currentUser.email.toLowerCase().endsWith(project.targetUniversity.toLowerCase())) {toast.error(t("projectDetails.broadcastMismatch", { university: project.targetUniversity}));
 return;
}

 // Pre-Test quiz checks
 if (project.preTestQuestions && project.preTestQuestions.length > 0 && !showQuizModal && Object.keys(quizAnswers).length === 0) {setShowQuizModal(true);
 return;
}

 // NDA check
 if (project.isNdaRequired && !ndaAccepted) {setShowNdaModal(true);
 return;
}

 executeApplyAPI();
};

 const executeApplyAPI = async () => {setApplying(true);
 try {const res = await fetchWithAuth(`${API_BASE_URL}/api/applications/apply`, {method:"POST",
 headers: {"Content-Type":"application/json"
},
 body: JSON.stringify({projectId,
 companyId: typeof project.companyId ==='object' ? project.companyId._id : project.companyId
})
});

 const data = await res.json();
 if (res.ok) {toast.success(t("projectDetails.applicationSubmitted"));
 track('application_submitted', { projectId, role: 'student' });
 setApplicationStatus("Pending");
} else {toast.error(data.error || t("projectDetails.failedToSubmit"));
}
} catch (err) { console.error(err);toast.error(t("projectDetails.errorCommunicating"));
} finally {setApplying(false);
 setShowNdaModal(false);
 setShowQuizModal(false);
}
};

 const handleWithdraw = async () => {if (!window.confirm(t("projectDetails.confirmWithdraw"))) return;
 
 const existingApp = studentApps.find(app => app.projectId?._id === projectId);
 if (!existingApp) return;

 setApplying(true);
 try {const res = await fetchWithAuth(`${API_BASE_URL}/api/applications/withdraw/${existingApp._id}`, {method:"PUT"
});
 const data = await res.json();
 if (res.ok) {toast.success(t("projectDetails.applicationWithdrawn"));
 setApplicationStatus("Withdrawn");
} else {toast.error(data.error || t("projectDetails.failedToWithdraw"));
}
} catch (err) { console.error(err);toast.error(t("projectDetails.errorCommunicating"));
} finally {setApplying(false);
}
};

 if (loading) {return (
 <div className="min-h-screen bg-transparent flex items-center justify-center">
 <div className="text-center py-16 text-ink-500 font-medium animate-pulse flex flex-col items-center justify-center space-y-3">
 <div className="w-10 h-10 border-4 border-marigold-500 border-t-transparent rounded-full animate-spin"></div>
 <span>{t("projectDetails.synchronizing")}</span>
 </div>
 </div>
 );
}

 if (errorMessage || !project) {return (
 <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
 <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 border border-ink-100 text-center">
 <span className="text-4xl mb-4 block">⚠️</span>
 <h2 className="text-lg font-bold text-ink-800 mb-2">{t("projectDetails.failedToLoadTitle")}</h2>
 <p className="text-sm text-ink-500 mb-6">{errorMessage || t("projectDetails.couldNotBeFound")}</p>
 <div className="flex justify-center gap-3">
 <button
 onClick={() => navigate("/dashboard")}
 className="px-5 py-2 bg-ink-100 hover:bg-ink-200 text-ink-700 rounded-xl text-xs font-bold transition shadow">
 {t("projectDetails.backToMarketplace")}
 </button>
 <button
 onClick={() => fetchProjectAndAppState(currentUser?.email || JSON.parse(localStorage.getItem("user") || "{}").email)}
 style={{ background: "#F5A623", color: "#1B2333" }} className="px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm">
 Retry
 </button>
 </div>
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
 <div className="min-h-screen bg-transparent font-sans py-8">
 <div className="max-w-4xl mx-auto px-4">
 {/* Back Link */}
 <button
 onClick={() => navigate("/dashboard")}
 className="mb-6 px-4 py-2 bg-white hover:bg-white text-ink-600 rounded-xl text-xs font-bold transition shadow-sm border border-ink-100 flex items-center gap-1.5">
 ← {t("projectDetails.backToMarketplace")}
 </button>

 {/* Project Card */}
 <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-ink-100">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-6 mb-6 gap-4">
 <div>
 <span className="px-2.5 py-1 bg-marigold-50 border border-marigold-100 text-marigold-700 text-[10px] font-black uppercase tracking-wider rounded-lg">
 {project.workType || t("projectDetails.freelance")}
 </span>
 {project.hasPpiBadge && (
 <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[8px] font-extrabold uppercase rounded-md tracking-wider">
 🚀 +{t("projectDetails.ppiOffered")}
 </span>
 )}
 {project.targetUniversity && (
 <span className="ml-2 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[8px] font-extrabold uppercase rounded-md tracking-wider">
 🎓 {t("projectDetails.universityOnly", { university: project.targetUniversity})}
 </span>
 )}
 <h1 className="text-2xl sm:text-3xl font-black text-ink-800 tracking-tight mt-2.5">
 {project.title}
 </h1>
 <p className="text-xs text-ink-400 mt-1 font-semibold uppercase tracking-wider">
 {t("projectDetails.postedBy")} {project.companyId?.email || project.companyId} • <span className="text-marigold-500">{project.departmentName || t("projectDetails.coreTeam")}</span>
 </p>
 </div>

 <div className="bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl text-center min-w-[140px] shadow-sm">
 <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">{t("projectDetails.gigBudget")}</span>
 <span className="text-xl sm:text-2xl font-black text-emerald-950 block mt-0.5">
 ₹{project.budget?.toLocaleString() ||"0"}
 </span>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
 <div className="bg-ink-50 border border-ink-100 p-4 rounded-xl shadow-inner text-left">
 <span className="text-[9px] font-black text-ink-400 uppercase tracking-wider block">{t("projectDetails.timelineDuration")}</span>
 <span className="text-xs font-extrabold text-ink-800 mt-1 block">⏱️ {project.duration || t("projectDetails.na")}</span>
 </div>

 <div className="bg-ink-50 border border-ink-100 p-4 rounded-xl shadow-inner text-left">
 <span className="text-[9px] font-black text-ink-400 uppercase tracking-wider block">{t("projectDetails.timeRemaining")}</span>
 <span className="text-xs font-extrabold text-ink-800 mt-1 block">
 ⏱️ {(() => {const diff = new Date(project.deadline) - new Date();
 if (diff <= 0) return <span className="text-red-500 font-black">{t("projectDetails.expired")}</span>;
 const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
 return <span className="text-marigold-500 font-black">{t("projectDetails.daysLeft", { days})}</span>;
})()}
 </span>
 </div>

 <div className="bg-ink-50 border border-ink-100 p-4 rounded-xl shadow-inner text-left">
 <span className="text-[9px] font-black text-ink-400 uppercase tracking-wider block">{t("projectDetails.studentCapacity")}</span>
 <span className="text-xs font-extrabold text-ink-800 mt-1 block">👥 {t("projectDetails.slots", { slots: project.studentsNeeded || 1})}</span>
 </div>

 <div className="bg-ink-50 border border-ink-100 p-4 rounded-xl shadow-inner text-left">
 <span className="text-[9px] font-black text-ink-400 uppercase tracking-wider block">{t("projectDetails.complexityTier")}</span>
 <span className="text-xs font-extrabold text-ink-800 mt-1 block">🏷️ {project.complexity || t("projectDetails.intermediate")}</span>
 </div>
 </div>

 {/* Description */}
 <div className="mb-8">
 <h3 className="text-sm font-black text-ink-400 uppercase tracking-wider mb-3">{t("projectDetails.gigDetailsContext")}</h3>
 <p className="text-sm text-ink-600 leading-relaxed bg-ink-50 p-5 rounded-xl border border-ink-100 whitespace-pre-line">
 {project.description}
 </p>
 </div>

 {/* Requirements & Matching Score */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
 <div>
 <h3 className="text-sm font-black text-ink-400 uppercase tracking-wider mb-3">{t("projectDetails.requiredTechStack")}</h3>
 <div className="flex flex-wrap gap-2">
 {requiredSkills.map((skill) => {const matches = studentSkills.some(studentSkill => studentSkill.toLowerCase() === skill.toLowerCase());
 return (
 <span 
 key={skill} 
 className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${matches 
 ?"bg-marigold-50 border-marigold-200 text-marigold-700 shadow-sm":"bg-ink-50 border-ink-200 text-ink-500"
}`}
 >
 {skill} {matches &&"✓"}
 </span>
 );
})}
 </div>
 </div>

 <div className="bg-marigold-50/50 border border-marigold-100/50 p-5 rounded-xl">
 <h3 className="text-sm font-black text-marigold-900/50 uppercase tracking-wider mb-2.5">{t("projectDetails.aiSkillsMatchRating")}</h3>
 <div className="flex items-center gap-4">
 <div className="relative w-16 h-16 flex items-center justify-center bg-white rounded-full shadow-sm border border-marigold-100">
 <span className="text-sm font-black text-marigold-700">{matchPercentage}%</span>
 </div>
 <div>
 <p className="text-xs font-bold text-ink-700">
 {t("projectDetails.youMatchSkills", { matchCount: matchingSkills.length, totalCount: requiredSkills.length})}
 </p>
 <p className="text-[11px] text-ink-500 mt-1 leading-relaxed">
 {t("projectDetails.higherMatchingPercentage")}
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
 <span className="w-2.5 h-2.5 bg-marigold-500 rounded-full animate-ping"></span>
 <span className="text-xs font-extrabold text-ink-600">
 {t("projectDetails.currentTrackingStatus")}
 <span className={`ml-1 px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase ${applicationStatus ==='Approved' ?'bg-emerald-50 border-emerald-100 text-emerald-800' :
 applicationStatus ==='Rejected' ?'bg-rose-50 border-rose-100 text-rose-800' :
 applicationStatus ==='Completed' ?'bg-marigold-50 border-marigold-100 text-marigold-800' :
'bg-amber-50 border-amber-100 text-amber-800'
}`}>
 {applicationStatus}
 </span>
 </span>
 </div>
 ) : (
 <p className="text-xs text-ink-400 italic">{t("projectDetails.ensureProfileConfigured")}</p>
 )}
 </div>

 <div className="flex gap-3">
 <button
 onClick={() => navigate("/dashboard")}
 className="px-5 py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-700 rounded-xl text-xs font-bold transition">
 {t("projectDetails.cancel")}
 </button>
 
 {!applicationStatus && (
 <button
 onClick={handleApply}
 disabled={applying}
 className="px-6 py-2.5 bg-gradient-to-r from-marigold-600 to-marigold-600 hover:from-marigold-700 hover:to-marigold-700 text-white rounded-xl text-xs font-black transition shadow disabled:opacity-50">
 {applying ? t("projectDetails.submittingPayload") : t("projectDetails.applyToGig")}
 </button>
 )}
 
 {(applicationStatus ==="Pending" || applicationStatus ==="Submitted") && (
 <button
 onClick={handleWithdraw}
 disabled={applying}
 className="px-6 py-2.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-xl text-xs font-black transition shadow-sm disabled:opacity-50">
 {applying ? t("projectDetails.withdrawing") : t("projectDetails.withdrawApplication")}
 </button>
 )}
 </div>
 </div>
 </div>
 {/* 🔒 Digital NDA Verification Modal Overlay */}
 {showNdaModal && (
 <div className="fixed inset-0 bg-ink-900/60 z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-xl max-w-lg w-full shadow-sm p-6 border text-left flex flex-col animate-fade-in">
 <div className="flex justify-between items-center border-b pb-3 mb-4">
 <h3 className="font-black text-ink-800 text-sm uppercase tracking-wider">🔒 {t("projectDetails.ndaModalTitle")}</h3>
 <button onClick={() => setShowNdaModal(false)} className="text-ink-400 hover:text-ink-600 text-lg">×</button>
 </div>
 <div className="bg-ink-50 border p-4 rounded-xl text-xs text-ink-600 leading-relaxed max-h-60 overflow-y-auto space-y-2">
 <p className="font-extrabold text-ink-800 text-[13px]">{t("projectDetails.ndaRulesTitle")}</p>
 <p>{t("projectDetails.ndaIntro")}</p>
 <ul className="list-decimal list-inside space-y-1.5 font-semibold">
 <li>{t("projectDetails.ndaRule1")}</li>
 <li>{t("projectDetails.ndaRule2")}</li>
 <li>{t("projectDetails.ndaRule3")}</li>
 </ul>
 </div>
 
 <div className="flex items-center gap-3 mt-5 p-3.5 bg-marigold-50/50 border border-marigold-100 rounded-xl">
 <input
 type="checkbox"id="ndaConfirm"checked={ndaAccepted}
 onChange={(e) => setNdaAccepted(e.target.checked)}
 className="w-4 h-4 accent-marigold-600 cursor-pointer"/>
 <label htmlFor="ndaConfirm" className="text-xs font-bold text-ink-700 cursor-pointer select-none">
 {t("projectDetails.ndaAcceptText")}
 </label>
 </div>

 <div className="flex justify-end gap-2.5 pt-4 border-t mt-4">
 <button
 type="button"onClick={() => setShowNdaModal(false)}
 className="px-4 py-2 border rounded-xl text-xs font-bold text-ink-500 hover:bg-ink-50 transition">
 {t("projectDetails.cancel")}
 </button>
 <button
 type="button"disabled={applying}
 onClick={() => {if (!ndaAccepted) {toast.error(t("projectDetails.acceptNdaError"));
 return;
}
 setShowNdaModal(false);
 handleApply();
}}
 className={`px-5 py-2.5 rounded-xl text-xs font-black transition shadow ${applying ?"bg-marigold-400 cursor-not-allowed text-white" :"marigold-btn-inline"
}`}
 >
 {applying ? t("projectDetails.submitting") : t("projectDetails.completeApplication")}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* 📝 Pre-Test MCQ Screening Overlay Modal */}
 {showQuizModal && project.preTestQuestions && project.preTestQuestions.length > 0 && (
 <div className="fixed inset-0 bg-ink-900/60 z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-xl max-w-lg w-full shadow-sm p-6 border text-left flex flex-col animate-fade-in">
 <div className="flex justify-between items-center border-b pb-3 mb-4">
 <h3 className="font-black text-ink-800 text-sm uppercase tracking-wider">📝 {t("projectDetails.quizModalTitle")}</h3>
 <button onClick={() => setShowQuizModal(false)} className="text-ink-400 hover:text-ink-600 text-lg">×</button>
 </div>
 
 <p className="text-xs text-ink-500 mb-4 font-semibold">{t("projectDetails.quizIntro")}</p>

 <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
 {project.preTestQuestions.map((q, qIdx) => (
 <div key={qIdx} className="border p-4 rounded-xl bg-ink-50 space-y-2">
 <p className="text-xs font-bold text-ink-800">
 Q{qIdx + 1}: {q.question}
 </p>
 <div className="grid grid-cols-1 gap-1.5">
 {q.options.map((opt, oIdx) => {const isSelected = quizAnswers[qIdx] === opt;
 return (
 <button
 key={oIdx}
 type="button"onClick={() => setQuizAnswers({ ...quizAnswers, [qIdx]: opt})}
 className={`text-left text-xs p-2.5 rounded-xl border transition-all ${isSelected 
 ?"bg-marigold-500 text-white border-marigold-700 font-bold":"bg-white text-ink-600 border-ink-200 hover:bg-ink-50"
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
 type="button"onClick={() => setShowQuizModal(false)}
 className="px-4 py-2 border rounded-xl text-xs font-bold text-ink-500 hover:bg-ink-50 transition">
 {t("projectDetails.cancel")}
 </button>
 <button
 type="button"disabled={applying}
 onClick={() => {let allCorrect = true;
 project.preTestQuestions.forEach((q, qIdx) => {if (quizAnswers[qIdx] !== q.correctAnswer) {allCorrect = false;
}
});

 if (Object.keys(quizAnswers).length < project.preTestQuestions.length) {toast.error(t("projectDetails.answerAllQuestions"));
 return;
}

 if (!allCorrect) {toast.error(t("projectDetails.screeningFailed"));
 return;
}

 toast.success(`✓ ${t("projectDetails.screeningPassed")}`);
 setShowQuizModal(false);
 handleApply();
}}
 className={`px-5 py-2.5 rounded-xl text-xs font-black transition shadow ${applying ?"bg-marigold-400 cursor-not-allowed text-white" :"marigold-btn-inline"
}`}
 >
 {applying ? t("projectDetails.submitting") : t("projectDetails.submitAnswers")}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
