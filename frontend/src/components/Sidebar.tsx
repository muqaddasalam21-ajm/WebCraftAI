import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Store,
  LayoutTemplate,
  Layers,
  FolderGit2,
  Bot,
  UserCheck,
  Settings,
  LogOut,
  Sparkles,
  Bell,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '', onNavigate }) => {
  const navigate = useNavigate();
  const { role, logout, currentUser } = useAuth();

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-green-100 text-green-800 font-semibold shadow-xs border border-green-200/60'
        : 'text-slate-600 hover:bg-green-100/70 hover:text-green-900'
    }`;

  const isAdmin = role === 'Admin';
  const isManager = role === 'Manager';
  const isVendor = role === 'Vendor';
  const isUser = role === 'User';

  return (
    <aside
      className={`w-64 bg-[#f0fdf4] border-r border-green-200/70 flex flex-col h-screen select-none sticky top-0 shrink-0 ${className}`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-green-200/60 gap-3">
        <img
          src="/assets/3d/logo-icon.svg"
          alt="WebCraftAI Logo"
          className="w-8 h-8 rounded-xl object-contain shadow-xs"
        />
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 tracking-tight text-base flex items-center gap-1.5">
            WebCraftAI
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-brand-100 text-brand-700 uppercase">
              v0.2
            </span>
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {role || 'User'} Workspace
          </span>
        </div>
      </div>

      {/* Navigation Groups with Role-Based Visibility */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* MAIN NAVIGATION */}
        <div>
          <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Main
          </span>
          <nav className="space-y-1">
            <NavLink to="/dashboard" end className={navLinkClasses} onClick={onNavigate}>
              <LayoutDashboard className="w-4 h-4 text-brand-600" />
              <span>Dashboard</span>
            </NavLink>

            {/* Users: Admin only */}
            {isAdmin && (
              <NavLink to="/dashboard/users" className={navLinkClasses} onClick={onNavigate}>
                <Users className="w-4 h-4 text-blue-500" />
                <span>Users</span>
              </NavLink>
            )}

            {/* Products: Admin, Manager, Vendor */}
            {(isAdmin || isManager || isVendor) && (
              <NavLink to="/dashboard/products" className={navLinkClasses} onClick={onNavigate}>
                <Package className="w-4 h-4 text-cyan-500" />
                <span>Products</span>
              </NavLink>
            )}

            {/* Service Packages: Admin, Manager */}
            {(isAdmin || isManager) && (
              <NavLink to="/dashboard/service-packages" className={navLinkClasses} onClick={onNavigate}>
                <Layers className="w-4 h-4 text-violet-500" />
                <span>Service Packages</span>
              </NavLink>
            )}

            {/* Projects: Admin & Manager */}
            {(isAdmin || isManager) && (
              <NavLink to="/dashboard/projects" className={navLinkClasses} onClick={onNavigate}>
                <FolderGit2 className="w-4 h-4 text-brand-600" />
                <span>Projects</span>
              </NavLink>
            )}

            {/* My Projects: Customer / User role */}
            {isUser && (
              <NavLink to="/dashboard/my-projects" className={navLinkClasses} onClick={onNavigate}>
                <FolderGit2 className="w-4 h-4 text-brand-600" />
                <span>My Projects</span>
              </NavLink>
            )}

            {/* Orders: All roles (filtered by backend per role) */}
            <NavLink to="/dashboard/orders" className={navLinkClasses} onClick={onNavigate}>
              <ShoppingCart className="w-4 h-4 text-amber-500" />
              <span>{isUser ? 'My Orders' : 'Orders'}</span>
            </NavLink>

            {/* Business Dashboard: Accessible to all roles with scoped views */}
            <NavLink to="/dashboard/business" className={navLinkClasses} onClick={onNavigate}>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Business Analytics</span>
            </NavLink>

            {/* Reports: Admin, Manager, Vendor */}
            {(isAdmin || isManager || isVendor) && (
              <NavLink to="/dashboard/reports" className={navLinkClasses} onClick={onNavigate}>
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <span>Reports</span>
              </NavLink>
            )}

            {/* Notifications: Accessible to all roles */}
            <NavLink to="/dashboard/notifications" className={navLinkClasses} onClick={onNavigate}>
              <Bell className="w-4 h-4 text-brand-600" />
              <span>Notifications</span>
            </NavLink>
          </nav>
        </div>

        {/* WORKSPACE & CREATION */}
        <div>
          <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Creation &amp; Catalog
          </span>
          <nav className="space-y-1">
            {/* Vendors: Admin only */}
            {isAdmin && (
              <NavLink to="/dashboard/vendors" className={navLinkClasses} onClick={onNavigate}>
                <Store className="w-4 h-4 text-purple-500" />
                <span>Vendors</span>
              </NavLink>
            )}

            {/* AI Website Builder: Accessible to all */}
            <NavLink to="/dashboard/ai-builder" className={navLinkClasses} onClick={onNavigate}>
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>AI Website Builder</span>
            </NavLink>

            {/* Templates: Accessible to all */}
            <NavLink to="/dashboard/templates" className={navLinkClasses} onClick={onNavigate}>
              <LayoutTemplate className="w-4 h-4 text-pink-500" />
              <span>Templates</span>
            </NavLink>

            {/* My Templates / Purchased Templates */}
            <NavLink to="/dashboard/my-templates" className={navLinkClasses} onClick={onNavigate}>
              <LayoutDashboard className="w-4 h-4 text-indigo-500" />
              <span>{isAdmin ? 'Manage Templates' : isVendor ? 'My Templates' : 'Purchased Templates'}</span>
            </NavLink>

            {/* AI Agent: Accessible to all */}
            <NavLink
              to="/dashboard/ai-agent"
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 to-accent-pink text-white font-semibold shadow-sm shadow-brand-500/25'
                    : 'bg-gradient-to-r from-brand-50 to-pink-50/50 text-brand-900 hover:from-brand-100 hover:to-pink-100 border border-brand-200/50'
                }`
              }
              onClick={onNavigate}
            >
              <div className="flex items-center gap-3">
                <Bot className="w-4 h-4" />
                <span>AI Agent</span>
              </div>
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            </NavLink>
          </nav>
        </div>

        {/* ACCOUNT */}
        <div>
          <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Account
          </span>
          <nav className="space-y-1">
            <NavLink to="/dashboard/profile" className={navLinkClasses} onClick={onNavigate}>
              <UserCheck className="w-4 h-4 text-indigo-500" />
              <span>Profile</span>
            </NavLink>
            <NavLink to="/dashboard/profile" className={navLinkClasses} onClick={onNavigate}>
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Authenticated User Badge & Sign Out */}
      <div className="p-4 border-t border-green-200/60 space-y-2">
        {currentUser && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-green-100/70 border border-green-200/60">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-accent-pink text-white flex items-center justify-center font-bold text-xs">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-brand-600 font-semibold uppercase">{currentUser.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
