import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { socketService } from '../services/socket.service';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    socketService.connect();
    const socketInstance = socketService.getSocket();
    setSocket(socketInstance);

    return () => {
      // We don't necessarily want to disconnect on every unmount if it's a global socket,
      // but if the hook is unmounted globally, we could.
      // For now, we leave the connection open, or let App.tsx handle disconnect on logout.
    };
  }, []);

  return socket;
};
