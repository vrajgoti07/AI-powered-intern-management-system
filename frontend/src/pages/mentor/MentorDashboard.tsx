import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useInterns, useTasks, useLeaves, useAttendance } from '../../hooks/queries';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { KPICard } from '../../components/common/KPICard';
import { Avatar } from '../../components/common/Avatar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Users, ClipboardCheck, MessageCircle, Star, Brain, CheckSquare, Clock, Megaphone, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const MentorDashboard: React.FC = () => {
  const { user } = useAuth();
  const isDepartmentHead = user?.originalRole === 'DEPARTMENT_HEAD';
  const { data: interns = [] } = useInterns(
    isDepartmentHead && user?.headedDepartment?.id
      ? { departmentId: user.headedDepartment.id }
      : undefined
  );
  const { data: tasks = [] } = useTasks();
  const { data: leaveRequests = [], refetch: refetchLeaves } = useLeaves();
  const { data: attendances = [], refetch: refetchAttendance } = useAttendance();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
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

  // Mentor dynamic reference
  const mentorName = user?.name || "Mentor";
  const myInterns = isDepartmentHead
    ? interns
    : interns.filter((i: any) => i.mentor?.user?.name === mentorName);

  const myTasks = isDepartmentHead
    ? tasks.filter((t: any) => t.intern?.departmentId === user?.headedDepartment?.id)
    : tasks.filter((t: any) => t.mentor?.user?.name === mentorName);

  const myPendingLeaves = isDepartmentHead
    ? (leaveRequests || []).filter((l: any) => l.user?.intern?.departmentId === user?.headedDepartment?.id && (l.status === 'Pending Mentor' || l.status === 'PENDING'))
    : (leaveRequests || []).filter((l: any) => (l.mentorId === (user as any)?.mentor?.id || l.user?.intern?.mentorId === (user as any)?.mentor?.id) && (l.status === 'Pending Mentor' || l.status === 'PENDING'));

  const myInternIds = new Set(myInterns.map((i: any) => i.id));
  const myAttendancesList = attendances.filter((a: any) => myInternIds.has(a.internId));
  
  const pendingReviewsCount = myTasks.filter((t: any) => t.status === 'REVIEW').length;
  const completedTasksCount = myTasks.filter((t: any) => t.status === 'COMPLETED').length;

  const handleLeaveAction = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      if (status === 'Approved') {
        await api.put(`/leave/${id}/approve`);
      } else {
        await api.put(`/leave/${id}/reject`, { rejectionReason: "No specific reason provided by mentor." });
      }
      toast.success(`Leave request ${status.toLowerCase()}`);
      await refetchLeaves();
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed to process leave request";
      toast.error(errMsg);
    }
  };

  const kpis = [
    { icon: Users, label: "My Interns", value: myInterns.length.toString(), trend: "Direct Supervision", up: true, color: "blue" as const },
    { icon: ClipboardCheck, label: "Tasks Completed", value: completedTasksCount.toString(), trend: `Out of ${myTasks.length} total`, up: true, color: "emerald" as const },
    { icon: Clock, label: "Pending Reviews", value: pendingReviewsCount.toString(), trend: "Requires attention", up: false, color: "amber" as const },
    { icon: Star, label: "Supervisor Rating", value: "4.8/5", trend: "Excellent level", up: true, color: "cyan" as const },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Mentor Dashboard" />

        {/* Scroll Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6">
          
          {/* KPIs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            {/* My Interns list */}
            {/* Left Column containing tables */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Assigned Intern Cohort */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="px-5 py-4 border-b border-slate-100 flex-shrink-0 flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Assigned Intern Cohort</h3>
                  <span className="text-[10px] text-slate-400 font-bold">Active Directives</span>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wide border-b border-slate-100">
                        <th className="px-5 py-3 font-bold">Intern</th>
                        <th className="px-4 py-3 font-bold">Department</th>
                        <th className="px-4 py-3 font-bold">Performance</th>
                        <th className="px-4 py-3 font-bold">Attendance</th>
                        <th className="px-5 py-3 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {myInterns.map((i: any) => (
                        <tr key={i.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={i.user?.name || "Unknown"} />
                              <div>
                                <p className="font-extrabold text-slate-800 text-xs tracking-tight">{i.user?.name || "Unknown"}</p>
                                <p className="text-[10px] text-slate-400 font-semibold">{i.college}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge type="dept" value={i.department?.name || "Unassigned"} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 font-bold text-slate-700">
                              <div className="w-14 bg-slate-100 rounded-full h-1.5">
                                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${i.score}%` }}></div>
                              </div>
                              {i.score}%
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-600">{i.attendance}%</td>
                          <td className="px-5 py-3">
                            <StatusBadge type="status" value={i.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Supervisor Team Attendance Logs */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="px-5 py-4 border-b border-slate-100 flex-shrink-0 flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Supervisor Team Attendance Logs</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Punch details and standup notes of your assigned cohort</p>
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        await refetchAttendance();
                        toast.success("Team logs refreshed");
                      } catch (e) {
                        toast.error("Failed to sync team records");
                      }
                    }}
                    className="flex items-center gap-1 text-[10px] border border-slate-200 text-indigo-600 font-bold hover:bg-slate-50 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    Refresh Logs
                  </button>
                </div>
                <div className="overflow-x-auto flex-1 max-h-[300px] overflow-y-auto">
                  {myAttendancesList.length === 0 ? (
                    <p className="text-[11px] text-slate-400 font-semibold text-center italic py-8">No supervisor logs recorded for assigned interns.</p>
                  ) : (
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wide border-b border-slate-100">
                          <th className="px-5 py-3 font-bold">Intern</th>
                          <th className="px-4 py-3 font-bold">Date</th>
                          <th className="px-4 py-3 font-bold">Check-In / Check-Out</th>
                          <th className="px-4 py-3 font-bold">Working Hours</th>
                          <th className="px-4 py-3 font-bold">Standup Notes</th>
                          <th className="px-5 py-3 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {myAttendancesList.map((a: any) => (
                          <tr key={a.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="px-5 py-3 font-bold text-slate-755">
                              {a.intern?.user?.name || "Unknown Intern"}
                            </td>
                            <td className="px-4 py-3 text-slate-500 font-medium">
                              {new Date(a.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-slate-600 font-semibold">
                              <div className="flex flex-col gap-0.5 text-[11px]">
                                <span>In: {a.checkIn ? new Date(a.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                <span>Out: {a.checkOut ? new Date(a.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-750">
                              {a.workingHours !== null && a.workingHours !== undefined ? `${a.workingHours} hrs` : '--'}
                            </td>
                            <td className="px-4 py-3 text-slate-500 italic max-w-[150px] truncate" title={a.notes || ''}>
                              {a.notes ? `"${a.notes}"` : '--'}
                            </td>
                            <td className="px-5 py-3">
                              <span className={`text-[8px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-md ${
                                a.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' :
                                a.status === 'LATE' ? 'bg-teal-100 text-teal-800' :
                                a.status === 'HALF_DAY' ? 'bg-yellow-100 text-yellow-800' :
                                a.status === 'ON_LEAVE' ? 'bg-fuchsia-100 text-fuchsia-800' :
                                a.status === 'HOLIDAY' ? 'bg-indigo-100 text-indigo-800' :
                                a.status === 'WEEKEND' ? 'bg-slate-100 text-slate-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {a.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>

            {/* Sidebar Alerts */}
            <div className="space-y-5">
              {/* Announcements widget */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left">
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight mb-4 flex items-center gap-1.5">
                  <Megaphone className="w-4.5 h-4.5 text-indigo-600" /> Recent Announcements
                </h3>
                <div className="space-y-3.5 max-h-60 overflow-y-auto">
                  {announcements.length > 0 ? (
                    announcements.map((ann: any) => (
                      <div key={ann.id} className="p-3 bg-slate-50 border border-slate-200/50 rounded-2xl flex flex-col space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-slate-800 text-xs">{ann.title}</span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${ann.priority === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {ann.priority}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold">{ann.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl">
                      No recent announcements
                    </div>
                  )}
                </div>
              </div>

              {/* Task reviews list shortcut */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left">
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight mb-4 flex items-center gap-1.5">
                  <CheckSquare className="w-4.5 h-4.5 text-indigo-600" /> Tasks Requiring Review
                </h3>
                <div className="space-y-3.5">
                  {myTasks.filter((t: any) => t.status === 'REVIEW').length > 0 ? (
                    myTasks.filter((t: any) => t.status === 'REVIEW').map((task: any) => (
                      <div key={task.id} className="p-3 bg-slate-50 border border-slate-200/50 rounded-2xl flex flex-col space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-slate-800 text-xs truncate max-w-[120px]">{task.title}</span>
                          <StatusBadge type="priority" value={task.priority} />
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold">Assignee: {task.intern?.user?.name || "Unknown"}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl">
                      No pending task submissions
                    </div>
                  )}
                </div>
              </div>

              {/* Pending Leave Requests */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left">
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight mb-4 flex items-center gap-1.5">
                  <Clock className="w-4.5 h-4.5 text-indigo-600" /> Pending Leave Approvals
                </h3>
                <div className="space-y-3.5 max-h-60 overflow-y-auto">
                  {myPendingLeaves.length > 0 ? (
                    myPendingLeaves.map((leave: any) => (
                      <div key={leave.id} className="p-3 bg-slate-50 border border-slate-200/50 rounded-2xl flex flex-col space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-slate-800 text-xs">{leave.intern?.user?.name || "Unknown"}</span>
                          <span className="text-[9px] text-slate-500 font-bold">{new Date(leave.startDate).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold italic">"{leave.reason}"</p>
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => handleLeaveAction(leave.id, 'Approved')} className="flex-1 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[10px] font-bold transition-colors">Approve</button>
                          <button onClick={() => handleLeaveAction(leave.id, 'Rejected')} className="flex-1 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-[10px] font-bold transition-colors">Reject</button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl">
                      No pending leave requests
                    </div>
                  )}
                </div>
              </div>

              {/* Mentoring Insight */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-5 text-white text-left space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <Brain className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold tracking-wide uppercase">Supervisor Insight</span>
                </div>
                <p className="text-xs text-indigo-100 leading-relaxed font-semibold">
                  Ankit Patil has maintained an average evaluation score of <strong className="text-white">85%</strong> and attendance is perfect. Recommend assigning more complex task portfolios.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

