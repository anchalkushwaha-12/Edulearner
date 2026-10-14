import { Router, Response } from 'express';
import { db, TopicMastery } from '../db.js';
import { authenticate, AuthenticatedRequest } from '../auth.js';

export const masteryRouter = Router();

// Master Calculation Function (used by quiz submission and on-demand refresh)
export function recalculateTopicMastery(userId: string, subject: string, topic: string): TopicMastery {
  // Find all attempts for this user and topic
  const attempts = db.quiz_attempts.filter(
    a => a.user_id === userId && a.topic.toLowerCase() === topic.toLowerCase()
  );

  let totalGraded = 0;
  let correctGraded = 0;

  for (const att of attempts) {
    for (const ans of att.answers_detail) {
      totalGraded += 1;
      if (ans.is_correct) {
        correctGraded += 1;
      }
    }
  }

  const accuracy = totalGraded > 0 ? Number((correctGraded / totalGraded).toFixed(2)) : 0;

  // Determine status according to specification rules
  let status: TopicMastery['mastery_status'] = 'insufficient_evidence';
  const recommendations: TopicMastery['recommendations'] = [];

  // Associated lesson lookup
  const associatedLesson = db.lessons.find(l => l.topic.toLowerCase() === topic.toLowerCase());

  if (totalGraded < 3) {
    status = 'insufficient_evidence';
    recommendations.push({
      type: 'review_lesson',
      message_en: `Attempt at least 3 questions in "${topic}" to establish an initial mastery baseline.`,
      message_hi: `"${topic}" में कम से कम 3 प्रश्नों का उत्तर देकर अपनी मूलभूत दक्षता स्थापित करें।`,
      lesson_id: associatedLesson?.id,
    });
  } else if (accuracy < 0.50) {
    status = 'needs_revision';
    recommendations.push(
      {
        type: 'review_lesson',
        message_en: `High learning gap detected (Accuracy: ${Math.round(accuracy * 100)}%). Review the core lesson concepts and notes.`,
        message_hi: `सीखने में अंतर देखा गया (सटीकता: ${Math.round(accuracy * 100)}%)। कृपया मूल पाठ और मुख्य बिंदुओं को दोहराएँ।`,
        lesson_id: associatedLesson?.id,
      },
      {
        type: 'practice_simpler',
        message_en: 'Practice simpler foundation problems before attempting multi-step questions.',
        message_hi: 'कठिन प्रश्नों से पहले बुनियादी और सरल प्रश्नों का अभ्यास करें।',
      }
    );
  } else if (accuracy < 0.80) {
    status = 'developing';
    recommendations.push(
      {
        type: 'take_revision_quiz',
        message_en: `Good foundation (Accuracy: ${Math.round(accuracy * 100)}%). Take a quick revision quiz to achieve proficiency.`,
        message_hi: `अच्छी शुरुआत (सटीकता: ${Math.round(accuracy * 100)}%)। पूर्ण दक्षता प्राप्त करने के लिए अभ्यास प्रश्नोत्तरी हल करें।`,
      }
    );
  } else {
    // Demonstrated proficiency (requires at least 5 questions for solid evidence)
    if (totalGraded >= 5) {
      status = 'demonstrated_proficiency';
      recommendations.push({
        type: 'advance_topic',
        message_en: `Mastery achieved! (Accuracy: ${Math.round(accuracy * 100)}%). Ready to advance to higher grade topics.`,
        message_hi: `दक्षता सिद्ध हुई! (सटीकता: ${Math.round(accuracy * 100)}%)। आप अगले उच्च स्तर के विषय पर आगे बढ़ने के लिए तैयार हैं।`,
      });
    } else {
      status = 'developing';
      recommendations.push({
        type: 'take_revision_quiz',
        message_en: 'Strong start! Answer 2 more questions to confirm demonstrated proficiency.',
        message_hi: 'शानदार शुरुआत! अपनी दक्षता की पुष्टि के लिए 2 और प्रश्नों का अभ्यास करें।',
      });
    }
  }

  // Update or insert into db.topic_mastery
  let record = db.topic_mastery.find(
    m => m.user_id === userId && m.topic.toLowerCase() === topic.toLowerCase()
  );

  const now = new Date().toISOString();

  if (!record) {
    record = {
      id: `tm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      subject,
      topic,
      total_graded_answers: totalGraded,
      correct_answers: correctGraded,
      observed_accuracy: accuracy,
      mastery_status: status,
      recommendations,
      last_calculated_at: now,
    };
    db.topic_mastery.push(record);
  } else {
    record.total_graded_answers = totalGraded;
    record.correct_answers = correctGraded;
    record.observed_accuracy = accuracy;
    record.mastery_status = status;
    record.recommendations = recommendations;
    record.last_calculated_at = now;
  }

  db.save();
  return record;
}

// GET /api/mastery - Get all mastery and learning gap statuses for current student
masteryRouter.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  // Ensure all known topics in lessons have a record
  const allTopics = Array.from(new Set(db.lessons.map(l => ({ subject: l.subject, topic: l.topic }))));
  for (const item of allTopics) {
    const existing = db.topic_mastery.find(
      m => m.user_id === userId && m.topic.toLowerCase() === item.topic.toLowerCase()
    );
    if (!existing) {
      recalculateTopicMastery(userId, item.subject, item.topic);
    }
  }

  const records = db.topic_mastery.filter(m => m.user_id === userId);

  // Summary counts
  const summary = {
    total_topics: records.length,
    needs_revision: records.filter(r => r.mastery_status === 'needs_revision').length,
    developing: records.filter(r => r.mastery_status === 'developing').length,
    demonstrated_proficiency: records.filter(r => r.mastery_status === 'demonstrated_proficiency').length,
    insufficient_evidence: records.filter(r => r.mastery_status === 'insufficient_evidence').length,
  };

  res.json({
    summary,
    topics: records,
  });
});
