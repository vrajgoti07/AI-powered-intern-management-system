import React from 'react';
import { Trophy, Flame, Sparkles } from 'lucide-react';

interface XPWidgetProps {
  totalXP: number;
  level: number;
  currentStreak: number;
}

export const XPWidget: React.FC<XPWidgetProps> = ({ totalXP, level, currentStreak }) => {
  const currentLevelXP = totalXP % 500;
  const xpNeeded = 500;
  const progressPercent = Math.min(100, (currentLevelXP / xpNeeded) * 100);

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl border border-indigo-500/20 shadow-xl p-5 sm:p-6 mb-6">
      {/* Decorative glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

      <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 text-left">
        {/* Level and Title Details */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
              <span className="text-xl font-black text-white tracking-tight">{level}</span>
            </div>
            <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white rounded-full p-1 shadow border border-amber-400">
              <Trophy className="w-2.5 h-2.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-extrabold text-white tracking-tight">Level Progress</h4>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            </div>
            <p className="text-[11px] font-bold text-slate-400 mt-0.5">
              {totalXP.toLocaleString()} Total XP earned · {500 - currentLevelXP} XP to Level {level + 1}
            </p>
          </div>
        </div>

        {/* Progress Bar Grid */}
        <div className="flex-grow max-w-md space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-black tracking-wider text-slate-400 uppercase">
            <span>Level {level}</span>
            <span>Level {level + 1}</span>
          </div>
          <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(99,102,241,0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-end">
            <span className="text-[10px] font-extrabold text-indigo-400 tracking-wide font-mono">
              {currentLevelXP} / {xpNeeded} XP ({Math.round(progressPercent)}%)
            </span>
          </div>
        </div>

        {/* Streak Component */}
        <div className="flex-shrink-0 flex items-center gap-3 bg-slate-800/40 border border-slate-700/30 backdrop-blur-sm px-5 py-3 rounded-2xl">
          <div className={`p-2 rounded-xl flex items-center justify-center ${currentStreak > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-700/50 text-slate-500'}`}>
            <Flame className={`w-5 h-5 ${currentStreak > 0 ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Consecutive Streak</p>
            <p className="text-sm font-extrabold text-white mt-1 leading-none">
              {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
