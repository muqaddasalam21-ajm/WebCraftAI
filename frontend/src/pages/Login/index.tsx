import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock } from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await login(email.trim(), password);
      // Automatic role-based redirection
      if (user.role === 'Admin' || user.role === 'Manager') {
        navigate('/dashboard', { replace: true });
      } else if (user.role === 'Vendor') {
        navigate('/dashboard/my-templates', { replace: true });
      } else {
        navigate('/dashboard/my-projects', { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* LEFT SIDE: WebCraftAI Branding & 3D Illustration */}
        <div className="lg:col-span-6 bg-gradient-to-br from-brand-900 via-brand-800 to-indigo-950 p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent-pink/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-cyan/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer relative z-10"
            onClick={() => navigate('/')}
          >
            <img
              src="/assets/3d/logo-icon.svg"
              alt="WebCraftAI Logo"
              className="w-10 h-10 object-contain shadow-xs"
            />
            <span className="font-extrabold text-2xl tracking-tight text-white">
              WebCraft<span className="text-accent-pink">AI</span>
            </span>
          </div>

          {/* Center Text & Illustration */}
          <div className="my-auto py-8 relative z-10 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-accent-pink" />
              <span>Real Authentication &amp; RBAC</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Welcome back
            </h2>

            <p className="text-sm text-brand-100/80 leading-relaxed max-w-md">
              Sign in with your secure account to manage websites, templates, orders, and role permissions.
            </p>

            <div className="pt-4">
              <img
                src="/assets/3d/hero-3d.svg"
                alt="WebCraftAI Studio 3D"
                className="w-full max-w-[340px] h-auto object-contain drop-shadow-xl animate-float"
              />
            </div>
          </div>

          {/* Left Footer Info */}
          <div className="relative z-10 text-xs text-brand-200/60 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Phase 2 v0.2 · Real Hashed Password Auth Engine</span>
          </div>
        </div>

        {/* RIGHT SIDE: SaaS Login Card */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <img
                  src="/assets/3d/logo-icon.svg"
                  alt="WebCraftAI"
                  className="w-6 h-6 object-contain"
                />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Secure Sign In
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Sign in to WebCraftAI
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your email address and password to securely access your portal.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@webcraft.ai"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-xl text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <span className="text-xs text-slate-400">
                    Secure JWT
                  </span>
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-xl text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <label htmlFor="remember-me" className="ml-2 text-xs font-medium text-slate-600">
                  Keep me signed in
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                className="w-full"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="text-center pt-2 text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/signup" className="font-bold text-brand-600 hover:underline">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
