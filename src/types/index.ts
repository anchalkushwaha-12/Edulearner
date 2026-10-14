export type Language = 'hi' | 'en';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher';
  language: Language;
  grade: number;
  school_name?: string;
  created_at: string;
}

export interface StudentProfile {
  user_id: string;
  target_exam?: string;
  daily_study_minutes: number;
  preferred_subjects: string[];
  learning_pace?: 'gentle' | 'moderate' | 'accelerated';
}

export interface Lesson {
  id: string;
  grade: number;
  subject: string;
  topic: string;
  title_en: string;
  title_hi: string;
  summary_en: string;
  summary_hi: string;
  content_en: string;
  content_hi: string;
  key_points_en: string[];
  key_points_hi: string[];
  examples_en: string[];
  examples_hi: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  is_sample: boolean;
  progress_status?: 'not_started' | 'started' | 'completed';
}

export interface QuizQuestionSafe {
  id: string;
  question_en: string;
  question_hi: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options_en: string[];
  options_hi: string[];
  hint_en: string;
  hint_hi: string;
}

export interface QuizSafe {
  id: string;
  grade: number;
  subject: string;
  topic: string;
  title_en: string;
  title_hi: string;
  question_count?: number;
  questions?: QuizQuestionSafe[];
  is_sample?: boolean;
}

export interface QuizResultAnswerDetail {
  question_id: string;
  submitted: string;
  correct: string;
  is_correct: boolean;
  explanation_en: string;
  explanation_hi: string;
}

export interface QuizAttemptResult {
  id: string;
  quiz_id: string;
  user_id: string;
  subject: string;
  topic: string;
  score: number;
  total_questions: number;
  submitted_answers: Record<string, string>;
  answers_detail: QuizResultAnswerDetail[];
  created_at: string;
}

export interface TopicMasteryItem {
  id: string;
  subject: string;
  topic: string;
  total_graded_answers: number;
  correct_answers: number;
  observed_accuracy: number;
  mastery_status: 'insufficient_evidence' | 'needs_revision' | 'developing' | 'demonstrated_proficiency';
  recommendations: Array<{
    type: 'review_lesson' | 'practice_simpler' | 'take_revision_quiz' | 'advance_topic';
    message_en: string;
    message_hi: string;
    lesson_id?: string;
  }>;
  last_calculated_at: string;
}

export interface MasterySummary {
  total_topics: number;
  needs_revision: number;
  developing: number;
  demonstrated_proficiency: number;
  insufficient_evidence: number;
}

export interface StudyPlanTask {
  id: string;
  title_en: string;
  title_hi: string;
  subject: string;
  topic: string;
  lesson_id?: string;
  estimated_minutes: number;
  status: 'pending' | 'completed' | 'rescheduled';
  due_date: string;
  reason_en: string;
  reason_hi: string;
}

export interface StudyPlanResponse {
  plan: {
    id: string;
    user_id: string;
    date: string;
    tasks: StudyPlanTask[];
    created_at: string;
  };
  daily_study_minutes_budget: number;
  total_allocated_minutes: number;
}

export interface DocumentItem {
  id: string;
  filename: string;
  file_size: number;
  total_chunks: number;
  created_at: string;
}

export interface ClassItem {
  id: string;
  teacher_id: string;
  name: string;
  grade: number;
  subject: string;
  join_code: string;
  student_count?: number;
  assignment_count?: number;
  created_at: string;
}

export interface AssignmentItem {
  id: string;
  class_id: string;
  title: string;
  description: string;
  lesson_id?: string;
  quiz_id?: string;
  due_date: string;
  created_at: string;
}

export interface OfflineSyncItem {
  operation_id: string;
  entity_type: 'quiz_attempt' | 'lesson_progress';
  payload: any;
  timestamp: string;
}
