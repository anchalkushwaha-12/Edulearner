import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ClassItem, AssignmentItem } from '../types';
import {
  UserCheck,
  Plus,
  Users,
  BarChart2,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  BookOpen
} from 'lucide-react';

export const TeacherDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // New Class Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [className, setClassName] = useState('');
  const [classGrade, setClassGrade] = useState<number>(8);
  const [classSubject, setClassSubject] = useState('Mathematics');
  const [creating, setCreating] = useState(false);

  // New Assignment Form State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [asgTitle, setAsgTitle] = useState('');
  const [asgDesc, setAsgDesc] = useState('');
  const [asgDueDate, setAsgDueDate] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Class Analytics State
  const [analytics, setAnalytics] = useState<{
    classroom: ClassItem;
    total_students: number;
    students: any[];
    total_quiz_attempts: number;
    average_accuracy: number;
    topic_gaps: Array<{
      topic: string;
      attempts: number;
      accuracy: number;
      gap_severity: 'critical' | 'moderate' | 'low';
      suggested_action: string;
    }>;
  } | null>(null);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await api.getTeacherClasses();
      setClasses(res.classes);
      if (res.classes.length > 0 && !selectedClassId) {
        setSelectedClassId(res.classes[0].id);
      }
    } catch (err) {
      console.error('Fetch teacher classes error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedClassId) return;
      try {
        const data = await api.getClassAnalytics(selectedClassId);
        setAnalytics(data);
      } catch (err) {
        console.error('Fetch analytics error:', err);
      }
    };
    fetchAnalytics();
  }, [selectedClassId]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;
    setCreating(true);
    try {
      const res = await api.createClass({
        name: className.trim(),
        grade: classGrade,
        subject: classSubject,
      });
      setClassName('');
      setShowCreateModal(false);
      await fetchClasses();
      setSelectedClassId(res.classroom.id);
    } catch (err: any) {
      alert(err.message || 'Failed to create class.');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !asgTitle.trim()) return;
    setAssigning(true);
    try {
      await api.createAssignment(selectedClassId, {
        title: asgTitle.trim(),
        description: asgDesc.trim(),
        due_date: asgDueDate || undefined,
      });
      setAsgTitle('');
      setAsgDesc('');
      setShowAssignModal(false);
      alert('Assignment assigned to class!');
    } catch (err: any) {
      alert(err.message || 'Failed to create assignment.');
    } finally {
      setAssigning(false);
    }
  };

  const copyJoinCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{t('teacher_portal')}</h1>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'hi'
              ? 'कक्षा प्रबंधन, छात्र नामांकन कोड और सामूहिक सीखने के अंतरालों का विश्लेषण'
              : 'Classroom management, student enrollments, and aggregate learning gap analytics.'}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('create_class')}</span>
        </button>
      </div>

      {/* Class Selector Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {classes.map((cls) => (
          <button
            key={cls.id}
            onClick={() => setSelectedClassId(cls.id)}
            className={`px-4 py-3 rounded-2xl border text-left shrink-0 transition cursor-pointer ${
              selectedClassId === cls.id
                ? 'bg-teal-50 border-teal-500 text-teal-950 shadow-2xs font-bold'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs font-bold leading-tight">{cls.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Grade {cls.grade} • {cls.subject}</p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-white px-2 py-1 rounded-md border border-slate-200">
                Code: {cls.join_code}
              </span>
            </div>
          </button>
        ))}
      </div>

      {analytics ? (
        <div className="space-y-6">
          {/* Analytics Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold uppercase text-slate-500">Enrolled Students</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{analytics.total_students}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-slate-600 font-mono">Join Code: {analytics.classroom.join_code}</span>
                <button
                  onClick={() => copyJoinCode(analytics.classroom.join_code)}
                  className="p-1 text-slate-400 hover:text-teal-600 transition"
                  title="Copy Join Code"
                >
                  {copiedCode === analytics.classroom.join_code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold uppercase text-slate-500">Total Quiz Attempts</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{analytics.total_quiz_attempts}</p>
              <p className="text-[11px] text-slate-400 mt-1">Classroom assessments completed</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold uppercase text-slate-500">Class Average Accuracy</span>
              <p className="text-2xl font-extrabold text-teal-700 mt-1">{analytics.average_accuracy}%</p>
              <p className="text-[11px] text-slate-400 mt-1">Based on verified quiz submissions</p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Assign Homework to Class</span>
            </button>
          </div>

          {/* Classroom Topic-Level Learning Gap Summary */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">Classroom Topic Gap Summary</h2>
                <p className="text-xs text-slate-500">Identifies topics where students are collectively struggling.</p>
              </div>
            </div>

            {analytics.topic_gaps.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                No assessments taken by enrolled students yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {analytics.topic_gaps.map((gap, i) => (
                  <div key={i} className="py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">{gap.topic}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        gap.gap_severity === 'critical' ? 'bg-rose-100 text-rose-800' :
                        gap.gap_severity === 'moderate' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {gap.accuracy}% Accuracy ({gap.gap_severity})
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Remedial Action for Teacher: </span>
                      <span>{gap.suggested_action}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enrolled Students Roster */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="font-extrabold text-slate-900 text-base">
              Enrolled Students Roster ({analytics.students.length})
            </h2>
            <p className="text-xs text-slate-500">
              Student privacy is strictly maintained. Individual private AI tutor conversations are never disclosed to teachers.
            </p>

            {analytics.students.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Share join code <strong className="font-mono text-teal-700">{analytics.classroom.join_code}</strong> with your students to enroll them.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {analytics.students.map((st) => (
                  <div key={st.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <p className="font-bold text-slate-900">{st.full_name}</p>
                    <p className="text-slate-500 mt-0.5">{st.email}</p>
                    <p className="text-[11px] text-teal-700 mt-1">Grade {st.grade}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Class Selected</h3>
          <p className="text-xs text-slate-500">Create your first class to start tracking student progress.</p>
        </div>
      )}

      {/* Modal: Create Class */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">{t('create_class')}</h3>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Class Name</label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g. Class 8-B Mathematics"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Grade</label>
                <select
                  value={classGrade}
                  onChange={(e) => setClassGrade(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                >
                  {[6, 7, 8, 9, 10].map((g) => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <select
                  value={classSubject}
                  onChange={(e) => setClassSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="Social Science">Social Science</option>
                  <option value="English">English</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Homework */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Assign Homework to Class</h3>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  value={asgTitle}
                  onChange={(e) => setAsgTitle(e.target.value)}
                  placeholder="e.g. Practice Quiz: Fractions & Decimals"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instructions (Optional)</label>
                <textarea
                  rows={2}
                  value={asgDesc}
                  onChange={(e) => setAsgDesc(e.target.value)}
                  placeholder="Read Chapter 3 key points and complete quiz."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={asgDueDate}
                  onChange={(e) => setAsgDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  {assigning ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
