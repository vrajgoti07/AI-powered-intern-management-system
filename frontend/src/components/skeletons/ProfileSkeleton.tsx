import React from 'react';

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-sm mx-auto">
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse mb-4"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse mb-6"></div>
        
        <div className="w-full space-y-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse w-full"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse w-full"></div>
        </div>
      </div>
    </div>
  );
};
