import { defineFunction } from '@aws-amplify/backend';

export const calcomWebhook = defineFunction({
  name: 'calcomWebhook',
  entry: './handler.ts',
  timeoutSeconds: 30,
});
