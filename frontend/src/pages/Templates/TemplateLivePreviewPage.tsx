import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Monitor,
  Tablet,
  Smartphone,
  ArrowLeft,
  ShoppingCart,
  Sparkles,
  Star,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Maximize2,
  Minimize2,
  Heart,
  Share2,
  Play,
  Send,
  ShieldCheck,
  Building2,
  Utensils,
  ShoppingBag,
  Sparkle,
  Layers,
  Award,
  BookOpen,
  Home,
  Check,
  X
} from 'lucide-react';
import { templateService } from '../../services/templateService';
import { Template } from '../../types';

export const TemplateLivePreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Viewport mode: 'desktop' | 'tablet' | 'mobile'
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Interactive simulated states for templates
  const [cartCount, setCartCount] = useState(0);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingForm, setBookingForm] = useState({ name: '', email: '', date: '', time: '19:00', guests: '2' });
  const [tourScheduled, setTourScheduled] = useState(false);
  const [tourForm, setTourForm] = useState({ name: '', phone: '', email: '', date: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);

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
        // Fallback search across all templates
        const allRes = await templateService.getTemplates();
        const found = allRes.templates?.find((t: Template) => t.id === templateId);
        if (found) {
          setTemplate(found);
        } else {
          setError(res.error || 'Template not found.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load template.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = () => {
    if (!template) return;
    navigate(`/checkout?type=template&id=${template.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold tracking-wide text-slate-300 animate-pulse">
          Spinning up live template preview environment...
        </p>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center space-y-4 p-6 text-center">
        <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center border border-rose-500/20">
          <X className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Template Not Found</h2>
        <p className="text-sm text-slate-400 max-w-md">{error || 'Could not locate the requested live demo.'}</p>
        <button
          onClick={() => navigate('/dashboard/templates')}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  // Device frame width constraints
  const frameWidthClass =
    viewport === 'mobile'
      ? 'max-w-[390px] shadow-2xl rounded-[40px] border-[10px] border-slate-800 overflow-hidden my-6 min-h-[844px]'
      : viewport === 'tablet'
      ? 'max-w-[768px] shadow-2xl rounded-[28px] border-[8px] border-slate-800 overflow-hidden my-6 min-h-[900px]'
      : 'w-full min-h-screen';

  // Specific content renderer based on category/template ID
  const renderTemplateContent = () => {
    const cat = (template.category || '').toLowerCase();
    const name = template.name.toLowerCase();

    // 1. REAL ESTATE TEMPLATE (Haven & Horizon)
    if (cat.includes('real') || cat.includes('estate') || name.includes('haven') || name.includes('estate')) {
      return (
        <div className="bg-stone-50 text-stone-900 font-sans">
          {/* Real Estate Top Nav */}
          <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-emerald-700" />
              <span className="font-serif text-xl font-bold tracking-tight text-stone-900">
                HAVEN &amp; HORIZON
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-widest text-stone-600">
              <a href="#properties" className="hover:text-emerald-700 transition-colors">Properties</a>
              <a href="#features" className="hover:text-emerald-700 transition-colors">Amenities</a>
              <a href="#gallery" className="hover:text-emerald-700 transition-colors">Gallery</a>
              <a href="#schedule" className="hover:text-emerald-700 transition-colors">Private Tour</a>
            </nav>
            <a
              href="#schedule"
              className="px-4 py-2 bg-stone-900 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
            >
              Book Viewing
            </a>
          </header>

          {/* Hero Section */}
          <section className="relative h-[650px] flex items-end pb-16 px-6 lg:px-16 text-white overflow-hidden">
            <img
              src={template.thumbnail || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&auto=format&fit=crop&q=80'}
              alt="Haven Luxury Residence"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/30 to-transparent"></div>

            <div className="relative z-10 max-w-4xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" /> Prime Coastal Enclave · Malibu, CA
              </div>
              <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-white leading-tight">
                The Obsidian Villa at Point Dume
              </h1>
              <p className="text-stone-300 text-sm md:text-base max-w-2xl leading-relaxed">
                A masterwork of contemporary architectural minimalism with 270° uninterrupted Pacific ocean views, infinity pool, and bespoke Italian walnut millwork.
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="text-3xl md:text-4xl font-serif font-extrabold text-white">
                  $4,850,000
                </div>
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-stone-300 border-l border-stone-600 pl-6">
                  <span>5 Beds</span>
                  <span>·</span>
                  <span>6.5 Baths</span>
                  <span>·</span>
                  <span>6,400 Sq Ft</span>
                </div>
              </div>
            </div>
          </section>

          {/* Property Key Specs Bar */}
          <section className="bg-stone-900 text-stone-200 py-6 px-6 border-b border-stone-800">
            <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-stone-400 text-[10px] uppercase tracking-widest font-bold">Architecture</p>
                <p className="text-sm font-semibold text-white mt-1">Modern Minimalist</p>
              </div>
              <div>
                <p className="text-stone-400 text-[10px] uppercase tracking-widest font-bold">Lot Size</p>
                <p className="text-sm font-semibold text-white mt-1">1.4 Acres Private</p>
              </div>
              <div>
                <p className="text-stone-400 text-[10px] uppercase tracking-widest font-bold">Garage</p>
                <p className="text-sm font-semibold text-white mt-1">4-Car Temperature Controlled</p>
              </div>
              <div>
                <p className="text-stone-400 text-[10px] uppercase tracking-widest font-bold">Smart Home</p>
                <p className="text-sm font-semibold text-white mt-1">Lutron &amp; Crestron Integrated</p>
              </div>
            </div>
          </section>

          {/* Amenities & Lifestyle */}
          <section id="features" className="py-20 px-6 max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">World-Class Specifications</span>
              <h2 className="text-3xl font-serif font-bold text-stone-900">Crafted Beyond Standard Luxury</h2>
              <p className="text-xs text-stone-600">Every square inch custom manufactured to deliver unmatched privacy, acoustical balance, and visual harmony.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Cantilevered Heated Pool',
                  desc: 'Zero-edge heated saltwater pool floating above the canyon with automated cover and LED ambient mood lighting.',
                  img: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600&auto=format&fit=crop&q=80'
                },
                {
                  title: 'Sommelier Wine Vault',
                  desc: 'Glass-enclosed 800-bottle climate-controlled reserve with biometric security and humidity regulation.',
                  img: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&auto=format&fit=crop&q=80'
                },
                {
                  title: 'Private Wellness Sanctuary',
                  desc: 'Finnish dry cedar sauna, custom marble steam shower, and dedicated ocean-facing pilates studio.',
                  img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80'
                }
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-md transition-all">
                  <div className="h-48 overflow-hidden">
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-6 space-y-2">
                    <h3 className="font-serif font-bold text-lg text-stone-900">{item.title}</h3>
                    <p className="text-xs text-stone-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Interactive Schedule Tour Form */}
          <section id="schedule" className="py-20 px-6 bg-stone-900 text-white">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Exclusive Access</span>
                <h2 className="text-3xl md:text-4xl font-serif font-bold leading-tight">
                  Experience The Obsidian Villa in Person
                </h2>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Private viewings are scheduled strictly for verified prospects and qualified representation. NDA and financial qualification requested upon reservation confirmation.
                </p>
                <div className="pt-4 space-y-2 text-xs text-stone-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Private valet &amp; concierge reception</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Comprehensive architectural dossier included</span>
                  </div>
                </div>
              </div>

              <div className="bg-stone-800/90 border border-stone-700 p-8 rounded-3xl shadow-xl">
                {tourScheduled ? (
                  <div className="text-center py-8 space-y-3">
                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                      <Check className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif font-bold text-xl text-white">Tour Request Received</h3>
                    <p className="text-xs text-stone-400">
                      Our lead estate concierge will contact {tourForm.email || 'you'} within 2 business hours.
                    </p>
                    <button
                      onClick={() => setTourScheduled(false)}
                      className="text-xs text-emerald-400 underline font-semibold mt-4"
                    >
                      Book another viewing
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setTourScheduled(true);
                    }}
                    className="space-y-4 text-left"
                  >
                    <h3 className="text-lg font-bold text-white font-serif">Request Private Showing</h3>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-bold text-stone-400 block mb-1">Full Legal Name</label>
                      <input
                        type="text"
                        required
                        value={tourForm.name}
                        onChange={(e) => setTourForm({ ...tourForm, name: e.target.value })}
                        placeholder="e.g. Jonathan Sterling"
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-bold text-stone-400 block mb-1">Direct Phone</label>
                      <input
                        type="tel"
                        required
                        value={tourForm.phone}
                        onChange={(e) => setTourForm({ ...tourForm, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-bold text-stone-400 block mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={tourForm.email}
                        onChange={(e) => setTourForm({ ...tourForm, email: e.target.value })}
                        placeholder="client@investmentgroup.com"
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg"
                    >
                      Confirm Private Appointment
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>
        </div>
      );
    }

    // 2. RESTAURANT TEMPLATE
    if (cat.includes('restaurant') || name.includes('restaurant') || name.includes('dining')) {
      return (
        <div className="bg-[#121110] text-[#eae5dc] font-serif">
          {/* Restaurant Nav */}
          <header className="sticky top-0 z-40 bg-[#171513]/95 backdrop-blur-md border-b border-[#2d2925] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-500" />
              <span className="text-xl font-bold tracking-widest text-[#f5efe6] uppercase">
                L’ATELIER NOIR
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-xs font-sans font-bold uppercase tracking-widest text-[#a89f91]">
              <a href="#menu" className="hover:text-amber-400 transition-colors">Menus</a>
              <a href="#about" className="hover:text-amber-400 transition-colors">Philosophy</a>
              <a href="#reservations" className="hover:text-amber-400 transition-colors">Reservations</a>
              <a href="#hours" className="hover:text-amber-400 transition-colors">Hours</a>
            </nav>
            <a
              href="#reservations"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-sans font-bold uppercase tracking-widest rounded-lg transition-all"
            >
              Reserve Table
            </a>
          </header>

          {/* Restaurant Hero */}
          <section className="relative h-[650px] flex items-center justify-center text-center px-6 overflow-hidden">
            <img
              src={template.thumbnail || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop&q=80'}
              alt="Culinary Ambiance"
              className="absolute inset-0 w-full h-full object-cover opacity-35"
            />
            <div className="relative z-10 max-w-3xl space-y-6">
              <span className="text-xs font-sans font-bold uppercase tracking-[0.3em] text-amber-400">
                MICHELIN GUIDE 2026 SELECTION
              </span>
              <h1 className="text-4xl sm:text-6xl font-normal tracking-wide text-[#faf7f2] leading-tight">
                An Intimate Symphony of Fire &amp; Season
              </h1>
              <p className="text-sm font-sans text-[#beb4a5] max-w-xl mx-auto leading-relaxed">
                Hyper-seasonal gastronomy celebrating rare coastal harvests, wood-fired heritage cooking, and cellar-aged biodynamic pairings.
              </p>
              <div className="pt-4 flex justify-center gap-4">
                <a
                  href="#reservations"
                  className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-sans text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg"
                >
                  Book Your Evening
                </a>
                <a
                  href="#menu"
                  className="px-8 py-3 bg-transparent border border-[#443d35] hover:border-amber-400 text-[#eae5dc] font-sans text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
                >
                  View Autumn Menu
                </a>
              </div>
            </div>
          </section>

          {/* Interactive Menu Section */}
          <section id="menu" className="py-20 px-6 max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <span className="text-xs font-sans font-bold uppercase tracking-[0.25em] text-amber-500">Curated Courses</span>
              <h2 className="text-3xl sm:text-4xl text-[#faf7f2] tracking-wide">The Degustation Menu</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
              {[
                {
                  title: 'Hokkaido Scallop Crudo',
                  desc: 'Fermented white plum kosho, yuzu emulsion, crisp sea fennel.',
                  price: '$38'
                },
                {
                  title: 'Wood-Smoked Squab',
                  desc: 'Black trumpet mushrooms, sour cherry reduction, roasted sunchoke.',
                  price: '$52'
                },
                {
                  title: 'A5 Miyazaki Wagyu Ribcap',
                  desc: 'Charred spring onion, bone marrow tare, grated Tasmanian wasabi.',
                  price: '$85'
                },
                {
                  title: 'Smoked Madagascar Vanilla Bean',
                  desc: 'Wild heather honeycomb, toasted buckwheat praline, smoked fleur de sel.',
                  price: '$24'
                }
              ].map((item, idx) => (
                <div key={idx} className="border-b border-[#2d2925] pb-6 space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-base font-bold text-[#faf7f2] font-serif">{item.title}</h3>
                    <span className="text-amber-400 font-bold text-sm">{item.price}</span>
                  </div>
                  <p className="text-xs text-[#9d9385] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Interactive Reservation Box */}
          <section id="reservations" className="py-20 px-6 bg-[#1a1715] border-y border-[#2d2925]">
            <div className="max-w-xl mx-auto text-center space-y-6 font-sans">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-amber-500">Reservations</span>
              <h2 className="text-3xl text-[#faf7f2] font-serif">Secure Your Dining Room Table</h2>

              {bookingSuccess ? (
                <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-base font-bold text-white">Table Confirmed</p>
                  <p className="text-xs text-[#beb4a5]">
                    Party of {bookingForm.guests} reserved for {bookingForm.date || 'tomorrow'} at {bookingForm.time}.
                  </p>
                  <button
                    onClick={() => setBookingSuccess(false)}
                    className="text-xs text-amber-400 underline font-semibold mt-3"
                  >
                    Change Reservation
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setBookingSuccess(true);
                  }}
                  className="bg-[#121110] p-6 rounded-2xl border border-[#2d2925] space-y-4 text-left"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-[#9d9385] font-bold block mb-1">Guests</label>
                      <select
                        value={bookingForm.guests}
                        onChange={(e) => setBookingForm({ ...bookingForm, guests: e.target.value })}
                        className="w-full bg-[#1c1917] border border-[#38332c] rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="1">1 Guest (Bar Seating)</option>
                        <option value="2">2 Guests (Dining Room)</option>
                        <option value="4">4 Guests (Booth)</option>
                        <option value="6">6 Guests (Private Alcove)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-[#9d9385] font-bold block mb-1">Seating Time</label>
                      <select
                        value={bookingForm.time}
                        onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                        className="w-full bg-[#1c1917] border border-[#38332c] rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="17:30">5:30 PM</option>
                        <option value="18:30">6:30 PM</option>
                        <option value="19:30">7:30 PM (Prime)</option>
                        <option value="20:45">8:45 PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-[#9d9385] font-bold block mb-1">Guest Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Your Name"
                      value={bookingForm.name}
                      onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                      className="w-full bg-[#1c1917] border border-[#38332c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
                  >
                    Confirm Table Reservation
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>
      );
    }

    // 3. E-COMMERCE / FASHION STORE (Aura)
    if (cat.includes('e-commerce') || cat.includes('store') || name.includes('e-commerce') || name.includes('aura')) {
      return (
        <div className="bg-white text-slate-900 font-sans">
          {/* Promo Header */}
          <div className="bg-slate-900 text-white text-[11px] py-2 px-4 text-center font-medium tracking-wide">
            COMPLIMENTARY WORLDWIDE EXPRESS SHIPPING ON ORDERS OVER $150 · USE CODE AURA2026
          </div>

          {/* E-Commerce Nav */}
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <span className="font-extrabold text-2xl tracking-tight text-slate-900">
              AURA<span className="text-emerald-500">.</span>
            </span>
            <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-600">
              <a href="#new" className="hover:text-slate-900 transition-colors">New Arrivals</a>
              <a href="#apparel" className="hover:text-slate-900 transition-colors">Apparel</a>
              <a href="#footwear" className="hover:text-slate-900 transition-colors">Footwear</a>
              <a href="#accessories" className="hover:text-slate-900 transition-colors">Accessories</a>
            </nav>
            <div className="flex items-center gap-4">
              <div className="relative cursor-pointer" onClick={() => setCartCount(cartCount + 1)}>
                <ShoppingBag className="w-5 h-5 text-slate-800" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-scaleIn">
                    {cartCount}
                  </span>
                )}
              </div>
            </div>
          </header>

          {/* Hero Banner */}
          <section className="relative h-[580px] bg-slate-100 flex items-center px-8 lg:px-20 overflow-hidden">
            <img
              src={template.thumbnail || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80'}
              alt="Aura Season Look"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/40 to-transparent"></div>

            <div className="relative z-10 max-w-xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">The Minimalist Capsule 2026</span>
              <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Refined Forms. Uncompromising Comfort.
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md">
                Organic Japanese heavy cottons, tailored silhouettes, and understated technical layering designed for everyday elegance.
              </p>
              <div className="pt-2 flex gap-3">
                <a
                  href="#products"
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md"
                >
                  Shop Collection
                </a>
              </div>
            </div>
          </section>

          {/* Product Grid with Simulated Cart Interaction */}
          <section id="products" className="py-20 px-6 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Handpicked Essentials</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Trending This Week</h2>
              </div>
              <p className="text-xs text-slate-500">Click any product to add to bag in live preview</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                {
                  title: 'Raw Hem Oversized Knit',
                  price: '$148',
                  img: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&auto=format&fit=crop&q=80',
                  color: 'Oatmeal'
                },
                {
                  title: 'Pleated Minimalist Trousers',
                  price: '$180',
                  img: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&auto=format&fit=crop&q=80',
                  color: 'Deep Charcoal'
                },
                {
                  title: 'Structured Leather Carryall',
                  price: '$290',
                  img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80',
                  color: 'Espresso'
                },
                {
                  title: 'Monochrome Suede Loafers',
                  price: '$210',
                  img: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600&auto=format&fit=crop&q=80',
                  color: 'Sand'
                }
              ].map((p, idx) => (
                <div key={idx} className="group space-y-3">
                  <div className="relative aspect-[3/4] bg-slate-100 rounded-2xl overflow-hidden">
                    <img src={p.img} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <button
                      onClick={() => setCartCount((prev) => prev + 1)}
                      className="absolute bottom-3 left-3 right-3 py-2.5 bg-white/95 hover:bg-slate-900 hover:text-white text-slate-900 font-bold text-xs rounded-xl shadow-md transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Add to Bag
                    </button>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{p.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.color}</p>
                    <p className="text-xs font-extrabold text-slate-900 mt-1">{p.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      );
    }

    // 4. BEAUTY & SPA TEMPLATE (Glow & Serene)
    if (cat.includes('beauty') || name.includes('glow') || name.includes('spa') || name.includes('cosmetics')) {
      return (
        <div className="bg-[#faf8f5] text-[#2c2a29] font-sans">
          <header className="sticky top-0 z-40 bg-[#faf8f5]/90 backdrop-blur-md border-b border-[#ece6de] px-6 py-4 flex items-center justify-between">
            <span className="font-serif text-xl tracking-wider text-[#3d3835]">
              GLOW &amp; SERENE
            </span>
            <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest text-[#78716c]">
              <a href="#treatments">Rituals</a>
              <a href="#therapists">Estheticians</a>
              <a href="#products">Botanicals</a>
              <a href="#book">Reserve</a>
            </nav>
            <a
              href="#book"
              className="px-4 py-2 bg-[#44403c] text-[#faf8f5] text-xs font-serif uppercase tracking-widest rounded-full hover:bg-emerald-900 transition-colors"
            >
              Book Treatment
            </a>
          </header>

          <section className="relative h-[600px] flex items-center justify-center text-center px-6 overflow-hidden">
            <img
              src={template.thumbnail || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1600&auto=format&fit=crop&q=80'}
              alt="Spa Relaxation"
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="relative z-10 max-w-2xl space-y-4">
              <span className="text-xs uppercase tracking-[0.3em] font-serif text-emerald-800">Holistic Wellness Clinic</span>
              <h1 className="text-4xl sm:text-6xl font-serif text-[#292524] font-normal leading-tight">
                Harmonizing Mind, Skin &amp; Spirit
              </h1>
              <p className="text-xs sm:text-sm text-[#57534e] max-w-md mx-auto leading-relaxed">
                Clean organic active botanicals combined with advanced facial lymphatic sculpting and restorative sound baths.
              </p>
            </div>
          </section>

          <section id="treatments" className="py-20 px-6 max-w-5xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs uppercase tracking-widest text-emerald-800 font-serif">Signature Rituals</span>
              <h2 className="text-3xl font-serif text-[#292524]">Restorative Treatment Menu</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { title: 'Rose Quartz Facial', duration: '75 min', price: '$165', desc: 'Lymphatic drainage massage with organic Bulgarian rose mist and cold jade rolling.' },
                { title: 'Thermal Mineral Detox', duration: '90 min', price: '$210', desc: 'Dead Sea magnesium mud wrap followed by eucalyptus steam and deep tissue release.' },
                { title: 'Soundwave Meditation', duration: '60 min', price: '$120', desc: 'Tibetan singing bowls acoustic therapy paired with soothing botanical scalp acupressure.' }
              ].map((t, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-[#ece6de] space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-[#78716c] uppercase tracking-wider">{t.duration}</span>
                    <span className="text-emerald-800 font-bold font-serif">{t.price}</span>
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#292524]">{t.title}</h3>
                  <p className="text-xs text-[#78716c] leading-relaxed">{t.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      );
    }

    // 5. DEFAULT DYNAMIC FALLBACK FOR ALL OTHER TEMPLATES (Agency, Education, Portfolio, Furniture, etc.)
    return (
      <div className="bg-slate-900 text-slate-100 font-sans">
        {/* Dynamic Nav */}
        <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-lg text-white tracking-tight">{template.name}</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            {template.pages?.map((p) => (
              <a key={p} href={`#${p.toLowerCase()}`} className="hover:text-emerald-400 transition-colors">
                {p}
              </a>
            ))}
          </nav>
          <button
            onClick={handleUseTemplate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
          >
            Order Template
          </button>
        </header>

        {/* Dynamic Hero */}
        <section className="relative py-24 px-6 lg:px-16 text-center space-y-6 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover blur-sm" />
          </div>
          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {template.category} Edition · v{template.version || '1.0'}
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
              {template.name}
            </h1>
            <p className="text-sm md:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
              {template.description}
            </p>
            <div className="pt-4 flex justify-center gap-4">
              <button
                onClick={handleUseTemplate}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg"
              >
                Get Started with This Template
              </button>
            </div>
          </div>
        </section>

        {/* Features Showcase */}
        {template.features && template.features.length > 0 && (
          <section className="py-20 px-6 max-w-5xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-center text-white">Included Modules &amp; Capabilities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {template.features.map((feat, i) => (
                <div key={i} className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">{feat}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Engineered with responsive React components and accessible markup ready for immediate deployment.
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-slate-950 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 overflow-auto' : ''}`}>
      {/* Top Preview Control Bar */}
      <div className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-4 select-none">
        {/* Left: Back to Template */}
        <div className="flex items-center gap-3">
          <Link
            to={`/dashboard/templates/${template.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Template Details</span>
          </Link>

          <div className="hidden md:flex items-center gap-2 border-l border-slate-700 pl-3">
            <span className="text-xs font-bold text-white truncate max-w-[200px]">{template.name}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {template.category}
            </span>
          </div>
        </div>

        {/* Center: Device Viewport Switcher */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              viewport === 'desktop' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Desktop view (100%)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Desktop</span>
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              viewport === 'tablet' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Tablet view (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Tablet</span>
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              viewport === 'mobile' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Mobile view (390px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Mobile</span>
          </button>
        </div>

        {/* Right: Fullscreen & Checkout CTA */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg text-xs transition-colors hidden sm:inline-flex"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleUseTemplate}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all shadow-md"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Use Template (${template.price})</span>
          </button>
        </div>
      </div>

      {/* Viewport Frame Container */}
      <main className="flex-1 bg-slate-950 flex justify-center items-start overflow-auto">
        <div className={`transition-all duration-300 w-full ${frameWidthClass}`}>
          {renderTemplateContent()}
        </div>
      </main>
    </div>
  );
};
