import { create } from 'zustand';
import api from '../services/api';
import { socketService } from '../services/socket.service';

export interface CallParticipant {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface VideoCallInfo {
  id: string;
  roomName: string;
  conversationId: string;
  initiatedById: string;
  initiatedBy?: {
    id: string;
    name: string;
    avatar?: string;
  };
  startedAt: string;
  status: 'ACTIVE' | 'ENDED' | 'MISSED';
}

export interface IncomingCallInfo {
  conversationId: string;
  roomName: string;
  initiatedBy: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface VideoCallState {
  activeCall: VideoCallInfo | null;
  incomingCall: IncomingCallInfo | null;
  isMinimized: boolean;
  callDuration: number;
  isMuted: boolean;
  isCameraOff: boolean;

  // Actions
  initiateCall: (conversationId: string, user: { id: string; name: string; avatar?: string }) => Promise<void>;
  receiveIncomingCall: (call: IncomingCallInfo) => void;
  acceptCall: () => void;
  declineCall: () => void;
  endCall: (participants?: string[]) => Promise<void>;
  handleRemoteEnd: () => void;
  handleRemoteDecline: () => void;
  setMinimized: (minimized: boolean) => void;
  incrementDuration: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  setMuteState: (muted: boolean) => void;
  setCameraState: (cameraOff: boolean) => void;
  resetStore: () => void;
}

export const useVideoCallStore = create<VideoCallState>((set, get) => ({
  activeCall: null,
  incomingCall: null,
  isMinimized: false,
  callDuration: 0,
  isMuted: false,
  isCameraOff: false,

  initiateCall: async (conversationId, user) => {
    try {
      const response = await api.post('/calls/initiate', { conversationId });
      if (response.data?.success && response.data?.data) {
        const callInfo: VideoCallInfo = response.data.data;
        
        // Add initiatedBy for UI mapping
        callInfo.initiatedBy = {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        };

        set({
          activeCall: callInfo,
          incomingCall: null,
          isMinimized: false,
          callDuration: 0,
          isMuted: false,
          isCameraOff: false,
        });

        // Emit socket signaling to the room
        const socket = socketService.getSocket();
        if (socket) {
          socket.emit('call:initiate', {
            roomId: conversationId,
            conversationId,
            roomName: callInfo.roomName,
            initiatedBy: {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
            },
          });
        }
      }
    } catch (error) {
      console.error('Failed to initiate video call:', error);
      throw error;
    }
  },

  receiveIncomingCall: (call) => {
    // If user is already on a call, ignore incoming calls
    if (get().activeCall) return;
    set({ incomingCall: call });
  },

  acceptCall: () => {
    const { incomingCall } = get();
    if (!incomingCall) return;

    const activeCallObj: VideoCallInfo = {
      id: '', // Empty or fetched on status sync
      roomName: incomingCall.roomName,
      conversationId: incomingCall.conversationId,
      initiatedById: incomingCall.initiatedBy.id,
      initiatedBy: incomingCall.initiatedBy,
      startedAt: new Date().toISOString(),
      status: 'ACTIVE',
    };

    set({
      activeCall: activeCallObj,
      incomingCall: null,
      isMinimized: false,
      callDuration: 0,
      isMuted: false,
      isCameraOff: false,
    });

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('call:accept', {
        roomId: incomingCall.conversationId,
        conversationId: incomingCall.conversationId,
        roomName: incomingCall.roomName,
      });
    }
  },

  declineCall: () => {
    const { incomingCall } = get();
    if (!incomingCall) return;

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('call:decline', {
        roomId: incomingCall.conversationId,
        conversationId: incomingCall.conversationId,
        roomName: incomingCall.roomName,
      });
    }

    set({ incomingCall: null });
  },

  endCall: async (participants = []) => {
    const { activeCall } = get();
    if (!activeCall) return;

    try {
      // API call to finalize session
      await api.post('/calls/end', {
        roomName: activeCall.roomName,
        participants,
        status: 'ENDED',
      });
    } catch (error) {
      console.error('Failed to end call record on backend:', error);
    }

    // Emit socket end signal
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('call:end', {
        roomId: activeCall.conversationId,
        conversationId: activeCall.conversationId,
        roomName: activeCall.roomName,
      });
    }

    set({
      activeCall: null,
      incomingCall: null,
      isMinimized: false,
      callDuration: 0,
    });
  },

  handleRemoteEnd: () => {
    set({
      activeCall: null,
      incomingCall: null,
      isMinimized: false,
      callDuration: 0,
    });
  },

  handleRemoteDecline: () => {
    // If we initiated a call and the other side declines,
    // we could show a toast or end the session.
    // For now we end the active call if we are the only ones.
    set({
      activeCall: null,
      incomingCall: null,
      isMinimized: false,
      callDuration: 0,
    });
  },

  setMinimized: (minimized) => {
    set({ isMinimized: minimized });
  },

  incrementDuration: () => {
    set((state) => ({ callDuration: state.callDuration + 1 }));
  },

  toggleMute: () => {
    set((state) => ({ isMuted: !state.isMuted }));
  },

  toggleCamera: () => {
    set((state) => ({ isCameraOff: !state.isCameraOff }));
  },

  setMuteState: (muted) => {
    set({ isMuted: muted });
  },

  setCameraState: (cameraOff) => {
    set({ isCameraOff: cameraOff });
  },

  resetStore: () => {
    set({
      activeCall: null,
      incomingCall: null,
      isMinimized: false,
      callDuration: 0,
      isMuted: false,
      isCameraOff: false,
    });
  },
}));
