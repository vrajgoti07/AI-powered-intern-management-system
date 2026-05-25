import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { handleChatSocket } from './chatSocket';

let simpleIO: SocketIOServer | null = null;

export const initSimpleSocket = (httpServer: HttpServer): SocketIOServer => {
  simpleIO = new SocketIOServer(httpServer, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/simple-socket/',
  });

  simpleIO.on('connection', (socket) => {
    console.log(`[Simple Socket] Client connected: ${socket.id}`);

    // Call chat socket handler for the connected client
    handleChatSocket(simpleIO!, socket);

    // Simple test: emit "ping" from frontend, receive "pong" from backend
    socket.on('ping', () => {
      console.log(`[Simple Socket] Received ping from ${socket.id}, emitting pong`);
      socket.emit('pong');
    });

    socket.on('disconnect', () => {
      console.log(`[Simple Socket] Client disconnected: ${socket.id}`);
    });
  });

  return simpleIO;
};

export const getSimpleSocketIO = (): SocketIOServer | null => {
  return simpleIO;
};
