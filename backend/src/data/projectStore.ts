import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  WebsiteProject,
  ProjectTask,
  ProjectMilestone,
  ProjectStatusHistory,
  ProjectStatus,
  TaskStatus,
  MilestoneStatus,
  PriorityLevel,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectVersion,
  ProjectRevision,
  ProjectApproval,
  ProjectDelivery
} from '../models/project';
import {
  canTransitionProjectStatus,
  ProjectTransitionError,
  TransitionActor,
  TransitionContext
} from '../services/projectTransitionValidator';
import { orderDb } from './orderStore';
import { userDb } from './userStore';
import { notificationDb } from './notificationStore';
import { auditDb } from './auditStore';
import { emailService } from '../services/emailService';
import { eventBus } from '../events/eventBus';

const PROJECTS_FILE = path.join(__dirname, '../../data/projects.json');
const TASKS_FILE = path.join(__dirname, '../../data/project-tasks.json');
const MILESTONES_FILE = path.join(__dirname, '../../data/project-milestones.json');
const HISTORY_FILE = path.join(__dirname, '../../data/project-status-history.json');
const VERSIONS_FILE = path.join(__dirname, '../../data/project-versions.json');
const REVISIONS_FILE = path.join(__dirname, '../../data/project-revisions.json');
const APPROVALS_FILE = path.join(__dirname, '../../data/project-approvals.json');
const DELIVERIES_FILE = path.join(__dirname, '../../data/project-deliveries.json');

function ensureFileExists(filePath: string, defaultContent: string = '[]') {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, defaultContent, 'utf-8');
  }
}

class ProjectDatabase {
  private projects: Map<string, WebsiteProject> = new Map();
  private tasks: Map<string, ProjectTask> = new Map();
  private milestones: Map<string, ProjectMilestone> = new Map();
  private history: ProjectStatusHistory[] = [];
  private versions: Map<string, ProjectVersion> = new Map();
  private revisions: Map<string, ProjectRevision> = new Map();
  private approvals: Map<string, ProjectApproval> = new Map();
  private deliveries: Map<string, ProjectDelivery> = new Map();

  constructor() {
    this.load();
  }

  private load() {
    ensureFileExists(PROJECTS_FILE);
    ensureFileExists(TASKS_FILE);
    ensureFileExists(MILESTONES_FILE);
    ensureFileExists(HISTORY_FILE);
    ensureFileExists(VERSIONS_FILE);
    ensureFileExists(REVISIONS_FILE);
    ensureFileExists(APPROVALS_FILE);
    ensureFileExists(DELIVERIES_FILE);

    try {
      const pRaw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
      const pList: WebsiteProject[] = JSON.parse(pRaw);
      this.projects.clear();
      pList.forEach(p => {
        if (p.revisionCount === undefined) p.revisionCount = 0;
        if (p.revisionLimit === undefined) p.revisionLimit = 3;
        this.projects.set(p.id, p);
      });
    } catch (e) {
      console.error('Error reading projects.json:', e);
    }

    try {
      const tRaw = fs.readFileSync(TASKS_FILE, 'utf-8');
      const tList: ProjectTask[] = JSON.parse(tRaw);
      this.tasks.clear();
      tList.forEach(t => this.tasks.set(t.id, t));
    } catch (e) {
      console.error('Error reading project-tasks.json:', e);
    }

    try {
      const mRaw = fs.readFileSync(MILESTONES_FILE, 'utf-8');
      const mList: ProjectMilestone[] = JSON.parse(mRaw);
      this.milestones.clear();
      mList.forEach(m => this.milestones.set(m.id, m));
    } catch (e) {
      console.error('Error reading project-milestones.json:', e);
    }

    try {
      const hRaw = fs.readFileSync(HISTORY_FILE, 'utf-8');
      this.history = JSON.parse(hRaw);
    } catch (e) {
      console.error('Error reading project-status-history.json:', e);
    }

    try {
      const vRaw = fs.readFileSync(VERSIONS_FILE, 'utf-8');
      const vList: ProjectVersion[] = JSON.parse(vRaw);
      this.versions.clear();
      vList.forEach(v => this.versions.set(v.id, v));
    } catch (e) {
      console.error('Error reading project-versions.json:', e);
    }

    try {
      const rRaw = fs.readFileSync(REVISIONS_FILE, 'utf-8');
      const rList: ProjectRevision[] = JSON.parse(rRaw);
      this.revisions.clear();
      rList.forEach(r => this.revisions.set(r.id, r));
    } catch (e) {
      console.error('Error reading project-revisions.json:', e);
    }

    try {
      const aRaw = fs.readFileSync(APPROVALS_FILE, 'utf-8');
      const aList: ProjectApproval[] = JSON.parse(aRaw);
      this.approvals.clear();
      aList.forEach(a => this.approvals.set(a.id, a));
    } catch (e) {
      console.error('Error reading project-approvals.json:', e);
    }

    try {
      const dRaw = fs.readFileSync(DELIVERIES_FILE, 'utf-8');
      const dList: ProjectDelivery[] = JSON.parse(dRaw);
      this.deliveries.clear();
      dList.forEach(d => this.deliveries.set(d.id, d));
    } catch (e) {
      console.error('Error reading project-deliveries.json:', e);
    }
  }

  public save() {
    try {
      fs.writeFileSync(PROJECTS_FILE, JSON.stringify(Array.from(this.projects.values()), null, 2), 'utf-8');
      fs.writeFileSync(TASKS_FILE, JSON.stringify(Array.from(this.tasks.values()), null, 2), 'utf-8');
      fs.writeFileSync(MILESTONES_FILE, JSON.stringify(Array.from(this.milestones.values()), null, 2), 'utf-8');
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(this.history, null, 2), 'utf-8');
      fs.writeFileSync(VERSIONS_FILE, JSON.stringify(Array.from(this.versions.values()), null, 2), 'utf-8');
      fs.writeFileSync(REVISIONS_FILE, JSON.stringify(Array.from(this.revisions.values()), null, 2), 'utf-8');
      fs.writeFileSync(APPROVALS_FILE, JSON.stringify(Array.from(this.approvals.values()), null, 2), 'utf-8');
      fs.writeFileSync(DELIVERIES_FILE, JSON.stringify(Array.from(this.deliveries.values()), null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving project database files:', e);
    }
  }

  public generateProjectNumber(): string {
    const year = new Date().getFullYear();
    const count = this.projects.size + 1;
    const padded = String(count).padStart(4, '0');
    let candidate = `PRJ-${year}-${padded}`;
    let counter = count;
    while (Array.from(this.projects.values()).some(p => p.projectNumber === candidate)) {
      counter++;
      candidate = `PRJ-${year}-${String(counter).padStart(4, '0')}`;
    }
    return candidate;
  }

  // Projects CRUD
  public getProjects(filter?: {
    customerId?: string;
    assignedTo?: string;
    status?: string;
    priority?: string;
    search?: string;
  }): WebsiteProject[] {
    let list = Array.from(this.projects.values());

    if (filter?.customerId) {
      list = list.filter(p => p.customerId === filter.customerId);
    }
    if (filter?.assignedTo) {
      list = list.filter(p => p.assignedTo === filter.assignedTo);
    }
    if (filter?.status && filter.status !== 'All') {
      list = list.filter(p => p.status === filter.status);
    }
    if (filter?.priority && filter.priority !== 'All') {
      list = list.filter(p => p.priority === filter.priority);
    }
    if (filter?.search && filter.search.trim() !== '') {
      const q = filter.search.trim().toLowerCase();
      list = list.filter(p =>
        p.projectNumber.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.packageName.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getProjectById(id: string): WebsiteProject | null {
    return this.projects.get(id) || null;
  }

  public getProjectByOrderId(orderId: string): WebsiteProject | null {
    return Array.from(this.projects.values()).find(p => p.customWebsiteOrderId === orderId) || null;
  }

  public createProject(input: CreateProjectInput, creator: { id: string; name: string; role: string }): WebsiteProject {
    const order = orderDb.findById(input.customWebsiteOrderId);
    if (!order) {
      throw new Error('Associated Custom Website Order was not found.');
    }

    if (order.type !== 'custom_website') {
      throw new Error('Projects can only be initiated from a custom website order (type: custom_website).');
    }

    const existing = this.getProjectByOrderId(input.customWebsiteOrderId);
    if (existing) {
      throw new Error(`A project (${existing.projectNumber}) has already been created for this order.`);
    }

    if (input.assignedTo) {
      const staff = userDb.findById(input.assignedTo);
      if (!staff || (staff.role !== 'admin' && staff.role !== 'manager')) {
        throw new Error('Assigned user must be an active Admin or Manager.');
      }
    }

    const now = new Date().toISOString();
    const id = `prj_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const projectNumber = this.generateProjectNumber();

    const packageName = order.package?.packageName || 'Custom Website';
    const packagePrice = order.package?.price ?? order.amount;
    const packageCurrency = order.package?.currency || 'USD';
    const projectName = input.name?.trim() || order.businessInfo?.businessName || `Website Project: ${order.orderNumber}`;
    const projectDescription = input.description?.trim() || order.businessInfo?.businessDescription || order.requirements?.additionalNotes || `Project implementation for order ${order.orderNumber}`;

    const newProject: WebsiteProject = {
      id,
      projectNumber,
      customWebsiteOrderId: order.id,
      customerId: order.customerId,
      packageId: order.package?.packageId || 'custom',
      packageName,
      packagePrice,
      packageCurrency,
      name: projectName,
      description: projectDescription,
      status: input.assignedTo ? 'ASSIGNED' : 'PLANNING',
      priority: input.priority || 'MEDIUM',
      assignedTo: input.assignedTo || undefined,
      startDate: input.startDate || now.split('T')[0],
      estimatedDeliveryDate: input.estimatedDeliveryDate,
      progress: 0,
      revisionCount: 0,
      revisionLimit: 3,
      createdAt: now,
      updatedAt: now
    };

    this.projects.set(id, newProject);

    // Initial Status History Entry: strictly append-only
    this.history.push({
      id: `pstat_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      projectId: id,
      previousStatus: newProject.status,
      newStatus: newProject.status,
      status: newProject.status,
      changedBy: creator.id,
      changedByName: creator.name,
      note: `Project created from Order ${order.orderNumber}. Initial status: ${newProject.status}.`,
      createdAt: now
    });

    this.save();

    // Log Audit Event
    auditDb.log({
      action: 'PROJECT_CREATED',
      userId: creator.id,
      userName: creator.name,
      userRole: creator.role,
      targetId: newProject.id,
      targetType: 'project',
      details: `Created project ${newProject.projectNumber} (${newProject.name}) from Order ${order.orderNumber}.`,
      metadata: { projectNumber: newProject.projectNumber, orderId: order.id, status: newProject.status }
    });

    if (input.assignedTo) {
      const staffUser = userDb.findById(input.assignedTo);
      auditDb.log({
        action: 'PROJECT_ASSIGNED',
        userId: creator.id,
        userName: creator.name,
        userRole: creator.role,
        targetId: newProject.id,
        targetType: 'project',
        details: `Assigned project ${newProject.projectNumber} to ${staffUser?.name || input.assignedTo}.`,
        metadata: { projectNumber: newProject.projectNumber, assignedTo: input.assignedTo }
      });
    }

    // 1. Notify Customer (Customer-safe project status)
    notificationDb.createNotification({
      userId: order.customerId,
      type: 'PROJECT_CREATED',
      title: `Project Started: ${newProject.projectNumber}`,
      message: `Your project "${newProject.name}" has officially entered development (${newProject.status}).`,
      link: `/dashboard/my-projects`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      projectId: newProject.id,
      projectNumber: newProject.projectNumber
    });

    // 2. Notify Admins (Real persistent event)
    const allUsers = userDb.getAll();
    const admins = allUsers.filter(u => u.role === 'admin' && u.id !== creator.id);
    admins.forEach(admin => {
      notificationDb.createNotification({
        userId: admin.id,
        type: 'PROJECT_CREATED',
        title: `New Project: ${newProject.projectNumber}`,
        message: `Project ${newProject.projectNumber} (${newProject.name}) initialized by ${creator.name}.`,
        link: `/dashboard/projects/${newProject.id}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        projectId: newProject.id,
        projectNumber: newProject.projectNumber
      });
    });

    // 3. Publish canonical PROJECT_ASSIGNED if assigned at creation
    if (input.assignedTo) {
      eventBus.publishEvent({
        eventType: 'PROJECT_ASSIGNED',
        actorUserId: creator.id,
        referenceType: 'PROJECT',
        referenceId: newProject.id,
        payload: {
          projectId: newProject.id,
          projectNumber: newProject.projectNumber,
          customerId: newProject.customerId,
          assignedTo: input.assignedTo,
          assignedBy: creator.name,
          assignedAt: newProject.createdAt
        }
      }).catch(err => console.error('[Projects] Failed to publish PROJECT_ASSIGNED event:', err));
    }

    return newProject;
  }

  public updateProject(id: string, input: UpdateProjectInput): WebsiteProject {
    const project = this.projects.get(id);
    if (!project) throw new Error('Project not found.');

    const now = new Date().toISOString();
    if (input.name !== undefined) project.name = input.name.trim();
    if (input.description !== undefined) project.description = input.description.trim();
    if (input.priority !== undefined) project.priority = input.priority;
    if (input.startDate !== undefined) project.startDate = input.startDate;
    if (input.estimatedDeliveryDate !== undefined) project.estimatedDeliveryDate = input.estimatedDeliveryDate;
    if (input.progress !== undefined) {
      project.progress = Math.max(0, Math.min(100, Math.round(input.progress)));
    }

    project.updatedAt = now;
    this.projects.set(id, project);
    this.save();
    return project;
  }

  public updateProjectStatus(
    id: string,
    newStatus: ProjectStatus,
    changedBy: { id: string; name: string; role?: string },
    note?: string,
    contextExtra?: Partial<TransitionContext>
  ): WebsiteProject {
    const project = this.projects.get(id);
    if (!project) throw new Error('Project not found.');

    const actor: TransitionActor = {
      id: changedBy.id,
      name: changedBy.name,
      role: (changedBy.role || 'staff').toLowerCase()
    };

    const context: TransitionContext = {
      actor,
      project,
      isCustomerWorkflow: contextExtra?.isCustomerWorkflow,
      versionId: contextExtra?.versionId,
      approvedVersionId: contextExtra?.approvedVersionId,
      deliveredUrl: contextExtra?.deliveredUrl,
      deliveryNotes: contextExtra?.deliveryNotes,
      hasCustomerApproval: contextExtra?.hasCustomerApproval !== undefined
        ? contextExtra.hasCustomerApproval
        : Boolean(project.approvalId),
      revisionCount: project.revisionCount ?? 0,
      revisionLimit: project.revisionLimit ?? 3,
      note
    };

    const validation = canTransitionProjectStatus(project.status, newStatus, actor, context);
    if (!validation.allowed) {
      throw new ProjectTransitionError(validation.reason || 'Invalid status transition.', validation.statusCode || 400);
    }

    const now = new Date().toISOString();
    const prevStatus = project.status;
    project.status = newStatus;
    project.updatedAt = now;

    if (newStatus === 'COMPLETED') {
      project.completedDate = now;
      project.progress = 100;
    }

    if (newStatus === 'DELIVERED') {
      project.progress = 100;
      if (context.deliveredUrl) {
        project.deliveredUrl = context.deliveredUrl;
      }
    }

    // Persist status history: strictly append-only
    this.history.push({
      id: `pstat_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      projectId: id,
      previousStatus: prevStatus,
      newStatus: newStatus,
      status: newStatus,
      changedBy: changedBy.id,
      changedByName: changedBy.name,
      note: note || `Status transitioned from ${prevStatus} to ${newStatus}.`,
      createdAt: now
    });

    this.projects.set(id, project);
    this.save();

    // Log Audit Event
    auditDb.log({
      action: 'PROJECT_STATUS_CHANGED',
      userId: changedBy.id,
      userName: changedBy.name,
      userRole: actor.role,
      targetId: project.id,
      targetType: 'project',
      details: `Project ${project.projectNumber} status changed to ${newStatus}.${note ? ' Note: ' + note : ''}`,
      metadata: { projectNumber: project.projectNumber, prevStatus, newStatus, note }
    });

    // 1. Publish canonical PROJECT_STATUS_CHANGED event
    eventBus.publishEvent({
      eventType: 'PROJECT_STATUS_CHANGED',
      actorUserId: changedBy.id,
      referenceType: 'PROJECT',
      referenceId: project.id,
      payload: {
        projectId: project.id,
        projectNumber: project.projectNumber,
        customerId: project.customerId,
        previousStatus: prevStatus,
        newStatus: project.status,
        changedBy: changedBy.name,
        note: note || undefined,
        changedAt: now
      }
    }).catch(err => console.error('[Projects] Failed to publish PROJECT_STATUS_CHANGED event:', err));

    // 2. Publish canonical PROJECT_DELIVERED event when status transitions to DELIVERED
    if (newStatus === 'DELIVERED') {
      eventBus.publishEvent({
        eventType: 'PROJECT_DELIVERED',
        actorUserId: changedBy.id,
        referenceType: 'PROJECT',
        referenceId: project.id,
        payload: {
          projectId: project.id,
          projectNumber: project.projectNumber,
          customerId: project.customerId,
          deliveredBy: changedBy.name,
          deliveredAt: now
        }
      }).catch(err => console.error('[Projects] Failed to publish PROJECT_DELIVERED event:', err));
    }

    return project;
  }

  public assignProject(id: string, assignedTo: string | null, assignedByUser: { id: string; name: string }): WebsiteProject {
    const project = this.projects.get(id);
    if (!project) throw new Error('Project not found.');

    const now = new Date().toISOString();
    const prevStatus = project.status;
    if (assignedTo) {
      const staff = userDb.findById(assignedTo);
      if (!staff || (staff.role !== 'admin' && staff.role !== 'manager')) {
        throw new Error('Assigned staff member must be an active Admin or Manager.');
      }
      project.assignedTo = assignedTo;
      if (project.status === 'PLANNING') {
        project.status = 'ASSIGNED';
      }

      // Publish canonical PROJECT_ASSIGNED event (dispatches in-app notification, email, and audit log)
      eventBus.publishEvent({
        eventType: 'PROJECT_ASSIGNED',
        actorUserId: assignedByUser.id,
        referenceType: 'PROJECT',
        referenceId: project.id,
        payload: {
          projectId: project.id,
          projectNumber: project.projectNumber,
          customerId: project.customerId,
          assignedTo: staff.id,
          assignedBy: assignedByUser.name,
          assignedAt: now
        }
      }).catch(err => console.error('[Projects] Failed to publish PROJECT_ASSIGNED event:', err));
    } else {
      project.assignedTo = undefined;
    }

    project.updatedAt = now;
    if (prevStatus !== project.status) {
      this.history.push({
        id: `pstat_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        projectId: id,
        previousStatus: prevStatus,
        newStatus: project.status,
        status: project.status,
        changedBy: assignedByUser.id,
        changedByName: assignedByUser.name,
        note: assignedTo ? `Project assigned to staff member.` : 'Project unassigned.',
        createdAt: now
      });
    }

    this.projects.set(id, project);
    this.save();

    auditDb.log({
      action: 'PROJECT_ASSIGNED',
      userId: assignedByUser.id,
      userName: assignedByUser.name,
      userRole: (assignedByUser as any).role || 'staff',
      targetId: project.id,
      targetType: 'project',
      details: assignedTo ? `Project ${project.projectNumber} assigned to staff member.` : `Project ${project.projectNumber} unassigned.`,
      metadata: { projectNumber: project.projectNumber, assignedTo }
    });

    return project;
  }

  public getStatusHistory(projectId: string): ProjectStatusHistory[] {
    return this.history.filter(h => h.projectId === projectId);
  }

  // Tasks Management
  public getTasks(projectId: string): ProjectTask[] {
    return Array.from(this.tasks.values())
      .filter(t => t.projectId === projectId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public getTaskById(taskId: string): ProjectTask | null {
    return this.tasks.get(taskId) || null;
  }

  public createTask(data: {
    projectId: string;
    title: string;
    description?: string;
    priority?: PriorityLevel;
    assignedTo?: string;
    dueDate?: string;
    createdBy: string;
  }): ProjectTask {
    const project = this.projects.get(data.projectId);
    if (!project) throw new Error('Project not found.');

    if (!data.title || data.title.trim() === '') {
      throw new Error('Task title is required.');
    }

    if (data.assignedTo) {
      const staff = userDb.findById(data.assignedTo);
      if (!staff || (staff.role !== 'admin' && staff.role !== 'manager')) {
        throw new Error('Assigned user must be an active Admin or Manager.');
      }
    }

    const now = new Date().toISOString();
    const id = `tsk_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const newTask: ProjectTask = {
      id,
      projectId: data.projectId,
      title: data.title.trim(),
      description: data.description?.trim() || '',
      status: 'TODO',
      priority: data.priority || 'MEDIUM',
      assignedTo: data.assignedTo,
      dueDate: data.dueDate,
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now
    };

    this.tasks.set(id, newTask);
    this.save();

    const creatorUser = userDb.findById(data.createdBy);
    auditDb.log({
      action: 'TASK_CREATED',
      userId: data.createdBy,
      userName: creatorUser?.name || 'Staff',
      userRole: creatorUser?.role || 'staff',
      targetId: newTask.id,
      targetType: 'task',
      details: `Created task "${newTask.title}" for project ${project.projectNumber}.`,
      metadata: { projectId: project.id, taskId: newTask.id, priority: newTask.priority }
    });

    if (newTask.assignedTo) {
      const assignedStaff = userDb.findById(newTask.assignedTo);
      auditDb.log({
        action: 'TASK_ASSIGNED',
        userId: data.createdBy,
        userName: creatorUser?.name || 'Staff',
        userRole: creatorUser?.role || 'staff',
        targetId: newTask.id,
        targetType: 'task',
        details: `Assigned task "${newTask.title}" to ${assignedStaff?.name || newTask.assignedTo}.`,
        metadata: { projectId: project.id, taskId: newTask.id, assignedTo: newTask.assignedTo }
      });
    }

    // Publish canonical TASK_ASSIGNED event if task has an assignee
    if (data.assignedTo && data.assignedTo !== data.createdBy) {
      eventBus.publishEvent({
        eventType: 'TASK_ASSIGNED',
        actorUserId: data.createdBy,
        referenceType: 'TASK',
        referenceId: newTask.id,
        payload: {
          taskId: newTask.id,
          projectId: project.id,
          title: newTask.title,
          assignedTo: data.assignedTo,
          assignedBy: data.createdBy,
          dueDate: newTask.dueDate,
          assignedAt: newTask.createdAt
        }
      }).catch(err => console.error('[Projects] Failed to publish TASK_ASSIGNED event:', err));
    }

    // Notify project lead if creator is someone else
    if (project.assignedTo && project.assignedTo !== data.createdBy && project.assignedTo !== data.assignedTo) {
      notificationDb.createNotification({
        userId: project.assignedTo,
        type: 'TASK_CREATED',
        title: `New Task: ${project.projectNumber}`,
        message: `New task "${newTask.title}" created on project ${project.projectNumber}.`,
        link: `/dashboard/projects/${project.id}`,
        projectId: project.id,
        projectNumber: project.projectNumber
      });
    }

    return newTask;
  }

  public updateTask(taskId: string, input: {
    title?: string;
    description?: string;
    priority?: PriorityLevel;
    assignedTo?: string | null;
    dueDate?: string;
  }): ProjectTask {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found.');

    const project = this.projects.get(task.projectId);
    const prevAssignee = task.assignedTo;

    if (input.title !== undefined) {
      if (input.title.trim() === '') throw new Error('Task title cannot be empty.');
      task.title = input.title.trim();
    }
    if (input.description !== undefined) task.description = input.description.trim();
    if (input.priority !== undefined) task.priority = input.priority;
    if (input.dueDate !== undefined) task.dueDate = input.dueDate;
    if (input.assignedTo !== undefined) {
      if (input.assignedTo === null || input.assignedTo === '') {
        task.assignedTo = undefined;
      } else {
        const staff = userDb.findById(input.assignedTo);
        if (!staff || (staff.role !== 'admin' && staff.role !== 'manager')) {
          throw new Error('Assigned user must be an active Admin or Manager.');
        }
        task.assignedTo = input.assignedTo;
      }
    }

    task.updatedAt = new Date().toISOString();
    this.tasks.set(taskId, task);
    this.save();

    if (task.assignedTo && task.assignedTo !== prevAssignee && project) {
      auditDb.log({
        action: 'TASK_ASSIGNED',
        userId: task.assignedTo,
        userName: 'Staff',
        userRole: 'staff',
        targetId: task.id,
        targetType: 'task',
        details: `Task "${task.title}" reassigned on project ${project.projectNumber}.`,
        metadata: { projectId: project.id, taskId: task.id, assignedTo: task.assignedTo }
      });
    }

    // Publish canonical TASK_ASSIGNED if assignee newly changed
    if (task.assignedTo && task.assignedTo !== prevAssignee && project) {
      eventBus.publishEvent({
        eventType: 'TASK_ASSIGNED',
        actorUserId: task.assignedTo,
        referenceType: 'TASK',
        referenceId: task.id,
        payload: {
          taskId: task.id,
          projectId: project.id,
          title: task.title,
          assignedTo: task.assignedTo,
          assignedBy: 'Staff Lead',
          dueDate: task.dueDate,
          assignedAt: task.updatedAt || new Date().toISOString()
        }
      }).catch(err => console.error('[Projects] Failed to publish TASK_ASSIGNED event:', err));
    }

    return task;
  }

  public updateTaskStatus(taskId: string, newStatus: TaskStatus): ProjectTask {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found.');

    const validTaskStatuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED'];
    if (!validTaskStatuses.includes(newStatus)) {
      throw new Error(`Invalid task status '${newStatus}'. Valid options: ${validTaskStatuses.join(', ')}`);
    }

    const now = new Date().toISOString();
    const prevStatus = task.status;
    task.status = newStatus;
    task.updatedAt = now;
    if (newStatus === 'COMPLETED') {
      task.completedAt = now;
    } else {
      task.completedAt = undefined;
    }

    this.tasks.set(taskId, task);
    this.save();

    const project = this.projects.get(task.projectId);
    auditDb.log({
      action: 'TASK_STATUS_CHANGED',
      userId: task.assignedTo || task.createdBy,
      userName: 'Staff',
      userRole: 'staff',
      targetId: task.id,
      targetType: 'task',
      details: `Task "${task.title}" status changed to ${newStatus} on project ${project?.projectNumber || task.projectId}.`,
      metadata: { projectId: task.projectId, taskId: task.id, prevStatus, newStatus }
    });
    if (project && newStatus === 'COMPLETED' && prevStatus !== 'COMPLETED') {
      // Notify project lead if someone completed a task
      if (project.assignedTo && project.assignedTo !== task.assignedTo) {
        notificationDb.createNotification({
          userId: project.assignedTo,
          type: 'TASK_COMPLETED',
          title: `Task Completed: ${project.projectNumber}`,
          message: `Task "${task.title}" has been completed on project ${project.projectNumber}.`,
          link: `/dashboard/projects/${project.id}`,
          projectId: project.id,
          projectNumber: project.projectNumber
        });
      }
    }

    return task;
  }

  public deleteTask(taskId: string): boolean {
    if (!this.tasks.has(taskId)) throw new Error('Task not found.');
    this.tasks.delete(taskId);
    this.save();
    return true;
  }

  // Milestones Management
  public getMilestones(projectId: string): ProjectMilestone[] {
    return Array.from(this.milestones.values())
      .filter(m => m.projectId === projectId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public getMilestoneById(milestoneId: string): ProjectMilestone | null {
    return this.milestones.get(milestoneId) || null;
  }

  public createMilestone(data: {
    projectId: string;
    name: string;
    description?: string;
    dueDate?: string;
    sortOrder?: number;
  }): ProjectMilestone {
    const project = this.projects.get(data.projectId);
    if (!project) throw new Error('Project not found.');

    if (!data.name || data.name.trim() === '') {
      throw new Error('Milestone name is required.');
    }

    const now = new Date().toISOString();
    const id = `mls_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const existing = this.getMilestones(data.projectId);
    const sortOrder = data.sortOrder ?? (existing.length + 1);

    const newMilestone: ProjectMilestone = {
      id,
      projectId: data.projectId,
      name: data.name.trim(),
      description: data.description?.trim() || '',
      status: 'PENDING',
      dueDate: data.dueDate,
      sortOrder,
      createdAt: now,
      updatedAt: now
    };

    this.milestones.set(id, newMilestone);
    this.save();

    auditDb.log({
      action: 'MILESTONE_CREATED',
      userId: project.assignedTo || 'system',
      userName: 'Staff',
      userRole: 'staff',
      targetId: newMilestone.id,
      targetType: 'milestone',
      details: `Created milestone "${newMilestone.name}" for project ${project.projectNumber}.`,
      metadata: { projectId: project.id, milestoneId: newMilestone.id }
    });

    // 1. Notify Customer of new milestone checkpoint
    notificationDb.createNotification({
      userId: project.customerId,
      type: 'MILESTONE_CREATED',
      title: `Milestone Added: ${project.projectNumber}`,
      message: `New milestone "${newMilestone.name}" scheduled for your project.`,
      link: `/dashboard/projects/${project.id}`,
      projectId: project.id,
      projectNumber: project.projectNumber
    });

    // 2. Notify Assigned Staff lead
    if (project.assignedTo) {
      notificationDb.createNotification({
        userId: project.assignedTo,
        type: 'MILESTONE_CREATED',
        title: `Milestone Scheduled: ${project.projectNumber}`,
        message: `Milestone "${newMilestone.name}" has been added to project ${project.projectNumber}.`,
        link: `/dashboard/projects/${project.id}`,
        projectId: project.id,
        projectNumber: project.projectNumber
      });
    }

    return newMilestone;
  }

  public updateMilestone(milestoneId: string, input: {
    name?: string;
    description?: string;
    dueDate?: string;
    sortOrder?: number;
  }): ProjectMilestone {
    const milestone = this.milestones.get(milestoneId);
    if (!milestone) throw new Error('Milestone not found.');

    if (input.name !== undefined) {
      if (input.name.trim() === '') throw new Error('Milestone name cannot be empty.');
      milestone.name = input.name.trim();
    }
    if (input.description !== undefined) milestone.description = input.description.trim();
    if (input.dueDate !== undefined) milestone.dueDate = input.dueDate;
    if (input.sortOrder !== undefined) milestone.sortOrder = input.sortOrder;

    milestone.updatedAt = new Date().toISOString();
    this.milestones.set(milestoneId, milestone);
    this.save();
    return milestone;
  }

  public updateMilestoneStatus(milestoneId: string, newStatus: MilestoneStatus): ProjectMilestone {
    const milestone = this.milestones.get(milestoneId);
    if (!milestone) throw new Error('Milestone not found.');

    const validStatuses: MilestoneStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid milestone status '${newStatus}'. Valid options: ${validStatuses.join(', ')}`);
    }

    const now = new Date().toISOString();
    const prevStatus = milestone.status;
    milestone.status = newStatus;
    milestone.updatedAt = now;
    if (newStatus === 'COMPLETED') {
      milestone.completedAt = now;
    } else {
      milestone.completedAt = undefined;
    }

    this.milestones.set(milestoneId, milestone);
    this.save();

    const project = this.projects.get(milestone.projectId);
    auditDb.log({
      action: 'MILESTONE_STATUS_CHANGED',
      userId: project?.assignedTo || 'system',
      userName: 'Staff',
      userRole: 'staff',
      targetId: milestone.id,
      targetType: 'milestone',
      details: `Milestone "${milestone.name}" status changed to ${newStatus} on project ${project?.projectNumber || milestone.projectId}.`,
      metadata: { projectId: milestone.projectId, milestoneId: milestone.id, prevStatus, newStatus }
    });
    if (project && newStatus === 'COMPLETED' && prevStatus !== 'COMPLETED') {
      // 1. Notify Customer of completed milestone
      notificationDb.createNotification({
        userId: project.customerId,
        type: 'MILESTONE_COMPLETED',
        title: `Milestone Achieved: ${project.projectNumber}`,
        message: `Milestone "${milestone.name}" has been completed for your project.`,
        link: `/dashboard/projects/${project.id}`,
        projectId: project.id,
        projectNumber: project.projectNumber
      });

      // 2. Notify Assigned Staff
      if (project.assignedTo) {
        notificationDb.createNotification({
          userId: project.assignedTo,
          type: 'MILESTONE_COMPLETED',
          title: `Milestone Completed: ${project.projectNumber}`,
          message: `Milestone "${milestone.name}" is marked as completed on project ${project.projectNumber}.`,
          link: `/dashboard/projects/${project.id}`,
          projectId: project.id,
          projectNumber: project.projectNumber
        });
      }
    }

    return milestone;
  }


  // Phase 13: Project Versions, Revisions, Approvals & Delivery
  public createVersion(
    projectId: string,
    input: { title: string; description: string; previewUrl: string; submitForReview?: boolean },
    creator: { id: string; name: string; role: string }
  ): { version: ProjectVersion; project: WebsiteProject } {
    const project = this.projects.get(projectId);
    if (!project) throw new Error('Project not found.');

    const normalizedRole = creator.role.toLowerCase();
    if (normalizedRole !== 'admin' && normalizedRole !== 'manager') {
      throw new ProjectTransitionError('Forbidden: Only Admin or Manager can create project versions.', 403);
    }

    if (!input.title || input.title.trim().length === 0) {
      throw new Error('Version title is required.');
    }
    if (!input.previewUrl || input.previewUrl.trim().length < 5) {
      throw new Error('A valid preview URL is required for the version.');
    }

    // Mark previous versions for this project as isCurrent = false
    const existingVersions = this.getVersions(projectId);
    existingVersions.forEach(v => {
      if (v.isCurrent) {
        v.isCurrent = false;
        this.versions.set(v.id, v);
      }
    });

    const now = new Date().toISOString();
    const versionNumber = existingVersions.length + 1;
    const versionId = `pver_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const version: ProjectVersion = {
      id: versionId,
      projectId,
      versionNumber,
      title: input.title.trim(),
      description: (input.description || '').trim(),
      previewUrl: input.previewUrl.trim(),
      createdBy: creator.id,
      createdByName: creator.name,
      createdAt: now,
      isCurrent: true
    };

    this.versions.set(versionId, version);
    project.currentVersionId = versionId;
    project.updatedAt = now;

    if (input.submitForReview || project.status === 'IN_PROGRESS') {
      if (project.status !== 'REVIEW') {
        this.updateProjectStatus(
          projectId,
          'REVIEW',
          creator,
          `Version ${version.versionNumber} ("${version.title}") submitted for customer review.`,
          { versionId }
        );
      }
    }

    this.projects.set(projectId, project);
    this.save();

    auditDb.log({
      action: 'PROJECT_VERSION_CREATED',
      userId: creator.id,
      userName: creator.name,
      userRole: creator.role,
      targetId: version.id,
      targetType: 'project_version',
      details: `Created version v${version.versionNumber} for project ${project.projectNumber}.`,
      metadata: { projectId, versionId: version.id, versionNumber: version.versionNumber }
    });

    return { version, project };
  }

  public requestRevision(
    projectId: string,
    input: { requestedChanges: string; versionId?: string },
    customer: { id: string; name: string; role: string }
  ): ProjectRevision {
    const project = this.projects.get(projectId);
    if (!project) throw new Error('Project not found.');

    const normalizedRole = customer.role.toLowerCase();
    if (normalizedRole === 'vendor') {
      throw new ProjectTransitionError('Forbidden: Vendors cannot request revisions.', 403);
    }
    if (normalizedRole === 'user' || normalizedRole === 'customer') {
      if (project.customerId !== customer.id) {
        throw new ProjectTransitionError('Forbidden: You can only request revisions for your own project.', 403);
      }
    }

    if (project.status !== 'REVIEW') {
      throw new ProjectTransitionError(`Revisions can only be requested when project is in REVIEW status (current status: ${project.status}).`, 400);
    }

    if (!input.requestedChanges || input.requestedChanges.trim().length === 0) {
      throw new Error('Revision requested changes description is required.');
    }

    const currentCount = project.revisionCount ?? 0;
    const limit = project.revisionLimit ?? 3;
    if (currentCount >= limit) {
      throw new ProjectTransitionError(`Revision limit exceeded. This package allows up to ${limit} revisions (${currentCount} already used).`, 400);
    }

    const now = new Date().toISOString();
    const nextRevisionNumber = currentCount + 1;
    const revisionId = `prev_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const revision: ProjectRevision = {
      id: revisionId,
      projectId,
      versionId: input.versionId || project.currentVersionId || '',
      customerId: customer.id,
      customerName: customer.name,
      revisionNumber: nextRevisionNumber,
      requestedChanges: input.requestedChanges.trim(),
      status: 'REQUESTED',
      createdAt: now,
      updatedAt: now
    };

    this.revisions.set(revisionId, revision);
    project.revisionCount = nextRevisionNumber;

    // Transition project REVIEW -> IN_PROGRESS
    this.updateProjectStatus(
      projectId,
      'IN_PROGRESS',
      customer,
      `Revision #${nextRevisionNumber} requested by customer: ${input.requestedChanges.trim().slice(0, 100)}`,
      {
        isCustomerWorkflow: true,
        revisionCount: nextRevisionNumber,
        revisionLimit: limit
      }
    );

    this.projects.set(projectId, project);
    this.save();

    auditDb.log({
      action: 'PROJECT_REVISION_REQUESTED',
      userId: customer.id,
      userName: customer.name,
      userRole: customer.role,
      targetId: revision.id,
      targetType: 'project_revision',
      details: `Revision #${nextRevisionNumber} requested for project ${project.projectNumber}.`,
      metadata: { projectId, revisionId, revisionNumber: nextRevisionNumber }
    });

    if (project.assignedTo) {
      notificationDb.createNotification({
        userId: project.assignedTo,
        type: 'PROJECT_STATUS_CHANGED',
        title: `Revision Requested: ${project.projectNumber}`,
        message: `Customer requested revision #${nextRevisionNumber}: "${input.requestedChanges.trim().slice(0, 120)}"`,
        link: `/dashboard/projects/${project.id}`,
        projectId: project.id,
        projectNumber: project.projectNumber
      });
    }

    return revision;
  }

  public approveVersion(
    projectId: string,
    input: { versionId?: string; feedback?: string },
    customer: { id: string; name: string; role: string }
  ): ProjectApproval {
    const project = this.projects.get(projectId);
    if (!project) throw new Error('Project not found.');

    const normalizedRole = customer.role.toLowerCase();
    if (normalizedRole === 'vendor') {
      throw new ProjectTransitionError('Forbidden: Vendors cannot approve projects.', 403);
    }
    if (normalizedRole === 'user' || normalizedRole === 'customer') {
      if (project.customerId !== customer.id) {
        throw new ProjectTransitionError('Forbidden: You can only approve your own project.', 403);
      }
    }

    if (project.status !== 'REVIEW') {
      throw new ProjectTransitionError(`Approval can only occur when project is in REVIEW status (current status: ${project.status}).`, 400);
    }

    const targetVersionId = input.versionId || project.currentVersionId;
    if (!targetVersionId) {
      throw new ProjectTransitionError('No reviewable version found to approve.', 400);
    }

    const version = this.versions.get(targetVersionId);
    if (!version || version.projectId !== projectId) {
      throw new ProjectTransitionError('Version specified for approval does not exist for this project.', 400);
    }

    if (!version.isCurrent && targetVersionId !== project.currentVersionId) {
      throw new ProjectTransitionError('Can only approve the current reviewable version of the project.', 400);
    }

    const now = new Date().toISOString();
    const approvalId = `papp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const approval: ProjectApproval = {
      id: approvalId,
      projectId,
      customerId: customer.id,
      customerName: customer.name,
      approvedVersionId: targetVersionId,
      versionNumber: version.versionNumber,
      feedback: input.feedback?.trim() || undefined,
      approvedAt: now
    };

    this.approvals.set(approvalId, approval);
    project.approvalId = approvalId;

    // Transition project REVIEW -> COMPLETED
    this.updateProjectStatus(
      projectId,
      'COMPLETED',
      customer,
      `Project approved by customer (Version v${version.versionNumber}). Feedback: ${input.feedback?.trim() || 'Approved'}`,
      {
        isCustomerWorkflow: true,
        hasCustomerApproval: true,
        approvedVersionId: targetVersionId
      }
    );

    this.projects.set(projectId, project);
    this.save();

    auditDb.log({
      action: 'PROJECT_APPROVED',
      userId: customer.id,
      userName: customer.name,
      userRole: customer.role,
      targetId: approval.id,
      targetType: 'project_approval',
      details: `Project ${project.projectNumber} approved by customer (version v${version.versionNumber}).`,
      metadata: { projectId, approvalId, versionNumber: version.versionNumber }
    });

    if (project.assignedTo) {
      notificationDb.createNotification({
        userId: project.assignedTo,
        type: 'PROJECT_STATUS_CHANGED',
        title: `Project Approved: ${project.projectNumber}`,
        message: `Customer approved version v${version.versionNumber} of project "${project.name}"!`,
        link: `/dashboard/projects/${project.id}`,
        projectId: project.id,
        projectNumber: project.projectNumber
      });
    }

    // Publish canonical CUSTOMER_APPROVED event (triggers transactional email and admin notifications)
    eventBus.publishEvent({
      eventType: 'CUSTOMER_APPROVED',
      actorUserId: customer.id,
      referenceType: 'PROJECT',
      referenceId: project.id,
      payload: {
        projectId: project.id,
        projectNumber: project.projectNumber,
        customerId: project.customerId,
        approvedBy: customer.name,
        approvedAt: now
      }
    }).catch(err => console.error('[Projects] Failed to publish CUSTOMER_APPROVED event:', err));

    return approval;
  }

  public deliverProject(
    projectId: string,
    input: { deliveredUrl: string; deliveryNotes?: string },
    staff: { id: string; name: string; role: string }
  ): ProjectDelivery {
    const project = this.projects.get(projectId);
    if (!project) throw new Error('Project not found.');

    const normalizedRole = staff.role.toLowerCase();
    if (normalizedRole !== 'admin' && normalizedRole !== 'manager') {
      throw new ProjectTransitionError('Forbidden: Only Admin or Manager can deliver a project.', 403);
    }

    if (project.status !== 'COMPLETED') {
      throw new ProjectTransitionError(`Cannot deliver project: project must be in COMPLETED status (current status: ${project.status}).`, 400);
    }

    if (!project.approvalId) {
      throw new ProjectTransitionError('Cannot deliver project: Customer approval record does not exist.', 400);
    }

    if (!input.deliveredUrl || input.deliveredUrl.trim().length < 5) {
      throw new ProjectTransitionError('A valid deliveredUrl is required to deliver the project.', 400);
    }

    const now = new Date().toISOString();
    const deliveryId = `pdel_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const delivery: ProjectDelivery = {
      id: deliveryId,
      projectId,
      approvalId: project.approvalId,
      approvedVersionId: project.currentVersionId || '',
      deliveredBy: staff.id,
      deliveredByName: staff.name,
      deliveredUrl: input.deliveredUrl.trim(),
      deliveryNotes: input.deliveryNotes?.trim() || undefined,
      deliveredAt: now
    };

    this.deliveries.set(deliveryId, delivery);
    project.deliveryId = deliveryId;
    project.deliveredUrl = delivery.deliveredUrl;

    // Transition COMPLETED -> DELIVERED
    this.updateProjectStatus(
      projectId,
      'DELIVERED',
      staff,
      `Project delivered. Live URL: ${delivery.deliveredUrl}.${delivery.deliveryNotes ? ' Notes: ' + delivery.deliveryNotes : ''}`,
      {
        hasCustomerApproval: true,
        deliveredUrl: delivery.deliveredUrl,
        deliveryNotes: delivery.deliveryNotes
      }
    );

    this.projects.set(projectId, project);
    this.save();

    auditDb.log({
      action: 'PROJECT_DELIVERED',
      userId: staff.id,
      userName: staff.name,
      userRole: staff.role,
      targetId: delivery.id,
      targetType: 'project_delivery',
      details: `Project ${project.projectNumber} delivered with live URL: ${delivery.deliveredUrl}.`,
      metadata: { projectId, deliveryId, deliveredUrl: delivery.deliveredUrl }
    });

    notificationDb.createNotification({
      userId: project.customerId,
      type: 'PROJECT_DELIVERED',
      title: `Project Delivered: ${project.projectNumber}`,
      message: `Your website project "${project.name}" has been delivered! Access it here: ${delivery.deliveredUrl}`,
      link: delivery.deliveredUrl,
      projectId: project.id,
      projectNumber: project.projectNumber
    });

    return delivery;
  }

  public getVersions(projectId: string): ProjectVersion[] {
    return Array.from(this.versions.values())
      .filter(v => v.projectId === projectId)
      .sort((a, b) => a.versionNumber - b.versionNumber);
  }

  public getCurrentVersion(projectId: string): ProjectVersion | null {
    const versions = this.getVersions(projectId);
    return versions.find(v => v.isCurrent) || (versions.length > 0 ? versions[versions.length - 1] : null);
  }

  public getRevisions(projectId: string): ProjectRevision[] {
    return Array.from(this.revisions.values())
      .filter(r => r.projectId === projectId)
      .sort((a, b) => a.revisionNumber - b.revisionNumber);
  }

  public getApproval(projectId: string): ProjectApproval | null {
    const project = this.projects.get(projectId);
    if (!project || !project.approvalId) {
      return Array.from(this.approvals.values()).find(a => a.projectId === projectId) || null;
    }
    return this.approvals.get(project.approvalId) || null;
  }

  public getDelivery(projectId: string): ProjectDelivery | null {
    const project = this.projects.get(projectId);
    if (!project || !project.deliveryId) {
      return Array.from(this.deliveries.values()).find(d => d.projectId === projectId) || null;
    }
    return this.deliveries.get(project.deliveryId) || null;
  }

  public deleteMilestone(milestoneId: string): boolean {
    if (!this.milestones.has(milestoneId)) throw new Error('Milestone not found.');
    this.milestones.delete(milestoneId);
    this.save();
    return true;
  }
}

export const projectDb = new ProjectDatabase();

export { ProjectTransitionError } from '../services/projectTransitionValidator';
