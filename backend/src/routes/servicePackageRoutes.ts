import { Router, Request, Response } from 'express';
import { servicePackageDb } from '../data/servicePackageStore';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { orderDb } from '../data/orderStore';

const router = Router();

// GET /api/service-packages — admin sees all, others see active
router.get('/', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const isAdmin = ['admin', 'manager'].includes(user?.role);
    const packages = isAdmin ? servicePackageDb.getAll() : servicePackageDb.getActive();
    res.json({ success: true, packages, total: packages.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load packages' });
  }
});

// GET /api/service-packages/active — public active packages
router.get('/active', (req: Request, res: Response) => {
  try {
    const packages = servicePackageDb.getActive();
    res.json({ success: true, packages, total: packages.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load packages' });
  }
});

// GET /api/service-packages/:id
router.get('/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const pkg = servicePackageDb.getById(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.json({ success: true, package: pkg });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load package' });
  }
});

// POST /api/service-packages — admin only
router.post('/', requireAuth, requireRoles(['admin', 'manager']), (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, description, price, currency, pageLimit, includedPages, features,
            revisionLimit, deliveryDays, supportLevel, isActive, featured, sortOrder } = req.body;

    if (!name || !description || price === undefined || !pageLimit || !revisionLimit || !deliveryDays || !supportLevel) {
      return res.status(400).json({ error: 'Missing required fields: name, description, price, pageLimit, revisionLimit, deliveryDays, supportLevel' });
    }

    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'Price must be a non-negative number' });
    }

    const validSupportLevels = ['basic', 'standard', 'priority', 'dedicated'];
    if (!validSupportLevels.includes(supportLevel)) {
      return res.status(400).json({ error: 'supportLevel must be one of: basic, standard, priority, dedicated' });
    }

    const pkg = servicePackageDb.create(
      { name, description, price, currency, pageLimit: Number(pageLimit),
        includedPages, features, revisionLimit: Number(revisionLimit),
        deliveryDays: Number(deliveryDays), supportLevel, isActive, featured, sortOrder },
      user.id, user.name
    );

    res.status(201).json({ success: true, message: 'Package created', package: pkg });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create package' });
  }
});

// PUT /api/service-packages/:id — admin only
router.put('/:id', requireAuth, requireRoles(['admin', 'manager']), (req: Request, res: Response) => {
  try {
    const existing = servicePackageDb.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Package not found' });

    const { name, description, price, currency, pageLimit, includedPages, features,
            revisionLimit, deliveryDays, supportLevel, isActive, featured, sortOrder } = req.body;

    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return res.status(400).json({ error: 'Price must be a non-negative number' });
    }

    const validSupportLevels = ['basic', 'standard', 'priority', 'dedicated'];
    if (supportLevel && !validSupportLevels.includes(supportLevel)) {
      return res.status(400).json({ error: 'supportLevel must be one of: basic, standard, priority, dedicated' });
    }

    const updated = servicePackageDb.update(req.params.id, {
      name, description, price, currency,
      pageLimit: pageLimit !== undefined ? Number(pageLimit) : undefined,
      includedPages, features,
      revisionLimit: revisionLimit !== undefined ? Number(revisionLimit) : undefined,
      deliveryDays: deliveryDays !== undefined ? Number(deliveryDays) : undefined,
      supportLevel, isActive, featured, sortOrder
    });

    res.json({ success: true, message: 'Package updated', package: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update package' });
  }
});

// PATCH /api/service-packages/:id/status — activate/deactivate
router.patch('/:id/status', requireAuth, requireRoles(['admin', 'manager']), (req: Request, res: Response) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    const existing = servicePackageDb.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Package not found' });

    const updated = servicePackageDb.setStatus(req.params.id, isActive);
    const action = isActive ? 'activated' : 'deactivated';
    res.json({ success: true, message: `Package ${action}`, package: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update status' });
  }
});

// DELETE /api/service-packages/:id — admin only, with order-ref check
router.delete('/:id', requireAuth, requireRoles(['admin']), (req: Request, res: Response) => {
  try {
    const existing = servicePackageDb.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Package not found' });

    // Check if any orders reference this package
    const allOrders = orderDb.queryOrders({ limit: 99999 });
    const referencedOrders = allOrders.orders.filter(
      o => o.package?.packageId === req.params.id
    );

    if (referencedOrders.length > 0) {
      return res.status(409).json({
        error: `Cannot delete: ${referencedOrders.length} order(s) reference this package. Deactivate it instead.`,
        orderCount: referencedOrders.length
      });
    }

    servicePackageDb.delete(req.params.id);
    res.json({ success: true, message: 'Package deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete package' });
  }
});

export default router;
