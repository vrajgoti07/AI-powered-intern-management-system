import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Target, Clock, CheckCircle, TrendingUp, XCircle, Brain, RefreshCw, Activity, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

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

interface InternGoalsTabProps {
  internId: string;
  internName: string;
}

export const InternGoalsTab: React.FC<InternGoalsTabProps> = ({ internId, internName }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!internId) return;
    setRefreshing(true);
    try {
      const res = await api.get(`/goals/intern/${internId}`);
      setGoals(res.data.data?.goals || []);
    } catch (err) {
      console.error('Failed to fetch intern goals:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [internId]);

  useEffect(() => {
    setLoading(true);
    fetchGoals();
  }, [internId, fetchGoals]);

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-500';
      case 'MEDIUM': return 'bg-amber-500';
      case 'LOW': return 'bg-emerald-500';
      default: return 'bg-slate-400';
    }
  };

  const completedTaskCount = (tasks: GoalTask[]) => tasks.filter(t => t.status === 'COMPLETED').length;

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 bg-white rounded-3xl animate-pulse border border-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" />
            AI Goal-Setting & Milestones
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Weekly self-directed learning objectives and AI-generated task tracks for {internName}
          </p>
        </div>
        <button
          onClick={fetchGoals}
          disabled={refreshing}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 cursor-pointer disabled:opacity-50"
          title="Refresh Goals"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
          <Target className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-xs font-black text-slate-600 mb-1">No Goals Set Yet</h4>
          <p className="text-[10px] font-semibold text-slate-400 max-w-xs mx-auto">
            {internName} hasn't initialized any AI goals for their training track.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Desktop Timeline Vertical Bar */}
          <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-200 hidden md:block" />

          <div className="space-y-6 md:space-y-8">
            {goals.map((goal, index) => {
              const statusConfig = getStatusConfig(goal.status);
              const StatusIcon = statusConfig.icon;
              const completed = completedTaskCount(goal.tasks);
              const total = goal.tasks.length;
              const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
              const isExpanded = expandedGoal === goal.id;

              return (
                <div key={goal.id} className="relative md:pl-16 text-left">
                  {/* Desktop Timeline Node */}
                  <div className="absolute left-3.5 top-5 w-5 h-5 rounded-full border-4 border-white bg-indigo-500 shadow-sm z-10 hidden md:flex items-center justify-center transform -translate-x-1/2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>

                  {/* Goal Card Container */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white border rounded-3xl shadow-sm hover:shadow-md hover:border-indigo-100/80 transition-all overflow-hidden ${
                      isExpanded ? 'ring-1 ring-indigo-500/10' : ''
                    }`}
                  >
                    {/* Goal Card Header */}
                    <div
                      className="p-5 cursor-pointer hover:bg-slate-50/30 transition-colors"
                      onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`p-2.5 rounded-xl ${statusConfig.bg} ${statusConfig.color} flex-shrink-0 ring-1 ${statusConfig.ring}`}>
                            <StatusIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-black text-indigo-500 tracking-wider uppercase flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Week of {new Date(goal.weekStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            <h4 className="text-xs font-black text-slate-800 truncate mt-0.5">
                              {goal.title}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${statusConfig.bg} ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {completed}/{total} tasks
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Small progress circle/arc */}
                            <div className="relative w-8 h-8 flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle cx="16" cy="16" r="12" className="stroke-slate-100 fill-none stroke-[3]" />
                                <circle cx="16" cy="16" r="12" 
                                  className={`fill-none stroke-[3] transition-all duration-500`}
                                  style={{
                                    strokeDasharray: 2 * Math.PI * 12,
                                    strokeDashoffset: 2 * Math.PI * 12 * (1 - progress / 100),
                                    stroke: progress >= 80 ? '#10b981' : progress >= 40 ? '#f59e0b' : '#6366f1'
                                  }}
                                />
                              </svg>
                              <span className="absolute text-[8px] font-black text-slate-700">{progress}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div className="border-t border-slate-50 bg-slate-50/20 p-5 space-y-4">
                        {goal.description && (
                          <div className="text-left">
                            <h5 className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Goal Context & Notes</h5>
                            <p className="text-xs font-semibold text-slate-600">{goal.description}</p>
                          </div>
                        )}

                        {/* AI-Generated Tasks */}
                        <div className="text-left">
                          <h5 className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                            <Activity className="w-3 h-3 text-indigo-500" />
                            AI Task Roadmap Breakdown
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {goal.tasks.map((task) => (
                              <div
                                key={task.id}
                                className={`flex items-center justify-between p-3 rounded-2xl border bg-white shadow-sm transition-all hover:border-slate-200`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)}`} />
                                  <span className={`text-xs font-extrabold truncate ${task.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                    {task.title}
                                  </span>
                                </div>
                                <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded-md flex-shrink-0 ${
                                  task.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'
                                }`}>
                                  {task.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* AI Evaluation */}
                        {goal.aiEvaluation && (
                          <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/30 border border-indigo-100/50 rounded-2xl p-4 text-left">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Brain className="w-3.5 h-3.5 text-indigo-600" />
                              <h5 className="text-xs font-black text-indigo-900">AI Progress Assessment</h5>
                              {goal.completionRate !== null && (
                                <span className="ml-auto text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                  {goal.completionRate}% Goal Accuracy
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-indigo-900/80 leading-relaxed italic">
                              "{goal.aiEvaluation}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
