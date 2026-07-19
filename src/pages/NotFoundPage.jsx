import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-transparent p-6 select-none">
      <div className="text-center space-y-6 max-w-md bg-white p-8 rounded-[40px] shadow-[0_20px_50px_rgba(100,50,150,0.08)] border border-ink-200">
        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-marigold-500 to-pink-600">
          404
        </h1>
        <h2 className="text-2xl font-extrabold text-ink-dark">
          {t('notFound.title')}
        </h2>
        <p className="text-sm text-ink-500 leading-relaxed">
          {t('notFound.description')}
        </p>
        <button
          onClick={() => navigate('/')}
          className="w-full py-3.5 bg-gradient-to-r from-marigold-500 to-pink-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition hover:opacity-95"
        >
          {t('notFound.goHome')}
        </button>
      </div>
    </div>
  );
}
