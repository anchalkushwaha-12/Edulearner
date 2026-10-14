import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageToggle } from './LanguageToggle';
import { NetworkStatusBadge } from './NetworkStatusBadge';
import {
  GraduationCap,
  BookOpen,
  Bot,
  CheckSquare,
  BarChart2,
  Calendar,
  CloudOff,
  FileText,
  UserCheck,
  LogOut,
  Menu,
  X,
  User,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { user, logout, demoLogin } = useAuth();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: GraduationCap },
    { id: 'lessons', label: t('lessons'), icon: BookOpen },
    { id: 'ai-tutor', label: t('ai_tutor'), icon: Bot, highlight: true },
    { id: 'quizzes', label: t('quizzes'), icon: CheckSquare },
    { id: 'gap-analysis', label: t('gap_analysis'), icon: BarChart2 },
    { id: 'study-plan', label: t('study_plan'), icon: Calendar },
    { id: 'offline-hub', label: t('offline_hub'), icon: CloudOff },
    { id: 'documents', label: t('documents'), icon: FileText },
    ...(user?.role === 'teacher' ? [{ id: 'teacher', label: t('teacher_portal'), icon: UserCheck }] : []),
  ];

  const handleNavClick = (pageId: string) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-teal-700 to-emerald-800 bg-clip-text text-transparent">
                  LearnMate AI
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-teal-100 text-teal-800">
                  SDG 4
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Quality Education for Every Student
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden xl:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-teal-50 text-teal-700 font-bold border border-teal-200/80 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    } ${item.highlight && !isActive ? 'text-teal-600 font-semibold' : ''}`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                    {item.highlight && (
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right Toolbar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <NetworkStatusBadge />
            <LanguageToggle />

            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('profile')}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition text-left cursor-pointer"
                  title="Profile & Settings"
                >
                  <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs border border-teal-300">
                    {user.full_name.charAt(0)}
                  </div>
                  <div className="hidden lg:block text-xs">
                    <p className="font-semibold text-slate-800 leading-none">{user.full_name.split(' ')[0]}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Gr {user.grade} • {user.role}</p>
                  </div>
                </button>
                <button
                  onClick={() => logout()}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title={t('logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                >
                  {t('login')}
                </button>
                <button
                  onClick={() => demoLogin('student')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('demo_student_btn')}</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && user && (
        <div className="xl:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg animate-in fade-in duration-150">
          <div className="p-2 mb-2 bg-slate-50 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">{user.full_name}</p>
              <p className="text-xs text-slate-500">{user.email} • Grade {user.grade}</p>
            </div>
            <button
              onClick={() => handleNavClick('profile')}
              className="text-xs font-semibold text-teal-600 hover:underline"
            >
              Settings
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-bold border border-teal-200'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
