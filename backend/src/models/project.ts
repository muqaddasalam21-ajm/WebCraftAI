export type ProjectStatus =
  | 'PLANNING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'REVIEW'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED';

export type TaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'CANCELLED';

export type MilestoneStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'BLOCKED';

export type PriorityLevel =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'URGENT';

export type RevisionStatus =
  | 'REQUESTED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CANCELLED';

export interface ProjectVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  title: string;
  description: string;
  previewUrl: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface ProjectRevision {
  id: string;
  projectId: string;
  versionId: string;
  customerId: string;
  customerName?: string;
  revisionNumber: number;
  requestedChanges: string;
  status: RevisionStatus;
  staffNotes?: string;
  resolvedVersionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectApproval {
  id: string;
  projectId: string;
  customerId: string;
  customerName?: string;
  approvedVersionId: string;
  versionNumber: number;
  feedback?: string;
  approvedAt: string;
}

export interface ProjectDelivery {
  id: string;
  projectId: string;
  approvalId: string;
  approvedVersionId: string;
  deliveredBy: string;
  deliveredByName: string;
  deliveredUrl: string;
  deliveryNotes?: string;
  deliveredAt: string;
}

export interface WebsiteProject {
  id: string;
  projectNumber: string; // unique server-generated
  customWebsiteOrderId: string; // unique, 1:1 with CustomWebsiteOrder
  customerId: string;
  packageId: string;
  packageName: string;
  packagePrice: number;
  packageCurrency: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: PriorityLevel;
  assignedTo?: string; // staff user id
  startDate?: string;
  estimatedDeliveryDate?: string;
  completedDate?: string;
  progress: number; // 0 - 100
  currentVersionId?: string;
  approvalId?: string;
  deliveryId?: string;
  deliveredUrl?: string;
  revisionCount: number;
  revisionLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: PriorityLevel;
  assignedTo?: string;
  dueDate?: string;
  completedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: MilestoneStatus;
  dueDate?: string;
  completedAt?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStatusHistory {
  id: string;
  projectId: string;
  previousStatus: ProjectStatus;
  newStatus: ProjectStatus;
  status: ProjectStatus; // for backwards compatibility
  changedBy: string; // user id
  changedByName?: string;
  note?: string;
  createdAt: string;
}

export interface CreateProjectInput {
  customWebsiteOrderId: string;
  name?: string;
  description?: string;
  priority?: PriorityLevel;
  assignedTo?: string;
  startDate?: string;
  estimatedDeliveryDate?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  priority?: PriorityLevel;
  startDate?: string;
  estimatedDeliveryDate?: string;
  progress?: number;
}
