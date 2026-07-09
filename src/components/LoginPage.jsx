// eslint-disable-next-line no-unused-vars
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  Building,
  Phone,
  Hash,
  BookOpen,
} from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { useLoginPage } from '../hooks/useLoginPage';

export default function LoginPage() {
  const { t } = useTranslation();

  const {
    view,
    setView,
    userRole,
    setUserRole,
    isSignUp,
    setIsSignUp,
    email,
    setEmail,
    password,
    setPassword,
    mobile,
    setMobile,
    fullName,
    setFullName,
    companyName,
    setCompanyName,
    collegeName,
    setCollegeName,
    enrollmentNumber,
    setEnrollmentNumber,
    // eslint-disable-next-line no-unused-vars
    departmentName,
    setDepartmentName,
    passwordStrength,
    setPasswordStrength,
    // eslint-disable-next-line no-unused-vars
    errorMessage,
    setErrorMessage,
    turnstileToken,
    setTurnstileToken,
    // eslint-disable-next-line no-unused-vars
    isRegistering,
    setIsRegistering,
    isLoggingIn,
    isVerifying,
    isOtpVerifying,
    setIsOtpVerifying,
    emailOtpInput,
    setEmailOtpInput,
    recoveryEmail,
    setRecoveryEmail,
    recoveryMessage,
    generatedResetLink,
    sendingRecovery,
    checkPasswordStrength,
    handleLoginSubmit,
    handleRegisterSubmit,
    handleForgotPassword,
    handleRecoverySubmit,
    handleOtpVerifySubmit,
  } = useLoginPage();

  return (
    <div className="min-h-screen w-full bg-paper flex items-center justify-center relative overflow-hidden p-4">
      {/* 🌌 Background Decorative Flow Elements */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft background glow spheres */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/20 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#F5A623]/10 rounded-full blur-[100px]"></div>

        {/* Floating Ambient Badges */}
        {view === 'landing' && (
          <>
            <div className="hidden md:block absolute top-12 left-12 bg-white/40 border border-[#F5A623]/50 px-6 py-3 rounded-xl text-[#1B2333] text-sm font-bold animate-float-slow shadow-sm">
              🖥️ {t('login.agentServer')}
            </div>
            <div className="hidden md:block absolute top-24 right-20 bg-white/50 border border-[#F5A623]/50 px-6 py-4 rounded-xl text-[#1B2333] font-extrabold text-base animate-float-fast shadow-sm">
              🧠 {t('login.aiEngine')}
            </div>
            <div className="hidden md:block absolute bottom-24 left-16 bg-white/40 border border-marigold-300/50 px-5 py-3 rounded-xl text-marigold-900 text-sm font-bold animate-float-slow shadow-sm">
              📦 {t('login.mediaServer')}
            </div>
          </>
        )}

        {/* ✈️ Aeroplane Motion Background Theme Elements */}
        <div
          className="absolute z-10 airplane-fly"
          style={{
            top: '20%',
            transform: 'translateY(-50%)',
          }}
        >
          <div className="text-4xl md:text-5xl opacity-35 animate-pulse">
            ✈️
          </div>
          {/* Trail effect */}
          <div className="absolute -z-10 w-24 md:w-32 h-1 bg-gradient-to-r from-transparent to-[#F5A623]/20 right-full top-1/2" />
        </div>

        {/* Moving line path */}
        <div className="absolute top-[20%] left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#F5A623]/20 to-transparent" />
      </div>

      {/* ========================================================================= */}
      {/* 🔮 VIEW 1: Paths / Landing Screen */}
      {/* ========================================================================= */}
      {view === 'landing' && (
        <div className="w-full min-h-screen flex flex-col items-center justify-center relative p-6 z-10 animate-fade-in">
          <div className="text-center max-w-2xl mb-12 z-10 flex flex-col items-center animate-fade-in">
            <div className="bg-white p-6 rounded-[40px] shadow-sm border border-white/20 mb-6">
              <img
                src="/logo.png"
                alt="workMitra Logo"
                className="w-56 h-auto object-contain filter drop-shadow-lg"
              />
            </div>
            <p className="text-[#6B7280] mt-2 text-sm md:text-base font-semibold leading-relaxed">
              {t('login.choosePathDesc')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full z-10 px-4">
            <button
              onClick={() => {
                setUserRole('student');
                setView('auth');
              }}
              className="group text-left p-8 bg-white/40 border border-ink-200 rounded-[32px] hover:border-[#F5A623] hover:bg-white/60 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">
                💼
              </div>
              <div className="w-12 h-12 rounded-xl bg-transparent text-white flex items-center justify-center text-2xl mb-4">
                🚀
              </div>
              <h3 className="text-2xl font-bold text-[#1B2333] mb-2">
                {t('login.needJobTitle')}
              </h3>
              <p className="text-sm text-[#6B7280]">{t('login.needJobDesc')}</p>
            </button>

            <button
              onClick={() => {
                setUserRole('company');
                setView('auth');
              }}
              className="group text-left p-8 bg-white/40 border border-ink-200 rounded-[32px] hover:border-[#F5A623] hover:bg-white/60 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">
                🏢
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#F5A623] text-white flex items-center justify-center text-2xl mb-4">
                🤝
              </div>
              <h3 className="text-2xl font-bold text-[#1B2333] mb-2">
                {t('login.wantToHireTitle')}
              </h3>
              <p className="text-sm text-[#6B7280]">
                {t('login.wantToHireDesc')}
              </p>
            </button>

            <button
              onClick={() => {
                setUserRole('college');
                setView('auth');
              }}
              className="group text-left p-8 bg-white/40 border border-ink-200 rounded-[32px] hover:border-marigold-400 hover:bg-white/60 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">
                🎓
              </div>
              <div className="w-12 h-12 rounded-xl bg-marigold-500 text-white flex items-center justify-center text-2xl mb-4">
                🏫
              </div>
              <h3 className="text-2xl font-bold text-[#1B2333] mb-2">
                {t('login.professorTitle')}
              </h3>
              <p className="text-sm text-[#6B7280]">
                {t('login.professorDesc')}
              </p>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔑 VIEW 2: Authentication Layout (Mobile-Responsive Redesign) */}
      {/* ========================================================================= */}
      {view === 'auth' && (
        <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 relative z-20">
          <button
            onClick={() => {
              setView('landing');
              setErrorMessage('');
            }}
            className="absolute top-6 left-6 px-4 py-2 bg-transparent border border-[#C8C9C2] rounded-[8px] px-[16px] py-[8px] text-[13px] font-bold text-[#3D4A5C] transition"
          >
            ← {t('login.backToPaths')}
          </button>

          {errorMessage && (
            <div className="mb-4 px-4 py-2 bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 z-50 shadow-md">
              ⚠️ {errorMessage}
            </div>
          )}

          {isOtpVerifying ? (
            <motion.div
              className="wm-panel wm-card w-full max-w-md bg-white rounded-[40px] shadow-[0_30px_60px_rgba(100,50,150,0.15)] p-8 border border-ink-200 text-center space-y-6 animate-fade-in z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex justify-center">
                <img
                  src="/logo.png"
                  alt="workMitra Logo"
                  className="h-14 object-contain bg-white px-3 py-1.5 rounded-xl shadow-sm"
                />
              </div>

              <div>
                <h2 className="text-2xl font-black text-[#1B2333]">
                  {t('login.verifyAccount')}
                </h2>
                <p className="text-xs text-ink-400 mt-1">
                  {t('login.verifyAccountDesc')}
                </p>
              </div>

              <form
                onSubmit={handleOtpVerifySubmit}
                className="space-y-4 text-left"
              >
                <div>
                  <label className="block text-left text-[9px] font-bold text-ink-400 uppercase mb-1.5 px-1">
                    {t('login.emailVerificationCode')}
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    value={emailOtpInput}
                    onChange={(e) => setEmailOtpInput(e.target.value)}
                    placeholder={t('login.6DigitCode')}
                    className="w-full bg-transparent border border-[#C8C9C2] text-sm px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] text-center tracking-widest font-black"
                    required
                  />
                  <p className="text-[10px] text-ink-400 mt-1.5 px-1">
                    Check your email inbox for the 6-digit code.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className={`w-full py-3.5 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition mt-2 ${isVerifying ? 'bg-ink-400 cursor-not-allowed' : 'bg-[#F5A623] hover:bg-[#E0941F] hover:opacity-95'}`}
                >
                  {isVerifying
                    ? t('login.verifying')
                    : t('login.verifyAndCreate')}
                </button>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOtpVerifying(false);
                      setErrorMessage('');
                    }}
                    className="text-xs text-[#F5A623] hover:text-[#E0941F] font-bold transition hover:underline"
                  >
                    ← {t('login.cancelAndEdit')}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            /* Desktop/Mobile Adaptive Form Container */
            <motion.div
              className={`wm-panel wm-card auth-container ${isSignUp ? 'active' : ''} w-full max-w-md md:max-w-[768px] min-h-[580px] bg-white rounded-[40px] shadow-[0_30px_60px_rgba(100,50,150,0.15)] overflow-hidden relative flex flex-col md:flex-row border border-ink-200`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              {/* MOBILE ONLY NAVIGATION TABS */}
              <div className="flex md:hidden border-b border-[#C8C9C2] w-full">
                <button
                  onClick={() => {
                    setIsSignUp(false);
                    setErrorMessage('');
                  }}
                  className={`flex-1 py-4 text-sm font-bold ${!isSignUp ? 'text-[#F5A623] border-b-2 border-[#F5A623]' : 'text-ink-400'}`}
                >
                  {t('login.signInTab')}
                </button>
                <button
                  onClick={() => {
                    setIsSignUp(true);
                    setErrorMessage('');
                  }}
                  className={`flex-1 py-4 text-sm font-bold ${isSignUp ? 'text-[#F5A623] border-b-2 border-[#F5A623]' : 'text-ink-400'}`}
                >
                  {t('login.signUpTab')}
                </button>
              </div>

              {/* 📝 SIGN UP PORTAL PANEL */}
              <div
                className={`sign-up-panel flex-col items-center justify-center px-6 md:px-12 text-center text-ink-800 overflow-y-auto py-8 w-full md:w-1/2 md:absolute md:top-0 md:left-0 md:h-full md:flex ${
                  isSignUp ? 'flex min-h-[500px]' : 'hidden'
                }`}
              >
                <form
                  className="w-full space-y-3"
                  onSubmit={handleRegisterSubmit}
                >
                  <div className="flex justify-center -mb-2">
                    <img
                      src="/logo.png"
                      alt="workMitra Logo"
                      className="h-14 object-contain bg-white px-3 py-1.5 rounded-xl shadow-sm"
                    />
                  </div>
                  <h1 className="text-xl md:text-2xl font-extrabold text-[#1B2333]">
                    {t('login.createAccount')}
                  </h1>
                  <p className="text-[12px] font-medium text-[#6B7280] tracking-wider">
                    {t('login.joiningAs', { role: userRole })}
                  </p>

                  {userRole === 'company' ? (
                    <>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                        <input
                          type="text"
                          placeholder={t('login.companyName')}
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all"
                          required
                        />
                      </div>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                        <input
                          type="email"
                          placeholder={t('login.companyEmail')}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all"
                          required
                        />
                      </div>
                    </>
                  ) : userRole === 'college' ? (
                    <>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                        <input
                          type="text"
                          placeholder={t('login.fullName')}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all"
                          required
                        />
                      </div>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                        <input
                          type="email"
                          placeholder={t('login.universityEmail')}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all"
                          required
                        />
                      </div>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                        <input
                          type="text"
                          placeholder={t('login.universityName')}
                          value={collegeName}
                          onChange={(e) => setCollegeName(e.target.value)}
                          className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all"
                          required
                        />
                      </div>
                      <div className="relative">
                        <BookOpen className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                        <input
                          type="text"
                          placeholder={t('login.departmentName')}
                          value={departmentName}
                          onChange={(e) => setDepartmentName(e.target.value)}
                          className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all"
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                        <input
                          type="text"
                          placeholder={t('login.fullName')}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all"
                          required
                        />
                      </div>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                        <input
                          type="email"
                          placeholder={t('login.studentEmail')}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all"
                          required
                        />
                      </div>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                        <input
                          type="text"
                          placeholder={t('login.collegeName')}
                          value={collegeName}
                          onChange={(e) => setCollegeName(e.target.value)}
                          className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all"
                          required
                        />
                      </div>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                        <input
                          type="text"
                          placeholder={t('login.enrollmentNumber')}
                          value={enrollmentNumber}
                          onChange={(e) => setEnrollmentNumber(e.target.value)}
                          className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all"
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                    <input
                      type="tel"
                      pattern="[0-9]{10}"
                      placeholder={t('login.mobileNumber')}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                    <input
                      type="password"
                      placeholder={t('login.password')}
                      value={password}
                      onChange={(e) => checkPasswordStrength(e.target.value)}
                      className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all"
                      required
                    />
                  </div>

                  {password && (
                    <div className="w-full text-left text-[11px] font-bold px-1 space-y-1">
                      <p
                        className={
                          passwordStrength.score === 4
                            ? 'text-green-600'
                            : 'text-amber-600'
                        }
                      >
                        {t('login.strength')}: {passwordStrength.text}
                      </p>
                      <div className="w-full bg-ink-100 h-1 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${passwordStrength.score === 4 ? 'bg-green-500' : passwordStrength.score >= 2 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{
                            width: `${(passwordStrength.score / 4) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-center my-2">
                    <Turnstile
                      siteKey={
                        import.meta.env.VITE_CF_TURNSTILE_SITE_KEY ||
                        '1x00000000000000000000AA'
                      }
                      onSuccess={(token) => setTurnstileToken(token)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordStrength.score < 4 || isRegistering}
                    className={`w-full text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl shadow-md mt-1 transition flex justify-center items-center ${passwordStrength.score === 4 && !isRegistering ? 'bg-[#F5A623] hover:bg-[#E0941F] hover:opacity-95 cursor-pointer' : 'bg-ink-400 cursor-not-allowed'}`}
                  >
                    {isRegistering ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        {t('login.registering')}
                      </>
                    ) : (
                      t('login.signUpBtn')
                    )}
                  </button>
                </form>
              </div>

              {/* 🔑 SIGN IN PORTAL PANEL */}
              <div
                className={`sign-in-panel flex-col items-center justify-center px-6 md:px-12 text-center text-ink-800 py-8 w-full md:w-1/2 md:absolute md:top-0 md:left-0 md:h-full md:flex ${
                  !isSignUp ? 'flex min-h-[500px]' : 'hidden'
                }`}
              >
                <form className="w-full space-y-4" onSubmit={handleLoginSubmit}>
                  <div className="flex justify-center -mb-2">
                    <img
                      src="/logo.png"
                      alt="workMitra Logo"
                      className="h-14 object-contain bg-white px-3 py-1.5 rounded-xl shadow-sm"
                    />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-[#1B2333]">
                    {t('login.signInTitle')}
                  </h1>
                  <p className="text-xs text-[#F5A623] font-bold uppercase tracking-wider">
                    {t('login.accessingPortal')}
                  </p>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                    <input
                      type="email"
                      placeholder={
                        userRole === 'company'
                          ? t('login.companyEmail')
                          : t('login.studentEmail')
                      }
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                    <input
                      type="password"
                      placeholder={t('login.password')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all"
                      required
                    />
                  </div>

                  <div className="text-right px-1">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[11px] text-[#F5A623] hover:text-[#E0941F] font-bold transition outline-none"
                    >
                      {t('login.forgotPassword')}
                    </button>
                  </div>

                  <div className="flex justify-center my-2">
                    <Turnstile
                      siteKey={
                        import.meta.env.VITE_CF_TURNSTILE_SITE_KEY ||
                        '1x00000000000000000000AA'
                      }
                      onSuccess={(token) => setTurnstileToken(token)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className={`w-full text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl shadow-md mt-1 transition flex justify-center items-center ${isLoggingIn ? 'bg-ink-400 cursor-not-allowed' : 'bg-[#F5A623] hover:bg-[#E0941F] hover:opacity-95'}`}
                  >
                    {isLoggingIn ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        {t('login.signingIn')}
                      </>
                    ) : (
                      t('login.signInBtn')
                    )}
                  </button>

                  <div className="flex items-center my-2">
                    <div className="flex-grow border-t border-[#C8C9C2]"></div>
                    <span className="mx-3 text-[10px] uppercase font-bold text-[#6B7280]">
                      {t('login.or')}
                    </span>
                    <div className="flex-grow border-t border-[#C8C9C2]"></div>
                  </div>
                </form>
              </div>

              {/* 🔀 DESKTOP ONLY SLIDING SHIELD PANELS */}
              <div className="hidden md:block overlay-panel absolute top-0 left-1/2 w-1/2 h-full overflow-hidden z-30 rounded-l-[150px]">
                <div className="overlay-content bg-[#F5A623] text-white relative -left-full h-full w-[200%] transform tranink-x-0 flex">
                  <div className="content-left absolute top-0 h-full w-1/2 flex flex-col items-center justify-center px-10 text-center transform -tranink-x-[200%]">
                    <h1 className="text-3xl font-extrabold mb-2">
                      {t('login.welcomeBack')}
                    </h1>
                    <p className="text-xs text-[#6B7280] max-w-[240px] leading-relaxed mb-6">
                      {t('login.enterCredentials')}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(false);
                        setErrorMessage('');
                      }}
                      className="border-2 border-white text-white text-xs font-bold uppercase tracking-wider px-10 py-2.5 rounded-xl bg-transparent hover:bg-white hover:text-[#1B2333] transition-all active:scale-95"
                    >
                      {t('login.signInBtn')}
                    </button>
                  </div>
                  <div className="content-right absolute top-0 right-0 h-full w-1/2 flex flex-col items-center justify-center px-10 text-center transform tranink-x-0">
                    <h1 className="text-3xl font-extrabold mb-2">
                      {t('login.helloFriend')}
                    </h1>
                    <p className="text-xs text-[#6B7280] max-w-[240px] leading-relaxed mb-6">
                      {t('login.registerCustom')}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(true);
                        setErrorMessage('');
                      }}
                      className="border-2 border-white text-white text-xs font-bold uppercase tracking-wider px-10 py-2.5 rounded-xl bg-transparent hover:bg-white hover:text-[#1B2333] transition-all active:scale-95"
                    >
                      {t('login.signUpBtn')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔑 VIEW 3: Password Recovery Screen */}
      {/* ========================================================================= */}
      {view === 'forgot' && (
        <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 z-10 animate-fade-in">
          <motion.div
            className="wm-panel wm-card bg-white rounded-[40px] shadow-[0_30px_60px_rgba(100,50,150,0.15)] p-8 max-w-md w-full border border-ink-200 text-center space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex justify-center">
              <img
                src="/logo.png"
                alt="workMitra Logo"
                className="h-14 object-contain bg-white px-3 py-1.5 rounded-xl shadow-sm"
              />
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#1B2333]">
                {t('login.resetPassword')}
              </h2>
              <p className="text-xs text-ink-400 mt-1">
                {t('login.resetPasswordDesc')}
              </p>
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
                  <div className="bg-transparent border border-[#C8C9C2] p-4 rounded-xl text-left space-y-2">
                    <span className="text-[10px] font-extrabold text-[#1B2333] uppercase block tracking-wider">
                      {t('login.devModeRecovery')}
                    </span>
                    <a
                      href={generatedResetLink}
                      className="text-xs text-marigold-500 hover:text-marigold-800 font-bold break-all hover:underline"
                    >
                      {generatedResetLink}
                    </a>
                    <p className="text-[9px] text-ink-400 leading-relaxed">
                      {t('login.devModeRecoveryDesc')}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => {
                    setView('auth');
                    setRecoveryEmail('');
                  }}
                  className="w-full py-3 bg-[#F5A623] hover:bg-[#E0941F] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition"
                >
                  {t('login.returnToSignIn')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleRecoverySubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder={t('login.enterRegisteredEmail')}
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="w-full bg-transparent border border-[#C8C9C2] text-sm px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                  required
                />

                <button
                  type="submit"
                  disabled={sendingRecovery}
                  className="w-full py-3.5 bg-[#F5A623] hover:bg-[#E0941F] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition hover:opacity-95"
                >
                  {sendingRecovery
                    ? t('login.initiatingRecovery')
                    : t('login.sendResetLink')}
                </button>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setView('auth');
                      setErrorMessage('');
                    }}
                    className="text-xs text-[#F5A623] hover:text-[#E0941F] font-bold transition hover:underline"
                  >
                    ← {t('login.backToSignIn')}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
