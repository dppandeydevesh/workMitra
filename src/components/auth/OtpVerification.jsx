import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function OtpVerification({
  emailOtpInput,
  setEmailOtpInput,
  handleOtpVerifySubmit,
  isVerifying,
  setIsOtpVerifying,
  setErrorMessage
}) {
  const { t } = useTranslation();

  return (
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
          className={`w-full py-3.5 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition mt-2 ${isVerifying ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#F5A623] hover:bg-[#E0941F] hover:opacity-95'}`}
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
  );
}
