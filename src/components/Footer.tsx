import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { GraduationCap, Heart, ShieldCheck, WifiOff, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-white text-lg tracking-tight">LearnMate AI</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-teal-900/80 text-teal-300 border border-teal-700">
                UN SDG 4
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              {t('tagline')}. Built specifically for students in rural India to democratize access to high-quality tutoring, foundational mastery, and offline-resilient digital education.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> NCERT Aligned
              </span>
              <span className="inline-flex items-center gap-1">
                <WifiOff className="w-3.5 h-3.5 text-amber-400" /> Offline Resilient
              </span>
              <span className="inline-flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-emerald-400" /> Hindi & English
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Core Pillars</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>• Socratic Multilingual AI Tutor</li>
              <li>• Rule-based Mastery & Gap Engine</li>
              <li>• Document-grounded Learning</li>
              <li>• Daily Time-budgeted Study Plans</li>
              <li>• Classroom Analytics for Teachers</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Student Privacy & Trust</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              We uphold strict student data isolation. Passwords use bcrypt hashing, private student AI conversations are never shared, and no personal data is collected unnecessarily.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© 2026 LearnMate AI. Dedicated to rural students across India.</p>
          <p className="flex items-center gap-1">
            Aligned with UN SDG 4 — Quality Education <Heart className="w-3.5 h-3.5 text-rose-500 fill-current ml-1" />
          </p>
        </div>
      </div>
    </footer>
  );
};
