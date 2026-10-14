import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import { api } from '../services/api';
import { Lesson } from '../types';
import {
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  Download,
  Check,
  Sparkles,
  BarChart
} from 'lucide-react';

export const LessonLibraryPage: React.FC<{
  onSelectLesson: (lessonId: string) => void;
  filterTopic?: string;
}> = ({ onSelectLesson, filterTopic }) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { isLessonDownloaded, toggleDownloadLesson, isOnline, downloadedLessons } = useOffline();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(filterTopic || '');
  const [selectedGrade, setSelectedGrade] = useState<number | ''>(user?.grade || '');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');

  const fetchLessons = async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const res = await api.getLessons({
          grade: selectedGrade ? Number(selectedGrade) : undefined,
          subject: selectedSubject || undefined,
          search: searchTerm || undefined,
          difficulty: selectedDifficulty || undefined,
        });
        setLessons(res.lessons);
      } else {
        // Fallback to downloaded lessons when offline
        let list = [...downloadedLessons];
        if (selectedGrade) list = list.filter(l => l.grade === Number(selectedGrade));
        if (selectedSubject) list = list.filter(l => l.subject === selectedSubject);
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          list = list.filter(l => l.title_en.toLowerCase().includes(q) || l.title_hi.toLowerCase().includes(q) || l.topic.toLowerCase().includes(q));
        }
        setLessons(list);
      }
    } catch (err) {
      console.error('Fetch lessons error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [selectedGrade, selectedSubject, selectedDifficulty, isOnline]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLessons();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{t('lessons')}</h1>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'hi' ? 'एनसीईआरटी और राज्य बोर्ड आधारित अध्याय' : 'NCERT & State Board Aligned Core Curriculum'}
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-72 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'hi' ? 'पाठ या विषय खोजें...' : 'Search lessons or topics...'}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>
      </div>

      {/* Filter Chips */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1 mr-2">
            <Filter className="w-3.5 h-3.5" /> {language === 'hi' ? 'फ़िल्टर:' : 'Filter:'}
          </span>

          {/* Grade Chips */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedGrade('')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                selectedGrade === '' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Grades
            </button>
            {[6, 7, 8, 9, 10].map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  selectedGrade === g ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Gr {g}
              </button>
            ))}
          </div>

          <span className="text-slate-300 hidden sm:inline">|</span>

          {/* Subject Chips */}
          <div className="flex flex-wrap items-center gap-1">
            {['', 'Mathematics', 'Science', 'Social Science'].map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  selectedSubject === sub ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sub === '' ? 'All Subjects' : sub}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lessons List Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Loading lessons catalog...
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No lessons match your filters</h3>
          <p className="text-xs text-slate-500">Try clearing your search query or grade filter.</p>
          <button
            onClick={() => { setSelectedGrade(''); setSelectedSubject(''); setSearchTerm(''); }}
            className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 font-bold text-xs"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => {
            const downloaded = isLessonDownloaded(lesson.id);
            return (
              <div
                key={lesson.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-teal-300 transition flex flex-col justify-between p-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      Grade {lesson.grade} • {lesson.subject}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm ${
                      lesson.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700' :
                      lesson.difficulty === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {lesson.difficulty}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                    {language === 'hi' ? lesson.title_hi : lesson.title_en}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {language === 'hi' ? lesson.summary_hi : lesson.summary_en}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDownloadLesson(lesson);
                    }}
                    className={`p-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1 cursor-pointer ${
                      downloaded
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                    title={downloaded ? 'Downloaded offline' : 'Download for offline use'}
                  >
                    {downloaded ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                    <span className="text-[10px]">{downloaded ? 'Saved' : 'Save'}</span>
                  </button>

                  <button
                    onClick={() => onSelectLesson(lesson.id)}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer ml-auto"
                  >
                    <span>{language === 'hi' ? 'पाठ पढ़ें' : 'Read Lesson'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
