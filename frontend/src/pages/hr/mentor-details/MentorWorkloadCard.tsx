import React from 'react';
import type { MentorWorkloadData } from '../../../types';
import { Users, Clock, FileCheck, AlertTriangle } from 'lucide-react';

interface Props {
  workload: MentorWorkloadData;
}

export const MentorWorkloadCard: React.FC<Props> = ({ workload }) => {
  const statusColors = {
    OVERLOADED: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', ring: 'stroke-red-500', trackRing: 'stroke-red-100' },
    BALANCED: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', ring: 'stroke-emerald-500', trackRing: 'stroke-emerald-100' },
    AVAILABLE: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', ring: 'stroke-blue-500', trackRing: 'stroke-blue-100' },
  };

  const colors = statusColors[workload.workloadStatus];
  const circumference = 2 * Math.PI * 36;
  const dashOffset = circumference - (workload.workloadPercent / 100) * circumference;

  return (
    <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-4`}>
      <div className="flex items-center gap-3 mb-3">
        {/* Circular Progress */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" strokeWidth="6" className={colors.trackRing} />
            <circle
              cx="40" cy="40" r="36" fill="none" strokeWidth="6"
              className={colors.ring}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-sm font-extrabold ${colors.text}`}>{workload.workloadPercent}%</span>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workload</p>
          <p className="text-xs font-bold text-slate-700">
            {workload.currentInterns}/{workload.maxCapacity} Interns
          </p>
          <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${colors.bg} ${colors.text} border ${colors.border}`}>
            {workload.workloadStatus === 'OVERLOADED' && <AlertTriangle className="w-2.5 h-2.5" />}
            {workload.workloadStatus}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <Clock className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
          <p className="text-sm font-extrabold text-slate-700">{workload.pendingTasks}</p>
          <p className="text-[9px] text-slate-400 font-bold">Pending Tasks</p>
        </div>
        <div className="text-center">
          <FileCheck className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
          <p className="text-sm font-extrabold text-slate-700">{workload.pendingReviews}</p>
          <p className="text-[9px] text-slate-400 font-bold">Reviews</p>
        </div>
        <div className="text-center">
          <Users className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
          <p className="text-sm font-extrabold text-slate-700">{workload.availableSlots}</p>
          <p className="text-[9px] text-slate-400 font-bold">Slots Open</p>
        </div>
      </div>
    </div>
  );
};
