import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  // ==========================================
  // 📦 State Management Portal
  // ==========================================
  const [view, setView] = useState("landing"); 
  const [userRole, setUserRole] = useState(""); // Stores 'student' or 'company'
  const [isSignUp, setIsSignUp] = useState(false); 
  
  // Form Field Tracks
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState(""); // Track for corporate paths

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  // ==========================================
  // 🟠 Mouse Tracking Effect
  // ==========================================
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ==========================================
  // ⚡ API Pipeline Operations
  // ==========================================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          
          // 🚀 रीडायरेक्ट लॉजिक: रोल चेक करके अलग-अलग प्रिफरेंस पेज पर भेजेंगे
          if (data.user.userRole === "company") {
            navigate("/company-preferences"); 
          } else {
            navigate("/preferences"); 
          }
        }
      } else {
        setErrorMessage(data.error || "Invalid sign-in credentials.");
      }
    } catch (err) {
      setErrorMessage("Cannot connect to server portal.");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden select-none p-4">
      
      {/* 🟠 Cursor follower sphere */}
      <div 
        className="fixed w-8 h-8 bg-orange-500 rounded-full pointer-events-none z-50 transition-transform duration-75"
        style={{ left: mousePos.x - 16, top: mousePos.y - 16, boxShadow: '0 0 20px rgba(249,115,22,0.5)' }}
      />

      {/* 🌌 Background Isometric Flow Layout */}
      <div className="absolute inset-0 flex items-center justify-center opacity-70 pointer-events-none z-0">
        <div className="relative w-[600px] h-[400px]">
          <div className="absolute top-10 left-10 bg-white/40 backdrop-blur-md border border-purple-300/50 px-6 py-3 rounded-2xl text-purple-900 text-sm font-bold animate-float-slow">🖥️ Agent Server</div>
          <div className="absolute top-24 left-44 w-24 h-[2px] bg-purple-400/20 rotate-12"></div>
          <div className="absolute top-24 right-32 bg-white/50 backdrop-blur-md border border-pink-300/50 px-6 py-4 rounded-3xl text-pink-900 font-extrabold text-base animate-float-fast">🧠 AI Engine</div>
          <div className="absolute bottom-16 left-24 bg-white/40 backdrop-blur-md border border-blue-300/50 px-5 py-3 rounded-2xl text-blue-900 text-sm font-bold animate-float-slow">📦 Media Server</div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-white/20 rounded-full blur-[80px]"></div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🔮 VIEW 1: Paths / Landing Screen                                        */}
      {/* ========================================================================= */}
      {view === "landing" && (
        <div className="w-full min-h-screen flex flex-col items-center justify-center relative p-6 z-10 animate-fade-in">
          <div className="text-center max-w-2xl mb-12 z-10">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-purple-950">
              Welcome to <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">InternUp</span>
            </h1>
            <p className="text-purple-900/80 mt-4 text-sm md:text-base font-semibold leading-relaxed">Choose your tracking deployment path to establish active authentication nodes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full z-10 px-4">
            
            {/* Scenario 1 Initializer: Want Job */}
            <button onClick={() => { setUserRole("student"); setView("auth"); }} className="group text-left p-8 bg-white/40 backdrop-blur-lg border border-white/60 rounded-[32px] hover:border-purple-400 hover:bg-white/60 transition-all duration-300 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">💼</div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-white flex items-center justify-center text-2xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-purple-950 mb-2">I Need a Job</h3>
              <p className="text-sm text-purple-900/70">Build student profiles, submit skill proofs, and clear tasks.</p>
            </button>

            {/* Scenario 2 Initializer: Want to Hire */}
            <button onClick={() => { setUserRole("company"); setView("auth"); }} className="group text-left p-8 bg-white/40 backdrop-blur-lg border border-white/60 rounded-[32px] hover:border-pink-400 hover:bg-white/60 transition-all duration-300 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">🏢</div>
              <div className="w-12 h-12 rounded-2xl bg-pink-500 text-white flex items-center justify-center text-2xl mb-4">🤝</div>
              <h3 className="text-2xl font-bold text-purple-950 mb-2">I Want to Hire</h3>
              <p className="text-sm text-purple-900/70">Post corporate tracks, evaluate task solutions, and fund assignments.</p>
            </button>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔑 VIEW 2: Sliding Authentication Layout                                  */}
      {/* ========================================================================= */}
      {view === "auth" && (
        <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 relative z-20">
          <button onClick={() => { setView("landing"); setErrorMessage(""); }} className="absolute top-6 left-6 px-4 py-2 bg-purple-950/10 border border-purple-950/20 rounded-full text-xs font-bold text-purple-950 transition">← Back to Paths</button>
          {errorMessage && <div className="mb-4 px-4 py-2 bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 z-50 shadow-md">⚠️ {errorMessage}</div>}
          
          <div className={`auth-container ${isSignUp ? "active" : ""} relative w-full max-w-[768px] min-h-[500px] bg-white rounded-[40px] shadow-[0_30px_60px_rgba(100,50,150,0.15)] overflow-hidden flex border border-white/60`}>
            
            {/* 📝 DYNAMIC SIGN UP PORTAL PANEL */}
            <div className="sign-up-panel absolute top-0 left-0 h-full w-1/2 opacity-0 z-1 pointer-events-none flex flex-col items-center justify-center px-12 text-center text-gray-800">
              <form 
                className="w-full space-y-4" 
                onSubmit={async (e) => {
                  e.preventDefault();
                  setErrorMessage("");
                  
                  const payload = userRole === "company"
                    ? { fullName: companyName, companyName, email, password, userRole: "company" }
                    : { fullName, email, password, userRole: "student" };

                  try {
                    const response = await fetch("http://localhost:5000/api/auth/register", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                    const data = await response.json();
                    if (response.ok) {
                      alert("Registration Successful!");
                      setCompanyName("");
                      setFullName("");
                      setEmail("");
                      setPassword("");
                      setIsSignUp(false);
                    } else {
                      setErrorMessage(data.error || "Registration system error.");
                    }
                  } catch (err) {
                    setErrorMessage("Unable to submit registration payload.");
                  }
                }}
              >
                <h1 className="text-3xl font-extrabold text-purple-950">Create Account</h1>
                <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">Joining as {userRole}</p>
                
                {/* Dynamically Switches Input fields inside the Sign Up block */}
                {userRole === "company" ? (
                  <>
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Company Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
                      required
                    />
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Student Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
                      required
                    />
                  </>
                )}
                
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl shadow-md mt-2">Sign Up</button>
              </form>
            </div>

            {/* 🔑 SIGN IN PORTAL PANEL */}
            <div className="sign-in-panel absolute top-0 left-0 h-full w-1/2 z-2 flex flex-col items-center justify-center px-12 text-center text-gray-800">
              <form className="w-full space-y-4" onSubmit={handleLoginSubmit}>
                <h1 className="text-3xl font-extrabold text-purple-950">Sign In</h1>
                <p className="text-xs text-pink-600 font-bold uppercase tracking-wider">Accessing portal</p>
                <input type="email" placeholder={userRole === "company" ? "Company Email" : "Student Email"} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl shadow-md mt-2">Sign In</button>
              </form>
            </div>

            {/* 🔀 DYNAMIC SLIDING SHIELD PANELS */}
            <div className="overlay-panel absolute top-0 left-1/2 w-1/2 h-full overflow-hidden z-30 rounded-l-[150px]">
              <div className="overlay-content bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600 text-white relative -left-full h-full w-[200%] transform translate-x-0 flex">
                <div className="content-left absolute top-0 h-full w-1/2 flex flex-col items-center justify-center px-10 text-center transform -translate-x-[200%]">
                  <h1 className="text-3xl font-extrabold mb-2">Welcome Back!</h1>
                  <p className="text-xs text-purple-100 max-w-[240px] leading-relaxed mb-6">Enter your credentials to return to your configuration tracks.</p>
                  <button type="button" onClick={() => { setIsSignUp(false); setErrorMessage(""); }} className="border-2 border-white text-white text-xs font-bold uppercase tracking-wider px-10 py-2.5 rounded-xl bg-transparent hover:bg-white hover:text-purple-950 transition-all active:scale-95">Sign In</button>
                </div>
                <div className="content-right absolute top-0 right-0 h-full w-1/2 flex flex-col items-center justify-center px-10 text-center transform translate-x-0">
                  <h1 className="text-3xl font-extrabold mb-2">Hello, Friend!</h1>
                  <p className="text-xs text-purple-100 max-w-[240px] leading-relaxed mb-6">Register your custom tracking details to activate credentials.</p>
                  <button type="button" onClick={() => { setIsSignUp(true); setErrorMessage(""); }} className="border-2 border-white text-white text-xs font-bold uppercase tracking-wider px-10 py-2.5 rounded-xl bg-transparent hover:bg-white hover:text-purple-950 transition-all active:scale-95">Sign Up</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}