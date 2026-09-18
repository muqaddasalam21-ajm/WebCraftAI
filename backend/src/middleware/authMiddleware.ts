import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { userDb } from '../data/userStore';
import { SafeUser, UserRole } from '../models/user';

export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized: Authentication token is missing or invalid format.'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; email: string; role: string };
    const user = userDb.findById(decoded.userId);
    
    if (!user || user.status !== 'active') {
      res.status(401).json({
        error: 'Unauthorized: User account not found or deactivated.'
      });
      return;
    }

    req.user = userDb.toSafeUser(user);
    next();
  } catch (err) {
    res.status(401).json({
      error: 'Unauthorized: Invalid or expired session token.'
    });
  }
};

export const requireRoles = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: Access denied. Required role: [${roles.join(', ')}]. Your role: '${req.user.role}'.`
      });
      return;
    }

    next();
  };
};
