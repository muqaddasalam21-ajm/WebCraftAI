import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const DashboardLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname: string): string => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/dashboard/users') return 'Users';
    if (pathname === '/dashboard/products') return 'Products';
    if (pathname === '/dashboard/orders') return 'Orders';
    if (pathname === '/dashboard/reports') return 'Reports';
    if (pathname === '/dashboard/vendors') return 'Vendors';
    if (pathname === '/dashboard/templates') return 'Templates';
    if (pathname === '/dashboard/ai-agent') return 'AI Agent Studio';
    if (pathname === '/dashboard/profile') return 'Profile';
    return 'Dashboard';
  };

  const title = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-[#f0fdf4] flex font-sans text-slate-900">
      {/* Desktop Sticky Sidebar */}
      <Sidebar className="hidden lg:flex" />

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white z-50">
            <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={title}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
