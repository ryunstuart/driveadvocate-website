import { defineFunction } from '@aws-amplify/backend';

export const syncVehicleCatalog = defineFunction({
  name: 'syncVehicleCatalog',
  entry: './handler.ts',
  timeoutSeconds: 900,
  memoryMB: 512,
});
