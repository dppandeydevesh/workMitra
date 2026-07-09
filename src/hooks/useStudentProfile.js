import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config';
import { useToast } from '../components/Toast';
import { track } from '../utils/analytics';

/**
 * useStudentProfile — Custom hook to manage student profile states,
 * form data, data fetching, validation, and peer vouching.
 */
export function useStudentProfile() {
  const { email } = useParams();
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

  // Core States
  const [profileUser, setProfileUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [applications, setApplications] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable Form fields states
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [skillsInput, setSkillsInput] = useState(''); // comma separated
  const [projectType, setProjectType] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bioText, setBioText] = useState('');

  // Additional Profile states
  const [major, setMajor] = useState('');
  const [currentSemester, setCurrentSemester] = useState('');
  const [vanityUsername, setVanityUsername] = useState('');
  const [videoPitchUrl, setVideoPitchUrl] = useState('');
  const [isProfilePrivate, setIsProfilePrivate] = useState(false);
  const [extracurriculars, setExtracurriculars] = useState('');
  const [preferredTechStack, setPreferredTechStack] = useState('');
  const [availabilitySlots, setAvailabilitySlots] = useState([]);

  // Peer Vouch states
  const [showVouchModal, setShowVouchModal] = useState(false);
  const [vouchSkills, setVouchSkills] = useState('');
  const [vouchComment, setVouchComment] = useState('');
  const [vouching, setVouching] = useState(false);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(savedUser);
    fetchUserProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const url = email.includes('@')
        ? `${API_BASE_URL}/api/auth/user/${email}`
        : `${API_BASE_URL}/api/auth/student/vanity/${email}`;

      const res = await fetch(url, { credentials: 'include', headers: {} });
      const data = await res.json();
      if (res.ok) {
        setProfileUser(data);
        // Pre-populate form fields
        setFullName(data.fullName || '');
        setMobile(data.mobile || '');
        setCollegeName(data.collegeName || '');
        setEnrollmentNumber(data.enrollmentNumber || '');
        setSkillsInput(data.targetSkills || '');
        setProjectType(data.projectType || 'Remote Track');
        setResumeUrl(data.resumeUrl || '');
        setGithubUrl(data.githubUrl || '');
        setLinkedinUrl(data.linkedinUrl || '');
        setPortfolioUrl(data.portfolioUrl || '');
        setAvatarUrl(data.avatarUrl || '');
        setBioText(data.bio || '');
        setMajor(data.major || '');
        setCurrentSemester(data.currentSemester || '');
        setVanityUsername(data.vanityUsername || '');
        setVideoPitchUrl(data.videoPitchUrl || '');
        setIsProfilePrivate(data.isProfilePrivate || false);
        setExtracurriculars(
          data.extracurriculars ? data.extracurriculars.join(',') : ''
        );
        setPreferredTechStack(
          data.preferredTechStack ? data.preferredTechStack.join(',') : ''
        );
        setAvailabilitySlots(data.availabilitySlots || []);
      } else {
        setErrorMessage(
          data.error || t('studentProfile.failedToLoadProfile')
        );
      }

      // Load student applications history for ratings & reviews
      const appsRes = await fetch(
        `${API_BASE_URL}/api/applications/student-details/${email}`,
        { credentials: 'include', headers: {} }
      );
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApplications(appsData);
      }
    } catch (err) { console.error(err);
      setErrorMessage(t('studentProfile.errorConnectingToGateway'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');

    const payload = {
      fullName,
      mobile,
      collegeName,
      enrollmentNumber,
      targetSkills: skillsInput,
      projectType,
      resumeUrl,
      githubUrl,
      linkedinUrl,
      portfolioUrl,
      avatarUrl,
      bio: bioText,
      major,
      currentSemester,
      vanityUsername: vanityUsername.trim() || null,
      videoPitchUrl,
      isProfilePrivate,
      extracurriculars: extracurriculars
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      preferredTechStack: preferredTechStack
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      availabilitySlots,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/profile/student/${email}`, {
        credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t('studentProfile.portfolioUpdated'));
        track('profile_completed', { role: 'student', hasCV: !!resumeUrl });
        setProfileUser(data.user);
        setIsEditing(false);
        // If this is the logged-in student, update their cached context in localStorage
        if (currentUser && currentUser.email === email) {
          const updatedCachedUser = {
            ...currentUser,
            fullName: data.user.fullName,
            collegeName: data.user.collegeName,
            enrollmentNumber: data.user.enrollmentNumber,
            resumeUrl: data.user.resumeUrl,
            resumeText: data.user.resumeText,
            cvReviewReport: data.user.cvReviewReport,
            githubUrl: data.user.githubUrl,
            linkedinUrl: data.user.linkedinUrl,
            portfolioUrl: data.user.portfolioUrl,
            avatarUrl: data.user.avatarUrl,
            hasCompletedProfile: true,
          };
          localStorage.setItem('user', JSON.stringify(updatedCachedUser));
          setCurrentUser(updatedCachedUser);
        }
      } else {
        setErrorMessage(
          data.error || t('studentProfile.failedToUpdateProfile')
        );
      }
    } catch (err) { console.error(err);
      setErrorMessage(t('studentProfile.errorCommunicatingWithServer'));
    } finally {
      setSaving(false);
    }
  };

  const handleVouchSubmit = async (e) => {
    e.preventDefault();
    if (!vouchSkills || !vouchComment) {
      toast.error(t('studentProfile.fillVouchForm'));
      return;
    }
    setVouching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile/vouch`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentEmail: email,
          skills: vouchSkills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          comment: vouchComment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t('studentProfile.vouchRecorded'));
        setShowVouchModal(false);
        fetchUserProfile();
      } else {
        toast.error(data.error || t('studentProfile.failedToSubmitVouch'));
      }
    } catch (err) { console.error(err);
      toast.error(t('studentProfile.connectionErrorVouch'));
    } finally {
      setVouching(false);
    }
  };

  const isOwner = useMemo(() => {
    return (
      currentUser &&
      (currentUser.email === email ||
        (currentUser.vanityUsername && currentUser.vanityUsername === email) ||
        (profileUser && profileUser.email === currentUser.email))
    );
  }, [currentUser, email, profileUser]);

  const completedTasks = useMemo(
    () => applications.filter((a) => a.status === 'Completed'),
    [applications]
  );
  const ratingsList = useMemo(
    () =>
      completedTasks.filter(
        (a) => typeof a.rating === 'number' && a.rating > 0
      ),
    [completedTasks]
  );
  const avgRating = useMemo(
    () =>
      ratingsList.length > 0
        ? (
            ratingsList.reduce((sum, a) => sum + a.rating, 0) /
            ratingsList.length
          ).toFixed(1)
        : null,
    [ratingsList]
  );

  return {
    email,
    profileUser,
    setProfileUser,
    currentUser,
    setCurrentUser,
    loading,
    errorMessage,
    applications,
    isEditing,
    setIsEditing,
    saving,

    // Form fields
    fullName, setFullName,
    mobile, setMobile,
    collegeName, setCollegeName,
    enrollmentNumber, setEnrollmentNumber,
    skillsInput, setSkillsInput,
    projectType, setProjectType,
    resumeUrl, setResumeUrl,
    githubUrl, setGithubUrl,
    linkedinUrl, setLinkedinUrl,
    portfolioUrl, setPortfolioUrl,
    avatarUrl, setAvatarUrl,
    bioText, setBioText,
    major, setMajor,
    currentSemester, setCurrentSemester,
    vanityUsername, setVanityUsername,
    videoPitchUrl, setVideoPitchUrl,
    isProfilePrivate, setIsProfilePrivate,
    extracurriculars, setExtracurriculars,
    preferredTechStack, setPreferredTechStack,
    availabilitySlots, setAvailabilitySlots,

    // Vouch modal
    showVouchModal, setShowVouchModal,
    vouchSkills, setVouchSkills,
    vouchComment, setVouchComment,
    vouching,

    // Methods
    fetchUserProfile,
    handleSaveProfile,
    handleVouchSubmit,

    // Derived
    isOwner,
    completedTasks,
    ratingsList,
    avgRating,
  };
}
