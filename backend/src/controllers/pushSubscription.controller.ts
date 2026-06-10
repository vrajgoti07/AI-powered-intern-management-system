import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { successResponse } from '../utils/response';
import { saveSubscription, removeSubscription } from '../services/pushNotification.service';
import { vapidPublicKey } from '../config/webPush';

/**
 * Register a new push subscription
 * POST /api/notifications/push/subscribe
 */
export const subscribe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { subscription, deviceName } = req.body;

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    throw new AppError('Invalid subscription object. Must contain endpoint and keys.', 400);
  }

  const result = await saveSubscription(req.user!.id, subscription, deviceName);

  successResponse(res, 'Push subscription saved successfully', result, 201);
});

/**
 * Remove an existing push subscription
 * POST /api/notifications/push/unsubscribe
 */
export const unsubscribe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { endpoint } = req.body;

  if (!endpoint) {
    throw new AppError('Endpoint parameter is required to unsubscribe.', 400);
  }

  await removeSubscription(endpoint);

  successResponse(res, 'Push subscription removed successfully');
});

/**
 * Retrieve server VAPID Public Key for subscription handshake
 * GET /api/notifications/push/vapid-public-key
 */
export const getVapidPublicKey = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  successResponse(res, 'VAPID public key retrieved successfully', {
    publicKey: vapidPublicKey,
  });
});
