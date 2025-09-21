import Stripe from 'stripe';
import { z } from 'zod';

// Initialize Stripe with API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Payment amount validation
const paymentAmountSchema = z.object({
  amount: z.number().positive().max(999999999), // Max $9,999,999.99
  currency: z.enum(['KZT', 'USD', 'EUR']).default('KZT'),
});

// Customer data validation
const customerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  phone: z.string().optional(),
  userId: z.string().uuid(),
});

// Listing payment metadata
const listingMetadataSchema = z.object({
  listingId: z.string().uuid(),
  listingType: z.enum([
    'MINING_LICENSE',
    'EXPLORATION_LICENSE',
    'MINERAL_OCCURRENCE',
  ]),
  listingTitle: z.string(),
  sellerId: z.string().uuid(),
  buyerId: z.string().uuid(),
  commission: z.number(), // Platform commission percentage
});

export class StripePaymentService {
  /**
   * Create a payment intent for a listing purchase
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'KZT',
    metadata: Record<string, string>
  ): Promise<Stripe.PaymentIntent> {
    try {
      // Validate amount
      const { amount: validAmount, currency: validCurrency } =
        paymentAmountSchema.parse({
          amount,
          currency,
        });

      // Convert to smallest currency unit (tiyn for KZT, cents for USD/EUR)
      const amountInSmallestUnit = Math.round(validAmount * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInSmallestUnit,
        currency: validCurrency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata,
        description: `Purchase of listing: ${metadata.listingTitle}`,
        statement_descriptor: 'QAZNEDR MINING',
        capture_method: 'manual', // Manual capture for escrow-like functionality
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to initialize payment');
    }
  }

  /**
   * Create or update a Stripe customer
   */
  async createOrUpdateCustomer(
    customerData: z.infer<typeof customerSchema>
  ): Promise<Stripe.Customer> {
    try {
      // Validate customer data
      const validCustomer = customerSchema.parse(customerData);

      // Check if customer exists
      const existingCustomers = await stripe.customers.list({
        email: validCustomer.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        // Update existing customer
        return await stripe.customers.update(existingCustomers.data[0].id, {
          name: validCustomer.name,
          phone: validCustomer.phone,
          metadata: {
            userId: validCustomer.userId,
          },
        });
      }

      // Create new customer
      return await stripe.customers.create({
        email: validCustomer.email,
        name: validCustomer.name,
        phone: validCustomer.phone,
        metadata: {
          userId: validCustomer.userId,
        },
      });
    } catch (error) {
      console.error('Error creating/updating customer:', error);
      throw new Error('Failed to process customer information');
    }
  }

  /**
   * Create a checkout session for listing purchase
   */
  async createCheckoutSession(
    listingData: z.infer<typeof listingMetadataSchema>,
    amount: number,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    try {
      // Validate listing data
      const validListing = listingMetadataSchema.parse(listingData);

      // Calculate platform fee
      const platformFee = Math.round(amount * validListing.commission);
      const sellerAmount = amount - platformFee;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'kzt',
              product_data: {
                name: validListing.listingTitle,
                description: `${validListing.listingType} - Mining asset purchase`,
                metadata: {
                  listingId: validListing.listingId,
                  listingType: validListing.listingType,
                },
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        payment_intent_data: {
          capture_method: 'manual',
          metadata: {
            ...validListing,
            platformFee: platformFee.toString(),
            sellerAmount: sellerAmount.toString(),
          },
          application_fee_amount: platformFee,
          transfer_data: {
            destination: await this.getConnectedAccountId(
              validListing.sellerId
            ),
          },
        },
        metadata: validListing as any,
      });

      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Capture a payment after verification
   */
  async capturePayment(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent =
        await stripe.paymentIntents.capture(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error('Error capturing payment:', error);
      throw new Error('Failed to capture payment');
    }
  }

  /**
   * Cancel/refund a payment
   */
  async refundPayment(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<Stripe.Refund> {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: reason as Stripe.RefundCreateParams.Reason,
        metadata: {
          refundedAt: new Date().toISOString(),
          reason: reason || 'Customer requested',
        },
      });

      return refund;
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw new Error('Failed to process refund');
    }
  }

  /**
   * Create a connected account for sellers
   */
  async createConnectedAccount(
    email: string,
    country: string = 'KZ',
    businessType: 'individual' | 'company' = 'individual'
  ): Promise<Stripe.Account> {
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        country,
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: businessType,
        business_profile: {
          mcc: '1520', // Mining services MCC code
          product_description: 'Mining licenses and mineral rights trading',
        },
      });

      return account;
    } catch (error) {
      console.error('Error creating connected account:', error);
      throw new Error('Failed to create seller account');
    }
  }

  /**
   * Create account link for onboarding
   */
  async createAccountLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string
  ): Promise<Stripe.AccountLink> {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return accountLink;
    } catch (error) {
      console.error('Error creating account link:', error);
      throw new Error('Failed to create onboarding link');
    }
  }

  /**
   * Get connected account ID for a seller
   */
  private async getConnectedAccountId(sellerId: string): Promise<string> {
    // This should query your database to get the Stripe account ID
    // associated with the seller
    // For now, returning a placeholder
    return `acct_${sellerId}`;
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(
    rawBody: string,
    signature: string
  ): Promise<{ received: boolean; event?: Stripe.Event }> {
    try {
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(
            event.data.object as Stripe.PaymentIntent
          );
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(
            event.data.object as Stripe.PaymentIntent
          );
          break;

        case 'checkout.session.completed':
          await this.handleCheckoutComplete(
            event.data.object as Stripe.Checkout.Session
          );
          break;

        case 'account.updated':
          await this.handleAccountUpdate(event.data.object as Stripe.Account);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true, event };
    } catch (error) {
      console.error('Webhook error:', error);
      throw new Error('Webhook processing failed');
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    // Update database with payment success
    // Send notifications to buyer and seller
    // Update listing status if applicable
    console.log('Payment succeeded:', paymentIntent.id);
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    // Log failure and notify user
    console.log('Payment failed:', paymentIntent.id);
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    // Process completed checkout
    // Update listing status
    // Send confirmation emails
    console.log('Checkout completed:', session.id);
  }

  private async handleAccountUpdate(account: Stripe.Account) {
    // Update seller account status in database
    console.log('Account updated:', account.id);
  }

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(
    customerId: string,
    limit: number = 10
  ): Promise<Stripe.PaymentIntent[]> {
    try {
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customerId,
        limit,
      });

      return paymentIntents.data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw new Error('Failed to fetch payment history');
    }
  }

  /**
   * Calculate platform fees
   */
  calculateFees(
    amount: number,
    feePercentage: number = 5
  ): {
    platformFee: number;
    sellerProceeds: number;
    stripeFee: number;
    netPlatformRevenue: number;
  } {
    // Stripe fee: 2.9% + ₸150 (approximately $0.30)
    const stripeFeePercentage = 0.029;
    const stripeFeeFixed = 150; // in KZT

    const stripeFee = amount * stripeFeePercentage + stripeFeeFixed;
    const platformFee = amount * (feePercentage / 100);
    const sellerProceeds = amount - platformFee;
    const netPlatformRevenue = platformFee - stripeFee;

    return {
      platformFee: Math.round(platformFee),
      sellerProceeds: Math.round(sellerProceeds),
      stripeFee: Math.round(stripeFee),
      netPlatformRevenue: Math.round(netPlatformRevenue),
    };
  }
}

// Export singleton instance
export const stripePaymentService = new StripePaymentService();
