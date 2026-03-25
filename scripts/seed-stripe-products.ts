import { getUncachableStripeClient } from '../server/stripeClient';

async function createProducts() {
  console.log('Creating Stripe products for ModelHero...');
  
  const stripe = await getUncachableStripeClient();

  const existingProducts = await stripe.products.search({ 
    query: "name:'ModelHero Full Plan'" 
  });
  
  if (existingProducts.data.length > 0) {
    console.log('ModelHero Full Plan already exists:', existingProducts.data[0].id);
    const prices = await stripe.prices.list({ 
      product: existingProducts.data[0].id,
      active: true 
    });
    console.log('Existing prices:', prices.data.map(p => ({
      id: p.id,
      amount: p.unit_amount,
      currency: p.currency,
      interval: p.recurring?.interval
    })));
    return;
  }

  console.log('Creating ModelHero Full Plan product...');
  const product = await stripe.products.create({
    name: 'ModelHero Full Plan',
    description: 'Unlimited kits, materials, photos, and AI features for plastic model kit enthusiasts',
    metadata: {
      app: 'modelhero',
      tier: 'full'
    }
  });
  console.log('Product created:', product.id);

  console.log('Creating monthly price ($4.99 USD)...');
  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 499,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: {
      plan: 'monthly',
      app: 'modelhero'
    }
  });
  console.log('Monthly price created:', monthlyPrice.id);

  console.log('\n=== Stripe Products Created ===');
  console.log('Product ID:', product.id);
  console.log('Monthly Price ID:', monthlyPrice.id);
  console.log('\nAdd this Price ID to your frontend UpgradeModal component.');
}

createProducts().catch(console.error);
