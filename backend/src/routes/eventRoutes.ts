import { Router, Response } from 'express';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { eventDb } from '../data/eventStore';
import { eventBus } from '../events/eventBus';
import { BusinessEventType, ReferenceType } from '../events/eventTypes';
import { EventValidationError } from '../events/eventValidator';

export const eventRouter = Router();

/**
 * GET /api/events
 * Admin & Manager: View disk-persisted, validated business events with filtering & pagination.
 */
eventRouter.get(
  '/',
  requireAuth,
  requireRoles(['admin', 'manager']),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      const eventType = req.query.eventType as BusinessEventType | undefined;
      const referenceType = req.query.referenceType as ReferenceType | undefined;
      const referenceId = req.query.referenceId as string | undefined;
      const actorUserId = req.query.actorUserId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

      const events = eventDb.getAll({
        eventType,
        referenceType,
        referenceId,
        actorUserId,
        limit,
        offset
      });

      res.json({
        events,
        count: events.length
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve events.';
      res.status(500).json({ error: message });
    }
  }
);

/**
 * GET /api/events/:id
 * Admin & Manager: Retrieve a single validated event by eventId.
 */
eventRouter.get(
  '/:id',
  requireAuth,
  requireRoles(['admin', 'manager']),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      const event = eventDb.getById(req.params.id);
      if (!event) {
        res.status(404).json({ error: `Event '${req.params.id}' not found.` });
        return;
      }
      res.json({ event });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve event.';
      res.status(500).json({ error: message });
    }
  }
);

/**
 * POST /api/events/publish
 * Admin & Manager: Manually trigger or test canonical event publication through the event bus.
 * Strictly runs schema validation, anti-secret scanning, disk persistence, and dispatch.
 */
eventRouter.post(
  '/publish',
  requireAuth,
  requireRoles(['admin', 'manager']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const input = req.body;
      const published = await eventBus.publishEvent(input);
      res.status(201).json({
        success: true,
        event: published
      });
    } catch (err: unknown) {
      if (err instanceof EventValidationError) {
        res.status(400).json({
          error: 'Event validation failed.',
          details: err.message,
          fieldErrors: err.fieldErrors
        });
        return;
      }
      const message = err instanceof Error ? err.message : 'Failed to publish event.';
      res.status(500).json({ error: message });
    }
  }
);
