import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Clock, Check, X, FileText, 
  Send, UserCheck, Inbox, Sparkles, 
  ShieldAlert, BadgeCheck, BadgeAlert, RefreshCw,
  ChevronLeft, ChevronRight, Play
} from 'lucide-react';
import { Sidebar } from '../../../components/common/Sidebar';
import { Navbar } from '../../../components/common/Navbar';
import toast from 'react-hot-toast';
import { useAuth } from '../../../hooks/useAuth';
import { useLeaves, useAttendance } from '../../../hooks/queries';
import api from '../../../services/api';

export const AttendanceLeave: React.FC = () => {
  const { user } = useAuth();
  const { data: leaves = [], refetch: refetchLeaves } = useLeaves();
  const { data: attendances = [], refetch: refetchAttendance } = useAttendance();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [activeTab, setActiveTab] = useState<'request' | 'approval' | 'calendar'>(
    user?.role === 'intern' ? 'calendar' : 'approval'
  );

  // Today's Check-in Record & Settings State
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [isPunching, setIsPunching] = useState(false);

  // Calendar Month Navigation
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  // Leave Form state
  const [leaveType, setLeaveType] = useState('SICK');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Onboarding & Lifecycle verification
  const onboardingPending = user?.role === 'intern' && (user as any)?.intern?.status !== 'ACTIVE';
  const [batchBlocked, setBatchBlocked] = useState(false);
  const [batchMessage, setBatchMessage] = useState('');

  // Fetch status and settings on mount
  useEffect(() => {
    const fetchTodayStatus = async () => {
      if (user?.role === 'intern') {
        try {
          const res = await api.get('/attendance/today');
          setTodayRecord(res.data.data);
        } catch (err) {
          console.error("Failed to fetch today status", err);
        }
      }
    };

    const fetchSettings = async () => {
      try {
        const res = await api.get('/attendance/settings');
        setSettings(res.data.data);
      } catch (err) {
        console.error("Failed to fetch attendance settings", err);
      }
    };

    fetchTodayStatus();
    fetchSettings();
  }, [user]);

  // Check batch dates limits
  useEffect(() => {
    if (settings) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const start = new Date(settings.internshipStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(settings.internshipEndDate);
      end.setHours(23, 59, 59, 999);

      if (now < start) {
        setBatchBlocked(true);
        setBatchMessage(`Internship batch starts on ${start.toLocaleDateString()}`);
      } else if (now > end) {
        setBatchBlocked(true);
        setBatchMessage(`Internship batch completed on ${end.toLocaleDateString()}`);
      } else {
        setBatchBlocked(false);
      }
    }
  }, [settings]);

  const isLifecycleBlocked = onboardingPending || batchBlocked;
  const lifecycleMessage = onboardingPending 
    ? "Onboarding verification pending. Attendance actions locked." 
    : batchMessage;

  // Punch actions
  const handleCheckIn = async () => {
    setIsPunching(true);
    try {
      const res = await api.post('/attendance/checkin', { notes });
      setTodayRecord(res.data.data);
      toast.success("Checked in successfully!");
      refetchAttendance();
      setNotes('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Check-in failed");
    } finally {
      setIsPunching(false);
    }
  };

  const handleCheckOut = async () => {
    setIsPunching(true);
    try {
      const res = await api.post('/attendance/checkout', { notes });
      setTodayRecord(res.data.data);
      toast.success("Checked out successfully!");
      refetchAttendance();
      setNotes('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Check-out failed");
    } finally {
      setIsPunching(false);
    }
  };

  // Leave Form Submission
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      toast.error("Please fill in all dates and reasons.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/leave/apply', {
        type: leaveType,
        startDate,
        endDate,
        reason
      });
      toast.success("Leave Request submitted successfully! Mentor notified.");
      setReason('');
      setStartDate('');
      setEndDate('');
      refetchLeaves();
      setActiveTab('calendar');
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit leave request");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Leave Requests approval list
  const pendingApprovals = leaves.filter((l: any) => 
    (l.status === 'Pending Mentor' || l.status === 'Pending HR') && 
    (user?.role === 'hr' || (user?.role === 'mentor' && l.mentorId === (user as any)?.mentor?.id))
  );

  const handleApprovalAction = async (id: string, actionStatus: 'Approved' | 'Rejected') => {
    try {
      const endpoint = actionStatus === 'Approved'
        ? (user?.role === 'hr' ? '/leaves/hr-approve' : '/leaves/mentor-approve')
        : '/leaves/reject';
      
      await api.put(endpoint, { id, reason: `Authorized by ${user?.name}` });
      toast.success(`Leave request successfully ${actionStatus === 'Approved' ? 'APPROVED' : 'REJECTED'}!`);
      refetchLeaves();
      refetchAttendance();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${actionStatus.toLowerCase()} request`);
    }
  };

  // Dynamic Calendar Helpers
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const getDayStatus = (dayNum: number): 'Present' | 'Late' | 'HalfDay' | 'Leave' | 'Absent' | 'Holiday' | 'Weekend' | 'Future' | 'None' => {
    const targetDate = new Date(currentYear, currentMonth, dayNum);
    targetDate.setHours(0,0,0,0);

    const now = new Date();
    now.setHours(0,0,0,0);

    if (targetDate > now) {
      return 'Future';
    }

    // 1. Check for weekend
    const dayOfWeek = targetDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // 2. Find attendance record
    const attendance = attendances.find((a: any) => {
      const currentInternId = (user as any)?.intern?.id;
      if (user?.role === 'intern' && a.internId !== currentInternId) return false;
      
      if (!a.date) return false;
      const d = new Date(a.date);
      return d.getDate() === dayNum && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    if (attendance) {
      if (attendance.status === 'PRESENT') return 'Present';
      if (attendance.status === 'LATE') return 'Late';
      if (attendance.status === 'HALF_DAY') return 'HalfDay';
      if (attendance.status === 'ON_LEAVE' || attendance.status === 'LEAVE') return 'Leave';
      if (attendance.status === 'ABSENT') return 'Absent';
      if (attendance.status === 'HOLIDAY') return 'Holiday';
      if (attendance.status === 'WEEKEND') return 'Weekend';
    }

    if (isWeekend) return 'Weekend';
    return 'None';
  };

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    return { day: dayNum, status: getDayStatus(dayNum) };
  });

  // Calculate statistics based on current filter / own logs
  const currentInternId = (user as any)?.intern?.id;
  const myAttendances = user?.role === 'intern' 
    ? attendances.filter((a: any) => a.internId === currentInternId) 
    : attendances;

  const presentCount = myAttendances.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length;
  const absentCount = myAttendances.filter((a: any) => a.status === 'ABSENT').length;
  const leaveCount = myAttendances.filter((a: any) => a.status === 'ON_LEAVE' || a.status === 'LEAVE').length;
  const totalTrackedDays = presentCount + absentCount;
  const attendanceRate = totalTrackedDays > 0 ? Math.round((presentCount / totalTrackedDays) * 100) : 100;

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Manual refresh helper
  const handleManualRefresh = () => {
    toast.promise(
      Promise.all([refetchLeaves(), refetchAttendance()]),
      {
        loading: 'Synchronizing with cloud database...',
        success: 'Server records synchronized!',
        error: 'Synchronization failed. Please check network.'
      }
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Attendance & Leave Workspace" />

        {/* Scrollable Container with signature premium radial dots background */}
        <div 
          className="flex-1 overflow-y-auto p-6 space-y-6 text-left relative"
          style={{
            backgroundImage: 'radial-gradient(#e2e8f0 1.2px, transparent 1.2px)',
            backgroundSize: '24px 24px',
            backgroundColor: '#f8fafc'
          }}
        >
          {/* Decorative blurry glow bubbles */}
          <div className="absolute top-20 right-10 w-96 h-96 bg-indigo-100/40 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse duration-[8s]" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-emerald-100/20 rounded-full blur-[140px] pointer-events-none -z-10" />

          {/* Welcome Dashboard Banner */}
          <div className="bg-white/70 backdrop-blur-xl border border-slate-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-50/60 rounded-full blur-3xl opacity-60 pointer-events-none" />
            
            <div className="text-left relative z-10 space-y-2 flex-1">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold tracking-wider uppercase text-indigo-600 bg-indigo-50/80 px-2.5 py-1 rounded-md border border-indigo-100/40">
                <Sparkles className="w-3 h-3 text-indigo-500 animate-spin" /> Attendance & Standup Center
              </span>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-1">
                Time & Absence Control
              </h1>
              <p className="text-xs text-slate-500 font-semibold max-w-2xl leading-relaxed mt-1">
                Keep track of your daily standup punch clock-ins, review authorized time-off allocations, and submit leave requests for supervisor approvals.
              </p>
            </div>

            {/* Quick Action Button for Synchronization */}
            <div className="flex flex-wrap items-center gap-3 relative z-10 flex-shrink-0">
              <button
                onClick={handleManualRefresh}
                className="flex items-center gap-1.5 px-4.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all active:scale-95 duration-200"
                title="Force reload all data"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600" /> Sync Server Logs
              </button>
            </div>
          </div>

          {/* Premium Segmented Pill Tabs Switcher */}
          <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/40 w-fit">
            <button 
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all duration-300 ${
                activeTab === 'calendar' 
                  ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100/50' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <CalendarIcon className="w-4 h-4" /> My Attendance Logs
            </button>
            {user?.role === 'intern' && (
              <button 
                onClick={() => setActiveTab('request')}
                className={`${`flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all duration-300 ${
                  activeTab === 'request' 
                    ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100/50' 
                    : 'text-slate-500 hover:text-slate-700'} min-h-[44px]`}`}
              >
                <Send className="w-4 h-4" /> Apply for Leave
              </button>
            )}
            {(user?.role === 'hr' || user?.role === 'mentor') && (
              <button 
                onClick={() => setActiveTab('approval')}
                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all duration-300 relative ${
                  activeTab === 'approval' 
                    ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100/50' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <UserCheck className="w-4 h-4" /> 
                <span>Leave Approvals Inbox</span>
                {pendingApprovals.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-extrabold text-[8px] h-4 min-w-4 px-1 rounded-full flex items-center justify-center border border-white">
                    {pendingApprovals.length}
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="text-left">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: Attendance Log Calendar */}
              {activeTab === 'calendar' && (
                <motion.div 
                  key="calendar"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-4 gap-6"
                >
                  {/* Left Action Panels */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Punch Clock Widget */}
                    {user?.role === 'intern' && (
                      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-600 animate-pulse" />
                            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Punch Clock</h3>
                          </div>
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase bg-slate-50 px-2 py-1 rounded-md border border-slate-200/40">
                            Today
                          </span>
                        </div>
                        
                        {isLifecycleBlocked ? (
                          <div className="bg-rose-50/50 border border-rose-100/50 rounded-2xl p-4 text-center space-y-2">
                            <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto animate-bounce" />
                            <p className="text-xs font-black text-rose-800">{lifecycleMessage}</p>
                            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                              Attendance actions are locked outside your approved internship batch duration limits.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="text-center py-2.5 bg-slate-50 border border-slate-250/20 rounded-2xl">
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Current Status</p>
                              <span className={`inline-flex items-center gap-1 text-xs font-black mt-1 ${
                                todayRecord?.checkIn 
                                  ? todayRecord.checkOut 
                                    ? 'text-indigo-600' 
                                    : 'text-emerald-600 animate-pulse'
                                  : 'text-rose-500'
                              }`}>
                                {todayRecord?.checkIn 
                                  ? todayRecord.checkOut 
                                    ? 'Checked Out' 
                                    : `Checked In (${todayRecord.status})`
                                  : 'Not Checked In'}
                              </span>
                              
                              {todayRecord?.checkIn && (
                                <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px] border-t border-slate-100 pt-2 px-3">
                                  <div>
                                    <p className="text-slate-400 font-semibold">Check In</p>
                                    <p className="font-bold text-slate-700">{new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-400 font-semibold">Check Out</p>
                                    <p className="font-bold text-slate-700">
                                      {todayRecord.checkOut 
                                        ? new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                        : '--:--'}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {!todayRecord?.checkOut && (
                              <div className="space-y-1.5 text-left">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Standup Notes</label>
                                <textarea
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  placeholder="What are you working on today?"
                                  rows={2}
                                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all resize-none text-base"
                                />
                              </div>
                            )}

                            <div className="space-y-2">
                              {!todayRecord?.checkIn ? (
                                <button
                                  onClick={handleCheckIn}
                                  disabled={isPunching}
                                  className="w-full flex items-center justify-center gap-1.5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-100 cursor-pointer transition-all active:scale-[0.98] min-h-[44px]"
                                >
                                  <Play className="w-3 h-3 fill-white text-white" /> Record Check-In
                                </button>
                              ) : !todayRecord?.checkOut ? (
                                <button
                                  onClick={handleCheckOut}
                                  disabled={isPunching}
                                  className="w-full flex items-center justify-center gap-1.5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-100 cursor-pointer transition-all active:scale-[0.98] min-h-[44px]"
                                >
                                  Record Check-Out
                                </button>
                              ) : (
                                <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-3 text-center text-indigo-800 text-[10px] font-extrabold flex items-center justify-center gap-1.5">
                                  <Check className="w-4 h-4 text-indigo-600" />
                                  Shift logs finalized!
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stats Card */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-5">
                      <h3 className="font-extrabold text-slate-800 text-sm tracking-tight pb-3 border-b border-slate-100">Log Summary</h3>
                      
                      <div className="space-y-4 mt-2 text-xs font-bold text-slate-650">
                        {/* Present */}
                        <div className="flex items-center justify-between p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-100/30">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 animate-pulse" />
                            <span className="text-emerald-800">Present</span>
                          </div>
                          <span className="text-sm font-black text-emerald-900">{presentCount} Days</span>
                        </div>

                        {/* Leave */}
                        <div className="flex items-center justify-between p-3.5 bg-amber-50/40 rounded-2xl border border-amber-100/30">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100" />
                            <span className="text-amber-800">Authorized Leave</span>
                          </div>
                          <span className="text-sm font-black text-amber-900">{leaveCount} Days</span>
                        </div>

                        {/* Absent */}
                        <div className="flex items-center justify-between p-3.5 bg-rose-50/40 rounded-2xl border border-rose-100/30">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100" />
                            <span className="text-rose-800">Unexcused Absence</span>
                          </div>
                          <span className="text-sm font-black text-rose-900">{absentCount} Days</span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics Index */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-left">Attendance Strength</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between font-black text-xs text-slate-700">
                          <span>Success Index</span>
                          <span className="text-indigo-600">{attendanceRate}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-indigo-600 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${attendanceRate}%` }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                          />
                        </div>
                        <p className="text-[9.5px] text-slate-400 font-semibold leading-relaxed pt-1">
                          A high attendance index is required for satisfactory compliance evaluations under mentor supervisors.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Calendar logs grid */}
                  <div className="lg:col-span-3 bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                      <div className="text-left flex items-center gap-4">
                        <button 
                          onClick={handlePrevMonth}
                          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4 text-slate-600" />
                        </button>
                        <div>
                          <span className="font-black text-slate-800 text-sm tracking-tight">{monthNames[currentMonth]} {currentYear} Logs</span>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Assigned Shift Schedule</p>
                        </div>
                        <button 
                          onClick={handleNextMonth}
                          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-500 font-extrabold bg-slate-50 px-3 py-1.5 border border-slate-200/50 rounded-xl">Shift: 9:00 AM - 6:00 PM</span>
                    </div>

                    {/* Calendar Week Headers */}
                    <div className="grid grid-cols-7 gap-1 sm:gap-3 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 sm:gap-3">
                      {/* Pad empty cells for month starting day */}
                      {Array.from({ length: firstDayIndex }).map((_, idx) => (
                        <div key={`empty-${idx}`} className="bg-slate-50/20 border border-slate-100/10 rounded-xl sm:rounded-2xl min-h-[50px] sm:min-h-[55px]" />
                      ))}

                      {calendarDays.map(d => {
                        const statusColors: Record<string, string> = {
                          'Present': 'bg-emerald-50/40 border-emerald-250 text-emerald-700 shadow-sm shadow-emerald-50/10',
                          'Late': 'bg-teal-50/40 border-teal-250 text-teal-700 shadow-sm shadow-teal-50/10',
                          'HalfDay': 'bg-yellow-55/40 border-yellow-250 text-yellow-700 shadow-sm shadow-yellow-50/10',
                          'Leave': 'bg-fuchsia-50/40 border-fuchsia-250 text-fuchsia-700 shadow-sm shadow-fuchsia-50/10',
                          'Absent': 'bg-rose-50/40 border-rose-250 text-rose-700 shadow-sm shadow-rose-50/10',
                          'Holiday': 'bg-indigo-50/40 border-indigo-250 text-indigo-700 shadow-sm shadow-indigo-50/10',
                          'Weekend': 'bg-slate-100/60 border-slate-200 text-slate-500 shadow-sm shadow-slate-55/10',
                          'Future': 'bg-slate-50/20 border-slate-100 text-slate-350 cursor-not-allowed',
                          'None': 'bg-amber-50/40 border-amber-250 text-amber-700 shadow-sm shadow-amber-50/10'
                        };

                        const indicator = statusColors[d.status] || 'bg-white border-slate-100 text-slate-400 hover:border-slate-250 hover:bg-slate-50/30';

                        return (
                          <div 
                            key={d.day} 
                            className={`border rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 min-h-[50px] sm:min-h-[60px] text-left flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:scale-[1.01] relative group ${indicator}`}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="text-[10px] font-black">{d.day}</span>
                              {(d.status === 'Present' || d.status === 'Late') && <BadgeCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />}
                              {d.status === 'Absent' && <BadgeAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />}
                            </div>

                            {d.status !== 'Future' && d.status !== 'Weekend' && d.status !== 'None' && (
                              <span className={`hidden sm:inline-flex text-[7.5px] font-extrabold tracking-widest uppercase mt-2 px-1.5 py-0.5 rounded-md w-fit ${
                                d.status === 'Leave' ? 'bg-fuchsia-100 text-fuchsia-800' :
                                d.status === 'Holiday' ? 'bg-indigo-100 text-indigo-800' :
                                d.status === 'Late' ? 'bg-teal-100 text-teal-800' :
                                d.status === 'HalfDay' ? 'bg-yellow-100 text-yellow-800' :
                                d.status === 'Present' ? 'bg-emerald-100 text-emerald-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {d.status}
                              </span>
                            )}

                            {d.status === 'None' && (
                              <span className="hidden sm:inline-flex text-[7.5px] font-extrabold tracking-widest uppercase mt-2 px-1.5 py-0.5 rounded-md w-fit bg-amber-100 text-amber-800">
                                Unmarked
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: Apply Leave Form */}
              {activeTab === 'request' && (
                <motion.div 
                  key="request"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)]"
                >
                  <div className="max-w-2xl space-y-6">
                    <div className="text-left border-b border-slate-100 pb-4">
                      <h3 className="font-extrabold text-slate-800 text-base">Request Absence Leave</h3>
                      <p className="text-xs text-slate-400 font-bold mt-1">Absence approvals must be evaluated and authorized by your assigned department mentor supervisor.</p>
                    </div>

                    <form onSubmit={handleLeaveSubmit} className="space-y-5 text-left">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Absence Type</label>
                          <select 
                            value={leaveType}
                            onChange={(e) => setLeaveType(e.target.value)}
                            className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-base"
                          >
                            <option value="SICK">Sick Leave</option>
                            <option value="CASUAL">Casual Leave</option>
                            <option value="EMERGENCY">Emergency Leave</option>
                            <option value="OTHER">Other Leave</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Start Date</label>
                          <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                            className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-base" 
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">End Date</label>
                          <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                            className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-base" 
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Reason for Request</label>
                        <textarea 
                          rows={4} 
                          placeholder="Please provide a clear and detailed description explaining the reason for your time-off request..."
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          required
                          className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all resize-none text-base"
                        ></textarea>
                      </div>

                      <div className="flex justify-end pt-3">
                        <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="flex items-center gap-1.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-100 hover:shadow-xl hover:shadow-indigo-200/50 cursor-pointer transition-all active:scale-[0.98] min-h-[44px]"
                        >
                          {isSubmitting ? 'Submitting request...' : <><Send className="w-4 h-4" /> Submit Leave Request</>}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: HR/Mentor Approval Dashboard */}
              {activeTab === 'approval' && (
                <motion.div 
                  key="approval"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] min-h-[300px] flex flex-col justify-between"
                >
                  <div className="space-y-4 text-left">
                    <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Leave Requests Inbox</h3>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Pending Action</span>
                    </div>
                    
                    <div className="space-y-4">
                      {pendingApprovals.length > 0 ? (
                        pendingApprovals.map((a: any) => (
                          <div 
                            key={a.id} 
                            className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 hover:border-slate-350 transition-all duration-200 shadow-sm"
                          >
                            <div className="space-y-2 text-left min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-extrabold text-slate-800 text-sm">{a.user?.name || 'Unknown Intern'}</h4>
                                <span className="text-[8.5px] px-2.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-700">
                                  {a.leaveType}
                                </span>
                                <span className={`text-[8.5px] px-2.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider ${
                                  a.status === 'Pending HR' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-blue-50 border-blue-100 text-blue-700'
                                }`}>
                                  {a.status}
                                </span>
                              </div>
                              <p className="text-[10.5px] text-slate-400 font-bold flex items-center gap-1.5">
                                <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" /> 
                                Duration: {new Date(a.startDate).toLocaleDateString()} to {new Date(a.endDate).toLocaleDateString()}
                              </p>
                              <div className="text-[11px] text-slate-650 bg-white border border-slate-100/50 p-3 rounded-xl italic font-medium leading-relaxed">
                                "{a.reason}"
                              </div>
                            </div>

                            <div className="flex gap-2 flex-shrink-0 self-end sm:self-center">
                              {/* Reject */}
                              <button 
                                onClick={() => handleApprovalAction(a.id, 'Rejected')}
                                className="p-2.5 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl cursor-pointer active:scale-95 transition-all shadow-sm"
                                title="Reject Request"
                              >
                                <X className="w-4 h-4" />
                              </button>

                              {/* Approve */}
                              <button 
                                onClick={() => handleApprovalAction(a.id, 'Approved')}
                                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-100 cursor-pointer active:scale-95 transition-all"
                                title="Approve Request"
                              >
                                <Check className="w-4.5 h-4.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-16 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-3xl space-y-3 bg-slate-50/50 max-w-lg mx-auto">
                          <Inbox className="w-8 h-8 text-slate-350 mx-auto" />
                          <p>All leave approvals cleared! No pending requests in your inbox.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>
      </main>
    </div>
  );
};

