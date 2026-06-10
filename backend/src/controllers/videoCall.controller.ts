import { Request, Response, NextFunction } from 'express';
import videoCallService from '../services/videoCall.service';
import { successResponse } from '../utils/response';

/**
 * POST /api/calls/initiate
 * Initiate a new Jitsi video call room in a conversation.
 */
export const initiateCall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { conversationId } = req.body;
    const initiatedById = req.user?.id;
    const organizationId = req.user?.organizationId || null;

    if (!conversationId || typeof conversationId !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Valid conversationId is required to start a call.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!initiatedById) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized connection details.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const result = await videoCallService.initiateCall(initiatedById, conversationId, organizationId);
    successResponse(res, 'Video call initiated successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/calls/end
 * End an active Jitsi video call session.
 */
export const endCall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roomName, participants, status } = req.body;

    if (!roomName || typeof roomName !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Valid roomName is required to terminate a call.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const parsedParticipants = Array.isArray(participants) ? participants : [];

    const result = await videoCallService.endCall(
      roomName,
      parsedParticipants,
      status as 'ENDED' | 'MISSED' | undefined
    );

    successResponse(res, 'Video call session finalized successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/calls/history
 * Fetch video call histories.
 */
export const getCallHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    const conversationId = req.query.conversationId as string | undefined;

    if (!orgId) {
      res.status(400).json({
        success: false,
        message: 'User must belong to a tenant organization to query logs.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const result = await videoCallService.getCallHistory(orgId, conversationId);
    successResponse(res, 'Video call history reports fetched successfully', result);
  } catch (error) {
    next(error);
  }
};
