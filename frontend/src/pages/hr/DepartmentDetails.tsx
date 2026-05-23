import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { 
  Building2, Users, UserCheck, Briefcase, Calendar, TrendingUp,
  Clock, ArrowLeft, Check, X, FileText, BarChart3, Loader2, AlertCircle,
  FileCheck, ShieldAlert
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  LineChart, Line, PieChart, Pie, Cell, Legend 
} from 'recharts';

export const DepartmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'directory' | 'analytics' | 'leaves' | 'activities'>('overview');
  
  // Data States
  const [department, setDepartment] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch core department details
      const deptRes = await api.get(`/departments/${id}`);
      if (!deptRes.data.success) throw new Error('Failed to load department details');
      setDepartment(deptRes.data.data);

      // 2. Fetch analytics
      const analyticsRes = await api.get(`/departments/${id}/analytics`);
      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.data.statistics);
      }

      // 3. Fetch activity history
      const activitiesRes = await api.get(`/departments/${id}/activity-logs`);
      if (activitiesRes.data.success) {
        setActivities(activitiesRes.data.data || []);
      }

      // 4. Fetch all leave requests to filter for this department
      const leavesRes = await api.get('/leave');
      if (leavesRes.data.success) {
        const rawLeaves = leavesRes.data.data.data || [];
        // Filter leave requests belonging to users in this department
        const deptUserIds = new Set((deptRes.data.data.interns || []).map((u: any) => u.id));
        const filteredLeaves = rawLeaves.filter((l: any) => deptUserIds.has(l.userId));
        setPendingLeaves(filteredLeaves);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred while loading corporate structure.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAllData();
    }
  }, [id]);

  const handleApproveLeave = async (leaveId: string) => {
    try {
      await api.put(`/leave/${leaveId}/approve`);
      toast.success('Leave request approved successfully!');
      fetchAllData();
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
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject leave request.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
        <Sidebar collapsed={sidebarCollapsed} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Loading Division Profile..." />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs font-black text-slate-500 tracking-wider uppercase">Fetching Corporate Registry...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
        <Sidebar collapsed={sidebarCollapsed} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Division Error" />
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md bg-white border border-red-100 rounded-3xl p-8 text-center shadow-lg space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <h3 className="text-lg font-black text-slate-800">Failed to Retrieve Division Details</h3>
              <p className="text-xs text-slate-400 font-bold leading-relaxed">{error || 'The requested department was not found in our directory database.'}</p>
              <button 
                onClick={() => navigate('/hr/departments')}
                className="flex items-center justify-center gap-2 mx-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Registry
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
      <Sidebar collapsed={sidebarCollapsed} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title={`Division: ${department.name}`} />

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
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">{department.name}</h2>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-widest border border-slate-200">
                    {department.code}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-400">Head of Department: <span className="text-slate-700 font-bold">{department.head?.name || 'Unassigned'}</span></p>
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
            {(['overview', 'directory', 'analytics', 'leaves', 'activities'] as const).map((tab) => (
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
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Interns</p>
                    <p className="text-xl font-black text-slate-800">{analytics?.totalInterns || 0}</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Mentors</p>
                    <p className="text-xl font-black text-slate-800">{analytics?.totalMentors || 0}</p>
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

                  {department.head ? (
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

          {/* TAB 2: TEAM DIRECTORY */}
          {activeTab === 'directory' && (
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

          {/* TAB 3: ANALYTICS DASHBOARD */}
          {activeTab === 'analytics' && (
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

                {/* 3. Task Allocation PieChart */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 lg:col-span-2">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-indigo-600" />
                    Task Deliverables Overview
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={taskChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {taskChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-3">
                      {taskChartData.map((d, index) => (
                        <div key={index} className="flex items-center justify-between text-xs font-bold p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                            <span className="text-slate-500">{d.name}</span>
                          </div>
                          <span className="text-slate-800">{d.value} Deliverables</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: LEAVE APPROVALS WORKFLOW */}
          {activeTab === 'leaves' && (
            <div className="space-y-6 text-left">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">Pending Leave Requests</h3>
                    <p className="text-[10px] font-bold text-slate-400">Review and approve employee leave requests in this division</p>
                  </div>
                </div>

                {pendingLeaves.length > 0 ? (
                  <div className="space-y-4 pt-4">
                    {pendingLeaves.map((l: any) => (
                      <div key={l.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-slate-800">{l.user?.name || 'Anonymous Employee'}</p>
                          <p className="text-[10px] text-slate-400 font-bold">
                            Duration: {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-slate-500 font-semibold italic bg-white px-3.5 py-1.5 rounded-xl border border-slate-100 mt-2 block max-w-lg leading-relaxed">
                            Reason: "{l.reason}"
                          </p>
                        </div>

                        {l.status.startsWith('Pending') ? (
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleRejectLeave(l.id)}
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
                            >
                              <X className="w-4 h-4" /> Reject
                            </button>
                            <button
                              onClick={() => handleApproveLeave(l.id)}
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md cursor-pointer"
                            >
                              <Check className="w-4 h-4" /> Approve
                            </button>
                          </div>
                        ) : (
                          <span className={`text-[10px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider ${
                            l.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {l.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 font-bold text-xs space-y-2">
                    <FileText className="w-10 h-10 text-slate-200 mx-auto" />
                    <p>All leave requests cleared. No pending workflows.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ACTIVITY LOG TIMELINE */}
          {activeTab === 'activities' && (
            <div className="space-y-6 text-left">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base font-black">Audit History Log</h3>
                    <p className="text-[10px] font-bold text-slate-400">Strict chronological operations trail of changes, assignments, and transfers</p>
                  </div>
                </div>

                {activities.length > 0 ? (
                  <div className="relative pl-6 border-l-2 border-slate-100 space-y-8">
                    {activities.map((a: any) => (
                      <div key={a.id} className="relative text-left space-y-1">
                        {/* Chronological dot indicator */}
                        <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-white border-2 border-indigo-600 shadow-sm flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping" />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                            {a.activityType}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {new Date(a.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-700 leading-relaxed">{a.description}</p>
                        <p className="text-[9px] font-bold text-slate-400">Performed by: <strong className="text-slate-500">{a.performedBy}</strong></p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 font-bold text-xs space-y-2">
                    <FileText className="w-10 h-10 text-slate-200 mx-auto" />
                    <p>No activity log registry available for this division.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};
