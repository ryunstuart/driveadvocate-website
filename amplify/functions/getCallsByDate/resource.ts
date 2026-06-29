import { defineFunction } from '@aws-amplify/backend';

export const getCallsByDate = defineFunction({
  name: 'getCallsByDate',
  entry: './handler.ts',
});
