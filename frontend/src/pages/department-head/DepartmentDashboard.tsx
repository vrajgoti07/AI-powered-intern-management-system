import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { 
  Building2, Users, UserCheck, Briefcase, Calendar, TrendingUp,
  Clock, Check, X, FileText, BarChart3, AlertCircle,
  FileCheck, ShieldAlert, Crown, Plus
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';

export const DepartmentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'interns' | 'mentors' | 'projects' | 'reports'>('overview');
  
  // Data States
  const [analytics, setAnalytics] = useState<any>(null);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);

  // The Department Head might have headedDepartment or just departmentId.
  // The backend might return it in user object. Let's try user.headedDepartment?.id first.
  const id = user?.headedDepartment?.id || (user as any)?.departmentId || (user as any)?.mentor?.departmentId;

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
        rejectReason: 'Rejected by Division Head'
      });
      toast.success('Leave request declined.');
      refetchDept();
      fetchSecondaryData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject leave request.');
    }
  };

  if (!id) {
    return (
      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
        <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Department Dashboard" />
          <div className="flex-1 p-6 flex items-center justify-center">
             <div className="text-center space-y-4">
                <ShieldAlert className="w-16 h-16 text-slate-300 mx-auto" />
                <h2 className="text-xl font-bold text-slate-700">No Department Assigned</h2>
                <p className="text-sm text-slate-500">You have not been assigned as a department head yet. Please contact HR.</p>
             </div>
          </div>
        </main>
      </div>
    );
  }

  // Generate dynamic mock analytics for Recharts
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

        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Header breadcrumb card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left">
            <div className="flex items-center gap-4">
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
                    <p className="text-xs font-semibold text-slate-400">Head of Department: <span className="text-slate-700 font-bold">{department.head?.name || user?.name || 'Assigned'}</span></p>
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
                    <p className="text-xl font-black text-slate-800">{analytics?.activeProjects || department.projectsCount || 0}</p>
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

                {/* Leaves Workflows Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                       <Clock className="w-4 h-4 text-indigo-600" />
                       Leave Approvals
                     </h3>
                     <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                       {pendingLeaves.length} Pending
                     </span>
                  </div>

                  {pendingLeaves.length > 0 ? (
                    <div className="space-y-3">
                      {pendingLeaves.slice(0, 3).map((l: any) => (
                        <div key={l.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex items-center justify-between">
                           <div>
                              <p className="text-xs font-bold text-slate-700">{l.user?.name || 'Employee'}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{new Date(l.startDate).toLocaleDateString()}</p>
                           </div>
                           <div className="flex gap-1">
                             <button onClick={() => handleApproveLeave(l.id)} className="p-1 hover:bg-emerald-100 text-emerald-600 rounded bg-white border border-slate-200 cursor-pointer">
                               <Check className="w-3.5 h-3.5" />
                             </button>
                             <button onClick={() => handleRejectLeave(l.id)} className="p-1 hover:bg-rose-100 text-rose-600 rounded bg-white border border-slate-200 cursor-pointer">
                               <X className="w-3.5 h-3.5" />
                             </button>
                           </div>
                        </div>
                      ))}
                      {pendingLeaves.length > 3 && (
                        <button onClick={() => setActiveTab('leaves' as any)} className="w-full py-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-white border border-indigo-100 rounded-xl">
                          View all leaves
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 font-bold text-xs space-y-2">
                      <FileCheck className="w-6 h-6 text-emerald-400 mx-auto" />
                      <p>All clear. No pending leaves.</p>
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
                                onClick={() => navigate(`/mentor/tasks`)}
                                className="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer font-bold"
                              >
                                View Mentee Projects
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-slate-800 text-base">Department Projects</h3>
                  <button onClick={() => toast.error('Creation of new projects is currently disabled')} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm">
                    <Plus className="w-3.5 h-3.5" /> New Project
                  </button>
                </div>
                
                {department.projects && department.projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {department.projects.map((p: any) => (
                      <div key={p.id} className="p-5 border border-slate-200 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow group">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm mb-2 group-hover:text-indigo-600 transition-colors">{p.title}</h4>
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
                  <div className="text-center py-12 text-slate-400 font-bold text-xs space-y-2 border border-dashed border-slate-200 rounded-2xl">
                    <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                    <p>No projects have been assigned or created yet.</p>
                  </div>
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
