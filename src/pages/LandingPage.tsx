import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  GraduationCap,
  Sparkles,
  WifiOff,
  BookOpen,
  Bot,
  BarChart2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Languages,
  Users,
  Compass
} from 'lucide-react';

export const LandingPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { demoLogin } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-900 via-teal-800 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
            <span>UN SDG 4 — Quality Education for Rural India</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight sm:leading-none">
            {language === 'hi' ? (
              <>हर छात्र के लिए, हर जगह <span className="text-teal-300 underline decoration-teal-400/50">गुणवत्तापूर्ण शिक्षा</span></>
            ) : (
              <>Quality Education for <span className="text-teal-300 underline decoration-teal-400/50">Every Student</span>, Everywhere</>
            )}
          </h1>

          <p className="text-lg sm:text-xl text-teal-100/90 max-w-3xl mx-auto font-normal leading-relaxed">
            {language === 'hi'
              ? 'ग्रामीण स्कूलों के विद्यार्थियों के लिए व्यक्तिगत AI शिक्षक, ऑफलाइन अध्ययन सामग्री, सीखने के अंतराल (Learning Gaps) की पहचान और कक्षा 6 से 10 तक का एनसीईआरटी पाठ्यक्रम।'
              : 'Empowering students in rural schools with a bilingual Socratic AI tutor, offline-resilient lesson packs, transparent learning gap detection, and NCERT-aligned curriculum in Hindi & English.'}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => onNavigate('register')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-teal-400 hover:bg-teal-300 text-teal-950 shadow-lg shadow-teal-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t('start_learning')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => demoLogin('student')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-teal-300" />
              <span>{t('demo_student_btn')}</span>
            </button>

            <button
              onClick={() => demoLogin('teacher')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-slate-800/80 hover:bg-slate-800 text-teal-200 border border-teal-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4 text-teal-300" />
              <span>{t('demo_teacher_btn')}</span>
            </button>
          </div>

          {/* Value Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-teal-200 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" /> 100% Free for Rural Students
            </span>
            <span className="flex items-center gap-1.5">
              <WifiOff className="w-4 h-4 text-amber-300" /> Offline Download & Sync
            </span>
            <span className="flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-emerald-300" /> Hindi & English Bilingual
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-300" /> Strict Data Isolation
            </span>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {language === 'hi' ? 'ग्रामीण भारत की वास्तविकताओं के लिए डिज़ाइन किया गया' : 'Engineered for Rural Realities'}
          </h2>
          <p className="mt-3 text-slate-600 text-sm">
            Addressing uneven internet connectivity, lack of individual tutors, and regional language barriers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {language === 'hi' ? 'सोक्रेटिक AI शिक्षक' : 'Socratic Multilingual AI Tutor'}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {language === 'hi'
                ? 'सीधे उत्तर देने के बजाय छात्रों को सोचने और स्वयं समस्या हल करने के लिए संकेत (Hints) और गाँव के जीवन से जुड़े उदाहरण देता है।'
                : 'Provides step-by-step reasoning, real-world village analogies (farming acreage, solar pumps), and voice input/output in Hindi and English.'}
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <WifiOff className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {language === 'hi' ? 'ऑफलाइन अध्ययन और सिंक' : 'Offline First & Idempotent Sync'}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {language === 'hi'
                ? 'इंटरनेट न होने पर भी डाउनलोड किए गए पाठ पढ़ें और प्रश्नोत्तरी हल करें। नेटवर्क वापस आने पर प्रगति सुरक्षित रूप से सिंक होती है।'
                : 'Students can download lessons and take quizzes without connectivity. Submissions are queued with unique IDs to prevent duplicate scores.'}
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {language === 'hi' ? 'पारदर्शी अंतराल पहचान' : 'Rule-Based Learning Gap Engine'}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {language === 'hi'
                ? 'सटीकता फॉर्मूले और न्यूनतम साक्ष्य नियमों के आधार पर यह पता लगाता है कि छात्र को किस विषय में दोहराव की आवश्यकता है।'
                : 'Deterministic accuracy thresholds identify when students need revision, developing progress, or demonstrated proficiency without black-box scores.'}
            </p>
          </div>
        </div>
      </section>

      {/* Curriculum Showcase */}
      <section className="bg-slate-100 py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                {language === 'hi' ? 'पाठ्यक्रम पूर्वावलोकन (कक्षा 6 से 10)' : 'NCERT Curriculum Catalog (Grades 6–10)'}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Mathematics, Science, Social Science, Hindi, and English.
              </p>
            </div>
            <button
              onClick={() => onNavigate('lessons')}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>{t('explore_lessons')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-teal-600 uppercase">Grade 7 • Mathematics</span>
              <h4 className="font-bold text-slate-900 mt-1">Fractions & Decimals in Daily Life</h4>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                दैनिक जीवन में भिन्न और दशमलव की समझ (Acreage & crop splitting).
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-teal-600 uppercase">Grade 8 • Science</span>
              <h4 className="font-bold text-slate-900 mt-1">Photosynthesis & Plant Nutrition</h4>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                पौधे भोजन कैसे बनाते हैं (Chlorophyll, Stomata & Solar energy).
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-teal-600 uppercase">Grade 9 • Mathematics</span>
              <h4 className="font-bold text-slate-900 mt-1">Linear Equations in Two Variables</h4>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                दो चरों वाले रैखिक समीकरण (Agricultural produce pricing & budgeting).
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-teal-600 uppercase">Grade 10 • Science</span>
              <h4 className="font-bold text-slate-900 mt-1">Electricity & Ohm’s Law</h4>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                विद्युत परिपथ, विभवांतर और ओम का नियम (Solar pumps and wiring).
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
