import { defineFunction } from '@aws-amplify/backend';

export const signAgreement = defineFunction({
  name: 'signAgreement',
  entry: './handler.ts',
  timeoutSeconds: 30,
});
