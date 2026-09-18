import {
  BusinessEvent,
  BusinessEventType,
  ALL_BUSINESS_EVENT_TYPES,
  ReferenceType,
  UserRegisteredPayload,
  OrderCreatedPayload,
  TemplatePurchasedPayload,
  CustomWebsiteOrderCreatedPayload,
  ProjectAssignedPayload,
  ProjectStatusChangedPayload,
  TaskAssignedPayload,
  CustomerApprovedPayload,
  ProjectDeliveredPayload,
  PaymentSuccessfulPayload,
  PaymentFailedPayload,
  PaymentRefundedPayload,
  DeploymentStartedPayload,
  DeploymentPublishedPayload,
  DeploymentFailedPayload,
  WebsiteUnpublishedPayload
} from './eventTypes';

export class EventValidationError extends Error {
  public fieldErrors: { field: string; message: string }[];

  constructor(message: string, fieldErrors: { field: string; message: string }[] = []) {
    super(message);
    this.name = 'EventValidationError';
    this.fieldErrors = fieldErrors;
  }
}

const FORBIDDEN_SECRET_KEYWORDS = [
  'password',
  'passwordhash',
  'passwd',
  'secret',
  'webhook_secret',
  'apikey',
  'api_key',
  'privatekey',
  'private_key',
  'token',
  'access_token',
  'jwt'
];

/**
 * Checks that an object has no forbidden secrets in keys or values
 */
function assertNoSecrets(obj: unknown, path: string = ''): void {
  if (obj === null || obj === undefined) return;

  if (typeof obj === 'string') {
    const lowerVal = obj.toLowerCase();
    // Allow known safe provider IDs like pi_... or evt_...
    if (path.toLowerCase().includes('providerpaymentid') || path.toLowerCase().includes('refundid')) {
      return;
    }
    for (const kw of FORBIDDEN_SECRET_KEYWORDS) {
      if (lowerVal.includes(kw)) {
        throw new EventValidationError(`Security violation: Forbidden secret pattern detected in field '${path}'.`);
      }
    }
    return;
  }

  if (typeof obj === 'object') {
    const record = obj as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const lowerKey = key.toLowerCase();
      // providerPaymentId is explicitly permitted
      if (lowerKey === 'providerpaymentid' || lowerKey === 'refundid') {
        continue;
      }
      for (const kw of FORBIDDEN_SECRET_KEYWORDS) {
        if (lowerKey === kw || lowerKey.includes(kw)) {
          throw new EventValidationError(`Security violation: Forbidden secret field '${key}' detected in event payload.`);
        }
      }
      assertNoSecrets(record[key], path ? `${path}.${key}` : key);
    }
  }
}

function assertString(val: unknown, fieldName: string): string {
  if (typeof val !== 'string' || val.trim().length === 0) {
    throw new EventValidationError(`Field '${fieldName}' must be a non-empty string.`);
  }
  return val.trim();
}

function assertIsoDate(val: unknown, fieldName: string): string {
  const str = assertString(val, fieldName);
  const time = Date.parse(str);
  if (isNaN(time)) {
    throw new EventValidationError(`Field '${fieldName}' must be a valid ISO 8601 date string. Received: ${str}`);
  }
  return str;
}

function assertNonNegativeNumber(val: unknown, fieldName: string): number {
  if (typeof val !== 'number' || isNaN(val) || val < 0) {
    throw new EventValidationError(`Field '${fieldName}' must be a non-negative number.`);
  }
  return val;
}

function assertCurrency(val: unknown, fieldName: string = 'currency'): string {
  const curr = assertString(val, fieldName).toUpperCase();
  if (!/^[A-Z]{3}$/.test(curr)) {
    throw new EventValidationError(`Field '${fieldName}' must be a 3-letter currency code (e.g. 'USD'). Received: ${curr}`);
  }
  return curr;
}

function assertEmail(val: unknown, fieldName: string = 'email'): string {
  const email = assertString(val, fieldName).toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new EventValidationError(`Field '${fieldName}' must be a valid email address. Received: ${email}`);
  }
  return email;
}

function assertObject(val: unknown, fieldName: string): Record<string, unknown> {
  if (typeof val !== 'object' || val === null || Array.isArray(val)) {
    throw new EventValidationError(`Field '${fieldName}' must be an object.`);
  }
  return val as Record<string, unknown>;
}

/**
 * Validates canonical event envelope and strongly-typed payload
 */
export function validateBusinessEvent(raw: unknown): BusinessEvent {
  const envelope = assertObject(raw, 'event');

  // 1. Validate envelope fields
  const eventId = assertString(envelope.eventId, 'eventId');
  const rawEventType = assertString(envelope.eventType, 'eventType') as BusinessEventType;

  if (!ALL_BUSINESS_EVENT_TYPES.includes(rawEventType)) {
    throw new EventValidationError(`Unknown or unsupported eventType '${rawEventType}'. Supported types: ${ALL_BUSINESS_EVENT_TYPES.join(', ')}`);
  }

  const actorUserId = assertString(envelope.actorUserId, 'actorUserId');
  const rawRefType = assertString(envelope.referenceType, 'referenceType') as ReferenceType;
  const validRefTypes: ReferenceType[] = ['USER', 'ORDER', 'PROJECT', 'TASK', 'PAYMENT', 'DEPLOYMENT'];
  if (!validRefTypes.includes(rawRefType)) {
    throw new EventValidationError(`Invalid referenceType '${rawRefType}'. Must be one of: ${validRefTypes.join(', ')}`);
  }

  const referenceId = assertString(envelope.referenceId, 'referenceId');
  const createdAt = assertIsoDate(envelope.createdAt, 'createdAt');
  const rawPayload = assertObject(envelope.payload, 'payload');

  // 2. Security Check: ensure zero secrets exist in the payload
  assertNoSecrets(rawPayload);

  // 3. Payload-specific validation based on eventType
  switch (rawEventType) {
    case 'USER_REGISTERED': {
      const p: UserRegisteredPayload = {
        userId: assertString(rawPayload.userId, 'payload.userId'),
        name: assertString(rawPayload.name, 'payload.name'),
        email: assertEmail(rawPayload.email, 'payload.email'),
        role: assertString(rawPayload.role, 'payload.role'),
        createdAt: assertIsoDate(rawPayload.createdAt, 'payload.createdAt')
      };
      return { eventId, eventType: rawEventType, actorUserId, referenceType: rawRefType, referenceId, createdAt, payload: p };
    }

    case 'ORDER_CREATED': {
      const p: OrderCreatedPayload = {
        orderId: assertString(rawPayload.orderId, 'payload.orderId'),
        orderNumber: assertString(rawPayload.orderNumber, 'payload.orderNumber'),
        customerId: assertString(rawPayload.customerId, 'payload.customerId'),
        orderType: assertString(rawPayload.orderType, 'payload.orderType'),
        amount: assertNonNegativeNumber(rawPayload.amount, 'payload.amount'),
        currency: assertCurrency(rawPayload.currency, 'payload.currency'),
        createdAt: assertIsoDate(rawPayload.createdAt, 'payload.createdAt')
      };
      return { eventId, eventType: rawEventType, actorUserId, referenceType: rawRefType, referenceId, createdAt, payload: p };
    }

    case 'TEMPLATE_PURCHASED': {
      const p: TemplatePurchasedPayload = {
        orderId: assertString(rawPayload.orderId, 'payload.orderId'),
        orderNumber: assertString(rawPayload.orderNumber, 'payload.orderNumber'),
        templateId: assertString(rawPayload.templateId, 'payload.templateId'),
        templateName: assertString(rawPayload.templateName, 'payload.templateName'),
        customerId: assertString(rawPayload.customerId, 'payload.customerId'),
        vendorId: assertString(rawPayload.vendorId, 'payload.vendorId'),
        amount: assertNonNegativeNumber(rawPayload.amount, 'payload.amount'),
        currency: assertCurrency(rawPayload.currency, 'payload.currency'),
        createdAt: assertIsoDate(rawPayload.createdAt, 'payload.createdAt')
      };
      return { eventId, eventType: rawEventType, actorUserId, referenceType: rawRefType, referenceId, createdAt, payload: p };
    }

    case 'CUSTOM_WEBSITE_ORDER_CREATED': {
      const p: CustomWebsiteOrderCreatedPayload = {
        orderId: assertString(rawPayload.orderId, 'payload.orderId'),
        orderNumber: assertString(rawPayload.orderNumber, 'payload.orderNumber'),
        customWebsiteOrderId: assertString(rawPayload.customWebsiteOrderId, 'payload.customWebsiteOrderId'),
        customerId: assertString(rawPayload.customerId, 'payload.customerId'),
        businessName: assertString(rawPayload.businessName, 'payload.businessName'),
        packageId: assertString(rawPayload.packageId, 'payload.packageId'),
        packageName: assertString(rawPayload.packageName, 'payload.packageName'),
        amount: assertNonNegativeNumber(rawPayload.amount, 'payload.amount'),
        currency: assertCurrency(rawPayload.currency, 'payload.currency'),
        createdAt: assertIsoDate(rawPayload.createdAt, 'payload.createdAt')
      };
      return { eventId, eventType: rawEventType, actorUserId, referenceType: rawRefType, referenceId, createdAt, payload: p };
    }

    case 'PROJECT_ASSIGNED': {
      const p: ProjectAssignedPayload = {
        projectId: assertString(rawPayload.projectId, 'payload.projectId'),
        projectNumber: assertString(rawPayload.projectNumber, 'payload.projectNumber'),
        customerId: assertString(rawPayload.customerId, 'payload.customerId'),
        assignedTo: assertString(rawPayload.assignedTo, 'payload.assignedTo'),
        assignedBy: assertString(rawPayload.assignedBy, 'payload.assignedBy'),
        assignedAt: assertIsoDate(rawPayload.assignedAt, 'payload.assignedAt')
      };
      return { eventId, eventType: rawEventType, actorUserId, referenceType: rawRefType, referenceId, createdAt, payload: p };
    }

    case 'PROJECT_STATUS_CHANGED': {
      const p: ProjectStatusChangedPayload = {
        projectId: assertString(rawPayload.projectId, 'payload.projectId'),
        projectNumber: assertString(rawPayload.projectNumber, 'payload.projectNumber'),
        customerId: assertString(rawPayload.customerId, 'payload.customerId'),
        previousStatus: assertString(rawPayload.previousStatus, 'payload.previousStatus'),
        newStatus: assertString(rawPayload.newStatus, 'payload.newStatus'),
        changedBy: assertString(rawPayload.changedBy, 'payload.changedBy'),
        note: typeof rawPayload.note === 'string' ? rawPayload.note.trim() : '',
        changedAt: assertIsoDate(rawPayload.changedAt, 'payload.changedAt')
      };
      return { eventId, eventType: rawEventType, actorUserId, referenceType: rawRefType, referenceId, createdAt, payload: p };
    }

    case 'TASK_ASSIGNED': {
      const p: TaskAssignedPayload = {
        taskId: assertString(rawPayload.taskId, 'payload.taskId'),
        projectId: assertString(rawPayload.projectId, 'payload.projectId'),
        title: assertString(rawPayload.title, 'payload.title'),
        assignedTo: assertString(rawPayload.assignedTo, 'payload.assignedTo'),
        assignedBy: assertString(rawPayload.assignedBy, 'payload.assignedBy'),
        dueDate: typeof rawPayload.dueDate === 'string' ? rawPayload.dueDate.trim() : '',
        assignedAt: assertIsoDate(rawPayload.assignedAt, 'payload.assignedAt')
      };
      return { eventId, eventType: rawEventType, actorUserId, referenceType: rawRefType, referenceId, createdAt, payload: p };
    }

    case 'CUSTOMER_APPROVED': {
      const p: CustomerApprovedPayload = {
        projectId: assertString(rawPayload.projectId, 'payload.projectId'),
        projectNumber: assertString(rawPayload.projectNumber, 'payload.projectNumber'),
        customerId: assertString(rawPayload.customerId, 'payload.customerId'),
        approvedBy: assertString(rawPayload.approvedBy, 'payload.approvedBy'),
        approvedAt: assertIsoDate(rawPayload.approvedAt, 'payload.approvedAt')
      };
      return { eventId, eventType: rawEventType, actorUserId, referenceType: rawRefType, referenceId, createdAt, payload: p };
    }

    case 'PROJECT_DELIVERED': {
      const p: ProjectDeliveredPayload = {
        projectId: assertString(rawPayload.projectId, 'payload.projectId'),
        projectNumber: assertString(rawPayload.projectNumber, 'payload.projectNumber'),
        customerId: assertString(rawPayload.customerId, 'payload.customerId'),
        deliveredBy: assertString(rawPayload.deliveredBy, 'payload.deliveredBy'),
        deliveredAt: assertIsoDate(rawPayload.deliveredAt, 'payload.deliveredAt')
      };
      return { eventId, eventType: rawEventType, actorUserId, referenceType: rawRefType, referenceId, createdAt, payload: p };
    }

    case 'PAYMENT_SUCCESSFUL': {
      const p: PaymentSuccessfulPayload = {
        paymentId: assertString(rawPayload.paymentId, 'payload.paymentId'),
        orderId: assertString(rawPayload.orderId, 'payload.orderId'),
        orderNumber: assertString(rawPayload.orderNumber, 'payload.orderNumber'),
        customerId: assertString(rawPayload.customerId, 'payload.customerId'),
        amount: assertNonNegativeNumber(rawPayload.amount, 'payload.amount'),
        currency: assertCurrency(rawPayload.currency, 'payload.currency'),
        provider: assertString(rawPayload.provider, 'payload.provider'),
        providerPaymentId: assertString(rawPayload.providerPaymentId, 'payload.providerPaymentId'),
        paidAt: assertIsoDate(rawPayload.paidAt, 'payload.paidAt')
      };
      return { eventId, eventType: rawEventType, actorUserId, referenceType: rawRefType, referenceId, createdAt, payload: p };
    }

    case 'PAYMENT_FAILED': {
      const p: PaymentFailedPayload = {
        paymentId: assertString(rawPayload.paymentId, 'payload.paymentId'),
        orderId: assertString(rawPayload.orderId, 'payload.orderId'),
        orderNumber: assertString(rawPayload.orderNumber, 'payload.orderNumber'),
        customerId: assertString(rawPayload.customerId, 'payload.customerId'),
        amount: assertNonNegativeNumber(rawPayload.amount, 'payload.amount'),
        currency: assertCurrency(rawPayload.currency, 'payload.currency'),
        provider: assertString(rawPayload.provider, 'payload.provider'),
        failureCode: assertString(rawPayload.failureCode, 'payload.failureCode'),
        failedAt: assertIsoDate(rawPayload.failedAt, 'payload.failedAt')
      };
      return { eventId, eventType: rawEventType, actorUserId, referenceType: rawRefType, referenceId, createdAt, payload: p };
    }

    case 'PAYMENT_REFUNDED': {
      const p: PaymentRefundedPayload = {
        paymentId: assertString(rawPayload.paymentId, 'payload.paymentId'),
        orderId: assertString(rawPayload.orderId, 'payload.orderId'),
        orderNumber: assertString(rawPayload.orderNumber, 'payload.orderNumber'),
        customerId: assertString(rawPayload.customerId, 'payload.customerId'),
        amount: assertNonNegativeNumber(rawPayload.amount, 'payload.amount'),
        currency: assertCurrency(rawPayload.currency, 'payload.currency'),
        refundId: assertString(rawPayload.refundId, 'payload.refundId'),
        refundedAt: assertIsoDate(rawPayload.refundedAt, 'payload.refundedAt')
      };
      return { eventId, eventType: rawEventType, actorUserId, referenceType: rawRefType, referenceId, createdAt, payload: p };
    }

    case 'DEPLOYMENT_STARTED': {
      const p: DeploymentStartedPayload = {
        deploymentId: assertString(rawPayload.deploymentId, 'payload.deploymentId'),
        projectId: assertString(rawPayload.projectId, 'payload.projectId'),
        projectNumber: assertString(rawPayload.projectNumber, 'payload.projectNumber'),
        customerId: assertString(rawPayload.customerId, 'payload.customerId'),
        versionId: assertString(rawPayload.versionId, 'payload.versionId'),
        provider: assertString(rawPayload.provider, 'payload.provider'),
        initiatedBy: assertString(rawPayload.initiatedBy, 'payload.initiatedBy'),
        startedAt: assertIsoDate(rawPayload.startedAt, 'payload.startedAt')
      };
      return { eventId, eventType: rawEventType, actorUserId, referenceType: rawRefType, referenceId, createdAt, payload: p };
    }

    case 'DEPLOYMENT_PUBLISHED': {
      const p: DeploymentPublishedPayload = {
        deploymentId: assertString(rawPayload.deploymentId, 'payload.deploymentId'),
        projectId: assertString(rawPayload.projectId, 'payload.projectId'),
        projectNumber: assertString(rawPayload.projectNumber, 'payload.projectNumber'),
        customerId: assertString(rawPayload.customerId, 'payload.customerId'),
        deploymentUrl: assertString(rawPayload.deploymentUrl, 'payload.deploymentUrl'),
        provider: assertString(rawPayload.provider, 'payload.provider'),
        publishedAt: assertIsoDate(rawPayload.publishedAt, 'payload.publishedAt')
      };
      return { eventId, eventType: rawEventType, actorUserId, referenceType: rawRefType, referenceId, createdAt, payload: p };
    }

    case 'DEPLOYMENT_FAILED': {
      const p: DeploymentFailedPayload = {
        deploymentId: assertString(rawPayload.deploymentId, 'payload.deploymentId'),
        projectId: assertString(rawPayload.projectId, 'payload.projectId'),
        projectNumber: assertString(rawPayload.projectNumber, 'payload.projectNumber'),
        customerId: assertString(rawPayload.customerId, 'payload.customerId'),
        errorMessage: assertString(rawPayload.errorMessage, 'payload.errorMessage'),
        provider: assertString(rawPayload.provider, 'payload.provider'),
        failedAt: assertIsoDate(rawPayload.failedAt, 'payload.failedAt')
      };
      return { eventId, eventType: rawEventType, actorUserId, referenceType: rawRefType, referenceId, createdAt, payload: p };
    }

    case 'WEBSITE_UNPUBLISHED': {
      const p: WebsiteUnpublishedPayload = {
        deploymentId: assertString(rawPayload.deploymentId, 'payload.deploymentId'),
        projectId: assertString(rawPayload.projectId, 'payload.projectId'),
        projectNumber: assertString(rawPayload.projectNumber, 'payload.projectNumber'),
        customerId: assertString(rawPayload.customerId, 'payload.customerId'),
        unpublishedBy: assertString(rawPayload.unpublishedBy, 'payload.unpublishedBy'),
        provider: assertString(rawPayload.provider, 'payload.provider'),
        unpublishedAt: assertIsoDate(rawPayload.unpublishedAt, 'payload.unpublishedAt')
      };
      return { eventId, eventType: rawEventType, actorUserId, referenceType: rawRefType, referenceId, createdAt, payload: p };
    }
  }
}
