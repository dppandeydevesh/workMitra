import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import { useNavigate } from "react-router-dom";
import { useToast } from "./Toast";

export default function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();

  // ==========================================
  // 📦 State Management Portal
  // ==========================================
  const [view, setView] = useState("landing"); 
  const [userRole, setUserRole] = useState(""); 
  const [isSignUp, setIsSignUp] = useState(false); 
  
  // Form Field Tracks
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState(""); 
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState(""); 
  const [collegeName, setCollegeName] = useState("");
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [departmentName, setDepartmentName] = useState("");

  // Password Strength Tracking
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: "" });

  const [errorMessage, setErrorMessage] = useState("");

  // OTP Verification States
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const [emailOtpInput, setEmailOtpInput] = useState("");
  const [mobileOtpInput, setMobileOtpInput] = useState("");

  const [airplanePos, setAirplanePos] = useState(-10);
  useEffect(() => {
    const interval = setInterval(() => {
      setAirplanePos((prev) => (prev >= 110 ? -10 : prev + 0.5));
    }, 30);
    return () => clearInterval(interval);
  }, []);


  // ==========================================
  // 🧠 Password Strength Checker Logic
  // ==========================================
  const checkPasswordStrength = (pass) => {
    setPassword(pass);
    if (!pass) {
      setPasswordStrength({ score: 0, text: "" });
      return;
    }

    let score = 0;
    if (pass.length >= 8) score++; 
    if (/[A-Z]/.test(pass)) score++; 
    if (/[0-9]/.test(pass)) score++; 
    if (/[^A-Za-z0-9]/.test(pass)) score++; 

    let text = "Weak ❌";
    if (score === 3) text = "Medium ⚠️ (Add special characters/numbers)";
    if (score === 4) text = "Strong 🔥 Perfect Structure!";

    setPasswordStrength({ score, text });
  };

  // ==========================================
  // ⚡ API Pipeline Operations
  // ==========================================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoggingIn(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          if (data.token) {
            localStorage.setItem("token", data.token);
          }
          
          if (data.user.userRole === "company") {
            navigate("/company-dashboard"); 
          } else if (data.user.userRole === "admin") {
            navigate("/admin-dashboard");
          } else if (data.user.userRole === "college") {
            navigate("/college-dashboard");
          } else {
            if (data.user.hasCompletedProfile === true) {
              navigate("/dashboard");
            } else {
              navigate("/preferences"); 
            }
          }
        }
      } else {
        setErrorMessage(data.error || "Invalid sign-in credentials.");
      }
    } catch (err) {
      setErrorMessage("Cannot connect to server portal.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Recovery States
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [generatedResetLink, setGeneratedResetLink] = useState("");
  const [sendingRecovery, setSendingRecovery] = useState(false);

  const handleForgotPassword = () => {
    setView("forgot");
    setErrorMessage("");
    setRecoveryMessage("");
    setGeneratedResetLink("");
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setRecoveryMessage("");
    setSendingRecovery(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recoveryEmail })
      });
      const data = await response.json();
      if (response.ok) {
        setRecoveryMessage("Password reset instructions sent successfully!");
        if (data.resetLink) {
          setGeneratedResetLink(data.resetLink);
        }
      } else {
        setErrorMessage(data.error || "Failed to generate recovery link.");
      }
    } catch (err) {
      setErrorMessage("Error connecting to server gateway.");
    } finally {
      setSendingRecovery(false);
    }
  };

  const handleOtpVerifySubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsVerifying(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          emailOtp: emailOtpInput,
          mobileOtp: mobileOtpInput
        })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Registration Successful!");
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem("token", data.token);
        }

        // Reset registration fields
        setCompanyName("");
        setFullName("");
        setEmail("");
        setPassword("");
        setMobile("");
        setCollegeName("");
        setEnrollmentNumber("");
        setPasswordStrength({ score: 0, text: "" });
        setIsSignUp(false);
        setIsOtpVerifying(false);

        if (data.user.userRole === "company") {
          navigate("/company-dashboard");
        } else if (data.user.userRole === "admin") {
          navigate("/admin-dashboard");
        } else if (data.user.userRole === "college") {
          navigate("/college-dashboard");
        } else {
          navigate("/preferences");
        }
      } else {
        setErrorMessage(data.error || "Verification failed.");
      }
    } catch (err) {
      setErrorMessage("Error communicating with server portal.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden select-none p-4">
      
      {/* 🌌 Background Decorative Flow Elements */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft background glow spheres */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/20 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300/20 rounded-full blur-[100px]"></div>

        {/* Floating Ambient Badges */}
        {view === "landing" && (
          <>
            <div className="hidden md:block absolute top-12 left-12 bg-white/40 backdrop-blur-md border border-purple-300/50 px-6 py-3 rounded-2xl text-purple-900 text-sm font-bold animate-float-slow shadow-sm">
              🖥️ Agent Server
            </div>
            <div className="hidden md:block absolute top-24 right-20 bg-white/50 backdrop-blur-md border border-pink-300/50 px-6 py-4 rounded-3xl text-pink-900 font-extrabold text-base animate-float-fast shadow-sm">
              🧠 AI Engine
            </div>
            <div className="hidden md:block absolute bottom-24 left-16 bg-white/40 backdrop-blur-md border border-blue-300/50 px-5 py-3 rounded-2xl text-blue-900 text-sm font-bold animate-float-slow shadow-sm">
              📦 Media Server
            </div>
          </>
        )}

        {/* ✈️ Aeroplane Motion Background Theme Elements */}
        <div 
          className="absolute z-10 transition-all duration-75"
          style={{ 
            left: `${airplanePos}%`, 
            top: '20%',
            transform: 'translateY(-50%)'
          }}
        >
          <div className="text-4xl md:text-5xl opacity-35 animate-pulse">✈️</div>
          {/* Trail effect */}
          <div className="absolute -z-10 w-24 md:w-32 h-1 bg-gradient-to-r from-transparent to-purple-500/20 right-full top-1/2" />
        </div>

        {/* Moving line path */}
        <div className="absolute top-[20%] left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-300/20 to-transparent" />
      </div>

      {/* ========================================================================= */}
      {/* 🔮 VIEW 1: Paths / Landing Screen                                        */}
      {/* ========================================================================= */}
      {view === "landing" && (
        <div className="w-full min-h-screen flex flex-col items-center justify-center relative p-6 z-10 animate-fade-in">
          <div className="text-center max-w-2xl mb-12 z-10 flex flex-col items-center animate-fade-in">
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-[40px] shadow-xl border border-white/20 dark:border-slate-700/50 mb-6 backdrop-blur-xl">
              <img src="/logo.png" alt="workMitra Logo" className="w-56 h-auto object-contain filter drop-shadow-lg" />
            </div>
            <p className="text-purple-900/80 dark:text-purple-200 mt-2 text-sm md:text-base font-semibold leading-relaxed">Choose your path to establish active student-employer connection nodes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full z-10 px-4">
            
            <button onClick={() => { setUserRole("student"); setView("auth"); }} className="group text-left p-8 bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/60 dark:border-slate-700/50 rounded-[32px] hover:border-purple-400 hover:bg-white/60 dark:hover:bg-slate-800/80 transition-all duration-300 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">💼</div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-white flex items-center justify-center text-2xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-purple-950 dark:text-white mb-2">I Need a Job</h3>
              <p className="text-sm text-purple-900/70 dark:text-purple-200/70">Build student profiles, submit skill proofs, and clear tasks.</p>
            </button>

            <button onClick={() => { setUserRole("company"); setView("auth"); }} className="group text-left p-8 bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/60 dark:border-slate-700/50 rounded-[32px] hover:border-pink-400 hover:bg-white/60 dark:hover:bg-slate-800/80 transition-all duration-300 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">🏢</div>
              <div className="w-12 h-12 rounded-2xl bg-pink-500 text-white flex items-center justify-center text-2xl mb-4">🤝</div>
              <h3 className="text-2xl font-bold text-purple-950 dark:text-white mb-2">I Want to Hire</h3>
              <p className="text-sm text-purple-900/70 dark:text-purple-200/70">Post corporate tracks, evaluate task solutions, and fund assignments.</p>
            </button>

            <button onClick={() => { setUserRole("college"); setView("auth"); }} className="group text-left p-8 bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/60 dark:border-slate-700/50 rounded-[32px] hover:border-indigo-400 hover:bg-white/60 dark:hover:bg-slate-800/80 transition-all duration-300 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">🎓</div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center text-2xl mb-4">🏫</div>
              <h3 className="text-2xl font-bold text-purple-950 dark:text-white mb-2">Professor / HOD</h3>
              <p className="text-sm text-purple-900/70 dark:text-purple-200/70">Audit placement tracks, endorse top student profiles, whitelist recruiters.</p>
            </button>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔑 VIEW 2: Authentication Layout (Mobile-Responsive Redesign)            */}
      {/* ========================================================================= */}
      {view === "auth" && (
        <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 relative z-20">
          <button onClick={() => { setView("landing"); setErrorMessage(""); }} className="absolute top-6 left-6 px-4 py-2 bg-purple-950/10 border border-purple-950/20 rounded-full text-xs font-bold text-purple-950 transition">← Back to Paths</button>
          
          {errorMessage && <div className="mb-4 px-4 py-2 bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 z-50 shadow-md">⚠️ {errorMessage}</div>}
          
          {isOtpVerifying ? (
            <div className="w-full max-w-md bg-white rounded-[40px] shadow-[0_30px_60px_rgba(100,50,150,0.15)] p-8 border border-white/60 text-center space-y-6 animate-fade-in z-20">
              <div className="flex justify-center">
                <img src="/logo.png" alt="workMitra Logo" className="h-20 object-contain mix-blend-multiply" />
              </div>
              
              <div>
                <h2 className="text-2xl font-black text-purple-950">Verify Your Account</h2>
                <p className="text-xs text-gray-400 mt-1">We sent a 6-digit verification code to your registered email address.</p>
              </div>


              <form onSubmit={handleOtpVerifySubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-left text-[9px] font-bold text-gray-400 uppercase mb-1.5 px-1">Email Verification Code</label>
                  <input
                    type="text"
                    maxLength="6"
                    value={emailOtpInput}
                    onChange={(e) => setEmailOtpInput(e.target.value)}
                    placeholder="6-digit code"
                    className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-center tracking-widest font-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-left text-[9px] font-bold text-gray-400 uppercase mb-1.5 px-1">Mobile Verification Code</label>
                  <input
                    type="text"
                    maxLength="6"
                    value={mobileOtpInput}
                    onChange={(e) => setMobileOtpInput(e.target.value)}
                    placeholder="6-digit code"
                    className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-center tracking-widest font-black"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className={`w-full py-3.5 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition mt-2 ${isVerifying ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95"}`}
                >
                  {isVerifying ? "Verifying..." : "Verify and Create Account"}
                </button>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsOtpVerifying(false); setErrorMessage(""); }}
                    className="text-xs text-purple-600 hover:text-pink-600 font-bold transition hover:underline"
                  >
                    ← Cancel and Edit Registration
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Desktop/Mobile Adaptive Form Container */
            <div className={`auth-container ${isSignUp ? "active" : ""} w-full max-w-md md:max-w-[768px] min-h-[580px] bg-white rounded-[40px] shadow-[0_30px_60px_rgba(100,50,150,0.15)] overflow-hidden relative flex flex-col md:flex-row border border-white/60`}>
              
              {/* MOBILE ONLY NAVIGATION TABS */}
              <div className="flex md:hidden border-b border-purple-100 w-full">
                <button 
                  onClick={() => { setIsSignUp(false); setErrorMessage(""); }} 
                  className={`flex-1 py-4 text-sm font-bold ${!isSignUp ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-400"}`}
                >
                  Sign In
                </button>
                <button 
                  onClick={() => { setIsSignUp(true); setErrorMessage(""); }} 
                  className={`flex-1 py-4 text-sm font-bold ${isSignUp ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-400"}`}
                >
                  Sign Up
                </button>
              </div>

              {/* 📝 SIGN UP PORTAL PANEL */}
              <div className={`sign-up-panel flex-col items-center justify-center px-6 md:px-12 text-center text-gray-800 overflow-y-auto py-8 w-full md:w-1/2 md:absolute md:top-0 md:left-0 md:h-full md:flex ${
                isSignUp ? "flex min-h-[500px]" : "hidden"
              }`}>
                <form 
                  className="w-full space-y-3" 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (passwordStrength.score < 4) {
                      setErrorMessage("Please establish a stronger password structure before continuing.");
                      return;
                    }
                    // Lightweight client-side check — backend does authoritative swot-node verification
                    const domainPart = email.toLowerCase().split("@")[1] || "";
                    const looksAcademic = /\.(edu|ac)\b/.test(domainPart) || /\.(org|res|ernet)\.in$/.test(domainPart);
                    if ((userRole === "student" || userRole === "college") && !looksAcademic) {
                      setErrorMessage("Please use your official university email address. The backend will verify your institution automatically.");
                      return;
                    }
                    setErrorMessage("");
                    setIsRegistering(true);
                    
                    let payload;
                    if (userRole === "company") {
                      payload = { fullName: companyName, companyName, email, password, mobile, userRole: "company" };
                    } else if (userRole === "college") {
                      payload = { fullName, email, password, mobile, collegeName, departmentName, userRole: "college" };
                    } else {
                      payload = { fullName, email, password, mobile, collegeName, enrollmentNumber, userRole: "student" };
                    }

                    try {
                      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                      });
                      const data = await response.json();
                      if (response.ok) {
                        setIsOtpVerifying(true);
                        setErrorMessage("");
                        setEmailOtpInput("");
                        setMobileOtpInput("");
                      } else {
                        setErrorMessage(data.error || "Registration system error.");
                      }
                    } catch (err) {
                      setErrorMessage("Unable to submit registration payload.");
                    } finally {
                      setIsRegistering(false);
                    }
                  }}
                >
                  <div className="flex justify-center -mb-2">
                    <img src="/logo.png" alt="workMitra Logo" className="h-16 object-contain" />
                  </div>
                  <h1 className="text-xl md:text-2xl font-extrabold text-purple-950">Create Account</h1>
                  <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">Joining as {userRole}</p>
                  
                  {userRole === "company" ? (
                    <>
                      <input type="text" placeholder="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                      <input type="email" placeholder="Company Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                    </>
                  ) : userRole === "college" ? (
                    <>
                      <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                      <input type="email" placeholder="University Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                      <input type="text" placeholder="University / College Name" value={collegeName} onChange={(e) => setCollegeName(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                      <input type="text" placeholder="Department Name (e.g. Computer Science)" value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                    </>
                  ) : (
                    <>
                      <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                      <input type="email" placeholder="Student Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                      <input type="text" placeholder="College Name" value={collegeName} onChange={(e) => setCollegeName(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                      <input type="text" placeholder="Enrollment / Roll Number" value={enrollmentNumber} onChange={(e) => setEnrollmentNumber(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                    </>
                  )}
                  
                  <input type="tel" pattern="[0-9]{10}" placeholder="Mobile Number (10 digits)" value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                  <input type="password" placeholder="Password" value={password} onChange={(e) => checkPasswordStrength(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                  
                  {password && (
                    <div className="w-full text-left text-[11px] font-bold px-1 space-y-1">
                      <p className={passwordStrength.score === 4 ? "text-green-600" : "text-amber-600"}>
                        Strength: {passwordStrength.text}
                      </p>
                      <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${passwordStrength.score === 4 ? "bg-green-500" : passwordStrength.score >= 2 ? "bg-amber-400" : "bg-red-400"}`}
                          style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={passwordStrength.score < 4 || isRegistering}
                    className={`w-full text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl shadow-md mt-1 transition flex justify-center items-center ${passwordStrength.score === 4 && !isRegistering ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 cursor-pointer" : "bg-gray-400 cursor-not-allowed"}`}
                  >
                    {isRegistering ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Registering...
                      </>
                    ) : "Sign Up"}
                  </button>
                </form>
              </div>

              {/* 🔑 SIGN IN PORTAL PANEL */}
              <div className={`sign-in-panel flex-col items-center justify-center px-6 md:px-12 text-center text-gray-800 py-8 w-full md:w-1/2 md:absolute md:top-0 md:left-0 md:h-full md:flex ${
                !isSignUp ? "flex min-h-[500px]" : "hidden"
              }`}>
                <form className="w-full space-y-4" onSubmit={handleLoginSubmit}>
                  <div className="flex justify-center -mb-2">
                    <img src="/logo.png" alt="workMitra Logo" className="h-16 object-contain" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-purple-950">Sign In</h1>
                  <p className="text-xs text-pink-600 font-bold uppercase tracking-wider">Accessing portal</p>
                  <input type="email" placeholder={userRole === "company" ? "Company Email" : "Student Email"} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                  <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                  
                  <div className="text-right px-1">
                    <button type="button" onClick={handleForgotPassword} className="text-[11px] text-purple-600 hover:text-pink-600 font-bold transition outline-none">
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className={`w-full text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl shadow-md mt-1 transition flex justify-center items-center ${isLoggingIn ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95"}`}
                  >
                    {isLoggingIn ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Signing In...
                      </>
                    ) : "Sign In"}
                  </button>

                  <div className="flex items-center my-2">
                    <div className="flex-grow border-t border-purple-100"></div>
                    <span className="mx-3 text-[10px] uppercase font-bold text-purple-300">or</span>
                    <div className="flex-grow border-t border-purple-100"></div>
                  </div>


                </form>
              </div>

              {/* 🔀 DESKTOP ONLY SLIDING SHIELD PANELS */}
              <div className="hidden md:block overlay-panel absolute top-0 left-1/2 w-1/2 h-full overflow-hidden z-30 rounded-l-[150px]">
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
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔑 VIEW 3: Password Recovery Screen                                      */}
      {/* ========================================================================= */}
      {view === "forgot" && (
        <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 z-10 animate-fade-in">
          <div className="bg-white rounded-[40px] shadow-[0_30px_60px_rgba(100,50,150,0.15)] p-8 max-w-md w-full border border-white/60 text-center space-y-6">
            <div className="flex justify-center">
              <img src="/logo.png" alt="workMitra Logo" className="h-20 object-contain mix-blend-multiply" />
            </div>
            
            <div>
              <h2 className="text-2xl font-black text-purple-950">Reset Password</h2>
              <p className="text-xs text-gray-400 mt-1">Initialize your credentials node recovery workflow.</p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl text-left">
                ⚠️ {errorMessage}
              </div>
            )}

            {recoveryMessage ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-xl text-left">
                  ✓ {recoveryMessage}
                </div>
                {generatedResetLink && (
                  <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl text-left space-y-2">
                    <span className="text-[10px] font-extrabold text-purple-700 uppercase block tracking-wider">Dev Mode Recovery Link</span>
                    <a 
                      href={generatedResetLink} 
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold break-all hover:underline"
                    >
                      {generatedResetLink}
                    </a>
                    <p className="text-[9px] text-gray-400 leading-relaxed">
                      Click the simulated reset link above to open the reset password screen in local sandbox mode.
                    </p>
                  </div>
                )}
                <button
                  onClick={() => { setView("auth"); setRecoveryEmail(""); }}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleRecoverySubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="Enter your registered email address"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="w-full bg-purple-50/60 border border-purple-100 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
                
                <button
                  type="submit"
                  disabled={sendingRecovery}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition hover:opacity-95"
                >
                  {sendingRecovery ? "Initiating recovery..." : "Send Reset Link"}
                </button>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => { setView("auth"); setErrorMessage(""); }}
                    className="text-xs text-purple-600 hover:text-pink-600 font-bold transition hover:underline"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}