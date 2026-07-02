import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import { useNavigate } from "react-router-dom";
import { useToast } from "./Toast";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

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

    let text = t("login.passwordStrengthWeak") + " ❌";
    if (score === 3) text = t("login.passwordStrengthMedium") + " ⚠️ (" + t("login.addSpecialChars") + ")";
    if (score === 4) text = t("login.passwordStrengthStrong") + " 🔥 " + t("login.perfectStructure");

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
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, { credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          
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
        setErrorMessage(data.error || t("login.invalidSignIn"));
      }
    } catch (err) {
      setErrorMessage(t("login.networkError", { message: err.message }));
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
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, { credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recoveryEmail })
      });
      const data = await response.json();
      if (response.ok) {
        setRecoveryMessage(t("login.resetInstructionsSent"));
        if (data.resetLink) {
          setGeneratedResetLink(data.resetLink);
        }
      } else {
        setErrorMessage(data.error || t("login.failedRecoveryLink"));
      }
    } catch (err) {
      setErrorMessage(t("login.otpVerificationError", { message: err.message }));
    } finally {
      setSendingRecovery(false);
    }
  };

  const handleOtpVerifySubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsVerifying(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register-verify`, { credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          emailOtp: emailOtpInput
        })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(t("login.registrationSuccessful"));
        localStorage.setItem("user", JSON.stringify(data.user));
        

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
        setErrorMessage(data.error || t("login.verificationFailed"));
      }
    } catch (err) {
      setErrorMessage(t("login.serverPortalError"));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden select-none p-4">
      
      {/* 🌌 Background Decorative Flow Elements */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft background glow spheres */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/20 dark:bg-slate-900/20 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300/20 rounded-full blur-[100px]"></div>

        {/* Floating Ambient Badges */}
        {view === "landing" && (
          <>
            <div className="hidden md:block absolute top-12 left-12 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-purple-300/50 px-6 py-3 rounded-2xl text-purple-900 dark:text-purple-200 text-sm font-bold animate-float-slow shadow-sm">
              🖥️ {t("login.agentServer")}
            </div>
            <div className="hidden md:block absolute top-24 right-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-pink-300/50 px-6 py-4 rounded-3xl text-pink-900 font-extrabold text-base animate-float-fast shadow-sm">
              🧠 {t("login.aiEngine")}
            </div>
            <div className="hidden md:block absolute bottom-24 left-16 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-blue-300/50 px-5 py-3 rounded-2xl text-blue-900 text-sm font-bold animate-float-slow shadow-sm">
              📦 {t("login.mediaServer")}
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
            <p className="text-purple-900/80 dark:text-purple-200 mt-2 text-sm md:text-base font-semibold leading-relaxed">{t("login.choosePathDesc")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full z-10 px-4">
            
            <button onClick={() => { setUserRole("student"); setView("auth"); }} className="group text-left p-8 bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/60 dark:border-slate-700/50 rounded-[32px] hover:border-purple-400 hover:bg-white/60 dark:hover:bg-slate-800/80 transition-all duration-300 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">💼</div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-white flex items-center justify-center text-2xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-purple-950 dark:text-white mb-2">{t("login.needJobTitle")}</h3>
              <p className="text-sm text-purple-900/70 dark:text-purple-200/70">{t("login.needJobDesc")}</p>
            </button>

            <button onClick={() => { setUserRole("company"); setView("auth"); }} className="group text-left p-8 bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/60 dark:border-slate-700/50 rounded-[32px] hover:border-pink-400 hover:bg-white/60 dark:hover:bg-slate-800/80 transition-all duration-300 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">🏢</div>
              <div className="w-12 h-12 rounded-2xl bg-pink-500 text-white flex items-center justify-center text-2xl mb-4">🤝</div>
              <h3 className="text-2xl font-bold text-purple-950 dark:text-white mb-2">{t("login.wantToHireTitle")}</h3>
              <p className="text-sm text-purple-900/70 dark:text-purple-200/70">{t("login.wantToHireDesc")}</p>
            </button>

            <button onClick={() => { setUserRole("college"); setView("auth"); }} className="group text-left p-8 bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/60 dark:border-slate-700/50 rounded-[32px] hover:border-indigo-400 hover:bg-white/60 dark:hover:bg-slate-800/80 transition-all duration-300 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">🎓</div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center text-2xl mb-4">🏫</div>
              <h3 className="text-2xl font-bold text-purple-950 dark:text-white mb-2">{t("login.professorTitle")}</h3>
              <p className="text-sm text-purple-900/70 dark:text-purple-200/70">{t("login.professorDesc")}</p>
            </button>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔑 VIEW 2: Authentication Layout (Mobile-Responsive Redesign)            */}
      {/* ========================================================================= */}
      {view === "auth" && (
        <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 relative z-20">
          <button onClick={() => { setView("landing"); setErrorMessage(""); }} className="absolute top-6 left-6 px-4 py-2 bg-purple-950/10 border border-purple-950/20 rounded-full text-xs font-bold text-purple-950 dark:text-purple-200 transition">← {t("login.backToPaths")}</button>
          
          {errorMessage && <div className="mb-4 px-4 py-2 bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 z-50 shadow-md">⚠️ {errorMessage}</div>}
          
          {isOtpVerifying ? (
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] shadow-[0_30px_60px_rgba(100,50,150,0.15)] p-8 border border-white/60 dark:border-slate-800/60 text-center space-y-6 animate-fade-in z-20">
              <div className="flex justify-center">
                <img src="/logo.png" alt="workMitra Logo" className="h-14 object-contain bg-white px-3 py-1.5 rounded-xl shadow-sm" />
              </div>
              
              <div>
                <h2 className="text-2xl font-black text-purple-950 dark:text-purple-200">{t("login.verifyAccount")}</h2>
                <p className="text-xs text-gray-400 mt-1">{t("login.verifyAccountDesc")}</p>
              </div>


              <form onSubmit={handleOtpVerifySubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-left text-[9px] font-bold text-gray-400 uppercase mb-1.5 px-1">{t("login.emailVerificationCode")}</label>
                  <input
                    type="text"
                    maxLength="6"
                    value={emailOtpInput}
                    onChange={(e) => setEmailOtpInput(e.target.value)}
                    placeholder={t("login.6DigitCode")}
                    className="w-full bg-purple-50/60 border border-purple-100 dark:border-slate-800 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-center tracking-widest font-black"
                    required
                  />
                </div>


                <button
                  type="submit"
                  disabled={isVerifying}
                  className={`w-full py-3.5 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition mt-2 ${isVerifying ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95"}`}
                >
                  {isVerifying ? t("login.verifying") : t("login.verifyAndCreate")}
                </button>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsOtpVerifying(false); setErrorMessage(""); }}
                    className="text-xs text-purple-600 hover:text-pink-600 font-bold transition hover:underline"
                  >
                    ← {t("login.cancelAndEdit")}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Desktop/Mobile Adaptive Form Container */
            <div className={`auth-container ${isSignUp ? "active" : ""} w-full max-w-md md:max-w-[768px] min-h-[580px] bg-white dark:bg-slate-900 rounded-[40px] shadow-[0_30px_60px_rgba(100,50,150,0.15)] overflow-hidden relative flex flex-col md:flex-row border border-white/60 dark:border-slate-800/60`}>
              
              {/* MOBILE ONLY NAVIGATION TABS */}
              <div className="flex md:hidden border-b border-purple-100 dark:border-slate-800 w-full">
                <button 
                  onClick={() => { setIsSignUp(false); setErrorMessage(""); }} 
                  className={`flex-1 py-4 text-sm font-bold ${!isSignUp ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-400"}`}
                >
                  {t("login.signInTab")}
                </button>
                <button 
                  onClick={() => { setIsSignUp(true); setErrorMessage(""); }} 
                  className={`flex-1 py-4 text-sm font-bold ${isSignUp ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-400"}`}
                >
                  {t("login.signUpTab")}
                </button>
              </div>

              {/* 📝 SIGN UP PORTAL PANEL */}
              <div className={`sign-up-panel flex-col items-center justify-center px-6 md:px-12 text-center text-gray-800 dark:text-gray-200 overflow-y-auto py-8 w-full md:w-1/2 md:absolute md:top-0 md:left-0 md:h-full md:flex ${
                isSignUp ? "flex min-h-[500px]" : "hidden"
              }`}>
                <form 
                  className="w-full space-y-3" 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (passwordStrength.score < 4) {
                      setErrorMessage(t("login.strongerPasswordRequired"));
                      return;
                    }
                    // Lightweight client-side check — backend does authoritative swot-node verification
                    const domainPart = email.toLowerCase().split("@")[1] || "";
                    const looksAcademic = /\.(edu|ac)\b/.test(domainPart) || /\.(org|res|ernet)\.in$/.test(domainPart);
                    if ((userRole === "student" || userRole === "college") && !looksAcademic) {
                      setErrorMessage(t("login.academicEmailRequired"));
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
                      const response = await fetch(`${API_BASE_URL}/api/auth/register`, { credentials: "include",
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                      });
                      const data = await response.json();
                      if (response.ok) {
                        setIsOtpVerifying(true);
                        setErrorMessage("");
                        setEmailOtpInput("");
                      } else {
                        setErrorMessage(data.error || t("login.registrationSystemError"));
                      }
                    } catch (err) {
                      setErrorMessage(t("login.registrationError", { message: err.message }));
                    } finally {
                      setIsRegistering(false);
                    }
                  }}
                >
                  <div className="flex justify-center -mb-2">
                    <img src="/logo.png" alt="workMitra Logo" className="h-14 object-contain bg-white px-3 py-1.5 rounded-xl shadow-sm" />
                  </div>
                  <h1 className="text-xl md:text-2xl font-extrabold text-purple-950 dark:text-purple-200">{t("login.createAccount")}</h1>
                  <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">{t("login.joiningAs", { role: userRole })}</p>
                  
                  {userRole === "company" ? (
                    <>
                      <input type="text" placeholder={t("login.companyName")} value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 dark:border-slate-800 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                      <input type="email" placeholder={t("login.companyEmail")} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 dark:border-slate-800 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                    </>
                  ) : userRole === "college" ? (
                    <>
                      <input type="text" placeholder={t("login.fullName")} value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 dark:border-slate-800 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                      <input type="email" placeholder={t("login.universityEmail")} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 dark:border-slate-800 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                      <input type="text" placeholder={t("login.universityName")} value={collegeName} onChange={(e) => setCollegeName(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 dark:border-slate-800 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                      <input type="text" placeholder={t("login.departmentName")} value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 dark:border-slate-800 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                    </>
                  ) : (
                    <>
                      <input type="text" placeholder={t("login.fullName")} value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 dark:border-slate-800 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                      <input type="email" placeholder={t("login.studentEmail")} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 dark:border-slate-800 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                      <input type="text" placeholder={t("login.collegeName")} value={collegeName} onChange={(e) => setCollegeName(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 dark:border-slate-800 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                      <input type="text" placeholder={t("login.enrollmentNumber")} value={enrollmentNumber} onChange={(e) => setEnrollmentNumber(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 dark:border-slate-800 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                    </>
                  )}
                  
                  <input type="tel" pattern="[0-9]{10}" placeholder={t("login.mobileNumber")} value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 dark:border-slate-800 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                  <input type="password" placeholder={t("login.password")} value={password} onChange={(e) => checkPasswordStrength(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 dark:border-slate-800 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                  
                  {password && (
                    <div className="w-full text-left text-[11px] font-bold px-1 space-y-1">
                      <p className={passwordStrength.score === 4 ? "text-green-600" : "text-amber-600"}>
                        {t("login.strength")}: {passwordStrength.text}
                      </p>
                      <div className="w-full bg-gray-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
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
                        {t("login.registering")}
                      </>
                    ) : t("login.signUpBtn")}
                  </button>
                </form>
              </div>

              {/* 🔑 SIGN IN PORTAL PANEL */}
              <div className={`sign-in-panel flex-col items-center justify-center px-6 md:px-12 text-center text-gray-800 dark:text-gray-200 py-8 w-full md:w-1/2 md:absolute md:top-0 md:left-0 md:h-full md:flex ${
                !isSignUp ? "flex min-h-[500px]" : "hidden"
              }`}>
                <form className="w-full space-y-4" onSubmit={handleLoginSubmit}>
                  <div className="flex justify-center -mb-2">
                    <img src="/logo.png" alt="workMitra Logo" className="h-14 object-contain bg-white px-3 py-1.5 rounded-xl shadow-sm" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-purple-950 dark:text-purple-200">{t("login.signInTitle")}</h1>
                  <p className="text-xs text-pink-600 font-bold uppercase tracking-wider">{t("login.accessingPortal")}</p>
                  <input type="email" placeholder={userRole === "company" ? t("login.companyEmail") : t("login.studentEmail")} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 dark:border-slate-800 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                  <input type="password" placeholder={t("login.password")} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-purple-50/60 border border-purple-100 dark:border-slate-800 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                  
                  <div className="text-right px-1">
                    <button type="button" onClick={handleForgotPassword} className="text-[11px] text-purple-600 hover:text-pink-600 font-bold transition outline-none">
                      {t("login.forgotPassword")}
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
                        {t("login.signingIn")}
                      </>
                    ) : t("login.signInBtn")}
                  </button>

                  <div className="flex items-center my-2">
                    <div className="flex-grow border-t border-purple-100 dark:border-slate-800"></div>
                    <span className="mx-3 text-[10px] uppercase font-bold text-purple-300">{t("login.or")}</span>
                    <div className="flex-grow border-t border-purple-100 dark:border-slate-800"></div>
                  </div>


                </form>
              </div>

              {/* 🔀 DESKTOP ONLY SLIDING SHIELD PANELS */}
              <div className="hidden md:block overlay-panel absolute top-0 left-1/2 w-1/2 h-full overflow-hidden z-30 rounded-l-[150px]">
                <div className="overlay-content bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600 text-white relative -left-full h-full w-[200%] transform translate-x-0 flex">
                  <div className="content-left absolute top-0 h-full w-1/2 flex flex-col items-center justify-center px-10 text-center transform -translate-x-[200%]">
                    <h1 className="text-3xl font-extrabold mb-2">{t("login.welcomeBack")}</h1>
                    <p className="text-xs text-purple-100 max-w-[240px] leading-relaxed mb-6">{t("login.enterCredentials")}</p>
                    <button type="button" onClick={() => { setIsSignUp(false); setErrorMessage(""); }} className="border-2 border-white text-white text-xs font-bold uppercase tracking-wider px-10 py-2.5 rounded-xl bg-transparent hover:bg-white dark:bg-slate-900 hover:text-purple-950 dark:text-purple-200 transition-all active:scale-95">{t("login.signInBtn")}</button>
                  </div>
                  <div className="content-right absolute top-0 right-0 h-full w-1/2 flex flex-col items-center justify-center px-10 text-center transform translate-x-0">
                    <h1 className="text-3xl font-extrabold mb-2">{t("login.helloFriend")}</h1>
                    <p className="text-xs text-purple-100 max-w-[240px] leading-relaxed mb-6">{t("login.registerCustom")}</p>
                    <button type="button" onClick={() => { setIsSignUp(true); setErrorMessage(""); }} className="border-2 border-white text-white text-xs font-bold uppercase tracking-wider px-10 py-2.5 rounded-xl bg-transparent hover:bg-white dark:bg-slate-900 hover:text-purple-950 dark:text-purple-200 transition-all active:scale-95">{t("login.signUpBtn")}</button>
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
          <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-[0_30px_60px_rgba(100,50,150,0.15)] p-8 max-w-md w-full border border-white/60 dark:border-slate-800/60 text-center space-y-6">
            <div className="flex justify-center">
              <img src="/logo.png" alt="workMitra Logo" className="h-14 object-contain bg-white px-3 py-1.5 rounded-xl shadow-sm" />
            </div>
            
            <div>
              <h2 className="text-2xl font-black text-purple-950 dark:text-purple-200">{t("login.resetPassword")}</h2>
              <p className="text-xs text-gray-400 mt-1">{t("login.resetPasswordDesc")}</p>
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
                  <div className="bg-purple-50 border border-purple-100 dark:border-slate-800 p-4 rounded-xl text-left space-y-2">
                    <span className="text-[10px] font-extrabold text-purple-700 uppercase block tracking-wider">{t("login.devModeRecovery")}</span>
                    <a 
                      href={generatedResetLink} 
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold break-all hover:underline"
                    >
                      {generatedResetLink}
                    </a>
                    <p className="text-[9px] text-gray-400 leading-relaxed">
                      {t("login.devModeRecoveryDesc")}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => { setView("auth"); setRecoveryEmail(""); }}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition"
                >
                  {t("login.returnToSignIn")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleRecoverySubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder={t("login.enterRegisteredEmail")}
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="w-full bg-purple-50/60 border border-purple-100 dark:border-slate-800 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
                
                <button
                  type="submit"
                  disabled={sendingRecovery}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition hover:opacity-95"
                >
                  {sendingRecovery ? t("login.initiatingRecovery") : t("login.sendResetLink")}
                </button>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => { setView("auth"); setErrorMessage(""); }}
                    className="text-xs text-purple-600 hover:text-pink-600 font-bold transition hover:underline"
                  >
                    ← {t("login.backToSignIn")}
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