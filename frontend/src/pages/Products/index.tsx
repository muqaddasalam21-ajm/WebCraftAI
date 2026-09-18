import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit3, Trash2, Package, Upload,
  RefreshCw, ChevronLeft, ChevronRight, X, FileText, AlertCircle
} from 'lucide-react';
import { Product, ProductStatus } from '../../types';
import { productService } from '../../services/productService';
import { Badge, BadgeVariant } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Beauty & Skincare', 'Furniture', 'Food & Beverage', 'Digital Products', 'Services', 'Other'];
const STATUSES = ['All', 'draft', 'published', 'archived'];
const SORT_OPTIONS = [
  { value: '', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'price-asc', label: 'Price Low → High' },
  { value: 'price-desc', label: 'Price High → Low' },
];

const getStatusVariant = (status: ProductStatus): BadgeVariant => {
  switch (status) {
    case 'published': return 'success';
    case 'draft': return 'neutral';
    case 'archived': return 'warning';
    default: return 'neutral';
  }
};

const emptyForm = { name: '', description: '', category: 'Electronics', price: '', stock: '', status: 'draft' as ProductStatus, image: '' };

export const ProductsPage: React.FC = () => {
  const { role } = useAuth();
  const isVendor = role === 'Vendor';
  const isAdmin = role === 'Admin' || role === 'Manager';
  const canManage = isVendor || isAdmin;

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);

  const [formData, setFormData] = useState({ ...emptyForm });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [csvText, setCsvText] = useState('');
  const [csvResult, setCsvResult] = useState<{ imported: number; failed: number; errors: string[]; totalRows: number } | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await productService.getProducts({
        search: searchQuery || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
        sortBy: sortBy || undefined,
        page,
        limit,
        viewAll: isAdmin
      });
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedStatus, sortBy, page, isAdmin]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleAddProduct = async () => {
    setFormError('');
    if (!formData.name.trim()) { setFormError('Product name is required.'); return; }
    if (!formData.category) { setFormError('Category is required.'); return; }
    const price = parseFloat(formData.price as string);
    if (isNaN(price) || price < 0) { setFormError('Enter a valid price (0 or more).'); return; }

    setFormLoading(true);
    try {
      const result = await productService.createProduct({
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price,
        stock: parseInt(formData.stock as string || '0', 10),
        status: formData.status,
        image: formData.image.trim()
      });
      if (result.error) { setFormError(result.error); return; }
      setIsAddModalOpen(false);
      setFormData({ ...emptyForm });
      loadProducts();
    } catch {
      setFormError('Failed to create product. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditProduct = async () => {
    if (!editProduct) return;
    setFormError('');
    const price = parseFloat(formData.price as string);
    if (formData.name.trim() === '') { setFormError('Product name is required.'); return; }
    if (isNaN(price) || price < 0) { setFormError('Enter a valid price.'); return; }

    setFormLoading(true);
    try {
      const result = await productService.updateProduct(editProduct.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price,
        stock: parseInt(formData.stock as string || '0', 10),
        status: formData.status,
        image: formData.image.trim()
      });
      if (result.error) { setFormError(result.error); return; }
      setEditProduct(null);
      loadProducts();
    } catch {
      setFormError('Failed to update product.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProduct) return;
    try {
      await productService.deleteProduct(deleteProduct.id);
      setDeleteProduct(null);
      loadProducts();
    } catch {
      alert('Failed to delete product.');
    }
  };

  const handleCSVImport = async () => {
    if (!csvText.trim()) { alert('Please paste or type CSV data.'); return; }
    setCsvLoading(true);
    setCsvResult(null);
    try {
      const result = await productService.importCsv(csvText);
      if (result.result) setCsvResult(result.result);
      else setCsvResult({ imported: 0, failed: 0, errors: [result.error || 'Unknown error'], totalRows: 0 });
      loadProducts();
    } catch {
      setCsvResult({ imported: 0, failed: 0, errors: ['Import request failed.'], totalRows: 0 });
    } finally {
      setCsvLoading(false);
    }
  };

  const openEditModal = (p: Product) => {
    setEditProduct(p);
    setFormData({ name: p.name, description: p.description, category: p.category, price: String(p.price), stock: String(p.stock), status: p.status, image: p.image || '' });
    setFormError('');
  };

  const ProductForm = () => (
    <div className="space-y-4 py-2 text-xs">
      {formError && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2.5 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />{formError}
        </div>
      )}
      <div>
        <label className="font-bold text-slate-700 block mb-1">Product Name <span className="text-rose-500">*</span></label>
        <input type="text" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Premium Leather Wallet" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10" />
      </div>
      <div>
        <label className="font-bold text-slate-700 block mb-1">Description</label>
        <textarea value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} placeholder="Product description..." rows={3} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Category <span className="text-rose-500">*</span></label>
          <select value={formData.category} onChange={e => setFormData(f => ({ ...f, category: e.target.value }))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-500">
            {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Status</label>
          <select value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value as ProductStatus }))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-500">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Price ($) <span className="text-rose-500">*</span></label>
          <input type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData(f => ({ ...f, price: e.target.value }))} placeholder="0.00" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10" />
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Stock (units)</label>
          <input type="number" min="0" value={formData.stock} onChange={e => setFormData(f => ({ ...f, stock: e.target.value }))} placeholder="0" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10" />
        </div>
      </div>
      <div>
        <label className="font-bold text-slate-700 block mb-1">Image URL (optional)</label>
        <input type="text" value={formData.image} onChange={e => setFormData(f => ({ ...f, image: e.target.value }))} placeholder="https://example.com/product-image.jpg" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Products</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {total > 0 ? `${total} product${total !== 1 ? 's' : ''} in database` : 'No products yet'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <Button variant="outline" size="sm" onClick={() => { setIsCSVModalOpen(true); setCsvResult(null); setCsvText(''); }} leftIcon={<Upload className="w-3.5 h-3.5" />}>
                CSV Import
              </Button>
              <Button variant="primary" size="md" onClick={() => { setIsAddModalOpen(true); setFormData({ ...emptyForm }); setFormError(''); }} leftIcon={<Plus className="w-4 h-4" />}>
                Add Product
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} placeholder="Search products..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10" />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setPage(1); }} className="text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl outline-none">
            {CATEGORIES.map(c => <option key={c} value={c}>Category: {c}</option>)}
          </select>
          <select value={selectedStatus} onChange={e => { setSelectedStatus(e.target.value); setPage(1); }} className="text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl outline-none">
            {STATUSES.map(s => <option key={s} value={s}>Status: {s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }} className="text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl outline-none">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={loadProducts} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading products from database...</div>
        ) : error ? (
          <div className="py-16 text-center text-rose-500 text-sm">{error}</div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">No products yet</p>
            <p className="text-xs text-slate-400 mt-1">
              {canManage ? 'Your products will appear here once you create one.' : 'No published products available yet.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Vendor</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Status</th>
                {canManage && <th className="py-3.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-8 h-8 rounded-lg object-cover shrink-0" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-800 text-xs">{product.name}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{product.id.substring(0, 18)}...</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">{product.category}</td>
                  <td className="py-3.5 px-4 text-xs font-bold text-slate-900">${product.price.toFixed(2)}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">{product.vendorName}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">{product.stock} units</td>
                  <td className="py-3.5 px-4">
                    <Badge variant={getStatusVariant(product.status)} size="sm">
                      {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                    </Badge>
                  </td>
                  {canManage && (
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button onClick={() => openEditModal(product)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg" title="Edit Product">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteProduct(product)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete Product">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total} products</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700">Page {page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Product" subtitle="Product will be saved to the database">
        <ProductForm />
        <div className="pt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleAddProduct} disabled={formLoading}>
            {formLoading ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </Modal>

      {/* Edit Product Modal */}
      <Modal isOpen={!!editProduct} onClose={() => setEditProduct(null)} title="Edit Product" subtitle={editProduct?.id}>
        <ProductForm />
        <div className="pt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditProduct(null)}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleEditProduct} disabled={formLoading}>
            {formLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Modal>

      {/* Delete Product Modal */}
      <Modal isOpen={!!deleteProduct} onClose={() => setDeleteProduct(null)} title="Delete Product?" subtitle={`Are you sure you want to permanently remove "${deleteProduct?.name}" from the database?`}>
        <div className="pt-2 flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setDeleteProduct(null)}>Cancel</Button>
          <Button size="sm" variant="danger" onClick={handleDeleteProduct}>Delete</Button>
        </div>
      </Modal>

      {/* CSV Import Modal */}
      <Modal isOpen={isCSVModalOpen} onClose={() => setIsCSVModalOpen(false)} title="CSV Product Import" subtitle="Paste CSV content below. Required columns: name, category, price">
        <div className="space-y-4 py-2 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-mono text-slate-600">
            <p className="font-bold text-slate-800 mb-1">Expected CSV format:</p>
            <p>name,description,category,price,status,stock</p>
            <p>My Product,A great product,Electronics,29.99,published,50</p>
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">CSV Data <span className="text-rose-500">*</span></label>
            <textarea value={csvText} onChange={e => setCsvText(e.target.value)} placeholder="Paste CSV content here..." rows={8} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 resize-none" />
          </div>
          {csvResult && (
            <div className={`rounded-xl border p-3 text-xs ${csvResult.imported > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <p className="font-bold text-slate-800 mb-1">Import Result</p>
              <p className="text-emerald-700">✅ Imported: {csvResult.imported}</p>
              <p className="text-rose-600">❌ Failed: {csvResult.failed}</p>
              {csvResult.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {csvResult.errors.map((e, i) => (
                    <p key={i} className="text-rose-600 flex items-start gap-1"><X className="w-3 h-3 mt-0.5 shrink-0" />{e}</p>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <FileText className="w-3 h-3" />
            Products will be attributed to your vendor account. Vendor ID cannot be overridden via CSV.
          </div>
        </div>
        <div className="pt-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsCSVModalOpen(false)}>Close</Button>
          <Button variant="primary" size="sm" onClick={handleCSVImport} disabled={csvLoading} leftIcon={<Upload className="w-3.5 h-3.5" />}>
            {csvLoading ? 'Importing...' : 'Import CSV'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
