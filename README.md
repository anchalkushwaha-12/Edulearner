# LearnMate AI

**Tagline:** Quality Education for Every Student, Everywhere.  
**SDG Alignment:** UN Sustainable Development Goal 4 — Quality Education.

LearnMate AI is an AI-powered personalized learning platform purpose-built for students in rural India. It overcomes hurdles of limited tutoring, intermittent or low-bandwidth internet, and language difficulties by combining:
- Comprehensive multilingual curriculum (Hindi & English, NCERT/State Board aligned for Grades 6–10)
- Context-aware AI Tutoring (Socratic hints, step-by-step reasoning in Hindi and English)
- Document-grounded study workspace with secure passage retrieval
- Server-scored interactive quizzes with transparent mastery & learning gap detection
- Daily personalized study planning tailored to available study time
- Offline-first PWA caching and idempotent background sync
- Dedicated Teacher Portal for class tracking, assignments, and learning gap analytics

---

## Quickstart

### 1. Prerequisites
- Node.js 18+ (tested on Node v22)
- Optional: Python 3.10+ (for standalone FastAPI testing)

### 2. Environment Setup
Copy the environment template:
```bash
cp .env.example .env
```
Provide your `GEMINI_API_KEY` (or configure via the environment). In development mode without an external key, a safe educational fallback tutor operates automatically.

### 3. Installation
```bash
npm install
```

### 4. Running the Development Server
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

### 5. Running Tests
```bash
npm run test
```

### 6. Building for Production
```bash
npm run build
npm run start
```

---

## Architecture Summary
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Backend:** Express full-stack server running in Node.js with `@google/genai` (gemini-3.8-flash) server-side integration.
- **Standalone Backend Blueprint:** FastAPI + SQLAlchemy + Pydantic in `/backend` with `docker-compose.yml`.
- **Security:** Bcrypt salted passwords, HttpOnly JWT cookies, strict per-user and per-class authorization barriers.
