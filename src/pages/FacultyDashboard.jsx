import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config';
import { useToast } from '../components/Toast';
// eslint-disable-next-line no-unused-vars
import { useWebSocket } from '../components/WebSocketContext';
import './FacultyDashboard.css';
import { Briefcase, Users } from 'lucide-react';
import { fetchWithAuth } from '../services/apiClient';
export default function FacultyDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, my-projects, new-project, applicants

  const [projects, setProjects] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills: '',
    budget: '',
  });
  const [posting, setPosting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [profileData, setProfileData] = useState({
    fullName: '',
    collegeName: '',
    departmentName: '',
    mobile: '',
    bio: '',
    website: '',
    linkedinUrl: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (!savedUser || savedUser.userRole !== 'faculty') {
      navigate('/login');
      return;
    }
    setUser(savedUser);
    setProfileData({
      fullName: savedUser.fullName || '',
      collegeName: savedUser.collegeName || '',
      departmentName: savedUser.departmentName || '',
      mobile: savedUser.mobile || '',
      bio: savedUser.bio || '',
      website: savedUser.website || '',
      linkedinUrl: savedUser.linkedinUrl || '',
    });
    fetchFacultyProjects(savedUser.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFacultyProjects = async (email) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL}/api/projects/company/${email}`,
        {
          credentials: 'include',
          headers: {},
        }
      );
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      } else {
        setErrorMessage('Failed to load academic projects.');
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('Network error while fetching projects.');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicantsForProject = async (projectId) => {
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL}/api/projects/${projectId}/applicants`,
        { credentials: 'include', headers: {} }
      );
      if (res.ok) {
        const data = await res.json();
        return data;
      }
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const handleViewApplicants = async (projectId) => {
    setLoading(true);
    const data = await fetchApplicantsForProject(projectId);
    setApplicants(data);
    setActiveTab('applicants');
    setLoading(false);
  };

  const handleArchiveProject = async (projectId) => {
    if (
      !window.confirm(
        'Are you sure you want to archive this academic project? This will hide it from the marketplace.'
      )
    )
      return;
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL}/api/projects/archive/${projectId}`,
        {
          method: 'PUT',
        }
      );
      if (res.ok) {
        toast.success('Project archived successfully');
        fetchFacultyProjects(user.email);
      } else {
        toast.error('Failed to archive project');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (
      !window.confirm(
        'Are you sure you want to permanently delete this academic project? This cannot be undone.'
      )
    )
      return;
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL}/api/projects/${projectId}`,
        {
          method: 'DELETE',
        }
      );
      if (res.ok) {
        toast.success('Project deleted successfully');
        fetchFacultyProjects(user.email);
      } else {
        toast.error('Failed to delete project');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL}/api/auth/faculty-profile`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData),
        }
      );
      if (res.ok) {
        const result = await res.json();
        toast.success('Profile updated successfully!');
        setUser(result.user);
        localStorage.setItem('user', JSON.stringify(result.user));
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Failed to update profile.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error while saving profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePostProject = async (e) => {
    e.preventDefault();
    setPosting(true);

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          requiredSkills: formData.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          budget: formData.budget,
          workType: 'Academic', // Specific marker for faculty projects
        }),
      });

      if (res.ok) {
        toast.success('Academic Project posted successfully!');
        setFormData({ title: '', description: '', skills: '', budget: '' });
        setActiveTab('my-projects');
        fetchFacultyProjects(user.email);
      } else {
        const errorData = await res.json();
        toast.error(
          `Error: ${errorData.error || errorData.message || 'Failed to post'}`
        );
      }
    } catch (error) {
      console.error(error);
      toast.error('Error posting academic project. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const handleApplicationStatus = async (appId, newStatus) => {
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL}/api/applications/${appId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (res.ok) {
        toast.success(`Application marked as ${newStatus}`);
        setApplicants((prev) =>
          prev.map((app) =>
            app.applicationId === appId ? { ...app, status: newStatus } : app
          )
        );
      } else {
        toast.error('Failed to update status');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {errorMessage ? (
        <div className="wm-panel p-8 text-center space-y-4">
          <span className="text-4xl block">⚠️</span>
          <p className="text-red-700 font-bold">{errorMessage}</p>
          <button
            onClick={() => fetchFacultyProjects(user.email)}
            style={{ background: '#F5A623', color: '#1B2333' }}
            className="px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Header Profile Section */}
          <div className="wm-panel p-8 relative overflow-hidden flex flex-col md:flex-row items-center gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] (255,255,255,0.02)]">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-marigold/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-24 h-24 rounded-xl bg-[#F5A623] shadow-sm flex items-center justify-center text-4xl font-bold text-white shrink-0 relative z-10">
              {user.companyName
                ? user.companyName.charAt(0).toUpperCase()
                : user.email.charAt(0).toUpperCase()}
            </div>

            <div className="text-center md:text-left relative z-10 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-marigold-light text-marigold-dark text-xs font-extrabold tracking-wide uppercase mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-marigold animate-pulse"></span>
                Professor / HOD Account
              </div>
              <h1 className="text-3xl font-black text-ink-800 mb-1">
                {user.companyName || 'Faculty Member'}
              </h1>
              <p className="text-sm font-medium text-ink-500 flex items-center justify-center md:justify-start gap-2">
                <span>✉️ {user.email}</span>
              </p>
            </div>

            <div className="relative z-10 w-full md:w-auto mt-4 md:mt-0">
              <button
                onClick={() => setActiveTab('new-project')}
                className="w-full md:w-auto px-6 py-3 bg-marigold hover:bg-marigold-mid text-ink-dark rounded-xl font-bold shadow-md transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <span>➕</span> New Academic Project
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
            {[
              {
                id: 'overview',
                label: t('facultyDashboard.overview') || 'Overview',
                icon: '📊',
              },
              {
                id: 'my-projects',
                label: t('facultyDashboard.myProjects') || 'My Projects',
                icon: '📁',
              },
              {
                id: 'new-project',
                label: t('facultyDashboard.postProject') || 'Post Project',
                icon: '📝',
              },
              {
                id: 'applicants',
                label:
                  t('facultyDashboard.reviewApplicants') || 'Review Applicants',
                icon: '👨‍🎓',
              },
              {
                id: 'profile',
                label: t('facultyDashboard.profile') || 'Profile Settings',
                icon: '👤',
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-marigold text-ink-dark shadow-md'
                    : 'bg-white text-ink-600 hover:bg-ink-50 shadow-sm border border-ink-100'
                }`}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="mt-6">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="wm-panel p-6 border-l-4 border-marigold">
                  <p className="text-xs font-black text-ink-400 uppercase tracking-wider">
                    {t('facultyDashboard.totalProjects') ||
                      'Total Academic Projects'}
                  </p>
                  <h2 className="text-4xl font-black text-ink-800 mt-2">
                    {projects.length}
                  </h2>
                </div>
                <div className="wm-panel p-6 border-l-4 border-border">
                  <p className="text-xs font-black text-ink-400 uppercase tracking-wider">
                    {t('facultyDashboard.activeOpenings') || 'Active Openings'}
                  </p>
                  <h2 className="text-4xl font-black text-ink-800 mt-2">
                    {projects.filter((p) => p.status !== 'Archived').length}
                  </h2>
                </div>
                <div className="wm-panel p-6 border-l-4 border-emerald-500">
                  <p className="text-xs font-black text-ink-400 uppercase tracking-wider">
                    {t('facultyDashboard.department') || 'Department'}
                  </p>
                  <h2 className="text-2xl font-black text-ink-800 mt-2 flex items-center h-full pb-2">
                    {user.departmentName ||
                      user.department ||
                      'Computer Science'}
                  </h2>
                </div>
              </div>
            )}

            {/* MY PROJECTS TAB */}
            {activeTab === 'my-projects' && (
              <div className="wm-panel p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-black text-ink-800">
                    {t('facultyDashboard.activeProjects') ||
                      'Active Academic Projects'}
                  </h2>
                  <button
                    onClick={() => fetchFacultyProjects(user.email)}
                    className="text-marigold font-bold text-sm hover:underline"
                  >
                    {t('facultyDashboard.refresh') || 'Refresh 🔄'}
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-12 text-ink-400 font-bold">
                    {t('facultyDashboard.loading') ||
                      'Loading your projects...'}
                  </div>
                ) : projects.length === 0 ? (
                  <div className="wm-panel p-[40px_24px] text-center max-w-md mx-auto my-6 flex flex-col items-center justify-center">
                    <div className="w-[48px] h-[48px] rounded-xl bg-[#FBE7C4] flex items-center justify-center text-[#F5A623] shadow-sm mb-4">
                      <Briefcase size={24} />
                    </div>
                    <div>
                      <h3 className="text-[16px] font-medium text-[#1B2333] mb-[6px]">
                        {t('facultyDashboard.noProjects') ||
                          'No projects posted yet'}
                      </h3>
                      <p className="text-[13px] text-[#6B7280] leading-[1.65] max-w-[260px] mx-auto">
                        {t('facultyDashboard.noProjectsDesc') ||
                          'Post research tasks or class gig deployments to invite student submissions.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <div
                        key={project._id}
                        className="border border-ink-100 rounded-xl p-5 hover:bg-ink-50 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-extrabold text-ink-800 mb-1">
                              {project.title}
                            </h3>
                            <p className="text-sm text-ink-500 max-w-2xl line-clamp-2">
                              {project.description}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                            {project.status || 'Active'}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-4 items-center justify-between border-t border-ink-100 pt-4">
                          <div className="flex flex-wrap gap-2">
                            {project.requiredSkills?.map((s, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-marigold-light text-marigold-dark text-xs font-semibold rounded"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewApplicants(project._id)}
                              className="text-sm font-bold bg-ink-800 text-white px-4 py-2 rounded-lg hover:bg-ink-700 transition"
                            >
                              {t('facultyDashboard.viewApplicants') ||
                                'View Applicants 👨‍🎓'}
                            </button>
                            {project.status !== 'Archived' && (
                              <button
                                onClick={() =>
                                  handleArchiveProject(project._id)
                                }
                                className="text-sm font-bold bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-lg hover:bg-amber-100 transition"
                              >
                                {t('facultyDashboard.archive') || 'Archive 📁'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteProject(project._id)}
                              className="text-sm font-bold bg-rose-50 text-rose-700 border border-rose-200 px-4 py-2 rounded-lg hover:bg-rose-100 transition"
                            >
                              {t('facultyDashboard.delete') || 'Delete 🗑️'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* POST PROJECT TAB */}
            {activeTab === 'new-project' && (
              <div className="wm-panel p-6 sm:p-8 max-w-3xl mx-auto">
                <h2 className="text-2xl font-black text-ink-800 mb-6">
                  {t('facultyDashboard.createProject') ||
                    'Create Academic Project'}
                </h2>
                <form onSubmit={handlePostProject} className="space-y-5">
                  <div>
                    <label className="block text-sm font-extrabold text-ink-700 mb-2">
                      {t('facultyDashboard.projectTitle') || 'Project Title'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full bg-ink-50 border border-ink-200 rounded-xl px-4 py-3 text-ink-800 focus:ring-2 focus:ring-marigold outline-none transition"
                      placeholder={
                        t('facultyDashboard.projectTitlePlaceholder') ||
                        'e.g., Deep Learning Research Assistant'
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-extrabold text-ink-700 mb-2">
                      {t('facultyDashboard.detailedDescription') ||
                        'Detailed Description'}
                    </label>
                    <textarea
                      required
                      rows="4"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-ink-50 border border-ink-200 rounded-xl px-4 py-3 text-ink-800 focus:ring-2 focus:ring-marigold outline-none transition"
                      placeholder={
                        t('facultyDashboard.descriptionPlaceholder') ||
                        'Describe the research goals and student responsibilities...'
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-extrabold text-ink-700 mb-2">
                      {t('facultyDashboard.requiredSkills') ||
                        'Required Skills (Comma separated)'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.skills}
                      onChange={(e) =>
                        setFormData({ ...formData, skills: e.target.value })
                      }
                      className="w-full bg-ink-50 border border-ink-200 rounded-xl px-4 py-3 text-ink-800 focus:ring-2 focus:ring-marigold outline-none transition"
                      placeholder={
                        t('facultyDashboard.skillsPlaceholder') ||
                        'e.g., Python, PyTorch, Data Analysis'
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-extrabold text-ink-700 mb-2">
                      {t('facultyDashboard.incentive') ||
                        'Incentive Value (Stipend ₹ or Marks)'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.budget}
                      onChange={(e) =>
                        setFormData({ ...formData, budget: e.target.value })
                      }
                      className="w-full bg-ink-50 border border-ink-200 rounded-xl px-4 py-3 text-ink-800 focus:ring-2 focus:ring-marigold outline-none transition"
                      placeholder={
                        t('facultyDashboard.incentivePlaceholder') ||
                        'e.g., 50 (marks) or 5000 (stipend ₹)'
                      }
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={posting}
                    className="w-full bg-marigold hover:bg-marigold-mid text-ink-dark font-black py-4 rounded-xl transition shadow-md"
                  >
                    {posting
                      ? t('facultyDashboard.publishing') ||
                        'Publishing to Network...'
                      : t('facultyDashboard.publishProject') ||
                        'Publish Academic Project 🚀'}
                  </button>
                </form>
              </div>
            )}

            {/* APPLICANTS TAB */}
            {activeTab === 'applicants' && (
              <div className="wm-panel p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-black text-ink-800">
                    {t('facultyDashboard.studentApplicants') ||
                      'Student Applicants'}
                  </h2>
                  <button
                    onClick={() => setActiveTab('my-projects')}
                    className="text-marigold font-bold text-sm hover:underline"
                  >
                    {t('facultyDashboard.backToProjects') ||
                      '← Back to Projects'}
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-12 text-ink-400 font-bold">
                    {t('facultyDashboard.loadingApplicants') ||
                      'Loading applicants...'}
                  </div>
                ) : applicants.length === 0 ? (
                  <div className="wm-panel p-[40px_24px] text-center max-w-md mx-auto my-6 flex flex-col items-center justify-center">
                    <div className="w-[48px] h-[48px] rounded-xl bg-[#FBE7C4] flex items-center justify-center text-[#F5A623] shadow-sm mb-4">
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="text-[16px] font-medium text-[#1B2333] mb-[6px]">
                        {t('facultyDashboard.noApplicants') ||
                          'No applicants yet'}
                      </h3>
                      <p className="text-[13px] text-[#6B7280] leading-[1.65] max-w-[260px] mx-auto">
                        {t('facultyDashboard.noApplicantsDesc') ||
                          'Students will appear here once they submit their interest or quiz results for review.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applicants.map((app) => (
                      <div
                        key={app.applicationId}
                        className="border border-ink-100 rounded-xl p-5"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <h3 className="text-lg font-extrabold text-ink-800 flex items-center gap-2">
                              {app.studentName}
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  app.status === 'Approved'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : app.status === 'Rejected'
                                      ? 'bg-rose-100 text-rose-700'
                                      : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {app.status}
                              </span>
                            </h3>
                            <p className="text-xs text-ink-500 mb-2">
                              ✉️ {app.studentEmail}
                            </p>

                            <div className="flex items-center gap-3">
                              <div className="bg-ink-100 px-3 py-1.5 rounded-lg">
                                <span className="text-[10px] font-bold text-ink-400 block uppercase">
                                  {t('facultyDashboard.atsMatch') ||
                                    'ATS Match'}
                                </span>
                                <span className="text-sm font-black text-marigold">
                                  {app.matchScore}%
                                </span>
                              </div>
                              {app.resumeUrl && (
                                <a
                                  href={app.resumeUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-bold text-marigold hover:underline"
                                >
                                  📄 {t('facultyDashboard.viewCv') || 'View CV'}
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 w-full md:w-auto">
                            <button
                              onClick={() =>
                                handleApplicationStatus(
                                  app.applicationId,
                                  'Approved'
                                )
                              }
                              className="flex-1 md:flex-none px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-sm font-bold transition"
                            >
                              {t('facultyDashboard.approve') || 'Approve'}
                            </button>
                            <button
                              onClick={() =>
                                handleApplicationStatus(
                                  app.applicationId,
                                  'Rejected'
                                )
                              }
                              className="flex-1 md:flex-none px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-sm font-bold transition"
                            >
                              {t('facultyDashboard.reject') || 'Reject'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="wm-panel p-6 sm:p-8 max-w-3xl mx-auto">
                <h2 className="text-2xl font-black text-ink-800 mb-6">
                  {t('facultyDashboard.editProfile') || 'Edit Faculty Profile'}
                </h2>
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-extrabold text-ink-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={profileData.fullName}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            fullName: e.target.value,
                          })
                        }
                        className="w-full bg-ink-50 border border-ink-200 rounded-xl px-4 py-3 text-ink-800 focus:ring-2 focus:ring-marigold outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-extrabold text-ink-700 mb-2">
                        Mobile Number
                      </label>
                      <input
                        type="text"
                        value={profileData.mobile}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            mobile: e.target.value,
                          })
                        }
                        className="w-full bg-ink-50 border border-ink-200 rounded-xl px-4 py-3 text-ink-800 focus:ring-2 focus:ring-marigold outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-extrabold text-ink-700 mb-2">
                        University / College
                      </label>
                      <input
                        type="text"
                        disabled
                        value={profileData.collegeName}
                        className="w-full bg-ink-100 border border-ink-200 rounded-xl px-4 py-3 text-ink-500 cursor-not-allowed outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-extrabold text-ink-700 mb-2">
                        Department
                      </label>
                      <input
                        type="text"
                        required
                        value={profileData.departmentName}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            departmentName: e.target.value,
                          })
                        }
                        className="w-full bg-ink-50 border border-ink-200 rounded-xl px-4 py-3 text-ink-800 focus:ring-2 focus:ring-marigold outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-extrabold text-ink-700 mb-2">
                        Personal / Lab Website
                      </label>
                      <input
                        type="url"
                        value={profileData.website}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            website: e.target.value,
                          })
                        }
                        placeholder="https://yourlab.edu"
                        className="w-full bg-ink-50 border border-ink-200 rounded-xl px-4 py-3 text-ink-800 focus:ring-2 focus:ring-marigold outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-extrabold text-ink-700 mb-2">
                        LinkedIn Profile URL
                      </label>
                      <input
                        type="url"
                        value={profileData.linkedinUrl}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            linkedinUrl: e.target.value,
                          })
                        }
                        placeholder="https://linkedin.com/in/username"
                        className="w-full bg-ink-50 border border-ink-200 rounded-xl px-4 py-3 text-ink-800 focus:ring-2 focus:ring-marigold outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-extrabold text-ink-700 mb-2">
                      Bio / Research Area / Specialization
                    </label>
                    <textarea
                      rows="4"
                      value={profileData.bio}
                      onChange={(e) =>
                        setProfileData({ ...profileData, bio: e.target.value })
                      }
                      placeholder="Briefly describe your academic background, research interests, or lab focus..."
                      className="w-full bg-ink-50 border border-ink-200 rounded-xl px-4 py-3 text-ink-800 focus:ring-2 focus:ring-marigold outline-none transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full bg-marigold hover:bg-marigold-mid text-ink-dark font-black py-4 rounded-xl transition shadow-md"
                  >
                    {savingProfile
                      ? 'Saving Changes...'
                      : 'Save Profile Settings 💾'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
