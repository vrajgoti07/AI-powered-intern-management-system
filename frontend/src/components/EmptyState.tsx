import React from 'react';
import * as Icons from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: keyof typeof Icons;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon }) => {
  // Safe lookup for the icon component, fallback to Inbox
  const IconComponent = icon && (icon in Icons) ? (Icons[icon] as React.ComponentType<any>) : Icons.Inbox;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 bg-white border border-slate-100 rounded-3xl text-center space-y-4 max-w-lg mx-auto shadow-sm">
      <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
        <IconComponent className="w-8 h-8 text-indigo-600" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">{title}</h3>
        <p className="text-xs font-semibold text-slate-400 leading-relaxed max-w-sm">{description}</p>
      </div>
    </div>
  );
};

export default EmptyState;
