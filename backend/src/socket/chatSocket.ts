import { Socket, Server as SocketIOServer } from 'socket.io';
import prisma from '../config/database';

export const handleChatSocket = (io: SocketIOServer, socket: Socket) => {
  // join-room event
  socket.on('join-room', async (data: { roomId: string; name?: string }) => {
    const { roomId, name } = data;
    if (!roomId) return;
    await socket.join(`room:${roomId}`);
    console.log(`[Chat Socket] Socket ${socket.id} (${name || 'Anonymous'}) joined room: ${roomId}`);
  });

  // leave-room event
  socket.on('leave-room', async (data: { roomId: string; name?: string }) => {
    const { roomId, name } = data;
    if (!roomId) return;
    await socket.leave(`room:${roomId}`);
    console.log(`[Chat Socket] Socket ${socket.id} (${name || 'Anonymous'}) left room: ${roomId}`);
  });

  // send-message event
  socket.on('send-message', async (data: { roomId: string; senderId: string; senderName: string; content: string }) => {
    const { roomId, senderId, senderName, content } = data;
    if (!roomId || !senderId || !content) return;

    try {
      // Save message to database
      const message = await prisma.chatMessage.create({
        data: {
          roomId,
          senderId,
          content,
        },
      });

      // Broadcast the message to all sockets in the room (including sender)
      io.to(`room:${roomId}`).emit('receive-message', {
        ...message,
        senderName,
      });

      console.log(`[Chat Socket] Message sent in room ${roomId} by ${senderName}: ${content}`);
    } catch (error) {
      console.error('[Chat Socket] Error saving/sending message:', error);
    }
  });

  // typing event
  socket.on('typing', (data: { roomId: string; name: string; isTyping: boolean }) => {
    const { roomId, name, isTyping } = data;
    if (!roomId || !name) return;

    // Broadcast typing event to other sockets in the room
    socket.to(`room:${roomId}`).emit('user-typing', {
      name,
      isTyping,
    });
  });
};
