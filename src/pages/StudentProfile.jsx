import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function StudentProfile() {
  const { email } = useParams();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
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
  const [bioText, setBioText] = useState("");

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(savedUser);
    fetchUserProfile();
  }, [email]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/user/${email}`);
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
        setBioText(data.bio || "");
      } else {
        setErrorMessage(data.error || "Failed to load student profile details.");
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
      bio: bioText
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/profile/student/${email}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        alert("Portfolio details updated successfully!");
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

  const isOwner = currentUser && currentUser.email === email;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="workMitra Logo" 
                className="h-10 object-contain cursor-pointer" 
                onClick={() => navigate(currentUser?.userRole === "company" ? "/company-dashboard" : "/dashboard")} 
              />
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="text-gray-700 hover:text-indigo-600 font-bold flex items-center gap-1 text-xs md:text-sm" 
                onClick={() => navigate(currentUser?.userRole === "company" ? "/company-dashboard" : "/dashboard")}
              >
                <span>🏠</span>
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button 
                className="text-gray-700 hover:text-indigo-600 font-bold flex items-center gap-1 text-xs md:text-sm" 
                onClick={() => navigate("/chat")}
              >
                <span>💬</span>
                <span className="hidden sm:inline">Chat</span>
              </button>
              <button 
                className="text-gray-700 hover:text-red-600 font-bold flex items-center gap-1 text-xs md:text-sm" 
                onClick={() => { localStorage.clear(); navigate("/login"); }}
              >
                <span>🚪</span>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

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
                  <h1 className="text-2xl font-black text-gray-800 tracking-tight">{profileUser.fullName}</h1>
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
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
