import { useTranslation } from 'react-i18next';
import { useLoginPage } from '../hooks/useLoginPage';

import AuthLanding from './auth/AuthLanding';
import OtpVerification from './auth/OtpVerification';
import LoginForms from './auth/LoginForms';
import PasswordRecoveryForm from './auth/PasswordRecoveryForm';

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
    departmentName,
    setDepartmentName,
    passwordStrength,
    checkPasswordStrength,
    errorMessage,
    setErrorMessage,
    turnstileToken,
    setTurnstileToken,
    turnstileResetKey,
    resetTurnstile,
    isRegistering,
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
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/20 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#F5A623]/10 rounded-full blur-[100px]"></div>

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

        {/* Flight path sits at the very top of the viewport (hidden on mobile)
            so the plane never crosses the auth card and reads as decorative,
            not as a stuck UI element. */}
        <div
          className="hidden md:block absolute z-0 airplane-fly"
          style={{ top: '6%', transform: 'translateY(-50%)' }}
        >
          <div className="text-3xl opacity-25">✈️</div>
          <div className="absolute -z-10 w-24 md:w-32 h-1 bg-gradient-to-r from-transparent to-[#F5A623]/20 right-full top-1/2" />
        </div>
        <div className="hidden md:block absolute top-[6%] left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#F5A623]/15 to-transparent" />
      </div>

      {view === 'landing' && (
        <AuthLanding setView={setView} setUserRole={setUserRole} />
      )}

      {view === 'auth' && (
        <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 relative z-20">
          <button
            onClick={() => {
              setView('landing');
              setErrorMessage('');
            }}
            className="absolute top-6 left-6 px-4 py-2 bg-transparent border border-[#C8C9C2] rounded-[8px] text-[13px] font-bold text-[#3D4A5C] transition"
          >
            ← {t('login.backToPaths')}
          </button>

          {errorMessage && (
            <div className="mb-4 px-4 py-2 bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 z-50 shadow-md">
              ⚠️ {errorMessage}
            </div>
          )}

          {isOtpVerifying ? (
            <OtpVerification
              email={email}
              emailOtpInput={emailOtpInput}
              setEmailOtpInput={setEmailOtpInput}
              handleOtpVerifySubmit={handleOtpVerifySubmit}
              isVerifying={isVerifying}
              setIsOtpVerifying={setIsOtpVerifying}
              setErrorMessage={setErrorMessage}
            />
          ) : (
            <LoginForms
              isSignUp={isSignUp}
              setIsSignUp={setIsSignUp}
              userRole={userRole}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              mobile={mobile}
              setMobile={setMobile}
              fullName={fullName}
              setFullName={setFullName}
              companyName={companyName}
              setCompanyName={setCompanyName}
              collegeName={collegeName}
              setCollegeName={setCollegeName}
              enrollmentNumber={enrollmentNumber}
              setEnrollmentNumber={setEnrollmentNumber}
              departmentName={departmentName}
              setDepartmentName={setDepartmentName}
              passwordStrength={passwordStrength}
              checkPasswordStrength={checkPasswordStrength}
              turnstileToken={turnstileToken}
              setTurnstileToken={setTurnstileToken}
              turnstileResetKey={turnstileResetKey}
              resetTurnstile={resetTurnstile}
              isRegistering={isRegistering}
              isLoggingIn={isLoggingIn}
              setErrorMessage={setErrorMessage}
              handleLoginSubmit={handleLoginSubmit}
              handleRegisterSubmit={handleRegisterSubmit}
              handleForgotPassword={handleForgotPassword}
            />
          )}
        </div>
      )}

      {view === 'forgot' && (
        <PasswordRecoveryForm
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
          recoveryMessage={recoveryMessage}
          generatedResetLink={generatedResetLink}
          recoveryEmail={recoveryEmail}
          setRecoveryEmail={setRecoveryEmail}
          sendingRecovery={sendingRecovery}
          handleRecoverySubmit={handleRecoverySubmit}
          setView={setView}
        />
      )}
    </div>
  );
}
