import { Router, Response } from 'express';
import { db, StudyPlan, StudyPlanTask } from '../db.js';
import { authenticate, AuthenticatedRequest } from '../auth.js';

export const studyPlanRouter = Router();

// GET /api/study-plan/today - Get or generate today's budgeted plan
studyPlanRouter.get('/today', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const todayStr = new Date().toISOString().split('T')[0];

  let plan = db.study_plans.find(p => p.user_id === userId && p.date === todayStr);
  const profile = db.profiles.find(p => p.user_id === userId);
  const dailyBudget = profile?.daily_study_minutes || 45;

  if (!plan) {
    // Generate intelligent plan grounded in mastery gaps and student grade
    const studentGrade = req.user!.grade || 8;
    const userMastery = db.topic_mastery.filter(m => m.user_id === userId);

    // 1. Check topics needing revision
    const revisionNeeded = userMastery.filter(m => m.mastery_status === 'needs_revision');
    // 2. Check topics with insufficient evidence or unstarted lessons
    const gradeLessons = db.lessons.filter(l => l.grade === studentGrade);

    const tasks: StudyPlanTask[] = [];
    let allocatedMinutes = 0;

    // Task 1: Revision task if student has gaps
    if (revisionNeeded.length > 0 && allocatedMinutes + 20 <= dailyBudget) {
      const target = revisionNeeded[0];
      const lesson = db.lessons.find(l => l.topic.toLowerCase() === target.topic.toLowerCase());
      tasks.push({
        id: `tsk-${Date.now()}-1`,
        title_en: `Targeted Revision: ${target.topic}`,
        title_hi: `लक्ष्यबद्ध पुनरावलोकन: ${target.topic}`,
        subject: target.subject,
        topic: target.topic,
        lesson_id: lesson?.id,
        estimated_minutes: 20,
        status: 'pending',
        due_date: todayStr,
        reason_en: `Accuracy is currently ${Math.round(target.observed_accuracy * 100)}%. Revising key points will close this learning gap.`,
        reason_hi: `वर्तमान सटीकता ${Math.round(target.observed_accuracy * 100)}% है। मुख्य बिंदुओं को दोहराने से दक्षता बढ़ेगी।`,
      });
      allocatedMinutes += 20;
    }

    // Task 2: Core lesson progression
    for (const les of gradeLessons) {
      if (allocatedMinutes + 25 <= dailyBudget) {
        const isAlreadyAdded = tasks.some(t => t.topic === les.topic);
        if (!isAlreadyAdded) {
          tasks.push({
            id: `tsk-${Date.now()}-2-${les.id.slice(-4)}`,
            title_en: `Core Lesson: ${les.title_en}`,
            title_hi: `मूल पाठ: ${les.title_hi}`,
            subject: les.subject,
            topic: les.topic,
            lesson_id: les.id,
            estimated_minutes: 25,
            status: 'pending',
            due_date: todayStr,
            reason_en: `Aligned with Grade ${studentGrade} NCERT curriculum.`,
            reason_hi: `कक्षा ${studentGrade} के पाठ्यक्रम पर आधारित।`,
          });
          allocatedMinutes += 25;
          break;
        }
      }
    }

    // Task 3: Quick assessment or quiz practice
    if (allocatedMinutes + 15 <= dailyBudget) {
      tasks.push({
        id: `tsk-${Date.now()}-3`,
        title_en: 'Practice & Self-Check Quiz',
        title_hi: 'स्व-मूल्यांकन अभ्यास प्रश्नोत्तरी',
        subject: tasks[0]?.subject || 'Mathematics',
        topic: tasks[0]?.topic || 'Fractions and Decimals',
        estimated_minutes: 15,
        status: 'pending',
        due_date: todayStr,
        reason_en: 'Reinforces learning and feeds gap detection accuracy.',
        reason_hi: 'दक्षता सुदृढ़ करने और प्रगति जाँचने के लिए।',
      });
      allocatedMinutes += 15;
    }

    // If still no tasks, create a standard foundation task
    if (tasks.length === 0) {
      tasks.push({
        id: `tsk-${Date.now()}-init`,
        title_en: 'Daily Concept Revision & Notes Review',
        title_hi: 'दैनिक अवधारणा पुनरावलोकन',
        subject: 'Mathematics',
        topic: 'Fundamental Concepts',
        estimated_minutes: 30,
        status: 'pending',
        due_date: todayStr,
        reason_en: 'Scheduled to match your 45-minute daily study preference.',
        reason_hi: 'आपके दैनिक अध्ययन समय के अनुसार निर्धारित।',
      });
    }

    plan = {
      id: `sp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      date: todayStr,
      tasks,
      created_at: new Date().toISOString(),
    };

    db.study_plans.push(plan);
    db.save();
  }

  res.json({
    plan,
    daily_study_minutes_budget: dailyBudget,
    total_allocated_minutes: plan.tasks.reduce((sum, t) => sum + t.estimated_minutes, 0),
  });
});

// PATCH /api/study-plan/tasks/:id - Update task status (completed, pending, rescheduled)
studyPlanRouter.patch('/tasks/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status, rescheduled_date } = req.body;

    if (!['pending', 'completed', 'rescheduled'].includes(status)) {
      res.status(400).json({ error: 'Invalid task status.' });
      return;
    }

    let foundTask: StudyPlanTask | null = null;
    let parentPlan: StudyPlan | null = null;

    for (const plan of db.study_plans) {
      if (plan.user_id === userId) {
        const task = plan.tasks.find(t => t.id === req.params.id);
        if (task) {
          foundTask = task;
          parentPlan = plan;
          break;
        }
      }
    }

    if (!foundTask || !parentPlan) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    foundTask.status = status;
    if (status === 'rescheduled' && rescheduled_date) {
      foundTask.due_date = rescheduled_date;
    }

    db.save();

    res.json({
      message: 'Task updated successfully.',
      task: foundTask,
    });
  } catch (err: any) {
    console.error('Task update error:', err);
    res.status(500).json({ error: 'Failed to update study plan task.' });
  }
});
