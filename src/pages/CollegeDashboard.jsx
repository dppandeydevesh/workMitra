import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useToast } from '../components/Toast';
import { useTranslation } from 'react-i18next';
import { Users, Trophy, Building2 } from 'lucide-react';
import { fetchWithAuth } from '../services/apiClient';

export default function CollegeDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

  const [currentUser, setCurrentUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [endorsingEmail, setEndorsingEmail] = useState(null); // email being actioned
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('roster'); // roster | leaderboard | vetting | onboarding

  // Bulk onboarding states
  const [bulkInput, setBulkInput] = useState('');
  const [importStats, setImportStats] = useState(null);
  const [importing, setImporting] = useState(false);

  // Selected student for report card print view
  const [printStudent, setPrintStudent] = useState(null);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(savedUser);

    if (!savedUser.email || savedUser.userRole !== 'college') {
      toast.error(t('college.sessionContextRequired'));
      navigate('/login');
      return;
    }

    fetchDashboardData(savedUser.collegeName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async (collegeName) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [studentsRes, companiesRes] = await Promise.all([
        fetchWithAuth(
          `${API_BASE_URL}/api/college/students/${encodeURIComponent(collegeName)}`,
          { credentials: 'include', headers: {} }
        ),
        fetchWithAuth(`${API_BASE_URL}/api/college/companies`, {
          credentials: 'include',
          headers: {},
        }),
      ]);

      if (studentsRes.ok && companiesRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
        const companiesData = await companiesRes.json();
        setCompanies(companiesData);
      } else {
        setErrorMessage(t('college.errorAcademicDb'));
      }
    } catch (err) {
      setErrorMessage(t('college.errorAcademicDb'));
      console.error('Failed to fetch college stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEndorseToggle = async (studentEmail, currentStatus) => {
    if (endorsingEmail) return; // block concurrent clicks
    setEndorsingEmail(studentEmail);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/college/endorse`, {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentEmail, endorse: !currentStatus }),
      });

      if (res.ok) {
        toast.success(
          currentStatus
            ? t('college.endorsementRemoved')
            : t('college.endorsementSigned')
        );
        fetchDashboardData(currentUser.collegeName);
      } else {
        toast.error(t('college.errorUpdateEndorsement'));
      }
    } catch (err) {
      console.error(err);
      toast.error(t('college.networkErrorEndorsement'));
    } finally {
      setEndorsingEmail(null);
    }
  };

  const handleCompanyToggle = async (companyEmail, status) => {
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL}/api/college/toggle-company`,
        {
          credentials: 'include',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ companyEmail, status }),
        }
      );

      if (res.ok) {
        toast.success(t('college.recruiterStatusUpdated', { status }));
        fetchDashboardData(currentUser.collegeName);
      } else {
        toast.error(t('college.errorUpdatePermissions'));
      }
    } catch (err) {
      console.error(err);
      toast.error(t('college.networkErrorCompanyStatus'));
    }
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!bulkInput.trim()) {
      toast.error(t('college.enterStudentDataFirst'));
      return;
    }

    setImporting(true);
    setImportStats(null);
    try {
      // Parse bulk text: Name, Email, Enrollment
      const lines = bulkInput.split('\n');
      const parsedStudents = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split(',');
        if (parts.length < 3) continue;
        parsedStudents.push({
          fullName: parts[0].trim(),
          email: parts[1].trim(),
          enrollmentNumber: parts[2].trim(),
        });
      }

      if (parsedStudents.length === 0) {
        toast.error(t('college.noValidStudentRows'));
        setImporting(false);
        return;
      }

      const res = await fetchWithAuth(
        `${API_BASE_URL}/api/college/bulk-import`,
        {
          credentials: 'include',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ students: parsedStudents }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        toast.success(t('college.bulkImportComplete'));
        setImportStats({
          imported: data.importedCount,
          duplicate: data.duplicateCount,
          invalid: data.invalidDomainCount,
        });
        setBulkInput('');
        fetchDashboardData(currentUser.collegeName);
      } else {
        toast.error(data.error || t('college.errorBulkImport'));
      }
    } catch (err) {
      console.error(err);
      toast.error(t('college.networkErrorBulkImport'));
    } finally {
      setImporting(false);
    }
  };

  // Group stats by major for leaderboard
  const majorStats = students.reduce((acc, student) => {
    const major = student.major || 'Computer Science';
    if (!acc[major]) {
      acc[major] = { major, totalScore: 0, count: 0, completedTasks: 0 };
    }
    acc[major].totalScore += student.readinessScore || 200;
    acc[major].completedTasks += student.completedTasksCount || 0;
    acc[major].count += 1;
    return acc;
  }, {});

  const leaderboard = Object.values(majorStats)
    .map((m) => ({ ...m, avgScore: Math.round(m.totalScore / m.count) }))
    .sort((a, b) => b.avgScore - a.avgScore);

  // Stats calculation
  const totalStudents = students.length;
  // readinessScore is undefined until a student takes an assessment — treat
  // missing as 0 so one unscored student doesn't turn the average into NaN.
  const avgReadiness =
    totalStudents > 0
      ? Math.round(
          students.reduce(
            (sum, s) => sum + (Number(s.readinessScore) || 0),
            0
          ) / totalStudents
        )
      : 0;
  const atRiskCount = students.filter(
    (s) => (Number(s.readinessScore) || 0) < 400
  ).length;
  const endorsedCount = students.filter((s) => s.isEndorsed).length;

  const handleLogout = () => {
    localStorage.clear();
    toast.success(t('college.loggedOutSuccessfully'));
    window.location.href = '/login';
  };

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 border border-ink-100 text-center space-y-4">
          <span className="text-4xl block">⚠️</span>
          <h2 className="text-lg font-bold text-ink-800">
            {t('college.errorAcademicDb')}
          </h2>
          <p className="text-xs text-ink-500">{errorMessage}</p>
          <button
            onClick={() =>
              fetchDashboardData(
                currentUser?.collegeName ||
                  JSON.parse(localStorage.getItem('user') || '{}').collegeName
              )
            }
            style={{ background: '#F5A623', color: '#1B2333' }}
            className="px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center font-sans">
        <div className="text-center text-ink-500 font-medium animate-pulse flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-marigold-500 border-t-transparent rounded-full animate-spin" />
          <span>{t('college.syncDashboard')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent font-sans pb-12">
      {/* 🏛️ Top Header Banner */}
      <header className="bg-white sticky top-0 z-40 border-b border-ink-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏛️</span>
            <div>
              <h2 className="text-sm font-black text-ink-800 leading-tight">
                {t('college.academicControlPortal')}
              </h2>
              <p className="text-[10px] text-ink-400 font-bold uppercase tracking-wider">
                {currentUser?.collegeName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-extrabold text-ink-600 bg-ink-100 px-3 py-1.5 rounded-xl border border-ink-200">
              {t('college.departmentLabel')}:{' '}
              {currentUser?.departmentName || t('college.general')}
            </span>
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition"
            >
              {t('college.signOut')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Welcome Card & University Branding */}
        <div className="bg-gradient-to-r from-marigold-dark to-marigold rounded-xl shadow-sm p-6 sm:p-8 text-white mb-8 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <p className="text-marigold-light text-[10px] font-extrabold uppercase tracking-widest mb-1">
              {t('college.academicEngagementHub')}
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {currentUser?.collegeName || t('college.partnerUniversity')}
            </h1>
            <p className="text-white/90 text-sm mt-1 max-w-xl">
              {t('college.hubDescription')}
            </p>
          </div>
        </div>

        {/* Live Academic KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: t('college.enrolledStudents'),
              value: totalStudents,
              icon: '👨‍🎓',
              color: 'from-marigold-500 to-marigold-600',
            },
            {
              label: t('college.avgPlacementScore'),
              value: `${avgReadiness}/1000`,
              icon: '📈',
              color: 'from-marigold-500 to-marigold-600',
            },
            {
              label: t('college.facultyEndorsed'),
              value: endorsedCount,
              icon: '🎓',
              color: 'from-emerald-500 to-emerald-600',
            },
            {
              label: t('college.atRiskStudents'),
              value: atRiskCount,
              icon: '⚠️',
              color: 'from-red-500 to-red-600',
            },
          ].map((kpi, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-sm border border-ink-100 p-4 hover:shadow-md transition"
            >
              <div
                className={`w-8 h-8 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white text-sm mb-3`}
              >
                {kpi.icon}
              </div>
              <p className="text-[9px] font-extrabold text-ink-400 uppercase tracking-wider">
                {kpi.label}
              </p>
              <p className="text-lg font-black text-ink-800 mt-0.5">
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        {/* Tab Selection Row */}
        <div className="flex border-b border-ink-200 mb-6 gap-2 overflow-x-auto pb-1">
          {[
            { id: 'roster', label: t('college.tabRoster'), icon: '📋' },
            {
              id: 'leaderboard',
              label: t('college.tabLeaderboard'),
              icon: '🏆',
            },
            { id: 'vetting', label: t('college.tabVetting'), icon: '🛡️' },
            { id: 'onboarding', label: t('college.tabOnboarding'), icon: '➕' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-marigold-500 text-white shadow-md shadow-marigold-100'
                  : 'text-ink-600 hover:bg-ink-100'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}

        {/* 📋 TAB 1: Student Roster & Credit Tracker */}
        {activeTab === 'roster' && (
          <div className="bg-white rounded-xl shadow-sm border border-ink-100 overflow-hidden">
            {students.length === 0 ? (
              <div className="wm-panel p-[40px_24px] text-center max-w-md mx-auto my-6 flex flex-col items-center justify-center">
                <div className="w-[48px] h-[48px] rounded-xl bg-[#FBE7C4] flex items-center justify-center text-[#F5A623] shadow-sm mb-4">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="text-[16px] font-medium text-[#1B2333] mb-[6px]">
                    {t('college.noStudentsYet')}
                  </h3>
                  <p className="text-[13px] text-[#6B7280] leading-[1.65] max-w-[260px] mx-auto">
                    {t('college.useBulkOnboarding')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-ink-50 border-b border-ink-100 text-[10px] font-black text-ink-400 uppercase tracking-wider">
                      <th className="px-6 py-4">
                        {t('college.thStudentDetails')}
                      </th>
                      <th className="px-6 py-4">
                        {t('college.thAcademicTrack')}
                      </th>
                      <th className="px-6 py-4 text-center">
                        {t('college.thClearedTasks')}
                      </th>
                      <th className="px-6 py-4 text-center">
                        {t('college.thWorkMitraScore')}
                      </th>
                      <th className="px-6 py-4 text-center">
                        {t('college.thEndorsement')}
                      </th>
                      <th className="px-6 py-4 text-right">
                        {t('college.thActions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-50 text-xs">
                    {students.map((student) => {
                      const isAtRisk = student.readinessScore < 400;
                      return (
                        <tr
                          key={student.email}
                          className="hover:bg-ink-50 transition"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-extrabold text-ink-800">
                                {student.fullName}
                              </p>
                              <p className="text-[10px] text-ink-400 font-semibold">
                                {student.email}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-ink-700">
                                {student.major}
                              </p>
                              <p className="text-[10px] text-ink-400 font-semibold">
                                {t('college.semesterLabel')}:{' '}
                                {student.currentSemester}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-black text-ink-700">
                              {student.completedTasksCount}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span
                                className={`font-black text-sm ${
                                  isAtRisk
                                    ? 'text-red-500'
                                    : student.readinessScore >= 800
                                      ? 'text-emerald-600'
                                      : 'text-marigold-500'
                                }`}
                              >
                                {student.readinessScore}
                              </span>
                              <span
                                className={`text-[8px] font-black uppercase px-1 py-0.5 rounded mt-0.5 border ${
                                  isAtRisk
                                    ? 'text-red-500 border-red-100 bg-red-50'
                                    : student.readinessScore >= 800
                                      ? 'text-emerald-500 border-emerald-100 bg-emerald-50'
                                      : 'text-marigold-500 border-marigold-100 bg-marigold-50'
                                }`}
                              >
                                {isAtRisk
                                  ? t('college.statusAtRisk')
                                  : student.readinessScore >= 800
                                    ? t('college.statusExcellent')
                                    : t('college.statusOnTrack')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() =>
                                handleEndorseToggle(
                                  student.email,
                                  student.isEndorsed
                                )
                              }
                              disabled={endorsingEmail === student.email}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition ${
                                student.isEndorsed
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : 'bg-white hover:bg-ink-50 text-ink-500 border-ink-200'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              🎓{' '}
                              {endorsingEmail === student.email
                                ? '…'
                                : student.isEndorsed
                                ? t('college.btnEndorsed')
                                : t('college.btnEndorse')}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setPrintStudent(student)}
                              className="px-3 py-1.5 bg-marigold-50 text-marigold-500 hover:bg-marigold-100 rounded-xl text-[10px] font-black transition"
                            >
                              {t('college.btnReportCard')}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 🏆 TAB 2: Department Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-xl shadow-sm border border-ink-100 p-6">
            <h3 className="text-sm font-black text-ink-800 uppercase tracking-wider mb-4">
              🏆 {t('college.deptRankings')}
            </h3>
            {leaderboard.length === 0 ? (
              <div className="p-6 text-center flex flex-col items-center justify-center">
                <div className="w-[40px] h-[40px] rounded-xl bg-[#FBE7C4] flex items-center justify-center text-[#F5A623] shadow-sm mb-3">
                  <Trophy size={20} />
                </div>
                <p className="text-[12px] font-medium text-[#1B2333] mb-[2px]">
                  {t('college.noDeptData')}
                </p>
                <p className="text-[11px] text-[#6B7280] leading-normal max-w-[200px] mx-auto">
                  No student credits have been tracked to rank departments.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaderboard.map((dept, idx) => (
                  <div
                    key={dept.major}
                    className="flex justify-between items-center bg-ink-50 border border-ink-100 p-4 rounded-xl hover:bg-ink-100 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm ${
                          idx === 0
                            ? 'bg-amber-400 animate-pulse'
                            : idx === 1
                              ? 'bg-ink-400'
                              : 'bg-amber-700'
                        }`}
                      >
                        #{idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-ink-800">
                          {dept.major}
                        </h4>
                        <p className="text-[10px] text-ink-400 font-semibold mt-0.5">
                          {t('college.deptStats', {
                            count: dept.count,
                            tasks: dept.completedTasks,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-marigold-700">
                        {t('college.ptsLabel', { score: dept.avgScore })}
                      </span>
                      <p className="text-[9px] text-ink-400 uppercase font-black tracking-wider mt-0.5">
                        {t('college.averageScore')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 🛡️ TAB 3: Vetting Recruiters (Approved/Blocked Companies) */}
        {activeTab === 'vetting' && (
          <div className="bg-white rounded-xl shadow-sm border border-ink-100 overflow-hidden">
            {companies.length === 0 ? (
              <div className="wm-panel p-[40px_24px] text-center max-w-md mx-auto my-6 flex flex-col items-center justify-center">
                <div className="w-[48px] h-[48px] rounded-xl bg-[#FBE7C4] flex items-center justify-center text-[#F5A623] shadow-sm mb-4">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-[16px] font-medium text-[#1B2333] mb-[6px]">
                    {t('college.noRecruitersYet')}
                  </h3>
                  <p className="text-[13px] text-[#6B7280] leading-[1.65] max-w-[260px] mx-auto">
                    No corporate affiliates have requested placement access.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-ink-50 border-b border-ink-100 text-[10px] font-black text-ink-400 uppercase tracking-wider">
                      <th className="px-6 py-4">
                        {t('college.thCompanyName')}
                      </th>
                      <th className="px-6 py-4">
                        {t('college.thCompanyEmail')}
                      </th>
                      <th className="px-6 py-4">{t('college.thIndustry')}</th>
                      <th className="px-6 py-4">
                        {t('college.thCampusAccess')}
                      </th>
                      <th className="px-6 py-4 text-right">
                        {t('college.thActions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-50 text-xs">
                    {companies.map((c) => (
                      <tr key={c.email} className="hover:bg-ink-50 transition">
                        <td className="px-6 py-4">
                          <p className="font-extrabold text-ink-800">
                            {c.companyName}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-ink-500">
                            {c.email}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-ink-700">
                            {c.industryVertical}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold border uppercase ${
                              c.status === 'Approved'
                                ? 'bg-green-50 text-green-600 border-green-100'
                                : c.status === 'Blocked'
                                  ? 'bg-red-50 text-red-600 border-red-100'
                                  : 'bg-ink-50 text-ink-500 border-ink-100'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() =>
                              handleCompanyToggle(c.email, 'Approved')
                            }
                            disabled={c.status === 'Approved'}
                            className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-600 rounded text-[10px] font-bold border border-green-200 disabled:opacity-40 transition"
                          >
                            {t('college.btnApprove')}
                          </button>
                          <button
                            onClick={() =>
                              handleCompanyToggle(c.email, 'Blocked')
                            }
                            disabled={c.status === 'Blocked'}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px] font-bold border border-red-200 disabled:opacity-40 transition"
                          >
                            {t('college.btnBlock')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ➕ TAB 4: Bulk Student Onboarding Console */}
        {activeTab === 'onboarding' && (
          <div className="bg-white rounded-xl shadow-sm border border-ink-100 p-6">
            <div className="mb-5">
              <h3 className="text-sm font-black text-ink-800 uppercase tracking-wider">
                ➕ {t('college.bulkStudentRegistrar')}
              </h3>
              <p className="text-[11px] text-ink-400 mt-1">
                {t('college.onboardingDesc1')}{' '}
                <code className="bg-ink-100 px-1 py-0.5 rounded font-mono font-bold text-ink-700">
                  password123
                </code>
                .
              </p>
            </div>

            <form onSubmit={handleBulkImport} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-ink-400 uppercase mb-2">
                  {t('college.studentDataPayload')}
                </label>
                <textarea
                  rows={8}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  className="w-full bg-ink-50 border border-ink-200 p-4 rounded-xl text-xs outline-none focus:ring-2 focus:ring-marigold-400 focus:bg-white transition resize-none font-mono"
                  placeholder={t('college.csvPlaceholder')}
                />
              </div>

              {importStats && (
                <div className="bg-marigold-50/50 border border-marigold-100 rounded-xl p-4 text-xs space-y-1">
                  <p className="font-bold text-marigold-800">
                    📊 {t('college.lastImportSummary')}
                  </p>
                  <p className="text-marigold-900/80">
                    🔹 {t('college.studentsRegistered')}:{' '}
                    <strong className="text-marigold-700">
                      {importStats.imported}
                    </strong>
                  </p>
                  <p className="text-marigold-900/80">
                    🔹 {t('college.duplicatesSkipped')}:{' '}
                    <strong className="text-ink-600">
                      {importStats.duplicate}
                    </strong>
                  </p>
                  <p className="text-marigold-900/80">
                    🔹 {t('college.invalidDomains')}:{' '}
                    <strong className="text-red-600">
                      {importStats.invalid}
                    </strong>
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={importing}
                className="px-6 py-2.5 bg-gradient-to-r from-marigold-600 to-paper hover:from-marigold-700 hover:to-paper text-white rounded-xl text-xs font-black tracking-wider uppercase transition shadow-lg shadow-marigold-100 disabled:opacity-50"
              >
                {importing
                  ? t('college.processingPayload')
                  : t('college.executeBulkImport')}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 🧾 Student Report Card Modal Overlay */}
      {printStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40">
          <div className="bg-white rounded-xl shadow-sm border p-6 sm:p-8 max-w-xl w-full border-ink-100 relative animate-scale-up">
            <button
              onClick={() => setPrintStudent(null)}
              className="absolute top-4 right-4 text-ink-400 hover:text-ink-600 text-lg font-black"
            >
              ✕
            </button>

            <div id="printable-report-card" className="space-y-6">
              {/* Header */}
              <div className="text-center border-b pb-5">
                <span className="text-3xl block mb-2">🎓</span>
                <h2 className="text-xl font-black text-ink-800 tracking-tight">
                  {t('college.academicCorpReportCard')}
                </h2>
                <p className="text-[10px] text-ink-400 uppercase font-black tracking-wider mt-0.5">
                  {currentUser?.collegeName}
                </p>
              </div>

              {/* Grid details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-ink-400 font-bold text-[9px] uppercase">
                    {t('college.studentName')}
                  </p>
                  <p className="font-extrabold text-ink-800 mt-0.5">
                    {printStudent.fullName}
                  </p>
                </div>
                <div>
                  <p className="text-ink-400 font-bold text-[9px] uppercase">
                    {t('college.enrollmentNumber')}
                  </p>
                  <p className="font-extrabold text-ink-800 mt-0.5">
                    {printStudent.enrollmentNumber}
                  </p>
                </div>
                <div>
                  <p className="text-ink-400 font-bold text-[9px] uppercase">
                    {t('college.departmentMajor')}
                  </p>
                  <p className="font-extrabold text-ink-800 mt-0.5">
                    {printStudent.major}
                  </p>
                </div>
                <div>
                  <p className="text-ink-400 font-bold text-[9px] uppercase">
                    {t('college.currentSemester')}
                  </p>
                  <p className="font-extrabold text-ink-800 mt-0.5">
                    {printStudent.currentSemester}
                  </p>
                </div>
              </div>

              <div className="border-t pt-5 grid grid-cols-3 gap-4 text-center">
                <div className="bg-ink-50 p-3 rounded-xl border border-ink-100">
                  <p className="text-[8px] font-black text-ink-400 uppercase tracking-wider">
                    {t('college.gigsCleared')}
                  </p>
                  <p className="text-lg font-black text-ink-800 mt-0.5">
                    {printStudent.completedTasksCount}
                  </p>
                </div>
                <div className="bg-ink-50 p-3 rounded-xl border border-ink-100">
                  <p className="text-[8px] font-black text-ink-400 uppercase tracking-wider">
                    {t('college.avgRating')}
                  </p>
                  <p className="text-lg font-black text-ink-800 mt-0.5">
                    {printStudent.avgRating}★
                  </p>
                </div>
                <div className="bg-ink-50 p-3 rounded-xl border border-ink-100">
                  <p className="text-[8px] font-black text-ink-400 uppercase tracking-wider">
                    {t('college.readinessScore')}
                  </p>
                  <p className="text-lg font-black text-marigold-500 mt-0.5">
                    {printStudent.readinessScore}
                  </p>
                </div>
              </div>

              {/* Endorsement state banner */}
              <div
                className={`p-4 rounded-xl border text-center ${
                  printStudent.isEndorsed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <p className="text-xs font-black">
                  {printStudent.isEndorsed
                    ? `✓ ${t('college.facultyEndorsedDesc')}`
                    : `⏳ ${t('college.facultyEndorsementPending')}`}
                </p>
              </div>

              {/* Print layout buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t no-print">
                <button
                  onClick={() => setPrintStudent(null)}
                  className="px-4 py-2 bg-ink-100 hover:bg-ink-200 text-ink-600 rounded-xl text-xs font-bold transition"
                >
                  {t('college.btnClose')}
                </button>
                <button
                  onClick={() => window.print()}
                  style={{ background: '#F5A623', color: '#1B2333' }}
                  className="px-5 py-2 rounded-xl text-xs font-bold transition"
                >
                  {t('college.btnPrintReport')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
