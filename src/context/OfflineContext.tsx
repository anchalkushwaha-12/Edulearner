import React, { createContext, useContext, useState, useEffect } from 'react';
import { OfflineStorageManager } from '../services/offlineStore';
import { Lesson, QuizSafe } from '../types';

interface OfflineContextType {
  isOnline: boolean;
  pendingSyncCount: number;
  downloadedLessons: Lesson[];
  downloadedQuizzes: QuizSafe[];
  refreshOfflineData: () => void;
  syncNow: () => Promise<{ success: boolean; message: string }>;
  isLessonDownloaded: (id: string) => boolean;
  toggleDownloadLesson: (lesson: Lesson) => void;
}

const OfflineContext = createContext<OfflineContextType>({
  isOnline: true,
  pendingSyncCount: 0,
  downloadedLessons: [],
  downloadedQuizzes: [],
  refreshOfflineData: () => {},
  syncNow: async () => ({ success: false, message: '' }),
  isLessonDownloaded: () => false,
  toggleDownloadLesson: () => {},
});

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [downloadedLessons, setDownloadedLessons] = useState<Lesson[]>([]);
  const [downloadedQuizzes, setDownloadedQuizzes] = useState<QuizSafe[]>([]);

  const refreshOfflineData = () => {
    setDownloadedLessons(OfflineStorageManager.getDownloadedLessons());
    setDownloadedQuizzes(OfflineStorageManager.getDownloadedQuizzes());
    setPendingSyncCount(OfflineStorageManager.getSyncQueue().length);
  };

  useEffect(() => {
    refreshOfflineData();

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync when back online
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncNow = async () => {
    if (!isOnline) {
      return { success: false, message: 'Cannot sync while offline. Please connect to internet.' };
    }
    const result = await OfflineStorageManager.syncPendingQueue();
    refreshOfflineData();
    if (result.errors.length > 0) {
      return { success: false, message: `Sync encountered errors: ${result.errors.join(', ')}` };
    }
    return {
      success: true,
      message: result.syncedCount > 0 ? `Successfully synced ${result.syncedCount} item(s)!` : 'All items are already in sync.',
    };
  };

  const isLessonDownloaded = (id: string) => {
    return downloadedLessons.some(l => l.id === id);
  };

  const toggleDownloadLesson = (lesson: Lesson) => {
    if (isLessonDownloaded(lesson.id)) {
      OfflineStorageManager.removeDownloadedLesson(lesson.id);
    } else {
      OfflineStorageManager.saveLessonForOffline(lesson);
    }
    refreshOfflineData();
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        pendingSyncCount,
        downloadedLessons,
        downloadedQuizzes,
        refreshOfflineData,
        syncNow,
        isLessonDownloaded,
        toggleDownloadLesson,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => useContext(OfflineContext);
