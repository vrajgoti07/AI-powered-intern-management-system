import React, { useEffect } from 'react';
import { Phone, PhoneOff, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoCallStore } from '../../store/useVideoCallStore';

export const IncomingCallModal: React.FC = () => {
  const { incomingCall, acceptCall, declineCall } = useVideoCallStore();

  // Play a ringing sound if incomingCall is active
  useEffect(() => {
    if (!incomingCall) return;

    // Use browser AudioContext or simple ringtone if desired.
    // For standard web applications, a subtle synth ringtone using Web Audio API is robust and needs no assets!
    let audioCtx: AudioContext | null = null;
    let intervalId: any = null;

    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playBeep = () => {
        if (!audioCtx || audioCtx.state === 'closed') return;
        
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // Ring sound frequencies
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        osc.frequency.setValueAtTime(480, audioCtx.currentTime + 0.1); // Harmony
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
        
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.8);
      };

      // Play immediately, then every 2 seconds
      playBeep();
      intervalId = setInterval(playBeep, 2000);
    } catch (e) {
      console.warn('AudioContext ringtone failed to start (interaction required):', e);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (audioCtx) {
        audioCtx.close().catch(console.error);
      }
    };
  }, [incomingCall]);

  if (!incomingCall) return null;

  const { initiatedBy } = incomingCall;

  return (
    <AnimatePresence>
      <div className="fixed inset-x-0 top-0 z-50 flex justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="w-full max-w-md pointer-events-auto overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/90 shadow-2xl backdrop-blur-xl shadow-indigo-500/10"
        >
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            {/* Caller Identity */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative">
                {initiatedBy.avatar ? (
                  <img
                    src={initiatedBy.avatar}
                    alt={initiatedBy.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-950 border-2 border-indigo-500 flex items-center justify-center text-indigo-300 font-bold text-lg">
                    {initiatedBy.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Pulsing ring indicator */}
                <span className="absolute -inset-0.5 rounded-full border border-indigo-400 animate-ping opacity-60 pointer-events-none" />
              </div>

              <div className="min-w-0">
                <p className="text-slate-100 font-semibold text-sm sm:text-base leading-tight truncate">
                  {initiatedBy.name}
                </p>
                <p className="text-indigo-400 text-xs sm:text-sm font-medium animate-pulse mt-0.5">
                  Incoming Video Call...
                </p>
              </div>
            </div>

            {/* Actions (Circle tap targets min 44px for accessibility) */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Decline Button */}
              <button
                onClick={declineCall}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-950/40 transition-all active:scale-95 duration-200"
                title="Decline Call"
              >
                <PhoneOff className="w-5 h-5" />
              </button>

              {/* Accept Button */}
              <button
                onClick={acceptCall}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-950/40 transition-all active:scale-95 duration-200 animate-bounce"
                title="Accept Call"
              >
                <Phone className="w-5 h-5 fill-current" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
