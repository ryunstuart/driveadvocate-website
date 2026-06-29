import { defineFunction } from '@aws-amplify/backend';

export const getOnboardingToken = defineFunction({
  name: 'getOnboardingToken',
  entry: './handler.ts',
});
