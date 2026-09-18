export type AuditAction =
  | 'USER_REGISTERED'
  | 'ORDER_CREATED'
  | 'TEMPLATE_PURCHASED'
  | 'CUSTOM_WEBSITE_ORDER_CREATED'
  | 'PROJECT_CREATED'
  | 'PROJECT_ASSIGNED'
  | 'PROJECT_STATUS_CHANGED'
  | 'TASK_CREATED'
  | 'TASK_ASSIGNED'
  | 'TASK_STATUS_CHANGED'
  | 'MILESTONE_CREATED'
  | 'MILESTONE_STATUS_CHANGED'
  | 'PROJECT_VERSION_CREATED'
  | 'PROJECT_REVISION_REQUESTED'
  | 'PROJECT_APPROVED'
  | 'PROJECT_DELIVERED'
  | 'DEPLOYMENT_STARTED'
  | 'DEPLOYMENT_PUBLISHED'
  | 'DEPLOYMENT_FAILED'
  | 'WEBSITE_UNPUBLISHED';

export interface AuditLog {
  id: string;
  action: AuditAction;
  userId: string;
  userName: string;
  userRole: string;
  targetId?: string;
  targetType?: string;
  details: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
