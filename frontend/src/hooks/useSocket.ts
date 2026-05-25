import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      path: '/simple-socket/',
      autoConnect: true,
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log(`[useSocket] Connected to server with ID: ${socketInstance.id}`);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log(`[useSocket] Disconnected: ${reason}`);
    });

    return () => {
      socketInstance.disconnect();
      console.log('[useSocket] Socket disconnected on unmount');
    };
  }, []);

  return socket;
};
