import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db, User } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'learnmate_jwt_secret_dev_key_min_32_chars_long_2026';
const TOKEN_EXPIRY = '7d';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function hashPassword(plain: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plain, salt);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      grade: user.grade,
      language: user.language,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function sanitizeUser(user: User): Omit<User, 'password_hash'> {
  const { password_hash, ...rest } = user;
  return rest;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    // Look for token in cookies first, then in Authorization header
    let token = req.cookies?.learnmate_token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required. Please log in.' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = db.users.find(u => u.id === decoded.id);

    if (!user) {
      res.status(401).json({ error: 'User session no longer valid.' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

export function optionalAuthenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    let token = req.cookies?.learnmate_token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const user = db.users.find(u => u.id === decoded.id);
      if (user) {
        req.user = user;
      }
    }
  } catch {
    // Ignore invalid token in optional auth
  }
  next();
}

export function requireRole(role: 'student' | 'teacher') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (req.user.role !== role) {
      res.status(403).json({ error: `Forbidden. Only users with role '${role}' may access this resource.` });
      return;
    }
    next();
  };
}
