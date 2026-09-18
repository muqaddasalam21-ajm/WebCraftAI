export type EmailEventType =
  | 'ACCOUNT_CREATED'
  | 'NEW_ORDER'
  | 'TEMPLATE_PURCHASE'
  | 'CUSTOM_ORDER'
  | 'PROJECT_ASSIGNED'
  | 'PROJECT_STATUS_CHANGED'
  | 'TASK_ASSIGNED'
  | 'CUSTOMER_APPROVAL'
  | 'FINAL_DELIVERY';

export type EmailStatus = 'SENT' | 'FAILED' | 'SIMULATED' | 'QUEUED';

export type EmailProviderType = 'resend' | 'local_outbox';

export interface EmailLog {
  id: string;
  eventId: string; // Idempotency key
  eventType: EmailEventType;
  to: string;
  recipientName: string;
  subject: string;
  text: string;
  html: string;
  referenceId?: string;
  referenceType?: 'ORDER' | 'PROJECT' | 'TASK' | 'USER';
  status: EmailStatus;
  provider: EmailProviderType;
  providerMessageId?: string;
  error?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SendEmailPayload {
  eventId: string;
  eventType: EmailEventType;
  to: string;
  recipientName: string;
  subject: string;
  text: string;
  html: string;
  referenceId?: string;
  referenceType?: 'ORDER' | 'PROJECT' | 'TASK' | 'USER';
}
