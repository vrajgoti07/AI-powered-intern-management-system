import { Router } from 'express';
import chatController from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { uploadChatFile } from '../utils/upload';
import {
  createConversationSchema,
  sendMessageSchema,
  getMessagesQuerySchema,
  interactMessageSchema,
} from '../validations/chat.validation';

const router = Router();

// Protect all routes with JWT authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/messages
 * @desc    Get all conversations of the authenticated user
 * @access  Authenticated Users
 */
router.get('/', chatController.getConversations);

/**
 * @route   POST /api/v1/messages
 * @desc    Create a new conversation (one-to-one or group)
 * @access  Authenticated Users
 */
router.post('/', validate(createConversationSchema), chatController.createConversation);

/**
 * @route   GET /api/v1/messages/channel/:channelName
 * @desc    Get or create conversation for a group channel
 * @access  Authenticated Users
 */
router.get('/channel/:channelName', chatController.getOrCreateChannelConversation);

/**
 * @route   GET /api/v1/messages/:conversationId
 * @desc    Get paginated messages of a specific conversation
 * @access  Authenticated Users
 */
router.get(
  '/:conversationId',
  validate(getMessagesQuerySchema),
  chatController.getMessages
);

/**
 * @route   POST /api/v1/messages/upload
 * @desc    Upload a file for chat attachment
 * @access  Authenticated Users
 */
router.post('/upload', uploadChatFile.single('file'), chatController.uploadChatFile);

/**
 * @route   POST /api/v1/messages/:conversationId
 * @desc    Send a message in a conversation
 * @access  Authenticated Users
 */
router.post('/:conversationId', validate(sendMessageSchema), chatController.sendMessage);

/**
 * @route   PATCH /api/v1/messages/:conversationId/read
 * @desc    Mark all unread messages inside a conversation as read
 * @access  Authenticated Users
 */
router.patch('/:conversationId/read', chatController.markAsRead);

/**
 * @route   PATCH /api/v1/messages/:messageId/interact
 * @desc    Interact with a message (Poll vote / Event RSVP)
 * @access  Authenticated Users
 */
router.patch('/:messageId/interact', validate(interactMessageSchema), chatController.interactMessage);

/**
 * @route   DELETE /api/v1/messages/:messageId
 * @desc    Delete a message
 * @access  Authenticated Users
 */
router.delete('/:messageId', chatController.deleteMessage);

export default router;
