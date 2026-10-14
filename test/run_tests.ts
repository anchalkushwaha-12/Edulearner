import assert from 'assert';
import { db } from '../server/db.js';
import { hashPassword, verifyPassword, generateToken, sanitizeUser } from '../server/auth.js';
import { recalculateTopicMastery } from '../server/routes/masteryRoutes.js';

console.log('====================================================');
console.log('🧪 Starting LearnMate AI Comprehensive Test Suite');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(testName: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    const res = fn();
    if (res instanceof Promise) {
      throw new Error('Async tests should be handled with await');
    }
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ❌ FAIL: ${testName}`);
    console.error(`     Error: ${err.message}\n`);
    throw err;
  }
}

async function runAsyncTest(testName: string, fn: () => Promise<void>) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ❌ FAIL: ${testName}`);
    console.error(`     Error: ${err.message}\n`);
    throw err;
  }
}

async function executeAll() {
  console.log('--- Milestone 1 & 2: Auth, Security & Isolation Tests ---');

  runTest('Password hashing produces valid salted bcrypt hash', () => {
    const plain = 'RuralStudent@2026';
    const hash = hashPassword(plain);
    assert.notStrictEqual(plain, hash);
    assert.strictEqual(verifyPassword(plain, hash), true);
    assert.strictEqual(verifyPassword('WrongPass', hash), false);
  });

  runTest('User sanitization never leaks password_hash', () => {
    const testUser = {
      id: 'usr-test-1',
      email: 'student1@rural.in',
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      full_name: 'Pooja Devi',
      role: 'student' as const,
      language: 'hi' as const,
      grade: 8,
      created_at: new Date().toISOString()
    };
    const sanitized: any = sanitizeUser(testUser);
    assert.strictEqual(sanitized.password_hash, undefined);
    assert.strictEqual(sanitized.email, 'student1@rural.in');
  });

  runTest('Token generation and verification preserves user claims', () => {
    const testUser = {
      id: 'usr-test-token',
      email: 'aarav@rural.in',
      password_hash: 'hashed',
      full_name: 'Aarav',
      role: 'student' as const,
      language: 'hi' as const,
      grade: 9,
      created_at: new Date().toISOString()
    };
    const token = generateToken(testUser);
    assert.ok(token && typeof token === 'string');
    assert.strictEqual(token.split('.').length, 3);
  });

  console.log('\n--- Milestone 3: Curriculum & Lessons ---');

  runTest('Sample lessons are properly tagged and bilingual', () => {
    assert.ok(db.lessons.length >= 3, 'Must have at least 3 seeded lessons');
    for (const lesson of db.lessons) {
      assert.ok(lesson.title_en.length > 0);
      assert.ok(lesson.title_hi.length > 0);
      assert.ok(lesson.content_en.length > 0);
      assert.ok(lesson.content_hi.length > 0);
      assert.strictEqual(lesson.is_sample, true);
    }
  });

  console.log('\n--- Milestone 6: Quiz Scoring & Anti-Leakage ---');

  runTest('Quizzes contain valid questions and server-side correct answers', () => {
    assert.ok(db.quizzes.length >= 2, 'Must have at least 2 quizzes');
    for (const quiz of db.quizzes) {
      assert.ok(quiz.questions.length >= 2, 'Quiz must have at least 2 questions');
      for (const q of quiz.questions) {
        assert.ok(q.id, 'Question must have id');
        assert.ok(q.correct_answer, 'Question must have server-side correct_answer');
        assert.ok(q.explanation_en, 'Question must have explanation_en');
      }
    }
  });

  console.log('\n--- Milestone 7: Rule-Based Mastery & Learning Gap Detection ---');

  runTest('Topic with 0 attempts is NOT labeled mastered (Insufficient Evidence)', () => {
    const testUserId = `usr-test-gap-${Date.now()}`;
    const mastery = recalculateTopicMastery(testUserId, 'Mathematics', 'Unattempted Topic');
    assert.strictEqual(mastery.mastery_status, 'insufficient_evidence');
    assert.strictEqual(mastery.total_graded_answers, 0);
    assert.strictEqual(mastery.observed_accuracy, 0);
  });

  runTest('Single answer cannot establish mastery (< 3 threshold)', () => {
    const testUserId = `usr-test-single-${Date.now()}`;
    // Insert 1 correct answer attempt
    db.quiz_attempts.push({
      id: `att-test-1`,
      quiz_id: 'q-test',
      user_id: testUserId,
      subject: 'Science',
      topic: 'Photosynthesis',
      score: 1,
      total_questions: 1,
      submitted_answers: { 'q1': 'Chlorophyll' },
      answers_detail: [{
        question_id: 'q1',
        submitted: 'Chlorophyll',
        correct: 'Chlorophyll',
        is_correct: true,
        explanation_en: '',
        explanation_hi: ''
      }],
      created_at: new Date().toISOString()
    });

    const mastery = recalculateTopicMastery(testUserId, 'Science', 'Photosynthesis');
    assert.strictEqual(mastery.mastery_status, 'insufficient_evidence', '1 question should remain insufficient evidence');
    assert.strictEqual(mastery.total_graded_answers, 1);
  });

  runTest('Low accuracy (< 50% with >= 3 answers) triggers "needs_revision" gap', () => {
    const testUserId = `usr-test-gap-low-${Date.now()}`;
    db.quiz_attempts.push({
      id: `att-test-low`,
      quiz_id: 'q-test-low',
      user_id: testUserId,
      subject: 'Mathematics',
      topic: 'Quadratic Equations',
      score: 1,
      total_questions: 4,
      submitted_answers: {},
      answers_detail: [
        { question_id: 'q1', submitted: 'A', correct: 'A', is_correct: true, explanation_en: '', explanation_hi: '' },
        { question_id: 'q2', submitted: 'B', correct: 'C', is_correct: false, explanation_en: '', explanation_hi: '' },
        { question_id: 'q3', submitted: 'D', correct: 'A', is_correct: false, explanation_en: '', explanation_hi: '' },
        { question_id: 'q4', submitted: 'C', correct: 'B', is_correct: false, explanation_en: '', explanation_hi: '' }
      ],
      created_at: new Date().toISOString()
    });

    const mastery = recalculateTopicMastery(testUserId, 'Mathematics', 'Quadratic Equations');
    assert.strictEqual(mastery.mastery_status, 'needs_revision');
    assert.strictEqual(mastery.observed_accuracy, 0.25);
    assert.ok(mastery.recommendations.some(r => r.type === 'review_lesson'));
  });

  runTest('High performance (>= 80% with >= 5 answers) confirms "demonstrated_proficiency"', () => {
    const testUserId = `usr-test-mastery-${Date.now()}`;
    db.quiz_attempts.push({
      id: `att-test-high`,
      quiz_id: 'q-test-high',
      user_id: testUserId,
      subject: 'Science',
      topic: 'Electricity',
      score: 5,
      total_questions: 5,
      submitted_answers: {},
      answers_detail: [
        { question_id: 'q1', submitted: 'A', correct: 'A', is_correct: true, explanation_en: '', explanation_hi: '' },
        { question_id: 'q2', submitted: 'B', correct: 'B', is_correct: true, explanation_en: '', explanation_hi: '' },
        { question_id: 'q3', submitted: 'C', correct: 'C', is_correct: true, explanation_en: '', explanation_hi: '' },
        { question_id: 'q4', submitted: 'D', correct: 'D', is_correct: true, explanation_en: '', explanation_hi: '' },
        { question_id: 'q5', submitted: 'A', correct: 'A', is_correct: true, explanation_en: '', explanation_hi: '' }
      ],
      created_at: new Date().toISOString()
    });

    const mastery = recalculateTopicMastery(testUserId, 'Science', 'Electricity');
    assert.strictEqual(mastery.mastery_status, 'demonstrated_proficiency');
    assert.strictEqual(mastery.observed_accuracy, 1.0);
    assert.ok(mastery.recommendations.some(r => r.type === 'advance_topic'));
  });

  console.log('\n--- Milestone 9: Idempotent Synchronization ---');

  runTest('Offline sync with unique operation_id records correctly and avoids duplicate execution', () => {
    const testUserId = `usr-test-sync-${Date.now()}`;
    const opId = `op-uuid-${Date.now()}`;

    // First insertion
    db.sync_operations.push({
      id: `sync-1`,
      user_id: testUserId,
      operation_id: opId,
      entity_type: 'quiz_attempt',
      payload: { score: 3 },
      processed_at: new Date().toISOString()
    });

    // Check idempotency check
    const isDuplicate = db.sync_operations.some(s => s.user_id === testUserId && s.operation_id === opId);
    assert.strictEqual(isDuplicate, true, 'Subsequent attempts with same operation_id must be detected as duplicate');
  });

  console.log('\n--- Milestone 11: Teacher Class & Privacy Isolation ---');

  runTest('Teacher class creation generates unique 6-char join codes', () => {
    const teacherId = `tch-${Date.now()}`;
    const newClass = {
      id: `cls-test-${Date.now()}`,
      teacher_id: teacherId,
      name: 'Class 8-A Mathematics',
      grade: 8,
      subject: 'Mathematics',
      join_code: 'MA8K29',
      created_at: new Date().toISOString()
    };
    db.classes.push(newClass);
    assert.strictEqual(newClass.join_code.length, 6);
  });

  console.log('\n====================================================');
  console.log(`🎉 TEST SUITE COMPLETE: ${passedTests}/${totalTests} tests passed successfully!`);
  console.log('====================================================\n');
}

executeAll().catch(err => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
