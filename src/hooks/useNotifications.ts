import { useState, useEffect, useCallback, useRef } from 'react';
import {
  wsNotificationService,
  Notification,
  NotificationType,
} from '@/lib/notifications/websocket-service';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@supabase/auth-helpers-react';

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
  const user = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected' | 'reconnecting'
  >('disconnected');
  const supabase = createClient();
  const isInitialized = useRef(false);

  // Load initial notifications from database
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        const formattedNotifications: Notification[] = data.map((n) => ({
          id: n.id,
          type: n.type as NotificationType,
          title: n.title,
          message: n.message,
          data: n.data || {},
          read: n.read || false,
          createdAt: n.created_at,
          userId: n.user_id,
          actionUrl: n.action_url,
          priority: n.priority || 'medium',
        }));

        setNotifications(formattedNotifications);
        setUnreadCount(formattedNotifications.filter((n) => !n.read).length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [user?.id, supabase]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user?.id || isInitialized.current) return;

    const initializeWebSocket = async () => {
      try {
        // Get auth token
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        // Connect to WebSocket
        wsNotificationService.connect(user.id, session.access_token);

        // Setup event handlers
        wsNotificationService.on('onConnect', () => {
          setIsConnected(true);
          setConnectionStatus('connected');
        });

        wsNotificationService.on('onDisconnect', () => {
          setIsConnected(false);
          setConnectionStatus('disconnected');
        });

        wsNotificationService.on('onStatusChange', (status) => {
          setConnectionStatus(status);
        });

        wsNotificationService.on('onNotification', (notification) => {
          handleNewNotification(notification);
        });

        wsNotificationService.on('onError', (error) => {
          console.error('WebSocket error:', error);
        });

        isInitialized.current = true;
      } catch (error) {
        console.error('Error initializing WebSocket:', error);
      }
    };

    initializeWebSocket();
    loadNotifications();

    // Cleanup on unmount
    return () => {
      if (isInitialized.current) {
        wsNotificationService.disconnect();
        isInitialized.current = false;
      }
    };
  }, [user?.id, supabase, loadNotifications]);

  // Handle new notification
  const handleNewNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount((prev) => prev + 1);
    }

    // Show toast notification (using your preferred toast library)
    showToastNotification(notification);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        // Update in database
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId);

        // Update WebSocket
        wsNotificationService.markAsRead(notificationId);

        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    },
    [supabase]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Update in database
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      // Update WebSocket
      wsNotificationService.markAllAsRead();

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user?.id, supabase]);

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        // Delete from database
        await supabase.from('notifications').delete().eq('id', notificationId);

        // Update WebSocket
        wsNotificationService.deleteNotification(notificationId);

        // Update local state
        setNotifications((prev) => {
          const notification = prev.find((n) => n.id === notificationId);
          if (notification && !notification.read) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }
          return prev.filter((n) => n.id !== notificationId);
        });
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    },
    [supabase]
  );

  // Send notification to another user
  const sendNotification = useCallback(
    (targetUserId: string, notification: Partial<Notification>) => {
      wsNotificationService.sendNotification(targetUserId, {
        type: notification.type || NotificationType.SYSTEM_ALERT,
        title: notification.title || 'New Notification',
        message: notification.message || '',
        data: notification.data,
        read: false,
        actionUrl: notification.actionUrl,
        priority: notification.priority || 'medium',
      });
    },
    []
  );

  // Request browser notification permission
  const requestPermission =
    useCallback(async (): Promise<NotificationPermission> => {
      if (!('Notification' in window)) {
        console.warn('Browser does not support notifications');
        return 'denied';
      }

      if (Notification.permission === 'default') {
        return await Notification.requestPermission();
      }

      return Notification.permission;
    }, []);

  // Setup Supabase real-time subscription as fallback
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            const notification: Notification = {
              id: payload.new.id,
              type: payload.new.type as NotificationType,
              title: payload.new.title,
              message: payload.new.message,
              data: payload.new.data || {},
              read: payload.new.read || false,
              createdAt: payload.new.created_at,
              userId: payload.new.user_id,
              actionUrl: payload.new.action_url,
              priority: payload.new.priority || 'medium',
            };
            handleNewNotification(notification);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, supabase, handleNewNotification]);

  return {
    notifications,
    unreadCount,
    isConnected,
    connectionStatus,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification,
    requestPermission,
  };
}

// Helper function to show toast notifications
function showToastNotification(notification: Notification) {
  // This would integrate with your toast library
  // Example with a hypothetical toast library:
  if (typeof window !== 'undefined' && 'showToast' in window) {
    (window as any).showToast({
      title: notification.title,
      message: notification.message,
      type: getToastType(notification.type),
      duration: notification.priority === 'urgent' ? 0 : 5000,
      action: notification.actionUrl
        ? {
            label: 'View',
            onClick: () => (window.location.href = notification.actionUrl!),
          }
        : undefined,
    });
  }
}

function getToastType(
  type: NotificationType
): 'success' | 'error' | 'warning' | 'info' {
  switch (type) {
    case NotificationType.PAYMENT_SUCCESS:
    case NotificationType.SALE_COMPLETED:
    case NotificationType.PURCHASE_COMPLETED:
    case NotificationType.ACCOUNT_VERIFIED:
      return 'success';
    case NotificationType.PAYMENT_FAILED:
      return 'error';
    case NotificationType.PRICE_DROP:
    case NotificationType.SYSTEM_ALERT:
      return 'warning';
    default:
      return 'info';
  }
}
