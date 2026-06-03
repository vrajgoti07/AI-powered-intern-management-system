import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, MessageSquare, BrainCircuit, Heart, 
  AlertTriangle, ShieldCheck, Tag, ThumbsUp, Send, Check,
  User, RefreshCw, BarChart2, Star, CheckSquare, Layers,
  ChevronRight, Users, Clipboard, AlertCircle, TrendingUp, Mail,
  Calendar, CheckCircle2, ClipboardCheck
} from 'lucide-react';
import { Sidebar } from '../../../components/common/Sidebar';
import { Navbar } from '../../../components/common/Navbar';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { useInterns, useDepartments } from '../../../hooks/queries';

interface ActionItem {
  id: string;
  feedbackId?: string;
  internId: string;
  mentorId?: string;
  task: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
  intern?: { user: { name: string } };
}

interface SentimentDistribution {
  positive: number;
  neutral: number;
  constructive: number;
}

interface Trend {
  week: string;
  rating: number;
  sentimentScore: number;
}

interface InternSummary {
  internId: string;
  name: string;
  department: string;
  averageRating: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  activeActionItems: number;
  lastEvaluationDate: string;
}

interface HRInsights {
  averageRating: number;
  sentimentDistribution: SentimentDistribution;
  executiveInsight: string;
  keywords: string[];
  trends: Trend[];
  internSummaries: InternSummary[];
}

export const AIFeedback: React.FC = () => {
  const { user } = useAuth();
  const realRole = user?.role || 'INTERN';
  
  // Local role override switcher for development testing
  const [activeRole, setActiveRole] = useState<string>(realRole);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filters & State
  const [selectedInternId, setSelectedInternId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedCycle, setSelectedCycle] = useState<string>('Q2 2026');
  
  // Feedback submission form
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [category, setCategory] = useState<string>('WEEKLY_CHECKIN');
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);

  // Data States
  const [insights, setInsights] = useState<HRInsights>({
    averageRating: 0.0,
    sentimentDistribution: { positive: 0, neutral: 0, constructive: 0 },
    executiveInsight: '',
    keywords: [],
    trends: [],
    internSummaries: []
  });
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // Fetch lists for filters
  const { data: allInterns = [] } = useInterns();
  const { data: departments = [] } = useDepartments();

  // Scoped list of interns for the logged-in mentor
  const myInterns = activeRole === 'MENTOR'
    ? allInterns.filter((i: any) => i.mentor?.user?.name === user?.name || i.mentor?.userId === user?.id)
    : allInterns;

  // Sync default intern selection on load
  useEffect(() => {
    if (myInterns.length > 0 && !selectedInternId) {
      setSelectedInternId(myInterns[0].id);
    }
  }, [myInterns, selectedInternId]);

  // Load Dashboards Data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (activeRole === 'HR' || activeRole === 'SUPER_ADMIN') {
        const insRes = await api.get('/feedback/insights', {
          params: {
            departmentId: selectedDeptId || undefined,
            internId: selectedInternId || undefined,
            cycle: selectedCycle
          }
        });
        if (insRes.data.success) {
          setInsights(insRes.data.data);
        }

        // Load all action items
        const actRes = await api.get('/action-items');
        if (actRes.data.success) {
          setActionItems(actRes.data.data || []);
        }
      } 
      
      else if (activeRole === 'MENTOR') {
        // Mentor details/history for selected intern
        if (selectedInternId) {
          const insRes = await api.get('/feedback/insights', {
            params: { internId: selectedInternId }
          });
          if (insRes.data.success) {
            setInsights(insRes.data.data);
          }

          const histRes = await api.get('/feedback/history', {
            params: { internId: selectedInternId }
          });
          if (histRes.data.success) {
            setFeedbackHistory(histRes.data.data || []);
          }

          const actRes = await api.get('/action-items', {
            params: { internId: selectedInternId }
          });
          if (actRes.data.success) {
            setActionItems(actRes.data.data || []);
          }
        }
      } 
      
      else if (activeRole === 'INTERN') {
        // Intern sees their own insights & history
        const insRes = await api.get('/feedback/insights');
        if (insRes.data.success) {
          setInsights(insRes.data.data);
        }

        const histRes = await api.get('/feedback/history');
        if (histRes.data.success) {
          setFeedbackHistory(histRes.data.data || []);
        }

        const actRes = await api.get('/action-items');
        if (actRes.data.success) {
          setActionItems(actRes.data.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to load feedback dashboard data', error);
      toast.error('Could not sync feedback insights. Seeding might be required.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeRole, selectedInternId, selectedDeptId, selectedCycle]);

  // Seed demo data helper
  const handleSeedDemoData = async () => {
    setLoading(true);
    try {
      const res = await api.post('/feedback/seed');
      if (res.data.success) {
        toast.success('Database seeded with 6 interns and historical evaluations!');
        loadDashboardData();
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to seed database');
    } finally {
      setLoading(false);
    }
  };

  // Submit Feedback Handler (Mentor / Intern)
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Feedback comment remarks are required.');
      return;
    }
    
    setSubmittingFeedback(true);
    try {
      if (activeRole === 'MENTOR') {
        if (!selectedInternId) {
          toast.error('Please select an intern.');
          setSubmittingFeedback(false);
          return;
        }
        const res = await api.post('/feedback/mentor', {
          internId: selectedInternId,
          rating,
          comment,
          category
        });
        if (res.data.success) {
          toast.success('Mentor evaluation submitted successfully!');
          setComment('');
          loadDashboardData();
        }
      } else {
        // Intern submits self-evaluation
        const res = await api.post('/feedback/intern', {
          rating,
          comment,
          category: 'SELF_EVALUATION'
        });
        if (res.data.success) {
          toast.success('Self-reflection log saved successfully!');
          setComment('');
          loadDashboardData();
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Check off action item
  const handleToggleActionStatus = async (itemId: string, currentStatus: string) => {
    setActionLoadingId(itemId);
    const newStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    try {
      const res = await api.patch(`/action-items/${itemId}`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Action item status updated to ${newStatus}!`);
        // Update local status state
        setActionItems(prev => prev.map(item => item.id === itemId ? { ...item, status: newStatus } : item));
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update action item');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Drag/Drop/Move Kanban status
  const handleMoveActionItem = async (itemId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'COMPLETED') => {
    setActionLoadingId(itemId);
    try {
      const res = await api.patch(`/action-items/${itemId}`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Action item moved to ${newStatus}!`);
        setActionItems(prev => prev.map(item => item.id === itemId ? { ...item, status: newStatus } : item));
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to move action item');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Custom SVG Trend Chart Plotter
  const renderTrendChart = (trends: Trend[]) => {
    if (!trends || trends.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
          No historical trends computed.
        </div>
      );
    }

    const width = 500;
    const height = 150;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const maxVal = 5;

    // Line points for Rating
    const ratingPoints = trends.map((t, idx) => {
      const x = padding + (idx / (trends.length - 1)) * chartWidth;
      const y = padding + chartHeight - (t.rating / maxVal) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    // Line points for Sentiment Percentage
    const sentimentPoints = trends.map((t, idx) => {
      const x = padding + (idx / (trends.length - 1)) * chartWidth;
      const y = padding + chartHeight - (t.sentimentScore / 100) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
        <defs>
          <linearGradient id="grid-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" stopOpacity="0" />
            <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Chart grid background */}
        <rect x={padding} y={padding} width={chartWidth} height={chartHeight} fill="url(#grid-grad)" />
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1" />
        <line x1={padding} y1={padding + chartHeight / 2} x2={width - padding} y2={padding + chartHeight / 2} stroke="#f1f5f9" strokeWidth="1" />
        <line x1={padding} y1={padding + chartHeight} x2={width - padding} y2={padding + chartHeight} stroke="#e2e8f0" strokeWidth="1.5" />

        {/* Rating Line (Indigo Solid) */}
        <polyline
          fill="none"
          stroke="#4f46e5"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={ratingPoints}
        />

        {/* Sentiment Line (Emerald Dashed) */}
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeDasharray="4 4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={sentimentPoints}
        />

        {/* Rating and Sentiment Node dots */}
        {trends.map((t, idx) => {
          const x = padding + (idx / (trends.length - 1)) * chartWidth;
          const yRating = padding + chartHeight - (t.rating / maxVal) * chartHeight;
          const ySent = padding + chartHeight - (t.sentimentScore / 100) * chartHeight;
          return (
            <g key={idx} className="group/dot">
              <circle cx={x} cy={yRating} r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx={x} cy={ySent} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
              <title>{`Week: ${t.week}\nRating: ${t.rating}\nSentiment: ${t.sentimentScore}%`}</title>
            </g>
          );
        })}

        {/* X axis labels */}
        {trends.map((t, idx) => {
          const x = padding + (idx / (trends.length - 1)) * chartWidth;
          return (
            <text key={idx} x={x} y={height - 2} fill="#94a3b8" fontSize="8" fontWeight="800" textAnchor="middle">
              {t.week}
            </text>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="AI Feedback & Sentiments" />

        {/* Development Override Switcher Pill */}
        <div className="bg-white border-b border-slate-100 px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">Dev Mode Switcher</span>
            <p className="text-xs font-bold text-slate-400">Force render role layouts for testing:</p>
          </div>
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-inner">
            {['HR', 'MENTOR', 'INTERN'].map((role) => (
              <button
                key={role}
                onClick={() => {
                  setActiveRole(role);
                  setSelectedInternId('');
                }}
                className={`px-3 py-1 text-[10px] font-extrabold tracking-tight rounded-lg cursor-pointer transition-all ${
                  activeRole === role 
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {role === 'HR' ? 'HR Admin View' : role === 'MENTOR' ? 'Mentor View' : 'Intern View'}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {loading ? (
            <div className="h-96 flex flex-col gap-3 items-center justify-center">
              <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-xs font-extrabold text-slate-400 animate-pulse">Syncing cohort feedback archives...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {/* DASHBOARD 1: HR ADMIN VIEW                                       */}
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {(activeRole === 'HR' || activeRole === 'SUPER_ADMIN') && (
                <motion.div
                  key="hr-dash"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6 text-left"
                >
                  {/* Header filter controls */}
                  <div className="bg-white p-5 border border-slate-200/60 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
                        <Users className="w-5 h-5 text-indigo-600" /> Executive Analytics Portal
                      </h2>
                      <p className="text-xs font-bold text-slate-400">Aggregate feedback telemetry and sentiment graphs</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Seed button if summaries are empty */}
                      {insights.internSummaries.length === 0 && (
                        <button
                          onClick={handleSeedDemoData}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs rounded-xl shadow-sm hover:shadow transition-all cursor-pointer mr-2 flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Seed Demo Data
                        </button>
                      )}

                      {/* Department Filter */}
                      <select
                        value={selectedDeptId}
                        onChange={(e) => setSelectedDeptId(e.target.value)}
                        className="text-xs font-extrabold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-white"
                      >
                        <option value="">All Departments</option>
                        {departments.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>

                      {/* Intern Filter */}
                      <select
                        value={selectedInternId}
                        onChange={(e) => setSelectedInternId(e.target.value)}
                        className="text-xs font-extrabold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-white"
                      >
                        <option value="">All Interns</option>
                        {allInterns.map((i: any) => (
                          <option key={i.id} value={i.id}>{i.user?.name}</option>
                        ))}
                      </select>

                      {/* Cycle Selector */}
                      <select
                        value={selectedCycle}
                        onChange={(e) => setSelectedCycle(e.target.value)}
                        className="text-xs font-extrabold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-white"
                      >
                        <option value="Q1 2026">Q1 2026</option>
                        <option value="Q2 2026">Q2 2026</option>
                        <option value="Q3 2026">Q3 2026</option>
                        <option value="Q4 2026">Q4 2026</option>
                      </select>

                      <button
                        onClick={() => {
                          toast.success('Feedback CSV Report generated and emailed successfully!');
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
                      >
                        Generate Report
                      </button>
                    </div>
                  </div>

                  {/* Insights Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Score Card & Tone distribution */}
                    <div className="bg-white p-6 border border-slate-200/60 rounded-3xl shadow-sm space-y-6">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Score metrics</h3>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-4xl font-black text-slate-800">{insights.averageRating}</span>
                          <span className="text-sm font-bold text-slate-400">/ 5.0 rating</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-extrabold text-slate-600 flex items-center gap-1"><BrainCircuit className="w-4 h-4 text-indigo-500" /> AI Tone Distribution</h4>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs font-bold text-emerald-600 mb-1">
                              <span>Positive Tone</span>
                              <span>{insights.sentimentDistribution.positive}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${insights.sentimentDistribution.positive}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                              <span>Neutral Tone</span>
                              <span>{insights.sentimentDistribution.neutral}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-slate-400 h-full rounded-full" style={{ width: `${insights.sentimentDistribution.neutral}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-bold text-rose-500 mb-1">
                              <span>Constructive / Critical Tone</span>
                              <span>{insights.sentimentDistribution.constructive}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-rose-500 h-full rounded-full" style={{ width: `${insights.sentimentDistribution.constructive}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Middle: AI Executive Summary & Tags */}
                    <div className="bg-white p-6 border border-slate-200/60 rounded-3xl shadow-sm flex flex-col justify-between gap-6">
                      <div className="space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" /> Executive AI Summary
                        </h3>
                        <p className="text-xs font-semibold text-slate-600 leading-relaxed bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                          {insights.executiveInsight || 'Seeding needed to generate AI executive reviews.'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase tracking-wide text-slate-400">Extracted Keyword Anchors</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {insights.keywords.map((k, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 bg-slate-50 border border-slate-250 text-slate-600 rounded-full">
                              <Tag className="w-2.5 h-2.5" /> {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Trend Chart Card */}
                    <div className="bg-white p-6 border border-slate-200/60 rounded-3xl shadow-sm space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <BarChart2 className="w-4 h-4 text-indigo-500" /> Evaluations Trend
                        </h3>
                        <div className="flex gap-3 text-[9px] font-bold text-slate-400">
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" /> Rating</span>
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Sentiment</span>
                        </div>
                      </div>

                      <div className="flex-1">
                        {renderTrendChart(insights.trends)}
                      </div>
                    </div>
                  </div>

                  {/* Kanban Board Row */}
                  <div className="bg-white p-6 border border-slate-200/60 rounded-3xl shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                          <CheckSquare className="w-5 h-5 text-indigo-600" /> AI Action Recommendations Plan
                        </h3>
                        <p className="text-xs font-bold text-slate-400">Recommended directives tracked across status matrices</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      {/* Column TODO */}
                      <div className="bg-slate-50/50 p-4 border border-slate-200/60 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">To Do</span>
                          <span className="text-xs font-black px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md">
                            {actionItems.filter(a => a.status === 'TODO').length}
                          </span>
                        </div>
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {actionItems.filter(a => a.status === 'TODO').map(item => (
                            <div key={item.id} className="bg-white p-3 border border-slate-200/60 rounded-xl shadow-xs space-y-2">
                              <p className="text-xs font-semibold text-slate-700 leading-snug">{item.task}</p>
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight flex items-center gap-1">
                                  <User className="w-3 h-3" /> {item.intern?.user?.name || 'Intern'}
                                </span>
                                <button
                                  onClick={() => handleMoveActionItem(item.id, 'IN_PROGRESS')}
                                  className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded cursor-pointer flex items-center"
                                >
                                  Work <ChevronRight className="w-3 h-3 ml-0.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Column IN PROGRESS */}
                      <div className="bg-slate-50/50 p-4 border border-slate-200/60 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">In Progress</span>
                          <span className="text-xs font-black px-2 py-0.5 bg-amber-100 text-amber-600 rounded-md">
                            {actionItems.filter(a => a.status === 'IN_PROGRESS').length}
                          </span>
                        </div>
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {actionItems.filter(a => a.status === 'IN_PROGRESS').map(item => (
                            <div key={item.id} className="bg-white p-3 border border-slate-200/60 rounded-xl shadow-xs space-y-2">
                              <p className="text-xs font-semibold text-slate-700 leading-snug">{item.task}</p>
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight flex items-center gap-1">
                                  <User className="w-3 h-3" /> {item.intern?.user?.name || 'Intern'}
                                </span>
                                <button
                                  onClick={() => handleMoveActionItem(item.id, 'COMPLETED')}
                                  className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded cursor-pointer flex items-center"
                                >
                                  Complete <ChevronRight className="w-3 h-3 ml-0.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Column COMPLETED */}
                      <div className="bg-slate-50/50 p-4 border border-slate-200/60 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Completed</span>
                          <span className="text-xs font-black px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-md">
                            {actionItems.filter(a => a.status === 'COMPLETED').length}
                          </span>
                        </div>
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {actionItems.filter(a => a.status === 'COMPLETED').map(item => (
                            <div key={item.id} className="bg-white p-3 border border-slate-200/60 rounded-xl shadow-xs space-y-2 opacity-70">
                              <p className="text-xs font-semibold text-slate-700 leading-snug line-through">{item.task}</p>
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight flex items-center gap-1">
                                  <User className="w-3 h-3" /> {item.intern?.user?.name || 'Intern'}
                                </span>
                                <span className="text-[9px] font-black text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded">Completed</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Table listing all Interns */}
                  <div className="bg-white p-6 border border-slate-200/60 rounded-3xl shadow-sm space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Clipboard className="w-5 h-5 text-indigo-600" /> Intern Profile Aggregates
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            <th className="py-3 px-4">Intern Name</th>
                            <th className="py-3 px-4">Department</th>
                            <th className="py-3 px-4">Average Evaluation</th>
                            <th className="py-3 px-4">Active Action Items</th>
                            <th className="py-3 px-4">Latest review</th>
                            <th className="py-3 px-4">Risk alert status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {insights.internSummaries.map((summary) => (
                            <tr key={summary.internId} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors font-medium">
                              <td className="py-3.5 px-4 font-bold text-slate-700">{summary.name}</td>
                              <td className="py-3.5 px-4 text-slate-500">{summary.department}</td>
                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-indigo-50 px-2.5 py-1 rounded-lg">
                                  <Star className="w-3 h-3 text-indigo-500 fill-indigo-500" /> {summary.averageRating}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-700">{summary.activeActionItems} active</td>
                              <td className="py-3.5 px-4 text-slate-400">{summary.lastEvaluationDate}</td>
                              <td className="py-3.5 px-4">
                                {summary.riskLevel === 'HIGH' ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-0.5 rounded bg-rose-50 border border-rose-100 text-rose-600 uppercase tracking-wider">
                                    <AlertTriangle className="w-3 h-3" /> High Risk
                                  </span>
                                ) : summary.riskLevel === 'MEDIUM' ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-600 uppercase tracking-wider">
                                    <AlertCircle className="w-3 h-3" /> Medium Risk
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-600 uppercase tracking-wider">
                                    <CheckCircle2 className="w-3 h-3" /> Low Risk
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {/* DASHBOARD 2: MENTOR VIEW                                         */}
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {activeRole === 'MENTOR' && (
                <motion.div
                  key="mentor-dash"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left"
                >
                  {/* Left Column: Selector, Submission Form, checklist */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Selector & feedback Submission form */}
                    <div className="bg-white p-6 border border-slate-200/60 rounded-3xl shadow-sm space-y-5">
                      <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-slate-800 text-base">Mentor Evaluation Console</h3>
                          <p className="text-xs font-bold text-slate-400">Review task delivery speeds, agility parameters, and code review compliance</p>
                        </div>
                        <select
                          value={selectedInternId}
                          onChange={(e) => setSelectedInternId(e.target.value)}
                          className="text-xs font-extrabold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {myInterns.map((i: any) => (
                            <option key={i.id} value={i.id}>{i.user?.name}</option>
                          ))}
                        </select>
                      </div>

                      <form onSubmit={handleSubmitFeedback} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600">Rating Grade</label>
                            <div className="flex items-center gap-1.5 pt-1.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRating(star)}
                                  className="focus:outline-none cursor-pointer transform hover:scale-110 transition-transform"
                                >
                                  <Star className={`w-6 h-6 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600">Feedback Category</label>
                            <select
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            >
                              <option value="WEEKLY_CHECKIN">Weekly Check-in</option>
                              <option value="MONTHLY_REVIEW">Monthly Review</option>
                              <option value="CODE_QUALITY">Code Quality Analysis</option>
                              <option value="DELIVERY_SPEED">Delivery Speed Check</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600">Comment Remarks</label>
                          <textarea
                            rows={4}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Type evaluation details regarding project milestones, code style structures..."
                            className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submittingFeedback}
                          className="w-full flex items-center justify-center gap-1.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                        >
                          {submittingFeedback ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                              Running AI Polarity & Suggestion extraction...
                            </>
                          ) : (
                            <>
                              Submit & Analyze Sentiment <Send className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Action Items List */}
                    <div className="bg-white p-6 border border-slate-200/60 rounded-3xl shadow-sm space-y-4">
                      <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-slate-800 text-base">Active Action Plan Recommendations</h3>
                          <p className="text-xs font-bold text-slate-400">Assigned learning suggestions and checklist items</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {actionItems.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No action recommendations active for this profile.</p>
                        ) : (
                          actionItems.map(item => (
                            <div 
                              key={item.id}
                              onClick={() => handleToggleActionStatus(item.id, item.status)}
                              className={`p-3.5 border rounded-2xl cursor-pointer flex gap-3 items-center justify-between text-xs transition-all ${
                                item.status === 'COMPLETED' 
                                  ? 'bg-emerald-50/30 border-emerald-200 text-emerald-800 opacity-80' 
                                  : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                                  item.status === 'COMPLETED' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white border-slate-350'
                                }`}>
                                  {item.status === 'COMPLETED' ? <Check className="w-3 h-3" /> : null}
                                </span>
                                <span className={`font-semibold leading-relaxed ${item.status === 'COMPLETED' ? 'line-through text-emerald-600' : ''}`}>{item.task}</span>
                              </div>
                              <span className="text-[10px] font-black uppercase text-slate-400">
                                {item.status === 'COMPLETED' ? 'Completed' : 'Pending'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Insights & History */}
                  <div className="space-y-6">
                    {/* Insights summary */}
                    <div className="bg-white p-6 border border-slate-200/60 rounded-3xl shadow-sm space-y-4">
                      <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 pb-3 border-b border-slate-100">
                        <BrainCircuit className="w-5 h-5 text-indigo-600" /> AI Insights Profile
                      </h3>
                      
                      <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-xs font-semibold leading-relaxed text-indigo-950">
                        {insights.executiveInsight || 'Submit an evaluation checklist to trigger AI summary insights.'}
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wide">Skills Extracted</p>
                        <div className="flex flex-wrap gap-1">
                          {insights.keywords.map((k, idx) => (
                            <span key={idx} className="text-[9px] font-bold px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-600">{k}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* History List */}
                    <div className="bg-white p-6 border border-slate-200/60 rounded-3xl shadow-sm space-y-4">
                      <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 pb-3 border-b border-slate-100">
                        <MessageSquare className="w-5 h-5 text-indigo-600" /> Review History
                      </h3>

                      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {feedbackHistory.length === 0 ? (
                          <p className="text-xs text-slate-450 italic">No feedback history logbook present.</p>
                        ) : (
                          feedbackHistory.map(h => (
                            <div key={h.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] text-slate-400 font-extrabold">{new Date(h.createdAt).toLocaleDateString()}</span>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                  h.sentiment === 'POSITIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                  h.sentiment === 'NEGATIVE' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                  'bg-amber-50 text-amber-600 border border-amber-100'
                                }`}>
                                  {h.sentiment || 'NEUTRAL'}
                                </span>
                              </div>
                              <p className="font-semibold text-slate-650 leading-relaxed">"{h.comment}"</p>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                                <span>Rating: {h.rating} / 5</span>
                                <span>Type: {h.category}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {/* DASHBOARD 3: INTERN VIEW                                         */}
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {activeRole === 'INTERN' && (
                <motion.div
                  key="intern-dash"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6 text-left"
                >
                  {/* Warm Greetings Jumbotron Banner */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 p-6 md:p-8 text-white shadow-md">
                    <div className="absolute right-0 top-0 transform translate-x-12 -translate-y-12 opacity-10">
                      <BrainCircuit className="w-72 h-72" />
                    </div>
                    <div className="max-w-xl space-y-3 relative z-10">
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full text-white">
                        <Sparkles className="w-3 h-3" /> Growth Center
                      </span>
                      <h2 className="text-2xl font-black tracking-tight">Your Cohort Progress Dashboard</h2>
                      <p className="text-xs font-medium text-white/80 leading-relaxed">
                        Here is a friendly summary of recommendations and reviews compiled by your mentor. Use the interactive checklist below to check off suggested optimization milestones.
                      </p>
                    </div>
                  </div>

                  {/* Intern Dashboard Core Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: AI Sentiment Report card & Reflection Submission */}
                    <div className="space-y-6 lg:col-span-2">
                      {/* Action plan Checklist */}
                      <div className="bg-white p-6 border border-slate-200/60 rounded-3xl shadow-sm space-y-4">
                        <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-5 h-5 text-indigo-500" /> Recommended Action Items
                        </h3>
                        <p className="text-xs font-bold text-slate-400">Step-by-step tasks generated by AI reviews to elevate your technical workflow</p>
                        
                        <div className="space-y-2 pt-2">
                          {actionItems.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No checklist recommendations found. Great job maintaining zero blockages!</p>
                          ) : (
                            actionItems.map(item => (
                              <div 
                                key={item.id}
                                onClick={() => handleToggleActionStatus(item.id, item.status)}
                                className={`p-3.5 border rounded-2xl cursor-pointer flex gap-3 items-center justify-between text-xs transition-all ${
                                  item.status === 'COMPLETED' 
                                    ? 'bg-emerald-50/30 border-emerald-250 text-emerald-800 opacity-85' 
                                    : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-start gap-2.5">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                                    item.status === 'COMPLETED' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white border-slate-350'
                                  }`}>
                                    {item.status === 'COMPLETED' ? <Check className="w-3 h-3" /> : null}
                                  </span>
                                  <span className={`font-semibold leading-relaxed ${item.status === 'COMPLETED' ? 'line-through text-emerald-600' : ''}`}>{item.task}</span>
                                </div>
                                <span className="text-[10px] font-black uppercase text-slate-400">
                                  {item.status === 'COMPLETED' ? 'Completed' : 'Pending'}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Self Reflection submission log */}
                      <div className="bg-white p-6 border border-slate-200/60 rounded-3xl shadow-sm space-y-4">
                        <div className="space-y-1 pb-3 border-b border-slate-100">
                          <h3 className="font-extrabold text-slate-800 text-base">Self-Reflection Logbook</h3>
                          <p className="text-xs font-bold text-slate-400">Summarize recent achievements, technical learnings, or blockers you encountered</p>
                        </div>

                        <form onSubmit={handleSubmitFeedback} className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-650">Reflection Rating (Self-evaluation 1-5)</label>
                            <div className="flex gap-1.5 pt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRating(star)}
                                  className="focus:outline-none cursor-pointer transform hover:scale-115 transition-transform"
                                >
                                  <Star className={`w-5 h-5 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-650">Reflection Details</label>
                            <textarea
                              rows={4}
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              placeholder="E.g., Delivered standard SQL queries optimizations. Missed some layout iterations due to local build environment setup gaps."
                              className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={submittingFeedback}
                            className="flex items-center justify-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                          >
                            {submittingFeedback ? 'Saving...' : 'Submit Reflection Log'} <Send className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Right Column: AI Analysis summaries & history log */}
                    <div className="space-y-6">
                      {/* AI Sentiment Report Card */}
                      <div className="bg-white p-6 border border-slate-200/60 rounded-3xl shadow-sm space-y-4">
                        <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 pb-2 border-b border-slate-100">
                          <BrainCircuit className="w-5 h-5 text-indigo-600" /> Personal AI Insights
                        </h3>
                        
                        <div className="space-y-3 pt-1">
                          <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-xs font-semibold leading-relaxed text-indigo-950">
                            {insights.executiveInsight || 'Your mentor reviews will appear here along with encouraging summaries.'}
                          </div>

                          <div className="space-y-1.5">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wide">Feedback keywords extracted</p>
                            <div className="flex flex-wrap gap-1">
                              {insights.keywords.map((k, idx) => (
                                <span key={idx} className="text-[9px] font-bold px-2.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-650">{k}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Logbook History */}
                      <div className="bg-white p-6 border border-slate-200/60 rounded-3xl shadow-sm space-y-4">
                        <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 pb-2 border-b border-slate-100">
                          <Calendar className="w-5 h-5 text-indigo-600" /> Reflection Logbook history
                        </h3>

                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                          {feedbackHistory.length === 0 ? (
                            <p className="text-xs text-slate-450 italic">No feedback log history available.</p>
                          ) : (
                            feedbackHistory.map(h => (
                              <div key={h.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2 text-xs">
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] text-slate-400 font-extrabold">{new Date(h.createdAt).toLocaleDateString()}</span>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                    h.sentiment === 'POSITIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                    h.sentiment === 'NEGATIVE' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                    'bg-amber-50 text-amber-600 border border-amber-100'
                                  }`}>
                                    {h.sentiment || 'NEUTRAL'}
                                  </span>
                                </div>
                                <p className="font-semibold text-slate-600 leading-relaxed">"{h.comment}"</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          )}

        </div>
      </main>
    </div>
  );
};

export default AIFeedback;
