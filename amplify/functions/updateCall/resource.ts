import { defineFunction } from '@aws-amplify/backend';

export const updateCall = defineFunction({
  name: 'updateCall',
  entry: './handler.ts',
});
