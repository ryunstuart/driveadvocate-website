import { defineFunction } from '@aws-amplify/backend';

export const createStripeCheckout = defineFunction({
  name: 'createStripeCheckout',
  entry: './handler.ts',
  timeoutSeconds: 30,
});
