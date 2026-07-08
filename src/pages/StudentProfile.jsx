import { useState, useEffect, useMemo} from"react";
import { useParams, useNavigate} from"react-router-dom";
import { API_BASE_URL} from"../config";
import { useToast} from"../components/Toast";
import { useTranslation} from"react-i18next";
import ActivityHeatmap from"../components/ActivityHeatmap";

export default function StudentProfile() {const { email} = useParams();
 const navigate = useNavigate();
 const toast = useToast();
 const { t} = useTranslation();



 const [profileUser, setProfileUser] = useState(null);
 const [currentUser, setCurrentUser] = useState(null);
 const [loading, setLoading] = useState(true);
 const [errorMessage, setErrorMessage] = useState("");
 const [applications, setApplications] = useState([]);
 const [isEditing, setIsEditing] = useState(false);
 const [saving, setSaving] = useState(false);

 // Editable Form fields states
 const [fullName, setFullName] = useState("");
 const [mobile, setMobile] = useState("");
 const [collegeName, setCollegeName] = useState("");
 const [enrollmentNumber, setEnrollmentNumber] = useState("");
 const [skillsInput, setSkillsInput] = useState(""); // comma separated
 const [projectType, setProjectType] = useState("");
 const [resumeUrl, setResumeUrl] = useState("");
 const [githubUrl, setGithubUrl] = useState("");
 const [linkedinUrl, setLinkedinUrl] = useState("");
 const [portfolioUrl, setPortfolioUrl] = useState("");
 const [avatarUrl, setAvatarUrl] = useState("");
 const [bioText, setBioText] = useState("");

 // New Phase 8 states
 const [major, setMajor] = useState("");
 const [currentSemester, setCurrentSemester] = useState("");
 const [vanityUsername, setVanityUsername] = useState("");
 const [videoPitchUrl, setVideoPitchUrl] = useState("");
 const [isProfilePrivate, setIsProfilePrivate] = useState(false);
 const [extracurriculars, setExtracurriculars] = useState("");
 const [preferredTechStack, setPreferredTechStack] = useState("");
 const [availabilitySlots, setAvailabilitySlots] = useState([]);
 const [showVouchModal, setShowVouchModal] = useState(false);
 const [vouchSkills, setVouchSkills] = useState("");
 const [vouchComment, setVouchComment] = useState("");
 const [vouching, setVouching] = useState(false);

 useEffect(() => {const savedUser = JSON.parse(localStorage.getItem("user") ||"{}");
 setCurrentUser(savedUser);
 fetchUserProfile();
}, [email]);

 const fetchUserProfile = async () => {setLoading(true);
 setErrorMessage("");
 try {const url = email.includes("@") 
 ?`${API_BASE_URL}/api/auth/user/${email}`:`${API_BASE_URL}/api/auth/student/vanity/${email}`;

 const res = await fetch(url, { credentials:"include",
 headers: {}
});
 const data = await res.json();
 if (res.ok) {setProfileUser(data);
 // Pre-populate form fields
 setFullName(data.fullName ||"");
 setMobile(data.mobile ||"");
 setCollegeName(data.collegeName ||"");
 setEnrollmentNumber(data.enrollmentNumber ||"");
 setSkillsInput(data.targetSkills ||"");
 setProjectType(data.projectType ||"Remote Track");
 setResumeUrl(data.resumeUrl ||"");
 setGithubUrl(data.githubUrl ||"");
 setLinkedinUrl(data.linkedinUrl ||"");
 setPortfolioUrl(data.portfolioUrl ||"");
 setAvatarUrl(data.avatarUrl ||"");
 setBioText(data.bio ||"");
 setMajor(data.major ||"");
 setCurrentSemester(data.currentSemester ||"");
 setVanityUsername(data.vanityUsername ||"");
 setVideoPitchUrl(data.videoPitchUrl ||"");
 setIsProfilePrivate(data.isProfilePrivate || false);
 setExtracurriculars(data.extracurriculars ? data.extracurriculars.join(",") :"");
 setPreferredTechStack(data.preferredTechStack ? data.preferredTechStack.join(",") :"");
 setAvailabilitySlots(data.availabilitySlots || []);
} else {setErrorMessage(data.error || t("studentProfile.failedToLoadProfile"));
}

 // Load student applications history for ratings & reviews
 const appsRes = await fetch(`${API_BASE_URL}/api/applications/student-details/${email}`, { credentials:"include",
 headers: {}
});
 if (appsRes.ok) {const appsData = await appsRes.json();
 setApplications(appsData);
}
} catch (err) {setErrorMessage(t("studentProfile.errorConnectingToGateway"));
} finally {setLoading(false);
}
};

 const handleSaveProfile = async (e) => {e.preventDefault();
 setSaving(true);
 setErrorMessage("");

 const payload = {fullName,
 mobile,
 collegeName,
 enrollmentNumber,
 targetSkills: skillsInput,
 projectType,
 resumeUrl,
 githubUrl,
 linkedinUrl,
 portfolioUrl,
 avatarUrl,
 bio: bioText,
 major,
 currentSemester,
 vanityUsername: vanityUsername.trim() || null,
 videoPitchUrl,
 isProfilePrivate,
 extracurriculars: extracurriculars.split(",").map(s => s.trim()).filter(Boolean),
 preferredTechStack: preferredTechStack.split(",").map(s => s.trim()).filter(Boolean),
 availabilitySlots
};

 try {const res = await fetch(`${API_BASE_URL}/api/profile/student/${email}`, { credentials:"include",
 method:"PUT",
 headers: {"Content-Type":"application/json",
},
 body: JSON.stringify(payload)
});
 const data = await res.json();
 if (res.ok) {toast.success(t("studentProfile.portfolioUpdated"));
 setProfileUser(data.user);
 setIsEditing(false);
 // If this is the logged-in student, update their cached context in localStorage
 if (currentUser && currentUser.email === email) {const updatedCachedUser = {...currentUser,
 fullName: data.user.fullName,
 collegeName: data.user.collegeName,
 enrollmentNumber: data.user.enrollmentNumber,
 resumeUrl: data.user.resumeUrl,
 resumeText: data.user.resumeText,
 cvReviewReport: data.user.cvReviewReport,
 githubUrl: data.user.githubUrl,
 linkedinUrl: data.user.linkedinUrl,
 portfolioUrl: data.user.portfolioUrl,
 avatarUrl: data.user.avatarUrl,
 hasCompletedProfile: true
};
 localStorage.setItem("user", JSON.stringify(updatedCachedUser));
 setCurrentUser(updatedCachedUser);
}
} else {setErrorMessage(data.error || t("studentProfile.failedToUpdateProfile"));
}
} catch (err) {setErrorMessage(t("studentProfile.errorCommunicatingWithServer"));
} finally {setSaving(false);
}
};

 const isOwner = currentUser && (
 currentUser.email === email || 
 (currentUser.vanityUsername && currentUser.vanityUsername === email) ||
 (profileUser && profileUser.email === currentUser.email)
 );

 const completedTasks = useMemo(() => applications.filter(a => a.status ==="Completed"), [applications]);
 const ratingsList = useMemo(() => completedTasks.filter(a => typeof a.rating ==="number" && a.rating > 0), [completedTasks]);
 const avgRating = useMemo(() => ratingsList.length > 0 ? (ratingsList.reduce((sum, a) => sum + a.rating, 0) / ratingsList.length).toFixed(1) : null, [ratingsList]);

 return (
 <div className="min-h-screen bg-transparent font-sans">

 {/* Main Content */}
 <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 {loading ? (
 <div className="text-center py-16 text-ink-500 font-medium bg-white rounded-xl shadow-sm flex flex-col items-center justify-center space-y-3">
 <div className="w-10 h-10 border-4 border-marigold-500 border-t-transparent rounded-full animate-spin"></div>
 <span>📂 {t("studentProfile.retrievingPortfolioNodes")}</span>
 </div>
 ) : errorMessage ? (
 <div className="bg-white rounded-xl shadow-sm p-8 text-center space-y-4">
 <div className="text-red-500 text-3xl">⚠️</div>
 <p className="text-red-700 font-bold">{errorMessage}</p>
 <button 
 onClick={() => navigate(-1)} 
 className="px-4 py-2 bg-ink-100 hover:bg-ink-200 text-ink-700 rounded-xl text-xs font-bold transition">
 ← {t("studentProfile.goBack")}
 </button>
 </div>
 ) : (
 <div className="space-y-6">
 {/* Header Card */}
 <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-ink-200">
 <div className="flex items-center gap-4">
 {profileUser.avatarUrl ? (
 <img 
 src={profileUser.avatarUrl} 
 alt="Avatar"className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-white"/>
 ) : (
 <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-marigold-600 text-white flex items-center justify-center text-3xl font-black shadow-md">
 {profileUser.fullName ? profileUser.fullName[0].toUpperCase() :"S"}
 </div>
 )}
 <div>
 <div className="flex items-center flex-wrap gap-2">
 <h1 className="text-2xl font-black text-ink-800 tracking-tight">{profileUser.fullName}</h1>
 {profileUser.isEndorsed && (
 <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-full select-none">
 {t("studentProfile.facultyEndorsed")} 🎓
 </span>
 )}
 {profileUser.githubUrl && (
 <a href={profileUser.githubUrl} target="_blank" rel="noreferrer" className="text-ink-600 hover:text-black transition ml-1" title="GitHub">
 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
 </a>
 )}
 {profileUser.linkedinUrl && (
 <a href={profileUser.linkedinUrl} target="_blank" rel="noreferrer" className="text-marigold-500 hover:text-marigold-800 transition" title="LinkedIn">
 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
 </a>
 )}
 </div>
  <div className="flex items-center gap-3 mt-3 select-none bg-[#E1F5EE] border border-[#1D9E75] rounded-[10px] p-[8px_14px] w-fit">
    <div className="w-[22px] h-[22px] rounded-full bg-[#1D9E75] flex items-center justify-center text-white shrink-0 shadow-sm">
      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
    </div>
    <div className="text-left">
      <p className="text-[11px] font-semibold text-[#085041] leading-tight">
        {t("College verified")}
      </p>
      <p className="text-[11px] text-[#1D9E75] leading-tight mt-0.5 font-medium">
        {profileUser.collegeName || "GLA University, Mathura"}
      </p>
    </div>
  </div>
  </div>
 </div>

 {isOwner && !isEditing && (
 <button
 onClick={() => setIsEditing(true)}
 className="px-4 py-2.5 bg-marigold-500 hover:bg-marigold-600 text-white rounded-xl text-xs font-bold transition shadow-md">
 ✏️ {t("studentProfile.editPortfolio")}
 </button>
 )}

 {!isOwner && currentUser?.userRole ==="company" && (
 <button
 onClick={() => navigate(`/chat/${profileUser.email}`)}
 className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5">
 💬 {t("studentProfile.chatWithStudent")}
 </button>
 )}
 </div>

 {/* Main Details Grid */}
 {isEditing ? (
 <form onSubmit={handleSaveProfile} className="bg-white rounded-xl shadow-sm p-6 md:p-8 space-y-6 border border-ink-200">
 <h3 className="text-lg font-bold text-ink-800 border-b pb-3">{t("studentProfile.editPortfolioDetails")}</h3>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Full name */}
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5">{t("studentProfile.fullName")}</label>
 <input
 type="text"value={fullName}
 onChange={(e) => setFullName(e.target.value)}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"required
 />
 </div>

 {/* Mobile */}
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5">{t("studentProfile.mobileNumber")}</label>
 <input
 type="tel"value={mobile}
 onChange={(e) => setMobile(e.target.value)}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"required
 />
 </div>

 {/* College name */}
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5">{t("studentProfile.collegeName")}</label>
 <input
 type="text"value={collegeName}
 onChange={(e) => setCollegeName(e.target.value)}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"required
 />
 </div>

 {/* Enrollment */}
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5">{t("studentProfile.enrollmentNumber")}</label>
 <input
 type="text"value={enrollmentNumber}
 onChange={(e) => setEnrollmentNumber(e.target.value)}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"required
 />
 </div>

 {/* Resume Url */}
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5">{t("studentProfile.resumeLink")}</label>
 <input
 type="url"value={resumeUrl}
 onChange={(e) => setResumeUrl(e.target.value)}
 placeholder="https://drive.google.com/..."className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"/>
 </div>

 {/* Project Type preference */}
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5">{t("studentProfile.workTypePreference")}</label>
 <select
 value={projectType}
 onChange={(e) => setProjectType(e.target.value)}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400">
 <option value="Remote Track">{t("studentProfile.remoteTrack")}</option>
 <option value="On-site Internship">{t("studentProfile.onSiteInternship")}</option>
 <option value="Part-time Gig">{t("studentProfile.partTimeGig")}</option>
 <option value="Hybrid Track">{t("studentProfile.hybridTrack")}</option>
 </select>
 </div>

 {/* GitHub Profile URL */}
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5">{t("studentProfile.githubLink")}</label>
 <input
 type="url"value={githubUrl}
 onChange={(e) => setGithubUrl(e.target.value)}
 placeholder="https://github.com/username"className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"/>
 </div>

 {/* LinkedIn Profile URL */}
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5">{t("studentProfile.linkedinLink")}</label>
 <input
 type="url"value={linkedinUrl}
 onChange={(e) => setLinkedinUrl(e.target.value)}
 placeholder="https://linkedin.com/in/amit-kumar"className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"/>
 </div>

 {/* Portfolio Website URL */}
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5">{t("studentProfile.portfolioLink")}</label>
 <input
 type="url"value={portfolioUrl}
 onChange={(e) => setPortfolioUrl(e.target.value)}
 placeholder="https://username.dev"className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"/>
 </div>

 {/* Avatar URL */}
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5">{t("studentProfile.avatarUrlLabel")}</label>
 <input
 type="url"value={avatarUrl}
 onChange={(e) => setAvatarUrl(e.target.value)}
 placeholder="https://workmitra.me/assets/default-avatar.jpg"className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"/>
 </div>

 {/* Major */}
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5">{t("studentProfile.academicMajor")}</label>
 <input
 type="text"value={major}
 onChange={(e) => setMajor(e.target.value)}
 placeholder={t("studentProfile.majorPlaceholder")}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"/>
 </div>

 {/* Current Semester */}
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5">{t("studentProfile.currentSemesterLabel")}</label>
 <input
 type="text"value={currentSemester}
 onChange={(e) => setCurrentSemester(e.target.value)}
 placeholder={t("studentProfile.semesterPlaceholder")}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"/>
 </div>

 {/* Vanity Handle */}
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5">{t("studentProfile.vanityHandle")}</label>
 <input
 type="text"value={vanityUsername}
 onChange={(e) => setVanityUsername(e.target.value)}
 placeholder={t("studentProfile.vanityPlaceholder")}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"/>
 </div>

 {/* Elevator Pitch Video Link */}
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5">{t("studentProfile.videoPitchLink")}</label>
 <input
 type="url"value={videoPitchUrl}
 onChange={(e) => setVideoPitchUrl(e.target.value)}
 placeholder={t("studentProfile.videoPitchPlaceholder")}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"/>
 </div>

 {/* Preferred Tech Stack */}
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5">{t("studentProfile.preferredTechStackLabel")}</label>
 <input
 type="text"value={preferredTechStack}
 onChange={(e) => setPreferredTechStack(e.target.value)}
 placeholder={t("studentProfile.techStackPlaceholder")}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"/>
 </div>

 {/* Profile Visibility Toggle */}
 <div className="flex items-center gap-3 pt-6">
 <input
 type="checkbox"id="isProfilePrivate"checked={isProfilePrivate}
 onChange={(e) => setIsProfilePrivate(e.target.checked)}
 className="w-4 h-4 accent-marigold-600 cursor-pointer"/>
 <label htmlFor="isProfilePrivate" className="text-xs font-bold text-ink-700 cursor-pointer">
 🔒 {t("studentProfile.markProfilePrivate")}
 </label>
 </div>
 </div>

 {/* Skills input */}
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5">{t("studentProfile.skillsLabel")}</label>
 <input
 type="text"value={skillsInput}
 onChange={(e) => setSkillsInput(e.target.value)}
 placeholder={t("studentProfile.skillsPlaceholder")}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"/>
 </div>

 {/* Extracurricular achievements */}
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5">{t("studentProfile.extracurricularsLabel")}</label>
 <input
 type="text"value={extracurriculars}
 onChange={(e) => setExtracurriculars(e.target.value)}
 placeholder={t("studentProfile.extracurricularsPlaceholder")}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"/>
 </div>

 {/* Availability calendar matrices */}
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-2">{t("studentProfile.availabilitySlotsLabel")}</label>
 <div className="flex gap-2 flex-wrap">
 {["Monday","Tuesday","Wednesday","Thursday","Friday","Weekend"].map((slot) => {const isSelected = availabilitySlots.includes(slot);
 return (
 <button
 key={slot}
 type="button"onClick={() => {if (isSelected) {setAvailabilitySlots(availabilitySlots.filter(s => s !== slot));
} else {setAvailabilitySlots([...availabilitySlots, slot]);
}
}}
 className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border ${isSelected 
 ?"bg-marigold-500 border-marigold-700 text-white":"bg-ink-50 hover:bg-ink-100 text-ink-500 border-ink-200"
}`}
 >
 {slot}
 </button>
 );
})}
 </div>
 </div>

 {/* Bio text */}
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1.5">{t("studentProfile.professionalBio")}</label>
 <textarea
 value={bioText}
 onChange={(e) => setBioText(e.target.value)}
 rows={4}
 placeholder={t("studentProfile.bioPlaceholder")}
 className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400 resize-none"/>
 </div>

 <div className="flex justify-end gap-3 pt-2">
 <button
 type="button"onClick={() => setIsEditing(false)}
 className="px-4 py-2 border border-ink-200 rounded-xl text-xs font-bold text-ink-500 hover:bg-ink-50 transition">
 Cancel
 </button>
 <button
 type="submit"disabled={saving}
 className="px-4 py-2 bg-marigold-500 hover:bg-marigold-600 text-white rounded-xl text-xs font-bold transition shadow-md">
 {saving ?"Saving..." :"Save Details"}
 </button>
 </div>
 </form>
 ) : (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Left Column: Metadata card */}
 <div className="lg:col-span-1 space-y-6">
 <div className="bg-white rounded-xl shadow-sm p-6 border border-ink-200 space-y-5">
 <h3 className="text-sm font-black text-ink-800 uppercase tracking-wider border-b pb-2.5">{t("studentProfile.studentMetadata")}</h3>
 
 {/* Email */}
 <div className="text-xs">
 <span className="text-[10px] uppercase font-bold text-ink-400 block mb-0.5">{t("studentProfile.primaryEmail")}</span>
 <span className="font-bold text-ink-700">{profileUser.email}</span>
 </div>

 {/* Mobile */}
 <div className="text-xs">
 <span className="text-[10px] uppercase font-bold text-ink-400 block mb-0.5">{t("studentProfile.mobileContact")}</span>
 <span className="font-bold text-ink-700">{profileUser.mobile || t("studentProfile.notProvided")}</span>
 </div>

 {/* University */}
 <div className="text-xs">
 <span className="text-[10px] uppercase font-bold text-ink-400 block mb-0.5">{t("studentProfile.universityNode")}</span>
 <span className="font-bold text-ink-700">{profileUser.collegeName || t("studentProfile.notVerified")}</span>
 {profileUser.enrollmentNumber && (
 <p className="text-[10px] text-marigold-500 font-semibold mt-0.5">ID: {profileUser.enrollmentNumber}</p>
 )}
 </div>

 {/* Preference */}
 <div className="text-xs">
 <span className="text-[10px] uppercase font-bold text-ink-400 block mb-0.5">{t("studentProfile.trackPreference")}</span>
 <span className="font-bold text-ink-700">{profileUser.projectType || t("studentProfile.remoteTrack")}</span>
 </div>

 {/* Resume */}
 <div className="text-xs border-t pt-3">
 <span className="text-[10px] uppercase font-bold text-ink-400 block mb-1">{t("studentProfile.resumeFile")}</span>
 {profileUser.resumeUrl ? (
 <a 
 href={profileUser.resumeUrl} 
 target="_blank"rel="noreferrer"className="text-marigold-500 hover:text-marigold-800 font-bold hover:underline flex items-center gap-1">
 📄 {t("studentProfile.openResume")} ↗
 </a>
 ) : (
 <span className="text-ink-400 italic">{t("studentProfile.noResumeUploaded")}</span>
 )}
 </div>

 {/* Performance Rating */}
 <div className="text-xs border-t pt-3">
 <span className="text-[10px] uppercase font-bold text-ink-400 block mb-0.5">{t("studentProfile.ratingScore")}</span>
 {avgRating ? (
 <div className="flex items-center gap-1 mt-0.5">
 <span className="text-amber-500 text-lg">★</span>
 <span className="font-bold text-ink-800 text-sm">{avgRating} / 5</span>
 <span className="text-[10px] text-ink-400 font-medium">({t("studentProfile.reviewsCount", { count: ratingsList.length})})</span>
 </div>
 ) : (
 <span className="text-ink-400 italic">{t("studentProfile.noRatingsYet")}</span>
 )}
 </div>

 {/* Showcase Links */}
 <div className="text-xs border-t pt-3 space-y-2">
 <span className="text-[10px] uppercase font-bold text-ink-400 block mb-1">{t("studentProfile.professionalChannels")}</span>
 <div className="flex flex-col gap-1.5">
 {profileUser.githubUrl ? (
 <a href={profileUser.githubUrl} target="_blank" rel="noreferrer" className="text-ink-700 hover:text-purple-600 font-semibold flex items-center gap-1.5">
 <span>💻 {t("studentProfile.github")}</span> <span className="hover:underline text-[11px] truncate max-w-[130px]">{profileUser.githubUrl.split("/").pop()}</span>
 </a>
 ) : (
 <span className="text-ink-400 italic text-[11px]">{t("studentProfile.noGithubConnected")}</span>
 )}
 {profileUser.linkedinUrl ? (
 <a href={profileUser.linkedinUrl} target="_blank" rel="noreferrer" className="text-marigold-500 hover:text-purple-600 font-semibold flex items-center gap-1.5">
 <span>👔 {t("studentProfile.linkedin")}</span> <span className="hover:underline text-[11px] truncate max-w-[130px]">{profileUser.linkedinUrl.split("/").pop()}</span>
 </a>
 ) : (
 <span className="text-ink-400 italic text-[11px]">{t("studentProfile.noLinkedinConnected")}</span>
 )}
 {profileUser.portfolioUrl ? (
 <a href={profileUser.portfolioUrl} target="_blank" rel="noreferrer" className="text-green-600 hover:text-purple-600 font-semibold flex items-center gap-1.5">
 <span>🌐 {t("studentProfile.website")}</span> <span className="hover:underline text-[11px] truncate max-w-[130px]">{profileUser.portfolioUrl.replace(/^https?:\/\//,"")}</span>
 </a>
 ) : (
 <span className="text-ink-400 italic text-[11px]">{t("studentProfile.noWebsiteConnected")}</span>
 )}
 </div>
 </div>

 {/* Academic info */}
 {(profileUser.major || profileUser.currentSemester) && (
 <div className="text-xs border-t pt-3">
 <span className="text-[10px] uppercase font-bold text-ink-400 block mb-0.5">{t("studentProfile.academicTrack")}</span>
 {profileUser.major && <p className="font-bold text-ink-700">{profileUser.major}</p>}
 {profileUser.currentSemester && <p className="text-[10px] text-ink-500 font-semibold">{profileUser.currentSemester}</p>}
 </div>
 )}

 {/* WorkMitra Readiness Score */}
 <div className="text-xs border-t pt-3 flex flex-col items-center text-center">
 <span className="text-[10px] uppercase font-bold text-ink-400 block mb-2">{t("studentProfile.readinessScore")}</span>
 <div className="relative w-24 h-24 flex items-center justify-center rounded-full border-4 border-marigold-100 bg-marigold-50/20">
 <div className="text-center">
 <span className="text-xl font-black text-marigold-700 block">
 {Math.min(
 1000,
 Math.round(
 200 + 
 (completedTasks.length * 150) + 
 (avgRating ? parseFloat(avgRating) * 80 : 0) + 
 (([
 profileUser.fullName, profileUser.mobile, profileUser.collegeName,
 profileUser.enrollmentNumber, profileUser.targetSkills, profileUser.bio,
 profileUser.githubUrl, profileUser.linkedinUrl, profileUser.portfolioUrl
 ].filter(Boolean).length / 9) * 100)
 )
 )}
 </span>
 <span className="text-[8px] font-bold text-marigold-400 uppercase tracking-widest">/ 1000</span>
 </div>
 </div>
 <p className="text-[9px] text-ink-400 mt-2 font-medium">{t("studentProfile.readinessDescription")}</p>
 </div>

 {/* Download PDF portfolio */}
 <div className="pt-4 border-t print:hidden">
 <button
 onClick={() => window.print()}
 className="w-full py-2 bg-ink-900 hover:bg-ink-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5">
 📄 {t("studentProfile.downloadPdf")}
 </button>
 </div>
 </div>
 </div>

 {/* Right Column: Bio, Skills & AI Critique */}
 <div className="lg:col-span-2 space-y-6">
 {/* Bio & Skills Panel */}
 <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 border border-ink-200 space-y-6">
 <div>
 <h3 className="text-sm font-black text-ink-800 uppercase tracking-wider border-b pb-2.5 mb-4">{t("studentProfile.professionalBio")}</h3>
 <p className="text-sm text-ink-600 leading-relaxed">
 {profileUser.bio || t("studentProfile.noBioWritten")}
 </p>
 </div>

 <div>
 <h3 className="text-sm font-black text-ink-800 uppercase tracking-wider border-b pb-2.5 mb-4">{t("studentProfile.targetSkills")}</h3>
 <div className="flex flex-wrap gap-1.5">
 {profileUser.targetSkills ? (
 profileUser.targetSkills.split(",").map((skill, idx) => (
 <span key={idx} className="bg-marigold-50 text-marigold-700 text-xs font-bold px-3 py-1 rounded-xl border border-marigold-100">
 {skill.trim()}
 </span>
 ))
 ) : (
 <span className="text-xs text-ink-400 italic">{t("studentProfile.noSkillsListed")}</span>
 )}
 </div>
 </div>

 {/* Preferred Tech Stack */}
 {profileUser.preferredTechStack && profileUser.preferredTechStack.length > 0 && (
 <div className="border-t pt-4">
 <h4 className="text-[11px] font-black uppercase text-ink-400 tracking-wider mb-2">{t("studentProfile.preferredTechStackLabel")}</h4>
 <div className="flex flex-wrap gap-1.5">
 {profileUser.preferredTechStack.map((tech, idx) => (
 <span key={idx} className="bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1 rounded-xl border border-purple-100">
 #{tech}
 </span>
 ))}
 </div>
 </div>
 )}

 {/* Extracurriculars */}
 {profileUser.extracurriculars && profileUser.extracurriculars.length > 0 && (
 <div className="border-t pt-4">
 <h4 className="text-[11px] font-black uppercase text-ink-400 tracking-wider mb-2">{t("studentProfile.hackathonsExtraActivities")}</h4>
 <ul className="list-disc list-inside text-xs text-ink-600 space-y-1">
 {profileUser.extracurriculars.map((activity, idx) => (
 <li key={idx} className="font-semibold">{activity}</li>
 ))}
 </ul>
 </div>
 )}

 {/* Availability Timeline matrix */}
 {profileUser.availabilitySlots && profileUser.availabilitySlots.length > 0 && (
 <div className="border-t pt-4">
 <h4 className="text-[11px] font-black uppercase text-ink-400 tracking-wider mb-2">{t("studentProfile.weeklyAvailability")}</h4>
 <div className="flex gap-1.5 flex-wrap">
 {profileUser.availabilitySlots.map((slot, idx) => (
 <span key={idx} className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border border-emerald-100 uppercase">
 {slot}
 </span>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* 🎥 Elevator Pitch Video Player */}
 {profileUser.videoPitchUrl && (
 <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 border border-ink-200 space-y-4 print:hidden">
 <h3 className="text-sm font-black text-ink-800 uppercase tracking-wider border-b pb-2.5">
 🎥 {t("studentProfile.elevatorPitchTitle")}
 </h3>
 <div className="aspect-video w-full rounded-xl overflow-hidden bg-ink-900 border">
 <iframe
 src={profileUser.videoPitchUrl.includes("watch?v=") 
 ? profileUser.videoPitchUrl.replace("watch?v=","embed/") 
 : profileUser.videoPitchUrl
}
 title="Video Pitch"className="w-full h-full"allowFullScreen
 />
 </div>
 </div>
 )}

 {/* 📅 Activity Heatmap */}
 <ActivityHeatmap applications={applications} />

 {/* 📊 Skill Gap Analyzer */}
 <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 border border-ink-200 space-y-4">
 <h3 className="text-sm font-black text-ink-800 uppercase tracking-wider border-b pb-2.5">
 📊 {t("studentProfile.skillGapAnalyzer")}
 </h3>
 <p className="text-[10px] text-ink-400">{t("studentProfile.skillGapDescription")}</p>
 
 <div className="space-y-3">
 <div>
 <div className="flex justify-between text-xs font-bold text-ink-700 mb-1">
 <span>{t("studentProfile.marketMatchScore")}</span>
 <span className="text-marigold-500">{t("studentProfile.matchPercentage")}</span>
 </div>
 <div className="w-full bg-ink-100 h-2 rounded-full overflow-hidden">
 <div className="bg-marigold-500 h-2 rounded-full" style={{ width:"75%"}} />
 </div>
 </div>
 
 <div className="text-xs space-y-2 pt-2 text-ink-600">
 <p className="font-semibold text-emerald-600">✓ {t("studentProfile.inDemandSkillsMet")} {profileUser.targetSkills || t("studentProfile.none")}</p>
 <p className="font-semibold text-amber-600">⚠️ {t("studentProfile.trendingSkillsMissing")}</p>
 </div>
 </div>
 </div>

 {/* 🤝 Peer Endorsements Vouch Log */}
 <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 border border-ink-200 space-y-4">
 <div className="flex justify-between items-center border-b pb-2.5">
 <h3 className="text-sm font-black text-ink-800 uppercase tracking-wider">
 🤝 {t("studentProfile.peerEndorsements", { count: profileUser.softSkillsVouches?.length || 0})}
 </h3>
 {!isOwner && currentUser?.userRole ==="student" && (
 <button
 type="button"onClick={() => {setVouchSkills("");
 setVouchComment("");
 setShowVouchModal(true);
}}
 className="px-2.5 py-1 bg-marigold-500 hover:bg-marigold-600 text-white rounded-lg text-[9px] font-bold transition shadow-sm">
 + {t("studentProfile.vouchPeer")}
 </button>
 )}
 </div>

 {!profileUser.softSkillsVouches || profileUser.softSkillsVouches.length === 0 ? (
 <p className="text-xs text-ink-400 italic">{t("studentProfile.noEndorsementsYet")}</p>
 ) : (
 <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
 {profileUser.softSkillsVouches.map((vouch, idx) => (
 <div key={idx} className="bg-ink-50 border p-3 rounded-xl space-y-1.5 text-left">
 <div className="flex justify-between items-center text-[9px]">
 <span className="font-bold text-ink-400">{t("studentProfile.vouchedByBatchmate")}</span>
 <span className="text-ink-400 font-semibold">{new Date(vouch.createdAt).toLocaleDateString()}</span>
 </div>
 <div className="flex flex-wrap gap-1">
 {vouch.skills.map((vs, sIdx) => (
 <span key={sIdx} className="bg-marigold-50 text-marigold-700 text-[8px] font-black px-1.5 py-0.5 rounded border uppercase">
 {vs}
 </span>
 ))}
 </div>
 <p className="text-xs text-ink-600 leading-relaxed font-semibold italic">
"{vouch.comment}"</p>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* AI Critique Panel */}
 <div className="bg-white border border-ink-200 text-white rounded-xl shadow-sm p-6 md:p-8 space-y-6">
 <div className="flex justify-between items-center border-b border-ink-200 pb-4">
 <div>
 <h3 className="text-base font-bold text-white flex items-center gap-1.5">
 <span>🧠 {t("studentProfile.aiCvCritiqueReport")}</span>
 <span className="bg-marigold-500/20 text-marigold-300 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase border border-marigold-400/20">{t("studentProfile.pro")}</span>
 </h3>
 <p className="text-[10px] text-marigold-300 font-medium mt-0.5">{t("studentProfile.verifiedScore")}</p>
 </div>
 
 {profileUser.cvReviewReport && (
 <div className="flex items-center space-x-3 text-right">
 <div>
 <p className="text-[9px] uppercase font-bold text-marigold-300">{t("studentProfile.qualityScore")}</p>
 <p className="text-2xl font-black text-marigold-400">{profileUser.cvReviewReport.score}/100</p>
 </div>
 <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-white border-2 border-marigold-400">
 <span className="text-[11px] font-black">{profileUser.cvReviewReport.score}%</span>
 </div>
 </div>
 )}
 </div>

 {profileUser.cvReviewReport ? (
 <div className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <h5 className="text-[11px] font-extrabold uppercase text-green-400 mb-2 flex items-center gap-1.5">
 <span>✓ {t("studentProfile.strengths")}</span>
 </h5>
 <ul className="space-y-1.5 text-xs text-ink-300 list-disc list-inside">
 {profileUser.cvReviewReport.strengths?.map((str, idx) => (
 <li key={idx}>{str}</li>
 ))}
 </ul>
 </div>
 <div>
 <h5 className="text-[11px] font-extrabold uppercase text-amber-400 mb-2 flex items-center gap-1.5">
 <span>⚠️ {t("studentProfile.areasOfImprovement")}</span>
 </h5>
 <ul className="space-y-1.5 text-xs text-ink-300 list-disc list-inside">
 {profileUser.cvReviewReport.improvements?.map((imp, idx) => (
 <li key={idx}>{imp}</li>
 ))}
 </ul>
 </div>
 </div>

 <div className="bg-ink-50 border border-ink-200 p-4 rounded-xl">
 <h5 className="text-[10px] font-extrabold uppercase text-marigold-300 mb-1">{t("studentProfile.aiRecommendations")}</h5>
 <p className="text-xs text-ink-200 leading-relaxed italic">
"{profileUser.cvReviewReport.recommendations}"</p>
 </div>
 </div>
 ) : (
 <div className="text-center py-8 text-marigold-200/50 flex flex-col items-center">
 <span className="text-3xl mb-2">📄</span>
 <h4 className="font-bold text-sm text-marigold-300">{t("studentProfile.noCritiqueGenerated")}</h4>
 <p className="text-xs text-marigold-200/60 max-w-xs mt-1 leading-relaxed">
 {isOwner 
 ?"Go to your main Dashboard, paste your CV text details, and request an AI CV Review to generate a score!":"This student has not requested an AI CV critique score yet."}
 </p>
 </div>
 )}
 </div>

 {/* Reviews & Recommendations Panel */}
 <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 border border-ink-200 space-y-4">
 <h3 className="text-sm font-black text-ink-800 uppercase tracking-wider border-b pb-2.5">
 💬 {t("studentProfile.clientReviews", { count: ratingsList.length})}
 </h3>

 {ratingsList.length === 0 ? (
 <p className="text-xs text-ink-400 italic">{t("studentProfile.noReviewsYet")}</p>
 ) : (
 <div className="space-y-4 divide-y divide-ink-100">
 {ratingsList.map((app) => (
 <div key={app.applicationId || app._id} className="pt-3 first:pt-0 space-y-1">
 <div className="flex justify-between items-center text-[10px]">
 <span className="bg-marigold-50 text-marigold-700 font-extrabold px-2 py-0.5 rounded border border-marigold-100">
 📁 {app.projectId?.title || t("studentProfile.completedGig")}
 </span>
 <div className="flex items-center gap-0.5">
 {[1, 2, 3, 4, 5].map((star) => (
 <span key={star} className={star <= app.rating ?"text-amber-400 text-xs" :"text-ink-200 text-xs"}>★</span>
 ))}
 <span className="font-extrabold text-ink-700 ml-1">({app.rating}/5)</span>
 </div>
 </div>
 {app.ratingReview && (
 <p className="text-xs text-ink-700 leading-relaxed font-semibold mt-1">
"{app.ratingReview}"</p>
 )}
 {app.feedbackText && (
 <p className="text-[10px] text-ink-400 italic leading-relaxed">
 <strong>{t("studentProfile.feedback")}</strong>"{app.feedbackText}"</p>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 {/* 🤝 Peer Vouch Submission Form Overlay Modal */}
 {showVouchModal && (
 <div className="fixed inset-0 bg-ink-900/60 z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-xl max-w-md w-full shadow-sm p-6 border text-left flex flex-col animate-fade-in select-none">
 <div className="flex justify-between items-center border-b pb-3 mb-4">
 <h3 className="font-black text-ink-800 text-sm uppercase tracking-wider">{t("studentProfile.endorseBatchmate")}</h3>
 <button onClick={() => setShowVouchModal(false)} className="text-ink-400 hover:text-ink-600 text-lg">×</button>
 </div>
 <form
 onSubmit={async (e) => {e.preventDefault();
 if (!vouchSkills || !vouchComment) {toast.error(t("studentProfile.fillVouchForm"));
 return;
}
 setVouching(true);
 try {const res = await fetch(`${API_BASE_URL}/api/profile/vouch`, { credentials:"include",
 method:"POST",
 headers: {
"Content-Type":"application/json",
},
 body: JSON.stringify({studentEmail: email,
 skills: vouchSkills.split(",").map(s => s.trim()).filter(Boolean),
 comment: vouchComment
})
});
 const data = await res.json();
 if (res.ok) {toast.success(t("studentProfile.vouchRecorded"));
 setShowVouchModal(false);
 fetchUserProfile();
} else {toast.error(data.error || t("studentProfile.failedToSubmitVouch"));
}
} catch (err) {toast.error(t("studentProfile.connectionErrorVouch"));
} finally {setVouching(false);
}
}}
 className="space-y-4">
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">{t("studentProfile.vouchedSkills")}</label>
 <input
 type="text"placeholder={t("studentProfile.vouchSkillsPlaceholder")}
 value={vouchSkills}
 onChange={(e) => setVouchSkills(e.target.value)}
 className="w-full bg-ink-50 border text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"required
 />
 </div>
 
 <div>
 <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">{t("studentProfile.recommendationStatement")}</label>
 <textarea
 placeholder={t("studentProfile.recommendationPlaceholder")}
 value={vouchComment}
 onChange={(e) => setVouchComment(e.target.value)}
 rows={3}
 className="w-full bg-ink-50 border text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400 resize-none"required
 />
 </div>

 <div className="flex justify-end gap-2.5 pt-2">
 <button
 type="button"onClick={() => setShowVouchModal(false)}
 className="px-4 py-2 border rounded-xl text-xs font-bold text-ink-500 hover:bg-ink-50 transition">
 {t("studentProfile.cancel")}
 </button>
 <button
 type="submit"disabled={vouching}
 className="px-4 py-2 bg-marigold-500 hover:bg-marigold-600 text-white rounded-xl text-xs font-black transition shadow">
 {vouching ? t("studentProfile.submitting") : t("studentProfile.submitVouch")}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
