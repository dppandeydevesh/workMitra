import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function PasswordRecoveryForm({
  errorMessage,
  setErrorMessage,
  recoveryMessage,
  generatedResetLink,
  recoveryEmail,
  setRecoveryEmail,
  sendingRecovery,
  handleRecoverySubmit,
  setView
}) {
  const { t } = useTranslation();

  return (
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
  );
}
