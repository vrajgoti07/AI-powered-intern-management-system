import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import api from '../../services/api';
import {
  Target, Plus, Sparkles, CheckCircle, Clock, AlertTriangle,
  XCircle, Trash2, ChevronDown, ChevronUp, Loader2,
  TrendingUp, BarChart3, ArrowRight, RefreshCw, Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GoalTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  isGoalTask: boolean;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  weekStartDate: string;
  weekEndDate: string;
  status: string;
  aiEvaluation: string | null;
  completionRate: number | null;
  createdAt: string;
  tasks: GoalTask[];
}

interface GoalStats {
  total: number;
  achieved: number;
  partial: number;
  notAchieved: number;
  inProgress: number;
  achievementRate: number;
}

export const Goals: React.FC = () => {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      const [goalsRes, statsRes] = await Promise.all([
        api.get('/goals/my?limit=20'),
        api.get('/goals/stats')
      ]);
      setGoals(goalsRes.data.data?.goals || []);
      setStats(statsRes.data.data || null);
    } catch (err: any) {
      console.error('Failed to fetch goals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleCreate = async () => {
    if (!goalInput.trim() || goalInput.trim().length < 5) {
      setError('Goal must be at least 5 characters long.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await api.post('/goals', {
        title: goalInput.trim(),
        description: descInput.trim() || undefined
      });
      setGoalInput('');
      setDescInput('');
      setShowForm(false);
      await fetchGoals();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create goal. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (goalId: string) => {
    setDeleting(goalId);
    try {
      await api.delete(`/goals/${goalId}`);
      await fetchGoals();
    } catch (err: any) {
      console.error('Failed to delete goal:', err);
    } finally {
      setDeleting(null);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACHIEVED':
        return { label: 'Achieved', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-100' };
      case 'PARTIALLY_ACHIEVED':
        return { label: 'Partially Achieved', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-100' };
      case 'NOT_ACHIEVED':
        return { label: 'Not Achieved', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', ring: 'ring-red-100' };
      case 'IN_PROGRESS':
      default:
        return { label: 'In Progress', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', ring: 'ring-indigo-100' };
    }
  };

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 rounded-md">Done</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 rounded-md">Active</span>;
      case 'REVIEW':
        return <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 rounded-md">Review</span>;
      default:
        return <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 rounded-md">Todo</span>;
    }
  };

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-400';
      case 'MEDIUM': return 'bg-amber-400';
      case 'LOW': return 'bg-emerald-400';
      default: return 'bg-slate-300';
    }
  };

  const completedTaskCount = (tasks: GoalTask[]) => tasks.filter(t => t.status === 'COMPLETED').length;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="AI Goals" />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-left">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Target className="w-6 h-6 text-indigo-600" />
                Goal-Setting Assistant
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                Set a high-level goal and let AI break it into actionable tasks for you.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchGoals}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> New Goal
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Total Goals', value: stats.total, icon: Target, accent: 'indigo' },
                { label: 'In Progress', value: stats.inProgress, icon: Clock, accent: 'blue' },
                { label: 'Achieved', value: stats.achieved, icon: CheckCircle, accent: 'emerald' },
                { label: 'Partially', value: stats.partial, icon: TrendingUp, accent: 'amber' },
                { label: 'Achievement %', value: `${stats.achievementRate}%`, icon: BarChart3, accent: 'purple' },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black tracking-wider uppercase text-slate-400">{s.label}</span>
                    <s.icon className={`w-4 h-4 text-${s.accent}-500`} />
                  </div>
                  <span className="text-2xl font-black text-slate-800">{s.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Goal Creation Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white border border-indigo-200/60 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-black text-slate-800">Create AI-Powered Goal</h3>
                      <p className="text-[10px] font-semibold text-slate-400">Describe what you want to achieve. AI will generate 3-5 actionable tasks.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-black tracking-wider uppercase text-slate-500 mb-1 block text-left">
                        Your Goal *
                      </label>
                      <textarea
                        value={goalInput}
                        onChange={(e) => setGoalInput(e.target.value)}
                        placeholder='e.g. "Learn React Testing Library and write tests for our dashboard components"'
                        maxLength={500}
                        rows={3}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none font-semibold"
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] font-bold text-slate-300">{goalInput.length}/500</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black tracking-wider uppercase text-slate-500 mb-1 block text-left">
                        Additional Notes (Optional)
                      </label>
                      <input
                        value={descInput}
                        onChange={(e) => setDescInput(e.target.value)}
                        placeholder="Any extra context or focus areas..."
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-semibold"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 text-xs font-bold bg-red-50 border border-red-200 rounded-xl p-3">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => { setShowForm(false); setError(null); }}
                      className="px-4 py-2 text-xs font-extrabold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={creating || goalInput.trim().length < 5}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          AI is thinking...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Tasks with AI
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Goals List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-white rounded-3xl animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : goals.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center">
              <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-black text-slate-600 mb-1">No Goals Yet</h3>
              <p className="text-xs font-semibold text-slate-400 mb-4 max-w-sm mx-auto">
                Set your first weekly goal and let AI break it down into actionable tasks to help you grow.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Set Your First Goal
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal, idx) => {
                const statusConfig = getStatusConfig(goal.status);
                const StatusIcon = statusConfig.icon;
                const completed = completedTaskCount(goal.tasks);
                const total = goal.tasks.length;
                const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                const isExpanded = expandedGoal === goal.id;

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`bg-white border rounded-3xl shadow-sm overflow-hidden transition-all ${statusConfig.border}`}
                  >
                    {/* Goal Header */}
                    <div
                      className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                      onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${statusConfig.bg} ring-1 ${statusConfig.ring}`}>
                          <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                        </div>

                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-sm font-black text-slate-800 truncate max-w-[90%]">
                              {goal.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${statusConfig.bg} ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {new Date(goal.weekStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              {' – '}
                              {new Date(goal.weekEndDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {completed}/{total} tasks
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className={`h-full rounded-full ${
                                  progress >= 80 ? 'bg-emerald-500' : progress >= 40 ? 'bg-amber-500' : 'bg-indigo-500'
                                }`}
                              />
                            </div>
                            <span className="text-[10px] font-black text-slate-500">{progress}%</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(goal.id);
                            }}
                            disabled={deleting === goal.id}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            {deleting === goal.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Section */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-0 border-t border-slate-100">
                            {/* AI-Generated Tasks */}
                            <div className="mt-4">
                              <h4 className="text-[10px] font-black tracking-wider uppercase text-slate-400 mb-3 text-left flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                AI-Generated Tasks
                              </h4>
                              <div className="space-y-2">
                                {goal.tasks.map((task) => (
                                  <div
                                    key={task.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                      task.status === 'COMPLETED'
                                        ? 'bg-emerald-50/40 border-emerald-200/40'
                                        : 'bg-white border-slate-100 hover:bg-slate-50/50'
                                    }`}
                                  >
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityDot(task.priority)}`} />
                                    <div className="flex-1 min-w-0 text-left">
                                      <p className={`text-xs font-extrabold truncate ${
                                        task.status === 'COMPLETED' ? 'text-slate-500 line-through' : 'text-slate-700'
                                      }`}>
                                        {task.title}
                                      </p>
                                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                                        Due {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                      </p>
                                    </div>
                                    {getTaskStatusBadge(task.status)}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* AI Evaluation */}
                            {goal.aiEvaluation && (
                              <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/40 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Brain className="w-4 h-4 text-indigo-600" />
                                  <h4 className="text-xs font-black text-indigo-900">AI Evaluation</h4>
                                  {goal.completionRate !== null && (
                                    <span className="ml-auto text-[10px] font-black text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">
                                      {goal.completionRate}% Complete
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-semibold text-indigo-800/80 leading-relaxed text-left">
                                  {goal.aiEvaluation}
                                </p>
                              </div>
                            )}

                            {/* Quick Tip */}
                            {goal.status === 'IN_PROGRESS' && (
                              <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-slate-400 text-left">
                                <ArrowRight className="w-3 h-3" />
                                Complete tasks in your regular task board. Progress is synced automatically.
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
