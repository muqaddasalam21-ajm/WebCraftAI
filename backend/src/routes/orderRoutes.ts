import { Router, Response } from 'express';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { orderDb } from '../data/orderStore';
import { auditDb } from '../data/auditStore';
import { CustomWebsiteOrderStatus } from '../models/customWebsiteOrder';

export const orderRouter = Router();

// GET /api/orders/packages - Public or authenticated: list available packages
orderRouter.get('/packages', (req, res: Response) => {
  const pkgs = orderDb.getPackages();
  res.json({ packages: pkgs });
});

// POST /api/orders/custom-website - Authenticated customer creates custom website order
orderRouter.post('/custom-website', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { businessInfo, requirements, designPreferences, packageId } = req.body;

    if (!businessInfo) {
      res.status(400).json({ error: 'businessInfo is required.' });
      return;
    }
    if (!requirements) {
      res.status(400).json({ error: 'requirements is required.' });
      return;
    }
    if (!designPreferences) {
      res.status(400).json({ error: 'designPreferences is required.' });
      return;
    }
    if (!packageId) {
      res.status(400).json({ error: 'packageId is required.' });
      return;
    }

    const order = orderDb.createCustomWebsiteOrder({
      customerId: user.id,
      customerName: user.name,
      customerEmail: user.email,
      businessInfo,
      requirements,
      designPreferences,
      packageId
    });

    auditDb.log({
      action: 'CUSTOM_WEBSITE_ORDER_CREATED',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: order.id,
      targetType: 'ORDER',
      details: `Custom website order ${order.orderNumber} placed by ${user.name} ($${order.amount}).`
    });

    res.status(201).json({
      message: 'Custom website order created successfully.',
      order
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create custom website order.' });
  }
});

// POST /api/orders/template - Authenticated customer orders/uses a marketplace template
orderRouter.post('/template', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { templateId } = req.body;

    if (!templateId) {
      res.status(400).json({ error: 'templateId is required.' });
      return;
    }

    // Backend securely obtains customer identity from authenticated JWT
    // Price and vendor are taken directly from the trusted database record
    const order = orderDb.createTemplateOrder({
      customerId: user.id,
      customerName: user.name,
      customerEmail: user.email,
      templateId
    });

    auditDb.log({
      action: 'TEMPLATE_PURCHASED',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: order.id,
      targetType: 'ORDER',
      details: `Template order ${order.orderNumber} placed for ${order.templateDetails?.templateName || 'Template'} ($${order.amount}).`
    });

    res.status(201).json({
      message: 'Template order created successfully.',
      order
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to process template order.' });
  }
});

// GET /api/orders/my-orders - Customer: get their own orders
orderRouter.get('/my-orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const sortBy = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc';
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const result = orderDb.queryOrders({
      customerId: user.id,
      search,
      status,
      sortBy,
      sortOrder,
      page,
      limit
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch customer orders.' });
  }
});

// GET /api/orders - Admin/Manager list all orders (Manager can see all or filter assigned)
orderRouter.get('/', requireAuth, requireRoles(['admin', 'manager']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const assignedStaffId = req.query.assignedStaffId as string;
    const assignedOnly = req.query.assignedOnly === 'true';
    const sortBy = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc';
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const result = orderDb.queryOrders({
      assignedStaffId: assignedOnly ? user.id : assignedStaffId,
      search,
      status,
      sortBy,
      sortOrder,
      page,
      limit
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch orders list.' });
  }
});

// GET /api/orders/reports - Real database financial & order aggregation (Admin & Manager only)
orderRouter.get('/reports', requireAuth, requireRoles(['admin', 'manager']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = orderDb.getAnalyticsReport();
    res.json({ ...report, report });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate financial analytics report.' });
  }
});

// GET /api/orders/:id - Get order details (Ownership protected)
orderRouter.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const order = orderDb.findById(req.params.id);

    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    // Customer ownership check: regular users can only see their own orders
    if (user.role === 'user' && order.customerId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to view this order.' });
      return;
    }

    res.json({ order });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve order details.' });
  }
});

// PATCH /api/orders/:id/status - Update order status & status history
orderRouter.patch('/:id/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { status, notes, previewUrl, deliveredUrl, paymentStatus } = req.body;

    if (!status) {
      res.status(400).json({ error: 'Status is required.' });
      return;
    }

    const order = orderDb.findById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    // Authorization rule:
    // If user is a customer, they can ONLY transition:
    // - PREVIEW_READY -> REVISION_REQUESTED
    // - PREVIEW_READY -> CUSTOMER_APPROVED
    // - NEW -> CANCELLED
    if (user.role === 'user') {
      if (order.customerId !== user.id) {
        res.status(403).json({ error: 'Forbidden: You do not own this order.' });
        return;
      }
      const allowedCustomerActions: CustomWebsiteOrderStatus[] = [
        'REVISION_REQUESTED',
        'CUSTOMER_APPROVED',
        'CANCELLED'
      ];
      if (!allowedCustomerActions.includes(status)) {
        res.status(403).json({
          error: `Customers may only request revisions, approve previews, or cancel their order. Invalid transition to '${status}'.`
        });
        return;
      }
    } else if (user.role !== 'admin' && user.role !== 'manager') {
      res.status(403).json({ error: 'Forbidden: Insufficient privileges.' });
      return;
    }

    const updated = orderDb.updateStatus({
      orderId: order.id,
      newStatus: status as CustomWebsiteOrderStatus,
      notes,
      previewUrl,
      deliveredUrl,
      paymentStatus: (user.role === 'admin' || user.role === 'manager') && paymentStatus ? paymentStatus : undefined,
      changedByUser: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });

    res.json({
      message: 'Order status updated successfully.',
      order: updated
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update order status.' });
  }
});

// PATCH /api/orders/:id/assign - Assign order to Admin/Manager (Admin & Manager only)
orderRouter.patch('/:id/assign', requireAuth, requireRoles(['admin', 'manager']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { staffId } = req.body;

    if (!staffId) {
      res.status(400).json({ error: 'staffId is required.' });
      return;
    }

    const updated = orderDb.assignOrder({
      orderId: req.params.id,
      staffId,
      assignedByUser: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });

    res.json({
      message: 'Order assigned successfully.',
      order: updated
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to assign order.' });
  }
});

// POST /api/orders/upload-asset - Base64 image upload for logo or business image
orderRouter.post('/upload-asset', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileName, dataBase64, mimeType } = req.body;

    if (!fileName || !dataBase64) {
      res.status(400).json({ error: 'fileName and dataBase64 are required.' });
      return;
    }

    const allowedMime = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (mimeType && !allowedMime.includes(mimeType.toLowerCase())) {
      res.status(400).json({ error: 'Only PNG, JPEG, WEBP, or SVG images are permitted.' });
      return;
    }

    // Limit to 5MB max base64 length (~6.7MB string)
    if (dataBase64.length > 7 * 1024 * 1024) {
      res.status(400).json({ error: 'File size exceeds 5MB limit.' });
      return;
    }

    // Extract raw base64
    const cleanBase64 = dataBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../../uploads/orders');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const targetPath = path.join(uploadsDir, safeName);
    fs.writeFileSync(targetPath, buffer);

    const fileUrl = `/uploads/orders/${safeName}`;

    res.json({
      success: true,
      url: fileUrl,
      fileName: safeName
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'File upload failed.' });
  }
});
