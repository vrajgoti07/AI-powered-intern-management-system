import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { Avatar } from '../../components/common/Avatar';
import { Modal } from '../../components/common/Modal';
import {
  ShieldAlert, ShieldCheck, RefreshCw, AlertTriangle, AlertCircle,
  Flame, CheckCircle2, Brain, WifiOff, TrendingUp, Lightbulb,
  GraduationCap, Mail
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface RiskItem {
  internId: string;
  name: string;
  attendance: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  successProbability: number;
  riskIssues: string[];
  reasons: string[];
  recommendation: string;
  department?: string;
  college?: string;
  days_since_last_task?: number;
  workload_score?: number;
  days_since_mentor_interaction?: number;
}

interface InterventionResult {
  mentorNotified: boolean;
  mentorName: string | null;
  mentorEmail: string | null;
}

const RiskCard: React.FC<{ item: RiskItem; onIntervene: () => void }> = ({ item, onIntervene }) => {
  const isHigh = item.riskLevel === 'HIGH';
  const isMedium = item.riskLevel === 'MEDIUM';

  const riskBadge = isHigh
    ? <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-600 uppercase tracking-widest">
        <Flame className="w-3 h-3 text-rose-500" /> High Risk
      </span>
    : isMedium
    ? <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-600 uppercase tracking-widest">
        <AlertCircle className="w-3 h-3 text-amber-500" /> Medium Risk
      </span>
    : <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 uppercase tracking-widest">
        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Stable
      </span>;

  const barColor = isHigh ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500';
  const visibleIssues = item.riskIssues.slice(0, 4);
  const overflowCount = item.riskIssues.length - 4;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
      {/* Card header */}
      <div className="p-5 border-b border-slate-50">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <Avatar name={item.name} size="md" />
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">{item.name}</h4>
              {item.college && (
                <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                  <GraduationCap className="w-3 h-3" /> {item.college}
                </p>
              )}
              {item.department && (
                <span className="inline-block mt-1 text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md">
                  {item.department}
                </span>
              )}
            </div>
          </div>
          {riskBadge}
        </div>

        {/* Vitals strip */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-center">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Attendance</p>
            <p className={`text-sm font-black mt-0.5 ${item.attendance < 75 ? 'text-rose-600' : 'text-slate-700'}`}>
              {item.attendance != null ? `${item.attendance}%` : '—'}
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-center">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Task Gap</p>
            <p className="text-sm font-black text-slate-700 mt-0.5">
              {item.days_since_last_task != null ? `${item.days_since_last_task}d` : '—'}
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-center">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Mentor Gap</p>
            <p className="text-sm font-black text-slate-700 mt-0.5">
              {item.days_since_mentor_interaction != null ? `${item.days_since_mentor_interaction}d` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-5 space-y-4 flex-1">
        {/* Completion likelihood bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Completion Likelihood</span>
            <span className={isHigh ? 'text-rose-500' : isMedium ? 'text-amber-500' : 'text-emerald-600'}>
              {item.successProbability}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${item.successProbability}%` }}
            />
          </div>
        </div>

        {/* Risk signals */}
        {item.riskIssues.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Risk Signals</span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {visibleIssues.map((issue, idx) => (
                <span
                  key={idx}
                  className={`text-[9px] font-black px-2.5 py-0.5 rounded-md border flex items-center gap-1 uppercase tracking-wide ${
                    isHigh ? 'bg-rose-50 text-rose-700 border-rose-100' :
                    isMedium ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isHigh ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  {issue}
                </span>
              ))}
              {overflowCount > 0 && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                  +{overflowCount} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Analysis / rationale */}
        {item.reasons.length > 0 && (
          <div className="space-y-2 border-l-2 border-l-indigo-200 pl-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Analysis</span>
            <ul className="space-y-1.5">
              {item.reasons.slice(0, 3).map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-500 font-semibold leading-relaxed">
                  <span className="text-indigo-400 flex-shrink-0 mt-0.5">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendation */}
        {item.recommendation && (
          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Recommended Action</span>
            </div>
            <p className="text-xs text-slate-700 font-semibold leading-relaxed">{item.recommendation}</p>
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="px-5 pb-5">
        {!isHigh && !isMedium ? null : (
          <button
            onClick={onIntervene}
            className={`w-full py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all active:scale-95 ${
              isHigh
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                : 'bg-slate-900 hover:bg-slate-700 text-white'
            }`}
          >
            Initiate Intervention
          </button>
        )}
      </div>
    </div>
  );
};

export const RiskDetection: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isServiceDown, setIsServiceDown] = useState(false);
  const [riskData, setRiskData] = useState<RiskItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null);
  const [interventionNotes, setInterventionNotes] = useState('');
  const [sendingIntervention, setSendingIntervention] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const fetchRisks = async (forceSync = false) => {
    forceSync ? setSyncing(true) : setLoading(true);
    setIsServiceDown(false);
    try {
      const res = await api.get(forceSync ? '/ai/risks?sync=true' : '/ai/risks');
      if (res.data.success) {
        const raw: RiskItem[] = Array.isArray(res.data.data) ? res.data.data : [];
        setRiskData(raw);
        setLastSynced(new Date().toLocaleString());
        if (forceSync) toast.success('Risk analysis refreshed.');
      }
    } catch {
      setIsServiceDown(true);
      setRiskData([]);
      if (forceSync) toast.error('AI service unavailable. Try again shortly.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => { fetchRisks(); }, []);

  const handleInterventionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interventionNotes.trim() || !selectedRisk) {
      toast.error('Please provide intervention notes.');
      return;
    }
    setSendingIntervention(true);
    try {
      const res = await api.post('/ai/risks/intervene', {
        internId: selectedRisk.internId,
        internName: selectedRisk.name,
        riskLevel: selectedRisk.riskLevel,
        department: selectedRisk.department || '',
        notes: interventionNotes.trim()
      });
      if (res.data.success) {
        const result: InterventionResult = res.data.data;
        if (result.mentorNotified && result.mentorEmail) {
          toast.success(`Intervention logged. Mentor ${result.mentorName} notified at ${result.mentorEmail}.`);
        } else {
          toast.success('Intervention logged. No mentor assigned yet — HR notified.');
        }
        setSelectedRisk(null);
        setInterventionNotes('');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to dispatch intervention.';
      toast.error(msg);
    } finally {
      setSendingIntervention(false);
    }
  };

  const highRiskCount = riskData.filter(r => r.riskLevel === 'HIGH').length;
  const mediumRiskCount = riskData.filter(r => r.riskLevel === 'MEDIUM').length;
  const stableCount = riskData.filter(r => r.riskLevel === 'LOW').length;
  const avgStability = riskData.length > 0
    ? Math.round(riskData.reduce((sum, r) => sum + (r.successProbability || 0), 0) / riskData.length)
    : 0;

  const filteredData = riskData.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchSearch = (item.name || '').toLowerCase().includes(q) ||
      (item.department || '').toLowerCase().includes(q) ||
      (item.college || '').toLowerCase().includes(q);
    const matchLevel = filterLevel === 'ALL' || item.riskLevel === filterLevel;
    return matchSearch && matchLevel;
  });

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="AI Risk & Attrition Assessment" />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* Section 1: Offline banner */}
          {isServiceDown && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900">AI Risk Engine Offline</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  The AI prediction service is currently unavailable. No data could be loaded.
                  Use "Refresh Analysis" to retry when the service recovers.
                </p>
              </div>
            </div>
          )}

          {/* Section 2: Hero header card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm border-l-4 border-l-rose-500 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                <ShieldAlert className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${isServiceDown ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'}`} />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {isServiceDown ? 'Service Offline' : 'Engine Active'}
                  </span>
                </div>
                <h2 className="text-base font-black text-slate-800 tracking-tight">Attrition Risk Detection Engine</h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  Monitors attendance decline, task velocity, overdue backlogs, and mentor engagement gap to surface early dropout risk.
                </p>
                {lastSynced && (
                  <p className="text-[10px] text-slate-300 font-bold mt-1">Last synced: {lastSynced}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => fetchRisks(true)}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl transition-all disabled:opacity-50 whitespace-nowrap"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Refreshing...' : 'Refresh Analysis'}
            </button>
          </div>

          {/* Section 3: KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 — High Risk */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">High Risk</p>
                <p className="text-2xl font-black text-rose-600">{loading ? '...' : highRiskCount}</p>
                <span className="text-[9px] text-rose-500 font-bold">Immediate intervention required</span>
              </div>
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100">
                <Flame className="w-5 h-5 text-rose-600" />
              </div>
            </div>

            {/* Card 2 — Medium Risk */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Medium Risk</p>
                <p className="text-2xl font-black text-amber-600">{loading ? '...' : mediumRiskCount}</p>
                <span className="text-[9px] text-amber-500 font-bold">Workload review recommended</span>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
            </div>

            {/* Card 3 — Stable */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Stable Profiles</p>
                <p className="text-2xl font-black text-emerald-600">{loading ? '...' : stableCount}</p>
                <span className="text-[9px] text-emerald-500 font-bold">On track</span>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>

            {/* Card 4 — Avg Stability */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Avg Stability Index</p>
                <p className="text-2xl font-black text-indigo-600">
                  {loading ? '...' : riskData.length === 0 ? '—' : `${avgStability}%`}
                </p>
                <span className={`text-[9px] font-bold ${
                  avgStability >= 80 ? 'text-emerald-500' : avgStability >= 60 ? 'text-slate-500' : 'text-rose-500'
                }`}>
                  {avgStability >= 80 ? '↑ Strong cohort' : avgStability >= 60 ? '→ Moderate' : '↓ Needs attention'}
                </span>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Section 4: Filter bar */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row items-center gap-3 justify-between">
            <div className="flex items-center gap-2 text-left">
              <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                <Brain className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">Risk Filter</p>
                <p className="text-[10px] text-slate-400 font-semibold">
                  {filteredData.length} of {riskData.length} intern{riskData.length !== 1 ? 's' : ''} shown
                </p>
              </div>
              {filterLevel !== 'ALL' && (
                <span className="ml-2 text-[9px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full uppercase">
                  {filterLevel} active
                </span>
              )}
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search intern name, college, or department…"
                className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 w-full sm:w-64"
              />
              <select
                value={filterLevel}
                onChange={e => setFilterLevel(e.target.value as 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW')}
                className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Stable</option>
              </select>
            </div>
          </div>

          {/* Section 5: Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-3">Analysing risk indicators…</p>
            </div>
          )}

          {/* Section 6: Empty states */}
          {!loading && filteredData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-2xl gap-3">
              {isServiceDown ? (
                <>
                  <WifiOff className="w-10 h-10 text-amber-400" />
                  <p className="text-sm font-bold text-slate-600">AI service is unavailable</p>
                  <p className="text-xs text-slate-400 max-w-xs text-center">
                    The risk engine could not be reached. Check that the AI microservice is running and retry.
                  </p>
                  <button
                    onClick={() => fetchRisks(true)}
                    className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    Retry Now
                  </button>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-10 h-10 text-emerald-500" />
                  <p className="text-sm font-bold text-slate-600">All interns are within healthy thresholds</p>
                  <p className="text-xs text-slate-400">No risk flags detected in the current cohort.</p>
                </>
              )}
            </div>
          )}

          {/* Section 7: Risk cards grid */}
          {!loading && filteredData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredData.map(item => (
                <RiskCard
                  key={item.internId}
                  item={item}
                  onIntervene={() => { setSelectedRisk(item); setInterventionNotes(''); }}
                />
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Section 8: Intervention Modal */}
      {selectedRisk && (
        <Modal
          isOpen={selectedRisk !== null}
          onClose={() => setSelectedRisk(null)}
          title={`Intervention — ${selectedRisk.name}`}
        >
          <form onSubmit={handleInterventionSubmit} className="space-y-4">

            {/* Risk summary inside modal */}
            <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
              <Avatar name={selectedRisk.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-slate-800">{selectedRisk.name}</p>
                <p className="text-xs text-slate-400 font-semibold">{selectedRisk.department || 'No department'}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                  selectedRisk.riskLevel === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                  selectedRisk.riskLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                  'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  {selectedRisk.riskLevel} Risk
                </span>
                <span className="text-xs font-bold text-slate-500">{selectedRisk.successProbability}% success index</span>
              </div>
            </div>

            {/* Email notice */}
            <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <Mail className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 font-semibold leading-relaxed">
                This will log an intervention record, notify the assigned mentor by email,
                and send you a confirmation email.
              </p>
            </div>

            {/* Notes textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Intervention Notes <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={interventionNotes}
                onChange={e => setInterventionNotes(e.target.value)}
                placeholder="Describe the intervention plan — e.g., schedule 1-on-1 meeting, reduce task load, escalate to department head…"
                className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl h-28 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none leading-relaxed"
                required
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedRisk(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sendingIntervention || !interventionNotes.trim()}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-sm cursor-pointer transition-colors flex items-center gap-2"
              >
                {sendingIntervention ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Dispatching…</>
                ) : (
                  <><Mail className="w-3.5 h-3.5" /> Confirm & Dispatch</>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default RiskDetection;
