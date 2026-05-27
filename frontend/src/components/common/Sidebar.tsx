import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useInternByUser } from '../../hooks/queries';
import { useOnboardingStatus } from '../../hooks/useOnboarding';
import {
  LayoutDashboard, Users, UserCheck, Building2, BarChart3,
  Megaphone, Settings, LogOut, GraduationCap, ClipboardCheck,
  TrendingUp, Calendar, User, Brain, MessageSquare, Code, Award,
  ShieldCheck, Milestone
} from 'lucide-react';

import { Logo } from './Logo';

interface SidebarProps {
  collapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const { user, logout } = useAuth();
  const { data: myInternData } = useInternByUser(user?.id || '');
  const { data: onboardingStatus } = useOnboardingStatus();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Nav configurations based on role
  const getNavItems = () => {
    if (!user) return [];

    switch (user.role.toLowerCase()) {
      case 'hr':
        return [
          { icon: LayoutDashboard, label: "Dashboard", path: "/hr/dashboard" },
          { icon: Users, label: "Intern Management", path: "/hr/interns" },
          { icon: ShieldCheck, label: "Onboarding approvals", path: "/hr/onboarding-verification" },
          { icon: UserCheck, label: "Mentors", path: "/hr/mentors" },
          { icon: Building2, label: "Departments", path: "/hr/departments" },
          { icon: BarChart3, label: "Reports & Analytics", path: "/hr/reports" },
          { icon: Megaphone, label: "Announcements", path: "/hr/announcements" },
          { icon: Settings, label: "Settings", path: "/hr/settings" }
        ];
      case 'mentor':
      case 'department_head':
        return [
          { icon: LayoutDashboard, label: "Dashboard", path: "/mentor/dashboard" },
          { icon: MessageSquare, label: "Group Channels", path: "/shared/communication" },
          { icon: ClipboardCheck, label: "Task Management", path: "/mentor/tasks" },
          { icon: Award, label: "Grade Deliverables", path: "/mentor/tasks/review" },
          { icon: TrendingUp, label: "Performance Tracker", path: "/mentor/performance" },
          { icon: Settings, label: "Settings", path: "/mentor/settings" }
        ];
      case 'intern': {
        const baseItems = [
          { icon: ShieldCheck, label: "My Onboarding", path: "/intern/onboarding" }
        ];

        const isFullyApproved = myInternData?.status === 'ACTIVE';
        if (isFullyApproved) {
          return [
            ...baseItems,
            { icon: LayoutDashboard, label: "Dashboard", path: "/intern/dashboard" },
            { icon: ClipboardCheck, label: "Tasks & Schedule", path: "/intern/tasks" },
            { icon: Calendar, label: "Attendance & Leaves", path: "/shared/attendance-leave" },
            { icon: Code, label: "Developer Portfolio", path: "/intern/portfolio" },
            { icon: MessageSquare, label: "Team & AI Help", path: "/shared/communication" },
            { icon: BarChart3, label: "Performance & AI Hub", path: "/shared/performance-analytics" },
            { icon: Settings, label: "Settings", path: "/intern/settings" }
          ];
        }

        return baseItems;
      }
      case 'admin':
        return [
          { icon: Settings, label: "Super Admin panel", path: "/admin/super-admin" }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className={`${collapsed ? "w-20" : "w-64"} bg-[#0f172a] flex flex-col h-screen transition-all duration-300 flex-shrink-0 z-40`}>
      {/* Brand Logo */}
      <div className={`flex items-center gap-3 px-5 py-6 border-b border-white/[0.08] ${collapsed ? "justify-center px-0" : ""}`}>
        <Logo size="sm" showText={false} />
        {!collapsed && (
          <span className="font-bold text-white text-xl tracking-tight">
            InternFlow
          </span>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-6 space-y-1.5 px-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 group relative
                ${isActive
                  ? "bg-[#2563eb] text-white shadow-xl shadow-blue-900/30"
                  : "text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#cbd5e1]"
                }
                ${collapsed ? "justify-center" : ""}`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-white" : "text-[#94a3b8] group-hover:text-[#cbd5e1]"}`} />

              {!collapsed && <span className="truncate">{item.label}</span>}

              {/* Tooltip on Collapsed */}
              {collapsed && (
                <div className="absolute left-24 bg-[#0f172a] text-white text-xs font-semibold px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 shadow-2xl border border-white/[0.08] z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section at Footer */}
      {user && (
        <div className={`p-4 border-t border-white/[0.08] flex items-center gap-3 bg-[#0f172a]/50 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-10 h-10 bg-[#2563eb] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
            {user.name.charAt(0)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[#e2e8f0] text-sm font-bold truncate leading-snug">{user.name}</p>
              <p className="text-white/40 text-xs truncate leading-normal mt-0.5">{user.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-[#1e293b] rounded-xl transition-colors text-[#94a3b8] hover:text-red-400 cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
          {collapsed && (
            <button
              onClick={handleLogout}
              className="absolute bottom-4 bg-red-600 text-white p-2 rounded-xl opacity-0 hover:opacity-100 transition-opacity"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
