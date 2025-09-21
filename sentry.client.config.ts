import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,

  // Debug mode only in development
  debug: process.env.NODE_ENV === 'development',

  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // Ignore certain errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    // Network errors
    'NetworkError',
    'Network request failed',
    // User cancellations
    'AbortError',
    'cancelled',
  ],

  // Enhanced error filtering
  beforeSend(event, hint) {
    // Filter out development errors in production
    if (process.env.NODE_ENV === 'production') {
      if (event.level === 'debug') return null;

      // Filter out known third-party errors
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error) {
          // Filter out extension errors
          if (error.message.includes('Extension context invalidated'))
            return null;
          // Filter out network errors we can't control
          if (
            error.message.includes('NetworkError') ||
            error.message.includes('fetch')
          )
            return null;
        }
      }
    }

    // Add mining-specific context
    if (event.request?.url) {
      if (event.request.url.includes('/listings/')) {
        event.tags = { ...event.tags, feature: 'listings' };
      }
      if (event.request.url.includes('/search/')) {
        event.tags = { ...event.tags, feature: 'search' };
      }
      if (event.request.url.includes('/dashboard/')) {
        event.tags = { ...event.tags, feature: 'dashboard' };
      }
    }

    return event;
  },

  // Filter transactions with enhanced mining context
  beforeSendTransaction(event) {
    // Don't send transactions for health checks
    if (event.transaction?.includes('/api/health')) return null;

    // Add mining operation context
    if (event.transaction?.includes('/api/listings')) {
      event.tags = { ...event.tags, operation_type: 'mining_listing' };
    }
    if (event.transaction?.includes('/api/search')) {
      event.tags = { ...event.tags, operation_type: 'search_operation' };
    }
    if (event.transaction?.includes('/api/admin/')) {
      event.tags = { ...event.tags, operation_type: 'admin_operation' };
    }

    return event;
  },

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      maskAllInputs: true,
      blockAllMedia: false,
      networkDetailAllowUrls: [window.location.origin],
      networkCaptureBodies: true,
      networkRequestHeaders: ['X-Request-Id'],
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Additional options
  normalizeDepth: 10,
  maxBreadcrumbs: 50,
  attachStacktrace: true,

  // Custom tags for Kazakhstan mining platform
  initialScope: {
    tags: {
      component: 'qaznedr-client',
      locale:
        typeof window !== 'undefined' ? window.navigator.language : 'unknown',
      platform: 'mining-marketplace',
      region: 'kazakhstan',
    },
    contexts: {
      app: {
        name: 'QAZNEDR.KZ',
        version: process.env.npm_package_version || '1.0.0',
        platform: 'web',
      },
      business: {
        type: 'mining_marketplace',
        supported_regions: [
          'almaty',
          'nur-sultan',
          'shymkent',
          'atyrau',
          'mangistau',
        ],
        listing_types: [
          'mining_license',
          'exploration_license',
          'mineral_occurrence',
        ],
      },
    },
  },
});
