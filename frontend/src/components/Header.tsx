import React, { useState } from 'react';
import { Bell, Menu, User as UserIcon, LogOut, ExternalLink, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from './SearchBar';
import { NotificationDropdown } from './NotificationDropdown';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  title: string;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onOpenMobileMenu }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const userDisplayName = currentUser ? currentUser.name : 'WebCraft User';
  const userDisplayEmail = currentUser ? currentUser.email : 'user@webcraft.ai';
  const userDisplayRole = currentUser ? currentUser.role : 'User';

  return (
    <header className="h-16 bg-[#f0fdf4]/95 backdrop-blur-md border-b border-green-200/70 sticky top-0 z-30 px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu & Page Title */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-green-100"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-xl font-bold text-slate-900 tracking-tight hidden sm:block">
          {title}
        </h1>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 flex justify-center max-w-lg">
        <SearchBar />
      </div>

      {/* Right: Notifications & User Menu */}
      <div className="flex items-center gap-3">
        {/* Quick AI Agent Trigger */}
        <button
          onClick={() => navigate('/dashboard/ai-agent')}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-semibold border border-brand-200/60 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent-pink" />
          <span>AI Builder</span>
        </button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-green-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-pink text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {userDisplayName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-slate-800 leading-none">{userDisplayName}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-none">{userDisplayRole}</p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#f0fdf4] rounded-2xl shadow-2xl border border-green-200/60 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 border-b border-green-200/50 mb-1">
                <p className="text-xs font-bold text-slate-900">{userDisplayName}</p>
                <p className="text-[11px] text-slate-500 truncate">{userDisplayEmail}</p>
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-800">
                  {userDisplayRole}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/dashboard/profile');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-green-100 rounded-lg text-left"
              >
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>Account Profile</span>
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-green-100 rounded-lg text-left"
              >
                <ExternalLink className="w-4 h-4 text-slate-400" />
                <span>View Landing Page</span>
              </button>
              <div className="border-t border-green-200/50 my-1" />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
