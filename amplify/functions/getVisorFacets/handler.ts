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
  const { facet, make, model, trim, year, condition } = event.arguments;

  const apiKey = await getVisorKey();

  const params = new URLSearchParams({ facets: facet });
  if (make) params.append('make', make);
  if (model) params.append('model', model);
  if (trim) params.append('trim', trim);
  if (year) params.append('year', String(year));
  if (condition) {
    params.append('inventory_type',
      condition === 'New' ? 'new' : condition === 'Used' ? 'used' : 'certified'
    );
  }

  const response = await fetch(
    `https://api.visor.vin/v1/facets?${params.toString()}`,
    { headers: { 'Authorization': `Bearer ${apiKey}` } }
  );

  if (!response.ok) {
    console.error('Visor facets error:', response.status, await response.text());
    return JSON.stringify([]);
  }

  const data = await response.json();
  const values = data.data?.facets?.[facet] || [];

  console.log(`Visor facets: ${facet} returned ${values.length} values`);

  return JSON.stringify(values.map((f: any) => f.value));
};
