import React from 'react';
import { LucideIcon, ArrowUp, ArrowDown } from 'lucide-react';

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend: string;
  up?: boolean;
  color?: 'blue' | 'cyan' | 'emerald' | 'amber';
}

const colorMap = {
  blue: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-100" },
  cyan: { bg: "bg-cyan-50", icon: "text-cyan-600", border: "border-cyan-100" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-100" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-100" },
};

export const KPICard: React.FC<KPICardProps> = ({ icon: Icon, label, value, trend, up = true, color = 'blue' }) => {
  const styles = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 ${styles.bg} rounded-xl flex items-center justify-center transition-transform hover:rotate-6`}>
          <Icon className={`w-5 h-5 ${styles.icon}`} />
        </div>
        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
          {up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {up ? "Up" : "Down"}
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-800 tracking-tight">{value}</p>
      <p className="text-sm font-medium text-slate-500 mt-1">{label}</p>
      <p className="text-xs text-slate-400 mt-1">{trend}</p>
    </div>
  );
};
