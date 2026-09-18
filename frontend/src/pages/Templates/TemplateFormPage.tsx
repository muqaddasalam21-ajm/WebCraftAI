import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Plus,
  Trash2,
  Image,
  Globe,
  Tag,
  Code2,
  Layers,
  Sparkles
} from 'lucide-react';
import { templateService } from '../../services/templateService';
import { Template, TemplateStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';

export const TemplateFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { currentUser, role } = useAuth();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('E-commerce');
  const [price, setPrice] = useState<number>(49);
  const [thumbnail, setThumbnail] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [status, setStatus] = useState<TemplateStatus>('PUBLISHED');
  const [technology, setTechnology] = useState('React + Tailwind CSS');
  const [version, setVersion] = useState('1.0.0');

  // Multi-item inputs
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const [featureInput, setFeatureInput] = useState('');
  const [features, setFeatures] = useState<string[]>([]);

  const [pageInput, setPageInput] = useState('');
  const [pages, setPages] = useState<string[]>(['Home', 'About', 'Contact']);

  const categories = [
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
    if (isEditing && id) {
      loadTemplate(id);
    }
  }, [id, isEditing]);

  const loadTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      const res = await templateService.getTemplateById(templateId);
      if (res.success && res.template) {
        const t = res.template;
        setName(t.name || '');
        setDescription(t.description || '');
        setCategory(t.category || 'E-commerce');
        setPrice(typeof t.price === 'number' ? t.price : parseFloat(String(t.price).replace(/[^0-9.]/g, '')) || 0);
        setThumbnail(t.thumbnail || t.image || '');
        setPreviewUrl(t.previewUrl || '');
        setDemoUrl(t.demoUrl || '');
        setStatus(t.status || 'PUBLISHED');
        setTechnology(t.technology || 'React + Tailwind CSS');
        setVersion(t.version || '1.0.0');
        setTags(t.tags || []);
        setFeatures(t.features || []);
        setPages(t.pages || ['Home']);
      } else {
        setError(res.error || 'Failed to find template');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading template');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (!tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    setFeatures([...features, featureInput.trim()]);
    setFeatureInput('');
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  const handleAddPage = () => {
    if (!pageInput.trim()) return;
    setPages([...pages, pageInput.trim()]);
    setPageInput('');
  };

  const handleRemovePage = (idx: number) => {
    setPages(pages.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }
    if (price < 0) {
      setError('Price cannot be negative');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: name.trim(),
        description: description.trim(),
        category,
        price: Number(price),
        thumbnail: thumbnail.trim(),
        previewUrl: previewUrl.trim(),
        demoUrl: demoUrl.trim(),
        status,
        technology: technology.trim(),
        version: version.trim(),
        tags,
        features,
        pages
      };

      if (isEditing && id) {
        const res = await templateService.updateTemplate(id, payload);
        if (res.success) {
          navigate('/dashboard/templates');
        } else {
          setError(res.error || 'Failed to update template');
        }
      } else {
        const res = await templateService.createTemplate(payload);
        if (res.success) {
          navigate('/dashboard/templates');
        } else {
          setError(res.error || 'Failed to create template');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error saving template');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600">Loading template data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isEditing ? 'Edit Template' : 'Add New Website Template'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Publish real website templates to the WebCraftAI Template Marketplace
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Info */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400">
            Basic Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Template Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Modern Restaurant & Cafe Website"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Price (USD) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Marketplace Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TemplateStatus)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                >
                  <option value="PUBLISHED">PUBLISHED (Active in Store)</option>
                  <option value="DRAFT">DRAFT (Hidden from Marketplace)</option>
                  <option value="ARCHIVED">ARCHIVED (Discontinued)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Comprehensive description of the layout, ideal target business niche, and components included..."
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Media & URLs */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400">
            Media & Live Links
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Thumbnail / Preview Image URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="https://example.com/thumbnail.png or /assets/templates/..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Leave empty to use the system default template preview.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Live Demo / Preview URL</label>
                <input
                  type="url"
                  value={previewUrl}
                  onChange={(e) => setPreviewUrl(e.target.value)}
                  placeholder="https://demo.example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Technology Stack</label>
                <input
                  type="text"
                  value={technology}
                  onChange={(e) => setTechnology(e.target.value)}
                  placeholder="React + Tailwind CSS"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Features & Pages */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400">
            Features & Pages
          </h3>

          <div className="space-y-4">
            {/* Features */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Features</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder="Add a key feature (e.g. Responsive Hero, Interactive Menu)..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 outline-none"
                />
                <Button type="button" size="sm" variant="outline" onClick={handleAddFeature}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {features.map((f, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs bg-slate-100 text-slate-700">
                    {f}
                    <button type="button" onClick={() => handleRemoveFeature(idx)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Included Pages */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Included Pages</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  placeholder="e.g. Home, Services, Pricing..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPage();
                    }
                  }}
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 outline-none"
                />
                <Button type="button" size="sm" variant="outline" onClick={handleAddPage}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {pages.map((p, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs bg-brand-50 text-brand-700 border border-brand-100">
                    {p}
                    <button type="button" onClick={() => handleRemovePage(idx)} className="text-brand-400 hover:text-rose-600">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tags / Keywords</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="e.g. Minimalist, Modern, Fast..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 outline-none"
                />
                <Button type="button" size="sm" variant="outline" onClick={handleAddTag}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-600">
                    #{tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" size="md" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={saving} leftIcon={<Save className="w-4 h-4" />}>
            {saving ? 'Saving Template...' : isEditing ? 'Update Template' : 'Publish Template'}
          </Button>
        </div>
      </form>
    </div>
  );
};
