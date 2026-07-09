// eslint-disable-next-line no-unused-vars
import { useTranslation} from"react-i18next";
// eslint-disable-next-line no-unused-vars
import { motion} from"framer-motion";
import {Users, CheckCircle, XCircle, MessageCircle, FileText, Mail, Phone,
 AlertTriangle, ArrowLeft, Search, Folder, Check, AlertCircle, Bot,
 Code, Calendar, Monitor, Link, Star, ClipboardCheck, Terminal, X,
 CheckSquare, ShieldCheck, FileCheck, Globe, LayoutDashboard,
 RefreshCw, FileCode, Clock, ArrowRight
} from"lucide-react";
import { useApplicantsHub } from "../hooks/useApplicantsHub";

export default function ApplicantsHub() {
  const {
  // eslint-disable-next-line no-unused-vars
    navigate, t, applications, loading, errorMessage, currentUser,
    searchTerm, setSearchTerm, statusFilter, setStatusFilter,
    projectFilter, setProjectFilter, sortBy, setSortBy, isBlindMode, setIsBlindMode,
  // eslint-disable-next-line no-unused-vars
    showReviewModal, setShowReviewModal, activeAppToReview, setActiveAppToReview,
    feedbackText, setFeedbackText, rating, setRating, ratingReview, setRatingReview,
    submittingReview, showSandbox, setShowSandbox, activeFile, setActiveFile,
    selectedVerIdx, setSelectedVerIdx, handleUpdateStatus, handleDisputeApplication,
    handleOpenReviewModal, handleRequestRevision, handleReviewExtension, handleCompleteReview,
  // eslint-disable-next-line no-unused-vars
    getSubmissionFiles, getMockCodeFiles, uniqueProjectTitles, filteredApps, fetchCompanyApplications
  } = useApplicantsHub();

 const renderStepper = (status) => {const steps = [
 { label: t("applicantsHub.applied"), statusVal:"Pending"},
 { label: t("applicantsHub.approved"), statusVal:"Approved"},
 { label: t("applicantsHub.submitted"), statusVal:"Submitted"},
 { label: t("applicantsHub.completed"), statusVal:"Completed"}
 ];

 if (status ==="Rejected") {return (
 <span className="bg-red-100 text-red-800 text-[9px] font-bold px-2 py-0.5 rounded border border-red-200 uppercase tracking-wider">
 {t("applicantsHub.rejected")}
 </span>
 );
}

 if (status ==="Disputed") {return (
 <span className="bg-rose-100 text-rose-800 text-[9px] font-black px-2.5 py-0.5 rounded-lg border border-rose-200 uppercase tracking-wider animate-pulse flex items-center gap-1">
 <AlertTriangle className="w-3 h-3" /> {t("applicantsHub.flaggedDisputed")}
 </span>
 );
}

 let activeIdx = 0;
 if (status ==="Approved") activeIdx = 1;
 if (status ==="Submitted") activeIdx = 2;
 if (status ==="Completed") activeIdx = 3;

 return (
 <div className="flex items-center space-x-1 text-[8px] sm:text-[9px]">
 {steps.map((step, idx) => {const isCompleted = idx <= activeIdx;
 const isActive = idx === activeIdx;
 return (
 <div key={idx} className="flex items-center space-x-1">
 <span className={`px-1.5 py-0.5 rounded font-extrabold transition-all uppercase tracking-wider ${isActive ?"bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm" :
 isCompleted ?"bg-purple-100 text-purple-700 font-semibold" :
"bg-ink-100 text-ink-400 font-normal"
}`}>
 {step.label}
 </span>
 {idx < steps.length - 1 && (
 <span className={isCompleted ?"text-purple-400 font-bold" :"text-ink-300"}>➔</span>
 )}
 </div>
 );
})}
 </div>
 );
};

 return (
 <motion.div className="min-h-screen bg-transparent font-sans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
 {/* Main Container */}
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
 <div className="wm-panel rounded-xl shadow-sm p-4 sm:p-6 lg:p-8">
 {/* Header */}
 <div className="border-b pb-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-black text-ink-800 tracking-tight flex items-center gap-3">
 <Users className="w-8 h-8 text-marigold-500" />
 <span>{t("applicantsHub.commandCenterTitle")}</span>
 </h1>
 <p className="text-ink-500 mt-1 text-sm">{t("applicantsHub.commandCenterDesc")}</p>
 </div>
 <button
 onClick={() => navigate("/company-dashboard")}
 className="px-4 py-2 bg-ink-100 hover:bg-ink-200 text-ink-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5">
 <ArrowLeft className="w-4 h-4" /> {t("applicantsHub.backToCommandCenter")}
 </button>
 </div>

 {errorMessage && (
     <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
       <div className="flex items-center gap-2">
         <AlertCircle className="w-4 h-4" /> {errorMessage}
       </div>
       <button 
         onClick={() => fetchCompanyApplications(currentUser?.email || JSON.parse(localStorage.getItem("user") || "{}").email)}
         className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[11px] transition active:scale-95 whitespace-nowrap"
       >
         Retry
       </button>
     </div>
   )}

 {/* Search and Filters panel */}
 <div className="wm-panel p-5 rounded-xl mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
 {/* Search Input */}
 <div className="md:col-span-1">
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5">{t("applicantsHub.searchCandidate")}</label>
 <div className="relative">
 <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-400" />
 <input
 type="text"placeholder={t("applicantsHub.searchPlaceholder")}
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full bg-white/50 border border-ink-200 text-xs pl-9 pr-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"/>
 </div>
 </div>

 {/* Project Filter */}
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5">{t("applicantsHub.filterByProject")}</label>
 <select
 value={projectFilter}
 onChange={(e) => setProjectFilter(e.target.value)}
 className="w-full bg-white border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400">
 <option value="All">{t("applicantsHub.allProjects")}</option>
 {uniqueProjectTitles.map((title, idx) => (
 <option key={idx} value={title}>{title}</option>
 ))}
 </select>
 </div>

 {/* Status Filter */}
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5">{t("applicantsHub.filterByStatus")}</label>
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="w-full bg-white border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400">
 <option value="All">{t("applicantsHub.allStatuses")}</option>
 <option value="Pending">{t("applicantsHub.statusPending")}</option>
 <option value="Approved">{t("applicantsHub.statusApproved")}</option>
 <option value="Submitted">{t("applicantsHub.statusSubmitted")}</option>
 <option value="Completed">{t("applicantsHub.statusCompleted")}</option>
 <option value="Rejected">{t("applicantsHub.statusRejected")}</option>
 </select>
 </div>

 {/* Sort Filter */}
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5">{t("applicantsHub.sortCandidatesBy")}</label>
 <select
 value={sortBy}
 onChange={(e) => setSortBy(e.target.value)}
 className="w-full bg-white border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400">
 <option value="match">{t("applicantsHub.sortMatchScore")}</option>
 <option value="date">{t("applicantsHub.sortAppDate")}</option>
 </select>
 </div>

 {/* Blind Review Mode Toggle */}
 <div className="flex items-center gap-2 pt-4">
 <input
 type="checkbox"id="blindModeToggle"checked={isBlindMode}
 onChange={(e) => setIsBlindMode(e.target.checked)}
 className="w-4 h-4 accent-marigold-600 cursor-pointer"/>
 <label htmlFor="blindModeToggle" className="text-[9px] font-black text-ink-500 uppercase cursor-pointer select-none flex items-center gap-1">
 <ShieldCheck className="w-3 h-3" /> {t("applicantsHub.blindReview")}
 </label>
 </div>
 </div>

 {/* Table / List layout */}
 {loading ? (
 <div className="space-y-4">
 {[1, 2, 3].map((i) => (
 <div key={i} className="skeleton-loader h-32 rounded-xl w-full wm-panel"></div>
 ))}
 </div>
 ) : filteredApps.length === 0 ? (
     <div className="wm-panel p-[40px_24px] text-center max-w-md mx-auto my-6 flex flex-col items-center justify-center">
       <div className="w-[48px] h-[48px] rounded-xl bg-[#FBE7C4] flex items-center justify-center text-[#F5A623] shadow-sm mb-4">
         <Folder className="w-6 h-6" />
       </div>
       <div>
         <h3 className="text-[16px] font-medium text-[#1B2333] mb-[6px]">{t("applicantsHub.noCandidates")}</h3>
         <p className="text-[13px] text-[#6B7280] leading-[1.65] max-w-[260px] mx-auto">
           No students have applied to this project yet. Share it with your network to attract candidates.
         </p>
       </div>
     </div>
   ) : (
 <div className="space-y-4">
 {filteredApps.map((app) => (
 <div
 key={app.applicationId}
 className="wm-panel wm-card rounded-xl p-6 flex flex-col lg:flex-row justify-between gap-6">
 {/* Left block: student details & project */}
 <div className="space-y-4 flex-1">
 <div className="flex flex-wrap items-center gap-2">
 <span className="bg-marigold-50/50 text-marigold-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase border border-marigold-100 flex items-center gap-1">
 <Folder className="w-3 h-3" /> {app.projectTitle}
 </span>
 {renderStepper(app.status)}
 </div>

 <div>
 <div className="flex items-center gap-2">
 <h4 
 onClick={() => {if (!isBlindMode) navigate(`/student-profile/${app.studentEmail}`);
}}
 className={`text-lg font-bold text-ink-900 ${isBlindMode ?"" :"hover:text-marigold-500 cursor-pointer hover:underline"}`}
 >
 {isBlindMode ? t("applicantsHub.developerNumber", { id: app.applicationId.slice(-4).toUpperCase()}) : app.studentName}
 </h4>
 {!isBlindMode && (
 <button
 onClick={() => navigate(`/chat/${app.studentEmail}`)}
 className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold border border-purple-200 px-2.5 py-0.5 rounded-full transition shadow-sm">{t("applicantsHub.chat")}</button>
 )}
 </div>
 <p className="text-xs text-ink-400 font-medium">
 {isBlindMode ? t("applicantsHub.mockEmail") : app.studentEmail}
 </p>
 {!isBlindMode && app.collegeName && (
    <div className="mt-2 select-none" style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      background: '#E1F5EE', border: '0.5px solid #1D9E75',
      borderRadius: 10, padding: '8px 14px'
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%', background: '#1D9E75',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span>
      </div>
      <div className="text-left">
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#085041', lineHeight: 1.3 }}>College verified</p>
        <p style={{ margin: 0, fontSize: 11, color: '#1D9E75', lineHeight: 1.3 }}>{app.collegeName}</p>
      </div>
    </div>
  )}
 </div>

 <div>
 <span className="text-[10px] uppercase font-bold text-ink-400 block mb-1">{t("applicantsHub.declaredSkills")}</span>
 <div className="flex flex-wrap gap-1">
 {(app.skills ||"").split(",").map(s => s.trim()).filter(Boolean).map((skill, idx) => (
 <span key={idx} className="bg-ink-50 text-ink-600 text-[10px] font-medium px-2 py-0.5 rounded border border-ink-100">
 {skill}
 </span>
 ))}
 </div>
 </div>

 {app.aiRationale && (
 <div className="bg-purple-50/40 border border-purple-100 p-3 rounded-xl text-left max-w-lg mt-2">
 <p className="text-[9px] font-extrabold text-purple-950 flex items-center gap-1 uppercase tracking-wider">
 <Bot className="w-3 h-3" /> {t("applicantsHub.aiMatchingInsights")}
 </p>
 <p className="text-[10px] text-purple-700 font-semibold leading-relaxed mt-0.5">
 {app.aiRationale}
 </p>
 </div>
 )}
 </div>

 {/* Middle block: Matching Score Gauge */}
 <div className="flex flex-row lg:flex-col justify-between lg:justify-center items-center gap-2 border-t lg:border-t-0 lg:border-l lg:border-r border-ink-100 pt-4 lg:pt-0 px-0 lg:px-8 min-w-[120px]">
 <div className="text-left lg:text-center">
 <span className="text-[9px] uppercase font-bold text-ink-400 block">{t("applicantsHub.matchScore")}</span>
 <span className={`text-2xl font-black ${app.matchScore >= 75 ?"text-green-600" :
 app.matchScore >= 50 ?"text-amber-500" :
"text-ink-400"
}`}>
 {app.matchScore}%
 </span>
 </div>
 
 <div className="w-16 bg-ink-100 h-1.5 rounded-full overflow-hidden">
 <div 
 className={`h-full ${app.matchScore >= 75 ?"bg-green-500" :
 app.matchScore >= 50 ?"bg-amber-400" :
"bg-ink-300"
}`}
 style={{ width:`${app.matchScore}%`}}
 />
 </div>
 </div>

 {/* Right block: Action links & buttons */}
 <div className="flex flex-col justify-between items-stretch lg:items-end gap-4 border-t lg:border-t-0 border-ink-100 pt-4 lg:pt-0 min-w-[200px]">
 <div className="text-left lg:text-right space-y-1.5">
 <p className="text-[10px] text-ink-400 font-bold">{t("applicantsHub.appliedLabel")} {new Date(app.appliedAt).toLocaleDateString()}</p>
 {app.resumeUrl ? (
 <a
 href={app.resumeUrl}
 target="_blank"rel="noreferrer"className="text-xs font-bold text-marigold-500 hover:text-marigold-800 transition flex items-center gap-1 hover:underline">
 <FileText className="w-3 h-3" /> {t("applicantsHub.viewResume")} ↗
 </a>
 ) : (
 <span className="text-xs text-ink-400 italic flex items-center gap-1"><FileText className="w-3 h-3 opacity-50" /> {t("applicantsHub.noResume")}</span>
 )}

 {/* Social/Portfolio Links Grid */}
 <div className="flex items-center lg:justify-end gap-3 mt-1.5 text-[10px]">
 {app.githubUrl && (
 <a href={app.githubUrl} target="_blank" rel="noreferrer" className="text-ink-600 hover:text-purple-600 font-semibold flex items-center gap-1" title={t("applicantsHub.github")}>
 <Github className="w-3 h-3" /> <span className="hover:underline">{t("applicantsHub.github")}</span>
 </a>
 )}
 {app.linkedinUrl && (
 <a href={app.linkedinUrl} target="_blank" rel="noreferrer" className="text-marigold-500 hover:text-purple-600 font-semibold flex items-center gap-1" title={t("applicantsHub.linkedin")}>
 <Linkedin className="w-3 h-3" /> <span className="hover:underline">{t("applicantsHub.linkedin")}</span>
 </a>
 )}
 {app.portfolioUrl && (
 <a href={app.portfolioUrl} target="_blank" rel="noreferrer" className="text-green-600 hover:text-purple-600 font-semibold flex items-center gap-1" title={t("applicantsHub.portfolio")}>
 <Globe className="w-3 h-3" /> <span className="hover:underline">{t("applicantsHub.portfolio")}</span>
 </a>
 )}
 </div>
 </div>
 
 {/* Render pending extension requests if any */}
 {app.extensionRequests && app.extensionRequests.length > 0 && app.extensionRequests[app.extensionRequests.length - 1].status ==="Pending" && (
 <div className="mt-3 bg-marigold-50 border border-marigold-100 p-3.5 rounded-xl text-xs text-ink-800 space-y-2 animate-fade-in w-full text-left">
 <div>
 <span className="font-extrabold text-marigold-700 flex items-center gap-1 mb-0.5"><Clock className="w-3 h-3" /> {t("applicantsHub.extensionRequested")}</span>
 <p className="text-[11px] text-ink-600 leading-normal">
 {t("applicantsHub.wants")} <strong>{app.extensionRequests[app.extensionRequests.length - 1].requestedDays} {t("applicantsHub.moreDays")}</strong>. {t("applicantsHub.reason")}:"{app.extensionRequests[app.extensionRequests.length - 1].reason}"</p>
 </div>
 <div className="flex gap-2">
 <button
 onClick={() => handleReviewExtension(app.applicationId, app.extensionRequests[app.extensionRequests.length - 1]._id,"Rejected")}
 className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[10px] font-bold rounded-lg transition">{t("applicantsHub.deny")}</button>
 <button
 onClick={() => handleReviewExtension(app.applicationId, app.extensionRequests[app.extensionRequests.length - 1]._id,"Approved")}
 className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition shadow-sm">{t("applicantsHub.approve")}</button>
 </div>
 </div>
 )}

 {/* Button matrices based on application states */}
 <div className="flex gap-2 mt-2 w-full">
 {app.status ==="Pending" && (
 <>
 <button
 onClick={() => handleUpdateStatus(app.applicationId,"Rejected")}
 className="flex-1 lg:flex-initial px-3.5 py-2 border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs rounded-xl transition">{t("applicantsHub.reject")}</button>
 <button
 onClick={() => handleUpdateStatus(app.applicationId,"Approved")}
 style={{ background: "#F5A623", color: "#1B2333" }} className="flex-1 lg:flex-initial px-4 py-2 font-bold text-xs rounded-xl transition shadow-sm">{t("applicantsHub.accept")}</button>
 </>
 )}

 {app.status ==="Approved" && (
 <div className="w-full text-left">
 <span className="text-xs font-bold text-marigold-500/80 bg-marigold-50 px-3 py-1.5 rounded-lg border border-marigold-100 inline-flex items-center gap-1">
 <CheckCircle className="w-3 h-3" /> {t("applicantsHub.approvedAwaiting")}
 </span>
 {app.extendedDeadline && (
 <p className="text-[10px] text-marigold-500 mt-1 font-bold flex items-center gap-1">
 <Calendar className="w-3 h-3" /> {t("applicantsHub.extendedDeadline")} {new Date(app.extendedDeadline).toLocaleDateString()}
 </p>
 )}
 </div>
 )}

 {app.status ==="Submitted" && (
 <button
 onClick={() => handleOpenReviewModal(app)}
 className="w-full lg:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5">
 <Search className="w-3 h-3" /> {t("applicantsHub.auditApproveWork")}
 </button>
 )}

 {app.status ==="Flagged" && (
 <button
 onClick={() => handleOpenReviewModal(app)}
 className="w-full lg:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-sm animate-pulse flex items-center justify-center gap-1.5">
 <AlertTriangle className="w-3 h-3" /> {t("applicantsHub.plagiarismAlert", { score: app.plagiarismScore || 0})}
 </button>
 )}

 {app.status ==="Completed" && (
 <div className="text-left lg:text-right flex flex-col items-start lg:items-end">
 <span className="text-xs font-extrabold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 mb-1 inline-flex items-center gap-1">
 <CheckCircle className="w-3 h-3" /> {t("applicantsHub.taskVerified")}
 </span>
 {app.feedbackText && (
 <p className="text-[10px] text-ink-400 italic max-w-[200px] truncate" title={app.feedbackText}>
"{app.feedbackText}"</p>
 )}
 </div>
 )}

 {app.status ==="Rejected" && (
 <span className="text-xs font-bold text-red-600/80 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 inline-flex items-center gap-1 h-fit">
 <XCircle className="w-3 h-3" /> {t("applicantsHub.rejectedMark")}
 </span>
 )}

 {app.status ==="Revision Requested" && (
 <span className="text-xs font-bold text-amber-600/80 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 inline-flex items-center gap-1 h-fit">
 <RefreshCw className="w-3 h-3" /> {t("applicantsHub.revisionRequestedStatus")}
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
 <div className="fixed inset-0 bg-ink-900/50 z-50 flex items-center justify-center p-4">
 <div className="wm-panel rounded-xl max-w-lg w-full shadow-sm p-6 animate-fade-in">
 <div className="flex justify-between items-center border-b pb-3 mb-4">
 <h3 className="font-bold text-base text-ink-900">{t("applicantsHub.verifySolutionTitle")} {activeAppToReview.studentName}</h3>
 <button onClick={() => { setShowReviewModal(false); setFeedbackText(""); setRating(0); setRatingReview("");}} className="text-ink-400 hover:text-ink-600">
 <X className="w-5 h-5" />
 </button>
 </div>
 
 {/* Version History Selector */}
 {activeAppToReview.submissionVersions && activeAppToReview.submissionVersions.length > 1 && (
 <div className="mb-3 flex items-center justify-between bg-marigold-50/50 border border-marigold-100 p-2.5 rounded-xl text-xs">
 <span className="text-[10px] font-black text-marigold-700 uppercase tracking-wider">{t("applicantsHub.solutionIterations")}</span>
 <select
 value={selectedVerIdx}
 onChange={(e) => setSelectedVerIdx(Number(e.target.value))}
 className="bg-white border text-xs px-2 py-1 rounded-lg outline-none font-bold cursor-pointer">
 {activeAppToReview.submissionVersions.map((v, i) => (
 <option key={i} value={i}>
 {t("applicantsHub.version", { num: i + 1, date: new Date(v.submittedAt).toLocaleDateString()})}
 </option>
 ))}
 </select>
 </div>
 )}

 {/* Submission information summary */}
 {(() => {const hasVersions = activeAppToReview.submissionVersions && activeAppToReview.submissionVersions.length > 0;
 const currentVer = hasVersions && selectedVerIdx >= 0 && selectedVerIdx < activeAppToReview.submissionVersions.length
 ? activeAppToReview.submissionVersions[selectedVerIdx]
 : activeAppToReview;

 return (
 <div className="bg-ink-50 border border-ink-100 p-4 rounded-xl mb-4 space-y-3 text-xs">
 <p className="text-ink-700">
 <strong className="text-ink-900">{t("applicantsHub.projectGigs")}</strong> {activeAppToReview.projectTitle}
 </p>
 <div className="flex justify-between items-center gap-2">
 <p className="text-ink-700 truncate flex-1">
 <strong className="text-ink-900">{t("applicantsHub.submittedUrl")}</strong>{""}
 <a href={currentVer.submissionLink} target="_blank" rel="noreferrer" className="text-marigold-500 hover:underline break-all font-bold">
 {currentVer.submissionLink} ↗
 </a>
 </p>
 <button
 type="button"onClick={() => {const files = getSubmissionFiles(activeAppToReview);
 setActiveFile(Object.keys(files)[0] ||"submission.txt");
 setShowSandbox(true);
}}
 className="px-2.5 py-1 bg-ink-900 hover:bg-ink-800 text-white rounded-lg text-[9px] font-bold transition shadow-sm shrink-0 flex items-center gap-1.5">
 <Terminal className="w-3 h-3" /> {t("applicantsHub.auditSandbox")}
 </button>
 </div>
 {currentVer.githubRepoUrl && (
 <p className="text-ink-700">
 <strong className="text-ink-900">{t("applicantsHub.githubRepo")}</strong>{""}
 <a href={currentVer.githubRepoUrl} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline break-all font-bold">
 {currentVer.githubRepoUrl} ↗
 </a>
 </p>
 )}
 {currentVer.liveDeploymentUrl && (
 <p className="text-ink-700">
 <strong className="text-ink-900">{t("applicantsHub.livePreview")}</strong>{""}
 <a href={currentVer.liveDeploymentUrl} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline break-all font-bold">
 {currentVer.liveDeploymentUrl} ↗
 </a>
 </p>
 )}
 <p className="text-ink-700 leading-normal">
 <strong className="text-ink-900">{t("applicantsHub.solutionDescription")}</strong> {currentVer.submissionText}
 </p>

 {/* Rubric display */}
 {currentVer.selfAssessment && (
 <div className="bg-white border rounded-xl p-3 space-y-1.5">
 <span className="text-[9px] font-bold text-ink-400 uppercase tracking-wider block">{t("applicantsHub.studentRubric")}</span>
 <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
 <div className="bg-ink-50 p-1.5 rounded-lg">
 <p className="text-ink-400 font-bold">{t("applicantsHub.codeQuality")}</p>
 <p className="font-extrabold text-marigold-700 mt-0.5">{currentVer.selfAssessment.codeQuality ||"N/A"}/10</p>
 </div>
 <div className="bg-ink-50 p-1.5 rounded-lg">
 <p className="text-ink-400 font-bold">{t("applicantsHub.correctness")}</p>
 <p className="font-extrabold text-marigold-700 mt-0.5">{currentVer.selfAssessment.correctness ||"N/A"}/10</p>
 </div>
 <div className="bg-ink-50 p-1.5 rounded-lg">
 <p className="text-ink-400 font-bold">{t("applicantsHub.docs")}</p>
 <p className="font-extrabold text-marigold-700 mt-0.5">{currentVer.selfAssessment.documentation ||"N/A"}/10</p>
 </div>
 </div>
 </div>
 )}

 {/* AI Declaration summary */}
 {currentVer.aiDeclaration && (
 <div className={`p-2.5 rounded-xl border text-[11px] ${currentVer.aiDeclaration.usedAi
 ?"bg-amber-50 border-amber-100 text-amber-900":"bg-green-50/50 border-green-100 text-green-800"
}`}>
 <p className="font-bold flex items-center gap-1.5">
 {currentVer.aiDeclaration.usedAi
 ? <><Bot className="w-3 h-3" /> {t("applicantsHub.aiCoauthored", { percentage: currentVer.aiDeclaration.aiPercentage, tools: currentVer.aiDeclaration.toolsUsed})}</>
 : <><CheckCircle className="w-3 h-3" /> {t("applicantsHub.pureHuman")}</>}
 </p>
 </div>
 )}

 {/* Plagiarism Checker readout */}
 {activeAppToReview.plagiarismScore > 0 && (
 <div className={`p-2.5 rounded-xl border text-[11px] ${activeAppToReview.plagiarismScore > 20
 ?"bg-red-50 border-red-100 text-red-800 font-extrabold":"bg-ink-50 border-ink-200 text-ink-700"
}`}>
 <p className="flex items-start gap-1.5">
 <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
 <span>
 {t("applicantsHub.codeSimilarityAudit", { score: activeAppToReview.plagiarismScore})}
 {activeAppToReview.plagiarismScore > 20 && t("applicantsHub.highMatchWarning")}
 </span>
 </p>
 </div>
 )}

 {/* Automated Linter readout */}
 {activeAppToReview.lintWarnings && activeAppToReview.lintWarnings.length > 0 && (
 <div className="bg-amber-50/50 border border-amber-150 text-amber-900 p-2.5 rounded-xl text-[11px] text-left">
 <p className="font-extrabold mb-1 flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> {t("applicantsHub.syntaxLintAdvisories")}</p>
 <ul className="list-disc pl-4 space-y-0.5">
 {activeAppToReview.lintWarnings.map((w, idx) => (
 <li key={idx}>{w}</li>
 ))}
 </ul>
 </div>
 )}

 {/* AI Auditor Feedback readout */}
 {activeAppToReview.matchScore !== null && activeAppToReview.matchScore !== undefined && (
 <div className="bg-marigold-50 border border-marigold-100 p-2.5 rounded-xl text-[11px] text-marigold-950 text-left">
 <p className="font-extrabold flex items-center gap-1.5"><Bot className="w-3 h-3" /> {t("applicantsHub.aiAuditorReport")}</p>
 <p className="mt-0.5">{t("applicantsHub.grade")}: <strong>{activeAppToReview.matchScore}/100</strong>. {t("applicantsHub.rationale")}:"{activeAppToReview.aiRationale || t('applicantsHub.noDescription')}"</p>
 </div>
 )}

 {/* Figma Live Embed preview */}
 {currentVer.submissionLink && (currentVer.submissionLink.includes("figma.com") || currentVer.submissionLink.includes("figma.fun")) && (
 <div className="border rounded-xl overflow-hidden mt-3 shadow-sm bg-white">
 <p className="text-[9px] uppercase font-bold text-ink-400 bg-ink-100 px-3 py-1.5 border-b select-none flex items-center gap-1.5"><FileCheck className="w-3 h-3" /> {t("applicantsHub.figmaLivePreview")}</p>
 <iframe
 src={`https://www.figma.com/embed?embed_host=workmitra&url=${encodeURIComponent(currentVer.submissionLink)}`}
 width="100%"height="260"allowFullScreen
 className="bg-ink-50 border-0"/>
 </div>
 )}

 <p className="text-ink-400 text-[10px] pt-1">
 {t("applicantsHub.submittedOn")} {new Date(currentVer.submittedAt || activeAppToReview.submittedAt).toLocaleString()}
 </p>
 </div>
 );
})()}

 <form onSubmit={handleCompleteReview} className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-ink-500 uppercase mb-1">{t("applicantsHub.verifyFeedbackTitle")}</label>
 <textarea
 placeholder={t("applicantsHub.verifyFeedbackPlaceholder")}
 value={feedbackText}
 onChange={(e) => setFeedbackText(e.target.value)}
 rows={3}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400 resize-none"required
 />
 </div>

 {/* Public Star Rating and Review */}
 <div className="border-t pt-3 space-y-3">
 <div>
 <label className="block text-[10px] font-extrabold text-purple-950 uppercase tracking-wider mb-1">{t("applicantsHub.candidateRating")}</label>
 <div className="flex items-center gap-1">
 {[1, 2, 3, 4, 5].map((star) => (
 <button
 key={star}
 type="button"onClick={() => setRating(star)}
 className={`transition-all outline-none ${star <= rating ?"text-amber-400 scale-105" :"text-ink-200"}`}
 >
 <Star className={`w-6 h-6 ${star <= rating ?"fill-current" :""}`} />
 </button>
 ))}
 <span className="text-[10px] text-ink-400 font-extrabold ml-2">({rating} / 5 {t("applicantsHub.stars")})</span>
 </div>
 </div>

 <div>
 <label className="block text-[10px] font-extrabold text-purple-950 uppercase tracking-wider mb-1">{t("applicantsHub.performanceReviewTitle")}</label>
 <textarea
 placeholder={t("applicantsHub.performanceReviewPlaceholder")}
 value={ratingReview}
 onChange={(e) => setRatingReview(e.target.value)}
 rows={2}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"/>
 </div>
 </div>
 <div className="flex justify-between items-center w-full pt-2">
 <div className="flex gap-2">
 <button
 type="button"onClick={handleRequestRevision}
 disabled={submittingReview}
 className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50">{t("applicantsHub.requestRevision")}</button>
 <button
 type="button"onClick={handleDisputeApplication}
 disabled={submittingReview}
 className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50">{t("applicantsHub.flagDispute")}</button>
 </div>
 
 <div className="flex gap-2">
 <button
 type="button"onClick={() => { setShowReviewModal(false); setFeedbackText(""); setRating(0); setRatingReview("");}}
 className="px-4 py-2 border border-ink-200 rounded-xl text-xs font-bold text-ink-500 hover:bg-ink-50 transition">{t("applicantsHub.cancel")}</button>
 <button
 type="submit"disabled={submittingReview}
 className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition shadow-md">
 {submittingReview ? t("applicantsHub.processing") : t("applicantsHub.verifyAndComplete")}
 </button>
 </div>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* 💻 Code Sandbox Drawer Overlay */}
 {showSandbox && activeAppToReview && (
 <div className="fixed inset-0 bg-ink-900/60 z-50 flex items-center justify-end p-0 animate-fade-in select-none">
 <div className="bg-ink-955 text-ink-100 w-full max-w-4xl h-full flex flex-col shadow-sm border-l border-ink-800">
 
 {/* Header */}
 <div className="bg-ink-900 border-b border-ink-800 px-6 py-4 flex justify-between items-center">
 <div>
 <h3 className="text-sm font-black uppercase text-marigold-400">{t("applicantsHub.sandboxTitle")}</h3>
 <p className="text-[11px] text-ink-400 mt-0.5">{t("applicantsHub.auditing")}: {activeAppToReview.projectTitle} ({t("applicantsHub.by")} {activeAppToReview.studentName})</p>
 </div>
 <button 
 onClick={() => setShowSandbox(false)}
 className="text-ink-400 hover:text-white font-extrabold text-sm transition flex items-center gap-1.5">
 {t("applicantsHub.closeSandbox")} <X className="w-4 h-4" />
 </button>
 </div>

 {/* Split Panel: Sidebar (left) and Editor + Checklist (right) */}
 <div className="flex-1 flex overflow-hidden">
 
 {/* File tree sidebar explorer */}
 <div className="w-56 bg-ink-900/50 border-r border-ink-800 p-4 space-y-4 overflow-y-auto">
 <div>
 <span className="text-[9px] font-black text-ink-500 uppercase tracking-widest block mb-2">{t("applicantsHub.workspaceFiles")}</span>
 <div className="space-y-1.5 text-xs">
 {Object.keys(getSubmissionFiles(activeAppToReview)).map(filename => (
 <button
 key={filename}
 onClick={() => setActiveFile(filename)}
 className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition ${activeFile === filename 
 ?"bg-marigold-500/20 text-marigold-400 border border-marigold-500/30":"text-ink-400 hover:text-ink-200 border border-transparent"
}`}
 >
 <FileCode className="w-3.5 h-3.5" />
 <span className="truncate">{filename}</span>
 </button>
 ))}
 </div>
 </div>

 <div className="border-t border-ink-800 pt-4">
 <span className="text-[9px] font-black text-ink-500 uppercase tracking-widest block mb-2">{t("applicantsHub.checklistAudit")}</span>
 <div className="space-y-2 text-[10px] text-ink-400 font-semibold">
 <p className="flex items-center gap-1.5 text-emerald-500 font-bold"><CheckCircle className="w-3 h-3" /> {t("applicantsHub.securityClean")}</p>
 <p className="flex items-center gap-1.5 text-emerald-500 font-bold"><CheckCircle className="w-3 h-3" /> {t("applicantsHub.lintStandardOk")}</p>
 <p className="flex items-center gap-1.5 text-emerald-500 font-bold"><CheckCircle className="w-3 h-3" /> {t("applicantsHub.dependenciesVerified")}</p>
 </div>
 </div>
 </div>

 {/* Editor panel */}
 <div className="flex-1 flex flex-col bg-ink-950 font-mono text-xs select-text">
 
 {/* File title tab */}
 <div className="bg-ink-900/30 border-b border-ink-800/60 px-4 py-2 text-[11px] text-marigold-400 font-bold">
 {t("applicantsHub.tab")}: {activeFile}
 </div>

 {/* Raw Code output area */}
 <pre className="flex-1 p-6 overflow-y-auto leading-relaxed text-ink-300 bg-ink-950/50 whitespace-pre-wrap">
 <code>
 {getSubmissionFiles(activeAppToReview)[activeFile] ||`// ${t("applicantsHub.fileNotFound")}`}
 </code>
 </pre>
 </div>

 </div>

 {/* Footer containing quick actions */}
 <div className="bg-ink-900 border-t border-ink-800 px-6 py-4 flex justify-between items-center gap-4">
 <span className="text-[10px] text-ink-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
 {t("applicantsHub.escrowActive")} (<ShieldCheck className="w-3 h-3" /> {t("applicantsHub.locked")})
 </span>
 <div className="flex gap-2">
 <button
 onClick={() => {setShowSandbox(false);
 // Open dispute form notes
 setFeedbackText(t("applicantsHub.flaggedSandbox"));
}}
 className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow">{t("applicantsHub.flagDisputeButton")}</button>
 <button
 onClick={() => {setShowSandbox(false);
 setFeedbackText(t("applicantsHub.sandboxPassed"));
}}
 style={{ background: "#F5A623", color: "#1B2333" }} className="px-4 py-2 rounded-xl text-xs font-bold transition shadow">{t("applicantsHub.approveSolution")}</button>
 </div>
 </div>

 </div>
 </div>
 )}
 </motion.div>
 );
}
