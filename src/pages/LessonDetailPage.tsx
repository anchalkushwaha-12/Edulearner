import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import { api } from '../services/api';
import { Lesson } from '../types';
import { AudioSpeaker } from '../components/AudioSpeaker';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Download,
  Check,
  Bot,
  HelpCircle,
  Lightbulb,
  Share2
} from 'lucide-react';

export const LessonDetailPage: React.FC<{
  lessonId: string;
  onBack: () => void;
  onNavigateToQuiz: (quizId?: string) => void;
  onNavigateToTutor: (topic: string) => void;
}> = ({ lessonId, onBack, onNavigateToQuiz, onNavigateToTutor }) => {
  const { t, language } = useLanguage();
  const { isLessonDownloaded, toggleDownloadLesson, downloadedLessons } = useOffline();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [associatedQuizId, setAssociatedQuizId] = useState<string | undefined>();
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await api.getLesson(lessonId);
        setLesson(res.lesson);
        setAssociatedQuizId(res.associated_quiz_id);
        if (res.progress?.status === 'completed') {
          setIsCompleted(true);
        }
      } catch (err) {
        // Fallback to offline downloaded lessons
        const cached = downloadedLessons.find(l => l.id === lessonId);
        if (cached) setLesson(cached);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [lessonId]);

  const handleToggleComplete = async () => {
    if (!lesson) return;
    setMarking(true);
    try {
      const newStatus = isCompleted ? 'started' : 'completed';
      await api.updateLessonProgress(lesson.id, newStatus);
      setIsCompleted(!isCompleted);
    } catch (err) {
      // Toggle locally
      setIsCompleted(!isCompleted);
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400">Loading lesson details...</div>;
  }

  if (!lesson) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center space-y-4">
        <p className="text-slate-600">Lesson not found.</p>
        <button onClick={onBack} className="text-xs font-bold text-teal-600 underline">
          Go back to lessons
        </button>
      </div>
    );
  }

  const downloaded = isLessonDownloaded(lesson.id);
  const title = language === 'hi' ? lesson.title_hi : lesson.title_en;
  const content = language === 'hi' ? lesson.content_hi : lesson.content_en;
  const keyPoints = language === 'hi' ? lesson.key_points_hi : lesson.key_points_en;
  const examples = language === 'hi' ? lesson.examples_hi : lesson.examples_en;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Lessons</span>
        </button>

        <div className="flex items-center gap-2">
          <AudioSpeaker text={`${title}. ${content.slice(0, 300)}`} />

          <button
            onClick={() => toggleDownloadLesson(lesson)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              downloaded
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {downloaded ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Download className="w-3.5 h-3.5" />}
            <span>{downloaded ? t('downloaded') : t('download_lesson')}</span>
          </button>
        </div>
      </div>

      {/* Main Lesson Content Card */}
      <article className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-6">
        {/* Metadata Header */}
        <div className="space-y-2 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider">
            <span>Grade {lesson.grade}</span>
            <span>•</span>
            <span>{lesson.subject}</span>
            <span>•</span>
            <span className="text-slate-500 font-normal">{lesson.topic}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 italic">
            {language === 'hi' ? lesson.summary_hi : lesson.summary_en}
          </p>
        </div>

        {/* Formatted Lesson Text */}
        <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-slate-800">
          {content}
        </div>

        {/* Key Points Section */}
        {keyPoints && keyPoints.length > 0 && (
          <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2.5">
            <h3 className="font-extrabold text-teal-900 text-xs sm:text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>{language === 'hi' ? 'महत्वपूर्ण सूत्र एवं मुख्य बिंदु' : 'Key Concepts & Summary Points'}</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-teal-950">
              {keyPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Real-World Rural Analogy Examples */}
        {examples && examples.length > 0 && (
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2.5">
            <h3 className="font-extrabold text-amber-900 text-xs sm:text-sm flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>{language === 'hi' ? 'ग्रामीण एवं व्यावहारिक जीवन के उदाहरण' : 'Real-World Village & Practical Examples'}</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-amber-950">
              {examples.map((ex, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">🌾</span>
                  <span>{ex}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={handleToggleComplete}
            disabled={marking}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              isCompleted
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCompleted ? 'Completed ✓' : 'Mark as Completed'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateToTutor(lesson.topic)}
              className="px-3.5 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Bot className="w-4 h-4 text-teal-600" />
              <span>{language === 'hi' ? 'AI शिक्षक से पूछें' : 'Ask AI Tutor'}</span>
            </button>

            <button
              onClick={() => onNavigateToQuiz(associatedQuizId)}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{language === 'hi' ? 'अभ्यास प्रश्नोत्तरी दें' : 'Take Practice Quiz'}</span>
            </button>
          </div>
        </div>
      </article>
    </div>
  );
};
