import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  // FAQ interactive state
  const [activeFaq, setActiveFaq] = useState(null);
  const faqs = [
    {
      q: "How does the AI Resume Matching work?",
      a: "Our system uses the advanced Gemini 2.5 Flash API to parse student resume documents and grade them directly against the project specifications and required skills set by corporate clients. The grading includes an actionable percentage score and match rationale."
    },
    {
      q: "What are the fees associated with subscriptions?",
      a: "Students unlock unlimited applications and AI CV critique reviews for ₹39/month. Recruiter plans start from ₹149/month for Standard and ₹299/month for Premium, unlocking advanced gig analytics and prioritised listing grids."
    },
    {
      q: "How do payouts work for completed gigs?",
      a: "When a recruiter deploys a gig, the budget is safely registered. Once the student submits their solution, the recruiter reviews the submission, gives a star rating, writes a performance review, and marks it Completed, which immediately triggers the payment release."
    },
    {
      q: "Is there support accessible via the website?",
      a: "Yes! You can visit our Help Center and submit an online ticket, or directly mail our corporate support desk at contact.workmitra@gmail.com for assistance under 24 hours."
    }
  ];

  const handleFaqToggle = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans text-gray-800 flex flex-col select-none">
      
      {/* 🚀 Sticky Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <img 
            src="/logo.png" 
            alt="workMitra Logo" 
            className="h-9 object-contain cursor-pointer transition hover:scale-105" 
            onClick={() => navigate("/")} 
          />
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/about")} 
              className="text-xs sm:text-sm font-extrabold text-gray-600 hover:text-indigo-600 transition"
            >
              How It Works
            </button>
            <button 
              onClick={() => navigate("/login")} 
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-black transition shadow-md hover:shadow-lg hover:-translate-y-0.5 transform"
            >
              Sign In Portal
            </button>
          </div>
        </div>
      </header>

      {/* 🔮 Hero Section */}
      <section className="py-16 sm:py-24 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
        <span className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-xl animate-pulse">
          ✨ Verified Student Gig Ecosystem
        </span>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-800 tracking-tight mt-6 leading-tight">
          Unlocking Student Talents for <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Corporate Integrations</span>
        </h1>
        <p className="text-gray-500 mt-4 text-sm sm:text-base lg:text-lg max-w-2xl leading-relaxed">
          Stop getting stuck in "Launching Soon" placeholders. workMitra is a fully functional web environment connecting college developers and startups with AI candidate grading, interactive stepper tracking, and rating systems.
        </p>
        <div className="flex gap-4 mt-8">
          <button 
            onClick={() => navigate("/login")} 
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-black transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform"
          >
            Get Started Free
          </button>
          <button 
            onClick={() => navigate("/about")} 
            className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl text-xs sm:text-sm font-bold transition shadow-md border border-gray-100"
          >
            Explore Support Desk
          </button>
        </div>
      </section>

      {/* 🛠️ How it works (Student vs Recruiter) */}
      <section className="bg-white py-16 px-4 border-y border-gray-100 shadow-inner">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center text-gray-800 tracking-tight mb-12">
            A Dual Engine Built For Efficiency
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Student Side */}
            <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border border-blue-100/50 p-6 sm:p-8 rounded-3xl">
              <span className="text-2xl">🎓</span>
              <h3 className="text-lg font-black text-blue-900 mt-3 mb-2">For Students / Creators</h3>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">Build credential records, match skill matrices, and get paid.</p>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-xs">
                  <span className="bg-blue-100 text-blue-700 font-extrabold w-5 h-5 flex items-center justify-center rounded-full mt-0.5">1</span>
                  <p className="text-gray-600">Onboard with college enrollment and list technical profile preferences.</p>
                </div>
                <div className="flex items-start gap-3 text-xs">
                  <span className="bg-blue-100 text-blue-700 font-extrabold w-5 h-5 flex items-center justify-center rounded-full mt-0.5">2</span>
                  <p className="text-gray-600">Upload PDF resume details for instant AI matching and matching score grade metrics.</p>
                </div>
                <div className="flex items-start gap-3 text-xs">
                  <span className="bg-blue-100 text-blue-700 font-extrabold w-5 h-5 flex items-center justify-center rounded-full mt-0.5">3</span>
                  <p className="text-gray-600">Submit solution link resources and track approval using active stepper progress charts.</p>
                </div>
              </div>
            </div>

            {/* Recruiter Side */}
            <div className="bg-gradient-to-br from-pink-50/50 to-purple-50/50 border border-purple-100/50 p-6 sm:p-8 rounded-3xl">
              <span className="text-2xl">🏢</span>
              <h3 className="text-lg font-black text-purple-900 mt-3 mb-2">For Startups / Recruiters</h3>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">Deploy gig requirements, review applicants, and ensure safety.</p>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-xs">
                  <span className="bg-purple-100 text-purple-700 font-extrabold w-5 h-5 flex items-center justify-center rounded-full mt-0.5">1</span>
                  <p className="text-gray-600">Deploy technical gig specifications with budgets, timelines, and skills filters.</p>
                </div>
                <div className="flex items-start gap-3 text-xs">
                  <span className="bg-purple-100 text-purple-700 font-extrabold w-5 h-5 flex items-center justify-center rounded-full mt-0.5">2</span>
                  <p className="text-gray-600">Review candidates ranked by matching grades, check rationale insights, and chat instantly.</p>
                </div>
                <div className="flex items-start gap-3 text-xs">
                  <span className="bg-purple-100 text-purple-700 font-extrabold w-5 h-5 flex items-center justify-center rounded-full mt-0.5">3</span>
                  <p className="text-gray-600">Verify solution links, input developer rating review scores, and trigger payouts safely.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 💸 Subscription Pricing Grid */}
      <section className="py-16 sm:py-24 px-4 max-w-6xl mx-auto w-full">
        <h2 className="text-2xl sm:text-3xl font-black text-center text-gray-800 tracking-tight mb-4">
          Transparent, Affordable Pricing
        </h2>
        <p className="text-center text-gray-500 text-xs sm:text-sm max-w-lg mx-auto mb-12">
          No hidden fees or commission cuts. Choose your membership tier to access gig databases.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Plan 1 */}
          <div className="bg-white border border-gray-100 p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-md transition">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider block">Student Pass</span>
            <span className="text-3xl font-black text-gray-800 block mt-2">₹39<span className="text-xs text-gray-400 font-normal">/month</span></span>
            <p className="text-xs text-gray-400 mt-2">Perfect for college developers finding freelance gigs.</p>
            <div className="border-t my-6 pt-6 space-y-3 text-xs text-gray-600">
              <p>✓ Unlimited job applications</p>
              <p>✓ Free AI CV Critique grading</p>
              <p>✓ Real-time messaging channels</p>
              <p>✓ Secured escrow payouts</p>
            </div>
            <button 
              onClick={() => navigate("/login")}
              className="w-full py-2.5 bg-gray-100 hover:bg-indigo-600 hover:text-white text-gray-700 rounded-xl text-xs font-bold transition"
            >
              Get Started
            </button>
          </div>

          {/* Plan 2 */}
          <div className="bg-white border-2 border-indigo-500 p-6 sm:p-8 rounded-3xl shadow-md relative">
            <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-wider rounded-full shadow">
              Most Popular
            </span>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider block">Startup Standard</span>
            <span className="text-3xl font-black text-gray-800 block mt-2">₹149<span className="text-xs text-gray-400 font-normal">/month</span></span>
            <p className="text-xs text-gray-400 mt-2">Ideal for corporate recruiters deploying standard tasks.</p>
            <div className="border-t my-6 pt-6 space-y-3 text-xs text-gray-600">
              <p>✓ Deploy up to 10 active projects</p>
              <p>✓ AI Candidate Match Grading</p>
              <p>✓ Direct chat messaging logs</p>
              <p>✓ Rating and reviews manager</p>
            </div>
            <button 
              onClick={() => navigate("/login")}
              className="w-full py-2.5 bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow"
            >
              Select Standard
            </button>
          </div>

          {/* Plan 3 */}
          <div className="bg-white border border-gray-100 p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-md transition">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider block">Enterprise Premium</span>
            <span className="text-3xl font-black text-gray-800 block mt-2">₹299<span className="text-xs text-gray-400 font-normal">/month</span></span>
            <p className="text-xs text-gray-400 mt-2">Built for companies requiring fast developer matching.</p>
            <div className="border-t my-6 pt-6 space-y-3 text-xs text-gray-600">
              <p>✓ Unlimited active project posts</p>
              <p>✓ Priority AI Matching Grades</p>
              <p>✓ Escrow safety guarantees</p>
              <p>✓ 24/7 Support Desk ticket response</p>
            </div>
            <button 
              onClick={() => navigate("/login")}
              className="w-full py-2.5 bg-gray-100 hover:bg-indigo-600 hover:text-white text-gray-700 rounded-xl text-xs font-bold transition"
            >
              Select Premium
            </button>
          </div>
        </div>
      </section>

      {/* 🙋 FAQ Accordion */}
      <section className="bg-gray-50/60 border-t border-gray-100 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center text-gray-800 tracking-tight mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-4 transition shadow-sm">
                  <button 
                    onClick={() => handleFaqToggle(idx)}
                    className="w-full flex justify-between items-center text-left text-xs sm:text-sm font-bold text-gray-700 focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    <span className="text-lg text-indigo-500 font-bold">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <p className="text-xs text-gray-500 mt-3 leading-relaxed border-t pt-3 border-gray-50">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 🚪 Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4 mt-auto border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-xs">
          <div>
            <h4 className="font-extrabold text-white uppercase tracking-wider mb-3">workMitra</h4>
            <p className="leading-relaxed">Connecting verified college developer networks with modern startups and projects.</p>
          </div>
          <div>
            <h4 className="font-extrabold text-white uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2">
              <li><button onClick={() => navigate("/login")} className="hover:text-white transition text-left">Login Portal</button></li>
              <li><button onClick={() => navigate("/about")} className="hover:text-white transition text-left">Support Desk</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-extrabold text-white uppercase tracking-wider mb-3">Trust & Legal</h4>
            <ul className="space-y-2">
              <li><button onClick={() => navigate("/terms")} className="hover:text-white transition text-left">Terms of Service</button></li>
              <li><button onClick={() => navigate("/privacy")} className="hover:text-white transition text-left">Privacy Policy</button></li>
              <li><button onClick={() => navigate("/refund")} className="hover:text-white transition text-left">Refund & Cancellation</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-extrabold text-white uppercase tracking-wider mb-3">Contact</h4>
            <p>Office: Noida, Uttar Pradesh, India</p>
            <p className="mt-1">Primary: contact.workmitra@gmail.com</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-slate-800 pt-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
          © {new Date().getFullYear()} workMitra. Built for quality, verification, and transparency.
        </div>
      </footer>

    </div>
  );
}
