import { Router, Response } from 'express';
import { db, SyncOperation, QuizAttempt, LessonProgress } from '../db.js';
import { authenticate, AuthenticatedRequest } from '../auth.js';
import { recalculateTopicMastery } from './masteryRoutes.js';

export const syncRouter = Router();

// POST /api/sync/batch - Process offline queue idempotently
syncRouter.post('/batch', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { operations = [] } = req.body;

    if (!Array.isArray(operations)) {
      res.status(400).json({ error: 'Operations must be an array.' });
      return;
    }

    const results: Array<{
      operation_id: string;
      status: 'applied' | 'already_processed' | 'rejected';
      message?: string;
    }> = [];

    for (const op of operations) {
      const { operation_id, entity_type, payload } = op;

      if (!operation_id) {
        results.push({ operation_id: 'unknown', status: 'rejected', message: 'Missing operation_id' });
        continue;
      }

      // Check if already processed
      const existing = db.sync_operations.find(
        s => s.user_id === userId && s.operation_id === operation_id
      );

      if (existing) {
        results.push({ operation_id, status: 'already_processed' });
        continue;
      }

      // Process according to entity type
      if (entity_type === 'quiz_attempt') {
        const { quiz_id, answers = {} } = payload;
        const quiz = db.quizzes.find(q => q.id === quiz_id);

        if (quiz) {
          let score = 0;
          const answersDetail = quiz.questions.map(q => {
            const submitted = String(answers[q.id] || '').trim();
            const correct = String(q.correct_answer).trim();
            let isCorrect = false;
            if (q.type === 'true_false') {
              const sLower = submitted.toLowerCase();
              const cLower = correct.toLowerCase();
              isCorrect = sLower === cLower || (sLower === 'सत्य' && cLower === 'true') || (sLower === 'असत्य' && cLower === 'false');
            } else {
              isCorrect = submitted.toLowerCase() === correct.toLowerCase();
            }
            if (isCorrect) score += 1;
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
            id: `att-sync-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            quiz_id: quiz.id,
            user_id: userId,
            subject: quiz.subject,
            topic: quiz.topic,
            score,
            total_questions: quiz.questions.length,
            submitted_answers: answers,
            answers_detail: answersDetail,
            operation_id,
            created_at: payload.timestamp || new Date().toISOString(),
          };

          db.quiz_attempts.push(newAttempt);
          recalculateTopicMastery(userId, quiz.subject, quiz.topic);
        }
      } else if (entity_type === 'lesson_progress') {
        const { lesson_id, status } = payload;
        let prog = db.lesson_progress.find(p => p.user_id === userId && p.lesson_id === lesson_id);
        const now = payload.timestamp || new Date().toISOString();

        if (!prog) {
          prog = {
            id: `prog-sync-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            user_id: userId,
            lesson_id,
            status: status || 'completed',
            completed_at: status === 'completed' ? now : undefined,
            updated_at: now,
          };
          db.lesson_progress.push(prog);
        } else {
          prog.status = status;
          prog.updated_at = now;
        }
      }

      // Record successful sync operation
      const syncRecord: SyncOperation = {
        id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: userId,
        operation_id,
        entity_type,
        payload,
        processed_at: new Date().toISOString(),
      };
      db.sync_operations.push(syncRecord);
      results.push({ operation_id, status: 'applied' });
    }

    db.save();

    res.json({
      message: 'Batch synchronization completed.',
      total_received: operations.length,
      results,
    });
  } catch (err: any) {
    console.error('Sync batch error:', err);
    res.status(500).json({ error: 'Failed to process sync batch.' });
  }
});

// GET /api/sync/status - Get sync journal summary
syncRouter.get('/status', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const userOps = db.sync_operations.filter(s => s.user_id === userId);

  res.json({
    total_synced_operations: userOps.length,
    last_sync_at: userOps.length > 0 ? userOps[userOps.length - 1].processed_at : null,
  });
});
