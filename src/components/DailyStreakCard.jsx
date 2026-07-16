import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  CheckCircle2,
  Circle,
  X,
  Loader2,
  BrainCircuit,
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { fetchWithAuth } from '../services/apiClient';

/**
 * "Today's 3 Tasks" daily streak card for the student dashboard:
 *   1. Answer today's AI placement question (modal on this card)
 *   2. Explore a project (auto-tracked from ProjectDetails)
 *   3. Sharpen your profile (auto-tracked from ResumeChecker / Preferences)
 * Completing all three extends the 🔥 streak (IST day boundary, server-side).
 */
export default function DailyStreakCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [status, setStatus] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [question, setQuestion] = useState(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/daily/status`);
      if (res.ok) setStatus(await res.json());
    } catch {
      // the card silently hides itself when status can't load
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Tasks 2 and 3 complete on other pages — refresh when the user comes back
    window.addEventListener('focus', fetchStatus);
    return () => window.removeEventListener('focus', fetchStatus);
  }, [fetchStatus]);

  const openQuestion = async () => {
    setShowModal(true);
    setLoadingQuestion(true);
    setSelected(null);
    setResult(null);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/daily/question`);
      if (res.ok) {
        const q = await res.json();
        setQuestion(q);
        if (q.alreadyAnswered) {
          setResult({
            correct: q.yourAnswerCorrect,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            attemptCount: q.attemptCount,
            correctPercent: q.correctPercent,
          });
          setSelected(q.yourAnswerIndex);
        }
      }
    } catch {
      setQuestion(null);
    } finally {
      setLoadingQuestion(false);
    }
  };

  const submitAnswer = async () => {
    if (selected === null || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL}/api/daily/question/answer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answerIndex: selected }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        fetchStatus();
      }
    } catch {
      // leave the modal open so the student can retry
    } finally {
      setSubmitting(false);
    }
  };

  if (!status) return null;

  const tasks = [
    {
      key: 'question',
      done: status.tasks.question,
      label: t('daily.taskQuestion'),
      action: openQuestion,
    },
    {
      key: 'explore',
      done: status.tasks.explore,
      label: t('daily.taskExplore'),
      action: () => {
        const el = document.getElementById('gigs-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      key: 'improve',
      done: status.tasks.improve,
      label: t('daily.taskImprove'),
      action: () => navigate('/resume-checker'),
    },
  ];
  const doneCount = tasks.filter((task) => task.done).length;

  return (
    <div className="mt-6 bg-white border border-marigold-200 rounded-2xl p-5 shadow-sm wm-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-extrabold text-ink-900 flex items-center gap-2 text-lg">
          <BrainCircuit className="w-5 h-5 text-marigold-500" />
          {t('daily.title')}
        </h3>
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-sm ${
            status.streak > 0
              ? 'bg-orange-50 text-orange-600'
              : 'bg-ink-50 text-ink-400'
          }`}
        >
          <Flame
            className={`w-4 h-4 ${status.streak > 0 ? 'text-orange-500' : 'text-ink-300'}`}
          />
          {status.streak} {t('daily.dayStreak')}
        </div>
      </div>

      {/* progress bar */}
      <div className="w-full bg-ink-100 h-1.5 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-marigold-500 transition-all duration-500"
          style={{ width: `${(doneCount / 3) * 100}%` }}
        />
      </div>

      <ul className="space-y-2.5">
        {tasks.map((task) => (
          <li key={task.key}>
            <button
              onClick={task.done ? undefined : task.action}
              disabled={task.done}
              className={`w-full flex items-center gap-3 text-left text-sm font-semibold rounded-xl px-3 py-2.5 transition ${
                task.done
                  ? 'text-emerald-700 bg-emerald-50 cursor-default'
                  : 'text-ink-700 bg-ink-50 hover:bg-marigold-50 hover:text-marigold-700'
              }`}
            >
              {task.done ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-ink-300 shrink-0" />
              )}
              <span
                className={
                  task.done ? 'line-through decoration-emerald-300' : ''
                }
              >
                {task.label}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {status.completedAll && (
        <p className="mt-4 text-center text-sm font-bold text-orange-600 bg-orange-50 rounded-xl py-2.5">
          🎉 {t('daily.allDone')}
        </p>
      )}

      {/* ── Daily question modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-ink-400 hover:text-ink-700"
              aria-label={t('daily.close')}
            >
              <X className="w-5 h-5" />
            </button>

            {loadingQuestion ? (
              <div className="flex items-center justify-center py-16 text-marigold-500">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : !question ? (
              <p className="text-center text-ink-500 py-10">
                {t('daily.loadFailed')}
              </p>
            ) : (
              <>
                <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-marigold-50 text-marigold-700 px-2.5 py-1 rounded-full mb-3">
                  {question.category} · {t('daily.questionOfTheDay')}
                </span>
                <h4 className="font-bold text-ink-900 text-base mb-4 leading-relaxed">
                  {question.question}
                </h4>

                <div className="space-y-2 mb-4">
                  {question.options.map((option, idx) => {
                    let style =
                      'border-ink-200 hover:border-marigold-400 text-ink-700';
                    if (result) {
                      if (idx === result.correctIndex)
                        style =
                          'border-emerald-500 bg-emerald-50 text-emerald-800';
                      else if (idx === selected)
                        style = 'border-rose-400 bg-rose-50 text-rose-700';
                      else style = 'border-ink-100 text-ink-400';
                    } else if (idx === selected) {
                      style =
                        'border-marigold-500 bg-marigold-50 text-marigold-800';
                    }
                    return (
                      <button
                        key={idx}
                        onClick={() => !result && setSelected(idx)}
                        disabled={!!result}
                        className={`w-full text-left text-sm font-semibold border-2 rounded-xl px-4 py-3 transition ${style}`}
                      >
                        {String.fromCharCode(65 + idx)}. {option}
                      </button>
                    );
                  })}
                </div>

                {!result ? (
                  <button
                    onClick={submitAnswer}
                    disabled={selected === null || submitting}
                    className={`w-full py-3 rounded-xl text-white text-sm font-bold transition ${
                      selected === null || submitting
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-marigold-500 hover:bg-marigold-600'
                    }`}
                  >
                    {submitting ? t('daily.checking') : t('daily.submitAnswer')}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p
                      className={`text-center font-extrabold ${
                        result.correct ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {result.correct
                        ? `✅ ${t('daily.correct')}`
                        : `❌ ${t('daily.incorrect')}`}
                    </p>
                    {result.explanation && (
                      <p className="text-sm text-ink-600 bg-ink-50 rounded-xl p-3 leading-relaxed">
                        {result.explanation}
                      </p>
                    )}
                    <p className="text-xs text-ink-500 text-center font-semibold">
                      {t('daily.stats', {
                        count: result.attemptCount,
                        percent: result.correctPercent,
                      })}
                    </p>
                    <button
                      onClick={() => setShowModal(false)}
                      className="w-full py-2.5 rounded-xl bg-ink-900 text-white text-sm font-bold hover:bg-ink-700 transition"
                    >
                      {t('daily.close')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
