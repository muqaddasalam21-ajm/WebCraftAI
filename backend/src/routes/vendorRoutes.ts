import { Router, Response } from 'express';
import { userDb } from '../data/userStore';
import { productDb } from '../data/productStore';
import { templateDb } from '../data/templateStore';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const vendorRouter = Router();

// GET /api/vendors (Public & Authenticated)
// Returns real verified vendor accounts from Users database with safe fields ONLY
vendorRouter.get('/', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const allUsers = userDb.getAll();
    const vendorUsers = allUsers.filter(u => u.role === 'vendor');
    const allTemplates = templateDb.getAll();

    // Safe public projection with real product count and status
    const safeVendors = vendorUsers.map(v => {
      const liveProductsCount = productDb.getVendorProductCount(v.id);
      const vendorTemplatesCount = allTemplates.filter(t => t.vendorId === v.id && t.status === 'PUBLISHED').length;
      return {
        id: v.id,
        name: v.profile?.fullName || v.name,
        company: v.profile?.company || v.name,
        email: v.email,
        bio: v.profile?.bio || 'Verified WebCraftAI Template & Product Studio',
        avatarUrl: v.profile?.avatarUrl || '',
        status: v.status === 'active' ? 'Verified' : 'Inactive',
        productsCount: liveProductsCount,
        templatesCount: vendorTemplatesCount,
        rating: 4.9,
        joinedDate: v.createdAt || '2026-01-01T00:00:00.000Z'
      };
    });

    res.json({
      total: safeVendors.length,
      vendors: safeVendors
    });
  } catch (error: any) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to retrieve vendors.' });
  }
});

// GET /api/vendors/:id (Public & Authenticated: Real vendor details from database)
vendorRouter.get('/:id', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const vendorId = req.params.id;
    const vendor = userDb.findById(vendorId);

    if (!vendor || vendor.role !== 'vendor') {
      res.status(404).json({ error: 'Vendor not found.' });
      return;
    }

    const liveProducts = productDb.queryProducts({
      vendorId,
      publishedOnly: true,
      limit: 50
    }).products;

    const allTemplates = templateDb.getAll();
    const vendorTemplates = allTemplates.filter(t => t.vendorId === vendorId && t.status === 'PUBLISHED');

    const safeVendor = {
      id: vendor.id,
      name: vendor.profile?.fullName || vendor.name,
      company: vendor.profile?.company || vendor.name,
      email: vendor.email,
      phone: vendor.profile?.phone || '',
      bio: vendor.profile?.bio || 'Verified WebCraftAI Template & Product Studio',
      avatarUrl: vendor.profile?.avatarUrl || '',
      status: vendor.status === 'active' ? 'Verified' : 'Inactive',
      productsCount: liveProducts.length,
      templatesCount: vendorTemplates.length,
      rating: 4.9,
      joinedDate: vendor.createdAt || '2026-01-01T00:00:00.000Z',
      products: liveProducts,
      templates: vendorTemplates
    };

    res.json({
      success: true,
      vendor: safeVendor
    });
  } catch (error: any) {
    console.error('Error fetching vendor profile:', error);
    res.status(500).json({ error: 'Failed to retrieve vendor profile.' });
  }
});

// GET /api/vendors/:id/products (Public: Real published products for a specific vendor)
vendorRouter.get('/:id/products', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const vendorId = req.params.id;
    const vendor = userDb.findById(vendorId);

    if (!vendor || vendor.role !== 'vendor') {
      res.status(404).json({ error: 'Vendor not found.' });
      return;
    }

    const result = productDb.queryProducts({
      vendorId,
      publishedOnly: true,
      limit: 50
    });

    res.json({
      vendor: {
        id: vendor.id,
        name: vendor.name,
        company: vendor.profile?.company || vendor.name,
        bio: vendor.profile?.bio || ''
      },
      ...result
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve vendor products.' });
  }
});
