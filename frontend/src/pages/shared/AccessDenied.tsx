import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AccessDenied: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-slate-50/50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center bg-white p-8 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 transform hover:scale-[1.01] transition-transform duration-300">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500 shadow-inner">
          <ShieldAlert className="h-10 w-10 animate-pulse" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-slate-900 tracking-tight">
          Access Denied
        </h2>
        <p className="mt-3 text-sm text-slate-500 font-semibold leading-relaxed">
          You do not have permission to view this page.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Please contact your administrator if you believe this is an error.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-2xl transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-2xl shadow-lg shadow-indigo-200 transition-all duration-200 cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
export default AccessDenied;
