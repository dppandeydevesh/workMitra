import { useTranslation } from 'react-i18next';

export default function AuthLanding({ setView, setUserRole }) {
  const { t } = useTranslation();

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center relative p-6 z-10 animate-fade-in">
      <div className="text-center max-w-2xl mb-12 z-10 flex flex-col items-center animate-fade-in">
        <div className="bg-white p-6 rounded-[40px] shadow-sm border border-white/20 mb-6">
          <img
            src="/logo.png"
            alt="workMitra Logo"
            className="w-56 h-auto object-contain filter drop-shadow-lg"
          />
        </div>
        <p className="text-[#6B7280] mt-2 text-sm md:text-base font-semibold leading-relaxed">
          {t('login.choosePathDesc')}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full z-10 px-4">
        <button
          onClick={() => {
            setUserRole('student');
            setView('auth');
          }}
          className="group text-left p-8 bg-white/40 border border-ink-200 rounded-[32px] hover:border-[#F5A623] hover:bg-white/60 transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">💼</div>
          <div className="w-12 h-12 rounded-xl bg-transparent text-white flex items-center justify-center text-2xl mb-4">
            🚀
          </div>
          <h3 className="text-2xl font-bold text-[#1B2333] mb-2">{t('login.needJobTitle')}</h3>
          <p className="text-sm text-[#6B7280]">{t('login.needJobDesc')}</p>
        </button>

        <button
          onClick={() => {
            setUserRole('company');
            setView('auth');
          }}
          className="group text-left p-8 bg-white/40 border border-ink-200 rounded-[32px] hover:border-[#F5A623] hover:bg-white/60 transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">🏢</div>
          <div className="w-12 h-12 rounded-xl bg-[#F5A623] text-white flex items-center justify-center text-2xl mb-4">
            🤝
          </div>
          <h3 className="text-2xl font-bold text-[#1B2333] mb-2">{t('login.wantToHireTitle')}</h3>
          <p className="text-sm text-[#6B7280]">{t('login.wantToHireDesc')}</p>
        </button>

        <button
          onClick={() => {
            setUserRole('college');
            setView('auth');
          }}
          className="group text-left p-8 bg-white/40 border border-ink-200 rounded-[32px] hover:border-marigold-400 hover:bg-white/60 transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">🎓</div>
          <div className="w-12 h-12 rounded-xl bg-marigold-500 text-white flex items-center justify-center text-2xl mb-4">
            🏫
          </div>
          <h3 className="text-2xl font-bold text-[#1B2333] mb-2">{t('login.professorTitle')}</h3>
          <p className="text-sm text-[#6B7280]">{t('login.professorDesc')}</p>
        </button>
      </div>
    </div>
  );
}
