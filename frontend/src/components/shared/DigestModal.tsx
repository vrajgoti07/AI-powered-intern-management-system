import React, { useEffect, useState } from 'react';
import { X, TrendingUp, CheckCircle, AlertCircle, Calendar, Award, Activity, Users, Brain, Clock, ShieldAlert } from 'lucide-react';
import { useDigestStore } from '../../store/useDigestStore';

export const DigestModal: React.FC = () => {
  const { isOpen, digestData, closeDigest } = useDigestStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !digestData) return null;

  const { role, weekRange, telemetry, aiInsight } = digestData;

  const renderInternMetrics = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
          <div className="flex items-center gap-2 text-[#2563eb] mb-1.5">
            <CheckCircle className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tasks Done</span>
          </div>
          <p className="text-lg font-black text-slate-800">
            {telemetry.tasksCompleted} <span className="text-xs text-slate-400 font-semibold">/ {telemetry.tasksTotal}</span>
          </p>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-[#2563eb] h-full rounded-full transition-all duration-500" 
              style={{ width: `${telemetry.completionRate || 0}%` }}
            />
          </div>
          <span className="text-[9px] text-[#2563eb] font-bold mt-1 block">{telemetry.completionRate}% completion</span>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
          <div className="flex items-center gap-2 text-indigo-600 mb-1.5">
            <Award className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Average Grade</span>
          </div>
          <p className="text-lg font-black text-slate-800">
            {telemetry.avgScore && telemetry.avgScore > 0 ? `${telemetry.avgScore}` : 'N/A'}{' '}
            <span className="text-xs text-slate-400 font-semibold">{telemetry.avgScore && telemetry.avgScore > 0 ? '/ 10' : ''}</span>
          </p>
          <p className="text-[9px] text-slate-400 font-semibold mt-2.5">Graded submissions score</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
          <div className="flex items-center gap-2 text-amber-500 mb-1.5">
            <Activity className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Attendance</span>
          </div>
          <p className="text-lg font-black text-slate-800">
            {telemetry.attendanceRate}%
          </p>
          <p className="text-[9px] text-slate-400 font-semibold mt-2.5">
            {telemetry.presentDays} of {telemetry.totalDays} days marked
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
          <div className="flex items-center gap-2 text-emerald-500 mb-1.5">
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Daily Standups</span>
          </div>
          <p className="text-lg font-black text-slate-800">
            {telemetry.standupsCount}
          </p>
          <p className="text-[9px] text-slate-400 font-semibold mt-2.5">Standup records submitted</p>
        </div>
      </div>

      {/* Blockers Warning */}
      {telemetry.blockers && telemetry.blockers.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-left">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-rose-800">Active Blockers Flagged</h5>
            <p className="text-[10px] text-rose-600 font-semibold mt-0.5 leading-relaxed line-clamp-2">
              "{telemetry.blockers[0]}"
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderMentorMetrics = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-left">
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Supervising</span>
          <p className="text-base font-black text-slate-800">{telemetry.internsCount} Interns</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-left">
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Overdue Tasks</span>
          <p className="text-base font-black text-rose-600">{telemetry.overdueTasksCount}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-left">
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">At-Risk Interns</span>
          <p className="text-base font-black text-amber-600">{telemetry.atRiskCount}</p>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3 text-left">
        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Intern Progress Breakdown</h5>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {telemetry.interns && telemetry.interns.length > 0 ? (
            telemetry.interns.map((i: any) => (
              <div key={i.internId} className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{i.name}</p>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                    Tasks: {i.completionRate}% · Avg: {i.avgScore > 0 ? `${i.avgScore}/10` : 'N/A'} · Att: {i.attendanceRate}%
                  </p>
                </div>
                {i.isAtRisk ? (
                  <span className="text-[8px] font-extrabold uppercase tracking-wider bg-rose-50 border border-rose-100 text-rose-600 px-2 py-0.5 rounded-md flex-shrink-0">
                    At Risk
                  </span>
                ) : (
                  <span className="text-[8px] font-extrabold uppercase tracking-wider bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md flex-shrink-0">
                    On Track
                  </span>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-2">No interns assigned.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderHRMetrics = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
          <div className="flex items-center gap-2 text-slate-500 mb-1.5">
            <Users className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cohort Size</span>
          </div>
          <p className="text-lg font-black text-slate-800">
            {telemetry.activeInternsCount} <span className="text-xs text-slate-400 font-semibold">Interns</span>
          </p>
          <p className="text-[9px] text-slate-400 font-semibold mt-2">Active cohort program metrics</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
          <div className="flex items-center gap-2 text-[#2563eb] mb-1.5">
            <TrendingUp className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Completion Rate</span>
          </div>
          <p className="text-lg font-black text-slate-800">
            {telemetry.taskCompletionRate}%
          </p>
          <p className="text-[9px] text-slate-400 font-semibold mt-2">Overall cohort deliverables rate</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
          <div className="flex items-center gap-2 text-indigo-600 mb-1.5">
            <Award className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cohort Score</span>
          </div>
          <p className="text-lg font-black text-slate-800">
            {telemetry.avgScore} <span className="text-xs text-slate-400 font-semibold">/ 10</span>
          </p>
          <p className="text-[9px] text-slate-400 font-semibold mt-2">Cohort average task grading</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
          <div className="flex items-center gap-2 text-rose-500 mb-1.5">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">At-Risk Count</span>
          </div>
          <p className="text-lg font-black text-rose-600">
            {telemetry.atRiskCount} <span className="text-xs text-slate-400 font-semibold">Interns</span>
          </p>
          <p className="text-[9px] text-slate-400 font-semibold mt-2">Flagged for risk intervention</p>
        </div>
      </div>

      {telemetry.atRiskInterns && telemetry.atRiskInterns.length > 0 && (
        <div className="border-t border-slate-100 pt-3 text-left">
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cohort Action Required</h5>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {telemetry.atRiskInterns.map((i: any) => (
              <div key={i.internId} className="p-2.5 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center justify-between gap-3 text-left">
                <div>
                  <p className="text-xs font-bold text-rose-800">{i.name}</p>
                  <p className="text-[9px] text-rose-500 font-semibold mt-0.5">Reason: {i.reason}</p>
                </div>
                <span className="text-[8px] font-black uppercase tracking-wider bg-rose-100 border border-rose-200 text-rose-700 px-2 py-0.5 rounded-lg flex-shrink-0">
                  {i.overdueCount > 0 ? `${i.overdueCount} Overdue` : 'Warning'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const getSubtitle = () => {
    if (role === 'INTERN') return 'Personal Growth & Performance Insights';
    if (role === 'MENTOR') return 'Supervised Interns Status & Action Alerts';
    return 'Workspace Cohort Overview & Risk Report';
  };

  const modalContent = (
    <div className="flex flex-col h-full text-slate-800">
      {/* Top Handle for bottom sheet */}
      {isMobile && (
        <div className="w-10 h-1 bg-slate-200 rounded mx-auto mb-4 flex-shrink-0" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4 text-left">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#2563eb] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
              Weekly AI Report
            </span>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{weekRange}</span>
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 leading-tight">Weekly Performance Digest</h3>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{getSubtitle()}</p>
        </div>
        {!isMobile && (
          <button 
            onClick={closeDigest}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Scroll Content */}
      <div className="flex-1 overflow-y-auto space-y-5 py-2 scrollbar-thin scrollbar-thumb-slate-200">
        
        {/* Role-Specific Metrics Card */}
        <div>
          {role === 'INTERN' && renderInternMetrics()}
          {role === 'MENTOR' && renderMentorMetrics()}
          {(role === 'HR' || role === 'SUPER_ADMIN') && renderHRMetrics()}
        </div>

        {/* AI Insight Box */}
        <div className="text-left">
          <div className="flex items-center gap-1.5 mb-2">
            <Brain className="w-4 h-4 text-indigo-600" />
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Cohort Recommendations</h4>
          </div>
          <div className="border-l-4 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-r-2xl border border-y-slate-100 border-r-slate-100">
            <p className="text-xs font-semibold italic text-indigo-700 leading-relaxed">
              "{aiInsight}"
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Close Button for mobile */}
      {isMobile && (
        <button 
          onClick={closeDigest}
          className="w-full min-h-[44px] mt-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer flex-shrink-0"
        >
          Close Report
        </button>
      )}
    </div>
  );

  return (
    <>
      {isMobile ? (
        <>
          {/* Mobile Bottom Sheet Overlay Backdrop */}
          <div 
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={closeDigest}
          />
          {/* Mobile Bottom Sheet Container */}
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white max-h-[92vh] overflow-hidden p-6 pb-[env(safe-area-inset-bottom,24px)] flex flex-col shadow-2xl border-t border-slate-100 animate-in slide-in-from-bottom duration-300">
            {modalContent}
          </div>
        </>
      ) : (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          {/* Desktop Overlay Backdrop */}
          <div className="absolute inset-0" onClick={closeDigest} />
          {/* Desktop Centered Modal Card */}
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] p-6 border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-250">
            {modalContent}
          </div>
        </div>
      )}
    </>
  );
};
