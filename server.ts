import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { authRouter } from './server/routes/authRoutes.js';
import { lessonRouter } from './server/routes/lessonRoutes.js';
import { aiRouter } from './server/routes/aiRoutes.js';
import { documentRouter } from './server/routes/documentRoutes.js';
import { quizRouter } from './server/routes/quizRoutes.js';
import { masteryRouter } from './server/routes/masteryRoutes.js';
import { studyPlanRouter } from './server/routes/studyPlanRoutes.js';
import { syncRouter } from './server/routes/syncRoutes.js';
import { teacherRouter } from './server/routes/teacherRoutes.js';
import { db } from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isDev = process.env.NODE_ENV !== 'production';

// Core Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Structured Request Logger (excludes passwords/secrets)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check endpoint (Milestone 1 requirement)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'LearnMate AI',
    timestamp: new Date().toISOString(),
    uptime_seconds: process.uptime(),
    database: {
      status: 'connected',
      total_lessons: db.lessons.length,
      total_quizzes: db.quizzes.length,
      total_users: db.users.length,
    },
    ai_provider: {
      configured: Boolean(process.env.GEMINI_API_KEY),
      model: 'gemini-3.8-flash',
      fallback_available: true,
    },
  });
});

// API Routes mounting
app.use('/api/auth', authRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/ai', aiRouter);
app.use('/api/documents', documentRouter);
app.use('/api/quizzes', quizRouter);
app.use('/api/mastery', masteryRouter);
app.use('/api/study-plan', studyPlanRouter);
app.use('/api/sync', syncRouter);
app.use('/api/teacher', teacherRouter);
app.use('/api', teacherRouter); // For /api/classes/join and /api/classes/my

// Web App Manifest endpoint
app.get('/manifest.webmanifest', (_req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.json({
    id: '/',
    name: 'LearnMate AI - Quality Education for Every Student',
    short_name: 'LearnMate',
    description: 'Accessible, personalized, multilingual learning platform for rural students with offline access.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: '#0d9488',
    background_color: '#f8fafc',
    icons: [
      {
        src: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=192&auto=format&fit=crop&q=80',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=512&auto=format&fit=crop&q=80',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ]
  });
});

// Consistent API error handling
app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled API exception:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected server error occurred.',
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LearnMate AI Server running on port ${PORT} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer().catch(err => {
  console.error('Fatal server boot failure:', err);
  process.exit(1);
});
