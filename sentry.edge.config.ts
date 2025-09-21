import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Edge runtime performance monitoring - more conservative sampling
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.5,

  // Environment and release tracking
  environment: process.env.NODE_ENV || 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'local',

  // Debug mode off for edge runtime (limited logging capabilities)
  debug: false,

  // Edge-specific error filtering
  beforeSend(event, hint) {
    // Filter out edge runtime specific errors that are not actionable
    if (event.exception) {
      const error = hint.originalException;
      if (error instanceof Error) {
        // Filter out WebAssembly and edge runtime initialization errors
        if (error.message.includes('WebAssembly')) return null;
        if (error.message.includes('edge runtime')) return null;
      }
    }

    // Add edge context for mining operations
    if (event.request?.url) {
      if (event.request.url.includes('/api/auth')) {
        event.tags = { ...event.tags, edge_function: 'authentication' };
      }
      if (event.request.url.includes('/api/search')) {
        event.tags = { ...event.tags, edge_function: 'search_proxy' };
      }
    }

    return event;
  },

  // Edge-specific configuration
  initialScope: {
    tags: {
      component: 'qaznedr-edge',
      runtime: 'edge',
      platform: 'mining-marketplace-edge',
      region: 'kazakhstan',
    },
    contexts: {
      edge: {
        runtime: 'vercel-edge',
        features: ['auth', 'middleware', 'routing'],
      },
    },
  },

  // Minimal configuration for edge runtime constraints
  attachStacktrace: true,
  maxBreadcrumbs: 20, // Lower for edge runtime memory constraints
  normalizeDepth: 5,
});
