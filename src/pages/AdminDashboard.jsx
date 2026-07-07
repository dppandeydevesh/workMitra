import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../config";
import { useToast } from "../components/Toast";
import { motion } from "framer-motion";
import { 
  Users, 
  Building, 
  Briefcase, 
  Lock, 
  CheckCircle, 
  AlertTriangle, 
  Scale, 
  Building2, 
  Settings, 
  Save, 
  RefreshCw, 
  Crown, 
  Sparkles, 
  Inbox, 
  Server, 
  ChevronRight,
  ShieldCheck,
  Zap
} from "lucide-react";

export default function AdminDashboard() {
  const toast = useToast();
  const { t } = useTranslation();
  
  // Dashboard overall status states
  const [metrics, setMetrics] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [verifyingEmail, setVerifyingEmail] = useState(null);

  // 👑 Super Admin Custom Variables & Simulators
  const [commissionRate, setCommissionRate] = useState(10);
  const [minDeposit, setMinDeposit] = useState(1000);
  const [savingConfig, setSavingConfig] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [backupStatus, setBackupStatus] = useState("");
  const [systemLogs, setSystemLogs] = useState([
    "INF [System] Server started on port 5000",
    "INF [Database] Connected successfully to MongoDB instance",
    "INF [WebSocket] Secure chat gateway listening on ws://localhost:5000",
    "INF [PWA] Service worker assets precached successfully",
    "WRN [AI Auditor] Gemini fallback active on zero API key tokens",
    "INF [Plagiarism] Bigram similarity module initialized"
  ]);

  const handleSaveConfig = (e) => {
    e.preventDefault();
    setSavingConfig(true);
    setTimeout(() => {
      setSavingConfig(false);
      toast.success(t("admin.toast.config_updated"));
      setSystemLogs(prev => [
        `INF [Config] Commission rate updated to ${commissionRate}%`,
        `INF [Config] Minimum deposit threshold set to ₹${minDeposit}`,
        ...prev
      ]);
    }, 800);
  };

  const handleBackupDatabase = () => {
    setBackingUp(true);
    setBackupStatus(t("admin.backup.status.initializing"));
    setTimeout(() => {
      setBackupStatus(t("admin.backup.status.compressing"));
      setTimeout(() => {
        setBackingUp(false);
        const filename = `workmitra-dump-${new Date().toISOString().split('T')[0]}.tar.gz`;
        setBackupStatus(`✓ ${t("admin.backup.status.success", { filename })}`);
        toast.success(t("admin.toast.backup_completed"));
        setSystemLogs(prev => [
          `INF [System] Automated backup archive ${filename} created`,
          ...prev
        ]);
      }, 1000);
    }, 1000);
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const headers = {  };

      // 1. Fetch KPI metrics
      const metricsRes = await fetch(`${API_BASE_URL}/api/admin/metrics`, { credentials: "include", headers });
      const metricsData = await metricsRes.json();
      
      // 2. Fetch disputes
      const disputesRes = await fetch(`${API_BASE_URL}/api/admin/disputes`, { credentials: "include", headers });
      const disputesData = await disputesRes.json();

      // 3. Fetch company accounts
      const companiesRes = await fetch(`${API_BASE_URL}/api/admin/companies`, { credentials: "include", headers });
      const companiesData = await companiesRes.json();

      if (metricsRes.ok && disputesRes.ok && companiesRes.ok) {
        setMetrics(metricsData);
        setDisputes(disputesData);
        setCompanies(companiesData);
      } else {
        toast.error(t("admin.toast.load_failed"));
      }
    } catch (err) {
      toast.error(t("admin.toast.auth_error"));
    } finally {
      setLoading(false);
    }
  };

  // Action: Resolve dispute
  const handleResolveDispute = async (applicationId, decision) => {
    if (!window.confirm(t("admin.confirm.resolve_dispute", { decision: decision === "release" ? t("admin.action.release_payout") : t("admin.action.refund_recruiter") }))) return;
    
    setResolvingId(applicationId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/disputes/${applicationId}/resolve`, { credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          
        },
        body: JSON.stringify({ decision })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t("admin.toast.dispute_resolved", { status: decision === "release" ? t("admin.toast.payout_released") : t("admin.toast.budget_refunded") }));
        fetchAdminData();
      } else {
        toast.error(data.error || t("admin.toast.resolve_failed"));
      }
    } catch (err) {
      toast.error(t("admin.toast.network_error"));
    } finally {
      setResolvingId(null);
    }
  };

  // Action: Verify Company Recruiter
  const handleVerifyCompany = async (companyEmail) => {
    if (!window.confirm(t("admin.confirm.verify_company", { companyEmail }))) return;
    
    setVerifyingEmail(companyEmail);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/companies/${companyEmail}/verify`, { credentials: "include",
        method: "POST",
        headers: {  }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t("admin.toast.company_verified"));
        fetchAdminData();
      } else {
        toast.error(data.error || t("admin.toast.verify_failed"));
      }
    } catch (err) {
      toast.error(t("admin.toast.verify_network_error"));
    } finally {
      setVerifyingEmail(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  if (loading && !metrics) {
    return (
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <div className="glass-panel p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 skeleton-loader h-32 rounded-3xl"></div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-6 rounded-2xl skeleton-loader h-32"></div>
          ))}
        </div>

        <div className="glass-panel p-8 h-96 skeleton-loader rounded-3xl"></div>
        <div className="glass-panel p-8 h-96 skeleton-loader rounded-3xl"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 select-none relative z-10"
    >
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Title Section - Glass Panel */}
        <motion.div variants={itemVariants} className="glass-panel premium-card-hover p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-marigold-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-3 bg-marigold-500/10 rounded-xl shadow-inner border border-marigold-500/20">
              <Crown className="w-8 h-8 text-marigold-500" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                {t("admin.title")}
              </h1>
              <p className="text-sm font-medium text-ink-500 dark:text-ink-300 mt-2">{t("admin.description")}</p>
            </div>
          </div>
          <button
            onClick={fetchAdminData}
            className="glass-button px-6 py-3 bg-marigold-500/90 hover:bg-marigold-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_4px_20px_rgba(79,70,229,0.4)] hover:shadow-[0_6px_25px_rgba(79,70,229,0.6)] flex items-center gap-2 relative z-10 backdrop-blur-md"
          >
            <RefreshCw className="w-5 h-5" /> {t("admin.action.sync_data")}
          </button>
        </motion.div>

        {/* Dashboard KPIs Grid */}
        {metrics && (
          <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <motion.div variants={itemVariants} className="glass-card premium-card-hover p-6 rounded-2xl flex flex-col justify-between group relative overflow-hidden bg-white/40 dark:bg-ink-800/40 border border-white/40 dark:border-ink-700/50 shadow-sm backdrop-blur-md">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-marigold-500/10 rounded-full blur-2xl group-hover:bg-marigold-500/20 transition-all"></div>
              <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="text-xs font-black text-ink-500 dark:text-ink-400 uppercase tracking-wider">{t("admin.kpi.total_students")}</span>
                <Users className="w-5 h-5 text-marigold-500 opacity-80" />
              </div>
              <span className="text-4xl font-black text-ink-800 dark:text-white drop-shadow-sm relative z-10">{metrics.totalStudents}</span>
            </motion.div>
            
            <motion.div variants={itemVariants} className="glass-card premium-card-hover p-6 rounded-2xl flex flex-col justify-between group relative overflow-hidden bg-white/40 dark:bg-ink-800/40 border border-white/40 dark:border-ink-700/50 shadow-sm backdrop-blur-md">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
              <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="text-xs font-black text-ink-500 dark:text-ink-400 uppercase tracking-wider">{t("admin.kpi.verified_recruiters")}</span>
                <Building className="w-5 h-5 text-purple-500 opacity-80" />
              </div>
              <span className="text-4xl font-black text-ink-800 dark:text-white drop-shadow-sm relative z-10">{metrics.totalCompanies}</span>
            </motion.div>
            
            <motion.div variants={itemVariants} className="glass-card premium-card-hover p-6 rounded-2xl flex flex-col justify-between group relative overflow-hidden bg-white/40 dark:bg-ink-800/40 border border-white/40 dark:border-ink-700/50 shadow-sm backdrop-blur-md">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/20 transition-all"></div>
              <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="text-xs font-black text-ink-500 dark:text-ink-400 uppercase tracking-wider">{t("admin.kpi.total_gigs")}</span>
                <Briefcase className="w-5 h-5 text-pink-500 opacity-80" />
              </div>
              <span className="text-4xl font-black text-ink-800 dark:text-white drop-shadow-sm relative z-10">{metrics.totalProjects}</span>
            </motion.div>
            
            <motion.div variants={itemVariants} className="glass-card premium-card-hover p-6 rounded-2xl flex flex-col justify-between border-l-4 border-l-marigold-500 group relative overflow-hidden bg-white/40 dark:bg-ink-800/40 shadow-sm backdrop-blur-md">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-marigold-500/10 rounded-full blur-2xl group-hover:bg-marigold-500/20 transition-all"></div>
              <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="text-xs font-black text-marigold-500 dark:text-marigold-400 uppercase tracking-wider">{t("admin.kpi.locked_escrow")}</span>
                <Lock className="w-5 h-5 text-marigold-500 opacity-80" />
              </div>
              <span className="text-3xl font-black text-ink-800 dark:text-white drop-shadow-sm relative z-10">₹{metrics.lockedEscrow.toLocaleString()}</span>
            </motion.div>
            
            <motion.div variants={itemVariants} className="glass-card premium-card-hover p-6 rounded-2xl flex flex-col justify-between border-l-4 border-l-emerald-500 group relative overflow-hidden bg-white/40 dark:bg-ink-800/40 shadow-sm backdrop-blur-md">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
              <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t("admin.kpi.completed_payouts")}</span>
                <CheckCircle className="w-5 h-5 text-emerald-500 opacity-80" />
              </div>
              <span className="text-3xl font-black text-ink-800 dark:text-white drop-shadow-sm relative z-10">₹{metrics.completedEscrow.toLocaleString()}</span>
            </motion.div>
            
            <motion.div variants={itemVariants} className="glass-card premium-card-hover p-6 rounded-2xl flex flex-col justify-between border-l-4 border-l-rose-500 group relative overflow-hidden bg-white/40 dark:bg-ink-800/40 shadow-sm backdrop-blur-md">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
              <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">{t("admin.kpi.disputed_balance")}</span>
                <AlertTriangle className="w-5 h-5 text-rose-500 opacity-80" />
              </div>
              <span className="text-3xl font-black text-ink-800 dark:text-white drop-shadow-sm relative z-10">₹{metrics.disputedEscrow.toLocaleString()}</span>
            </motion.div>
          </motion.div>
        )}

        {/* Disputes Manager Section */}
        <motion.div variants={itemVariants} className="glass-panel premium-card-hover p-8 relative overflow-hidden">
          <div className="absolute -left-20 -top-20 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="border-b border-ink-200/50 dark:border-ink-700/50 pb-5 mb-6 relative z-10 flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 rounded-xl shadow-inner border border-rose-500/20">
              <Scale className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-ink-800 dark:text-white uppercase tracking-wide">
                {t("admin.disputes.title")}
              </h2>
              <p className="text-sm font-medium text-ink-500 dark:text-ink-400 mt-1">{t("admin.disputes.description")}</p>
            </div>
          </div>

          {disputes.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center relative z-10">
              <Inbox className="w-16 h-16 text-ink-300 dark:text-ink-600 mb-4 opacity-50" />
              <p className="text-sm font-medium text-ink-500 dark:text-ink-400 italic">{t("admin.disputes.empty")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto relative z-10 rounded-xl border border-ink-200/30 dark:border-ink-700/30 shadow-sm bg-white/20 dark:bg-ink-900/20 backdrop-blur-md">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-ink-100/50 dark:bg-ink-800/50 text-ink-500 dark:text-ink-400 font-bold uppercase tracking-wider text-xs border-b border-ink-200/50 dark:border-ink-700/50">
                    <th className="py-4 px-6">{t("admin.disputes.th.project")}</th>
                    <th className="py-4 px-6">{t("admin.disputes.th.recruiter")}</th>
                    <th className="py-4 px-6">{t("admin.disputes.th.escrow")}</th>
                    <th className="py-4 px-6">{t("admin.disputes.th.reason")}</th>
                    <th className="py-4 px-6 text-right">{t("admin.disputes.th.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200/30 dark:divide-ink-700/30 text-ink-700 dark:text-ink-300">
                  {disputes.map((dispute, idx) => (
                    <tr key={dispute._id} className={`transition-colors duration-200 hover:bg-white/40 dark:hover:bg-ink-800/60 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-ink-50/30 dark:bg-ink-800/30'}`}>
                      <td className="py-5 px-6">
                        <span className="font-bold text-ink-900 dark:text-white block text-base">{dispute.projectId?.title || t("admin.disputes.fallback.project_title")}</span>
                        <span className="text-xs font-medium text-ink-500 dark:text-ink-400 block mt-1 bg-ink-200/50 dark:bg-ink-700/50 px-2 py-1 rounded-md inline-block">
                          {t("admin.disputes.by_student", { name: dispute.studentName, email: dispute.studentEmail })}
                        </span>
                      </td>
                      <td className="py-5 px-6 font-semibold">{dispute.projectId?.companyId}</td>
                      <td className="py-5 px-6 font-black text-emerald-600 dark:text-emerald-400 text-base">₹{dispute.projectId?.budget?.toLocaleString()}</td>
                      <td className="py-5 px-6">
                        <div className="max-w-xs text-sm italic border-l-2 border-marigold-200 dark:border-marigold-800 pl-3 py-1">
                          "{dispute.feedbackText || t("admin.disputes.fallback.no_feedback")}"
                        </div>
                      </td>
                      <td className="py-5 px-6 text-right space-x-3 whitespace-nowrap">
                        <button
                          onClick={() => handleResolveDispute(dispute._id, "release")}
                          disabled={resolvingId === dispute._id}
                          className="glass-button px-4 py-2 bg-emerald-500/90 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:shadow-none backdrop-blur-md border border-white/20 inline-flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          {t("admin.action.release_payout")}
                        </button>
                        <button
                          onClick={() => handleResolveDispute(dispute._id, "refund")}
                          disabled={resolvingId === dispute._id}
                          className="glass-button px-4 py-2 bg-rose-500/90 hover:bg-rose-600 text-white rounded-xl font-bold text-xs transition-all shadow-[0_4px_15px_rgba(244,63,94,0.3)] hover:shadow-[0_6px_20px_rgba(244,63,94,0.4)] disabled:opacity-50 disabled:shadow-none backdrop-blur-md border border-white/20 inline-flex items-center gap-1.5"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {t("admin.action.refund_recruiter")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Recruiters Verifications Section */}
        <motion.div variants={itemVariants} className="glass-panel premium-card-hover p-8 relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-marigold-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="border-b border-ink-200/50 dark:border-ink-700/50 pb-5 mb-6 relative z-10 flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl shadow-inner border border-purple-500/20">
              <Building2 className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-ink-800 dark:text-white uppercase tracking-wide">
                {t("admin.companies.title")}
              </h2>
              <p className="text-sm font-medium text-ink-500 dark:text-ink-400 mt-1">{t("admin.companies.description")}</p>
            </div>
          </div>

          {companies.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center relative z-10">
              <Inbox className="w-16 h-16 text-ink-300 dark:text-ink-600 mb-4 opacity-50" />
              <p className="text-sm font-medium text-ink-500 dark:text-ink-400 italic">{t("admin.companies.empty")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto relative z-10 rounded-xl border border-ink-200/30 dark:border-ink-700/30 shadow-sm bg-white/20 dark:bg-ink-900/20 backdrop-blur-md">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-ink-100/50 dark:bg-ink-800/50 text-ink-500 dark:text-ink-400 font-bold uppercase tracking-wider text-xs border-b border-ink-200/50 dark:border-ink-700/50">
                    <th className="py-4 px-6">{t("admin.companies.th.company")}</th>
                    <th className="py-4 px-6">{t("admin.companies.th.email")}</th>
                    <th className="py-4 px-6">{t("admin.companies.th.phone")}</th>
                    <th className="py-4 px-6">{t("admin.companies.th.status")}</th>
                    <th className="py-4 px-6 text-right">{t("admin.companies.th.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200/30 dark:divide-ink-700/30 text-ink-700 dark:text-ink-300">
                  {companies.map((company, idx) => (
                    <tr key={company._id} className={`transition-colors duration-200 hover:bg-white/40 dark:hover:bg-ink-800/60 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-ink-50/30 dark:bg-ink-800/30'}`}>
                      <td className="py-5 px-6 font-bold text-ink-900 dark:text-white text-base">
                        {company.companyName || company.fullName}
                      </td>
                      <td className="py-5 px-6 font-medium text-ink-600 dark:text-ink-300">{company.email}</td>
                      <td className="py-5 px-6 font-medium text-ink-500 dark:text-ink-400">{company.mobile || <span className="italic opacity-60">{t("admin.companies.fallback.na")}</span>}</td>
                      <td className="py-5 px-6">
                        {company.isVerified ? (
                          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg font-black text-xs uppercase tracking-widest flex items-center inline-flex gap-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {t("admin.companies.status.verified")}
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg font-black text-xs uppercase tracking-widest flex items-center inline-flex gap-1.5 shadow-sm animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> {t("admin.companies.status.pending")}
                          </span>
                        )}
                      </td>
                      <td className="py-5 px-6 text-right">
                        {!company.isVerified ? (
                          <button
                            onClick={() => handleVerifyCompany(company.email)}
                            disabled={verifyingEmail === company.email}
                            className="glass-button px-4 py-2 bg-marigold-500/90 hover:bg-marigold-500 text-white rounded-xl font-bold text-xs transition-all shadow-[0_4px_15px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:shadow-none backdrop-blur-md border border-white/20 inline-flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {t("admin.action.approve_credentials")}
                          </button>
                        ) : (
                          <span className="text-xs text-ink-400 dark:text-ink-500 font-medium italic bg-ink-100/50 dark:bg-ink-800/50 px-3 py-1.5 rounded-lg border border-ink-200/50 dark:border-ink-700/50">{t("admin.companies.no_action")}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* 👑 Platform Configuration & System Backups Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Configuration Form settings */}
          <motion.div variants={itemVariants} className="glass-panel premium-card-hover p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="border-b border-ink-200/50 dark:border-ink-700/50 pb-4 mb-6 relative z-10 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl shadow-inner border border-amber-500/20">
                <Settings className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-black text-ink-800 dark:text-white uppercase tracking-wide">
                  {t("admin.config.title")}
                </h2>
                <p className="text-sm font-medium text-ink-500 dark:text-ink-400 mt-1">{t("admin.config.description")}</p>
              </div>
            </div>
            
            <form onSubmit={handleSaveConfig} className="space-y-6 relative z-10">
              <div className="bg-white/30 dark:bg-ink-800/30 p-5 rounded-2xl border border-white/40 dark:border-ink-700/50 shadow-sm backdrop-blur-md transition-colors focus-within:border-marigold-500/50">
                <div className="flex justify-between items-center font-bold text-ink-700 dark:text-ink-200 mb-3 text-sm uppercase tracking-wide">
                  <span>{t("admin.config.commission_fee")}</span>
                  <span className="bg-marigold-500/90 text-white px-3 py-1 rounded-lg shadow-sm border border-marigold-400/50">{commissionRate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-full h-2 bg-ink-200/80 dark:bg-ink-700/80 rounded-full appearance-none cursor-pointer accent-marigold-500 shadow-inner"
                />
              </div>

              <div className="bg-white/30 dark:bg-ink-800/30 p-5 rounded-2xl border border-white/40 dark:border-ink-700/50 shadow-sm backdrop-blur-md transition-colors focus-within:border-marigold-500/50">
                <label className="block font-bold text-ink-700 dark:text-ink-200 mb-3 text-sm uppercase tracking-wide">{t("admin.config.min_deposit")}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500 font-bold">₹</span>
                  <input
                    type="number"
                    min="500"
                    max="100000"
                    step="500"
                    value={minDeposit}
                    onChange={(e) => setMinDeposit(Number(e.target.value))}
                    className="glass-input w-full bg-white/40 dark:bg-ink-900/40 border border-white/50 dark:border-ink-700/50 text-sm pl-10 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-500/50 focus:border-marigold-500 dark:text-white font-bold transition-all shadow-inner backdrop-blur-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingConfig}
                className="glass-button w-full py-4 bg-gradient-to-r from-marigold-500 to-purple-600 hover:from-marigold-600 hover:to-purple-700 text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.5)] disabled:opacity-70 disabled:shadow-none mt-2 border border-white/20 backdrop-blur-md flex items-center justify-center gap-2"
              >
                {savingConfig ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    {t("admin.action.saving_settings")}
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    {t("admin.action.apply_config")}
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Database Backup & System Logs */}
          <motion.div variants={itemVariants} className="glass-panel premium-card-hover p-8 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="border-b border-ink-200/50 dark:border-ink-700/50 pb-4 mb-6 relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl shadow-inner border border-emerald-500/20">
                  <Server className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-ink-800 dark:text-white uppercase tracking-wide">
                    {t("admin.backup.title")}
                  </h2>
                  <p className="text-sm font-medium text-ink-500 dark:text-ink-400 mt-1">{t("admin.backup.description")}</p>
                </div>
              </div>
              <button
                onClick={handleBackupDatabase}
                disabled={backingUp}
                className="glass-button px-5 py-2.5 bg-ink-800/90 dark:bg-white/90 hover:bg-ink-900 dark:hover:bg-white text-white dark:text-ink-900 text-xs font-black uppercase tracking-wider rounded-xl disabled:opacity-50 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.2)] dark:shadow-[0_4px_15px_rgba(255,255,255,0.2)] flex items-center gap-2 whitespace-nowrap backdrop-blur-md border border-white/10 dark:border-ink-800/10"
              >
                {backingUp ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70"></span>
                    {t("admin.action.backing_up")}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t("admin.action.backup_db")}
                  </>
                )}
              </button>
            </div>

            {backupStatus && (
              <div className="mb-4 relative z-10">
                <p className="text-xs bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 p-3 rounded-xl text-emerald-700 dark:text-emerald-400 font-bold shadow-sm flex items-center gap-2 animate-pulse backdrop-blur-sm">
                  <ChevronRight className="w-4 h-4 text-emerald-500" /> {backupStatus}
                </p>
              </div>
            )}

            <div className="flex-1 bg-ink-900/90 dark:bg-ink-950/90 border border-ink-700/50 shadow-inner text-ink-300 font-mono text-[11px] sm:text-xs p-5 rounded-2xl overflow-y-auto space-y-2 select-text relative z-10 backdrop-blur-xl min-h-[200px] max-h-[300px]">
              <div className="sticky top-0 bg-ink-900/95 dark:bg-ink-950/95 backdrop-blur-sm pb-2 mb-2 border-b border-ink-700/50 text-ink-500 font-bold flex justify-between uppercase tracking-widest text-[10px] py-1 -mt-1 -mx-1 px-1 z-20">
                <span>System Terminal</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></span> LIVE</span>
              </div>
              {systemLogs.map((log, idx) => (
                <div key={idx} className="flex gap-3 hover:bg-white/5 p-1 rounded transition-colors relative z-10">
                  <span className="text-ink-500 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                  <span className={`${log.startsWith("WRN") ? "text-amber-400" : log.startsWith("ERR") ? "text-rose-400" : "text-emerald-400"} break-all`}>
                    {log}
                  </span>
                </div>
              ))}
              <div className="text-ink-600 animate-pulse relative z-10">_</div>
            </div>
          </motion.div>
          
        </div>
        
      </div>
    </motion.div>
  );
}
