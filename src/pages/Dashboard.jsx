import { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config';
import { useDashboard } from '../hooks/useDashboard';
import { track } from '../utils/analytics';
import PremiumCheckoutModal from '../components/PremiumCheckoutModal';
import DailyStreakCard from '../components/DailyStreakCard';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import {
  Briefcase,
  CheckCircle,
  MessageSquare,
  Ticket,
  Inbox,
  BrainCircuit,
  Search,
  Sparkles,
  Building2,
  MapPin,
  Bot,
  BarChart3,
  AlertTriangle,
  FileText,
  Clock,
  TrendingUp,
  ChevronRight,
  Check,
  Award,
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleProjectClick = (project) => {
    track('project_viewed', {
      projectId: project._id,
      company: project.companyName,
    });
    navigate(`/project/${project._id}`);
  };

  const {
    projects,
    loading,
    currentUser,
    setCurrentUser,
    myApplications,
    appliedProjectIds,
    showSubmitModal,
    setShowSubmitModal,
    activeAppToSubmit,
    setActiveAppToSubmit,
    submissionLink,
    setSubmissionLink,
    submissionText,
    setSubmissionText,
    githubRepoUrl,
    setGithubRepoUrl,
    liveDeploymentUrl,
    setLiveDeploymentUrl,

    cvReport,
    // eslint-disable-next-line no-unused-vars
    resumeUrl,
    // eslint-disable-next-line no-unused-vars
    setResumeUrl,
    resumeText,
    // eslint-disable-next-line no-unused-vars
    setResumeText,

    loadingReview,
    // eslint-disable-next-line no-unused-vars
    updatingResume,
    uploadingCV,

    showCheckoutModal,
    setShowCheckoutModal,
    // eslint-disable-next-line no-unused-vars
    checkingOutPass,
    // eslint-disable-next-line no-unused-vars
    checkoutStep,
    setCheckoutStep,
    codeQualityRubric,
    setCodeQualityRubric,
    correctnessRubric,
    setCorrectnessRubric,
    documentationRubric,
    setDocumentationRubric,
    usedAi,
    setUsedAi,
    aiPercentage,
    setAiPercentage,
    aiToolsUsed,
    setAiToolsUsed,
    showExtensionModal,
    setShowExtensionModal,
    activeAppToExtend,
    setActiveAppToExtend,
    extensionDays,
    setExtensionDays,
    extensionReason,
    setExtensionReason,

    requestingExtension,
    aiTopPicks,
    loadingAiPicks,
    // eslint-disable-next-line no-unused-vars
    totalPages,
    errorMessage,
    handleSubmitWork,
    handleUploadCVFile,
    handleUpdateResumeDetails,
    handleReviewCV,
    handleRequestExtension,
    saveDraft,
    scrollToSection,
    initializeDashboardData,
    searchTerm,
    setSearchTerm,
    showSearchSuggestions,
    setShowSearchSuggestions,
    skillFilter,
    setSkillFilter,
    workTypeFilter,
    setWorkTypeFilter,

    maxBudgetFilter,
    setMaxBudgetFilter,
    sortBy,
    setSortBy,
    page,
    setPage,
    limit,
  } = useDashboard();

  const [isTrialActive, setIsTrialActive] = useState(true);

  useEffect(() => {
    if (!currentUser?.createdAt) return;
    const trialDurationMs = 30 * 24 * 60 * 60 * 1000;
    const active =
      Date.now() - new Date(currentUser.createdAt).getTime() < trialDurationMs;
    if (active !== isTrialActive) {
      setTimeout(() => {
        setIsTrialActive(active);
      }, 0);
    }
  }, [currentUser?.createdAt, isTrialActive]);

  const renderStepper = useCallback(
    (status) => {
      const steps = [
        { label: t('dashboard.appliedStatus'), statusVal: 'Pending' },
        { label: t('dashboard.approvedStatus'), statusVal: 'Approved' },
        { label: t('dashboard.submittedStatus'), statusVal: 'Submitted' },
        { label: t('dashboard.completedStatus'), statusVal: 'Completed' },
      ];

      if (status === 'Rejected') {
        return (
          <span className="bg-red-100 text-red-800 text-[9px] font-bold px-2 py-0.5 rounded border border-red-200">
            {t('dashboard.rejectedStatus')}
          </span>
        );
      }

      if (status === 'Disputed') {
        return (
          <span className="bg-rose-100 text-rose-800 text-[9px] font-black px-2.5 py-0.5 rounded-lg border border-rose-200 uppercase tracking-wider animate-pulse flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />{' '}
            {t('dashboard.flaggedDisputedStatus')}
          </span>
        );
      }

      let activeIdx = 0;
      if (status === 'Approved') activeIdx = 1;
      if (status === 'Submitted') activeIdx = 2;
      if (status === 'Completed') activeIdx = 3;

      return (
        <div className="flex items-center space-x-1 text-[8px] sm:text-[9px]">
          {steps.map((step, idx) => {
            const isCompleted = idx <= activeIdx;
            const isActive = idx === activeIdx;
            return (
              <div key={idx} className="flex items-center space-x-1">
                <span
                  className={`px-1.5 py-0.5 rounded font-extrabold transition-all uppercase ${
                    isActive
                      ? 'bg-gradient-to-r from-paper to-pink-600 text-white shadow-sm'
                      : isCompleted
                        ? 'bg-paper text-ink-dark font-semibold'
                        : 'bg-ink-100 text-ink-400 font-normal'
                  }`}
                >
                  {step.label}
                </span>
                {idx < steps.length - 1 && (
                  <span
                    className={
                      isCompleted
                        ? 'text-ink-dark font-bold flex items-center'
                        : 'text-ink-300 flex items-center'
                    }
                  >
                    <ChevronRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      );
    },
    [t]
  );

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.15 } },
  };

  // ── Computed values ────────────────────────────────────────────────────────
  // eslint-disable-next-line no-unused-vars
  const notificationsList = useMemo(() => {
    return myApplications
      .map((app) => {
        const project = app.projectId;
        if (!project) return null;
        if (app.status === 'Approved') {
          return {
            id: app._id,
            title: t('dashboard.appApprovedTitle') + ' 🎉',
            message: t('dashboard.appApprovedMsg', { title: project.title }),
            date: app.appliedAt,
            type: 'info',
          };
        }
        if (app.status === 'Completed') {
          return {
            id: app._id,
            title: t('dashboard.gigCompletedTitle') + ' 🏆',
            message: t('dashboard.gigCompletedMsg', {
              title: project.title,
              feedback: app.feedbackText || t('dashboard.excellentWork'),
            }),
            date: app.submittedAt || app.appliedAt,
            type: 'success',
          };
        }
        if (app.status === 'Rejected') {
          return {
            id: app._id,
            title: t('dashboard.appRejectedTitle') + ' ✕',
            message: t('dashboard.appRejectedMsg', { title: project.title }),
            date: app.appliedAt,
            type: 'danger',
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [myApplications, t]);

  const uniqueSkillsList = useMemo(() => {
    return [
      ...new Set(
        projects.flatMap((p) => p.requiredSkills || []).map((s) => s.trim())
      ),
    ];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects
      .filter((project) => {
        const query = searchTerm.toLowerCase();
        const matchesSearch =
          project.title?.toLowerCase().includes(query) ||
          (project.companyId &&
            project.companyId.email &&
            project.companyId.email.toLowerCase().includes(query)) ||
          project.description?.toLowerCase().includes(query);
        const matchesSkill =
          skillFilter === 'All' ||
          (project.requiredSkills &&
            project.requiredSkills.includes(skillFilter));
        const matchesWorkType =
          workTypeFilter === 'All' || project.workType === workTypeFilter;
        const budgetVal = project.budget || 0;
        const matchesBudget =
          maxBudgetFilter >= 10000 || budgetVal <= maxBudgetFilter;
        return (
          matchesSearch && matchesSkill && matchesWorkType && matchesBudget
        );
      })
      .sort((a, b) => {
        if (sortBy === 'budgetHigh') return (b.budget || 0) - (a.budget || 0);
        if (sortBy === 'closestDeadline') {
          const dA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          const dB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
          return dA - dB;
        }
        if (sortBy === 'latest')
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        return 0;
      });
  }, [
    projects,
    searchTerm,
    skillFilter,
    workTypeFilter,
    maxBudgetFilter,
    sortBy,
  ]);

  // Client-side pagination over the FILTERED list — the /recommended endpoint
  // returns every project, so search/filters must apply across all of them,
  // not just the visible page.
  const totalFilteredPages = Math.max(
    1,
    Math.ceil(filteredProjects.length / limit)
  );
  const safePage = Math.min(page, totalFilteredPages);
  const pagedProjects = useMemo(
    () => filteredProjects.slice((safePage - 1) * limit, safePage * limit),
    [filteredProjects, safePage, limit]
  );

  // Jump back to page 1 whenever a filter narrows the list
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, skillFilter, workTypeFilter, maxBudgetFilter, sortBy]);

  // 📱 Mobile tab view (?tab=home|projects|gigs) driven by the BottomNav —
  // phones show one section at a time; md+ ignores the tab and shows all.
  const [searchParams, setSearchParams] = useSearchParams();
  const mobileTab = searchParams.get('tab') || 'home';
  const openSection = (sectionId, tab) => {
    setSearchParams({ tab }, { replace: true });
    // Desktop shows every section, so smooth-scroll there; on phones the
    // tab switch alone brings the section to the top.
    requestAnimationFrame(() => scrollToSection(sectionId));
  };

  return (
    <motion.div
      className="min-h-screen bg-transparent"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:p-8 wm-panel">
          {/* 🏠 Home tab (welcome + streak + feature cards) */}
          <div className={mobileTab === 'home' ? '' : 'hidden md:block'}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-6 mb-6 gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-ink-800 mb-2 flex items-center flex-wrap gap-2">
                  {t('dashboard.welcome', {
                    name:
                      currentUser?.fullName || t('dashboard.studentDefault'),
                  })}
                  {currentUser?.isEndorsed && (
                    <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-full select-none flex items-center gap-1">
                      {t('dashboard.facultyEndorsed')}{' '}
                      <Award className="w-3 h-3" />
                    </span>
                  )}
                </h1>
                {currentUser?.collegeName && (
                  <div className="flex items-start gap-2.5 mt-3 select-none">
                    <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink-900 tracking-tight leading-none uppercase">
                        {t('dashboard.collegeVerified')}
                      </p>
                      <p className="text-[10px] text-ink-500 mt-1 font-medium leading-none">
                        {currentUser.collegeName}{' '}
                        {currentUser.enrollmentNumber
                          ? `· ID: ${currentUser.enrollmentNumber}`
                          : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Membership Pass Panel Card */}
              <div className="bg-marigold-50 border border-marigold-100 p-4 rounded-xl flex items-center gap-3.5 shadow-sm wm-panel">
                <Ticket className="w-8 h-8 text-marigold-500" />
                <div>
                  <span className="text-[10px] font-black text-marigold-700 uppercase tracking-wider block">
                    {t('dashboard.membershipPassStatus')}
                  </span>
                  {currentUser?.hasPaidPass ? (
                    <span className="text-xs font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                      <Check className="w-3 h-3" />{' '}
                      {t('dashboard.premiumActivated')}
                    </span>
                  ) : isTrialActive ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-emerald-600">
                        {t('dashboard.freeTrialActive')}
                      </span>
                      <button
                        onClick={() => {
                          setCheckoutStep(1);
                          setShowCheckoutModal(true);
                        }}
                        className="bg-marigold-500 text-ink-dark px-2.5 py-1 rounded-lg text-[9px] font-bold transition shadow-sm"
                      >
                        {t('dashboard.upgradePlan')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-rose-500">
                        {t('dashboard.trialExpired') || 'Trial Expired'}
                      </span>
                      <button
                        onClick={() => {
                          setCheckoutStep(1);
                          setShowCheckoutModal(true);
                        }}
                        className="bg-rose-500 text-white px-2.5 py-1 rounded-lg text-[9px] font-bold transition shadow-sm hover:bg-rose-600"
                      >
                        {t('dashboard.purchasePass') || 'Upgrade'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p className="text-ink-600">{t('dashboard.loggedInMsg')}</p>

            {/* 🔥 Daily streak + Today's 3 Tasks */}
            <DailyStreakCard />

            {/* Feature Cards */}
            <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
              <motion.button
                variants={itemVariants}
                onClick={() => openSection('gigs-section', 'gigs')}
                className="group text-left bg-marigold-50 p-4 sm:p-6 rounded-xl hover:bg-marigold-100/70 hover:-translate-y-1 transition-all duration-300 shadow-sm border border-marigold-100/30 wm-panel wm-card"
              >
                <h3 className="font-bold text-lg text-marigold-950 mb-2 group-hover:text-marigold-700 flex items-center gap-2">
                  <Briefcase className="w-5 h-5" /> {t('dashboard.myGigs')}
                </h3>
                <p className="text-ink-600 text-xs">
                  {t('dashboard.manageGigs')}
                </p>
              </motion.button>
              <motion.button
                variants={itemVariants}
                onClick={() => openSection('projects-section', 'projects')}
                className="group text-left bg-green-50 p-4 sm:p-6 rounded-xl hover:bg-green-100/70 hover:-translate-y-1 transition-all duration-300 shadow-sm border border-green-100/30 wm-panel wm-card"
              >
                <h3 className="font-bold text-lg text-green-950 mb-2 group-hover:text-green-700 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> {t('dashboard.orders')}
                </h3>
                <p className="text-ink-600 text-xs">
                  {t('dashboard.exploreProjects')}
                </p>
              </motion.button>
              <motion.button
                variants={itemVariants}
                onClick={() => navigate('/chat')}
                className="group text-left bg-paper p-4 sm:p-6 rounded-xl hover:bg-paper hover:-translate-y-1 transition-all duration-300 shadow-sm border border-border wm-panel wm-card"
              >
                <h3 className="font-bold text-lg text-ink-dark mb-2 group-hover:text-ink-dark flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />{' '}
                  {t('dashboard.messages')}
                </h3>
                <p className="text-ink-600 text-xs">
                  {t('dashboard.chatManagers')}
                </p>
              </motion.button>
            </div>
          </div>

          {/* ================================================================= */}
          {/* 🚀 STUDENT ACTIVE GIGS & APPLICATIONS SECTION */}
          {/* ================================================================= */}
          {currentUser && currentUser.userRole !== 'company' && (
            <div
              id="gigs-section"
              className={`mt-12 pt-8 border-t border-ink-100 ${
                mobileTab === 'gigs'
                  ? 'max-md:mt-0 max-md:pt-0 max-md:border-t-0'
                  : 'hidden md:block'
              }`}
            >
              <h2 className="text-lg sm:text-2xl font-bold text-ink-800 mb-2">
                {t('dashboard.myGigsAppsTitle')}
              </h2>
              <p className="text-sm text-ink-500 mb-6">
                {t('dashboard.trackAppsDesc')}
              </p>

              {myApplications.length === 0 ? (
                <div className="wm-panel p-[40px_24px] text-center max-w-md mx-auto my-6 flex flex-col items-center justify-center">
                  <div className="w-[48px] h-[48px] rounded-xl bg-marigold-100 flex items-center justify-center text-marigold-500 shadow-sm mb-4">
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-medium text-[#1B2333] mb-[6px]">
                      {t('dashboard.noApplicationsYetHeadline')}
                    </h3>
                    <p className="text-[13px] text-[#6B7280] leading-[1.65] max-w-[260px] mx-auto">
                      {t('dashboard.noApplicationsYetBody')}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      document
                        .getElementById('projects-section')
                        ?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="wm-btn wm-btn-primary mt-[20px] active:scale-95"
                  >
                    {t('dashboard.browseMarketplace')}
                  </button>
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  {myApplications.map((app) => {
                    const project = app.projectId;
                    if (!project) return null;
                    return (
                      <motion.div
                        key={app._id}
                        onClick={() => handleProjectClick(project)}
                        className="bg-white rounded-xl border border-ink-200 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition cursor-pointer wm-panel wm-card"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="bg-marigold-50 text-marigold-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1.5">
                              <Briefcase className="w-3 h-3" />{' '}
                              {project.workType}
                            </span>
                            {renderStepper(app.status)}
                          </div>
                          <h4 className="text-sm font-bold text-ink-900 mb-1">
                            {project.title}
                          </h4>
                          <p className="text-xs text-ink-400 mb-2">
                            {t('dashboard.companyLabel')}{' '}
                            {project.companyId && project.companyId.email
                              ? project.companyId.email
                                  .split('@')[0]
                                  .toUpperCase()
                              : 'COMPANY'}
                          </p>
                          <p className="text-xs text-ink-600 line-clamp-2 leading-relaxed mb-4">
                            {project.description}
                          </p>
                        </div>

                        {app.status === 'Revision Requested' &&
                          app.feedbackText && (
                            <div className="text-[10px] text-amber-600 mt-2 font-medium bg-amber-50 border border-amber-100 p-2 rounded-xl text-left">
                              <strong>
                                {t('dashboard.revisionRequested')}
                              </strong>
                              "{app.feedbackText}"
                            </div>
                          )}

                        <div className="border-t pt-3 mt-2 flex flex-col gap-3">
                          <div className="flex justify-between items-center text-[10px]">
                            <div>
                              <p className="text-[9px] uppercase font-bold text-ink-400">
                                {t('dashboard.budget')}
                              </p>
                              <p className="font-bold text-green-600 text-xs">
                                ₹{project.budget.toLocaleString()}
                              </p>
                            </div>
                            {(app.status === 'Approved' ||
                              app.status === 'Revision Requested') && (
                              <div className="text-right">
                                <p className="text-[9px] uppercase font-bold text-ink-400">
                                  {t('dashboard.deadlineDate')}
                                </p>
                                <p className="font-extrabold text-marigold-500">
                                  {new Date(
                                    app.extendedDeadline || project.deadline
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>

                          {app.extensionRequests &&
                            app.extensionRequests.length > 0 && (
                              <div className="text-[10px] bg-ink-50 border border-ink-100 p-2 rounded-xl flex justify-between items-center">
                                <span className="text-ink-400 font-bold">
                                  {t('dashboard.extensionStatus')}
                                </span>
                                <span
                                  className={`font-black uppercase text-[9px] ${app.extensionRequests[app.extensionRequests.length - 1].status === 'Approved' ? 'text-green-600' : app.extensionRequests[app.extensionRequests.length - 1].status === 'Rejected' ? 'text-red-500' : 'text-amber-600 animate-pulse'}`}
                                >
                                  {
                                    app.extensionRequests[
                                      app.extensionRequests.length - 1
                                    ].status
                                  }
                                </span>
                              </div>
                            )}

                          <div className="flex justify-between items-center border-t pt-2.5">
                            <div>
                              {app.status === 'Approved' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveAppToExtend(app);
                                    setShowExtensionModal(true);
                                  }}
                                  className="text-[10px] text-marigold-500 font-extrabold hover:underline flex items-center gap-1"
                                >
                                  {t('dashboard.requestExtension')}{' '}
                                  <Clock className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {(app.status === 'Approved' ||
                              app.status === 'Revision Requested') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveAppToSubmit(app);
                                  setShowSubmitModal(true);
                                }}
                                className="bg-marigold-500 text-ink-dark font-bold text-xs px-3.5 py-1.5 rounded-lg transition shadow-sm animate-fade-in"
                              >
                                {app.status === 'Approved'
                                  ? t('dashboard.submitWork')
                                  : t('dashboard.submitRevision')}
                              </button>
                            )}
                            {app.status === 'Submitted' && (
                              <span className="text-[11px] text-amber-600 font-semibold italic">
                                {t('dashboard.underReview')}
                              </span>
                            )}
                            {app.status === 'Completed' && (
                              <div className="text-right w-full flex flex-col items-end gap-1">
                                <span className="text-[11px] text-green-600 font-bold flex items-center justify-end gap-1">
                                  <Check className="w-3 h-3" />{' '}
                                  {t('dashboard.approved')}
                                </span>
                                {currentUser?.hasPaidPass || isTrialActive ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(
                                        `/certificate/verify/${app._id}`
                                      );
                                    }}
                                    className="text-[10px] bg-marigold-50 hover:bg-marigold-100/80 text-marigold-700 font-extrabold px-2 py-1 rounded border border-marigold-200 transition-all flex items-center gap-1 mt-0.5 shadow-sm"
                                  >
                                    <Award className="w-3 h-3" /> View
                                    Certificate 📜
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCheckoutStep(1);
                                      setShowCheckoutModal(true);
                                    }}
                                    className="text-[10px] bg-red-50 hover:bg-red-100/80 text-red-700 font-extrabold px-2 py-1 rounded border border-red-200 transition-all flex items-center gap-1 mt-0.5 shadow-sm"
                                  >
                                    🔒 Unlock Certificate
                                  </button>
                                )}
                                {app.feedbackText && (
                                  <p
                                    className="text-[10px] text-ink-400 max-w-[150px] truncate"
                                    title={app.feedbackText}
                                  >
                                    "{app.feedbackText}"
                                  </p>
                                )}
                              </div>
                            )}
                            {app.status === 'Pending' && (
                              <span className="text-[11px] text-ink-400 font-medium">
                                {t('dashboard.applied')}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* 🧠 workMitra AI CV ANALYZER & CRITIQUE DASHBOARD */}
          {/* ================================================================= */}
          {currentUser && currentUser.userRole !== 'company' && (
            <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-ink-100 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
              {/* Left Panel: CV upload & resume text */}
              <div className="lg:col-span-1 bg-white border border-ink-200 p-4 sm:p-6 rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink-800 mb-1 flex items-center gap-1.5">
                    <BrainCircuit className="w-5 h-5 text-ink-dark" />
                    <span>{t('dashboard.aiCvReviewer')}</span>
                    <span className="bg-marigold-100 text-marigold-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                      {t('dashboard.pro')}
                    </span>
                  </h3>
                  <p className="text-xs text-ink-500 mb-4">
                    {t('dashboard.cvReviewDesc')}
                  </p>

                  <form
                    onSubmit={handleUpdateResumeDetails}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">
                        {t('dashboard.uploadCvPdf')}
                      </label>
                      <div className="relative border-2 border-dashed border-ink-200 rounded-xl p-3 text-center hover:border-marigold-400 transition cursor-pointer bg-ink-50">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleUploadCVFile}
                          disabled={uploadingCV}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {uploadingCV ? (
                          <div className="flex flex-col items-center justify-center space-y-1.5 py-1">
                            <div className="w-5 h-5 border-2 border-marigold-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[10px] text-marigold-500 font-bold">
                              {t('dashboard.extractingText')}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1 flex flex-col items-center">
                            <FileText className="w-6 h-6 text-ink-400 mb-1" />
                            <div className="text-[10px] font-bold text-ink-700">
                              {t('dashboard.dragDropPdf')}
                            </div>
                            <div className="text-[9px] text-ink-400">
                              {t('dashboard.pdfFormatMax')}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {resumeText ? (
                      <div className="bg-emerald-50 border border-emerald-200/50 p-3 rounded-xl text-left flex items-center gap-2 wm-panel">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <div>
                          <div className="text-[10px] font-bold text-emerald-800">
                            {t('dashboard.cvLoaded')}
                          </div>
                          <div className="text-[9px] text-emerald-600/80">
                            {t('dashboard.readyAiCritique')}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200/50 p-3 rounded-xl text-left flex items-center gap-2 wm-panel">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <div>
                          <div className="text-[10px] font-bold text-amber-800">
                            {t('dashboard.noCvUploaded')}
                          </div>
                          <div className="text-[9px] text-amber-600/80">
                            {t('dashboard.pleaseUploadPdf')}
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleReviewCV}
                      disabled={loadingReview || !resumeText}
                      className={`w-full py-3 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-md ${!resumeText || loadingReview ? 'bg-ink-300 cursor-not-allowed' : 'bg-marigold-500 hover:bg-marigold-600 active:scale-[0.98]'}`}
                    >
                      {loadingReview
                        ? t('dashboard.analyzing')
                        : t('dashboard.reviewCv')}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Panel: CV Quality Report */}
              <div className="lg:col-span-2 bg-white border border-[#E1E2DC] text-[#1B2333] p-4 sm:p-6 rounded-xl shadow-sm flex flex-col justify-between min-h-[250px] sm:min-h-[350px]">
                {loadingReview ? (
                  <div className="space-y-6">
                    <div className="space-y-3 animate-pulse">
                      <div className="h-[16px] bg-[#E1E2DC] rounded-[4px] w-3/4"></div>
                      <div className="h-[16px] bg-[#E1E2DC] rounded-[4px] w-5/6"></div>
                      <div className="h-[16px] bg-[#E1E2DC] rounded-[4px] w-2/3"></div>
                      <div className="h-[16px] bg-[#E1E2DC] rounded-[4px] w-4/5"></div>
                    </div>
                    <div className="space-y-3 animate-pulse pt-4">
                      <div className="h-[16px] bg-[#E1E2DC] rounded-[4px] w-3/4"></div>
                      <div className="h-[16px] bg-[#E1E2DC] rounded-[4px] w-5/6"></div>
                      <div className="h-[16px] bg-[#E1E2DC] rounded-[4px] w-2/3"></div>
                      <div className="h-[16px] bg-[#E1E2DC] rounded-[4px] w-4/5"></div>
                    </div>
                  </div>
                ) : cvReport ? (
                  <div className="space-y-6 text-[#1B2333]">
                    {/* Header: Score Ring */}
                    <div className="flex justify-between items-center border-b border-[#E1E2DC] pb-4">
                      <div>
                        <h4 className="text-[16px] font-semibold text-[#1B2333]">
                          {t('dashboard.aiQualityReport')}
                        </h4>
                        <p className="text-[11px] text-[#6B7280] font-medium mt-0.5">
                          {t('dashboard.poweredBy')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3 text-right">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-[#6B7280]">
                            {t('dashboard.qualityScore')}
                          </p>
                          <p className="text-2xl font-black text-marigold-500">
                            {cvReport.score}/100
                          </p>
                        </div>
                        <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-white border-2 border-marigold-500">
                          <span className="text-[11px] font-black text-[#1B2333]">
                            {cvReport.score}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      <div>
                        <h5 className="text-[12px] font-bold uppercase text-[#1B2333] mb-2 flex items-center gap-1.5">
                          <span className="text-[#1D9E75]">✓</span>{' '}
                          <span className="tracking-wider">
                            {t('dashboard.strengths')}
                          </span>
                        </h5>
                        <ul className="text-[13px] text-[#3D4A5C]">
                          {cvReport.strengths?.map((str, idx) => (
                            <li
                              key={idx}
                              className="py-2 border-b border-[#E1E2DC] last:border-b-0 leading-tight"
                            >
                              <span className="text-[#1D9E75] font-bold mr-1.5">
                                ✓
                              </span>
                              {str}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-[12px] font-bold uppercase text-[#1B2333] mb-2 flex items-center gap-1.5">
                          <span className="text-marigold-500">!</span>{' '}
                          <span className="tracking-wider">
                            {t('dashboard.areasOfImprovement')}
                          </span>
                        </h5>
                        <ul className="text-[13px] text-[#3D4A5C]">
                          {cvReport.improvements?.map((imp, idx) => (
                            <li
                              key={idx}
                              className="py-2 border-b border-[#E1E2DC] last:border-b-0 leading-tight"
                            >
                              <span className="text-marigold-500 font-bold mr-1.5">
                                !
                              </span>
                              {imp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Recommendations Alert Box */}
                    <div className="bg-[#FBE7C4] border border-[#EFC88A] p-4 rounded-xl text-left">
                      <h5 className="text-[11px] font-bold uppercase text-[#7A4F00] mb-1">
                        {t('dashboard.actionableRecommendations')}
                      </h5>
                      <p className="text-xs text-[#3D4A5C] leading-relaxed italic">
                        "{cvReport.recommendations}"
                      </p>
                    </div>

                    {/* Skill Gap Analyzer */}
                    <div className="bg-[#F6F7F4] border border-[#E1E2DC] p-4 rounded-xl text-left">
                      <h5 className="text-[11px] font-bold uppercase text-[#1B2333] mb-2 flex items-center gap-1.5 justify-between">
                        <span className="flex items-center gap-1.5">
                          <Search className="w-3.5 h-3.5 text-[#3D4A5C]" />{' '}
                          {t('dashboard.skillGapAnalyzer')}
                        </span>
                        <span className="bg-[#FBE7C4] text-[#7A4F00] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />{' '}
                          {t('dashboard.liveDemands')}
                        </span>
                      </h5>
                      {(() => {
                        const userSkills = new Set(
                          (currentUser?.preferredTechStack || [])
                            .concat(
                              (currentUser?.targetSkills || '').split(',')
                            )
                            .map((s) => s.trim().toLowerCase())
                            .filter(Boolean)
                        );
                        const gapCounts = {};
                        projects.forEach((p) => {
                          (p.requiredSkills || []).forEach((s) => {
                            const skillLower = s.trim().toLowerCase();
                            if (!userSkills.has(skillLower)) {
                              gapCounts[s.trim()] =
                                (gapCounts[s.trim()] || 0) + 1;
                            }
                          });
                        });
                        const sortedGaps = Object.entries(gapCounts)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 4);

                        if (sortedGaps.length === 0) {
                          return (
                            <p className="text-[11px] text-[#6B7280] italic">
                              {t('dashboard.noSkillGaps')}
                            </p>
                          );
                        }

                        return (
                          <div className="space-y-2">
                            <p className="text-[11px] text-[#3D4A5C] leading-normal">
                              {t('dashboard.missingSkills')}
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {sortedGaps.map(([skill, count]) => (
                                <span
                                  key={skill}
                                  className="bg-white border border-[#E1E2DC] text-[#3D4A5C] text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                                  title={`${count} active projects require this`}
                                >
                                  {skill}
                                  <span className="bg-[#E1F5EE] text-[#085041] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                    +{count} {t('dashboard.gigs')}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full my-auto text-center p-8">
                    <p className="text-[13px] text-[#6B7280] font-medium">
                      Upload your CV to see strengths and improvement areas
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 🚀 DEPLOYED COMPANY PROJECTS MARKETPLACE BLOCK */}
          {/* ================================================================= */}
          <div
            id="projects-section"
            className={`mt-12 pt-8 border-t border-ink-100 ${
              mobileTab === 'projects'
                ? 'max-md:mt-0 max-md:pt-0 max-md:border-t-0'
                : 'hidden md:block'
            }`}
          >
            <h2 className="text-lg sm:text-2xl font-bold text-ink-800 mb-2">
              {t('dashboard.deployedCompanyProjects')}
            </h2>
            <p className="text-xs sm:text-sm text-ink-500 mb-4 sm:mb-6">
              {t('dashboard.exploreTasks')}
            </p>

            {/* AI Top Picks */}
            {currentUser && currentUser.userRole === 'student' && (
              <div className="mb-8">
                <h3 className="text-md font-bold text-transparent bg-clip-text bg-gradient-to-r from-marigold-500 to-paper mb-4 flex items-center gap-2 drop-shadow-sm">
                  <Sparkles className="w-6 h-6 text-marigold-500" />{' '}
                  {t('dashboard.aiTopPicks')}
                </h3>
                {loadingAiPicks ? (
                  <div className="flex space-x-4 overflow-x-auto pb-4 hide-scrollbar">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="min-w-[280px] sm:min-w-[320px] h-32 rounded-xl border border-ink-200 skeleton-loader wm-panel"
                      ></div>
                    ))}
                  </div>
                ) : Array.isArray(aiTopPicks) && aiTopPicks.length > 0 ? (
                  <div className="flex space-x-4 overflow-x-auto pb-4 hide-scrollbar py-2">
                    {aiTopPicks.map((project) => (
                      <motion.div
                        key={project._id}
                        onClick={() => handleProjectClick(project)}
                        className="min-w-[280px] sm:min-w-[320px] transition cursor-pointer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          borderRadius: 12,
                          overflow: 'hidden',
                          border: '0.5px solid #E1E2DC',
                        }}
                      >
                        <div style={{ height: 3, background: '#F5A623' }} />
                        <div
                          style={{
                            background: '#FFFFFF',
                            padding: '18px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            height: 'calc(100% - 3px)',
                          }}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-ink-900 text-sm truncate pr-2">
                                {project.title}
                              </h4>
                              <span className="bg-gradient-to-r from-paper to-pink-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                {t('dashboard.topMatch')}
                              </span>
                            </div>
                            <p className="text-xs text-ink-600 line-clamp-2 mb-3">
                              {project.description}
                            </p>
                          </div>
                          <div className="flex justify-between items-center mt-2 border-t pt-3">
                            <span className="font-bold text-green-600 text-xs">
                              ₹{project.budget?.toLocaleString() || 0}
                            </span>
                            <span className="text-marigold-500 font-bold text-[10px] flex items-center gap-0.5">
                              {t('dashboard.viewDetails')}{' '}
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="wm-panel p-[24px_16px] text-center max-w-sm mx-auto flex flex-col items-center justify-center">
                    <div className="w-[40px] h-[40px] rounded-xl bg-[#FBE7C4] flex items-center justify-center text-[#F5A623] shadow-sm mb-3">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-semibold text-[#1B2333] mb-[4px]">
                        {t('dashboard.noAiRecommendations')}
                      </h4>
                      <p className="text-[12px] text-[#6B7280] leading-normal max-w-[200px] mx-auto">
                        Set your preferred tech stack in settings to generate
                        personalized AI recommendations.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Marketplace Filters Panel */}
            <div className="bg-ink-50 border border-ink-100 p-4 rounded-xl mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <label className="block text-[9px] font-bold text-ink-400 uppercase mb-1">
                  {t('dashboard.searchKeywords')}
                </label>
                <input
                  type="text"
                  placeholder={t('dashboard.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSearchSuggestions(true);
                  }}
                  onFocus={() => setShowSearchSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowSearchSuggestions(false), 250)
                  }
                  className="w-full bg-white border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"
                />
                {showSearchSuggestions && searchTerm && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-ink-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto text-left">
                    {(() => {
                      const query = searchTerm.toLowerCase();
                      const suggestions = [];
                      projects.forEach((p) => {
                        if (
                          p.title &&
                          p.title.toLowerCase().includes(query) &&
                          !suggestions.includes(p.title)
                        ) {
                          suggestions.push(p.title);
                        }
                        if (p.requiredSkills) {
                          p.requiredSkills.forEach((s) => {
                            if (
                              s.toLowerCase().includes(query) &&
                              !suggestions.includes(s)
                            ) {
                              suggestions.push(s);
                            }
                          });
                        }
                      });
                      if (suggestions.length === 0) return null;
                      return suggestions.slice(0, 5).map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSearchTerm(suggestion);
                            setShowSearchSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-ink-700 hover:bg-ink-100 transition border-b border-ink-50 last:border-b-0 font-medium flex items-center gap-2"
                        >
                          <Search className="w-3 h-3 text-ink-400" />{' '}
                          {suggestion}
                        </button>
                      ));
                    })()}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[9px] font-bold text-ink-400 uppercase mb-1">
                  {t('dashboard.filterBySkill')}
                </label>
                <select
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  className="w-full bg-white border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"
                >
                  <option value="All">{t('dashboard.allSkills')}</option>
                  {uniqueSkillsList.map((skill, idx) => (
                    <option key={idx} value={skill}>
                      {skill}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-ink-400 uppercase mb-1">
                  {t('dashboard.filterByWorkType')}
                </label>
                <select
                  value={workTypeFilter}
                  onChange={(e) => setWorkTypeFilter(e.target.value)}
                  className="w-full bg-white border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"
                >
                  <option value="All">{t('dashboard.allTypes')}</option>
                  <option value="Internship">
                    {t('dashboard.internship')}
                  </option>
                  <option value="Part-Time">{t('dashboard.partTime')}</option>
                  <option value="Full-Time">{t('dashboard.fullTime')}</option>
                  <option value="Freelance">{t('dashboard.freelance')}</option>
                  <option value="Micro Tasks">
                    {t('dashboard.microTasks')}
                  </option>
                </select>
              </div>

              {/* Slider for Max Budget */}
              <div>
                <label className="block text-[9px] font-bold text-ink-400 uppercase mb-1">
                  {t('dashboard.maxBudget')}{' '}
                  {maxBudgetFilter >= 10000
                    ? t('dashboard.unlimited')
                    : `₹${maxBudgetFilter.toLocaleString()}`}
                </label>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="1000"
                  value={maxBudgetFilter}
                  onChange={(e) => setMaxBudgetFilter(Number(e.target.value))}
                  className="w-full h-2 bg-ink-200 rounded-lg appearance-none cursor-pointer accent-marigold-600 mt-3"
                />
              </div>

              {/* Sort By Select */}
              <div>
                <label className="block text-[9px] font-bold text-ink-400 uppercase mb-1">
                  {t('dashboard.sortGigs')}
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-white border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"
                >
                  <option value="latest">{t('dashboard.newest')}</option>
                  <option value="budgetHigh">
                    {t('dashboard.highestBudget')}
                  </option>
                  <option value="closestDeadline">
                    {t('dashboard.closestDeadline')}
                  </option>
                </select>
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <span>⚠️</span> {errorMessage}
                </div>
                <button
                  onClick={() => initializeDashboardData()}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[11px] transition active:scale-95 whitespace-nowrap"
                >
                  Retry
                </button>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-ink-200 p-4 sm:p-6 shadow-sm h-48 skeleton-loader wm-panel"
                  ></div>
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12 px-6 border border-ink-200 rounded-xl bg-white max-w-md mx-auto my-6 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-marigold-50 flex items-center justify-center text-marigold-500 shadow-sm border border-marigold-100">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink-900 tracking-tight">
                    {t('dashboard.noMatchingProjects')}
                  </h3>
                  <p className="text-xs text-ink-500 mt-1 max-w-xs leading-relaxed">
                    {t('dashboard.noMatchingProjectsDesc')}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/preferences')}
                  className="wm-btn wm-btn-primary py-2 px-4 text-xs font-semibold rounded-lg shadow-sm active:scale-95"
                >
                  {t('dashboard.setPreferences')}
                </button>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
              >
                {pagedProjects.map((project) => {
                  const isAlreadyApplied = appliedProjectIds.includes(
                    project._id.toString()
                  );
                  return (
                    <motion.div
                      key={project._id}
                      onClick={() => handleProjectClick(project)}
                      className="bg-white rounded-xl border border-ink-200 p-4 sm:p-6 shadow-sm flex flex-col justify-between hover:border-marigold-400 hover:shadow-md transition-all duration-300 cursor-pointer wm-panel wm-card"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="bg-marigold-50 text-marigold-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />{' '}
                            {project.companyId && project.companyId.email
                              ? project.companyId.email
                                  .split('@')[0]
                                  .toUpperCase()
                              : t('dashboard.companyDefault')}
                          </span>
                          {project.aiRecommendationScore !== undefined && (
                            <span className="bg-marigold-50 text-marigold-700 text-[10px] font-black px-2 py-0.5 rounded-lg border border-marigold-100/50 flex items-center gap-1">
                              <BrainCircuit className="w-3 h-3" />{' '}
                              {project.aiRecommendationScore}%{' '}
                              {t('dashboard.match')}
                            </span>
                          )}
                          <span className="bg-ink-100 text-ink-600 text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{' '}
                            {project.workType || t('dashboard.internship')}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-ink-900 mb-2">
                          {project.title}
                        </h4>
                        <p className="text-xs text-ink-600 leading-relaxed mb-4 line-clamp-3">
                          {project.description}
                        </p>
                      </div>

                      <div className="border-t pt-4 mt-2 space-y-3">
                        <div className="flex flex-wrap gap-1">
                          {project.requiredSkills?.map((skill, index) => (
                            <span
                              key={index}
                              className="bg-ink-50 text-ink-600 text-[10px] font-medium px-2 py-0.5 rounded border border-ink-100"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>

                        <div className="flex justify-between items-center text-xs pt-1">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-ink-400">
                              Budget
                            </p>
                            <p className="font-bold text-green-600 text-sm">
                              ₹{project.budget?.toLocaleString()}
                            </p>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            {currentUser?.userRole === 'company' ? (
                              <button
                                className="bg-ink-100 text-ink-500 font-bold text-xs px-4 py-2 rounded-lg cursor-not-allowed border"
                                disabled
                              >
                                {t('dashboard.companyView')}
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProjectClick(project);
                                }}
                                className={`font-bold text-xs px-4 py-2 rounded-lg transition shadow-sm flex items-center justify-center gap-1.5 ${isAlreadyApplied ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200/50' : 'marigold-btn-inline'}`}
                              >
                                {isAlreadyApplied ? (
                                  <>
                                    <CheckCircle className="w-3.5 h-3.5" />{' '}
                                    {t('dashboard.appliedDetails')}
                                  </>
                                ) : (
                                  t('dashboard.viewDetailsBtn')
                                )}
                              </button>
                            )}

                            {currentUser?.userRole === 'student' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/chat/${project.companyId.email}`);
                                }}
                                className="bg-paper hover:bg-paper text-ink-dark border border-border font-bold text-xs px-4 py-2 rounded-lg transition shadow-sm"
                              >
                                {t('dashboard.chatBtn')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Pagination Controls */}
            {!loading && filteredProjects.length > limit && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${safePage === 1 ? 'bg-ink-100 text-ink-400 cursor-not-allowed' : 'bg-white border border-ink-200 text-ink-700 hover:bg-ink-50'}`}
                >
                  {t('dashboard.previousBtn')}
                </button>
                <span className="text-xs font-bold text-ink-600">
                  {t('dashboard.pageOfText', {
                    page: safePage,
                    total: totalFilteredPages,
                  })}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalFilteredPages, p + 1))
                  }
                  disabled={safePage >= totalFilteredPages}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${safePage >= totalFilteredPages ? 'bg-ink-100 text-ink-400 cursor-not-allowed' : 'bg-white border border-ink-200 text-ink-700 hover:bg-ink-50'}`}
                >
                  {t('dashboard.nextBtn')}
                </button>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* 📤 WORK SUBMISSION FORM OVERLAY MODAL */}
          {/* ================================================================= */}
          {showSubmitModal && activeAppToSubmit && (
            <div className="fixed inset-0 bg-ink-900/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-lg w-full shadow-sm p-6 border overflow-y-auto max-h-[90vh] animate-fade-in text-left">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                  <h3 className="font-black text-sm text-ink-900 uppercase tracking-wider">
                    {t('dashboard.submitWorkTitle')}{' '}
                    {activeAppToSubmit.projectId.title}
                  </h3>
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="text-ink-400 hover:text-ink-600 text-lg font-black"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleSubmitWork} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-ink-500 uppercase mb-1">
                      {t('dashboard.submissionLinkLbl')}
                    </label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={submissionLink}
                      onChange={(e) => {
                        setSubmissionLink(e.target.value);
                        saveDraft({ submissionLink: e.target.value });
                      }}
                      className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-ink-500 uppercase mb-1">
                      {t('dashboard.githubLinkLbl')}
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/username/repo"
                      value={githubRepoUrl}
                      onChange={(e) => {
                        setGithubRepoUrl(e.target.value);
                        saveDraft({ githubRepoUrl: e.target.value });
                      }}
                      className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-ink-500 uppercase mb-1">
                      {t('dashboard.liveDeploymentLbl')}
                    </label>
                    <input
                      type="url"
                      placeholder="https://project.vercel.app"
                      value={liveDeploymentUrl}
                      onChange={(e) => {
                        setLiveDeploymentUrl(e.target.value);
                        saveDraft({ liveDeploymentUrl: e.target.value });
                      }}
                      className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-ink-500 uppercase mb-1">
                      {t('dashboard.notesLbl')}
                    </label>
                    <textarea
                      placeholder={t('dashboard.notesPlaceholder')}
                      value={submissionText}
                      onChange={(e) => {
                        setSubmissionText(e.target.value);
                        saveDraft({ submissionText: e.target.value });
                      }}
                      rows={3}
                      className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-marigold-400 resize-none"
                      required
                    />
                  </div>

                  {/* Rubric Self Assessment */}
                  <div className="border-t pt-3 space-y-3">
                    <h4 className="text-[10px] font-black text-ink-400 uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5" />{' '}
                      {t('dashboard.rubricSelfAssessment')}
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between font-bold text-ink-700">
                          <span>{t('dashboard.codeQuality')}</span>
                          <span>{codeQualityRubric}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={codeQualityRubric}
                          onChange={(e) => {
                            setCodeQualityRubric(Number(e.target.value));
                            saveDraft({
                              codeQualityRubric: Number(e.target.value),
                            });
                          }}
                          className="w-full h-1 bg-ink-200 rounded-lg appearance-none cursor-pointer accent-marigold-600"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between font-bold text-ink-700">
                          <span>{t('dashboard.functionalCorrectness')}</span>
                          <span>{correctnessRubric}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={correctnessRubric}
                          onChange={(e) => {
                            setCorrectnessRubric(Number(e.target.value));
                            saveDraft({
                              correctnessRubric: Number(e.target.value),
                            });
                          }}
                          className="w-full h-1 bg-ink-200 rounded-lg appearance-none cursor-pointer accent-marigold-600"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between font-bold text-ink-700">
                          <span>{t('dashboard.documentation')}</span>
                          <span>{documentationRubric}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={documentationRubric}
                          onChange={(e) => {
                            setDocumentationRubric(Number(e.target.value));
                            saveDraft({
                              documentationRubric: Number(e.target.value),
                            });
                          }}
                          className="w-full h-1 bg-ink-200 rounded-lg appearance-none cursor-pointer accent-marigold-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* AI Declaration */}
                  <div className="border-t pt-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="usedAiCheckbox"
                        checked={usedAi}
                        onChange={(e) => {
                          setUsedAi(e.target.checked);
                          saveDraft({ usedAi: e.target.checked });
                        }}
                        className="w-3.5 h-3.5 accent-marigold-600 cursor-pointer"
                      />
                      <label
                        htmlFor="usedAiCheckbox"
                        className="text-xs font-bold text-ink-700 cursor-pointer select-none flex items-center gap-1.5"
                      >
                        <Bot className="w-4 h-4" /> {t('dashboard.usedAiTools')}
                      </label>
                    </div>

                    {usedAi && (
                      <div className="space-y-3 bg-ink-50 border p-3.5 rounded-xl animate-fade-in text-xs">
                        <div>
                          <div className="flex justify-between font-bold text-ink-700">
                            <span>{t('dashboard.aiContribution')}</span>
                            <span>{aiPercentage}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={aiPercentage}
                            onChange={(e) => {
                              setAiPercentage(Number(e.target.value));
                              saveDraft({
                                aiPercentage: Number(e.target.value),
                              });
                            }}
                            className="w-full h-1 bg-ink-200 rounded-lg appearance-none cursor-pointer accent-marigold-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-ink-400 uppercase mb-1">
                            {t('dashboard.aiToolsUsedDetails')}
                          </label>
                          <input
                            type="text"
                            placeholder={t('dashboard.aiToolsPlaceholder')}
                            value={aiToolsUsed}
                            onChange={(e) => {
                              setAiToolsUsed(e.target.value);
                              saveDraft({ aiToolsUsed: e.target.value });
                            }}
                            className="w-full bg-white border border-ink-200 text-xs px-3.5 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-marigold-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(false)}
                      className="px-4 py-2 border border-ink-200 rounded-xl text-xs font-bold text-ink-500 hover:bg-ink-50 transition"
                    >
                      {t('dashboard.cancelBtn')}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-gradient-to-r from-marigold-600 to-marigold-600 hover:opacity-95 text-white rounded-xl text-xs font-black transition shadow-md"
                    >
                      {t('dashboard.submitWorkBtn')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ⏳ DEADLINE EXTENSION REQUEST MODAL */}
          {showExtensionModal && activeAppToExtend && (
            <div className="fixed inset-0 bg-ink-900/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-md w-full shadow-sm p-6 border animate-fade-in text-left">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                  <h3 className="font-bold text-base text-ink-900">
                    {t('dashboard.requestDeadlineExt')}
                  </h3>
                  <button
                    onClick={() => setShowExtensionModal(false)}
                    className="text-ink-400 hover:text-ink-600 text-lg"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleRequestExtension} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-ink-500 uppercase mb-1">
                      {t('dashboard.requestedDaysExt')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      value={extensionDays}
                      onChange={(e) => setExtensionDays(e.target.value)}
                      className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink-500 uppercase mb-1">
                      {t('dashboard.reasonForExt')}
                    </label>
                    <textarea
                      placeholder={t('dashboard.reasonPlaceholder')}
                      value={extensionReason}
                      onChange={(e) => setExtensionReason(e.target.value)}
                      rows={4}
                      className="w-full bg-ink-50 border border-ink-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none resize-none"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowExtensionModal(false)}
                      className="px-4 py-2 border border-ink-200 rounded-xl text-xs font-bold text-ink-500 hover:bg-ink-50 transition"
                    >
                      {t('dashboard.cancelBtn')}
                    </button>
                    <button
                      type="submit"
                      disabled={requestingExtension}
                      style={{ background: '#F5A623', color: '#1B2333' }}
                      className="px-5 py-2 rounded-xl text-xs font-bold transition shadow-md"
                    >
                      {requestingExtension
                        ? t('dashboard.requesting')
                        : t('dashboard.submitRequest')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 💳 Real Razorpay Gateway Checkout Modal */}
          {showCheckoutModal && (
            <PremiumCheckoutModal
              setShowCheckoutModal={setShowCheckoutModal}
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              API_BASE_URL={API_BASE_URL}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
