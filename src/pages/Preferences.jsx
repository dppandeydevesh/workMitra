import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Preferences() {
  const navigate = useNavigate();
  
  // User preferences state
  const [preferences, setPreferences] = useState({
    name: "",
    bio: "",
    skills: [],
    experience: "beginner",
    interests: []
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // Yahan preferences save hongi (baad mein database mein)
    console.log("User Preferences:", preferences);
    // Dashboard pe le jayenge
    navigate("/dashboard");
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
                <label key={level} className="flex items-center gap-2">
                  <input
                    type="radio"
                    value={level}
                    checked={preferences.experience === level}
                    onChange={(e) => setPreferences({...preferences, experience: e.target.value})}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="capitalize">{level}</span>
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
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    preferences.skills.includes(skill)
                      ? "bg-blue-600 text-white"
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
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    preferences.interests.includes(interest)
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
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
