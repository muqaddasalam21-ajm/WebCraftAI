import { Router, Response } from 'express';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { projectDb } from '../data/projectStore';
import { TaskStatus, PriorityLevel } from '../models/project';

export const taskRouter = Router();

// PUT /api/tasks/:taskId - Update task details (Admin & Manager only)
taskRouter.put('/:taskId', requireAuth, requireRoles(['admin', 'manager']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, priority, assignedTo, dueDate } = req.body;
    const task = projectDb.updateTask(req.params.taskId, {
      title,
      description,
      priority: priority as PriorityLevel,
      assignedTo,
      dueDate
    });

    res.json({
      message: 'Task updated successfully.',
      task
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update task.' });
  }
});

// PATCH /api/tasks/:taskId/status - Update task status (Admin & Manager only)
taskRouter.patch('/:taskId/status', requireAuth, requireRoles(['admin', 'manager']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: 'status is required.' });
      return;
    }

    const task = projectDb.updateTaskStatus(req.params.taskId, status as TaskStatus);
    res.json({
      message: `Task status updated to ${status}.`,
      task
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update task status.' });
  }
});

// DELETE /api/tasks/:taskId - Delete a task (Admin & Manager only)
taskRouter.delete('/:taskId', requireAuth, requireRoles(['admin', 'manager']), (req: AuthenticatedRequest, res: Response) => {
  try {
    projectDb.deleteTask(req.params.taskId);
    res.json({ message: 'Task deleted successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete task.' });
  }
});
