import React, { useState, useEffect } from 'react';
import { fetchMentorActivity } from '../../../services/mentorDetailsApi';
import type { MentorActivityData } from '../../../types';
import {
  ClipboardList, CheckCircle, UserPlus, UserMinus, MessageSquare,
  LogIn, FileText, Settings, Brain, Loader2, ChevronDown, Filter
} from 'lucide-react';

interface Props {
  mentorId: string;
}

const ACTIVITY_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  TASK_ASSIGNED: { icon: ClipboardList, color: 'text-blue-500', bg: 'bg-blue-50' },
  LEAVE_APPROVED: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  FEEDBACK_GIVEN: { icon: MessageSquare, color: 'text-amber-500', bg: 'bg-amber-50' },
  INTERN_ASSIGNED: { icon: UserPlus, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  INTERN_REMOVED: { icon: UserMinus, color: 'text-red-500', bg: 'bg-red-50' },
  LOGIN: { icon: LogIn, color: 'text-slate-500', bg: 'bg-slate-50' },
  REPORT_GENERATED: { icon: FileText, color: 'text-violet-500', bg: 'bg-violet-50' },
  PROFILE_UPDATED: { icon: Settings, color: 'text-pink-500', bg: 'bg-pink-50' },
  DOCUMENT_UPLOADED: { icon: FileText, color: 'text-cyan-500', bg: 'bg-cyan-50' },
  DOCUMENT_DELETED: { icon: FileText, color: 'text-red-400', bg: 'bg-red-50' },
  AI_ANALYSIS: { icon: Brain, color: 'text-purple-500', bg: 'bg-purple-50' },
};

const getActivityConfig = (type: string) => {
  return ACTIVITY_ICONS[type] || { icon: ClipboardList, color: 'text-slate-400', bg: 'bg-slate-50' };
};

const FILTER_OPTIONS = [
  { value: '', label: 'All Activities' },
  { value: 'TASK_ASSIGNED', label: 'Task Assignments' },
  { value: 'LEAVE_APPROVED', label: 'Leave Approvals' },
  { value: 'FEEDBACK_GIVEN', label: 'Feedback' },
  { value: 'INTERN_ASSIGNED', label: 'Intern Assigned' },
  { value: 'INTERN_REMOVED', label: 'Intern Removed' },
  { value: 'PROFILE_UPDATED', label: 'Profile Updates' },
  { value: 'DOCUMENT_UPLOADED', label: 'Documents' },
  { value: 'AI_ANALYSIS', label: 'AI Analysis' },
];

export const MentorActivityTimeline: React.FC<Props> = ({ mentorId }) => {
  const [activities, setActivities] = useState<MentorActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setActivities([]);
    setPage(1);
    setHasMore(true);
    loadActivities(1, true);
  }, [mentorId, filter]);

  const loadActivities = async (pg: number, reset: boolean = false) => {
    try {
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const result = await fetchMentorActivity(mentorId, pg, 20, filter || undefined);
      const newActivities = result.data || [];

      if (reset) {
        setActivities(newActivities);
      } else {
        setActivities(prev => [...prev, ...newActivities]);
      }

      setHasMore(result.pagination?.hasNext || false);
      setPage(pg);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    loadActivities(page + 1);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {FILTER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className="text-[10px] text-slate-400 font-medium">{activities.length} activities</span>
      </div>

      {/* Timeline */}
      {activities.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-400">No activity yet</p>
          <p className="text-xs text-slate-300 mt-1">Activities will appear here as actions are performed.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-100" />

          <div className="space-y-1">
            {activities.map((activity, index) => {
              const config = getActivityConfig(activity.activityType);
              const Icon = config.icon;
              return (
                <div key={activity.id} className="relative flex items-start gap-4 pl-0 py-3">
                  {/* Icon */}
                  <div className={`relative z-10 w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0 border border-white shadow-sm`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-white rounded-xl border border-slate-100 p-3.5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold rounded-full ${config.bg} ${config.color} mb-1.5`}>
                          {activity.activityType.replace(/_/g, ' ')}
                        </span>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">{activity.description}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap flex-shrink-0">
                        {formatTime(activity.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
