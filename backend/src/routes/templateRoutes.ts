import { Router, Response } from 'express';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { templateDb } from '../data/templateStore';
import { orderDb } from '../data/orderStore';
import { userDb } from '../data/userStore';
import { TemplateStatus } from '../models/template';

export const templateRouter = Router();

// GET /api/templates - Public / Customer marketplace: get published templates (or admin get all)
templateRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const search = req.query.search as string;
    const category = req.query.category as string;
    const sortBy = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc';
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;

    // Public / default: published only
    const result = templateDb.queryTemplates({
      publishedOnly: true,
      search,
      category,
      sortBy,
      sortOrder,
      page,
      limit
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to query marketplace templates.' });
  }
});

// GET /api/templates/stats - Admin / Vendor template statistics
templateRouter.get('/stats', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const isVendor = user.role === 'vendor';
    const stats = templateDb.getStats(isVendor ? user.id : undefined);

    if (isVendor) {
      const sales = orderDb.getVendorTemplateSales(user.id);
      stats.totalTemplateOrders = sales.totalOrders;
      stats.totalTemplateSales = sales.totalRevenue;
    }

    res.json({ stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch template stats.' });
  }
});

// GET /api/templates/my-templates - Authenticated Vendor: get own templates
templateRouter.get('/my-templates', requireAuth, requireRoles(['vendor', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const status = req.query.status as string;
    const sortBy = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc';
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;

    const result = templateDb.queryTemplates({
      vendorId: user.role === 'vendor' ? user.id : (req.query.vendorId as string),
      status,
      search,
      category,
      sortBy,
      sortOrder,
      page,
      limit
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve vendor templates.' });
  }
});

// GET /api/templates/purchased - Customer: get templates purchased by authenticated user
templateRouter.get('/purchased', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const purchasedOrders = orderDb.getCustomerPurchasedTemplates(user.id);
    res.json({ success: true, orders: purchasedOrders, purchased: purchasedOrders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to retrieve purchased templates.' });
  }
});

// GET /api/templates/:id - Get template details by ID
templateRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const template = templateDb.findById(req.params.id);
    if (!template) {
      res.status(404).json({ error: 'Template not found.' });
      return;
    }

    // Safe public vendor information (Never expose passwordHash or session tokens)
    const vendor = userDb.findById(template.vendorId);
    const publicVendorInfo = vendor ? {
      id: vendor.id,
      name: vendor.name,
      company: vendor.profile.company || '',
      bio: vendor.profile.bio || ''
    } : {
      id: template.vendorId,
      name: template.vendorName,
      company: '',
      bio: ''
    };

    res.json({
      template,
      vendor: publicVendorInfo
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve template details.' });
  }
});

// POST /api/templates - Create template (Vendor or Admin)
templateRouter.post('/', requireAuth, requireRoles(['vendor', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      name,
      description,
      category,
      price,
      thumbnail,
      previewUrl,
      demoUrl,
      templateFiles,
      status,
      tags,
      features,
      pages,
      technology,
      version
    } = req.body;

    // Security: vendorId is ALWAYS taken from authenticated session, NEVER trusted from request body
    const template = templateDb.create({
      name,
      description,
      category,
      price: typeof price === 'number' ? price : parseFloat(price) || 0,
      thumbnail,
      previewUrl,
      demoUrl,
      templateFiles,
      vendorId: user.id,
      vendorName: user.name,
      status: (status as TemplateStatus) || 'DRAFT',
      tags,
      features,
      pages,
      technology,
      version
    });

    res.status(201).json({
      message: 'Template created successfully.',
      template
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create template.' });
  }
});

// PUT /api/templates/:id - Edit template (Owner Vendor or Admin only)
templateRouter.put('/:id', requireAuth, requireRoles(['vendor', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const template = templateDb.findById(req.params.id);

    if (!template) {
      res.status(404).json({ error: 'Template not found.' });
      return;
    }

    // Authorization: Vendor can only edit their own template
    if (user.role === 'vendor' && template.vendorId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You can only edit templates you own.' });
      return;
    }

    const {
      name,
      description,
      category,
      price,
      thumbnail,
      previewUrl,
      demoUrl,
      templateFiles,
      status,
      tags,
      features,
      pages,
      technology,
      version
    } = req.body;

    const updated = templateDb.update(template.id, {
      name,
      description,
      category,
      price: price !== undefined ? (typeof price === 'number' ? price : parseFloat(price) || 0) : undefined,
      thumbnail,
      previewUrl,
      demoUrl,
      templateFiles,
      status: status as TemplateStatus,
      tags,
      features,
      pages,
      technology,
      version
    });

    res.json({
      message: 'Template updated successfully.',
      template: updated
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update template.' });
  }
});

// PATCH /api/templates/:id/status - Update template status (Publish / Unpublish / Archive)
templateRouter.patch('/:id/status', requireAuth, requireRoles(['vendor', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const template = templateDb.findById(req.params.id);

    if (!template) {
      res.status(404).json({ error: 'Template not found.' });
      return;
    }

    if (user.role === 'vendor' && template.vendorId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to modify this template.' });
      return;
    }

    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: 'Status is required.' });
      return;
    }

    const updated = templateDb.update(template.id, {
      status: status as TemplateStatus
    });

    res.json({
      message: `Template status changed to ${status}.`,
      template: updated
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to change status.' });
  }
});

// DELETE /api/templates/:id - Delete template (Owner Vendor or Admin)
templateRouter.delete('/:id', requireAuth, requireRoles(['vendor', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const template = templateDb.findById(req.params.id);

    if (!template) {
      res.status(404).json({ error: 'Template not found.' });
      return;
    }

    if (user.role === 'vendor' && template.vendorId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You cannot delete templates owned by other vendors.' });
      return;
    }

    templateDb.delete(template.id);
    res.json({ message: 'Template removed successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete template.' });
  }
});

// POST /api/templates/upload-asset - Upload template preview/thumbnail image
templateRouter.post('/upload-asset', requireAuth, requireRoles(['vendor', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileName, dataBase64, mimeType } = req.body;

    if (!fileName || !dataBase64) {
      res.status(400).json({ error: 'fileName and dataBase64 are required.' });
      return;
    }

    const allowedMime = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (mimeType && !allowedMime.includes(mimeType.toLowerCase())) {
      res.status(400).json({ error: 'Only PNG, JPEG, WEBP, or SVG images are allowed.' });
      return;
    }

    // Max 5MB
    if (dataBase64.length > 7 * 1024 * 1024) {
      res.status(400).json({ error: 'File size exceeds 5MB limit.' });
      return;
    }

    const cleanBase64 = dataBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../../uploads/templates');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const targetPath = path.join(uploadsDir, safeName);
    fs.writeFileSync(targetPath, buffer);

    res.json({
      success: true,
      url: `/uploads/templates/${safeName}`,
      fileName: safeName
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Upload failed.' });
  }
});
