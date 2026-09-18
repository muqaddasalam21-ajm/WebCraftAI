import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { userDb } from '../data/userStore';
import { auditDb } from '../data/auditStore';
import { notificationDb } from '../data/notificationStore';
import { emailService } from '../services/emailService';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { eventBus } from '../events/eventBus';

export const authRouter = Router();

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

authRouter.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Full name is required (at least 2 characters).' });
      return;
    }

    if (!email || typeof email !== 'string' || !validateEmail(email.trim())) {
      res.status(400).json({ error: 'A valid email address is required.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters in length.' });
      return;
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = userDb.findByEmail(normalizedEmail);
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const safeUser = userDb.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user'
    });

    // Publish canonical validated USER_REGISTERED event (dispatches in-app notifications, emails, and audit log)
    try {
      await eventBus.publishEvent({
        eventType: 'USER_REGISTERED',
        actorUserId: safeUser.id,
        referenceType: 'USER',
        referenceId: safeUser.id,
        payload: {
          userId: safeUser.id,
          name: safeUser.name,
          email: safeUser.email,
          role: safeUser.role,
          createdAt: safeUser.createdAt
        }
      });
    } catch (eventErr) {
      console.error('[Auth] Failed to publish USER_REGISTERED event:', eventErr);
    }

    const token = jwt.sign(
      { userId: safeUser.id, email: safeUser.email, role: safeUser.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully.',
      user: safeUser,
      token
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'An unexpected server error occurred during registration.' });
  }
});

authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = userDb.findByEmail(normalizedEmail);

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ error: 'Your account is deactivated. Please contact support.' });
      return;
    }

    const safeUser = userDb.toSafeUser(user);
    const token = jwt.sign(
      { userId: safeUser.id, email: safeUser.email, role: safeUser.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful.',
      user: safeUser,
      token
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Unable to connect. Please try again.' });
  }
});

authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  res.json({
    user: req.user
  });
});

authRouter.post('/logout', (req: Request, res: Response): void => {
  res.json({ message: 'Logged out successfully.' });
});

authRouter.get('/users', requireAuth, requireRoles(['admin']), (req: AuthenticatedRequest, res: Response): void => {
  const users = userDb.getAll();
  res.json({
    users,
    total: users.length
  });
});
