import { useState } from "react";
import { API_BASE_URL } from "../config";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";

export default function AddProject() {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form Fields States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillsInput, setSkillsInput] = useState(""); // Comma separated
  const [studentsNeeded, setStudentsNeeded] = useState(1);
  const [workType, setWorkType] = useState("Micro Tasks");
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState("");
  const [deadline, setDeadline] = useState("");
  const [complexity, setComplexity] = useState("Intermediate");
  const [departmentName, setDepartmentName] = useState("Core Team");
  const [targetUniversity, setTargetUniversity] = useState("");
  const [minReadinessScore, setMinReadinessScore] = useState(0);
  const [isNdaRequired, setIsNdaRequired] = useState(false);
  const [hasPpiBadge, setHasPpiBadge] = useState(false);
  const [status, setStatus] = useState("Published");

  // Pre-test quiz builder states (2 questions)
  const [q1Text, setQ1Text] = useState("What is the primary constraint of React's useState hooks?");
  const [q1OptA, setQ1OptA] = useState("It runs asynchronously");
  const [q1OptB, setQ1OptB] = useState("It modifies local variables instantly");
  const [q1OptC, setQ1OptC] = useState("It cannot be updated");
  const [q1OptD, setQ1OptD] = useState("It is used for backend DB calls");
  const [q1Correct, setQ1Correct] = useState("It runs asynchronously");

  const [q2Text, setQ2Text] = useState("Which framework supports SSR natively?");
  const [q2OptA, setQ2OptA] = useState("Vite standard client SPA");
  const [q2OptB, setQ2OptB] = useState("Next.js");
  const [q2OptC, setQ2OptC] = useState("jQuery Core");
  const [q2OptD, setQ2OptD] = useState("Express Router");
  const [q2Correct, setQ2Correct] = useState("Next.js");

  const handleNextStep = () => {
    // Basic validation
    if (step === 1 && (!title || !description || !skillsInput)) {
      toast.error("Please fill in the project title, description, and required skills.");
      return;
    }
    if (step === 2 && (!duration || !deadline)) {
      toast.error("Please configure the duration and deadline fields.");
      return;
    }
    if (step === 3 && !budget) {
      toast.error("Please configure the budget/stipend reward.");
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const requiredSkills = skillsInput
      .split(",")
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);

    // Build the pre-test questions payload
    const preTestQuestions = [
      {
        question: q1Text,
        options: [q1OptA, q1OptB, q1OptC, q1OptD],
        correctAnswer: q1Correct
      },
      {
        question: q2Text,
        options: [q2OptA, q2OptB, q2OptC, q2OptD],
        correctAnswer: q2Correct
      }
    ].filter(q => q.question.trim().length > 0);

    const payload = {
      companyId: savedUser.email || "anonymous_corp",
      title,
      description,
      requiredSkills,
      studentsNeeded: Number(studentsNeeded),
      workType,
      budget: Number(budget),
      duration,
      deadline,
      complexity,
      departmentName,
      targetUniversity,
      minReadinessScore: Number(minReadinessScore),
      isNdaRequired,
      hasPpiBadge,
      status,
      preTestQuestions
    };

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(`Micro-task configuration saved as ${status} successfully!`);
        navigate("/company-dashboard");
      } else {
        const data = await response.json();
        setErrorMessage(data.error || "Failed to deploy project payload.");
      }
    } catch (err) {
      setErrorMessage("Network connection failure with system gateway backend.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center py-12 px-4 font-sans select-none">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100 dark:border-slate-800/50">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-gray-200">Deploy Corporate Micro-Task</h1>
            <p className="text-xs text-gray-400 mt-0.5">Wizard step {step} of 6: Configure live requirements and filtering rules.</p>
          </div>
          <button 
            type="button" 
            onClick={() => navigate("/company-dashboard")}
            className="w-full sm:w-auto text-center text-xs font-bold text-gray-500 hover:text-indigo-600 bg-gray-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl transition"
          >
            ← Exit Wizard
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl text-xs mb-4">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Wizard Progress Indicator */}
        <div className="flex items-center gap-1.5 mb-8">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <div 
              key={num} 
              className={`h-2 flex-grow rounded-full transition-all duration-300 ${
                num <= step ? "bg-indigo-600" : "bg-gray-100 dark:bg-slate-800"
              }`} 
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Core Details */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Step 1: Task Core Details</h3>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Project Title</label>
                <input type="text" placeholder="e.g. Deploy Next.js Landing Webpage" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-50 border p-3.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white dark:bg-slate-900 transition" required />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Deliverables & Objectives Description</label>
                <textarea rows="4" placeholder="Detail the core task objectives, deliverables list, and milestones required..." value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-50 border p-3.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white dark:bg-slate-900 transition resize-none" required />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Required Skill Tags (Comma-separated)</label>
                <input type="text" placeholder="e.g. React, Next.js, TailWind" value={skillsInput} onChange={e => setSkillsInput(e.target.value)} className="w-full bg-gray-50 border p-3.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white dark:bg-slate-900 transition" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Complexity Tier</label>
                  <select value={complexity} onChange={e => setComplexity(e.target.value)} className="w-full bg-gray-50 border p-3.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-slate-900">
                    <option value="Beginner">Beginner (1st/2nd Yr Credits)</option>
                    <option value="Intermediate">Intermediate (Normal Track)</option>
                    <option value="Advanced">Advanced (High-End R&D)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Corporate Team / Department</label>
                  <input type="text" value={departmentName} onChange={e => setDepartmentName(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-900 border p-3.5 rounded-xl text-xs outline-none" required />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Scheduling & Target Broadcast */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Step 2: Scheduling & Target Broadcasting</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Task Duration</label>
                  <input type="text" placeholder="e.g. 2 Weeks" value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-900 border p-3.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Submission Deadline</label>
                  <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-900 border p-3.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400" required />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Students Capacity Needed</label>
                <input type="number" min="1" value={studentsNeeded} onChange={e => setStudentsNeeded(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-900 border p-3.5 rounded-xl text-xs outline-none" required />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Target University Broadcast (Optional)</label>
                <input type="text" placeholder="e.g. gla.edu.in (leave empty for all universities)" value={targetUniversity} onChange={e => setTargetUniversity(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-900 border p-3.5 rounded-xl text-xs outline-none" />
                <p className="text-[10px] text-gray-400 mt-1">If populated, only students registered under this college email domain can view the task.</p>
              </div>
            </div>
          )}

          {/* STEP 3: Rewards & Badges */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Step 3: Incentives & Rewards</h3>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Guaranteed Stipend (INR)</label>
                <input type="number" placeholder="e.g. 5000" value={budget} onChange={e => setBudget(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-900 border p-3.5 rounded-xl text-xs outline-none" required />
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 border rounded-2xl">
                <input
                  type="checkbox"
                  id="hasPpiBadge"
                  checked={hasPpiBadge}
                  onChange={e => setHasPpiBadge(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
                <label htmlFor="hasPpiBadge" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                  🚀 Attach "Pre-Placement Interview" (PPI) badge recommendation to this gig!
                </label>
              </div>
            </div>
          )}

          {/* STEP 4: Prerequisites & NDA */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Step 4: Prerequisites & Legals</h3>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Minimum WorkMitra Readiness Score Requirement</label>
                <input type="number" min="0" max="1000" placeholder="e.g. 400" value={minReadinessScore} onChange={e => setMinReadinessScore(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-900 border p-3.5 rounded-xl text-xs outline-none" />
                <p className="text-[10px] text-gray-400 mt-1">Prevents applications from students whose calculated WorkMitra portfolio score is below this tier limit.</p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 border rounded-2xl">
                <input
                  type="checkbox"
                  id="isNdaRequired"
                  checked={isNdaRequired}
                  onChange={e => setIsNdaRequired(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
                <label htmlFor="isNdaRequired" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                  🔒 Enforce Digital Non-Disclosure Agreement (NDA) sign requirement prior to viewing details.
                </label>
              </div>
            </div>
          )}

          {/* STEP 5: MCQ Pre-tests Quiz */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Step 5: Pre-Test MCQ Screening</h3>
                <span className="text-[9px] bg-slate-100 text-slate-500 font-extrabold px-2 py-0.5 rounded border">Optional</span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-2">Filter out low-proficiency candidates using a quick entry-test.</p>

              <div className="border p-4 rounded-2xl bg-slate-50/50 space-y-3">
                <p className="text-xs font-bold text-indigo-700">Question 1</p>
                <input type="text" placeholder="Question Text" value={q1Text} onChange={e => setQ1Text(e.target.value)} className="w-full bg-white dark:bg-slate-900 border p-2.5 rounded-xl text-xs" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Option A" value={q1OptA} onChange={e => setQ1OptA(e.target.value)} className="bg-white dark:bg-slate-900 border p-2 rounded-xl text-[11px]" />
                  <input type="text" placeholder="Option B" value={q1OptB} onChange={e => setQ1OptB(e.target.value)} className="bg-white dark:bg-slate-900 border p-2 rounded-xl text-[11px]" />
                  <input type="text" placeholder="Option C" value={q1OptC} onChange={e => setQ1OptC(e.target.value)} className="bg-white dark:bg-slate-900 border p-2 rounded-xl text-[11px]" />
                  <input type="text" placeholder="Option D" value={q1OptD} onChange={e => setQ1OptD(e.target.value)} className="bg-white dark:bg-slate-900 border p-2 rounded-xl text-[11px]" />
                </div>
                <input type="text" placeholder="Exact Correct Option string value" value={q1Correct} onChange={e => setQ1Correct(e.target.value)} className="w-full bg-white dark:bg-slate-900 border p-2 rounded-xl text-xs" />
              </div>

              <div className="border p-4 rounded-2xl bg-slate-50/50 space-y-3">
                <p className="text-xs font-bold text-indigo-700">Question 2</p>
                <input type="text" placeholder="Question Text" value={q2Text} onChange={e => setQ2Text(e.target.value)} className="w-full bg-white dark:bg-slate-900 border p-2.5 rounded-xl text-xs" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Option A" value={q2OptA} onChange={e => setQ2OptA(e.target.value)} className="bg-white dark:bg-slate-900 border p-2 rounded-xl text-[11px]" />
                  <input type="text" placeholder="Option B" value={q2OptB} onChange={e => setQ2OptB(e.target.value)} className="bg-white dark:bg-slate-900 border p-2 rounded-xl text-[11px]" />
                  <input type="text" placeholder="Option C" value={q2OptC} onChange={e => setQ2OptC(e.target.value)} className="bg-white dark:bg-slate-900 border p-2 rounded-xl text-[11px]" />
                  <input type="text" placeholder="Option D" value={q2OptD} onChange={e => setQ2OptD(e.target.value)} className="bg-white dark:bg-slate-900 border p-2 rounded-xl text-[11px]" />
                </div>
                <input type="text" placeholder="Exact Correct Option string value" value={q2Correct} onChange={e => setQ2Correct(e.target.value)} className="w-full bg-white dark:bg-slate-900 border p-2 rounded-xl text-xs" />
              </div>
            </div>
          )}

          {/* STEP 6: Confirm & Deploy */}
          {step === 6 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Step 6: Review & Publish</h3>
              
              <div className="border border-indigo-100 bg-indigo-50/20 p-5 rounded-2xl space-y-3 text-xs">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-extrabold text-slate-800 text-sm">{title || "Untitled Project"}</span>
                  <span className="font-black text-indigo-700 font-mono">₹{budget || 0}</span>
                </div>
                <p className="text-slate-500 leading-relaxed">{description || "No description configured yet."}</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-semibold pt-1">
                  <p>🔹 Complexity: {complexity}</p>
                  <p>🔹 Department: {departmentName}</p>
                  <p>🔹 Broadcast target: {targetUniversity || "Public (All Universities)"}</p>
                  <p>🔹 Min Score Req: {minReadinessScore} Score</p>
                  <p>🔹 Require Digital NDA: {isNdaRequired ? "Yes" : "No"}</p>
                  <p>🔹 Attaching PPI Badge: {hasPpiBadge ? "Yes" : "No"}</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Publishing Mode State</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-gray-50 border p-3.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-slate-900">
                  <option value="Published">Publish Live Immediately</option>
                  <option value="Draft">Save as Draft Template</option>
                </select>
              </div>
            </div>
          )}

          {/* Actions button footer container */}
          <div className="flex justify-between items-center pt-4 border-t">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-5 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition"
              >
                ← Previous
              </button>
            ) : (
              <div />
            )}

            {step < 6 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition shadow"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg hover:opacity-95"
              >
                {submitting ? "Deploying..." : `Confirm & Save as ${status}`}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}