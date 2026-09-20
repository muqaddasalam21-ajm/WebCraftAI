import {
  WebsiteProject,
  ProjectTask,
  ProjectMilestone,
  ProjectStatusHistory,
  ProjectStatus,
  TaskStatus,
  MilestoneStatus,
  PriorityLevel,
  ProjectVersion,
  ProjectRevision,
  ProjectApproval,
  ProjectDelivery
} from '../types';

import { getAuthToken } from '../utils/token';
import { safeApiRequest } from '../utils/apiConfig';

function getToken(): string | null {
  return getAuthToken();
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra
  };
}

export const projectService = {
  // Projects
  async getProjects(params?: {
    customerId?: string;
    assignedTo?: string;
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<{ projects: WebsiteProject[]; total: number }> {
    const q = new URLSearchParams();
    if (params?.customerId) q.set('customerId', params.customerId);
    if (params?.assignedTo) q.set('assignedTo', params.assignedTo);
    if (params?.status && params.status !== 'All') q.set('status', params.status);
    if (params?.priority && params.priority !== 'All') q.set('priority', params.priority);
    if (params?.search) q.set('search', params.search);

    const qs = q.toString();
    return safeApiRequest<{ projects: WebsiteProject[]; total: number }>(
      `/api/projects${qs ? `?${qs}` : ''}`,
      { headers: authHeaders() }
    );
  },

  async getProjectById(id: string): Promise<{
    project: WebsiteProject;
    tasks: ProjectTask[];
    milestones: ProjectMilestone[];
    history: ProjectStatusHistory[];
    versions?: ProjectVersion[];
    revisions?: ProjectRevision[];
    approval?: ProjectApproval | null;
    delivery?: ProjectDelivery | null;
  }> {
    return safeApiRequest(`/api/projects/${id}`, { headers: authHeaders() });
  },

  async createProject(input: {
    customWebsiteOrderId: string;
    name?: string;
    description?: string;
    priority?: PriorityLevel;
    assignedTo?: string;
    startDate?: string;
    estimatedDeliveryDate?: string;
  }): Promise<{ message: string; project: WebsiteProject }> {
    return safeApiRequest('/api/projects', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
  },

  async updateProject(id: string, input: {
    name?: string;
    description?: string;
    priority?: PriorityLevel;
    startDate?: string;
    estimatedDeliveryDate?: string;
    progress?: number;
  }): Promise<{ message: string; project: WebsiteProject }> {
    return safeApiRequest(`/api/projects/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
  },

  async updateProjectStatus(id: string, status: ProjectStatus, note?: string): Promise<{ message: string; project: WebsiteProject }> {
    return safeApiRequest(`/api/projects/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status, note })
    });
  },

  async assignProject(id: string, assignedTo: string | null): Promise<{ message: string; project: WebsiteProject }> {
    return safeApiRequest(`/api/projects/${id}/assignment`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ assignedTo })
    });
  },

  // Tasks
  async getTasks(projectId: string): Promise<{ tasks: ProjectTask[]; total: number }> {
    return safeApiRequest(`/api/projects/${projectId}/tasks`, { headers: authHeaders() });
  },

  async createTask(projectId: string, input: {
    title: string;
    description?: string;
    priority?: PriorityLevel;
    assignedTo?: string;
    dueDate?: string;
  }): Promise<{ message: string; task: ProjectTask }> {
    return safeApiRequest(`/api/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
  },

  async updateTask(taskId: string, input: {
    title?: string;
    description?: string;
    priority?: PriorityLevel;
    assignedTo?: string | null;
    dueDate?: string;
  }): Promise<{ message: string; task: ProjectTask }> {
    return safeApiRequest(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
  },

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<{ message: string; task: ProjectTask }> {
    return safeApiRequest(`/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status })
    });
  },

  async deleteTask(taskId: string): Promise<{ message: string }> {
    return safeApiRequest(`/api/tasks/${taskId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
  },

  // Milestones
  async getMilestones(projectId: string): Promise<{ milestones: ProjectMilestone[]; total: number }> {
    return safeApiRequest(`/api/projects/${projectId}/milestones`, { headers: authHeaders() });
  },

  async createMilestone(projectId: string, input: {
    name: string;
    description?: string;
    dueDate?: string;
    sortOrder?: number;
  }): Promise<{ message: string; milestone: ProjectMilestone }> {
    return safeApiRequest(`/api/projects/${projectId}/milestones`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
  },

  async updateMilestone(milestoneId: string, input: {
    name?: string;
    description?: string;
    dueDate?: string;
    sortOrder?: number;
  }): Promise<{ message: string; milestone: ProjectMilestone }> {
    return safeApiRequest(`/api/milestones/${milestoneId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
  },

  async updateMilestoneStatus(milestoneId: string, status: MilestoneStatus): Promise<{ message: string; milestone: ProjectMilestone }> {
    return safeApiRequest(`/api/milestones/${milestoneId}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status })
    });
  },

  async deleteMilestone(milestoneId: string): Promise<{ message: string }> {
    return safeApiRequest(`/api/milestones/${milestoneId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
  },

  // Phase 13: Review, Versions, Revisions, Approval & Delivery
  async createVersion(projectId: string, input: {
    title: string;
    description?: string;
    previewUrl: string;
    submitForReview?: boolean;
  }): Promise<{ message: string; version: ProjectVersion; project: WebsiteProject }> {
    return safeApiRequest(`/api/projects/${projectId}/versions`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
  },

  async getVersions(projectId: string): Promise<{ versions: ProjectVersion[]; total: number }> {
    return safeApiRequest(`/api/projects/${projectId}/versions`, { headers: authHeaders() });
  },

  async requestRevision(projectId: string, input: {
    requestedChanges: string;
    versionId?: string;
  }): Promise<{ message: string; revision: ProjectRevision }> {
    return safeApiRequest(`/api/projects/${projectId}/revisions`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
  },

  async getRevisions(projectId: string): Promise<{ revisions: ProjectRevision[]; total: number }> {
    return safeApiRequest(`/api/projects/${projectId}/revisions`, { headers: authHeaders() });
  },

  async approveProject(projectId: string, input?: {
    versionId?: string;
    feedback?: string;
  }): Promise<{ message: string; approval: ProjectApproval }> {
    return safeApiRequest(`/api/projects/${projectId}/approve`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input || {})
    });
  },

  async deliverProject(projectId: string, input: {
    deliveredUrl: string;
    deliveryNotes?: string;
  }): Promise<{ message: string; delivery: ProjectDelivery }> {
    return safeApiRequest(`/api/projects/${projectId}/deliver`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
  }
};
