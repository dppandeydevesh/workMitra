import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../config";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Password strength checker states
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: "" });

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

    let text = t("resetPassword.strengthWeak") + " ❌";
    if (score === 3) text = t("resetPassword.strengthMedium") + " ⚠️";
    if (score === 4) text = t("resetPassword.strengthStrong") + " 🔥";

    setPasswordStrength({ score, text });
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setErrorMessage(t("resetPassword.errorMismatch"));
      return;
    }

    if (passwordStrength.score < 4) {
      setErrorMessage(t("resetPassword.errorWeakPassword"));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage(t("resetPassword.successMessage"));
      } else {
        setErrorMessage(data.error || t("resetPassword.errorFailed"));
      }
    } catch (err) {
      setErrorMessage(t("resetPassword.errorServer"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen dark:bg-slate-950 dark:bg-none bg-gradient-to-br from-blue-50 to-indigo-100 font-sans flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-[0_30px_60px_rgba(100,50,150,0.15)] p-8 max-w-md w-full border border-white/60 dark:border-slate-800/60 text-center space-y-6">
        <div className="flex justify-center">
          <img src="/logo.png" alt="workMitra Logo" className="h-20 object-contain filter drop-shadow-md mix-blend-multiply" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-purple-950 dark:text-purple-200">{t("resetPassword.heading")}</h2>
          <p className="text-xs text-gray-400 mt-1">{t("resetPassword.subheading")}</p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl text-left">
            ⚠️ {errorMessage}
          </div>
        )}

        {successMessage ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-xl text-left">
              ✓ {successMessage}
            </div>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition"
            >
              {t("resetPassword.goToSignIn")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block text-left text-[9px] font-bold text-gray-400 uppercase mb-1.5 px-1">{t("resetPassword.newPasswordLabel")}</label>
              <input
                type="password"
                placeholder={t("resetPassword.newPasswordPlaceholder")}
                value={password}
                onChange={(e) => checkPasswordStrength(e.target.value)}
                className="w-full bg-purple-50/60 border border-purple-100 dark:border-slate-800 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
                required
              />
              {password && (
                <div className="w-full text-left text-[10px] font-bold px-1 space-y-1 mt-1.5">
                  <p className={passwordStrength.score === 4 ? "text-green-600" : "text-amber-600"}>
                    {t("resetPassword.strengthLabel")}: {passwordStrength.text}
                  </p>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${passwordStrength.score === 4 ? "bg-green-500" : passwordStrength.score >= 2 ? "bg-amber-400" : "bg-red-400"}`}
                      style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-left text-[9px] font-bold text-gray-400 uppercase mb-1.5 px-1">{t("resetPassword.confirmPasswordLabel")}</label>
              <input
                type="password"
                placeholder={t("resetPassword.confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-purple-50/60 border border-purple-100 dark:border-slate-800 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || passwordStrength.score < 4}
              className={`w-full text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl shadow-md mt-2 transition ${passwordStrength.score === 4 ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 cursor-pointer" : "bg-gray-300 cursor-not-allowed"}`}
            >
              {submitting ? t("resetPassword.submitting") : t("resetPassword.submitButton")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
