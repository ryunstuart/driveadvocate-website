import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const ssm = new SSMClient({ region: 'us-east-1' });
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));
const TABLE_NAME = process.env.VEHICLE_CATALOG_TABLE || 'VehicleCatalog';
const BASE_URL = 'https://carapi.app/api';

async function getSSMParam(name: string): Promise<string> {
  const result = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return result.Parameter?.Value || '';
}

async function getJWT(): Promise<string> {
  const token = await getSSMParam('/driveadvocate/carapi/token');
  const secret = await getSSMParam('/driveadvocate/carapi/secret');
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_token: token, api_secret: secret }),
  });
  if (!res.ok) throw new Error(`CarAPI auth failed: ${res.status}`);
  return res.text();
}

async function fetchAllPages(url: string, jwt: string): Promise<any[]> {
  const all: any[] = [];
  let nextUrl: string | null = url;
  while (nextUrl) {
    const fullUrl: string = nextUrl.startsWith('http') ? nextUrl : `${BASE_URL}${nextUrl}`;
    const res: Response = await fetch(fullUrl, { headers: { Authorization: `Bearer ${jwt}` } });
    if (!res.ok) {
      console.warn(`Fetch failed for ${fullUrl}: ${res.status}`);
      break;
    }
    const body: any = await res.json();
    all.push(...(body.data || []));
    nextUrl = body.collection?.next || null;
  }
  return all;
}

export const handler = async () => {
  const years = ['2020'];
  const jwt = await getJWT();
  let totalWritten = 0;

  for (const year of years) {
    console.log(`Syncing year ${year}...`);
    const makes = await fetchAllPages(`/makes/v2?year=${year}`, jwt);
    console.log(`  ${makes.length} makes`);

    for (const make of makes) {
      const makeName = make.name;
      const models = await fetchAllPages(`/models/v2?year=${year}&make=${encodeURIComponent(makeName)}`, jwt);

      for (const model of models) {
        const modelName = model.name;

        const [trims, extColors, intColors] = await Promise.all([
          fetchAllPages(`/trims/v2?year=${year}&make=${encodeURIComponent(makeName)}&model=${encodeURIComponent(modelName)}`, jwt),
          fetchAllPages(`/exterior-colors/v2?year=${year}&make=${encodeURIComponent(makeName)}&model=${encodeURIComponent(modelName)}`, jwt),
          fetchAllPages(`/interior-colors/v2?year=${year}&make=${encodeURIComponent(makeName)}&model=${encodeURIComponent(modelName)}`, jwt),
        ]);

        const uniqueExtColors = [...new Map(extColors.map((c: any) => [c.name, { name: c.name, rgb: c.rgb || null }])).values()];
        const uniqueIntColors = [...new Map(intColors.map((c: any) => [c.name, { name: c.name, rgb: c.rgb || null }])).values()];

        const trimData = trims.map((t: any) => ({
          id: t.id,
          name: t.trim || t.submodel || 'Base',
          description: t.description || '',
          msrp: t.msrp || 0,
          invoice: t.invoice || 0,
        }));

        const item = {
          make: makeName,
          modelYear: `${year}#${modelName}`,
          year,
          model: modelName,
          makeId: make.id,
          modelId: model.id,
          trims: trimData,
          exteriorColors: uniqueExtColors,
          interiorColors: uniqueIntColors,
          syncedAt: new Date().toISOString(),
        };

        await db.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
        totalWritten++;
        console.log(`  ${makeName} ${modelName}: ${trimData.length} trims, ${uniqueExtColors.length} ext colors, ${uniqueIntColors.length} int colors`);
      }
    }
  }

  console.log(`Sync complete: ${totalWritten} models written`);
  return { success: true, modelsWritten: totalWritten };
};
