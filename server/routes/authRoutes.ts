import { Router, Response } from 'express';
import { db, User, StudentProfile } from '../db.js';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  sanitizeUser,
  authenticate,
  AuthenticatedRequest
} from '../auth.js';

export const authRouter = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Register
authRouter.post('/register', (req, res) => {
  try {
    const { email, password, full_name, role = 'student', language = 'hi', grade = 8, school_name } = req.body;

    if (!email || !password || !full_name) {
      res.status(400).json({ error: 'Email, password, and full name are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const newUser: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: normalizedEmail,
      password_hash: hashPassword(password),
      full_name: full_name.trim(),
      role: role === 'teacher' ? 'teacher' : 'student',
      language: language === 'en' ? 'en' : 'hi',
      grade: Number(grade) || 8,
      school_name: school_name ? school_name.trim() : undefined,
      created_at: new Date().toISOString(),
    };

    db.users.push(newUser);

    if (newUser.role === 'student') {
      const newProfile: StudentProfile = {
        user_id: newUser.id,
        daily_study_minutes: 45,
        preferred_subjects: ['Mathematics', 'Science'],
        learning_pace: 'moderate',
      };
      db.profiles.push(newProfile);
    }

    db.save();

    const token = generateToken(newUser);
    res.cookie('learnmate_token', token, COOKIE_OPTIONS);

    res.status(201).json({
      message: 'Account registered successfully.',
      user: sanitizeUser(newUser),
      token,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Login
authRouter.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user || !verifyPassword(password, user.password_hash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user);
    res.cookie('learnmate_token', token, COOKIE_OPTIONS);

    res.json({
      message: 'Logged in successfully.',
      user: sanitizeUser(user),
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Logout
authRouter.post('/logout', (_req, res) => {
  res.clearCookie('learnmate_token');
  res.json({ message: 'Logged out successfully.' });
});

// Get current user session
authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const profile = db.profiles.find(p => p.user_id === user.id);
  res.json({
    user: sanitizeUser(user),
    profile: profile || null,
  });
});

// Update profile / preferences
authRouter.put('/profile', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { language, grade, school_name, full_name, daily_study_minutes, preferred_subjects, learning_pace } = req.body;

    if (language && (language === 'hi' || language === 'en')) {
      user.language = language;
    }
    if (grade && Number(grade) >= 6 && Number(grade) <= 12) {
      user.grade = Number(grade);
    }
    if (school_name !== undefined) {
      user.school_name = school_name;
    }
    if (full_name) {
      user.full_name = full_name.trim();
    }

    let profile = db.profiles.find(p => p.user_id === user.id);
    if (!profile) {
      profile = {
        user_id: user.id,
        daily_study_minutes: daily_study_minutes || 45,
        preferred_subjects: preferred_subjects || ['Mathematics', 'Science'],
        learning_pace: learning_pace || 'moderate',
      };
      db.profiles.push(profile);
    } else {
      if (daily_study_minutes) profile.daily_study_minutes = Number(daily_study_minutes);
      if (preferred_subjects) profile.preferred_subjects = preferred_subjects;
      if (learning_pace) profile.learning_pace = learning_pace;
    }

    db.save();

    res.json({
      message: 'Profile updated successfully.',
      user: sanitizeUser(user),
      profile,
    });
  } catch (err: any) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Seed or Auto-Login Demo User for seamless testing
authRouter.post('/demo-login', (req, res) => {
  try {
    const role = req.body.role === 'teacher' ? 'teacher' : 'student';
    const demoEmail = role === 'teacher' ? 'sharma.teacher@ruraledu.in' : 'aarav.patel@ruraledu.in';
    let user = db.users.find(u => u.email === demoEmail);

    if (!user) {
      user = {
        id: `usr-demo-${role}-${Date.now()}`,
        email: demoEmail,
        password_hash: hashPassword('DemoPass123'),
        full_name: role === 'teacher' ? 'Smt. Kavita Sharma (Teacher)' : 'Aarav Patel (Student)',
        role,
        language: 'hi',
        grade: 8,
        school_name: 'Govt. Model Senior Secondary School, Sitapur',
        created_at: new Date().toISOString(),
      };
      db.users.push(user);

      if (role === 'student') {
        db.profiles.push({
          user_id: user.id,
          daily_study_minutes: 45,
          preferred_subjects: ['Mathematics', 'Science', 'Social Science'],
          learning_pace: 'moderate',
        });
      }
      db.save();
    }

    const token = generateToken(user);
    res.cookie('learnmate_token', token, COOKIE_OPTIONS);

    res.json({
      message: 'Demo login successful.',
      user: sanitizeUser(user),
      token,
    });
  } catch (err: any) {
    console.error('Demo login error:', err);
    res.status(500).json({ error: 'Demo login failed.' });
  }
});
