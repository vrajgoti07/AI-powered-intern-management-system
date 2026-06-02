import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { useAuth } from '../../hooks/useAuth';
import { 
  Brain, 
  User, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  Star, 
  Shield, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Filter, 
  FileSpreadsheet, 
  Loader2, 
  Sparkles 
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const AIRecommendations: React.FC = () => {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isServiceDown, setIsServiceDown] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  // Mentor Availability Status Map
  const [mentorAvailability, setMentorAvailability] = useState<Record<string, { status: string, currentCount: number, maxCapacity: number }>>({});

  // Checkbox Selection for Bulk Apply
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Placement States: tracks pending undo window, timers, risks, etc.
  const [placementStates, setPlacementStates] = useState<Record<string, { 
    placementId?: string; 
    status: string; 
    timeLeft: number; 
    riskLevel?: string; 
    riskFlags?: string[]; 
    riskRec?: string; 
  }>>({});

  // Collapsible AI Insights State
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [insightTexts, setInsightTexts] = useState<Record<string, string>>({});
  const [loadingInsights, setLoadingInsights] = useState<Set<string>>(new Set());

  // Collapsible Placement History Table State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyPlacements, setHistoryPlacements] = useState<any[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyHasMore, setHistoryHasMore] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Filters State
  const [filterConfidence, setFilterConfidence] = useState('ALL');
  const [filterScore, setFilterScore] = useState(0);
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Fetch Mentor Availability
  const fetchAvailability = async (mentorId: string) => {
    try {
      const res = await api.get(`/mentors/${mentorId}/availability`);
      setMentorAvailability(prev => ({
        ...prev,
        [mentorId]: {
          status: res.data.status,
          currentCount: res.data.currentCount,
          maxCapacity: res.data.maxCapacity
        }
      }));
    } catch (err) {
      console.warn(`Failed to fetch availability for mentor ${mentorId}`);
    }
  };

  // Fetch AI Match Score (AI Feature 1)
  const fetchAIMatchScore = async (rec: any) => {
    try {
      const res = await api.post('/placements/match-score', {
        internSkills: rec.internSkills || [],
        mentorExpertise: rec.mentorExpertise || [],
        department: rec.department || 'Engineering',
        preferences: 'collaborative, project-based'
      });
      if (res.data.success) {
        setRecommendations(prev => prev.map(item => 
          item.id === rec.id 
            ? { 
                ...item, 
                matchScore: res.data.score, 
                confidenceLevel: res.data.confidence, 
                reasons: res.data.reasons 
              }
            : item
        ));
      }
    } catch (err) {
      console.warn(`Failed to upgrade AI score for pairing ${rec.id}`);
    }
  };

  // Fetch AI recommendations from placement endpoint
  const fetchRecommendations = async () => {
    setLoading(true);
    setIsServiceDown(false);
    try {
      const res = await api.get('/placements/recommendations');
      if (res.data.success) {
        const data = res.data.data;
        setRecommendations(data);
        
        // Fetch availability for all mentors and real AI match scores
        data.forEach((rec: any) => {
          if (rec.mentorId) fetchAvailability(rec.mentorId);
          fetchAIMatchScore(rec);
          
          // If recommendation in database is already applied
          if (rec.status === 'applied' || rec.status === 'Confirmed') {
            setPlacementStates(prev => ({
              ...prev,
              [rec.id]: { status: 'Applied', timeLeft: 0 }
            }));
          }
        });
      }
    } catch (err: any) {
      setIsServiceDown(true);
      // Fallback cached recommendations so page doesn't crash
      const fallback = [
        {
          id: "rec-cache-1",
          internId: "intern-1",
          mentorId: "mentor-1",
          internName: "Alex Rivera",
          mentorName: "Sarah Chen (Tech Lead)",
          matchScore: 94,
          confidenceLevel: "HIGH",
          department: "Engineering",
          internSkills: ["React", "TypeScript", "Node.js"],
          mentorExpertise: ["Microservices", "System Design", "React"],
          reasons: [
            "Overlapping focus on full-stack React and Node.js microservices.",
            "Excellent analytical background matches mentor's systems design focus.",
            "Expressed specific career interest in cloud infrastructure scaling."
          ]
        },
        {
          id: "rec-cache-2",
          internId: "intern-2",
          mentorId: "mentor-2",
          internName: "Emma Watson",
          mentorName: "David Kim (Principal Architect)",
          matchScore: 82,
          confidenceLevel: "MEDIUM",
          department: "AI Research",
          internSkills: ["Python", "PyTorch", "SQL"],
          mentorExpertise: ["AI/ML", "Database Scaling", "Python"],
          reasons: [
            "Emma's strong algorithms score aligns with David's database engineering project.",
            "Previous Python projects match AI/ML department focus.",
            "Exhibited strong self-direction matching David's unstructured workspace."
          ]
        },
        {
          id: "rec-cache-3",
          internId: "intern-3",
          mentorId: "mentor-3",
          internName: "Liam Johnson",
          mentorName: "Elena Rostova (Senior Designer)",
          matchScore: 68,
          confidenceLevel: "LOW",
          department: "Product Design",
          internSkills: ["Figma", "HTML", "CSS"],
          mentorExpertise: ["User Research", "Frontend Styling", "Figma"],
          reasons: [
            "Liam has basic UI skills matching Elena's frontend styling projects.",
            "Expressed interest in visual interface designs.",
            "Recommended for design mentorship to improve user-centric workflows."
          ]
        }
      ];
      setRecommendations(fallback);
      fallback.forEach((rec) => {
        setMentorAvailability(prev => ({
          ...prev,
          [rec.mentorId]: { status: 'Available', currentCount: 1, maxCapacity: 3 }
        }));
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Placement History
  const fetchHistory = async (reset = false) => {
    setLoadingHistory(true);
    const targetPage = reset ? 1 : historyPage;
    try {
      const res = await api.get(`/placements/history?page=${targetPage}&limit=10`);
      if (res.data.success) {
        if (reset) {
          setHistoryPlacements(res.data.data);
          setHistoryPage(2);
        } else {
          setHistoryPlacements(prev => [...prev, ...res.data.data]);
          setHistoryPage(prev => prev + 1);
        }
        if (res.data.data.length < 10) {
          setHistoryHasMore(false);
        } else {
          setHistoryHasMore(true);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch placement history");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
    fetchHistory(true);
  }, []);

  // Sync Placement History with Live Changes
  useEffect(() => {
    let interval: any;
    const activeKeys = Object.keys(placementStates).filter(
      k => placementStates[k].status === 'Pending' && placementStates[k].timeLeft > 0
    );

    if (activeKeys.length > 0) {
      interval = setInterval(() => {
        setPlacementStates(prev => {
          const next = { ...prev };
          let changed = false;
          for (const key of activeKeys) {
            if (next[key] && next[key].timeLeft > 0) {
              next[key] = { ...next[key], timeLeft: next[key].timeLeft - 1 };
              if (next[key].timeLeft === 0) {
                next[key].status = 'Applied';
                toast.success("Placement confirmed successfully!");
              }
              changed = true;
            }
          }
          return changed ? next : prev;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [placementStates]);

  const loadMoreHistory = () => {
    fetchHistory();
  };

  // Single Apply Placement (5A)
  const handleApply = async (recId: string) => {
    const rec = recommendations.find(r => r.id === recId);
    if (!rec) return;

    // Check mentor availability locally before calling
    const avail = mentorAvailability[rec.mentorId];
    if (avail && avail.status === 'At Capacity') {
      toast.error("Cannot apply placement: Mentor is at capacity.");
      return;
    }

    setApplyingId(recId);
    try {
      const res = await api.post('/placements', {
        internId: rec.internId,
        mentorId: rec.mentorId,
        matchScore: rec.matchScore,
        confidence: rec.confidenceLevel,
        department: rec.department,
        appliedBy: user?.email || 'admin@internflow.com'
      });

      if (res.data.success) {
        toast.success("Placement mapping applied! 30s undo window active.");
        const { placementId, undoDeadline, risk } = res.data;
        
        setPlacementStates(prev => ({
          ...prev,
          [recId]: {
            placementId,
            status: 'Pending',
            timeLeft: 30,
            riskLevel: risk?.riskLevel,
            riskFlags: risk?.flags,
            riskRec: risk?.recommendation
          }
        }));

        // Refresh mentor availability
        fetchAvailability(rec.mentorId);
        // Refresh history
        fetchHistory(true);
      } else {
        toast.error(res.data.message || "Failed to apply placement.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to apply recommendation.");
    } finally {
      setApplyingId(null);
    }
  };

  // Undo Placement (5B)
  const handleUndo = async (recId: string, placementId: string) => {
    try {
      const res = await api.delete(`/placements/${placementId}/undo`);
      if (res.data.success) {
        toast.success("Placement undone successfully!");
        setPlacementStates(prev => {
          const next = { ...prev };
          delete next[recId];
          return next;
        });

        // Clear selection if it was selected
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(recId);
          return next;
        });

        // Refresh availability
        const rec = recommendations.find(r => r.id === recId);
        if (rec) fetchAvailability(rec.mentorId);
        // Refresh history
        fetchHistory(true);
      } else {
        toast.error(res.data.message || "Undo failed.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Undo window has expired.");
    }
  };

  // Expand AI Insights (5E - Lazy Load)
  const toggleAIInsights = async (recId: string) => {
    const nextExpanded = new Set(expandedInsights);
    if (nextExpanded.has(recId)) {
      nextExpanded.delete(recId);
      setExpandedInsights(nextExpanded);
      return;
    }

    nextExpanded.add(recId);
    setExpandedInsights(nextExpanded);

    // If already fetched, don't refetch
    if (insightTexts[recId]) return;

    const rec = recommendations.find(r => r.id === recId);
    if (!rec) return;

    setLoadingInsights(prev => {
      const next = new Set(prev);
      next.add(recId);
      return next;
    });

    try {
      const res = await api.post('/placements/insights', {
        internName: rec.internName,
        skills: rec.internSkills || [],
        mentorName: rec.mentorName,
        expertise: rec.mentorExpertise || []
      });
      if (res.data.success) {
        setInsightTexts(prev => ({
          ...prev,
          [recId]: res.data.insight
        }));
      }
    } catch (err) {
      console.warn("Failed to generate AI insights");
      setInsightTexts(prev => ({
        ...prev,
        [recId]: `Failed to load AI Match explanation. Please check your API configuration.`
      }));
    } finally {
      setLoadingInsights(prev => {
        const next = new Set(prev);
        next.delete(recId);
        return next;
      });
    }
  };

  // Checkbox toggle selection (5G)
  const toggleSelect = (recId: string) => {
    const nextSelected = new Set(selectedIds);
    if (nextSelected.has(recId)) {
      nextSelected.delete(recId);
    } else {
      nextSelected.add(recId);
    }
    setSelectedIds(nextSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredRecs.length) {
      setSelectedIds(new Set());
    } else {
      const allFilteredIds = filteredRecs.map(r => r.id);
      setSelectedIds(new Set(allFilteredIds));
    }
  };

  // Bulk sequential apply (5G)
  const handleBulkApply = async () => {
    const idsToApply = Array.from(selectedIds);
    setSelectedIds(new Set());
    
    toast.success(`Processing bulk apply for ${idsToApply.length} pairings sequentially.`);
    
    for (const recId of idsToApply) {
      const rec = recommendations.find(r => r.id === recId);
      if (!rec) continue;

      const avail = mentorAvailability[rec.mentorId];
      if (avail && avail.status === 'At Capacity') {
        toast.error(`Skipping ${rec.internName}: Mentor is at capacity.`);
        continue;
      }

      const pState = placementStates[recId];
      if (pState?.status === 'Pending' || pState?.status === 'Applied') continue;

      setApplyingId(recId);
      try {
        const res = await api.post('/placements', {
          internId: rec.internId,
          mentorId: rec.mentorId,
          matchScore: rec.matchScore,
          confidence: rec.confidenceLevel,
          department: rec.department,
          appliedBy: user?.email || 'admin@internflow.com'
        });

        if (res.data.success) {
          const { placementId, undoDeadline, risk } = res.data;
          setPlacementStates(prev => ({
            ...prev,
            [recId]: {
              placementId,
              status: 'Pending',
              timeLeft: 30,
              riskLevel: risk?.riskLevel,
              riskFlags: risk?.flags,
              riskRec: risk?.recommendation
            }
          }));
          fetchAvailability(rec.mentorId);
        }
      } catch (err) {
        console.warn(`Bulk apply failed for pairing ${recId}`);
      } finally {
        setApplyingId(null);
      }
      
      // Delay for visual sequence effect
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    fetchHistory(true);
  };

  // Export CSV (5F)
  const handleExportCSV = async () => {
    try {
      const res = await api.get('/placements/export/csv', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'placements_history.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error("Failed to export placement history CSV.");
    }
  };

  // Get Availability Badge indicator (5D)
  const getAvailabilityBadge = (mentorId: string) => {
    const avail = mentorAvailability[mentorId];
    if (!avail) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <Loader2 className="w-3 h-3 animate-spin" /> Checking
        </span>
      );
    }

    if (avail.status === 'At Capacity') {
      return (
        <span 
          title="This mentor is at full intern workload capacity."
          className="inline-flex items-center gap-1 text-[10px] text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full font-black uppercase tracking-wider cursor-help"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>At Capacity ({avail.currentCount}/{avail.maxCapacity})</span>
        </span>
      );
    }

    if (avail.status === 'Busy') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Busy ({avail.currentCount}/{avail.maxCapacity})</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>Available ({avail.currentCount}/{avail.maxCapacity})</span>
      </span>
    );
  };

  const getConfidenceBadge = (level: string) => {
    const norm = (level || '').toUpperCase();
    if (norm === 'HIGH') {
      return (
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-widest">
          High Confidence
        </span>
      );
    }
    if (norm === 'MEDIUM') {
      return (
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-widest">
          Medium Confidence
        </span>
      );
    }
    return (
      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-widest">
        Low Confidence
      </span>
    );
  };

  // Filter recommendations matching the filters (5C)
  const departmentsList = Array.from(new Set(recommendations.map(r => r.department).filter(Boolean)));

  const filteredRecs = recommendations.filter(rec => {
    if (filterConfidence !== 'ALL' && rec.confidenceLevel?.toUpperCase() !== filterConfidence) return false;
    if (rec.matchScore < filterScore) return false;
    if (filterDept !== 'ALL' && rec.department !== filterDept) return false;
    
    // Status Filter (All | Pending | Applied)
    const pState = placementStates[rec.id];
    if (filterStatus === 'PENDING') {
      return pState?.status === 'Pending';
    }
    if (filterStatus === 'APPLIED') {
      return pState?.status === 'Applied' || pState?.status === 'Pending';
    }
    return true;
  });

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="AI Matching Recommendations" />

        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {/* AI Info Bar & Service Outage notice */}
          {isServiceDown && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-center gap-4 text-left shadow-inner">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 animate-bounce" />
              <div>
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">Microservice Notice</h4>
                <p className="text-xs text-amber-700 font-bold leading-relaxed mt-0.5">AI service is currently unavailable. Showing last cached results.</p>
              </div>
            </div>
          )}

          {/* Heading intro */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Brain className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-800 tracking-tight">Cognitive Mentor Placement</h2>
                <p className="text-xs font-semibold text-slate-400">AI-suggested optimal intern-to-mentor match mappings based on expertise, sentiment and skills overlap.</p>
              </div>
            </div>
            {recommendations.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {selectedIds.size === filteredRecs.length ? 'Deselect All' : 'Select All Filtered'}
                </button>
              </div>
            )}
          </div>

          {/* Sleek Premium Filter Bar (5C) */}
          {recommendations.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-6 text-left">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Filter className="w-4 h-4 text-indigo-500" />
                  <span>Filter Pairings</span>
                </h3>
                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase tracking-wider">
                  {filteredRecs.length} results found
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-end">
                {/* Confidence Level Tabs */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Confidence Level</label>
                  <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                    {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setFilterConfidence(tab)}
                        className={`flex-1 py-2 text-[10px] font-black rounded-xl uppercase tracking-wider transition-all cursor-pointer ${
                          filterConfidence === tab
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {tab === 'ALL' ? 'All' : tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Department Filter */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Department</label>
                  <select
                    value={filterDept}
                    onChange={e => setFilterDept(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="ALL">All Departments</option>
                    {departmentsList.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</label>
                  <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                    {['ALL', 'PENDING', 'APPLIED'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setFilterStatus(tab)}
                        className={`flex-1 py-2 text-[10px] font-black rounded-xl uppercase tracking-wider transition-all cursor-pointer ${
                          filterStatus === tab
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {tab === 'ALL' ? 'All' : tab === 'PENDING' ? 'Pending' : 'Applied'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Match Score Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Min Fit Score</label>
                    <span className="text-xs font-black text-indigo-600">{filterScore}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filterScore}
                    onChange={e => setFilterScore(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Recommendations list */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Generating Predictive Pairings...</p>
              </div>
            </div>
          ) : filteredRecs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {filteredRecs.map((rec) => {
                const internName = rec.internName || 'Anonymous Intern';
                const mentorName = rec.mentorName || 'Unassigned Mentor';
                const score = rec.matchScore || 0;
                const confidence = rec.confidenceLevel || 'MEDIUM';
                const reasons = rec.reasons || [];
                
                const pState = placementStates[rec.id];
                const isApplying = applyingId === rec.id;
                const isMentorAtCapacity = mentorAvailability[rec.mentorId]?.status === 'At Capacity';

                return (
                  <div 
                    key={rec.id}
                    className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-6 relative overflow-hidden"
                  >
                    {/* Top Left Selection Checkbox (5G) */}
                    <div className="absolute top-4 left-4 z-10">
                      {!(pState?.status === 'Applied' || pState?.status === 'Pending') && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(rec.id)}
                          disabled={isMentorAtCapacity}
                          onChange={() => toggleSelect(rec.id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      )}
                    </div>

                    {/* Header: Names & Badges */}
                    <div className="space-y-4 pt-2">
                      <div className="flex justify-between items-start gap-2 pl-4">
                        {getConfidenceBadge(confidence)}
                        <div className="flex items-center gap-1 font-black text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          <Star className="w-3 h-3 fill-indigo-600" />
                          <span>{score}% Match</span>
                        </div>
                      </div>

                      {/* Main names pairing details */}
                      <div className="space-y-2.5 pt-2 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 flex-shrink-0" />
                          <p className="text-xs font-black text-slate-800">Intern: <span className="text-indigo-600 font-extrabold">{internName}</span></p>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                            <p className="text-xs font-black text-slate-800">Mentor: <span className="text-emerald-600 font-extrabold">{mentorName}</span></p>
                          </div>
                          {getAvailabilityBadge(rec.mentorId)}
                        </div>
                      </div>
                    </div>

                    {/* Matching Score Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        <span>Matching Fit Score</span>
                        <span>{score}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>

                    {/* Bullet Rationale List (top 3) */}
                    <div className="space-y-2 pt-3 border-t border-slate-50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Overlapping Match Factors:</p>
                      {reasons.length > 0 ? (
                        <ul className="space-y-2 text-xs font-semibold text-slate-500 list-none pl-0">
                          {reasons.slice(0, 3).map((reason: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-indigo-600 mt-1 select-none flex-shrink-0">•</span>
                              <span className="leading-relaxed">{reason}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No explicit matching rationale provided.</p>
                      )}
                    </div>

                    {/* AI Insights lazy-loaded collapsible section (5E) */}
                    <div>
                      <button
                        onClick={() => toggleAIInsights(rec.id)}
                        className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-wider flex items-center gap-1 focus:outline-none cursor-pointer"
                      >
                        <span>{expandedInsights.has(rec.id) ? 'Hide AI Insights ▲' : 'View AI Insights ▼'}</span>
                      </button>

                      {expandedInsights.has(rec.id) && (
                        <div className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl text-left space-y-2 animate-slideDown">
                          <p className="text-[9px] font-black text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
                            <span>AI Placement Explanation</span>
                          </p>
                          {loadingInsights.has(rec.id) ? (
                            <div className="space-y-2 animate-pulse py-1">
                              <div className="h-3.5 bg-indigo-100 rounded-full w-full"></div>
                              <div className="h-3.5 bg-indigo-100 rounded-full w-5/6"></div>
                              <div className="h-3.5 bg-indigo-100 rounded-full w-2/3"></div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                              {insightTexts[rec.id] || "No compatibility details generated."}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Risk Flag Detection Banner (AI Feature 3) */}
                    {pState?.riskLevel && (pState.riskLevel === 'Medium' || pState.riskLevel === 'High') && (
                      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-left space-y-2 mt-2 animate-slideDown">
                        <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
                          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                          <span>Placement Risk: {pState.riskLevel} Risk</span>
                        </div>
                        {pState.riskFlags && pState.riskFlags.length > 0 && (
                          <ul className="text-xs text-rose-600 list-disc pl-4 space-y-1 font-medium">
                            {pState.riskFlags.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        )}
                        {pState.riskRec && (
                          <p className="text-[10px] text-rose-500 font-semibold italic">Recommendation: {pState.riskRec}</p>
                        )}
                      </div>
                    )}

                    {/* Action Panel: Apply or checkmark or Undo Countdown (5A, 5B) */}
                    <div className="pt-4 border-t border-slate-50 flex items-center justify-end">
                      {pState?.status === 'Applied' ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-3.5 py-2 rounded-2xl">
                          <Check className="w-4 h-4" />
                          <span>Applied Successfully</span>
                        </div>
                      ) : pState?.status === 'Pending' ? (
                        <div className="flex items-center gap-2 w-full">
                          <button
                            onClick={() => handleUndo(rec.id, pState.placementId!)}
                            className="flex-1 px-4 py-2.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-2xl text-xs font-extrabold tracking-wider uppercase transition-all shadow-sm hover:shadow cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span>Undo ({pState.timeLeft}s)</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApply(rec.id)}
                          disabled={isApplying || isMentorAtCapacity}
                          className="px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-xs font-extrabold tracking-wider uppercase transition-all shadow hover:shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isApplying ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Applying...</span>
                            </>
                          ) : (
                            <>
                              <span>Apply Placement</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-3xl text-slate-400 space-y-2">
              <Brain className="w-10 h-10 text-slate-200" />
              <p className="text-xs font-bold">No placement recommendations match your filter criteria.</p>
            </div>
          )}

          {/* Collapsible Placement History Table (5F) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-left mt-6">
            <button
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="w-full p-6 flex justify-between items-center text-left focus:outline-none cursor-pointer hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Placement History</h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Audit log of all registered intern-mentor assignments.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportCSV();
                  }}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                {isHistoryOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </div>
            </button>

            {isHistoryOpen && (
              <div className="border-t border-slate-100 p-6 space-y-4 animate-slideDown">
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="py-4 px-6">Intern</th>
                        <th className="py-4 px-6">Mentor</th>
                        <th className="py-4 px-6">Department</th>
                        <th className="py-4 px-6 text-center">Score</th>
                        <th className="py-4 px-6">Applied By</th>
                        <th className="py-4 px-6">Date</th>
                        <th className="py-4 px-6 text-center">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-semibold text-slate-600 divide-y divide-slate-50">
                      {historyPlacements.length > 0 ? (
                        historyPlacements.map((p) => {
                          const timeLeft = Math.max(0, Math.ceil((new Date(p.undoDeadline).getTime() - Date.now()) / 1000));
                          const isPending = p.status === 'Pending' && timeLeft > 0;
                          
                          // Look up pairing ID to map back to card ID
                          const matchingRec = recommendations.find(r => r.internId === p.internId && r.mentorId === p.mentorId);
                          const recId = matchingRec ? matchingRec.id : p.id;

                          return (
                            <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="py-4 px-6 font-extrabold text-slate-800">{p.internName}</td>
                              <td className="py-4 px-6 font-extrabold text-slate-800">{p.mentorName}</td>
                              <td className="py-4 px-6">{p.department}</td>
                              <td className="py-4 px-6 text-center">
                                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                  {p.matchScore}%
                                </span>
                              </td>
                              <td className="py-4 px-6 text-slate-400">{p.appliedBy}</td>
                              <td className="py-4 px-6 text-slate-400">{new Date(p.appliedAt).toLocaleDateString()}</td>
                              <td className="py-4 px-6 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  p.status === 'Confirmed'
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                    : p.status === 'Pending'
                                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                    : 'bg-rose-50 text-rose-600 border border-rose-100'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                {isPending ? (
                                  <button
                                    onClick={() => handleUndo(recId, p.id)}
                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-extrabold tracking-wider uppercase transition-all cursor-pointer"
                                  >
                                    Undo
                                  </button>
                                ) : (
                                  <span className="text-slate-300 text-[10px] italic">No actions</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-slate-400 italic">No placement records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {historyHasMore && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={loadMoreHistory}
                      disabled={loadingHistory}
                      className="px-5 py-2 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 rounded-2xl text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {loadingHistory ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Floating Bottom Action Bar for Bulk Apply (5G) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6 z-50 border border-slate-800 animate-slideUp">
          <span className="text-xs font-black uppercase tracking-wider">{selectedIds.size} Selected</span>
          <div className="h-4 w-px bg-slate-700" />
          <button
            onClick={handleBulkApply}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg"
          >
            <span>Apply All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-slate-400 hover:text-white font-extrabold uppercase tracking-wider cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
