import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { OfflineProvider } from './context/OfflineContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { AITutorPage } from './pages/AITutorPage';
import { LessonLibraryPage } from './pages/LessonLibraryPage';
import { LessonDetailPage } from './pages/LessonDetailPage';
import { DocumentWorkspacePage } from './pages/DocumentWorkspacePage';
import { QuizLobbyPage } from './pages/QuizLobbyPage';
import { QuizTakePage } from './pages/QuizTakePage';
import { QuizResultPage } from './pages/QuizResultPage';
import { ProgressMasteryPage } from './pages/ProgressMasteryPage';
import { StudyPlanPage } from './pages/StudyPlanPage';
import { OfflineDownloadsPage } from './pages/OfflineDownloadsPage';
import { TeacherDashboardPage } from './pages/TeacherDashboardPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';

function MainRouter() {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [quizResultData, setQuizResultData] = useState<any | null>(null);
  const [tutorContextTopic, setTutorContextTopic] = useState<string | undefined>();
  const [tutorHintMode, setTutorHintMode] = useState<boolean>(false);

  // If user is loaded and page is still 'landing', can choose to stay on landing or go to dashboard
  const handleNavigate = (page: string, meta?: any) => {
    if (page === 'lessons' && meta?.lesson_id) {
      setActiveLessonId(meta.lesson_id);
      setCurrentPage('lesson-detail');
      return;
    }
    if (page === 'lessons' && meta?.topic) {
      setTutorContextTopic(meta.topic);
      setCurrentPage('lessons');
      return;
    }
    if (page === 'quizzes' && meta?.quiz_id) {
      setActiveQuizId(meta.quiz_id);
      setCurrentPage('quiz-take');
      return;
    }
    if (page === 'ai-tutor') {
      if (meta?.topic) setTutorContextTopic(meta.topic);
      if (meta?.request_type === 'hint') setTutorHintMode(true);
      else setTutorHintMode(false);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 animate-spin flex items-center justify-center text-white font-bold" />
          <p className="text-xs font-semibold text-slate-500">Loading LearnMate AI...</p>
        </div>
      </div>
    );
  }

  // Routing render helper
  const renderCurrentPage = () => {
    // If not authenticated and trying to access private screens, route to landing or login
    if (!user) {
      if (currentPage === 'login') return <LoginPage onNavigate={handleNavigate} />;
      if (currentPage === 'register') return <RegisterPage onNavigate={handleNavigate} />;
      return <LandingPage onNavigate={handleNavigate} />;
    }

    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'dashboard':
        return <StudentDashboard onNavigate={handleNavigate} />;
      case 'lessons':
        return (
          <LessonLibraryPage
            filterTopic={tutorContextTopic}
            onSelectLesson={(id) => {
              setActiveLessonId(id);
              setCurrentPage('lesson-detail');
            }}
          />
        );
      case 'lesson-detail':
        return activeLessonId ? (
          <LessonDetailPage
            lessonId={activeLessonId}
            onBack={() => setCurrentPage('lessons')}
            onNavigateToQuiz={(quizId) => {
              if (quizId) {
                setActiveQuizId(quizId);
                setCurrentPage('quiz-take');
              } else {
                setCurrentPage('quizzes');
              }
            }}
            onNavigateToTutor={(topic) => {
              setTutorContextTopic(topic);
              setCurrentPage('ai-tutor');
            }}
          />
        ) : (
          <LessonLibraryPage onSelectLesson={(id) => { setActiveLessonId(id); setCurrentPage('lesson-detail'); }} />
        );
      case 'ai-tutor':
        return <AITutorPage initialTopic={tutorContextTopic} initialHintMode={tutorHintMode} />;
      case 'quizzes':
        return (
          <QuizLobbyPage
            onStartQuiz={(qId) => {
              setActiveQuizId(qId);
              setCurrentPage('quiz-take');
            }}
          />
        );
      case 'quiz-take':
        return activeQuizId ? (
          <QuizTakePage
            quizId={activeQuizId}
            onBack={() => setCurrentPage('quizzes')}
            onFinish={(res) => {
              setQuizResultData(res);
              setCurrentPage('quiz-result');
            }}
          />
        ) : (
          <QuizLobbyPage onStartQuiz={(qId) => { setActiveQuizId(qId); setCurrentPage('quiz-take'); }} />
        );
      case 'quiz-result':
        return quizResultData ? (
          <QuizResultPage
            result={quizResultData}
            onRetake={() => setCurrentPage('quizzes')}
            onNavigateToLessons={(topic) => {
              setTutorContextTopic(topic);
              setCurrentPage('lessons');
            }}
            onNavigateToTutor={(topic) => {
              setTutorContextTopic(topic);
              setCurrentPage('ai-tutor');
            }}
          />
        ) : (
          <QuizLobbyPage onStartQuiz={(qId) => { setActiveQuizId(qId); setCurrentPage('quiz-take'); }} />
        );
      case 'gap-analysis':
        return (
          <ProgressMasteryPage
            onNavigateToLesson={(topic) => {
              setTutorContextTopic(topic);
              setCurrentPage('lessons');
            }}
            onNavigateToQuiz={(_topic) => {
              setCurrentPage('quizzes');
            }}
          />
        );
      case 'study-plan':
        return (
          <StudyPlanPage
            onNavigateToLesson={(lessonId) => {
              if (lessonId) {
                setActiveLessonId(lessonId);
                setCurrentPage('lesson-detail');
              } else {
                setCurrentPage('lessons');
              }
            }}
            onNavigateToQuiz={(_topic) => {
              setCurrentPage('quizzes');
            }}
          />
        );
      case 'offline-hub':
        return (
          <OfflineDownloadsPage
            onSelectLesson={(id) => {
              setActiveLessonId(id);
              setCurrentPage('lesson-detail');
            }}
          />
        );
      case 'documents':
        return <DocumentWorkspacePage />;
      case 'teacher':
        return <TeacherDashboardPage />;
      case 'profile':
        return <ProfileSettingsPage onNavigate={handleNavigate} />;
      default:
        return <StudentDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-500 selection:text-white">
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />
      <main className="flex-1">
        {renderCurrentPage()}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <OfflineProvider>
          <MainRouter />
        </OfflineProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
