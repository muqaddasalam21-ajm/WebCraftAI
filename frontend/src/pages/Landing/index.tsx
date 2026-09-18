import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  LayoutTemplate,
  Sliders,
  Package,
  ShoppingCart,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Zap,
  Globe,
  Star
} from 'lucide-react';
import { mockTemplates } from '../../data/mockTemplates';
import { TemplateCard } from '../../components/TemplateCard';
import { Button } from '../../components/Button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* 1. HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img
              src="/assets/3d/logo-icon.svg"
              alt="WebCraftAI Logo"
              className="w-10 h-10 object-contain shadow-xs"
            />
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              WebCraft<span className="text-brand-600">AI</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#hero" className="hover:text-brand-600 transition-colors">
              Home
            </a>
            <a href="#templates" className="hover:text-brand-600 transition-colors">
              Templates
            </a>
            <a href="#ai-builder" className="hover:text-brand-600 transition-colors flex items-center gap-1">
              AI Builder
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-brand-100 text-brand-700">New</span>
            </a>
            <a href="#features" className="hover:text-brand-600 transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-brand-600 transition-colors">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/dashboard')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Start Building
            </Button>
          </div>
        </div>
      </header>

      {/* 2. HERO */}
      <section id="hero" className="relative pt-12 pb-20 overflow-hidden bg-gradient-to-b from-brand-50/50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Text */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100/80 border border-brand-200/80 text-brand-900 text-xs font-bold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-accent-pink" />
                <span>Next-Gen AI Website Builder &amp; Marketplace</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Create Stunning Websites with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-accent-pink to-accent-cyan">
                  AI
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Describe your idea and let WebCraftAI help you create a professional website.
                From architectural layouts to curated palettes and e-commerce stores.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/dashboard/ai-agent')}
                  leftIcon={<Sparkles className="w-5 h-5" />}
                  className="w-full sm:w-auto"
                >
                  Start Building
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const el = document.getElementById('templates');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto"
                >
                  Explore Templates
                </Button>
              </div>

              {/* Social Proof */}
              <div className="pt-6 flex items-center justify-center lg:justify-start gap-4 text-xs text-slate-500">
                <div className="flex -space-x-2">
                  {['U1', 'U2', 'U3', 'U4'].map((u, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600"
                    >
                      {u}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center text-amber-400">
                    {'★★★★★'}
                    <span className="font-bold text-slate-800 ml-1">4.9/5</span>
                  </div>
                  <span>Trusted by 10,000+ creators &amp; studios</span>
                </div>
              </div>
            </div>

            {/* Right 3D Visual */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-full max-w-[540px]">
                <img
                  src="/assets/3d/hero-3d.svg"
                  alt="3D Website Builder"
                  className="w-full h-auto object-contain drop-shadow-2xl animate-float"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="py-20 bg-slate-50/70 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Workflow
            </span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              How WebCraftAI Works
            </h2>
            <p className="text-sm text-slate-500">
              From thought to fully-structured responsive website in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Choose a Template',
                desc: 'Browse our curated marketplace of responsive, industry-specific website designs.'
              },
              {
                step: '02',
                title: 'Describe Your Idea',
                desc: 'Tell our AI about your niche, brand voice, target audience, and preferred aesthetic.'
              },
              {
                step: '03',
                title: 'Let AI Build',
                desc: 'WebCraftAI generates comprehensive page blueprints, layout sections, and color palettes.'
              },
              {
                step: '04',
                title: 'Preview & Launch',
                desc: 'Review your site architecture, fine-tune content, and manage orders and products.'
              }
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all relative overflow-hidden group"
              >
                <div className="text-3xl font-black text-brand-100 group-hover:text-brand-200 transition-colors mb-3">
                  {item.step}
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1.5">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURES */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-accent-pink">
              Platform Features
            </span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Everything You Need to Build &amp; Scale
            </h2>
            <p className="text-sm text-slate-500">
              WebCraftAI combines autonomous AI intelligence with full commerce and management tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Bot className="w-6 h-6 text-brand-600" />,
                bg: 'bg-brand-50',
                title: 'AI Website Builder',
                desc: 'Converse with an AI architect that reasons across sections, typography pairings, and layouts.'
              },
              {
                icon: <LayoutTemplate className="w-6 h-6 text-accent-pink" />,
                bg: 'bg-pink-50',
                title: 'Professional Templates',
                desc: 'Real, high-resolution website templates across beauty, furniture, dining, agency, and portfolios.'
              },
              {
                icon: <Sliders className="w-6 h-6 text-accent-cyan" />,
                bg: 'bg-cyan-50',
                title: 'Easy Customization',
                desc: 'Fine-tune color schemes, section orders, and responsive breakpoints effortlessly.'
              },
              {
                icon: <Package className="w-6 h-6 text-blue-600" />,
                bg: 'bg-blue-50',
                title: 'Product Management',
                desc: 'Organize digital products, services, physical stock, categories, and vendor relationships.'
              },
              {
                icon: <ShoppingCart className="w-6 h-6 text-amber-600" />,
                bg: 'bg-amber-50',
                title: 'Order Management',
                desc: 'Track sales, assign order fulfillments to team members, and view live processing statuses.'
              },
              {
                icon: <BarChart3 className="w-6 h-6 text-emerald-600" />,
                bg: 'bg-emerald-50',
                title: 'Business Reports',
                desc: 'Analyze revenue growth, profit margins, loss metrics, and customer acquisition summaries.'
              }
            ].map((feat, i) => (
              <div
                key={i}
                className="rounded-2xl p-7 border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50 shadow-xs hover:shadow-lg transition-all"
              >
                <div className={`w-12 h-12 rounded-2xl ${feat.bg} flex items-center justify-center mb-5`}>
                  {feat.icon}
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. TEMPLATE SHOWCASE */}
      <section id="templates" className="py-24 bg-slate-50/60 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">
                Marketplace Showcase
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Explore Real Visual Templates
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Handcrafted website blueprints ready for instant AI customization.
              </p>
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/dashboard/templates')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View All 8 Templates
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockTemplates.slice(0, 6).map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA */}
      <section className="py-20 bg-gradient-to-tr from-brand-900 via-brand-800 to-indigo-950 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-accent-pink" />
            Join the AI creation revolution
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Build your next website with WebCraftAI
          </h2>

          <p className="text-base text-brand-200 max-w-xl mx-auto">
            Experience the future of intelligent website design. Start for free with our v0.1 foundation.
          </p>

          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/dashboard')}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="bg-white text-slate-900 hover:bg-slate-100 shadow-xl"
            >
              Start Building
            </Button>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/3d/logo-icon.svg"
                alt="WebCraftAI"
                className="w-8 h-8 object-contain"
              />
              <span className="font-bold text-white text-lg tracking-tight">WebCraftAI</span>
            </div>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Professional AI-powered website creation and template marketplace platform.
            </p>
            <p className="text-xs text-slate-500">© 2026 WebCraftAI. All rights reserved.</p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Product</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#templates" className="hover:text-white transition-colors">
                  Templates
                </a>
              </li>
              <li>
                <a href="#ai-builder" className="hover:text-white transition-colors">
                  AI Builder
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Support</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Community
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Security
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};
