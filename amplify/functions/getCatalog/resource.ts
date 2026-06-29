import { defineFunction } from '@aws-amplify/backend';

export const getCatalog = defineFunction({
  name: 'getCatalog',
  entry: './handler.ts',
  timeoutSeconds: 30,
  memoryMB: 256,
});
