/**
 * Canonical Event Types & Strongly-Typed Payloads
 * Strictly typed with NO 'any'
 */

export type ReferenceType = 'USER' | 'ORDER' | 'PROJECT' | 'TASK' | 'PAYMENT' | 'DEPLOYMENT';

// 1. USER_REGISTERED
export interface UserRegisteredPayload {
  userId: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

// 2. ORDER_CREATED
export interface OrderCreatedPayload {
  orderId: string;
  orderNumber: string;
  customerId: string;
  orderType: string;
  amount: number;
  currency: string;
  createdAt: string;
}

// 3. TEMPLATE_PURCHASED
export interface TemplatePurchasedPayload {
  orderId: string;
  orderNumber: string;
  templateId: string;
  templateName: string;
  customerId: string;
  vendorId: string;
  amount: number;
  currency: string;
  createdAt: string;
}

// 4. CUSTOM_WEBSITE_ORDER_CREATED
export interface CustomWebsiteOrderCreatedPayload {
  orderId: string;
  orderNumber: string;
  customWebsiteOrderId: string;
  customerId: string;
  businessName: string;
  packageId: string;
  packageName: string;
  amount: number;
  currency: string;
  createdAt: string;
}

// 5. PROJECT_ASSIGNED
export interface ProjectAssignedPayload {
  projectId: string;
  projectNumber: string;
  customerId: string;
  assignedTo: string;
  assignedBy: string;
  assignedAt: string;
}

// 6. PROJECT_STATUS_CHANGED
export interface ProjectStatusChangedPayload {
  projectId: string;
  projectNumber: string;
  customerId: string;
  previousStatus: string;
  newStatus: string;
  changedBy: string;
  note?: string;
  changedAt: string;
}

// 7. TASK_ASSIGNED
export interface TaskAssignedPayload {
  taskId: string;
  projectId: string;
  title: string;
  assignedTo: string;
  assignedBy: string;
  dueDate?: string;
  assignedAt: string;
}

// 8. CUSTOMER_APPROVED
export interface CustomerApprovedPayload {
  projectId: string;
  projectNumber: string;
  customerId: string;
  approvedBy: string;
  approvedAt: string;
}

// 9. PROJECT_DELIVERED
export interface ProjectDeliveredPayload {
  projectId: string;
  projectNumber: string;
  customerId: string;
  deliveredBy: string;
  deliveredAt: string;
}

// 10. PAYMENT_SUCCESSFUL
export interface PaymentSuccessfulPayload {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  amount: number;
  currency: string;
  provider: string;
  providerPaymentId: string;
  paidAt: string;
}

// 11. PAYMENT_FAILED
export interface PaymentFailedPayload {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  amount: number;
  currency: string;
  provider: string;
  failureCode: string;
  failedAt: string;
}

// 12. PAYMENT_REFUNDED
export interface PaymentRefundedPayload {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  amount: number;
  currency: string;
  refundId: string;
  refundedAt: string;
}

// 13. DEPLOYMENT_STARTED
export interface DeploymentStartedPayload {
  deploymentId: string;
  projectId: string;
  projectNumber: string;
  customerId: string;
  versionId: string;
  provider: string;
  initiatedBy: string;
  startedAt: string;
}

// 14. DEPLOYMENT_PUBLISHED
export interface DeploymentPublishedPayload {
  deploymentId: string;
  projectId: string;
  projectNumber: string;
  customerId: string;
  deploymentUrl: string;
  provider: string;
  publishedAt: string;
}

// 15. DEPLOYMENT_FAILED
export interface DeploymentFailedPayload {
  deploymentId: string;
  projectId: string;
  projectNumber: string;
  customerId: string;
  errorMessage: string;
  provider: string;
  failedAt: string;
}

// 16. WEBSITE_UNPUBLISHED
export interface WebsiteUnpublishedPayload {
  deploymentId: string;
  projectId: string;
  projectNumber: string;
  customerId: string;
  unpublishedBy: string;
  provider: string;
  unpublishedAt: string;
}

// Mapping of Event Type to Payload Interface
export interface EventPayloadMap {
  USER_REGISTERED: UserRegisteredPayload;
  ORDER_CREATED: OrderCreatedPayload;
  TEMPLATE_PURCHASED: TemplatePurchasedPayload;
  CUSTOM_WEBSITE_ORDER_CREATED: CustomWebsiteOrderCreatedPayload;
  PROJECT_ASSIGNED: ProjectAssignedPayload;
  PROJECT_STATUS_CHANGED: ProjectStatusChangedPayload;
  TASK_ASSIGNED: TaskAssignedPayload;
  CUSTOMER_APPROVED: CustomerApprovedPayload;
  PROJECT_DELIVERED: ProjectDeliveredPayload;
  PAYMENT_SUCCESSFUL: PaymentSuccessfulPayload;
  PAYMENT_FAILED: PaymentFailedPayload;
  PAYMENT_REFUNDED: PaymentRefundedPayload;
  DEPLOYMENT_STARTED: DeploymentStartedPayload;
  DEPLOYMENT_PUBLISHED: DeploymentPublishedPayload;
  DEPLOYMENT_FAILED: DeploymentFailedPayload;
  WEBSITE_UNPUBLISHED: WebsiteUnpublishedPayload;
}

export type BusinessEventType = keyof EventPayloadMap;

export const ALL_BUSINESS_EVENT_TYPES: readonly BusinessEventType[] = [
  'USER_REGISTERED',
  'ORDER_CREATED',
  'TEMPLATE_PURCHASED',
  'CUSTOM_WEBSITE_ORDER_CREATED',
  'PROJECT_ASSIGNED',
  'PROJECT_STATUS_CHANGED',
  'TASK_ASSIGNED',
  'CUSTOMER_APPROVED',
  'PROJECT_DELIVERED',
  'PAYMENT_SUCCESSFUL',
  'PAYMENT_FAILED',
  'PAYMENT_REFUNDED',
  'DEPLOYMENT_STARTED',
  'DEPLOYMENT_PUBLISHED',
  'DEPLOYMENT_FAILED',
  'WEBSITE_UNPUBLISHED'
] as const;

// Discriminated Union for Strongly Typed Canonical Event Envelope
export type BusinessEvent =
  | { eventId: string; eventType: 'USER_REGISTERED'; actorUserId: string; referenceType: ReferenceType; referenceId: string; payload: UserRegisteredPayload; createdAt: string; }
  | { eventId: string; eventType: 'ORDER_CREATED'; actorUserId: string; referenceType: ReferenceType; referenceId: string; payload: OrderCreatedPayload; createdAt: string; }
  | { eventId: string; eventType: 'TEMPLATE_PURCHASED'; actorUserId: string; referenceType: ReferenceType; referenceId: string; payload: TemplatePurchasedPayload; createdAt: string; }
  | { eventId: string; eventType: 'CUSTOM_WEBSITE_ORDER_CREATED'; actorUserId: string; referenceType: ReferenceType; referenceId: string; payload: CustomWebsiteOrderCreatedPayload; createdAt: string; }
  | { eventId: string; eventType: 'PROJECT_ASSIGNED'; actorUserId: string; referenceType: ReferenceType; referenceId: string; payload: ProjectAssignedPayload; createdAt: string; }
  | { eventId: string; eventType: 'PROJECT_STATUS_CHANGED'; actorUserId: string; referenceType: ReferenceType; referenceId: string; payload: ProjectStatusChangedPayload; createdAt: string; }
  | { eventId: string; eventType: 'TASK_ASSIGNED'; actorUserId: string; referenceType: ReferenceType; referenceId: string; payload: TaskAssignedPayload; createdAt: string; }
  | { eventId: string; eventType: 'CUSTOMER_APPROVED'; actorUserId: string; referenceType: ReferenceType; referenceId: string; payload: CustomerApprovedPayload; createdAt: string; }
  | { eventId: string; eventType: 'PROJECT_DELIVERED'; actorUserId: string; referenceType: ReferenceType; referenceId: string; payload: ProjectDeliveredPayload; createdAt: string; }
  | { eventId: string; eventType: 'PAYMENT_SUCCESSFUL'; actorUserId: string; referenceType: ReferenceType; referenceId: string; payload: PaymentSuccessfulPayload; createdAt: string; }
  | { eventId: string; eventType: 'PAYMENT_FAILED'; actorUserId: string; referenceType: ReferenceType; referenceId: string; payload: PaymentFailedPayload; createdAt: string; }
  | { eventId: string; eventType: 'PAYMENT_REFUNDED'; actorUserId: string; referenceType: ReferenceType; referenceId: string; payload: PaymentRefundedPayload; createdAt: string; }
  | { eventId: string; eventType: 'DEPLOYMENT_STARTED'; actorUserId: string; referenceType: ReferenceType; referenceId: string; payload: DeploymentStartedPayload; createdAt: string; }
  | { eventId: string; eventType: 'DEPLOYMENT_PUBLISHED'; actorUserId: string; referenceType: ReferenceType; referenceId: string; payload: DeploymentPublishedPayload; createdAt: string; }
  | { eventId: string; eventType: 'DEPLOYMENT_FAILED'; actorUserId: string; referenceType: ReferenceType; referenceId: string; payload: DeploymentFailedPayload; createdAt: string; }
  | { eventId: string; eventType: 'WEBSITE_UNPUBLISHED'; actorUserId: string; referenceType: ReferenceType; referenceId: string; payload: WebsiteUnpublishedPayload; createdAt: string; };

export interface BusinessEventInput<T extends BusinessEventType = BusinessEventType> {
  eventId?: string;
  eventType: T;
  actorUserId: string;
  referenceType: ReferenceType;
  referenceId: string;
  payload: EventPayloadMap[T];
  createdAt?: string;
}
