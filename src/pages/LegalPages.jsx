import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Clean shared Layout wrapper for legal policy blocks
function LegalLayout({ title, subtitle, children }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className="min-h-screen dark:bg-slate-950 dark:bg-none bg-gradient-to-br from-blue-50 to-indigo-100 font-sans py-12 px-4 select-none">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6 sm:p-10 border border-gray-100 dark:border-slate-800">
        {/* Navigation header */}
        <div className="flex justify-between items-center border-b pb-6 mb-8 gap-4">
          <div>
            <img 
              src="/logo.png" 
              alt="workMitra Logo" 
              className="h-9 object-contain cursor-pointer transition hover:scale-105"
              onClick={() => navigate("/")} 
            />
            <h1 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-gray-200 tracking-tight mt-3">
              {title}
            </h1>
            <p className="text-xs text-gray-400 mt-1 font-semibold uppercase tracking-wider">
              {subtitle}
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition shadow-sm border border-gray-100 dark:border-slate-800/50"
          >
            ← {t("legal.backToHome")}
          </button>
        </div>

        {/* Content body */}
        <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed space-y-6">
          {children}
        </div>

        {/* Footer info */}
        <div className="border-t pt-6 mt-10 text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
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
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t("legal.termsAcceptanceHeading")}</h3>
        <p>
          {t("legal.termsAcceptanceBody")}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t("legal.termsAccountHeading")}</h3>
        <p>
          {t("legal.termsAccountBody")}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t("legal.termsGigsHeading")}</h3>
        <p>
          {t("legal.termsGigsBody")}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t("legal.termsPaymentHeading")}</h3>
        <p>
          {t("legal.termsPaymentBody")}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t("legal.termsProhibitedHeading")}</h3>
        <p>
          {t("legal.termsProhibitedBody")}
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
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t("legal.privacyDataCollectHeading")}</h3>
        <p>
          {t("legal.privacyDataCollectBody")}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t("legal.privacyDataUseHeading")}</h3>
        <p>
          {t("legal.privacyDataUseBody")}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t("legal.privacySecurityHeading")}</h3>
        <p>
          {t("legal.privacySecurityBody")}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t("legal.privacyVisibilityHeading")}</h3>
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
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t("legal.refundSubscriptionHeading")}</h3>
        <p>
          {t("legal.refundSubscriptionBody")}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t("legal.refundCancellationHeading")}</h3>
        <p>
          {t("legal.refundCancellationBody")}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t("legal.refundDisapprovalHeading")}</h3>
        <p>
          {t("legal.refundDisapprovalBody")}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t("legal.refundContactHeading")}</h3>
        <p>
          {t("legal.refundContactBody")} <span className="font-extrabold text-indigo-600">contact.workmitra@gmail.com</span>. {t("legal.refundContactResolution")}
        </p>
      </section>
    </LegalLayout>
  );
}
