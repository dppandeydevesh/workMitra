import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { useTranslation } from 'react-i18next';
import { track } from '../utils/analytics';
import { fetchWithAuth } from '../services/apiClient';

const DRAFT_KEY = 'wm_addproject_draft';

export default function AddProject() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // Form Fields States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillsInput, setSkillsInput] = useState(''); // Comma separated
  const [studentsNeeded, setStudentsNeeded] = useState(1);
  // eslint-disable-next-line no-unused-vars
  const [workType, setWorkType] = useState('Micro Tasks');
  const [budget, setBudget] = useState('');
  const [duration, setDuration] = useState('');
  const [deadline, setDeadline] = useState('');
  const [complexity, setComplexity] = useState('Intermediate');
  const [departmentName, setDepartmentName] = useState('Core Team');
  const [targetUniversity, setTargetUniversity] = useState('');
  const [minReadinessScore, setMinReadinessScore] = useState(0);
  const [isNdaRequired, setIsNdaRequired] = useState(false);
  const [hasPpiBadge, setHasPpiBadge] = useState(false);
  const [status, setStatus] = useState('Published');

  // Pre-test quiz builder states (2 questions, optional — start empty so a
  // company that skips this step doesn't accidentally publish stale questions)
  const [q1Text, setQ1Text] = useState('');
  const [q1OptA, setQ1OptA] = useState('');
  const [q1OptB, setQ1OptB] = useState('');
  const [q1OptC, setQ1OptC] = useState('');
  const [q1OptD, setQ1OptD] = useState('');
  const [q1Correct, setQ1Correct] = useState('');

  const [q2Text, setQ2Text] = useState('');
  const [q2OptA, setQ2OptA] = useState('');
  const [q2OptB, setQ2OptB] = useState('');
  const [q2OptC, setQ2OptC] = useState('');
  const [q2OptD, setQ2OptD] = useState('');
  const [q2Correct, setQ2Correct] = useState('');

  // ── Draft persistence ────────────────────────────────────────────────────
  // A 6-step wizard is too much work to lose to a refresh or an accidental
  // Exit tap. Autosave to localStorage (debounced), restore on mount, clear
  // on successful publish.
  const draftSetters = useRef(null);
  draftSetters.current = {
    step: setStep,
    title: setTitle,
    description: setDescription,
    skillsInput: setSkillsInput,
    studentsNeeded: setStudentsNeeded,
    budget: setBudget,
    duration: setDuration,
    deadline: setDeadline,
    complexity: setComplexity,
    departmentName: setDepartmentName,
    targetUniversity: setTargetUniversity,
    minReadinessScore: setMinReadinessScore,
    isNdaRequired: setIsNdaRequired,
    hasPpiBadge: setHasPpiBadge,
    status: setStatus,
    q1Text: setQ1Text,
    q1OptA: setQ1OptA,
    q1OptB: setQ1OptB,
    q1OptC: setQ1OptC,
    q1OptD: setQ1OptD,
    q1Correct: setQ1Correct,
    q2Text: setQ2Text,
    q2OptA: setQ2OptA,
    q2OptB: setQ2OptB,
    q2OptC: setQ2OptC,
    q2OptD: setQ2OptD,
    q2Correct: setQ2Correct,
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      Object.entries(draft).forEach(([key, value]) => {
        const setter = draftSetters.current[key];
        if (setter && value !== undefined && value !== null) setter(value);
      });
      setDraftRestored(true);
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  const draftValues = {
    step,
    title,
    description,
    skillsInput,
    studentsNeeded,
    budget,
    duration,
    deadline,
    complexity,
    departmentName,
    targetUniversity,
    minReadinessScore,
    isNdaRequired,
    hasPpiBadge,
    status,
    q1Text,
    q1OptA,
    q1OptB,
    q1OptC,
    q1OptD,
    q1Correct,
    q2Text,
    q2OptA,
    q2OptB,
    q2OptC,
    q2OptD,
    q2Correct,
  };
  const draftJson = JSON.stringify(draftValues);
  useEffect(() => {
    // Don't persist an untouched form
    if (!title && !description && !skillsInput) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, draftJson);
      } catch {
        /* storage full/blocked — drafting is best-effort */
      }
    }, 600);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftJson]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
  };

  const handleNextStep = () => {
    // Basic validation
    if (step === 1 && (!title || !description || !skillsInput)) {
      toast.error(t('addProject.validationCoreDetails'));
      return;
    }
    if (step === 2 && (!duration || !deadline)) {
      toast.error(t('addProject.validationScheduling'));
      return;
    }
    if (
      step === 3 &&
      (budget === '' || budget === undefined || budget === null)
    ) {
      toast.error(t('addProject.validationRewards'));
      return;
    }
    if (step === 5) {
      // Quiz is optional, but a half-filled question would be silently dropped
      // at submit — surface that instead of publishing without it.
      const incomplete = [
        {
          text: q1Text,
          opts: [q1OptA, q1OptB, q1OptC, q1OptD],
          correct: q1Correct,
        },
        {
          text: q2Text,
          opts: [q2OptA, q2OptB, q2OptC, q2OptD],
          correct: q2Correct,
        },
      ].some(
        (q) =>
          q.text.trim().length > 0 &&
          (!q.opts.every((opt) => opt.trim().length > 0) ||
            !q.opts.some((opt) => opt.trim() === q.correct.trim()))
      );
      if (incomplete) {
        toast.error(t('addProject.validationQuizIncomplete'));
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const requiredSkills = skillsInput
      .split(',')
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);

    // Build the pre-test questions payload — only include complete questions
    // (text + all 4 options + a correct answer that matches one of them)
    const preTestQuestions = [
      {
        question: q1Text,
        options: [q1OptA, q1OptB, q1OptC, q1OptD],
        correctAnswer: q1Correct,
      },
      {
        question: q2Text,
        options: [q2OptA, q2OptB, q2OptC, q2OptD],
        correctAnswer: q2Correct,
      },
    ].filter(
      (q) =>
        q.question.trim().length > 0 &&
        q.options.every((opt) => opt.trim().length > 0) &&
        q.options.some((opt) => opt.trim() === q.correctAnswer.trim())
    );

    const payload = {
      companyId: savedUser.email || 'anonymous_corp',
      title,
      description,
      requiredSkills,
      studentsNeeded: Number(studentsNeeded),
      workType,
      budget: Number(budget),
      duration,
      deadline,
      complexity,
      departmentName,
      targetUniversity,
      minReadinessScore: Number(minReadinessScore),
      isNdaRequired,
      hasPpiBadge,
      status,
      preTestQuestions,
    };

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/projects`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        clearDraft();
        toast.success(t('addProject.successMessage', { status }));
        track('project_posted', { role: 'company' });
        navigate('/company-dashboard');
      } else {
        const data = await response.json();
        setErrorMessage(data.error || t('addProject.deployFailed'));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(t('addProject.networkFailure'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center py-12 px-4 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-ink-100">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-ink-800">
              {t('addProject.pageTitle')}
            </h1>
            <p className="text-xs text-ink-400 mt-0.5">
              {t('addProject.wizardStepSubtitle', { step })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              // Draft is autosaved, so exiting is safe — tell the user that
              // instead of letting them fear losing the form.
              if (title || description || skillsInput) {
                toast.success(t('addProject.draftSavedOnExit'));
              }
              navigate('/company-dashboard');
            }}
            className="w-full sm:w-auto text-center text-xs font-bold text-ink-500 hover:text-marigold-500 bg-ink-100 px-3.5 py-2 rounded-xl transition"
          >
            ← {t('addProject.exitWizard')}
          </button>
        </div>

        {draftRestored && (
          <div className="flex items-center justify-between gap-3 p-3 mb-4 bg-marigold-50 border border-marigold-200 rounded-xl text-xs">
            <span className="font-semibold text-marigold-800">
              📝 {t('addProject.draftRestored')}
            </span>
            <button
              type="button"
              onClick={() => {
                clearDraft();
                window.location.reload();
              }}
              className="shrink-0 font-bold text-marigold-700 hover:text-marigold-900 underline"
            >
              {t('addProject.startFresh')}
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl text-xs mb-4">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Wizard Progress Indicator */}
        <div className="flex items-center gap-1.5 mb-8">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <div
              key={num}
              className={`h-2 flex-grow rounded-full transition-all duration-300 ${
                num <= step ? 'bg-marigold-500' : 'bg-ink-100'
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Core Details */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-black text-ink-800 uppercase tracking-wider">
                {t('addProject.step1Title')}
              </h3>

              <div>
                <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">
                  {t('addProject.projectTitleLabel')}
                </label>
                <input
                  type="text"
                  placeholder={t('addProject.projectTitlePlaceholder')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-ink-50 border p-3.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-marigold-400 focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">
                  {t('addProject.descriptionLabel')}
                </label>
                <textarea
                  rows="4"
                  placeholder={t('addProject.descriptionPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-ink-50 border p-3.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-marigold-400 focus:bg-white transition resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">
                  {t('addProject.skillsLabel')}
                </label>
                <input
                  type="text"
                  placeholder={t('addProject.skillsPlaceholder')}
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="w-full bg-ink-50 border p-3.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-marigold-400 focus:bg-white transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">
                    {t('addProject.complexityLabel')}
                  </label>
                  <select
                    value={complexity}
                    onChange={(e) => setComplexity(e.target.value)}
                    className="w-full bg-ink-50 border p-3.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-marigold-400 bg-white"
                  >
                    <option value="Beginner">
                      {t('addProject.complexityBeginner')}
                    </option>
                    <option value="Intermediate">
                      {t('addProject.complexityIntermediate')}
                    </option>
                    <option value="Advanced">
                      {t('addProject.complexityAdvanced')}
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">
                    {t('addProject.departmentLabel')}
                  </label>
                  <input
                    type="text"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    className="w-full bg-ink-50 border p-3.5 rounded-xl text-xs outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Scheduling & Target Broadcast */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-black text-ink-800 uppercase tracking-wider">
                {t('addProject.step2Title')}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">
                    {t('addProject.durationLabel')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('addProject.durationPlaceholder')}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-ink-50 border p-3.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-marigold-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">
                    {t('addProject.deadlineLabel')}
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-ink-50 border p-3.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-marigold-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">
                  {t('addProject.capacityLabel')}
                </label>
                <input
                  type="number"
                  min="1"
                  value={studentsNeeded}
                  onChange={(e) => setStudentsNeeded(e.target.value)}
                  className="w-full bg-ink-50 border p-3.5 rounded-xl text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">
                  {t('addProject.broadcastLabel')}
                </label>
                <input
                  type="text"
                  placeholder={t('addProject.broadcastPlaceholder')}
                  value={targetUniversity}
                  onChange={(e) => setTargetUniversity(e.target.value)}
                  className="w-full bg-ink-50 border p-3.5 rounded-xl text-xs outline-none"
                />
                <p className="text-[10px] text-ink-400 mt-1">
                  {t('addProject.broadcastHint')}
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Rewards & Badges */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-black text-ink-800 uppercase tracking-wider">
                {t('addProject.step3Title')}
              </h3>

              <div>
                <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">
                  {t('addProject.stipendLabel')}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder={t('addProject.stipendPlaceholder')}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full bg-ink-50 border p-3.5 rounded-xl text-xs outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-ink-50 border rounded-xl">
                <input
                  type="checkbox"
                  id="hasPpiBadge"
                  checked={hasPpiBadge}
                  onChange={(e) => setHasPpiBadge(e.target.checked)}
                  className="w-4 h-4 accent-marigold-600 cursor-pointer"
                />
                <label
                  htmlFor="hasPpiBadge"
                  className="text-xs font-bold text-ink-700 cursor-pointer select-none"
                >
                  🚀 {t('addProject.ppiBadgeLabel')}
                </label>
              </div>
            </div>
          )}

          {/* STEP 4: Prerequisites & NDA */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-black text-ink-800 uppercase tracking-wider">
                {t('addProject.step4Title')}
              </h3>

              <div>
                <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">
                  {t('addProject.minScoreLabel')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  placeholder={t('addProject.minScorePlaceholder')}
                  value={minReadinessScore}
                  onChange={(e) => setMinReadinessScore(e.target.value)}
                  className="w-full bg-ink-50 border p-3.5 rounded-xl text-xs outline-none"
                />
                <p className="text-[10px] text-ink-400 mt-1">
                  {t('addProject.minScoreHint')}
                </p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-ink-50 border rounded-xl">
                <input
                  type="checkbox"
                  id="isNdaRequired"
                  checked={isNdaRequired}
                  onChange={(e) => setIsNdaRequired(e.target.checked)}
                  className="w-4 h-4 accent-marigold-600 cursor-pointer"
                />
                <label
                  htmlFor="isNdaRequired"
                  className="text-xs font-bold text-ink-700 cursor-pointer select-none"
                >
                  🔒 {t('addProject.ndaLabel')}
                </label>
              </div>
            </div>
          )}

          {/* STEP 5: MCQ Pre-tests Quiz */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-ink-800 uppercase tracking-wider">
                  {t('addProject.step5Title')}
                </h3>
                <span className="text-[9px] bg-ink-100 text-ink-500 font-extrabold px-2 py-0.5 rounded border">
                  {t('addProject.optional')}
                </span>
              </div>
              <p className="text-[10px] text-ink-400 -mt-2">
                {t('addProject.mcqHint')}
              </p>

              <div className="border p-4 rounded-xl bg-ink-50 space-y-3">
                <p className="text-xs font-bold text-marigold-700">
                  {t('addProject.question1')}
                </p>
                <input
                  type="text"
                  placeholder={t('addProject.questionPlaceholder')}
                  value={q1Text}
                  onChange={(e) => setQ1Text(e.target.value)}
                  className="w-full bg-white border p-2.5 rounded-xl text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder={t('addProject.optionA')}
                    value={q1OptA}
                    onChange={(e) => setQ1OptA(e.target.value)}
                    className="bg-white border p-2 rounded-xl text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder={t('addProject.optionB')}
                    value={q1OptB}
                    onChange={(e) => setQ1OptB(e.target.value)}
                    className="bg-white border p-2 rounded-xl text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder={t('addProject.optionC')}
                    value={q1OptC}
                    onChange={(e) => setQ1OptC(e.target.value)}
                    className="bg-white border p-2 rounded-xl text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder={t('addProject.optionD')}
                    value={q1OptD}
                    onChange={(e) => setQ1OptD(e.target.value)}
                    className="bg-white border p-2 rounded-xl text-[11px]"
                  />
                </div>
                <input
                  type="text"
                  placeholder={t('addProject.correctOptionPlaceholder')}
                  value={q1Correct}
                  onChange={(e) => setQ1Correct(e.target.value)}
                  className="w-full bg-white border p-2 rounded-xl text-xs"
                />
              </div>

              <div className="border p-4 rounded-xl bg-ink-50 space-y-3">
                <p className="text-xs font-bold text-marigold-700">
                  {t('addProject.question2')}
                </p>
                <input
                  type="text"
                  placeholder={t('addProject.questionPlaceholder')}
                  value={q2Text}
                  onChange={(e) => setQ2Text(e.target.value)}
                  className="w-full bg-white border p-2.5 rounded-xl text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder={t('addProject.optionA')}
                    value={q2OptA}
                    onChange={(e) => setQ2OptA(e.target.value)}
                    className="bg-white border p-2 rounded-xl text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder={t('addProject.optionB')}
                    value={q2OptB}
                    onChange={(e) => setQ2OptB(e.target.value)}
                    className="bg-white border p-2 rounded-xl text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder={t('addProject.optionC')}
                    value={q2OptC}
                    onChange={(e) => setQ2OptC(e.target.value)}
                    className="bg-white border p-2 rounded-xl text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder={t('addProject.optionD')}
                    value={q2OptD}
                    onChange={(e) => setQ2OptD(e.target.value)}
                    className="bg-white border p-2 rounded-xl text-[11px]"
                  />
                </div>
                <input
                  type="text"
                  placeholder={t('addProject.correctOptionPlaceholder')}
                  value={q2Correct}
                  onChange={(e) => setQ2Correct(e.target.value)}
                  className="w-full bg-white border p-2 rounded-xl text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 6: Confirm & Deploy */}
          {step === 6 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-black text-ink-800 uppercase tracking-wider">
                {t('addProject.step6Title')}
              </h3>

              <div className="border border-marigold-100 bg-marigold-50/20 p-5 rounded-xl space-y-3 text-xs">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-extrabold text-ink-800 text-sm">
                    {title || t('addProject.untitledProject')}
                  </span>
                  <span className="font-black text-marigold-700 font-mono">
                    ₹{budget || 0}
                  </span>
                </div>
                <p className="text-ink-500 leading-relaxed">
                  {description || t('addProject.noDescription')}
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-ink-600 font-semibold pt-1">
                  <p>
                    🔹 {t('addProject.complexityReview')}: {complexity}
                  </p>
                  <p>
                    🔹 {t('addProject.departmentReview')}: {departmentName}
                  </p>
                  <p>
                    🔹 {t('addProject.broadcastReview')}:{' '}
                    {targetUniversity || t('addProject.publicAll')}
                  </p>
                  <p>
                    🔹 {t('addProject.minScoreReview')}: {minReadinessScore}{' '}
                    {t('addProject.scoreLabel')}
                  </p>
                  <p>
                    🔹 {t('addProject.requireNdaReview')}:{' '}
                    {isNdaRequired ? t('addProject.yes') : t('addProject.no')}
                  </p>
                  <p>
                    🔹 {t('addProject.ppiBadgeReview')}:{' '}
                    {hasPpiBadge ? t('addProject.yes') : t('addProject.no')}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-ink-400 uppercase mb-1">
                  {t('addProject.publishingMode')}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-ink-50 border p-3.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-marigold-400 bg-white"
                >
                  <option value="Published">
                    {t('addProject.publishLive')}
                  </option>
                  <option value="Draft">{t('addProject.saveDraft')}</option>
                </select>
              </div>
            </div>
          )}

          {/* Actions button footer container */}
          <div className="flex justify-between items-center pt-4 border-t">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-5 py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-600 rounded-xl text-xs font-bold transition"
              >
                ← {t('addProject.previous')}
              </button>
            ) : (
              <div />
            )}

            {step < 6 ? (
              <button
                type="button"
                onClick={handleNextStep}
                style={{ background: '#F5A623', color: '#1B2333' }}
                className="px-5 py-2.5 rounded-xl text-xs font-black transition shadow"
              >
                {t('addProject.nextStep')} →
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gradient-to-r from-paper to-marigold-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg hover:opacity-95"
              >
                {submitting
                  ? t('addProject.deploying')
                  : t('addProject.confirmSave', { status })}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
