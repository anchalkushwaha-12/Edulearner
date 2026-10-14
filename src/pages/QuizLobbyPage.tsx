import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { QuizSafe } from '../types';
import { CheckSquare, ArrowRight, BookOpen, Sparkles, Filter, HelpCircle } from 'lucide-react';

export const QuizLobbyPage: React.FC<{
  onStartQuiz: (quizId: string) => void;
  filterQuizId?: string;
}> = ({ onStartQuiz, filterQuizId }) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [quizzes, setQuizzes] = useState<QuizSafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<number | ''>(user?.grade || '');

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const res = await api.getQuizzes({
          grade: selectedGrade ? Number(selectedGrade) : undefined,
          subject: selectedSubject || undefined,
        });
        setQuizzes(res.quizzes);

        // Auto-start if filterQuizId was provided
        if (filterQuizId) {
          onStartQuiz(filterQuizId);
        }
      } catch (err) {
        console.error('Quiz fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [selectedGrade, selectedSubject]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{t('quizzes')}</h1>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'hi'
              ? 'स्व-मूल्यांकन अभ्यास प्रश्नोत्तरी (सर्वर द्वारा निष्पक्ष मूल्यांकन)'
              : 'Interactive practice assessments with server-side grading and learning gap tracking.'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value ? Number(e.target.value) : '')}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-700"
          >
            <option value="">All Grades</option>
            {[6, 7, 8, 9, 10].map((g) => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-700"
          >
            <option value="">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="Social Science">Social Science</option>
          </select>
        </div>
      </div>

      {/* Quizzes Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm">Loading quizzes...</div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <CheckSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No quizzes found</h3>
          <p className="text-xs text-slate-500">Try adjusting your grade or subject filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-md hover:border-teal-300 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                    Grade {quiz.grade} • {quiz.subject}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    {quiz.question_count} Questions
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                  {language === 'hi' ? quiz.title_hi : quiz.title_en}
                </h3>

                <p className="text-xs text-slate-500">
                  Topic: <span className="font-semibold text-slate-700">{quiz.topic}</span>
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Server Graded</span>
                <button
                  onClick={() => onStartQuiz(quiz.id)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Start Quiz</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
