import React from 'react';
import { WifiOff } from 'lucide-react';

interface NetworkErrorProps {
  onRetry: () => void;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({ onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-sm border border-red-100">
      <WifiOff className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Error</h3>
      <p className="text-gray-500 text-center mb-6 max-w-sm">
        We're having trouble connecting to the server. Please check your internet connection and try again.
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        Retry Connection
      </button>
    </div>
  );
};
