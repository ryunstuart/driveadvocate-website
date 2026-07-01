import { defineFunction } from '@aws-amplify/backend';
export const getVisorFacets = defineFunction({ name: 'getVisorFacets', entry: './handler.ts' });
