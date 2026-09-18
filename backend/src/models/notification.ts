export type NotificationType =
  | 'ORDER_CREATED'
  | 'ORDER_STATUS_UPDATED'
  | 'ORDER_ASSIGNED'
  | 'REVISION_SUBMITTED'
  | 'SYSTEM_ALERT'
  | 'PROJECT_CREATED'
  | 'PROJECT_ASSIGNED'
  | 'PROJECT_STATUS_CHANGED'
  | 'TASK_CREATED'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'MILESTONE_CREATED'
  | 'MILESTONE_COMPLETED'
  | 'PAYMENT_SUCCESSFUL'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED'
  | 'ACCOUNT_CREATED'
  | 'CUSTOMER_APPROVAL'
  | 'FINAL_DELIVERY'
  | 'PROJECT_DELIVERED'
  | 'PROJECT_APPROVED'
  | 'DEPLOYMENT_STARTED'
  | 'DEPLOYMENT_PUBLISHED'
  | 'DEPLOYMENT_FAILED'
  | 'WEBSITE_UNPUBLISHED';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  orderId?: string;
  orderNumber?: string;
  projectId?: string;
  projectNumber?: string;
  referenceId?: string;
  referenceType?: 'ORDER' | 'PROJECT' | 'TASK' | 'USER' | 'PAYMENT' | 'DEPLOYMENT';
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}
