import { Resend } from 'resend';
import { z } from 'zod';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates
export enum EmailTemplate {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  LISTING_APPROVED = 'listing_approved',
  LISTING_REJECTED = 'listing_rejected',
  LISTING_SOLD = 'listing_sold',
  NEW_MESSAGE = 'new_message',
  VERIFICATION_COMPLETE = 'verification_complete',
  WEEKLY_DIGEST = 'weekly_digest',
  PRICE_ALERT = 'price_alert',
}

// Email data schemas
const baseEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  template: z.nativeEnum(EmailTemplate),
  data: z.record(z.any()),
});

const batchEmailSchema = z.object({
  recipients: z.array(z.string().email()),
  subject: z.string(),
  template: z.nativeEnum(EmailTemplate),
  data: z.record(z.any()),
});

export class EmailService {
  private from = 'QAZNEDR <noreply@qaznedr.kz>';
  private replyTo = 'support@qaznedr.kz';

  /**
   * Send a single email
   */
  async sendEmail(params: z.infer<typeof baseEmailSchema>) {
    try {
      const validated = baseEmailSchema.parse(params);
      const html = await this.renderTemplate(
        validated.template,
        validated.data
      );

      const result = await resend.emails.send({
        from: this.from,
        to: validated.to,
        subject: validated.subject,
        html,
        reply_to: this.replyTo,
        tags: [
          { name: 'template', value: validated.template },
          { name: 'environment', value: process.env.NODE_ENV || 'development' },
        ],
      });

      return { success: true, id: result.data?.id };
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send batch emails
   */
  async sendBatchEmails(params: z.infer<typeof batchEmailSchema>) {
    try {
      const validated = batchEmailSchema.parse(params);
      const html = await this.renderTemplate(
        validated.template,
        validated.data
      );

      const results = await Promise.allSettled(
        validated.recipients.map((recipient) =>
          resend.emails.send({
            from: this.from,
            to: recipient,
            subject: validated.subject,
            html,
            reply_to: this.replyTo,
            tags: [
              { name: 'template', value: validated.template },
              { name: 'batch', value: 'true' },
            ],
          })
        )
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      return {
        success: true,
        sent: successful,
        failed,
        total: validated.recipients.length,
      };
    } catch (error) {
      console.error('Batch email error:', error);
      throw new Error('Failed to send batch emails');
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, name: string) {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to QAZNEDR - Kazakhstan Mining Platform',
      template: EmailTemplate.WELCOME,
      data: { name },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetUrl: string) {
    return this.sendEmail({
      to: email,
      subject: 'Reset Your QAZNEDR Password',
      template: EmailTemplate.PASSWORD_RESET,
      data: { resetUrl },
    });
  }

  /**
   * Send payment success email
   */
  async sendPaymentSuccessEmail(
    email: string,
    data: {
      amount: number;
      currency: string;
      listingTitle: string;
      transactionId: string;
    }
  ) {
    return this.sendEmail({
      to: email,
      subject: 'Payment Successful - QAZNEDR',
      template: EmailTemplate.PAYMENT_SUCCESS,
      data,
    });
  }

  /**
   * Send listing approved email
   */
  async sendListingApprovedEmail(
    email: string,
    data: {
      listingTitle: string;
      listingUrl: string;
    }
  ) {
    return this.sendEmail({
      to: email,
      subject: 'Your Listing Has Been Approved!',
      template: EmailTemplate.LISTING_APPROVED,
      data,
    });
  }

  /**
   * Send new message notification
   */
  async sendNewMessageEmail(
    email: string,
    data: {
      senderName: string;
      messagePreview: string;
      conversationUrl: string;
    }
  ) {
    return this.sendEmail({
      to: email,
      subject: `New message from ${data.senderName}`,
      template: EmailTemplate.NEW_MESSAGE,
      data,
    });
  }

  /**
   * Send weekly digest
   */
  async sendWeeklyDigest(
    recipients: string[],
    data: {
      newListings: number;
      priceDrops: any[];
      popularListings: any[];
    }
  ) {
    return this.sendBatchEmails({
      recipients,
      subject: 'Your QAZNEDR Weekly Digest',
      template: EmailTemplate.WEEKLY_DIGEST,
      data,
    });
  }

  /**
   * Send price alert
   */
  async sendPriceAlert(
    email: string,
    data: {
      listingTitle: string;
      oldPrice: number;
      newPrice: number;
      currency: string;
      listingUrl: string;
    }
  ) {
    const percentChange = Math.round(
      ((data.oldPrice - data.newPrice) / data.oldPrice) * 100
    );

    return this.sendEmail({
      to: email,
      subject: `Price Drop Alert: ${percentChange}% off ${data.listingTitle}`,
      template: EmailTemplate.PRICE_ALERT,
      data: { ...data, percentChange },
    });
  }

  /**
   * Render email template
   */
  private async renderTemplate(
    template: EmailTemplate,
    data: any
  ): Promise<string> {
    // Map template to HTML content
    const templates: Record<EmailTemplate, (data: any) => string> = {
      [EmailTemplate.WELCOME]: (data) => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Welcome to QAZNEDR</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #0A84FF 0%, #0066CC 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 24px; background: #0A84FF; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to QAZNEDR!</h1>
              </div>
              <div class="content">
                <h2>Hello ${data.name},</h2>
                <p>Welcome to Kazakhstan's premier mining marketplace! We're excited to have you join our community of mining professionals.</p>
                <p>Here's what you can do on QAZNEDR:</p>
                <ul>
                  <li>Browse mining licenses and exploration opportunities</li>
                  <li>List your own mining assets for sale</li>
                  <li>Connect with verified buyers and sellers</li>
                  <li>Access geological data and reports</li>
                  <li>Get real-time market insights</li>
                </ul>
                <a href="https://qaznedr.kz/listings" class="button">Explore Listings</a>
                <div class="footer">
                  <p>© 2024 QAZNEDR. All rights reserved.</p>
                  <p>Kazakhstan Mining Platform</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,

      [EmailTemplate.PASSWORD_RESET]: (data) => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Reset Your Password</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f3f4f6; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 24px; background: #0A84FF; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 10px; border-radius: 6px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Password Reset Request</h1>
              </div>
              <div class="content">
                <p>We received a request to reset your QAZNEDR account password.</p>
                <p>Click the button below to create a new password:</p>
                <div style="text-align: center;">
                  <a href="${data.resetUrl}" class="button">Reset Password</a>
                </div>
                <p>This link will expire in 1 hour for security reasons.</p>
                <div class="warning">
                  <p><strong>Didn't request this?</strong></p>
                  <p>If you didn't request a password reset, please ignore this email. Your password won't be changed.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,

      [EmailTemplate.PAYMENT_SUCCESS]: (data) => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Payment Successful</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
              .receipt { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; }
              .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .receipt-row:last-child { border-bottom: none; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✓ Payment Successful</h1>
              </div>
              <div class="content">
                <h2>Thank you for your purchase!</h2>
                <p>Your payment has been successfully processed.</p>
                <div class="receipt">
                  <div class="receipt-row">
                    <span>Transaction ID:</span>
                    <span>${data.transactionId}</span>
                  </div>
                  <div class="receipt-row">
                    <span>Listing:</span>
                    <span>${data.listingTitle}</span>
                  </div>
                  <div class="receipt-row">
                    <span>Amount:</span>
                    <span>${data.currency} ${data.amount.toLocaleString()}</span>
                  </div>
                </div>
                <p>The seller has been notified and will contact you shortly with next steps.</p>
              </div>
            </div>
          </body>
        </html>
      `,

      [EmailTemplate.PAYMENT_FAILED]: (data) => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Payment Failed</title>
          </head>
          <body>
            <h1>Payment Failed</h1>
            <p>Unfortunately, your payment could not be processed.</p>
          </body>
        </html>
      `,

      [EmailTemplate.LISTING_APPROVED]: (data) => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Listing Approved</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 24px; background: #0A84FF; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Listing Approved!</h1>
              </div>
              <div class="content">
                <h2>Great news!</h2>
                <p>Your listing "${data.listingTitle}" has been approved and is now live on QAZNEDR.</p>
                <p>Potential buyers can now view and inquire about your listing.</p>
                <a href="${data.listingUrl}" class="button">View Your Listing</a>
                <p style="margin-top: 30px;">Tips to increase visibility:</p>
                <ul>
                  <li>Add high-quality images and documents</li>
                  <li>Respond quickly to inquiries</li>
                  <li>Keep your pricing competitive</li>
                  <li>Provide detailed geological information</li>
                </ul>
              </div>
            </div>
          </body>
        </html>
      `,

      [EmailTemplate.LISTING_REJECTED]: (data) => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Listing Review</title>
          </head>
          <body>
            <h1>Listing Requires Changes</h1>
            <p>Your listing needs some adjustments before it can be published.</p>
          </body>
        </html>
      `,

      [EmailTemplate.LISTING_SOLD]: (data) => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Listing Sold!</title>
          </head>
          <body>
            <h1>Congratulations! Your Listing Has Been Sold</h1>
            <p>Great news! Your listing has been successfully sold.</p>
          </body>
        </html>
      `,

      [EmailTemplate.NEW_MESSAGE]: (data) => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>New Message</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #0A84FF; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
              .message-box { background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0A84FF; }
              .button { display: inline-block; padding: 12px 24px; background: #0A84FF; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📬 New Message</h1>
              </div>
              <div class="content">
                <p>You have a new message from <strong>${data.senderName}</strong>:</p>
                <div class="message-box">
                  <p>${data.messagePreview}...</p>
                </div>
                <a href="${data.conversationUrl}" class="button">View Conversation</a>
              </div>
            </div>
          </body>
        </html>
      `,

      [EmailTemplate.VERIFICATION_COMPLETE]: (data) => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Verification Complete</title>
          </head>
          <body>
            <h1>✓ Account Verified</h1>
            <p>Your account has been successfully verified.</p>
          </body>
        </html>
      `,

      [EmailTemplate.WEEKLY_DIGEST]: (data) => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Weekly Digest</title>
          </head>
          <body>
            <h1>Your QAZNEDR Weekly Digest</h1>
            <p>${data.newListings} new listings this week</p>
          </body>
        </html>
      `,

      [EmailTemplate.PRICE_ALERT]: (data) => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Price Alert</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #fbbf24; color: #78350f; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
              .price-box { display: flex; justify-content: space-around; margin: 20px 0; }
              .price-item { text-align: center; }
              .old-price { color: #6b7280; text-decoration: line-through; font-size: 18px; }
              .new-price { color: #10b981; font-size: 24px; font-weight: bold; }
              .discount { background: #fef3c7; color: #92400e; padding: 5px 10px; border-radius: 20px; font-weight: bold; display: inline-block; margin: 10px 0; }
              .button { display: inline-block; padding: 12px 24px; background: #0A84FF; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚡ Price Drop Alert!</h1>
              </div>
              <div class="content">
                <h2>${data.listingTitle}</h2>
                <div class="discount">${data.percentChange}% OFF!</div>
                <div class="price-box">
                  <div class="price-item">
                    <p>Was:</p>
                    <p class="old-price">${data.currency} ${data.oldPrice.toLocaleString()}</p>
                  </div>
                  <div class="price-item">
                    <p>Now:</p>
                    <p class="new-price">${data.currency} ${data.newPrice.toLocaleString()}</p>
                  </div>
                </div>
                <p>The price has dropped by ${data.percentChange}%! Don't miss this opportunity.</p>
                <div style="text-align: center;">
                  <a href="${data.listingUrl}" class="button">View Listing</a>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    return templates[template](data);
  }

  /**
   * Schedule email for later
   */
  async scheduleEmail(
    params: z.infer<typeof baseEmailSchema> & { sendAt: Date }
  ) {
    // This would integrate with a job queue like Bull or similar
    // For now, just a placeholder
    console.log('Email scheduled for:', params.sendAt);
    return { success: true, scheduled: true };
  }

  /**
   * Get email analytics
   */
  async getEmailAnalytics(emailId: string) {
    try {
      // This would fetch analytics from Resend or your analytics provider
      // Placeholder implementation
      return {
        sent: true,
        delivered: true,
        opened: false,
        clicked: false,
        bounced: false,
        complained: false,
      };
    } catch (error) {
      console.error('Error fetching email analytics:', error);
      return null;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
