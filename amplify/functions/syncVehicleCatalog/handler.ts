import { SSMClient, GetParameterCommand, PutParameterCommand } from '@aws-sdk/client-ssm';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const ssm = new SSMClient({ region: 'us-east-1' });
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }), {
  marshallOptions: { removeUndefinedValues: true },
});
const TABLE_NAME = process.env.VEHICLE_CATALOG_TABLE || 'VehicleCatalog';
const BASE_URL = 'https://carapi.app/api';
const JWT_CACHE_KEY = '/driveadvocate/carapi/jwt-cache';

async function getSSMParam(name: string): Promise<string> {
  const result = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return result.Parameter?.Value || '';
}

async function getJWT(): Promise<string> {
  try {
    const cached = await ssm.send(new GetParameterCommand({ Name: JWT_CACHE_KEY, WithDecryption: true })).catch(() => null);
    if (cached?.Parameter?.Value) {
      const parts = cached.Parameter.Value.split('.');
      if (parts.length === 3) {
        const payload: any = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        if (payload.exp * 1000 > Date.now() + 3600000) {
          console.log('Using cached CarAPI JWT');
          return cached.Parameter.Value;
        }
      }
    }
  } catch {}

  console.log('Fetching new CarAPI JWT');
  const token = await getSSMParam('/driveadvocate/carapi/token');
  const secret = await getSSMParam('/driveadvocate/carapi/secret');
  const res: Response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_token: token, api_secret: secret }),
  });
  if (!res.ok) throw new Error(`CarAPI auth failed: ${res.status}`);
  const jwt = await res.text();

  await ssm.send(new PutParameterCommand({
    Name: JWT_CACHE_KEY,
    Value: jwt,
    Type: 'SecureString',
    Overwrite: true,
  }));

  return jwt;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, jwt: string, retries = 3): Promise<Response | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res: Response = await fetch(url, { headers: { Authorization: `Bearer ${jwt}` } });
    if (res.ok) return res;
    if (res.status === 429 && attempt < retries) {
      const delay = Math.pow(2, attempt + 1) * 1000;
      console.warn(`Rate limited on ${url}, retrying in ${delay}ms...`);
      await sleep(delay);
      continue;
    }
    console.warn(`Fetch failed for ${url}: ${res.status}`);
    return null;
  }
  return null;
}

async function fetchAllPages(url: string, jwt: string): Promise<any[]> {
  const all: any[] = [];
  let nextUrl: string | null = url;
  while (nextUrl) {
    const fullUrl: string = nextUrl.startsWith('http') ? nextUrl : `${BASE_URL}${nextUrl}`;
    const res = await fetchWithRetry(fullUrl, jwt);
    if (!res) break;
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
    const BATCH_FILTER = ['Toyota', 'Nissan', 'Subaru', 'Tesla', 'Volkswagen', 'Lexus'];
    const allMakes = await fetchAllPages(`/makes/v2?year=${year}`, jwt);
    const makes = BATCH_FILTER.length > 0 ? allMakes.filter((m: any) => BATCH_FILTER.includes(m.name)) : allMakes;
    console.log(`  ${makes.length} makes (filtered from ${allMakes.length})`);

    for (let mi = 0; mi < makes.length; mi++) {
      const make = makes[mi];
      const makeName = make.name;
      if (mi > 0) await sleep(3000);
      const models = await fetchAllPages(`/models/v2?year=${year}&make=${encodeURIComponent(makeName)}`, jwt);

      for (const model of models) {
        const modelName = model.name;
        await sleep(200);

        const trims = await fetchAllPages(`/trims/v2?year=${year}&make=${encodeURIComponent(makeName)}&model=${encodeURIComponent(modelName)}`, jwt);
        const extColors = await fetchAllPages(`/exterior-colors/v2?year=${year}&make=${encodeURIComponent(makeName)}&model=${encodeURIComponent(modelName)}`, jwt);
        const intColors = await fetchAllPages(`/interior-colors/v2?year=${year}&make=${encodeURIComponent(makeName)}&model=${encodeURIComponent(modelName)}`, jwt);

        const uniqueExtColors = [...new Map(extColors.map((c: any) => {
          const colorName = c.name || c.color_name || c.generic_color_name || null;
          const rgb = c.rgb || null;
          const key = colorName || rgb || JSON.stringify(c);
          return [key, { name: colorName, rgb }];
        })).values()].filter((c: any) => c.name || c.rgb);
        const uniqueIntColors = [...new Map(intColors.map((c: any) => {
          const colorName = c.name || c.color_name || c.generic_color_name || null;
          const rgb = c.rgb || null;
          const key = colorName || rgb || JSON.stringify(c);
          return [key, { name: colorName, rgb }];
        })).values()].filter((c: any) => c.name || c.rgb);

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
