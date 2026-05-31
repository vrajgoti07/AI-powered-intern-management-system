import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { 
  Building2, Users, UserCheck, Briefcase, Calendar, TrendingUp,
  Clock, ArrowLeft, Check, X, FileText, BarChart3, Loader2, AlertCircle,
  FileCheck, ShieldAlert, Crown
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  LineChart, Line, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { useQuery } from '@tanstack/react-query';

export const DepartmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'interns' | 'mentors' | 'projects' | 'reports'>('overview');
  
  // Data States
  const [analytics, setAnalytics] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);

  // useQuery hook for core department fetching
  const { data: departmentData, isLoading: isDeptLoading, error: deptError, refetch: refetchDept } = useQuery({
    queryKey: ['department', id],
    queryFn: async () => {
      const res = await api.get(`/departments/${id}`);
      if (!res.data.success) throw new Error('Failed to load department details');
      return res.data.data;
    },
    enabled: !!id,
  });

  const department = departmentData || {};

  const fetchSecondaryData = async () => {
    if (!id) return;
    try {
      // Fetch analytics
      const analyticsRes = await api.get(`/departments/${id}/analytics`);
      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.data.statistics);
      }

      // Fetch activity history
      const activitiesRes = await api.get(`/departments/${id}/activity-logs`);
      if (activitiesRes.data.success) {
        setActivities(activitiesRes.data.data || []);
      }

      // Fetch leaves
      const leavesRes = await api.get('/leave');
      if (leavesRes.data.success) {
        const rawLeaves = leavesRes.data.data.data || [];
        const deptUserIds = new Set((departmentData?.interns || []).map((u: any) => u.id));
        const filteredLeaves = rawLeaves.filter((l: any) => deptUserIds.has(l.userId));
        setPendingLeaves(filteredLeaves);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSecondaryData();
    }
  }, [id, departmentData]);

  const handleApproveLeave = async (leaveId: string) => {
    try {
      await api.put(`/leave/${leaveId}/approve`);
      toast.success('Leave request approved successfully!');
      refetchDept();
      fetchSecondaryData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve leave request.');
    }
  };

  const handleRejectLeave = async (leaveId: string) => {
    try {
      await api.put(`/leave/${leaveId}/reject`, {
        rejectReason: 'Rejected by Executive HR Division Head'
      });
      toast.success('Leave request declined.');
      refetchDept();
      fetchSecondaryData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject leave request.');
    }
  };

  // Generate dynamic mock analytics for Recharts if there are no interns or mock details
  const taskChartData = [
    { name: 'Completed', value: 12, color: '#10b981' },
    { name: 'In Progress', value: 8, color: '#6366f1' },
    { name: 'Todo', value: 5, color: '#f59e0b' }
  ];

  const internScoresChartData = (department.interns || []).map((i: any) => ({
    name: i.name,
    score: i.intern?.score || 0
  }));

  const attendanceTrendData = [
    { name: 'Mon', attendance: 92 },
    { name: 'Tue', attendance: 95 },
    { name: 'Wed', attendance: 98 },
    { name: 'Thu', attendance: 94 },
    { name: 'Fri', attendance: 96 }
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title={isDeptLoading ? 'Loading Division...' : `Division: ${department.name || ''}`} />

        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {/* Header breadcrumb card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/hr/departments')}
                className="p-2.5 hover:bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all text-slate-500 hover:text-indigo-600 cursor-pointer bg-white shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                {deptError ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 animate-pulse">
                    <span>Failed to load department data.</span>
                    <button 
                      onClick={() => refetchDept()}
                      className="underline text-indigo-600 hover:text-indigo-800 font-black cursor-pointer bg-transparent border-none p-0"
                    >
                      Retry.
                    </button>
                  </div>
                ) : isDeptLoading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-6 w-32 bg-slate-200 rounded"></div>
                    <div className="h-3.5 w-48 bg-slate-200 rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-slate-800 tracking-tight">{department.name}</h2>
                      {department.code && (
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-widest border border-slate-200">
                          {department.code}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-400">Head of Department: <span className="text-slate-700 font-bold">{department.head?.name || 'Unassigned'}</span></p>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-500">
              <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200">
                Onboarding: {analytics?.onboardingCompletionRate || 0}%
              </span>
              <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200">
                Attendance: {analytics?.averageAttendance || 0}%
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 overflow-x-auto gap-4 scrollbar-none">
            {(['overview', 'interns', 'mentors', 'projects', 'reports'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-4 text-xs font-black capitalize tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 text-left">
              {/* Telemetry Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center animate-pulse-slow">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Interns</p>
                    {isDeptLoading ? (
                      <div className="h-6 w-10 bg-slate-200 animate-pulse rounded mt-1"></div>
                    ) : (
                      <p className="text-xl font-black text-slate-800">{department.internCount || 0}</p>
                    )}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center animate-pulse-slow">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Mentors</p>
                    {isDeptLoading ? (
                      <div className="h-6 w-10 bg-slate-200 animate-pulse rounded mt-1"></div>
                    ) : (
                      <p className="text-xl font-black text-slate-800">{department.mentorCount || 0}</p>
                    )}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Projects</p>
                    <p className="text-xl font-black text-slate-800">{analytics?.activeProjects || 0}</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Score</p>
                    <p className="text-xl font-black text-slate-800">{analytics?.averageScore || 0}</p>
                  </div>
                </div>
              </div>

              {/* General details and overview layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile card details */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-800 text-base">Division Overview</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {department.description || 'No detailed operating instructions provided. Expand structure using team registry.'}
                  </p>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 text-xs font-semibold text-slate-500">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Theme Accent Color</p>
                      <span className="capitalize">{department.colorTheme || 'Indigo'}</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Status</p>
                      <span className="text-emerald-600 font-bold">Active and Operational</span>
                    </div>
                  </div>
                </div>

                {/* Manager / Leader Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Crown className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Executive Head</h3>
                  </div>

                  {isDeptLoading ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-200"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-slate-200 rounded"></div>
                          <div className="h-3 w-32 bg-slate-200 rounded"></div>
                        </div>
                      </div>
                      <div className="h-8 bg-slate-100 rounded-2xl"></div>
                    </div>
                  ) : department.head ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-black text-base text-slate-700 border border-slate-200 shadow-sm">
                          {department.head.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{department.head.name}</p>
                          <p className="text-[10px] font-bold text-slate-400">{department.head.email}</p>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 p-3.5 rounded-2xl text-[10px] font-bold text-slate-400 border border-slate-100 flex justify-between">
                        <span>Corporate Authorization:</span>
                        <span className="text-slate-700 font-black">DEPARTMENT_HEAD</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 font-bold text-xs space-y-3">
                      <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto" />
                      <p>No departmental head assigned yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERNS */}
          {activeTab === 'interns' && (
            <div className="space-y-6 text-left">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-extrabold text-slate-800 text-base mb-4">Assigned Interns ({department.interns?.length || 0})</h3>
                
                {department.interns?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-semibold text-slate-500">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase font-black">
                          <th className="pb-3">Name</th>
                          <th className="pb-3">Email</th>
                          <th className="pb-3">Score</th>
                          <th className="pb-3">Attendance</th>
                          <th className="pb-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {department.interns.map((i: any) => (
                          <tr key={i.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50">
                            <td className="py-3.5 font-bold text-slate-800">{i.name}</td>
                            <td className="py-3.5">{i.email}</td>
                            <td className="py-3.5 font-bold text-indigo-600">{i.intern?.score || 0}/100</td>
                            <td className="py-3.5 font-bold text-slate-700">{i.intern?.attendance || 0}%</td>
                            <td className="py-3.5 text-right">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                i.intern?.status === 'ACTIVE' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : i.intern?.status === 'COMPLETED' 
                                  ? 'bg-indigo-100 text-indigo-800' 
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {i.intern?.status || 'PENDING'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-bold py-4">No interns assigned to this division.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MENTORS */}
          {activeTab === 'mentors' && (
            <div className="space-y-6 text-left">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-extrabold text-slate-800 text-base mb-4">Assigned Mentors ({department.mentors?.length || 0})</h3>
                
                {department.mentors?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-semibold text-slate-500">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase font-black">
                          <th className="pb-3">Name</th>
                          <th className="pb-3">Email</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {department.mentors.map((m: any) => (
                          <tr key={m.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50">
                            <td className="py-3.5 font-bold text-slate-800">{m.name}</td>
                            <td className="py-3.5">{m.email}</td>
                            <td className="py-3.5 text-right">
                              <button 
                                onClick={() => navigate(`/hr/mentors/${m.mentor?.id || m.id}`)}
                                className="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer font-bold"
                              >
                                View Profile
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-bold py-4">No mentors assigned to this division.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PROJECTS */}
          {activeTab === 'projects' && (
            <div className="space-y-6 text-left">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-extrabold text-slate-800 text-base mb-4">Department Projects</h3>
                
                {department.projects && department.projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {department.projects.map((p: any) => (
                      <div key={p.id} className="p-5 border border-slate-200 rounded-2xl flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm mb-2">{p.title}</h4>
                          <p className="text-xs text-slate-500 mb-4">{p.description || 'No description provided'}</p>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            p.status === 'ACTIVE' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {p.status}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-bold py-4">No projects have been created yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: REPORTS & ANALYTICS */}
          {activeTab === 'reports' && (
            <div className="space-y-6 text-left">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Score Spread BarChart */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    Intern Performance Scores
                  </h3>
                  {internScoresChartData.length > 0 ? (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={internScoresChartData}>
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                          <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                          <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-bold py-12 text-center">No performance telemetry available.</p>
                  )}
                </div>

                {/* 2. Attendance LineChart */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    Daily Attendance Trends
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={attendanceTrendData}>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                        <Line type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};
