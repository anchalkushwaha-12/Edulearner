# LearnMate AI — Architecture Specification

**Tagline:** Quality Education for Every Student, Everywhere.  
**SDG Alignment:** UN Sustainable Development Goal 4 (Quality Education).  
**Primary Users:** Rural school students facing limited tutoring, intermittent connectivity, and language barriers (Hindi & English); secondary: teachers and guardians.

---

## 1. System Overview

LearnMate AI is architected as an offline-first, multilingual, AI-assisted learning platform. It runs as an Express + Vite full-stack service in Node.js/TypeScript (development & container runtime) and provides a modular Python FastAPI backend blueprint for enterprise PostgreSQL deployments.

```
+------------------------------------------------------------------------+
|                            Browser / Client                            |
|  +------------------------------------------------------------------+  |
|  | Next-gen React SPA (Tailwind CSS, Mobile-first, PWA Offline Hub) |  |
|  | - Service Worker & Cache Storage (Offline Lessons & Quizzes)    |  |
|  | - IndexedDB / LocalStorage Operation Journal (Idempotent Sync)   |  |
|  | - Bilingual UI (Hindi / English), Web Speech API & TTS Replay   |  |
|  +------------------------------------------------------------------+  |
+-----------------------------------|------------------------------------+
                                    | REST / JSON + HttpOnly Cookies
                                    v
+------------------------------------------------------------------------+
|                   Full-Stack Application Server                        |
|  +------------------------------------------------------------------+  |
|  | Express Router + Middlewares                                     |  |
|  | - Auth & Session Guard (JWT / Secure Cookie Isolation)           |  |
|  | - Role-Based Access Control (Student vs Teacher Class Boundary)  |  |
|  | - Rate Limiter & Structured Audit Logging                        |  |
|  +------------------------------------------------------------------+  |
|  | Core Domain Engines                                              |  |
|  | - Lesson & Curriculum Catalog (CBSE/State Board Grade 6-10)      |  |
|  | - Document Learning & Safe RAG Pipeline (Chunking & Retrieval)   |  |
|  | - Server-Side Quiz Scoring Engine (Zero client score leakage)   |  |
|  | - Transparent Rule-Based Mastery Engine (GAP Detection)         |  |
|  | - Personalized Study Planner (Available time budgeting)         |  |
|  | - Offline Idempotent Sync Handler (De-duplication & replay)      |  |
|  +------------------------------------------------------------------+  |
|  | AI Provider Abstraction                                          |  |
|  | - @google/genai Server-Side SDK (gemini-3.8-flash)                |  |
|  | - Deterministic Safe Fallback / Mock Engine (No silent failure)  |  |
|  | - Multilingual Prompt Architectures (Hindi + English)            |  |
|  +------------------------------------------------------------------+  |
|  | Persistence Layer                                                |  |
|  | - File-backed relational JSON DB with ACID-like atomic writes   |  |
|  | - Python FastAPI / PostgreSQL / SQLAlchemy / Alembic migration  |  |
|  +------------------------------------------------------------------+  |
+------------------------------------------------------------------------+
```

---

## 2. Security & Student Privacy Architecture

1. **Per-User Data Isolation:** Every query on student attempts, chats, study tasks, and documents strictly enforces `WHERE user_id = current_user.id`.
2. **Teacher Class Boundary:** Teachers can only view aggregated metrics and assigned homework for enrolled students in classes created by that teacher. Private student AI tutoring chats are never exposed to teachers.
3. **Password Security:** Salted hashes using bcrypt (`bcryptjs`). Passwords are never serialized into API responses.
4. **Server-Side AI Secrets:** The `@google/genai` SDK is invoked only on the server using `process.env.GEMINI_API_KEY`. No API keys or external tokens are exposed to the browser.
5. **Prompt Injection & Untrusted Content Shield:** Uploaded student documents are treated as untrusted text strings with clear delimiters; instructions embedded inside uploaded materials are blocked from overriding system instructions.

---

## 3. Mastery & Learning Gap Detection Engine

Rule-based mastery formula:
$$\text{Observed Accuracy} = \frac{\text{Correct Graded Answers}}{\text{Total Graded Answers}}$$

Classification rules:
* **Insufficient Evidence:** Total graded questions $< 3$.
* **Needs Revision:** Total graded questions $\ge 3$ and Accuracy $< 50\%$.
* **Developing:** Total graded questions $\ge 3$ and $50\% \le \text{Accuracy} < 80\%$.
* **Demonstrated Proficiency:** Total graded questions $\ge 5$ and Accuracy $\ge 80\%$.

Recommendations are generated deterministically based on gaps (suggesting prerequisite lessons, simpler questions, and targeted revision tasks).

---

## 4. Offline & Low-Bandwidth Sync Strategy

* **PWA & Cache Storage:** Lessons, curriculums, and pre-generated quizzes are cached locally.
* **Offline Quiz Attempts:** Stored in an IndexedDB/LocalStorage sync journal with client-generated UUIDs (`operation_id`).
* **Idempotent Reconciliation:** The server tracks processed `operation_id`s. Re-transmissions do not double-score or inflate attempts.
* **Connectivity Indicators:** AI Tutor clearly notifies students when offline, falling back to cached revision notes and offline quizzes.
