import React from 'react';

export const PageLoader: React.FC = () => {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-b-indigo-600"></div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Loading Page...</p>
      </div>
    </div>
  );
};

export default PageLoader;
