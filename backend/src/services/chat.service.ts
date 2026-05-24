import prisma from '../config/database';
import { getSocketIO } from '../socket/socket';

export class ChatService {
  /**
   * Create a new conversation (one-to-one or group)
   */
  async createConversation(participantIds: string[], isGroup: boolean = false, name?: string) {
    // De-duplicate participant IDs
    const uniqueIds = Array.from(new Set(participantIds));

    // For one-to-one chats, verify if a conversation between these two users already exists
    if (!isGroup && uniqueIds.length === 2) {
      const existing = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { participants: { some: { id: uniqueIds[0] } } },
            { participants: { some: { id: uniqueIds[1] } } },
          ],
        },
        include: {
          participants: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
      });

      if (existing) {
        return existing;
      }
    }

    // Create a new conversation entity
    const conversation = await prisma.conversation.create({
      data: {
        isGroup,
        name: isGroup ? name || 'Group Chat' : undefined,
        participants: {
          connect: uniqueIds.map((id) => ({ id })),
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    // Notify all participants about the new conversation via Socket.IO
    const io = getSocketIO();
    if (io) {
      uniqueIds.forEach((id) => {
        io.to(`user:${id}`).emit('conversation_created', conversation);
      });
    }

    return conversation;
  }

  /**
   * Send a message
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    fileData?: {
      fileUrl: string;
      fileName: string;
      fileType: string;
      fileSize: number;
    },
    metadata?: any
  ) {
    // 1. Create the message in database
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        fileUrl: fileData?.fileUrl,
        fileName: fileData?.fileName,
        fileType: fileData?.fileType,
        fileSize: fileData?.fileSize,
        metadata: metadata || undefined,
        readBy: {
          connect: { id: senderId }, // Sender automatically reads their own message
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
        readBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update conversation updatedAt timestamp to float it to the top of list
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // 2. Create notifications for all other conversation participants
    try {
      const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          participants: {
            select: { id: true }
          }
        }
      });

      if (conv) {
        const otherParticipantIds = conv.participants
          .map(p => p.id)
          .filter(id => id !== senderId);

        const isSenderMentor = message.sender.role === 'MENTOR';
        const senderNameWithRole = isSenderMentor ? `${message.sender.name} (Mentor)` : message.sender.name;

        for (const recipientId of otherParticipantIds) {
          await prisma.notification.create({
            data: {
              userId: recipientId,
              title: `New Message from ${senderNameWithRole}`,
              message: content.length > 60 ? `${content.substring(0, 57)}...` : content,
              type: 'CHAT',
              data: {
                conversationId,
                messageId: message.id,
                senderId
              }
            }
          });
        }
      }
    } catch (notificationError) {
      console.error('Failed to create chat notifications:', notificationError);
    }

    // 3. Broadcast message in real-time to the conversation's WebSocket room
    const io = getSocketIO();
    if (io) {
      io.to(`conversation:${conversationId}`).emit('new_message', message);
    }

    return message;
  }

  /**
   * Get paginated messages in a conversation
   */
  async getMessages(conversationId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [messages, total] = await prisma.$transaction([
      prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              role: true,
            },
          },
          readBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    // Reverse list to deliver messages in correct chronological order
    return {
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get list of conversations for a user
   */
  async getConversations(userId: string) {
    return prisma.conversation.findMany({
      where: {
        participants: {
          some: { id: userId },
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Mark messages as read in a conversation
   */
  async markAsRead(conversationId: string, userId: string) {
    // Find unread messages from other users
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
        NOT: {
          readBy: { some: { id: userId } },
        },
      },
      select: { id: true },
    });

    if (unreadMessages.length === 0) {
      return { count: 0 };
    }

    // Connect user to the readBy relation of all unread messages
    await prisma.$transaction(
      unreadMessages.map((msg) =>
        prisma.message.update({
          where: { id: msg.id },
          data: {
            readBy: {
              connect: { id: userId },
            },
          },
        })
      )
    );

    // Notify other conversation participants about read receipts
    const io = getSocketIO();
    if (io) {
      io.to(`conversation:${conversationId}`).emit('conversation_read', {
        conversationId,
        userId,
        messageIds: unreadMessages.map((msg) => msg.id),
      });
    }

    return { count: unreadMessages.length };
  }

  /**
   * Get or create a conversation for a group channel
   */
  async getOrCreateChannelConversation(userId: string, userRole: string, channelName: string, targetInternId?: string) {
    const isPrivateChannel = channelName === 'tech-support' || channelName === 'stipend-queries';
    let formattedChannelName = `#${channelName}`;

    // 1. Resolve which intern this private chat belongs to OR which department this general chat belongs to
    let resolvedInternId = '';
    let resolvedDepartmentId = '';

    if (isPrivateChannel) {
      if (userRole === 'INTERN') {
        const intern = await prisma.intern.findUnique({
          where: { userId }
        });
        if (intern) {
          resolvedInternId = intern.id;
        }
      } else if (userRole === 'MENTOR' && targetInternId) {
        resolvedInternId = targetInternId;
      }
      formattedChannelName = `#${channelName}-${resolvedInternId}`;
    } else if (channelName === 'general') {
      if (userRole === 'INTERN') {
        const intern = await prisma.intern.findUnique({
          where: { userId }
        });
        if (intern) {
          resolvedDepartmentId = intern.departmentId;
        }
      } else if (userRole === 'MENTOR') {
        const mentor = await prisma.mentor.findUnique({
          where: { userId }
        });
        if (mentor) {
          resolvedDepartmentId = mentor.departmentId;
        }
      } else if (userRole === 'DEPARTMENT_HEAD') {
        const department = await prisma.department.findFirst({
          where: { headId: userId }
        });
        if (department) {
          resolvedDepartmentId = department.id;
        }
      } else if (userRole === 'HR' || userRole === 'SUPER_ADMIN') {
        if (targetInternId) {
          const intern = await prisma.intern.findUnique({
            where: { id: targetInternId }
          });
          if (intern) {
            resolvedDepartmentId = intern.departmentId;
          }
        } else {
          // Default to the first department
          const department = await prisma.department.findFirst();
          if (department) {
            resolvedDepartmentId = department.id;
          }
        }
      }

      if (resolvedDepartmentId) {
        formattedChannelName = `#${channelName}-${resolvedDepartmentId}`;
      }
    }

    // 2. Resolve all expected participant IDs first
    const participantIds: string[] = [userId];

    if (isPrivateChannel && resolvedInternId) {
      // Find the specific intern and their mentor
      const intern = await prisma.intern.findUnique({
        where: { id: resolvedInternId },
        include: { mentor: true }
      });
      if (intern) {
        participantIds.push(intern.userId);
        if (intern.mentor) {
          participantIds.push(intern.mentor.userId);
        }
      }
    } else {
      // Shared general channel - Department-wide / Cohort-wide
      if (resolvedDepartmentId) {
        // Find all interns in this department
        const interns = await prisma.intern.findMany({
          where: { departmentId: resolvedDepartmentId },
          select: { userId: true }
        });
        interns.forEach(i => participantIds.push(i.userId));

        // Find all mentors in this department
        const mentors = await prisma.mentor.findMany({
          where: { departmentId: resolvedDepartmentId },
          select: { userId: true }
        });
        mentors.forEach(m => participantIds.push(m.userId));

        // Find the department head (if any)
        const dept = await prisma.department.findUnique({
          where: { id: resolvedDepartmentId },
          select: { headId: true }
        });
        if (dept && dept.headId) {
          participantIds.push(dept.headId);
        }
      }
    }

    const uniqueIds = Array.from(new Set(participantIds));

    // 3. Check if the conversation already exists strictly by group name
    let conversation = await prisma.conversation.findFirst({
      where: {
        isGroup: true,
        name: formattedChannelName
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                role: true,
              }
            }
          }
        }
      }
    });

    if (conversation) {
      // Automatically connect any missing expected participants
      const existingParticipantIds = conversation.participants.map(p => p.id);
      const missingParticipantIds = uniqueIds.filter(id => !existingParticipantIds.includes(id));

      if (missingParticipantIds.length > 0) {
        conversation = await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            participants: {
              connect: missingParticipantIds.map(id => ({ id }))
            }
          },
          include: {
            participants: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                role: true,
              }
            },
            messages: {
              orderBy: { createdAt: 'asc' },
              include: {
                sender: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    role: true,
                  }
                }
              }
            }
          }
        });
      }
      return conversation;
    }

    // 4. Create the conversation since it does not exist
    const newConversation = await prisma.conversation.create({
      data: {
        isGroup: true,
        name: formattedChannelName,
        participants: {
          connect: uniqueIds.map(id => ({ id }))
        }
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          }
        }
      }
    });

    // 5. Seed initial conversation history disabled for production

    // 6. Fetch fully-loaded conversation with messages
    const loadedConversation = await prisma.conversation.findUnique({
      where: { id: newConversation.id },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                role: true,
              }
            }
          }
        }
      }
    });

    return loadedConversation;
  }

  /**
   * Interact with a message (Poll vote / Event RSVP)
   */
  async interactMessage(
    messageId: string,
    userId: string,
    payload: { type: 'vote' | 'rsvp'; optionId?: string; status?: 'yes' | 'maybe' | 'no' }
  ) {
    const { type, optionId, status } = payload;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    let metadata: any = message.metadata || {};

    if (type === 'vote') {
      if (!optionId) {
        throw new Error('Option ID is required for voting');
      }

      if (metadata.type !== 'poll') {
        throw new Error('This message is not a poll');
      }

      if (!metadata.votes) {
        metadata.votes = {};
      }

      metadata.options.forEach((opt: any) => {
        if (!metadata.votes[opt.id]) {
          metadata.votes[opt.id] = [];
        }
      });

      const optionVotes = metadata.votes[optionId] || [];
      const hasVotedThis = optionVotes.includes(userId);

      Object.keys(metadata.votes).forEach((optId) => {
        metadata.votes[optId] = (metadata.votes[optId] || []).filter((id: string) => id !== userId);
      });

      if (!hasVotedThis) {
        metadata.votes[optionId].push(userId);
      }
    } else if (type === 'rsvp') {
      if (!status) {
        throw new Error('RSVP status is required');
      }

      if (metadata.type !== 'event') {
        throw new Error('This message is not an event');
      }

      if (!metadata.rsvps) {
        metadata.rsvps = { yes: [], maybe: [], no: [] };
      }

      metadata.rsvps.yes = (metadata.rsvps.yes || []).filter((id: string) => id !== userId);
      metadata.rsvps.maybe = (metadata.rsvps.maybe || []).filter((id: string) => id !== userId);
      metadata.rsvps.no = (metadata.rsvps.no || []).filter((id: string) => id !== userId);

      metadata.rsvps[status].push(userId);
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        metadata,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
        readBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const io = getSocketIO();
    if (io) {
      io.to(`conversation:${message.conversationId}`).emit('message_updated', updatedMessage);
    }

    return updatedMessage;
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string, userId: string, userRole: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Only allow message sender or HR to delete messages
    if (message.senderId !== userId && userRole !== 'HR') {
      throw new Error('Unauthorized to delete this message');
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    // Notify participants in real-time via WebSocket room
    const io = getSocketIO();
    if (io) {
      io.to(`conversation:${message.conversationId}`).emit('message_deleted', {
        messageId,
        conversationId: message.conversationId,
      });
    }

    return message;
  }
}

export default new ChatService();
