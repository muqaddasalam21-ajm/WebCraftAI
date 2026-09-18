import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Eye,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Layers,
  Palette,
  Globe,
  Mail,
  Phone,
  MapPin,
  HelpCircle,
  Clock,
  ChevronRight,
  FolderGit2
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { aiWebsiteService } from '../../services/aiWebsiteService';
import { AiWebsiteInput, WebsiteSpecification } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export const AIBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Form state
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('E-commerce & Retail');
  const [description, setDescription] = useState('');
  const [websitePurpose, setWebsitePurpose] = useState('Generate leads and client bookings');
  const [requiredPages, setRequiredPages] = useState<string[]>([
    'Home',
    'About Us',
    'Services',
    'Testimonials',
    'Contact'
  ]);
  const [customPage, setCustomPage] = useState('');
  const [services, setServices] = useState<Array<{ title: string; description: string; price?: string }>>([
    { title: 'Core Strategy Consulting', description: 'Comprehensive roadmap designed to accelerate brand growth and market visibility.', price: 'From $499' },
    { title: 'Full Implementation', description: 'End-to-end execution utilizing modern best practices and premium craftsmanship.', price: 'From $1,299' }
  ]);
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [referenceWebsite, setReferenceWebsite] = useState('');
  const [preferredStyle, setPreferredStyle] = useState('Modern & Clean');

  // Palette state
  const [primaryColor, setPrimaryColor] = useState('#059669'); // Emerald
  const [secondaryColor, setSecondaryColor] = useState('#064e3b'); // Forest
  const [accentColor, setAccentColor] = useState('#10b981'); // Mint
  const [activePreset, setActivePreset] = useState('Emerald & Forest');

  // Generation & progress state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Saved websites state
  const [websites, setWebsites] = useState<WebsiteSpecification[]>([]);
  const [isLoadingWebsites, setIsLoadingWebsites] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const generationSteps = [
    'Analyzing business positioning, vertical, and target audience...',
    'Architecting multi-page sitemap & structural navigation...',
    'Synthesizing bespoke copywriting, hero hooks, and signature offerings...',
    'Generating harmonious emerald theme tokens and responsive layouts...',
    'Assembling live interactive website specification...'
  ];

  const colorPresets = [
    {
      name: 'Emerald & Forest',
      primary: '#059669',
      secondary: '#064e3b',
      accent: '#10b981',
      desc: 'Signature WebCraftAI professional green palette'
    },
    {
      name: 'Modern Slate',
      primary: '#0f172a',
      secondary: '#334155',
      accent: '#38bdf8',
      desc: 'Tech, corporate, and minimalist SaaS'
    },
    {
      name: 'Warm Sand & Walnut',
      primary: '#78350f',
      secondary: '#451a03',
      accent: '#d97706',
      desc: 'Architecture, furniture, and artisanal goods'
    },
    {
      name: 'Ocean Breeze',
      primary: '#0284c7',
      secondary: '#075985',
      accent: '#38bdf8',
      desc: 'Health, wellness, travel, and logistics'
    }
  ];

  const standardPageOptions = [
    'Home',
    'About Us',
    'Services',
    'Products',
    'Pricing',
    'Testimonials',
    'FAQ',
    'Contact'
  ];

  const loadWebsites = async () => {
    setIsLoadingWebsites(true);
    try {
      const res = await aiWebsiteService.getWebsites();
      setWebsites(res.websites);
    } catch (err: any) {
      console.error('Failed to load websites:', err);
    } finally {
      setIsLoadingWebsites(false);
    }
  };

  useEffect(() => {
    loadWebsites();
  }, []);

  const handleApplyPreset = (preset: typeof colorPresets[0]) => {
    setActivePreset(preset.name);
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setAccentColor(preset.accent);
  };

  const handleTogglePage = (pageName: string) => {
    if (pageName === 'Home') return; // Home is always required
    if (requiredPages.includes(pageName)) {
      setRequiredPages(requiredPages.filter(p => p !== pageName));
    } else {
      setRequiredPages([...requiredPages, pageName]);
    }
  };

  const handleAddCustomPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPage.trim()) return;
    const clean = customPage.trim();
    if (!requiredPages.includes(clean)) {
      setRequiredPages([...requiredPages, clean]);
    }
    setCustomPage('');
  };

  const handleAddService = () => {
    setServices([
      ...services,
      { title: 'New Signature Service', description: 'Bespoke offering tailored to customer specifications.', price: 'Custom Quote' }
    ]);
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index: number, field: string, value: string) => {
    const updated = [...services];
    (updated[index] as any)[field] = value;
    setServices(updated);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!businessName.trim()) {
      setError('Please provide your business or website name.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a brief business description.');
      return;
    }

    setIsGenerating(true);
    setGenerationStep(0);

    // Live progress simulation ticker
    const interval = setInterval(() => {
      setGenerationStep(prev => (prev < generationSteps.length - 1 ? prev + 1 : prev));
    }, 1100);

    try {
      const payload: AiWebsiteInput = {
        businessName: businessName.trim(),
        businessType,
        description: description.trim(),
        websitePurpose,
        requiredPages,
        servicesOrProducts: services.filter(s => s.title.trim() !== ''),
        contactInfo: {
          email: contactEmail.trim() || currentUser?.email || 'contact@example.com',
          phone: contactPhone.trim(),
          address: contactAddress.trim()
        },
        preferredColors: {
          primary: primaryColor,
          secondary: secondaryColor,
          accent: accentColor,
          themeName: activePreset
        },
        preferredStyle,
        referenceWebsite: referenceWebsite.trim() || undefined
      };

      const res = await aiWebsiteService.generateWebsite(payload);
      clearInterval(interval);
      // Navigate straight to preview of the real generated website
      navigate(`/dashboard/ai-builder/${res.website.id}/preview`);
    } catch (err: any) {
      clearInterval(interval);
      setError(err?.message || 'AI generation failed. Please try again.');
      setIsGenerating(false);
    }
  };

  const handleDeleteWebsite = async (id: string) => {
    if (!confirm('Are you sure you want to delete this generated website?')) return;
    setDeletingId(id);
    try {
      await aiWebsiteService.deleteWebsite(id);
      setWebsites(prev => prev.filter(w => w.id !== id));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete website.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* 1. HERO HEADER */}
      <div className="relative rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-950 p-6 sm:p-8 text-white overflow-hidden shadow-lg shadow-brand-950/20 border border-brand-800/60">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-accent-mint/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent-cyan/20 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-bold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-accent-mint" />
              <span>Phase 9 · Autonomous AI Website Architecture</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              AI Website Builder Studio
            </h2>

            <p className="text-sm text-brand-100/80 max-w-xl leading-relaxed">
              Describe your brand, services, and aesthetic preferences. Our AI architect crafts a complete, multi-page website specification ready for instant desktop and mobile preview.
            </p>
          </div>

          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <img
              src="/assets/3d/hero-3d.svg"
              alt="AI Builder 3D"
              className="w-44 sm:w-52 h-auto object-contain drop-shadow-xl animate-float"
            />
          </div>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="underline ml-4">Dismiss</button>
        </div>
      )}

      {/* GENERATION IN PROGRESS MODAL / OVERLAY */}
      {isGenerating && (
        <div className="bg-white rounded-3xl p-8 border border-brand-200 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center mx-auto text-brand-600 shadow-inner">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Generating Website for {businessName}...
            </h3>
            <p className="text-xs text-brand-700 font-semibold animate-pulse">
              {generationSteps[generationStep]}
            </p>
          </div>

          {/* Progress step checklist */}
          <div className="max-w-lg mx-auto bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left space-y-2.5">
            {generationSteps.map((step, idx) => {
              const isDone = idx < generationStep;
              const isCurrent = idx === generationStep;
              return (
                <div key={idx} className="flex items-center gap-2.5 text-xs">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                  )}
                  <span className={isDone ? 'text-slate-800 font-medium' : isCurrent ? 'text-brand-800 font-bold' : 'text-slate-400'}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MAIN BUILDER FORM (Hidden while generating) */}
      {!isGenerating && (
        <form onSubmit={handleGenerate} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-8">
          {/* SECTION 1: BUSINESS BASICS */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Globe className="w-5 h-5 text-brand-600" />
                1. Business &amp; Website Identity
              </h3>
              <p className="text-xs text-slate-500">
                Foundational details that anchor your website copy and content structure.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Business / Brand Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Lumina Modern Living"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-xl text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Business Type / Industry <span className="text-rose-500">*</span>
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl text-sm outline-none font-medium"
                >
                  <option>E-commerce &amp; Retail</option>
                  <option>Professional Services &amp; Consulting</option>
                  <option>Restaurant, Cafe &amp; Hospitality</option>
                  <option>SaaS, Software &amp; Technology</option>
                  <option>Health, Wellness &amp; Fitness</option>
                  <option>Real Estate &amp; Architecture</option>
                  <option>Portfolio &amp; Creative Studio</option>
                  <option>Education, Coaching &amp; Courses</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Business Description &amp; Core Mission <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what your business does, your target clients, and what makes your approach unique..."
                rows={3}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-xl text-sm outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Primary Website Objective
                </label>
                <select
                  value={websitePurpose}
                  onChange={(e) => setWebsitePurpose(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl text-sm outline-none font-medium"
                >
                  <option>Generate leads and client bookings</option>
                  <option>Sell products online through e-commerce</option>
                  <option>Showcase portfolio and case studies</option>
                  <option>Build authority, brand awareness, and inform</option>
                  <option>Collect user signups and demo requests</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Reference Website URL (Optional)
                </label>
                <input
                  type="url"
                  value={referenceWebsite}
                  onChange={(e) => setReferenceWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl text-sm outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: PAGES & SITEMAP */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-600" />
                2. Required Pages &amp; Architecture
              </h3>
              <p className="text-xs text-slate-500">
                Select the pages to include in the generated navigation and sitemap.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {standardPageOptions.map((page) => {
                const isSelected = requiredPages.includes(page);
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handleTogglePage(page)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Custom page adder */}
            <div className="flex items-center gap-2 max-w-sm">
              <input
                type="text"
                value={customPage}
                onChange={(e) => setCustomPage(e.target.value)}
                placeholder="Add custom page..."
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-brand-500"
              />
              <Button type="button" size="sm" variant="outline" onClick={handleAddCustomPage}>
                Add Page
              </Button>
            </div>
          </div>

          {/* SECTION 3: SERVICES & OFFERINGS */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-600" />
                  3. Services or Products
                </h3>
                <p className="text-xs text-slate-500">
                  Highlight key offerings you want featured in dedicated service cards.
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={handleAddService} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Service
              </Button>
            </div>

            <div className="space-y-3">
              {services.map((svc, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl relative space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Service Offering #{idx + 1}
                    </span>
                    {services.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveService(idx)}
                        className="text-slate-400 hover:text-rose-600 text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Service Title"
                      value={svc.title}
                      onChange={(e) => handleServiceChange(idx, 'title', e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-brand-500"
                    />
                    <input
                      type="text"
                      placeholder="Pricing (e.g. From $499)"
                      value={svc.price || ''}
                      onChange={(e) => handleServiceChange(idx, 'price', e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-brand-500"
                    />
                    <input
                      type="text"
                      placeholder="Brief Description"
                      value={svc.description}
                      onChange={(e) => handleServiceChange(idx, 'description', e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-brand-500 sm:col-span-3"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: COLOR PALETTE & STYLE */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Palette className="w-5 h-5 text-brand-600" />
                4. Visual Style &amp; Brand Palette
              </h3>
              <p className="text-xs text-slate-500">
                Select a cohesive theme preset or define custom hex color tokens.
              </p>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {colorPresets.map((preset) => {
                const isActive = activePreset === preset.name;
                return (
                  <div
                    key={preset.name}
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isActive
                        ? 'bg-brand-50/50 border-brand-500 ring-2 ring-brand-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: preset.primary }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.secondary }} />
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.accent }} />
                    </div>
                    <div className="font-bold text-xs text-slate-900">{preset.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{preset.desc}</div>
                  </div>
                );
              })}
            </div>

            {/* Custom Palette Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Color (Headings &amp; Buttons)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => {
                      setPrimaryColor(e.target.value);
                      setActivePreset('Custom');
                    }}
                    className="w-9 h-9 rounded-xl border-0 cursor-pointer p-0.5 bg-slate-100"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border rounded-lg text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Secondary Color (Deep Contrast)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => {
                      setSecondaryColor(e.target.value);
                      setActivePreset('Custom');
                    }}
                    className="w-9 h-9 rounded-xl border-0 cursor-pointer p-0.5 bg-slate-100"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border rounded-lg text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Accent Color (Mint / Badges)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => {
                      setAccentColor(e.target.value);
                      setActivePreset('Custom');
                    }}
                    className="w-9 h-9 rounded-xl border-0 cursor-pointer p-0.5 bg-slate-100"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border rounded-lg text-xs font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Visual Style Aesthetic
              </label>
              <select
                value={preferredStyle}
                onChange={(e) => setPreferredStyle(e.target.value)}
                className="w-full sm:w-80 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-semibold"
              >
                <option>Modern &amp; Clean</option>
                <option>Minimalist &amp; Elegant</option>
                <option>Bold &amp; Dynamic</option>
                <option>Warm &amp; Organic</option>
                <option>Luxury Editorial</option>
              </select>
            </div>
          </div>

          {/* SECTION 5: CONTACT INFORMATION */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Mail className="w-5 h-5 text-brand-600" />
                5. Contact &amp; Business Inquiries
              </h3>
              <p className="text-xs text-slate-500">
                Displayed in the contact section and footer of your website.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="hello@yourbusiness.com"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Location / Address (Optional)
                </label>
                <input
                  type="text"
                  value={contactAddress}
                  onChange={(e) => setContactAddress(e.target.value)}
                  placeholder="San Francisco, CA"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">
              ⚡ Generation takes 2–4 seconds using real contextual AI inference.
            </p>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              leftIcon={<Sparkles className="w-5 h-5 text-accent-mint" />}
              className="w-full sm:w-auto px-8 font-bold shadow-md"
            >
              Generate Website with AI
            </Button>
          </div>
        </form>
      )}

      {/* 2. SAVED GENERATED WEBSITES SECTION */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              My Generated Websites
            </h3>
            <p className="text-xs text-slate-500">
              Persistent specifications stored in real database. Click preview to inspect responsive designs.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadWebsites} leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingWebsites ? 'animate-spin' : ''}`} />}>
            Refresh
          </Button>
        </div>

        {isLoadingWebsites ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-600 mx-auto mb-2" />
            <span className="text-xs font-semibold text-slate-500">Loading saved websites...</span>
          </div>
        ) : websites.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
            <Globe className="w-10 h-10 text-slate-300 mx-auto mb-1" />
            <h4 className="font-bold text-slate-800 text-sm">No websites generated yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Fill in the form above and click "Generate Website with AI" to create your first persistent specification.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {websites.map((site) => (
              <div
                key={site.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 px-2 py-0.5 rounded-md bg-brand-50 border border-brand-200">
                      {site.businessType}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      v{site.version || site.aiMetadata?.version || 1}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base line-clamp-1">
                    {site.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {site.tagline || site.description}
                  </p>

                  {/* Palette Preview */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <div className="w-4 h-4 rounded-full border border-white shadow-xs" style={{ backgroundColor: site.colors?.primary || '#059669' }} />
                    <div className="w-4 h-4 rounded-full border border-white shadow-xs" style={{ backgroundColor: site.colors?.secondary || '#064e3b' }} />
                    <div className="w-4 h-4 rounded-full border border-white shadow-xs" style={{ backgroundColor: site.colors?.accent || '#10b981' }} />
                    <span className="text-[10px] text-slate-400 ml-1.5">
                      {site.pages?.length || 1} pages · {typeof site.theme === 'string' ? site.theme : (site.theme as any)?.style || 'Modern & Clean'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {new Date(site.updatedAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDeleteWebsite(site.id)}
                      disabled={deletingId === site.id}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete website"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => navigate(`/dashboard/ai-builder/${site.id}/preview`)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Live Preview
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
