import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { resendOtp } from '../../services/authService';

const COOLDOWN_SECONDS = 60;

export default function OtpVerification({
  email,
  emailOtpInput,
  setEmailOtpInput,
  handleOtpVerifySubmit,
  isVerifying,
  setIsOtpVerifying,
  setErrorMessage,
}) {
  const { t } = useTranslation();
  const [cooldown, setCooldown] = useState(0); // seconds remaining
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  // Tick down the cooldown every second
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (!email || cooldown > 0 || resending) return;
    setResending(true);
    setResendMsg('');
    try {
      const { ok, data } = await resendOtp(email);
      if (ok) {
        setResendMsg(t('login.otpResent'));
        setCooldown(COOLDOWN_SECONDS);
      } else {
        setResendMsg(data?.error || t('login.otpResendFailed'));
      }
    } catch {
      setResendMsg(t('login.otpResendFailed'));
    } finally {
      setResending(false);
    }
  }, [email, cooldown, resending, t]);

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

      <form onSubmit={handleOtpVerifySubmit} className="space-y-4 text-left">
        <div>
          <label className="block text-left text-[9px] font-bold text-ink-400 uppercase mb-1.5 px-1">
            {t('login.emailVerificationCode')}
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength="6"
            value={emailOtpInput}
            onChange={(e) => setEmailOtpInput(e.target.value)}
            placeholder={t('login.6DigitCode')}
            className="w-full bg-transparent border border-[#C8C9C2] text-sm px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623] text-center tracking-widest font-black"
            required
          />
          <p className="text-[10px] text-ink-400 mt-1.5 px-1">
            {t('login.checkInbox')}
          </p>
        </div>

        <button
          type="submit"
          disabled={isVerifying}
          className={`w-full py-3.5 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition mt-2 ${
            isVerifying ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#F5A623] hover:bg-[#E0941F] hover:opacity-95'
          }`}
        >
          {isVerifying ? t('login.verifying') : t('login.verifyAndCreate')}
        </button>

        {/* Resend code */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className={`text-xs font-bold transition ${
              cooldown > 0 || resending
                ? 'text-ink-300 cursor-not-allowed'
                : 'text-[#F5A623] hover:text-[#E0941F] hover:underline'
            }`}
          >
            {resending
              ? t('login.otpSending')
              : cooldown > 0
              ? t('login.otpResendIn', { seconds: cooldown })
              : t('login.resendCode')}
          </button>
        </div>

        {resendMsg && (
          <p className="text-[11px] text-center text-green-600 font-medium">{resendMsg}</p>
        )}

        <div className="pt-1">
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
