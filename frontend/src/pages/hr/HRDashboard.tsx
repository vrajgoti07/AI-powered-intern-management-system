import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterns, useMentors, useTasks, useDepartments, useLeaves, useHRFeedbacks, useAttendance } from '../../hooks/queries';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { KPICard } from '../../components/common/KPICard';
import { BarChartComponent } from '../../components/charts/BarChartComponent';
import { DonutChart } from '../../components/charts/DonutChart';
import { LineChartComponent } from '../../components/charts/LineChartComponent';
import { Avatar } from '../../components/common/Avatar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { InternForm } from '../../components/forms/InternForm';
import { 
  Users, UserCheck, ClipboardCheck, TrendingUp, Calendar, 
  Brain, FileText, Award, UserPlus, Megaphone, Check, X, Eye, 
  ChevronRight, Download, MessageSquare, RefreshCw, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export const HRDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: interns = [], refetch: refetchInterns } = useInterns();
  const { data: mentors = [] } = useMentors();
  const { data: tasks = [] } = useTasks();
  const { data: departments = [] } = useDepartments();
  const { data: leaveRequests = [] } = useLeaves();
  const { data: attendances = [], refetch: refetchAttendance } = useAttendance();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAddInternModal, setShowAddInternModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedInternDetail, setSelectedInternDetail] = useState<any>(null);

  const { data: hrFeedbacks = [] } = useHRFeedbacks();

  // App metrics
  const totalInterns = interns.length;
  const activeMentors = mentors.length;
  const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED').length;
  const avgPerformance = totalInterns > 0 
    ? Math.round(interns.reduce((sum: number, i: any) => sum + i.score, 0) / totalInterns) 
    : 0;

  const kpiData = [
    { icon: Users, label: "Total Interns", value: totalInterns.toString(), trend: `+${interns.filter((i: any) => i.status === 'PENDING').length} pending approval`, up: true, color: "blue" as const },
    { icon: UserCheck, label: "Active Mentors", value: activeMentors.toString(), trend: "+1 new assigned", up: true, color: "cyan" as const },
    { icon: ClipboardCheck, label: "Tasks Completed", value: completedTasks.toString(), trend: `+${tasks.filter((t: any) => t.status === 'REVIEW').length} in review`, up: true, color: "emerald" as const },
    { icon: TrendingUp, label: "Avg Performance", value: `${avgPerformance}%`, trend: "Satisfactory status", up: true, color: "amber" as const },
  ];

  // Recharts mapping
  const performanceData = departments.map((d: any) => {
    const deptInterns = interns.filter((i: any) => i.department?.name?.toLowerCase() === d.name.toLowerCase());
    const score = deptInterns.length > 0
      ? Math.round(deptInterns.reduce((s: number, i: any) => s + i.score, 0) / deptInterns.length)
      : 0;
    return { label: d.name, value: score };
  });

  const statusMap = interns.reduce((acc: any, intern: any) => {
    acc[intern.status] = (acc[intern.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = [
    { name: "Active", value: statusMap["ACTIVE"] || 0 },
    { name: "Completed", value: statusMap["COMPLETED"] || 0 },
    { name: "Pending", value: statusMap["PENDING"] || 0 }
  ];

  // Dynamic intake data based on last 5 months
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonthIndex = new Date().getMonth();
  const last5Months = [];
  for (let i = 4; i >= 0; i--) {
    let m = currentMonthIndex - i;
    if (m < 0) m += 12;
    last5Months.push(monthNames[m]);
  }
  const intakeData = last5Months.map(month => {
    const count = interns.filter((intern: any) => {
      const date = new Date(intern.createdAt || new Date());
      return monthNames[date.getMonth()] === month;
    }).length;
    return { label: month, value: count };
  });

  const deadlines = tasks
    .filter((t: any) => t.status !== 'COMPLETED')
    .map((t: any) => {
      const days = Math.ceil((new Date(t.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return {
        name: t.intern?.user?.name || 'Unknown',
        task: t.title,
        days: days > 0 ? days : 0,
        urgent: days <= 2
      };
    })
    .sort((a: any, b: any) => a.days - b.days)
    .slice(0, 5);

  const handleApprove = async (id: string) => {
    try {
      await api.put(`/interns/${id}`, { status: 'ACTIVE' });
      toast.success("Application approved. Candidate is now Active!");
      await refetchInterns();
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed to approve candidate";
      toast.error(errMsg);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.put(`/interns/${id}`, { status: 'COMPLETED' });
      toast.error("Application rejected / archived.");
      await refetchInterns();
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed to reject candidate";
      toast.error(errMsg);
    }
  };

  const handleAddInternSubmit = async (internData: any) => {
    try {
      const userRes = await api.post('/auth/register', {
        name: internData.name,
        email: internData.email,
        role: 'INTERN',
        password: 'InternPass123!'
      });

      const userId = userRes.data.data.user.id;

      await api.post('/interns', {
        userId,
        phone: internData.phone,
        dob: internData.dob ? new Date(internData.dob).toISOString() : undefined,
        college: internData.college,
        degree: internData.degree,
        branch: internData.branch,
        cgpa: internData.cgpa,
        departmentId: internData.departmentId,
        mentorId: internData.mentorId || undefined,
        skills: internData.skills,
        duration: '3 Months',
        startDate: internData.startDate ? new Date(internData.startDate).toISOString() : new Date().toISOString()
      });

      toast.success("New Intern Added Successfully!");
      setShowAddInternModal(false);
      await refetchInterns();
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed to add intern";
      toast.error(errMsg);
    }
  };

  const handleDownloadReport = async () => {
    try {
      toast.loading("Generating report...", { id: "report-toast" });
      const response = await api.get('/reports/export-pdf?type=summary', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cohort_report_${new Date().getTime()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Report downloaded successfully", { id: "report-toast" });
    } catch (error) {
      toast.error("Failed to generate report", { id: "report-toast" });
    }
  };

  const handleManualOverride = async (internId: string, date: string, status: string) => {
    try {
      await api.put('/attendance/override', {
        internId,
        date,
        status,
        notes: `Manual adjustment by ${user?.name || 'HR Admin'}`
      });
      toast.success(`Override saved: Status changed to ${status}`);
      await refetchAttendance();
      await refetchInterns();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save manual override adjustment");
    }
  };

  const sortedPerformance = [...performanceData].filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  let insightText = "The AI Engine is currently aggregating incoming performance metrics. Additional evaluation data is required to generate comprehensive cohort insights and division benchmarks.";
  if (sortedPerformance.length > 0) {
    const top = sortedPerformance[0];
    const lowest = sortedPerformance[sortedPerformance.length - 1];
    if (top.value === lowest.value) {
      insightText = `All active departments are maintaining an equal performance average of ${top.value}%. The AI Engine will continue monitoring for emerging trends and variations.`;
    } else {
      insightText = `The ${top.label} division is currently leading the cohort with an impressive ${top.value}% average. Conversely, the ${lowest.label} division is at ${lowest.value}%; consider directing additional mentorship resources or reviewing their curriculum.`;
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        
        {/* Scroll Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* KPI Dashboard Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiData.map((k, idx) => (
              <KPICard 
                key={idx}
                icon={k.icon}
                label={k.label}
                value={k.value}
                trend={k.trend}
                up={k.up}
                color={k.color}
              />
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Department Performance Bar Chart */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm md:text-base font-extrabold text-slate-800 tracking-tight">Performance by Department</h2>
                  <p className="text-[10px] md:text-xs text-slate-400 font-semibold mt-0.5">Average intern scores this quarter</p>
                </div>
              </div>
              <BarChartComponent data={performanceData} height={200} />
            </div>

            {/* Status Breakdown Donut Chart */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-sm md:text-base font-extrabold text-slate-800 tracking-tight">Internship Status</h2>
                <p className="text-[10px] md:text-xs text-slate-400 font-semibold mt-0.5">Cohort breakdown allocation</p>
              </div>
              <DonutChart data={statusData} height={130} />
              <div className="space-y-1.5 mt-2 text-xs font-bold text-slate-500">
                {statusData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ["#2563eb", "#16a34a", "#d97706"][i] }}></span>
                      {d.name}
                    </span>
                    <span className="text-slate-700">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Intake Trend AreaChart */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm md:text-base font-extrabold text-slate-800 tracking-tight">Monthly Intern Intake Trend</h2>
                <p className="text-[10px] md:text-xs text-slate-400 font-semibold mt-0.5">Applications intake processed</p>
              </div>
              <button 
                onClick={handleDownloadReport}
                className="flex items-center gap-1 text-[10px] md:text-xs border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 px-3 py-2 rounded-xl transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export Data
              </button>
            </div>
            <LineChartComponent data={intakeData} height={130} />
          </div>

          {/* Bottom Table & Sidebar Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Applications approvals */}
            {/* Left Column containing tables */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Applications approvals */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
                  <h2 className="text-sm md:text-base font-extrabold text-slate-800 tracking-tight">Recent Application Reviews</h2>
                  <span className="text-[10px] text-slate-400 font-bold">Action Queue</span>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wide border-b border-slate-100">
                        <th className="px-5 py-3 font-bold">Candidate</th>
                        <th className="px-4 py-3 font-bold">Department</th>
                        <th className="px-4 py-3 font-bold">Score</th>
                        <th className="px-4 py-3 font-bold">Status</th>
                        <th className="px-4 py-3 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {interns.map((intern: any) => (
                        <tr key={intern.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={intern.user?.name || "Unknown"} />
                              <div>
                                <p className="font-extrabold text-slate-800 text-xs tracking-tight">{intern.user?.name || "Unknown"}</p>
                                <p className="text-[10px] text-slate-400 font-semibold">{intern.college}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge type="dept" value={intern.department?.name || "Unassigned"} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 font-bold text-slate-700">
                              <div className="w-14 bg-slate-100 rounded-full h-1.5">
                                <div className="bg-[#2563eb] h-1.5 rounded-full" style={{ width: `${intern.score}%` }}></div>
                              </div>
                              {intern.score}%
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge type="status" value={intern.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => setSelectedInternDetail(intern)}
                                className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {intern.status === 'PENDING' && (
                                <>
                                  <button 
                                    onClick={() => handleApprove(intern.id)}
                                    className="p-1.5 hover:bg-emerald-50 rounded-xl transition-colors text-emerald-600 cursor-pointer"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleReject(intern.id)}
                                    className="p-1.5 hover:bg-red-50 rounded-xl transition-colors text-red-500 cursor-pointer"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Enterprise Attendance & Shift Monitor */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
                  <div>
                    <h2 className="text-sm md:text-base font-extrabold text-slate-800 tracking-tight">Enterprise Attendance & Shift Monitor</h2>
                    <p className="text-[10px] md:text-xs text-slate-400 font-semibold mt-0.5">Real-time cohort punch logs & active verification checks</p>
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        await refetchAttendance();
                        toast.success("Logs synchronized from database!");
                      } catch (e) {
                        toast.error("Failed to sync records.");
                      }
                    }}
                    className="flex items-center gap-1.5 text-[10px] border border-slate-200 text-[#2563eb] font-bold hover:bg-slate-50 px-3 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" /> Sync Real-Time Logs
                  </button>
                </div>
                <div className="overflow-x-auto flex-1 max-h-[350px] overflow-y-auto">
                  {attendances.length === 0 ? (
                    <p className="text-[11px] text-slate-400 font-semibold text-center italic py-10">No attendance clock-in records found in database.</p>
                  ) : (
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wide border-b border-slate-100">
                          <th className="px-5 py-3 font-bold">Intern</th>
                          <th className="px-4 py-3 font-bold">Date</th>
                          <th className="px-4 py-3 font-bold">Check-In / Out</th>
                          <th className="px-4 py-3 font-bold">Working Hours</th>
                          <th className="px-4 py-3 font-bold">Network / Device</th>
                          <th className="px-4 py-3 font-bold">Status</th>
                          <th className="px-4 py-3 font-bold">Manual Override</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {attendances.map((a: any) => (
                          <tr key={a.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="px-5 py-3 font-bold text-slate-750">
                              {a.intern?.user?.name || "Unknown Intern"}
                            </td>
                            <td className="px-4 py-3 text-slate-500 font-medium">
                              {new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3 text-slate-600 font-semibold">
                              <div className="flex flex-col gap-0.5">
                                <span>In: {a.checkIn ? new Date(a.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                <span>Out: {a.checkOut ? new Date(a.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-700">
                              {a.workingHours !== null && a.workingHours !== undefined ? `${a.workingHours} hrs` : '--'}
                            </td>
                            <td className="px-4 py-3 text-[10px] text-slate-400 font-semibold truncate max-w-[150px]" title={a.deviceInfo || 'Unknown'}>
                              <div className="flex flex-col">
                                <span>IP: {a.ipAddress || '127.0.0.1'}</span>
                                <span className="truncate">{a.deviceInfo || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[8.5px] font-extrabold tracking-widest uppercase px-2.5 py-0.5 rounded-md ${
                                a.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' :
                                a.status === 'LATE' ? 'bg-teal-100 text-teal-800' :
                                a.status === 'HALF_DAY' ? 'bg-yellow-100 text-yellow-800' :
                                a.status === 'ON_LEAVE' ? 'bg-fuchsia-100 text-fuchsia-800' :
                                a.status === 'HOLIDAY' ? 'bg-blue-100 text-blue-850' :
                                a.status === 'WEEKEND' ? 'bg-slate-100 text-slate-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {a.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1.5">
                                <button 
                                  onClick={() => handleManualOverride(a.internId, a.date, 'PRESENT')}
                                  className="text-[9px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-md font-bold transition-all cursor-pointer"
                                >
                                  Present
                                </button>
                                <button 
                                  onClick={() => handleManualOverride(a.internId, a.date, 'ABSENT')}
                                  className="text-[9px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1 rounded-md font-bold transition-all cursor-pointer"
                                >
                                  Absent
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>

            {/* Sidebar widgets */}
            <div className="space-y-5">
              {/* Quick Action Buttons */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left">
                <h2 className="text-sm font-extrabold text-slate-800 tracking-tight mb-4">Quick Tools</h2>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { icon: UserPlus, label: "Add Intern", color: "text-blue-600 bg-blue-50 border-blue-100/50", action: () => setShowAddInternModal(true) },
                    { icon: Megaphone, label: "Announce", color: "text-slate-600 bg-slate-50 border-slate-100/50", action: () => navigate('/hr/announcements') },
                    { icon: Calendar, label: "Leaves", color: "text-rose-600 bg-rose-50 border-rose-100/50", action: () => setShowLeaveModal(true) },
                    { icon: MessageSquare, label: "Feedbacks", color: "text-amber-600 bg-amber-50 border-amber-100/50", action: () => setShowFeedbackModal(true) },
                  ].map((act, i) => {
                    const Icon = act.icon;
                    return (
                      <button 
                        key={i} 
                        onClick={act.action}
                        className="flex flex-col items-center gap-2 p-3 border border-slate-100 hover:bg-slate-50/50 rounded-2xl transition-all cursor-pointer transform hover:-translate-y-0.5"
                      >
                        <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center ${act.color}`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600">{act.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Upcoming Deadlines */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">Upcoming Milestones</h2>
                  <Calendar className="w-4.5 h-4.5 text-slate-400" />
                </div>
                <div className="space-y-3.5">
                  {deadlines.map((d: any, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${d.urgent ? "bg-red-50 text-red-600 border border-red-100" : "bg-slate-50 text-slate-600 border border-slate-100"}`}>
                        {d.days}d
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{d.task}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{d.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Insight Box */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left relative overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                    <Brain className="w-4 h-4 text-blue-600 animate-pulse" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 tracking-wide uppercase">AI Engine Insight</span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
                  {insightText}
                </p>
                <button 
                  onClick={handleDownloadReport}
                  className="w-full text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 px-3.5 py-2.5 rounded-xl transition-all font-bold cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Generate Cohort Report
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Modal 
        isOpen={showAddInternModal}
        onClose={() => setShowAddInternModal(false)}
        title="Add New Intern Profile"
      >
        <InternForm 
          departments={departments}
          mentors={mentors}
          onSubmit={handleAddInternSubmit}
          onCancel={() => setShowAddInternModal(false)}
        />
      </Modal>

      {/* 2. Intern Detailed Inspection Modal */}
      <Modal 
        isOpen={selectedInternDetail !== null}
        onClose={() => setSelectedInternDetail(null)}
        title="Intern Application Details"
      >
        {selectedInternDetail && (
          <div className="space-y-5 text-left text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <Avatar name={selectedInternDetail.user?.name || 'Unknown'} size="md" />
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 tracking-tight">{selectedInternDetail.user?.name || 'Unknown'}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{selectedInternDetail.college}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-3.5 py-2">
              <div><span className="text-slate-400 font-bold block mb-0.5">Email Address:</span>{selectedInternDetail.user?.email || "N/A"}</div>
              <div><span className="text-slate-400 font-bold block mb-0.5">Phone:</span>{selectedInternDetail.phone || "N/A"}</div>
              <div><span className="text-slate-400 font-bold block mb-0.5">Academic Degree:</span>{selectedInternDetail.degree || "B.Tech"} - {selectedInternDetail.branch || "CS"}</div>
              <div><span className="text-slate-400 font-bold block mb-0.5">CGPA Rank:</span>{selectedInternDetail.cgpa || 8.5}/10</div>
              <div><span className="text-slate-400 font-bold block mb-0.5">Department Alloc:</span>{selectedInternDetail.department?.name || "Unassigned"}</div>
              <div><span className="text-slate-400 font-bold block mb-0.5">Assigned Supervisor:</span>{selectedInternDetail.mentor?.user?.name || "Unassigned"}</div>
              <div><span className="text-slate-400 font-bold block mb-0.5">Joined Calendar:</span>{new Date(selectedInternDetail.createdAt).toLocaleDateString()}</div>
              <div><span className="text-slate-400 font-bold block mb-0.5">Task Evaluation:</span>{selectedInternDetail.score}% average grade</div>
              <div className="col-span-2 pt-2 border-t border-slate-100 space-y-3">
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Onboarding Residential Address:</span>
                  <p className="text-slate-700 font-extrabold">{selectedInternDetail.address || "N/A"}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Work Location & Map:</span>
                  <div className="flex items-center gap-1.5 text-slate-700 font-extrabold mb-2.5">
                    <MapPin className="w-3.5 h-3.5 text-[#2563eb]" />
                    {selectedInternDetail.workAddress || "Bengaluru Hub / Remote Dev"}
                  </div>
                  <div className="w-full h-40 rounded-2xl overflow-hidden border border-slate-150 shadow-inner bg-slate-50 relative">
                    <iframe
                      title={`Workspace Location Map for ${selectedInternDetail.user?.name || "Intern"}`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedInternDetail.workAddress || selectedInternDetail.address || "Bengaluru Hub / Remote Dev")}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1">
              <span className="text-slate-400 font-bold block">Skills Checklist:</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedInternDetail.skills?.map((s: string) => (
                  <span key={s} className="bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {s}
                  </span>
                )) || "None provided"}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                onClick={() => setSelectedInternDetail(null)}
                className="px-4 py-2.5 bg-[#2563eb] text-white hover:bg-blue-700 font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Close Inspection
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 3. Global Leaves Modal */}
      <Modal 
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Global Leave Requests"
      >
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          {!(leaveRequests?.length > 0) ? (
            <p className="text-[10px] text-slate-400 font-semibold text-center italic py-4">No leave requests found in the system.</p>
          ) : (
            <table className="w-full text-xs text-left border border-slate-100 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase">
                <tr>
                  <th className="px-4 py-2 font-bold">Intern</th>
                  <th className="px-4 py-2 font-bold">Dates</th>
                  <th className="px-4 py-2 font-bold">Reason</th>
                  <th className="px-4 py-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(leaveRequests || []).map((leave: any) => (
                  <tr key={leave.id}>
                    <td className="px-4 py-3 font-extrabold text-slate-800">{leave.intern?.user?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-[10px] font-semibold text-slate-500">{leave.startDate} to {leave.endDate}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-500 italic max-w-[120px] truncate">{leave.reason}</td>
                    <td className="px-4 py-3"><StatusBadge type="status" value={leave.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>

      {/* 4. Feedback Modal */}
      <Modal 
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title="Intern Feedback for Mentors"
      >
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          {!(hrFeedbacks?.length > 0) ? (
            <p className="text-[10px] text-slate-400 font-semibold text-center italic py-4">No feedback records found.</p>
          ) : (
            <table className="w-full text-xs text-left border border-slate-100 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase">
                <tr>
                  <th className="px-4 py-2 font-bold">Intern</th>
                  <th className="px-4 py-2 font-bold">Mentor</th>
                  <th className="px-4 py-2 font-bold">Rating</th>
                  <th className="px-4 py-2 font-bold">Comment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(hrFeedbacks || []).map((fb: any) => (
                  <tr key={fb.id}>
                    <td className="px-4 py-3 font-extrabold text-slate-800">{fb.intern?.user?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 font-extrabold text-slate-800">{fb.mentor?.user?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-[10px] font-semibold text-emerald-600">{fb.rating} / 5 Stars</td>
                    <td className="px-4 py-3 text-[10px] text-slate-500 italic max-w-[120px] truncate">{fb.comment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>

    </div>
  );
};
