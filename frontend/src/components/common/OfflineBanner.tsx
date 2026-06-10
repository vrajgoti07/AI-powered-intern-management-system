import React, { useState, useEffect } from 'react';
import { WifiOff, X } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setIsVisible(true);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setIsVisible(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline || !isVisible) return null;

  return (
    <div className="bg-rose-600 text-white px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-between gap-3 z-50 relative">
      <div className="flex items-center gap-2 mx-auto">
        <WifiOff className="w-4 h-4 animate-pulse text-rose-200" />
        <span>You are currently offline. Running on cached resources. Some updates may not sync until connection is restored.</span>
      </div>
      <button 
        type="button" 
        onClick={() => setIsVisible(false)}
        className="hover:bg-rose-700 p-1 rounded-lg transition-colors cursor-pointer text-white flex-shrink-0"
        title="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
