import { defineFunction } from '@aws-amplify/backend';

export const confirmClientSignup = defineFunction({
  name: 'confirmClientSignup',
  entry: './handler.ts',
});
