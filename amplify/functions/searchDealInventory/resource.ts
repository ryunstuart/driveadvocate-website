import { defineFunction } from '@aws-amplify/backend';

export const searchDealInventory = defineFunction({
  name: 'searchDealInventory',
  entry: './handler.ts',
  timeoutSeconds: 120,
  memoryMB: 256,
});
