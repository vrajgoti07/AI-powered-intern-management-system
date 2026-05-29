import React, { useState, useEffect } from 'react';
import { Menu, Search, Bell, X, Calendar, CheckCircle } from 'lucide-react';
import { Pagination } from '../Pagination';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from './Avatar';
import { NotificationBell } from './NotificationBell';
import { useInternByUser } from '../../hooks/queries';

interface NavbarProps {
  onToggleSidebar: () => void;
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, title }) => {
  const { user } = useAuth();

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning";
    if (hr < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getTodayDateString = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };



  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0 relative z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5 text-slate-500" />
        </button>
        <div>
          <h1 className="text-base md:text-lg font-extrabold text-slate-800 tracking-tight">
            {title ? title : `${getGreeting()}, ${user?.name || 'User'} 👋`}
          </h1>
          <p className="text-[11px] md:text-xs text-slate-400 font-medium mt-0.5">
            {getTodayDateString()} · Q2 Internship Cycle
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            placeholder="Search interns, tasks..."
            className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl w-56 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
          />
        </div>

        {/* Notifications Button */}
        <NotificationBell />

        {/* User Avatar */}
        {user && (
          <div className="flex items-center gap-2">
            <Avatar name={user.name} size="sm" url={user.avatarUrl} />
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-snug">{user.name}</p>
              <p className="text-[9px] text-[#2563eb] font-bold tracking-wider uppercase leading-none mt-0.5">
                {user.role}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
