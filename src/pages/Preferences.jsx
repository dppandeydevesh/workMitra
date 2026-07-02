import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../config";

export default function Preferences() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState("");
  
  // User preferences state
  const [preferences, setPreferences] = useState({
    name: "",
    bio: "",
    skills: [],
    experience: "beginner",
    interests: [],
    githubUrl: "",
    linkedinUrl: "",
    portfolioUrl: "",
    avatarUrl: ""
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setPreferences(prev => ({
        ...prev,
        name: parsedUser.fullName || "",
        skills: parsedUser.targetSkills ? parsedUser.targetSkills.split(",").map(s => s.trim()) : [],
        githubUrl: parsedUser.githubUrl || "",
        linkedinUrl: parsedUser.linkedinUrl || "",
        portfolioUrl: parsedUser.portfolioUrl || "",
        avatarUrl: parsedUser.avatarUrl || ""
      }));
    }
  }, []);

  const skillsList = ["React", "Node.js", "Python", "UI/UX", "Content Writing", "Video Editing", "Marketing", "Data Entry"];
  const interestsList = ["Web Development", "Mobile Apps", "AI/ML", "Design", "Writing", "Business", "Teaching"];

  const handleSkillToggle = (skill) => {
    if (preferences.skills.includes(skill)) {
      setPreferences({...preferences, skills: preferences.skills.filter(s => s !== skill)});
    } else {
      setPreferences({...preferences, skills: [...preferences.skills, skill]});
    }
  };

  const handleInterestToggle = (interest) => {
    if (preferences.interests.includes(interest)) {
      setPreferences({...preferences, interests: preferences.interests.filter(i => i !== interest)});
    } else {
      setPreferences({...preferences, interests: [...preferences.interests, interest]});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      setErrorMessage(t("preferences.auth_missing_error"));
      return;
    }

    const parsedUser = JSON.parse(savedUser);

    try {
      const token = localStorage.getItem("token");
      
      // Save profile preferences using student update API
      const profileResponse = await fetch(`${API_BASE_URL}/api/profile/student/${parsedUser.email}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: preferences.name || parsedUser.fullName,
          collegeName: parsedUser.collegeName,
          enrollmentNumber: parsedUser.enrollmentNumber,
          mobile: parsedUser.mobile,
          targetSkills: preferences.skills.join(","),
          projectType: preferences.experience === "beginner" ? "Micro Tasks" : "Freelance",
          githubUrl: preferences.githubUrl,
          linkedinUrl: preferences.linkedinUrl,
          portfolioUrl: preferences.portfolioUrl,
          avatarUrl: preferences.avatarUrl,
          bio: preferences.bio,
          interests: preferences.interests
        })
      });

      if (!profileResponse.ok) {
        const errData = await profileResponse.json();
        setErrorMessage(errData.error || t("preferences.update_profile_error"));
        return;
      }

      // 🚀 🆕 LOCK ONBOARDING FLAG MATRIX: Flip hasCompletedProfile to true in MongoDB
      const response = await fetch(`${API_BASE_URL}/api/auth/complete-profile`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ email: parsedUser.email })
      });

      if (response.ok) {
        // Update local memory cache states cleanly
        parsedUser.fullName = preferences.name || parsedUser.fullName;
        parsedUser.hasCompletedProfile = true;
        parsedUser.targetSkills = preferences.skills.join(", ");
        parsedUser.githubUrl = preferences.githubUrl;
        parsedUser.linkedinUrl = preferences.linkedinUrl;
        parsedUser.portfolioUrl = preferences.portfolioUrl;
        parsedUser.avatarUrl = preferences.avatarUrl;
        parsedUser.bio = preferences.bio;
        parsedUser.interests = preferences.interests;
        localStorage.setItem("user", JSON.stringify(parsedUser));

        console.log("User Preferences Locked:", preferences);
        navigate("/dashboard"); // Sends student to the marketplace grid containing live company tasks
      } else {
        const data = await response.json();
        setErrorMessage(data.error || t("preferences.update_config_error"));
      }
    } catch (err) {
      setErrorMessage(t("preferences.server_error"));
    }
  };

  return (
    <div className="min-h-screen dark:bg-slate-950 dark:bg-none bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{t("preferences.title")}</h1>
          <p className="text-gray-500 mt-2">{t("preferences.subtitle")}</p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 md:p-8">
          
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl text-xs mb-4">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t("preferences.name_label")}</label>
            <input
              type="text"
              value={preferences.name}
              onChange={(e) => setPreferences({...preferences, name: e.target.value})}
              placeholder={t("preferences.name_placeholder")}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-transparent dark:bg-slate-900 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Showcase Portfolio Links */}
          <div className="mb-6 bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>🔗</span> {t("preferences.portfolio_links_title")}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">{t("preferences.github_label")}</label>
                <input
                  type="url"
                  value={preferences.githubUrl}
                  onChange={(e) => setPreferences({...preferences, githubUrl: e.target.value})}
                  placeholder="https://github.com/username"
                  className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-slate-700 bg-transparent dark:bg-slate-900 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">{t("preferences.linkedin_label")}</label>
                <input
                  type="url"
                  value={preferences.linkedinUrl}
                  onChange={(e) => setPreferences({...preferences, linkedinUrl: e.target.value})}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-slate-700 bg-transparent dark:bg-slate-900 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">{t("preferences.portfolio_label")}</label>
                <input
                  type="url"
                  value={preferences.portfolioUrl}
                  onChange={(e) => setPreferences({...preferences, portfolioUrl: e.target.value})}
                  placeholder="https://username.dev"
                  className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-slate-700 bg-transparent dark:bg-slate-900 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">{t("preferences.avatar_label")}</label>
                <input
                  type="url"
                  value={preferences.avatarUrl}
                  onChange={(e) => setPreferences({...preferences, avatarUrl: e.target.value})}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-slate-700 bg-transparent dark:bg-slate-900 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bio / About */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t("preferences.bio_label")}</label>
            <textarea
              value={preferences.bio}
              onChange={(e) => setPreferences({...preferences, bio: e.target.value})}
              placeholder={t("preferences.bio_placeholder")}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-transparent dark:bg-slate-900 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Experience Level */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t("preferences.experience_label")}</label>
            <div className="flex flex-wrap gap-4 sm:gap-6">
              {["beginner", "intermediate", "expert"].map(level => (
                <label key={level} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={level}
                    checked={preferences.experience === level}
                    onChange={(e) => setPreferences({...preferences, experience: e.target.value})}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="capitalize text-sm text-gray-700 dark:text-gray-200 font-medium">{t(`preferences.experience_${level}`)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t("preferences.skills_label")}</label>
            <div className="flex flex-wrap gap-2">
              {skillsList.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleSkillToggle(skill)}
                  className={`px-3 py-1 rounded-full text-sm transition font-medium ${
                    preferences.skills.includes(skill)
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-200 text-gray-700 dark:text-gray-300 dark:bg-slate-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t("preferences.interests_label")}</label>
            <div className="flex flex-wrap gap-2">
              {interestsList.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-3 py-1 rounded-full text-sm transition font-medium ${
                    preferences.interests.includes(interest)
                      ? "bg-green-600 text-white shadow-sm"
                      : "bg-gray-200 text-gray-700 dark:text-gray-300 dark:bg-slate-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>



          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium shadow-md active:scale-[0.99]"
          >
            {t("preferences.continue_button")} →
          </button>
        </form>

        {/* Quote */}
        <div className="text-center mt-8 text-gray-500 text-sm italic">
          "{t("preferences.quote")}" - {t("preferences.quote_author")}
        </div>
      </div>
    </div>
  );
}