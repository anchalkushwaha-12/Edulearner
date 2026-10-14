import { Router, Response } from 'express';
import { db, Quiz, QuizAttempt, QuizQuestion } from '../db.js';
import { authenticate, optionalAuthenticate, AuthenticatedRequest } from '../auth.js';
import { recalculateTopicMastery } from './masteryRoutes.js';

export const quizRouter = Router();

// GET /api/quizzes - List available quizzes (WITHOUT leaking correct answers)
quizRouter.get('/', optionalAuthenticate, (req: AuthenticatedRequest, res: Response) => {
  const { grade, subject, topic } = req.query;

  let list = [...db.quizzes];
  if (grade) {
    list = list.filter(q => q.grade === Number(grade));
  }
  if (subject) {
    list = list.filter(q => q.subject.toLowerCase() === String(subject).toLowerCase());
  }
  if (topic) {
    list = list.filter(q => q.topic.toLowerCase().includes(String(topic).toLowerCase()));
  }

  // Sanitize: Strip correct_answer, explanation from public quiz payload
  const sanitized = list.map(q => ({
    id: q.id,
    grade: q.grade,
    subject: q.subject,
    topic: q.topic,
    title_en: q.title_en,
    title_hi: q.title_hi,
    question_count: q.questions.length,
    is_sample: q.is_sample,
    created_at: q.created_at,
  }));

  res.json({ quizzes: sanitized });
});

// GET /api/quizzes/:id - Get quiz questions for attempting (STRICTLY NO ANSWERS OR EXPLANATIONS LEAKED)
quizRouter.get('/:id', optionalAuthenticate, (req: AuthenticatedRequest, res: Response) => {
  const quiz = db.quizzes.find(q => q.id === req.params.id);
  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found.' });
    return;
  }

  // Strip correct_answer and explanation before sending to client
  const safeQuestions = quiz.questions.map(q => ({
    id: q.id,
    question_en: q.question_en,
    question_hi: q.question_hi,
    type: q.type,
    options_en: q.options_en,
    options_hi: q.options_hi,
    hint_en: q.hint_en,
    hint_hi: q.hint_hi,
  }));

  res.json({
    id: quiz.id,
    grade: quiz.grade,
    subject: quiz.subject,
    topic: quiz.topic,
    title_en: quiz.title_en,
    title_hi: quiz.title_hi,
    questions: safeQuestions,
  });
});

// POST /api/quizzes/:id/submit - Server-side grading & mastery trigger
quizRouter.post('/:id/submit', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const quiz = db.quizzes.find(q => q.id === req.params.id);
    if (!quiz) {
      res.status(404).json({ error: 'Quiz not found.' });
      return;
    }

    const { answers = {}, operation_id } = req.body;

    // Idempotency check: if this operation_id was already processed, return existing attempt
    if (operation_id) {
      const existing = db.quiz_attempts.find(a => a.operation_id === operation_id && a.user_id === userId);
      if (existing) {
        res.json({
          message: 'Idempotent response: Attempt already recorded.',
          attempt: existing,
        });
        return;
      }
    }

    // Backend Scoring: Grade each question deterministically
    let score = 0;
    const answersDetail = quiz.questions.map(q => {
      const submitted = String(answers[q.id] || '').trim();
      const correct = String(q.correct_answer).trim();

      // Flexible matching for true/false or case-insensitive text
      let isCorrect = false;
      if (q.type === 'true_false') {
        const sLower = submitted.toLowerCase();
        const cLower = correct.toLowerCase();
        isCorrect = sLower === cLower || (sLower === 'सत्य' && cLower === 'true') || (sLower === 'असत्य' && cLower === 'false');
      } else {
        isCorrect = submitted.toLowerCase() === correct.toLowerCase();
      }

      if (isCorrect) {
        score += 1;
      }

      return {
        question_id: q.id,
        submitted,
        correct,
        is_correct: isCorrect,
        explanation_en: q.explanation_en,
        explanation_hi: q.explanation_hi,
      };
    });

    const newAttempt: QuizAttempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      quiz_id: quiz.id,
      user_id: userId,
      subject: quiz.subject,
      topic: quiz.topic,
      score,
      total_questions: quiz.questions.length,
      submitted_answers: answers,
      answers_detail: answersDetail,
      operation_id,
      created_at: new Date().toISOString(),
    };

    db.quiz_attempts.push(newAttempt);
    db.save();

    // Recalculate topic mastery and learning gaps immediately!
    const mastery = recalculateTopicMastery(userId, quiz.subject, quiz.topic);

    res.status(201).json({
      message: 'Quiz evaluated successfully.',
      attempt: newAttempt,
      mastery_status: mastery.mastery_status,
      observed_accuracy: mastery.observed_accuracy,
      recommendations: mastery.recommendations,
    });
  } catch (err: any) {
    console.error('Quiz submit error:', err);
    res.status(500).json({ error: 'Failed to evaluate quiz submission.' });
  }
});

// GET /api/quizzes/attempts/history - Get student's quiz attempts history
quizRouter.get('/attempts/history', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const attempts = db.quiz_attempts
    .filter(a => a.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({ attempts });
});
