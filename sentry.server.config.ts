import * as Sentry from '@sentry/nextjs';
import { ProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring - lower in production for cost efficiency
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Profiling for performance optimization
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,

  // Environment and release tracking
  environment: process.env.NODE_ENV || 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'local',

  // Debug mode only in development
  debug: process.env.NODE_ENV === 'development',

  // Enhanced error filtering for server-side
  beforeSend(event, hint) {
    // Filter out non-critical errors in production
    if (process.env.NODE_ENV === 'production') {
      if (event.level === 'debug') return null;

      // Filter out known database connection retries (these are handled)
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error) {
          if (error.message.includes('connection timeout')) return null;
          if (error.message.includes('ECONNRESET')) return null;
          if (error.message.includes('rate limit')) return null;
        }
      }
    }

    // Add server-side mining context
    if (event.request?.url) {
      // Add mining operation tags
      if (event.request.url.includes('/api/listings')) {
        event.tags = { ...event.tags, api_type: 'listings_management' };
      }
      if (event.request.url.includes('/api/search')) {
        event.tags = { ...event.tags, api_type: 'search_engine' };
      }
      if (event.request.url.includes('/api/admin/')) {
        event.tags = { ...event.tags, api_type: 'admin_panel' };
      }
      if (event.request.url.includes('/api/auth')) {
        event.tags = { ...event.tags, api_type: 'authentication' };
      }
    }

    return event;
  },

  // Transaction filtering with server-side context
  beforeSendTransaction(event) {
    // Skip health checks and monitoring endpoints
    if (event.transaction?.includes('/api/health')) return null;
    if (event.transaction?.includes('/api/metrics')) return null;

    // Add performance context for mining operations
    if (event.transaction?.includes('/api/listings')) {
      event.tags = {
        ...event.tags,
        operation_type: 'listing_crud',
        business_impact: 'high', // Listings are core business functionality
      };
    }

    if (event.transaction?.includes('/api/search')) {
      event.tags = {
        ...event.tags,
        operation_type: 'search_query',
        business_impact: 'high', // Search is critical for user experience
      };
    }

    if (event.transaction?.includes('/api/admin/transactions')) {
      event.tags = {
        ...event.tags,
        operation_type: 'transaction_management',
        business_impact: 'critical', // Transaction integrity is critical
      };
    }

    return event;
  },

  // Enhanced integrations for server monitoring
  integrations: [
    new ProfilingIntegration(),
    // Add custom integration for database monitoring
    {
      name: 'DatabaseMonitoring',
      setupOnce: () => {
        // This will be used to monitor database operations
        console.log('🔍 Database monitoring integration initialized');
      },
    },
  ],

  // Server-specific configuration
  initialScope: {
    tags: {
      component: 'qaznedr-server',
      platform: 'mining-marketplace-api',
      region: 'kazakhstan',
    },
    contexts: {
      runtime: {
        name: 'Node.js',
        version: process.version,
      },
      server: {
        type: 'api_server',
        features: ['listings', 'search', 'auth', 'transactions'],
        database: 'supabase',
        cache: 'redis',
        search_engine: 'elasticsearch',
      },
    },
  },

  // Error capture settings
  attachStacktrace: true,
  maxBreadcrumbs: 100, // More breadcrumbs for server debugging
  normalizeDepth: 10,

  // Spotlight for development debugging
  spotlight: process.env.NODE_ENV === 'development',
});
