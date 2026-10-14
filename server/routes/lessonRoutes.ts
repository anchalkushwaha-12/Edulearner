import { Router, Response } from 'express';
import { db, LessonProgress } from '../db.js';
import { authenticate, optionalAuthenticate, AuthenticatedRequest } from '../auth.js';

export const lessonRouter = Router();

// Get lessons with search and filter
lessonRouter.get('/', optionalAuthenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { grade, subject, search, difficulty } = req.query;

    let filtered = [...db.lessons];

    if (grade) {
      const gNum = Number(grade);
      filtered = filtered.filter(l => l.grade === gNum);
    }

    if (subject) {
      filtered = filtered.filter(l => l.subject.toLowerCase() === String(subject).toLowerCase());
    }

    if (difficulty) {
      filtered = filtered.filter(l => l.difficulty === difficulty);
    }

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(l =>
        l.title_en.toLowerCase().includes(q) ||
        l.title_hi.toLowerCase().includes(q) ||
        l.topic.toLowerCase().includes(q) ||
        l.summary_en.toLowerCase().includes(q) ||
        l.summary_hi.toLowerCase().includes(q)
      );
    }

    // Attach student progress if logged in
    const userId = req.user?.id;
    const results = filtered.map(lesson => {
      const prog = userId ? db.lesson_progress.find(p => p.user_id === userId && p.lesson_id === lesson.id) : null;
      return {
        ...lesson,
        progress_status: prog ? prog.status : 'not_started',
      };
    });

    res.json({
      total: results.length,
      lessons: results,
    });
  } catch (err: any) {
    console.error('Error fetching lessons:', err);
    res.status(500).json({ error: 'Failed to retrieve lessons.' });
  }
});

// Get single lesson details
lessonRouter.get('/:id', optionalAuthenticate, (req: AuthenticatedRequest, res: Response) => {
  const lesson = db.lessons.find(l => l.id === req.params.id);
  if (!lesson) {
    res.status(404).json({ error: 'Lesson not found.' });
    return;
  }

  const userId = req.user?.id;
  const progress = userId ? db.lesson_progress.find(p => p.user_id === userId && p.lesson_id === lesson.id) : null;

  // Also find associated quiz if any
  const quiz = db.quizzes.find(q => q.topic.toLowerCase() === lesson.topic.toLowerCase() && q.grade === lesson.grade);

  res.json({
    lesson,
    progress: progress || null,
    associated_quiz_id: quiz ? quiz.id : null,
  });
});

// Update lesson progress (mark started or completed)
lessonRouter.post('/:id/progress', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const lesson = db.lessons.find(l => l.id === req.params.id);
    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found.' });
      return;
    }

    const userId = req.user!.id;
    const { status } = req.body;

    if (!['started', 'completed'].includes(status)) {
      res.status(400).json({ error: 'Status must be either started or completed.' });
      return;
    }

    let prog = db.lesson_progress.find(p => p.user_id === userId && p.lesson_id === lesson.id);
    const now = new Date().toISOString();

    if (!prog) {
      prog = {
        id: `prog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: userId,
        lesson_id: lesson.id,
        status,
        completed_at: status === 'completed' ? now : undefined,
        updated_at: now,
      };
      db.lesson_progress.push(prog);
    } else {
      prog.status = status;
      prog.updated_at = now;
      if (status === 'completed' && !prog.completed_at) {
        prog.completed_at = now;
      }
    }

    db.save();

    res.json({
      message: `Lesson marked as ${status}.`,
      progress: prog,
    });
  } catch (err: any) {
    console.error('Error updating progress:', err);
    res.status(500).json({ error: 'Failed to update lesson progress.' });
  }
});
