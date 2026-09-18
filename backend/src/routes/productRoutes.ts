import { Router, Response } from 'express';
import { productDb } from '../data/productStore';
import { userDb } from '../data/userStore';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { ProductStatus } from '../models/product';

export const productRouter = Router();

// GET /api/products/stats (Admin, Manager, or Vendor for own stats)
productRouter.get('/stats', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    let stats;
    if (user.role === 'vendor') {
      stats = productDb.getStats(user.id);
    } else {
      stats = productDb.getStats();
    }
    res.json({ stats });
  } catch (error: any) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({ error: 'Failed to retrieve product statistics.' });
  }
});

// GET /api/products (Public or Authenticated)
// Rules:
// - Non-auth or 'user' role: only 'published' products returned.
// - 'vendor' role: returns all products owned by this vendor by default, or public published products if explicitly requested.
// - 'admin' / 'manager': returns all products with full search and filter controls.
productRouter.get('/', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const status = req.query.status as string | undefined;
    const vendorId = req.query.vendorId as string | undefined;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const viewAll = req.query.viewAll === 'true';

    // Optional auth token checking if passed
    const user = req.user;

    let publishedOnly = false;
    let targetVendorId = vendorId;

    if (!user || user.role === 'user') {
      // Normal customers and guest users can ONLY view published products
      publishedOnly = true;
    } else if (user.role === 'vendor' && !viewAll) {
      // Vendors default to seeing their own products unless explicitly searching marketplace
      if (!vendorId) {
        targetVendorId = user.id;
      }
    }

    const result = productDb.queryProducts({
      search,
      category,
      status,
      vendorId: targetVendorId,
      publishedOnly,
      sortBy,
      sortOrder,
      page,
      limit
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to retrieve products.' });
  }
});

// GET /api/products/:id (Get single product)
productRouter.get('/:id', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const product = productDb.findById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const user = req.user;
    // If not published and requester is not Admin/Manager and not the owner vendor
    if (product.status !== 'published') {
      if (!user || (user.role !== 'admin' && user.role !== 'manager' && user.id !== product.vendorId)) {
        res.status(404).json({ error: 'Product not found or is currently private.' });
        return;
      }
    }

    res.json({ product });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve product.' });
  }
});

// POST /api/products (Create product - Vendor or Admin)
productRouter.post('/', requireAuth, requireRoles(['vendor', 'admin']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    const { name, description, category, price, image, stock, status } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ error: 'Product name is required.' });
      return;
    }

    if (!category || typeof category !== 'string' || category.trim() === '') {
      res.status(400).json({ error: 'Product category is required.' });
      return;
    }

    const parsedPrice = typeof price === 'number' ? price : parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      res.status(400).json({ error: 'Price must be a valid positive number.' });
      return;
    }

    // Determine vendor assignment
    let vendorId = user.id;
    let vendorName = user.name;

    // If admin is creating and provides an existing vendorId, assign to that vendor
    if (user.role === 'admin' && req.body.vendorId) {
      const targetVendor = userDb.findById(req.body.vendorId);
      if (targetVendor && targetVendor.role === 'vendor') {
        vendorId = targetVendor.id;
        vendorName = targetVendor.name;
      }
    }

    const newProduct = productDb.create({
      name,
      description: description || '',
      category,
      price: parsedPrice,
      image,
      stock: typeof stock === 'number' ? stock : parseInt(stock || '0', 10),
      status: status || 'draft',
      vendorId,
      vendorName
    });

    res.status(201).json({
      message: 'Product created successfully in database.',
      product: newProduct
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(400).json({ error: error.message || 'Failed to create product.' });
  }
});

// PUT /api/products/:id (Update product - Owner Vendor or Admin)
productRouter.put('/:id', requireAuth, requireRoles(['vendor', 'admin']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    const product = productDb.findById(req.params.id);

    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    // Ownership check: Vendor cannot modify another vendor's product
    if (user.role === 'vendor' && product.vendorId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You do not own this product.' });
      return;
    }

    const { name, description, category, price, image, stock, status } = req.body;

    const parsedPrice = price !== undefined ? (typeof price === 'number' ? price : parseFloat(price)) : undefined;
    if (parsedPrice !== undefined && (isNaN(parsedPrice) || parsedPrice < 0)) {
      res.status(400).json({ error: 'Price must be a valid positive number.' });
      return;
    }

    const updated = productDb.update(req.params.id, {
      name,
      description,
      category,
      price: parsedPrice,
      image,
      stock: stock !== undefined ? (typeof stock === 'number' ? stock : parseInt(stock, 10)) : undefined,
      status: status ? (status.toLowerCase() as ProductStatus) : undefined
    });

    res.json({
      message: 'Product updated successfully.',
      product: updated
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update product.' });
  }
});

// DELETE /api/products/:id (Delete product - Owner Vendor or Admin)
productRouter.delete('/:id', requireAuth, requireRoles(['vendor', 'admin']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    const product = productDb.findById(req.params.id);

    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    // Ownership check
    if (user.role === 'vendor' && product.vendorId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You do not own this product.' });
      return;
    }

    productDb.delete(req.params.id);
    res.json({ message: 'Product deleted successfully from database.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete product.' });
  }
});

// POST /api/products/import-csv (Bulk CSV import - Vendor or Admin)
productRouter.post('/import-csv', requireAuth, requireRoles(['vendor', 'admin']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    const { csvData } = req.body;

    if (!csvData || typeof csvData !== 'string' || csvData.trim() === '') {
      res.status(400).json({ error: 'CSV data string is required in request body.' });
      return;
    }

    // Protection against excessive payload size (e.g. max 5MB text)
    if (csvData.length > 5 * 1024 * 1024) {
      res.status(400).json({ error: 'CSV file size exceeds 5MB limit.' });
      return;
    }

    const result = productDb.importCsv(csvData, {
      id: user.id,
      name: user.name
    });

    res.json({
      message: `CSV import finished: ${result.imported} imported, ${result.failed} rejected.`,
      result
    });
  } catch (error: any) {
    console.error('CSV import error:', error);
    res.status(400).json({ error: error.message || 'Failed to parse and import CSV file.' });
  }
});
