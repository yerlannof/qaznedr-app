import { io, Socket } from 'socket.io-client';
import { z } from 'zod';
import {
  sentryMiningService,
  MiningErrorType,
  MiningMetric,
} from '@/lib/monitoring/sentry-service';

// Notification types
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

// Notification schema
const notificationSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(NotificationType),
  title: z.string(),
  message: z.string(),
  data: z.record(z.any()).optional(),
  read: z.boolean().default(false),
  createdAt: z.string(),
  userId: z.string().uuid(),
  actionUrl: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

export type Notification = z.infer<typeof notificationSchema>;

interface WebSocketEvents {
  onConnect: () => void;
  onDisconnect: () => void;
  onNotification: (notification: Notification) => void;
  onError: (error: Error) => void;
  onStatusChange: (
    status: 'connected' | 'disconnected' | 'reconnecting'
  ) => void;
}

export class WebSocketNotificationService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Partial<WebSocketEvents> = {};
  private notificationQueue: Notification[] = [];
  private isOnline = true;

  constructor() {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));

      // Listen for visibility changes to pause/resume connection
      document.addEventListener(
        'visibilitychange',
        this.handleVisibilityChange.bind(this)
      );
    }
  }

  /**
   * Connect to WebSocket server
   */
  connect(userId: string, authToken: string): void {
    if (this.socket?.connected) {
      console.log('Already connected to WebSocket');
      return;
    }

    this.userId = userId;

    // Initialize Socket.IO connection
    this.socket = io(
      process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001',
      {
        auth: {
          token: authToken,
          userId,
        },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        transports: ['websocket', 'polling'],
      }
    );

    this.setupEventListeners();
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.reconnectAttempts = 0;

      // Track successful WebSocket connection
      sentryMiningService.addMiningBreadcrumb(
        'WebSocket connected successfully',
        'api',
        { userId: this.userId, reconnectAttempts: this.reconnectAttempts }
      );

      this.eventHandlers.onConnect?.();
      this.eventHandlers.onStatusChange?.('connected');

      // Process queued notifications
      this.processNotificationQueue();

      // Join user room
      this.socket?.emit('join-room', this.userId);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');

      // Track WebSocket disconnection
      sentryMiningService.addMiningBreadcrumb('WebSocket disconnected', 'api', {
        userId: this.userId,
        reconnectAttempts: this.reconnectAttempts,
      });

      this.eventHandlers.onDisconnect?.();
      this.eventHandlers.onStatusChange?.('disconnected');
    });

    this.socket.on('reconnecting', (attempt: number) => {
      console.log(`Reconnecting... Attempt ${attempt}`);
      this.reconnectAttempts = attempt;

      // Track reconnection attempts
      sentryMiningService.addMiningBreadcrumb(
        `WebSocket reconnecting - attempt ${attempt}`,
        'api',
        { userId: this.userId, attempt, maxAttempts: this.maxReconnectAttempts }
      );

      // Alert if too many reconnection attempts
      if (attempt > 3) {
        sentryMiningService.captureError(
          new Error(
            `WebSocket reconnection attempt ${attempt}/${this.maxReconnectAttempts}`
          ),
          MiningErrorType.EXTERNAL_API_ERROR,
          { userId: this.userId },
          'warning'
        );
      }

      this.eventHandlers.onStatusChange?.('reconnecting');
    });

    // Notification events
    this.socket.on('notification', (data: unknown) => {
      try {
        const notification = notificationSchema.parse(data);
        this.handleNotification(notification);
      } catch (error) {
        console.error('Invalid notification received:', error);
      }
    });

    // Bulk notifications
    this.socket.on('notifications:bulk', (notifications: unknown[]) => {
      notifications.forEach((data) => {
        try {
          const notification = notificationSchema.parse(data);
          this.handleNotification(notification);
        } catch (error) {
          console.error('Invalid notification in bulk:', error);
        }
      });
    });

    // Error handling
    this.socket.on('error', (error: Error) => {
      console.error('WebSocket error:', error);

      // Capture WebSocket errors
      sentryMiningService.captureError(
        error,
        MiningErrorType.EXTERNAL_API_ERROR,
        {
          userId: this.userId,
          socketConnected: this.socket?.connected || false,
          reconnectAttempts: this.reconnectAttempts,
        }
      );

      this.eventHandlers.onError?.(error);
    });

    // Custom events
    this.socket.on('notification:read', (notificationId: string) => {
      // Update local notification state
      this.markAsReadLocally(notificationId);
    });

    this.socket.on('notification:deleted', (notificationId: string) => {
      // Remove notification from local state
      this.removeNotificationLocally(notificationId);
    });

    // Typing indicators for messages
    this.socket.on(
      'user:typing',
      ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
        // Handle typing indicator
        console.log(`User ${userId} is ${isTyping ? 'typing' : 'not typing'}`);
      }
    );

    // Presence updates
    this.socket.on(
      'presence:update',
      (presence: Record<string, 'online' | 'offline' | 'away'>) => {
        // Update user presence state
        console.log('Presence update:', presence);
      }
    );
  }

  /**
   * Handle incoming notification
   */
  private handleNotification(notification: Notification): void {
    // Track notification received
    sentryMiningService.addMiningBreadcrumb(
      `Notification received: ${notification.type}`,
      'api',
      {
        notificationId: notification.id,
        type: notification.type,
        priority: notification.priority,
        userId: this.userId,
      }
    );

    // Check if notification should be shown
    if (!this.shouldShowNotification(notification)) {
      sentryMiningService.addMiningBreadcrumb(
        `Notification filtered: ${notification.type}`,
        'api',
        { notificationId: notification.id, reason: 'user_preferences' }
      );
      return;
    }

    // Call event handler
    this.eventHandlers.onNotification?.(notification);

    // Show browser notification if permitted
    this.showBrowserNotification(notification);

    // Play sound for high priority notifications
    if (
      notification.priority === 'high' ||
      notification.priority === 'urgent'
    ) {
      this.playNotificationSound();
    }

    // Track notification metrics
    sentryMiningService.trackMetric(
      MiningMetric.API_REQUEST_PROCESSED,
      1,
      {
        userId: this.userId,
      },
      {
        notification_type: notification.type,
        priority: notification.priority,
        delivery_method: 'websocket',
      }
    );
  }

  /**
   * Check if notification should be shown
   */
  private shouldShowNotification(notification: Notification): boolean {
    // Check user preferences (would be loaded from settings)
    const preferences = this.getUserNotificationPreferences();

    // Check if notification type is enabled
    if (!preferences[notification.type]) {
      return false;
    }

    // Check do not disturb mode
    if (this.isDoNotDisturbActive()) {
      return notification.priority === 'urgent';
    }

    return true;
  }

  /**
   * Show browser notification
   */
  private async showBrowserNotification(
    notification: Notification
  ): Promise<void> {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: notification.id,
        data: notification,
        requireInteraction: notification.priority === 'urgent',
      });

      browserNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        browserNotification.close();
      };
    }
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch((error) => {
      console.error('Failed to play notification sound:', error);
    });
  }

  /**
   * Send notification to other users
   */
  sendNotification(
    targetUserId: string,
    notification: Omit<Notification, 'id' | 'createdAt' | 'userId'>
  ): void {
    if (!this.socket?.connected) {
      // Queue notification if not connected
      this.queueNotification({
        ...notification,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        userId: targetUserId,
      });
      return;
    }

    this.socket.emit('notification:send', {
      targetUserId,
      notification,
    });
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    if (!this.socket?.connected) {
      console.warn('Cannot mark as read: Not connected');
      return;
    }

    this.socket.emit('notification:read', notificationId);
    this.markAsReadLocally(notificationId);
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    if (!this.socket?.connected) {
      console.warn('Cannot mark all as read: Not connected');
      return;
    }

    this.socket.emit('notification:read-all');
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string): void {
    if (!this.socket?.connected) {
      console.warn('Cannot delete notification: Not connected');
      return;
    }

    this.socket.emit('notification:delete', notificationId);
    this.removeNotificationLocally(notificationId);
  }

  /**
   * Subscribe to events
   */
  on<K extends keyof WebSocketEvents>(
    event: K,
    handler: WebSocketEvents[K]
  ): void {
    this.eventHandlers[event] = handler;
  }

  /**
   * Unsubscribe from events
   */
  off<K extends keyof WebSocketEvents>(event: K): void {
    delete this.eventHandlers[event];
  }

  /**
   * Update user presence
   */
  updatePresence(status: 'online' | 'away' | 'busy'): void {
    if (!this.socket?.connected) return;

    this.socket.emit('presence:update', status);
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(recipientId: string, isTyping: boolean): void {
    if (!this.socket?.connected) return;

    this.socket.emit('typing:update', {
      recipientId,
      isTyping,
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.userId = null;
    this.notificationQueue = [];
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    this.isOnline = true;
    if (this.userId && !this.socket?.connected) {
      // Reconnect when coming back online
      this.reconnect();
    }
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    this.isOnline = false;
  }

  /**
   * Handle visibility change
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Reduce activity when tab is hidden
      this.updatePresence('away');
    } else {
      // Resume normal activity
      this.updatePresence('online');
      // Request any missed notifications
      this.requestMissedNotifications();
    }
  }

  /**
   * Reconnect to server
   */
  private reconnect(): void {
    if (!this.userId || !this.isOnline) return;

    // Implement exponential backoff
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000
    );

    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, delay);
  }

  /**
   * Request missed notifications
   */
  private requestMissedNotifications(): void {
    if (!this.socket?.connected) return;

    const lastNotificationTime = this.getLastNotificationTime();
    this.socket.emit('notification:get-missed', lastNotificationTime);
  }

  /**
   * Queue notification for later delivery
   */
  private queueNotification(notification: Notification): void {
    this.notificationQueue.push(notification);
    // Limit queue size
    if (this.notificationQueue.length > 100) {
      this.notificationQueue.shift();
    }
  }

  /**
   * Process queued notifications
   */
  private processNotificationQueue(): void {
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      if (notification) {
        this.handleNotification(notification);
      }
    }
  }

  // Helper methods
  private getUserNotificationPreferences(): Record<NotificationType, boolean> {
    // This would typically load from user settings
    return Object.values(NotificationType).reduce(
      (acc, type) => {
        acc[type] = true;
        return acc;
      },
      {} as Record<NotificationType, boolean>
    );
  }

  private isDoNotDisturbActive(): boolean {
    // Check if DND is active based on user settings or time
    const now = new Date();
    const hours = now.getHours();
    // Example: DND between 10 PM and 8 AM
    return hours >= 22 || hours < 8;
  }

  private markAsReadLocally(notificationId: string): void {
    // Update local notification state
    // This would update your React state or store
  }

  private removeNotificationLocally(notificationId: string): void {
    // Remove notification from local state
    // This would update your React state or store
  }

  private getLastNotificationTime(): string {
    // Get the timestamp of the last received notification
    // This would be stored in local storage or state
    return (
      localStorage.getItem('lastNotificationTime') ||
      new Date(Date.now() - 3600000).toISOString()
    );
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const wsNotificationService = new WebSocketNotificationService();
