import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  Globe,
  Palette,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  Clock,
  AlertCircle
} from 'lucide-react';
import { customWebsiteOrderService } from '../../services/customWebsiteOrderService';
import { servicePackageService } from '../../services/servicePackageService';
import { CustomWebsitePackage } from '../../types';
import { Button } from '../../components/Button';

export const OrderWebsitePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [packages, setPackages] = useState<CustomWebsitePackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [packagesError, setPackagesError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string>('');

  // Step 1: Business Information
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Service Business');
  const [businessDescription, setBusinessDescription] = useState('');
  const [industryCategory, setIndustryCategory] = useState('Technology & Digital');
  const [websitePurpose, setWebsitePurpose] = useState('');
  const [location, setLocation] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [socialLinksText, setSocialLinksText] = useState('');

  // Step 2: Website Requirements
  const [requiredPages, setRequiredPages] = useState<string[]>([
    'Home',
    'About Us',
    'Services',
    'Contact'
  ]);
  const [newPageInput, setNewPageInput] = useState('');
  const [requiredSections, setRequiredSections] = useState<string[]>([
    'Hero Banner with CTA',
    'Feature Highlights',
    'Testimonials & Social Proof',
    'Contact & Lead Form'
  ]);
  const [newSectionInput, setNewSectionInput] = useState('');
  const [servicesOfferedText, setServicesOfferedText] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [featuresNeeded, setFeaturesNeeded] = useState<string[]>([
    'WhatsApp Direct Chat',
    'Mobile Responsive Layout'
  ]);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Step 3: Design Preferences
  const [preferredColors, setPreferredColors] = useState<string>('#4F46E5, #06B6D4');
  const [preferredStyle, setPreferredStyle] = useState('Modern Minimalist');
  const [preferredTypography, setPreferredTypography] = useState('Inter Sans / Clean Sans');
  const [websiteMood, setWebsiteMood] = useState('Trustworthy, Premium & High-Converting');
  const [referenceWebsiteUrl, setReferenceWebsiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFileName, setLogoFileName] = useState('');
  const [additionalDesignNotes, setAdditionalDesignNotes] = useState('');

  // Step 4: Package Selection
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  useEffect(() => {
    const loadPackages = async () => {
      try {
        setLoadingPackages(true);
        setPackagesError('');
        const data = await servicePackageService.getActive();
        setPackages(data.packages);
        if (data.packages.length > 0) {
          // Auto-select featured package or first
          const featured = data.packages.find(p => p.featured);
          setSelectedPackageId(featured ? featured.id : data.packages[0].id);
        }
      } catch (err: any) {
        setPackagesError('Failed to load service packages: ' + err.message);
      } finally {
        setLoadingPackages(false);
      }
    };
    loadPackages();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    try {
      setUploadingLogo(true);
      const res = await customWebsiteOrderService.uploadAsset(file);
      setLogoUrl(res.url);
      setLogoFileName(file.name);
    } catch (err: any) {
      alert('File upload failed: ' + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleAddPage = () => {
    if (newPageInput.trim() && !requiredPages.includes(newPageInput.trim())) {
      setRequiredPages([...requiredPages, newPageInput.trim()]);
      setNewPageInput('');
    }
  };

  const handleRemovePage = (p: string) => {
    setRequiredPages(requiredPages.filter((x) => x !== p));
  };

  const handleAddSection = () => {
    if (newSectionInput.trim() && !requiredSections.includes(newSectionInput.trim())) {
      setRequiredSections([...requiredSections, newSectionInput.trim()]);
      setNewSectionInput('');
    }
  };

  const handleRemoveSection = (s: string) => {
    setRequiredSections(requiredSections.filter((x) => x !== s));
  };

  const validateStep1 = () => {
    if (!businessName.trim()) {
      setError('Business name is required.');
      return false;
    }
    if (!websitePurpose.trim()) {
      setError('Website purpose / core goal is required.');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (requiredPages.length === 0) {
      setError('Please add at least one page for your website.');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep4 = () => {
    if (!selectedPackageId) {
      setError('Please select a service package to continue.');
      return false;
    }
    const pkg = packages.find(p => p.id === selectedPackageId);
    if (pkg && requiredPages.length > pkg.pageLimit) {
      setError(
        `Your selected package "${pkg.name}" allows up to ${pkg.pageLimit} pages, but you have ${requiredPages.length} pages selected. ` +
        `Please go back to Step 2 to remove pages, or choose a package with a higher page limit.`
      );
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 4 && !validateStep4()) return;
    setError('');
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrev = () => {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitOrder = async () => {
    try {
      setSubmitting(true);
      setError('');

      const colorArray = preferredColors
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const servicesArray = servicesOfferedText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const socialArray = socialLinksText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        businessInfo: {
          businessName: businessName.trim(),
          businessType,
          businessDescription: businessDescription.trim(),
          industryCategory,
          websitePurpose: websitePurpose.trim(),
          location: location.trim(),
          businessHours: businessHours.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: '',
          whatsappNumber: whatsappNumber.trim(),
          socialLinks: socialArray
        },
        requirements: {
          requiredPages,
          requiredSections,
          servicesOffered: servicesArray,
          productsOffered: [],
          featuresNeeded,
          targetAudience: targetAudience.trim() || 'Potential customers & visitors',
          additionalNotes: additionalNotes.trim()
        },
        designPreferences: {
          preferredColors: colorArray,
          preferredStyle,
          preferredTypography,
          websiteMood,
          referenceWebsiteUrl: referenceWebsiteUrl.trim(),
          logoUrl,
          assetUrls: logoUrl ? [logoUrl] : [],
          additionalDesignNotes: additionalDesignNotes.trim()
        },
        packageId: selectedPackageId
      };

      const result = await customWebsiteOrderService.createCustomWebsiteOrder(payload);
      navigate(`/dashboard/orders/${result.order.id}`, {
        state: { newOrderCreated: true }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit website order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPkg = packages.find((p) => p.id === selectedPackageId);

  const steps = [
    { num: 1, label: 'Business Info', icon: Briefcase },
    { num: 2, label: 'Requirements', icon: Layers },
    { num: 3, label: 'Design Preferences', icon: Palette },
    { num: 4, label: 'Select Package', icon: Globe },
    { num: 5, label: 'Review & Place', icon: CheckCircle2 }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent-pink/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-bold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-accent-pink" />
            <span>Professional WebCraft Service</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Order Custom Website Service
          </h1>
          <p className="text-sm text-brand-100/80 max-w-xl">
            Provide your business information and website specifications. Our engineering and design staff will review, build, and deliver your live bespoke website.
          </p>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-600 transition-all duration-300 z-0"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
          {steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            return (
              <div key={step.num} className="relative z-10 flex flex-col items-center gap-1.5">
                <button
                  onClick={() => {
                    if (step.num < currentStep) setCurrentStep(step.num);
                  }}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : isCurrent
                      ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-md'
                      : 'bg-white border border-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </button>
                <span
                  className={`text-[11px] font-semibold hidden sm:block ${
                    isCurrent ? 'text-brand-700 font-bold' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: BUSINESS INFORMATION */}
      {currentStep === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Step 1: Business Information</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tell us about your organization, company story, and what your website should achieve.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Business / Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Apex Consulting Group"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Business Type</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-brand-500"
              >
                <option>Service Business</option>
                <option>Retail / E-Commerce</option>
                <option>Agency / Studio</option>
                <option>Consulting &amp; Advisory</option>
                <option>Restaurant &amp; Hospitality</option>
                <option>Medical &amp; Health</option>
                <option>Education &amp; Coaching</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Industry Category</label>
              <select
                value={industryCategory}
                onChange={(e) => setIndustryCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-brand-500"
              >
                <option>Technology &amp; Digital</option>
                <option>Professional Services</option>
                <option>Health &amp; Wellness</option>
                <option>Fashion &amp; Lifestyle</option>
                <option>Real Estate &amp; Architecture</option>
                <option>Food &amp; Beverage</option>
                <option>Non-Profit &amp; Community</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Website Purpose &amp; Primary Goal <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={websitePurpose}
                onChange={(e) => setWebsitePurpose(e.target.value)}
                placeholder="e.g. Generate qualified corporate leads, showcase past client work, and book discovery calls"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Business Description &amp; Background
              </label>
              <textarea
                rows={3}
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Briefly describe what your business does, your unique selling proposition, and how long you have operated..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Location / Head office</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. New York, NY or Fully Remote"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Business Hours</label>
              <input
                type="text"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                placeholder="e.g. Mon - Fri: 9:00 AM - 6:00 PM EST"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Public Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="info@yourcompany.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Direct Phone / WhatsApp</label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Social Media / Website Links (one per line)
              </label>
              <textarea
                rows={2}
                value={socialLinksText}
                onChange={(e) => setSocialLinksText(e.target.value)}
                placeholder="https://linkedin.com/company/yourbusiness&#10;https://instagram.com/yourbusiness"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-brand-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: WEBSITE REQUIREMENTS */}
      {currentStep === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Step 2: Website Structure &amp; Requirements</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify the pages, navigation structure, and essential functional modules you require.
            </p>
          </div>

          {/* Required Pages */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Required Pages <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {requiredPages.map((page) => (
                <span
                  key={page}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 text-brand-700 border border-brand-200 rounded-xl text-xs font-semibold"
                >
                  {page}
                  <button
                    onClick={() => handleRemovePage(page)}
                    className="hover:text-rose-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={newPageInput}
                onChange={(e) => setNewPageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPage();
                  }
                }}
                placeholder="Add custom page (e.g. Portfolio, Pricing, FAQ)"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-brand-500"
              />
              <Button size="sm" variant="outline" onClick={handleAddPage}>
                Add Page
              </Button>
            </div>
          </div>

          {/* Required Sections */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-slate-700">Essential Sections</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {requiredSections.map((sec) => (
                <span
                  key={sec}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold"
                >
                  {sec}
                  <button
                    onClick={() => handleRemoveSection(sec)}
                    className="hover:text-rose-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={newSectionInput}
                onChange={(e) => setNewSectionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSection();
                  }
                }}
                placeholder="Add section (e.g. Video Walkthrough, Pricing Grid)"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-brand-500"
              />
              <Button size="sm" variant="outline" onClick={handleAddSection}>
                Add Section
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Services / Offerings (one per line)
              </label>
              <textarea
                rows={3}
                value={servicesOfferedText}
                onChange={(e) => setServicesOfferedText(e.target.value)}
                placeholder="Strategy &amp; Consulting&#10;Custom Web Development&#10;Conversion Rate Optimization"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. B2B founders, marketing directors, premium consumers"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Special Features Needed</label>
              <div className="space-y-1.5 pt-1 text-xs">
                {['WhatsApp Chat Widget', 'Contact Form to Email', 'Interactive Map', 'FAQ Accordion'].map(
                  (feat) => (
                    <label key={feat} className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={featuresNeeded.includes(feat)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFeaturesNeeded([...featuresNeeded, feat]);
                          } else {
                            setFeaturesNeeded(featuresNeeded.filter((f) => f !== feat));
                          }
                        }}
                        className="rounded text-brand-600 focus:ring-brand-500"
                      />
                      <span>{feat}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Additional Functional Notes
              </label>
              <textarea
                rows={2}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Any special integration, copy notes, or requirements..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-brand-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: DESIGN PREFERENCES & ASSETS */}
      {currentStep === 3 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Step 3: Design Preferences &amp; Brand Assets</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose the look, feel, typography, and upload brand assets for our creative designers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Style</label>
              <select
                value={preferredStyle}
                onChange={(e) => setPreferredStyle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-brand-500"
              >
                <option>Modern Minimalist</option>
                <option>High-Tech Dark Mode</option>
                <option>Corporate &amp; Authoritative</option>
                <option>Playful &amp; Creative Gradient</option>
                <option>Warm &amp; Natural Editorial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Typography</label>
              <select
                value={preferredTypography}
                onChange={(e) => setPreferredTypography(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-brand-500"
              >
                <option>Inter Sans / Clean Sans (Modern)</option>
                <option>Playfair Serif (Luxury / Editorial)</option>
                <option>Plus Jakarta Sans (SaaS &amp; Tech)</option>
                <option>Poppins (Vibrant &amp; Friendly)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Color Palette / Hex Codes
              </label>
              <input
                type="text"
                value={preferredColors}
                onChange={(e) => setPreferredColors(e.target.value)}
                placeholder="e.g. #4F46E5, #06B6D4, #0F172A"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Website Mood / Vibe</label>
              <input
                type="text"
                value={websiteMood}
                onChange={(e) => setWebsiteMood(e.target.value)}
                placeholder="e.g. Trustworthy, Fast, Clean, Premium"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reference Website URL (Inspiration)
              </label>
              <input
                type="url"
                value={referenceWebsiteUrl}
                onChange={(e) => setReferenceWebsiteUrl(e.target.value)}
                placeholder="https://example.com (A website whose layout or feel you admire)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-brand-500"
              />
            </div>

            {/* Logo / Asset Upload */}
            <div className="sm:col-span-2 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-xs font-bold text-slate-800">Upload Company Logo / Brand Asset</p>
                  <p className="text-[11px] text-slate-500">
                    PNG, JPG, WEBP, or SVG up to 5MB. Real storage upload.
                  </p>
                  {logoFileName && (
                    <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1 justify-center sm:justify-start">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Attached: {logoFileName}
                    </p>
                  )}
                </div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs">
                  <Upload className="w-3.5 h-3.5 text-brand-600" />
                  <span>{uploadingLogo ? 'Uploading...' : 'Choose File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Design &amp; Styling Instructions
              </label>
              <textarea
                rows={2}
                value={additionalDesignNotes}
                onChange={(e) => setAdditionalDesignNotes(e.target.value)}
                placeholder="Specific animations, header styles, dark/light sections, or brand guidelines..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-brand-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: PACKAGE SELECTION */}
      {currentStep === 4 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Step 4: Select Service Package</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose the package that best fits your requirements. Page limit must accommodate your selected pages ({requiredPages.length} pages selected).
            </p>
          </div>

          {loadingPackages ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading service packages...</div>
          ) : packagesError ? (
            <div className="p-6 text-center text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">
              {packagesError}
            </div>
          ) : packages.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-14 h-14 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="font-semibold text-slate-600 mb-1">No custom website packages are available right now.</p>
              <p className="text-xs text-slate-400">Please check back later or contact our team.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {packages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                const pageWarning = requiredPages.length > pkg.pageLimit;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => { setSelectedPackageId(pkg.id); setError(''); }}
                    className={`relative p-5 sm:p-6 rounded-2xl cursor-pointer transition-all border flex flex-col justify-between ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/20 ring-2 ring-brand-500 shadow-md'
                        : 'border-slate-200 hover:border-brand-300 hover:shadow-xs bg-white'
                    }`}
                  >
                    {pkg.featured && (
                      <span className="absolute -top-3 right-4 px-2.5 py-0.5 bg-gradient-to-r from-brand-600 to-accent-pink text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-xs">
                        Featured
                      </span>
                    )}

                    <div className="space-y-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{pkg.name}</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{pkg.description}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl sm:text-3xl font-black text-slate-900">
                            ${pkg.price.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">{pkg.currency}</span>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-1 text-[11px]">
                          <div className={`text-center rounded-lg p-1.5 ${pageWarning ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'}`}>
                            <div className="font-bold">{pkg.pageLimit}</div>
                            <div className="text-[10px]">Pages</div>
                          </div>
                          <div className="text-center bg-slate-50 text-slate-600 rounded-lg p-1.5">
                            <div className="font-bold">{pkg.revisionLimit}</div>
                            <div className="text-[10px]">Revisions</div>
                          </div>
                          <div className="text-center bg-slate-50 text-slate-600 rounded-lg p-1.5">
                            <div className="font-bold">{pkg.deliveryDays}d</div>
                            <div className="text-[10px]">Delivery</div>
                          </div>
                        </div>
                        {pageWarning && (
                          <p className="mt-1.5 text-[10px] text-red-500 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            You have {requiredPages.length} pages; this package allows {pkg.pageLimit}
                          </p>
                        )}
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500">
                          <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                          {pkg.supportLevel.charAt(0).toUpperCase() + pkg.supportLevel.slice(1)} Support
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 space-y-1.5">
                        {pkg.features.slice(0, 5).map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                        {pkg.features.length > 5 && (
                          <p className="text-[10px] text-slate-400 pl-5">+{pkg.features.length - 5} more features</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-5 mt-4 border-t border-slate-100">
                      <Button
                        variant={isSelected ? 'primary' : 'outline'}
                        size="sm"
                        className="w-full justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPackageId(pkg.id);
                          setError('');
                        }}
                      >
                        {isSelected ? '✓ Selected' : 'Select Package'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* STEP 5: REVIEW & PLACE ORDER */}
      {currentStep === 5 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Step 5: Review &amp; Submit Order</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review your information. Once submitted, your order will enter the verified production workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Business summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">{businessName}</span>
                <span className="px-2 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-bold rounded-md uppercase">
                  {businessType}
                </span>
              </div>
              <p className="text-slate-600">
                <strong>Industry:</strong> {industryCategory}
              </p>
              <p className="text-slate-600">
                <strong>Goal:</strong> {websitePurpose}
              </p>
              {location && (
                <p className="text-slate-600">
                  <strong>Location:</strong> {location}
                </p>
              )}
              {whatsappNumber && (
                <p className="text-slate-600">
                  <strong>WhatsApp:</strong> {whatsappNumber}
                </p>
              )}
            </div>

            {/* Selected Package */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-brand-900 text-sm">{selectedPkg?.name}</span>
                <span className="text-base font-black text-brand-700">${selectedPkg?.price?.toLocaleString()} {selectedPkg?.currency || 'USD'}</span>
              </div>
              <p className="text-brand-800 text-[11px]">{selectedPkg?.description}</p>
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                <div className="text-center bg-white/60 rounded p-1">
                  <div className="font-bold text-brand-800">{selectedPkg?.pageLimit}</div>
                  <div className="text-brand-600">Pages</div>
                </div>
                <div className="text-center bg-white/60 rounded p-1">
                  <div className="font-bold text-brand-800">{selectedPkg?.revisionLimit}</div>
                  <div className="text-brand-600">Revisions</div>
                </div>
                <div className="text-center bg-white/60 rounded p-1">
                  <div className="font-bold text-brand-800">{selectedPkg?.deliveryDays}d</div>
                  <div className="text-brand-600">Delivery</div>
                </div>
              </div>
            </div>

            {/* Scope Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 md:col-span-2">
              <p className="font-bold text-slate-800 mb-1">Included Pages:</p>
              <div className="flex flex-wrap gap-1.5">
                {requiredPages.map((p) => (
                  <span
                    key={p}
                    className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 font-semibold text-slate-700"
                  >
                    {p}
                  </span>
                ))}
              </div>
              <p className="font-bold text-slate-800 pt-2 mb-1">Design Style &amp; Mood:</p>
              <p className="text-slate-600">
                {preferredStyle} · {preferredTypography} · {websiteMood}
              </p>
              {logoFileName && (
                <p className="text-emerald-700 font-semibold pt-1">
                  ✓ Logo attached: {logoFileName}
                </p>
              )}
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-bold">Real Production Order Notice</p>
              <p className="mt-0.5 text-amber-700/90 leading-relaxed">
                Submitting creates a permanent service order in the WebCraft database. Your order will receive a unique tracking number (e.g. WCW-2026-0001) and appear immediately in your My Orders dashboard.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="md"
          onClick={handlePrev}
          disabled={currentStep === 1 || submitting}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Previous Step
        </Button>

        {currentStep < 5 ? (
          <Button
            variant="primary"
            size="md"
            onClick={handleNext}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Next Step
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmitOrder}
            disabled={submitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="bg-brand-600 hover:bg-brand-700 font-bold px-6 shadow-md"
          >
            {submitting ? 'Placing Order...' : 'Place Custom Website Order'}
          </Button>
        )}
      </div>
    </div>
  );
};
