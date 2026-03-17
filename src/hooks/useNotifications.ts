import { useState, useCallback } from 'react';

// Notification types (previously from websocket-service)
export enum NotificationType {
  // Payment & Transaction
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  SALE_COMPLETED = 'sale_completed',
  PURCHASE_COMPLETED = 'purchase_completed',

  // Communication
  NEW_MESSAGE = 'new_message',

  // Listing Activity
  LISTING_VIEWED = 'listing_viewed',
  LISTING_FAVORITED = 'listing_favorited',
  LISTING_CREATED = 'listing_created',
  LISTING_UPDATED = 'listing_updated',
  LISTING_EXPIRED = 'listing_expired',
  LISTING_APPROVED = 'listing_approved',
  LISTING_REJECTED = 'listing_rejected',

  // Mining-Specific
  PRICE_DROP = 'price_drop',
  PRICE_INCREASE = 'price_increase',
  NEW_MINERAL_DISCOVERY = 'new_mineral_discovery',
  LICENSE_EXPIRY_WARNING = 'license_expiry_warning',
  EXPLORATION_UPDATE = 'exploration_update',
  GEOLOGICAL_REPORT_READY = 'geological_report_ready',
  REGULATORY_CHANGE = 'regulatory_change',
  MARKET_ALERT = 'market_alert',

  // Documents & Verification
  DOCUMENT_SHARED = 'document_shared',
  DOCUMENT_VERIFIED = 'document_verified',
  DOCUMENT_REJECTED = 'document_rejected',
  ACCOUNT_VERIFIED = 'account_verified',
  LICENSE_VERIFICATION_REQUIRED = 'license_verification_required',

  // System & Admin
  SYSTEM_ALERT = 'system_alert',
  MAINTENANCE_NOTICE = 'maintenance_notice',
  SECURITY_ALERT = 'security_alert',
  PERFORMANCE_ALERT = 'performance_alert',
}

// Notification type (previously inferred from zod schema in websocket-service)
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
  userId: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  sendNotification: (
    targetUserId: string,
    notification: Partial<Notification>
  ) => void;
  requestPermission: () => Promise<NotificationPermission>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mark notification as read (local state only)
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read (local state only)
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Delete notification (local state only)
  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id !== notificationId);
    });
  }, []);

  // Send notification - no-op without websocket backend
  const sendNotification = useCallback(
    (_targetUserId: string, _notification: Partial<Notification>) => {
      // No-op: websocket service has been removed.
      // TODO: Re-implement when a notification backend is available.
    },
    []
  );

  // Request browser notification permission
  const requestPermission =
    useCallback(async (): Promise<NotificationPermission> => {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'denied';
      }

      if (Notification.permission === 'default') {
        return await Notification.requestPermission();
      }

      return Notification.permission;
    }, []);

  return {
    notifications,
    unreadCount,
    isConnected: false,
    connectionStatus: 'disconnected',
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification,
    requestPermission,
  };
}
