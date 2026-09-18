import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  ExternalLink,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Tag,
  Code2,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  Building2,
  Download
} from 'lucide-react';
import { templateService } from '../../services/templateService';
import { Template } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';

export const TemplateDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, role } = useAuth();

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadTemplate(id);
  }, [id]);

  const loadTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await templateService.getTemplateById(templateId);
      if (res.success && res.template) {
        setTemplate(res.template);
      } else {
        setError(res.error || 'Template not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = () => {
    if (!template) return;
    navigate(`/checkout?type=template&id=${template.id}`);
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600">Loading template details...</p>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Template Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'The requested template could not be loaded.'}</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/templates')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Marketplace
        </Button>
      </div>
    );
  }

  const isOwner = currentUser && template.vendorId === currentUser.id;
  const isPrivileged = role === 'Admin' || role === 'Manager' || isOwner;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/dashboard/templates')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </button>

        {isPrivileged && (
          <div className="flex items-center gap-2">
            <Link
              to={`/dashboard/templates/${template.id}/edit`}
              className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Edit Template
            </Link>
          </div>
        )}
      </div>

      {purchaseSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-emerald-900">Template Order Created!</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              Order <span className="font-mono font-bold">#{purchaseSuccess}</span> has been logged to your real account. (Phase 6: Pending payment setup).
            </p>
            <div className="mt-2 flex gap-3">
              <Button size="sm" variant="primary" onClick={() => navigate('/dashboard/orders')}>
                View in My Orders
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Preview & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Media & Detailed Specs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Visual */}
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-xs group">
            <img
              src={template.thumbnail || template.image || '/assets/templates/placeholder.svg'}
              alt={template.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80';
              }}
            />
            <Link
              to={`/dashboard/templates/${template.id}/preview`}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-4 right-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/95 text-slate-800 text-xs font-bold hover:bg-white shadow-md backdrop-blur-sm transition-all hover:scale-105"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Live Demo / Preview
            </Link>
          </div>

          {/* Description & Overview */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">About This Template</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {template.description}
            </p>
          </div>

          {/* Features List */}
          {template.features && template.features.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                Key Features Included
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {template.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Included Pages */}
          {template.pages && template.pages.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600" />
                Pages & Layouts Included
              </h3>
              <div className="flex flex-wrap gap-2">
                {template.pages.map((p, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-100">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Price, Vendor & Purchase Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-6 shadow-xs sticky top-20">
            {/* Category & Status */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {template.category}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                template.status === 'PUBLISHED'
                  ? 'bg-emerald-100 text-emerald-700'
                  : template.status === 'ARCHIVED'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {template.status || 'PUBLISHED'}
              </span>
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900">{template.name}</h1>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Created by <span className="font-semibold text-slate-700">{template.vendorName || 'Real Vendor'}</span>
              </p>
            </div>

            {/* Price Display */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  ${typeof template.price === 'number' ? template.price.toFixed(2) : template.price}
                </span>
                <span className="text-xs text-slate-400 font-medium">one-time license</span>
              </div>
            </div>

            {/* Purchase CTA */}
            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center"
                onClick={handlePurchase}
                disabled={purchasing || template.status !== 'PUBLISHED'}
                leftIcon={<ShoppingCart className="w-4 h-4" />}
              >
                {purchasing ? 'Processing Order...' : 'Order / Use Template'}
              </Button>

              <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Real order recorded to authenticated user account
              </p>
            </div>

            {/* Technical Meta Specs */}
            <div className="pt-6 border-t border-slate-100 space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Code2 className="w-3.5 h-3.5" /> Technology
                </span>
                <span className="font-semibold text-slate-800">{template.technology || 'React + Tailwind'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Layers className="w-3.5 h-3.5" /> Version
                </span>
                <span className="font-semibold text-slate-800">{template.version || '1.0.0'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Download className="w-3.5 h-3.5" /> Downloads
                </span>
                <span className="font-semibold text-slate-800">{template.downloadsCount ?? template.downloads ?? 0}</span>
              </div>
            </div>

            {/* Tags */}
            {template.tags && template.tags.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 block mb-2 uppercase">Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {template.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
