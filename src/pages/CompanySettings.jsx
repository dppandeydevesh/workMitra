import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../config";
import { useToast } from "../components/Toast";

export default function CompanySettings() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

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
      toast.error(t("companySettings.sessionRequired"));
      navigate("/login");
      return;
    }
    fetchProfile(savedUser.email);
  }, []);

  const fetchProfile = async (email) => {
    setLoading(true);
    try {
            const res = await fetch(`${API_BASE_URL}/api/auth/user/${email}`, { credentials: "include",
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
      toast.error(t("companySettings.loadProfileFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
            const res = await fetch(`${API_BASE_URL}/api/auth/company-profile`, { credentials: "include",
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
        toast.success(t("companySettings.updateSuccess"));
      } else {
        const data = await res.json();
        toast.error(data.error || t("companySettings.saveFailed"));
      }
    } catch (err) {
      toast.error(t("companySettings.networkError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen dark:bg-slate-950 dark:bg-none bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center text-gray-500 font-medium animate-pulse flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>{t("companySettings.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-slate-950 dark:bg-none bg-gradient-to-br from-blue-50 to-indigo-100 font-sans py-8">
      <div className="max-w-3xl mx-auto px-4">
        <button
          onClick={() => navigate("/company-dashboard")}
          className="mb-6 px-4 py-2 bg-white dark:bg-slate-900/80 hover:bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold transition shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-1.5"
        >
          ← {t("companySettings.backButton")}
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100 dark:border-slate-800/50">
          <div className="border-b pb-4 mb-6">
            <h1 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-gray-200">⚙️ {t("companySettings.title")}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{t("companySettings.subtitle")}</p>
          </div>

          {/* Logo Preview */}
          {companyLogoUrl && (
            <div className="mb-6 flex items-center gap-4">
              <img
                src={companyLogoUrl}
                alt={t("companySettings.companyLogoAlt")}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-100 dark:border-slate-800 shadow-sm bg-gray-50 dark:bg-slate-900"
                onError={(e) => { e.target.style.display = "none"; }}
              />
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{companyName || t("companySettings.defaultCompanyName")}</p>
                <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider">{t(`companySettings.industries.${industryVertical}`)} • {t("companySettings.teamMembers", { size: teamSize })}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Identity Section */}
            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">{t("companySettings.corporateIdentity")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t("companySettings.companyName")}</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border p-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white dark:bg-slate-900 transition"
                    placeholder={t("companySettings.companyNamePlaceholder")}
                    disabled
                  />
                  <p className="text-[9px] text-gray-300 mt-0.5">{t("companySettings.companyNameHelp")}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t("companySettings.logoUrl")}</label>
                  <input
                    type="url"
                    value={companyLogoUrl}
                    onChange={(e) => setCompanyLogoUrl(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border p-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white dark:bg-slate-900 transition"
                    placeholder={t("companySettings.logoUrlPlaceholder")}
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t("companySettings.companyBio")}</label>
              <textarea
                rows={4}
                value={companyBio}
                onChange={(e) => setCompanyBio(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-800 border p-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white dark:bg-slate-900 transition resize-none"
                placeholder={t("companySettings.companyBioPlaceholder")}
              />
            </div>

            {/* Links */}
            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">{t("companySettings.socialLinks")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t("companySettings.websiteUrl")}</label>
                  <input
                    type="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border p-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white dark:bg-slate-900 transition"
                    placeholder={t("companySettings.websiteUrlPlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t("companySettings.linkedinUrl")}</label>
                  <input
                    type="url"
                    value={companyLinkedin}
                    onChange={(e) => setCompanyLinkedin(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border p-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white dark:bg-slate-900 transition"
                    placeholder={t("companySettings.linkedinUrlPlaceholder")}
                  />
                </div>
              </div>
            </div>

            {/* Configuration */}
            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">{t("companySettings.hiringConfiguration")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t("companySettings.industryVertical")}</label>
                  <select
                    value={industryVertical}
                    onChange={(e) => setIndustryVertical(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-900 border p-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="Technology">{t("companySettings.industries.Technology")}</option>
                    <option value="Finance">{t("companySettings.industries.Finance")}</option>
                    <option value="Healthcare">{t("companySettings.industries.Healthcare")}</option>
                    <option value="Education">{t("companySettings.industries.Education")}</option>
                    <option value="E-Commerce">{t("companySettings.industries.E-Commerce")}</option>
                    <option value="Manufacturing">{t("companySettings.industries.Manufacturing")}</option>
                    <option value="Other">{t("companySettings.industries.Other")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t("companySettings.teamSize")}</label>
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
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t("companySettings.defaultComplexity")}</label>
                  <select
                    value={defaultComplexity}
                    onChange={(e) => setDefaultComplexity(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-900 border p-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="Beginner">{t("companySettings.complexities.Beginner")}</option>
                    <option value="Intermediate">{t("companySettings.complexities.Intermediate")}</option>
                    <option value="Advanced">{t("companySettings.complexities.Advanced")}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Auto-Approve Toggle */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl">
              <input
                type="checkbox"
                id="autoApprove"
                checked={autoApproveApplications}
                onChange={(e) => setAutoApproveApplications(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
              <label htmlFor="autoApprove" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                ⚡ {t("companySettings.autoApprove")}
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate("/company-dashboard")}
                className="px-5 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold transition"
              >
                {t("companySettings.cancel")}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black transition shadow-lg disabled:opacity-50"
              >
                {saving ? t("companySettings.saving") : t("companySettings.saveSettings")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
