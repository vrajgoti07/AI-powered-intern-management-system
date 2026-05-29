import React from 'react';

interface ListSkeletonProps {
  items?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ items = 3 }) => {
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <ul className="space-y-4">
        {Array.from({ length: items }).map((_, i) => (
          <li key={i} className="flex space-x-4 items-center">
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
