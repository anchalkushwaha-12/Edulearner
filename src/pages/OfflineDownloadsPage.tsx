import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import {
  CloudOff,
  Wifi,
  RefreshCw,
  BookOpen,
  Trash2,
  CheckCircle2,
  ArrowRight,
  DownloadCloud,
  CheckSquare,
  ShieldCheck
} from 'lucide-react';

export const OfflineDownloadsPage: React.FC<{
  onSelectLesson: (id: string) => void;
}> = ({ onSelectLesson }) => {
  const { t, language } = useLanguage();
  const {
    isOnline,
    downloadedLessons,
    downloadedQuizzes,
    pendingSyncCount,
    syncNow,
    refreshOfflineData,
    toggleDownloadLesson
  } = useOffline();

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg('');
    const res = await syncNow();
    setSyncMsg(res.message);
    setSyncing(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">{t('offline_hub')}</h1>
        <p className="text-xs text-slate-500 mt-1">
          {language === 'hi'
            ? 'ऑफलाइन अध्ययन सामग्री, डाउनलोड किए गए पाठ और सुरक्षित सिंक प्रबंधन'
            : 'Access downloaded lessons and offline quiz attempts without internet connection.'}
        </p>
      </div>

      {/* Sync Status Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {isOnline ? <Wifi className="w-6 h-6" /> : <CloudOff className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Connection Status: {isOnline ? 'Online (इंटरनेट सक्रिय)' : 'Offline (कैश्ड मोड)'}
              </h2>
              <p className="text-xs text-slate-500">
                {pendingSyncCount} operations queued for idempotent cloud synchronization
              </p>
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={!isOnline || syncing || pendingSyncCount === 0}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Pending Items'}</span>
          </button>
        </div>

        {syncMsg && (
          <p className="text-xs font-semibold text-teal-800 bg-teal-50 p-3 rounded-xl border border-teal-200">
            {syncMsg}
          </p>
        )}
      </div>

      {/* Downloaded Lessons Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" />
            <span>Downloaded Lessons for Offline Study ({downloadedLessons.length})</span>
          </h2>
        </div>

        {downloadedLessons.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs space-y-2">
            <DownloadCloud className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No lessons downloaded yet.</p>
            <p className="text-[11px] text-slate-400">Open any lesson in the Lesson Library and click "Save Offline".</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {downloadedLessons.map((les) => (
              <div key={les.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                    Grade {les.grade} • {les.subject}
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mt-1">
                    {language === 'hi' ? les.title_hi : les.title_en}
                  </h4>
                  <p className="text-[11px] text-slate-500">{les.topic}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleDownloadLesson(les)}
                    className="p-2 text-slate-400 hover:text-rose-600 transition"
                    title="Remove from offline cache"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onSelectLesson(les.id)}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>Read Offline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Offline Reliability Notes */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Offline De-duplication Guarantee</span>
        </h4>
        <p className="leading-relaxed">
          Every offline quiz submission and lesson completion generates an immutable client operation UUID. When internet access resumes, submissions are verified against processed server logs so attempts and grades are never counted twice.
        </p>
      </div>
    </div>
  );
};
