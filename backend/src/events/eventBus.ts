import {
  BusinessEvent,
  BusinessEventInput,
  BusinessEventType
} from './eventTypes';
import { validateBusinessEvent } from './eventValidator';
import { eventDb } from '../data/eventStore';
import { notificationDb } from '../data/notificationStore';
import { emailService } from '../services/emailService';
import { userDb } from '../data/userStore';
import { auditDb } from '../data/auditStore';

export class EventBus {
  /**
   * Validates, stores, and safely dispatches a canonical business event.
   * Enforces strict idempotency and zero-secret safety.
   */
  public async publishEvent<T extends BusinessEventType>(
    input: BusinessEventInput<T>
  ): Promise<BusinessEvent> {
    const now = input.createdAt || new Date().toISOString();

    const eventId = input.eventId || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const rawEnvelope = {
      eventId,
      eventType: input.eventType,
      actorUserId: input.actorUserId,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      payload: input.payload,
      createdAt: now
    };

    // 1. Strict Runtime Validation
    const validatedEvent: BusinessEvent = validateBusinessEvent(rawEnvelope);

    // 2. Strict Idempotency Check: if eventId already processed, return existing
    if (eventDb.has(validatedEvent.eventId)) {
      console.log(`[EventBus] Idempotent duplicate event ignored: ${validatedEvent.eventId} (${validatedEvent.eventType})`);
      return eventDb.getById(validatedEvent.eventId)!;
    }

    // 3. Persist valid event to disk
    eventDb.saveEvent(validatedEvent);

    // 4. Map Event to In-App Notifications and Transactional Emails
    await this.dispatchHandlers(validatedEvent);

    return validatedEvent;
  }

  /**
   * Internal dispatcher mapping validated events to in-app notifications,
   * transactional emails, and audit logs.
   */
  private async dispatchHandlers(event: BusinessEvent): Promise<void> {
    try {
      switch (event.eventType) {
        case 'USER_REGISTERED': {
          const { userId, name, email, role } = event.payload;

          // 1. In-app notification for Admins
          const admins = userDb.getAll().filter(u => u.role === 'admin');
          for (const admin of admins) {
            notificationDb.createNotification({
              userId: admin.id,
              type: 'ACCOUNT_CREATED',
              title: 'New User Registered',
              message: `User ${name} (${email}) registered on the platform with role '${role}'.`,
              link: '/dashboard/users',
              referenceId: userId,
              referenceType: 'USER'
            });
          }

          // 2. Transactional email to Admin
          await emailService.sendAccountCreatedAdminEmail({ id: userId, name, email, role });

          // 3. Audit log
          auditDb.log({
            action: 'USER_REGISTERED',
            userId,
            userName: name,
            userRole: role,
            targetId: userId,
            targetType: 'USER',
            details: `User ${name} (${email}) registered.`
          });
          break;
        }

        case 'ORDER_CREATED': {
          const { orderId, orderNumber, customerId, orderType, amount, currency } = event.payload;
          const customer = userDb.findById(customerId);
          const customerName = customer?.name || 'Customer';
          const customerEmail = customer?.email || 'customer@example.com';

          // 1. In-app notification for Customer
          notificationDb.createNotification({
            userId: customerId,
            type: 'ORDER_CREATED',
            title: `Order Created: ${orderNumber}`,
            message: `Your ${orderType} order ${orderNumber} has been created ($${amount} ${currency}).`,
            link: `/dashboard/orders/${orderId}`,
            orderId,
            orderNumber,
            referenceId: orderId,
            referenceType: 'ORDER'
          });

          // 2. In-app notification for Admins
          const admins = userDb.getAll().filter(u => u.role === 'admin');
          for (const admin of admins) {
            notificationDb.createNotification({
              userId: admin.id,
              type: 'ORDER_CREATED',
              title: `New Order: ${orderNumber}`,
              message: `${customerName} placed order ${orderNumber} ($${amount} ${currency}).`,
              link: `/dashboard/orders/${orderId}`,
              orderId,
              orderNumber,
              referenceId: orderId,
              referenceType: 'ORDER'
            });
          }

          // 3. Transactional email to Admin
          await emailService.sendNewOrderAdminEmail({
            id: orderId,
            orderNumber,
            amount,
            type: orderType,
            customerName,
            customerEmail
          });

          // 4. Audit log
          auditDb.log({
            action: 'ORDER_CREATED',
            userId: customerId,
            userName: customerName,
            userRole: 'user',
            targetId: orderId,
            targetType: 'ORDER',
            details: `Order ${orderNumber} created for $${amount} ${currency}.`
          });
          break;
        }

        case 'TEMPLATE_PURCHASED': {
          const { orderId, orderNumber, templateId, templateName, customerId, vendorId, amount } = event.payload;
          const customer = userDb.findById(customerId);
          const customerName = customer?.name || 'Customer';
          const customerEmail = customer?.email || 'customer@example.com';

          // 1. In-app notification for Customer
          notificationDb.createNotification({
            userId: customerId,
            type: 'PAYMENT_SUCCESSFUL',
            title: `Template Purchased: ${templateName}`,
            message: `You successfully acquired '${templateName}' (${orderNumber}).`,
            link: `/dashboard/orders/${orderId}`,
            orderId,
            orderNumber,
            referenceId: orderId,
            referenceType: 'ORDER'
          });

          // 2. In-app notification for Vendor
          if (vendorId) {
            notificationDb.createNotification({
              userId: vendorId,
              type: 'PAYMENT_SUCCESSFUL',
              title: `Template Sold: ${templateName}`,
              message: `${customerName} purchased your template '${templateName}' ($${amount}).`,
              link: `/dashboard/orders/${orderId}`,
              orderId,
              orderNumber,
              referenceId: orderId,
              referenceType: 'ORDER'
            });
          }

          // 3. In-app notification and email to Admins
          const admins = userDb.getAll().filter(u => u.role === 'admin');
          for (const admin of admins) {
            notificationDb.createNotification({
              userId: admin.id,
              type: 'ORDER_CREATED',
              title: `Template Order: ${orderNumber}`,
              message: `${customerName} ordered template '${templateName}' ($${amount}).`,
              link: `/dashboard/orders/${orderId}`,
              orderId,
              orderNumber,
              referenceId: orderId,
              referenceType: 'ORDER'
            });
          }
          await emailService.sendNewOrderAdminEmail({
            id: orderId,
            orderNumber,
            amount,
            type: 'template',
            customerName,
            customerEmail
          });

          // 4. Transactional email to Customer & Vendor
          await emailService.sendTemplatePurchaseEmails({
            orderId,
            orderNumber,
            amount,
            templateId,
            templateName,
            customerName,
            customerEmail,
            vendorId
          });

          // 4. Audit log
          auditDb.log({
            action: 'TEMPLATE_PURCHASED',
            userId: customerId,
            userName: customerName,
            userRole: 'customer',
            targetId: orderId,
            targetType: 'ORDER',
            details: `Template ${templateName} purchased for $${amount}.`
          });
          break;
        }

        case 'CUSTOM_WEBSITE_ORDER_CREATED': {
          const { orderId, orderNumber, customerId, businessName, packageName, amount } = event.payload;
          const customer = userDb.findById(customerId);
          const customerName = customer?.name || 'Customer';
          const customerEmail = customer?.email || 'customer@example.com';

          // 1. In-app notification for Customer
          notificationDb.createNotification({
            userId: customerId,
            type: 'ORDER_CREATED',
            title: `Order Received: ${orderNumber}`,
            message: `Your custom website request for ${businessName} (${packageName}) was received.`,
            link: `/dashboard/orders/${orderId}`,
            orderId,
            orderNumber,
            referenceId: orderId,
            referenceType: 'ORDER'
          });

          // 2. In-app notification for Admins
          const admins = userDb.getAll().filter(u => u.role === 'admin' || u.role === 'manager');
          for (const admin of admins) {
            notificationDb.createNotification({
              userId: admin.id,
              type: 'ORDER_CREATED',
              title: `New Custom Website: ${orderNumber}`,
              message: `${customerName} submitted a request for ${businessName} ($${amount}).`,
              link: `/dashboard/orders/${orderId}`,
              orderId,
              orderNumber,
              referenceId: orderId,
              referenceType: 'ORDER'
            });
          }

          // 3. Transactional email to Admin
          await emailService.sendCustomWebsiteOrderAdminEmail({
            id: orderId,
            orderNumber,
            amount,
            businessName,
            packageName,
            customerName,
            customerEmail
          });

          // 4. Audit log
          auditDb.log({
            action: 'CUSTOM_WEBSITE_ORDER_CREATED',
            userId: customerId,
            userName: customerName,
            userRole: 'customer',
            targetId: orderId,
            targetType: 'ORDER',
            details: `Custom website request ${orderNumber} placed for ${businessName}.`
          });
          break;
        }

        case 'PROJECT_ASSIGNED': {
          const { projectId, projectNumber, customerId, assignedTo, assignedBy } = event.payload;
          const staff = userDb.findById(assignedTo);

          // 1. In-app notification for assigned staff
          notificationDb.createNotification({
            userId: assignedTo,
            type: 'PROJECT_ASSIGNED',
            title: `Project Assigned: ${projectNumber}`,
            message: `You were assigned as lead on project ${projectNumber}.`,
            link: `/dashboard/projects/${projectId}`,
            projectId,
            projectNumber,
            referenceId: projectId,
            referenceType: 'PROJECT'
          });

          // 2. Transactional email to assigned staff
          if (staff?.email) {
            await emailService.sendProjectAssignedEmail({
              projectId,
              projectNumber,
              projectName: projectNumber,
              packageName: 'Custom Package',
              staffName: staff.name,
              staffEmail: staff.email
            });
          }

          // 3. Audit log
          auditDb.log({
            action: 'PROJECT_ASSIGNED',
            userId: assignedBy,
            userName: 'Staff',
            userRole: 'staff',
            targetId: projectId,
            targetType: 'PROJECT',
            details: `Project ${projectNumber} assigned to ${staff?.name || assignedTo}.`
          });
          break;
        }

        case 'PROJECT_STATUS_CHANGED': {
          const { projectId, projectNumber, customerId, newStatus, changedBy, note } = event.payload;
          const customer = userDb.findById(customerId);

          // 1. In-app notification for Customer
          notificationDb.createNotification({
            userId: customerId,
            type: 'PROJECT_STATUS_CHANGED',
            title: `Project Status: ${projectNumber}`,
            message: `Project ${projectNumber} status changed to ${newStatus}.`,
            link: `/dashboard/projects/${projectId}`,
            projectId,
            projectNumber,
            referenceId: projectId,
            referenceType: 'PROJECT'
          });

          // 2. Transactional email to Customer
          if (customer?.email) {
            await emailService.sendProjectStatusChangedEmail({
              projectId,
              projectNumber,
              projectName: projectNumber,
              newStatus,
              note,
              customerName: customer.name,
              customerEmail: customer.email
            });
          }

          // 3. Audit log
          auditDb.log({
            action: 'PROJECT_STATUS_CHANGED',
            userId: changedBy,
            userName: 'Staff',
            userRole: 'staff',
            targetId: projectId,
            targetType: 'PROJECT',
            details: `Project ${projectNumber} status transitioned to ${newStatus}.`
          });
          break;
        }

        case 'TASK_ASSIGNED': {
          const { taskId, projectId, title, assignedTo, assignedBy, dueDate } = event.payload;
          const staff = userDb.findById(assignedTo);

          // 1. In-app notification for staff
          notificationDb.createNotification({
            userId: assignedTo,
            type: 'TASK_ASSIGNED',
            title: `Task Assigned: ${title}`,
            message: `You were assigned task "${title}".`,
            link: `/dashboard/projects/${projectId}`,
            projectId,
            referenceId: taskId,
            referenceType: 'TASK'
          });

          // 2. Transactional email to staff
          if (staff?.email) {
            await emailService.sendTaskAssignedEmail({
              taskId,
              taskTitle: title,
              priority: 'HIGH',
              dueDate,
              projectId,
              projectNumber: projectId,
              staffName: staff.name,
              staffEmail: staff.email
            });
          }

          // 3. Audit log
          auditDb.log({
            action: 'TASK_ASSIGNED',
            userId: assignedBy,
            userName: 'Staff',
            userRole: 'staff',
            targetId: taskId,
            targetType: 'TASK',
            details: `Task "${title}" assigned to ${staff?.name || assignedTo}.`
          });
          break;
        }

        case 'CUSTOMER_APPROVED': {
          const { projectId, projectNumber, customerId, approvedBy } = event.payload;
          const customer = userDb.findById(customerId);
          const customerName = customer?.name || 'Customer';

          // 1. In-app notification for Admins
          const admins = userDb.getAll().filter(u => u.role === 'admin' || u.role === 'manager');
          for (const admin of admins) {
            notificationDb.createNotification({
              userId: admin.id,
              type: 'CUSTOMER_APPROVAL',
              title: `Customer Approved: ${projectNumber}`,
              message: `Customer ${customerName} approved deliverables for ${projectNumber}.`,
              link: `/dashboard/projects/${projectId}`,
              projectId,
              projectNumber,
              referenceId: projectId,
              referenceType: 'PROJECT'
            });
          }

          // 2. Transactional email to Admin
          await emailService.sendCustomerApprovalEmail({
            orderId: projectId,
            orderNumber: projectNumber,
            customerName
          });
          break;
        }

        case 'PROJECT_DELIVERED': {
          const { projectId, projectNumber, customerId } = event.payload;
          const customer = userDb.findById(customerId);

          // 1. In-app notification for Customer
          notificationDb.createNotification({
            userId: customerId,
            type: 'FINAL_DELIVERY',
            title: `Website Delivered: ${projectNumber}`,
            message: `Your website project ${projectNumber} is complete and delivered!`,
            link: `/dashboard/projects/${projectId}`,
            projectId,
            projectNumber,
            referenceId: projectId,
            referenceType: 'PROJECT'
          });

          // 2. Transactional email to Customer
          if (customer?.email) {
            await emailService.sendFinalDeliveryEmail({
              referenceId: projectId,
              referenceNumber: projectNumber,
              referenceType: 'PROJECT',
              title: projectNumber,
              customerName: customer.name,
              customerEmail: customer.email
            });
          }
          break;
        }

        case 'PAYMENT_SUCCESSFUL': {
          const { paymentId, orderId, orderNumber, customerId, amount, currency, provider } = event.payload;

          // 1. In-app notification for Customer
          notificationDb.createNotification({
            userId: customerId,
            type: 'PAYMENT_SUCCESSFUL',
            title: `Payment Received: ${orderNumber}`,
            message: `Your payment of $${amount} ${currency} has been verified via ${provider}.`,
            link: `/dashboard/orders/${orderId}`,
            orderId,
            orderNumber,
            referenceId: paymentId,
            referenceType: 'PAYMENT'
          });

          // 2. In-app notification for Admins
          const admins = userDb.getAll().filter(u => u.role === 'admin');
          for (const admin of admins) {
            notificationDb.createNotification({
              userId: admin.id,
              type: 'PAYMENT_SUCCESSFUL',
              title: `Verified Payment: ${orderNumber}`,
              message: `Payment of $${amount} ${currency} confirmed for order ${orderNumber} (${provider}).`,
              link: `/dashboard/orders/${orderId}`,
              orderId,
              orderNumber,
              referenceId: paymentId,
              referenceType: 'PAYMENT'
            });
          }
          break;
        }

        case 'PAYMENT_FAILED': {
          const { paymentId, orderId, orderNumber, customerId, failureCode } = event.payload;

          // 1. In-app notification for Customer with direct retry link
          notificationDb.createNotification({
            userId: customerId,
            type: 'PAYMENT_FAILED',
            title: `Payment Failed: ${orderNumber}`,
            message: `Transaction was declined (${failureCode}). Please retry with a valid payment method.`,
            link: `/checkout?orderId=${orderId}`,
            orderId,
            orderNumber,
            referenceId: paymentId,
            referenceType: 'PAYMENT'
          });
          break;
        }

        case 'PAYMENT_REFUNDED': {
          const { paymentId, orderId, orderNumber, customerId, amount, currency } = event.payload;

          // 1. In-app notification for Customer
          notificationDb.createNotification({
            userId: customerId,
            type: 'PAYMENT_REFUNDED',
            title: `Refund Processed: ${orderNumber}`,
            message: `A refund of $${amount} ${currency} has been issued for order ${orderNumber}.`,
            link: `/dashboard/orders/${orderId}`,
            orderId,
            orderNumber,
            referenceId: paymentId,
            referenceType: 'PAYMENT'
          });
          break;
        }

        case 'DEPLOYMENT_STARTED': {
          const { deploymentId, projectId, projectNumber, customerId, provider } = event.payload;
          const customer = userDb.findById(customerId);

          // 1. In-app notification for Customer
          notificationDb.createNotification({
            userId: customerId,
            type: 'DEPLOYMENT_STARTED',
            title: `Publishing Started: ${projectNumber}`,
            message: `Your website for project ${projectNumber} is being published via ${provider}.`,
            link: `/dashboard/my-projects/${projectId}/publishing`,
            projectId,
            projectNumber,
            referenceId: deploymentId,
            referenceType: 'DEPLOYMENT'
          });

          // 2. In-app notification for Admins/Managers
          const admins = userDb.getAll().filter(u => u.role === 'admin' || u.role === 'manager');
          for (const admin of admins) {
            notificationDb.createNotification({
              userId: admin.id,
              type: 'DEPLOYMENT_STARTED',
              title: `Deployment Started: ${projectNumber}`,
              message: `${customer?.name || 'Customer'} website deployment started via ${provider}.`,
              link: `/dashboard/projects/${projectId}`,
              projectId,
              projectNumber,
              referenceId: deploymentId,
              referenceType: 'DEPLOYMENT'
            });
          }

          // 3. Audit log
          auditDb.log({
            action: 'DEPLOYMENT_STARTED',
            userId: event.actorUserId,
            userName: customer?.name || 'System',
            userRole: 'admin',
            targetId: deploymentId,
            targetType: 'DEPLOYMENT',
            details: `Deployment started for project ${projectNumber} via ${provider}.`
          });
          break;
        }

        case 'DEPLOYMENT_PUBLISHED': {
          const { deploymentId, projectId, projectNumber, customerId, deploymentUrl, provider } = event.payload;
          const customer = userDb.findById(customerId);

          // 1. In-app notification for Customer
          notificationDb.createNotification({
            userId: customerId,
            type: 'DEPLOYMENT_PUBLISHED',
            title: `Website Published: ${projectNumber}`,
            message: `Your website is live at ${deploymentUrl}`,
            link: `/dashboard/my-projects/${projectId}/publishing`,
            projectId,
            projectNumber,
            referenceId: deploymentId,
            referenceType: 'DEPLOYMENT'
          });

          // 2. In-app notification for Admins/Managers
          const admins = userDb.getAll().filter(u => u.role === 'admin' || u.role === 'manager');
          for (const admin of admins) {
            notificationDb.createNotification({
              userId: admin.id,
              type: 'DEPLOYMENT_PUBLISHED',
              title: `Website Published: ${projectNumber}`,
              message: `${customer?.name || 'Customer'} website is live: ${deploymentUrl}`,
              link: `/dashboard/projects/${projectId}`,
              projectId,
              projectNumber,
              referenceId: deploymentId,
              referenceType: 'DEPLOYMENT'
            });
          }

          // 3. Transactional email to Customer
          if (customer?.email) {
            await emailService.sendFinalDeliveryEmail({
              referenceId: deploymentId,
              referenceNumber: projectNumber,
              referenceType: 'PROJECT',
              title: `Your Website is Live`,
              customerName: customer.name,
              customerEmail: customer.email
            });
          }

          // 4. Audit log
          auditDb.log({
            action: 'DEPLOYMENT_PUBLISHED',
            userId: event.actorUserId,
            userName: customer?.name || 'System',
            userRole: 'admin',
            targetId: deploymentId,
            targetType: 'DEPLOYMENT',
            details: `Project ${projectNumber} published via ${provider} at ${deploymentUrl}.`
          });
          break;
        }

        case 'DEPLOYMENT_FAILED': {
          const { deploymentId, projectId, projectNumber, customerId, errorMessage, provider } = event.payload;
          const customer = userDb.findById(customerId);

          // 1. In-app notification for Customer
          notificationDb.createNotification({
            userId: customerId,
            type: 'DEPLOYMENT_FAILED',
            title: `Deployment Failed: ${projectNumber}`,
            message: `Website publishing failed: ${errorMessage}`,
            link: `/dashboard/my-projects/${projectId}/publishing`,
            projectId,
            projectNumber,
            referenceId: deploymentId,
            referenceType: 'DEPLOYMENT'
          });

          // 2. In-app notification for Admins/Managers
          const admins = userDb.getAll().filter(u => u.role === 'admin' || u.role === 'manager');
          for (const admin of admins) {
            notificationDb.createNotification({
              userId: admin.id,
              type: 'DEPLOYMENT_FAILED',
              title: `Deployment Failed: ${projectNumber}`,
              message: `${customer?.name || 'Customer'} website deployment failed via ${provider}: ${errorMessage}`,
              link: `/dashboard/projects/${projectId}`,
              projectId,
              projectNumber,
              referenceId: deploymentId,
              referenceType: 'DEPLOYMENT'
            });
          }

          // 3. Audit log
          auditDb.log({
            action: 'DEPLOYMENT_FAILED',
            userId: event.actorUserId,
            userName: customer?.name || 'System',
            userRole: 'admin',
            targetId: deploymentId,
            targetType: 'DEPLOYMENT',
            details: `Deployment failed for project ${projectNumber}: ${errorMessage}`
          });
          break;
        }

        case 'WEBSITE_UNPUBLISHED': {
          const { deploymentId, projectId, projectNumber, customerId, unpublishedBy } = event.payload;
          const customer = userDb.findById(customerId);

          // 1. In-app notification for Customer
          notificationDb.createNotification({
            userId: customerId,
            type: 'WEBSITE_UNPUBLISHED',
            title: `Website Unpublished: ${projectNumber}`,
            message: `Your website for project ${projectNumber} has been taken offline.`,
            link: `/dashboard/my-projects/${projectId}/publishing`,
            projectId,
            projectNumber,
            referenceId: deploymentId,
            referenceType: 'DEPLOYMENT'
          });

          // 2. Audit log
          auditDb.log({
            action: 'WEBSITE_UNPUBLISHED',
            userId: unpublishedBy,
            userName: customer?.name || 'Admin',
            userRole: 'admin',
            targetId: deploymentId,
            targetType: 'DEPLOYMENT',
            details: `Website for project ${projectNumber} unpublished.`
          });
          break;
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[EventBus] Error in event handlers for ${event.eventType}:`, msg);
    }
  }
}

export const eventBus = new EventBus();
