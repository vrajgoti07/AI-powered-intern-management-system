import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { DonutChart } from '../../components/charts/DonutChart';
import api from '../../services/api';
import {
  Award, TrendingUp, BarChart3, Brain, Filter, Users, CheckCircle,
  AlertTriangle, ChevronDown, RefreshCw, Search, Calendar, Briefcase, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface DepartmentAnalytic {
  departmentName: string;
  total: number;
  ready: number;
  averageScore: number;
}

interface RecentInterview {
  id: string;
  internName: string;
  department: string;
  jobRole: string;
  score: number;
  readinessLevel: 'READY' | 'NEARLY_READY' | 'NEEDS_PRACTICE';
  completedAt: string;
}

interface AnalyticsData {
  totalInterviews: number;
  readinessBreakdown: {
    READY: number;
    NEARLY_READY: number;
    NEEDS_PRACTICE: number;
  };
  departmentAnalytics: DepartmentAnalytic[];
  recentInterviews: RecentInterview[];
}

export const InterviewAnalytics: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedReadiness, setSelectedReadiness] = useState('All');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/mock-interviews/analytics');
      if (res.data.success && res.data.data) {
        setAnalyticsData(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch interview analytics:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch interview analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getReadinessColor = (level: string) => {
    switch (level) {
      case 'READY':
        return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' };
      case 'NEARLY_READY':
        return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' };
      case 'NEEDS_PRACTICE':
      default:
        return { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' };
    }
  };

  // Compute values for stats cards
  const totalCompleted = analyticsData?.totalInterviews || 0;
  const readyCount = analyticsData?.readinessBreakdown?.READY || 0;
  const nearlyReadyCount = analyticsData?.readinessBreakdown?.NEARLY_READY || 0;
  const needsPracticeCount = analyticsData?.readinessBreakdown?.NEEDS_PRACTICE || 0;

  const readyPercentage = totalCompleted > 0 ? Math.round((readyCount / totalCompleted) * 100) : 0;
  const needsPracticePercentage = totalCompleted > 0 ? Math.round((needsPracticeCount / totalCompleted) * 100) : 0;

  // Compute average overall score from recent interviews
  const avgScore = analyticsData?.recentInterviews && analyticsData.recentInterviews.length > 0
    ? Math.round(analyticsData.recentInterviews.reduce((sum, item) => sum + item.score, 0) / analyticsData.recentInterviews.length)
    : 0;

  // Donut chart readiness data
  const donutData = [
    { name: 'Job Ready', value: readyCount },
    { name: 'Nearly Ready', value: nearlyReadyCount },
    { name: 'Needs Practice', value: needsPracticeCount }
  ].filter(item => item.value > 0);

  // Fallback donut chart data if all counts are 0
  const chartData = donutData.length > 0 ? donutData : [
    { name: 'Job Ready', value: 0 },
    { name: 'Nearly Ready', value: 0 },
    { name: 'Needs Practice', value: 0 }
  ];

  const donutColors = ['#10b981', '#f59e0b', '#ef4444'];

  // Filters logic
  const filteredInterviews = analyticsData?.recentInterviews.filter(item => {
    const matchesSearch = item.internName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.jobRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === 'All' || item.jobRole === selectedRole;
    const matchesReadiness = selectedReadiness === 'All' || item.readinessLevel === selectedReadiness;

    return matchesSearch && matchesRole && matchesReadiness;
  }) || [];

  // Extract unique roles for filters dropdown
  const uniqueRoles = Array.from(new Set(analyticsData?.recentInterviews.map(i => i.jobRole) || []));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="AI Interview Analytics" />

        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Analytics Dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
            
            {/* Header info bar */}
            <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/50 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">AI Interview Analytics</h2>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Evaluate pre-placement mock session indicators, overall organizational readiness, and technical profiles.
                  </p>
                </div>
              </div>

              <button
                onClick={fetchAnalytics}
                className="flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 text-xs font-black text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Reports
              </button>
            </div>

            {/* Stats Overview row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              {/* Total Completed */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 flex-shrink-0 border border-indigo-100">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Evaluated</span>
                  <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalCompleted}</h3>
                  <p className="text-[9px] font-bold text-slate-400 leading-none mt-1">Completed Sessions</p>
                </div>
              </div>

              {/* Job Ready */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 flex-shrink-0 border border-emerald-100">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Job Ready Tier</span>
                  <h3 className="text-2xl font-black text-slate-800 mt-0.5">{readyCount}</h3>
                  <p className="text-[9px] font-black text-emerald-600 leading-none mt-1">
                    {readyPercentage}% of Candidates
                  </p>
                </div>
              </div>

              {/* Needs Practice */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 flex-shrink-0 border border-red-100">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Needs Practice</span>
                  <h3 className="text-2xl font-black text-slate-800 mt-0.5">{needsPracticeCount}</h3>
                  <p className="text-[9px] font-black text-red-600 leading-none mt-1">
                    {needsPracticePercentage}% of Candidates
                  </p>
                </div>
              </div>

              {/* Average Index */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 flex-shrink-0 border border-amber-100">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Average Index</span>
                  <h3 className="text-2xl font-black text-slate-800 mt-0.5">{avgScore}%</h3>
                  <p className="text-[9px] font-bold text-slate-400 leading-none mt-1">Avg Assessment Score</p>
                </div>
              </div>
            </div>

            {/* Visual Analytics Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              {/* Readiness Breakdown Pie Chart Card */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[300px]">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                    Readiness Distribution
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Ratio of preparedness classifications</p>
                </div>

                <div className="py-4 relative flex items-center justify-center">
                  {totalCompleted === 0 ? (
                    <div className="py-12 text-center text-slate-350 text-xs font-bold uppercase tracking-wider">
                      No data to chart
                    </div>
                  ) : (
                    <DonutChart data={chartData} colors={donutColors} height={160} />
                  )}
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-50 text-xs">
                  <div className="flex items-center justify-between font-semibold">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Job Ready</span>
                    </div>
                    <span className="font-extrabold text-slate-800">{readyCount} ({readyPercentage}%)</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>Nearly Ready</span>
                    </div>
                    <span className="font-extrabold text-slate-800">
                      {nearlyReadyCount} ({totalCompleted > 0 ? Math.round((nearlyReadyCount / totalCompleted) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span>Needs Practice</span>
                    </div>
                    <span className="font-extrabold text-slate-800">{needsPracticeCount} ({needsPracticePercentage}%)</span>
                  </div>
                </div>
              </div>

              {/* Department Aggregates */}
              <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-500" />
                    Department Readiness Aggregates
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Evaluating average score curves across department channels</p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pt-6 max-h-[300px]">
                  {!analyticsData?.departmentAnalytics || analyticsData.departmentAnalytics.length === 0 ? (
                    <div className="py-16 text-center text-slate-350 text-xs font-bold uppercase tracking-wider">
                      No department reports registered
                    </div>
                  ) : (
                    analyticsData.departmentAnalytics.map((dept) => (
                      <div key={dept.departmentName} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-800">{dept.departmentName}</span>
                          <span className="text-indigo-600 font-extrabold">{dept.averageScore}% avg</span>
                        </div>
                        {/* Progress Bar Container */}
                        <div className="relative">
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                              style={{ width: `${dept.averageScore}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-400 font-semibold mt-1">
                            <span>{dept.total} session{dept.total !== 1 ? 's' : ''} evaluated</span>
                            <span className="text-emerald-600 font-bold">{dept.ready} job ready</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Candidates Attempts List */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-left space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-50">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-indigo-500" />
                    Recent Assessment Sessions
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Filter and query candidate mock attempts</p>
                </div>

                {/* Filters block */}
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  {/* Search input */}
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search candidate or role..."
                      className="w-full sm:w-56 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-slate-350"
                    />
                  </div>

                  {/* Role filter */}
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    <option value="All">All Job Roles</option>
                    {uniqueRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>

                  {/* Readiness filter */}
                  <select
                    value={selectedReadiness}
                    onChange={(e) => setSelectedReadiness(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    <option value="All">All Readiness</option>
                    <option value="READY">READY</option>
                    <option value="NEARLY_READY">NEARLY READY</option>
                    <option value="NEEDS_PRACTICE">NEEDS PRACTICE</option>
                  </select>
                </div>
              </div>

              {/* Table list */}
              <div className="overflow-x-auto">
                {filteredInterviews.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <HelpCircle className="w-10 h-10 mx-auto text-slate-300 animate-bounce" />
                    <p className="text-xs font-bold uppercase tracking-wider">No matching assessment logs found</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <th className="py-3 px-4">Intern Name</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Target Job Role</th>
                        <th className="py-3 px-4">Overall Score</th>
                        <th className="py-3 px-4">Readiness Level</th>
                        <th className="py-3 px-4">Date Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInterviews.map((item) => {
                        const style = getReadinessColor(item.readinessLevel);
                        return (
                          <tr key={item.id} className="border-b border-slate-100/50 hover:bg-slate-50/30 transition-all font-semibold text-slate-700">
                            <td className="py-3.5 px-4 font-bold text-slate-900">{item.internName}</td>
                            <td className="py-3.5 px-4 text-slate-500">{item.department}</td>
                            <td className="py-3.5 px-4 font-extrabold text-indigo-600">{item.jobRole}</td>
                            <td className="py-3.5 px-4 font-black text-slate-800 text-sm">{item.score}%</td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border ${style.bg} ${style.text} ${style.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                {item.readinessLevel.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-400 text-[10px]">
                              {new Date(item.completedAt).toLocaleDateString()} at {new Date(item.completedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};
