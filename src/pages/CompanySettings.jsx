import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { useToast } from "../components/Toast";

export default function CompanySettings() {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [companyBio, setCompanyBio] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyLinkedin, setCompanyLinkedin] = useState("");
  const [industryVertical, setIndustryVertical] = useState("Technology");
  const [teamSize, setTeamSize] = useState("1-10");
  const [defaultComplexity, setDefaultComplexity] = useState("Intermediate");
  const [autoApproveApplications, setAutoApproveApplications] = useState(false);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!savedUser.email || savedUser.userRole !== "company") {
      toast.error("Corporate session required.");
      navigate("/login");
      return;
    }
    fetchProfile(savedUser.email);
  }, []);

  const fetchProfile = async (email) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/auth/user/${email}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCompanyName(data.companyName || "");
        setCompanyBio(data.companyBio || "");
        setCompanyLogoUrl(data.companyLogoUrl || "");
        setCompanyWebsite(data.companyWebsite || "");
        setCompanyLinkedin(data.companyLinkedin || "");
        setIndustryVertical(data.industryVertical || "Technology");
        setTeamSize(data.teamSize || "1-10");
        setDefaultComplexity(data.defaultComplexity || "Intermediate");
        setAutoApproveApplications(data.autoApproveApplications || false);
      }
    } catch (err) {
      toast.error("Failed to load company profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/auth/company-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          companyBio,
          companyLogoUrl,
          companyWebsite,
          companyLinkedin,
          industryVertical,
          teamSize,
          defaultComplexity,
          autoApproveApplications
        })
      });

      if (res.ok) {
        toast.success("Company profile updated successfully!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save profile.");
      }
    } catch (err) {
      toast.error("Network error while saving profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen dark:bg-slate-950 dark:bg-none bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center text-gray-500 font-medium animate-pulse flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading company settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-slate-950 dark:bg-none bg-gradient-to-br from-blue-50 to-indigo-100 font-sans py-8">
      <div className="max-w-3xl mx-auto px-4">
        <button
          onClick={() => navigate("/company-dashboard")}
          className="mb-6 px-4 py-2 bg-white/80 hover:bg-white dark:bg-slate-900 text-gray-600 rounded-xl text-xs font-bold transition shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-1.5"
        >
          ← Back to Command Center
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100 dark:border-slate-800/50">
          <div className="border-b pb-4 mb-6">
            <h1 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-gray-200">⚙️ Company Settings</h1>
            <p className="text-xs text-gray-400 mt-0.5">Configure your corporate profile metadata visible to students and candidates.</p>
          </div>

          {/* Logo Preview */}
          {companyLogoUrl && (
            <div className="mb-6 flex items-center gap-4">
              <img
                src={companyLogoUrl}
                alt="Company Logo"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-100 dark:border-slate-800 shadow-sm bg-gray-50 dark:bg-slate-900"
                onError={(e) => { e.target.style.display = "none"; }}
              />
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{companyName || "Your Company"}</p>
                <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider">{industryVertical} • {teamSize} team members</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Identity Section */}
            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">Corporate Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-gray-50 border p-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white dark:bg-slate-900 transition"
                    placeholder="e.g. TechCorp Solutions"
                    disabled
                  />
                  <p className="text-[9px] text-gray-300 mt-0.5">Company name is set during registration.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Logo URL</label>
                  <input
                    type="url"
                    value={companyLogoUrl}
                    onChange={(e) => setCompanyLogoUrl(e.target.value)}
                    className="w-full bg-gray-50 border p-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white dark:bg-slate-900 transition"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Company Bio & Mission Statement</label>
              <textarea
                rows={4}
                value={companyBio}
                onChange={(e) => setCompanyBio(e.target.value)}
                className="w-full bg-gray-50 border p-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white dark:bg-slate-900 transition resize-none"
                placeholder="Describe your company's mission, culture, and the type of talent you're looking for..."
              />
            </div>

            {/* Links */}
            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">Social & Web Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Website URL</label>
                  <input
                    type="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    className="w-full bg-gray-50 border p-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white dark:bg-slate-900 transition"
                    placeholder="https://yourcompany.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={companyLinkedin}
                    onChange={(e) => setCompanyLinkedin(e.target.value)}
                    className="w-full bg-gray-50 border p-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white dark:bg-slate-900 transition"
                    placeholder="https://linkedin.com/company/yourcompany"
                  />
                </div>
              </div>
            </div>

            {/* Configuration */}
            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">Hiring Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Industry Vertical</label>
                  <select
                    value={industryVertical}
                    onChange={(e) => setIndustryVertical(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-900 border p-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="E-Commerce">E-Commerce</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Team Size</label>
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-900 border p-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="201-500">201-500</option>
                    <option value="500+">500+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Default Task Complexity</label>
                  <select
                    value={defaultComplexity}
                    onChange={(e) => setDefaultComplexity(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-900 border p-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Auto-Approve Toggle */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 border rounded-2xl">
              <input
                type="checkbox"
                id="autoApprove"
                checked={autoApproveApplications}
                onChange={(e) => setAutoApproveApplications(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
              <label htmlFor="autoApprove" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                ⚡ Auto-approve all incoming student applications (skip manual review step)
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate("/company-dashboard")}
                className="px-5 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black transition shadow-lg disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
