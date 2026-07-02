import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { useTranslation } from "react-i18next";

export default function AboutPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error(t("about.toastFillAll"));
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      toast.success(t("about.toastTicketCreated"));
      setName("");
      setEmail("");
      setMessage("");
      setSubmitting(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen dark:bg-slate-950 dark:bg-none bg-gradient-to-br from-blue-50 to-indigo-100 font-sans py-12 px-4 select-none">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6 sm:p-10 border border-gray-100 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-6 mb-8 gap-4">
          <div>
            <img 
              src="/logo.png" 
              alt="workMitra Logo" 
              className="h-9 object-contain cursor-pointer transition hover:scale-105"
              onClick={() => navigate("/")} 
            />
            <h1 className="text-2xl sm:text-3xl font-black text-gray-800 dark:text-gray-200 tracking-tight mt-3">
              {t("about.pageTitle")}
            </h1>
            <p className="text-xs text-gray-400 mt-1 font-semibold uppercase tracking-wider">
              {t("about.pageSubtitle")}
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition shadow-sm border border-gray-100 dark:border-slate-800/50"
          >
            ← {t("about.backToHome")}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Mission & Identity */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-2.5">🚀 {t("about.missionHeading")}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {t("about.missionBody")}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-2.5">🎓 {t("about.studentsHeading")}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {t("about.studentsBody")}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-2.5">🏢 {t("about.corporateHeading")}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {t("about.corporateBody")}
              </p>
            </div>
          </div>

          {/* Interactive Help Desk Form */}
          <div className="bg-gray-55/40 border border-gray-100 dark:border-slate-800 p-6 rounded-2xl shadow-inner">
            <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-1">📬 {t("about.contactHeading")}</h3>
            <p className="text-xs text-gray-400 mb-4">{t("about.contactDescription")}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t("about.nameLabel")}</label>
                <input
                  type="text"
                  placeholder={t("about.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t("about.emailLabel")}</label>
                <input
                  type="email"
                  placeholder={t("about.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t("about.queryLabel")}</label>
                <textarea
                  rows="4"
                  placeholder={t("about.queryPlaceholder")}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black transition shadow disabled:opacity-50"
              >
                {submitting ? t("about.submitting") : t("about.submitButton")}
              </button>
            </form>
          </div>
        </div>

        {/* Corporate Address & Contact Cards */}
        <div className="border-t pt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-gray-500">
          <div>
            <h4 className="font-extrabold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-1">🏢 {t("about.officeHeading")}</h4>
            <p>{t("about.officeName")}</p>
            <p className="mt-0.5">{t("about.officeAddress")}</p>
            <p>{t("about.officeCity")}</p>
          </div>
          <div>
            <h4 className="font-extrabold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-1">✉️ {t("about.assistanceHeading")}</h4>
            <p>{t("about.primarySupport")} <span className="font-bold text-indigo-600">contact.workmitra@gmail.com</span></p>
            <p className="mt-0.5">{t("about.responseTime")}</p>
            <p>{t("about.operatingHours")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
