import { Router, Response } from 'express';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { projectDb, ProjectTransitionError } from '../data/projectStore';
import { ProjectStatus, PriorityLevel, TaskStatus, MilestoneStatus } from '../models/project';

export const projectRouter = Router();

// ==========================================
// 1. Projects API
// ==========================================

// GET /api/projects - List projects with RBAC:
// ADMIN: all projects
// MANAGER: all or assigned projects
// USER: own projects only
// VENDOR: forbidden
projectRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role === 'vendor') {
      res.status(403).json({ error: 'Forbidden: Vendors do not have access to website projects.' });
      return;
    }

    const customerId = user.role === 'user' ? user.id : (req.query.customerId as string);
    const assignedTo = req.query.assignedTo as string;
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const search = req.query.search as string;

    const projects = projectDb.getProjects({
      customerId,
      assignedTo,
      status,
      priority,
      search
    });

    res.json({ projects, total: projects.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch projects.' });
  }
});

// GET /api/projects/:id - Get project detail, milestones, tasks, history
projectRouter.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role === 'vendor') {
      res.status(403).json({ error: 'Forbidden: Vendors do not have access to website projects.' });
      return;
    }

    const project = projectDb.getProjectById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    // Role check: User can only see their own project
    if (user.role === 'user' && project.customerId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to view this project.' });
      return;
    }

    const tasks = projectDb.getTasks(project.id);
    const milestones = projectDb.getMilestones(project.id);
    const history = projectDb.getStatusHistory(project.id);
    const versions = projectDb.getVersions(project.id);
    const revisions = projectDb.getRevisions(project.id);
    const approval = projectDb.getApproval(project.id);
    const delivery = projectDb.getDelivery(project.id);

    res.json({
      project,
      tasks,
      milestones,
      history,
      versions,
      revisions,
      approval,
      delivery
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve project details.' });
  }
});

// POST /api/projects - Create project from CustomWebsiteOrder (Admin & Manager only)
projectRouter.post('/', requireAuth, requireRoles(['admin', 'manager']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { customWebsiteOrderId, name, description, priority, assignedTo, startDate, estimatedDeliveryDate } = req.body;

    if (!customWebsiteOrderId) {
      res.status(400).json({ error: 'customWebsiteOrderId is required to initialize a project.' });
      return;
    }

    const project = projectDb.createProject(
      {
        customWebsiteOrderId,
        name,
        description,
        priority,
        assignedTo,
        startDate,
        estimatedDeliveryDate
      },
      { id: user.id, name: user.name, role: user.role }
    );

    res.status(201).json({
      message: 'Website project created successfully.',
      project
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create website project.' });
  }
});

// PUT /api/projects/:id - Update project metadata (Admin & Manager only)
projectRouter.put('/:id', requireAuth, requireRoles(['admin', 'manager']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, priority, startDate, estimatedDeliveryDate, progress } = req.body;
    const project = projectDb.updateProject(req.params.id, {
      name,
      description,
      priority,
      startDate,
      estimatedDeliveryDate,
      progress: progress !== undefined ? Number(progress) : undefined
    });

    res.json({
      message: 'Project updated successfully.',
      project
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update project.' });
  }
});

// PATCH /api/projects/:id/status - Transition project status (Admin & Manager only)
projectRouter.patch('/:id/status', requireAuth, requireRoles(['admin', 'manager']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { status, note } = req.body;

    if (!status) {
      res.status(400).json({ error: 'status is required.' });
      return;
    }

    const project = projectDb.updateProjectStatus(
      req.params.id,
      status as ProjectStatus,
      { id: user.id, name: user.name, role: user.role },
      note
    );

    res.json({
      message: `Project status updated to ${status}.`,
      project
    });
  } catch (err: any) {
    if (err instanceof ProjectTransitionError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(400).json({ error: err.message || 'Failed to update project status.' });
  }
});

// PATCH /api/projects/:id/assignment - Assign or reassign project staff (Admin & Manager only)
projectRouter.patch('/:id/assignment', requireAuth, requireRoles(['admin', 'manager']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { assignedTo } = req.body;

    const project = projectDb.assignProject(
      req.params.id,
      assignedTo !== undefined ? assignedTo : null,
      { id: user.id, name: user.name }
    );

    res.json({
      message: assignedTo ? 'Project assigned successfully.' : 'Project unassigned.',
      project
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to assign project.' });
  }
});

// ==========================================
// 2. Tasks API
// ==========================================

// GET /api/projects/:id/tasks - Get all tasks for a project
projectRouter.get('/:id/tasks', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role === 'vendor') {
      res.status(403).json({ error: 'Forbidden: Access denied.' });
      return;
    }

    const project = projectDb.getProjectById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    if (user.role === 'user' && project.customerId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to view tasks for this project.' });
      return;
    }

    const tasks = projectDb.getTasks(project.id);
    res.json({ tasks, total: tasks.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve tasks.' });
  }
});

// POST /api/projects/:id/tasks - Create task for a project (Admin & Manager only)
projectRouter.post('/:id/tasks', requireAuth, requireRoles(['admin', 'manager']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { title, description, priority, assignedTo, dueDate } = req.body;

    const task = projectDb.createTask({
      projectId: req.params.id,
      title,
      description,
      priority,
      assignedTo,
      dueDate,
      createdBy: user.id
    });

    res.status(201).json({
      message: 'Task created successfully.',
      task
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create task.' });
  }
});

// ==========================================
// 3. Milestones API (project scoped routes)
// ==========================================

// GET /api/projects/:id/milestones - Get milestones for a project
projectRouter.get('/:id/milestones', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role === 'vendor') {
      res.status(403).json({ error: 'Forbidden: Access denied.' });
      return;
    }

    const project = projectDb.getProjectById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    if (user.role === 'user' && project.customerId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to view milestones.' });
      return;
    }

    const milestones = projectDb.getMilestones(project.id);
    res.json({ milestones, total: milestones.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve milestones.' });
  }
});

// POST /api/projects/:id/milestones - Create milestone for a project (Admin & Manager only)
projectRouter.post('/:id/milestones', requireAuth, requireRoles(['admin', 'manager']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, dueDate, sortOrder } = req.body;

    const milestone = projectDb.createMilestone({
      projectId: req.params.id,
      name,
      description,
      dueDate,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined
    });

    res.status(201).json({
      message: 'Milestone created successfully.',
      milestone
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create milestone.' });
  }
});

// ==========================================
// 4. Phase 13: Review, Versions, Revisions, Approvals & Delivery
// ==========================================

// POST /api/projects/:id/versions - Upload/Create new project version (Admin & Manager only)
projectRouter.post('/:id/versions', requireAuth, requireRoles(['admin', 'manager']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { title, description, previewUrl, submitForReview } = req.body;

    if (!title) {
      res.status(400).json({ error: 'title is required for the version.' });
      return;
    }
    if (!previewUrl) {
      res.status(400).json({ error: 'previewUrl is required for the version.' });
      return;
    }

    const result = projectDb.createVersion(
      req.params.id,
      { title, description: description || '', previewUrl, submitForReview },
      { id: user.id, name: user.name, role: user.role }
    );

    res.status(201).json({
      message: 'Project version created successfully.',
      version: result.version,
      project: result.project
    });
  } catch (err: any) {
    if (err instanceof ProjectTransitionError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(400).json({ error: err.message || 'Failed to create project version.' });
  }
});

// GET /api/projects/:id/versions - List all versions for a project
projectRouter.get('/:id/versions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role === 'vendor') {
      res.status(403).json({ error: 'Forbidden: Vendors do not have access to website projects.' });
      return;
    }

    const project = projectDb.getProjectById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    if (user.role === 'user' && project.customerId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to view this project.' });
      return;
    }

    const versions = projectDb.getVersions(project.id);
    res.json({ versions, total: versions.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve project versions.' });
  }
});

// POST /api/projects/:id/revisions - Request revision on current review version (Customer only)
projectRouter.post('/:id/revisions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role === 'vendor') {
      res.status(403).json({ error: 'Forbidden: Vendors cannot request revisions.' });
      return;
    }

    const { requestedChanges, versionId } = req.body;
    if (!requestedChanges || typeof requestedChanges !== 'string' || requestedChanges.trim().length === 0) {
      res.status(400).json({ error: 'requestedChanges description is required.' });
      return;
    }

    const revision = projectDb.requestRevision(
      req.params.id,
      { requestedChanges, versionId },
      { id: user.id, name: user.name, role: user.role }
    );

    res.status(201).json({
      message: 'Revision requested successfully. Project moved back to IN_PROGRESS.',
      revision
    });
  } catch (err: any) {
    if (err instanceof ProjectTransitionError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(400).json({ error: err.message || 'Failed to request revision.' });
  }
});

// GET /api/projects/:id/revisions - List all revisions for a project
projectRouter.get('/:id/revisions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role === 'vendor') {
      res.status(403).json({ error: 'Forbidden: Vendors do not have access to website projects.' });
      return;
    }

    const project = projectDb.getProjectById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    if (user.role === 'user' && project.customerId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to view this project.' });
      return;
    }

    const revisions = projectDb.getRevisions(project.id);
    res.json({ revisions, total: revisions.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve revisions.' });
  }
});

// POST /api/projects/:id/approve - Customer approves current version (moves to COMPLETED)
projectRouter.post('/:id/approve', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role === 'vendor') {
      res.status(403).json({ error: 'Forbidden: Vendors cannot approve projects.' });
      return;
    }

    const { versionId, feedback } = req.body;

    const approval = projectDb.approveVersion(
      req.params.id,
      { versionId, feedback },
      { id: user.id, name: user.name, role: user.role }
    );

    res.status(200).json({
      message: 'Project approved successfully. Status transitioned to COMPLETED.',
      approval
    });
  } catch (err: any) {
    if (err instanceof ProjectTransitionError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(400).json({ error: err.message || 'Failed to approve project.' });
  }
});

// POST /api/projects/:id/deliver - Admin/Manager delivers completed project (moves to DELIVERED)
projectRouter.post('/:id/deliver', requireAuth, requireRoles(['admin', 'manager']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { deliveredUrl, deliveryNotes } = req.body;

    if (!deliveredUrl || typeof deliveredUrl !== 'string' || deliveredUrl.trim().length < 5) {
      res.status(400).json({ error: 'deliveredUrl is required to complete project delivery.' });
      return;
    }

    const delivery = projectDb.deliverProject(
      req.params.id,
      { deliveredUrl, deliveryNotes },
      { id: user.id, name: user.name, role: user.role }
    );

    res.status(200).json({
      message: 'Project delivered successfully. Status transitioned to DELIVERED.',
      delivery
    });
  } catch (err: any) {
    if (err instanceof ProjectTransitionError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(400).json({ error: err.message || 'Failed to deliver project.' });
  }
});

// GET /api/projects/:id/approval - Get approval details
projectRouter.get('/:id/approval', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role === 'vendor') {
      res.status(403).json({ error: 'Forbidden: Vendors do not have access to website projects.' });
      return;
    }

    const project = projectDb.getProjectById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    if (user.role === 'user' && project.customerId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to view this project.' });
      return;
    }

    const approval = projectDb.getApproval(project.id);
    res.json({ approval });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve approval.' });
  }
});

// GET /api/projects/:id/delivery - Get delivery details
projectRouter.get('/:id/delivery', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role === 'vendor') {
      res.status(403).json({ error: 'Forbidden: Vendors do not have access to website projects.' });
      return;
    }

    const project = projectDb.getProjectById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    if (user.role === 'user' && project.customerId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to view this project.' });
      return;
    }

    const delivery = projectDb.getDelivery(project.id);
    res.json({ delivery });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve delivery.' });
  }
});
