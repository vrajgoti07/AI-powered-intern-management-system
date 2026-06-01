import React, { useState } from 'react';
import { useTasks } from '../../hooks/queries';
import { Pagination } from '../../components/Pagination';
import { useAuth } from '../../hooks/useAuth';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardCheck, FileText, ArrowRight, Eye, GripVertical, 
  Calendar, Clock, User, CheckCircle2, AlertCircle, Play, 
  ArrowUpRight, Bookmark, Layers, TrendingUp, Sparkles, Award,
  MessageSquare, Send, Paperclip, ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const MotionDiv = motion.div as any;

export const MyTasks: React.FC = () => {
  const { data: tasks = [], isLoading: isTasksLoading, refetch } = useTasks({ assignedTo: 'me' });
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Submission Form State
  const [fileUrl, setFileUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'board' | 'discussions' | 'calendar'>('board');

  // Discussions Tab State
  const [discussionsSelectedTask, setDiscussionsSelectedTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [discNotes, setDiscNotes] = useState('');
  const [discFileUrl, setDiscFileUrl] = useState('');
  const [isDiscSubmitting, setIsDiscSubmitting] = useState(false);

  // Calendar Tab State
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // May 2026 default

  const [taskPage, setTaskPage] = useState(1);
  const tasksPerPage = 5;

  // Filter tasks for this intern
  const internId = (user as any)?.intern?.id;
  const myName = user?.name || "Intern";
  const myTasks = tasks.filter((t: any) => t.intern?.user?.name === myName || t.internId === internId);

  const totalTaskPages = Math.ceil(myTasks.length / tasksPerPage);
  const paginatedTasks = myTasks.slice((taskPage - 1) * tasksPerPage, taskPage * tasksPerPage);

  // Auto-select first task for discussions if none selected
  React.useEffect(() => {
    if (!discussionsSelectedTask && myTasks.length > 0) {
      setDiscussionsSelectedTask(myTasks[0]);
    }
  }, [myTasks, discussionsSelectedTask]);

  // Fetch comments when task changes
  React.useEffect(() => {
    const fetchComments = async () => {
      if (!discussionsSelectedTask?.id) return;
      try {
        const res = await api.get(`/tasks/${discussionsSelectedTask.id}/comments`);
        setComments(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch comments", error);
      }
    };
    fetchComments();
  }, [discussionsSelectedTask]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !discussionsSelectedTask?.id) return;
    try {
      const res = await api.post(`/tasks/${discussionsSelectedTask.id}/comments`, {
        comment: newComment.trim()
      });
      setComments(prev => [...prev, res.data.data]);
      setNewComment('');
      toast.success("Feedback comment posted!");
    } catch (error) {
      toast.error("Failed to post comment.");
    }
  };

  const handleDiscTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discNotes.trim() || !discFileUrl.trim()) {
      toast.error("Please provide submission link and notes.");
      return;
    }
    
    setIsDiscSubmitting(true);
    try {
      await api.post(`/tasks/${discussionsSelectedTask.id}/submit`, {
        submissionUrl: discFileUrl,
        submissionNotes: discNotes,
      });
      toast.success("Task Submitted Successfully for Mentor Review!");
      setDiscFileUrl('');
      setDiscNotes('');
      await refetch();
      
      // Update local discussionsSelectedTask
      setDiscussionsSelectedTask((prev: any) => ({
        ...prev,
        status: 'REVIEW',
        submissionUrl: discFileUrl,
        submissionNotes: discNotes,
        submittedAt: new Date().toISOString()
      }));
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to submit task.");
    } finally {
      setIsDiscSubmitting(false);
    }
  };

  // Calendar Helpers
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const totalDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

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

  const getTasksForDay = (dayNum: number) => {
    return myTasks.filter((t: any) => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate.getDate() === dayNum &&
             dueDate.getMonth() === currentDate.getMonth() &&
             dueDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const columns = [
    { title: "To Do", status: "TODO", color: "slate" },
    { title: "In Progress", status: "IN_PROGRESS", color: "blue" },
    { title: "In Review", status: "REVIEW", color: "purple" },
    { title: "Completed", status: "COMPLETED", color: "emerald" },
  ];

  // Counts & Progress Computations
  const totalCount = myTasks.length;
  const completedCount = myTasks.filter((t: any) => t.status === 'COMPLETED').length;
  const inProgressCount = myTasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
  const reviewCount = myTasks.filter((t: any) => t.status === 'REVIEW').length;
  const todoCount = myTasks.filter((t: any) => t.status === 'TODO').length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // =============================================
  // HTML5 Drag and Drop Handlers
  // =============================================
  const handleDragStart = (e: React.DragEvent, taskId: string, currentStatus: string) => {
    if (currentStatus === 'COMPLETED') {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.setData('fromStatus', currentStatus);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent, colStatus: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (colStatus === 'COMPLETED') {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    setDragOverCol(colStatus);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverCol(null);
    setIsDragging(false);

    if (targetStatus === 'COMPLETED') {
      toast.error("Only mentors can mark tasks as completed.");
      return;
    }

    const taskId = e.dataTransfer.getData('taskId');
    const fromStatus = e.dataTransfer.getData('fromStatus');

    if (!taskId || fromStatus === targetStatus) return;

    try {
      await api.put(`/tasks/${taskId}`, { status: targetStatus });
      const statusLabel = targetStatus === 'IN_PROGRESS' ? 'In Progress' : targetStatus === 'REVIEW' ? 'In Review' : 'To Do';
      toast.success(`Task moved to ${statusLabel}`);
      await refetch();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update task status.");
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOverCol(null);
  };

  // =============================================
  // Task Submission & Start Handlers
  // =============================================
  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl || !notes) {
      toast.error("Please fill in all submission fields.");
      return;
    }
    if (!selectedTask) return;

    setIsSubmitting(true);
    try {
      await api.post(`/tasks/${selectedTask.id}/submit`, {
        submissionUrl: fileUrl,
        submissionNotes: notes,
      });
      toast.success("Task Submitted Successfully for Supervisor Review!");
      setFileUrl('');
      setNotes('');
      setSelectedTask(null);
      await refetch();
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed to submit task";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartTask = async (id: string) => {
    try {
      await api.put(`/tasks/${id}`, { status: 'IN_PROGRESS' });
      toast.success("Task started. Moved to In Progress Column.");
      setSelectedTask(null);
      await refetch();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to start task.");
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="My Milestones & Tasks" />

        {/* Outer scrollable container with a premium subtle radial grid texture */}
        <div 
          className="flex-1 overflow-y-auto p-6 space-y-6 text-left"
          style={{
            backgroundImage: 'radial-gradient(#e2e8f0 1.2px, transparent 1.2px)',
            backgroundSize: '24px 24px',
            backgroundColor: '#f8fafc'
          }}
        >
          
          {/* Top Panel: High-Fidelity Analytics Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Overall Progress */}
            <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl border border-slate-200/50 p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 flex flex-col justify-between h-32 group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-teal-500/0 rounded-bl-full pointer-events-none transition-all duration-300 group-hover:scale-110" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Overall Progress</p>
                  <h4 className="text-2xl font-black text-slate-800 mt-1.5">{progressPercent}%</h4>
                </div>
                <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shadow-emerald-100/50">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full bg-slate-100 border border-slate-200/30 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                  <span>{completedCount} of {totalCount} Milestones</span>
                  <span className="text-emerald-600">Completed</span>
                </div>
              </div>
            </div>

            {/* Card 2: Active Sprints */}
            <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl border border-slate-200/50 p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 flex flex-col justify-between h-32 group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-indigo-500/0 rounded-bl-full pointer-events-none transition-all duration-300 group-hover:scale-110" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Active Sprints</p>
                  <h4 className="text-2xl font-black text-slate-800 mt-1.5">{inProgressCount}</h4>
                </div>
                <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-sm shadow-blue-100/50">
                  <Play className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">Internship deliverables currently in active execution</p>
              </div>
            </div>

            {/* Card 3: Awaiting Review */}
            <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl border border-slate-200/50 p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 flex flex-col justify-between h-32 group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-pink-500/0 rounded-bl-full pointer-events-none transition-all duration-300 group-hover:scale-110" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Awaiting Review</p>
                  <h4 className="text-2xl font-black text-slate-800 mt-1.5">{reviewCount}</h4>
                </div>
                <div className="w-10 h-10 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center text-purple-600 shadow-sm shadow-purple-100/50">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">Deliverables submitted for supervisor verification</p>
              </div>
            </div>

            {/* Card 4: Backlog Queue */}
            <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl border border-slate-200/50 p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 flex flex-col justify-between h-32 group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-500/5 to-slate-600/0 rounded-bl-full pointer-events-none transition-all duration-300 group-hover:scale-110" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Backlog Queue</p>
                  <h4 className="text-2xl font-black text-slate-800 mt-1.5">{todoCount}</h4>
                </div>
                <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 shadow-sm shadow-slate-200/50">
                  <Bookmark className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">Assigned items awaiting sprint initiation</p>
              </div>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-slate-200/80 mb-6 gap-2">
            {[
              { id: 'board', label: 'Sprint Kanban Board', icon: ClipboardCheck },
              { id: 'discussions', label: 'Discussions & Feedback Thread', icon: MessageSquare },
              { id: 'calendar', label: 'Milestones Calendar', icon: Calendar },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer
                    ${isActive 
                      ? 'border-[#2563eb] text-[#2563eb]' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'board' && (
            /* Kanban Board Sprints Container */
            <div className="flex gap-6 overflow-x-auto pb-4 items-stretch select-none">
              {columns.map((col) => {
                const colTasks = myTasks.filter((t: any) => t.status === col.status);
                const isDropTarget = dragOverCol === col.status && col.status !== 'COMPLETED';

                return (
                  <div 
                    key={col.title} 
                    className={`w-80 bg-white/70 backdrop-blur-xl rounded-2xl p-5 border flex flex-col flex-shrink-0 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.015)] border-slate-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] ${
                      isDropTarget 
                        ? 'border-indigo-400 bg-indigo-50/25 shadow-[0_12px_40px_rgba(99,102,241,0.06)] scale-[1.01]' 
                        : ''
                    }`}
                    onDragOver={(e) => handleDragOver(e, col.status)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, col.status)}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/60 flex-shrink-0">
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-2 w-2">
                          {col.status !== 'TODO' && (
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                              col.status === 'COMPLETED' ? 'bg-emerald-400' : col.status === 'REVIEW' ? 'bg-purple-400' : 'bg-blue-400'
                            }`}></span>
                          )}
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${
                            col.status === 'COMPLETED' ? 'bg-emerald-500' : col.status === 'REVIEW' ? 'bg-purple-500' : col.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-slate-400'
                          }`}></span>
                        </span>
                        <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider">
                          {col.title}
                        </h3>
                      </div>
                      <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border shadow-sm ${
                        col.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        col.status === 'REVIEW' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                        col.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                        'bg-slate-50 text-slate-500 border-slate-200/60'
                      }`}>
                        {colTasks.length}
                      </span>
                    </div>

                    {/* Column tasks scroll list */}
                    <div className="flex-1 overflow-y-auto min-h-[450px] max-h-[calc(100vh-320px)] space-y-4 pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                      {isTasksLoading ? (
                        <div className="space-y-3.5 animate-pulse">
                          {[1, 2].map((n) => (
                            <div key={n} className="bg-slate-100 p-4 border border-slate-200 rounded-2xl space-y-3 h-28 flex flex-col justify-between">
                              <div className="flex justify-between items-center">
                                <div className="h-3 w-2/3 bg-slate-200 rounded"></div>
                                <div className="h-4 w-12 bg-slate-200 rounded"></div>
                              </div>
                              <div className="space-y-1.5">
                                <div className="h-2 w-full bg-slate-200 rounded"></div>
                                <div className="h-2 w-5/6 bg-slate-200 rounded"></div>
                              </div>
                              <div className="h-2.5 w-1/3 bg-slate-200 rounded"></div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <AnimatePresence mode="popLayout">
                          {colTasks.map((t: any) => {
                            const isUrgent = new Date(t.dueDate).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000 && t.status !== 'COMPLETED';
                            const accentColor = col.status === 'COMPLETED' ? 'border-l-emerald-500 shadow-emerald-50/30' : 
                                                col.status === 'REVIEW' ? 'border-l-purple-500 shadow-purple-50/30' : 
                                                col.status === 'IN_PROGRESS' ? 'border-l-blue-500 shadow-blue-50/30' : 
                                                'border-l-slate-300 shadow-slate-50/30';

                            return (
                              <MotionDiv
                                key={t.id}
                                layoutId={t.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                                {...{
                                  draggable: t.status !== 'COMPLETED',
                                  onDragStart: (e: React.DragEvent) => handleDragStart(e, t.id, t.status),
                                  onDragEnd: handleDragEnd
                                }}
                                onClick={() => setSelectedTask(t)}
                                className={`bg-white hover:bg-slate-50/40 p-4 border border-slate-200 rounded-2xl text-left cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.015] space-y-3.5 shadow-sm hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)] border-l-4 ${accentColor} ${
                                  t.status !== 'COMPLETED' ? 'cursor-grab active:cursor-grabbing' : ''
                                } ${isDragging ? 'opacity-50' : ''}`}
                              >
                                <div className="flex items-start justify-between gap-2.5">
                                  <div className="flex items-start gap-1.5 flex-1 min-w-0">
                                    {t.status !== 'COMPLETED' && (
                                      <GripVertical className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-0.5" />
                                    )}
                                    <span className="font-extrabold text-slate-800 text-xs leading-snug line-clamp-2">{t.title}</span>
                                  </div>
                                  <StatusBadge type="priority" value={t.priority} />
                                </div>
                                
                                <p className="text-[10.5px] text-slate-600 font-semibold line-clamp-2 leading-relaxed">
                                  {t.description}
                                </p>
                                
                                <div className="flex items-center justify-between pt-3 border-t border-slate-100/85 text-[10px] font-bold">
                                  <div className={`flex items-center gap-1.5 ${isUrgent ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 border border-slate-200/60 rounded-lg px-2 py-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                    <span className="truncate max-w-[80px]">
                                      @{t.mentor?.user?.name?.split(' ')[0] || "Supervisor"}
                                    </span>
                                  </div>
                                </div>
                              </MotionDiv>
                            );
                          })}
                        </AnimatePresence>
                      )}

                      {/* Empty State visual */}
                      {colTasks.length === 0 && (
                        <div className={`flex flex-col items-center justify-center border border-dashed rounded-2xl p-6 text-center transition-all min-h-[220px] ${
                          isDropTarget ? 'border-indigo-300 bg-indigo-50/20 scale-[0.98] shadow-inner' : 'border-slate-200 bg-slate-50/15'
                        }`}>
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm mb-3 transition-transform duration-300 group-hover:scale-110 ${
                            col.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' : 
                            col.status === 'REVIEW' ? 'bg-purple-50 text-purple-650 border border-purple-100/50' : 
                            col.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-650 border border-blue-100/50' : 
                            'bg-slate-50 text-slate-500 border border-slate-200/80'
                          }`}>
                            {col.status === 'COMPLETED' ? <Award className="w-5 h-5" /> :
                             col.status === 'REVIEW' ? <Layers className="w-5 h-5" /> :
                             col.status === 'IN_PROGRESS' ? <Play className="w-5 h-5" /> :
                             <Bookmark className="w-5 h-5" />}
                          </div>
                          <p className="text-[11px] text-slate-700 font-extrabold mb-1">
                            {isDropTarget ? 'Release here!' : 
                             col.status === 'COMPLETED' ? 'Awaiting Achievements' :
                             col.status === 'REVIEW' ? 'Review Queue Clear' :
                             col.status === 'IN_PROGRESS' ? 'Ready to Work' : 'Backlog Clear'}
                          </p>
                          <p className="text-[9.5px] text-slate-500 font-semibold leading-relaxed max-w-[200px] mx-auto">
                            {isDropTarget ? 'Release here!' : 
                             col.status === 'COMPLETED' ? 'Move deliverables to review and your mentor will approve them here.' :
                             col.status === 'REVIEW' ? 'Your submissions are processed. No deliverables awaiting review.' :
                             col.status === 'IN_PROGRESS' ? 'Pick a milestone from the backlog and drag it here to initiate your work.' : 
                             'Your task backlog is currently empty. Enjoy the clean slate!'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'discussions' && (
            /* Discussions Thread View */
            <div className="flex flex-col lg:flex-row gap-6 items-stretch">
              {/* Task Selector */}
              <div className="w-full lg:w-1/3 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col max-h-[600px] overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex-shrink-0">
                  <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardCheck className="w-4 h-4 text-[#2563eb]" /> Select Milestone Task
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 flex flex-col justify-between">
                  <div>
                    {paginatedTasks.length === 0 ? (
                      <div className="text-center p-6 text-slate-400 text-xs font-semibold">No tasks assigned yet.</div>
                    ) : (
                      paginatedTasks.map((t: any) => (
                        <div 
                          key={t.id}
                          onClick={() => setDiscussionsSelectedTask(t)}
                          className={`p-3.5 rounded-2xl cursor-pointer border transition-all text-left mb-2 last:mb-0 ${
                            discussionsSelectedTask?.id === t.id 
                              ? 'bg-blue-50 border-blue-200 shadow-sm scale-[1.02]' 
                              : 'bg-white border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                            <h4 className={`font-extrabold text-xs line-clamp-1 ${discussionsSelectedTask?.id === t.id ? 'text-blue-900' : 'text-slate-700'}`}>{t.title}</h4>
                            <span className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${
                              t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              t.status === 'REVIEW' ? 'bg-purple-50 text-purple-750 border-purple-100' :
                              t.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                              'bg-slate-50 text-slate-500 border-slate-200'
                            }`}>{t.status}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold">Due {new Date(t.dueDate).toLocaleDateString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                  {totalTaskPages > 1 && (
                    <Pagination 
                      currentPage={taskPage}
                      totalPages={totalTaskPages}
                      onPageChange={setTaskPage}
                    />
                  )}
                </div>
              </div>

              {/* Chat Thread Panel */}
              {discussionsSelectedTask ? (
                <div className="flex-1 flex flex-col gap-6">
                  {/* Info Spec */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left">
                    <div className="flex justify-between items-start flex-wrap gap-3 border-b border-slate-100 pb-3 mb-3">
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm">{discussionsSelectedTask.title}</h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">Assigned by Mentor {discussionsSelectedTask.mentor?.user?.name || 'Unknown'}</p>
                      </div>
                      <StatusBadge type="priority" value={discussionsSelectedTask.priority} />
                    </div>
                    <p className="text-xs text-slate-650 font-medium leading-relaxed mb-4">{discussionsSelectedTask.description}</p>
                    
                    {/* Submission state */}
                    {discussionsSelectedTask.status === 'COMPLETED' || discussionsSelectedTask.status === 'REVIEW' ? (
                      <div className={`border rounded-2xl p-4 flex flex-col gap-3 ${discussionsSelectedTask.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'}`}>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${discussionsSelectedTask.status === 'COMPLETED' ? 'text-emerald-600' : 'text-blue-600'}`} />
                          <div className="text-xs">
                            <p className={`font-bold ${discussionsSelectedTask.status === 'COMPLETED' ? 'text-emerald-800' : 'text-blue-800'}`}>
                              {discussionsSelectedTask.status === 'COMPLETED' ? 'Approved & Graded!' : 'Under Review'}
                            </p>
                          </div>
                        </div>
                        {discussionsSelectedTask.submissionUrl && (
                          <a href={discussionsSelectedTask.submissionUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-1 bg-white/50 w-fit px-2.5 py-1.5 rounded-lg border border-blue-100/50">
                            <Paperclip className="w-3.5 h-3.5" /> View Submitted URL <ArrowRight className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handleDiscTaskSubmit} className="space-y-3 pt-3 border-t border-slate-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Submission Link *</label>
                            <input 
                              type="url"
                              required
                              value={discFileUrl}
                              onChange={(e) => setDiscFileUrl(e.target.value)}
                              placeholder="https://..."
                              className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-base"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Submission Notes *</label>
                            <input 
                              type="text" 
                              required
                              placeholder="Describe your work..."
                              value={discNotes}
                              onChange={(e) => setDiscNotes(e.target.value)}
                              className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-base"
                            />
                          </div>
                        </div>
                        <button type="submit" disabled={isDiscSubmitting} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors disabled:opacity-50 min-h-[44px]">
                          {isDiscSubmitting ? 'Submitting...' : 'Submit Deliverable'}
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Comments Thread */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col min-h-[300px] text-left">
                    <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-slate-100">
                      <MessageSquare className="w-4.5 h-4.5 text-[#2563eb]" /> Mentor Discussion & Feedback
                    </h4>
                    <div className="flex-1 overflow-y-auto space-y-3.5 my-4 pr-1.5 max-h-[300px]">
                      {comments.length === 0 ? (
                        <div className="text-center p-6 text-slate-400 text-xs font-semibold italic">No discussion messages found. Ask your supervisor for updates!</div>
                      ) : (
                        comments.map((c: any) => {
                          const isMe = c.userId === user?.id;
                          return (
                            <div key={c.id} className={`p-3 border rounded-2xl text-xs space-y-1 ${
                              isMe ? 'bg-blue-50/20 border-blue-100 ml-8' : 'bg-slate-50/50 border-slate-150 mr-8'
                            }`}>
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-700">{c.user?.name || 'User'}</span>
                                <span className="text-[9px] text-slate-400 font-semibold">{new Date(c.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-[10px] text-slate-650 font-semibold leading-relaxed italic">"{c.comment}"</p>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="flex gap-2 items-center pt-3 border-t border-slate-100">
                      <input 
                        type="text" 
                        placeholder="Ask your mentor or leave updates..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                        className="flex-1 text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-base" 
                      />
                      <button onClick={handleAddComment} disabled={!newComment.trim()} className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-colors disabled:opacity-50">
                        <Send className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-center p-6 text-slate-400 text-sm font-semibold">
                  Select a milestone task to inspect specifications and discussion thread.
                </div>
              )}
            </div>
          )}

          {activeTab === 'calendar' && (
            /* Monthly Calendar View */
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                  <Calendar className="w-5 h-5 text-[#2563eb]" /> {currentMonthLabel}
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all cursor-pointer">
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  <button onClick={handleNextMonth} className="p-2 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all cursor-pointer">
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>

              {/* Days of week */}
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d}>{d}</div>)}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Padding for first day */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-slate-50/20 border border-transparent min-h-[90px] rounded-2xl" />
                ))}

                {/* Days list */}
                {daysArray.map((dayNum) => {
                  const dayTasks = getTasksForDay(dayNum);
                  return (
                    <div key={`day-${dayNum}`} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 min-h-[90px] p-2.5 rounded-2xl flex flex-col justify-between transition-colors">
                      <span className="font-extrabold text-slate-400 text-xs">{dayNum}</span>
                      <div className="space-y-1 mt-1 flex-1 flex flex-col justify-end">
                        {dayTasks.map((t: any) => (
                          <div 
                            key={t.id}
                            onClick={() => setSelectedTask(t)}
                            className={`px-2 py-1 rounded-lg text-[9px] font-bold border truncate text-left cursor-pointer transition-all hover:scale-102
                              ${t.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                t.status === 'REVIEW' ? 'bg-purple-50 border-purple-100 text-purple-755' :
                                t.status === 'IN_PROGRESS' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                                'bg-slate-150 border-slate-250 text-slate-600'}`}
                            title={t.title}
                          >
                            {t.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Task detailed submission / review Modal */}
      <Modal isOpen={selectedTask !== null} onClose={() => setSelectedTask(null)} title="Milestone Task Detail">
        {selectedTask && (
          <div className="space-y-6 text-left text-xs font-semibold text-slate-600">
            
            {/* Header Panel */}
            <div className="pb-4 border-b border-slate-100">
              <div className="flex justify-between items-start gap-3 mb-2">
                <h4 className="text-base font-extrabold text-slate-800 tracking-tight leading-snug">{selectedTask.title}</h4>
                <StatusBadge type="priority" value={selectedTask.priority} />
              </div>
              <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold mt-1">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  Supervisor: <strong className="text-slate-600 ml-0.5">{selectedTask.mentor?.user?.name || "Unknown"}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  Due Date: <strong className="text-slate-600 ml-0.5">{new Date(selectedTask.dueDate).toLocaleDateString()}</strong>
                </span>
              </div>
            </div>

            {/* Description Info */}
            <div className="space-y-2">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-4 h-4 text-indigo-650" /> Task Description & Instructions
              </span>
              <p className="leading-relaxed text-slate-600 bg-slate-50/50 p-4 rounded-2xl border border-slate-200 font-medium">
                {selectedTask.description}
              </p>
            </div>

            {/* Submission deliverables */}
            {selectedTask.status === 'COMPLETED' || selectedTask.status === 'REVIEW' ? (
              <div className="p-5 bg-gradient-to-b from-indigo-50/30 to-indigo-50/10 border border-indigo-100 rounded-3xl space-y-4">
                <div className="flex items-center justify-between text-indigo-800 pb-2 border-b border-indigo-100/40">
                  <span className="font-extrabold text-xs flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-600 animate-pulse" /> Submitted Deliverables
                  </span>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                    {selectedTask.status === 'COMPLETED' ? 'Approved' : 'In Review'}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Submission URL / Reference:</span>
                  <a href={selectedTask.submissionUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1 mt-1 break-all select-all">
                    {selectedTask.submissionUrl} <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>

                {selectedTask.submissionNotes && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Submission Notes:</span>
                    <p className="text-[11px] text-slate-700 bg-white/60 p-3 rounded-xl border border-indigo-50 leading-relaxed font-semibold italic mt-1">
                      "{selectedTask.submissionNotes}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Active Submission Form */
              <form onSubmit={handleSubmitTask} className="space-y-4 pt-3 border-t border-slate-100 text-left">
                <div className="flex items-center gap-2 pb-2">
                  <ClipboardCheck className="w-5 h-5 text-indigo-600 animate-bounce" />
                  <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Submit Task Deliverables</span>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">File Link / Pull Request URL *</label>
                  <input 
                    type="url" 
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://github.com/myusername/project/pull/1"
                    className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">Submission Notes & Comments *</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe what you worked on, test logs and validation steps..."
                    className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl h-24 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white resize-none text-base"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  {selectedTask.status === 'TODO' && (
                    <button 
                      type="button"
                      onClick={() => handleStartTask(selectedTask.id)}
                      className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200/60 rounded-xl transition-colors cursor-pointer"
                    >
                      Start Task
                    </button>
                  )}
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-100 hover:shadow-lg cursor-pointer disabled:opacity-50 min-h-[44px]"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Milestone'}
                  </button>
                </div>
              </form>
            )}

            {selectedTask.status === 'COMPLETED' && (
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Close Inspection
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
};

