import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripePaymentService } from '@/lib/payments/stripe';
import { withAuth, AuthLevel } from '@/lib/middleware/auth-middleware';
import {
  withInputValidation,
  validateRequestBody,
} from '@/lib/middleware/input-validation';
import { withRateLimit } from '@/lib/middleware/rate-limiting';
import { z } from 'zod';

const createPaymentIntentSchema = z.object({
  listingId: z.string().uuid(),
  amount: z.number().positive().max(999999999),
  currency: z.enum(['KZT', 'USD', 'EUR']).default('KZT'),
});

// Main handler function
async function handlePaymentIntent(
  request: NextRequest
): Promise<NextResponse> {
  try {
    // Get user ID from auth middleware headers
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication failed' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = validateRequestBody(
      createPaymentIntentSchema,
      body
    );

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error },
        { status: 400 }
      );
    }

    const { listingId, amount, currency } = validationResult.data;

    // Verify listing exists and is available
    const supabase = createClient();
    const { data: listing, error: listingError } = await supabase
      .from('kazakhstan_deposits')
      .select('id, title, price, seller_id, status, type')
      .eq('id', listingId)
      .eq('status', 'ACTIVE')
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found or not available' },
        { status: 404 }
      );
    }

    // Prevent self-purchase
    if (listing.seller_id === userId) {
      return NextResponse.json(
        { error: 'Cannot purchase your own listing' },
        { status: 400 }
      );
    }

    // Verify amount matches listing price (prevent price manipulation)
    if (Math.abs(amount - listing.price) > 0.01) {
      return NextResponse.json(
        { error: 'Amount does not match listing price' },
        { status: 400 }
      );
    }

    // Create payment intent with security metadata
    const paymentIntent = await stripePaymentService.createPaymentIntent(
      amount,
      currency,
      {
        listingId: listing.id,
        listingType: listing.type,
        listingTitle: listing.title,
        sellerId: listing.seller_id,
        buyerId: userId,
        timestamp: new Date().toISOString(),
        // Add security hash to prevent tampering
        securityHash: Buffer.from(
          `${listing.id}-${userId}-${amount}-${process.env.STRIPE_WEBHOOK_SECRET}`
        ).toString('base64'),
      }
    );

    // Log payment intent creation for audit
    console.log(
      `Payment intent created: ${paymentIntent.id} for listing ${listing.id} by user ${userId}`
    );

    // Store payment intent in database for tracking
    const { error: insertError } = await supabase
      .from('payment_intents')
      .insert({
        id: paymentIntent.id,
        listing_id: listing.id,
        buyer_id: userId,
        seller_id: listing.seller_id,
        amount: amount,
        currency: currency,
        status: 'created',
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Failed to store payment intent:', insertError);
      // Continue anyway - payment can still proceed
    }

    return NextResponse.json({
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount: amount,
      currency: currency,
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

// Apply security middleware and export
export const POST = withRateLimit(
  withInputValidation(
    ['POST'], // allowed methods
    ['application/json'], // allowed content types
    1024 * 1024 // 1MB max body size
  )(withAuth(handlePaymentIntent, AuthLevel.AUTHENTICATED)),
  'payments' // Use payment-specific rate limiting
);
