export type NotificationType =
  | 'collector_accepted'
  | 'collector_near'
  | 'pickup_completed'
  | 'payment_received'
  | 'price_alert';

export type NotificationCategory = 'pickup' | 'payment' | 'market';

export interface SmartNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

const STORAGE_KEY = 'scrapmax_smart_notifications';

// Initial default seed notifications demonstrating active user lifecycle
const DEFAULT_NOTIFICATIONS: SmartNotification[] = [
  {
    id: 'notif-seed-1',
    title: 'Collector accepted your request',
    message: 'Verified Scrap Collector accepted your pickup scheduled for Today at 5:30 PM.',
    type: 'collector_accepted',
    category: 'pickup',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    read: false,
    actionUrl: '/household',
    metadata: { collectorName: 'Verified Scrap Collector', eta: '5:30 PM' },
  },
  {
    id: 'notif-seed-2',
    title: 'Collector is 500 m away',
    message: 'Your collector is arriving in ~3 minutes. Please keep your recyclables accessible.',
    type: 'collector_near',
    category: 'pickup',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    read: false,
    actionUrl: '/household',
    metadata: { distanceMeters: 500 },
  },
  {
    id: 'notif-seed-3',
    title: 'Plastic prices increased today',
    message: 'PET bottle rates updated: ₹22/kg (+10%). Great time to schedule a plastic pickup!',
    type: 'price_alert',
    category: 'market',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    read: false,
    actionUrl: '/stores',
    metadata: { material: 'Plastic', oldRate: 20, newRate: 22 },
  },
  {
    id: 'notif-seed-4',
    title: 'Payment received',
    message: '₹75.60 received via UPI for 4.2 kg Cardboard pickup. Digital receipt ready.',
    type: 'payment_received',
    category: 'payment',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
    actionUrl: '/household/history',
    metadata: { amount: 75.6, method: 'UPI' },
  },
];

type Listener = (notifications: SmartNotification[]) => void;
const listeners: Set<Listener> = new Set();

/**
 * Procedural web audio notification chime (gentle high chime).
 * No external mp3 file required; works on modern mobile & desktop browsers.
 */
export function playNotificationChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.12); // A5

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.28); // D6

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.08);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  } catch {
    // Suppress audio policy errors if autoplay is blocked
  }
}

/**
 * Checks if browser supports Web Notifications API.
 */
export function isPushNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Gets current notification permission state.
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isPushNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Requests native browser push permission from user.
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
}

/**
 * Dispatches a native browser OS-level push notification if permission granted.
 */
export async function dispatchNativePushNotification(
  title: string,
  body: string,
  actionUrl = '/'
) {
  if (!isPushNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  try {
    // Prefer service worker showNotification for mobile PWA support
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: '/globe.svg',
          badge: '/globe.svg',
          data: { url: actionUrl },
          tag: `scrapmax-${Date.now()}`,
        });
        return;
      }
    }

    // Fallback directly to Notification constructor
    new Notification(title, {
      body,
      icon: '/globe.svg',
      data: { url: actionUrl },
    });
  } catch (err) {
    console.warn('Native notification notice:', err);
  }
}

/**
 * Retrieves all stored notifications from localStorage.
 */
export function getStoredNotifications(): SmartNotification[] {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
      return DEFAULT_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_NOTIFICATIONS;
  }
}

/**
 * Persists notifications and alerts subscribers.
 */
function saveNotifications(list: SmartNotification[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Notification save error:', err);
  }
  listeners.forEach((listener) => listener(list));
}

/**
 * Subscribes a React component to live notification updates.
 */
export function subscribeToNotifications(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Emits a single toast event for immediate in-app floating banner.
 */
type ToastListener = (notification: SmartNotification) => void;
const toastListeners: Set<ToastListener> = new Set();

export function subscribeToNotificationToast(listener: ToastListener): () => void {
  toastListeners.add(listener);
  return () => {
    toastListeners.delete(listener);
  };
}

/**
 * Dispatches a new smart notification across browser push, audio, toast, and in-app tray.
 */
export function pushSmartNotification(params: {
  title: string;
  message: string;
  type: NotificationType;
  category?: NotificationCategory;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}): SmartNotification {
  const current = getStoredNotifications();
  const category =
    params.category ||
    (params.type.startsWith('collector') || params.type === 'pickup_completed'
      ? 'pickup'
      : params.type === 'payment_received'
      ? 'payment'
      : 'market');

  const newNotif: SmartNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: params.title,
    message: params.message,
    type: params.type,
    category,
    timestamp: new Date().toISOString(),
    read: false,
    actionUrl: params.actionUrl || '/household',
    metadata: params.metadata,
  };

  const updated = [newNotif, ...current];
  saveNotifications(updated);

  // Play gentle sound
  playNotificationChime();

  // Send OS-level push notification if permitted
  dispatchNativePushNotification(newNotif.title, newNotif.message, newNotif.actionUrl);

  // Alert in-app floating toast listeners
  toastListeners.forEach((listener) => listener(newNotif));

  return newNotif;
}

/**
 * Mark a specific notification as read.
 */
export function markNotificationAsRead(id: string) {
  const current = getStoredNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(updated);
}

/**
 * Mark all notifications as read.
 */
export function markAllNotificationsAsRead() {
  const current = getStoredNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveNotifications(updated);
}

/**
 * Clear all notifications.
 */
export function clearAllNotifications() {
  saveNotifications([]);
}

/**
 * Calculates unread count.
 */
export function getUnreadNotificationsCount(): number {
  return getStoredNotifications().filter((n) => !n.read).length;
}

/* =======================================================================
   5 PRESET SMART NOTIFICATION SIMULATORS (For live testing and app events)
======================================================================= */

export function triggerCollectorAcceptedNotification(collectorName = 'Verified Scrap Collector') {
  return pushSmartNotification({
    title: 'Collector accepted your request',
    message: `${collectorName} accepted your doorstep scrap pickup. Collector is en route!`,
    type: 'collector_accepted',
    category: 'pickup',
    actionUrl: '/household',
    metadata: { collectorName },
  });
}

export function triggerCollectorNearNotification(distanceMeters = 500) {
  return pushSmartNotification({
    title: `Collector is ${distanceMeters} m away`,
    message: 'Your collector is arriving at your doorstep in ~3 minutes. Please keep recyclables handy.',
    type: 'collector_near',
    category: 'pickup',
    actionUrl: '/household',
    metadata: { distanceMeters },
  });
}

export function triggerPickupCompletedNotification(weightKg = 18.5, amount = 148.0) {
  return pushSmartNotification({
    title: 'Pickup completed',
    message: `Pickup of ${weightKg} kg scrap successfully completed. Digital receipt #${Math.floor(
      1000 + Math.random() * 9000
    )} ready.`,
    type: 'pickup_completed',
    category: 'pickup',
    actionUrl: '/household/history',
    metadata: { weightKg, amount },
  });
}

export function triggerPaymentReceivedNotification(amount = 320.0, method = 'UPI') {
  return pushSmartNotification({
    title: 'Payment received',
    message: `₹${amount.toFixed(2)} credited directly via ${method} for your verified recyclables.`,
    type: 'payment_received',
    category: 'payment',
    actionUrl: '/household/history',
    metadata: { amount, method },
  });
}

export function triggerPriceAlertNotification(material = 'Plastic', newPrice = 22) {
  return pushSmartNotification({
    title: 'Plastic prices increased today',
    message: `Market update: ${material} scrap price increased to ₹${newPrice}/kg (+10%). Great time to recycle!`,
    type: 'price_alert',
    category: 'market',
    actionUrl: '/stores',
    metadata: { material, newPrice },
  });
}
