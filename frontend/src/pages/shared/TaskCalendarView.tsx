import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  Filter, Tag, Info, ListFilter, User, Award, ArrowUpRight, 
  FileText, Search, Check, Grid, List, CheckCircle2, Percent, 
  AlertCircle, ShieldAlert, Sparkles, TrendingUp
} from 'lucide-react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useTasks } from '../../hooks/queries';
import { useAuth } from '../../hooks/useAuth';

export const TaskCalendarView: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  // Set default initial month to May 2026 to align with system time (Friday, May 22, 2026)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); 

  // View state: 'grid' or 'agenda'
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string[]>(['HIGH', 'MEDIUM', 'LOW', 'COMPLETED']);

  // Fetch Live Tasks from DB (retrieve a high limit to ensure all tasks display on the calendar)
  const { data: tasks = [], isLoading } = useTasks({ limit: 100 });
  const { user } = useAuth();

  // Filter tasks based on role:
  // - Intern: only their own tasks
  // - Mentor: only tasks they assigned
  // - HR/Admin: all tasks
  const internId = (user as any)?.intern?.id;
  const myName = user?.name || "Intern";
  const myTasks = tasks.filter((t: any) => {
    if (user?.role === 'intern') {
      return t.intern?.user?.name === myName || t.internId === internId;
    } else if (user?.role === 'mentor') {
      return t.mentor?.user?.name === user?.name || t.mentorId === (user as any)?.mentor?.id;
    }
    return true; // HR/Admin can see all tasks
  });

  // Toggle filter logic
  const handleTogglePriority = (priority: string) => {
    if (priorityFilter.includes(priority)) {
      setPriorityFilter(priorityFilter.filter(p => p !== priority));
    } else {
      setPriorityFilter([...priorityFilter, priority]);
    }
  };

  // Calculate dynamic month dates and padding
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const totalDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonthLabel = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Helper to fetch filtered tasks for a specific calendar day
  const getTasksForDay = (dayNum: number) => {
    return myTasks.filter((t: any) => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      
      // Match year, month, date
      const dateMatch = dueDate.getDate() === dayNum &&
                        dueDate.getMonth() === currentDate.getMonth() &&
                        dueDate.getFullYear() === currentDate.getFullYear();
      
      if (!dateMatch) return false;

      // Filter by search query
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Determine task priority group
      const taskPriorityGroup = t.status === 'COMPLETED' ? 'COMPLETED' : t.priority;
      const matchesPriority = priorityFilter.includes(taskPriorityGroup);

      return matchesSearch && matchesPriority;
    });
  };

  // Filter tasks for the Agenda View (entire month list)
  const getAgendaTasks = () => {
    return myTasks.filter((t: any) => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      
      const monthMatch = dueDate.getMonth() === currentDate.getMonth() &&
                         dueDate.getFullYear() === currentDate.getFullYear();
      
      if (!monthMatch) return false;

      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const taskPriorityGroup = t.status === 'COMPLETED' ? 'COMPLETED' : t.priority;
      const matchesPriority = priorityFilter.includes(taskPriorityGroup);

      return matchesSearch && matchesPriority;
    }).sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  };

  // Check if a calendar day is today (Saturday, May 23, 2026)
  const isToday = (dayNum: number) => {
    const today = new Date(); // Saturday, May 23, 2026 based on local system time
    return dayNum === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  // Calculated Stats
  const totalTasksCount = myTasks.length;
  const completedTasksCount = myTasks.filter((t: any) => t.status === 'COMPLETED').length;
  const pendingTasksCount = totalTasksCount - completedTasksCount;
  const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Circular progress math
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Task Deadline Schedule" />

        {/* Outer scrollable container with premium soft decorative backdrops */}
        <div 
          className="flex-1 overflow-y-auto p-6 space-y-6 text-left relative"
          style={{
            backgroundImage: 'radial-gradient(#e2e8f0 1.2px, transparent 1.2px)',
            backgroundSize: '24px 24px',
            backgroundColor: '#f8fafc'
          }}
        >
          {/* Decorative backdrop glow bubbles */}
          <div className="absolute top-20 right-10 w-96 h-96 bg-indigo-100/40 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse duration-[8s]" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-100/30 rounded-full blur-[140px] pointer-events-none -z-10" />

          {/* Welcome Dashboard Banner */}
          <div className="bg-white/70 backdrop-blur-xl border border-slate-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-50/60 rounded-full blur-3xl opacity-60 pointer-events-none" />
            
            <div className="text-left relative z-10 space-y-2 flex-1">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold tracking-wider uppercase text-indigo-600 bg-indigo-50/80 px-2.5 py-1 rounded-md border border-indigo-100/40">
                <Sparkles className="w-3 h-3 text-indigo-500 animate-spin" /> Corporate Milestone Tracker
              </span>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-1">
                Task Deadline Calendar
              </h1>
              <p className="text-xs text-slate-500 font-semibold max-w-2xl leading-relaxed mt-1">
                Review assigned milestones, track progress timelines, and click on calendar dates to submit deliverable URLs directly to your supervisor.
              </p>
            </div>

            {/* Quick Summary Badges */}
            <div className="flex flex-wrap gap-3 relative z-10 flex-shrink-0">
              <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-extrabold text-sm border border-indigo-100/40">
                  {totalTasksCount}
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Tasks</p>
                  <p className="text-xs font-black text-slate-700">Milestones</p>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-extrabold text-sm border border-emerald-100/40">
                  {completedTasksCount}
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Completed</p>
                  <p className="text-xs font-black text-slate-700">Approved</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* Left Block: Controls & Analytics */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Card 1: Interactive Filters */}
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-5">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                    <ListFilter className="w-4 h-4 text-indigo-600" /> Filter Milestones
                  </h3>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search milestones..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-2.5 text-[10px] font-bold text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Priority Selection Switches */}
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Priority Toggles</p>
                  <div className="space-y-2">
                    {/* High */}
                    <button
                      onClick={() => handleTogglePriority('HIGH')}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                        priorityFilter.includes('HIGH')
                          ? 'bg-rose-50/80 border-rose-200/50 text-rose-700 shadow-sm shadow-rose-100/20'
                          : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${priorityFilter.includes('HIGH') ? 'bg-rose-500 ring-4 ring-rose-100' : 'bg-slate-300'}`} />
                        High Priority
                      </div>
                      {priorityFilter.includes('HIGH') && <Check className="w-3.5 h-3.5 text-rose-600" />}
                    </button>

                    {/* Medium */}
                    <button
                      onClick={() => handleTogglePriority('MEDIUM')}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                        priorityFilter.includes('MEDIUM')
                          ? 'bg-amber-50/80 border-amber-200/50 text-amber-700 shadow-sm shadow-amber-100/20'
                          : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${priorityFilter.includes('MEDIUM') ? 'bg-amber-500 ring-4 ring-amber-100' : 'bg-slate-300'}`} />
                        Medium Priority
                      </div>
                      {priorityFilter.includes('MEDIUM') && <Check className="w-3.5 h-3.5 text-amber-600" />}
                    </button>

                    {/* Low */}
                    <button
                      onClick={() => handleTogglePriority('LOW')}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                        priorityFilter.includes('LOW')
                          ? 'bg-indigo-50/80 border-indigo-200/50 text-indigo-700 shadow-sm shadow-indigo-100/20'
                          : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${priorityFilter.includes('LOW') ? 'bg-indigo-500 ring-4 ring-indigo-100' : 'bg-slate-300'}`} />
                        Low Priority
                      </div>
                      {priorityFilter.includes('LOW') && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>

                    {/* Completed */}
                    <button
                      onClick={() => handleTogglePriority('COMPLETED')}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                        priorityFilter.includes('COMPLETED')
                          ? 'bg-emerald-50/80 border-emerald-200/50 text-emerald-700 shadow-sm shadow-emerald-100/20'
                          : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${priorityFilter.includes('COMPLETED') ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-slate-300'}`} />
                        Completed Tasks
                      </div>
                      {priorityFilter.includes('COMPLETED') && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/40 border border-indigo-100/30 rounded-2xl text-[10px] text-indigo-950/70 font-semibold leading-relaxed flex gap-2">
                  <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5 animate-pulse" />
                  <span>Click on marked dates on the grid to inspect details, reviews, and submission credentials.</span>
                </div>
              </div>

              {/* Card 2: Interactive circular progress ring */}
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-left">Deliverables Health</p>
                
                <div className="flex items-center gap-5">
                  {/* SVG Circle Progress */}
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        className="stroke-slate-100 fill-none"
                        strokeWidth="8"
                      />
                      <motion.circle
                        cx="40"
                        cy="40"
                        r={radius}
                        className="stroke-indigo-600 fill-none"
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm font-black text-slate-800 leading-none">{completionRate}%</span>
                      <span className="text-[7.5px] text-slate-400 font-bold uppercase mt-0.5">Done</span>
                    </div>
                  </div>

                  <div className="text-left space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-xs font-black text-slate-700 truncate">On-track Rate</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                      {pendingTasksCount > 0 
                        ? `${pendingTasksCount} tasks remaining in this period. Submit URLs prior to deadline.`
                        : "Amazing! All milestones achieved."}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Block: Calendar & View switch */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Header Navigation & View switcher panel */}
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col sm:flex-row justify-between items-center gap-4">
                
                {/* Month Picker */}
                <div className="flex items-center gap-4">
                  <div className="flex gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200/50">
                    <button 
                      onClick={handlePrevMonth}
                      className="p-2 hover:bg-white rounded-xl transition-all duration-200 cursor-pointer hover:shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-600" />
                    </button>
                    <button 
                      onClick={handleNextMonth}
                      className="p-2 hover:bg-white rounded-xl transition-all duration-200 cursor-pointer hover:shadow-sm"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                  
                  <div className="text-left">
                    <h2 className="font-black text-slate-800 text-base tracking-tight leading-snug">{currentMonthLabel}</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Task Schedule View</p>
                  </div>
                </div>

                {/* View switcher sliding button */}
                <div className="flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200/40 w-fit">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl transition-all duration-300 ${
                      viewMode === 'grid'
                        ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100/50'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" /> Grid View
                  </button>
                  <button
                    onClick={() => setViewMode('agenda')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl transition-all duration-300 ${
                      viewMode === 'agenda'
                        ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100/50'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" /> Agenda View
                  </button>
                </div>

              </div>

              {/* View Render Area */}
              <AnimatePresence mode="wait">
                {viewMode === 'grid' ? (
                  <motion.div
                    key="grid-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-6 overflow-x-auto"
                  >
                    <div className="min-w-[320px] space-y-6">
                      {/* Day Headers */}
                      <div className="grid grid-cols-7 gap-3 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                      </div>

                      {/* Grid cells */}
                      <div className="grid grid-cols-7 gap-3">
                        {/* Pad empty cells for the starting day of this month */}
                        {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                          <div key={`empty-${idx}`} className="bg-slate-50/20 border border-slate-100/10 rounded-2xl min-h-[90px]" />
                        ))}

                        {days.map(d => {
                          const dayTasks = getTasksForDay(d);
                          const hasToday = isToday(d);

                          return (
                            <div 
                              key={d} 
                              className={`border rounded-2xl p-2.5 min-h-[95px] text-left transition-all duration-300 flex flex-col justify-between group relative ${
                                hasToday
                                  ? 'bg-gradient-to-b from-indigo-50/50 to-white border-indigo-600 shadow-lg shadow-indigo-100/40 ring-2 ring-indigo-100'
                                  : dayTasks.length > 0
                                  ? 'bg-indigo-50/10 border-indigo-100 hover:border-indigo-200 hover:shadow-md'
                                  : 'bg-white border-slate-100 hover:bg-slate-50/50 hover:border-slate-200'
                              }`}
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ${
                                  hasToday 
                                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                                    : 'text-slate-500'
                                }`}>
                                  {d}
                                </span>

                                {/* Soft glowing visual marker for dates with multiple tasks */}
                                {dayTasks.length > 0 && (
                                  <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                )}
                              </div>
                              
                              {/* Inner Scrollable Task list inside Cell */}
                              <div className="space-y-1 mt-2 max-h-[68px] overflow-y-auto scrollbar-none flex-1">
                                {dayTasks.map((task: any) => {
                                  const isDone = task.status === 'COMPLETED';
                                  const isHigh = !isDone && task.priority === 'HIGH';
                                  const isMed = !isDone && task.priority === 'MEDIUM';
                                  const isLow = !isDone && task.priority === 'LOW';

                                  return (
                                    <div 
                                      key={task.id} 
                                      onClick={() => setSelectedTask(task)}
                                      className={`text-[8.5px] font-extrabold px-1.5 py-1 rounded-lg leading-normal truncate cursor-pointer transition-all duration-200 flex items-center gap-1 hover:scale-[1.02] ${
                                        isDone ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' :
                                        isHigh ? 'bg-rose-50 border border-rose-100 text-rose-700' :
                                        isMed ? 'bg-amber-50 border border-amber-100 text-amber-700' :
                                        'bg-blue-50 border border-blue-100 text-blue-700'
                                      }`}
                                      title={task.title}
                                    >
                                      <span className={`w-1 h-1 rounded-full flex-shrink-0 ${
                                        isDone ? 'bg-emerald-500' :
                                        isHigh ? 'bg-rose-500' :
                                        isMed ? 'bg-amber-500' :
                                        'bg-blue-500'
                                      }`} />
                                      <span className="truncate">{task.title}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="agenda-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] text-left"
                  >
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {getAgendaTasks().length > 0 ? (
                        getAgendaTasks().map((task: any) => {
                          const isDone = task.status === 'COMPLETED';
                          const isHigh = !isDone && task.priority === 'HIGH';
                          const isMed = !isDone && task.priority === 'MEDIUM';
                          const isLow = !isDone && task.priority === 'LOW';

                          return (
                            <div 
                              key={task.id}
                              onClick={() => setSelectedTask(task)}
                              className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/5 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 group"
                            >
                              <div className="space-y-1.5 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <StatusBadge type="priority" value={task.priority} />
                                  <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
                                    isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    {task.status === 'COMPLETED' ? 'Completed' : 'Pending'}
                                  </span>
                                </div>
                                
                                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight group-hover:text-indigo-600 transition-colors">
                                  {task.title}
                                </h3>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400 font-bold">
                                  <span className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5 text-indigo-500" />
                                    Supervisor: <strong className="text-slate-500">{task.mentor?.user?.name || "Mentor"}</strong>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
                                    Due Date: <strong className="text-slate-500">{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                                  </span>
                                </div>
                              </div>

                              <div className="flex-shrink-0 flex items-center justify-center p-2.5 bg-white border border-slate-200/50 rounded-xl text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100 hover:shadow-inner shadow-sm transition-all duration-300">
                                <ArrowUpRight className="w-4 h-4" />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-12 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-3xl space-y-3 bg-slate-50/50">
                          <AlertCircle className="w-8 h-8 text-slate-350 mx-auto" />
                          <p>No milestones matching your filters found for this month.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>

        </div>
      </main>

      {/* Task detailed submission / review Modal */}
      <Modal isOpen={selectedTask !== null} onClose={() => setSelectedTask(null)} title="Milestone Task Detail">
        {selectedTask && (
          <div className="space-y-6 text-left text-xs font-semibold text-slate-600">
            
            {/* Header Panel */}
            <div className="pb-4 border-b border-slate-100">
              <div className="flex justify-between items-start gap-4 mb-2">
                <h4 className="text-base font-extrabold text-slate-800 tracking-tight leading-snug">{selectedTask.title}</h4>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <StatusBadge type="priority" value={selectedTask.priority} />
                  <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
                    selectedTask.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-50 text-indigo-850'
                  }`}>
                    {selectedTask.status === 'COMPLETED' ? 'Approved' : selectedTask.status}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 font-bold mt-2">
                <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 border border-slate-200/50 rounded-lg">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  Supervisor: <strong className="text-slate-600 ml-0.5">{selectedTask.mentor?.user?.name || "Unknown"}</strong>
                </span>
                <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 border border-slate-200/50 rounded-lg">
                  <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
                  Due Date: <strong className="text-slate-600 ml-0.5">{new Date(selectedTask.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                </span>
              </div>
            </div>

            {/* Description Info */}
            <div className="space-y-2">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" /> Task Description & Instructions
              </span>
              <p className="leading-relaxed text-slate-600 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/80 font-medium">
                {selectedTask.description || "No specific details provided. Contact supervisor if clarify details needed."}
              </p>
            </div>

            {/* Submission deliverables */}
            {selectedTask.status === 'COMPLETED' || selectedTask.status === 'REVIEW' ? (
              <div className="p-5 bg-gradient-to-b from-indigo-50/30 to-indigo-50/10 border border-indigo-100 rounded-3xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between text-indigo-850 pb-2 border-b border-indigo-100/40">
                  <span className="font-extrabold text-xs flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-650 animate-pulse" /> Submitted Deliverables
                  </span>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                    {selectedTask.status === 'COMPLETED' ? 'Approved & Locked' : 'In Review'}
                  </span>
                </div>
                
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Submission URL / Reference:</span>
                  <a href={selectedTask.submissionUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1 break-all select-all">
                    {selectedTask.submissionUrl} <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
                  </a>
                </div>

                {selectedTask.submissionNotes && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Submission Notes:</span>
                    <p className="text-[11px] text-slate-700 bg-white/70 p-3 rounded-xl border border-indigo-50 leading-relaxed font-semibold italic">
                      "{selectedTask.submissionNotes}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-amber-50/40 border border-amber-200/50 rounded-2xl text-amber-700 font-bold text-[11px] text-center flex items-center justify-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>This task is in <strong className="text-amber-800">{selectedTask.status}</strong> status. Submit your deliverable on the task page.</span>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                onClick={() => setSelectedTask(null)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

