import React, { useState } from 'react';
import { Shield, ShieldAlert, AlertTriangle, Info } from 'lucide-react';

interface TrustBadgeProps {
  similarityScore: number | null;
  aiGeneratedProbability: number | null;
  trustScore: number | null;
  trustLevel: 'TRUSTED' | 'SUSPICIOUS' | 'FLAGGED' | null;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({
  similarityScore,
  aiGeneratedProbability,
  trustScore,
  trustLevel,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (trustScore === null || trustLevel === null) {
    return null;
  }

  // Define styling themes based on severity levels
  const theme = {
    TRUSTED: {
      bg: 'bg-emerald-50 border-emerald-100 text-emerald-700',
      iconBg: 'bg-emerald-500',
      icon: Shield,
      label: 'Trusted',
      text: 'This submission shows high originality and manual construction indicators.',
    },
    SUSPICIOUS: {
      bg: 'bg-amber-50 border-amber-100 text-amber-700',
      iconBg: 'bg-amber-500',
      icon: AlertTriangle,
      label: 'Suspicious',
      text: 'Caution: Moderate similarity index or AI style patterns detected.',
    },
    FLAGGED: {
      bg: 'bg-rose-50 border-rose-100 text-rose-700',
      iconBg: 'bg-rose-500',
      icon: ShieldAlert,
      label: 'Flagged',
      text: 'Warning: High copy match or strong machine text generations indicated.',
    },
  }[trustLevel];

  const IconComponent = theme.icon;

  return (
    <div className="relative inline-block">
      {/* Badge Button Toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${theme.bg}`}
      >
        <IconComponent className="w-4 h-4 flex-shrink-0" />
        <span>{theme.label} ({trustScore}%)</span>
        <Info className="w-3.5 h-3.5 opacity-60 ml-0.5" />
      </button>

      {/* Floating Popover Panel */}
      {showDetails && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-30 w-72 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2.5 h-2.5 rounded-full ${theme.iconBg} animate-pulse`} />
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              AI Verification Report
            </h4>
          </div>

          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 mb-3">
            {theme.text}
          </p>

          <div className="space-y-2 border-t border-slate-50 dark:border-slate-800/80 pt-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Similarity Match</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200">
                {similarityScore !== null ? `${Math.round(similarityScore * 100)}%` : '0%'}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">AI Probability</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200">
                {aiGeneratedProbability !== null ? `${Math.round(aiGeneratedProbability * 100)}%` : '5%'}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Combined Trust</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200">
                {trustScore}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
