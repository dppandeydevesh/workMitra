import { useState, useEffect} from"react";
import { useNavigate} from"react-router-dom";
import { API_BASE_URL} from"../config";
import { useToast} from"../components/Toast";
import { useTranslation} from"react-i18next";
import { Briefcase, Users} from"lucide-react";

export default function MyProjects() {const navigate = useNavigate();
 const toast = useToast();
 const { t} = useTranslation();

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

 useEffect(() => {const savedUser = JSON.parse(localStorage.getItem("user") ||"{}");
 const companyEmail = savedUser.email;

 if (!companyEmail) {setErrorMessage(t("myProjects.corporateSessionMissing"));
 setLoadingProjects(false);
 return;
}

 const fetchCompanyData = async () => {try {const response = await fetch(`${API_BASE_URL}/api/projects/company/${companyEmail}`, { credentials:"include",
 headers: {}
});
 const data = await response.json();
 if (response.ok) setProjects(data);
} catch (err) {setErrorMessage(t("myProjects.failedSync"));
} finally {setLoadingProjects(false);
}
};

 fetchCompanyData();
}, []);

 const handleInspectApplicants = async (project) => {setSelectedProject(project);
 setLoadingApplicants(true);
 try {const response = await fetch(`${API_BASE_URL}/api/projects/${project._id}/applicants`, { credentials:"include",
 headers: {}
});
 const data = await response.json();
 if (response.ok) setApplicants(data);
} catch (err) {toast.error(t("myProjects.errorAnalytics"));
} finally {setLoadingApplicants(false);
}
};

 const handleAcceptApplicant = async (applicationId) => {if (!window.confirm(t("myProjects.confirmApprove"))) return;
 try {const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/status`, { credentials:"include",
 method:"POST",
 headers: {"Content-Type":"application/json",
},
 body: JSON.stringify({ status:"Approved"})
});
 const data = await response.json();
 if (response.ok) {toast.success(t("myProjects.candidateAccepted"));
 if (selectedProject) {handleInspectApplicants(selectedProject);
}
} else {toast.error(data.error || t("myProjects.failedAccept"));
}
} catch (err) {toast.error(t("myProjects.errorStatusPayload"));
}
};

 const handleRejectApplicant = async (applicationId) => {if (!window.confirm(t("myProjects.confirmReject"))) return;
 try {const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/status`, { credentials:"include",
 method:"POST",
 headers: {"Content-Type":"application/json",
},
 body: JSON.stringify({ status:"Rejected"})
});
 const data = await response.json();
 if (response.ok) {toast.success(t("myProjects.candidateRejected"));
 if (selectedProject) {handleInspectApplicants(selectedProject);
}
} else {toast.error(data.error || t("myProjects.failedReject"));
}
} catch (err) {toast.error(t("myProjects.errorStatusPayload"));
}
};

 const handleOpenReviewModal = (app) => {setActiveAppToReview(app);
 setFeedbackText(app.feedbackText ||"");
 setRating(app.rating || 5);
 setRatingReview(app.ratingReview ||"");
 setShowReviewModal(true);
};

 const handleCompleteTask = async (e) => {e.preventDefault();
 if (!activeAppToReview) return;

 try {const response = await fetch(`${API_BASE_URL}/api/applications/${activeAppToReview.applicationId}/complete`, { credentials:"include",
 method:"POST",
 headers: {"Content-Type":"application/json",
},
 body: JSON.stringify({ feedbackText, rating, ratingReview})
});
 const data = await response.json();
 if (response.ok) {toast.success(t("myProjects.taskCompleted"));
 setShowReviewModal(false);
 setFeedbackText("");
 if (selectedProject) {handleInspectApplicants(selectedProject);
}
} else {toast.error(data.error || t("myProjects.failedComplete"));
}
} catch (err) {toast.error(t("myProjects.errorCompletionPayload"));
}
};

 const handleDeleteProject = async (projectId) => {if (!window.confirm(t("myProjects.confirmDelete"))) return;
 try {const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, { credentials:"include",
 method:"DELETE",
 headers: {}
});
 if (response.ok) {toast.success(t("myProjects.projectDeleted"));
 setSelectedProject(null);
 // Refresh project list
 const savedUser = JSON.parse(localStorage.getItem("user") ||"{}");
 if (savedUser.email) {const res = await fetch(`${API_BASE_URL}/api/projects/company/${savedUser.email}`, { credentials:"include",
 headers: {}
});
 const data = await res.json();
 if (res.ok) setProjects(data);
}
} else {toast.error(t("myProjects.failedDeleteProject"));
}
} catch (err) {toast.error(t("myProjects.errorDeletePayload"));
}
};

 const handleArchiveProject = async (projectId) => {if (!window.confirm(t("myProjects.confirmArchive"))) return;
 try {const response = await fetch(`${API_BASE_URL}/api/projects/archive/${projectId}`, { credentials:"include",
 method:"PUT",
 headers: {}
});
 if (response.ok) {toast.success(t("myProjects.projectArchived"));
 const savedUser = JSON.parse(localStorage.getItem("user") ||"{}");
 if (savedUser.email) {const res = await fetch(`${API_BASE_URL}/api/projects/company/${savedUser.email}`, { credentials:"include",
 headers: {}
});
 const data = await res.json();
 if (res.ok) {setProjects(data);
 const updatedProject = data.find(p => p._id === projectId);
 setSelectedProject(updatedProject || null);
}
}
} else {toast.error(t("myProjects.failedArchiveProject"));
}
} catch (err) {toast.error(t("myProjects.errorArchivePayload"));
}
};

 const handleOpenEditModal = (proj) => {setEditTitle(proj.title);
 setEditDescription(proj.description);
 setEditSkills(proj.requiredSkills?.join(",") ||"");
 setEditBudget(proj.budget);
 setEditDuration(proj.duration);
 setEditDeadline(proj.deadline);
 setShowEditModal(true);
};

 const handleSaveEditProject = async (e) => {e.preventDefault();
 if (!selectedProject) return;
 setSubmittingEdit(true);

 const payload = {title: editTitle,
 description: editDescription,
 requiredSkills: editSkills.split(",").map(s => s.trim()).filter(Boolean),
 budget: Number(editBudget),
 duration: editDuration,
 deadline: editDeadline
};

 try {const response = await fetch(`${API_BASE_URL}/api/projects/${selectedProject._id}`, { credentials:"include",
 method:"PUT",
 headers: {"Content-Type":"application/json",
},
 body: JSON.stringify(payload)
});
 const data = await response.json();
 if (response.ok) {toast.success(t("myProjects.projectUpdated"));
 setSelectedProject(data);
 setShowEditModal(false);
 // Refresh project list
 const savedUser = JSON.parse(localStorage.getItem("user") ||"{}");
 if (savedUser.email) {const res = await fetch(`${API_BASE_URL}/api/projects/company/${savedUser.email}`, { credentials:"include",
 headers: {}
});
 const projectsData = await res.json();
 if (res.ok) setProjects(projectsData);
}
} else {toast.error(t("myProjects.failedUpdateProject"));
}
} catch (err) {toast.error(t("myProjects.errorSavingProject"));
} finally {setSubmittingEdit(false);
}
};

 return (
 <div className="min-h-screen bg-transparent py-8 font-sans select-none">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 
 {/* Navigation back home Header */}
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-4 sm:p-6 rounded-xl shadow-sm">
 <div>
 <h1 className="text-xl sm:text-2xl font-bold text-ink-800">{t("myProjects.title")}</h1>
 <p className="text-[11px] sm:text-xs text-ink-500 mt-0.5">{t("myProjects.subtitle")}</p>
 </div>
 <button onClick={() => navigate("/company-dashboard")} className="w-full sm:w-auto text-center text-xs font-bold bg-marigold-500 hover:bg-marigold-600 text-white px-4 py-2.5 rounded-xl transition shadow-sm">
 ← {t("myProjects.backToCommandCenter")}
 </button>
 </div>

 {errorMessage && <div className="p-4 mb-6 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100">⚠️ {errorMessage}</div>}

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 
 {/* Left Column: Historical Deployments List */}
 <div className="lg:col-span-1 space-y-4">
 <h3 className="text-sm font-bold text-ink-700 uppercase tracking-wider mb-2 px-1">{t("myProjects.activeDeployments")}</h3>
 
 {loadingProjects ? (
 <div className="text-center py-6 text-xs text-ink-500 font-medium animate-pulse">{t("myProjects.syncingNodes")}</div>
 ) : projects.length === 0 ? (
    <div className="wm-panel p-[48px_24px] text-center max-w-md mx-auto my-6 flex flex-col items-center justify-center">
      <div className="w-[48px] h-[48px] rounded-xl bg-[#FBE7C4] flex items-center justify-center text-[#F5A623] shadow-sm">
        <Briefcase size={24} />
      </div>
      <div className="mt-4">
        <h3 className="text-[16px] font-medium text-[#1B2333] mb-[6px]">{t("No projects deployed yet")}</h3>
        <p className="text-[13px] text-[#6B7280] leading-[1.65] max-w-[260px] mx-auto">
          {t("Deploy your first corporate gig to hire verified college students.")}
        </p>
      </div>
      <button onClick={() => navigate('/add-project')} className="wm-btn wm-btn-primary mt-[20px] active:scale-95">
        {t("Deploy a project")}
      </button>
    </div>
 ) : (
 projects.map((proj) => (
 <div 
 key={proj._id} 
 onClick={() => handleInspectApplicants(proj)}
 className={`p-5 rounded-xl border bg-white shadow-sm cursor-pointer transition transform hover:-tranink-y-0.5 ${selectedProject?._id === proj._id ?"ring-2 ring-marigold-500 border-transparent" :"hover:border-marigold-300"}`}
 >
 <h4 className="font-bold text-ink-900 text-sm mb-1">{proj.title}</h4>
 <p className="text-[11px] text-ink-500 line-clamp-2 leading-relaxed mb-3">{proj.description}</p>
 <div className="flex justify-between items-center text-[10px] text-ink-400 font-bold uppercase tracking-wide border-t pt-2.5">
 <span>💼 {proj.workType}</span>
 <span className="text-marigold-500">{t("myProjects.inspectApplications")} →</span>
 </div>
 </div>
 ))
 )}
 </div>

 {/* Right Column: Applicants Table and Match Analytics Display */}
 <div className="lg:col-span-2">
 {!selectedProject ? (
 <div className="bg-white rounded-xl border-2 border-dashed p-12 text-center text-ink-400 font-medium h-full flex flex-col justify-center items-center">
 <span>📁 {t("myProjects.selectProjectMessage")}</span>
 </div>
 ) : (
 <div className="bg-white rounded-xl shadow-sm p-6 border border-ink-100">
 <div className="border-b pb-4 mb-6">
 <div className="flex justify-between items-start gap-4">
 <div>
 <span className="bg-marigold-100 text-marigold-800 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">{t("myProjects.selectedStream")}</span>
 <h2 className="text-xl font-bold text-ink-900 mt-2">{selectedProject.title}</h2>
 </div>
 <div className="flex gap-2">
 <button 
 onClick={() => handleOpenEditModal(selectedProject)}
 className="px-2.5 py-1.5 border border-ink-200 text-ink-600 hover:bg-ink-50 rounded-lg text-xs font-bold transition flex items-center gap-1"title={t("myProjects.editProjectDetails")}
 >
 ✏️ {t("myProjects.edit")}
 </button>
 {selectedProject.status !=="Archived" && (
 <button 
 onClick={() => handleArchiveProject(selectedProject._id)}
 className="px-2.5 py-1.5 border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg text-xs font-bold transition flex items-center gap-1"title={t("myProjects.archiveProject")}
 >
 📦 {t("myProjects.archive")}
 </button>
 )}
 <button 
 onClick={() => handleDeleteProject(selectedProject._id)}
 className="px-2.5 py-1.5 border border-red-100 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition flex items-center gap-1"title={t("myProjects.deleteProjectStack")}
 >
 🗑️ {t("myProjects.delete")}
 </button>
 </div>
 </div>
 <p className="text-xs text-ink-500 mt-1.5">{t("myProjects.duration")}: {selectedProject.duration} | {t("myProjects.budget")}: ₹{selectedProject.budget.toLocaleString()}</p>
 </div>

 {loadingApplicants ? (
 <div className="text-center py-12 text-xs text-ink-500 font-medium animate-pulse">{t("myProjects.parsingApplicants")}</div>
 ) : applicants.length === 0 ? (
    <div className="wm-panel p-[48px_24px] text-center max-w-md mx-auto my-6 flex flex-col items-center justify-center">
      <div className="w-[48px] h-[48px] rounded-xl bg-[#FBE7C4] flex items-center justify-center text-[#F5A623] shadow-sm">
        <Users size={24} />
      </div>
      <div className="mt-4">
        <h3 className="text-[16px] font-medium text-[#1B2333] mb-[6px]">{t("No applicants yet")}</h3>
        <p className="text-[13px] text-[#6B7280] leading-[1.65] max-w-[260px] mx-auto">
          {t("No students have applied to this project yet. Share it with your network to attract candidates.")}
        </p>
      </div>
    </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs text-ink-600">
 <thead>
 <tr className="bg-ink-50 uppercase text-[10px] font-bold text-ink-400 border-b tracking-wider">
 <th className="p-3">{t("myProjects.studentName")}</th>
 <th className="p-3">{t("myProjects.skillsInventory")}</th>
 <th className="p-3 text-center">{t("myProjects.smartMatch")}</th>
 <th className="p-3 text-center">{t("myProjects.status")}</th>
 <th className="p-3 text-right">{t("myProjects.actions")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-ink-100 font-medium text-ink-700">
 {applicants.map((app) => (
 <tr key={app.applicationId} className="hover:bg-ink-50 transition">
 <td className="p-3">
 <p className="font-bold text-ink-900">{app.studentName}</p>
 <p className="text-[10px] text-ink-400">{app.studentEmail}</p>
 {app.resumeUrl ? (
 <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-marigold-500 font-bold hover:underline block mt-0.5">
 📄 {t("myProjects.viewResume")} ↗
 </a>
 ) : (
 <span className="text-[9px] text-ink-400 italic block mt-0.5">{t("myProjects.noResumeProvided")}</span>
 )}

 {/* Social/Portfolio Links Grid */}
 <div className="flex items-center gap-2 mt-1 text-[9px]">
 {app.githubUrl && (
 <a href={app.githubUrl} target="_blank" rel="noreferrer" className="text-ink-600 hover:text-purple-600 font-bold" title={t("myProjects.github")}>
 <span>💻 {t("myProjects.github")}</span>
 </a>
 )}
 {app.linkedinUrl && (
 <a href={app.linkedinUrl} target="_blank" rel="noreferrer" className="text-marigold-500 hover:text-purple-600 font-bold" title={t("myProjects.linkedin")}>
 <span>👔 {t("myProjects.linkedin")}</span>
 </a>
 )}
 {app.portfolioUrl && (
 <a href={app.portfolioUrl} target="_blank" rel="noreferrer" className="text-green-600 hover:text-purple-600 font-bold" title={t("myProjects.portfolio")}>
 <span>🌐 {t("myProjects.web")}</span>
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
 <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${app.matchScore >= 75 ?"bg-green-100 text-green-800" : app.matchScore >= 40 ?"bg-amber-100 text-amber-800" :"bg-ink-100 text-ink-600"}`}>
 {app.matchScore}%
 </span>
 </td>
 <td className="p-3 text-center">
 <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${app.status ==="Completed" ?"bg-green-100 text-green-800" :
 app.status ==="Submitted" ?"bg-amber-100 text-amber-800" :
 app.status ==="Approved" ?"bg-marigold-100 text-marigold-800" :
 app.status ==="Rejected" ?"bg-red-100 text-red-800" :
"bg-ink-100 text-ink-600"
}`}>
 {app.status}
 </span>
 </td>
 <td className="p-3 text-right space-x-2">
 {app.status ==="Pending" && (
 <>
 <button onClick={() => handleAcceptApplicant(app.applicationId)} className="text-[10px] font-bold bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition shadow-sm">
 {t("myProjects.accept")}
 </button>
 <button onClick={() => handleRejectApplicant(app.applicationId)} className="text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition shadow-sm">
 {t("myProjects.reject")}
 </button>
 </>
 )}
 {app.status ==="Approved" && (
 <span className="text-[11px] text-marigold-500 font-semibold">{t("myProjects.working")}</span>
 )}
 {app.status ==="Submitted" && (
 <button onClick={() => handleOpenReviewModal(app)} className="text-[10px] font-bold bg-marigold-500 hover:bg-marigold-600 text-white px-2.5 py-1 rounded transition shadow-sm">
 {t("myProjects.reviewWork")}
 </button>
 )}
 {app.status ==="Completed" && (
 <span className="text-[11px] text-green-600 font-bold block">✓ {t("myProjects.approved")}</span>
 )}
 {app.status ==="Rejected" && (
 <span className="text-[11px] text-red-600 font-medium">{t("myProjects.rejected")}</span>
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
 {/* 🔍 WORK SUBMISSION REVIEW OVERLAY MODAL */}
 {/* ========================================================================= */}
 {showReviewModal && activeAppToReview && (
 <div className="fixed inset-0 bg-ink-900/50 z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-xl max-w-md w-full shadow-sm p-6 border animate-fade-in text-left">
 <div className="flex justify-between items-center border-b pb-3 mb-4">
 <h3 className="font-bold text-base text-ink-900">{t("myProjects.reviewWorkSubmission")}</h3>
 <button onClick={() => setShowReviewModal(false)} className="text-ink-400 hover:text-ink-600 text-lg">×</button>
 </div>
 <div className="space-y-4">
 <div>
 <p className="text-[10px] uppercase font-bold text-ink-400">{t("myProjects.candidate")}</p>
 <p className="text-xs font-bold text-ink-900">{activeAppToReview.studentName} ({activeAppToReview.studentEmail})</p>
 </div>
 <div>
 <p className="text-[10px] uppercase font-bold text-ink-400">{t("myProjects.submissionLink")}</p>
 <a href={activeAppToReview.submissionLink} target="_blank" rel="noopener noreferrer" className="text-xs text-marigold-500 font-bold hover:underline break-all">
 {activeAppToReview.submissionLink} ↗
 </a>
 </div>
 <div>
 <p className="text-[10px] uppercase font-bold text-ink-400">{t("myProjects.studentExplanationNotes")}</p>
 <p className="text-xs text-ink-700 bg-ink-50 border p-3 rounded-xl whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto">
 {activeAppToReview.submissionText}
 </p>
 </div>
 <form onSubmit={handleCompleteTask} className="space-y-3 pt-2">
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">{t("myProjects.companyFeedback")}</label>
 <textarea
 placeholder={t("myProjects.feedbackPlaceholder")}
 value={feedbackText}
 onChange={(e) => setFeedbackText(e.target.value)}
 rows={2}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400 resize-none"required
 />
 </div>

 {/* Public Star Rating and Review */}
 <div className="border-t pt-2 space-y-2">
 <div>
 <label className="block text-[9px] font-extrabold text-purple-950 uppercase tracking-wider mb-0.5">{t("myProjects.candidateRating")}</label>
 <div className="flex items-center gap-1">
 {[1, 2, 3, 4, 5].map((star) => (
 <button
 key={star}
 type="button"onClick={() => setRating(star)}
 className={`text-xl transition-all outline-none ${star <= rating ?"text-amber-400 scale-105" :"text-ink-200"}`}
 >
 ★
 </button>
 ))}
 <span className="text-[9px] text-ink-400 font-extrabold ml-1.5">({rating} / 5)</span>
 </div>
 </div>

 <div>
 <label className="block text-[9px] font-extrabold text-purple-950 uppercase tracking-wider mb-0.5">{t("myProjects.performanceReviewNotes")}</label>
 <textarea
 placeholder={t("myProjects.ratingReviewPlaceholder")}
 value={ratingReview}
 onChange={(e) => setRatingReview(e.target.value)}
 rows={1}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"/>
 </div>
 </div>
 <div className="flex justify-end space-x-3 pt-2">
 <button
 type="button"onClick={() => setShowReviewModal(false)}
 className="px-4 py-2 border border-ink-200 rounded-xl text-xs font-bold text-ink-500 hover:bg-ink-50 transition">
 {t("myProjects.cancel")}
 </button>
 <button
 type="submit"className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition shadow-md">
 {t("myProjects.approveAndComplete")}
 </button>
 </div>
 </form>
 </div>
 </div>
 </div>
 )}
 {/* ========================================================================= */}

 {/* ========================================================================= */}
 {/* ✏️ PROJECT EDIT OVERLAY MODAL */}
 {/* ========================================================================= */}
 {showEditModal && selectedProject && (
 <div className="fixed inset-0 bg-ink-900/50 z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-xl max-w-lg w-full shadow-sm p-6 border animate-fade-in text-left">
 <div className="flex justify-between items-center border-b pb-3 mb-4">
 <h3 className="font-bold text-base text-ink-900 font-sans">{t("myProjects.editProjectTitle")}</h3>
 <button onClick={() => setShowEditModal(false)} className="text-ink-400 hover:text-ink-600 text-lg">×</button>
 </div>
 <form onSubmit={handleSaveEditProject} className="space-y-4">
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">{t("myProjects.projectTitleLabel")}</label>
 <input
 type="text"value={editTitle}
 onChange={(e) => setEditTitle(e.target.value)}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"required
 />
 </div>

 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">{t("myProjects.descriptionLabel")}</label>
 <textarea
 value={editDescription}
 onChange={(e) => setEditDescription(e.target.value)}
 rows={3}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400 resize-none"required
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">{t("myProjects.budgetPayoutLabel")}</label>
 <input
 type="number"value={editBudget}
 onChange={(e) => setEditBudget(e.target.value)}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"required
 />
 </div>
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">{t("myProjects.durationLabel")}</label>
 <input
 type="text"value={editDuration}
 onChange={(e) => setEditDuration(e.target.value)}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"required
 />
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">{t("myProjects.deadlineDateLabel")}</label>
 <input
 type="text"value={editDeadline}
 onChange={(e) => setEditDeadline(e.target.value)}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"required
 />
 </div>
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">{t("myProjects.requiredSkillsLabel")}</label>
 <input
 type="text"value={editSkills}
 onChange={(e) => setEditSkills(e.target.value)}
 placeholder={t("myProjects.skillsPlaceholder")}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"/>
 </div>
 </div>

 <div className="flex justify-end space-x-3 pt-2">
 <button
 type="button"onClick={() => setShowEditModal(false)}
 className="px-4 py-2 border border-ink-200 rounded-xl text-xs font-bold text-ink-500 hover:bg-ink-50 transition">
 {t("myProjects.cancel")}
 </button>
 <button
 type="submit"disabled={submittingEdit}
 className="px-4 py-2 bg-marigold-500 hover:bg-marigold-600 text-white rounded-xl text-xs font-bold transition shadow-md">
 {submittingEdit ? t("myProjects.saving") : t("myProjects.saveChanges")}
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