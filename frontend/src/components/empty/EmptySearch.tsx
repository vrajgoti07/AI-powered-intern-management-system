import React from 'react';
import { SearchX } from 'lucide-react';

interface EmptySearchProps {
  searchTerm: string;
}

export const EmptySearch: React.FC<EmptySearchProps> = ({ searchTerm }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <SearchX className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">No results found</h3>
      <p className="text-gray-500">
        We couldn't find anything matching "{searchTerm}". Try adjusting your search.
      </p>
    </div>
  );
};
