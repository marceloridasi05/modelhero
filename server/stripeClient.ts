import Stripe from 'stripe';

export async function getUncachableStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY não configurada');
  return new Stripe(secretKey);
}

export async function getStripePublishableKey() {
  return process.env.STRIPE_PUBLISHABLE_KEY || '';
}

export async function getStripeSync() {
  throw new Error('stripe-replit-sync não disponível fora do Replit');
}
