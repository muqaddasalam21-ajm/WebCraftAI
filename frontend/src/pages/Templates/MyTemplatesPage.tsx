import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutTemplate,
  Plus,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  ExternalLink,
  Eye,
  Trash2,
  Edit,
  CheckCircle2,
  Clock,
  Archive,
  Download
} from 'lucide-react';
import { templateService } from '../../services/templateService';
import { Template, TemplateStats } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';

export const MyTemplatesPage: React.FC = () => {
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();
  const isVendorOrAdmin = role === 'Vendor' || role === 'Admin' || role === 'Manager';

  const [activeTab, setActiveTab] = useState<'authored' | 'purchased'>(isVendorOrAdmin ? 'authored' : 'purchased');
  const [authoredTemplates, setAuthoredTemplates] = useState<Template[]>([]);
  const [purchasedOrders, setPurchasedOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'authored' && isVendorOrAdmin) {
        const [templatesRes, statsRes] = await Promise.all([
          templateService.getMyTemplates(),
          templateService.getStats()
        ]);
        if (templatesRes.success) {
          setAuthoredTemplates(templatesRes.templates || []);
        }
        if (statsRes.success) {
          setStats(statsRes.stats);
        }
      } else {
        const res = await templateService.getPurchasedTemplates();
        if (res.success) {
          setPurchasedOrders(res.orders || []);
        }
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (templateId: string, newStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => {
    try {
      setStatusUpdating(templateId);
      const res = await templateService.updateStatus(templateId, newStatus);
      if (res.success) {
        setAuthoredTemplates(prev =>
          prev.map(t => (t.id === templateId ? { ...t, status: newStatus } : t))
        );
      }
    } catch (err) {
      console.error('Failed to update template status', err);
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await templateService.deleteTemplate(templateId);
      if (res.success) {
        setAuthoredTemplates(prev => prev.filter(t => t.id !== templateId));
      }
    } catch (err) {
      console.error('Failed to delete template', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Template Hub</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your created website designs and access purchased marketplace templates
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isVendorOrAdmin && (
            <Link
              to="/dashboard/templates/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm shadow-brand-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Template
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {isVendorOrAdmin && (
          <button
            onClick={() => setActiveTab('authored')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'authored'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            My Authored Templates ({authoredTemplates.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab('purchased')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'purchased'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Purchased Templates ({purchasedOrders.length})
        </button>
      </div>

      {/* Vendor Stats Cards (Only in authored tab) */}
      {isVendorOrAdmin && activeTab === 'authored' && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Templates</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalTemplates}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Active (Published)</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.publishedTemplates}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Drafts / Hidden</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.draftTemplates}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Template Sales</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">${stats.totalTemplateSales.toFixed(2)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading templates...</p>
        </div>
      ) : activeTab === 'authored' ? (
        /* Authored Templates Table */
        authoredTemplates.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
            <LayoutTemplate className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No authored templates yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first website template and offer it on the marketplace to generate sales.
            </p>
            <div className="pt-2">
              <Button size="sm" variant="primary" onClick={() => navigate('/dashboard/templates/new')} leftIcon={<Plus className="w-4 h-4" />}>
                Create Website Template
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Template</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Downloads</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {authoredTemplates.map((tpl) => (
                  <tr key={tpl.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <img
                            src={tpl.thumbnail || tpl.image || '/assets/templates/placeholder.svg'}
                            alt={tpl.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&auto=format&fit=crop&q=80';
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{tpl.name}</p>
                          <p className="text-[11px] text-slate-400 truncate max-w-xs">{tpl.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium">{tpl.category}</td>
                    <td className="px-5 py-4 font-bold text-slate-900">${typeof tpl.price === 'number' ? tpl.price.toFixed(2) : tpl.price}</td>
                    <td className="px-5 py-4">
                      <select
                        value={tpl.status || 'PUBLISHED'}
                        disabled={statusUpdating === tpl.id}
                        onChange={(e) => handleStatusChange(tpl.id, e.target.value as any)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border outline-none ${
                          tpl.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : tpl.status === 'ARCHIVED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="PUBLISHED">PUBLISHED</option>
                        <option value="DRAFT">DRAFT</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium">
                      {tpl.downloadsCount ?? tpl.downloads ?? 0}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/dashboard/templates/${tpl.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/dashboard/templates/${tpl.id}/edit`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Edit Template"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(tpl.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Purchased Templates List */
        purchasedOrders.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
            <LayoutTemplate className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No purchased templates yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Explore the Template Marketplace to find ready-to-use website templates for your business.
            </p>
            <div className="pt-2">
              <Button size="sm" variant="primary" onClick={() => navigate('/dashboard/templates')}>
                Browse Template Marketplace
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchasedOrders.map((order) => {
              const details = order.templateDetails;
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs flex flex-col justify-between">
                  <div className="relative aspect-[16/10] bg-slate-100">
                    <img
                      src={details?.templateThumbnail || '/assets/templates/placeholder.svg'}
                      alt={details?.templateName || 'Template'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-slate-800 backdrop-blur-xs">
                      Order #{order.orderNumber}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase text-brand-600 tracking-wider">
                        {details?.templateCategory || 'Website Template'}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-1">
                        {details?.templateName || 'Website Template'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Vendor: <span className="font-semibold text-slate-700">{details?.vendorName || 'Real Vendor'}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">${order.amount.toFixed(2)}</span>
                      <div className="flex gap-2">
                        <Link
                          to={`/dashboard/orders/${order.id}`}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                        >
                          Order Details
                        </Link>
                        {details?.templateId && (
                          <Link
                            to={`/dashboard/templates/${details.templateId}`}
                            className="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-xs font-semibold text-brand-700"
                          >
                            Template Page
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};
