import { Router, Response } from 'express';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { notificationDb } from '../data/notificationStore';
import { emailDb } from '../data/emailStore';
import { emailService } from '../services/emailService';

export const notificationRouter = Router();

// GET /api/notifications - Get notifications for current authenticated user
notificationRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const notifications = notificationDb.getForUser(req.user.id);
  const unreadCount = notificationDb.getUnreadCount(req.user.id);

  res.json({
    notifications,
    unreadCount
  });
});

// GET /api/notifications/outbox - Admin & Manager: view persistent email delivery audit logs
notificationRouter.get('/outbox', requireAuth, requireRoles(['admin', 'manager']), (req: AuthenticatedRequest, res: Response): void => {
  const status = req.query.status as string;
  const eventType = req.query.eventType as string;

  const emails = emailDb.getAll({ status, eventType });
  res.json({
    emails,
    total: emails.length
  });
});

// POST /api/notifications/outbox/:id/retry - Admin: retry a failed email delivery
notificationRouter.post('/outbox/:id/retry', requireAuth, requireRoles(['admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const emailId = req.params.id;
  const updated = await emailService.retryFailedEmail(emailId);
  if (!updated) {
    res.status(404).json({ error: 'Email record not found' });
    return;
  }

  res.json({
    success: true,
    email: updated
  });
});

// GET /api/notifications/:id - Get single notification with strict ownership verification
notificationRouter.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const notif = notificationDb.getById(req.params.id);
  if (!notif) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }

  // Security Check: Customer can only view their own notifications
  if (req.user.role !== 'admin' && notif.userId !== req.user.id) {
    res.status(403).json({ error: 'Forbidden: Unauthorized access to notification details.' });
    return;
  }

  res.json({
    notification: notif
  });
});

// PATCH /api/notifications/:id/read - Mark single notification as read
notificationRouter.patch('/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const notif = notificationDb.getById(req.params.id);
  if (!notif) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }

  if (req.user.role !== 'admin' && notif.userId !== req.user.id) {
    res.status(403).json({ error: 'Forbidden: You cannot modify this notification.' });
    return;
  }

  const updated = notificationDb.markAsRead(req.params.id, notif.userId);
  res.json({
    success: true,
    notification: updated
  });
});

// POST /api/notifications/mark-all-read - Mark all as read for current user
notificationRouter.post('/mark-all-read', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const updatedCount = notificationDb.markAllAsRead(req.user.id);
  res.json({
    success: true,
    updatedCount
  });
});
