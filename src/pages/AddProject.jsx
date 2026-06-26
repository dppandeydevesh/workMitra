import { useState } from "react";
import { API_BASE_URL } from "../config";
import { useNavigate } from "react-router-dom";

export default function AddProject() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  // Input Field States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillsInput, setSkillsInput] = useState(""); // Comma separated tracking string
  const [studentsNeeded, setStudentsNeeded] = useState(1);
  const [workType, setWorkType] = useState("Internship");
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Read details from corporate account out of localStorage cache safely
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

    // Clean up tracking array strings by split-trimming commas cleanly
    const requiredSkills = skillsInput
      .split(",")
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);

    const payload = {
      companyId: savedUser.email || "anonymous_corp",
      title,
      description,
      requiredSkills,
      studentsNeeded: Number(studentsNeeded),
      workType,
      budget: Number(budget),
      duration,
      deadline
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("New corporate project stack deployed successfully!");
        navigate("/company-dashboard");
      } else {
        const data = await response.json();
        setErrorMessage(data.error || "Failed to deploy project payload.");
      }
    } catch (err) {
      setErrorMessage("Network connection failure with system gateway backend.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center py-12 px-4 font-sans select-none">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Deploy New Project</h1>
            <p className="text-sm text-gray-500 mt-0.5">Configure live task constraints for immediate matching assignment.</p>
          </div>
          <button 
            type="button" 
            onClick={() => navigate("/company-dashboard")}
            className="text-xs font-bold text-gray-500 hover:text-blue-600 bg-gray-100 px-3 py-1.5 rounded-lg transition"
          >
            ← Cancel
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl text-xs mb-4">
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Project Title</label>
            <input type="text" placeholder="e.g. AI Chatbot Development" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-50 border p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" required />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Description</label>
            <textarea rows="4" placeholder="Detail the core task objectives and milestones required in solutions..." value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-50 border p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none" required />
          </div>

          {/* 💡 FIXED HERE (Line 111): Removed the duplicate baseline bg-white clashing with bg-gray-50 */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Required Skills (Separate with commas)</label>
            <input type="text" placeholder="e.g. Python, TensorFlow, Flask, React" value={skillsInput} onChange={e => setSkillsInput(e.target.value)} className="w-full bg-gray-50 border p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Students Needed</label>
              <input type="number" min="1" value={studentsNeeded} onChange={e => setStudentsNeeded(e.target.value)} className="w-full bg-gray-50 border p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Work Type</label>
              <select value={workType} onChange={e => setWorkType(e.target.value)} className="w-full bg-gray-50 border p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                {["Internship", "Part-Time", "Full-Time", "Freelance", "Micro Tasks"].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Budget (INR)</label>
              <input type="number" placeholder="e.g. 25000" value={budget} onChange={e => setBudget(e.target.value)} className="w-full bg-gray-50 border p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Duration</label>
              <input type="text" placeholder="e.g. 3 Months" value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-gray-50 border p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Deadline</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full bg-gray-50 border p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase py-4 rounded-xl shadow-md transition active:scale-[0.99] mt-2">
            Deploy Live Stack Project
          </button>
        </form>
      </div>
    </div>
  );
}