import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { StudyPlanResponse, StudyPlanTask } from '../types';
import {
  Calendar,
  Clock,
  CheckCircle2,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export const StudyPlanPage: React.FC<{
  onNavigateToLesson: (lessonId?: string) => void;
  onNavigateToQuiz: (topic: string) => void;
}> = ({ onNavigateToLesson, onNavigateToQuiz }) => {
  const { t, language } = useLanguage();

  const [planData, setPlanData] = useState<StudyPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await api.getTodayStudyPlan();
      setPlanData(res);
    } catch (err) {
      console.error('Plan fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const handleToggleTask = async (task: StudyPlanTask) => {
    setUpdatingTaskId(task.id);
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.updateTaskStatus(task.id, newStatus);
      fetchPlan();
    } catch (err) {
      alert('Failed to update task status.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleReschedule = async (task: StudyPlanTask) => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setUpdatingTaskId(task.id);
    try {
      await api.updateTaskStatus(task.id, 'rescheduled', tomorrow);
      fetchPlan();
    } catch (err) {
      alert('Failed to reschedule task.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const tasks = planData?.plan?.tasks || [];
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;
  const budget = planData?.daily_study_minutes_budget || 45;
  const totalAllocated = planData?.total_allocated_minutes || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">{t('study_plan')}</h1>
        <p className="text-xs text-slate-500 mt-1">
          {language === 'hi'
            ? 'आपके दैनिक समय और सीखने के अंतरालों के अनुसार तैयार की गई कार्ययोजना'
            : 'Personalized daily study tasks budgeted strictly to your available study time.'}
        </p>
      </div>

      {/* Daily Time Budget Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Today’s Study Budget</h2>
              <p className="text-xs text-slate-500">
                {totalAllocated} mins scheduled / {budget} mins available daily
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-800 self-start">
            {completedCount} of {totalCount} Tasks Completed
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-teal-600 transition-all duration-300"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-slate-900 text-base">Scheduled Learning Tasks</h3>

        {loading ? (
          <p className="text-xs text-slate-400">Loading daily tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No tasks scheduled for today.</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`p-5 rounded-2xl border transition space-y-3 ${
                task.status === 'completed'
                  ? 'bg-slate-50/70 border-slate-200 opacity-80'
                  : task.status === 'rescheduled'
                  ? 'bg-amber-50/40 border-amber-200'
                  : 'bg-white border-slate-200 hover:border-teal-300 shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleTask(task)}
                    disabled={updatingTaskId === task.id}
                    className={`mt-1 w-5 h-5 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                      task.status === 'completed'
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 hover:border-teal-500'
                    }`}
                  >
                    {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 fill-current" />}
                  </button>

                  <div>
                    <h4 className={`text-sm font-bold ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {language === 'hi' ? task.title_hi : task.title_en}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                        {task.subject}
                      </span>
                      <span>•</span>
                      <span>{task.estimated_minutes} {t('minutes')}</span>
                      <span>•</span>
                      <span>Due: {task.due_date}</span>
                    </div>
                  </div>
                </div>

                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  task.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                  task.status === 'rescheduled' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {task.status}
                </span>
              </div>

              {/* Rationale explanation */}
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-700">Why recommended: </span>
                <span>{language === 'hi' ? task.reason_hi : task.reason_en}</span>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                {task.status !== 'completed' && (
                  <button
                    onClick={() => handleReschedule(task)}
                    className="text-xs font-semibold text-slate-500 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reschedule for Tomorrow</span>
                  </button>
                )}

                <div className="ml-auto">
                  {task.lesson_id ? (
                    <button
                      onClick={() => onNavigateToLesson(task.lesson_id)}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Open Lesson</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onNavigateToQuiz(task.topic)}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Take Practice Quiz</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
