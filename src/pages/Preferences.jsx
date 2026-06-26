import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function Preferences() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  
  // User preferences state
  const [preferences, setPreferences] = useState({
    name: "",
    bio: "",
    skills: [],
    experience: "beginner",
    interests: [],
    resumeUrl: ""
  });

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
      setErrorMessage("Authentication session context missing.");
      return;
    }

    const parsedUser = JSON.parse(savedUser);

    try {
      // Save resume details
      await fetch(`${API_BASE_URL}/api/profile/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: parsedUser.email,
          resumeUrl: preferences.resumeUrl,
          resumeText: ""
        })
      });

      // 🚀 🆕 LOCK ONBOARDING FLAG MATRIX: Flip hasCompletedProfile to true in MongoDB
      const response = await fetch(`${API_BASE_URL}/api/auth/complete-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsedUser.email })
      });

      if (response.ok) {
        // Update local memory cache states cleanly
        parsedUser.hasCompletedProfile = true;
        parsedUser.resumeUrl = preferences.resumeUrl;
        // Optionally map target skills so the Smart Matching engine calculates scores correctly
        parsedUser.targetSkills = preferences.skills.join(", ");
        localStorage.setItem("user", JSON.stringify(parsedUser));

        console.log("User Preferences Locked:", preferences);
        navigate("/dashboard"); // Sends student to the marketplace grid containing live company tasks
      } else {
        const data = await response.json();
        setErrorMessage(data.error || "Failed to update profile configurations.");
      }
    } catch (err) {
      setErrorMessage("Gateway server communication failure.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Tell us about yourself</h1>
          <p className="text-gray-500 mt-2">Help us recommend the best jobs for you</p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl text-xs mb-4">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">What should we call you?</label>
            <input
              type="text"
              value={preferences.name}
              onChange={(e) => setPreferences({...preferences, name: e.target.value})}
              placeholder="Your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Bio / About */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tell us a little about yourself</label>
            <textarea
              value={preferences.bio}
              onChange={(e) => setPreferences({...preferences, bio: e.target.value})}
              placeholder="I'm a passionate developer who loves building web applications..."
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Experience Level */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your experience level</label>
            <div className="flex gap-4">
              {["beginner", "intermediate", "expert"].map(level => (
                <label key={level} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={level}
                    checked={preferences.experience === level}
                    onChange={(e) => setPreferences({...preferences, experience: e.target.value})}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="capitalize text-sm text-gray-700 font-medium">{level}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">What skills do you have? (Select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {skillsList.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleSkillToggle(skill)}
                  className={`px-3 py-1 rounded-full text-sm transition font-medium ${
                    preferences.skills.includes(skill)
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">What are you interested in?</label>
            <div className="flex flex-wrap gap-2">
              {interestsList.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-3 py-1 rounded-full text-sm transition font-medium ${
                    preferences.interests.includes(interest)
                      ? "bg-green-600 text-white shadow-sm"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Resume Link */}
          <div className="mb-8 border-t pt-6">
            <label className="block text-sm font-semibold text-gray-800 mb-1">Resume / CV Shareable Link</label>
            <p className="text-xs text-gray-500 mb-2">Upload your resume to Google Drive or Dropbox and paste the link below so companies can inspect it.</p>
            <input
              type="url"
              value={preferences.resumeUrl}
              onChange={(e) => setPreferences({...preferences, resumeUrl: e.target.value})}
              placeholder="https://drive.google.com/file/d/..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium shadow-md active:scale-[0.99]"
          >
            Continue to Dashboard →
          </button>
        </form>

        {/* Quote */}
        <div className="text-center mt-8 text-gray-500 text-sm italic">
          "The only way to do great work is to love what you do." - Steve Jobs
        </div>
      </div>
    </div>
  );
}