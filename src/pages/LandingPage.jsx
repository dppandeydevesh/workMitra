import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // FAQ interactive state
  const [activeFaq, setActiveFaq] = useState(null);
  const faqs = [
    {
      q: t("landing.faq1Question"),
      a: t("landing.faq1Answer")
    },
    {
      q: t("landing.faq2Question"),
      a: t("landing.faq2Answer")
    },
    {
      q: t("landing.faq3Question"),
      a: t("landing.faq3Answer")
    }
  ];

  const handleFaqToggle = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-transparent font-sans text-ink-800 dark:text-ink-200 flex flex-col select-none">
      
      {/* 🚀 Sticky Header */}
      <header className="bg-white dark:bg-ink-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-ink-100 dark:border-ink-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="logo-hook" onClick={() => navigate("/")}>
            <img 
              src="/logo.png" 
              alt={t("landing.logoAlt")} 
              className="h-8 object-contain" 
            />
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/about")} 
              className="text-xs sm:text-sm font-extrabold text-ink-600 dark:text-ink-300 hover:text-marigold-500 transition"
            >
              {t("landing.howItWorks")}
            </button>
            <button 
              onClick={() => navigate("/login")} 
              className="px-4 py-2 bg-gradient-to-r from-marigold-600 to-marigold-600 hover:from-marigold-700 hover:to-marigold-700 text-white rounded-xl text-xs sm:text-sm font-black transition shadow-md hover:shadow-lg hover:-tranink-y-0.5 transform"
            >
              {t("landing.signInPortal")}
            </button>
          </div>
        </div>
      </header>

      {/* 🔮 Hero Section */}
      <section className="py-16 sm:py-24 text-center px-4 max-w-4xl mx-auto flex flex-col items-center relative overflow-hidden">
        {/* ✈️ Animated Paper Airplane */}
        <div className="airplane-fly pointer-events-none absolute" style={{ top: "60%", left: "-60px" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: "rotate(-30deg)" }}>
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="url(#planeGrad)" opacity="0.7"/>
            <defs>
              <linearGradient id="planeGrad" x1="2" y1="3" x2="23" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1"/>
                <stop offset="1" stopColor="#3b82f6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="px-3.5 py-1.5 bg-marigold-50 border border-marigold-100 text-marigold-700 text-[10px] font-black uppercase tracking-wider rounded-xl animate-pulse">
          ✨ {t("landing.heroBadge")}
        </span>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-ink-800 dark:text-ink-200 tracking-tight mt-6 leading-tight">
          {t("landing.heroTitlePart1")} <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-marigold-600 to-marigold-600">{t("landing.heroTitleHighlight")}</span>
        </h1>
        <p className="text-ink-500 mt-4 text-sm sm:text-base lg:text-lg max-w-2xl leading-relaxed">
          {t("landing.heroDescription")}
        </p>
        <div className="flex gap-4 mt-8">
          <button 
            onClick={() => navigate("/login")} 
            className="px-6 py-3 bg-marigold-500 hover:bg-marigold-600 text-white rounded-2xl text-xs sm:text-sm font-black transition shadow-lg hover:shadow-xl hover:-tranink-y-0.5 transform"
          >
            {t("landing.getStarted")}
          </button>
          <button 
            onClick={() => navigate("/about")} 
            className="px-6 py-3 bg-white dark:bg-ink-900 hover:bg-ink-50 dark:bg-ink-800 text-ink-700 dark:text-ink-200 rounded-2xl text-xs sm:text-sm font-bold transition shadow-md border border-ink-100 dark:border-ink-800"
          >
            {t("landing.exploreSupportDesk")}
          </button>
        </div>
      </section>

      {/* 🛠️ How it works (Student vs Recruiter) */}
      <section className="bg-white dark:bg-ink-900 py-16 px-4 border-y border-ink-100 dark:border-ink-800 shadow-inner">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center text-ink-800 dark:text-white tracking-tight mb-12">
            {t("landing.dualEngineTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Student Side */}
            <div className="bg-gradient-to-br from-marigold-50/50 to-marigold-50/50 dark:from-ink-800 dark:to-ink-800 dark:bg-ink-800 border border-marigold-100/50 dark:border-ink-700 p-6 sm:p-8 rounded-3xl shadow-sm">
              <span className="text-2xl">🎓</span>
              <h3 className="text-lg font-black text-marigold-900 dark:text-white mt-3 mb-2">{t("landing.studentCardTitle")}</h3>
              <p className="text-xs text-ink-500 dark:text-ink-300 mb-6 leading-relaxed">{t("landing.studentCardDescription")}</p>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-xs">
                  <span className="bg-marigold-100 text-marigold-700 dark:bg-marigold-900 dark:text-marigold-300 font-extrabold w-5 h-5 flex items-center justify-center rounded-full mt-0.5">1</span>
                  <p className="text-ink-600 dark:text-ink-300">{t("landing.studentStep1")}</p>
                </div>
                <div className="flex items-start gap-3 text-xs">
                  <span className="bg-marigold-100 text-marigold-700 dark:bg-marigold-900 dark:text-marigold-300 font-extrabold w-5 h-5 flex items-center justify-center rounded-full mt-0.5">2</span>
                  <p className="text-ink-600 dark:text-ink-300">{t("landing.studentStep2")}</p>
                </div>
                <div className="flex items-start gap-3 text-xs">
                  <span className="bg-marigold-100 text-marigold-700 dark:bg-marigold-900 dark:text-marigold-300 font-extrabold w-5 h-5 flex items-center justify-center rounded-full mt-0.5">3</span>
                  <p className="text-ink-600 dark:text-ink-300">{t("landing.studentStep3")}</p>
                </div>
              </div>
            </div>

            {/* Recruiter Side */}
            <div className="bg-gradient-to-br from-pink-50/50 to-purple-50/50 dark:from-ink-800 dark:to-ink-800 dark:bg-ink-800 border border-purple-100/50 dark:border-ink-700 p-6 sm:p-8 rounded-3xl shadow-sm">
              <span className="text-2xl">🏢</span>
              <h3 className="text-lg font-black text-purple-900 dark:text-white mt-3 mb-2">{t("landing.recruiterCardTitle")}</h3>
              <p className="text-xs text-ink-500 dark:text-ink-300 mb-6 leading-relaxed">{t("landing.recruiterCardDescription")}</p>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-xs">
                  <span className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 font-extrabold w-5 h-5 flex items-center justify-center rounded-full mt-0.5">1</span>
                  <p className="text-ink-600 dark:text-ink-300">{t("landing.recruiterStep1")}</p>
                </div>
                <div className="flex items-start gap-3 text-xs">
                  <span className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 font-extrabold w-5 h-5 flex items-center justify-center rounded-full mt-0.5">2</span>
                  <p className="text-ink-600 dark:text-ink-300">{t("landing.recruiterStep2")}</p>
                </div>
                <div className="flex items-start gap-3 text-xs">
                  <span className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 font-extrabold w-5 h-5 flex items-center justify-center rounded-full mt-0.5">3</span>
                  <p className="text-ink-600 dark:text-ink-300">{t("landing.recruiterStep3")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* 🙋 FAQ Accordion */}
      <section className="bg-ink-50 dark:bg-ink-900 border-t border-ink-100 dark:border-ink-800 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center text-ink-800 dark:text-white tracking-tight mb-8">
            {t("landing.faqTitle")}
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-800 p-4 shadow-sm">
                  <button 
                    onClick={() => handleFaqToggle(idx)}
                    className="w-full flex justify-between items-center text-left text-xs sm:text-sm font-bold text-ink-700 dark:text-ink-200 focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    <span className={`text-lg text-marigold-500 font-bold transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}>+</span>
                  </button>
                  <div 
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ maxHeight: isOpen ? "200px" : "0px", opacity: isOpen ? 1 : 0 }}
                  >
                    <p className="text-xs text-ink-500 dark:text-ink-400 mt-3 leading-relaxed border-t pt-3 border-ink-50 dark:border-ink-800/50">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 🚪 Footer */}
      <footer className="bg-ink-900 text-ink-400 py-12 px-4 mt-auto border-t border-ink-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-xs">
          <div>
            <h4 className="font-extrabold text-white uppercase tracking-wider mb-3">workMitra</h4>
            <p className="leading-relaxed">{t("landing.footerDescription")}</p>
          </div>
          <div>
            <h4 className="font-extrabold text-white uppercase tracking-wider mb-3">{t("landing.footerProduct")}</h4>
            <ul className="space-y-2">
              <li><button onClick={() => navigate("/login")} className="hover:text-white transition text-left">{t("landing.footerLoginPortal")}</button></li>
              <li><button onClick={() => navigate("/about")} className="hover:text-white transition text-left">{t("landing.footerSupportDesk")}</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-extrabold text-white uppercase tracking-wider mb-3">{t("landing.footerTrustLegal")}</h4>
            <ul className="space-y-2">
              <li><button onClick={() => navigate("/terms")} className="hover:text-white transition text-left">{t("landing.footerTerms")}</button></li>
              <li><button onClick={() => navigate("/privacy")} className="hover:text-white transition text-left">{t("landing.footerPrivacy")}</button></li>
              <li><button onClick={() => navigate("/refund")} className="hover:text-white transition text-left">{t("landing.footerRefund")}</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-extrabold text-white uppercase tracking-wider mb-3">{t("landing.footerContact")}</h4>
            <p>{t("landing.footerOffice")}</p>
            <p className="mt-1">{t("landing.footerEmail")}</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-ink-800 pt-6 text-center text-[10px] font-bold uppercase tracking-widest text-ink-500">
          © {new Date().getFullYear()} workMitra. {t("landing.footerCopyright")}
        </div>
      </footer>

    </div>
  );
}
