import fs from 'fs';
import path from 'path';
import {
  CustomWebsiteOrder,
  CustomWebsiteOrderStatus,
  StatusHistoryEntry,
  OrderPackageOption
} from '../models/customWebsiteOrder';
import { notificationDb } from './notificationStore';
import { userDb } from './userStore';
import { templateDb } from './templateStore';
import { servicePackageDb } from './servicePackageStore';
import { productDb } from './productStore';
import { auditDb } from './auditStore';
import { emailService } from '../services/emailService';
import { eventBus } from '../events/eventBus';

const ORDERS_FILE = path.join(__dirname, '../../data/orders.json');
const PACKAGES_FILE = path.join(__dirname, '../../data/packages.json');

class OrderDatabase {
  private orders: Map<string, CustomWebsiteOrder> = new Map();

  constructor() {
    this.load();
  }

  private load() {
    const dir = path.dirname(ORDERS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(ORDERS_FILE)) {
      try {
        const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
        const list: CustomWebsiteOrder[] = JSON.parse(raw);
        list.forEach(o => this.orders.set(o.id, o));
        return;
      } catch (err) {
        console.error('Error loading orders database:', err);
      }
    }

    // Single source of truth - no mock or sample orders
    this.orders.clear();
    this.save();
  }

  public save() {
    try {
      const dir = path.dirname(ORDERS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const list = Array.from(this.orders.values());
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving orders to disk:', err);
    }
  }

  public getPackages(): OrderPackageOption[] {
    if (fs.existsSync(PACKAGES_FILE)) {
      try {
        const raw = fs.readFileSync(PACKAGES_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error reading packages.json:', err);
      }
    }
    return [];
  }

  public generateOrderNumber(prefix = 'WCW'): string {
    const year = new Date().getFullYear();
    const count = this.orders.size + 1;
    const padded = String(count).padStart(4, '0');
    return `${prefix}-${year}-${padded}`;
  }

  public findById(id: string): CustomWebsiteOrder | undefined {
    return this.orders.get(id);
  }

  public findByOrderNumber(orderNumber: string): CustomWebsiteOrder | undefined {
    return Array.from(this.orders.values()).find(o => o.orderNumber === orderNumber);
  }

  public createCustomWebsiteOrder(data: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    businessInfo: NonNullable<CustomWebsiteOrder['businessInfo']>;
    requirements: NonNullable<CustomWebsiteOrder['requirements']>;
    designPreferences: NonNullable<CustomWebsiteOrder['designPreferences']>;
    packageId: string;
  }): CustomWebsiteOrder {
    // Try new service-packages first, then fall back to old packages.json for legacy
    let selectedPkg = servicePackageDb.getById(data.packageId);
    let isLegacyPackage = false;
    let legacyPkg: OrderPackageOption | undefined;

    if (!selectedPkg) {
      // Attempt legacy fallback
      const legacyPackages = this.getPackages();
      legacyPkg = legacyPackages.find(p => p.id === data.packageId);
      if (legacyPkg) {
        isLegacyPackage = true;
      } else {
        throw new Error(`Invalid package selected: '${data.packageId}'. Please select an available package.`);
      }
    }

    // Active check for new packages
    if (selectedPkg && !selectedPkg.isActive) {
      throw new Error('The selected package is no longer available. Please choose an active package.');
    }

    // Validation
    if (!data.businessInfo.businessName || data.businessInfo.businessName.trim() === '') {
      throw new Error('Business name is required.');
    }
    if (!data.businessInfo.websitePurpose || data.businessInfo.websitePurpose.trim() === '') {
      throw new Error('Website purpose is required.');
    }
    if (!data.requirements.requiredPages || data.requirements.requiredPages.length === 0) {
      throw new Error('At least one required website page must be specified.');
    }

    // Page limit validation (only for new packages)
    if (selectedPkg && typeof selectedPkg.pageLimit === 'number') {
      const requestedPageCount = data.requirements.requiredPages.length;
      if (requestedPageCount > selectedPkg.pageLimit) {
        throw new Error(
          `Your selected package (${selectedPkg.name}) allows up to ${selectedPkg.pageLimit} pages. ` +
          `You have selected ${requestedPageCount} pages. Please upgrade your package or reduce the number of pages.`
        );
      }
    }

    const now = new Date().toISOString();
    const id = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const orderNumber = this.generateOrderNumber('WCW');

    const initialHistoryEntry: StatusHistoryEntry = {
      id: `hist_${Date.now()}_1`,
      fromStatus: 'NONE',
      toStatus: 'NEW',
      changedByUserId: data.customerId,
      changedByUserName: data.customerName,
      changedByUserRole: 'customer',
      notes: 'Custom website service order submitted and placed into queue.',
      timestamp: now
    };

    // Build package snapshot
    const packageSnapshot = isLegacyPackage && legacyPkg
      ? {
          packageId: legacyPkg.id,
          packageName: legacyPkg.name,
          price: legacyPkg.price,
          currency: 'USD'
        }
      : selectedPkg
        ? {
            packageId: selectedPkg.id,
            packageName: selectedPkg.name,
            price: selectedPkg.price,
            currency: selectedPkg.currency,
            pageLimit: selectedPkg.pageLimit,
            revisionLimit: selectedPkg.revisionLimit,
            deliveryDays: selectedPkg.deliveryDays,
            supportLevel: selectedPkg.supportLevel,
            features: selectedPkg.features
          }
        : { packageId: data.packageId, packageName: 'Unknown', price: 0, currency: 'USD' };

    const packagePrice = isLegacyPackage && legacyPkg ? legacyPkg.price : (selectedPkg?.price ?? 0);
    const packageName = isLegacyPackage && legacyPkg ? legacyPkg.name : (selectedPkg?.name ?? 'Unknown');

    const newOrder: CustomWebsiteOrder = {
      id,
      orderNumber,
      type: 'custom_website',
      customerId: data.customerId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      businessInfo: {
        ...data.businessInfo,
        businessName: data.businessInfo.businessName.trim(),
        businessType: data.businessInfo.businessType || 'General Business',
        businessDescription: data.businessInfo.businessDescription || '',
        industryCategory: data.businessInfo.industryCategory || 'Other',
        websitePurpose: data.businessInfo.websitePurpose.trim(),
        location: data.businessInfo.location || '',
        businessHours: data.businessInfo.businessHours || '',
        contactEmail: data.businessInfo.contactEmail || data.customerEmail,
        contactPhone: data.businessInfo.contactPhone || '',
        whatsappNumber: data.businessInfo.whatsappNumber || '',
        socialLinks: data.businessInfo.socialLinks || []
      },
      requirements: {
        ...data.requirements,
        requiredPages: data.requirements.requiredPages,
        requiredSections: data.requirements.requiredSections || [],
        servicesOffered: data.requirements.servicesOffered || [],
        productsOffered: data.requirements.productsOffered || [],
        featuresNeeded: data.requirements.featuresNeeded || [],
        targetAudience: data.requirements.targetAudience || 'General public & customers',
        additionalNotes: data.requirements.additionalNotes || ''
      },
      designPreferences: {
        preferredColors: data.designPreferences.preferredColors || ['#4F46E5', '#06B6D4'],
        preferredStyle: data.designPreferences.preferredStyle || 'Modern Minimalist',
        preferredTypography: data.designPreferences.preferredTypography || 'Inter Sans',
        websiteMood: data.designPreferences.websiteMood || 'Clean, Trustworthy & High Converting',
        referenceWebsiteUrl: data.designPreferences.referenceWebsiteUrl || '',
        logoUrl: data.designPreferences.logoUrl || '',
        assetUrls: data.designPreferences.assetUrls || [],
        additionalDesignNotes: data.designPreferences.additionalDesignNotes || ''
      },
      package: packageSnapshot,
      status: 'NEW',
      statusHistory: [initialHistoryEntry],
      paymentStatus: 'UNPAID',
      amount: packagePrice,
      createdAt: now,
      updatedAt: now
    };

    this.orders.set(newOrder.id, newOrder);
    this.save();

    // Publish canonical CUSTOM_WEBSITE_ORDER_CREATED event (handles notifications, email, and audit log)
    eventBus.publishEvent({
      eventType: 'CUSTOM_WEBSITE_ORDER_CREATED',
      actorUserId: data.customerId,
      referenceType: 'ORDER',
      referenceId: newOrder.id,
      payload: {
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        customWebsiteOrderId: newOrder.id,
        customerId: data.customerId,
        businessName: newOrder.businessInfo?.businessName || 'Custom Website',
        packageId: data.packageId || 'custom-pkg',
        packageName: packageName,
        amount: packagePrice,
        currency: 'USD',
        createdAt: newOrder.createdAt
      }
    }).catch(err => console.error('[Orders] Failed to publish CUSTOM_WEBSITE_ORDER_CREATED event:', err));

    return newOrder;
  }

  // Phase 6: Real Template Marketplace Order Flow
  public createTemplateOrder(data: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    templateId: string;
  }): CustomWebsiteOrder {
    const template = templateDb.findById(data.templateId);
    if (!template) {
      throw new Error('Template not found.');
    }

    if (template.status !== 'PUBLISHED') {
      throw new Error('Template is not available for purchase or use.');
    }

    const vendor = userDb.findById(template.vendorId);
    if (!vendor) {
      throw new Error('The vendor associated with this template could not be verified.');
    }

    const now = new Date().toISOString();
    const id = `ord_tpl_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const orderNumber = this.generateOrderNumber('TPL');

    const initialHistoryEntry: StatusHistoryEntry = {
      id: `hist_${Date.now()}_1`,
      fromStatus: 'NONE',
      toStatus: 'CONFIRMED',
      changedByUserId: data.customerId,
      changedByUserName: data.customerName,
      changedByUserRole: 'customer',
      notes: `Template marketplace order initiated for ${template.name}.`,
      timestamp: now
    };

    const newOrder: CustomWebsiteOrder = {
      id,
      orderNumber,
      type: 'template',
      customerId: data.customerId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      vendorId: template.vendorId,
      templateDetails: {
        templateId: template.id,
        templateName: template.name,
        templateCategory: template.category,
        templateThumbnail: template.thumbnail,
        vendorId: template.vendorId,
        vendorName: template.vendorName,
        technology: template.technology,
        version: template.version
      },
      status: 'CONFIRMED',
      statusHistory: [initialHistoryEntry],
      paymentStatus: 'UNPAID', // NEVER mark PAID without payment provider
      amount: template.price,
      previewUrl: template.previewUrl || template.demoUrl || '',
      createdAt: now,
      updatedAt: now
    };

    // Increment downloads/uses count on template
    template.downloadsCount = (template.downloadsCount || 0) + 1;
    templateDb.update(template.id, { tags: template.tags });

    this.orders.set(newOrder.id, newOrder);
    this.save();

    // Publish canonical TEMPLATE_PURCHASED event (dispatches in-app notifications, emails, and audit log)
    eventBus.publishEvent({
      eventType: 'TEMPLATE_PURCHASED',
      actorUserId: data.customerId,
      referenceType: 'ORDER',
      referenceId: newOrder.id,
      payload: {
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        templateId: template.id,
        templateName: template.name,
        customerId: data.customerId,
        vendorId: template.vendorId,
        amount: newOrder.amount,
        currency: 'USD',
        createdAt: newOrder.createdAt
      }
    }).catch(err => console.error('[Orders] Failed to publish TEMPLATE_PURCHASED event:', err));

    return newOrder;
  }

  public updateStatus(params: {
    orderId: string;
    newStatus: CustomWebsiteOrderStatus;
    notes?: string;
    previewUrl?: string;
    deliveredUrl?: string;
    paymentStatus?: 'UNPAID' | 'PENDING' | 'PAID';
    changedByUser: { id: string; name: string; role: string };
  }): CustomWebsiteOrder {
    const order = this.orders.get(params.orderId);
    if (!order) {
      throw new Error('Order not found.');
    }

    const validStatuses: CustomWebsiteOrderStatus[] = [
      'NEW',
      'REQUIREMENTS_REVIEW',
      'CONFIRMED',
      'ASSIGNED',
      'IN_PROGRESS',
      'PREVIEW_READY',
      'REVISION_REQUESTED',
      'REVISED',
      'CUSTOMER_APPROVED',
      'COMPLETED',
      'DELIVERED',
      'CANCELLED'
    ];

    if (!validStatuses.includes(params.newStatus)) {
      throw new Error(`Invalid status '${params.newStatus}'.`);
    }

    const previousStatus = order.status;
    const now = new Date().toISOString();

    const historyEntry: StatusHistoryEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fromStatus: previousStatus,
      toStatus: params.newStatus,
      changedByUserId: params.changedByUser.id,
      changedByUserName: params.changedByUser.name,
      changedByUserRole: params.changedByUser.role,
      notes: params.notes || `Status changed from ${previousStatus} to ${params.newStatus}`,
      timestamp: now
    };

    order.status = params.newStatus;
    order.statusHistory.push(historyEntry);
    order.updatedAt = now;

    if (params.previewUrl) order.previewUrl = params.previewUrl;
    if (params.deliveredUrl) order.deliveredUrl = params.deliveredUrl;
    if (params.paymentStatus) order.paymentStatus = params.paymentStatus;

    this.orders.set(order.id, order);
    this.save();

    // Notify customer of status change
    notificationDb.createNotification({
      userId: order.customerId,
      type: 'ORDER_STATUS_UPDATED',
      title: `Order Update: ${order.orderNumber}`,
      message: `Your website order status has changed to: ${params.newStatus.replace(/_/g, ' ')}.`,
      link: `/dashboard/orders/${order.id}`,
      orderId: order.id,
      orderNumber: order.orderNumber
    });

    // Event 8: Real Customer Approval via canonical eventBus
    if (params.newStatus === 'CUSTOMER_APPROVED') {
      eventBus.publishEvent({
        eventType: 'CUSTOMER_APPROVED',
        actorUserId: params.changedByUser?.id || order.customerId,
        referenceType: 'ORDER',
        referenceId: order.id,
        payload: {
          projectId: order.id,
          projectNumber: order.orderNumber,
          customerId: order.customerId,
          approvedBy: params.changedByUser?.name || order.customerName,
          approvedAt: now
        }
      }).catch(err => console.error('[Orders] Failed to publish CUSTOMER_APPROVED event:', err));
    }

    // Event 9: Real Final Delivery via canonical eventBus
    if (params.newStatus === 'DELIVERED' || params.newStatus === 'COMPLETED') {
      eventBus.publishEvent({
        eventType: 'PROJECT_DELIVERED',
        actorUserId: params.changedByUser?.id || 'STAFF',
        referenceType: 'ORDER',
        referenceId: order.id,
        payload: {
          projectId: order.id,
          projectNumber: order.orderNumber,
          customerId: order.customerId,
          deliveredBy: params.changedByUser?.name || 'Staff Lead',
          deliveredAt: now
        }
      }).catch(err => console.error('[Orders] Failed to publish PROJECT_DELIVERED event:', err));
    }

    return order;
  }

  public assignOrder(params: {
    orderId: string;
    staffId: string;
    assignedByUser: { id: string; name: string; role: string };
  }): CustomWebsiteOrder {
    const order = this.orders.get(params.orderId);
    if (!order) throw new Error('Order not found.');

    const staffUser = userDb.findById(params.staffId);
    if (!staffUser || (staffUser.role !== 'admin' && staffUser.role !== 'manager')) {
      throw new Error('Assigned staff member must be an active Admin or Manager.');
    }

    order.assignedStaffId = staffUser.id;
    order.assignedStaffName = staffUser.name;
    order.assignedStaffRole = staffUser.role as 'admin' | 'manager';

    const now = new Date().toISOString();
    const prevStatus = order.status;
    const newStatus: CustomWebsiteOrderStatus = order.status === 'NEW' || order.status === 'REQUIREMENTS_REVIEW' ? 'ASSIGNED' : order.status;
    order.status = newStatus;

    order.statusHistory.push({
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fromStatus: prevStatus,
      toStatus: newStatus,
      changedByUserId: params.assignedByUser.id,
      changedByUserName: params.assignedByUser.name,
      changedByUserRole: params.assignedByUser.role,
      notes: `Order assigned to ${staffUser.name} (${staffUser.role}).`,
      timestamp: now
    });

    order.updatedAt = now;
    this.orders.set(order.id, order);
    this.save();

    // Notify assigned staff
    notificationDb.createNotification({
      userId: staffUser.id,
      type: 'ORDER_ASSIGNED',
      title: `Assigned Order: ${order.orderNumber}`,
      message: `You have been assigned to fulfill website order ${order.orderNumber}.`,
      link: `/dashboard/orders/${order.id}`,
      orderId: order.id,
      orderNumber: order.orderNumber
    });

    return order;
  }

  // Phase 11: Real Product Order Creation with trusted price
  public createProductOrder(data: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    productId: string;
    quantity?: number;
  }): CustomWebsiteOrder {
    const product = productDb.findById(data.productId);
    if (!product) {
      throw new Error('Product not found.');
    }

    if (product.status !== 'published') {
      throw new Error('Product is not published or available for purchase.');
    }

    const qty = Math.max(1, data.quantity || 1);
    const totalPrice = Math.round((product.price * qty) * 100) / 100;
    const now = new Date().toISOString();
    const id = `ord_prd_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const orderNumber = this.generateOrderNumber('PRD');

    const initialHistoryEntry: StatusHistoryEntry = {
      id: `hist_${Date.now()}_1`,
      fromStatus: 'NONE',
      toStatus: 'CONFIRMED',
      changedByUserId: data.customerId,
      changedByUserName: data.customerName,
      changedByUserRole: 'customer',
      notes: `Product order initiated for ${product.name} (Qty: ${qty}).`,
      timestamp: now
    };

    const newOrder: CustomWebsiteOrder = {
      id,
      orderNumber,
      type: 'product',
      customerId: data.customerId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      vendorId: product.vendorId,
      productDetails: {
        productId: product.id,
        productName: product.name,
        productCategory: product.category,
        productImage: product.image,
        vendorId: product.vendorId,
        vendorName: product.vendorName,
        quantity: qty,
        unitPrice: product.price
      },
      status: 'CONFIRMED',
      statusHistory: [initialHistoryEntry],
      paymentStatus: 'UNPAID',
      amount: totalPrice,
      createdAt: now,
      updatedAt: now
    };

    this.orders.set(newOrder.id, newOrder);
    this.save();

    // Publish canonical ORDER_CREATED event (dispatches in-app notifications, emails, and audit log)
    eventBus.publishEvent({
      eventType: 'ORDER_CREATED',
      actorUserId: data.customerId,
      referenceType: 'ORDER',
      referenceId: newOrder.id,
      payload: {
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        customerId: data.customerId,
        orderType: 'PRODUCT',
        amount: totalPrice,
        currency: 'USD',
        createdAt: newOrder.createdAt
      }
    }).catch(err => console.error('[Orders] Failed to publish ORDER_CREATED event:', err));

    return newOrder;
  }

  // Phase 11: Real Verified Payment Confirmation
  public markOrderPaid(params: {
    orderId: string;
    paymentId: string;
    provider: string;
    providerPaymentId?: string;
  }): CustomWebsiteOrder {
    const order = this.orders.get(params.orderId);
    if (!order) {
      throw new Error(`Order ${params.orderId} not found.`);
    }

    if (order.paymentStatus === 'PAID') {
      return order; // Idempotent
    }

    const now = new Date().toISOString();
    order.paymentStatus = 'PAID';
    order.paymentProvider = params.provider;
    order.paymentReference = params.providerPaymentId || params.paymentId;
    order.updatedAt = now;

    order.statusHistory.push({
      id: `hist_${Date.now()}_pay`,
      fromStatus: order.status,
      toStatus: order.status,
      changedByUserId: 'system_payment_gateway',
      changedByUserName: `Payment Gateway (${params.provider})`,
      changedByUserRole: 'system',
      notes: `Verified payment confirmed via ${params.provider} (Ref: ${order.paymentReference}). Amount: $${order.amount}.`,
      timestamp: now
    });

    this.orders.set(order.id, order);
    this.save();

    // Notify customer of successful payment
    notificationDb.createNotification({
      userId: order.customerId,
      type: 'PAYMENT_SUCCESSFUL' as any,
      title: `Payment Received: ${order.orderNumber}`,
      message: `Your payment of $${order.amount} USD for order ${order.orderNumber} has been verified and processed successfully.`,
      link: `/dashboard/orders/${order.id}`,
      orderId: order.id,
      orderNumber: order.orderNumber
    });

    // Notify vendor if template or product order
    if (order.vendorId) {
      notificationDb.createNotification({
        userId: order.vendorId,
        type: 'PAYMENT_SUCCESSFUL' as any,
        title: `Payment Received for Order ${order.orderNumber}`,
        message: `Customer ${order.customerName} completed payment ($${order.amount}) for your item.`,
        link: `/dashboard/orders/${order.id}`,
        orderId: order.id,
        orderNumber: order.orderNumber
      });
    }

    // Notify Admins
    const allUsers = userDb.getAll();
    const admins = allUsers.filter(u => u.role === 'admin');
    admins.forEach(admin => {
      notificationDb.createNotification({
        userId: admin.id,
        type: 'PAYMENT_SUCCESSFUL' as any,
        title: `Verified Payment: ${order.orderNumber}`,
        message: `Payment of $${order.amount} received for order ${order.orderNumber} via ${params.provider}.`,
        link: `/dashboard/orders/${order.id}`,
        orderId: order.id,
        orderNumber: order.orderNumber
      });
    });

    // Event 3: Real Template Purchase transactional emails to Customer + Vendor
    if (order.type === 'template') {
      emailService.sendTemplatePurchaseEmails({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: order.amount,
        templateId: order.templateDetails?.templateId || '',
        templateName: order.templateDetails?.templateName || 'Marketplace Template',
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        vendorId: order.vendorId
      }).catch(err => console.error('[Orders] Failed to dispatch template purchase emails:', err));
    }

    return order;
  }

  public getVendorTemplateSales(vendorId: string) {
    const vendorOrders = Array.from(this.orders.values()).filter(
      o => o.type === 'template' && o.vendorId === vendorId
    );

    const totalOrders = vendorOrders.length;
    const totalRevenue = vendorOrders.reduce((sum, o) => sum + o.amount, 0);

    return {
      totalOrders,
      totalRevenue,
      orders: vendorOrders
    };
  }

  public getCustomerPurchasedTemplates(customerId: string) {
    const customerOrders = Array.from(this.orders.values()).filter(
      o => o.type === 'template' && o.customerId === customerId
    );
    return customerOrders;
  }

  public queryOrders(params: {
    customerId?: string;
    vendorId?: string;
    assignedStaffId?: string;
    type?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    let list = Array.from(this.orders.values());

    // Customer scoping
    if (params.customerId) {
      list = list.filter(o => o.customerId === params.customerId);
    }

    // Vendor scoping
    if (params.vendorId) {
      list = list.filter(o => o.vendorId === params.vendorId);
    }

    // Manager scoping
    if (params.assignedStaffId) {
      list = list.filter(o => o.assignedStaffId === params.assignedStaffId);
    }

    // Type filter (custom_website, template, product)
    if (params.type && params.type !== 'All' && params.type !== 'all') {
      list = list.filter(o => o.type === params.type);
    }

    // Status filter
    if (params.status && params.status !== 'All' && params.status !== 'all') {
      const s = params.status.toUpperCase();
      list = list.filter(o => o.status === s);
    }

    // Search query
    if (params.search && params.search.trim() !== '') {
      const q = params.search.trim().toLowerCase();
      list = list.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        (o.businessInfo?.businessName || '').toLowerCase().includes(q) ||
        (o.templateDetails?.templateName || '').toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q)
      );
    }

    // Sorting
    const sortAsc = params.sortOrder === 'asc';
    if (params.sortBy === 'orderNumber') {
      list.sort((a, b) => (sortAsc ? 1 : -1) * a.orderNumber.localeCompare(b.orderNumber));
    } else if (params.sortBy === 'amount') {
      list.sort((a, b) => (sortAsc ? 1 : -1) * (a.amount - b.amount));
    } else {
      list.sort((a, b) => (sortAsc ? 1 : -1) * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * -1);
    }

    const total = list.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 10);
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      orders: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  public getAnalyticsReport() {
    const allOrders = Array.from(this.orders.values());
    
    // Only count PAID orders towards real revenue; non-paid or cancelled are not counted as successful revenue
    const paidOrders = allOrders.filter(o => o.paymentStatus === 'PAID');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const paidCount = paidOrders.length;
    const totalOrdersCount = allOrders.length;
    const averageOrderValue = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;

    // Monthly breakdown of paid revenue
    const monthlyMap = new Map<string, { revenue: number; orders: number; customWebsites: number; templates: number }>();
    allOrders.forEach(o => {
      const month = o.createdAt.slice(0, 7); // YYYY-MM
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { revenue: 0, orders: 0, customWebsites: 0, templates: 0 });
      }
      const m = monthlyMap.get(month)!;
      m.orders++;
      if (o.paymentStatus === 'PAID') {
        m.revenue += o.amount || 0;
      }
      if (o.type === 'custom_website') {
        m.customWebsites++;
      } else if (o.type === 'template') {
        m.templates++;
      }
    });

    const monthlyBreakdown = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        orders: data.orders,
        customWebsites: data.customWebsites,
        templates: data.templates
      }));

    return {
      totalRevenue,
      paidOrdersCount: paidCount,
      totalOrdersCount,
      averageOrderValue,
      unpaidOrdersCount: allOrders.filter(o => o.paymentStatus !== 'PAID').length,
      monthlyBreakdown
    };
  }

  public getAll(): CustomWebsiteOrder[] {
    this.load();
    return Array.from(this.orders.values());
  }
}

export const orderDb = new OrderDatabase();