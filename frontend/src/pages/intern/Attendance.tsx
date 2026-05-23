import React, { useState, useMemo } from 'react';
import { useAttendance, useAttendanceAnalytics } from '../../hooks/queries';
import { useAuth } from '../../hooks/useAuth';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { CalendarDays, Clock, CheckCircle, XCircle, AlertTriangle, LogIn, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const Attendance: React.FC = () => {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Current month/year
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  // Fetch attendance data (for this intern specifically)
  const { data: attendanceRecords = [], refetch: refetchAttendance } = useAttendance();
  const { data: analytics } = useAttendanceAnalytics();

  // Fetch today's attendance state
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // Fetch today's status on mount
  React.useEffect(() => {
    const fetchToday = async () => {
      try {
        const res = await api.get('/attendance/today');
        setTodayRecord(res.data.data || null);
      } catch {
        setTodayRecord(null);
      }
    };
    fetchToday();
  }, []);

  // Build dynamic calendar for the selected month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDow = firstDay.getDay(); // 0=Sun

    // Create a lookup map from attendance records
    const recordMap: Record<number, string> = {};
    attendanceRecords.forEach((r: any) => {
      const d = new Date(r.date || r.checkIn);
      if (d.getMonth() === viewMonth && d.getFullYear() === viewYear) {
        recordMap[d.getDate()] = r.status;
      }
    });

    const days: { day: number | null; status: string }[] = [];

    // Add empty cells for days before the 1st
    for (let i = 0; i < startDow; i++) {
      days.push({ day: null, status: '' });
    }

    // Fill actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(viewYear, viewMonth, d);
      const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
      const isFuture = dayDate > now;

      let status = 'PENDING';
      if (recordMap[d]) {
        status = recordMap[d];
      } else if (isWeekend) {
        status = 'WEEKEND';
      } else if (isFuture) {
        status = 'FUTURE';
      }

      days.push({ day: d, status });
    }

    return days;
  }, [viewMonth, viewYear, attendanceRecords]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-emerald-500 text-white';
      case 'ABSENT': return 'bg-red-500 text-white';
      case 'HALF_DAY': return 'bg-amber-400 text-white';
      case 'LEAVE': return 'bg-indigo-400 text-white';
      case 'LATE': return 'bg-orange-400 text-white';
      case 'WEEKEND': return 'bg-slate-200 text-slate-400';
      case 'FUTURE': return 'bg-white text-slate-300 border border-slate-100';
      default: return 'bg-slate-50 text-slate-300 border border-dashed border-slate-200';
    }
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Analytics calculations from real data
  const presentDays = analytics?.totalPresent ?? attendanceRecords.filter((r: any) => r.status === 'PRESENT').length;
  const absentDays = analytics?.totalAbsent ?? attendanceRecords.filter((r: any) => r.status === 'ABSENT').length;
  const halfDays = analytics?.totalHalfDay ?? attendanceRecords.filter((r: any) => r.status === 'HALF_DAY').length;
  const leaveDays = analytics?.totalLeave ?? attendanceRecords.filter((r: any) => r.status === 'LEAVE').length;
  const totalRecords = attendanceRecords.length || 1;
  const attendanceRate = analytics?.attendanceRate ?? Math.round(((presentDays + halfDays * 0.5) / totalRecords) * 100);

  // Check-in / Check-out handlers
  const handleCheckIn = async () => {
    setLoadingAction(true);
    try {
      const res = await api.post('/attendance/check-in', { notes: 'Check-in from dashboard' });
      setTodayRecord(res.data.data);
      toast.success("Checked in successfully! 🕐");
      await refetchAttendance();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Check-in failed");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCheckOut = async () => {
    setLoadingAction(true);
    try {
      const res = await api.post('/attendance/check-out', { notes: 'Check-out from dashboard' });
      setTodayRecord(res.data.data);
      toast.success("Checked out successfully! 👋");
      await refetchAttendance();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Check-out failed");
    } finally {
      setLoadingAction(false);
    }
  };

  const isCheckedIn = todayRecord && todayRecord.checkIn && !todayRecord.checkOut;
  const isCheckedOut = todayRecord && todayRecord.checkOut;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Attendance & Time Tracker" />

        <div className="flex-1 p-6 overflow-y-auto space-y-6">

          {/* Today's Status + Action Bar */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-6 border border-indigo-950 relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent)] animate-pulse" />
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-600/30 border border-indigo-500/30 rounded-2xl flex items-center justify-center">
                  <Clock className="w-7 h-7 text-indigo-300" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-white">Today, {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
                  <p className="text-xs text-indigo-200 font-bold mt-0.5">
                    {isCheckedOut 
                      ? `Checked out at ${new Date(todayRecord.checkOut).toLocaleTimeString()}` 
                      : isCheckedIn 
                        ? `Checked in at ${new Date(todayRecord.checkIn).toLocaleTimeString()}` 
                        : 'Not checked in yet'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                {!isCheckedIn && !isCheckedOut && (
                  <button
                    onClick={handleCheckIn}
                    disabled={loadingAction}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    {loadingAction ? 'Processing...' : 'Check In'}
                  </button>
                )}
                {isCheckedIn && (
                  <button
                    onClick={handleCheckOut}
                    disabled={loadingAction}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    {loadingAction ? 'Processing...' : 'Check Out'}
                  </button>
                )}
                {isCheckedOut && (
                  <span className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold text-xs rounded-xl">
                    <CheckCircle className="w-4 h-4" /> Day Complete
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Grid */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              {/* Month Navigation */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <button
                  onClick={() => {
                    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
                    else setViewMonth(viewMonth - 1);
                  }}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-extrabold text-xs cursor-pointer"
                >
                  ← Prev
                </button>
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-indigo-600" />
                  {monthNames[viewMonth]} {viewYear}
                </h3>
                <button
                  onClick={() => {
                    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
                    else setViewMonth(viewMonth + 1);
                  }}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-extrabold text-xs cursor-pointer"
                >
                  Next →
                </button>
              </div>

              {/* Day names header */}
              <div className="grid grid-cols-7 gap-1.5 mb-2">
                {dayNames.map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider py-1">{d}</div>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((cell, idx) => (
                  <div
                    key={idx}
                    className={`aspect-square rounded-xl flex items-center justify-center text-[11px] font-extrabold transition-all ${
                      cell.day === null ? '' : getStatusColor(cell.status)
                    } ${cell.day === new Date().getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear() ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                  >
                    {cell.day ?? ''}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 pt-4 mt-4 border-t border-slate-100">
                {[
                  { label: 'Present', color: 'bg-emerald-500' },
                  { label: 'Absent', color: 'bg-red-500' },
                  { label: 'Half Day', color: 'bg-amber-400' },
                  { label: 'Leave', color: 'bg-indigo-400' },
                  { label: 'Weekend', color: 'bg-slate-200' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded-sm ${l.color}`} />
                    <span className="text-[10px] font-bold text-slate-500">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dossier Metrics */}
            <div className="space-y-5">
              {/* Attendance Rate */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-center space-y-3">
                <h4 className="font-extrabold text-slate-800 text-xs tracking-tight">Attendance Rate</h4>
                <div className="relative w-28 h-28 mx-auto">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                    <circle 
                      cx="50" cy="50" r="42" fill="none" 
                      stroke={attendanceRate >= 80 ? '#10b981' : attendanceRate >= 60 ? '#f59e0b' : '#ef4444'} 
                      strokeWidth="8" 
                      strokeLinecap="round"
                      strokeDasharray={`${attendanceRate * 2.64} 264`}
                      transform="rotate(-90 50 50)"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-slate-800">{attendanceRate}%</span>
                </div>
              </div>

              {/* Stat Cards */}
              {[
                { label: 'Present Days', value: presentDays, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                { label: 'Absent Days', value: absentDays, icon: XCircle, color: 'text-red-600 bg-red-50 border-red-100' },
                { label: 'Half Days', value: halfDays, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                { label: 'Leaves Taken', value: leaveDays, icon: CalendarDays, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className={`rounded-2xl p-4 border flex items-center gap-3 ${stat.color}`}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/80 shadow-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-extrabold">{stat.value}</p>
                      <p className="text-[10px] font-bold opacity-70">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
