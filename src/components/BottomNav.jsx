import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Briefcase,
  ClipboardList,
  FileText,
  MessageSquare,
} from 'lucide-react';

/**
 * App-style bottom navigation — students only, phones only (hidden md+).
 * Home / Projects / My Gigs switch the dashboard's mobile tabs via ?tab=,
 * Resume and Chat navigate to their pages. Desktop layout is untouched.
 */
export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    user = null;
  }
  if (user?.userRole !== 'student') return null;

  const tab = searchParams.get('tab') || 'home';
  const onDashboard = location.pathname === '/dashboard';

  const items = [
    {
      key: 'home',
      label: t('bottomnav.home'),
      icon: Home,
      active: onDashboard && tab === 'home',
      go: () => navigate('/dashboard?tab=home'),
    },
    {
      key: 'projects',
      label: t('bottomnav.projects'),
      icon: Briefcase,
      active: onDashboard && tab === 'projects',
      go: () => navigate('/dashboard?tab=projects'),
    },
    {
      key: 'gigs',
      label: t('bottomnav.gigs'),
      icon: ClipboardList,
      active: onDashboard && tab === 'gigs',
      go: () => navigate('/dashboard?tab=gigs'),
    },
    {
      key: 'resume',
      label: t('bottomnav.resume'),
      icon: FileText,
      active: location.pathname.startsWith('/resume-checker'),
      go: () => navigate('/resume-checker'),
    },
    {
      key: 'chat',
      label: t('bottomnav.chat'),
      icon: MessageSquare,
      active: location.pathname.startsWith('/chat'),
      go: () => navigate('/chat'),
    },
  ];

  return (
    <>
      {/* spacer so page content is never hidden behind the fixed bar */}
      <div className="h-20 md:hidden" aria-hidden="true" />
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-ink-100 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Primary"
      >
        <div className="flex justify-around items-stretch">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={item.go}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition ${
                  item.active
                    ? 'text-marigold-600'
                    : 'text-ink-400 hover:text-ink-600'
                }`}
                aria-current={item.active ? 'page' : undefined}
              >
                <Icon
                  className={`w-5 h-5 ${item.active ? 'text-marigold-500' : 'text-ink-400'}`}
                  strokeWidth={item.active ? 2.5 : 2}
                />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
