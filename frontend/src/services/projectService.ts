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

const API_URL = '/api';

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

    const res = await fetch(`${API_URL}/projects?${q.toString()}`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch projects');
    return data;
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
    const res = await fetch(`${API_URL}/projects/${id}`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load project details');
    return data;
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
    const res = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create project');
    return data;
  },

  async updateProject(id: string, input: {
    name?: string;
    description?: string;
    priority?: PriorityLevel;
    startDate?: string;
    estimatedDeliveryDate?: string;
    progress?: number;
  }): Promise<{ message: string; project: WebsiteProject }> {
    const res = await fetch(`${API_URL}/projects/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update project');
    return data;
  },

  async updateProjectStatus(id: string, status: ProjectStatus, note?: string): Promise<{ message: string; project: WebsiteProject }> {
    const res = await fetch(`${API_URL}/projects/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status, note })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update project status');
    return data;
  },

  async assignProject(id: string, assignedTo: string | null): Promise<{ message: string; project: WebsiteProject }> {
    const res = await fetch(`${API_URL}/projects/${id}/assignment`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ assignedTo })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update assignment');
    return data;
  },

  // Tasks
  async getTasks(projectId: string): Promise<{ tasks: ProjectTask[]; total: number }> {
    const res = await fetch(`${API_URL}/projects/${projectId}/tasks`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch tasks');
    return data;
  },

  async createTask(projectId: string, input: {
    title: string;
    description?: string;
    priority?: PriorityLevel;
    assignedTo?: string;
    dueDate?: string;
  }): Promise<{ message: string; task: ProjectTask }> {
    const res = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create task');
    return data;
  },

  async updateTask(taskId: string, input: {
    title?: string;
    description?: string;
    priority?: PriorityLevel;
    assignedTo?: string | null;
    dueDate?: string;
  }): Promise<{ message: string; task: ProjectTask }> {
    const res = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update task');
    return data;
  },

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<{ message: string; task: ProjectTask }> {
    const res = await fetch(`${API_URL}/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update task status');
    return data;
  },

  async deleteTask(taskId: string): Promise<{ message: string }> {
    const res = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete task');
    return data;
  },

  // Milestones
  async getMilestones(projectId: string): Promise<{ milestones: ProjectMilestone[]; total: number }> {
    const res = await fetch(`${API_URL}/projects/${projectId}/milestones`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch milestones');
    return data;
  },

  async createMilestone(projectId: string, input: {
    name: string;
    description?: string;
    dueDate?: string;
    sortOrder?: number;
  }): Promise<{ message: string; milestone: ProjectMilestone }> {
    const res = await fetch(`${API_URL}/projects/${projectId}/milestones`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create milestone');
    return data;
  },

  async updateMilestone(milestoneId: string, input: {
    name?: string;
    description?: string;
    dueDate?: string;
    sortOrder?: number;
  }): Promise<{ message: string; milestone: ProjectMilestone }> {
    const res = await fetch(`${API_URL}/milestones/${milestoneId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update milestone');
    return data;
  },

  async updateMilestoneStatus(milestoneId: string, status: MilestoneStatus): Promise<{ message: string; milestone: ProjectMilestone }> {
    const res = await fetch(`${API_URL}/milestones/${milestoneId}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update milestone status');
    return data;
  },

  async deleteMilestone(milestoneId: string): Promise<{ message: string }> {
    const res = await fetch(`${API_URL}/milestones/${milestoneId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete milestone');
    return data;
  },

  // Phase 13: Review, Versions, Revisions, Approval & Delivery
  async createVersion(projectId: string, input: {
    title: string;
    description?: string;
    previewUrl: string;
    submitForReview?: boolean;
  }): Promise<{ message: string; version: ProjectVersion; project: WebsiteProject }> {
    const res = await fetch(`${API_URL}/projects/${projectId}/versions`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create version');
    return data;
  },

  async getVersions(projectId: string): Promise<{ versions: ProjectVersion[]; total: number }> {
    const res = await fetch(`${API_URL}/projects/${projectId}/versions`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch versions');
    return data;
  },

  async requestRevision(projectId: string, input: {
    requestedChanges: string;
    versionId?: string;
  }): Promise<{ message: string; revision: ProjectRevision }> {
    const res = await fetch(`${API_URL}/projects/${projectId}/revisions`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit revision request');
    return data;
  },

  async getRevisions(projectId: string): Promise<{ revisions: ProjectRevision[]; total: number }> {
    const res = await fetch(`${API_URL}/projects/${projectId}/revisions`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch revisions');
    return data;
  },

  async approveProject(projectId: string, input?: {
    versionId?: string;
    feedback?: string;
  }): Promise<{ message: string; approval: ProjectApproval }> {
    const res = await fetch(`${API_URL}/projects/${projectId}/approve`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input || {})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to approve project');
    return data;
  },

  async deliverProject(projectId: string, input: {
    deliveredUrl: string;
    deliveryNotes?: string;
  }): Promise<{ message: string; delivery: ProjectDelivery }> {
    const res = await fetch(`${API_URL}/projects/${projectId}/deliver`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to deliver project');
    return data;
  }
};
