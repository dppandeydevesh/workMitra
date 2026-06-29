import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";

export default function AboutPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in all support details.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Support ticket created! We will mail you shortly.");
      setName("");
      setEmail("");
      setMessage("");
      setSubmitting(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans py-12 px-4 select-none">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-6 sm:p-10 border border-gray-100">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-6 mb-8 gap-4">
          <div>
            <img 
              src="/logo.png" 
              alt="workMitra Logo" 
              className="h-9 object-contain cursor-pointer transition hover:scale-105"
              onClick={() => navigate("/")} 
            />
            <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight mt-3">
              About workMitra & Help Center
            </h1>
            <p className="text-xs text-gray-400 mt-1 font-semibold uppercase tracking-wider">
              Empowering Student Talents & Corporate Integrations
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition shadow-sm border border-gray-100/50"
          >
            ← Back to Home
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Mission & Identity */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-2.5">🚀 Our Mission</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                workMitra was founded to solve the structural "Empty Shell" platform disconnect in the freelance marketplace. We bridge verified college student creators and modern startups through automated AI matching tools, secure progress trackers, and direct communication logs.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-2.5">🎓 How It Empowers Students</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Students upload their CV documents, receive instant AI critique audits, browse active corporate projects, apply to gigs, and track task verification steps transparently. Approved tasks build public ratings, creating a verified portfolio of real-world freelance success.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-2.5">🏢 Corporate Credibility</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Companies post gigs, review candidate profiles instantly backed by AI match score evaluations, chat in real-time, approve solution submissions, and write developer ratings—all from a single, streamlined web console.
              </p>
            </div>
          </div>

          {/* Interactive Help Desk Form */}
          <div className="bg-gray-55/40 border border-gray-100 p-6 rounded-2xl shadow-inner">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-1">📬 Contact Support Desk</h3>
            <p className="text-xs text-gray-400 mb-4">Have questions about billing, account security, or gig deployments? Message us directly.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="john@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Support Query / Feedback</label>
                <textarea
                  rows="4"
                  placeholder="Detail your question regarding billing, task statuses, or profile configs..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black transition shadow disabled:opacity-50"
              >
                {submitting ? "Opening Ticket..." : "Submit Support Request"}
              </button>
            </form>
          </div>
        </div>

        {/* Corporate Address & Contact Cards */}
        <div className="border-t pt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-gray-500">
          <div>
            <h4 className="font-extrabold text-gray-800 uppercase tracking-wider mb-1">🏢 Corporate Office</h4>
            <p>workMitra Technologies Private Limited</p>
            <p className="mt-0.5">Freelancer Hub Tower, Sector 62</p>
            <p>Noida, Uttar Pradesh, India</p>
          </div>
          <div>
            <h4 className="font-extrabold text-gray-800 uppercase tracking-wider mb-1">✉️ Direct Assistance</h4>
            <p>Primary Support: <span className="font-bold text-indigo-600">contact.workmitra@gmail.com</span></p>
            <p className="mt-0.5">Average Response Duration: &lt; 24 Hours</p>
            <p>Operating Hours: Mon - Fri, 9:00 AM - 6:00 PM IST</p>
          </div>
        </div>
      </div>
    </div>
  );
}
