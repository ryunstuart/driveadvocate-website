import { defineFunction } from '@aws-amplify/backend';

export const getCallById = defineFunction({
  name: 'getCallById',
  entry: './handler.ts',
});
