import { getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';

interface StripeCheckoutSession {
  id: string;
  customer?: string | { id: string };
  customer_email?: string;
  customer_details?: { email?: string };
  subscription?: string | { id: string };
  payment_status?: string;
}

interface StripeSubscription {
  id: string;
  customer: string | { id: string };
}

interface StripeEvent {
  type: string;
  data: {
    object: StripeCheckoutSession | StripeSubscription;
  };
}

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured, skipping signature verification');
    }

    let event: StripeEvent;

    if (webhookSecret) {
      // Verify webhook signature
      let stripe;
      try {
        stripe = await getUncachableStripeClient();
      } catch (error: any) {
        console.warn('[Stripe Webhook] Stripe not configured, ignoring webhook');
        return;
      }

      try {
        const verified = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        event = verified as unknown as StripeEvent;
      } catch (err: any) {
        throw new Error(`Webhook signature verification failed: ${err.message}`);
      }
    } else {
      // No secret configured, parse directly (dev/testing only)
      event = JSON.parse(payload.toString());
    }

    // Parse the event to handle custom logic
    try {
      console.log(`[Stripe] Processing event: ${event.type}`);

      if (event.type === 'checkout.session.completed') {
        await WebhookHandlers.handleCheckoutSessionCompleted(event.data.object as StripeCheckoutSession);
      } else if (event.type === 'customer.subscription.created') {
        const subscription = event.data.object as StripeSubscription;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
        await WebhookHandlers.handleSubscriptionCreated(subscription.id, customerId);
      } else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as StripeSubscription;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
        await WebhookHandlers.handleSubscriptionDeleted(subscription.id, customerId);
      }
    } catch (err) {
      console.error('[Stripe] Error processing custom webhook logic:', err);
    }
  }

  static async handleCheckoutSessionCompleted(session: StripeCheckoutSession) {
    console.log(`[Stripe] Checkout session completed: ${session.id}`);

    const customerEmail = session.customer_details?.email || session.customer_email;
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

    if (!customerEmail) {
      console.log('[Stripe] No customer email found in session');
      return;
    }

    console.log(`[Stripe] Looking up user by email: ${customerEmail}`);

    // Find user by email
    const user = await storage.getUserByEmail(customerEmail);

    if (user) {
      console.log(`[Stripe] Found user: ${user.id} (${user.email})`);

      // Update stripeCustomerId if not set
      if (!user.stripeCustomerId && customerId) {
        await storage.updateUserStripeCustomerId(user.id, customerId);
        console.log(`[Stripe] Updated stripeCustomerId for user ${user.email}`);
      }

      // Update subscription status
      if (subscriptionId || session.payment_status === 'paid') {
        await storage.updateUserSubscription(user.id, {
          stripeSubscriptionId: subscriptionId || null,
          status: 'pago'
        });
        console.log(`[Stripe] User ${user.email} upgraded to pago via Payment Link`);

        const hasEvent = await storage.hasUserEvent(user.id, "upgrade_pro");
        if (!hasEvent) {
          await storage.logUserEvent(user.id, "upgrade_pro");
        }
      }
    } else {
      console.log(`[Stripe] No user found with email: ${customerEmail}. User must register with this email to activate plan.`);
    }
  }

  static async handleSubscriptionCreated(subscriptionId: string, customerId: string) {
    console.log(`[Stripe] Subscription created: ${subscriptionId} for customer ${customerId}`);
    const user = await storage.getUserByStripeCustomerId(customerId);
    if (user) {
      await storage.updateUserSubscription(user.id, {
        stripeSubscriptionId: subscriptionId,
        status: 'pago'
      });
      console.log(`[Stripe] User ${user.email} upgraded to pago`);

      const hasEvent = await storage.hasUserEvent(user.id, "upgrade_pro");
      if (!hasEvent) {
        await storage.logUserEvent(user.id, "upgrade_pro");
      }
    }
  }

  static async handleSubscriptionDeleted(subscriptionId: string, customerId: string) {
    console.log(`[Stripe] Subscription deleted: ${subscriptionId} for customer ${customerId}`);
    const user = await storage.getUserByStripeCustomerId(customerId);
    if (user) {
      await storage.updateUserSubscription(user.id, {
        stripeSubscriptionId: null,
        status: 'free'
      });
      console.log(`[Stripe] User ${user.email} downgraded to free`);
    }
  }
}
