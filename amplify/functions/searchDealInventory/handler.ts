import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssm = new SSMClient({ region: 'us-east-1' });

async function getVisorKey(): Promise<string> {
  const result = await ssm.send(new GetParameterCommand({
    Name: '/driveadvocate/visor/api-key',
    WithDecryption: true,
  }));
  return result.Parameter?.Value || '';
}

export const handler = async (event: any) => {
  const { make, model, trim, year, condition, zip, radius,
          exteriorColors, interiorColors, minPrice, maxPrice } = event.arguments || {};

  const apiKey = await getVisorKey();

  const params = new URLSearchParams({
    limit: '20',
    sort: zip ? 'distance' : '-discount',
    fields: [
      'default', 'price', 'miles', 'dealer_id', 'dealer_name', 'dealer_type',
      'vdp_url', 'exterior_color', 'interior_color', 'base_exterior_color',
      'base_interior_color', 'msrp', 'discount_from_msrp', 'days_on_market',
      'photo_urls', 'city', 'state', 'distance_miles',
    ].join(','),
    include: 'price_history',
  });

  if (make) params.append('make', make);
  if (model) params.append('model', model);
  if (trim) params.append('trim', trim);
  if (year) params.append('year', year);
  if (zip) {
    params.append('postal_code', zip);
    params.append('radius', String(radius || 100));
  }
  if (condition) {
    const inventoryType = condition === 'new' ? 'new' : condition === 'used' ? 'used' : 'certified';
    params.append('inventory_type', inventoryType);
  }
  if (exteriorColors?.length) params.append('base_exterior_color', exteriorColors.join(','));
  if (interiorColors?.length) params.append('base_interior_color', interiorColors.join(','));
  if (minPrice) params.append('min_price', String(minPrice));
  if (maxPrice) params.append('max_price', String(maxPrice));

  console.log('Visor request:', `https://api.visor.vin/v1/listings?${params.toString()}`);

  const response = await fetch(`https://api.visor.vin/v1/listings?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Visor API error:', response.status, errorText);
    throw new Error(`Visor API error: ${response.status}`);
  }

  const data = await response.json();
  console.log(`Visor returned ${data.data?.length} listings, total: ${data.pagination?.total}`);

  return JSON.stringify({
    listings: data.data || [],
    total: data.pagination?.total || 0,
    nextOffset: data.pagination?.next_offset,
  });
};
