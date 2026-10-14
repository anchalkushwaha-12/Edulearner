import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import { api } from '../services/api';
import {
  GraduationCap,
  BookOpen,
  Bot,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Calendar,
  CloudOff,
  UserCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  Plus
} from 'lucide-react';
import { TopicMasteryItem, StudyPlanResponse, ClassItem, AssignmentItem } from '../types';

export const StudentDashboard: React.FC<{ onNavigate: (page: string, meta?: any) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { isOnline, downloadedLessons } = useOffline();

  const [loading, setLoading] = useState(true);
  const [masteryTopics, setMasteryTopics] = useState<TopicMasteryItem[]>([]);
  const [studyPlanData, setStudyPlanData] = useState<StudyPlanResponse | null>(null);
  const [myClasses, setMyClasses] = useState<{ enrolled_classes: ClassItem[]; assignments: AssignmentItem[] }>({
    enrolled_classes: [],
    assignments: [],
  });
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinStatus, setJoinStatus] = useState('');
  const [joining, setJoining] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [mRes, spRes, clsRes] = await Promise.allSettled([
        api.getMastery(),
        api.getTodayStudyPlan(),
        api.getMyClasses(),
      ]);

      if (mRes.status === 'fulfilled') setMasteryTopics(mRes.value.topics);
      if (spRes.status === 'fulfilled') setStudyPlanData(spRes.value);
      if (clsRes.status === 'fulfilled') setMyClasses(clsRes.value);
    } catch (err) {
      console.warn('Dashboard loading note:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setJoining(true);
    setJoinStatus('');
    try {
      const res = await api.joinClass(joinCodeInput.trim());
      setJoinStatus(res.message);
      setJoinCodeInput('');
      const updated = await api.getMyClasses();
      setMyClasses(updated);
    } catch (err: any) {
      setJoinStatus(err.message || 'Failed to join class.');
    } finally {
      setJoining(false);
    }
  };

  const gapTopics = masteryTopics.filter(m => m.mastery_status === 'needs_revision');
  const completedTasksCount = studyPlanData?.plan?.tasks.filter(t => t.status === 'completed').length || 0;
  const totalTasksCount = studyPlanData?.plan?.tasks.length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-850 text-white p-6 sm:p-8 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-600/40 border border-teal-400/30 text-teal-200 text-xs font-semibold">
              <span>{language === 'hi' ? 'नमस्ते' : 'Welcome back'}, {user?.full_name}!</span>
              <span>•</span>
              <span>{language === 'hi' ? `कक्षा ${user?.grade}` : `Grade ${user?.grade}`}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {language === 'hi' ? 'आज आपकी सीखने की क्या योजना है?' : "What would you like to master today?"}
            </h1>
            <p className="text-teal-100/80 text-xs sm:text-sm">
              {user?.school_name ? `${user.school_name} • ` : ''}
              {t('sdg_tag')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('ai-tutor')}
              className="px-4 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-teal-950 font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>{t('ask_ai')}</span>
            </button>
            <button
              onClick={() => onNavigate('study-plan')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>{t('study_plan')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critical Learning Gap Alert Card (if any gap detected) */}
      {gapTopics.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-amber-900">
                  {language === 'hi'
                    ? `⚠️ सीखने में अंतराल पाया गया: ${gapTopics[0].topic}`
                    : `⚠️ Learning Gap Detected: ${gapTopics[0].topic}`}
                </h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-800 self-start">
                  {Math.round(gapTopics[0].observed_accuracy * 100)}% Accuracy
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                {language === 'hi'
                  ? gapTopics[0].recommendations[0]?.message_hi || 'इस विषय के मुख्य नियमों को दोहराएँ ताकि अवधारणा स्पष्ट हो सके।'
                  : gapTopics[0].recommendations[0]?.message_en || 'Review the core concepts before attempting further questions.'}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => onNavigate('lessons', { topic: gapTopics[0].topic })}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'पाठ दोहराएँ' : 'Review Lesson'}</span>
                </button>
                <button
                  onClick={() => onNavigate('ai-tutor', { topic: gapTopics[0].topic, request_type: 'hint' })}
                  className="px-3 py-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Bot className="w-3.5 h-3.5 text-amber-800" />
                  <span>{language === 'hi' ? 'AI से संकेत लें' : 'Get AI Hint'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Study Plan + Quick Nav */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Study Plan & Daily Budget */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base">{t('study_plan')}</h2>
                  <p className="text-xs text-slate-500">
                    {studyPlanData?.daily_study_minutes_budget || 45} {t('minutes')} daily budget
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {completedTasksCount}/{totalTasksCount} {t('completed')}
              </span>
            </div>

            {/* Task list preview */}
            <div className="space-y-3">
              {studyPlanData?.plan?.tasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                    task.status === 'completed'
                      ? 'bg-slate-50/80 border-slate-200 opacity-75'
                      : 'bg-white border-slate-200 hover:border-teal-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center ${
                      task.status === 'completed' ? 'bg-emerald-500 text-white' : 'border border-slate-300'
                    }`}>
                      {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 fill-current" />}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                        {language === 'hi' ? task.title_hi : task.title_en}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {task.subject} • {task.estimated_minutes} {t('minutes')} • {language === 'hi' ? task.reason_hi : task.reason_en}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate(task.lesson_id ? 'lessons' : 'quizzes', { lesson_id: task.lesson_id, topic: task.topic })}
                    className="shrink-0 p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition"
                    title="Open task"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => onNavigate('study-plan')}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 justify-end ml-auto cursor-pointer"
              >
                <span>View Full Schedule & Tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={() => onNavigate('lessons')}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-xs transition text-left cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{t('lessons')}</h4>
              <p className="text-[11px] text-slate-500 mt-1">NCERT Syllabus</p>
            </button>

            <button
              onClick={() => onNavigate('quizzes')}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-xs transition text-left cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{t('quizzes')}</h4>
              <p className="text-[11px] text-slate-500 mt-1">Server Scored</p>
            </button>

            <button
              onClick={() => onNavigate('gap-analysis')}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-xs transition text-left cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{t('gap_analysis')}</h4>
              <p className="text-[11px] text-slate-500 mt-1">Rule Engine</p>
            </button>

            <button
              onClick={() => onNavigate('offline-hub')}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-xs transition text-left cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <CloudOff className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{t('offline_hub')}</h4>
              <p className="text-[11px] text-slate-500 mt-1">{downloadedLessons.length} Downloaded</p>
            </button>
          </div>
        </div>

        {/* Right Column (1 Col): Class Enrollment & Assignments */}
        <div className="space-y-6">
          {/* Join Class Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{t('join_class')}</h3>
                <p className="text-[11px] text-slate-500">Enter code provided by teacher</p>
              </div>
            </div>

            <form onSubmit={handleJoinClass} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. MA8K29"
                  maxLength={10}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono uppercase tracking-wider focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  disabled={joining || !joinCodeInput.trim()}
                  className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Join</span>
                </button>
              </div>
              {joinStatus && (
                <p className={`text-xs ${joinStatus.includes('Success') || joinStatus.includes('joined') ? 'text-emerald-700' : 'text-slate-600'}`}>
                  {joinStatus}
                </p>
              )}
            </form>

            {/* Enrolled Classes List */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {language === 'hi' ? 'मेरी कक्षाएँ' : 'My Enrolled Classes'} ({myClasses.enrolled_classes.length})
              </h4>
              {myClasses.enrolled_classes.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No classes joined yet.</p>
              ) : (
                myClasses.enrolled_classes.map((cls) => (
                  <div key={cls.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <p className="font-bold text-slate-800">{cls.name}</p>
                    <p className="text-[11px] text-slate-500">Grade {cls.grade} • {cls.subject} • Code: {cls.join_code}</p>
                  </div>
                ))
              )}
            </div>

            {/* Class Assignments */}
            {myClasses.assignments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {language === 'hi' ? 'शिक्षक द्वारा गृहकार्य' : 'Assigned Homework'}
                </h4>
                {myClasses.assignments.map((asg) => (
                  <div key={asg.id} className="p-2.5 bg-teal-50/50 rounded-xl border border-teal-200 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{asg.title}</p>
                      <p className="text-[10px] text-slate-500">Due: {asg.due_date}</p>
                    </div>
                    {asg.quiz_id && (
                      <button
                        onClick={() => onNavigate('quizzes', { quiz_id: asg.quiz_id })}
                        className="px-2 py-1 bg-teal-600 text-white rounded-md text-[10px] font-bold"
                      >
                        Start
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
