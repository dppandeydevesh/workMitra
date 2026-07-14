import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useToast } from '../components/Toast';
import {
  Award,
  ShieldCheck,
  Printer,
  Share2,
  ArrowLeft,
  Loader2,
  Lock,
} from 'lucide-react';

export default function CertificatePage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState(null);
  const [error, setError] = useState(null);
  const [requiresPass, setRequiresPass] = useState(false);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${API_BASE_URL}/api/applications/${applicationId}/certificate/verify`
        );
        const data = await res.json();

        if (res.ok) {
          setCert(data);
        } else {
          setError(data.error || 'Failed to verify certificate.');
          if (res.status === 403 && data.requiresPass) {
            setRequiresPass(true);
          }
        }
      } catch (err) {
        console.error(err);
        setError('Error establishing connection with verification server.');
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchCertificate();
    }
  }, [applicationId]);

  const handlePrint = () => {
    window.print();
  };

  const handleShareLinkedIn = () => {
    if (!cert) return;
    const certName = encodeURIComponent(
      `${cert.projectTitle} - workMitra Micro-Gig`
    );
    const certUrl = encodeURIComponent(window.location.href);
    const certId = cert.applicationId;

    // Direct LinkedIn Certification Add Form URL format
    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${certName}&organizationName=workMitra&certUrl=${certUrl}&certId=${certId}`;
    window.open(linkedInUrl, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('📋 Verification link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-transparent">
        <Loader2 className="w-8 h-8 text-marigold-500 animate-spin mb-2" />
        <p className="text-xs font-bold text-ink-400 uppercase tracking-widest">
          Verifying Credential...
        </p>
      </div>
    );
  }

  if (requiresPass) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-ink-50 dark:bg-ink-950">
        <div className="max-w-md w-full bg-white dark:bg-ink-900 border rounded-2xl p-6 text-center shadow-lg">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-base font-black text-ink-800 dark:text-white uppercase tracking-wider mb-2">
            Certificate Locked 🔒
          </h2>
          <p className="text-xs text-ink-500 dark:text-ink-300 font-semibold mb-6 leading-relaxed">
            {error ||
              'This credential requires an active Premium Pass (₹99) or free trial period to unlock and view.'}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-2.5 bg-marigold-500 hover:bg-marigold-600 text-white rounded-xl text-xs font-black tracking-wide transition shadow"
          >
            Go to Student Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-ink-50 dark:bg-ink-950">
        <div className="max-w-md w-full bg-white dark:bg-ink-900 border rounded-2xl p-6 text-center shadow-lg">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-base font-black text-ink-800 dark:text-white uppercase tracking-wider mb-2">
            Verification Mismatch
          </h2>
          <p className="text-xs text-ink-500 dark:text-ink-300 font-semibold mb-6 leading-relaxed">
            {error ||
              'The requested certificate verification signature could not be located or verified on our servers.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 bg-ink-100 hover:bg-ink-200 dark:bg-ink-800 text-ink-700 dark:text-white rounded-xl text-xs font-bold transition border"
          >
            Back to workMitra Home
          </button>
        </div>
      </div>
    );
  }

  const issueDateStr = cert.completedAt
    ? new Date(cert.completedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <div className="min-h-screen bg-ink-50/50 dark:bg-ink-950/20 py-10 px-4 flex flex-col items-center">
      {/* Non-Printable Action Banner */}
      <div className="w-full max-w-4xl flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 print:hidden">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-ink-900 border hover:bg-ink-50 dark:hover:bg-ink-800 text-ink-700 dark:text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-ink-900 border hover:bg-ink-50 dark:hover:bg-ink-800 text-ink-700 dark:text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Share2 className="w-4 h-4 text-marigold-500" /> Share Link
          </button>
          <button
            onClick={handleShareLinkedIn}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Award className="w-4 h-4" /> Add to LinkedIn
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-marigold-500 hover:bg-marigold-600 text-white rounded-xl text-xs font-bold transition shadow-md"
          >
            <Printer className="w-4 h-4" /> Save PDF / Print
          </button>
        </div>
      </div>

      {/* Elegant Certificate Container */}
      <div className="w-full max-w-4xl bg-white dark:bg-ink-900 border-8 border-double border-marigold-500 shadow-2xl p-6 sm:p-14 relative overflow-hidden rounded-lg print:border-8 print:shadow-none print:my-0">
        {/* Decorative Corner Borders */}
        <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-marigold-500 m-2 print:border-marigold-500" />
        <div className="absolute top-0 right-0 w-24 h-24 border-t-4 border-r-4 border-marigold-500 m-2 print:border-marigold-500" />
        <div className="absolute bottom-0 left-0 w-24 h-24 border-b-4 border-l-4 border-marigold-500 m-2 print:border-marigold-500" />
        <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-marigold-500 m-2 print:border-marigold-500" />

        {/* Large watermark brand icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] dark:opacity-[0.04] pointer-events-none select-none">
          <Award className="w-96 h-96 text-marigold-600" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* logo / header */}
          <div className="flex items-center gap-2 mb-6">
            <img
              src="/logo.png"
              alt="workMitra Logo"
              className="h-8 object-contain"
            />
          </div>

          <p className="text-[10px] font-black text-marigold-600 uppercase tracking-widest mb-1">
            Verified Project Certificate
          </p>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-800 dark:text-white uppercase tracking-wider mb-6 print:text-3xl">
            workMitra Credential
          </h1>

          <div className="w-20 h-0.5 bg-marigold-500 mb-8" />

          <p className="text-xs text-ink-400 dark:text-ink-300 font-semibold mb-2">
            THIS CERTIFICATE IS PROUDLY PRESENTED TO
          </p>

          <p className="text-xl sm:text-3xl font-black text-ink-800 dark:text-white mb-1 uppercase tracking-tight py-1 border-b border-ink-100 max-w-lg w-full text-center">
            {cert.studentName}
          </p>

          <p className="text-[10px] font-bold text-ink-400 dark:text-ink-400 uppercase tracking-wide mb-6">
            Student of {cert.collegeName}
          </p>

          <p className="text-xs text-ink-500 dark:text-ink-300 font-semibold max-w-xl leading-relaxed mb-8">
            for successfully showcasing technical capabilities and industry
            readiness by completing the micro-gig project
            <span className="font-extrabold text-ink-800 dark:text-white block text-sm sm:text-base mt-2 py-1 px-4 bg-ink-50 dark:bg-ink-800 rounded-lg inline-block border">
              {cert.projectTitle}
            </span>
            <span className="block mt-2">
              offered and evaluated in collaboration with{' '}
              <strong className="text-marigold-600 font-extrabold">
                {cert.companyName}
              </strong>
              .
            </span>
          </p>

          {/* Validation Seal and signature */}
          <div className="grid grid-cols-1 sm:grid-cols-3 w-full max-w-2xl mt-6 items-center gap-8 print:grid-cols-3">
            {/* Signature 1 */}
            <div className="flex flex-col items-center">
              <div className="w-28 border-b-2 border-ink-200 pb-1 flex justify-center items-center">
                <span className="text-[10px] font-black text-ink-400 uppercase tracking-wider">
                  workMitra Team
                </span>
              </div>
              <p className="text-[9px] text-ink-400 uppercase font-bold mt-1.5">
                Authorized Issuer
              </p>
            </div>

            {/* Verification Seal */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-dashed border-marigold-500/80 bg-marigold-50 dark:bg-ink-800 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-marigold-500" />
                </div>
              </div>
              <p className="text-[8px] text-green-600 dark:text-green-400 uppercase font-extrabold tracking-widest mt-1.5 flex items-center gap-0.5">
                ✓ SECURELY VERIFIED
              </p>
            </div>

            {/* Signature 2 */}
            <div className="flex flex-col items-center">
              <div className="w-28 border-b-2 border-ink-200 pb-1 flex justify-center items-center">
                <span className="text-[10px] font-black text-ink-400 uppercase tracking-wider">
                  {cert.companyName}
                </span>
              </div>
              <p className="text-[9px] text-ink-400 uppercase font-bold mt-1.5">
                Partner Evaluator
              </p>
            </div>
          </div>

          <div className="w-full border-t border-ink-100/70 mt-12 pt-4 flex flex-col sm:flex-row justify-between items-center text-[9px] text-ink-400 font-bold uppercase tracking-wider gap-2">
            <p>Issue Date: {issueDateStr}</p>
            <p>Verification Signature: {cert.applicationId}</p>
          </div>
        </div>
      </div>

      {/* Print isolation styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .print\\:hidden, button, header, nav {
            display: none !important;
          }
          .print\\:border-8 {
            border-width: 8px !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:my-0 {
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
