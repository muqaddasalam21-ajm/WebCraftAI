/**
 * Phase 15 — Real Business Reporting & Advanced Analytics Service
 *
 * Single source of truth: real database stores (orders, payments, projects, deployments, users, templates).
 * Strictly enforced RBAC & data ownership:
 * - Admin: Platform-wide authorized metrics
 * - Customer: Only own orders, spent, projects, deployments
 * - Vendor: Only own templates, sales, attributable revenue
 * - Manager: Only assigned projects and authorized orders
 *
 * Revenue rules:
 * - Gross Revenue = Sum of verified payments with status === 'PAID'
 * - Net Revenue = Gross Revenue - Refunded payments
 * - Excludes PENDING, FAILED, CANCELLED
 */

import { orderDb } from '../data/orderStore';
import { paymentDb } from '../data/paymentStore';
import { projectDb } from '../data/projectStore';
import { deploymentDb } from '../data/deploymentStore';
import { userDb } from '../data/userStore';
import { templateDb } from '../data/templateStore';
import { SafeUser } from '../models/user';
import { CustomWebsiteOrder } from '../models/customWebsiteOrder';
import { WebsiteProject } from '../models/project';
import { Deployment } from '../models/deployment';
import { Payment } from '../models/payment';

export type DateRangePreset =
  | 'today'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'custom';

export interface DateRangeFilter {
  preset: DateRangePreset;
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
}

export function parseDateRange(
  preset?: string,
  customStart?: string,
  customEnd?: string
): DateRangeFilter {
  const now = new Date();
  let start: Date;
  let end: Date = new Date(now.getTime());

  switch (preset) {
    case 'today': {
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
      return { preset: 'today', startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case 'last7days': {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { preset: 'last7days', startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case 'last30days': {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { preset: 'last30days', startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case 'thisMonth': {
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      return { preset: 'thisMonth', startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case 'lastMonth': {
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));
      return { preset: 'lastMonth', startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case 'thisYear': {
      start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
      return { preset: 'thisYear', startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case 'custom': {
      if (!customStart) throw new Error('startDate is required for custom date range.');
      const parsedStart = new Date(customStart);
      if (isNaN(parsedStart.getTime())) throw new Error('Invalid startDate provided.');
      const parsedEnd = customEnd ? new Date(customEnd) : now;
      if (isNaN(parsedEnd.getTime())) throw new Error('Invalid endDate provided.');
      if (parsedStart > parsedEnd) throw new Error('startDate must be on or before endDate.');
      return { preset: 'custom', startDate: parsedStart.toISOString(), endDate: parsedEnd.toISOString() };
    }
    default: {
      // Default to last 30 days
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { preset: 'last30days', startDate: start.toISOString(), endDate: end.toISOString() };
    }
  }
}

function isWithinRange(dateStr: string, range: DateRangeFilter): boolean {
  if (!dateStr) return false;
  const t = new Date(dateStr).getTime();
  return t >= new Date(range.startDate).getTime() && t <= new Date(range.endDate).getTime();
}

// ---------------------------------------------------------------------------
// 1. OVERVIEW REPORT
// ---------------------------------------------------------------------------
export function getOverviewReport(user: SafeUser, range: DateRangeFilter) {
  const allOrders = orderDb.getAll();
  const allPayments = paymentDb.getAll();
  const allProjects = projectDb.getProjects();
  const allDeployments = deploymentDb.getAll();
  const allUsers = userDb.getAll();
  const allTemplates = templateDb.getAll();

  // Role Scoping
  let scopedOrders: CustomWebsiteOrder[] = [];
  let scopedPayments: Payment[] = [];
  let scopedProjects: WebsiteProject[] = [];
  let scopedDeployments: Deployment[] = [];

  if (user.role === 'admin') {
    scopedOrders = allOrders;
    scopedPayments = allPayments;
    scopedProjects = allProjects;
    scopedDeployments = allDeployments;
  } else if (user.role === 'user') {
    // Customer
    scopedOrders = allOrders.filter(o => o.customerId === user.id);
    scopedPayments = allPayments.filter(p => p.customerId === user.id);
    scopedProjects = allProjects.filter(p => p.customerId === user.id);
    scopedDeployments = allDeployments.filter(d => d.customerId === user.id);
  } else if (user.role === 'vendor') {
    // Vendor
    scopedOrders = allOrders.filter(o => o.vendorId === user.id);
    const orderIds = new Set(scopedOrders.map(o => o.id));
    scopedPayments = allPayments.filter(p => orderIds.has(p.orderId));
    scopedProjects = []; // Vendors do not manage website implementation projects
    scopedDeployments = [];
  } else if (user.role === 'manager') {
    // Manager
    scopedProjects = allProjects.filter(p => p.assignedTo === user.id);
    const projectOrderIds = new Set(scopedProjects.map(p => p.customWebsiteOrderId).filter(Boolean));
    scopedOrders = allOrders.filter(o => o.assignedStaffId === user.id || projectOrderIds.has(o.id));
    const orderIds = new Set(scopedOrders.map(o => o.id));
    scopedPayments = allPayments.filter(p => orderIds.has(p.orderId));
    const projectIds = new Set(scopedProjects.map(p => p.id));
    scopedDeployments = allDeployments.filter(d => projectIds.has(d.projectId));
  }

  // Filter scoped data by Date Range
  const ordersInRange = scopedOrders.filter(o => isWithinRange(o.createdAt, range));
  const paymentsInRange = scopedPayments.filter(p => isWithinRange(p.createdAt, range));
  const projectsInRange = scopedProjects.filter(p => isWithinRange(p.createdAt, range));
  const deploymentsInRange = scopedDeployments.filter(d => isWithinRange(d.createdAt, range));

  // Revenue Math: ONLY PAID payments, deducting REFUNDED
  const paidPayments = paymentsInRange.filter(p => p.status === 'PAID');
  const refundedPayments = paymentsInRange.filter(p => p.status === 'REFUNDED');
  const grossRevenue = paidPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const refundedRevenue = refundedPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const netRevenue = Math.max(0, grossRevenue - refundedRevenue);

  // Orders Breakdown
  const totalOrders = ordersInRange.length;
  const paidOrders = ordersInRange.filter(o => o.paymentStatus === 'PAID').length;
  const pendingOrders = ordersInRange.filter(o => o.paymentStatus === 'UNPAID' || o.paymentStatus === 'PENDING').length;
  const failedOrders = ordersInRange.filter(o => o.paymentStatus === 'FAILED').length;
  const refundedOrders = ordersInRange.filter(o => o.paymentStatus === 'REFUNDED').length;

  // Sales by Category
  const templateOrders = ordersInRange.filter(o => o.type === 'template' && o.paymentStatus === 'PAID');
  const customOrders = ordersInRange.filter(o => o.type === 'custom_website' && o.paymentStatus === 'PAID');
  const productOrders = ordersInRange.filter(o => o.type === 'product' && o.paymentStatus === 'PAID');

  const templateRevenue = templateOrders.reduce((acc, o) => acc + (o.amount || 0), 0);
  const customWebsiteRevenue = customOrders.reduce((acc, o) => acc + (o.amount || 0), 0);
  const productRevenue = productOrders.reduce((acc, o) => acc + (o.amount || 0), 0);

  // Projects Breakdown
  const activeProjects = projectsInRange.filter(p =>
    p.status !== 'COMPLETED' && p.status !== 'DELIVERED' && p.status !== 'CANCELLED'
  ).length;
  const completedProjects = projectsInRange.filter(p => p.status === 'COMPLETED').length;
  const deliveredProjects = projectsInRange.filter(p => p.status === 'DELIVERED').length;

  // Deployments Breakdown
  const publishedWebsites = deploymentsInRange.filter(d => d.status === 'PUBLISHED').length;
  const failedDeployments = deploymentsInRange.filter(d => d.status === 'FAILED').length;
  const deployingCount = deploymentsInRange.filter(d => d.status === 'DEPLOYING').length;

  // User Stats (Admin only)
  let totalUsers = 0;
  let newUsersInRange = 0;
  if (user.role === 'admin') {
    totalUsers = allUsers.length;
    newUsersInRange = allUsers.filter(u => isWithinRange(u.createdAt, range)).length;
  }

  // Vendor Stats (Vendor only)
  let vendorTemplatesCount = 0;
  let vendorActiveListings = 0;
  if (user.role === 'vendor') {
    const myTemplates = allTemplates.filter(t => t.vendorId === user.id);
    vendorTemplatesCount = myTemplates.length;
    vendorActiveListings = myTemplates.filter(t => t.status === 'PUBLISHED').length;
  }

  return {
    role: user.role,
    dateRange: range,
    financials: {
      grossRevenue,
      refundedRevenue,
      netRevenue,
      averageOrderValue: paidOrders > 0 ? Math.round(grossRevenue / paidOrders) : 0,
      salesByType: {
        templates: { count: templateOrders.length, revenue: templateRevenue },
        customWebsites: { count: customOrders.length, revenue: customWebsiteRevenue },
        products: { count: productOrders.length, revenue: productRevenue }
      }
    },
    orders: {
      total: totalOrders,
      paid: paidOrders,
      pending: pendingOrders,
      failed: failedOrders,
      refunded: refundedOrders
    },
    projects: {
      total: projectsInRange.length,
      active: activeProjects,
      completed: completedProjects,
      delivered: deliveredProjects
    },
    deployments: {
      total: deploymentsInRange.length,
      published: publishedWebsites,
      failed: failedDeployments,
      deploying: deployingCount
    },
    ...(user.role === 'admin' ? { users: { total: totalUsers, newUsers: newUsersInRange } } : {}),
    ...(user.role === 'vendor' ? { vendor: { templatesCount: vendorTemplatesCount, activeListings: vendorActiveListings } } : {})
  };
}

// ---------------------------------------------------------------------------
// 2. SALES REPORT
// ---------------------------------------------------------------------------
export function getSalesReport(
  user: SafeUser,
  range: DateRangeFilter,
  filter?: { orderType?: string; status?: string; packageId?: string; templateId?: string }
) {
  const allOrders = orderDb.getAll();

  // Role Scoping
  let scoped = allOrders;
  if (user.role === 'user') {
    scoped = scoped.filter(o => o.customerId === user.id);
  } else if (user.role === 'vendor') {
    scoped = scoped.filter(o => o.vendorId === user.id);
  } else if (user.role === 'manager') {
    scoped = scoped.filter(o => o.assignedStaffId === user.id);
  }

  // Date Range Filter
  scoped = scoped.filter(o => isWithinRange(o.createdAt, range));

  // Optional Query Filters
  if (filter?.orderType) {
    scoped = scoped.filter(o => o.type === filter.orderType);
  }
  if (filter?.status) {
    scoped = scoped.filter(o => o.paymentStatus === filter.status || o.status === filter.status);
  }
  if (filter?.packageId) {
    scoped = scoped.filter(o => o.package?.packageId === filter.packageId);
  }
  if (filter?.templateId) {
    scoped = scoped.filter(o => o.templateDetails?.templateId === filter.templateId);
  }

  // Time Bucket Grouping (Daily if <= 31 days, Monthly if > 31 days)
  const isDaily = new Date(range.endDate).getTime() - new Date(range.startDate).getTime() <= 32 * 24 * 60 * 60 * 1000;
  const timelineMap = new Map<string, { date: string; grossRevenue: number; paidCount: number; failedCount: number; refundedCount: number; totalOrders: number }>();

  scoped.forEach(o => {
    const key = isDaily ? o.createdAt.slice(0, 10) : o.createdAt.slice(0, 7);
    if (!timelineMap.has(key)) {
      timelineMap.set(key, { date: key, grossRevenue: 0, paidCount: 0, failedCount: 0, refundedCount: 0, totalOrders: 0 });
    }
    const entry = timelineMap.get(key)!;
    entry.totalOrders++;
    if (o.paymentStatus === 'PAID') {
      entry.paidCount++;
      entry.grossRevenue += o.amount || 0;
    } else if (o.paymentStatus === 'FAILED') {
      entry.failedCount++;
    } else if (o.paymentStatus === 'REFUNDED') {
      entry.refundedCount++;
    }
  });

  const timeline = Array.from(timelineMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([_, data]) => data);

  // Sales by Template
  const templateMap = new Map<string, { id: string; name: string; category: string; unitsSold: number; totalRevenue: number }>();
  scoped.filter(o => o.type === 'template' && o.paymentStatus === 'PAID').forEach(o => {
    const tid = o.templateDetails?.templateId || 'unknown';
    const name = o.templateDetails?.templateName || 'Template';
    const cat = o.templateDetails?.templateCategory || 'General';
    if (!templateMap.has(tid)) {
      templateMap.set(tid, { id: tid, name, category: cat, unitsSold: 0, totalRevenue: 0 });
    }
    const t = templateMap.get(tid)!;
    t.unitsSold++;
    t.totalRevenue += o.amount || 0;
  });

  // Sales by Package
  const packageMap = new Map<string, { id: string; name: string; ordersCount: number; totalRevenue: number }>();
  scoped.filter(o => o.type === 'custom_website' && o.paymentStatus === 'PAID').forEach(o => {
    const pid = o.package?.packageId || 'custom';
    const name = o.package?.packageName || 'Custom Package';
    if (!packageMap.has(pid)) {
      packageMap.set(pid, { id: pid, name, ordersCount: 0, totalRevenue: 0 });
    }
    const p = packageMap.get(pid)!;
    p.ordersCount++;
    p.totalRevenue += o.amount || 0;
  });

  const totalPaidRevenue = scoped
    .filter(o => o.paymentStatus === 'PAID')
    .reduce((acc, o) => acc + (o.amount || 0), 0);
  const paidOrdersCount = scoped.filter(o => o.paymentStatus === 'PAID').length;

  return {
    dateRange: range,
    summary: {
      totalOrders: scoped.length,
      paidOrders: paidOrdersCount,
      failedOrders: scoped.filter(o => o.paymentStatus === 'FAILED').length,
      refundedOrders: scoped.filter(o => o.paymentStatus === 'REFUNDED').length,
      totalPaidRevenue,
      averageOrderValue: paidOrdersCount > 0 ? Math.round(totalPaidRevenue / paidOrdersCount) : 0
    },
    timeline,
    salesByTemplate: Array.from(templateMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue),
    salesByPackage: Array.from(packageMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue),
    recentOrders: scoped.slice(0, 20).map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      type: o.type,
      customerName: user.role === 'user' ? undefined : o.customerName,
      amount: o.amount,
      paymentStatus: o.paymentStatus,
      status: o.status,
      createdAt: o.createdAt
    }))
  };
}

// ---------------------------------------------------------------------------
// 3. REVENUE REPORT
// ---------------------------------------------------------------------------
export function getRevenueReport(user: SafeUser, range: DateRangeFilter) {
  const allPayments = paymentDb.getAll();
  const allOrders = orderDb.getAll();

  let scopedPayments = allPayments;
  if (user.role === 'user') {
    scopedPayments = scopedPayments.filter(p => p.customerId === user.id);
  } else if (user.role === 'vendor') {
    const vendorOrderIds = new Set(allOrders.filter(o => o.vendorId === user.id).map(o => o.id));
    scopedPayments = scopedPayments.filter(p => vendorOrderIds.has(p.orderId));
  } else if (user.role === 'manager') {
    const managedOrderIds = new Set(allOrders.filter(o => o.assignedStaffId === user.id).map(o => o.id));
    scopedPayments = scopedPayments.filter(p => managedOrderIds.has(p.orderId));
  }

  // Filter within date range
  scopedPayments = scopedPayments.filter(p => isWithinRange(p.createdAt, range));

  // Provider breakdown
  const providerMap = new Map<string, { provider: string; totalRevenue: number; paidCount: number; failedCount: number }>();
  scopedPayments.forEach(p => {
    const prov = p.provider || 'unknown';
    if (!providerMap.has(prov)) {
      providerMap.set(prov, { provider: prov, totalRevenue: 0, paidCount: 0, failedCount: 0 });
    }
    const entry = providerMap.get(prov)!;
    if (p.status === 'PAID') {
      entry.paidCount++;
      entry.totalRevenue += p.amount || 0;
    } else if (p.status === 'FAILED') {
      entry.failedCount++;
    }
  });

  const paidList = scopedPayments.filter(p => p.status === 'PAID');
  const refundedList = scopedPayments.filter(p => p.status === 'REFUNDED');
  const grossRevenue = paidList.reduce((acc, p) => acc + (p.amount || 0), 0);
  const refundedRevenue = refundedList.reduce((acc, p) => acc + (p.amount || 0), 0);
  const netRevenue = Math.max(0, grossRevenue - refundedRevenue);

  return {
    dateRange: range,
    financials: {
      grossRevenue,
      refundedRevenue,
      netRevenue,
      paidTransactionsCount: paidList.length,
      refundedTransactionsCount: refundedList.length,
      failedTransactionsCount: scopedPayments.filter(p => p.status === 'FAILED').length
    },
    byProvider: Array.from(providerMap.values()),
    transactions: scopedPayments.slice(0, 30).map(p => ({
      id: p.id,
      orderNumber: p.orderNumber,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      provider: p.provider,
      paymentMethod: p.paymentMethod,
      createdAt: p.createdAt
    }))
  };
}

// ---------------------------------------------------------------------------
// 4. PROJECT REPORT
// ---------------------------------------------------------------------------
export function getProjectsReport(
  user: SafeUser,
  range: DateRangeFilter,
  filter?: { status?: string; priority?: string; assignedTo?: string }
) {
  const allProjects = projectDb.getProjects();

  let scoped = allProjects;
  if (user.role === 'user') {
    scoped = scoped.filter(p => p.customerId === user.id);
  } else if (user.role === 'manager') {
    scoped = scoped.filter(p => p.assignedTo === user.id);
  } else if (user.role === 'vendor') {
    // Vendors do not manage projects
    return {
      dateRange: range,
      totalProjects: 0,
      statusBreakdown: {},
      priorityBreakdown: {},
      packageBreakdown: {},
      overdueProjects: 0,
      averageCompletionDays: 0,
      projects: []
    };
  }

  // Filter within date range
  scoped = scoped.filter(p => isWithinRange(p.createdAt, range));

  // Optional Query Filters
  if (filter?.status) {
    scoped = scoped.filter(p => p.status === filter.status);
  }
  if (filter?.priority) {
    scoped = scoped.filter(p => p.priority === filter.priority);
  }
  if (filter?.assignedTo) {
    scoped = scoped.filter(p => p.assignedTo === filter.assignedTo);
  }

  // Status breakdown
  const statusBreakdown: Record<string, number> = {};
  const priorityBreakdown: Record<string, number> = {};
  const packageBreakdown: Record<string, number> = {};
  const managerBreakdown: Record<string, number> = {};

  let overdueCount = 0;
  const now = new Date().toISOString().slice(0, 10);
  let totalCompletionDays = 0;
  let completedWithTimeCount = 0;

  scoped.forEach(p => {
    statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1;
    priorityBreakdown[p.priority] = (priorityBreakdown[p.priority] || 0) + 1;
    const pkg = p.packageName || 'Standard';
    packageBreakdown[pkg] = (packageBreakdown[pkg] || 0) + 1;

    if (p.assignedTo) {
      managerBreakdown[p.assignedTo] = (managerBreakdown[p.assignedTo] || 0) + 1;
    }

    // Overdue check
    if (
      p.estimatedDeliveryDate &&
      p.estimatedDeliveryDate < now &&
      p.status !== 'COMPLETED' &&
      p.status !== 'DELIVERED' &&
      p.status !== 'CANCELLED'
    ) {
      overdueCount++;
    }

    // Completion time check
    if (p.status === 'COMPLETED' || p.status === 'DELIVERED') {
      const start = new Date(p.createdAt).getTime();
      const end = new Date(p.updatedAt).getTime();
      const days = Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)));
      totalCompletionDays += days;
      completedWithTimeCount++;
    }
  });

  const averageCompletionDays = completedWithTimeCount > 0 ? Math.round(totalCompletionDays / completedWithTimeCount) : 0;

  return {
    dateRange: range,
    totalProjects: scoped.length,
    statusBreakdown,
    priorityBreakdown,
    packageBreakdown,
    managerBreakdown,
    overdueProjects: overdueCount,
    averageCompletionDays,
    projects: scoped.slice(0, 30).map(p => ({
      id: p.id,
      projectNumber: p.projectNumber,
      name: p.name,
      status: p.status,
      priority: p.priority,
      progress: p.progress,
      packageName: p.packageName,
      assignedTo: p.assignedTo,
      startDate: p.startDate,
      estimatedDeliveryDate: p.estimatedDeliveryDate,
      revisionCount: p.revisionCount,
      createdAt: p.createdAt
    }))
  };
}

// ---------------------------------------------------------------------------
// 5. DEPLOYMENT REPORT
// ---------------------------------------------------------------------------
export function getDeploymentsReport(user: SafeUser, range: DateRangeFilter) {
  const allDeployments = deploymentDb.getAll();

  let scoped = allDeployments;
  if (user.role === 'user') {
    scoped = scoped.filter(d => d.customerId === user.id);
  } else if (user.role === 'vendor') {
    return {
      dateRange: range,
      totalDeployments: 0,
      publishedCount: 0,
      failedCount: 0,
      deployingCount: 0,
      unpublishedCount: 0,
      byProvider: {},
      deployments: []
    };
  }

  // Filter within date range
  scoped = scoped.filter(d => isWithinRange(d.createdAt, range));

  const byProvider: Record<string, { total: number; published: number; failed: number }> = {};
  let publishedCount = 0;
  let failedCount = 0;
  let deployingCount = 0;
  let unpublishedCount = 0;

  scoped.forEach(d => {
    const prov = d.provider || 'none';
    if (!byProvider[prov]) {
      byProvider[prov] = { total: 0, published: 0, failed: 0 };
    }
    byProvider[prov].total++;

    if (d.status === 'PUBLISHED') {
      publishedCount++;
      byProvider[prov].published++;
    } else if (d.status === 'FAILED') {
      failedCount++;
      byProvider[prov].failed++;
    } else if (d.status === 'DEPLOYING') {
      deployingCount++;
    } else if (d.status === 'UNPUBLISHED') {
      unpublishedCount++;
    }
  });

  return {
    dateRange: range,
    totalDeployments: scoped.length,
    publishedCount,
    failedCount,
    deployingCount,
    unpublishedCount,
    successRate: scoped.length > 0 ? Math.round((publishedCount / scoped.length) * 100) : 0,
    byProvider,
    deployments: scoped.slice(0, 30).map(d => ({
      id: d.id,
      projectId: d.projectId,
      websiteId: d.websiteId,
      versionId: d.versionId,
      status: d.status,
      provider: d.provider,
      deploymentUrl: d.deploymentUrl,
      customDomain: d.customDomain,
      errorMessage: d.errorMessage,
      publishedAt: d.publishedAt,
      startedAt: d.startedAt,
      createdAt: d.createdAt
    }))
  };
}

// ---------------------------------------------------------------------------
// 6. CUSTOMER ANALYTICS (Admin aggregate, Customer self-view)
// ---------------------------------------------------------------------------
export function getCustomerAnalytics(user: SafeUser, range: DateRangeFilter) {
  const allUsers = userDb.getAll();
  const allOrders = orderDb.getAll();

  if (user.role === 'user') {
    // Self-view
    const ownOrders = allOrders.filter(o => o.customerId === user.id);
    const paidOrders = ownOrders.filter(o => o.paymentStatus === 'PAID');
    const totalSpent = paidOrders.reduce((acc, o) => acc + (o.amount || 0), 0);

    return {
      dateRange: range,
      isSelfView: true,
      metrics: {
        totalOrders: ownOrders.length,
        paidOrders: paidOrders.length,
        totalSpent,
        templateOrdersCount: ownOrders.filter(o => o.type === 'template').length,
        customWebsiteOrdersCount: ownOrders.filter(o => o.type === 'custom_website').length
      }
    };
  }

  // Admin & Manager view
  const customers = allUsers.filter(u => u.role === 'user');
  const newCustomers = customers.filter(u => isWithinRange(u.createdAt, range));

  // Build aggregate per customer
  const customerMap = customers.map(c => {
    const orders = allOrders.filter(o => o.customerId === c.id);
    const paid = orders.filter(o => o.paymentStatus === 'PAID');
    const totalSpent = paid.reduce((acc, o) => acc + (o.amount || 0), 0);
    const lastOrder = orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    return {
      id: c.id,
      name: c.name,
      email: c.email,
      status: c.status,
      totalOrders: orders.length,
      paidOrders: paid.length,
      totalSpent,
      lastOrderDate: lastOrder?.createdAt || null,
      createdAt: c.createdAt
    };
  });

  const activeCustomers = customerMap.filter(c => c.totalOrders > 0).length;
  const totalCustomerSpend = customerMap.reduce((acc, c) => acc + c.totalSpent, 0);

  return {
    dateRange: range,
    isSelfView: false,
    summary: {
      totalCustomers: customers.length,
      newCustomersInRange: newCustomers.length,
      activeCustomers,
      totalCustomerSpend,
      averageSpendPerCustomer: activeCustomers > 0 ? Math.round(totalCustomerSpend / activeCustomers) : 0
    },
    topCustomers: customerMap.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 20)
  };
}

// ---------------------------------------------------------------------------
// 7. VENDOR ANALYTICS (Admin or Vendor)
// ---------------------------------------------------------------------------
export function getVendorAnalytics(user: SafeUser, range: DateRangeFilter) {
  const allTemplates = templateDb.getAll();
  const allOrders = orderDb.getAll();
  const allUsers = userDb.getAll();

  let targetVendors = allUsers.filter(u => u.role === 'vendor');
  if (user.role === 'vendor') {
    targetVendors = targetVendors.filter(v => v.id === user.id);
  }

  const vendorStats = targetVendors.map(v => {
    const templates = allTemplates.filter(t => t.vendorId === v.id);
    const orders = allOrders.filter(o => o.vendorId === v.id);
    const paidOrders = orders.filter(o => o.paymentStatus === 'PAID');
    const totalRevenue = paidOrders.reduce((acc, o) => acc + (o.amount || 0), 0);

    return {
      vendorId: v.id,
      vendorName: v.name,
      vendorEmail: user.role === 'admin' ? v.email : undefined,
      totalTemplates: templates.length,
      activeListings: templates.filter(t => t.status === 'PUBLISHED').length,
      totalOrders: orders.length,
      paidOrdersCount: paidOrders.length,
      totalRevenue,
      topTemplates: templates.map(t => {
        const tOrders = paidOrders.filter(o => o.templateDetails?.templateId === t.id);
        return {
          id: t.id,
          name: t.name,
          category: t.category,
          price: t.price,
          salesCount: tOrders.length,
          revenue: tOrders.reduce((acc, o) => acc + (o.amount || 0), 0)
        };
      }).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
    };
  });

  return {
    dateRange: range,
    vendors: vendorStats
  };
}

// ---------------------------------------------------------------------------
// 8. CSV EXPORT GENERATOR
// ---------------------------------------------------------------------------
export function generateCsvExport(
  reportType: 'sales' | 'revenue' | 'projects' | 'deployments',
  user: SafeUser,
  range: DateRangeFilter
): { filename: string; content: string } {
  const timestamp = new Date().toISOString().slice(0, 10);

  if (reportType === 'sales') {
    const report = getSalesReport(user, range);
    const headers = ['Order Number', 'Order Type', 'Customer Name', 'Amount (USD)', 'Payment Status', 'Status', 'Date'];
    const rows = report.recentOrders.map(o => [
      o.orderNumber,
      o.type,
      o.customerName || 'N/A',
      `$${o.amount}`,
      o.paymentStatus,
      o.status,
      o.createdAt
    ]);
    const content = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    return { filename: `sales_report_${range.preset}_${timestamp}.csv`, content };
  }

  if (reportType === 'revenue') {
    const report = getRevenueReport(user, range);
    const headers = ['Transaction ID', 'Order Number', 'Amount', 'Currency', 'Status', 'Provider', 'Method', 'Date'];
    const rows = report.transactions.map(t => [
      t.id,
      t.orderNumber,
      `$${t.amount}`,
      t.currency,
      t.status,
      t.provider,
      t.paymentMethod || 'card',
      t.createdAt
    ]);
    const content = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    return { filename: `revenue_report_${range.preset}_${timestamp}.csv`, content };
  }

  if (reportType === 'projects') {
    const report = getProjectsReport(user, range);
    const headers = ['Project Number', 'Project Name', 'Status', 'Priority', 'Progress (%)', 'Package', 'Start Date', 'Delivery Date'];
    const rows = report.projects.map(p => [
      p.projectNumber,
      p.name,
      p.status,
      p.priority,
      `${p.progress}%`,
      p.packageName,
      p.startDate || 'N/A',
      p.estimatedDeliveryDate || 'N/A'
    ]);
    const content = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    return { filename: `projects_report_${range.preset}_${timestamp}.csv`, content };
  }

  if (reportType === 'deployments') {
    const report = getDeploymentsReport(user, range);
    const headers = ['Deployment ID', 'Project ID', 'Status', 'Provider', 'Live URL', 'Custom Domain', 'Started At', 'Published At'];
    const rows = report.deployments.map(d => [
      d.id,
      d.projectId,
      d.status,
      d.provider,
      d.deploymentUrl || 'N/A',
      d.customDomain || 'N/A',
      d.startedAt,
      d.publishedAt || 'N/A'
    ]);
    const content = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    return { filename: `deployments_report_${range.preset}_${timestamp}.csv`, content };
  }

  throw new Error(`Unsupported export report type: ${reportType}`);
}
