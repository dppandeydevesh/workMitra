import { useTranslation } from 'react-i18next';

/**
 * Floating EN/हिन्दी toggle for public pages (Landing, About, Legal, Login,
 * 404). Logged-in pages get their switcher from the Navbar, which doesn't
 * render on public routes — without this, a first-time Hindi visitor could
 * never reach the Hindi translation. LanguageDetector persists the choice
 * to localStorage, so it carries into the logged-in experience too.
 */
export default function PublicLanguageSwitcher() {
  const { i18n } = useTranslation();
  const isEnglish = i18n.language?.startsWith('en');

  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(isEnglish ? 'hi' : 'en')}
      aria-label={isEnglish ? 'हिन्दी में देखें' : 'Switch to English'}
      className="fixed bottom-5 right-5 z-50 px-4 py-2.5 bg-white/95 backdrop-blur border border-ink-200 shadow-lg rounded-full text-xs font-black text-ink-700 hover:text-marigold-600 hover:border-marigold-300 transition flex items-center gap-1.5"
    >
      <span aria-hidden="true">🌐</span>
      {isEnglish ? 'हिन्दी' : 'English'}
    </button>
  );
}
