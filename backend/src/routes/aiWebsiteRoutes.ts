import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { aiWebsiteDb } from '../data/aiWebsiteStore';
import { aiWebsiteGenerator } from '../services/aiWebsiteGenerator';
import { auditDb } from '../data/auditStore';
import { AiWebsiteInput } from '../models/aiWebsite';
import { validateWebsiteSpecification } from '../models/websiteSpecificationSchema';

export const aiWebsiteRouter = Router();

// POST /api/ai-builder/generate - Generate new canonical website specification
aiWebsiteRouter.post('/generate', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const input = req.body as AiWebsiteInput;

    if (!input.businessName || input.businessName.trim() === '') {
      res.status(400).json({ error: 'Business name is required.' });
      return;
    }

    if (!input.description || input.description.trim() === '') {
      res.status(400).json({ error: 'Business description is required.' });
      return;
    }

    const spec = await aiWebsiteGenerator.generate(
      input,
      { id: user.id, name: user.name, email: user.email }
    );

    const saved = aiWebsiteDb.create(spec, { id: user.id, name: user.name });

    // Audit trail logging
    auditDb.log({
      action: 'AI_WEBSITE_GENERATED' as any,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: saved.id,
      targetType: 'ai_website',
      details: `Generated canonical AI website specification for "${saved.title}" (${saved.businessType}).`,
      metadata: { websiteId: saved.id, provider: saved.aiMetadata?.provider, version: saved.version }
    });

    res.status(201).json({
      message: 'Website specification generated successfully.',
      website: saved
    });
  } catch (err: any) {
    console.error('Error generating AI website:', err);
    res.status(500).json({ error: err.message || 'Failed to generate website specification.' });
  }
});

// POST /api/ai-builder/:id/regenerate - Regenerate existing website specification in place
aiWebsiteRouter.post('/:id/regenerate', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const existing = aiWebsiteDb.getById(req.params.id);

    if (!existing) {
      res.status(404).json({ error: 'Website specification not found.' });
      return;
    }

    // Ownership check
    if (user.role !== 'admin' && user.role !== 'manager' && existing.customerId !== user.id && existing.createdBy !== user.id) {
      res.status(403).json({ error: 'Forbidden: You do not own this website project.' });
      return;
    }

    // Merge any updated inputs with original inputs
    const updatedInput: AiWebsiteInput = {
      ...(existing.originalInput || {
        businessName: existing.businessName,
        businessType: existing.businessType,
        description: existing.description,
        websitePurpose: existing.purpose
      }),
      ...req.body
    };

    const newSpec = await aiWebsiteGenerator.generate(
      updatedInput,
      { id: existing.customerId || existing.createdBy, name: existing.customerName || user.name, email: existing.customerEmail || user.email },
      existing.id,
      existing.version
    );

    const updated = aiWebsiteDb.update(
      existing.id,
      newSpec,
      { id: user.id, name: user.name },
      req.body.changeNote || `Regenerated with AI refinement`
    );

    auditDb.log({
      action: 'AI_WEBSITE_REGENERATED' as any,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: updated.id,
      targetType: 'ai_website',
      details: `Regenerated AI website specification for "${updated.title}" (v${updated.version}).`,
      metadata: { websiteId: updated.id, version: updated.version }
    });

    res.json({
      message: 'Website specification regenerated successfully.',
      website: updated
    });
  } catch (err: any) {
    console.error('Error regenerating AI website:', err);
    res.status(500).json({ error: err.message || 'Failed to regenerate website specification.' });
  }
});

// GET /api/ai-builder - List websites (Scoped: user/vendor gets own, admin/manager gets all)
aiWebsiteRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    let websites = [];

    if (user.role !== 'admin' && user.role !== 'manager') {
      websites = aiWebsiteDb.getByCustomerId(user.id);
    } else {
      const search = req.query.search as string;
      const businessType = req.query.businessType as string;
      websites = aiWebsiteDb.getAll({ search, businessType });
    }

    res.json({
      websites,
      total: websites.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch websites.' });
  }
});

// GET /api/ai-builder/:id - Get single website specification
aiWebsiteRouter.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    const website = aiWebsiteDb.getById(req.params.id);

    if (!website) {
      res.status(404).json({ error: 'Website specification not found.' });
      return;
    }

    if (user.role !== 'admin' && user.role !== 'manager' && website.customerId !== user.id && website.createdBy !== user.id) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to view this website.' });
      return;
    }

    res.json({ website });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve website details.' });
  }
});

// GET /api/ai-builder/:id/versions - Get revision history for a website
aiWebsiteRouter.get('/:id/versions', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    const website = aiWebsiteDb.getById(req.params.id);

    if (!website) {
      res.status(404).json({ error: 'Website specification not found.' });
      return;
    }

    if (user.role !== 'admin' && user.role !== 'manager' && website.customerId !== user.id && website.createdBy !== user.id) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to view revision history.' });
      return;
    }

    const versions = aiWebsiteDb.getVersions(req.params.id);
    res.json({ versions });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve website versions.' });
  }
});

// POST /api/ai-builder/:id/restore/:version - Restore a historical revision
aiWebsiteRouter.post('/:id/restore/:version', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    const website = aiWebsiteDb.getById(req.params.id);
    const versionNum = parseInt(req.params.version, 10);

    if (!website) {
      res.status(404).json({ error: 'Website specification not found.' });
      return;
    }

    if (isNaN(versionNum)) {
      res.status(400).json({ error: 'Invalid version number.' });
      return;
    }

    if (user.role !== 'admin' && user.role !== 'manager' && website.customerId !== user.id && website.createdBy !== user.id) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to restore revisions for this website.' });
      return;
    }

    const restored = aiWebsiteDb.restoreVersion(req.params.id, versionNum, user.id);

    auditDb.log({
      action: 'AI_WEBSITE_REGENERATED' as any,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: restored.id,
      targetType: 'ai_website',
      details: `Restored website specification "${restored.title}" to revision v${versionNum} (now v${restored.version}).`,
      metadata: { websiteId: restored.id, restoredFromVersion: versionNum, newVersion: restored.version }
    });

    res.json({
      message: `Successfully restored website revision to v${versionNum} (new active version is v${restored.version}).`,
      website: restored
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to restore revision.' });
  }
});

// PUT /api/ai-builder/:id - Update website specification manually (Used by Editor)
aiWebsiteRouter.put('/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    const existing = aiWebsiteDb.getById(req.params.id);

    if (!existing) {
      res.status(404).json({ error: 'Website specification not found.' });
      return;
    }

    if (user.role !== 'admin' && user.role !== 'manager' && existing.customerId !== user.id && existing.createdBy !== user.id) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to modify this website.' });
      return;
    }

    // Pre-validate incoming changes before updating
    const mergedCandidate = {
      ...existing,
      ...req.body,
      id: existing.id,
      websiteId: existing.websiteId,
      version: existing.version + 1
    };

    const validation = validateWebsiteSpecification(mergedCandidate);
    if (!validation.isValid) {
      res.status(400).json({
        error: 'Specification validation failed.',
        details: validation.errors
      });
      return;
    }

    const updated = aiWebsiteDb.update(
      req.params.id,
      req.body,
      { id: user.id, name: user.name },
      req.body.changeNote || 'Manual editor update'
    );

    res.json({
      message: 'Website updated successfully.',
      website: updated
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update website.' });
  }
});

// DELETE /api/ai-builder/:id - Delete website specification
aiWebsiteRouter.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    const existing = aiWebsiteDb.getById(req.params.id);

    if (!existing) {
      res.status(404).json({ error: 'Website specification not found.' });
      return;
    }

    if (user.role !== 'admin' && user.role !== 'manager' && existing.customerId !== user.id && existing.createdBy !== user.id) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to delete this website.' });
      return;
    }

    aiWebsiteDb.delete(req.params.id);
    res.json({ message: 'Website specification deleted successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete website.' });
  }
});
