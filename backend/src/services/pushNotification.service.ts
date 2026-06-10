import prisma from '../config/database';
import webpush from '../config/webPush';
import { tenantLocalStorage } from '../middleware/tenant.middleware';

/**
 * Save browser push subscription details
 */
export const saveSubscription = async (
  userId: string,
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  },
  deviceName?: string
) => {
  const orgId = tenantLocalStorage.getStore();

  // Check if subscription already exists
  const existing = await prisma.pushSubscription.findUnique({
    where: { endpoint: subscription.endpoint },
  });

  if (existing) {
    // Update user/org/device if changed
    return prisma.pushSubscription.update({
      where: { id: existing.id },
      data: {
        userId,
        organizationId: orgId || null,
        deviceName: deviceName || existing.deviceName,
      },
    });
  }

  // Create new subscription record
  return prisma.pushSubscription.create({
    data: {
      userId,
      organizationId: orgId || null,
      endpoint: subscription.endpoint,
      p256dhKey: subscription.keys.p256dh,
      authKey: subscription.keys.auth,
      deviceName: deviceName || 'Unknown Device',
    },
  });
};

/**
 * Remove a push subscription by endpoint
 */
export const removeSubscription = async (endpoint: string) => {
  try {
    await prisma.pushSubscription.delete({
      where: { endpoint },
    });
  } catch (err) {
    // Ignore if already deleted
  }
};

/**
 * Send push notification to a specific user across all their registered devices
 */
export const sendPushToUser = async (
  userId: string,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: {
      url?: string;
      [key: string]: any;
    };
  }
) => {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/favicon.ico',
    badge: payload.badge || '/favicon.ico',
    data: payload.data || {},
  });

  const promises = subscriptions.map(async (sub) => {
    try {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dhKey,
          auth: sub.authKey,
        },
      };

      await webpush.sendNotification(pushSubscription, pushPayload);
    } catch (error: any) {
      // If subscription has expired or is invalid (e.g. status 410 or 404), remove it from DB
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log(`Clearing expired push subscription: ${sub.endpoint}`);
        await removeSubscription(sub.endpoint);
      } else {
        console.error(`Failed to send push notification to ${sub.endpoint}:`, error);
      }
    }
  });

  await Promise.all(promises);
};

/**
 * Send push notification to all users inside the active organization context
 */
export const sendPushToAll = async (
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: {
      url?: string;
      [key: string]: any;
    };
  }
) => {
  const orgId = tenantLocalStorage.getStore();
  
  const subscriptions = await prisma.pushSubscription.findMany({
    where: orgId ? { organizationId: orgId } : {},
  });

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/favicon.ico',
    badge: payload.badge || '/favicon.ico',
    data: payload.data || {},
  });

  const promises = subscriptions.map(async (sub) => {
    try {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dhKey,
          auth: sub.authKey,
        },
      };

      await webpush.sendNotification(pushSubscription, pushPayload);
    } catch (error: any) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        await removeSubscription(sub.endpoint);
      }
    }
  });

  await Promise.all(promises);
};
