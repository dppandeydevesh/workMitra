import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config';
import { useToast } from '../components/Toast';

/**
 * useApplicantsHub — Custom hook to manage the recruiter's application management panel,
 * including state variables, api action handlers, filtering pipelines, and code sandbox stubs.
 */
export function useApplicantsHub() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

  // Core State variables
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [sortBy, setSortBy] = useState('match'); // 'match' or 'date'
  const [isBlindMode, setIsBlindMode] = useState(false);

  // Task Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeAppToReview, setActiveAppToReview] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(5);
  const [ratingReview, setRatingReview] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const [activeFile, setActiveFile] = useState('App.js');
  const [selectedVerIdx, setSelectedVerIdx] = useState(-1);

  // Auto-set the active submission version when modal loads
  useEffect(() => {
    if (activeAppToReview) {
      const versions = activeAppToReview.submissionVersions || [];
      setSelectedVerIdx(versions.length > 0 ? versions.length - 1 : -1);
    } else {
      setSelectedVerIdx(-1);
    }
  }, [activeAppToReview]);

  // Authenticate user role and fetch applications list on mount
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(savedUser);

    if (!savedUser.email || savedUser.userRole !== 'company') {
      setErrorMessage(t('applicantsHub.corporateSessionMissing'));
      setLoading(false);
      return;
    }

    fetchCompanyApplications(savedUser.email);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCompanyApplications = async (companyEmail) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/applications/company/${companyEmail}`,
        { credentials: 'include', headers: {} }
      );
      const data = await res.json();
      if (res.ok) {
        setApplications(data);
      } else {
        setErrorMessage(data.error || t('applicantsHub.failedFetchApps'));
      }
    } catch (err) { console.error(err);
      setErrorMessage(t('applicantsHub.errorGateway'));
    } finally {
      setLoading(false);
    }
  };

  // Recruiter Action: Accept / Reject application
  const handleUpdateStatus = async (applicationId, status) => {
    if (
      !window.confirm(t('applicantsHub.confirmStatusChange', { status }))
    ) {
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/applications/${applicationId}/status`,
        {
          credentials: 'include',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(t('applicantsHub.statusUpdated', { status }));
        if (currentUser) fetchCompanyApplications(currentUser.email);
      } else {
        toast.error(data.error || t('applicantsHub.failedUpdateStatus'));
      }
    } catch (err) { console.error(err);
      toast.error(t('applicantsHub.errorStatusPayload'));
    }
  };

  // Recruiter Action: File an application dispute
  const handleDisputeApplication = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      toast.error(t('applicantsHub.explainDisputeFirst'));
      return;
    }
    if (!window.confirm(t('applicantsHub.confirmDispute'))) return;

    setSubmittingReview(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/applications/${activeAppToReview._id}/dispute`,
        {
          credentials: 'include',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedbackText }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(t('applicantsHub.disputeRegistered'));
        setShowReviewModal(false);
        if (currentUser) fetchCompanyApplications(currentUser.email);
      } else {
        toast.error(data.error || t('applicantsHub.failedSubmitDispute'));
      }
    } catch (err) { console.error(err);
      toast.error(t('applicantsHub.errorCommGateway'));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleOpenReviewModal = (app) => {
    setActiveAppToReview(app);
    setFeedbackText(app.feedbackText || '');
    setRating(app.rating || 5);
    setRatingReview(app.ratingReview || '');
    setShowReviewModal(true);
  };

  // Recruiter Action: Request a revision of submission work
  const handleRequestRevision = async (e) => {
    e.preventDefault();
    if (!activeAppToReview) return;
    if (!feedbackText.trim()) {
      toast.error(t('applicantsHub.provideRevisionFeedback'));
      return;
    }
    setSubmittingReview(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/applications/${activeAppToReview._id}/revision`,
        {
          credentials: 'include',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedbackText }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(t('applicantsHub.revisionRequestedSuccess'));
        setShowReviewModal(false);
        if (currentUser) fetchCompanyApplications(currentUser.email);
      } else {
        toast.error(data.error || t('applicantsHub.failedSubmitRevision'));
      }
    } catch (err) { console.error(err);
      toast.error(t('applicantsHub.errorSubmitRevision'));
    } finally {
      setSubmittingReview(false);
    }
  };

  // Recruiter Action: Approve/Reject extension request
  const handleReviewExtension = async (applicationId, requestId, status) => {
    if (
      !window.confirm(
        t('applicantsHub.confirmExtension', { status: status.toLowerCase() })
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/applications/${applicationId}/review-extension`,
        {
          credentials: 'include',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId, status }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        toast.success(
          t('applicantsHub.extensionSuccess', {
            status: status.toLowerCase(),
          })
        );
        if (currentUser) fetchCompanyApplications(currentUser.email);
      } else {
        toast.error(data.error || t('applicantsHub.failedResolveExtension'));
      }
    } catch (err) { console.error(err);
      toast.error(t('applicantsHub.networkErrorExtension'));
    }
  };

  // Recruiter Action: Accept submission and complete task
  const handleCompleteReview = async (e) => {
    e.preventDefault();
    if (!activeAppToReview) return;
    setSubmittingReview(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/applications/${activeAppToReview._id}/complete`,
        {
          credentials: 'include',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedbackText, rating, ratingReview }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(t('applicantsHub.taskApproved'));
        setShowReviewModal(false);
        if (currentUser) fetchCompanyApplications(currentUser.email);
      } else {
        toast.error(data.error || t('applicantsHub.failedSubmitReview'));
      }
    } catch (err) { console.error(err);
      toast.error(t('applicantsHub.errorSubmitCompletion'));
    } finally {
      setSubmittingReview(false);
    }
  };

  // Helper function to safely parse submission files for code testing
  const getSubmissionFiles = (app) => {
    if (!app) return {};
    if (app.files && Object.keys(app.files).length > 0) return app.files;

    // Fallback: use submissionText as solution.txt or derive from githubRepoUrl
    return {
      'solution.txt':
        app.submissionText || app.githubRepoUrl || '// No files submitted',
    };
  };

  // Helper to get mock code files based on project category
  const getMockCodeFiles = (projectTitle) => {
    const cleanTitle = (projectTitle || 'Project Solutions').toLowerCase();
    if (
      cleanTitle.includes('react') ||
      cleanTitle.includes('web') ||
      cleanTitle.includes('frontend')
    ) {
      return {
        'App.js': `import React, { useState} from'react';\nimport'./App.css';\n\nexport default function App() {\n const [count, setCount] = useState(0);\n return (\n <div className="app-container">\n <h1>workMitra Verified Solution</h1>\n <p>Click count: {count}</p>\n <button onClick={() => setCount(count + 1)}>Increment</button>\n </div>\n );\n}`,
        'index.html': `<!DOCTYPE html>\n<html>\n<head>\n <title>workMitra Sandbox Output</title>\n</head>\n<body>\n <div id="root"></div>\n</body>\n</html>`,
        'App.css': `.app-container {\n font-family: sans-serif;\n text-align: center;\n padding: 40px;\n background: #f8fafc;\n border-radius: 20px;\n}`,
      };
    }
    if (
      cleanTitle.includes('python') ||
      cleanTitle.includes('script') ||
      cleanTitle.includes('data') ||
      cleanTitle.includes('backend')
    ) {
      return {
        'main.py': `import sys\nimport os\n\ndef calculate_match_insights(cv_text, job_details):\n print("Analyzing student solution metrics...")\n score = 85\n return {\n"status":"Verified",\n"score": score,\n"insights":"Candidate matches frontend requirements perfectly."\n}\n\nif __name__ =="__main__":\n result = calculate_match_insights("CV PDF Text","Job Specs")\n print("Compliance Results:", result)`,
        'requirements.txt': `numpy>=1.22.0\npandas>=1.4.0\nscikit-learn>=1.0.0\n`,
        'README.md': `# Python Solution Script\n\nRun with:\n\`\`\`bash\npython main.py\n\`\`\`\n`,
      };
    }
    return {
      'solution.js': `// Deployed Solution Script\nconsole.log("Loading student verification solution logs...");\n\nfunction verifyTaskNode() {\n return {\n verified: true,\n timestamp: new Date().toISOString(),\n message:"workMitra Automated Escrow check complete."\n};\n}\n\nconsole.log(verifyTaskNode());`,
      'README.md': `# Task Solution Repository\n\nThis is a verified solution uploaded via workMitra client pipeline.\n`,
    };
  };

  // Derived: Extract unique project titles for the dropdown filter
  const uniqueProjectTitles = useMemo(() => {
    return [
      ...new Set(applications.map((app) => app.projectTitle).filter(Boolean)),
    ];
  }, [applications]);

  // Filtering & Sorting pipeline
  const filteredApps = useMemo(() => {
    return applications
      .filter((app) => {
        // 1. Text Search (name, email, skills)
        const query = searchTerm.toLowerCase();
        const matchesSearch =
          (app.studentName || '').toLowerCase().includes(query) ||
          (app.studentEmail || '').toLowerCase().includes(query) ||
          (app.skills || '').toLowerCase().includes(query);

        // 2. Status Filter
        const matchesStatus =
          statusFilter === 'All' || app.status === statusFilter;

        // 3. Project Filter
        const matchesProject =
          projectFilter === 'All' || app.projectTitle === projectFilter;

        return matchesSearch && matchesStatus && matchesProject;
      })
      .sort((a, b) => {
        if (sortBy === 'match') {
          return b.matchScore - a.matchScore;
        } else {
          return new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0);
        }
      });
  }, [applications, searchTerm, statusFilter, projectFilter, sortBy]);

  return {
    navigate,
    t,
    applications,
    loading,
    errorMessage,
    currentUser,

    // Search / Filter
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    projectFilter, setProjectFilter,
    sortBy, setSortBy,
    isBlindMode, setIsBlindMode,

    // Modal
    showReviewModal, setShowReviewModal,
    activeAppToReview, setActiveAppToReview,
    feedbackText, setFeedbackText,
    rating, setRating,
    ratingReview, setRatingReview,
    submittingReview,
    showSandbox, setShowSandbox,
    activeFile, setActiveFile,
    selectedVerIdx, setSelectedVerIdx,

    // Actions
    fetchCompanyApplications,
    handleUpdateStatus,
    handleDisputeApplication,
    handleOpenReviewModal,
    handleRequestRevision,
    handleReviewExtension,
    handleCompleteReview,

    // Helpers
    getSubmissionFiles,
    getMockCodeFiles,
    uniqueProjectTitles,
    filteredApps,
  };
}
