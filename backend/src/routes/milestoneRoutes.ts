import { Router, Response } from 'express';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { projectDb } from '../data/projectStore';
import { MilestoneStatus } from '../models/project';

export const milestoneRouter = Router();

// PUT /api/milestones/:milestoneId - Update milestone details (Admin & Manager only)
milestoneRouter.put('/:milestoneId', requireAuth, requireRoles(['admin', 'manager']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, dueDate, sortOrder } = req.body;
    const milestone = projectDb.updateMilestone(req.params.milestoneId, {
      name,
      description,
      dueDate,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined
    });

    res.json({
      message: 'Milestone updated successfully.',
      milestone
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update milestone.' });
  }
});

// PATCH /api/milestones/:milestoneId/status - Update milestone status (Admin & Manager only)
milestoneRouter.patch('/:milestoneId/status', requireAuth, requireRoles(['admin', 'manager']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: 'status is required.' });
      return;
    }

    const milestone = projectDb.updateMilestoneStatus(req.params.milestoneId, status as MilestoneStatus);
    res.json({
      message: `Milestone status updated to ${status}.`,
      milestone
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update milestone status.' });
  }
});

// DELETE /api/milestones/:milestoneId - Delete milestone (Admin & Manager only)
milestoneRouter.delete('/:milestoneId', requireAuth, requireRoles(['admin', 'manager']), (req: AuthenticatedRequest, res: Response) => {
  try {
    projectDb.deleteMilestone(req.params.milestoneId);
    res.json({ message: 'Milestone deleted successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete milestone.' });
  }
});
