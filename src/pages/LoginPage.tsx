import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { GraduationCap, Lock, Mail, ArrowRight, Sparkles, Users, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { login, demoLogin } = useAuth();
  const { t, language } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role: 'student' | 'teacher') => {
    setError('');
    setLoading(true);
    try {
      await demoLogin(role);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
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
          {language === 'hi' ? 'लर्नमेट AI में प्रवेश करें' : 'Sign in to LearnMate AI'}
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500">
          {t('sdg_tag')}
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
                {language === 'hi' ? 'पासवर्ड (Password)' : 'Password'}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Logging in...' : t('login')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <p className="text-center text-xs font-semibold text-slate-500 mb-3">
              {language === 'hi' ? 'या तुरंत एक क्लिक में आज़माएँ (डेमो मोड)' : 'Or test immediately with 1-click demo accounts'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemo('student')}
                disabled={loading}
                className="py-2.5 px-3 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Demo Student</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemo('teacher')}
                disabled={loading}
                className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-slate-600" />
                <span>Demo Teacher</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-600">
              {language === 'hi' ? 'नया छात्र खाता नहीं है?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="font-bold text-teal-600 hover:text-teal-700 hover:underline cursor-pointer"
              >
                {t('register')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
