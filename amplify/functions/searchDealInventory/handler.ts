import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const ssm = new SSMClient({ region: 'us-east-1' });
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }), {
  marshallOptions: { removeUndefinedValues: true },
});
const TABLE_NAME = process.env.DEAL_INVENTORY_TABLE || 'DealInventory';
const DEAL_TABLE = process.env.DEAL_TABLE_NAME || '';
const VP_TABLE = process.env.VP_TABLE_NAME || '';
const MC_BASE = 'https://mc-api.marketcheck.com/v2';

async function getApiKey(): Promise<string> {
  const result = await ssm.send(new GetParameterCommand({
    Name: '/driveadvocate/marketcheck/key',
    WithDecryption: true,
  }));
  return result.Parameter?.Value || '';
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchForDeal(
  apiKey: string, dealId: string, make: string, model: string,
  year: string, zip: string, radius: number, carType: string,
  colorCombos?: any[],
): Promise<number> {
  const params = new URLSearchParams({
    api_key: apiKey, make, model, year, zip,
    radius: String(radius), car_type: carType,
    rows: '50', seller_type: 'dealer',
  });

  const searchRes: Response = await fetch(`${MC_BASE}/search/car/active?${params}`);
  if (!searchRes.ok) {
    console.warn(`MarketCheck search failed for deal ${dealId}: ${searchRes.status}`);
    return 0;
  }

  const searchData: any = await searchRes.json();
  const listings: any[] = searchData.listings || [];

  let marketAvgPrice: number | null = null;
  try {
    const priceParams = new URLSearchParams({
      api_key: apiKey, make, model, year, miles: '50000', car_type: carType,
    });
    const priceRes: Response = await fetch(`${MC_BASE}/predict/car/price?${priceParams}`);
    if (priceRes.ok) {
      const priceData: any = await priceRes.json();
      marketAvgPrice = priceData.predicted_price || null;
    }
  } catch {}

  const activeVins = new Set<string>();
  let written = 0;

  for (const listing of listings) {
    const dealer = listing.dealer || {};
    const vin = listing.vin;
    if (!vin) continue;
    activeVins.add(vin);

    const priceDropAmount = listing.ref_price && listing.price
      ? listing.ref_price - listing.price : 0;

    const item: Record<string, any> = {
      dealId, vin,
      stockNumber: listing.stock_no || null,
      heading: listing.heading || '',
      year, make, model, trim: listing.trim || '',
      price: listing.price || 0, msrp: listing.msrp || 0,
      originalPrice: listing.ref_price || listing.price || 0,
      miles: listing.miles || 0,
      exteriorColor: listing.exterior_color || '',
      interiorColor: listing.interior_color || '',
      daysOnLot: listing.dom_active || listing.dom || 0,
      priceDropAmount: priceDropAmount > 0 ? priceDropAmount : 0,
      marketAvgPrice: marketAvgPrice || 0,
      belowMarketAvg: marketAvgPrice && listing.price ? listing.price < marketAvgPrice : false,
      carfaxCleanTitle: listing.carfax_clean_title || false,
      carfaxOneOwner: listing.carfax_1_owner || false,
      dealerName: dealer.name || listing.source || '',
      dealerPhone: dealer.phone || '',
      dealerAddress: [dealer.street, dealer.city, dealer.state, dealer.zip].filter(Boolean).join(', '),
      dealerCity: dealer.city || '', dealerState: dealer.state || '', dealerZip: dealer.zip || '',
      dealerLatitude: dealer.latitude ? parseFloat(dealer.latitude) : null,
      dealerLongitude: dealer.longitude ? parseFloat(dealer.longitude) : null,
      listingUrl: listing.vdp_url || '',
      photoUrl: listing.media?.photo_links?.[0] || '',
      sellerType: listing.seller_type || '',
      lastSeenAt: listing.last_seen_at_date || '',
      isActive: true,
      syncedAt: new Date().toISOString(),
      colorComboMatch: null as number | null,
      colorMatchLabel: null as string | null,
    };

    if (colorCombos && colorCombos.length > 0) {
      const fakePatterns = ['color 1', 'color 2', 'color 3', 'color-', 'rgb('];
      const isRealColor = (name: string) => name && !fakePatterns.some(p => name.toLowerCase().includes(p));
      const hasRealCombos = colorCombos.some((c: any) => isRealColor(c.exterior));

      if (!hasRealCombos) {
        item.colorComboMatch = null;
        item.colorMatchLabel = 'Color matching pending';
      } else {
        const matched = colorCombos.find((combo: any) => {
          const extColor = (listing.exterior_color || '').toLowerCase();
          const intColor = (listing.interior_color || '').toLowerCase();
          const comboExt = (combo.exterior || '').toLowerCase();
          const comboInt = (combo.interior || '').toLowerCase();
          const extMatch = !comboExt || extColor.includes(comboExt) || comboExt.includes(extColor);
          const intMatch = !comboInt || intColor.includes(comboInt) || comboInt.includes(intColor);
          return extMatch && intMatch;
        });
        if (matched) {
          item.colorComboMatch = matched.rank;
          item.colorMatchLabel = `${matched.exterior}${matched.interior ? ' / ' + matched.interior : ''}`;
        }
      }
    }

    await db.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    written++;
  }

  // Mark stale listings as inactive
  try {
    const existing = await db.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'dealId = :dealId',
      ExpressionAttributeValues: { ':dealId': dealId },
      ProjectionExpression: 'vin',
    }));
    for (const item of existing.Items || []) {
      if (!activeVins.has(item.vin)) {
        await db.send(new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { dealId, vin: item.vin },
          UpdateExpression: 'SET isActive = :false',
          ExpressionAttributeValues: { ':false': false },
        }));
      }
    }
  } catch (err) {
    console.warn('Failed to mark stale listings:', err);
  }

  return written;
}

export const handler = async (event: any) => {
  // AppSync mutation path — has arguments
  if (event.arguments) {
    const { dealId, make, model, year, zip, radius, carType } = event.arguments;
    if (!dealId || !make || !model || !zip) {
      return { success: false, resultCount: 0, error: 'Missing required fields' };
    }
    try {
      const apiKey = await getApiKey();
      const count = await searchForDeal(apiKey, dealId, make, model, year || '2020', zip, radius || 100, carType || 'used');
      return { success: true, resultCount: count, error: null };
    } catch (err: any) {
      console.error('searchDealInventory failed:', err);
      return { success: false, resultCount: 0, error: err.message };
    }
  }

  // EventBridge scheduled path — refresh all active deals
  console.log('Scheduled refresh: querying active deals');
  if (!DEAL_TABLE || !VP_TABLE) {
    console.error('DEAL_TABLE_NAME or VP_TABLE_NAME not configured');
    return { success: false, error: 'Table env vars not configured' };
  }

  try {
    const apiKey = await getApiKey();

    const dealResult = await db.send(new ScanCommand({
      TableName: DEAL_TABLE,
      FilterExpression: '#s <> :complete AND #s <> :dead',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':complete': 'Complete', ':dead': 'Dead' },
      ProjectionExpression: 'id, clientEmail',
    }));

    const activeDeals = dealResult.Items || [];
    console.log(`Found ${activeDeals.length} active deals`);
    let totalRefreshed = 0;

    for (const deal of activeDeals) {
      const dealId = deal.id;
      if (!dealId) continue;

      const vpResult = await db.send(new ScanCommand({
        TableName: VP_TABLE,
        FilterExpression: 'dealId = :dealId',
        ExpressionAttributeValues: { ':dealId': dealId },
        Limit: 1,
      }));

      const vp = vpResult.Items?.[0];
      if (!vp?.make || !vp?.model || !vp?.zipCode) {
        console.warn(`Skipping deal ${dealId}: missing vehicle preference data`);
        continue;
      }

      console.log(`Refreshing deal ${dealId}: ${vp.make} ${vp.model} near ${vp.zipCode}`);
      const count = await searchForDeal(
        apiKey, dealId, vp.make, vp.model,
        vp.year || '2020', vp.zipCode,
        vp.searchRadius || 100, 'used',
      );
      totalRefreshed += count;
      await sleep(1000);
    }

    console.log(`Scheduled refresh complete: ${totalRefreshed} total listings across ${activeDeals.length} deals`);
    return { success: true, dealsRefreshed: activeDeals.length, totalListings: totalRefreshed };
  } catch (err: any) {
    console.error('Scheduled refresh failed:', err);
    return { success: false, error: err.message };
  }
};
