import React, { useState } from 'react';
import { Video } from 'lucide-react';
import { useVideoCallStore } from '../../store/useVideoCallStore';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface VideoCallButtonProps {
  conversationId: string;
}

export const VideoCallButton: React.FC<VideoCallButtonProps> = ({ conversationId }) => {
  const { user } = useAuth();
  const { initiateCall, activeCall } = useVideoCallStore();
  const [loading, setLoading] = useState(false);

  const handleStartCall = async () => {
    if (!conversationId) {
      toast.error('No active conversation to call');
      return;
    }
    if (!user) {
      toast.error('You must be logged in to make a call');
      return;
    }
    if (activeCall) {
      toast.error('You are already in an active call session');
      return;
    }

    setLoading(true);
    try {
      // Initiate call session
      await initiateCall(conversationId, {
        id: user.id,
        name: user.name,
        avatar: (user as any).avatarUrl || undefined,
      });
      toast.success('Starting video call room...');
    } catch (error) {
      console.error('Failed to initiate call:', error);
      toast.error('Could not initiate video call. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStartCall}
      disabled={loading || !!activeCall}
      className={`relative p-2.5 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${
        activeCall
          ? 'bg-emerald-500/10 text-emerald-400 cursor-not-allowed border border-emerald-500/20'
          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/35 border border-indigo-500/30'
      } disabled:opacity-70`}
      title="Start Video Call"
      aria-label="Start Video Call"
    >
      <Video className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
      
      {/* Sleek online status indicator or glow effect */}
      {!activeCall && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-900 animate-ping duration-1000" />
      )}
    </button>
  );
};
