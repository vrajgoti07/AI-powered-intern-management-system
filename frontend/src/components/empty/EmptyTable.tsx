import React from 'react';
import { FileQuestion } from 'lucide-react';

interface EmptyTableProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyTable: React.FC<EmptyTableProps> = ({ message, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-dashed border-gray-300">
      <FileQuestion className="w-12 h-12 text-gray-400 mb-4" />
      <p className="text-gray-500 text-lg mb-4">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
