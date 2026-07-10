import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, User, Building, Phone, Hash, BookOpen } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

export default function LoginForms({
  isSignUp,
  setIsSignUp,
  userRole,
  email, setEmail,
  password, setPassword,
  mobile, setMobile,
  fullName, setFullName,
  companyName, setCompanyName,
  collegeName, setCollegeName,
  enrollmentNumber, setEnrollmentNumber,
  departmentName, setDepartmentName,
  passwordStrength, checkPasswordStrength,
  turnstileToken, setTurnstileToken,
  isRegistering, isLoggingIn,
  setErrorMessage,
  handleLoginSubmit,
  handleRegisterSubmit,
  handleForgotPassword
}) {
  const { t } = useTranslation();

  return (
    <motion.div
      className={`wm-panel wm-card auth-container ${isSignUp ? 'active' : ''} w-full max-w-md md:max-w-[768px] min-h-[580px] bg-white rounded-[40px] shadow-[0_30px_60px_rgba(100,50,150,0.15)] overflow-hidden relative flex flex-col md:flex-row border border-ink-200`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      {/* MOBILE ONLY NAVIGATION TABS */}
      <div className="flex md:hidden border-b border-[#C8C9C2] w-full">
        <button
          onClick={() => { setIsSignUp(false); setErrorMessage(''); }}
          className={`flex-1 py-4 text-sm font-bold ${!isSignUp ? 'text-[#F5A623] border-b-2 border-[#F5A623]' : 'text-ink-400'}`}
        >
          {t('login.signInTab')}
        </button>
        <button
          onClick={() => { setIsSignUp(true); setErrorMessage(''); }}
          className={`flex-1 py-4 text-sm font-bold ${isSignUp ? 'text-[#F5A623] border-b-2 border-[#F5A623]' : 'text-ink-400'}`}
        >
          {t('login.signUpTab')}
        </button>
      </div>

      {/* 📝 SIGN UP PORTAL PANEL */}
      <div className={`sign-up-panel flex-col items-center justify-center px-6 md:px-12 text-center text-ink-800 overflow-y-auto py-8 w-full md:w-1/2 md:absolute md:top-0 md:left-0 md:h-full md:flex ${isSignUp ? 'flex min-h-[500px]' : 'hidden'}`}>
        <form className="w-full space-y-3" onSubmit={handleRegisterSubmit}>
          <div className="flex justify-center -mb-2">
            <img src="/logo.png" alt="workMitra Logo" className="h-14 object-contain bg-white px-3 py-1.5 rounded-xl shadow-sm" />
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#1B2333]">{t('login.createAccount')}</h1>
          <p className="text-[12px] font-medium text-[#6B7280] tracking-wider">{t('login.joiningAs', { role: userRole })}</p>

          {userRole === 'company' ? (
            <>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                <input type="text" placeholder={t('login.companyName')} value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all" required />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                <input type="email" placeholder={t('login.companyEmail')} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all" required />
              </div>
            </>
          ) : userRole === 'college' ? (
            <>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                <input type="text" placeholder={t('login.fullName')} value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all" required />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                <input type="email" placeholder={t('login.universityEmail')} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all" required />
              </div>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                <input type="text" placeholder={t('login.universityName')} value={collegeName} onChange={(e) => setCollegeName(e.target.value)} className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all" required />
              </div>
              <div className="relative">
                <BookOpen className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                <input type="text" placeholder={t('login.departmentName')} value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all" required />
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                <input type="text" placeholder={t('login.fullName')} value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all" required />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                <input type="email" placeholder={t('login.studentEmail')} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all" required />
              </div>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                <input type="text" placeholder={t('login.collegeName')} value={collegeName} onChange={(e) => setCollegeName(e.target.value)} className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all" required />
              </div>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
                <input type="text" placeholder={t('login.enrollmentNumber')} value={enrollmentNumber} onChange={(e) => setEnrollmentNumber(e.target.value)} className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all" required />
              </div>
            </>
          )}

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
            <input type="tel" pattern="[0-9]{10}" placeholder={t('login.mobileNumber')} value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
            <input type="password" placeholder={t('login.password')} value={password} onChange={(e) => checkPasswordStrength(e.target.value)} className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all" required />
          </div>

          {password && (
            <div className="w-full text-left text-[11px] font-bold px-1 space-y-1">
              <p className={passwordStrength.score === 4 ? 'text-green-600' : 'text-amber-600'}>
                {t('login.strength')}: {passwordStrength.text}
              </p>
              <div className="w-full bg-ink-100 h-1 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-300 ${passwordStrength.score === 4 ? 'bg-green-500' : passwordStrength.score >= 2 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${(passwordStrength.score / 4) * 100}%` }} />
              </div>
            </div>
          )}
          <div className="flex justify-center my-2">
            <Turnstile siteKey={import.meta.env.VITE_CF_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} onSuccess={(token) => setTurnstileToken(token)} />
          </div>

          <button type="submit" disabled={passwordStrength.score < 4 || isRegistering} className={`w-full text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl shadow-md mt-1 transition flex justify-center items-center ${passwordStrength.score === 4 && !isRegistering ? 'bg-[#F5A623] hover:bg-[#E0941F] hover:opacity-95 cursor-pointer' : 'bg-gray-400 cursor-not-allowed'}`}>
            {isRegistering ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
      <div className={`sign-in-panel flex-col items-center justify-center px-6 md:px-12 text-center text-ink-800 py-8 w-full md:w-1/2 md:absolute md:top-0 md:left-0 md:h-full md:flex ${!isSignUp ? 'flex min-h-[500px]' : 'hidden'}`}>
        <form className="w-full space-y-4" onSubmit={handleLoginSubmit}>
          <div className="flex justify-center -mb-2">
            <img src="/logo.png" alt="workMitra Logo" className="h-14 object-contain bg-white px-3 py-1.5 rounded-xl shadow-sm" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1B2333]">{t('login.signInTitle')}</h1>
          <p className="text-xs text-[#F5A623] font-bold uppercase tracking-wider">{t('login.accessingPortal')}</p>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
            <input type="email" placeholder={userRole === 'company' ? t('login.companyEmail') : t('login.studentEmail')} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-4 h-4 z-10" />
            <input type="password" placeholder={t('login.password')} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent border border-[#C8C9C2] text-sm pl-11 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all" required />
          </div>

          <div className="text-right px-1">
            <button type="button" onClick={handleForgotPassword} className="text-[11px] text-[#F5A623] hover:text-[#E0941F] font-bold transition outline-none">
              {t('login.forgotPassword')}
            </button>
          </div>

          <div className="flex justify-center my-2">
            <Turnstile siteKey={import.meta.env.VITE_CF_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} onSuccess={(token) => setTurnstileToken(token)} />
          </div>

          <button type="submit" disabled={isLoggingIn} className={`w-full text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl shadow-md mt-1 transition flex justify-center items-center ${isLoggingIn ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#F5A623] hover:bg-[#E0941F] hover:opacity-95'}`}>
            {isLoggingIn ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('login.signingIn')}
              </>
            ) : (
              t('login.signInBtn')
            )}
          </button>
        </form>
      </div>

      {/* 🔀 DESKTOP ONLY SLIDING SHIELD PANELS */}
      <div className="hidden md:block overlay-panel absolute top-0 left-1/2 w-1/2 h-full overflow-hidden z-30 rounded-l-[150px]">
        <div className="overlay-content bg-[#F5A623] text-white relative -left-full h-full w-[200%] transform translate-x-0 flex">
          <div className="content-left absolute top-0 h-full w-1/2 flex flex-col items-center justify-center px-10 text-center transform -translate-x-[200%]">
            <h1 className="text-3xl font-extrabold mb-2">{t('login.welcomeBack')}</h1>
            <p className="text-xs text-[#6B7280] max-w-[240px] leading-relaxed mb-6">{t('login.enterCredentials')}</p>
            <button type="button" onClick={() => { setIsSignUp(false); setErrorMessage(''); }} className="border-2 border-white text-white text-xs font-bold uppercase tracking-wider px-10 py-2.5 rounded-xl bg-transparent hover:bg-white hover:text-[#1B2333] transition-all active:scale-95">
              {t('login.signInBtn')}
            </button>
          </div>
          <div className="content-right absolute top-0 right-0 h-full w-1/2 flex flex-col items-center justify-center px-10 text-center transform translate-x-0">
            <h1 className="text-3xl font-extrabold mb-2">{t('login.helloFriend')}</h1>
            <p className="text-xs text-[#6B7280] max-w-[240px] leading-relaxed mb-6">{t('login.registerCustom')}</p>
            <button type="button" onClick={() => { setIsSignUp(true); setErrorMessage(''); }} className="border-2 border-white text-white text-xs font-bold uppercase tracking-wider px-10 py-2.5 rounded-xl bg-transparent hover:bg-white hover:text-[#1B2333] transition-all active:scale-95">
              {t('login.signUpBtn')}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
