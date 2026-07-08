import { useState} from"react";
import { useNavigate} from"react-router-dom";
import { useTranslation} from"react-i18next";

export default function LandingPage() {const navigate = useNavigate();
 const { t} = useTranslation();

 // FAQ interactive state
 const [activeFaq, setActiveFaq] = useState(null);
 const faqs = [
 {q: t("landing.faq1Question"),
 a: t("landing.faq1Answer")
},
 {q: t("landing.faq2Question"),
 a: t("landing.faq2Answer")
},
 {q: t("landing.faq3Question"),
 a: t("landing.faq3Answer")
}
 ];

 const handleFaqToggle = (idx) => {setActiveFaq(activeFaq === idx ? null : idx);
};

 return (
    <div className="min-h-screen bg-paper font-sans text-ink-900 flex flex-col select-none">
    
    {/* 🚀 Sticky Header */}
    <header className="bg-white sticky top-0 z-50 border-b border-ink-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        <div className="cursor-pointer flex items-center gap-2" onClick={() => navigate("/")}>
          <div className="w-2.5 h-2.5 rounded-full bg-marigold-500" />
          <span className="font-bold text-ink-900 text-sm tracking-tight">workMitra</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/about")} 
            className="text-xs sm:text-sm font-semibold text-ink-600 hover:text-marigold-500 transition"
          >
            {t("landing.howItWorks")}
          </button>
          <button 
            onClick={() => navigate("/login")} 
            className="wm-btn wm-btn-primary px-4 py-2 rounded-lg text-xs sm:text-sm font-medium shadow-sm"
          >
            {t("landing.signInPortal")}
          </button>
        </div>
      </div>
    </header>

  {/* 🔮 Hero Section */}
  <section className="py-20 sm:py-28 text-center px-4 max-w-4xl mx-auto flex flex-col items-center relative overflow-hidden">
    <span className="wm-badge wm-badge-marigold uppercase tracking-wider text-[10px] font-semibold">
      ✨ {t("landing.heroBadge")}
    </span>
    <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif" }} className="text-4xl sm:text-6xl lg:text-7xl font-serif italic font-normal text-ink-900 tracking-tight mt-6 leading-tight">
      {t("landing.heroTitlePart1")} <br className="hidden sm:inline" />
      <span className="text-marigold-500 not-italic font-medium">{t("landing.heroTitleHighlight")}</span>
    </h1>
    <p style={{ fontSize: '16px', color: '#6B7280', lineHeight: 1.75 }} className="mt-6 max-w-2xl">
    {t("landing.heroDescription")}
    </p>
    <div className="flex gap-4 mt-8">
    <button 
    onClick={() => navigate("/login")} 
    style={{ background: '#F5A623', color: '#1B2333', borderRadius: '8px', padding: '10px 24px', fontWeight: 500 }}
    className="active:scale-95 transition shadow-sm text-xs sm:text-sm"
    >
    {t("landing.getStarted")}
    </button>
    <button 
    onClick={() => navigate("/about")} 
    style={{ background: 'transparent', border: '0.5px solid #C8C9C2', color: '#1B2333', borderRadius: '8px', padding: '10px 24px' }}
    className="active:scale-95 transition text-xs sm:text-sm"
    >
    {t("landing.exploreSupportDesk")}
    </button>
    </div>
  </section>

 {/* 🛠️ How it works (Student vs Recruiter) */}
 <section className="bg-white py-16 px-4 border-y border-ink-100 shadow-inner">
 <div className="max-w-6xl mx-auto">
 <h2 className="text-2xl sm:text-3xl font-black text-center text-ink-800 tracking-tight mb-12">
 {t("landing.dualEngineTitle")}
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
 {/* Student Side */}
 <div className="wm-card bg-white text-left">
 <span className="text-2xl text-[#F5A623]">🎓</span>
 <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#1B2333' }} className="mt-3 mb-2">{t("landing.studentCardTitle")}</h3>
 <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.65 }} className="mb-6">{t("landing.studentCardDescription")}</p>
 <div className="space-y-4">
 <div className="flex items-start gap-3 text-xs">
 <span className="bg-marigold-100 text-marigold-700 font-extrabold w-5 h-5 flex items-center justify-center rounded-full mt-0.5">1</span>
 <p className="text-ink-600">{t("landing.studentStep1")}</p>
 </div>
 <div className="flex items-start gap-3 text-xs">
 <span className="bg-marigold-100 text-marigold-700 font-extrabold w-5 h-5 flex items-center justify-center rounded-full mt-0.5">2</span>
 <p className="text-ink-600">{t("landing.studentStep2")}</p>
 </div>
 <div className="flex items-start gap-3 text-xs">
 <span className="bg-marigold-100 text-marigold-700 font-extrabold w-5 h-5 flex items-center justify-center rounded-full mt-0.5">3</span>
 <p className="text-ink-600">{t("landing.studentStep3")}</p>
 </div>
 </div>
 </div>

 {/* Recruiter Side */}
 <div className="wm-card bg-white text-left">
 <span className="text-2xl text-[#F5A623]">🏢</span>
 <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#1B2333' }} className="mt-3 mb-2">{t("landing.recruiterCardTitle")}</h3>
 <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.65 }} className="mb-6">{t("landing.recruiterCardDescription")}</p>
 <div className="space-y-4">
 <div className="flex items-start gap-3 text-xs">
 <span className="bg-purple-100 text-purple-700 font-extrabold w-5 h-5 flex items-center justify-center rounded-full mt-0.5">1</span>
 <p className="text-ink-600">{t("landing.recruiterStep1")}</p>
 </div>
 <div className="flex items-start gap-3 text-xs">
 <span className="bg-purple-100 text-purple-700 font-extrabold w-5 h-5 flex items-center justify-center rounded-full mt-0.5">2</span>
 <p className="text-ink-600">{t("landing.recruiterStep2")}</p>
 </div>
 <div className="flex items-start gap-3 text-xs">
 <span className="bg-purple-100 text-purple-700 font-extrabold w-5 h-5 flex items-center justify-center rounded-full mt-0.5">3</span>
 <p className="text-ink-600">{t("landing.recruiterStep3")}</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </section>


 {/* 🙋 FAQ Accordion */}
 <section className="bg-ink-50 border-t border-ink-100 py-16 px-4">
 <div className="max-w-3xl mx-auto">
 <h2 className="text-2xl sm:text-3xl font-black text-center text-ink-800 tracking-tight mb-8">
 {t("landing.faqTitle")}
 </h2>
 <div className="space-y-4">
 {faqs.map((faq, idx) => {const isOpen = activeFaq === idx;
 return (
 <div key={idx} className="bg-white rounded-xl border border-ink-100 p-4 shadow-sm">
 <button 
 onClick={() => handleFaqToggle(idx)}
 className="w-full flex justify-between items-center text-left text-xs sm:text-sm font-bold text-ink-700 focus:outline-none">
 <span>{faq.q}</span>
 <span className={`text-lg text-marigold-500 font-bold transition-transform duration-300 ${isOpen ?"rotate-45" :""}`}>+</span>
 </button>
 <div 
 className="overflow-hidden transition-all duration-300 ease-in-out"style={{ maxHeight: isOpen ?"200px" :"0px", opacity: isOpen ? 1 : 0}}
 >
 <p className="text-xs text-ink-500 mt-3 leading-relaxed border-t pt-3 border-ink-50">
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
 <footer style={{ background: '#1B2333', color: '#6B7280' }} className="py-12 px-4 mt-auto border-t border-ink-800">
 <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-xs">
 <div>
 <h4 className="font-extrabold text-white uppercase tracking-wider mb-3">workMitra</h4>
 <p className="leading-relaxed">{t("landing.footerDescription")}</p>
 </div>
 <div>
 <h4 className="font-extrabold text-white uppercase tracking-wider mb-3">{t("landing.footerProduct")}</h4>
 <ul className="space-y-2">
 <li><button onClick={() => navigate("/login")} className="hover:text-[#F5A623] transition text-left">{t("landing.footerLoginPortal")}</button></li>
 <li><button onClick={() => navigate("/about")} className="hover:text-[#F5A623] transition text-left">{t("landing.footerSupportDesk")}</button></li>
 </ul>
 </div>
 <div>
 <h4 className="font-extrabold text-white uppercase tracking-wider mb-3">{t("landing.footerTrustLegal")}</h4>
 <ul className="space-y-2">
 <li><button onClick={() => navigate("/terms")} className="hover:text-[#F5A623] transition text-left">{t("landing.footerTerms")}</button></li>
 <li><button onClick={() => navigate("/privacy")} className="hover:text-[#F5A623] transition text-left">{t("landing.footerPrivacy")}</button></li>
 <li><button onClick={() => navigate("/refund")} className="hover:text-[#F5A623] transition text-left">{t("landing.footerRefund")}</button></li>
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
