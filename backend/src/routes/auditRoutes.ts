import { Router, Response } from 'express';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { auditDb } from '../data/auditStore';

export const auditRouter = Router();

// GET /api/audit-logs (Admin & Manager only)
auditRouter.get('/', requireAuth, requireRoles(['admin', 'manager']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { userId, action, targetId, limit } = req.query;
    const logs = auditDb.query({
      userId: userId as string,
      action: action as string,
      targetId: targetId as string,
      limit: limit ? parseInt(limit as string, 10) : 50
    });
    res.json({ logs, total: logs.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch audit logs.' });
  }
});
