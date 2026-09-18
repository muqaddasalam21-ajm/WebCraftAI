import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Filter, LayoutTemplate, Plus, ArrowUpDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Template, TemplateCategory } from '../../types';
import { templateService } from '../../services/templateService';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';

export const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, role } = useAuth();
  const isVendorOrAdmin = role === 'Vendor' || role === 'Admin' || role === 'Manager';

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const categories = [
    'All',
    'E-commerce',
    'Beauty',
    'Furniture',
    'Restaurant',
    'Portfolio',
    'Agency',
    'Education',
    'Real Estate'
  ];

  useEffect(() => {
    loadMarketplaceTemplates();
  }, [selectedCategory, sortBy, sortOrder]);

  const loadMarketplaceTemplates = async () => {
    try {
      setLoading(true);
      const res = await templateService.getTemplates({
        search: searchQuery || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        sortBy,
        sortOrder,
        viewAll: false // Marketplace shows PUBLISHED only
      });
      if (res.success) {
        setTemplates(res.templates || []);
      }
    } catch (err) {
      console.error('Failed to load marketplace templates', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMarketplaceTemplates();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Template Marketplace</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-100 text-brand-700">
              {templates.length} Real {templates.length === 1 ? 'Design' : 'Designs'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover and purchase production-ready website templates created by verified vendors
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/my-templates"
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            {isVendorOrAdmin ? 'My Template Hub' : 'My Purchased Templates'}
          </Link>

          {isVendorOrAdmin && (
            <Link
              to="/dashboard/templates/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm shadow-brand-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Template
            </Link>
          )}
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, tags, or description..."
              className="w-full pl-10 pr-20 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 shadow-xs"
            />
            <button
              type="submit"
              className="absolute right-2 top-1.5 px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 text-[11px] font-bold rounded-lg transition-colors"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white px-3 py-2 border border-slate-200 rounded-xl">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order as any);
                }}
                className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/25'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid / Empty State */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        /* MANDATORY REAL EMPTY STATE */
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200/80 max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <LayoutTemplate className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No templates available yet.</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'All'
                ? 'No templates matched your filter criteria. Try adjusting your search query or category filter.'
                : 'Vendors can create and publish reusable website templates to sell in the marketplace.'}
            </p>
          </div>
          {isVendorOrAdmin && (
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/dashboard/templates/new')}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Publish First Template
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-brand-300 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Visual Thumbnail */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 border-b border-slate-100">
                  <img
                    src={template.thumbnail || template.image || '/assets/templates/placeholder.svg'}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80';
                    }}
                  />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/95 text-slate-800 shadow-sm backdrop-blur-md">
                      {template.category}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-900 text-white shadow-sm">
                      ${typeof template.price === 'number' ? template.price.toFixed(2) : template.price}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-brand-600 transition-colors line-clamp-1">
                        {template.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        By {template.vendorName || 'Verified Vendor'}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {template.description}
                  </p>

                  {/* Tags */}
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions */}
              <div className="p-5 pt-0">
                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <Link
                    to={`/dashboard/templates/${template.id}`}
                    className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/dashboard/templates/${template.id}`}
                    className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors"
                  >
                    Order Template
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
