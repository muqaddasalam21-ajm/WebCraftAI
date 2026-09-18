/**
 * Phase 14 — Deployment Routes
 * Secure backend endpoints for website publishing workflow.
 *
 * POST   /api/projects/:id/deploy          — Admin/Manager: initiate deployment
 * GET    /api/projects/:id/deployments     — Auth (ownership): get history
 * GET    /api/deployments/:id              — Auth (ownership): get single record
 * POST   /api/deployments/:id/unpublish    — Admin/Manager: unpublish
 * POST   /api/projects/:id/domains         — Admin/Manager: add custom domain
 * GET    /api/projects/:id/domains         — Auth (ownership): get domains
 * DELETE /api/projects/:id/domains/:domainId — Admin/Manager: remove domain
 * GET    /api/deploy/config                — Admin: get provider config status
 */

import { Router, Response } from 'express';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { projectDb } from '../data/projectStore';
import { aiWebsiteDb } from '../data/aiWebsiteStore';
import { deploymentDb } from '../data/deploymentStore';
import { domainDb } from '../data/domainStore';
import { deploymentProvider, getProviderConfigurationStatus } from '../services/deploymentProvider';
import { buildWebsiteArtifact, validateSpecForBuild } from '../services/websiteBuildService';
import { eventBus } from '../events/eventBus';

export const deploymentRouter = Router();

// ---------------------------------------------------------------------------
// GET /config — Provider configuration status (Admin only)
// ---------------------------------------------------------------------------
deploymentRouter.get('/config', requireAuth, requireRoles(['admin']), (req: AuthenticatedRequest, res: Response): void => {
  const config = getProviderConfigurationStatus();
  // Never expose actual secret values — only variable names and configured status
  res.json({
    provider: config.provider,
    isConfigured: config.isConfigured,
    requirements: config.requirements
  });
});

// ---------------------------------------------------------------------------
// POST /api/projects/:id/deploy — Initiate deployment (Admin/Manager only)
// ---------------------------------------------------------------------------
deploymentRouter.post('/:id/deploy', requireAuth, requireRoles(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id: projectId } = req.params;
    const actor = req.user!;

    // 1. Validate project exists
    const project = projectDb.getProjectById(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    // 2. Validate project is not cancelled
    if (project.status === 'CANCELLED') {
      res.status(400).json({ error: 'Cannot publish a cancelled project.' });
      return;
    }

    // 3. Validate project has an approval (customer approved a version)
    const approval = projectDb.getApproval(projectId);
    if (!approval) {
      res.status(400).json({ error: 'Cannot publish: project has no approved version. Customer must approve a version first.' });
      return;
    }

    // 4. Get the approved version
    const versions = projectDb.getVersions(projectId);
    const approvedVersion = versions.find(v => v.id === approval.approvedVersionId);
    if (!approvedVersion) {
      res.status(400).json({ error: 'Approved version not found.' });
      return;
    }

    // 5. Idempotency: block if same version is already deploying or published
    const existingActive = deploymentDb.getActiveByVersionId(approval.approvedVersionId);
    if (existingActive) {
      if (existingActive.status === 'DEPLOYING') {
        res.status(409).json({
          error: 'A deployment for this version is already in progress.',
          deployment: existingActive
        });
        return;
      }
      if (existingActive.status === 'PUBLISHED') {
        res.status(409).json({
          error: 'This version is already published.',
          deployment: existingActive
        });
        return;
      }
    }

    // 6. Find the website specification
    // The websiteId may come from the project's name/order or from ai-websites
    // Try to find a spec linked to this project's customer
    const customerSpecs = aiWebsiteDb.getByCustomerId(project.customerId);
    const spec = customerSpecs.length > 0 ? customerSpecs[0] : null;

    if (!spec) {
      res.status(400).json({
        error: 'Cannot publish: no website specification found for this project. A website must be built in the AI Builder first.'
      });
      return;
    }

    // 7. Validate specification for build
    const { valid, errors } = validateSpecForBuild(spec);
    if (!valid) {
      res.status(400).json({ error: `Website specification is invalid: ${errors.join('; ')}` });
      return;
    }

    // 8. Create deployment record (READY_TO_PUBLISH)
    const deployment = deploymentDb.create({
      projectId,
      websiteId: spec.id,
      versionId: approval.approvedVersionId,
      customerId: project.customerId,
      initiatedBy: actor.id,
      initiatedByName: actor.name,
      provider: deploymentProvider.name,
      environment: 'production'
    });

    // 9. Publish DEPLOYMENT_STARTED event
    await eventBus.publishEvent({
      eventType: 'DEPLOYMENT_STARTED',
      actorUserId: actor.id,
      referenceType: 'DEPLOYMENT',
      referenceId: deployment.id,
      payload: {
        deploymentId: deployment.id,
        projectId,
        projectNumber: project.projectNumber,
        customerId: project.customerId,
        versionId: approval.approvedVersionId,
        provider: deploymentProvider.name,
        initiatedBy: actor.id,
        startedAt: new Date().toISOString()
      }
    });

    // 10. Move to DEPLOYING
    deploymentDb.setStatus(deployment.id, 'DEPLOYING');

    // 11. Perform the build + deployment asynchronously
    (async () => {
      try {
        // Build the artifact
        const artifact = await buildWebsiteArtifact(spec, deployment.id);

        // Update record with build path
        deploymentDb.update(deployment.id, { buildArtifactPath: artifact.buildPath });

        // Call provider
        const providerResult = await deploymentProvider.createDeployment(artifact, deployment.id);

        if (providerResult.status === 'FAILED') {
          // Provider immediately failed
          const safeError = providerResult.errorMessage || 'Deployment provider returned a failure.';
          deploymentDb.setStatus(deployment.id, 'FAILED', {
            errorMessage: safeError,
            providerDeploymentId: providerResult.providerDeploymentId
          });

          await eventBus.publishEvent({
            eventType: 'DEPLOYMENT_FAILED',
            actorUserId: actor.id,
            referenceType: 'DEPLOYMENT',
            referenceId: deployment.id,
            payload: {
              deploymentId: deployment.id,
              projectId,
              projectNumber: project.projectNumber,
              customerId: project.customerId,
              errorMessage: safeError,
              provider: deploymentProvider.name,
              failedAt: new Date().toISOString()
            }
          });
          return;
        }

        // Update with provider deployment ID
        deploymentDb.update(deployment.id, { providerDeploymentId: providerResult.providerDeploymentId });

        if (providerResult.status === 'PUBLISHED' && providerResult.deploymentUrl) {
          // Provider confirmed success immediately
          deploymentDb.setStatus(deployment.id, 'PUBLISHED', {
            deploymentUrl: providerResult.deploymentUrl,
            providerDeploymentId: providerResult.providerDeploymentId
          });

          await eventBus.publishEvent({
            eventType: 'DEPLOYMENT_PUBLISHED',
            actorUserId: actor.id,
            referenceType: 'DEPLOYMENT',
            referenceId: deployment.id,
            payload: {
              deploymentId: deployment.id,
              projectId,
              projectNumber: project.projectNumber,
              customerId: project.customerId,
              deploymentUrl: providerResult.deploymentUrl,
              provider: deploymentProvider.name,
              publishedAt: new Date().toISOString()
            }
          });
        } else if (providerResult.status === 'DEPLOYING' && providerResult.providerDeploymentId) {
          // Still deploying — poll for status
          await pollForDeploymentResult(
            deployment.id,
            providerResult.providerDeploymentId,
            actor.id,
            projectId,
            project.projectNumber,
            project.customerId
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const safeMsg = msg.slice(0, 500); // truncate
        deploymentDb.setStatus(deployment.id, 'FAILED', { errorMessage: safeMsg });
        await eventBus.publishEvent({
          eventType: 'DEPLOYMENT_FAILED',
          actorUserId: actor.id,
          referenceType: 'DEPLOYMENT',
          referenceId: deployment.id,
          payload: {
            deploymentId: deployment.id,
            projectId,
            projectNumber: project.projectNumber,
            customerId: project.customerId,
            errorMessage: safeMsg,
            provider: deploymentProvider.name,
            failedAt: new Date().toISOString()
          }
        });
      }
    })();

    // 12. Respond immediately with the deployment record
    const freshDeployment = deploymentDb.getById(deployment.id);
    res.status(202).json({
      message: 'Deployment initiated.',
      deployment: freshDeployment
    });

  } catch (err) {
    console.error('[DeploymentRoutes] Deploy error:', err);
    const msg = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// Polling helper: polls provider until PUBLISHED/FAILED (max 10 attempts, 6s apart)
// ---------------------------------------------------------------------------
async function pollForDeploymentResult(
  deploymentId: string,
  providerDeploymentId: string,
  actorUserId: string,
  projectId: string,
  projectNumber: string,
  customerId: string
): Promise<void> {
  const MAX_POLLS = 10;
  const POLL_INTERVAL_MS = 6000;

  for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

    const statusResult = await deploymentProvider.getDeploymentStatus(providerDeploymentId);

    if (statusResult.status === 'PUBLISHED' && statusResult.deploymentUrl) {
      deploymentDb.setStatus(deploymentId, 'PUBLISHED', {
        deploymentUrl: statusResult.deploymentUrl,
        providerDeploymentId
      });

      await eventBus.publishEvent({
        eventType: 'DEPLOYMENT_PUBLISHED',
        actorUserId,
        referenceType: 'DEPLOYMENT',
        referenceId: deploymentId,
        payload: {
          deploymentId,
          projectId,
          projectNumber,
          customerId,
          deploymentUrl: statusResult.deploymentUrl,
          provider: deploymentProvider.name,
          publishedAt: new Date().toISOString()
        }
      });
      return;
    }

    if (statusResult.status === 'FAILED') {
      const safeError = statusResult.errorMessage || 'Provider reported failure.';
      deploymentDb.setStatus(deploymentId, 'FAILED', { errorMessage: safeError });

      await eventBus.publishEvent({
        eventType: 'DEPLOYMENT_FAILED',
        actorUserId,
        referenceType: 'DEPLOYMENT',
        referenceId: deploymentId,
        payload: {
          deploymentId,
          projectId,
          projectNumber,
          customerId,
          errorMessage: safeError,
          provider: deploymentProvider.name,
          failedAt: new Date().toISOString()
        }
      });
      return;
    }
    // Still DEPLOYING — continue polling
  }

  // Timeout
  const timeoutMsg = 'Deployment timed out waiting for provider confirmation.';
  deploymentDb.setStatus(deploymentId, 'FAILED', { errorMessage: timeoutMsg });
  await eventBus.publishEvent({
    eventType: 'DEPLOYMENT_FAILED',
    actorUserId,
    referenceType: 'DEPLOYMENT',
    referenceId: deploymentId,
    payload: {
      deploymentId,
      projectId,
      projectNumber,
      customerId,
      errorMessage: timeoutMsg,
      provider: deploymentProvider.name,
      failedAt: new Date().toISOString()
    }
  });
}

// ---------------------------------------------------------------------------
// GET /api/projects/:id/deployments — Deployment history (auth + ownership)
// ---------------------------------------------------------------------------
deploymentRouter.get('/:id/deployments', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { id: projectId } = req.params;
    const actor = req.user!;

    const project = projectDb.getProjectById(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    // Customer can only see own project deployments
    if (actor.role === 'user' && project.customerId !== actor.id) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this project.' });
      return;
    }

    const deployments = deploymentDb.getByProjectId(projectId);
    res.json({ deployments });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/deployments/:id — Single deployment (auth + ownership)
// ---------------------------------------------------------------------------
deploymentRouter.get('/deployment/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const actor = req.user!;

    const deployment = deploymentDb.getById(id);
    if (!deployment) {
      res.status(404).json({ error: 'Deployment not found.' });
      return;
    }

    // Ownership check for customers
    if (actor.role === 'user' && deployment.customerId !== actor.id) {
      res.status(403).json({ error: 'Forbidden.' });
      return;
    }

    res.json({ deployment });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/deployments/:id/unpublish — Unpublish (Admin/Manager only)
// ---------------------------------------------------------------------------
deploymentRouter.post('/deployment/:id/unpublish', requireAuth, requireRoles(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const actor = req.user!;

    const deployment = deploymentDb.getById(id);
    if (!deployment) {
      res.status(404).json({ error: 'Deployment not found.' });
      return;
    }

    if (deployment.status !== 'PUBLISHED') {
      res.status(400).json({ error: `Cannot unpublish: deployment is currently '${deployment.status}', must be 'PUBLISHED'.` });
      return;
    }

    // Get project for event payload
    const project = projectDb.getProjectById(deployment.projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    // Call provider unpublish if supported
    if (deployment.providerDeploymentId && deploymentProvider.unpublishDeployment) {
      try {
        await deploymentProvider.unpublishDeployment(deployment.providerDeploymentId);
      } catch (providerErr) {
        const msg = providerErr instanceof Error ? providerErr.message : String(providerErr);
        res.status(502).json({ error: `Provider unpublish failed: ${msg}` });
        return;
      }
    }

    // Update record
    const updated = deploymentDb.setStatus(id, 'UNPUBLISHED', {
      unpublishedBy: actor.id,
      unpublishedAt: new Date().toISOString()
    });

    // Publish event
    await eventBus.publishEvent({
      eventType: 'WEBSITE_UNPUBLISHED',
      actorUserId: actor.id,
      referenceType: 'DEPLOYMENT',
      referenceId: id,
      payload: {
        deploymentId: id,
        projectId: deployment.projectId,
        projectNumber: project.projectNumber,
        customerId: deployment.customerId,
        unpublishedBy: actor.id,
        provider: deployment.provider,
        unpublishedAt: new Date().toISOString()
      }
    });

    res.json({ message: 'Website unpublished successfully.', deployment: updated });
  } catch (err) {
    console.error('[DeploymentRoutes] Unpublish error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/projects/:id/domains — Add custom domain (Admin/Manager only)
// ---------------------------------------------------------------------------
deploymentRouter.post('/:id/domains', requireAuth, requireRoles(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id: projectId } = req.params;
    const { domain } = req.body as { domain?: string };
    const actor = req.user!;

    if (!domain || typeof domain !== 'string' || domain.trim().length === 0) {
      res.status(400).json({ error: 'domain is required.' });
      return;
    }

    const project = projectDb.getProjectById(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    // Create domain record
    const domainRecord = domainDb.create({
      projectId,
      customerId: project.customerId,
      domain: domain.trim(),
      addedBy: actor.id
    });

    // If provider supports domain addition, call it
    const latestPublished = deploymentDb.getPublishedByProjectId(projectId);
    if (latestPublished?.providerDeploymentId && deploymentProvider.addDomain) {
      try {
        const result = await deploymentProvider.addDomain(latestPublished.providerDeploymentId, domainRecord.domain);
        domainDb.update(domainRecord.id, {
          providerDomainId: result.providerDomainId,
          verificationStatus: result.verificationStatus,
          dnsInstructions: result.dnsInstructions
        });
      } catch {
        // Provider call failed — domain is still recorded as PENDING
        domainDb.update(domainRecord.id, {
          dnsInstructions: 'Please configure your DNS manually. Contact support for details.'
        });
      }
    } else if (!deploymentProvider.addDomain) {
      domainDb.update(domainRecord.id, {
        dnsInstructions: `Current provider (${deploymentProvider.name}) does not support automated domain management. Please configure DNS manually.`
      });
    }

    const fresh = domainDb.getById(domainRecord.id)!;
    res.status(201).json({ message: 'Domain added.', domain: fresh });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/projects/:id/domains — Get domains (auth + ownership)
// ---------------------------------------------------------------------------
deploymentRouter.get('/:id/domains', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { id: projectId } = req.params;
    const actor = req.user!;

    const project = projectDb.getProjectById(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    if (actor.role === 'user' && project.customerId !== actor.id) {
      res.status(403).json({ error: 'Forbidden.' });
      return;
    }

    const domains = domainDb.getByProjectId(projectId);
    res.json({ domains });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/projects/:id/domains/:domainId — Remove domain (Admin/Manager)
// ---------------------------------------------------------------------------
deploymentRouter.delete('/:id/domains/:domainId', requireAuth, requireRoles(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id: projectId, domainId } = req.params;

    const domainRecord = domainDb.getById(domainId);
    if (!domainRecord || domainRecord.projectId !== projectId) {
      res.status(404).json({ error: 'Domain not found for this project.' });
      return;
    }

    // Call provider removal if supported
    if (domainRecord.providerDomainId && deploymentProvider.removeDomain) {
      try {
        await deploymentProvider.removeDomain(domainRecord.providerDomainId);
      } catch {
        // Non-fatal — continue with local removal
      }
    }

    domainDb.delete(domainId);
    res.json({ message: 'Domain removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
