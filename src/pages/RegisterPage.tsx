import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { GraduationCap, Lock, Mail, User, School, ArrowRight, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { register } = useAuth();
  const { t, language } = useLanguage();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [grade, setGrade] = useState<number>(8);
  const [schoolName, setSchoolName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(language === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: fullName,
        email,
        password,
        role,
        grade,
        language,
        school_name: schoolName,
      });
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-900">
          {language === 'hi' ? 'नया खाता बनाएँ' : 'Create your account'}
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500">
          {language === 'hi' ? 'गुणवत्तापूर्ण शिक्षा हर छात्र का अधिकार है' : 'Free, accessible education for every student'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-lg rounded-2xl border border-slate-200">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'hi' ? 'आप कौन हैं? (Role)' : 'I am a'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    role === 'student'
                      ? 'bg-teal-50 border-teal-500 text-teal-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t('role_student')}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    role === 'teacher'
                      ? 'bg-teal-50 border-teal-500 text-teal-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t('role_teacher')}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'hi' ? 'पूरा नाम (Full Name)' : 'Full Name'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={language === 'hi' ? 'जैसे: आरव पटेल' : 'e.g. Aarav Patel'}
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'hi' ? 'ईमेल पता (Email)' : 'Email address'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@rural.in"
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'hi' ? 'पासवर्ड (कम से कम 6 अक्षर)' : 'Password (min 6 characters)'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            {role === 'student' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'hi' ? 'कक्षा (Grade)' : 'Class / Grade'}
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="block w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  {[6, 7, 8, 9, 10].map((g) => (
                    <option key={g} value={g}>
                      {language === 'hi' ? `कक्षा ${g} (Grade ${g})` : `Grade ${g}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'hi' ? 'स्कूल का नाम (School Name, वैकल्पिक)' : 'School Name (Optional)'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <School className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder={language === 'hi' ? 'जैसे: राजकीय उच्च विद्यालय' : 'e.g. Govt. Model School'}
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Creating Account...' : t('register')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-600">
              {language === 'hi' ? 'पहले से खाता है?' : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="font-bold text-teal-600 hover:text-teal-700 hover:underline cursor-pointer"
              >
                {t('login')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
