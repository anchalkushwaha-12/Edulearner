import { Router, Response } from 'express';
import { db, ClassRoom, ClassMembership, Assignment } from '../db.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth.js';

export const teacherRouter = Router();

// Helper: generate 6-character random join code (e.g. 'MATH7A')
function generateJoinCode(prefix: string = 'LM'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = prefix;
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// POST /api/teacher/classes - Create new class
teacherRouter.post('/classes', authenticate, requireRole('teacher'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const teacherId = req.user!.id;
    const { name, grade = 8, subject = 'Mathematics' } = req.body;

    if (!name || name.trim().length === 0) {
      res.status(400).json({ error: 'Class name is required.' });
      return;
    }

    const joinCode = generateJoinCode(subject.slice(0, 2).toUpperCase());
    const newClass: ClassRoom = {
      id: `cls-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      teacher_id: teacherId,
      name: name.trim(),
      grade: Number(grade),
      subject: subject.trim(),
      join_code: joinCode,
      created_at: new Date().toISOString(),
    };

    db.classes.push(newClass);
    db.save();

    res.status(201).json({
      message: 'Class created successfully.',
      classroom: newClass,
    });
  } catch (err: any) {
    console.error('Create class error:', err);
    res.status(500).json({ error: 'Failed to create class.' });
  }
});

// GET /api/teacher/classes - List teacher's classes with student counts
teacherRouter.get('/classes', authenticate, requireRole('teacher'), (req: AuthenticatedRequest, res: Response) => {
  const teacherId = req.user!.id;
  const classes = db.classes.filter(c => c.teacher_id === teacherId);

  const classesWithStats = classes.map(cls => {
    const memberCount = db.memberships.filter(m => m.class_id === cls.id).length;
    const assignmentCount = db.assignments.filter(a => a.class_id === cls.id).length;
    return {
      ...cls,
      student_count: memberCount,
      assignment_count: assignmentCount,
    };
  });

  res.json({ classes: classesWithStats });
});

// GET /api/teacher/classes/:id/analytics - Class performance & topic gap analytics
teacherRouter.get('/classes/:id/analytics', authenticate, requireRole('teacher'), (req: AuthenticatedRequest, res: Response) => {
  const teacherId = req.user!.id;
  const cls = db.classes.find(c => c.id === req.params.id && c.teacher_id === teacherId);

  if (!cls) {
    res.status(404).json({ error: 'Class not found or unauthorized.' });
    return;
  }

  // Get enrolled students
  const memberships = db.memberships.filter(m => m.class_id === cls.id);
  const studentIds = memberships.map(m => m.student_id);
  const enrolledStudents = db.users
    .filter(u => studentIds.includes(u.id))
    .map(u => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      grade: u.grade,
      school_name: u.school_name,
    }));

  // Aggregate quiz attempts for enrolled students
  const classAttempts = db.quiz_attempts.filter(a => studentIds.includes(a.user_id));

  // Calculate topic-level statistics
  const topicStats: Record<string, { topic: string; total_answers: number; correct_answers: number; attempts: number }> = {};
  for (const att of classAttempts) {
    if (!topicStats[att.topic]) {
      topicStats[att.topic] = { topic: att.topic, total_answers: 0, correct_answers: 0, attempts: 0 };
    }
    topicStats[att.topic].attempts += 1;
    for (const ans of att.answers_detail) {
      topicStats[att.topic].total_answers += 1;
      if (ans.is_correct) {
        topicStats[att.topic].correct_answers += 1;
      }
    }
  }

  const topicGaps = Object.values(topicStats).map(t => {
    const accuracy = t.total_answers > 0 ? Math.round((t.correct_answers / t.total_answers) * 100) : 0;
    return {
      topic: t.topic,
      attempts: t.attempts,
      accuracy,
      gap_severity: accuracy < 50 ? 'critical' : accuracy < 75 ? 'moderate' : 'low',
      suggested_action: accuracy < 50
        ? 'Conduct remedial classroom session and review foundation notes'
        : accuracy < 75
        ? 'Assign practice problem worksheet'
        : 'Class has demonstrated high understanding',
    };
  });

  const overallTotalAnswers = Object.values(topicStats).reduce((sum, t) => sum + t.total_answers, 0);
  const overallCorrectAnswers = Object.values(topicStats).reduce((sum, t) => sum + t.correct_answers, 0);
  const averageClassAccuracy = overallTotalAnswers > 0 ? Math.round((overallCorrectAnswers / overallTotalAnswers) * 100) : 0;

  res.json({
    classroom: cls,
    total_students: enrolledStudents.length,
    students: enrolledStudents,
    total_quiz_attempts: classAttempts.length,
    average_accuracy: averageClassAccuracy,
    topic_gaps: topicGaps,
  });
});

// POST /api/teacher/classes/:id/assignments - Create assignment for class
teacherRouter.post('/classes/:id/assignments', authenticate, requireRole('teacher'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const teacherId = req.user!.id;
    const cls = db.classes.find(c => c.id === req.params.id && c.teacher_id === teacherId);

    if (!cls) {
      res.status(404).json({ error: 'Class not found or unauthorized.' });
      return;
    }

    const { title, description = '', lesson_id, quiz_id, due_date } = req.body;
    if (!title) {
      res.status(400).json({ error: 'Assignment title is required.' });
      return;
    }

    const newAssignment: Assignment = {
      id: `asg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      class_id: cls.id,
      teacher_id: teacherId,
      title: title.trim(),
      description: description.trim(),
      lesson_id,
      quiz_id,
      due_date: due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    db.assignments.push(newAssignment);
    db.save();

    res.status(201).json({
      message: 'Assignment assigned to class successfully.',
      assignment: newAssignment,
    });
  } catch (err: any) {
    console.error('Assignment creation error:', err);
    res.status(500).json({ error: 'Failed to create assignment.' });
  }
});

// POST /api/classes/join - Student joins a class via Join Code
teacherRouter.post('/classes/join', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { join_code } = req.body;

    if (!join_code) {
      res.status(400).json({ error: 'Join code is required.' });
      return;
    }

    const cleanCode = String(join_code).trim().toUpperCase();
    const cls = db.classes.find(c => c.join_code.toUpperCase() === cleanCode);

    if (!cls) {
      res.status(404).json({ error: 'No class found matching this join code.' });
      return;
    }

    // Check if already member
    const existing = db.memberships.find(m => m.class_id === cls.id && m.student_id === userId);
    if (existing) {
      res.json({
        message: 'Already enrolled in this class.',
        classroom: cls,
      });
      return;
    }

    const membership: ClassMembership = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      class_id: cls.id,
      student_id: userId,
      joined_at: new Date().toISOString(),
    };

    db.memberships.push(membership);
    db.save();

    res.status(201).json({
      message: `Successfully joined "${cls.name}"!`,
      classroom: cls,
    });
  } catch (err: any) {
    console.error('Join class error:', err);
    res.status(500).json({ error: 'Failed to join class.' });
  }
});

// GET /api/classes/my - Student's enrolled classes and assignments
teacherRouter.get('/classes/my', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const memberships = db.memberships.filter(m => m.student_id === userId);
  const classIds = memberships.map(m => m.class_id);

  const enrolledClasses = db.classes.filter(c => classIds.includes(c.id));
  const classAssignments = db.assignments.filter(a => classIds.includes(a.class_id));

  res.json({
    enrolled_classes: enrolledClasses,
    assignments: classAssignments,
  });
});
