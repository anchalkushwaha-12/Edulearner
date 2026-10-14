import { Lesson, QuizSafe, OfflineSyncItem } from '../types';
import { api } from './api';

const OFFLINE_LESSONS_KEY = 'learnmate_offline_lessons';
const OFFLINE_QUIZZES_KEY = 'learnmate_offline_quizzes';
const SYNC_QUEUE_KEY = 'learnmate_sync_queue';

export class OfflineStorageManager {
  // Downloaded Lessons
  static getDownloadedLessons(): Lesson[] {
    try {
      const raw = localStorage.getItem(OFFLINE_LESSONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static saveLessonForOffline(lesson: Lesson): void {
    const list = this.getDownloadedLessons();
    const existingIndex = list.findIndex(l => l.id === lesson.id);
    if (existingIndex >= 0) {
      list[existingIndex] = lesson;
    } else {
      list.push(lesson);
    }
    localStorage.setItem(OFFLINE_LESSONS_KEY, JSON.stringify(list));
  }

  static removeDownloadedLesson(lessonId: string): void {
    const list = this.getDownloadedLessons().filter(l => l.id !== lessonId);
    localStorage.setItem(OFFLINE_LESSONS_KEY, JSON.stringify(list));
  }

  static isLessonDownloaded(lessonId: string): boolean {
    return this.getDownloadedLessons().some(l => l.id === lessonId);
  }

  // Downloaded Quizzes
  static getDownloadedQuizzes(): QuizSafe[] {
    try {
      const raw = localStorage.getItem(OFFLINE_QUIZZES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static saveQuizForOffline(quiz: QuizSafe): void {
    const list = this.getDownloadedQuizzes();
    const existingIndex = list.findIndex(q => q.id === quiz.id);
    if (existingIndex >= 0) {
      list[existingIndex] = quiz;
    } else {
      list.push(quiz);
    }
    localStorage.setItem(OFFLINE_QUIZZES_KEY, JSON.stringify(list));
  }

  // Sync Queue
  static getSyncQueue(): OfflineSyncItem[] {
    try {
      const raw = localStorage.getItem(SYNC_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static queueOfflineOperation(entity_type: 'quiz_attempt' | 'lesson_progress', payload: any): string {
    const queue = this.getSyncQueue();
    const opId = `op-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const item: OfflineSyncItem = {
      operation_id: opId,
      entity_type,
      payload,
      timestamp: new Date().toISOString(),
    };
    queue.push(item);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    return opId;
  }

  static async syncPendingQueue(): Promise<{ syncedCount: number; errors: string[] }> {
    const queue = this.getSyncQueue();
    if (queue.length === 0) {
      return { syncedCount: 0, errors: [] };
    }

    try {
      const response = await api.syncBatch(queue);
      // Remove applied or already processed items
      const processedIds = new Set(
        response.results
          .filter(r => r.status === 'applied' || r.status === 'already_processed')
          .map(r => r.operation_id)
      );

      const remaining = queue.filter(item => !processedIds.has(item.operation_id));
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));

      return {
        syncedCount: processedIds.size,
        errors: response.results.filter(r => r.status === 'rejected').map(r => r.message || 'Operation rejected'),
      };
    } catch (err: any) {
      return {
        syncedCount: 0,
        errors: [err.message || 'Sync connection failed'],
      };
    }
  }
}
