import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import api from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line
} from 'recharts';
import {
  Plus, Calendar, Users, BarChart3, TrendingUp,
  Award, AlertTriangle, CheckCircle, RefreshCw, Info, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InternshipBatch {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string | null;
  _count?: {
    interns: number;
  };
}

interface BatchComparisonMetric {
  batchId: string;
  name: string;
  startDate: string;
  endDate: string;
  totalInterns: number;
  avgPerformanceScore: number;
  avgAttendanceRate: number;
  taskCompletionRate: number;
  overdueTaskRate: number;
  atRiskCount: number;
}

export const CohortAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [batches, setBatches] = useState<InternshipBatch[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<BatchComparisonMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Batch Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchStart, setNewBatchStart] = useState('');
  const [newBatchEnd, setNewBatchEnd] = useState('');
  const [newBatchDesc, setNewBatchDesc] = useState('');
  const [submittingBatch, setSubmittingBatch] = useState(false);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/analytics/cohorts/batches');
      if (res.data.success && res.data.data) {
        const batchList = res.data.data;
        setBatches(batchList);
        // Default select top 2 batches for comparison
        if (batchList.length > 0) {
          const defaultSelects = batchList.slice(0, 2).map((b: any) => b.id);
          setSelectedBatchIds(defaultSelects);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch batches:', err);
      setError(err.response?.data?.message || 'Could not load cohort batches list');
    } finally {
      setLoading(false);
    }
  }, []);

  const runComparison = useCallback(async () => {
    if (selectedBatchIds.length === 0) {
      setComparisonData([]);
      return;
    }

    setComparing(true);
    try {
      const idsParam = selectedBatchIds.join(',');
      const res = await api.get(`/analytics/cohorts/compare?batchIds=${idsParam}`);
      if (res.data.success && res.data.data) {
        setComparisonData(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to run comparison:', err);
    } finally {
      setComparing(false);
    }
  }, [selectedBatchIds]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    if (selectedBatchIds.length > 0) {
      runComparison();
    }
  }, [selectedBatchIds, runComparison]);

  const handleToggleBatchSelect = (id: string) => {
    if (selectedBatchIds.includes(id)) {
      setSelectedBatchIds(selectedBatchIds.filter(item => item !== id));
    } else {
      setSelectedBatchIds([...selectedBatchIds, id]);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName || !newBatchStart || !newBatchEnd) {
      alert('Please fill out all required fields');
      return;
    }

    setSubmittingBatch(true);
    try {
      const res = await api.post('/analytics/cohorts/batches', {
        name: newBatchName,
        startDate: newBatchStart,
        endDate: newBatchEnd,
        description: newBatchDesc,
      });

      if (res.data.success) {
        setNewBatchName('');
        setNewBatchStart('');
        setNewBatchEnd('');
        setNewBatchDesc('');
        setShowCreateForm(false);
        await fetchBatches();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create batch');
    } finally {
      setSubmittingBatch(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Cohort Comparison Analytics" />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 px-2 py-0.5 rounded-md">
                  HR Analytics
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                Cohort Comparison Analytics
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Analyse, manage, and benchmark performance metrics side-by-side across various internship batches.
              </p>
            </div>
            
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Internship Batch</span>
            </button>
          </div>

          {/* Modal / Create Form Overlay */}
          <AnimatePresence>
            {showCreateForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-100 dark:border-slate-800 text-left"
                >
                  <h3 className="text-base font-black text-slate-850 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    New Internship Batch
                  </h3>
                  
                  <form onSubmit={handleCreateBatch} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                        Batch Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newBatchName}
                        onChange={(e) => setNewBatchName(e.target.value)}
                        placeholder="e.g. Summer Cohort 2026"
                        className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={newBatchStart}
                          onChange={(e) => setNewBatchStart(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                          End Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={newBatchEnd}
                          onChange={(e) => setNewBatchEnd(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                        Description
                      </label>
                      <textarea
                        value={newBatchDesc}
                        onChange={(e) => setNewBatchDesc(e.target.value)}
                        placeholder="Batch comments, targets, etc."
                        rows={3}
                        className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="flex-1 py-2.5 border border-slate-100 hover:bg-slate-50 text-slate-500 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingBatch}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        {submittingBatch ? 'Creating...' : 'Create Batch'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh]">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-bold mt-3">Loading internship batches...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4 text-left">
              <AlertCircle className="w-8 h-8 text-rose-500 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-rose-900">Analysis Error</h4>
                <p className="text-xs text-rose-600 mt-0.5">{error}</p>
              </div>
            </div>
          ) : batches.length === 0 ? (
            <div className="p-10 text-center bg-white border border-slate-100 rounded-3xl">
              <p className="text-sm text-slate-400 italic">No internship batches created yet. Define one using the button above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Sidebar: Batch Selection List */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm text-left h-fit space-y-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Select Batches (Cohorts)
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Check cohorts to compare metrics below.</p>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {batches.map(batch => {
                    const isSelected = selectedBatchIds.includes(batch.id);
                    return (
                      <button
                        key={batch.id}
                        onClick={() => handleToggleBatchSelect(batch.id)}
                        className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{batch.name}</p>
                          <p className="text-[9px] opacity-60 font-semibold mt-0.5">
                            {new Date(batch.startDate).getFullYear()} · {batch._count?.interns || 0} Interns
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="w-4 h-4 rounded-sm accent-indigo-600 pointer-events-none"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Content Area: KPIs & Comparison Charts */}
              <div className="lg:col-span-3 space-y-6">
                
                {comparing ? (
                  <div className="flex flex-col items-center justify-center min-h-[30vh]">
                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-slate-400 font-bold mt-2">Updating dashboard comparisons...</p>
                  </div>
                ) : comparisonData.length === 0 ? (
                  <div className="p-10 text-center bg-white border border-slate-100 rounded-3xl">
                    <p className="text-sm text-slate-400 italic">Select at least one cohort batch on the left to see analytics.</p>
                  </div>
                ) : (
                  <>
                    {/* Metrics Grid Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {comparisonData.map(metric => (
                        <div key={metric.batchId} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 text-left">
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <h4 className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[150px]">
                                {metric.name}
                              </h4>
                              <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                {new Date(metric.startDate).toLocaleDateString()} - {new Date(metric.endDate).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                              <Users className="w-3 h-3" />
                              {metric.totalInterns} Interns
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50 dark:border-slate-800">
                            <div>
                              <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">
                                Avg Performance
                              </span>
                              <span className="text-base font-black text-slate-800 dark:text-white">
                                {metric.avgPerformanceScore}/100
                              </span>
                            </div>
                            <div>
                              <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">
                                Attendance Rate
                              </span>
                              <span className="text-base font-black text-slate-850 dark:text-slate-100">
                                {metric.avgAttendanceRate}%
                              </span>
                            </div>
                            <div>
                              <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">
                                Task Completion
                              </span>
                              <span className="text-base font-black text-slate-850 dark:text-slate-100">
                                {metric.taskCompletionRate}%
                              </span>
                            </div>
                            <div>
                              <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">
                                Flagged At-Risk
                              </span>
                              <span className={`text-base font-black ${metric.atRiskCount > 0 ? 'text-rose-500' : 'text-slate-800'}`}>
                                {metric.atRiskCount} Interns
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chart 1: deliverables rates */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-left">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4.5 h-4.5 text-indigo-600" />
                        Engagement & Completion Comparison (%)
                      </h4>
                      <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={comparisonData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 10, fontWeight: 'bold' }} />
                            <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 9 }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                            <Bar name="Avg Attendance Rate" dataKey="avgAttendanceRate" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                            <Bar name="Task Completion Rate" dataKey="taskCompletionRate" fill="#10B981" radius={[4, 4, 0, 0]} />
                            <Bar name="Overdue Task Rate" dataKey="overdueTaskRate" fill="#EF4444" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 2: general performance trends */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-left">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4.5 h-4.5 text-indigo-600" />
                        Average Performance Score Comparison (0 - 100)
                      </h4>
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={comparisonData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 10, fontWeight: 'bold' }} />
                            <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 9 }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                            <Line type="monotone" name="Avg Performance Score" dataKey="avgPerformanceScore" stroke="#6366F1" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                )}

              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
};
