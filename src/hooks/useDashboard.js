// eslint-disable-next-line no-unused-vars
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import { fetchWithAuth } from '../services/apiClient';
import { API_BASE_URL } from '../config';
import { useToast } from '../components/Toast';
import { useDashboardStore } from '../stores/useDashboardStore';

/**
 * useDashboard — master hook that owns all Dashboard state, data-fetching,
 * and event handlers. Dashboard.jsx becomes a pure render layer.
 */
export function useDashboard() {
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

  // ─── Zustand store (search / filter / pagination) ─────────────────────────
  const {
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
    setLimit,
  } = useDashboardStore();

  // ─── Core state ────────────────────────────────────────────────────────────
  const [projects, setProjects] = useState([]);
  const [appliedProjectIds, setAppliedProjectIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [myApplications, setMyApplications] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  // ─── Submit modal state ────────────────────────────────────────────────────
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [activeAppToSubmit, setActiveAppToSubmit] = useState(null);
  const [submissionLink, setSubmissionLink] = useState('');
  const [submissionText, setSubmissionText] = useState('');
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [liveDeploymentUrl, setLiveDeploymentUrl] = useState('');

  // ─── CV / Resume state ─────────────────────────────────────────────────────
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [cvReport, setCvReport] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [updatingResume, setUpdatingResume] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);

  // ─── Checkout modal state ──────────────────────────────────────────────────
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkingOutPass, setCheckingOutPass] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);

  // ─── Phase 12: Submission rubric & AI declaration ──────────────────────────
  const [codeQualityRubric, setCodeQualityRubric] = useState(5);
  const [correctnessRubric, setCorrectnessRubric] = useState(5);
  const [documentationRubric, setDocumentationRubric] = useState(5);
  const [usedAi, setUsedAi] = useState(false);
  const [aiPercentage, setAiPercentage] = useState(0);
  const [aiToolsUsed, setAiToolsUsed] = useState('');

  // ─── Extension modal state ─────────────────────────────────────────────────
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [activeAppToExtend, setActiveAppToExtend] = useState(null);
  const [extensionDays, setExtensionDays] = useState(3);
  const [extensionReason, setExtensionReason] = useState('');
  const [requestingExtension, setRequestingExtension] = useState(false);

  // ─── AI top picks state ────────────────────────────────────────────────────
  const [aiTopPicks, setAiTopPicks] = useState([]);
  const [loadingAiPicks, setLoadingAiPicks] = useState(false);

  // ─── Draft auto-restore when active submission changes ─────────────────────
  useEffect(() => {
    if (activeAppToSubmit) {
      const draft = JSON.parse(
        localStorage.getItem(`workmitra_draft_${activeAppToSubmit._id}`) || '{}'
      );
      setSubmissionLink(draft.submissionLink || '');
      setSubmissionText(draft.submissionText || '');
      setGithubRepoUrl(draft.githubRepoUrl || '');
      setLiveDeploymentUrl(draft.liveDeploymentUrl || '');
      setCodeQualityRubric(draft.codeQualityRubric || 5);
      setCorrectnessRubric(draft.correctnessRubric || 5);
      setDocumentationRubric(draft.documentationRubric || 5);
      setUsedAi(draft.usedAi || false);
      setAiPercentage(draft.aiPercentage || 0);
      setAiToolsUsed(draft.aiToolsUsed || '');
    }
  }, [activeAppToSubmit]);

  // ─── Persist draft to localStorage ────────────────────────────────────────
  const saveDraft = (updatedFields) => {
    if (!activeAppToSubmit) return;
    const currentDraft = JSON.parse(
      localStorage.getItem(`workmitra_draft_${activeAppToSubmit._id}`) || '{}'
    );
    const newDraft = {
      submissionLink,
      submissionText,
      githubRepoUrl,
      liveDeploymentUrl,
      codeQualityRubric,
      correctnessRubric,
      documentationRubric,
      usedAi,
      aiPercentage,
      aiToolsUsed,
      ...currentDraft,
      ...updatedFields,
    };
    localStorage.setItem(
      `workmitra_draft_${activeAppToSubmit._id}`,
      JSON.stringify(newDraft)
    );
  };

  // ─── Fetch detailed applications for a student ─────────────────────────────
  const fetchApplications = async (userEmail) => {
    try {
      const detailsRes = await fetchWithAuth(
        `${API_BASE_URL}/api/applications/student-details/${userEmail}`,
        { credentials: 'include', headers: {} }
      );
      if (detailsRes.ok) {
        const details = await detailsRes.json();
        setMyApplications(details);
      }
    } catch (err) {
      console.error(err);
      console.error('Failed to refetch details');
    }
  };

  // ─── Main data initializer ─────────────────────────────────────────────────
  const initializeDashboardData = async () => {
    setLoading(true);
    setErrorMessage('');

    const savedUser = localStorage.getItem('user');
    let userObj = null;

    if (savedUser) {
      userObj = JSON.parse(savedUser);
      setCurrentUser(userObj);
      setResumeUrl(userObj.resumeUrl || '');
      setResumeText(userObj.resumeText || '');
      setCvReport(userObj.cvReviewReport || null);
    }

    try {
      // Refresh user profile from server
      if (userObj) {
        const userRes = await fetchWithAuth(
          `${API_BASE_URL}/api/auth/user/${userObj.email}`
        );
        if (userRes.ok) {
          const latestUser = await userRes.json();
          setCurrentUser(latestUser);
          localStorage.setItem('user', JSON.stringify(latestUser));
        }
      }

      // Fetch project list (recommended or all)
      const isStudent = userObj && userObj.userRole === 'student';
      const projectsUrl = isStudent
        ? `${API_BASE_URL}/api/projects/recommended?page=${page}&limit=${limit}`
        : `${API_BASE_URL}/api/projects/all?page=${page}&limit=${limit}`;

      const projectsRes = await fetchWithAuth(projectsUrl);
      const projectsData = await projectsRes.json();

      if (projectsRes.ok) {
        const list = projectsData.projects || projectsData;
        if (isStudent) {
          const unpacked = list.map((item) => ({
            ...item.project,
            aiRecommendationScore: item.score,
          }));
          setProjects(unpacked);
        } else {
          setProjects(list);
        }
        if (projectsData.totalPages) setTotalPages(projectsData.totalPages);
      } else {
        setErrorMessage(projectsData.error || t('dashboard.loadProjectsFail'));
      }

      // Student-only: applied IDs, detailed apps, AI picks
      if (userObj && userObj.userRole !== 'company') {
        const appsRes = await fetchWithAuth(
          `${API_BASE_URL}/api/applications/student/${userObj.email}`
        );
        if (appsRes.ok) {
          const appliedIds = await appsRes.json();
          setAppliedProjectIds(appliedIds);
        }

        await fetchApplications(userObj.email);

        setLoadingAiPicks(true);
        try {
          // Try Pinecone semantic match first (instant, scales to thousands of projects)
          const semanticRes = await fetchWithAuth(
            `${API_BASE_URL}/api/ai/semantic-match/${userObj.email}`
          );
          if (semanticRes.ok) {
            const semanticData = await semanticRes.json();
            if (semanticData.pinecone && semanticData.matches?.length > 0) {
              setAiTopPicks(
                semanticData.matches.map((p) => ({
                  ...p,
                  _semanticPowered: true,
                }))
              );
              setLoadingAiPicks(false);
              return; // skip Gemini fallback
            }
          }

          // Fallback: Gemini text-generation recommendations
          const aiRes = await fetchWithAuth(
            `${API_BASE_URL}/api/projects/recommendations/${userObj.email}`
          );
          if (aiRes.ok) {
            const aiData = await aiRes.json();
            setAiTopPicks(aiData);
          }
        } catch (e) {
          console.error('Failed to load AI recommendations:', e);
        } finally {
          setLoadingAiPicks(false);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(t('dashboard.connectServerFail'));
    } finally {
      setLoading(false);
    }
  };

  // Initial load. Pagination is client-side (the /recommended endpoint
  // returns the full scored list), so page/limit changes must NOT refetch.
  useEffect(() => {
    initializeDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  /** Upload a PDF CV file and extract resume text. */
  const handleUploadCVFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error(t('dashboard.pdfFormatError'));
      return;
    }

    setUploadingCV(true);
    const formData = new FormData();
    formData.append('cvFile', file);
    formData.append('email', currentUser.email);

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/profile/upload-cv`,
        {
          credentials: 'include',
          method: 'POST',
          headers: {},
          body: formData,
        }
      );
      const data = await response.json();
      if (response.ok) {
        setResumeText(data.resumeText);
        toast.success(t('dashboard.cvUploadSuccess'));
        const updatedUser = { ...currentUser, resumeText: data.resumeText };
        setCurrentUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        toast.error(data.error || t('dashboard.cvUploadFail'));
      }
    } catch (err) {
      console.error(err);
      toast.error(t('dashboard.uploadGatewayError'));
    } finally {
      setUploadingCV(false);
      e.target.value = null; // allow re-upload of same file
    }
  };

  /** Save resume URL + text to user profile. */
  const handleUpdateResumeDetails = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setUpdatingResume(true);

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/profile/resume`,
        {
          credentials: 'include',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: currentUser.email,
            resumeUrl,
            resumeText,
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast.success(t('dashboard.resumeUpdateSuccess'));
        const updatedUser = {
          ...currentUser,
          resumeUrl: data.user.resumeUrl,
          resumeText: data.user.resumeText,
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        toast.error(data.error || t('dashboard.resumeUpdateFail'));
      }
    } catch (err) {
      console.error(err);
      toast.error(t('dashboard.serverGatewayError'));
    } finally {
      setUpdatingResume(false);
    }
  };

  /** Send resume text to AI CV reviewer and store the report. */
  const handleReviewCV = async () => {
    if (!currentUser) return;

    // Check if trial has expired and user does not have a paid pass
    const trialDurationMs = 30 * 24 * 60 * 60 * 1000;
    const isTrialActive = currentUser.createdAt
      ? Date.now() - new Date(currentUser.createdAt).getTime() < trialDurationMs
      : true;
    if (!currentUser.hasPaidPass && !isTrialActive) {
      toast.error(
        t('dashboard.trialExpiredAiRequired') ||
          'Premium Pass is required to access AI features. Please purchase a pass for just ₹99.'
      );
      setShowCheckoutModal(true);
      return;
    }

    if (!resumeText || resumeText.trim().length === 0) {
      toast.info(t('dashboard.pasteCvInfo'));
      return;
    }
    setLoadingReview(true);

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/ai/review-cv`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, resumeText }),
      });
      const data = await response.json();
      if (response.ok) {
        setCvReport(data.report);
        const updatedUser = {
          ...currentUser,
          resumeText,
          cvReviewReport: data.report,
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        toast.error(data.error || t('dashboard.cvReviewFail'));
      }
    } catch (err) {
      console.error(err);
      toast.error(t('dashboard.aiEngineError'));
    } finally {
      setLoadingReview(false);
    }
  };

  /** Submit completed work for an approved application. */
  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!activeAppToSubmit) return;

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/applications/${activeAppToSubmit._id}/submit`,
        {
          credentials: 'include',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionLink,
            submissionText,
            githubRepoUrl,
            liveDeploymentUrl,
            aiDeclaration: { usedAi, aiPercentage, toolsUsed: aiToolsUsed },
            selfAssessment: {
              codeQuality: codeQualityRubric,
              correctness: correctnessRubric,
              documentation: documentationRubric,
            },
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast.success(t('dashboard.workSubmitSuccess'));
        localStorage.removeItem(`workmitra_draft_${activeAppToSubmit._id}`);
        setShowSubmitModal(false);
        setSubmissionLink('');
        setGithubRepoUrl('');
        setLiveDeploymentUrl('');
        setSubmissionText('');
        setUsedAi(false);
        setAiPercentage(0);
        setAiToolsUsed('');
        setCodeQualityRubric(5);
        setCorrectnessRubric(5);
        setDocumentationRubric(5);
        if (currentUser) {
          fetchApplications(currentUser.email);
        }
      } else {
        toast.error(data.error || t('dashboard.submissionFail'));
      }
    } catch (err) {
      console.error(err);
      toast.error(t('dashboard.submissionPayloadError'));
    }
  };

  /** Request a deadline extension for an approved application. */
  const handleRequestExtension = async (e) => {
    e.preventDefault();
    if (!activeAppToExtend) return;

    setRequestingExtension(true);
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL}/api/applications/${activeAppToExtend._id}/request-extension`,
        {
          credentials: 'include',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestedDays: Number(extensionDays),
            reason: extensionReason,
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(t('dashboard.extensionSuccess'));
        setShowExtensionModal(false);
        setExtensionReason('');
        if (currentUser) {
          fetchApplications(currentUser.email);
        }
      } else {
        toast.error(data.error || t('dashboard.extensionFail'));
      }
    } catch (err) {
      console.error(err);
      toast.error(t('dashboard.extensionNetworkError'));
    } finally {
      setRequestingExtension(false);
    }
  };

  // ─── UI utilities ──────────────────────────────────────────────────────────

  /** Smooth-scroll to a section by element ID. */
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ─── Expose everything ─────────────────────────────────────────────────────
  return {
    // Data
    projects,
    loading,
    currentUser,
    setCurrentUser,
    myApplications,
    appliedProjectIds,
    totalPages,
    errorMessage,
    aiTopPicks,
    loadingAiPicks,

    // Submit modal
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

    // CV / Resume
    cvReport,
    resumeUrl,
    setResumeUrl,
    resumeText,
    setResumeText,
    loadingReview,
    updatingResume,
    uploadingCV,

    // Checkout
    showCheckoutModal,
    setShowCheckoutModal,
    checkingOutPass,
    setCheckingOutPass,
    checkoutStep,
    setCheckoutStep,

    // Rubric & AI declaration
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

    // Extension modal
    showExtensionModal,
    setShowExtensionModal,
    activeAppToExtend,
    setActiveAppToExtend,
    extensionDays,
    setExtensionDays,
    extensionReason,
    setExtensionReason,
    requestingExtension,

    // Zustand filter/search/pagination
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
    setLimit,

    // Handlers
    handleApply: null, // not implemented in original; reserved for future use
    handleSubmitWork,
    handleUploadCVFile,
    handleUpdateResumeDetails,
    handleReviewCV,
    handleRequestExtension,
    saveDraft,
    initializeDashboardData,

    // UI utilities
    scrollToSection,
  };
}
