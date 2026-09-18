/**
 * Phase 15 — Real Business Reports API Routes
 * Secure endpoints for server-side business intelligence & analytics.
 *
 * GET /api/reports/overview     — High-level KPI summary
 * GET /api/reports/sales        — Detailed sales breakdown & timeline
 * GET /api/reports/revenue      — Verified revenue & payment transactions
 * GET /api/reports/projects     — Project delivery, velocity, status breakdown
 * GET /api/reports/deployments  — Website publishing & launch analytics
 * GET /api/reports/customers    — Customer acquisition & spending metrics
 * GET /api/reports/vendors      — Vendor catalog performance & earnings
 * GET /api/reports/export       — CSV export for authorized report data
 */

import { Router, Response } from 'express';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import {
  parseDateRange,
  getOverviewReport,
  getSalesReport,
  getRevenueReport,
  getProjectsReport,
  getDeploymentsReport,
  getCustomerAnalytics,
  getVendorAnalytics,
  generateCsvExport
} from '../services/reportingService';
import { auditDb } from '../data/auditStore';

export const reportRouter = Router();

// ---------------------------------------------------------------------------
// Helper: extract & parse date range from query parameters
// ---------------------------------------------------------------------------
function extractRange(req: AuthenticatedRequest) {
  const preset = req.query.preset as string | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  return parseDateRange(preset, startDate, endDate);
}

// ---------------------------------------------------------------------------
// GET /api/reports/overview
// ---------------------------------------------------------------------------
reportRouter.get('/overview', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const range = extractRange(req);
    const report = getOverviewReport(req.user!, range);
    res.json(report);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate overview report.';
    res.status(400).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// GET /api/reports/sales
// ---------------------------------------------------------------------------
reportRouter.get('/sales', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const range = extractRange(req);
    const filter = {
      orderType: req.query.orderType as string | undefined,
      status: req.query.status as string | undefined,
      packageId: req.query.packageId as string | undefined,
      templateId: req.query.templateId as string | undefined
    };
    const report = getSalesReport(req.user!, range, filter);
    res.json(report);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate sales report.';
    res.status(400).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// GET /api/reports/revenue
// ---------------------------------------------------------------------------
reportRouter.get('/revenue', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const range = extractRange(req);
    const report = getRevenueReport(req.user!, range);
    res.json(report);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate revenue report.';
    res.status(400).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// GET /api/reports/projects
// ---------------------------------------------------------------------------
reportRouter.get('/projects', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    if (user.role === 'vendor') {
      res.status(403).json({ error: 'Forbidden: Vendors do not have access to website implementation projects.' });
      return;
    }

    const range = extractRange(req);
    const filter = {
      status: req.query.status as string | undefined,
      priority: req.query.priority as string | undefined,
      assignedTo: req.query.assignedTo as string | undefined
    };
    const report = getProjectsReport(user, range, filter);
    res.json(report);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate projects report.';
    res.status(400).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// GET /api/reports/deployments
// ---------------------------------------------------------------------------
reportRouter.get('/deployments', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    if (user.role === 'vendor') {
      res.status(403).json({ error: 'Forbidden: Vendors do not have access to website publishing deployments.' });
      return;
    }

    const range = extractRange(req);
    const report = getDeploymentsReport(user, range);
    res.json(report);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate deployments report.';
    res.status(400).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// GET /api/reports/customers
// ---------------------------------------------------------------------------
reportRouter.get('/customers', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    if (user.role === 'vendor') {
      res.status(403).json({ error: 'Forbidden: Vendors do not have access to customer directories.' });
      return;
    }

    const range = extractRange(req);
    const report = getCustomerAnalytics(user, range);
    res.json(report);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate customer analytics.';
    res.status(400).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// GET /api/reports/vendors
// ---------------------------------------------------------------------------
reportRouter.get('/vendors', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    if (user.role !== 'admin' && user.role !== 'vendor') {
      res.status(403).json({ error: 'Forbidden: Only Admins and Vendors have access to vendor analytics.' });
      return;
    }

    const range = extractRange(req);
    const report = getVendorAnalytics(user, range);
    res.json(report);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate vendor analytics.';
    res.status(400).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// GET /api/reports/export — CSV Export
// ---------------------------------------------------------------------------
reportRouter.get('/export', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    const type = req.query.type as 'sales' | 'revenue' | 'projects' | 'deployments';
    if (!type || !['sales', 'revenue', 'projects', 'deployments'].includes(type)) {
      res.status(400).json({ error: "Invalid export type. Must be one of: 'sales', 'revenue', 'projects', 'deployments'." });
      return;
    }

    // Role check for projects / deployments
    if ((type === 'projects' || type === 'deployments') && user.role === 'vendor') {
      res.status(403).json({ error: `Forbidden: Vendors cannot export ${type} reports.` });
      return;
    }

    const range = extractRange(req);
    const { filename, content } = generateCsvExport(type, user, range);

    // Audit log export action
    auditDb.log({
      action: 'SYSTEM_ALERT' as any,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: type,
      targetType: 'REPORT_EXPORT',
      details: `User ${user.name} exported ${type} report (${range.preset}).`,
      metadata: { reportType: type, dateRange: range.preset }
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(content);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to export report.';
    res.status(500).json({ error: msg });
  }
});
