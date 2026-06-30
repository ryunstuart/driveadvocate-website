import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssm = new SSMClient({ region: 'us-east-1' });
const BASE_URL = process.env.ENROLLMENT_BASE_URL || 'https://driveadvocate.com';

async function getParam(name: string): Promise<string> {
  const result = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return result.Parameter?.Value || '';
}

export const handler = async (event: any) => {
  const { token, dealId, clientEmail, clientName } = event.arguments;
  console.log('createStripeCheckout for:', clientEmail);

  try {
    const stripeKey = await getParam('/driveadvocate/stripe/secret-key');
    const priceId = await getParam('/driveadvocate/stripe/price-id');

    if (!stripeKey) return { url: null, error: 'Stripe not configured' };
    if (!priceId) return { url: null, error: 'Price not configured' };

    const Stripe = require('stripe');
    const stripe = new Stripe(stripeKey, { apiVersion: '2025-04-30.basil' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: clientEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: { token, dealId, clientEmail, clientName },
      success_url: `${BASE_URL}/enroll/success?token=${token}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/enroll/${token}?cancelled=true`,
    });

    console.log('Checkout session created:', session.id);
    return { url: session.url, error: null };
  } catch (err: any) {
    console.error('createStripeCheckout error:', err.name, err.message);
    return { url: null, error: err.message };
  }
};
