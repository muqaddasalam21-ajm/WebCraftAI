import { EmailEventType, EmailLog, SendEmailPayload } from '../models/email';
import { emailDb } from '../data/emailStore';
import { userDb } from '../data/userStore';

export class EmailService {
  private resendApiKey: string | undefined;
  private adminEmail: string;
  private emailFrom: string;
  private appUrl: string;

  constructor() {
    this.resendApiKey = process.env.RESEND_API_KEY;
    this.adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@webcraft.ai';
    this.emailFrom = process.env.EMAIL_FROM || 'WebCraftAI <notifications@webcraft.ai>';
    this.appUrl = process.env.APP_URL || 'http://localhost:3000';
  }

  public getAdminEmail(): string {
    return this.adminEmail;
  }

  /**
   * Generates a branded, responsive, safe HTML email template
   */
  public generateHtmlTemplate(params: {
    title: string;
    badgeText: string;
    recipientName: string;
    messageParagraphs: string[];
    detailsTable?: { label: string; value: string }[];
    actionButton?: { label: string; url: string };
  }): string {
    const tableRows = params.detailsTable && params.detailsTable.length > 0
      ? `
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0; background-color: #f8fafc; border-radius: 8px; overflow: hidden;">
          ${params.detailsTable.map(row => `
            <tr>
              <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #475569; width: 35%;">${row.label}</td>
              <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a; font-weight: 500;">${row.value}</td>
            </tr>
          `).join('')}
        </table>
      `
      : '';

    const actionHtml = params.actionButton
      ? `
        <div style="margin: 32px 0; text-align: center;">
          <a href="${params.actionButton.url}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">
            ${params.actionButton.label} &rarr;
          </a>
        </div>
      `
      : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${params.title}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 40px 16px; color: #1e293b;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 32px; text-align: left;">
              <div style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">WebCraftAI</div>
              <div style="display: inline-block; margin-top: 12px; padding: 4px 12px; background-color: rgba(255, 255, 255, 0.2); border-radius: 9999px; font-size: 12px; font-weight: 600; color: #ffffff;">
                ${params.badgeText}
              </div>
            </div>

            <!-- Content -->
            <div style="padding: 36px 32px;">
              <h2 style="margin-top: 0; font-size: 20px; font-weight: 700; color: #0f172a;">Hello, ${params.recipientName}</h2>
              
              ${params.messageParagraphs.map(p => `<p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 12px 0;">${p}</p>`).join('')}

              ${tableRows}

              ${actionHtml}

              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;">

              <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
                This is an automated notification from the WebCraftAI platform.<br>
                For security reasons, never share passwords or sensitive tokens with anyone.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #64748b; margin: 0;">&copy; ${new Date().getFullYear()} WebCraftAI. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Dispatches transactional email with strict idempotency and resilient error handling
   */
  public async sendTransactionalEmail(payload: SendEmailPayload): Promise<EmailLog> {
    const normalizedTo = payload.to.trim().toLowerCase();

    // 1. Idempotency Check: Don't send twice for the same event and recipient
    const existing = emailDb.getByEventIdAndRecipient(payload.eventId, normalizedTo);
    if (existing && (existing.status === 'SENT' || existing.status === 'SIMULATED')) {
      console.log(`[EmailService] Duplicate email suppressed by idempotency key: ${payload.eventId} to ${normalizedTo}`);
      return existing;
    }

    const now = new Date().toISOString();
    const emailLog: EmailLog = existing || {
      id: `eml_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      eventId: payload.eventId,
      eventType: payload.eventType,
      to: normalizedTo,
      recipientName: payload.recipientName,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      referenceId: payload.referenceId,
      referenceType: payload.referenceType,
      status: 'QUEUED',
      provider: this.resendApiKey ? 'resend' : 'local_outbox',
      retryCount: 0,
      createdAt: now,
      updatedAt: now
    };

    if (!existing) {
      emailDb.create(emailLog);
    }

    // 2. Real Resend API Transmission if API Key is configured
    if (this.resendApiKey && this.resendApiKey.trim() !== '') {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.resendApiKey.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: this.emailFrom,
            to: [normalizedTo],
            subject: payload.subject,
            html: payload.html,
            text: payload.text
          })
        });

        const data: any = await response.json();

        if (response.ok && data?.id) {
          emailDb.updateStatus(emailLog.id, 'SENT', { providerMessageId: data.id });
          console.log(`[EmailService] Resend email delivered: ${data.id} to ${normalizedTo}`);
        } else {
          const errMessage = data?.message || `Resend API returned status ${response.status}`;
          console.error(`[EmailService] Resend delivery error:`, errMessage);
          emailDb.updateStatus(emailLog.id, 'FAILED', { error: errMessage });
        }
      } catch (err: any) {
        console.error(`[EmailService] Network / provider failure delivering email:`, err.message);
        emailDb.updateStatus(emailLog.id, 'FAILED', { error: err.message || 'Network error delivering email' });
      }
    } else {
      // 3. Fallback / Test / Local Mode (Zero mock faking: clearly recorded in audit store as SIMULATED)
      emailDb.updateStatus(emailLog.id, 'SIMULATED', {
        providerMessageId: `outbox_${emailLog.id}`
      });
      console.log(`[EmailService] Email recorded in persistent outbox (${emailLog.eventType}): ${emailLog.subject} -> ${normalizedTo}`);
      console.log(`[EmailService] (To deliver live via Resend, set RESEND_API_KEY in backend/.env)`);
    }

    return emailDb.getById(emailLog.id)!;
  }

  // =========================================================================
  // 1. New account created → Admin
  // =========================================================================
  public async sendAccountCreatedAdminEmail(user: { id: string; name: string; email: string; role: string }): Promise<EmailLog> {
    const eventId = `evt_acc_${user.id}`;
    const subject = `[New Account] ${user.name} (${user.email}) registered`;
    const safeLink = `${this.appUrl}/dashboard/users`;

    const html = this.generateHtmlTemplate({
      title: subject,
      badgeText: 'New User Registration',
      recipientName: 'Administrator',
      messageParagraphs: [
        `A new user account has been successfully registered on WebCraftAI.`,
        `You can manage user roles and permissions directly in the administration center.`
      ],
      detailsTable: [
        { label: 'User ID', value: user.id },
        { label: 'Full Name', value: user.name },
        { label: 'Email Address', value: user.email },
        { label: 'Assigned Role', value: user.role.toUpperCase() },
        { label: 'Registration Date', value: new Date().toLocaleString() }
      ],
      actionButton: { label: 'Review Users in Dashboard', url: safeLink }
    });

    return this.sendTransactionalEmail({
      eventId,
      eventType: 'ACCOUNT_CREATED',
      to: this.adminEmail,
      recipientName: 'Platform Administrator',
      subject,
      text: `New user account registered: ${user.name} (${user.email}) with role ${user.role}. View at: ${safeLink}`,
      html,
      referenceId: user.id,
      referenceType: 'USER'
    });
  }

  // =========================================================================
  // 2. New order → Admin
  // =========================================================================
  public async sendNewOrderAdminEmail(order: { id: string; orderNumber: string; amount: number; type: string; customerName: string; customerEmail: string }): Promise<EmailLog> {
    const eventId = `evt_ord_new_${order.id}`;
    const subject = `[New Order] ${order.orderNumber} placed by ${order.customerName} ($${order.amount})`;
    const safeLink = `${this.appUrl}/dashboard/orders/${order.id}`;

    const html = this.generateHtmlTemplate({
      title: subject,
      badgeText: 'New Order Placed',
      recipientName: 'Administrator',
      messageParagraphs: [
        `A new order has been received on the WebCraftAI platform.`,
        `Please review the order details and initiate required operational workflows.`
      ],
      detailsTable: [
        { label: 'Order Number', value: order.orderNumber },
        { label: 'Order Type', value: order.type.toUpperCase().replace(/_/g, ' ') },
        { label: 'Customer', value: `${order.customerName} (${order.customerEmail})` },
        { label: 'Order Total', value: `$${order.amount} USD` },
        { label: 'Placed Date', value: new Date().toLocaleString() }
      ],
      actionButton: { label: 'View Order Details', url: safeLink }
    });

    return this.sendTransactionalEmail({
      eventId,
      eventType: 'NEW_ORDER',
      to: this.adminEmail,
      recipientName: 'Platform Administrator',
      subject,
      text: `New order ${order.orderNumber} ($${order.amount}) received from ${order.customerName}. View at: ${safeLink}`,
      html,
      referenceId: order.id,
      referenceType: 'ORDER'
    });
  }

  // =========================================================================
  // 3. Template purchase → Customer + relevant Vendor
  // =========================================================================
  public async sendTemplatePurchaseEmails(params: {
    orderId: string;
    orderNumber: string;
    amount: number;
    templateId: string;
    templateName: string;
    customerName: string;
    customerEmail: string;
    vendorId?: string;
  }): Promise<{ customerEmailLog: EmailLog; vendorEmailLog?: EmailLog }> {
    // 3a. Email to Customer
    const custEventId = `evt_tpl_cust_${params.orderId}`;
    const custSubject = `[Order Confirmation] You purchased ${params.templateName} (${params.orderNumber})`;
    const custLink = `${this.appUrl}/dashboard/orders/${params.orderId}`;

    const custHtml = this.generateHtmlTemplate({
      title: custSubject,
      badgeText: 'Template Order Confirmed',
      recipientName: params.customerName,
      messageParagraphs: [
        `Thank you for purchasing the template "${params.templateName}".`,
        `Your template license is active and ready for your website build.`
      ],
      detailsTable: [
        { label: 'Order Reference', value: params.orderNumber },
        { label: 'Template Name', value: params.templateName },
        { label: 'Amount Paid', value: `$${params.amount} USD` },
        { label: 'Status', value: 'PAID' },
        { label: 'Purchase Date', value: new Date().toLocaleString() }
      ],
      actionButton: { label: 'Access Purchased Template', url: custLink }
    });

    const customerEmailLog = await this.sendTransactionalEmail({
      eventId: custEventId,
      eventType: 'TEMPLATE_PURCHASE',
      to: params.customerEmail,
      recipientName: params.customerName,
      subject: custSubject,
      text: `Order Confirmation: You purchased ${params.templateName} for $${params.amount}. Access at: ${custLink}`,
      html: custHtml,
      referenceId: params.orderId,
      referenceType: 'ORDER'
    });

    // 3b. Email to Vendor (if vendor exists)
    let vendorEmailLog: EmailLog | undefined;
    if (params.vendorId) {
      const vendorUser = userDb.findById(params.vendorId);
      if (vendorUser && vendorUser.email) {
        const vndEventId = `evt_tpl_vnd_${params.orderId}`;
        const vndSubject = `[Sale Alert] Your template "${params.templateName}" was purchased!`;
        const vndLink = `${this.appUrl}/dashboard/templates`;

        const vndHtml = this.generateHtmlTemplate({
          title: vndSubject,
          badgeText: 'New Template Sale',
          recipientName: vendorUser.name,
          messageParagraphs: [
            `Great news! A customer has just purchased your marketplace template "${params.templateName}".`,
            `The sale has been recorded to your vendor statistics.`
          ],
          detailsTable: [
            { label: 'Order Reference', value: params.orderNumber },
            { label: 'Template Name', value: params.templateName },
            { label: 'Sale Amount', value: `$${params.amount} USD` },
            { label: 'Sale Date', value: new Date().toLocaleString() }
          ],
          actionButton: { label: 'View Template Statistics', url: vndLink }
        });

        vendorEmailLog = await this.sendTransactionalEmail({
          eventId: vndEventId,
          eventType: 'TEMPLATE_PURCHASE',
          to: vendorUser.email,
          recipientName: vendorUser.name,
          subject: vndSubject,
          text: `Sale alert: Your template "${params.templateName}" was purchased for $${params.amount}. Check details at: ${vndLink}`,
          html: vndHtml,
          referenceId: params.orderId,
          referenceType: 'ORDER'
        });
      }
    }

    return { customerEmailLog, vendorEmailLog };
  }

  // =========================================================================
  // 4. Custom website order → Admin
  // =========================================================================
  public async sendCustomWebsiteOrderAdminEmail(order: {
    id: string;
    orderNumber: string;
    amount: number;
    businessName: string;
    packageName: string;
    customerName: string;
    customerEmail: string;
  }): Promise<EmailLog> {
    const eventId = `evt_custom_ord_${order.id}`;
    const subject = `[Custom Website Request] ${order.orderNumber}: ${order.businessName} (${order.packageName})`;
    const safeLink = `${this.appUrl}/dashboard/orders/${order.id}`;

    const html = this.generateHtmlTemplate({
      title: subject,
      badgeText: 'Custom Website Order',
      recipientName: 'Administrator',
      messageParagraphs: [
        `A new custom website design request has been submitted by ${order.customerName}.`,
        `Please review the business requirements and design preferences to initialize the project.`
      ],
      detailsTable: [
        { label: 'Order Number', value: order.orderNumber },
        { label: 'Business Name', value: order.businessName },
        { label: 'Selected Package', value: order.packageName },
        { label: 'Customer', value: `${order.customerName} (${order.customerEmail})` },
        { label: 'Order Value', value: `$${order.amount} USD` },
        { label: 'Submission Time', value: new Date().toLocaleString() }
      ],
      actionButton: { label: 'Review Project Requirements', url: safeLink }
    });

    return this.sendTransactionalEmail({
      eventId,
      eventType: 'CUSTOM_ORDER',
      to: this.adminEmail,
      recipientName: 'Platform Administrator',
      subject,
      text: `New Custom Website request for ${order.businessName} (${order.packageName}) from ${order.customerName}. Review at: ${safeLink}`,
      html,
      referenceId: order.id,
      referenceType: 'ORDER'
    });
  }

  // =========================================================================
  // 5. Project assigned → Assigned Manager/Staff
  // =========================================================================
  public async sendProjectAssignedEmail(params: {
    projectId: string;
    projectNumber: string;
    projectName: string;
    packageName: string;
    estimatedDeliveryDate?: string;
    staffName: string;
    staffEmail: string;
  }): Promise<EmailLog> {
    const eventId = `evt_prj_assign_${params.projectId}_${params.staffEmail}`;
    const subject = `[Project Assigned] You are assigned to lead ${params.projectNumber} (${params.projectName})`;
    const safeLink = `${this.appUrl}/dashboard/projects/${params.projectId}`;

    const html = this.generateHtmlTemplate({
      title: subject,
      badgeText: 'Project Assignment',
      recipientName: params.staffName,
      messageParagraphs: [
        `You have been designated as the project lead for ${params.projectNumber}.`,
        `You are responsible for managing tasks, tracking milestones, and delivering the website build.`
      ],
      detailsTable: [
        { label: 'Project Number', value: params.projectNumber },
        { label: 'Project Name', value: params.projectName },
        { label: 'Package', value: params.packageName },
        { label: 'Delivery Deadline', value: params.estimatedDeliveryDate ? new Date(params.estimatedDeliveryDate).toLocaleDateString() : 'To be determined' },
        { label: 'Assigned Date', value: new Date().toLocaleString() }
      ],
      actionButton: { label: 'Open Project Workspace', url: safeLink }
    });

    return this.sendTransactionalEmail({
      eventId,
      eventType: 'PROJECT_ASSIGNED',
      to: params.staffEmail,
      recipientName: params.staffName,
      subject,
      text: `You have been assigned to project ${params.projectNumber} (${params.projectName}). View workspace at: ${safeLink}`,
      html,
      referenceId: params.projectId,
      referenceType: 'PROJECT'
    });
  }

  // =========================================================================
  // 6. Project status changed → Customer
  // =========================================================================
  public async sendProjectStatusChangedEmail(params: {
    projectId: string;
    projectNumber: string;
    projectName: string;
    newStatus: string;
    note?: string;
    customerName: string;
    customerEmail: string;
  }): Promise<EmailLog> {
    const timestamp = Date.now();
    const eventId = `evt_prj_stat_${params.projectId}_${params.newStatus}_${timestamp}`;
    const subject = `[Project Update] ${params.projectNumber} is now ${params.newStatus.replace(/_/g, ' ')}`;
    const safeLink = `${this.appUrl}/dashboard/my-projects`;

    const html = this.generateHtmlTemplate({
      title: subject,
      badgeText: 'Status Update',
      recipientName: params.customerName,
      messageParagraphs: [
        `Your website project "${params.projectName}" has progressed to a new milestone.`,
        params.note ? `Update notes from the team: "${params.note}"` : 'Our design and engineering team is actively moving forward.'
      ],
      detailsTable: [
        { label: 'Project Reference', value: params.projectNumber },
        { label: 'Current Status', value: params.newStatus.replace(/_/g, ' ') },
        { label: 'Updated At', value: new Date().toLocaleString() }
      ],
      actionButton: { label: 'Check Progress in Dashboard', url: safeLink }
    });

    return this.sendTransactionalEmail({
      eventId,
      eventType: 'PROJECT_STATUS_CHANGED',
      to: params.customerEmail,
      recipientName: params.customerName,
      subject,
      text: `Status update for ${params.projectNumber}: ${params.newStatus}. Check progress at: ${safeLink}`,
      html,
      referenceId: params.projectId,
      referenceType: 'PROJECT'
    });
  }

  // =========================================================================
  // 7. Task assigned → Assigned user
  // =========================================================================
  public async sendTaskAssignedEmail(params: {
    taskId: string;
    taskTitle: string;
    priority: string;
    dueDate?: string;
    projectId: string;
    projectNumber: string;
    staffName: string;
    staffEmail: string;
  }): Promise<EmailLog> {
    const eventId = `evt_tsk_assign_${params.taskId}_${params.staffEmail}`;
    const subject = `[Task Assigned] "${params.taskTitle}" on ${params.projectNumber}`;
    const safeLink = `${this.appUrl}/dashboard/projects/${params.projectId}`;

    const html = this.generateHtmlTemplate({
      title: subject,
      badgeText: 'New Task Assignment',
      recipientName: params.staffName,
      messageParagraphs: [
        `You have been assigned a task on project ${params.projectNumber}.`,
        `Please review the task requirements and update the status upon completion.`
      ],
      detailsTable: [
        { label: 'Task Title', value: params.taskTitle },
        { label: 'Project Reference', value: params.projectNumber },
        { label: 'Priority', value: params.priority },
        { label: 'Due Date', value: params.dueDate ? new Date(params.dueDate).toLocaleDateString() : 'No deadline set' },
        { label: 'Assigned Date', value: new Date().toLocaleString() }
      ],
      actionButton: { label: 'View Project Tasks', url: safeLink }
    });

    return this.sendTransactionalEmail({
      eventId,
      eventType: 'TASK_ASSIGNED',
      to: params.staffEmail,
      recipientName: params.staffName,
      subject,
      text: `You were assigned task "${params.taskTitle}" on ${params.projectNumber}. View at: ${safeLink}`,
      html,
      referenceId: params.taskId,
      referenceType: 'TASK'
    });
  }

  // =========================================================================
  // 8. Customer approval → Admin/assigned staff
  // =========================================================================
  public async sendCustomerApprovalEmail(params: {
    orderId: string;
    orderNumber: string;
    customerName: string;
    staffEmail?: string;
    staffName?: string;
  }): Promise<EmailLog[]> {
    const timestamp = Date.now();
    const eventId = `evt_cust_appr_${params.orderId}_${timestamp}`;
    const subject = `[Customer Approved] Order ${params.orderNumber} approved by ${params.customerName}`;
    const safeLink = `${this.appUrl}/dashboard/orders/${params.orderId}`;

    const html = this.generateHtmlTemplate({
      title: subject,
      badgeText: 'Customer Approved',
      recipientName: 'Team',
      messageParagraphs: [
        `The customer ${params.customerName} has approved the preview/deliverable for order ${params.orderNumber}.`,
        `You may now proceed with final deployment, domain linking, and delivery handover.`
      ],
      detailsTable: [
        { label: 'Order Number', value: params.orderNumber },
        { label: 'Customer', value: params.customerName },
        { label: 'Approval Status', value: 'CUSTOMER APPROVED' },
        { label: 'Approval Time', value: new Date().toLocaleString() }
      ],
      actionButton: { label: 'Complete Final Delivery', url: safeLink }
    });

    const logs: EmailLog[] = [];

    // Notify Admin
    const adminLog = await this.sendTransactionalEmail({
      eventId: `${eventId}_admin`,
      eventType: 'CUSTOMER_APPROVAL',
      to: this.adminEmail,
      recipientName: 'Platform Administrator',
      subject,
      text: `Order ${params.orderNumber} has been approved by customer ${params.customerName}. View at: ${safeLink}`,
      html,
      referenceId: params.orderId,
      referenceType: 'ORDER'
    });
    logs.push(adminLog);

    // Notify Assigned Staff if present
    if (params.staffEmail && params.staffEmail.toLowerCase() !== this.adminEmail.toLowerCase()) {
      const staffLog = await this.sendTransactionalEmail({
        eventId: `${eventId}_staff`,
        eventType: 'CUSTOMER_APPROVAL',
        to: params.staffEmail,
        recipientName: params.staffName || 'Staff Member',
        subject,
        text: `Order ${params.orderNumber} has been approved by customer ${params.customerName}. View at: ${safeLink}`,
        html,
        referenceId: params.orderId,
        referenceType: 'ORDER'
      });
      logs.push(staffLog);
    }

    return logs;
  }

  // =========================================================================
  // 9. Final delivery → Customer
  // =========================================================================
  public async sendFinalDeliveryEmail(params: {
    referenceId: string;
    referenceNumber: string;
    referenceType: 'ORDER' | 'PROJECT';
    title: string;
    deliveredUrl?: string;
    customerName: string;
    customerEmail: string;
  }): Promise<EmailLog> {
    const timestamp = Date.now();
    const eventId = `evt_final_del_${params.referenceId}_${timestamp}`;
    const subject = `🎉 [Delivery Complete] Your website "${params.title}" is ready!`;
    const safeLink = params.deliveredUrl || `${this.appUrl}/dashboard/my-projects`;

    const html = this.generateHtmlTemplate({
      title: subject,
      badgeText: 'Website Delivered',
      recipientName: params.customerName,
      messageParagraphs: [
        `Congratulations! Your website "${params.title}" has been successfully completed and delivered.`,
        `All project milestones are complete, production builds are deployed, and your site is ready for the world.`
      ],
      detailsTable: [
        { label: 'Project Reference', value: params.referenceNumber },
        { label: 'Website Title', value: params.title },
        { label: 'Delivery Status', value: 'DELIVERED / COMPLETED' },
        params.deliveredUrl ? { label: 'Live Website URL', value: params.deliveredUrl } : { label: 'Dashboard Access', value: 'Available in your account' },
        { label: 'Completion Date', value: new Date().toLocaleString() }
      ],
      actionButton: { label: 'View Your Live Website', url: safeLink }
    });

    return this.sendTransactionalEmail({
      eventId,
      eventType: 'FINAL_DELIVERY',
      to: params.customerEmail,
      recipientName: params.customerName,
      subject,
      text: `Your website "${params.title}" (${params.referenceNumber}) has been delivered! Access it at: ${safeLink}`,
      html,
      referenceId: params.referenceId,
      referenceType: params.referenceType
    });
  }

  /**
   * Retries delivery for a previously failed email
   */
  public async retryFailedEmail(emailId: string): Promise<EmailLog | null> {
    const email = emailDb.getById(emailId);
    if (!email) return null;

    if (email.status !== 'FAILED') {
      return email;
    }

    // Attempt delivery again
    if (this.resendApiKey && this.resendApiKey.trim() !== '') {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.resendApiKey.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: this.emailFrom,
            to: [email.to],
            subject: email.subject,
            html: email.html,
            text: email.text
          })
        });

        const data: any = await response.json();

        if (response.ok && data?.id) {
          emailDb.updateStatus(email.id, 'SENT', { providerMessageId: data.id });
        } else {
          emailDb.updateStatus(email.id, 'FAILED', { error: data?.message || 'Retry failed' });
        }
      } catch (err: any) {
        emailDb.updateStatus(email.id, 'FAILED', { error: err.message || 'Retry failed due to network error' });
      }
    } else {
      emailDb.updateStatus(email.id, 'SIMULATED', {
        providerMessageId: `outbox_${email.id}_retried`
      });
    }

    return emailDb.getById(emailId);
  }
}

export const emailService = new EmailService();
