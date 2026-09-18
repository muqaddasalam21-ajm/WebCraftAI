import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Monitor,
  Tablet,
  Smartphone,
  ArrowLeft,
  RefreshCw,
  Edit3,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Menu,
  X,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Send,
  Star,
  History,
  Check,
  RotateCcw,
  Tag
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { aiWebsiteService } from '../../services/aiWebsiteService';
import { WebsiteSpecification, CanonicalPage, CanonicalSection, WebsiteVersionSnapshot, SectionType } from '../../types';

export const AIWebsitePreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [website, setWebsite] = useState<WebsiteSpecification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Viewport mode: 'desktop' | 'tablet' | 'mobile'
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Active page for multi-page rendering
  const [activePageSlug, setActivePageSlug] = useState<string>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Regenerate modal state
  const [isRegenModalOpen, setIsRegenModalOpen] = useState(false);
  const [regenInstructions, setRegenInstructions] = useState('');
  const [regenStyle, setRegenStyle] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Version history modal state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [versions, setVersions] = useState<WebsiteVersionSnapshot[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Contact form submission simulator
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const fetchWebsite = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await aiWebsiteService.getWebsiteById(id);
      setWebsite(res.website);
      setRegenStyle(res.website.theme);
    } catch (err: any) {
      setError(err?.message || 'Failed to load website specification.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVersions = async () => {
    if (!id) return;
    setIsLoadingVersions(true);
    try {
      const res = await aiWebsiteService.getWebsiteVersions(id);
      setVersions(res.versions);
    } catch (err: any) {
      console.error('Failed to load version history:', err);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  useEffect(() => {
    fetchWebsite();
  }, [id]);

  const handleRegenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !website) return;

    setIsRegenerating(true);
    try {
      const res = await aiWebsiteService.regenerateWebsite(id, {
        description: regenInstructions.trim()
          ? `${website.description}. Additional directive: ${regenInstructions.trim()}`
          : website.description,
        preferredStyle: regenStyle || website.theme,
        changeNote: regenInstructions.trim() || 'AI Prompt Refinement'
      } as any);

      setWebsite(res.website);
      setIsRegenModalOpen(false);
      setRegenInstructions('');
      alert(`Website regenerated successfully! Updated to version ${res.website.version}.`);
    } catch (err: any) {
      alert(err?.message || 'Regeneration failed.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRestoreVersion = async (targetVersion: number) => {
    if (!id) return;
    if (!window.confirm(`Are you sure you want to restore revision v${targetVersion}? Current state will be preserved as a new version.`)) {
      return;
    }

    setIsRestoring(true);
    try {
      const res = await aiWebsiteService.restoreWebsiteVersion(id, targetVersion);
      setWebsite(res.website);
      setIsHistoryModalOpen(false);
      alert(`Revision v${targetVersion} restored successfully! Active version is now v${res.website.version}.`);
    } catch (err: any) {
      alert(err?.message || 'Failed to restore revision.');
    } finally {
      setIsRestoring(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-600" />
        <p className="text-sm font-semibold text-slate-600">Loading website preview specification...</p>
      </div>
    );
  }

  if (error || !website) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 max-w-md mx-auto text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Unable to load website preview</h3>
        <p className="text-xs text-slate-500">{error || 'Website project not found.'}</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/ai-builder')}>
          Back to AI Builder Studio
        </Button>
      </div>
    );
  }

  // Active page fallback
  const activePage: CanonicalPage =
    website.pages.find((p) => p.slug === activePageSlug) || website.pages[0] || {
      id: 'default',
      name: 'Home',
      slug: 'home',
      title: website.title,
      sections: website.sections || []
    };

  // Color theme variables
  const colors = website.colors || {
    primary: '#059669',
    secondary: '#064e3b',
    accent: '#10b981',
    background: '#ffffff',
    text: '#0f172a'
  };

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile':
        return 'w-[375px] shadow-2xl';
      case 'tablet':
        return 'w-[768px] shadow-xl';
      case 'desktop':
      default:
        return 'w-full max-w-6xl shadow-md';
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. TOP CONTROL BAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left: Back & Project Title */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button
            onClick={() => navigate('/dashboard/ai-builder')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
            title="Back to Studio"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">{website.title}</h2>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                v{website.version}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Provider: {website.aiMetadata?.provider || 'webcraft-engine'} · Theme: {website.theme}
            </p>
          </div>
        </div>

        {/* Viewport Toggles */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewport('desktop')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewport === 'desktop' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Desktop View"
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewport === 'tablet' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Tablet View"
          >
            <Tablet className="w-4 h-4" />
            <span className="hidden sm:inline">Tablet</span>
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewport === 'mobile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Mobile View"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadVersions();
              setIsHistoryModalOpen(true);
            }}
            leftIcon={<History className="w-3.5 h-3.5" />}
          >
            Revisions (v{website.version})
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRegenModalOpen(true)}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Regenerate with AI
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/dashboard/orders/new-website')}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-accent-mint" />}
          >
            Commission Real Build
          </Button>
        </div>
      </div>

      {/* 2. DRAFT NOTICE BANNER */}
      <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center justify-between text-xs text-amber-900 font-medium">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Draft Website Preview Mode:</strong> This canonical specification is stored in your database. The website is not yet publicly published.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden md:inline-block font-mono text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
            ID: {website.id}
          </span>
        </div>
      </div>

      {/* 3. INTERACTIVE RENDERED WEBSITES CANVAS */}
      <div className="flex justify-center transition-all">
        <div
          className={`${getViewportWidth()} bg-white rounded-3xl border border-slate-200 overflow-hidden transition-all duration-300`}
          style={{
            fontFamily: website.typography?.bodyFont || 'Inter, sans-serif',
            backgroundColor: colors.background,
            color: colors.text
          }}
        >
          {/* HEADER / NAVIGATION */}
          <header
            className="sticky top-0 z-30 border-b backdrop-blur-md px-6 py-4 flex items-center justify-between transition-colors"
            style={{
              borderColor: `${colors.primary}15`,
              backgroundColor: `${colors.background}ee`
            }}
          >
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActivePageSlug('home')}>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-xs"
                style={{ backgroundColor: colors.primary }}
              >
                {website.businessName.charAt(0).toUpperCase()}
              </div>
              <span className="font-extrabold text-base tracking-tight" style={{ color: colors.text }}>
                {website.businessName}
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold">
              {website.pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => setActivePageSlug(page.slug)}
                  className={`transition-colors capitalize ${
                    activePageSlug === page.slug ? 'font-bold' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    color: activePageSlug === page.slug ? colors.primary : colors.text
                  }}
                >
                  {page.name || page.title}
                </button>
              ))}
            </nav>

            {/* Header CTA */}
            <div className="hidden md:block">
              <button
                onClick={() => {
                  const contactSec = document.getElementById('contact-section');
                  if (contactSec) contactSec.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: colors.primary }}
              >
                Get in Touch
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg border text-slate-600"
              style={{ borderColor: `${colors.primary}30` }}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </header>

          {/* Mobile Navigation Dropdown */}
          {mobileMenuOpen && (
            <div
              className="md:hidden p-4 border-b space-y-2"
              style={{ backgroundColor: colors.background, borderColor: `${colors.primary}20` }}
            >
              {website.pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => {
                    setActivePageSlug(page.slug);
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 px-3 rounded-lg text-xs font-semibold"
                  style={{
                    backgroundColor: activePageSlug === page.slug ? `${colors.primary}15` : 'transparent',
                    color: activePageSlug === page.slug ? colors.primary : colors.text
                  }}
                >
                  {page.name || page.title}
                </button>
              ))}
            </div>
          )}

          {/* PAGE CONTENT RENDERING */}
          <main className="space-y-16 py-8">
            {activePage.sections
              .filter((sec) => sec.visible !== false)
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((section) => (
                <RenderCanonicalSection
                  key={section.id}
                  section={section}
                  colors={colors}
                  brandName={website.businessName}
                  contactInfo={website.footer.contactInfo}
                  contactSubmitted={contactSubmitted}
                  onContactSubmit={() => setContactSubmitted(true)}
                />
              ))}
          </main>

          {/* FOOTER */}
          <footer
            className="border-t px-6 sm:px-12 py-12 space-y-8"
            style={{
              backgroundColor: `${colors.background}`,
              borderColor: `${colors.primary}20`,
              color: colors.text
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {website.businessName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-sm tracking-tight" style={{ color: colors.text }}>
                    {website.businessName}
                  </span>
                </div>
                <p className="text-xs leading-relaxed max-w-sm opacity-80">
                  {website.footer.brandDescription}
                </p>
              </div>

              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider mb-3" style={{ color: colors.text }}>
                  Navigation
                </h5>
                <ul className="space-y-2 text-xs">
                  {website.pages.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => setActivePageSlug(p.slug)}
                        className="hover:underline transition-all opacity-80 hover:opacity-100"
                      >
                        {p.name || p.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider mb-3" style={{ color: colors.text }}>
                  Direct Contact
                </h5>
                <ul className="space-y-2 text-xs opacity-80">
                  {website.footer.contactInfo?.email && (
                    <li className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{website.footer.contactInfo.email}</span>
                    </li>
                  )}
                  {website.footer.contactInfo?.phone && (
                    <li className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{website.footer.contactInfo.phone}</span>
                    </li>
                  )}
                  {website.footer.contactInfo?.address && (
                    <li className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{website.footer.contactInfo.address}</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between text-xs">
              <p className="opacity-80">{website.footer.copyright}</p>
              <p className="text-[11px] opacity-70">
                Canonical Website Specification (v{website.version})
              </p>
            </div>
          </footer>
        </div>
      </div>

      {/* 4. REGENERATE MODAL */}
      {isRegenModalOpen && (
        <Modal
          isOpen={isRegenModalOpen}
          onClose={() => setIsRegenModalOpen(false)}
          title="Regenerate Website Content with AI"
          subtitle={`Updating canonical specification (currently v${website.version})`}
        >
          <form onSubmit={handleRegenerate} className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Refinement Instructions (Optional)
              </label>
              <textarea
                value={regenInstructions}
                onChange={(e) => setRegenInstructions(e.target.value)}
                placeholder="e.g. Make the hero headline bolder, add an FAQ section, emphasize premium quality..."
                rows={3}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:bg-white focus:border-brand-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Visual Style
              </label>
              <select
                value={regenStyle}
                onChange={(e) => setRegenStyle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold"
              >
                <option>Modern &amp; Clean</option>
                <option>Minimalist &amp; Elegant</option>
                <option>Bold &amp; Dynamic</option>
                <option>Warm &amp; Organic</option>
                <option>Luxury Editorial</option>
              </select>
            </div>

            <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-brand-800 text-[11px] font-medium">
              💡 Regeneration maintains your website ID, updates your canonical database record, and snapshots your current version in revision history.
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsRegenModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isRegenerating}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-accent-mint" />}
              >
                {isRegenerating ? 'Regenerating Specification...' : 'Apply AI Regeneration'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 5. REVISION HISTORY MODAL */}
      {isHistoryModalOpen && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title="Specification Revision History"
          subtitle={`Inspect and restore previous versions for "${website.title}"`}
        >
          <div className="space-y-4 py-2 text-xs">
            {isLoadingVersions ? (
              <div className="py-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-brand-600 mx-auto" />
                <p className="text-slate-500">Loading version snapshots...</p>
              </div>
            ) : versions.length === 0 ? (
              <p className="text-slate-500 py-6 text-center">No previous revisions recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {versions.map((ver) => (
                  <div
                    key={ver.version}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      ver.version === website.version
                        ? 'bg-emerald-50/70 border-emerald-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">Revision v{ver.version}</span>
                        {ver.version === website.version && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                            Current Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {ver.changeNote || 'Specification snapshot'} · {new Date(ver.savedAt).toLocaleString()}
                      </p>
                    </div>

                    {ver.version !== website.version && (
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={isRestoring}
                        leftIcon={<RotateCcw className="w-3 h-3" />}
                        onClick={() => handleRestoreVersion(ver.version)}
                      >
                        Restore
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsHistoryModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ==========================================
// CANONICAL SECTION COMPONENT RENDERER
// ==========================================
interface RenderCanonicalSectionProps {
  section: CanonicalSection;
  colors: WebsiteSpecification['colors'];
  brandName: string;
  contactInfo: WebsiteSpecification['footer']['contactInfo'];
  contactSubmitted: boolean;
  onContactSubmit: () => void;
}

const RenderCanonicalSection: React.FC<RenderCanonicalSectionProps> = ({
  section,
  colors,
  brandName,
  contactInfo,
  contactSubmitted,
  onContactSubmit
}) => {
  const content = section.content || {};
  const data = section.data || {};
  const secType = section.type.toUpperCase() as SectionType;

  switch (secType) {
    case 'HERO':
      return (
        <section className="px-6 sm:px-12 py-12 lg:py-20 text-center max-w-4xl mx-auto space-y-6">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-2xs"
            style={{
              backgroundColor: `${colors.primary}15`,
              color: colors.primary
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{brandName} Excellence</span>
          </div>

          <h1
            className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight"
            style={{ color: colors.text }}
          >
            {content.heading || `${brandName} Solutions`}
          </h1>

          <p className="text-sm sm:text-base leading-relaxed max-w-2xl mx-auto opacity-80" style={{ color: colors.text }}>
            {content.subheading}
          </p>

          {content.body && (
            <p className="text-xs sm:text-sm leading-relaxed max-w-xl mx-auto opacity-75" style={{ color: colors.text }}>
              {content.body}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {content.primaryCta && (
              <button
                className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:opacity-95 active:scale-95"
                style={{ backgroundColor: colors.primary }}
              >
                {content.primaryCta.label}
              </button>
            )}
            {content.secondaryCta && (
              <button
                className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold border transition-all hover:bg-slate-50 active:scale-95"
                style={{
                  borderColor: `${colors.primary}40`,
                  color: colors.text
                }}
              >
                {content.secondaryCta.label}
              </button>
            )}
          </div>

          {content.imagePlaceholder && (
            <div className="pt-8 max-w-3xl mx-auto">
              <img
                src={content.imagePlaceholder}
                alt="Hero visual"
                className="w-full h-64 sm:h-80 object-cover rounded-3xl shadow-lg border"
                style={{ borderColor: `${colors.primary}20` }}
              />
            </div>
          )}
        </section>
      );

    case 'SERVICES':
    case 'PRODUCTS':
    case 'FEATURES':
      const items = data.items || [];
      return (
        <section id="services" className="px-6 sm:px-12 py-12 space-y-8 max-w-6xl mx-auto">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: colors.text }}>
              {content.heading}
            </h2>
            {content.subheading && (
              <p className="text-xs sm:text-sm opacity-80" style={{ color: colors.text }}>
                {content.subheading}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item: any, i: number) => (
              <div
                key={i}
                className="p-6 rounded-3xl border shadow-xs transition-all hover:shadow-md space-y-3 flex flex-col justify-between"
                style={{
                  backgroundColor: `${colors.primary}05`,
                  borderColor: `${colors.primary}15`
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-2xs"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {item.icon ? item.icon.charAt(0) : '★'}
                    </div>
                    {item.tag && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${colors.accent}20`,
                          color: colors.secondary
                        }}
                      >
                        {item.tag}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base" style={{ color: colors.text }}>
                    {item.title}
                  </h3>

                  <p className="text-xs leading-relaxed opacity-80" style={{ color: colors.text }}>
                    {item.description}
                  </p>
                </div>

                {item.price && (
                  <div className="pt-3 border-t border-slate-200/50 flex items-center justify-between">
                    <span className="font-black text-sm" style={{ color: colors.primary }}>
                      {item.price}
                    </span>
                    <button
                      className="text-xs font-bold underline"
                      style={{ color: colors.secondary }}
                    >
                      Learn more
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      );

    case 'ABOUT':
      return (
        <section className="px-6 sm:px-12 py-12 max-w-5xl mx-auto">
          <div
            className="p-8 sm:p-12 rounded-3xl border grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            style={{
              backgroundColor: `${colors.primary}05`,
              borderColor: `${colors.primary}20`
            }}
          >
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: colors.primary }}>
                About Our Vision
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: colors.text }}>
                {content.heading}
              </h2>
              <p className="text-xs sm:text-sm font-medium leading-relaxed" style={{ color: colors.secondary }}>
                {content.subheading}
              </p>
              {content.body && (
                <p className="text-xs leading-relaxed opacity-80" style={{ color: colors.text }}>
                  {content.body}
                </p>
              )}
            </div>

            <div>
              {content.imagePlaceholder ? (
                <img
                  src={content.imagePlaceholder}
                  alt="About"
                  className="w-full h-64 object-cover rounded-2xl shadow-md border"
                  style={{ borderColor: `${colors.primary}20` }}
                />
              ) : (
                <div
                  className="w-full h-64 rounded-2xl flex items-center justify-center text-center p-6 border border-dashed"
                  style={{ borderColor: `${colors.primary}40`, backgroundColor: `${colors.primary}08` }}
                >
                  <p className="text-xs font-semibold" style={{ color: colors.primary }}>
                    {brandName} Visual Placeholder
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      );

    case 'TESTIMONIALS':
      const testItems = data.items || [];
      return (
        <section className="px-6 sm:px-12 py-12 space-y-8 max-w-6xl mx-auto">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: colors.text }}>
              {content.heading}
            </h2>
            {content.subheading && (
              <p className="text-xs sm:text-sm opacity-80" style={{ color: colors.text }}>
                {content.subheading}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testItems.map((item: any, i: number) => (
              <div
                key={i}
                className="p-6 rounded-3xl border shadow-xs space-y-3"
                style={{
                  backgroundColor: `${colors.primary}05`,
                  borderColor: `${colors.primary}15`
                }}
              >
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>

                <p className="text-xs italic leading-relaxed" style={{ color: colors.text }}>
                  "{item.description}"
                </p>

                <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between">
                  <span className="font-bold text-xs" style={{ color: colors.text }}>
                    {item.title}
                  </span>
                  {item.tag && (
                    <span className="text-[10px] text-slate-400">
                      {item.tag}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    case 'CONTACT':
      return (
        <section id="contact-section" className="px-6 sm:px-12 py-12 max-w-5xl mx-auto">
          <div
            className="p-8 sm:p-12 rounded-3xl border shadow-sm space-y-8"
            style={{
              backgroundColor: `${colors.primary}05`,
              borderColor: `${colors.primary}20`
            }}
          >
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: colors.text }}>
                {content.heading}
              </h2>
              {content.subheading && (
                <p className="text-xs sm:text-sm opacity-80" style={{ color: colors.text }}>
                  {content.subheading}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Direct Info */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm" style={{ color: colors.text }}>
                  Contact Channels
                </h4>
                <div className="space-y-3 text-xs opacity-85" style={{ color: colors.text }}>
                  {contactInfo?.email && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                        <Mail className="w-4 h-4" />
                      </div>
                      <span>{contactInfo.email}</span>
                    </div>
                  )}
                  {contactInfo?.phone && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                        <Phone className="w-4 h-4" />
                      </div>
                      <span>{contactInfo.phone}</span>
                    </div>
                  )}
                  {contactInfo?.address && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span>{contactInfo.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Inquiry Form */}
              <div className="space-y-3">
                {contactSubmitted ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <h5 className="font-bold text-emerald-900 text-sm">Message Sent Successfully</h5>
                    <p className="text-xs text-emerald-700">
                      In preview mode, inquiry interactions are simulated. In production, this delivers directly to your inbox.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      onContactSubmit();
                    }}
                    className="space-y-3 text-xs"
                  >
                    <div>
                      <label className="font-semibold block mb-1" style={{ color: colors.text }}>
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Jane Doe"
                        className="w-full p-2.5 bg-white border rounded-xl outline-none"
                        style={{ borderColor: `${colors.primary}30` }}
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1" style={{ color: colors.text }}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="jane@example.com"
                        className="w-full p-2.5 bg-white border rounded-xl outline-none"
                        style={{ borderColor: `${colors.primary}30` }}
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1" style={{ color: colors.text }}>
                        Message / Project Scope
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Tell us about your requirements..."
                        className="w-full p-2.5 bg-white border rounded-xl outline-none"
                        style={{ borderColor: `${colors.primary}30` }}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl font-bold text-white shadow-xs transition-all hover:opacity-95"
                      style={{ backgroundColor: colors.primary }}
                    >
                      Send Message
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      );

    case 'CTA':
      return (
        <section className="px-6 sm:px-12 py-12 max-w-4xl mx-auto text-center space-y-4">
          <div
            className="p-8 sm:p-12 rounded-3xl border shadow-sm space-y-4"
            style={{
              backgroundColor: `${colors.primary}10`,
              borderColor: `${colors.primary}30`
            }}
          >
            <h2 className="text-2xl sm:text-4xl font-extrabold" style={{ color: colors.text }}>
              {content.heading || 'Ready to Get Started?'}
            </h2>
            <p className="text-xs sm:text-sm max-w-lg mx-auto opacity-80" style={{ color: colors.text }}>
              {content.subheading || content.body}
            </p>
            {content.primaryCta && (
              <button
                className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:opacity-95"
                style={{ backgroundColor: colors.primary }}
              >
                {content.primaryCta.label}
              </button>
            )}
          </div>
        </section>
      );

    case 'FAQ':
      const faqItems = data.items || [];
      return (
        <section className="px-6 sm:px-12 py-12 max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center tracking-tight" style={{ color: colors.text }}>
            {content.heading || 'Frequently Asked Questions'}
          </h2>
          <div className="space-y-3">
            {faqItems.map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border space-y-1.5"
                style={{
                  backgroundColor: `${colors.primary}05`,
                  borderColor: `${colors.primary}15`
                }}
              >
                <h4 className="font-bold text-xs sm:text-sm" style={{ color: colors.text }}>
                  {item.title}
                </h4>
                <p className="text-xs opacity-80" style={{ color: colors.text }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      );

    default:
      return (
        <section className="px-6 sm:px-12 py-8 max-w-4xl mx-auto">
          <div
            className="p-6 rounded-2xl border space-y-2"
            style={{ borderColor: `${colors.primary}20`, backgroundColor: `${colors.primary}04` }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Section Type: {secType}
            </span>
            <h3 className="text-lg font-bold" style={{ color: colors.text }}>
              {content.heading || `${secType} Section`}
            </h3>
            {content.subheading && (
              <p className="text-xs opacity-80" style={{ color: colors.text }}>
                {content.subheading}
              </p>
            )}
            {content.body && (
              <p className="text-xs opacity-70" style={{ color: colors.text }}>
                {content.body}
              </p>
            )}
          </div>
        </section>
      );
  }
};
