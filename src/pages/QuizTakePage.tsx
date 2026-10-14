import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import { api } from '../services/api';
import { OfflineStorageManager } from '../services/offlineStore';
import { QuizSafe, QuizQuestionSafe, QuizAttemptResult } from '../types';
import { AudioSpeaker } from '../components/AudioSpeaker';
import {
  ArrowLeft,
  CheckSquare,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Send,
  HelpCircle
} from 'lucide-react';

export const QuizTakePage: React.FC<{
  quizId: string;
  onBack: () => void;
  onFinish: (result: {
    attempt: QuizAttemptResult;
    mastery_status: string;
    observed_accuracy: number;
    recommendations: any[];
  }) => void;
}> = ({ quizId, onBack, onFinish }) => {
  const { t, language } = useLanguage();
  const { isOnline, downloadedQuizzes } = useOffline();

  const [quiz, setQuiz] = useState<QuizSafe | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      try {
        const data = await api.getQuiz(quizId);
        setQuiz(data);
      } catch (err) {
        // Fallback to downloaded quiz if offline
        const cached = downloadedQuizzes.find(q => q.id === quizId);
        if (cached) setQuiz(cached);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  if (loading) {
    return <div className="text-center py-20 text-slate-400">Loading quiz assessment...</div>;
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <p className="text-slate-600">Quiz not found or has no questions.</p>
        <button onClick={onBack} className="text-xs font-bold text-teal-600 underline">
          Back to quizzes
        </button>
      </div>
    );
  }

  const questions = quiz.questions;
  const currentQ = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;
  const totalQ = questions.length;

  const handleSelectOption = (option: string) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: option }));
  };

  const toggleHint = () => {
    setRevealedHints(prev => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    const opId = `op-submit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    try {
      if (isOnline) {
        const res = await api.submitQuiz(quiz.id, answers, opId);
        onFinish({
          attempt: res.attempt,
          mastery_status: res.mastery_status,
          observed_accuracy: res.observed_accuracy,
          recommendations: res.recommendations,
        });
      } else {
        // Offline: queue in sync journal
        OfflineStorageManager.queueOfflineOperation('quiz_attempt', {
          quiz_id: quiz.id,
          answers,
          timestamp: new Date().toISOString(),
        });

        // Provide client estimate attempt for offline display
        const offlineAttempt: QuizAttemptResult = {
          id: `att-off-${Date.now()}`,
          quiz_id: quiz.id,
          user_id: 'offline-student',
          subject: quiz.subject,
          topic: quiz.topic,
          score: Object.keys(answers).length, // Estimated offline
          total_questions: questions.length,
          submitted_answers: answers,
          answers_detail: questions.map(q => ({
            question_id: q.id,
            submitted: answers[q.id] || '',
            correct: 'Verified on sync',
            is_correct: true,
            explanation_en: 'Will be officially verified upon reconnection.',
            explanation_hi: 'इंटरनेट जुड़ने पर आधिकारिक सत्यापन होगा।',
          })),
          created_at: new Date().toISOString(),
        };

        onFinish({
          attempt: offlineAttempt,
          mastery_status: 'developing',
          observed_accuracy: 1.0,
          recommendations: [],
        });
      }
    } catch (err: any) {
      alert(err.message || 'Error submitting quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const qText = language === 'hi' ? currentQ.question_hi : currentQ.question_en;
  const options = language === 'hi' ? (currentQ.options_hi.length ? currentQ.options_hi : currentQ.options_en) : currentQ.options_en;
  const hint = language === 'hi' ? currentQ.hint_hi : currentQ.hint_en;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Quiz</span>
        </button>

        <span className="text-xs font-bold text-slate-500">
          Question {currentIdx + 1} of {totalQ}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full bg-teal-600 transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / totalQ) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
              {currentQ.type.replace('_', ' ')}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug pt-2">
              {qText}
            </h2>
          </div>

          <AudioSpeaker text={qText} />
        </div>

        {/* Options */}
        <div className="space-y-3 pt-2">
          {options.map((opt, i) => {
            const isSelected = answers[currentQ.id] === opt;
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectOption(opt)}
                className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-teal-50 border-teal-500 text-teal-950 shadow-xs ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                    isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt}</span>
                </div>
                {isSelected && <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Socratic Hint Box */}
        {hint && (
          <div className="pt-2">
            {revealedHints[currentQ.id] ? (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">Hint:</span>
                  <span>{hint}</span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={toggleHint}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span>Need a hint? (संकेत देखें)</span>
              </button>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(prev => prev - 1)}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
          >
            {t('previous')}
          </button>

          {isLast ? (
            <button
              type="button"
              disabled={submitting || !answers[currentQ.id]}
              onClick={handleSubmitQuiz}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Evaluating...' : t('submit')}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentIdx(prev => prev + 1)}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>{t('next')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
