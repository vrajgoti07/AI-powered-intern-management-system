import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Helper to convert base64 VAPID key to Uint8Array required by pushManager
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const getDeviceName = () => {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return `${browser} on ${os}`;
};

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(true);

  // Check support and load initial subscription state
  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (err) {
          console.error('Error getting initial push subscription:', err);
        }
      }
      setLoading(false);
    };

    checkSupport();
  }, []);

  const subscribeToPush = useCallback(async () => {
    if (!isSupported) return false;

    setLoading(true);
    try {
      // 1. Request notification permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        throw new Error('Notification permission was denied.');
      }

      // 2. Fetch VAPID public key from backend
      const response = await api.get('/notifications/push/vapid-public-key');
      const vapidKey = response.data.data.publicKey;

      if (!vapidKey) {
        throw new Error('Failed to retrieve valid VAPID Public Key from backend.');
      }

      // 3. Register push subscription with the browser
      const registration = await navigator.serviceWorker.ready;
      const convertedVapidKey = urlBase64ToUint8Array(vapidKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // Convert subscription keys to base64 strings
      const p256dh = btoa(
        String.fromCharCode.apply(
          null,
          new Uint8Array(subscription.getKey('p256dh')!) as any
        )
      );
      const auth = btoa(
        String.fromCharCode.apply(
          null,
          new Uint8Array(subscription.getKey('auth')!) as any
        )
      );

      // 4. Save subscription to database via API
      await api.post('/notifications/push/subscribe', {
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh,
            auth,
          },
        },
        deviceName: getDeviceName(),
      });

      setIsSubscribed(true);
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      setLoading(false);
      return false;
    }
  }, [isSupported]);

  const unsubscribeFromPush = useCallback(async () => {
    if (!isSupported) return false;

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // 1. Delete on backend first
        await api.post('/notifications/push/unsubscribe', {
          endpoint: subscription.endpoint,
        });

        // 2. Unsubscribe locally
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      setLoading(false);
      return false;
    }
  }, [isSupported]);

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribeToPush,
    unsubscribeFromPush,
  };
};
