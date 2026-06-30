import { defineFunction } from '@aws-amplify/backend';

export const createClientAccount = defineFunction({
  name: 'createClientAccount',
  entry: './handler.ts',
});
