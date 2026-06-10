import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import api from '../../services/api';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';
import {
  Sparkles, RefreshCw, BookOpen, ExternalLink,
  Award, AlertCircle, CheckCircle, Activity, PlayCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ChartItem {
  skill: string;
  internScore: number;
  requiredScore: number;
}

interface LearningResource {
  title: string;
  url: string;
  platform: string;
  duration: string;
}

interface GapRecommendation {
  skill: string;
  level: string;
  resources: LearningResource[];
}

interface SkillGapData {
  id: string;
  internId: string;
  matchPercentage: number;
  analysisData: ChartItem[];
  recommendations: GapRecommendation[];
}

export const SkillGap: React.FC = () => {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<SkillGapData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const internId = user?.intern?.id;

  const fetchSkillGap = useCallback(async (isRefresh = false) => {
    if (!internId) {
      setError('No intern profile linked to this account.');
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const endpoint = `/skill-gap/intern/${internId}${isRefresh ? '/refresh' : ''}`;
      const res = await api.get(endpoint);
      if (res.data.success && res.data.data) {
        setData(res.data.data);
      } else {
        setError('No skill analysis data returned from the server.');
      }
    } catch (err: any) {
      console.error('Failed to load skill gap details:', err);
      setError(err.response?.data?.message || 'Could not connect to analysis service.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [internId]);

  useEffect(() => {
    fetchSkillGap();
  }, [fetchSkillGap]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Skill Gap & Learning Recommendations" />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 px-2 py-0.5 rounded-md">
                  AI Skill Alignment
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                Skill Gap & Learning Recommendations
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Compare your current abilities with your department requirements and get curated course paths.
              </p>
            </div>
            
            <button
              onClick={() => fetchSkillGap(true)}
              disabled={loading || refreshing}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Recalculating...' : 'Sync Skills Analysis'}</span>
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-4">Running AI skill matching checks...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4 text-left">
              <AlertCircle className="w-8 h-8 text-rose-500 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-rose-900">Analysis Error</h4>
                <p className="text-xs text-rose-600 mt-0.5">{error}</p>
              </div>
            </div>
          ) : !data ? (
            <div className="p-10 text-center bg-white border border-slate-100 rounded-3xl">
              <p className="text-sm text-slate-400 italic">No skill analysis record found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Match & Radar Charts */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Score Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                  <div className="relative flex-shrink-0 w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" stroke="#F1F5F9" strokeWidth="8" fill="transparent" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="#4F46E5"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={263.8}
                        strokeDashoffset={263.8 - (263.8 * data.matchPercentage) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-black text-slate-800 dark:text-white">
                        {Math.round(data.matchPercentage)}%
                      </span>
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                        Match Score
                      </span>
                    </div>
                  </div>

                  <div className="text-left flex-1">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      Skill Matching Result
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1.5">
                      Your skill sets overlap by <strong className="text-indigo-600">{Math.round(data.matchPercentage)}%</strong> with the standard benchmarks defined by the department head. Below is the radial comparison map.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-md">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {data.analysisData.filter(i => i.internScore > 0).length} Skills Met
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-1 rounded-md">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {data.analysisData.filter(i => i.internScore === 0).length} Skill Gaps
                      </span>
                    </div>
                  </div>
                </div>

                {/* Radar Chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-left">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
                    Department Requirements Mapping
                  </h4>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.analysisData}>
                        <PolarGrid stroke="#E2E8F0" />
                        <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748B', fontSize: 10, fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 3]} tickCount={4} tick={{ fill: '#94A3B8', fontSize: 9 }} />
                        <Radar name="My Level" dataKey="internScore" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.4} />
                        <Radar name="Required" dataKey="requiredScore" stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-6 text-[10px] font-bold text-slate-500 pt-2 border-t border-slate-50 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-indigo-600 opacity-40 rounded-full" />
                      <span>My Score</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-emerald-500 opacity-15 rounded-full" />
                      <span>Required Target</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Recommendations List */}
              <div className="space-y-6 text-left">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-base font-black text-slate-800 dark:text-white">
                      Curated Study Recommendations
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    AI-powered free learning resources targeted specifically at filling your missing skill gaps.
                  </p>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {data.recommendations && data.recommendations.length > 0 ? (
                      data.recommendations.map((rec, index) => (
                        <div key={index} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                              {rec.skill}
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md">
                              {rec.level}
                            </span>
                          </div>

                          <div className="space-y-2.5">
                            {rec.resources.map((res, rIdx) => (
                              <a
                                key={rIdx}
                                href={res.url}
                                target="_blank"
                                rel="noreferrer"
                                className="group flex items-start gap-2.5 p-2.5 bg-white dark:bg-slate-900 border border-slate-100 hover:border-indigo-200 dark:border-slate-800 rounded-xl transition-all hover:shadow-xs cursor-pointer"
                              >
                                <PlayCircle className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 flex-shrink-0 mt-0.5 transition-colors" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate transition-colors">
                                    {res.title}
                                  </p>
                                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                    {res.platform} · {res.duration}
                                  </p>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 mt-1 flex-shrink-0 transition-colors" />
                              </a>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl flex flex-col items-center">
                        <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                        <p className="text-xs font-bold text-slate-700">All Skill Targets Met!</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">You meet all defined department requirements.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
};
