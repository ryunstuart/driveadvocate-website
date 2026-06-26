import { SSMClient, GetParameterCommand, PutParameterCommand } from '@aws-sdk/client-ssm';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const ssm = new SSMClient({ region: 'us-east-1' });
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }), {
  marshallOptions: { removeUndefinedValues: true },
});
const TABLE_NAME = process.env.VEHICLE_CATALOG_TABLE || 'VehicleCatalog';
const BASE_URL = 'https://carapi.app/api';
const JWT_CACHE_KEY = '/driveadvocate/carapi/jwt-cache';
const CHECKPOINT_TABLE = 'SyncCheckpoints';

const RATE_LIMITS = {
  delayBetweenCalls: 500,
  delayBetweenModels: 1000,
  delayBetweenMakes: 10000,
  maxCallsPerRun: 400,
  retryDelay: 30000,
  maxRetries: 2,
};

let totalCallsThisRun = 0;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
  totalCallsThisRun++;

  await ssm.send(new PutParameterCommand({
    Name: JWT_CACHE_KEY, Value: jwt, Type: 'SecureString', Overwrite: true,
  }));

  return jwt;
}

async function rateLimitedFetch(url: string, jwt: string): Promise<Response | null> {
  if (totalCallsThisRun >= RATE_LIMITS.maxCallsPerRun) {
    console.log(`Hard limit reached: ${totalCallsThisRun} calls. Stopping.`);
    return null;
  }

  await sleep(RATE_LIMITS.delayBetweenCalls);
  totalCallsThisRun++;

  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  let res: Response = await fetch(fullUrl, { headers: { Authorization: `Bearer ${jwt}` } });

  if (res.status === 429) {
    for (let retry = 0; retry < RATE_LIMITS.maxRetries; retry++) {
      console.warn(`Rate limited (${res.status}), waiting ${RATE_LIMITS.retryDelay / 1000}s... (retry ${retry + 1})`);
      await sleep(RATE_LIMITS.retryDelay);
      if (totalCallsThisRun >= RATE_LIMITS.maxCallsPerRun) return null;
      totalCallsThisRun++;
      res = await fetch(fullUrl, { headers: { Authorization: `Bearer ${jwt}` } });
      if (res.ok) return res;
    }
    console.warn(`Skipping after ${RATE_LIMITS.maxRetries} retries: ${fullUrl}`);
    return null;
  }

  if (!res.ok) {
    console.warn(`Fetch failed for ${fullUrl}: ${res.status}`);
    return null;
  }

  return res;
}

async function fetchAllPages(url: string, jwt: string): Promise<any[]> {
  const all: any[] = [];
  let nextUrl: string | null = url;
  while (nextUrl) {
    if (totalCallsThisRun >= RATE_LIMITS.maxCallsPerRun) break;
    const res = await rateLimitedFetch(nextUrl, jwt);
    if (!res) break;
    const body: any = await res.json();
    all.push(...(body.data || []));
    nextUrl = body.collection?.next || null;
  }
  return all;
}

async function saveCheckpoint(makeName: string): Promise<void> {
  try {
    await db.send(new PutCommand({
      TableName: CHECKPOINT_TABLE,
      Item: {
        syncId: 'vehicleCatalog',
        lastCompletedMake: makeName,
        totalCallsUsed: totalCallsThisRun,
        updatedAt: new Date().toISOString(),
      },
    }));
  } catch (err) {
    console.warn('Failed to save checkpoint:', err);
  }
}

async function getCheckpoint(): Promise<string | null> {
  try {
    const result = await db.send(new GetCommand({
      TableName: CHECKPOINT_TABLE,
      Key: { syncId: 'vehicleCatalog' },
    }));
    return result.Item?.lastCompletedMake || null;
  } catch {
    return null;
  }
}

async function clearCheckpoint(): Promise<void> {
  try {
    await db.send(new PutCommand({
      TableName: CHECKPOINT_TABLE,
      Item: { syncId: 'vehicleCatalog', lastCompletedMake: null, totalCallsUsed: 0, updatedAt: new Date().toISOString() },
    }));
  } catch {}
}

export const handler = async () => {
  totalCallsThisRun = 0;
  const years = ['2020'];
  const jwt = await getJWT();
  let totalWritten = 0;

  const lastCompleted = await getCheckpoint();
  if (lastCompleted) console.log(`Resuming from checkpoint: after ${lastCompleted}`);

  for (const year of years) {
    console.log(`Syncing year ${year}...`);
    const allMakes = await fetchAllPages(`/makes/v2?year=${year}`, jwt);
    if (totalCallsThisRun >= RATE_LIMITS.maxCallsPerRun) break;

    let makesToSync = allMakes;
    if (lastCompleted) {
      const idx = allMakes.findIndex((m: any) => m.name === lastCompleted);
      if (idx >= 0) {
        makesToSync = allMakes.slice(idx + 1);
        console.log(`Skipping ${idx + 1} already-synced makes, ${makesToSync.length} remaining`);
      }
    }

    for (let mi = 0; mi < makesToSync.length; mi++) {
      if (totalCallsThisRun >= RATE_LIMITS.maxCallsPerRun) {
        console.log(`Hard limit reached at make ${makesToSync[mi].name}. Saving checkpoint.`);
        break;
      }

      const make = makesToSync[mi];
      const makeName = make.name;
      if (mi > 0) await sleep(RATE_LIMITS.delayBetweenMakes);

      console.log(`  [${totalCallsThisRun}/${RATE_LIMITS.maxCallsPerRun}] Syncing ${makeName}...`);
      const models = await fetchAllPages(`/models/v2?year=${year}&make=${encodeURIComponent(makeName)}`, jwt);
      if (totalCallsThisRun >= RATE_LIMITS.maxCallsPerRun) break;

      for (const model of models) {
        if (totalCallsThisRun >= RATE_LIMITS.maxCallsPerRun) break;
        const modelName = model.name;
        await sleep(RATE_LIMITS.delayBetweenModels);

        const trims = await fetchAllPages(`/trims/v2?year=${year}&make=${encodeURIComponent(makeName)}&model=${encodeURIComponent(modelName)}`, jwt);
        if (totalCallsThisRun >= RATE_LIMITS.maxCallsPerRun) break;
        const extColors = await fetchAllPages(`/exterior-colors/v2?year=${year}&make=${encodeURIComponent(makeName)}&model=${encodeURIComponent(modelName)}`, jwt);
        if (totalCallsThisRun >= RATE_LIMITS.maxCallsPerRun) break;
        const intColors = await fetchAllPages(`/interior-colors/v2?year=${year}&make=${encodeURIComponent(makeName)}&model=${encodeURIComponent(modelName)}`, jwt);

        const uniqueExtColors = [...new Map(extColors.map((c: any) => {
          const colorName = c.name || c.color_name || c.generic_color_name || null;
          const rgb = c.rgb || null;
          return [colorName || rgb || JSON.stringify(c), { name: colorName, rgb }];
        })).values()].filter((c: any) => c.name || c.rgb);

        const uniqueIntColors = [...new Map(intColors.map((c: any) => {
          const colorName = c.name || c.color_name || c.generic_color_name || null;
          const rgb = c.rgb || null;
          return [colorName || rgb || JSON.stringify(c), { name: colorName, rgb }];
        })).values()].filter((c: any) => c.name || c.rgb);

        const trimData = trims.map((t: any) => ({
          id: t.id, name: t.trim || t.submodel || 'Base',
          description: t.description || '', msrp: t.msrp || 0, invoice: t.invoice || 0,
        }));

        await db.send(new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            make: makeName, modelYear: `${year}#${modelName}`, year, model: modelName,
            makeId: make.id, modelId: model.id, trims: trimData,
            exteriorColors: uniqueExtColors, interiorColors: uniqueIntColors,
            syncedAt: new Date().toISOString(),
          },
        }));
        totalWritten++;
        console.log(`    ${modelName}: ${trimData.length} trims, ${uniqueExtColors.length} ext, ${uniqueIntColors.length} int [${totalCallsThisRun} calls]`);
      }

      await saveCheckpoint(makeName);
    }
  }

  if (totalCallsThisRun < RATE_LIMITS.maxCallsPerRun) {
    await clearCheckpoint();
    console.log('Full sync complete — checkpoint cleared');
  }

  console.log(`Sync done: ${totalWritten} models, ${totalCallsThisRun} API calls`);
  return { success: true, modelsWritten: totalWritten, apiCalls: totalCallsThisRun, hitLimit: totalCallsThisRun >= RATE_LIMITS.maxCallsPerRun };
};
