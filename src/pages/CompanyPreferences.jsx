import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { useTranslation } from 'react-i18next';
import { fetchWithAuth } from '../services/apiClient';

export default function CompanyPreferences() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Prefetch existing company profile so returning users see their saved data
  useEffect(() => {
    fetchWithAuth(`${API_BASE_URL}/api/profile/company`, { credentials: 'include' })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;
        if (data.companyName) setCompanyName(data.companyName);
        if (data.website) setWebsite(data.website);
        if (data.industry) setIndustry(data.industry);
        if (data.companySize) setCompanySize(data.companySize);
        if (data.location) setLocation(data.location);
        if (Array.isArray(data.requiredRoles)) setRequiredRoles(data.requiredRoles);
        if (Array.isArray(data.requiredSkills)) setRequiredSkills(data.requiredSkills);
        if (data.projectTitle) setProjectTitle(data.projectTitle);
        if (data.projectDescription) setProjectDescription(data.projectDescription);
        if (data.projectDuration) setProjectDuration(data.projectDuration);
        if (data.hiringType) setHiringType(data.hiringType);
        if (data.budgetMin != null) setBudgetMin(String(data.budgetMin));
        if (data.budgetMax != null) setBudgetMax(String(data.budgetMax));
        if (data.workMode) setWorkMode(data.workMode);
        if (data.studentsRequired) setStudentsRequired(String(data.studentsRequired));
      })
      .catch(() => {}); // non-fatal — form still usable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Section 1: Company Information
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [location, setLocation] = useState('');

  // Section 2: Hiring Requirements (Checkboxes)
  const [requiredRoles, setRequiredRoles] = useState([]);
  const rolesOptions = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'AI/ML Engineer',
    'Data Analyst',
    'UI/UX Designer',
    'Content Writer',
    'Marketing',
    'Video Editor',
  ];

  // Section 3: Skills Required (Multi-select)
  const [requiredSkills, setRequiredSkills] = useState([]);
  const skillsOptions = [
    'React',
    'Node.js',
    'Python',
    'Java',
    'C++',
    'SQL',
    'Machine Learning',
    'TensorFlow',
    'Figma',
    'Canva',
  ];

  // Section 4: Project Details
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectDuration, setProjectDuration] = useState('');

  // Section 5: Hiring Type (Radio)
  const [hiringType, setHiringType] = useState('Internship');

  // Section 6: Budget
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');

  // Section 7: Work Mode (Radio)
  const [workMode, setWorkMode] = useState('Remote');

  // Section 8: Number of Students Required (Radio)
  const [studentsRequired, setStudentsRequired] = useState('1');

  const handleCheckboxToggle = (role) => {
    setRequiredRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSkillToggle = (skill) => {
    setRequiredSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setErrorMessage('');

    const payload = {
      companyName,
      website,
      industry,
      companySize,
      location,
      requiredRoles,
      requiredSkills,
      projectTitle,
      projectDescription,
      projectDuration,
      hiringType,
      budgetMin: Number(budgetMin),
      budgetMax: Number(budgetMax),
      workMode,
      studentsRequired,
    };

    try {
      setIsSaving(true);
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/profile/company`,
        {
          credentials: 'include',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // 🚀 🆕 NEW FEATURE FEATURE: Lock the onboarding flag so the form never repeats
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);

          // Call your new backend endpoint to set hasCompletedProfile to true
          await fetchWithAuth(`${API_BASE_URL}/api/auth/complete-profile`, {
            credentials: 'include',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: parsedUser.email }),
          });

          // Update local cache state so the app knows the profile is done
          parsedUser.hasCompletedProfile = true;
          localStorage.setItem('user', JSON.stringify(parsedUser));
        }

        toast.success(t('companyPreferences.successSave'));
        navigate('/company-dashboard');
      } else {
        setErrorMessage(data.error || t('companyPreferences.errorSave'));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(t('companyPreferences.errorServer'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-transparent flex flex-col items-center py-12 px-4 font-sans">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-8 border border-ink-100 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">
            {t('companyPreferences.title')}
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            {t('companyPreferences.subtitle')}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-100 border border-red-200 text-red-700 font-bold rounded-xl text-xs">
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-ink-dark border-b pb-2">
              {t('companyPreferences.section1Title')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder={t('companyPreferences.companyNamePlaceholder')}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="bg-ink-50 border p-3 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-[#F5A623] focus:bg-white"
                required
              />
              <input
                type="text"
                placeholder={t('companyPreferences.websitePlaceholder')}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="bg-ink-50 border p-3 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-[#F5A623] focus:bg-white"
                required
              />
              <input
                type="text"
                placeholder={t('companyPreferences.industryPlaceholder')}
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="bg-ink-50 border p-3 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-[#F5A623] focus:bg-white"
                required
              />
              <input
                type="text"
                placeholder={t('companyPreferences.companySizePlaceholder')}
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="bg-ink-50 border p-3 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-[#F5A623] focus:bg-white"
                required
              />
            </div>
            <input
              type="text"
              placeholder={t('companyPreferences.locationPlaceholder')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-ink-50 border p-3 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-[#F5A623] focus:bg-white"
              required
            />
          </div>

          {/* Section 2: Hiring Requirements */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-ink-dark border-b pb-2">
              {t('companyPreferences.section2Title')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {rolesOptions.map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-2 text-sm text-ink-700 font-medium cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={requiredRoles.includes(role)}
                    onChange={() => handleCheckboxToggle(role)}
                    className="w-4 h-4 rounded accent-purple-600"
                  />
                  {t(
                    `companyPreferences.roles.${role.replace(/[^a-zA-Z0-9]/g, '')}`
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Section 3: Skills Required */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-ink-dark border-b pb-2">
              {t('companyPreferences.section3Title')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {skillsOptions.map((skill) => {
                const active = requiredSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    className={`text-xs px-4 py-2 rounded-full border transition font-medium ${active ? 'bg-marigold-500 border-marigold-500 text-white shadow-md shadow-marigold-100' : 'bg-ink-50 border-ink-200 text-ink-600 hover:bg-ink-100'}`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Project Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-ink-dark border-b pb-2">
              {t('companyPreferences.section4Title')}
            </h3>
            <input
              type="text"
              placeholder={t('companyPreferences.projectTitlePlaceholder')}
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="bg-ink-50 border p-3 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-[#F5A623] focus:bg-white"
              required
            />
            <textarea
              rows="3"
              placeholder={t('companyPreferences.projectDescPlaceholder')}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="bg-ink-50 border p-3 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-[#F5A623] focus:bg-white resize-none"
              required
            />
            <input
              type="text"
              placeholder={t('companyPreferences.projectDurationPlaceholder')}
              value={projectDuration}
              onChange={(e) => setProjectDuration(e.target.value)}
              className="bg-ink-50 border p-3 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-[#F5A623] focus:bg-white"
              required
            />
          </div>

          {/* Section 5, 7, 8: Radio Metrics Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-ink-800">
                {t('companyPreferences.section5Title')}
              </h3>
              {[
                'Internship',
                'Part-Time',
                'Full-Time',
                'Freelance',
                'Micro Tasks',
              ].map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 text-xs text-ink-600 font-medium cursor-pointer py-0.5"
                >
                  <input
                    type="radio"
                    name="hiringType"
                    checked={hiringType === type}
                    onChange={() => setHiringType(type)}
                    className="accent-purple-600"
                  />
                  {t(
                    `companyPreferences.hiringTypeOptions.${type.replace(/[^a-zA-Z0-9]/g, '')}`
                  )}
                </label>
              ))}
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-sm text-ink-800">
                {t('companyPreferences.section7Title')}
              </h3>
              {['Remote', 'Hybrid', 'On-site'].map((mode) => (
                <label
                  key={mode}
                  className="flex items-center gap-2 text-xs text-ink-600 font-medium cursor-pointer py-0.5"
                >
                  <input
                    type="radio"
                    name="workMode"
                    checked={workMode === mode}
                    onChange={() => setWorkMode(mode)}
                    className="accent-purple-600"
                  />
                  {t(
                    `companyPreferences.workModeOptions.${mode.replace(/[^a-zA-Z0-9]/g, '')}`
                  )}
                </label>
              ))}
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-sm text-ink-800">
                {t('companyPreferences.section8Title')}
              </h3>
              {['1', '2-5', '5-10', '10+'].map((num) => (
                <label
                  key={num}
                  className="flex items-center gap-2 text-xs text-ink-600 font-medium cursor-pointer py-0.5"
                >
                  <input
                    type="radio"
                    name="studentsReq"
                    checked={studentsRequired === num}
                    onChange={() => setStudentsRequired(num)}
                    className="accent-purple-600"
                  />
                  {num}
                </label>
              ))}
            </div>
          </div>

          {/* Section 6: Budget */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-ink-dark border-b pb-2">
              {t('companyPreferences.section6Title')}
            </h3>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <input
                type="number"
                placeholder={t('companyPreferences.minBudgetPlaceholder')}
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                className="bg-ink-50 border p-3 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-[#F5A623]"
                required
              />
              <input
                type="number"
                placeholder={t('companyPreferences.maxBudgetPlaceholder')}
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                className="bg-ink-50 border p-3 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-[#F5A623]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className={`w-full font-bold text-sm uppercase py-4 rounded-xl shadow-md transition active:scale-[0.99] ${isSaving ? 'bg-ink-300 text-ink-500 cursor-not-allowed' : 'bg-gradient-to-r from-paper to-marigold-600 hover:from-paper hover:to-marigold-700 text-white'}`}
          >
            {isSaving ? t('companyPreferences.saving', 'Saving…') : t('companyPreferences.saveButton')}
          </button>
        </form>
      </div>
    </div>
  );
}
