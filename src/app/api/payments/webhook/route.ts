import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripePaymentService } from '@/lib/payments/stripe';
import { createClient } from '@/lib/supabase/server';
import {
  withStripeWebhookSecurity,
  validateWebhookEvent,
  logWebhookActivity,
} from '@/lib/middleware/stripe-webhook-security';
import { applySecurityHeaders } from '@/lib/middleware/security-headers';
import Stripe from 'stripe';

// Disable body parsing for raw webhook payload
export const runtime = 'edge';

// Main webhook handler with comprehensive security
async function handleSecureWebhook(
  request: NextRequest
): Promise<NextResponse> {
  const clientIP =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown';

  try {
    // Get raw body and signature
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    // Additional signature validation
    if (!signature) {
      logWebhookActivity(
        'unknown',
        clientIP,
        false,
        'Missing stripe signature'
      );
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature and get event
    const { received, event } = await stripePaymentService.handleWebhook(
      body,
      signature
    );

    if (!received || !event) {
      logWebhookActivity(
        'unknown',
        clientIP,
        false,
        'Webhook signature verification failed'
      );
      return NextResponse.json(
        { error: 'Webhook verification failed' },
        { status: 400 }
      );
    }

    // Validate webhook event structure and metadata
    const { isValid, errors, sanitizedEvent } = validateWebhookEvent(event);
    if (!isValid) {
      logWebhookActivity(
        event.type,
        clientIP,
        false,
        `Validation failed: ${errors.join(', ')}`
      );
      return NextResponse.json(
        { error: 'Invalid webhook event' },
        { status: 400 }
      );
    }

    // Log successful webhook reception
    logWebhookActivity(event.type, clientIP, true);

    const supabase = await createClient();

    // Process different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Update payment record
        await supabase
          .from('payment_attempts')
          .update({
            status: 'succeeded',
            completed_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        // Update listing status to sold
        if (paymentIntent.metadata.listingId) {
          await supabase
            .from('kazakhstan_deposits')
            .update({
              status: 'SOLD',
              sold_at: new Date().toISOString(),
              buyer_id: paymentIntent.metadata.buyerId,
            })
            .eq('id', paymentIntent.metadata.listingId);

          // Create transaction record
          await supabase.from('transactions').insert({
            listing_id: paymentIntent.metadata.listingId,
            seller_id: paymentIntent.metadata.sellerId,
            buyer_id: paymentIntent.metadata.buyerId,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency.toUpperCase(),
            platform_fee: parseInt(paymentIntent.metadata.platformFee) / 100,
            seller_proceeds:
              parseInt(paymentIntent.metadata.sellerAmount) / 100,
            stripe_payment_intent_id: paymentIntent.id,
            status: 'completed',
          });

          // Create notifications
          await createNotifications(
            supabase,
            paymentIntent.metadata.sellerId,
            paymentIntent.metadata.buyerId,
            paymentIntent.metadata.listingTitle
          );
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Update payment record
        await supabase
          .from('payment_attempts')
          .update({
            status: 'failed',
            failed_at: new Date().toISOString(),
            error_message: paymentIntent.last_payment_error?.message,
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        // Notify buyer of failure
        if (paymentIntent.metadata.buyerId) {
          await supabase.from('notifications').insert({
            user_id: paymentIntent.metadata.buyerId,
            type: 'payment_failed',
            title: 'Payment Failed',
            message: `Your payment for "${paymentIntent.metadata.listingTitle}" could not be processed.`,
            data: {
              listingId: paymentIntent.metadata.listingId,
              error: paymentIntent.last_payment_error?.message,
            },
          });
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Process successful checkout
        if (session.payment_status === 'paid' && session.metadata) {
          // Update listing and create transaction
          await supabase
            .from('kazakhstan_deposits')
            .update({
              status: 'PENDING_TRANSFER',
              sold_at: new Date().toISOString(),
            })
            .eq('id', session.metadata.listingId);

          // Log checkout completion
          await supabase.from('checkout_sessions').insert({
            session_id: session.id,
            listing_id: session.metadata.listingId,
            buyer_id: session.metadata.buyerId,
            seller_id: session.metadata.sellerId,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency?.toUpperCase(),
            status: 'completed',
          });
        }
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;

        // Update seller account status
        await supabase
          .from('seller_accounts')
          .update({
            stripe_account_id: account.id,
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_account_id', account.id);
        break;
      }

      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer;

        // Log transfer to seller
        await supabase.from('transfers').insert({
          stripe_transfer_id: transfer.id,
          amount: transfer.amount / 100,
          currency: transfer.currency.toUpperCase(),
          destination: transfer.destination as string,
          status: 'pending',
        });
        break;
      }

      case 'transfer.paid': {
        const transfer = event.data.object as Stripe.Transfer;

        // Update transfer status
        await supabase
          .from('transfers')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('stripe_transfer_id', transfer.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success response with security headers
    const response = NextResponse.json({ received: true });
    return applySecurityHeaders(response, {
      contentSecurityPolicy: { enabled: false }, // APIs don't need CSP
      xFrameOptions: 'DENY',
      crossOriginResourcePolicy: 'same-origin',
    });
  } catch (error) {
    // Log error securely without exposing sensitive details
    console.error('Webhook processing error:', {
      type: event?.type || 'unknown',
      timestamp: new Date().toISOString(),
      clientIP,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    logWebhookActivity(
      event?.type || 'unknown',
      clientIP,
      false,
      'Internal processing error'
    );

    // Return generic error response with security headers
    const errorResponse = NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );

    return applySecurityHeaders(errorResponse, {
      contentSecurityPolicy: { enabled: false },
      xFrameOptions: 'DENY',
    });
  }
}

// Export the secured webhook handler
export const POST = withStripeWebhookSecurity(handleSecureWebhook);

async function createNotifications(
  supabase: any,
  sellerId: string,
  buyerId: string,
  listingTitle: string
) {
  // Notify seller
  await supabase.from('notifications').insert({
    user_id: sellerId,
    type: 'sale_completed',
    title: 'Your listing has been sold!',
    message: `Congratulations! "${listingTitle}" has been purchased.`,
    data: {
      buyerId,
      listingTitle,
    },
  });

  // Notify buyer
  await supabase.from('notifications').insert({
    user_id: buyerId,
    type: 'purchase_completed',
    title: 'Purchase successful!',
    message: `You have successfully purchased "${listingTitle}".`,
    data: {
      sellerId,
      listingTitle,
    },
  });
}
