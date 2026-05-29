import React from 'react';
import { CardSkeleton } from './CardSkeleton';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 bg-gray-200 rounded animate-pulse w-1/4 mb-6"></div>
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3"></div>
          </div>
        ))}
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4 mb-6"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse w-full"></div>
      </div>
    </div>
  );
};
