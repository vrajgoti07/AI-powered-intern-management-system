import React, { useState, useEffect } from 'react';
import { useInternByUser, useTasks } from '../../hooks/queries';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { KPICard } from '../../components/common/KPICard';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  CheckSquare, Award, Calendar, Megaphone, Brain,
  Clock, CheckCircle2, ChevronRight, Play, FileText
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const InternDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: myInternData } = useInternByUser(user?.id || '');
  const { data: tasks = [] } = useTasks();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get('/announcements');
        setAnnouncements(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch announcements", err);
      }
    };
    fetchAnnouncements();
  }, []);

  // Parse direct matching intern from database
  const myName = user?.name || "Intern"; // Dynamically use logged-in user name
  const myTasks = tasks.filter((t: any) => t.intern?.user?.name === myName || t.internId === myInternData?.id);

  const pendingTasks = myTasks.filter((t: any) => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;
  const completedTasks = myTasks.filter((t: any) => t.status === 'COMPLETED').length;

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd || !leaveReason) {
      toast.error("Please fill in all leave details.");
      return;
    }
    try {
      await api.post('/leave/apply', {
        type: 'SICK',
        startDate: leaveStart,
        endDate: leaveEnd,
        reason: leaveReason
      });
      toast.success("Leave request submitted for mentor approval.");
      setIsLeaveModalOpen(false);
      setLeaveStart('');
      setLeaveEnd('');
      setLeaveReason('');
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed to apply for leave";
      toast.error(errMsg);
    }
  };

  const { data: statsData, isLoading, isError } = useQuery({
    queryKey: ['intern-dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/intern/dashboard-stats');
      return response.data.data;
    },
  });

  const pendingTasksVal = isLoading ? (
    <span className="inline-block w-8 h-5 bg-slate-200 animate-pulse rounded" />
  ) : isError ? (
    <span className="text-[10px] text-red-500 font-bold">Error</span>
  ) : statsData ? (
    (statsData.taskCount - statsData.completedTasks).toString()
  ) : '0';

  const completedTasksVal = isLoading ? (
    <span className="inline-block w-8 h-5 bg-slate-200 animate-pulse rounded" />
  ) : isError ? (
    <span className="text-[10px] text-red-500 font-bold">Error</span>
  ) : statsData ? (
    statsData.completedTasks.toString()
  ) : '0';

  const avgScoreVal = isLoading ? (
    <span className="inline-block w-8 h-5 bg-slate-200 animate-pulse rounded" />
  ) : isError ? (
    <span className="text-[10px] text-red-500 font-bold">Error</span>
  ) : statsData && statsData.performanceScore !== undefined && statsData.performanceScore !== null ? (
    `${statsData.performanceScore}%`
  ) : 'N/A';

  const attendancePercentVal = isLoading ? (
    <span className="inline-block w-8 h-5 bg-slate-200 animate-pulse rounded" />
  ) : isError ? (
    <span className="text-[10px] text-red-500 font-bold">Error</span>
  ) : statsData && statsData.attendancePercent !== undefined && statsData.attendancePercent !== null ? (
    `${statsData.attendancePercent}%`
  ) : 'N/A';

  const kpis = [
    { icon: CheckSquare, label: "Pending Tasks", value: pendingTasksVal as any, trend: "Require completion", up: false, color: "blue" as const },
    { icon: CheckCircle2, label: "Completed Tasks", value: completedTasksVal as any, trend: statsData ? `Out of ${statsData.taskCount} total` : "Total tasks fetched", up: true, color: "emerald" as const },
    {
      icon: Award,
      label: "My Avg Score",
      value: avgScoreVal as any,
      trend: statsData && statsData.performanceScore !== undefined && statsData.performanceScore !== null ? "Satisfactory status" : "No grade evaluated yet",
      up: true,
      color: "amber" as const
    },
    {
      icon: Calendar,
      label: "Attendance Log",
      value: attendancePercentVal as any,
      trend: "Present logs",
      up: true,
      color: "cyan" as const
    },
  ];

  // Daily punch check-in action helper
  const handleCheckIn = async () => {
    try {
      await api.post('/attendance/check-in', { notes: 'Daily check-in from dashboard' });
      toast.success("Check-in successful! Today's attendance recorded.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to record check-in.");
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Intern Workspace Portal" />

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* Welcome Banner */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden flex-shrink-0">
            {/* Decorative soft backdrop gradient */}
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-50/50 rounded-full blur-3xl opacity-60 pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-slate-100/50 rounded-full blur-3xl opacity-60 pointer-events-none" />
            
            <div className="text-left relative z-10 space-y-2">
              <span className="text-[9px] font-extrabold tracking-wider uppercase text-indigo-600 bg-indigo-50/80 px-2.5 py-1 rounded-md border border-indigo-100/40">
                Workspace Portal
              </span>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-1">
                Welcome back, {myName}!
              </h1>
              <p className="text-xs text-slate-500 font-semibold max-w-xl leading-relaxed mt-1">
                Currently assigned to the <strong className="text-indigo-600 font-bold">{myInternData?.department?.name || 'Engineering'}</strong> department {myInternData?.mentor?.user?.name ? <>under mentor <strong className="text-slate-700 font-bold">{myInternData.mentor.user.name}</strong></> : <strong className="text-slate-500 font-bold">(No Mentor Assigned)</strong>}. Monitor your milestones, submit daily standup clock-ins, and track your deliverables.
              </p>
            </div>
            
            <div className="flex items-center gap-3 relative z-10 flex-shrink-0">
              <button
                onClick={handleCheckIn}
                className="flex items-center gap-1.5 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-100 hover:shadow-xl hover:shadow-indigo-200/50 cursor-pointer transition-all transform hover:-translate-y-0.5"
              >
                <Play className="w-3.5 h-3.5 fill-white text-white" /> Record Daily Check-in
              </button>
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="flex items-center gap-1.5 px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all transform hover:-translate-y-0.5"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" /> Request Leave
              </button>
            </div>
          </div>

          {/* KPIs Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((k, i) => (
              <KPICard
                key={i}
                icon={k.icon}
                label={k.label}
                value={k.value}
                trend={k.trend}
                up={k.up}
                color={k.color}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Active Deliverables & Tasks list */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Active Deliverables & Tasks</h3>
                  </div>
                  <a href="/intern/tasks" className="text-[11px] text-indigo-600 hover:text-indigo-700 font-extrabold flex items-center gap-0.5 transition-colors">
                    View All Tasks <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
                
                <div className="space-y-3.5">
                  {myTasks.length > 0 ? (
                    myTasks.slice(0, 3).map((task: any) => {
                      const statusMap: Record<string, string> = {
                        'TODO': 'Todo',
                        'IN_PROGRESS': 'In Progress',
                        'REVIEW': 'Review',
                        'COMPLETED': 'Completed'
                      };
                      const displayStatus = statusMap[task.status] || task.status;
                      
                      return (
                        <div key={task.id} className="p-4 bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all">
                          <div className="min-w-0 space-y-1">
                            <span className="font-extrabold text-slate-800 text-xs tracking-tight block truncate sm:max-w-xs md:max-w-md lg:max-w-xs">{task.title}</span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 flex-shrink-0">
                            <StatusBadge type="status" value={displayStatus} />
                            <a 
                              href="/intern/tasks/lifecycle"
                              className="p-1.5 bg-white border border-slate-100 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-slate-600 cursor-pointer shadow-sm"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl">
                      All tasks finished! No active deliverables found.
                    </div>
                  )}
                </div>
              </div>

              {/* Active Bulletins list */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Megaphone className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Active Broadcast Notices</h3>
                </div>
                
                <div className="space-y-4 flex-1 overflow-y-auto max-h-[220px]">
                  {announcements.length > 0 ? (
                    announcements.map((ann: any) => (
                      <div key={ann.id} className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl flex flex-col space-y-2 hover:bg-slate-100/50 transition-colors">
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-slate-800 text-sm">{ann.title}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${ann.priority === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {ann.priority}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed">{ann.content}</p>
                        <div className="text-[10px] text-slate-400 font-bold mt-2">
                          From: {ann.author}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl">
                      No announcements published
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              
              {/* Internship Placement Widget */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Internship Placement</h3>
                </div>
                
                <div className="space-y-3.5 text-xs font-semibold text-slate-600">
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Assigned Department</span>
                    <span className="inline-block">
                      <StatusBadge type="dept" value={myInternData?.department?.name || 'Engineering'} />
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-0.5">Assigned Mentor</span>
                    {myInternData?.mentor?.user?.name ? (
                      <>
                        <p className="font-extrabold text-slate-800 text-sm tracking-tight">
                          {myInternData.mentor.user.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{myInternData.mentor.user.email}</p>
                      </>
                    ) : (
                      <p className="font-bold text-slate-400 text-sm tracking-tight italic">
                        Unassigned
                      </p>
                    )}
                  </div>
                  {myInternData?.startDate && (
                    <div>
                      <span className="text-slate-400 font-bold block mb-0.5">Joined On</span>
                      <p className="font-bold text-slate-700">
                        {new Date(myInternData.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Co-Pilot Card */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left space-y-4 relative overflow-hidden">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                    <Brain className="w-4 h-4 text-indigo-600 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-extrabold tracking-wide uppercase text-indigo-600">AI Co-Pilot Portal</span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-extrabold text-slate-800 tracking-tight">Need assistance?</h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Get custom deliverables, recommendations, and clear explanations for your active tasks in real-time.
                  </p>
                </div>
                <div className="pt-1">
                  <a
                    href="/intern/chatbot"
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-100 hover:shadow-lg hover:shadow-indigo-200/50 cursor-pointer transition-all transform hover:-translate-y-0.5"
                  >
                    <Brain className="w-4 h-4 text-white" /> Open AI Chatbot
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Leave Request Modal */}
      <Modal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title="Submit Leave Request">
        <form onSubmit={handleSubmitLeave} className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Start Date *</label>
              <input
                type="date"
                value={leaveStart}
                onChange={(e) => setLeaveStart(e.target.value)}
                className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">End Date *</label>
              <input
                type="date"
                value={leaveEnd}
                onChange={(e) => setLeaveEnd(e.target.value)}
                className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Reason for Leave *</label>
            <textarea
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="Please provide a brief explanation..."
              className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              required
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
            >
              Submit to Supervisor
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
