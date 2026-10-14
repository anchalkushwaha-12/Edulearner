import {
  User,
  StudentProfile,
  Lesson,
  QuizSafe,
  QuizAttemptResult,
  TopicMasteryItem,
  MasterySummary,
  StudyPlanResponse,
  DocumentItem,
  ClassItem,
  AssignmentItem,
  OfflineSyncItem
} from '../types';

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('learnmate_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
      credentials: 'include',
    });

    const data = await res.json().catch(() => ({ error: 'Invalid JSON response from server' }));

    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    return data as T;
  }

  // Auth
  async register(payload: { email: string; password: string; full_name: string; role?: string; language?: string; grade?: number; school_name?: string }) {
    const res = await this.request<{ user: User; token: string; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.token) localStorage.setItem('learnmate_token', res.token);
    return res;
  }

  async login(payload: { email: string; password: string }) {
    const res = await this.request<{ user: User; token: string; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.token) localStorage.setItem('learnmate_token', res.token);
    return res;
  }

  async demoLogin(role: 'student' | 'teacher') {
    const res = await this.request<{ user: User; token: string; message: string }>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    if (res.token) localStorage.setItem('learnmate_token', res.token);
    return res;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('learnmate_token');
    }
  }

  async getMe() {
    return this.request<{ user: User; profile: StudentProfile | null }>('/auth/me');
  }

  async updateProfile(payload: Partial<User & StudentProfile>) {
    return this.request<{ user: User; profile: StudentProfile; message: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // Lessons
  async getLessons(params?: { grade?: number; subject?: string; search?: string; difficulty?: string }) {
    const query = new URLSearchParams();
    if (params?.grade) query.set('grade', String(params.grade));
    if (params?.subject) query.set('subject', params.subject);
    if (params?.search) query.set('search', params.search);
    if (params?.difficulty) query.set('difficulty', params.difficulty);
    const qs = query.toString();
    return this.request<{ total: number; lessons: Lesson[] }>(`/lessons${qs ? `?${qs}` : ''}`);
  }

  async getLesson(id: string) {
    return this.request<{ lesson: Lesson; progress: any; associated_quiz_id?: string }>(`/lessons/${id}`);
  }

  async updateLessonProgress(id: string, status: 'started' | 'completed') {
    return this.request<{ progress: any; message: string }>(`/lessons/${id}/progress`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  // AI Tutor
  async chatWithTutor(payload: {
    message: string;
    session_id?: string;
    language?: string;
    grade?: number;
    subject?: string;
    topic?: string;
    request_type?: 'explanation' | 'hint' | 'followup';
    document_context?: string;
  }) {
    return this.request<{
      reply: string;
      session_id: string;
      language: string;
      is_live_provider: boolean;
      provider_info: string;
      suggested_hints: string[];
    }>('/ai/tutor', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Quizzes
  async getQuizzes(params?: { grade?: number; subject?: string; topic?: string }) {
    const query = new URLSearchParams();
    if (params?.grade) query.set('grade', String(params.grade));
    if (params?.subject) query.set('subject', params.subject);
    if (params?.topic) query.set('topic', params.topic);
    const qs = query.toString();
    return this.request<{ quizzes: QuizSafe[] }>(`/quizzes${qs ? `?${qs}` : ''}`);
  }

  async getQuiz(id: string) {
    return this.request<QuizSafe>(`/quizzes/${id}`);
  }

  async submitQuiz(id: string, answers: Record<string, string>, operation_id?: string) {
    return this.request<{
      message: string;
      attempt: QuizAttemptResult;
      mastery_status: string;
      observed_accuracy: number;
      recommendations: any[];
    }>(`/quizzes/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers, operation_id }),
    });
  }

  // Mastery & Learning Gap Detection
  async getMastery() {
    return this.request<{
      summary: MasterySummary;
      topics: TopicMasteryItem[];
    }>('/mastery');
  }

  // Study Plan
  async getTodayStudyPlan() {
    return this.request<StudyPlanResponse>('/study-plan/today');
  }

  async updateTaskStatus(taskId: string, status: 'pending' | 'completed' | 'rescheduled', rescheduled_date?: string) {
    return this.request<{ message: string; task: any }>(`/study-plan/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rescheduled_date }),
    });
  }

  // Documents
  async getDocuments() {
    return this.request<{ documents: DocumentItem[] }>('/documents');
  }

  async uploadDocument(filename: string, content: string) {
    return this.request<{ message: string; document: any }>('/documents/upload', {
      method: 'POST',
      body: JSON.stringify({ filename, content }),
    });
  }

  async deleteDocument(id: string) {
    return this.request<{ message: string }>(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  async askDocument(id: string, question: string, language?: string) {
    return this.request<{
      answer: string;
      citations: Array<{ chunk_id: string; snippet: string }>;
      has_sufficient_evidence: boolean;
      is_live_provider: boolean;
    }>(`/documents/${id}/ask`, {
      method: 'POST',
      body: JSON.stringify({ question, language }),
    });
  }

  // Teacher & Class
  async getTeacherClasses() {
    return this.request<{ classes: ClassItem[] }>('/teacher/classes');
  }

  async createClass(payload: { name: string; grade: number; subject: string }) {
    return this.request<{ message: string; classroom: ClassItem }>('/teacher/classes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getClassAnalytics(classId: string) {
    return this.request<{
      classroom: ClassItem;
      total_students: number;
      students: any[];
      total_quiz_attempts: number;
      average_accuracy: number;
      topic_gaps: Array<{
        topic: string;
        attempts: number;
        accuracy: number;
        gap_severity: 'critical' | 'moderate' | 'low';
        suggested_action: string;
      }>;
    }>(`/teacher/classes/${classId}/analytics`);
  }

  async createAssignment(classId: string, payload: { title: string; description?: string; lesson_id?: string; quiz_id?: string; due_date?: string }) {
    return this.request<{ message: string; assignment: AssignmentItem }>(`/teacher/classes/${classId}/assignments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async joinClass(join_code: string) {
    return this.request<{ message: string; classroom: ClassItem }>('/classes/join', {
      method: 'POST',
      body: JSON.stringify({ join_code }),
    });
  }

  async getMyClasses() {
    return this.request<{ enrolled_classes: ClassItem[]; assignments: AssignmentItem[] }>('/classes/my');
  }

  // Offline Sync
  async syncBatch(operations: OfflineSyncItem[]) {
    return this.request<{
      message: string;
      total_received: number;
      results: Array<{ operation_id: string; status: string; message?: string }>;
    }>('/sync/batch', {
      method: 'POST',
      body: JSON.stringify({ operations }),
    });
  }
}

export const api = new ApiClient();
