# LearnMate AI — Testing Strategy & Execution Log

## 1. Testing Framework & Protocols

The test suite exercises the system across functional, security, data integrity, and error boundaries:

1. **Authentication & Authorization:**
   - Password hashing with bcrypt.
   - Unauthorized requests to protected routes rejected with 401.
   - User data isolation (Student A cannot read or modify Student B's submissions or study plans).
   - Sensitive fields (passwords) are strictly excluded from API outputs.
2. **Quiz Scoring & Answer Leakage:**
   - Pre-submission questions contain zero `is_correct` flags or solution answers.
   - Server-side scoring performs deterministic evaluation.
   - Duplicate submissions with the same operation ID return idempotently without duplicate scoring.
3. **Mastery & Learning Gap Detection Engine:**
   - Evaluates minimum evidence threshold (< 3 questions = Insufficient Evidence).
   - Accurate categorization: Needs Revision (< 50%), Developing (50–79%), Demonstrated Proficiency (>= 80% with >= 5 questions).
   - Topics with 0 attempts are never marked as mastered.
4. **Document Processing & Retrieval:**
   - Upload file type & size validation.
   - Chunking and lexical/semantic passage retrieval.
   - Grounded answering with citations and lack-of-evidence indicators.
5. **Offline & Sync Reliability:**
   - LocalStorage / IndexedDB sync payload structure.
   - Server idempotency using unique `operation_id`s.

## 2. Test Execution Command

Run the automated integration and regression test suite:
```bash
npm run test
```
Or directly:
```bash
npx tsx test/run_tests.ts
```

For Python standalone test suite (when Python & pytest dependencies are available):
```bash
pytest backend/tests
```
