import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-04-30.basil' as any });
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }), {
  marshallOptions: { removeUndefinedValues: true },
});

const SERVICE_PRICES: Record<string, number> = {
  'Research Package': 14900,
  'Negotiation Service': 99900,
  'Full Concierge': 225000,
};

export async function POST(request: NextRequest) {
  try {
    const { token, dealId, clientEmail, clientName, serviceLevel } = await request.json();
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://driveadvocate.com';
    const amount = SERVICE_PRICES[serviceLevel] || 99900;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: clientEmail,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `DriveAdvocate ${serviceLevel || 'Negotiation Service'}`,
            description: `Car buying advocacy service for ${clientName}`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${baseUrl}/enroll/success?token=${token}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/enroll/${token}?cancelled=true`,
      metadata: { token, dealId, clientEmail },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature') || '';
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { token, dealId } = session.metadata || {};

      if (token) {
        await db.send(new UpdateCommand({
          TableName: 'OnboardingTokens', Key: { token },
          UpdateExpression: 'SET stripeSessionId = :sid, paymentStatus = :ps, used = :u, usedAt = :ua',
          ExpressionAttributeValues: { ':sid': session.id, ':ps': 'complete', ':u': true, ':ua': new Date().toISOString() },
        }));
      }

      if (dealId) {
        const amplifyData = await import('@/app/lib/amplify-data');
        await amplifyData.dataClient.models.Deal.update({
          id: dealId, status: 'New' as any,
          stripeSessionId: session.id, stripePaymentStatus: 'complete',
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Stripe webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
