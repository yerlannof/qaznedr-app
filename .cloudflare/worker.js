import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from './../.next/static/manifest.json';

// Enhanced Cloudflare Worker for Next.js App
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Add security headers
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
    };

    try {
      // Handle API routes
      if (url.pathname.startsWith('/api/')) {
        return handleAPIRoute(request, env, ctx);
      }

      // Handle static assets with KV caching
      if (isStaticAsset(url.pathname)) {
        return handleStaticAsset(request, env, ctx);
      }

      // Handle Next.js pages
      const response = await handleNextJSRoute(request, env, ctx);

      // Add security headers to response
      const newResponse = new Response(response.body, response);
      Object.entries(securityHeaders).forEach(([key, value]) => {
        newResponse.headers.set(key, value);
      });

      return newResponse;
    } catch (error) {
      return handleError(error, env);
    }
  },

  // Scheduled tasks (cron)
  async scheduled(event, env, ctx) {
    switch (event.cron) {
      case '0 2 * * *': // Daily cleanup
        await performDailyCleanup(env);
        break;
      case '*/30 * * * *': // Cache refresh
        await refreshCache(env);
        break;
    }
  },

  // Queue consumer
  async queue(batch, env, ctx) {
    for (const message of batch.messages) {
      await processQueueMessage(message, env);
      message.ack();
    }
  },
};

// API route handler
async function handleAPIRoute(request, env, ctx) {
  const url = new URL(request.url);

  // Rate limiting
  const rateLimitResult = await checkRateLimit(request, env);
  if (!rateLimitResult.ok) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': rateLimitResult.retryAfter,
      },
    });
  }

  // Forward to origin with caching
  const cacheKey = new Request(url.toString(), request);
  const cache = caches.default;

  // Check cache
  let response = await cache.match(cacheKey);

  if (!response) {
    // Forward to origin
    response = await fetch(request, {
      cf: {
        cacheEverything: true,
        cacheTtl: 300, // 5 minutes
      },
    });

    // Store in cache
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
  }

  return response;
}

// Static asset handler
async function handleStaticAsset(request, env, ctx) {
  try {
    const response = await getAssetFromKV(
      {
        request,
        waitUntil: ctx.waitUntil.bind(ctx),
      },
      {
        ASSET_NAMESPACE: env.KV_CACHE,
        ASSET_MANIFEST: manifestJSON,
        cacheControl: {
          browserTTL: 60 * 60 * 24 * 365, // 1 year
          edgeTTL: 60 * 60 * 24 * 30, // 30 days
        },
      }
    );

    return response;
  } catch (e) {
    // Fall back to origin
    return fetch(request);
  }
}

// Next.js route handler
async function handleNextJSRoute(request, env, ctx) {
  const url = new URL(request.url);

  // Add locale detection
  const locale = detectLocale(request) || 'ru';
  if (!url.pathname.startsWith(`/${locale}`)) {
    return Response.redirect(
      `${url.origin}/${locale}${url.pathname}${url.search}`,
      302
    );
  }

  // Edge-side rendering cache
  const cacheKey = `page:${url.pathname}:${url.search}`;
  const cached = await env.KV_CACHE.get(cacheKey);

  if (cached && !isAuthenticated(request)) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600',
        'X-Cache': 'HIT',
      },
    });
  }

  // Fetch from origin
  const response = await fetch(request);

  // Cache successful responses
  if (response.ok && !isAuthenticated(request)) {
    ctx.waitUntil(
      env.KV_CACHE.put(cacheKey, await response.clone().text(), {
        expirationTtl: 3600, // 1 hour
      })
    );
  }

  return response;
}

// Rate limiting
async function checkRateLimit(request, env) {
  const ip = request.headers.get('CF-Connecting-IP');
  const key = `rate:${ip}`;

  const count = await env.KV_CACHE.get(key);
  if (count && parseInt(count) > 100) {
    return { ok: false, retryAfter: '60' };
  }

  await env.KV_CACHE.put(key, (parseInt(count || '0') + 1).toString(), {
    expirationTtl: 60, // Reset every minute
  });

  return { ok: true };
}

// Error handler
function handleError(error, env) {
  console.error('Worker error:', error);

  // Log to Sentry if configured
  if (env.SENTRY_DSN) {
    // Send error to Sentry
  }

  return new Response('Internal Server Error', {
    status: 500,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

// Helper functions
function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(
    pathname
  );
}

function detectLocale(request) {
  const acceptLanguage = request.headers.get('Accept-Language');
  if (acceptLanguage) {
    if (acceptLanguage.includes('kk')) return 'kk';
    if (acceptLanguage.includes('en')) return 'en';
  }
  return 'ru';
}

function isAuthenticated(request) {
  return request.headers.get('Cookie')?.includes('next-auth.session-token');
}

// Scheduled tasks
async function performDailyCleanup(env) {
  // Clean old cache entries
  const keys = await env.KV_CACHE.list({ prefix: 'page:' });
  for (const key of keys.keys) {
    const metadata = await env.KV_CACHE.getWithMetadata(key.name);
    if (metadata && isExpired(metadata.metadata)) {
      await env.KV_CACHE.delete(key.name);
    }
  }

  // Clean old uploads from R2
  const objects = await env.R2_ASSETS.list();
  for (const object of objects.objects) {
    if (isOldUpload(object)) {
      await env.R2_ASSETS.delete(object.key);
    }
  }
}

async function refreshCache(env) {
  // Refresh critical pages
  const criticalPages = ['/', '/listings', '/kk', '/en', '/ru'];

  for (const page of criticalPages) {
    const response = await fetch(`https://qaznedr.kz${page}`);
    if (response.ok) {
      await env.KV_CACHE.put(`page:${page}:`, await response.text(), {
        expirationTtl: 7200,
      });
    }
  }
}

// Queue processing
async function processQueueMessage(message, env) {
  const data = message.body;

  switch (data.type) {
    case 'email':
      await sendEmail(data, env);
      break;
    case 'notification':
      await sendNotification(data, env);
      break;
    case 'analytics':
      await trackAnalytics(data, env);
      break;
  }
}

function isExpired(metadata) {
  return metadata.expiry && Date.now() > metadata.expiry;
}

function isOldUpload(object) {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return object.uploaded < thirtyDaysAgo && object.key.startsWith('temp/');
}
