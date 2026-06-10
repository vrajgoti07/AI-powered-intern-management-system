import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, Mic, MicOff, Video, VideoOff, PhoneOff, GripHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { useVideoCallStore } from '../../store/useVideoCallStore';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export const VideoCallPanel: React.FC = () => {
  const { user } = useAuth();
  const {
    activeCall,
    isMinimized,
    callDuration,
    isMuted,
    isCameraOff,
    endCall,
    setMinimized,
    incrementDuration,
    setMuteState,
    setCameraState,
  } = useVideoCallStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const participantsRef = useRef<string[]>([]);

  // Track the local user's attendance list
  useEffect(() => {
    if (user && !participantsRef.current.includes(user.id)) {
      participantsRef.current.push(user.id);
    }
  }, [user]);

  // Handle active timer
  useEffect(() => {
    if (!activeCall) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      incrementDuration();
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeCall]);

  // Format seconds into MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Initialize Jitsi Meet Iframe API
  useEffect(() => {
    if (!activeCall || !containerRef.current) return;

    // Wait a brief tick to ensure container element is rendered
    const initJitsi = () => {
      if (typeof (window as any).JitsiMeetExternalAPI === 'undefined') {
        toast.error('Jitsi Meet library loading. Please wait...');
        return;
      }

      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }

      const domain = 'meet.jit.si';
      const options = {
        roomName: activeCall.roomName,
        width: '100%',
        height: '100%',
        parentNode: containerRef.current,
        configOverwrite: {
          startWithAudioMuted: isMuted,
          startWithVideoMuted: isCameraOff,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          toolbarButtons: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'embedmeeting', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
            'tileview', 'select-background', 'download', 'help', 'mute-everyone',
            'mute-video-everyone', 'security'
          ]
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
        },
        userInfo: {
          displayName: user?.name || 'Anonymous User',
          email: user?.email || '',
        },
      };

      try {
        const api = new (window as any).JitsiMeetExternalAPI(domain, options);
        jitsiApiRef.current = api;

        // Synchronize state when muted/unmuted inside the iframe
        api.addEventListener('audioMuteStatusChanged', (e: any) => {
          setMuteState(e.muted);
        });

        api.addEventListener('videoMuteStatusChanged', (e: any) => {
          setCameraState(e.muted);
        });

        // Add users to participants list
        api.addEventListener('participantJoined', (e: any) => {
          if (e.id && !participantsRef.current.includes(e.id)) {
            participantsRef.current.push(e.id);
          }
        });

        // Listen for conference left (meaning user pressed hangup inside Jitsi frame)
        api.addEventListener('videoConferenceLeft', () => {
          handleEndCall();
        });
      } catch (err) {
        console.error('Failed to construct JitsiMeetExternalAPI:', err);
      }
    };

    const timeoutId = setTimeout(initJitsi, 100);
    return () => {
      clearTimeout(timeoutId);
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [activeCall?.roomName]);

  if (!activeCall) return null;

  const handleToggleMute = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleAudio');
    }
  };

  const handleToggleCamera = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleVideo');
    }
  };

  const handleEndCall = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('hangup');
    }
    // Finalize record on database & socket
    endCall(participantsRef.current);
    toast.success('Video call ended.');
  };

  // Minimized Bottom Pill for Mobile
  const isMobile = window.innerWidth < 768;

  if (isMinimized && isMobile) {
    return (
      <div className="fixed bottom-16 left-4 right-4 z-40 bg-slate-900/95 border border-indigo-500/30 rounded-xl p-3 flex items-center justify-between shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <p className="text-slate-200 text-xs font-semibold">Active Call</p>
            <p className="text-indigo-400 text-xs font-medium">{formatTime(callDuration)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMinimized(false)}
            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition active:scale-95"
          >
            Return
          </button>
          <button
            onClick={handleEndCall}
            className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition active:scale-95"
            title="End Call"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Desktop drag boundaries / properties
  return (
    <motion.div
      drag={!isMobile && !isMinimized}
      dragMomentum={false}
      dragElastic={0.1}
      className={`fixed z-40 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
        isMinimized
          ? 'w-[280px] h-[210px] bottom-6 right-6 border-indigo-500/40 shadow-indigo-500/5'
          : 'w-[92vw] sm:w-[640px] h-[75vh] sm:h-[480px] bottom-4 right-4 sm:bottom-6 sm:right-6'
      }`}
    >
      {/* Draggable Header */}
      <div className="drag-handle bg-slate-950 px-4 py-2.5 flex items-center justify-between border-b border-slate-800 cursor-move shrink-0 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <GripHorizontal className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <p className="text-slate-300 text-xs font-semibold truncate">
            {isMinimized ? 'Minimized Video Call' : `Room: ${activeCall.roomName}`}
          </p>
          <span className="text-indigo-400 text-xs font-bold font-mono shrink-0 ml-1">
            [{formatTime(callDuration)}]
          </span>
        </div>

        {/* Header Options */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMinimized(!isMinimized)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
            title={isMinimized ? 'Expand Call' : 'Minimize Call'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          {!isMinimized && (
            <button
              onClick={handleEndCall}
              className="p-1 text-rose-400 hover:text-rose-200 hover:bg-slate-800 rounded transition"
              title="Hang up"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Jitsi Meeting View */}
      <div className="relative flex-1 bg-slate-950">
        <div
          ref={containerRef}
          className={`w-full h-full ${isMinimized ? 'pointer-events-none' : ''}`}
        />

        {/* Custom Controls Panel Overlay (Hidden in Minimized State) */}
        {!isMinimized && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-full px-5 py-2.5 flex items-center justify-center gap-4 shadow-xl z-50">
            {/* Mute Button (min 44px tap target) */}
            <button
              onClick={handleToggleMute}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${
                isMuted
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Hangup Button (Largest 60px target) */}
            <button
              onClick={handleEndCall}
              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-all duration-200 active:scale-95 shadow-xl shadow-rose-950/60"
              title="End Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>

            {/* Camera Toggle Button (min 44px tap target) */}
            <button
              onClick={handleToggleCamera}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${
                isCameraOff
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title={isCameraOff ? 'Start Camera' : 'Stop Camera'}
            >
              {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
