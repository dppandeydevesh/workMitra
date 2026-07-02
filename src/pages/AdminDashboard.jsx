import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../config";
import { useToast } from "../components/Toast";

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
      const token = localStorage.getItem("token");
      const headers = { "Authorization": `Bearer ${token}` };

      // 1. Fetch KPI metrics
      const metricsRes = await fetch(`${API_BASE_URL}/api/admin/metrics`, { headers });
      const metricsData = await metricsRes.json();
      
      // 2. Fetch disputes
      const disputesRes = await fetch(`${API_BASE_URL}/api/admin/disputes`, { headers });
      const disputesData = await disputesRes.json();

      // 3. Fetch company accounts
      const companiesRes = await fetch(`${API_BASE_URL}/api/admin/companies`, { headers });
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
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/admin/disputes/${applicationId}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
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
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/admin/companies/${companyEmail}/verify`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
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

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-black uppercase text-indigo-600 tracking-widest animate-pulse">{t("admin.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors py-8 px-4 sm:px-6 lg:px-8 select-none">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Title Section */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">👑 {t("admin.title")}</h1>
            <p className="text-xs text-slate-400 mt-1">{t("admin.description")}</p>
          </div>
          <button
            onClick={fetchAdminData}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            🔄 {t("admin.action.sync_data")}
          </button>
        </div>

        {/* Dashboard KPIs Grid */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">{t("admin.kpi.total_students")}</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white block mt-1">{metrics.totalStudents}</span>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">{t("admin.kpi.verified_recruiters")}</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white block mt-1">{metrics.totalCompanies}</span>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">{t("admin.kpi.total_gigs")}</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white block mt-1">{metrics.totalProjects}</span>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 shadow-sm border-l-4 border-l-blue-500">
              <span className="text-[10px] font-black text-blue-500 uppercase">{t("admin.kpi.locked_escrow")}</span>
              <span className="text-xl font-black text-slate-800 dark:text-white block mt-1">₹{metrics.lockedEscrow.toLocaleString()}</span>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 shadow-sm border-l-4 border-l-emerald-500">
              <span className="text-[10px] font-black text-emerald-500 uppercase">{t("admin.kpi.completed_payouts")}</span>
              <span className="text-xl font-black text-slate-800 dark:text-white block mt-1">₹{metrics.completedEscrow.toLocaleString()}</span>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 shadow-sm border-l-4 border-l-rose-500">
              <span className="text-[10px] font-black text-rose-500 uppercase">{t("admin.kpi.disputed_balance")}</span>
              <span className="text-xl font-black text-slate-800 dark:text-white block mt-1">₹{metrics.disputedEscrow.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Disputes Manager Section */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700/50 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-base font-black text-slate-800 dark:text-white uppercase">⚖️ {t("admin.disputes.title")}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{t("admin.disputes.description")}</p>
          </div>

          {disputes.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-6 text-center">{t("admin.disputes.empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 font-bold">
                    <th className="py-3 px-4">{t("admin.disputes.th.project")}</th>
                    <th className="py-3 px-4">{t("admin.disputes.th.recruiter")}</th>
                    <th className="py-3 px-4">{t("admin.disputes.th.escrow")}</th>
                    <th className="py-3 px-4">{t("admin.disputes.th.reason")}</th>
                    <th className="py-3 px-4 text-right">{t("admin.disputes.th.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-slate-600 dark:text-slate-300">
                  {disputes.map((dispute) => (
                    <tr key={dispute._id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/40">
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-800 dark:text-white block">{dispute.projectId?.title || t("admin.disputes.fallback.project_title")}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{t("admin.disputes.by_student", { name: dispute.studentName, email: dispute.studentEmail })}</span>
                      </td>
                      <td className="py-4 px-4 font-semibold">{dispute.projectId?.companyId}</td>
                      <td className="py-4 px-4 font-black text-green-600">₹{dispute.projectId?.budget?.toLocaleString()}</td>
                      <td className="py-4 px-4 max-w-xs truncate italic">"{dispute.feedbackText || t("admin.disputes.fallback.no_feedback")}"</td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleResolveDispute(dispute._id, "release")}
                          disabled={resolvingId === dispute._id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] transition disabled:opacity-50"
                        >
                          {t("admin.action.release_payout")}
                        </button>
                        <button
                          onClick={() => handleResolveDispute(dispute._id, "refund")}
                          disabled={resolvingId === dispute._id}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[10px] transition disabled:opacity-50"
                        >
                          {t("admin.action.refund_recruiter")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recruiters Verifications Section */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700/50 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-base font-black text-slate-800 dark:text-white uppercase">🏢 {t("admin.companies.title")}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{t("admin.companies.description")}</p>
          </div>

          {companies.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-6 text-center">{t("admin.companies.empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 font-bold">
                    <th className="py-3 px-4">{t("admin.companies.th.company")}</th>
                    <th className="py-3 px-4">{t("admin.companies.th.email")}</th>
                    <th className="py-3 px-4">{t("admin.companies.th.phone")}</th>
                    <th className="py-3 px-4">{t("admin.companies.th.status")}</th>
                    <th className="py-3 px-4 text-right">{t("admin.companies.th.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-slate-600 dark:text-slate-300">
                  {companies.map((company) => (
                    <tr key={company._id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/40">
                      <td className="py-4 px-4 font-bold text-slate-800 dark:text-white">
                        {company.companyName || company.fullName}
                      </td>
                      <td className="py-4 px-4 font-semibold">{company.email}</td>
                      <td className="py-4 px-4">{company.mobile || t("admin.companies.fallback.na")}</td>
                      <td className="py-4 px-4">
                        {company.isVerified ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md font-bold text-[9px] uppercase tracking-wider">
                            ✓ {t("admin.companies.status.verified")}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md font-bold text-[9px] uppercase tracking-wider animate-pulse">
                            {t("admin.companies.status.pending")}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {!company.isVerified ? (
                          <button
                            onClick={() => handleVerifyCompany(company.email)}
                            disabled={verifyingEmail === company.email}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] transition disabled:opacity-50"
                          >
                            {t("admin.action.approve_credentials")}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">{t("admin.companies.no_action")}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 👑 Platform Configuration & System Backups Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Configuration Form settings */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700/50 shadow-sm space-y-4 text-left">
            <div className="border-b pb-3">
              <h2 className="text-base font-black text-slate-800 dark:text-white uppercase">⚙️ {t("admin.config.title")}</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">{t("admin.config.description")}</p>
            </div>
            
            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>{t("admin.config.commission_fee")}</span>
                  <span>{commissionRate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-full h-1 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t("admin.config.min_deposit")}</label>
                <input
                  type="number"
                  min="500"
                  max="100000"
                  step="500"
                  value={minDeposit}
                  onChange={(e) => setMinDeposit(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:bg-slate-900 dark:border-slate-850 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={savingConfig}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl font-bold transition shadow-sm"
              >
                {savingConfig ? t("admin.action.saving_settings") : t("admin.action.apply_config")}
              </button>
            </form>
          </div>

          {/* Database Backup & System Logs */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700/50 shadow-sm space-y-4 text-left">
            <div className="border-b pb-3 flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-slate-800 dark:text-white uppercase">💾 {t("admin.backup.title")}</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">{t("admin.backup.description")}</p>
              </div>
              <button
                onClick={handleBackupDatabase}
                disabled={backingUp}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-xl disabled:opacity-50 dark:bg-white dark:bg-slate-900 dark:text-slate-950"
              >
                {backingUp ? t("admin.action.backing_up") : t("admin.action.backup_db")}
              </button>
            </div>

            {backupStatus && (
              <p className="text-[11px] bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-xl text-slate-600 dark:text-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 font-extrabold animate-pulse">
                {backupStatus}
              </p>
            )}

            <div className="bg-slate-900 text-slate-300 font-mono text-[9px] p-3.5 rounded-xl max-h-[140px] overflow-y-auto space-y-1 select-text">
              {systemLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>
                  <span className={log.startsWith("WRN") ? "text-amber-400" : log.startsWith("ERR") ? "text-red-400" : "text-green-400"}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
