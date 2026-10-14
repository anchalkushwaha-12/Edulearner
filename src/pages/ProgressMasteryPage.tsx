import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { TopicMasteryItem, MasterySummary } from '../types';
import {
  BarChart2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export const ProgressMasteryPage: React.FC<{
  onNavigateToLesson: (topic: string) => void;
  onNavigateToQuiz: (topic: string) => void;
}> = ({ onNavigateToLesson, onNavigateToQuiz }) => {
  const { t, language } = useLanguage();

  const [summary, setSummary] = useState<MasterySummary | null>(null);
  const [topics, setTopics] = useState<TopicMasteryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMastery = async () => {
    setLoading(true);
    try {
      const res = await api.getMastery();
      setSummary(res.summary);
      setTopics(res.topics);
    } catch (err) {
      console.error('Mastery fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMastery();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{t('gap_analysis')}</h1>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'hi'
              ? 'पारदर्शी नियम-आधारित दक्षता प्रणाली (बिना किसी गुप्त एल्गोरिदम के स्पष्ट परिणाम)'
              : 'Transparent, rule-based mastery engine tracking observed accuracy and learning gaps.'}
          </p>
        </div>

        <button
          onClick={fetchMastery}
          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Recalculate Gaps</span>
        </button>
      </div>

      {/* Formula Transparency Card */}
      <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-xs text-teal-950 space-y-2">
        <div className="flex items-center gap-2 font-bold text-teal-900">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Documented Accuracy Baseline Formula:</span>
        </div>
        <p className="font-mono text-teal-800 bg-white/70 p-2 rounded-lg border border-teal-200 inline-block">
          observed_accuracy = correct_graded_answers / total_graded_answers
        </p>
        <p className="text-[11px] text-teal-800/80">
          • <strong>Insufficient Evidence:</strong> &lt; 3 graded answers &nbsp;|&nbsp;
          • <strong>Needs Revision:</strong> &ge; 3 answers and &lt; 50% accuracy &nbsp;|&nbsp;
          • <strong>Developing:</strong> 50% &le; accuracy &lt; 80% &nbsp;|&nbsp;
          • <strong>Demonstrated Proficiency:</strong> &ge; 5 answers and &ge; 80% accuracy.
        </p>
      </div>

      {/* Status Counters Grid */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase text-rose-700">{t('needs_revision')}</span>
            <p className="text-2xl font-extrabold text-rose-900 mt-1">{summary.needs_revision}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">&lt; 50% Accuracy Gap</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase text-amber-700">{t('developing')}</span>
            <p className="text-2xl font-extrabold text-amber-900 mt-1">{summary.developing}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">50% - 79% Accuracy</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase text-emerald-700">{t('demonstrated_proficiency')}</span>
            <p className="text-2xl font-extrabold text-emerald-900 mt-1">{summary.demonstrated_proficiency}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">&ge; 80% with Solid Evidence</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase text-slate-500">{t('insufficient_evidence')}</span>
            <p className="text-2xl font-extrabold text-slate-700 mt-1">{summary.insufficient_evidence}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">&lt; 3 Answers Attempted</p>
          </div>
        </div>
      )}

      {/* Topic Mastery List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-lg font-extrabold text-slate-900">Topic-by-Topic Mastery Breakdown</h2>

        {loading ? (
          <p className="text-xs text-slate-400">Loading topic mastery analytics...</p>
        ) : topics.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No topic evaluations recorded yet. Take a quiz to establish baseline.</p>
        ) : (
          <div className="space-y-4">
            {topics.map((item) => {
              const accuracyPct = Math.round(item.observed_accuracy * 100);
              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                        {item.subject}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-1">{item.topic}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        item.mastery_status === 'demonstrated_proficiency' ? 'bg-emerald-100 text-emerald-800' :
                        item.mastery_status === 'needs_revision' ? 'bg-rose-100 text-rose-800' :
                        item.mastery_status === 'developing' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {item.mastery_status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Accuracy Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Observed Accuracy ({item.correct_answers}/{item.total_graded_answers} correct)</span>
                      <span>{accuracyPct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          accuracyPct >= 80 ? 'bg-emerald-500' : accuracyPct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${accuracyPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Recommendations */}
                  {item.recommendations && item.recommendations.length > 0 && (
                    <div className="pt-2 text-xs text-slate-600 space-y-1">
                      <span className="font-bold text-slate-700">Guidance: </span>
                      <span>{language === 'hi' ? item.recommendations[0]?.message_hi : item.recommendations[0]?.message_en}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => onNavigateToLesson(item.topic)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Review Lesson</span>
                    </button>
                    <button
                      onClick={() => onNavigateToQuiz(item.topic)}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Take Practice Quiz</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
