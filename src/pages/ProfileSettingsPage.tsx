import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { User, Globe, School, Clock, Check, ShieldCheck, LogOut } from 'lucide-react';

export const ProfileSettingsPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user, profile, updateProfile, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [grade, setGrade] = useState(user?.grade || 8);
  const [schoolName, setSchoolName] = useState(user?.school_name || '');
  const [dailyMinutes, setDailyMinutes] = useState(profile?.daily_study_minutes || 45);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateProfile({
        full_name: fullName,
        grade,
        school_name: schoolName,
        daily_study_minutes: dailyMinutes,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Failed to update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">{t('profile_settings')}</h1>
        <p className="text-xs text-slate-500 mt-1">
          {language === 'hi'
            ? 'अपनी कक्षा, भाषा और दैनिक अध्ययन समय की प्राथमिकताएँ प्रबंधित करें'
            : 'Manage your grade level, language preference, and daily study time.'}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Profile settings saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email (Readonly) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email (Account ID)</label>
            <input
              type="text"
              disabled
              value={user?.email || ''}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-mono"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Primary Language (प्राथमिक भाषा)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`p-3 rounded-xl border text-xs font-bold transition ${
                  language === 'hi'
                    ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                हिन्दी (Hindi)
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`p-3 rounded-xl border text-xs font-bold transition ${
                  language === 'en'
                    ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Grade */}
          {user?.role === 'student' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">School Class / Grade</label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              >
                {[6, 7, 8, 9, 10].map((g) => (
                  <option key={g} value={g}>Grade {g} (कक्षा {g})</option>
                ))}
              </select>
            </div>
          )}

          {/* Daily Study Budget */}
          {user?.role === 'student' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Daily Available Study Time (दैनिक अध्ययन समय)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDailyMinutes(mins)}
                    className={`p-3 rounded-xl border text-xs font-bold transition ${
                      dailyMinutes === mins
                        ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {mins} {t('minutes')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* School Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">School Name</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="e.g. Govt. Senior Secondary School"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={async () => {
                await logout();
                onNavigate('landing');
              }}
              className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('logout')}</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
