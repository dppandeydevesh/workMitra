import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { useToast } from "../components/Toast";
import ActivityHeatmap from "../components/ActivityHeatmap";

export default function StudentProfile() {
  const { email } = useParams();
  const navigate = useNavigate();
  const toast = useToast();



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

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(savedUser);
    fetchUserProfile();
  }, [email]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const token = localStorage.getItem("token");
      const url = email.includes("@") 
        ? `${API_BASE_URL}/api/auth/user/${email}`
        : `${API_BASE_URL}/api/auth/student/vanity/${email}`;

      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setProfileUser(data);
        // Pre-populate form fields
        setFullName(data.fullName || "");
        setMobile(data.mobile || "");
        setCollegeName(data.collegeName || "");
        setEnrollmentNumber(data.enrollmentNumber || "");
        setSkillsInput(data.targetSkills || "");
        setProjectType(data.projectType || "Remote Track");
        setResumeUrl(data.resumeUrl || "");
        setGithubUrl(data.githubUrl || "");
        setLinkedinUrl(data.linkedinUrl || "");
        setPortfolioUrl(data.portfolioUrl || "");
        setBioText(data.bio || "");
        setMajor(data.major || "");
        setCurrentSemester(data.currentSemester || "");
        setVanityUsername(data.vanityUsername || "");
        setVideoPitchUrl(data.videoPitchUrl || "");
        setIsProfilePrivate(data.isProfilePrivate || false);
        setExtracurriculars(data.extracurriculars ? data.extracurriculars.join(", ") : "");
        setPreferredTechStack(data.preferredTechStack ? data.preferredTechStack.join(", ") : "");
        setAvailabilitySlots(data.availabilitySlots || []);
      } else {
        setErrorMessage(data.error || "Failed to load student profile details.");
      }

      // Load student applications history for ratings & reviews
      const appsRes = await fetch(`${API_BASE_URL}/api/applications/student-details/${email}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApplications(appsData);
      }
    } catch (err) {
      setErrorMessage("Error connecting to server gateway.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");

    const payload = {
      fullName,
      mobile,
      collegeName,
      enrollmentNumber,
      targetSkills: skillsInput,
      projectType,
      resumeUrl,
      githubUrl,
      linkedinUrl,
      portfolioUrl,
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

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/profile/student/${email}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Portfolio details updated successfully!");
        setProfileUser(data.user);
        setIsEditing(false);
        // If this is the logged-in student, update their cached context in localStorage
        if (currentUser && currentUser.email === email) {
          const updatedCachedUser = {
            ...currentUser,
            fullName: data.user.fullName,
            collegeName: data.user.collegeName,
            enrollmentNumber: data.user.enrollmentNumber,
            resumeUrl: data.user.resumeUrl,
            resumeText: data.user.resumeText,
            cvReviewReport: data.user.cvReviewReport,
            githubUrl: data.user.githubUrl,
            linkedinUrl: data.user.linkedinUrl,
            portfolioUrl: data.user.portfolioUrl,
            hasCompletedProfile: true
          };
          localStorage.setItem("user", JSON.stringify(updatedCachedUser));
          setCurrentUser(updatedCachedUser);
        }
      } else {
        setErrorMessage(data.error || "Failed to update profile details.");
      }
    } catch (err) {
      setErrorMessage("Error communicating with server portal.");
    } finally {
      setSaving(false);
    }
  };

  const isOwner = currentUser && (
    currentUser.email === email || 
    (currentUser.vanityUsername && currentUser.vanityUsername === email) ||
    (profileUser && profileUser.email === currentUser.email)
  );

  const completedTasks = applications.filter(a => a.status === "Completed");
  const ratingsList = completedTasks.filter(a => typeof a.rating === "number" && a.rating > 0);
  const avgRating = ratingsList.length > 0 ? (ratingsList.reduce((sum, a) => sum + a.rating, 0) / ratingsList.length).toFixed(1) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans">

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-16 text-gray-500 font-medium bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span>📂 Retrieving student portfolio nodes...</span>
          </div>
        ) : errorMessage ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
            <div className="text-red-500 text-3xl">⚠️</div>
            <p className="text-red-700 font-bold">{errorMessage}</p>
            <button 
              onClick={() => navigate(-1)} 
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
            >
              ← Go Back
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-white/60">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center text-3xl font-black shadow-md">
                  {profileUser.fullName ? profileUser.fullName[0].toUpperCase() : "S"}
                </div>
                <div>
                  <div className="flex items-center flex-wrap gap-2">
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight">{profileUser.fullName}</h1>
                    {profileUser.isEndorsed && (
                      <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-full select-none">
                        Faculty Endorsed 🎓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-indigo-600 font-extrabold uppercase mt-0.5 tracking-wider">🎓 Verified Student Profile</p>
                </div>
              </div>

              {isOwner && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  ✏️ Edit Portfolio
                </button>
              )}

              {!isOwner && currentUser?.userRole === "company" && (
                <button
                  onClick={() => navigate(`/chat/${profileUser.email}`)}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5"
                >
                  💬 Chat with Student
                </button>
              )}
            </div>

            {/* Main Details Grid */}
            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-6 border border-white/60">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-3">Edit Portfolio details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full name */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>

                  {/* Mobile */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Mobile Number</label>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>

                  {/* College name */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">College / University Name</label>
                    <input
                      type="text"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>

                  {/* Enrollment */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Enrollment / Roll Number</label>
                    <input
                      type="text"
                      value={enrollmentNumber}
                      onChange={(e) => setEnrollmentNumber(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>

                  {/* Resume Url */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Resume Share Link (Drive/Dropbox)</label>
                    <input
                      type="url"
                      value={resumeUrl}
                      onChange={(e) => setResumeUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  {/* Project Type preference */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Work Type preference</label>
                    <select
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="Remote Track">Remote Track</option>
                      <option value="On-site Internship">On-site Internship</option>
                      <option value="Part-time Gig">Part-time Gig</option>
                      <option value="Hybrid Track">Hybrid Track</option>
                    </select>
                  </div>

                  {/* GitHub Profile URL */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">GitHub Profile Link</label>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username"
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  {/* LinkedIn Profile URL */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">LinkedIn Profile Link</label>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  {/* Portfolio Website URL */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Portfolio or Website Link</label>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://username.dev"
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  {/* Major */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Academic Major</label>
                    <input
                      type="text"
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      placeholder="e.g. Computer Science & Engineering"
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  {/* Current Semester */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Current Semester</label>
                    <input
                      type="text"
                      value={currentSemester}
                      onChange={(e) => setCurrentSemester(e.target.value)}
                      placeholder="e.g. Semester 6"
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  {/* Vanity Handle */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Custom Vanity Handle</label>
                    <input
                      type="text"
                      value={vanityUsername}
                      onChange={(e) => setVanityUsername(e.target.value)}
                      placeholder="e.g. aditya-cse"
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  {/* Elevator Pitch Video Link */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Elevator Video Pitch Link</label>
                    <input
                      type="url"
                      value={videoPitchUrl}
                      onChange={(e) => setVideoPitchUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... or Loom URL"
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  {/* Preferred Tech Stack */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Preferred Tech Stack</label>
                    <input
                      type="text"
                      value={preferredTechStack}
                      onChange={(e) => setPreferredTechStack(e.target.value)}
                      placeholder="React, PyTorch, Node.js"
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  {/* Profile Visibility Toggle */}
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="isProfilePrivate"
                      checked={isProfilePrivate}
                      onChange={(e) => setIsProfilePrivate(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                    <label htmlFor="isProfilePrivate" className="text-xs font-bold text-slate-700 cursor-pointer">
                      🔒 Mark Profile Private (Hide from public search pages)
                    </label>
                  </div>
                </div>

                {/* Skills input */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Skills (Comma-separated)</label>
                  <input
                    type="text"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="React, Node.js, Python, UI/UX..."
                    className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Extracurricular achievements */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Hackathons & Extracurricular Accomplishments (Comma-separated)</label>
                  <input
                    type="text"
                    value={extracurriculars}
                    onChange={(e) => setExtracurriculars(e.target.value)}
                    placeholder="Smart India Hackathon Winner 2025, CSE Coding Club Lead"
                    className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Availability calendar matrices */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Internship Weekly Availability Slots</label>
                  <div className="flex gap-2 flex-wrap">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Weekend"].map((slot) => {
                      const isSelected = availabilitySlots.includes(slot);
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setAvailabilitySlots(availabilitySlots.filter(s => s !== slot));
                            } else {
                              setAvailabilitySlots([...availabilitySlots, slot]);
                            }
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                            isSelected 
                              ? "bg-indigo-600 border-indigo-700 text-white" 
                              : "bg-gray-50 hover:bg-gray-100 text-gray-500 border-gray-200"
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
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Professional Bio</label>
                  <textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    rows={4}
                    placeholder="Describe your goals, experience summary, and why companies should hire you..."
                    className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                  >
                    {saving ? "Saving..." : "Save Details"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Metadata card */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/60 space-y-5">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider border-b pb-2.5">Student Metadata</h3>
                    
                    {/* Email */}
                    <div className="text-xs">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Primary Email</span>
                      <span className="font-bold text-gray-700">{profileUser.email}</span>
                    </div>

                    {/* Mobile */}
                    <div className="text-xs">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Mobile Contact</span>
                      <span className="font-bold text-gray-700">{profileUser.mobile || "Not provided"}</span>
                    </div>

                    {/* University */}
                    <div className="text-xs">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">GLA University Node</span>
                      <span className="font-bold text-gray-700">{profileUser.collegeName || "Not verified"}</span>
                      {profileUser.enrollmentNumber && (
                        <p className="text-[10px] text-indigo-500 font-semibold mt-0.5">ID: {profileUser.enrollmentNumber}</p>
                      )}
                    </div>

                    {/* Preference */}
                    <div className="text-xs">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Track Preference</span>
                      <span className="font-bold text-gray-700">{profileUser.projectType || "Remote Track"}</span>
                    </div>

                    {/* Resume */}
                    <div className="text-xs border-t pt-3">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Resume File</span>
                      {profileUser.resumeUrl ? (
                        <a 
                          href={profileUser.resumeUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-1"
                        >
                          📄 Open Resume ↗
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">No resume file uploaded yet</span>
                      )}
                    </div>

                    {/* Performance Rating */}
                    <div className="text-xs border-t pt-3">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Rating Score</span>
                      {avgRating ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-amber-500 text-lg">★</span>
                          <span className="font-bold text-gray-800 text-sm">{avgRating} / 5</span>
                          <span className="text-[10px] text-gray-400 font-medium">({ratingsList.length} reviews)</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No ratings accumulated yet</span>
                      )}
                    </div>

                    {/* Showcase Links */}
                    <div className="text-xs border-t pt-3 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Professional Channels</span>
                      <div className="flex flex-col gap-1.5">
                        {profileUser.githubUrl ? (
                          <a href={profileUser.githubUrl} target="_blank" rel="noreferrer" className="text-gray-700 hover:text-purple-600 font-semibold flex items-center gap-1.5">
                            <span>💻 GitHub:</span> <span className="hover:underline text-[11px] truncate max-w-[130px]">{profileUser.githubUrl.split("/").pop()}</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">No GitHub connected</span>
                        )}
                        {profileUser.linkedinUrl ? (
                          <a href={profileUser.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-purple-600 font-semibold flex items-center gap-1.5">
                            <span>👔 LinkedIn:</span> <span className="hover:underline text-[11px] truncate max-w-[130px]">{profileUser.linkedinUrl.split("/").pop()}</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">No LinkedIn connected</span>
                        )}
                        {profileUser.portfolioUrl ? (
                          <a href={profileUser.portfolioUrl} target="_blank" rel="noreferrer" className="text-green-600 hover:text-purple-600 font-semibold flex items-center gap-1.5">
                            <span>🌐 Website:</span> <span className="hover:underline text-[11px] truncate max-w-[130px]">{profileUser.portfolioUrl.replace(/^https?:\/\//, "")}</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">No Website connected</span>
                        )}
                      </div>
                    </div>

                    {/* Academic info */}
                    {(profileUser.major || profileUser.currentSemester) && (
                      <div className="text-xs border-t pt-3">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Academic Track</span>
                        {profileUser.major && <p className="font-bold text-slate-700">{profileUser.major}</p>}
                        {profileUser.currentSemester && <p className="text-[10px] text-gray-500 font-semibold">{profileUser.currentSemester}</p>}
                      </div>
                    )}

                    {/* WorkMitra Readiness Score */}
                    <div className="text-xs border-t pt-3 flex flex-col items-center text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">WorkMitra Readiness Score</span>
                      <div className="relative w-24 h-24 flex items-center justify-center rounded-full border-4 border-indigo-100 bg-indigo-50/20">
                        <div className="text-center">
                          <span className="text-xl font-black text-indigo-700 block">
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
                          <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">/ 1000</span>
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-2 font-medium">Algorithmic readiness indicator based on PoW validation.</p>
                    </div>

                    {/* Download PDF portfolio */}
                    <div className="pt-4 border-t print:hidden">
                      <button
                        onClick={() => window.print()}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                      >
                        📄 Download PDF Portfolio
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Bio, Skills & AI Critique */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Bio & Skills Panel */}
                  <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-white/60 space-y-6">
                    <div>
                      <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider border-b pb-2.5 mb-4">Professional Bio</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {profileUser.bio || "No professional bio has been written yet. Edit profile to write a summary."}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider border-b pb-2.5 mb-4">Target Skills</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {profileUser.targetSkills ? (
                          profileUser.targetSkills.split(",").map((skill, idx) => (
                            <span key={idx} className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-xl border border-blue-100">
                              {skill.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No skills listed yet</span>
                        )}
                      </div>
                    </div>

                    {/* Preferred Tech Stack */}
                    {profileUser.preferredTechStack && profileUser.preferredTechStack.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2">Preferred Tech Stack</h4>
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
                        <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2">Hackathons & Extra Activities</h4>
                        <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                          {profileUser.extracurriculars.map((activity, idx) => (
                            <li key={idx} className="font-semibold">{activity}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Availability Timeline matrix */}
                    {profileUser.availabilitySlots && profileUser.availabilitySlots.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2">Weekly Internship Availability</h4>
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
                    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-white/60 space-y-4 print:hidden">
                      <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider border-b pb-2.5">
                        🎥 60-Second Video Elevator Pitch
                      </h3>
                      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 border">
                        <iframe
                          src={profileUser.videoPitchUrl.includes("watch?v=") 
                            ? profileUser.videoPitchUrl.replace("watch?v=", "embed/") 
                            : profileUser.videoPitchUrl
                          }
                          title="Video Pitch"
                          className="w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}

                  {/* 📅 Activity Heatmap */}
                  <ActivityHeatmap applications={applications} />

                  {/* 📊 Skill Gap Analyzer */}
                  <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-white/60 space-y-4">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider border-b pb-2.5">
                      📊 Tech Stack Skill Gap Analyzer
                    </h3>
                    <p className="text-[10px] text-slate-400">Comparing your targeted tags against current market demand analytics.</p>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                          <span>Market Match Score</span>
                          <span className="text-indigo-600">75% Match</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-2 rounded-full" style={{ width: "75%" }} />
                        </div>
                      </div>
                      
                      <div className="text-xs space-y-2 pt-2 text-slate-600">
                        <p className="font-semibold text-emerald-600">✓ In-Demand Skills Met: {profileUser.targetSkills || "None"}</p>
                        <p className="font-semibold text-amber-600">⚠️ Trending Skills missing: Docker, Next.js, PyTorch</p>
                      </div>
                    </div>
                  </div>

                  {/* 🤝 Peer Endorsements Vouch Log */}
                  <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-white/60 space-y-4">
                    <div className="flex justify-between items-center border-b pb-2.5">
                      <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">
                        🤝 Peer Soft Skill Endorsements ({profileUser.softSkillsVouches?.length || 0})
                      </h3>
                      {!isOwner && currentUser?.userRole === "student" && (
                        <button
                          type="button"
                          onClick={() => {
                            setVouchSkills("");
                            setVouchComment("");
                            setShowVouchModal(true);
                          }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-bold transition shadow-sm"
                        >
                          + Vouch Peer
                        </button>
                      )}
                    </div>

                    {!profileUser.softSkillsVouches || profileUser.softSkillsVouches.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No soft skill endorsements vouched by batchmates yet.</p>
                    ) : (
                      <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                        {profileUser.softSkillsVouches.map((vouch, idx) => (
                          <div key={idx} className="bg-slate-50/50 border p-3 rounded-xl space-y-1.5 text-left">
                            <div className="flex justify-between items-center text-[9px]">
                              <span className="font-bold text-slate-400">Vouched by batchmate</span>
                              <span className="text-gray-400 font-semibold">{new Date(vouch.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {vouch.skills.map((vs, sIdx) => (
                                <span key={sIdx} className="bg-indigo-50 text-indigo-700 text-[8px] font-black px-1.5 py-0.5 rounded border uppercase">
                                  {vs}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed font-semibold italic">
                              "{vouch.comment}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AI Critique Panel */}
                  <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-2xl shadow-xl p-6 md:p-8 space-y-6">
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                          <span>🧠 AI CV critique Report</span>
                          <span className="bg-indigo-500/20 text-indigo-300 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase border border-indigo-400/20">pro</span>
                        </h3>
                        <p className="text-[10px] text-indigo-300 font-medium mt-0.5">Verified score from Gemini 2.5 Flash</p>
                      </div>
                      
                      {profileUser.cvReviewReport && (
                        <div className="flex items-center space-x-3 text-right">
                          <div>
                            <p className="text-[9px] uppercase font-bold text-indigo-300">Quality Score</p>
                            <p className="text-2xl font-black text-indigo-400">{profileUser.cvReviewReport.score}/100</p>
                          </div>
                          <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-white/10 border-2 border-indigo-400">
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
                              <span>✓ Strengths</span>
                            </h5>
                            <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                              {profileUser.cvReviewReport.strengths?.map((str, idx) => (
                                <li key={idx}>{str}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="text-[11px] font-extrabold uppercase text-amber-400 mb-2 flex items-center gap-1.5">
                              <span>⚠️ Areas of Improvement</span>
                            </h5>
                            <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                              {profileUser.cvReviewReport.improvements?.map((imp, idx) => (
                                <li key={idx}>{imp}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                          <h5 className="text-[10px] font-extrabold uppercase text-indigo-300 mb-1">workMitra AI Actionable Recommendations</h5>
                          <p className="text-xs text-slate-200 leading-relaxed italic">
                            "{profileUser.cvReviewReport.recommendations}"
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-indigo-200/50 flex flex-col items-center">
                        <span className="text-3xl mb-2">📄</span>
                        <h4 className="font-bold text-sm text-indigo-300">No Quality Critique Generated</h4>
                        <p className="text-xs text-indigo-200/60 max-w-xs mt-1 leading-relaxed">
                          {isOwner 
                            ? "Go to your main Dashboard, paste your CV text details, and request an AI CV Review to generate a score!" 
                            : "This student has not requested an AI CV critique score yet."}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Reviews & Recommendations Panel */}
                  <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-white/60 space-y-4">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider border-b pb-2.5">
                      💬 Client Reviews & Feedback ({ratingsList.length})
                    </h3>

                    {ratingsList.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No client performance reviews received yet.</p>
                    ) : (
                      <div className="space-y-4 divide-y divide-gray-100">
                        {ratingsList.map((app) => (
                          <div key={app.applicationId || app._id} className="pt-3 first:pt-0 space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded border border-indigo-100">
                                📁 {app.projectId?.title || "Completed Gig"}
                              </span>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span key={star} className={star <= app.rating ? "text-amber-400 text-xs" : "text-gray-200 text-xs"}>★</span>
                                ))}
                                <span className="font-extrabold text-gray-700 ml-1">({app.rating}/5)</span>
                              </div>
                            </div>
                            {app.ratingReview && (
                              <p className="text-xs text-gray-700 leading-relaxed font-semibold mt-1">
                                "{app.ratingReview}"
                              </p>
                            )}
                            {app.feedbackText && (
                              <p className="text-[10px] text-gray-400 italic leading-relaxed">
                                <strong>Feedback:</strong> "{app.feedbackText}"
                              </p>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 border text-left flex flex-col animate-fade-in select-none">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Endorse Batchmate Soft Skills</h3>
              <button onClick={() => setShowVouchModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!vouchSkills || !vouchComment) {
                  toast.error("Please fill in vouched skills and feedback notes.");
                  return;
                }
                setVouching(true);
                try {
                  const token = localStorage.getItem("token");
                  const res = await fetch(`${API_BASE_URL}/api/profile/vouch`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      studentEmail: email,
                      skills: vouchSkills.split(",").map(s => s.trim()).filter(Boolean),
                      comment: vouchComment
                    })
                  });
                  const data = await res.json();
                  if (res.ok) {
                    toast.success("Vouch endorsement recorded successfully!");
                    setShowVouchModal(false);
                    fetchUserProfile();
                  } else {
                    toast.error(data.error || "Failed to submit vouch.");
                  }
                } catch (err) {
                  toast.error("Connection error during vouch submission.");
                } finally {
                  setVouching(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Vouched Skills (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Leadership, Teamwork, Git"
                  value={vouchSkills}
                  onChange={(e) => setVouchSkills(e.target.value)}
                  className="w-full bg-slate-50 border text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Recommendation Statement</label>
                <textarea
                  placeholder="Explain why you are vouching for this peer's soft skills and work ethic..."
                  value={vouchComment}
                  onChange={(e) => setVouchComment(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVouchModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={vouching}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition shadow"
                >
                  {vouching ? "Submitting..." : "Submit Vouch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
