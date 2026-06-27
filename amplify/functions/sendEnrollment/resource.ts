import { defineFunction } from '@aws-amplify/backend';

export const sendEnrollment = defineFunction({
  name: 'sendEnrollment',
  entry: './handler.ts',
  timeoutSeconds: 30,
});
