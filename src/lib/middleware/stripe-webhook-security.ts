import { NextRequest, NextResponse } from 'next/server';

// Simple timing-safe comparison for edge runtime
function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}

// Stripe webhook security configuration
const STRIPE_WEBHOOK_CONFIG = {
  // Stripe's webhook IP ranges (as of 2024)
  allowedIPs: [
    '3.18.12.63',
    '3.130.192.231',
    '13.235.14.237',
    '13.235.122.149',
    '18.211.135.69',
    '35.154.171.200',
    '52.15.183.38',
    '54.88.130.119',
    '54.88.130.237',
    '54.187.174.169',
    '54.187.205.235',
    '54.187.216.72',
  ],
  maxBodySize: 1024 * 1024, // 1MB max
  maxRetries: 3,
  timeoutMs: 30000, // 30 seconds
  idempotencyWindow: 60 * 60 * 1000, // 1 hour
};

// Webhook event validation schema
const webhookEventSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'payment_intent.requires_action',
    'checkout.session.completed',
    'account.updated',
    'transfer.created',
    'transfer.paid',
    'transfer.failed',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
  ]),
  data: z.object({
    object: z.record(z.any()),
  }),
  created: z.number(),
  livemode: z.boolean(),
  pending_webhooks: z.number().optional(),
  request: z
    .object({
      id: z.string(),
      idempotency_key: z.string().optional(),
    })
    .optional(),
});

// Metadata validation for payment intents
const paymentMetadataSchema = z.object({
  listingId: z.string().uuid(),
  listingType: z.enum([
    'MINING_LICENSE',
    'EXPLORATION_LICENSE',
    'MINERAL_OCCURRENCE',
  ]),
  listingTitle: z.string().min(1).max(200),
  sellerId: z.string().uuid(),
  buyerId: z.string().uuid(),
  securityHash: z.string().min(1),
  timestamp: z.string().datetime(),
});

// Rate limiting for webhooks (per source IP)
const webhookRateLimit = new Map<
  string,
  { count: number; resetTime: number }
>();

// Idempotency tracking to prevent duplicate processing
const processedWebhooks = new Map<
  string,
  { timestamp: number; response: any }
>();

/**
 * Validate IP address is from Stripe
 */
function isValidStripeIP(clientIP: string): boolean {
  // In development, allow localhost
  if (
    process.env.NODE_ENV === 'development' &&
    (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === 'localhost')
  ) {
    return true;
  }

  return STRIPE_WEBHOOK_CONFIG.allowedIPs.includes(clientIP);
}

/**
 * Rate limiting for webhook endpoints
 */
function checkWebhookRateLimit(clientIP: string): {
  allowed: boolean;
  resetTime?: number;
} {
  const now = Date.now();
  const key = `webhook:${clientIP}`;
  const limit = webhookRateLimit.get(key);

  // Clean up expired entries
  if (limit && now > limit.resetTime) {
    webhookRateLimit.delete(key);
  }

  const currentLimit = webhookRateLimit.get(key);

  if (currentLimit) {
    if (currentLimit.count >= 100) {
      // 100 webhooks per 5 minutes
      return { allowed: false, resetTime: currentLimit.resetTime };
    }
    currentLimit.count++;
  } else {
    webhookRateLimit.set(key, {
      count: 1,
      resetTime: now + 5 * 60 * 1000, // 5 minutes
    });
  }

  return { allowed: true };
}

/**
 * Check idempotency to prevent duplicate webhook processing
 */
function checkIdempotency(webhookId: string): {
  isDuplicate: boolean;
  cachedResponse?: any;
} {
  const now = Date.now();

  // Clean up expired entries
  for (const [key, value] of processedWebhooks.entries()) {
    if (now - value.timestamp > STRIPE_WEBHOOK_CONFIG.idempotencyWindow) {
      processedWebhooks.delete(key);
    }
  }

  const existing = processedWebhooks.get(webhookId);
  if (existing) {
    return { isDuplicate: true, cachedResponse: existing.response };
  }

  return { isDuplicate: false };
}

/**
 * Store successful webhook processing for idempotency
 */
function storeWebhookResult(webhookId: string, response: any): void {
  processedWebhooks.set(webhookId, {
    timestamp: Date.now(),
    response,
  });
}

/**
 * Validate security hash in payment metadata
 */
function validateSecurityHash(metadata: any): boolean {
  if (!metadata.securityHash || !metadata.listingId || !metadata.buyerId) {
    return false;
  }

  // Reconstruct the expected hash
  const expectedHash = Buffer.from(
    `${metadata.listingId}-${metadata.buyerId}-${metadata.amount || 0}-${process.env.STRIPE_WEBHOOK_SECRET}`
  ).toString('base64');

  return timingSafeEqual(
    Buffer.from(metadata.securityHash, 'base64'),
    Buffer.from(expectedHash, 'base64')
  );
}

/**
 * Comprehensive webhook security middleware
 */
export function withStripeWebhookSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async function secureWebhookHandler(
    req: NextRequest
  ): Promise<NextResponse> {
    try {
      // Get client IP
      const clientIP =
        req.headers.get('x-forwarded-for')?.split(',')[0] ||
        req.headers.get('x-real-ip') ||
        req.ip ||
        'unknown';

      // 1. Validate IP address
      if (!isValidStripeIP(clientIP)) {
        console.warn(`Webhook request from unauthorized IP: ${clientIP}`);
        return NextResponse.json(
          { error: 'Unauthorized' },
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              'X-Content-Type-Options': 'nosniff',
            },
          }
        );
      }

      // 2. Check rate limiting
      const rateLimit = checkWebhookRateLimit(clientIP);
      if (!rateLimit.allowed) {
        console.warn(`Rate limit exceeded for webhook from IP: ${clientIP}`);
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil(
                (rateLimit.resetTime! - Date.now()) / 1000
              ).toString(),
              'X-RateLimit-Limit': '100',
              'X-RateLimit-Reset': new Date(rateLimit.resetTime!).toISOString(),
            },
          }
        );
      }

      // 3. Validate request method
      if (req.method !== 'POST') {
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
      }

      // 4. Check content length
      const contentLength = parseInt(req.headers.get('content-length') || '0');
      if (contentLength > STRIPE_WEBHOOK_CONFIG.maxBodySize) {
        console.warn(
          `Webhook payload too large: ${contentLength} bytes from ${clientIP}`
        );
        return NextResponse.json(
          { error: 'Payload too large' },
          { status: 413 }
        );
      }

      // 5. Validate required headers
      const stripeSignature = req.headers.get('stripe-signature');
      const webhookId = req.headers.get('stripe-webhook-id');

      if (!stripeSignature) {
        console.warn(`Missing Stripe signature from ${clientIP}`);
        return NextResponse.json(
          { error: 'Missing signature' },
          { status: 400 }
        );
      }

      // 6. Check idempotency if webhook ID is provided
      if (webhookId) {
        const { isDuplicate, cachedResponse } = checkIdempotency(webhookId);
        if (isDuplicate) {
          console.log(`Duplicate webhook detected: ${webhookId}`);
          return NextResponse.json(cachedResponse || { received: true });
        }
      }

      // 7. Validate webhook timestamp (prevent replay attacks)
      const timestamp = req.headers.get('stripe-timestamp');
      if (timestamp) {
        const webhookTime = parseInt(timestamp) * 1000;
        const now = Date.now();
        const timeDiff = Math.abs(now - webhookTime);

        // Reject webhooks older than 5 minutes
        if (timeDiff > 5 * 60 * 1000) {
          console.warn(`Webhook timestamp too old: ${timeDiff}ms difference`);
          return NextResponse.json(
            { error: 'Timestamp too old' },
            { status: 400 }
          );
        }
      }

      // Execute the handler with timeout
      const timeoutPromise = new Promise<NextResponse>((_, reject) => {
        setTimeout(
          () => reject(new Error('Webhook timeout')),
          STRIPE_WEBHOOK_CONFIG.timeoutMs
        );
      });

      const handlerPromise = handler(req);
      const response = await Promise.race([handlerPromise, timeoutPromise]);

      // Store successful result for idempotency
      if (webhookId && response.status >= 200 && response.status < 300) {
        storeWebhookResult(webhookId, { received: true });
      }

      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('Cache-Control', 'no-store');

      return response;
    } catch (error) {
      console.error('Webhook security middleware error:', error);

      // Don't leak error details to external callers
      return NextResponse.json(
        { error: 'Webhook processing failed' },
        {
          status: 500,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          },
        }
      );
    }
  };
}

/**
 * Validate webhook event structure and metadata
 */
export function validateWebhookEvent(event: any): {
  isValid: boolean;
  errors: string[];
  sanitizedEvent?: any;
} {
  const errors: string[] = [];

  try {
    // Validate basic event structure
    const validatedEvent = webhookEventSchema.parse(event);

    // Additional validation for payment intents
    if (validatedEvent.type.startsWith('payment_intent.')) {
      const paymentIntent = validatedEvent.data.object;

      // Validate metadata if present
      if (paymentIntent.metadata) {
        try {
          const validatedMetadata = paymentMetadataSchema.parse(
            paymentIntent.metadata
          );

          // Validate security hash
          if (!validateSecurityHash(validatedMetadata)) {
            errors.push('Invalid security hash in metadata');
          }

          // Validate timestamp (not too old)
          const metadataTime = new Date(validatedMetadata.timestamp).getTime();
          const now = Date.now();
          if (now - metadataTime > 24 * 60 * 60 * 1000) {
            // 24 hours
            errors.push('Metadata timestamp too old');
          }
        } catch (metadataError) {
          errors.push('Invalid payment metadata structure');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedEvent: validatedEvent,
    };
  } catch (validationError) {
    if (validationError instanceof z.ZodError) {
      errors.push(
        ...validationError.errors.map(
          (e) => `${e.path.join('.')}: ${e.message}`
        )
      );
    } else {
      errors.push('Invalid webhook event structure');
    }

    return { isValid: false, errors };
  }
}

/**
 * Log webhook activity for security monitoring
 */
export function logWebhookActivity(
  eventType: string,
  clientIP: string,
  success: boolean,
  errorDetails?: string
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'webhook_activity',
    eventType,
    clientIP,
    success,
    errorDetails,
    userAgent: 'Stripe-Webhook',
  };

  console.log('Webhook Activity:', JSON.stringify(logEntry));

  // In production, you might want to send this to a security monitoring service
  if (!success && errorDetails) {
    console.warn(
      `Webhook security violation: ${errorDetails} from ${clientIP}`
    );
  }
}

// Export configuration for testing and monitoring
export { STRIPE_WEBHOOK_CONFIG, webhookEventSchema, paymentMetadataSchema };
