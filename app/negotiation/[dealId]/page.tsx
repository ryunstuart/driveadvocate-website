import ClientDealFile from './ClientDealFile';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import outputs from '../../../amplify_outputs.json';

Amplify.configure(outputs);
const client = generateClient<Schema>();

export async function generateStaticParams() {
  try {
    const { data: deals } = await client.models.Deal.list({
      authMode: 'identityPool',
    });
    const params = deals.map(deal => ({ dealId: deal.id }));
    return [{ dealId: 'placeholder' }, ...params];
  } catch {
    return [{ dealId: 'placeholder' }];
  }
}

export default function DealFilePage() {
  return <ClientDealFile />;
}
