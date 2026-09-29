import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Store,
  CheckCircle,
  Mail,
  Phone,
  Calendar,
  Star,
  ArrowLeft,
  ExternalLink,
  Layers,
  ShoppingBag,
  Eye,
  RefreshCw,
  AlertCircle,
  Building2
} from 'lucide-react';
import { vendorService } from '../../services/vendorService';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Template } from '../../types';

export const VendorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [vendor, setVendor] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'templates' | 'products'>('templates');

  const loadVendor = async (vendorId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await vendorService.getVendorById(vendorId);
      if (res.success && res.vendor) {
        setVendor(res.vendor);
      } else {
        setError(res.error || 'Vendor not found.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load vendor profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadVendor(id);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3 bg-white rounded-2xl border border-slate-200/80 p-12">
        <RefreshCw className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading vendor profile from database...</p>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-4 bg-white rounded-2xl border border-rose-100 p-12 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Vendor Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">
            {error || 'The requested vendor profile does not exist or is inactive.'}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/dashboard/vendors')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Return to Vendors Directory
        </Button>
      </div>
    );
  }

  const templates: Template[] = vendor.templates || [];
  const products: any[] = vendor.products || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb */}
      <div>
        <button
          onClick={() => navigate('/dashboard/vendors')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Verified Vendors
        </button>
      </div>

      {/* Vendor Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
              {vendor.name ? vendor.name.charAt(0).toUpperCase() : <Store className="w-8 h-8" />}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {vendor.name}
                </h1>
                <Badge variant={vendor.status === 'Verified' ? 'success' : 'neutral'} size="sm">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {vendor.status} Partner
                </Badge>
              </div>

              {vendor.company && (
                <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {vendor.company}
                </p>
              )}

              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl pt-1">
                {vendor.bio || 'Verified WebCraftAI Template & Product Studio partner.'}
              </p>

              {/* Meta details */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2">
                {vendor.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{vendor.email}</span>
                  </div>
                )}
                {vendor.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{vendor.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Joined {new Date(vendor.joinedDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl self-start">
            <div className="text-center px-2">
              <p className="text-lg font-black text-slate-900">{vendor.templatesCount ?? templates.length}</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Templates</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center px-2">
              <p className="text-lg font-black text-slate-900">{vendor.productsCount ?? products.length}</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Products</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center px-2">
              <div className="flex items-center justify-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="text-lg font-black text-slate-900">{vendor.rating ? vendor.rating.toFixed(1) : '5.0'}</span>
              </div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Rating</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-t border-slate-100 mt-6 pt-6">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'templates'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Published Templates ({templates.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'products'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" />
              Catalog Products ({products.length})
            </span>
          </button>
        </div>
      </div>

      {/* Tab Content: Templates */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {templates.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No published templates yet</p>
              <p className="text-xs text-slate-400 mt-0.5">
                This vendor has not published public website templates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-brand-300 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 border-b border-slate-100">
                      <img
                        src={tpl.thumbnail || tpl.image || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80'}
                        alt={tpl.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/95 text-slate-800 shadow-sm">
                          {tpl.category}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-900 text-white shadow-sm">
                          ${typeof tpl.price === 'number' ? tpl.price.toFixed(2) : tpl.price}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-2">
                      <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-brand-600 transition-colors">
                        {tpl.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 space-y-2">
                    <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <Link
                        to={`/templates/${tpl.id}/preview`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        Live Demo
                      </Link>
                      <Link
                        to={`/dashboard/templates/${tpl.id}`}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                      >
                        Details
                      </Link>
                    </div>
                    <Link
                      to={`/checkout?type=template&id=${tpl.id}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white transition-colors"
                    >
                      Order Template (${typeof tpl.price === 'number' ? tpl.price.toFixed(2) : tpl.price})
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Products */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {products.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No catalog products yet</p>
              <p className="text-xs text-slate-400 mt-0.5">
                This vendor has not published standalone catalog products.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{prod.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 capitalize">{prod.category}</p>
                    </div>
                    <span className="font-mono font-bold text-sm text-slate-900">
                      ${prod.price}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                    <span>Stock: {prod.stock ?? 'Available'}</span>
                    <Badge variant="success" size="sm">Active</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
