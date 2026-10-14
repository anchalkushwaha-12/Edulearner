import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../context/LanguageContext';
import { QuizAttemptResult } from '../types';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Bot,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

export const QuizResultPage: React.FC<{
  result: {
    attempt: QuizAttemptResult;
    mastery_status: string;
    observed_accuracy: number;
    recommendations: any[];
  };
  onRetake: () => void;
  onNavigateToLessons: (topic: string) => void;
  onNavigateToTutor: (topic: string) => void;
}> = ({ result, onRetake, onNavigateToLessons, onNavigateToTutor }) => {
  const { t, language } = useLanguage();
  const { attempt, mastery_status, observed_accuracy, recommendations } = result;

  const percentage = Math.round((attempt.score / attempt.total_questions) * 100);

  useEffect(() => {
    if (percentage >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Confetti visual flare only
      }
    }
  }, [percentage]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Score Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xs space-y-4">
        <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
          percentage >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
        }`}>
          <Trophy className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            {attempt.subject} • {attempt.topic}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-2">
            {percentage >= 80 ? '🎉 शाबाश! Excellent Mastery!' : percentage >= 50 ? 'Good Effort!' : 'Keep Practicing!'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official backend evaluation completed with zero client score tampering.
          </p>
        </div>

        {/* Score Number Display */}
        <div className="flex items-center justify-center gap-6 py-2">
          <div>
            <span className="text-4xl font-extrabold text-teal-700">{attempt.score}</span>
            <span className="text-2xl font-bold text-slate-400"> / {attempt.total_questions}</span>
            <p className="text-xs text-slate-500 mt-0.5">{percentage}% Accuracy</p>
          </div>
        </div>

        {/* Mastery Engine Status Tag */}
        <div className="pt-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
            mastery_status === 'demonstrated_proficiency'
              ? 'bg-emerald-100 text-emerald-800'
              : mastery_status === 'needs_revision'
              ? 'bg-rose-100 text-rose-800'
              : 'bg-indigo-100 text-indigo-800'
          }`}>
            <span>Mastery Status: {mastery_status.replace('_', ' ')}</span>
          </span>
        </div>

        {/* Action Recommendations from Rule Engine */}
        {recommendations && recommendations.length > 0 && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-teal-600" />
              <span>Recommended Next Steps:</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>{language === 'hi' ? rec.message_hi : rec.message_en}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onNavigateToLessons(attempt.topic)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-slate-600" />
            <span>Review Lesson</span>
          </button>

          <button
            onClick={() => onNavigateToTutor(attempt.topic)}
            className="px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Bot className="w-4 h-4 text-teal-600" />
            <span>Discuss Gaps with AI</span>
          </button>

          <button
            onClick={onRetake}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Another Quiz</span>
          </button>
        </div>
      </div>

      {/* Question-by-Question Review */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-slate-900 text-base">Question Breakdown & Explanations</h3>

        {attempt.answers_detail.map((detail, idx) => (
          <div
            key={idx}
            className={`p-5 rounded-2xl border transition space-y-2 ${
              detail.is_correct
                ? 'bg-emerald-50/40 border-emerald-200'
                : 'bg-rose-50/40 border-rose-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Question {idx + 1}</span>
              <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                detail.is_correct ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {detail.is_correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span>{detail.is_correct ? 'Correct' : 'Incorrect'}</span>
              </span>
            </div>

            <div className="text-xs space-y-1">
              <p>
                <span className="text-slate-500 font-medium">Your Answer: </span>
                <span className="font-bold text-slate-800">{detail.submitted || 'None'}</span>
              </p>
              {!detail.is_correct && (
                <p>
                  <span className="text-slate-500 font-medium">Correct Answer: </span>
                  <span className="font-bold text-emerald-800">{detail.correct}</span>
                </p>
              )}
            </div>

            {/* Explanation */}
            <div className="pt-2 text-xs text-slate-600 border-t border-slate-200/60 leading-relaxed">
              <span className="font-bold text-slate-700">Explanation: </span>
              <span>{language === 'hi' ? detail.explanation_hi : detail.explanation_en}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
