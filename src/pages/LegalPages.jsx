import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Clean shared Layout wrapper for legal policy blocks
function LegalLayout({ title, subtitle, children }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-transparent font-sans py-12 px-4 select-none">
      <div className="max-w-3xl mx-auto bg-white dark:bg-ink-900 rounded-3xl shadow-xl p-6 sm:p-10 border border-ink-100 dark:border-ink-800">
        {/* Navigation header */}
        <div className="flex justify-between items-center border-b pb-6 mb-8 gap-4">
          <div>
            <div className="logo-hook" onClick={() => navigate("/")}>
              <img 
                src="/logo.png" 
                alt="workMitra Logo" 
                className="h-8 object-contain"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-ink-800 dark:text-ink-200 tracking-tight mt-3">
              {title}
            </h1>
            <p className="text-xs text-ink-400 mt-1 font-semibold uppercase tracking-wider">
              {subtitle}
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-ink-100 dark:bg-ink-800 hover:bg-ink-200 text-ink-700 dark:text-ink-200 rounded-xl text-xs font-bold transition shadow-sm border border-ink-100 dark:border-ink-800/50"
          >
            ← {t("legal.backToHome")}
          </button>
        </div>

        {/* Content body */}
        <div className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed space-y-6">
          {children}
        </div>

        {/* Footer info */}
        <div className="border-t pt-6 mt-10 text-center text-[10px] text-ink-400 font-bold uppercase tracking-wider">
          © {new Date().getFullYear()} workMitra. {t("legal.allRightsReserved")}
        </div>
      </div>
    </div>
  );
}

// 1. Terms of Service Page
export function TermsPage() {
  const { t } = useTranslation();
  return (
    <LegalLayout title={t("legal.termsTitle")} subtitle={t("legal.termsSubtitle")}>
      <section className="space-y-2">
        <h3 className="text-sm font-black text-ink-800 dark:text-ink-200 uppercase tracking-wider">{t("legal.termsAcceptanceHeading")}</h3>
        <p>
          {t("legal.termsAcceptanceBody")}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-ink-800 dark:text-ink-200 uppercase tracking-wider">{t("legal.termsAccountHeading")}</h3>
        <p>
          {t("legal.termsAccountBody")}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-ink-800 dark:text-ink-200 uppercase tracking-wider">{t("legal.termsGigsHeading")}</h3>
        <p>
          {t("legal.termsGigsBody")}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-ink-800 dark:text-ink-200 uppercase tracking-wider">{t("legal.termsPaymentHeading")}</h3>
        <p>
          {t("legal.termsPaymentBody")}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-ink-800 dark:text-ink-200 uppercase tracking-wider">{t("legal.termsProhibitedHeading")}</h3>
        <p>
          {t("legal.termsProhibitedBody")}
        </p>
      </section>

      {/* 🔒 Confidentiality & NDA Policy */}
      <section className="space-y-3 bg-red-50/50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40 rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔒</span>
          <h3 className="text-sm font-black text-red-800 dark:text-red-300 uppercase tracking-wider">{t("legal.termsConfidentialityHeading")}</h3>
        </div>
        <p>{t("legal.termsConfidentialityBody1")}</p>
        <ul className="list-disc list-inside space-y-1 text-xs text-ink-600 dark:text-ink-400 pl-2">
          <li>{t("legal.termsConfidentialityPoint1")}</li>
          <li>{t("legal.termsConfidentialityPoint2")}</li>
          <li>{t("legal.termsConfidentialityPoint3")}</li>
        </ul>
        <p className="text-xs font-bold text-red-700 dark:text-red-400 bg-red-100/50 dark:bg-red-900/30 rounded-lg px-3 py-2">
          ⚠️ {t("legal.termsConfidentialityWarning")}
        </p>
      </section>

      {/* 🎓 Academic Integrity & Anti-Plagiarism Policy */}
      <section className="space-y-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎓</span>
          <h3 className="text-sm font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">{t("legal.termsIntegrityHeading")}</h3>
        </div>
        <p>{t("legal.termsIntegrityBody1")}</p>
        <ul className="list-disc list-inside space-y-1 text-xs text-ink-600 dark:text-ink-400 pl-2">
          <li>{t("legal.termsIntegrityPoint1")}</li>
          <li>{t("legal.termsIntegrityPoint2")}</li>
          <li>{t("legal.termsIntegrityPoint3")}</li>
        </ul>
        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/30 rounded-lg px-3 py-2">
          ⚠️ {t("legal.termsIntegrityWarning")}
        </p>
      </section>
    </LegalLayout>
  );
}

// 2. Privacy Policy Page
export function PrivacyPage() {
  const { t } = useTranslation();
  return (
    <LegalLayout title={t("legal.privacyTitle")} subtitle={t("legal.privacySubtitle")}>
      <section className="space-y-2">
        <h3 className="text-sm font-black text-ink-800 dark:text-ink-200 uppercase tracking-wider">{t("legal.privacyDataCollectHeading")}</h3>
        <p>
          {t("legal.privacyDataCollectBody")}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-ink-800 dark:text-ink-200 uppercase tracking-wider">{t("legal.privacyDataUseHeading")}</h3>
        <p>
          {t("legal.privacyDataUseBody")}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-ink-800 dark:text-ink-200 uppercase tracking-wider">{t("legal.privacySecurityHeading")}</h3>
        <p>
          {t("legal.privacySecurityBody")}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-ink-800 dark:text-ink-200 uppercase tracking-wider">{t("legal.privacyVisibilityHeading")}</h3>
        <p>
          {t("legal.privacyVisibilityBody")}
        </p>
      </section>
    </LegalLayout>
  );
}

// 3. Refund & Cancellation Policy Page
export function RefundPage() {
  const { t } = useTranslation();
  return (
    <LegalLayout title={t("legal.refundTitle")} subtitle={t("legal.refundSubtitle")}>
      <section className="space-y-2">
        <h3 className="text-sm font-black text-ink-800 dark:text-ink-200 uppercase tracking-wider">{t("legal.refundSubscriptionHeading")}</h3>
        <p>
          {t("legal.refundSubscriptionBody")}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-ink-800 dark:text-ink-200 uppercase tracking-wider">{t("legal.refundCancellationHeading")}</h3>
        <p>
          {t("legal.refundCancellationBody")}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-ink-800 dark:text-ink-200 uppercase tracking-wider">{t("legal.refundDisapprovalHeading")}</h3>
        <p>
          {t("legal.refundDisapprovalBody")}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-ink-800 dark:text-ink-200 uppercase tracking-wider">{t("legal.refundContactHeading")}</h3>
        <p>
          {t("legal.refundContactBody")} <span className="font-extrabold text-marigold-500">supportworkmitra@gmail.com</span>. {t("legal.refundContactResolution")}
        </p>
      </section>
    </LegalLayout>
  );
}
