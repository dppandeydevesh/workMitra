import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { API_BASE_URL } from "../config";
import { useTranslation } from "react-i18next";

const STAGES = ["Applied", "Shortlisted", "Interviewing", "Offered", "Placed"];

export default function PlacementPipeline() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [offerText, setOfferText] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);

  useEffect(() => {
    const userObj = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(userObj);

    if (!userObj.email || (userObj.userRole !== "company" && userObj.userRole !== "college")) {
      toast.error(t("pipeline.unauthorized"));
      navigate("/");
      return;
    }

    fetchApplications(userObj);
  }, [navigate]);

  const fetchApplications = async (user) => {
    setLoading(true);
    try {
            let url = `${API_BASE_URL}/api/applications`;
      if (user.userRole === "company") {
        url = `${API_BASE_URL}/api/applications/company/${user.email}`;
      }
      
      const res = await fetch(url, { credentials: "include",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        // Set default pipelineStage if missing
        const list = (data.applications || data || []).map(app => ({
          ...app,
          pipelineStage: app.pipelineStage || (app.status === "Completed" ? "Placed" : app.status === "Approved" ? "Offered" : "Applied")
        }));
        setApplications(list);
      } else {
        toast.error(t("pipeline.loadApplicantsFailed"));
      }
    } catch (err) {
      toast.error(t("pipeline.loadNetworkError"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStage = async (appId, newStage) => {
    try {
            const res = await fetch(`${API_BASE_URL}/api/applications/${appId}/update-pipeline`, { credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStage })
      });

      if (res.ok) {
        toast.success(t("pipeline.candidateShifted", { stage: newStage }));
        setApplications(prev => prev.map(app => app._id === appId ? { ...app, pipelineStage: newStage } : app));
      } else {
        const data = await res.json();
        toast.error(data.error || t("pipeline.updateStageFailed"));
      }
    } catch (err) {
      toast.error(t("pipeline.updateStageError"));
    }
  };

  const handleSendOfferSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    setSubmittingOffer(true);
    try {
            const res = await fetch(`${API_BASE_URL}/api/applications/${selectedApp._id}/offer-placement`, { credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ offerText })
      });

      if (res.ok) {
        toast.success(t("pipeline.offerSuccess"));
        setShowOfferModal(false);
        setOfferText("");
        handleUpdateStage(selectedApp._id, "Offered");
      } else {
        const data = await res.json();
        toast.error(data.error || t("pipeline.sendContractFailed"));
      }
    } catch (err) {
      toast.error(t("pipeline.extendOfferError"));
    } finally {
      setSubmittingOffer(false);
    }
  };

  // Metrics
  const totalApplicants = applications.length;
  const placedCount = applications.filter(a => a.pipelineStage === "Placed").length;
  const offeredCount = applications.filter(a => a.pipelineStage === "Offered").length;
  const placedRate = totalApplicants > 0 ? Math.round((placedCount / totalApplicants) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 pb-12 select-none dark:bg-slate-900 transition-colors duration-250">
      {/* Upper Navigation Header */}
      <div className="bg-white dark:bg-slate-900 border-b sticky top-0 z-35 px-6 py-4 flex justify-between items-center dark:bg-slate-950 dark:border-slate-800 transition-colors duration-250">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-200 tracking-tight flex items-center gap-2 dark:text-white">
            <span>💼</span> {t("pipeline.title")}
          </h1>
          <p className="text-[11px] text-slate-500 font-bold dark:text-slate-400">{t("pipeline.subtitle")}</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-3.5 py-1.5 border border-gray-200 text-xs font-bold text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:bg-slate-900 transition dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-900"
        >
          ← {t("pipeline.back")}
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        {/* KPI Cards Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-sm dark:bg-slate-950 dark:border-slate-800 transition">
            <p className="text-[10px] uppercase font-black text-slate-400">{t("pipeline.totalCandidates")}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-200 mt-1 dark:text-white">{totalApplicants}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-sm dark:bg-slate-950 dark:border-slate-800 transition">
            <p className="text-[10px] uppercase font-black text-slate-400">{t("pipeline.activeOffers")}</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{offeredCount}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-sm dark:bg-slate-950 dark:border-slate-800 transition">
            <p className="text-[10px] uppercase font-black text-slate-400">{t("pipeline.hiredPlaced")}</p>
            <p className="text-2xl font-black text-green-600 mt-1">{placedCount}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-sm dark:bg-slate-950 dark:border-slate-800 transition">
            <p className="text-[10px] uppercase font-black text-slate-400">{t("pipeline.conversionRate")}</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{placedRate}%</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 font-bold animate-pulse">
            🔄 {t("pipeline.loading")}
          </div>
        ) : (
          /* Kanban Board Grid */
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start overflow-x-auto">
            {STAGES.map((stage) => {
              const stageApps = applications.filter(app => app.pipelineStage === stage);

              return (
                <div key={stage} className="bg-slate-100 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-200/50 flex flex-col gap-3 min-h-[450px] dark:bg-slate-950/40 dark:border-slate-800">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide dark:text-slate-300">{stage}</span>
                    <span className="px-2 py-0.5 bg-slate-200 text-[10px] font-black rounded-lg text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {stageApps.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {stageApps.map((app) => (
                      <div key={app._id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 hover:shadow transition duration-150 text-left dark:bg-slate-950 dark:border-slate-800">
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">
                            {app.studentName || app.studentEmail.split("@")[0].toUpperCase()}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">{app.projectTitle || t("pipeline.defaultProjectTitle")}</p>
                          <p className="text-[9px] text-slate-500 mt-1">{app.studentEmail}</p>
                        </div>

                        {/* Navigation controls */}
                        <div className="flex items-center justify-between border-t pt-2 mt-1">
                          <button
                            disabled={stage === STAGES[0]}
                            onClick={() => {
                              const prevStage = STAGES[STAGES.indexOf(stage) - 1];
                              handleUpdateStage(app._id, prevStage);
                            }}
                            className="p-1 hover:bg-slate-100 dark:bg-slate-800 rounded text-slate-400 disabled:opacity-40 dark:hover:bg-slate-900"
                            title={t("pipeline.moveLeft")}
                          >
                            ◀
                          </button>
                          
                          {currentUser?.userRole === "company" && stage !== "Placed" && stage !== "Offered" && (
                            <button
                              onClick={() => { setSelectedApp(app); setShowOfferModal(true); }}
                              className="text-[9px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-extrabold px-2 py-0.5 rounded"
                            >
                              {t("pipeline.offerJob")} 💼
                            </button>
                          )}

                          <button
                            disabled={stage === STAGES[STAGES.length - 1]}
                            onClick={() => {
                              const nextStage = STAGES[STAGES.indexOf(stage) + 1];
                              handleUpdateStage(app._id, nextStage);
                            }}
                            className="p-1 hover:bg-slate-100 dark:bg-slate-800 rounded text-slate-400 disabled:opacity-40 dark:hover:bg-slate-900"
                            title={t("pipeline.moveRight")}
                          >
                            ▶
                          </button>
                        </div>
                      </div>
                    ))}

                    {stageApps.length === 0 && (
                      <div className="text-center py-8 text-[10px] text-slate-400 italic">
                        {t("pipeline.noCandidates")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Offer Job modal */}
      {showOfferModal && selectedApp && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl p-6 border text-left dark:bg-slate-950 dark:border-slate-800">
            <div className="flex justify-between items-center border-b pb-3 mb-4 dark:border-slate-800">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">{t("pipeline.extendContractTitle")}</h3>
              <button onClick={() => setShowOfferModal(false)} className="text-gray-400 hover:text-gray-600 dark:text-gray-300 text-lg">×</button>
            </div>
            <form onSubmit={handleSendOfferSubmit} className="space-y-4">
              <p className="text-xs text-slate-500">
                {t("pipeline.offerPrefix")} <strong>{selectedApp.studentName}</strong>. {t("pipeline.offerSuffix")}
              </p>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 dark:text-slate-400">{t("pipeline.offerMessageTerms")}</label>
                <textarea
                  placeholder={t("pipeline.offerPlaceholder")}
                  value={offerText}
                  onChange={(e) => setOfferText(e.target.value)}
                  rows={4}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none dark:bg-slate-900 dark:border-slate-800 dark:text-white resize-none"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 dark:bg-slate-900 transition dark:border-slate-800 dark:text-slate-400"
                >
                  {t("pipeline.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submittingOffer}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  {submittingOffer ? t("pipeline.sending") : t("pipeline.extendOffer")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
