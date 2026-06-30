import { useNavigate } from "react-router-dom";

// Clean shared Layout wrapper for legal policy blocks
function LegalLayout({ title, subtitle, children }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans py-12 px-4 select-none">
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
            ← Back to Home
          </button>
        </div>

        {/* Content body */}
        <div className="text-sm text-gray-600 leading-relaxed space-y-6">
          {children}
        </div>

        {/* Footer info */}
        <div className="border-t pt-6 mt-10 text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          © {new Date().getFullYear()} workMitra. All Rights Reserved.
        </div>
      </div>
    </div>
  );
}

// 1. Terms of Service Page
export function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" subtitle="Agreement and Platform Conditions">
      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">1. Acceptance of Terms</h3>
        <p>
          By creating an account, posting a gig, or applying to projects on workMitra, you agree to follow and be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">2. Account Responsibility</h3>
        <p>
          You are responsible for keeping your login credentials secure. You must verify your email and mobile number via OTP during registration. Any activity under your verified student or corporate profile is your sole responsibility.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">3. Freelancing Gigs & AI Match</h3>
        <p>
          workMitra provides automated AI grading and match evaluations based on student resume documents. These scores are calculated for convenience, and recruiters are responsible for final selection. Students must submit quality solutions matching original description criteria.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">4. Payment & Escrow Protection</h3>
        <p>
          Payments are handled securely. Recruiters fund tasks upon project deployment, and payouts are disbursed once the solution is reviewed, graded, and marked as Completed. Users agree to settle any payment disputes transparently through the support desk.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">5. Prohibited Conduct</h3>
        <p>
          Users are strictly prohibited from submitting plagiarized materials, publishing false gig descriptions, or engaging in harassment through our real-time messaging system. Violators will face immediate account suspension.
        </p>
      </section>
    </LegalLayout>
  );
}

// 2. Privacy Policy Page
export function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" subtitle="Your Personal Data & Safety Information">
      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">1. Data We Collect</h3>
        <p>
          We collect personal data required for professional matches. This includes your name, email, college enrollment credentials, social portfolio links, resume files (PDF text extraction), and user rating scores.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">2. How We Use Data</h3>
        <p>
          Your data is processed to optimize AI candidate match ratings, display applicant details to corporate recruiters, route real-time chat messages, and generate platform analytics logs.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">3. Payout & Security Details</h3>
        <p>
          Transactions are processed securely. We do not store plain-text credit card details. All data exchanges are guarded with token authentication to prevent unauthorized modifications.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">4. Profile Visibility</h3>
        <p>
          By updating your preferences, students consent to display their rating logs, match statistics, and college details to verified corporate recruiters reviewing gig applicants.
        </p>
      </section>
    </LegalLayout>
  );
}

// 3. Refund & Cancellation Policy Page
export function RefundPage() {
  return (
    <LegalLayout title="Refund & Cancellation" subtitle="Subscription & Transaction Protections">
      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">1. Subscription Tiers</h3>
        <p>
          workMitra offers premium membership subscriptions ranging from ₹39 to ₹299. Subscriptions unlock advanced project deployment capabilities and premium candidate AI sorting. All subscription purchases are non-refundable once unlocked.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">2. Project Cancellation</h3>
        <p>
          Corporate clients can cancel a deployed gig before a student is approved or starts work. Once a student applicant is "Approved" and transition steps begin, the budget remains locked in escrow protection.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">3. Solution Disapproval</h3>
        <p>
          If a recruiter finds a student's solution inadequate, they must submit feedback. If a mutual agreement is not met, our support desk will audit the code/submission and release payments to the deserving node.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">4. Contact Support</h3>
        <p>
          For billing questions, refund claims, or subscription cancelation help, please mail us at our support address: <span className="font-extrabold text-indigo-600">contact.workmitra@gmail.com</span>. We resolve all inquiries within 48 hours.
        </p>
      </section>
    </LegalLayout>
  );
}
