import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { UserRole } from '@prisma/client';
import redis, { safeDuplicate } from '../config/redis';
import { config } from '../config/env';
import prisma from '../config/database';

// Extended socket interface to store user metadata
export interface AuthenticatedSocket extends Socket {
  user?: {
    userId: string;
    email: string;
    role: string;
    name?: string;
  };
}

let io: SocketIOServer | null = null;

// Track active socket IDs per user (in-memory within this instance)
// Key: userId, Value: Set of socket.id
const userConnections = new Map<string, Set<string>>();

/**
 * Initialize Socket.IO server
 */
export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.cors.origin.split(',').map((o: string) => o.trim().replace(/\/+$/, '')).filter(Boolean),
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
  });

  // Use Redis Adapter for multi-instance scaling (graceful fallback if Redis is offline)
  try {
    if (redis.status === 'ready' || redis.status === 'connecting') {
      const subClient = safeDuplicate('socket-sub');
      io.adapter(createAdapter(redis, subClient));
      logger.info('Socket.IO Redis adapter initialized');
    } else {
      logger.warn('Redis not available — Socket.IO running in single-instance mode (no Redis adapter)');
    }
  } catch (err) {
    logger.warn('Failed to attach Redis adapter to Socket.IO — running in single-instance mode:', err);
  }

  // JWT authentication handshake middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      // Token can be sent in auth handshake or in query parameters/headers
      const token = 
        socket.handshake.auth?.token || 
        socket.handshake.headers?.authorization?.split(' ')[1] ||
        socket.handshake.query?.token;

      if (!token) {
        logger.warn(`Rejected connection attempt on socket ${socket.id}: No authentication token provided.`);
        return next(new Error('Authentication failed: No token provided'));
      }

      const decoded = verifyAccessToken(token as string);
      
      // Attempt to find user's name from database or defaults
      socket.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error: any) {
      logger.warn(`Rejected socket connection ${socket.id} due to invalid token: ${error.message}`);
      next(new Error('Authentication failed: Invalid or expired token'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    if (!socket.user) return;
    const { userId } = socket.user;

    logger.info(`User connected to socket: ${userId} (Socket ID: ${socket.id})`);

    // 1. Manage user connections (Multi-tab support)
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set());
    }
    userConnections.get(userId)!.add(socket.id);

    // 2. Add user to the unified Redis online set
    try {
      await redis.sadd('online_users', userId);
      // Join self room (user:userId) for user-specific real-time alerts
      await socket.join(`user:${userId}`);
      
      // Join global room
      await socket.join('global');

      // Fetch user details to join specific rooms
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, departmentId: true }
      });

      if (user) {
        if (user.role === UserRole.HR || user.role === UserRole.SUPER_ADMIN) {
          await socket.join('admin');
        }
        if (user.departmentId) {
          await socket.join(`dept:${user.departmentId}`);
        }
        
        // If user is an intern, they have mentorId on the Intern record
        if (user.role === UserRole.INTERN) {
            const intern = await prisma.intern.findUnique({ where: { userId } });
            if (intern && intern.mentorId) {
                await socket.join(`mentor_group:${intern.mentorId}`); // For intern to listen to mentor group
            }
        } else if (user.role === UserRole.MENTOR) {
            const mentor = await prisma.mentor.findUnique({ where: { userId } });
            if (mentor) {
                await socket.join(`mentor:${mentor.id}`);
                await socket.join(`mentor_group:${mentor.id}`);
            }
        }
      }
      
      // Broadcast online status to all connected users
      socket.broadcast.emit('user_status_change', {
        userId,
        status: 'online',
      });
    } catch (err) {
      logger.error('Failed to sync online status to Redis on connect:', err);
    }

    // 3. Room mapping for Active Chats
    socket.on('join_conversation', async ({ conversationId }) => {
      if (!conversationId) return;
      await socket.join(`conversation:${conversationId}`);
      logger.info(`Socket ${socket.id} joined conversation room: ${conversationId}`);
    });

    socket.on('leave_conversation', async ({ conversationId }) => {
      if (!conversationId) return;
      await socket.leave(`conversation:${conversationId}`);
      logger.info(`Socket ${socket.id} left conversation room: ${conversationId}`);
    });

    // 4. Typing Indicator broadcasts
    socket.on('typing', ({ conversationId, isTyping }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping,
      });
    });

    // 5. Read receipt broadcasts
    socket.on('message_read', ({ conversationId, messageId }) => {
      if (!conversationId || !messageId) return;
      socket.to(`conversation:${conversationId}`).emit('message_read_receipt', {
        conversationId,
        messageId,
        userId,
      });
    });

    // 6. Mentor Details room management (HR real-time updates)
    socket.on('join_mentor_details', async ({ mentorId }) => {
      if (!mentorId) return;
      await socket.join(`mentor:${mentorId}`);
      logger.info(`Socket ${socket.id} joined mentor details room: ${mentorId}`);
    });

    socket.on('leave_mentor_details', async ({ mentorId }) => {
      if (!mentorId) return;
      await socket.leave(`mentor:${mentorId}`);
      logger.info(`Socket ${socket.id} left mentor details room: ${mentorId}`);
    });

    // 6. Handle Disconnection
    socket.on('disconnect', async () => {
      logger.info(`Socket disconnected: ${socket.id} (User: ${userId})`);

      const connections = userConnections.get(userId);
      if (connections) {
        connections.delete(socket.id);
        
        if (connections.size === 0) {
          userConnections.delete(userId);
          
          try {
            // Remove user from online set in Redis
            await redis.srem('online_users', userId);
            
            // Broadcast offline status
            io?.emit('user_status_change', {
              userId,
              status: 'offline',
            });
            logger.info(`User ${userId} went completely offline`);
          } catch (err) {
            logger.error('Failed to sync offline status to Redis on disconnect:', err);
          }
        }
      }
    });
  });

  return io;
};

/**
 * Get Socket.IO server instance
 */
export const getSocketIO = (): SocketIOServer | null => {
  return io;
};

/**
 * Helper to check if a specific user is currently online
 */
export const isUserOnline = async (userId: string): Promise<boolean> => {
  try {
    const isOnline = await redis.sismember('online_users', userId);
    return isOnline === 1;
  } catch (err) {
    logger.error(`Error checking online status for user ${userId}:`, err);
    return userConnections.has(userId);
  }
};
