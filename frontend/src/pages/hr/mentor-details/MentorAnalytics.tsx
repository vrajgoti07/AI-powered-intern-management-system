import React, { useState, useEffect } from 'react';
import { fetchMentorAnalytics, refreshMentorAnalytics } from '../../../services/mentorDetailsApi';
import type { MentorAnalyticsData } from '../../../types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { RefreshCw, TrendingUp, Users, Star, ClipboardCheck, BookOpen, Award, Brain, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  mentorId: string;
}

const KPI_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444'];

export const MentorAnalyticsTab: React.FC<Props> = ({ mentorId }) => {
  const [analytics, setAnalytics] = useState<MentorAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [mentorId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await fetchMentorAnalytics(mentorId);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const data = await refreshMentorAnalytics(mentorId);
      setAnalytics(data);
      toast.success('Analytics refreshed from database');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to refresh analytics');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-slate-400 font-medium">No analytics data available.</p>
        <button onClick={handleRefresh} className="mt-3 px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all cursor-pointer">
          Generate Analytics
        </button>
      </div>
    );
  }

  const trend = (analytics.performanceTrend as Array<{ month: string; score: number; tasks: number }>) || [];

  // Intern success pie data
  const successData = [
    { name: 'Completed', value: analytics.completedInternships },
    { name: 'Active/Ongoing', value: Math.max(0, analytics.totalInterns - analytics.completedInternships) },
  ];

  // Monthly activity data from trend
  const activityData = trend.map(t => ({
    month: t.month,
    tasks: t.tasks,
    score: t.score,
  }));

  const kpis = [
    { label: 'Total Interns', value: analytics.totalInterns, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Completed', value: analytics.completedInternships, icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Avg Rating', value: analytics.avgRating.toFixed(1), icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Tasks Reviewed', value: analytics.taskReviews, icon: ClipboardCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Leave Approvals', value: analytics.leaveApprovalsHandled, icon: BookOpen, color: 'text-violet-500', bg: 'bg-violet-50' },
    { label: 'AI Score', value: analytics.aiMentorScore?.toFixed(1) || '—', icon: Brain, color: 'text-pink-500', bg: 'bg-pink-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          <h3 className="text-sm font-extrabold text-slate-800">Performance Analytics</h3>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Refresh Analytics
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-8 h-8 ${kpi.bg} rounded-xl flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className="text-xl font-extrabold text-slate-800">{kpi.value}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h4 className="text-xs font-extrabold text-slate-700 mb-4">Performance Trend (6 Months)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ fontSize: '11px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ fill: '#6366f1', r: 4 }}
                activeDot={{ r: 6, fill: '#6366f1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Activity */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h4 className="text-xs font-extrabold text-slate-700 mb-4">Monthly Task Activity</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ fontSize: '11px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="tasks" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Intern Success Rate Donut */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h4 className="text-xs font-extrabold text-slate-700 mb-4">Intern Success Rate</h4>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={successData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {successData.map((_entry, i) => (
                    <Cell key={i} fill={KPI_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {successData.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: KPI_COLORS[i] }} />
                {item.name}: {item.value}
              </div>
            ))}
          </div>
        </div>

        {/* Task Review Stats */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h4 className="text-xs font-extrabold text-slate-700 mb-4">Review & Approval Stats</h4>
          <div className="space-y-4 py-3">
            {[
              { label: 'Tasks Reviewed', value: analytics.taskReviews, max: Math.max(analytics.taskReviews, 20), color: 'bg-indigo-500' },
              { label: 'Attendance Reviews', value: analytics.attendanceReviews, max: Math.max(analytics.attendanceReviews, 10), color: 'bg-emerald-500' },
              { label: 'Leave Approvals', value: analytics.leaveApprovalsHandled, max: Math.max(analytics.leaveApprovalsHandled, 10), color: 'bg-amber-500' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500">{stat.label}</span>
                  <span className="text-xs font-extrabold text-slate-700">{stat.value}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stat.color} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min((stat.value / stat.max) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
