import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useInternByUser } from '../../hooks/queries';
import { useOnboardingStatus } from '../../hooks/useOnboarding';
import {
  LayoutDashboard, Users, UserCheck, Building2, BarChart3,
  Megaphone, Settings, LogOut, ClipboardCheck,
  TrendingUp, Calendar, Brain, MessageSquare, Code, Award,
  ShieldCheck, Milestone, ShieldAlert, ThumbsUp, ChevronDown, ChevronRight
} from 'lucide-react';

import { Logo } from './Logo';

interface SidebarProps {
  collapsed: boolean;
  onClose?: () => void;
}

interface NavChild {
  icon: any;
  label: string;
  path: string;
}

interface NavItem {
  icon: any;
  label: string;
  path?: string;
  children?: NavChild[];
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onClose }) => {
  const { user, logout } = useAuth();
  const { data: myInternData } = useInternByUser(user?.role?.toLowerCase() === 'intern' ? (user?.id || '') : '');
  const isIntern = user?.role?.toLowerCase() === 'intern';
  const { data: onboardingStatus } = useOnboardingStatus(isIntern);
  const location = useLocation();
  const navigate = useNavigate();

  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Nav configurations based on role
  const getNavItems = (): NavItem[] => {
    if (!user) return [];

    switch (user.role.toLowerCase()) {
      case 'hr':
        return [
          { icon: LayoutDashboard, label: "Dashboard", path: "/hr/dashboard" },
          {
            icon: Users,
            label: "Management Hub",
            children: [
              { icon: Users, label: "Intern Management", path: "/hr/interns" },
              { icon: ShieldCheck, label: "Onboarding approvals", path: "/hr/onboarding-verification" },
              { icon: UserCheck, label: "Mentors", path: "/hr/mentors" },
              { icon: Building2, label: "Departments", path: "/hr/departments" }
            ]
          },
          {
            icon: Brain,
            label: "AI Co-Pilot Hub",
            children: [
              { icon: Brain, label: "AI Resume Parser", path: "/shared/resume-parser" },
              { icon: Milestone, label: "AI Mentor Matching", path: "/hr/ai-recommendations" },
              { icon: ShieldAlert, label: "AI Risk Assessment", path: "/hr/risk-detection" },
              { icon: ThumbsUp, label: "AI Feedback Analysis", path: "/shared/ai-feedback" }
            ]
          },
          { icon: BarChart3, label: "Reports & Analytics", path: "/hr/reports" },
          { icon: Megaphone, label: "Announcements", path: "/hr/announcements" },
          { icon: Settings, label: "Settings", path: "/hr/settings" }
        ];
      case 'mentor':
      case 'department_head':
        return [
          { icon: LayoutDashboard, label: "Dashboard", path: "/mentor/dashboard" },
          { icon: MessageSquare, label: "Group Channels", path: "/shared/communication" },
          {
            icon: Brain,
            label: "AI Co-Pilot Hub",
            children: [
              { icon: Brain, label: "AI Resume Parser", path: "/shared/resume-parser" },
              { icon: ThumbsUp, label: "AI Feedback Analysis", path: "/shared/ai-feedback" }
            ]
          },
          { icon: ClipboardCheck, label: "Task Management", path: "/mentor/tasks" },
          { icon: Award, label: "Grade Deliverables", path: "/mentor/tasks/review" },
          { icon: TrendingUp, label: "Performance Tracker", path: "/mentor/performance" },
          { icon: Settings, label: "Settings", path: "/mentor/settings" }
        ];
      case 'intern': {
        const baseItems: NavItem[] = [
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
            {
              icon: Brain,
              label: "AI Co-Pilot Hub",
              children: [
                { icon: Brain, label: "AI Resume Parser", path: "/shared/resume-parser" },
                { icon: ThumbsUp, label: "AI Feedback Analysis", path: "/shared/ai-feedback" }
              ]
            },
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

  // Auto-expand group if one of its children is active
  React.useEffect(() => {
    navItems.forEach((item) => {
      if (item.children?.some((child) => location.pathname === child.path)) {
        setOpenGroups((prev) => {
          if (prev[item.label]) return prev;
          return { ...prev, [item.label]: true };
        });
      }
    });
  }, [location.pathname]);

  React.useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      document.body.style.overflow = !collapsed ? 'hidden' : '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [collapsed]);

  return (
    <>
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        ${collapsed
          ? '-translate-x-full md:translate-x-0 md:w-20'
          : 'translate-x-0 w-64 md:w-64'}
        bg-[#0f172a] flex flex-col h-[100dvh]
        transition-all duration-300 flex-shrink-0
      `}>
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

          if (item.children) {
            const isGroupExpanded = !!openGroups[item.label];
            const hasActiveChild = item.children.some((child) => location.pathname === child.path);

            return (
              <div key={item.label} className="space-y-1">
                {/* Accordion Group Header Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!collapsed) {
                      setOpenGroups((prev) => ({ ...prev, [item.label]: !prev[item.label] }));
                    }
                  }}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 group relative border-0 bg-transparent text-left cursor-pointer
                    ${hasActiveChild && !isGroupExpanded
                      ? "text-white bg-[#1e293b]/50"
                      : "text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#cbd5e1]"
                    }
                    ${collapsed ? "justify-center" : ""}`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110
                    ${hasActiveChild ? "text-[#2563eb]" : "text-[#94a3b8] group-hover:text-[#cbd5e1]"}`}
                  />

                  {!collapsed && (
                    <>
                      <span className="truncate flex-1">{item.label}</span>
                      {isGroupExpanded ? (
                        <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-transform" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-transform" />
                      )}
                    </>
                  )}

                  {/* Collapsed Hover Submenu popover */}
                  {collapsed && (
                    <div className="absolute left-20 top-0 hidden group-hover:flex flex-col bg-[#0f172a] border border-white/[0.08] rounded-2xl py-2 px-1.5 shadow-2xl z-50 min-w-[210px] whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-200">
                      <div className="px-3.5 py-1.5 text-white/40 text-[10px] font-bold uppercase tracking-wider border-b border-white/[0.05] mb-1.5 text-left">
                        {item.label}
                      </div>
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = location.pathname === child.path;
                        return (
                          <Link
                            key={child.label}
                            to={child.path}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 border-0 text-left
                              ${isChildActive
                                ? "bg-[#2563eb] text-white"
                                : "text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#cbd5e1]"
                              }`}
                          >
                            <ChildIcon className="w-4 h-4 flex-shrink-0" />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </button>

                {/* Submenu links (Expanded view) */}
                {!collapsed && isGroupExpanded && (
                  <div className="pl-6 pr-1 py-1 space-y-1 border-l border-white/[0.05] ml-6 transition-all duration-300">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = location.pathname === child.path;
                      return (
                        <Link
                          key={child.label}
                          to={child.path}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 group
                            ${isChildActive
                              ? "bg-[#2563eb] text-white shadow-md shadow-blue-900/20"
                              : "text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#cbd5e1]"
                            }`}
                        >
                          <ChildIcon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-105 ${isChildActive ? "text-white" : "text-[#94a3b8]"}`} />
                          <span className="truncate">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Render Standard Nav Item
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path || '#'}
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

        {/* Dedicated mobile logout item */}
        {!collapsed && (
          <div className="md:hidden pt-4 border-t border-white/[0.08] mt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 text-rose-450 hover:bg-rose-950/30 hover:text-rose-300 cursor-pointer border-0 bg-transparent text-left"
            >
              <LogOut className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>Logout</span>
            </button>
          </div>
        )}
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
              className="p-1.5 hover:bg-[#1e293b] rounded-xl transition-colors text-[#94a3b8] hover:text-red-400 cursor-pointer border-0 bg-transparent"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
          {collapsed && (
            <button
              onClick={handleLogout}
              className="absolute bottom-4 bg-red-600 text-white p-2 rounded-xl opacity-0 hover:opacity-100 transition-opacity border-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </aside>
    </>
  );
};

