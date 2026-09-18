import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CustomWebsitePackage } from '../../types';
import { servicePackageService } from '../../services/servicePackageService';
import { useAuth } from '../../contexts/AuthContext';

const SUPPORT_LEVELS = ['basic', 'standard', 'priority', 'dedicated'] as const;

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  currency: 'USD',
  pageLimit: '',
  revisionLimit: '',
  deliveryDays: '',
  supportLevel: 'standard' as CustomWebsitePackage['supportLevel'],
  isActive: true,
  featured: false,
  sortOrder: '',
  featuresRaw: '',
  includedPagesRaw: '',
};

const ServicePackageFormPage: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAdminOrManager = role === 'Admin' || role === 'Manager';

  useEffect(() => {
    if (!isAdminOrManager) { navigate('/dashboard'); return; }
    if (isEdit && id) loadExisting(id);
  }, [id, isAdminOrManager]);

  async function loadExisting(pkgId: string) {
    setFetchLoading(true);
    try {
      const res = await servicePackageService.getById(pkgId);
      const pkg = res.package;
      setForm({
        name: pkg.name,
        description: pkg.description,
        price: String(pkg.price),
        currency: pkg.currency,
        pageLimit: String(pkg.pageLimit),
        revisionLimit: String(pkg.revisionLimit),
        deliveryDays: String(pkg.deliveryDays),
        supportLevel: pkg.supportLevel,
        isActive: pkg.isActive,
        featured: pkg.featured,
        sortOrder: String(pkg.sortOrder),
        featuresRaw: (pkg.features || []).join('\n'),
        includedPagesRaw: (pkg.includedPages || []).join('\n'),
      });
    } catch (e: any) {
      setError(e.message || 'Failed to load package');
    } finally {
      setFetchLoading(false);
    }
  }

  function handleChange(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');

    const price = parseFloat(form.price);
    const pageLimit = parseInt(form.pageLimit);
    const revisionLimit = parseInt(form.revisionLimit);
    const deliveryDays = parseInt(form.deliveryDays);

    if (!form.name.trim()) { setError('Package name is required.'); return; }
    if (!form.description.trim()) { setError('Description is required.'); return; }
    if (isNaN(price) || price < 0) { setError('Price must be a non-negative number.'); return; }
    if (isNaN(pageLimit) || pageLimit < 1) { setError('Page limit must be at least 1.'); return; }
    if (isNaN(revisionLimit) || revisionLimit < 0) { setError('Revision limit must be 0 or more.'); return; }
    if (isNaN(deliveryDays) || deliveryDays < 1) { setError('Delivery days must be at least 1.'); return; }

    const features = form.featuresRaw.split('\n').map(s => s.trim()).filter(Boolean);
    const includedPages = form.includedPagesRaw.split('\n').map(s => s.trim()).filter(Boolean);

    const payload: Partial<CustomWebsitePackage> = {
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      currency: form.currency || 'USD',
      pageLimit,
      revisionLimit,
      deliveryDays,
      supportLevel: form.supportLevel,
      isActive: form.isActive,
      featured: form.featured,
      sortOrder: form.sortOrder ? parseInt(form.sortOrder) : undefined,
      features,
      includedPages,
    };

    setLoading(true);
    try {
      if (isEdit && id) {
        await servicePackageService.update(id, payload);
        setSuccess('Package updated successfully!');
      } else {
        await servicePackageService.create(payload);
        setSuccess('Package created successfully!');
        setTimeout(() => navigate('/dashboard/service-packages'), 1000);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to save package');
    } finally {
      setLoading(false);
    }
  }

  if (!isAdminOrManager) return null;

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard/service-packages')} className="text-gray-400 hover:text-gray-600 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Package' : 'Create New Package'}</h1>
      </div>

      {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200">{error}</div>}
      {success && <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-200">{success}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-800 border-b pb-2">Basic Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Package Name *</label>
            <input value={form.name} onChange={e => handleChange('name', e.target.value)}
              placeholder="e.g. Starter, Business Pro, Enterprise"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea value={form.description} onChange={e => handleChange('description', e.target.value)}
              rows={3} placeholder="Describe what this package includes..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-800 border-b pb-2">Pricing</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={e => handleChange('price', e.target.value)}
                placeholder="499"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select value={form.currency} onChange={e => handleChange('currency', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="PKR">PKR</option>
              </select>
            </div>
          </div>
        </div>

        {/* Limits & Delivery */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-800 border-b pb-2">Limits & Delivery</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page Limit *</label>
              <input type="number" min="1" value={form.pageLimit} onChange={e => handleChange('pageLimit', e.target.value)}
                placeholder="5"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Revisions *</label>
              <input type="number" min="0" value={form.revisionLimit} onChange={e => handleChange('revisionLimit', e.target.value)}
                placeholder="3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery (days) *</label>
              <input type="number" min="1" value={form.deliveryDays} onChange={e => handleChange('deliveryDays', e.target.value)}
                placeholder="14"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Level *</label>
              <select value={form.supportLevel} onChange={e => handleChange('supportLevel', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {SUPPORT_LEVELS.map(l => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input type="number" min="0" value={form.sortOrder} onChange={e => handleChange('sortOrder', e.target.value)}
                placeholder="Auto"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-800 border-b pb-2">Features & Pages</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Features <span className="text-gray-400 font-normal">(one per line)</span>
            </label>
            <textarea value={form.featuresRaw} onChange={e => handleChange('featuresRaw', e.target.value)}
              rows={5} placeholder={"SSL Certificate\nMobile Responsive\nSEO Optimized\nContact Form\n1 Year Hosting"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Included Pages <span className="text-gray-400 font-normal">(one per line, optional)</span>
            </label>
            <textarea value={form.includedPagesRaw} onChange={e => handleChange('includedPagesRaw', e.target.value)}
              rows={3} placeholder={"Home\nAbout\nServices\nContact"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
          </div>
        </div>

        {/* Visibility */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-800 border-b pb-2">Visibility</h2>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => handleChange('isActive', e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600" />
              <span className="text-sm font-medium text-gray-700">Active (visible to customers)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={e => handleChange('featured', e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600" />
              <span className="text-sm font-medium text-gray-700">Featured (highlight this package)</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition">
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Package'}
          </button>
          <button type="button" onClick={() => navigate('/dashboard/service-packages')}
            className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServicePackageFormPage;
