/**
 * Analytics and tracking utilities for QAZNEDR.KZ
 */

import { logger } from './logger';
import { config } from '@/lib/config/env';

// Analytics event interface
interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  timestamp: number;
}

// User properties interface
interface UserProperties {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  registrationDate?: string;
  lastLoginDate?: string;
}

// Analytics provider interface
interface AnalyticsProvider {
  identify(userId: string, properties?: UserProperties): void;
  track(event: string, properties?: Record<string, unknown>): void;
  page(name?: string, properties?: Record<string, unknown>): void;
  init(): void;
}

// Google Analytics implementation
class GoogleAnalytics implements AnalyticsProvider {
  private isInitialized = false;

  init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    const gaId = config.monitoring.googleAnalyticsId;
    if (!gaId) {
      logger.warn('Google Analytics ID not configured');
      return;
    }

    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    // Initialize gtag
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).gtag = function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    };

    (window as any).gtag('js', new Date());
    (window as any).gtag('config', gaId, {
      page_title: document.title,
      page_location: window.location.href,
    });

    this.isInitialized = true;
    logger.info('Google Analytics initialized');
  }

  identify(userId: string, properties?: UserProperties): void {
    if (typeof window === 'undefined' || !this.isInitialized) return;

    (window as any).gtag?.('config', config.monitoring.googleAnalyticsId, {
      user_id: userId,
      custom_map: {
        custom_dimension_1: 'user_role',
        custom_dimension_2: 'user_registration_date',
      },
    });

    if (properties) {
      (window as any).gtag?.('event', 'user_properties', {
        user_role: properties.role,
        user_registration_date: properties.registrationDate,
      });
    }
  }

  track(event: string, properties?: Record<string, unknown>): void {
    if (typeof window === 'undefined' || !this.isInitialized) return;

    (window as any).gtag?.('event', event, {
      event_category: properties?.category || 'engagement',
      event_label: properties?.label,
      value: properties?.value,
      ...properties,
    });
  }

  page(name?: string, properties?: Record<string, unknown>): void {
    if (typeof window === 'undefined' || !this.isInitialized) return;

    (window as any).gtag?.('config', config.monitoring.googleAnalyticsId, {
      page_title: name || document.title,
      page_location: window.location.href,
      ...properties,
    });
  }
}

// Yandex Metrica implementation
class YandexMetrica implements AnalyticsProvider {
  private isInitialized = false;

  init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    const ymId = config.monitoring.yandexMetricaId;
    if (!ymId) {
      logger.warn('Yandex Metrica ID not configured');
      return;
    }

    (window as any).ym =
      (window as any).ym ||
      function ym(...args: any[]) {
        ((window as any).ym.a = (window as any).ym.a || []).push(args);
      };
    (window as any).ym.l = +new Date();

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://mc.yandex.ru/metrika/tag.js';
    document.head.appendChild(script);

    (window as any).ym(parseInt(ymId), 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
    });

    this.isInitialized = true;
    logger.info('Yandex Metrica initialized');
  }

  identify(userId: string, properties?: UserProperties): void {
    if (typeof window === 'undefined' || !this.isInitialized) return;

    (window as any).ym?.(
      parseInt(config.monitoring.yandexMetricaId || '0'),
      'setUserID',
      userId
    );

    if (properties) {
      (window as any).ym?.(
        parseInt(config.monitoring.yandexMetricaId || '0'),
        'userParams',
        properties
      );
    }
  }

  track(event: string, properties?: Record<string, unknown>): void {
    if (typeof window === 'undefined' || !this.isInitialized) return;

    (window as any).ym?.(
      parseInt(config.monitoring.yandexMetricaId || '0'),
      'reachGoal',
      event,
      properties
    );
  }

  page(name?: string, properties?: Record<string, unknown>): void {
    if (typeof window === 'undefined' || !this.isInitialized) return;

    (window as any).ym?.(
      parseInt(config.monitoring.yandexMetricaId || '0'),
      'hit',
      window.location.href,
      {
        title: name || document.title,
        ...properties,
      }
    );
  }
}

// Internal analytics implementation for custom tracking
class InternalAnalytics implements AnalyticsProvider {
  private events: AnalyticsEvent[] = [];
  private userId?: string;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  init(): void {
    logger.info('Internal analytics initialized');
  }

  identify(userId: string, properties?: UserProperties): void {
    this.userId = userId;
    this.track('user_identified', properties);
  }

  track(event: string, properties?: Record<string, unknown>): void {
    const analyticsEvent: AnalyticsEvent = {
      name: event,
      properties,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    };

    this.events.push(analyticsEvent);
    
    // Keep only last 100 events in memory
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }

    // Log important events
    if (this.isImportantEvent(event)) {
      logger.info('Analytics event', analyticsEvent);
    }

    // Send to server if needed
    this.sendToServer(analyticsEvent);
  }

  page(name?: string, properties?: Record<string, unknown>): void {
    this.track('page_view', {
      page_name: name,
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      ...properties,
    });
  }

  private isImportantEvent(event: string): boolean {
    const importantEvents = [
      'user_registered',
      'user_login',
      'listing_created',
      'listing_viewed',
      'listing_favorited',
      'search_performed',
      'filter_applied',
      'error_occurred',
    ];
    return importantEvents.includes(event);
  }

  private async sendToServer(event: AnalyticsEvent): Promise<void> {
    try {
      // Only send important events to server
      if (!this.isImportantEvent(event.name)) return;

      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      logger.warn('Failed to send analytics event to server', { error, event });
    }
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

// Analytics manager that coordinates all providers
class AnalyticsManager {
  private providers: AnalyticsProvider[] = [];
  private isInitialized = false;

  init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    // Initialize providers
    if (config.monitoring.googleAnalyticsId) {
      this.providers.push(new GoogleAnalytics());
    }

    if (config.monitoring.yandexMetricaId) {
      this.providers.push(new YandexMetrica());
    }

    // Always use internal analytics
    this.providers.push(new InternalAnalytics());

    // Initialize all providers
    this.providers.forEach(provider => provider.init());

    this.isInitialized = true;
    logger.info('Analytics manager initialized with providers', {
      count: this.providers.length,
    });
  }

  identify(userId: string, properties?: UserProperties): void {
    this.providers.forEach(provider => provider.identify(userId, properties));
  }

  track(event: string, properties?: Record<string, unknown>): void {
    this.providers.forEach(provider => provider.track(event, properties));
  }

  page(name?: string, properties?: Record<string, unknown>): void {
    this.providers.forEach(provider => provider.page(name, properties));
  }
}

// Create global analytics instance
export const analytics = new AnalyticsManager();

// Utility functions for common tracking events
export const trackEvent = (event: string, properties?: Record<string, unknown>) => {
  analytics.track(event, properties);
};

export const trackPageView = (name?: string, properties?: Record<string, unknown>) => {
  analytics.page(name, properties);
};

export const identifyUser = (userId: string, properties?: UserProperties) => {
  analytics.identify(userId, properties);
};

// Mining-specific tracking functions
export const trackListingEvent = (action: string, listingId: string, listingType: string) => {
  trackEvent('listing_interaction', {
    action,
    listing_id: listingId,
    listing_type: listingType,
    category: 'listings',
  });
};

export const trackSearchEvent = (query: string, filters: Record<string, unknown>, resultsCount: number) => {
  trackEvent('search_performed', {
    query,
    filters,
    results_count: resultsCount,
    category: 'search',
  });
};

export const trackAuthEvent = (action: 'login' | 'register' | 'logout', method?: string) => {
  trackEvent(`user_${action}`, {
    method,
    category: 'authentication',
  });
};

export const trackErrorEvent = (error: Error, context?: Record<string, unknown>) => {
  trackEvent('error_occurred', {
    error_message: error.message,
    error_stack: error.stack,
    ...context,
    category: 'errors',
  });
};

// Initialize analytics on client side
if (typeof window !== 'undefined') {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => analytics.init());
  } else {
    analytics.init();
  }

  // Track page views on route changes
  let currentPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== currentPath) {
      currentPath = window.location.pathname;
      trackPageView(document.title);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Track errors
  window.addEventListener('error', (event) => {
    trackErrorEvent(new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    trackErrorEvent(new Error(event.reason), {
      type: 'unhandled_promise_rejection',
    });
  });
}