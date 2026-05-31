import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../../components/common/Sidebar';
import { Navbar } from '../../../components/common/Navbar';
import { MentorOverview } from './MentorOverview';
import { MentorAnalyticsTab } from './MentorAnalytics';
import { MentorInternTable } from './MentorInternTable';
import { MentorDocuments } from './MentorDocuments';
import { MentorActivityTimeline } from './MentorActivityTimeline';
import { MentorSettings } from './MentorSettings';
import { fetchMentorDetails } from '../../../services/mentorDetailsApi';
import type { MentorDetails } from '../../../types';
import { ArrowLeft, User, BarChart3, Users, FileText, Clock, Settings, Loader2 } from 'lucide-react';

const TABS = [
  { key: 'overview', label: 'Overview', icon: User },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'interns', label: 'Interns', icon: Users },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'activity', label: 'Activity', icon: Clock },
  { key: 'settings', label: 'Settings', icon: Settings },
] as const;

type TabKey = typeof TABS[number]['key'];

export const MentorDetailsPage: React.FC = () => {
  const { mentorId } = useParams<{ mentorId: string }>();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [mentor, setMentor] = useState<MentorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMentorDetails = useCallback(async () => {
    if (!mentorId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMentorDetails(mentorId);
      setMentor(data);
    } catch (err: any) {
      console.error('Failed to load mentor details:', err);
      setError(err.response?.data?.message || 'Failed to load mentor details');
    } finally {
      setLoading(false);
    }
  }, [mentorId]);

  useEffect(() => {
    loadMentorDetails();
  }, [loadMentorDetails]);

  const refreshMentor = () => {
    loadMentorDetails();
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50 font-sans">
        <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Mentor Details" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-400">Loading mentor details...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="flex h-screen bg-slate-50 font-sans">
        <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Mentor Details" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <User className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Mentor Not Found</h2>
              <p className="text-sm text-slate-500">{error || 'The requested mentor could not be found.'}</p>
              <button
                onClick={() => navigate('/hr/mentors')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Mentors
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Mentor Details" />

        {/* Header bar with back button + mentor name */}
        <div className="px-6 pt-5 pb-0">
          <div className="flex items-center gap-4 mb-5">
            <button
              onClick={() => navigate('/hr/mentors')}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">{mentor.user.name}</h1>
              <p className="text-[11px] text-slate-400 font-semibold">{mentor.designation || 'Mentor'} · {mentor.department.name}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
                mentor.mentorStatus === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  : mentor.mentorStatus === 'ON_LEAVE'
                  ? 'bg-amber-50 text-amber-600 border-amber-100'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  mentor.mentorStatus === 'ACTIVE' ? 'bg-emerald-500' :
                  mentor.mentorStatus === 'ON_LEAVE' ? 'bg-amber-500' : 'bg-slate-400'
                }`} />
                {mentor.mentorStatus === 'ACTIVE' ? 'Active' : mentor.mentorStatus === 'ON_LEAVE' ? 'On Leave' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex items-center gap-1 border-b border-slate-100">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold transition-all cursor-pointer rounded-t-lg ${
                    isActive
                      ? 'text-indigo-600 bg-white border-x border-t border-slate-100'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white border-t border-slate-50">
          {activeTab === 'overview' && <MentorOverview mentor={mentor} onRefresh={refreshMentor} />}
          {activeTab === 'analytics' && <MentorAnalyticsTab mentorId={mentor.id} />}
          {activeTab === 'interns' && <MentorInternTable mentorId={mentor.id} />}
          {activeTab === 'documents' && <MentorDocuments mentorId={mentor.id} />}
          {activeTab === 'activity' && <MentorActivityTimeline mentorId={mentor.id} />}
          {activeTab === 'settings' && <MentorSettings mentor={mentor} onSaved={refreshMentor} />}
        </div>
      </main>
    </div>
  );
};
