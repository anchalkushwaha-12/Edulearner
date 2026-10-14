import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  hi: {
    app_title: 'लर्नमेट AI (LearnMate)',
    tagline: 'हर छात्र के लिए, हर जगह गुणवत्तापूर्ण शिक्षा',
    sdg_tag: 'संयुक्त राष्ट्र सतत विकास लक्ष्य 4 — गुणवत्तापूर्ण शिक्षा',
    login: 'लॉग इन करें',
    register: 'नया खाता बनाएँ',
    logout: 'लॉग आउट',
    dashboard: 'डैशबोर्ड',
    lessons: 'पाठ्य सामग्री',
    ai_tutor: 'AI सहायक शिक्षक',
    quizzes: 'प्रश्नोत्तरी',
    gap_analysis: 'सीखने की प्रगति व अंतराल',
    study_plan: 'अध्ययन योजना',
    offline_hub: 'ऑफलाइन केंद्र',
    documents: 'दस्तावेज़ सीखें',
    teacher_portal: 'शिक्षक पोर्टल',
    profile_settings: 'प्रोफ़ाइल सेटिंग्स',
    online: 'ऑनलाइन',
    offline: 'ऑफलाइन (कैश्ड मोड)',
    sync_pending: 'सिंक लंबित',
    sync_now: 'अभी सिंक करें',
    start_learning: 'सीखना शुरू करें',
    grade: 'कक्षा',
    subject: 'विषय',
    explore_lessons: 'पाठ खोजें',
    ask_ai: 'AI से सवाल पूछें',
    voice_input: 'आवाज़ से पूछें',
    listen: 'सुनें (आवाज़)',
    stop_audio: 'आवाज़ रोकें',
    difficulty: 'कठिनाई स्तर',
    easy: 'सरल',
    medium: 'मध्यम',
    hard: 'कठिन',
    submit: 'जमा करें',
    next: 'अगला',
    previous: 'पिछला',
    score: 'प्राप्तांक',
    explanation: 'व्याख्या',
    hint: 'संकेत लें',
    completed: 'पूर्ण',
    pending: 'लंबित',
    reschedule: 'समय बदलें',
    minutes: 'मिनट',
    accuracy: 'सटीकता',
    mastery_status: 'दक्षता स्थिति',
    needs_revision: 'पुनरावलोकन आवश्यक',
    developing: 'प्रगति पर',
    demonstrated_proficiency: 'सिद्ध दक्षता',
    insufficient_evidence: 'अपर्याप्त साक्ष्य',
    download_lesson: 'ऑफलाइन सहेजें',
    downloaded: 'ऑफलाइन उपलब्ध',
    teacher_classes: 'कक्षाएँ',
    create_class: 'नई कक्षा बनाएँ',
    join_class: 'कक्षा में शामिल हों',
    join_code: 'कक्षा कोड',
    analytics: 'कक्षा विश्लेषण',
    assignments: 'गृहकार्य (Assignments)',
    role_student: 'छात्र',
    role_teacher: 'शिक्षक',
    demo_student_btn: 'डेमो छात्र के रूप में आज़माएँ',
    demo_teacher_btn: 'डेमो शिक्षक के रूप में आज़माएँ',
  },
  en: {
    app_title: 'LearnMate AI',
    tagline: 'Quality Education for Every Student, Everywhere',
    sdg_tag: 'UN Sustainable Development Goal 4 — Quality Education',
    login: 'Log In',
    register: 'Create Account',
    logout: 'Log Out',
    dashboard: 'Dashboard',
    lessons: 'Lessons',
    ai_tutor: 'AI Tutor',
    quizzes: 'Quizzes',
    gap_analysis: 'Learning Gaps & Progress',
    study_plan: 'Study Plan',
    offline_hub: 'Offline Hub',
    documents: 'Document Study',
    teacher_portal: 'Teacher Portal',
    profile_settings: 'Profile & Settings',
    online: 'Online',
    offline: 'Offline Mode',
    sync_pending: 'Pending Sync',
    sync_now: 'Sync Now',
    start_learning: 'Start Learning',
    grade: 'Grade',
    subject: 'Subject',
    explore_lessons: 'Explore Lessons',
    ask_ai: 'Ask AI Tutor',
    voice_input: 'Voice Input',
    listen: 'Listen (Audio)',
    stop_audio: 'Stop Audio',
    difficulty: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    submit: 'Submit',
    next: 'Next',
    previous: 'Previous',
    score: 'Score',
    explanation: 'Explanation',
    hint: 'Get Hint',
    completed: 'Completed',
    pending: 'Pending',
    reschedule: 'Reschedule',
    minutes: 'mins',
    accuracy: 'Accuracy',
    mastery_status: 'Mastery Status',
    needs_revision: 'Needs Revision',
    developing: 'Developing',
    demonstrated_proficiency: 'Demonstrated Proficiency',
    insufficient_evidence: 'Insufficient Evidence',
    download_lesson: 'Save Offline',
    downloaded: 'Downloaded',
    teacher_classes: 'My Classes',
    create_class: 'Create New Class',
    join_class: 'Join Class',
    join_code: 'Join Code',
    analytics: 'Class Analytics',
    assignments: 'Assignments',
    role_student: 'Student',
    role_teacher: 'Teacher',
    demo_student_btn: 'Try as Demo Student',
    demo_teacher_btn: 'Try as Demo Teacher',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'hi',
  setLanguage: () => {},
  t: (k) => k,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('learnmate_lang') as Language) || 'hi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('learnmate_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
