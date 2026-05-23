import { Request, Response, NextFunction } from 'express';
import chatService from '../services/chat.service';
import { successResponse } from '../utils/response';

export class ChatController {
  /**
   * Get all conversations of the authenticated user
   */
  async getConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const conversations = await chatService.getConversations(userId);
      successResponse(res, 'Conversations retrieved successfully', conversations);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a conversation (starts a direct message or group chat)
   */
  async createConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { participantIds, isGroup, name } = req.body;
      
      // Ensure current user is included in the participants list
      const participants = Array.from(new Set([userId, ...participantIds]));

      const conversation = await chatService.createConversation(
        participants,
        isGroup,
        name
      );

      successResponse(res, 'Conversation created successfully', conversation, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch paginated messages of a specific conversation
   */
  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const conversationId = req.params.conversationId as string;
      const { page, limit } = req.query as any;

      const result = await chatService.getMessages(
        conversationId,
        page ? parseInt(page as string, 10) : 1,
        limit ? parseInt(limit as string, 10) : 50
      );

      res.status(200).json({
        success: true,
        message: 'Messages retrieved successfully',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send a message to a conversation
   */
  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const conversationId = req.params.conversationId as string;
      const { content, fileUrl, fileName, fileType, fileSize, metadata } = req.body;

      const fileData = fileUrl
        ? { fileUrl, fileName: fileName || 'file', fileType: fileType || 'unknown', fileSize: fileSize || 0 }
        : undefined;

      const message = await chatService.sendMessage(
        conversationId,
        userId,
        content,
        fileData,
        metadata
      );

      successResponse(res, 'Message sent successfully', message, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all unread messages inside a conversation as read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const conversationId = req.params.conversationId as string;
      const result = await chatService.markAsRead(conversationId, userId);

      successResponse(res, 'Messages marked as read successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Interact with a message (Poll vote / Event RSVP)
   */
  async interactMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const messageId = req.params.messageId as string;
      const { type, optionId, status } = req.body;

      const message = await chatService.interactMessage(messageId, userId, {
        type,
        optionId,
        status
      });

      successResponse(res, 'Interaction processed successfully', message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get or create conversation for a group channel
   */
  async getOrCreateChannelConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      if (!userId || !userRole) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const channelName = req.params.channelName as string;
      const targetInternId = req.query.internId as string | undefined;
      const conversation = await chatService.getOrCreateChannelConversation(
        userId,
        userRole,
        channelName,
        targetInternId
      );

      successResponse(res, 'Channel conversation resolved successfully', conversation);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload a file for chat attachment
   */
  async uploadChatFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }
      const fileUrl = (req.file as any).secure_url || (req.file as any).url || (req.file as any).path || '';
      const secureUrl = fileUrl.startsWith('http')
        ? fileUrl
        : `http://localhost:5000/uploads/${(req.file as any).filename}`;

      successResponse(res, 'File uploaded successfully', {
        fileUrl: secureUrl,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a message in a conversation
   */
  async deleteMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      if (!userId || !userRole) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const messageId = req.params.messageId as string;
      const deletedMessage = await chatService.deleteMessage(messageId, userId, userRole);

      successResponse(res, 'Message deleted successfully', deletedMessage);
    } catch (error: any) {
      if (error.message === 'Message not found') {
        res.status(404).json({ success: false, message: error.message });
      } else if (error.message === 'Unauthorized to delete this message') {
        res.status(403).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  }
}

export default new ChatController();

