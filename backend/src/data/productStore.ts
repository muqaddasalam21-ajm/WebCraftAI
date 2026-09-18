import fs from 'fs';
import path from 'path';
import { Product, ProductStatus, ProductStats, CsvImportResult } from '../models/product';

const PRODUCTS_DB_FILE = path.join(__dirname, '../../data/products.json');

class PersistentProductDatabase {
  private products: Map<string, Product> = new Map();

  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    const dataDir = path.dirname(PRODUCTS_DB_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(PRODUCTS_DB_FILE)) {
      try {
        const raw = fs.readFileSync(PRODUCTS_DB_FILE, 'utf-8');
        const parsed: Product[] = JSON.parse(raw);
        parsed.forEach(p => this.products.set(p.id, p));
        console.log(`Loaded ${this.products.size} real products from persistent storage.`);
        return;
      } catch (err) {
        console.error('Error reading product database:', err);
      }
    }

    // Initialize with completely empty storage - NOTHING FAKE, NOTHING MOCK
    this.products.clear();
    this.saveToDisk();
  }

  public saveToDisk() {
    try {
      const dataDir = path.dirname(PRODUCTS_DB_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const list = Array.from(this.products.values());
      fs.writeFileSync(PRODUCTS_DB_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving product database to disk:', err);
    }
  }

  public findById(id: string): Product | undefined {
    return this.products.get(id);
  }

  public getAll(): Product[] {
    return Array.from(this.products.values());
  }

  public getStats(vendorId?: string): ProductStats {
    let list = Array.from(this.products.values());
    if (vendorId) {
      list = list.filter(p => p.vendorId === vendorId);
    }

    const totalProducts = list.length;
    const publishedProducts = list.filter(p => p.status === 'published').length;
    const draftProducts = list.filter(p => p.status === 'draft').length;
    const archivedProducts = list.filter(p => p.status === 'archived').length;
    const totalInventoryValue = list.reduce((sum, p) => sum + (p.price * (p.stock || 1)), 0);

    return {
      totalProducts,
      publishedProducts,
      draftProducts,
      archivedProducts,
      totalInventoryValue: parseFloat(totalInventoryValue.toFixed(2))
    };
  }

  public getVendorProductCount(vendorId: string): number {
    return Array.from(this.products.values()).filter(p => p.vendorId === vendorId).length;
  }

  public queryProducts(params: {
    search?: string;
    category?: string;
    status?: string;
    vendorId?: string;
    publishedOnly?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    let list = Array.from(this.products.values());

    // If publishedOnly is set (e.g. for public marketplace/regular users)
    if (params.publishedOnly) {
      list = list.filter(p => p.status === 'published');
    } else if (params.status && params.status !== 'All' && params.status !== 'all') {
      const targetStatus = params.status.toLowerCase();
      list = list.filter(p => p.status.toLowerCase() === targetStatus);
    }

    // Vendor filter (if a specific vendor requested or filtered)
    if (params.vendorId && params.vendorId !== 'All' && params.vendorId !== 'all') {
      list = list.filter(p => p.vendorId === params.vendorId);
    }

    // Category filter
    if (params.category && params.category !== 'All' && params.category !== 'all') {
      const cat = params.category.toLowerCase();
      list = list.filter(p => p.category.toLowerCase() === cat);
    }

    // Search query (name, description, category)
    if (params.search && params.search.trim() !== '') {
      const q = params.search.trim().toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.vendorName.toLowerCase().includes(q)
      );
    }

    // Sorting
    const sortOrder = params.sortOrder === 'asc' ? 1 : -1;
    if (params.sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name) * (params.sortOrder === 'desc' ? -1 : 1));
    } else if (params.sortBy === 'name-desc') {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (params.sortBy === 'price-asc') {
      list.sort((a, b) => (a.price - b.price));
    } else if (params.sortBy === 'price-desc') {
      list.sort((a, b) => (b.price - a.price));
    } else if (params.sortBy === 'oldest') {
      list.sort((a, b) => (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    } else {
      // Default: newest first
      list.sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }

    const total = list.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 10);
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      products: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  public create(data: {
    name: string;
    description: string;
    category: string;
    price: number;
    image?: string;
    stock?: number;
    status?: ProductStatus;
    vendorId: string;
    vendorName: string;
  }): Product {
    if (!data.name || data.name.trim() === '') {
      throw new Error('Product name is required.');
    }
    if (!data.category || data.category.trim() === '') {
      throw new Error('Product category is required.');
    }
    if (typeof data.price !== 'number' || isNaN(data.price) || data.price < 0) {
      throw new Error('Price must be a valid positive number.');
    }

    const validStatuses: ProductStatus[] = ['draft', 'published', 'archived'];
    const status: ProductStatus = data.status && validStatuses.includes(data.status) ? data.status : 'draft';

    const now = new Date().toISOString();
    const newProduct: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: data.name.trim(),
      description: data.description ? data.description.trim() : '',
      category: data.category.trim(),
      price: parseFloat(data.price.toFixed(2)),
      image: data.image || '',
      stock: typeof data.stock === 'number' && data.stock >= 0 ? Math.floor(data.stock) : 0,
      vendorId: data.vendorId,
      vendorName: data.vendorName,
      status,
      createdAt: now,
      updatedAt: now
    };

    this.products.set(newProduct.id, newProduct);
    this.saveToDisk();
    return newProduct;
  }

  public update(id: string, updates: {
    name?: string;
    description?: string;
    category?: string;
    price?: number;
    image?: string;
    stock?: number;
    status?: ProductStatus;
  }): Product {
    const product = this.findById(id);
    if (!product) {
      throw new Error('Product not found.');
    }

    if (updates.name !== undefined) {
      if (updates.name.trim() === '') throw new Error('Product name cannot be empty.');
      product.name = updates.name.trim();
    }
    if (updates.description !== undefined) {
      product.description = updates.description.trim();
    }
    if (updates.category !== undefined) {
      if (updates.category.trim() === '') throw new Error('Product category cannot be empty.');
      product.category = updates.category.trim();
    }
    if (updates.price !== undefined) {
      if (typeof updates.price !== 'number' || isNaN(updates.price) || updates.price < 0) {
        throw new Error('Price must be a valid positive number.');
      }
      product.price = parseFloat(updates.price.toFixed(2));
    }
    if (updates.image !== undefined) {
      product.image = updates.image;
    }
    if (updates.stock !== undefined) {
      if (typeof updates.stock !== 'number' || isNaN(updates.stock) || updates.stock < 0) {
        throw new Error('Stock must be a valid non-negative integer.');
      }
      product.stock = Math.floor(updates.stock);
    }
    if (updates.status !== undefined) {
      const validStatuses: ProductStatus[] = ['draft', 'published', 'archived'];
      if (!validStatuses.includes(updates.status)) {
        throw new Error('Invalid product status.');
      }
      product.status = updates.status;
    }

    product.updatedAt = new Date().toISOString();
    this.products.set(product.id, product);
    this.saveToDisk();
    return product;
  }

  public delete(id: string): void {
    const product = this.findById(id);
    if (!product) {
      throw new Error('Product not found.');
    }
    this.products.delete(id);
    this.saveToDisk();
  }

  public importCsv(csvContent: string, vendor: { id: string; name: string }): CsvImportResult {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return {
        totalRows: 0,
        imported: 0,
        failed: 0,
        errors: ['CSV file must contain a header row and at least one data row.'],
        products: []
      };
    }

    // Parse header
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/^[']|[']$/g, ''));
    
    const nameIdx = headers.indexOf('name');
    const descIdx = headers.indexOf('description');
    const catIdx = headers.indexOf('category');
    const priceIdx = headers.indexOf('price');
    const statusIdx = headers.indexOf('status');
    const stockIdx = headers.indexOf('stock');

    const missingColumns: string[] = [];
    if (nameIdx === -1) missingColumns.push('name');
    if (catIdx === -1) missingColumns.push('category');
    if (priceIdx === -1) missingColumns.push('price');

    if (missingColumns.length > 0) {
      return {
        totalRows: lines.length - 1,
        imported: 0,
        failed: lines.length - 1,
        errors: [`Missing required columns in CSV header: ${missingColumns.join(', ')}`],
        products: []
      };
    }

    const errors: string[] = [];
    const createdProducts: Product[] = [];
    let imported = 0;
    let failed = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values: string[] = [];
      let inQuotes = false;
      let curVal = '';
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(curVal.trim().replace(/^"|"$/g, ''));
          curVal = '';
        } else {
          curVal += char;
        }
      }
      values.push(curVal.trim().replace(/^"|"$/g, ''));

      const rowNumber = i + 1;
      const rawName = values[nameIdx] || '';
      const rawDesc = descIdx !== -1 ? (values[descIdx] || '') : '';
      const rawCat = values[catIdx] || '';
      const rawPrice = values[priceIdx] || '';
      const rawStatus = statusIdx !== -1 ? (values[statusIdx] || 'draft').toLowerCase() : 'draft';
      const rawStock = stockIdx !== -1 ? (values[stockIdx] || '0') : '0';

      if (rawName.startsWith('=') || rawName.startsWith('+') || rawName.startsWith('-') || rawName.startsWith('@')) {
        errors.push(`Row ${rowNumber}: Potential spreadsheet formula injection rejected in name.`);
        failed++;
        continue;
      }

      if (!rawName || rawName.trim() === '') {
        errors.push(`Row ${rowNumber}: Missing required product name.`);
        failed++;
        continue;
      }

      if (!rawCat || rawCat.trim() === '') {
        errors.push(`Row ${rowNumber}: Missing required category for '${rawName}'.`);
        failed++;
        continue;
      }

      const price = parseFloat(rawPrice.replace(/[^0-9.-]+/g, ''));
      if (isNaN(price) || price < 0) {
        errors.push(`Row ${rowNumber}: Invalid price '${rawPrice}' for product '${rawName}'. Price must be a positive number.`);
        failed++;
        continue;
      }

      const stock = parseInt(rawStock, 10);
      const safeStock = isNaN(stock) || stock < 0 ? 0 : stock;

      const validStatuses: ProductStatus[] = ['draft', 'published', 'archived'];
      const status: ProductStatus = validStatuses.includes(rawStatus as ProductStatus)
        ? (rawStatus as ProductStatus)
        : 'draft';

      try {
        const product = this.create({
          name: rawName,
          description: rawDesc,
          category: rawCat,
          price,
          stock: safeStock,
          status,
          vendorId: vendor.id,
          vendorName: vendor.name
        });
        createdProducts.push(product);
        imported++;
      } catch (err: any) {
        errors.push(`Row ${rowNumber}: Failed to save '${rawName}' - ${err.message}`);
        failed++;
      }
    }

    return {
      totalRows: lines.length - 1,
      imported,
      failed,
      errors,
      products: createdProducts
    };
  }
}

export const productDb = new PersistentProductDatabase();
