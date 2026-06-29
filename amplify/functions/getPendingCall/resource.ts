import { defineFunction } from '@aws-amplify/backend';

export const getPendingCall = defineFunction({
  name: 'getPendingCall',
  entry: './handler.ts',
});
