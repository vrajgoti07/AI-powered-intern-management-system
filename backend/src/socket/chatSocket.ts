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

  // Jitsi Video Call event signaling (using room prefix)
  socket.on('call:initiate', (data: { roomId: string; roomName: string; initiatedBy: any }) => {
    socket.to(`room:${data.roomId}`).emit('call:incoming', {
      conversationId: data.roomId,
      roomName: data.roomName,
      initiatedBy: data.initiatedBy,
    });
  });

  socket.on('call:accept', (data: { roomId: string; roomName: string }) => {
    socket.to(`room:${data.roomId}`).emit('call:accepted', {
      conversationId: data.roomId,
      roomName: data.roomName,
    });
  });

  socket.on('call:decline', (data: { roomId: string; roomName: string }) => {
    socket.to(`room:${data.roomId}`).emit('call:declined', {
      conversationId: data.roomId,
      roomName: data.roomName,
    });
  });

  socket.on('call:end', (data: { roomId: string; roomName: string }) => {
    socket.to(`room:${data.roomId}`).emit('call:ended', {
      conversationId: data.roomId,
      roomName: data.roomName,
    });
  });
};
