import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NoPermission: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied (403)</h2>
      <p className="text-gray-500 text-center mb-6 max-w-md">
        You do not have the required permissions to view this page. If you believe this is a mistake, please contact your administrator.
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Return to Dashboard
      </button>
    </div>
  );
};
