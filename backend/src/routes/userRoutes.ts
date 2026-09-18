import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { userDb } from '../data/userStore';
import { orderDb } from '../data/orderStore';
import { projectDb } from '../data/projectStore';
import { auditDb } from '../data/auditStore';
import { notificationDb } from '../data/notificationStore';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { UserRole, UserStatus } from '../models/user';

export const userRouter = Router();

// GET /api/users/stats (Admin, Manager)
userRouter.get('/stats', requireAuth, requireRoles(['admin', 'manager']), (req: AuthenticatedRequest, res: Response): void => {
  const stats = userDb.getStats();
  res.json({ stats });
});

// GET /api/users (Admin only with search, filters, sorting, pagination)
userRouter.get('/', requireAuth, requireRoles(['admin']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const search = req.query.search as string | undefined;
    const role = req.query.role as string | undefined;
    const status = req.query.status as string | undefined;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);

    const result = userDb.queryUsers({
      search,
      role,
      status,
      sortBy,
      sortOrder,
      page,
      limit
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to retrieve user list.' });
  }
});

// GET /api/users/:id (Admin only: full user profile & real account activity history)
userRouter.get('/:id', requireAuth, requireRoles(['admin']), (req: AuthenticatedRequest, res: Response): void => {
  const user = userDb.findById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const safeUser = userDb.toSafeUser(user);
  const userOrders = orderDb.queryOrders({ customerId: user.id, limit: 50 }).orders;
  const userProjects = projectDb.getProjects({ customerId: user.id });
  const userNotifications = notificationDb.getForUser(user.id);
  const userAuditLogs = auditDb.query({ userId: user.id, limit: 50 });

  res.json({
    user: safeUser,
    activity: {
      orders: userOrders,
      projects: userProjects,
      notifications: userNotifications,
      auditLogs: userAuditLogs
    }
  });
});

// PUT /api/users/:id (Admin only: Edit user profile & credentials)
userRouter.put('/:id', requireAuth, requireRoles(['admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, role, status, phone, bio, company } = req.body;
    const updated = userDb.update(req.params.id, {
      name,
      email,
      role: role ? (role.toLowerCase() as UserRole) : undefined,
      status: status ? (status.toLowerCase() as UserStatus) : undefined,
      profile: {
        fullName: name,
        phone,
        bio,
        company
      }
    });

    res.json({
      message: 'User updated successfully.',
      user: updated
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update user.' });
  }
});

// PATCH /api/users/:id/role (Admin only)
userRouter.patch('/:id/role', requireAuth, requireRoles(['admin']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { role } = req.body;
    if (!role || !['admin', 'user', 'vendor', 'manager'].includes(role.toLowerCase())) {
      res.status(400).json({ error: 'Invalid role specified.' });
      return;
    }

    const updated = userDb.update(req.params.id, {
      role: role.toLowerCase() as UserRole
    });

    res.json({
      message: 'User role updated successfully.',
      user: updated
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update user role.' });
  }
});

// PATCH /api/users/:id/status (Admin only)
userRouter.patch('/:id/status', requireAuth, requireRoles(['admin']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { status } = req.body;
    if (!status || !['active', 'inactive'].includes(status.toLowerCase())) {
      res.status(400).json({ error: 'Invalid status specified.' });
      return;
    }

    const updated = userDb.update(req.params.id, {
      status: status.toLowerCase() as UserStatus
    });

    res.json({
      message: 'User status updated successfully.',
      user: updated
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update user status.' });
  }
});

// DELETE /api/users/:id (Admin only)
userRouter.delete('/:id', requireAuth, requireRoles(['admin']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    userDb.delete(req.params.id);
    res.json({ message: 'User deleted successfully.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete user.' });
  }
});
