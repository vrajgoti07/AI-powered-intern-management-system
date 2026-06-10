import webpush from 'web-push';
import { logger } from '../utils/logger';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BGPJ39mB-Jrkp10QoizNarFnzTZvdz4OeEnOV4ckPyW7PcNfviq2VyEq70nKKADHOwv58LSL0cH4ghSltBm1Gz8';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '0_IPIBY4dafjdEJZ6SRfLyEfwiZvhhVn5OgXIdOy6zM';
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@internflow.io';

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  logger.warn('⚠️  VAPID keys not set in environment. Using default fallback VAPID keys.');
}

webpush.setVapidDetails(
  vapidEmail,
  vapidPublicKey,
  vapidPrivateKey
);

export default webpush;
export { vapidPublicKey };
