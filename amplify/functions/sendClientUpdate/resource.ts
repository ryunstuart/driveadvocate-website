import { defineFunction } from '@aws-amplify/backend';

export const sendClientUpdate = defineFunction({
  name: 'sendClientUpdate',
  entry: './handler.ts',
});
