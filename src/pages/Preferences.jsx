// eslint-disable-next-line no-unused-vars
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config';
import { fetchWithAuth } from '../services/apiClient';
import { trackDailyTask } from '../utils/dailyTasks';
import { useToast } from '../components/Toast';

export default function Preferences() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // User preferences state
  const [preferences, setPreferences] = useState(() => {
    const savedUser = localStorage.getItem('user');
    const base = {
      name: '',
      bio: '',
      skills: [],
      experience: 'beginner',
      interests: [],
      githubUrl: '',
      linkedinUrl: '',
      portfolioUrl: '',
      avatarUrl: '',
    };
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      return {
        ...base,
        name: parsedUser.fullName || '',
        skills: parsedUser.targetSkills
          ? parsedUser.targetSkills.split(',').map((s) => s.trim())
          : [],
        githubUrl: parsedUser.githubUrl || '',
        linkedinUrl: parsedUser.linkedinUrl || '',
        portfolioUrl: parsedUser.portfolioUrl || '',
        avatarUrl: parsedUser.avatarUrl || '',
      };
    }
    return base;
  });

  const skillsList = [
    'React',
    'Node.js',
    'Python',
    'Java',
    'C/C++',
    'UI/UX',
    'Content Writing',
    'Video Editing',
    'Marketing',
    'Data Entry',
    'Cyber Security',
    'Cloud Computing',
    'DevOps',
    'Blockchain',
    'Graphic Design',
    'SEO',
    'Database Management',
    'Flutter',
    'Machine Learning',
  ];
  const interestsList = [
    'Web Development',
    'Mobile Apps',
    'AI/ML',
    'Design',
    'Writing',
    'Business',
    'Teaching',
    'Cyber Security',
    'Data Science',
    'IoT',
    'Game Development',
    'Open Source',
    'Research',
    'Robotics',
    'Finance & Fintech',
  ];

  const [customSkill, setCustomSkill] = useState('');
  const [customInterest, setCustomInterest] = useState('');

  const handleAddCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !preferences.skills.includes(trimmed)) {
      setPreferences({
        ...preferences,
        skills: [...preferences.skills, trimmed],
      });
    }
    setCustomSkill('');
  };

  const handleAddCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (trimmed && !preferences.interests.includes(trimmed)) {
      setPreferences({
        ...preferences,
        interests: [...preferences.interests, trimmed],
      });
    }
    setCustomInterest('');
  };

  const handleSkillToggle = (skill) => {
    if (preferences.skills.includes(skill)) {
      setPreferences({
        ...preferences,
        skills: preferences.skills.filter((s) => s !== skill),
      });
    } else {
      setPreferences({
        ...preferences,
        skills: [...preferences.skills, skill],
      });
    }
  };

  const handleInterestToggle = (interest) => {
    if (preferences.interests.includes(interest)) {
      setPreferences({
        ...preferences,
        interests: preferences.interests.filter((i) => i !== interest),
      });
    } else {
      setPreferences({
        ...preferences,
        interests: [...preferences.interests, interest],
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setErrorMessage('');

    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      setErrorMessage(t('preferences.auth_missing_error'));
      return;
    }

    const parsedUser = JSON.parse(savedUser);

    try {
      setIsSaving(true);
      // Save profile preferences using student update API
      const profileResponse = await fetchWithAuth(
        `${API_BASE_URL}/api/profile/student/${parsedUser.email}`,
        {
          credentials: 'include',
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: preferences.name || parsedUser.fullName,
            collegeName: parsedUser.collegeName,
            enrollmentNumber: parsedUser.enrollmentNumber,
            mobile: parsedUser.mobile,
            targetSkills: preferences.skills.join(','),
            projectType:
              preferences.experience === 'beginner'
                ? 'Micro Tasks'
                : 'Freelance',
            githubUrl: preferences.githubUrl,
            linkedinUrl: preferences.linkedinUrl,
            portfolioUrl: preferences.portfolioUrl,
            avatarUrl: preferences.avatarUrl,
            bio: preferences.bio,
            interests: preferences.interests,
          }),
        }
      );

      if (!profileResponse.ok) {
        const errData = await profileResponse.json();
        setErrorMessage(errData.error || t('preferences.update_profile_error'));
        return;
      }

      // 🚀 🆕 LOCK ONBOARDING FLAG MATRIX: Flip hasCompletedProfile to true in MongoDB
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/auth/complete-profile`,
        {
          credentials: 'include',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: parsedUser.email }),
        }
      );

      if (response.ok) {
        // Update local memory cache states cleanly
        parsedUser.fullName = preferences.name || parsedUser.fullName;
        parsedUser.hasCompletedProfile = true;
        parsedUser.targetSkills = preferences.skills.join(',');
        parsedUser.githubUrl = preferences.githubUrl;
        parsedUser.linkedinUrl = preferences.linkedinUrl;
        parsedUser.portfolioUrl = preferences.portfolioUrl;
        parsedUser.avatarUrl = preferences.avatarUrl;
        parsedUser.bio = preferences.bio;
        parsedUser.interests = preferences.interests;
        localStorage.setItem('user', JSON.stringify(parsedUser));
        trackDailyTask('improve'); // daily checklist: "sharpen your profile"
        toast.success(t('preferences.saved', 'Preferences saved!'));
        console.log('User Preferences Locked:', preferences);
        navigate('/dashboard'); // Sends student to the marketplace grid containing live company tasks
      } else {
        const data = await response.json();
        setErrorMessage(data.error || t('preferences.update_config_error'));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(t('preferences.server_error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ink-800">
            {t('preferences.title')}
          </h1>
          <p className="text-ink-500 mt-2">{t('preferences.subtitle')}</p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm p-6 md:p-8"
        >
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl text-xs mb-4">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-ink-700 mb-1">
              {t('preferences.name_label')}
            </label>
            <input
              type="text"
              value={preferences.name}
              onChange={(e) =>
                setPreferences({ ...preferences, name: e.target.value })
              }
              placeholder={t('preferences.name_placeholder')}
              className="w-full px-4 py-2 border border-ink-300 bg-transparent rounded-lg focus:ring-2 focus:ring-marigold-500 outline-none"
              required
            />
          </div>

          {/* Showcase Portfolio Links */}
          <div className="mb-6 bg-ink-50 p-5 rounded-xl border border-ink-100 space-y-4">
            <h3 className="text-sm font-bold text-ink-800 flex items-center gap-1.5">
              <span>🔗</span> {t('preferences.portfolio_links_title')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1">
                  {t('preferences.github_label')}
                </label>
                <input
                  type="url"
                  value={preferences.githubUrl}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      githubUrl: e.target.value,
                    })
                  }
                  placeholder="https://github.com/username"
                  className="w-full px-3 py-2 text-xs border border-ink-300 bg-transparent rounded-lg focus:ring-2 focus:ring-marigold-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1">
                  {t('preferences.linkedin_label')}
                </label>
                <input
                  type="url"
                  value={preferences.linkedinUrl}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      linkedinUrl: e.target.value,
                    })
                  }
                  placeholder="https://linkedin.com/in/amit-kumar"
                  className="w-full px-3 py-2 text-xs border border-ink-300 bg-transparent rounded-lg focus:ring-2 focus:ring-marigold-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1">
                  {t('preferences.portfolio_label')}
                </label>
                <input
                  type="url"
                  value={preferences.portfolioUrl}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      portfolioUrl: e.target.value,
                    })
                  }
                  placeholder="https://username.dev"
                  className="w-full px-3 py-2 text-xs border border-ink-300 bg-transparent rounded-lg focus:ring-2 focus:ring-marigold-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1">
                  {t('preferences.avatar_label')}
                </label>
                <input
                  type="url"
                  value={preferences.avatarUrl}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      avatarUrl: e.target.value,
                    })
                  }
                  placeholder="https://workmitra.me/assets/default-avatar.jpg"
                  className="w-full px-3 py-2 text-xs border border-ink-300 bg-transparent rounded-lg focus:ring-2 focus:ring-marigold-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bio / About */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-ink-700 mb-1">
              {t('preferences.bio_label')}
            </label>
            <textarea
              value={preferences.bio}
              onChange={(e) =>
                setPreferences({ ...preferences, bio: e.target.value })
              }
              placeholder={t('preferences.bio_placeholder')}
              rows="3"
              className="w-full px-4 py-2 border border-ink-300 bg-transparent rounded-lg focus:ring-2 focus:ring-marigold-500 outline-none"
            />
          </div>

          {/* Experience Level */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-ink-700 mb-2">
              {t('preferences.experience_label')}
            </label>
            <div className="flex flex-wrap gap-4 sm:gap-6">
              {['beginner', 'intermediate', 'expert'].map((level) => (
                <label
                  key={level}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    value={level}
                    checked={preferences.experience === level}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        experience: e.target.value,
                      })
                    }
                    className="w-4 h-4 text-marigold-500"
                  />
                  <span className="capitalize text-sm text-ink-700 font-medium">
                    {t(`preferences.experience_${level}`)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-ink-700 mb-2">
              {t('preferences.skills_label')}
            </label>
            <div className="flex flex-wrap gap-2">
              {skillsList.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleSkillToggle(skill)}
                  className={`px-3 py-1 rounded-full text-sm transition font-medium ${
                    preferences.skills.includes(skill)
                      ? 'bg-marigold-500 text-white shadow-sm'
                      : 'bg-ink-200 text-ink-700 hover:bg-ink-300'
                  }`}
                >
                  {skill}
                </button>
              ))}
              {/* Custom skills (not in the preset list) rendered as dismissible chips */}
              {preferences.skills
                .filter((s) => !skillsList.includes(s))
                .map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-marigold-500 text-white shadow-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleSkillToggle(skill)}
                      className="ml-0.5 hover:text-marigold-200 font-bold leading-none"
                      aria-label={`Remove ${skill}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
            </div>
            {/* Custom skill input */}
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  (e.preventDefault(), handleAddCustomSkill())
                }
                placeholder={t(
                  'preferences.customSkillPlaceholder',
                  'Type your own skill...'
                )}
                className="flex-1 bg-ink-50 border border-ink-200 text-sm px-3 py-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-marigold-400 text-ink-700 placeholder-ink-400"
              />
              <button
                type="button"
                onClick={handleAddCustomSkill}
                disabled={!customSkill.trim()}
                className="px-4 py-1.5 bg-marigold-500 hover:bg-marigold-600 disabled:bg-ink-300 text-white text-sm font-bold rounded-full transition shadow-sm disabled:shadow-none"
              >
                + {t('preferences.addBtn', 'Add')}
              </button>
            </div>
          </div>

          {/* Interests */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-ink-700 mb-2">
              {t('preferences.interests_label')}
            </label>
            <div className="flex flex-wrap gap-2">
              {interestsList.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-3 py-1 rounded-full text-sm transition font-medium ${
                    preferences.interests.includes(interest)
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'bg-ink-200 text-ink-700 hover:bg-ink-300'
                  }`}
                >
                  {interest}
                </button>
              ))}
              {/* Custom interests (not in the preset list) rendered as dismissible chips */}
              {preferences.interests
                .filter((i) => !interestsList.includes(i))
                .map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-600 text-white shadow-sm"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => handleInterestToggle(interest)}
                      className="ml-0.5 hover:text-green-200 font-bold leading-none"
                      aria-label={`Remove ${interest}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
            </div>
            {/* Custom interest input */}
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  (e.preventDefault(), handleAddCustomInterest())
                }
                placeholder={t(
                  'preferences.customInterestPlaceholder',
                  'Type your own interest...'
                )}
                className="flex-1 bg-ink-50 border border-ink-200 text-sm px-3 py-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-green-400 text-ink-700 placeholder-ink-400"
              />
              <button
                type="button"
                onClick={handleAddCustomInterest}
                disabled={!customInterest.trim()}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-ink-300 text-white text-sm font-bold rounded-full transition shadow-sm disabled:shadow-none"
              >
                + {t('preferences.addBtn', 'Add')}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSaving}
            className={`w-full py-3 rounded-lg transition font-medium shadow-md active:scale-[0.99] ${
              isSaving
                ? 'bg-ink-300 text-ink-500 cursor-not-allowed'
                : 'bg-marigold-500 text-white hover:bg-marigold-600'
            }`}
          >
            {isSaving ? t('preferences.saving', 'Saving…') : `${t('preferences.continue_button')} →`}
          </button>
        </form>

        {/* Quote */}
        <div className="text-center mt-8 text-ink-500 text-sm italic">
          "{t('preferences.quote')}" - {t('preferences.quote_author')}
        </div>
      </div>
    </div>
  );
}
