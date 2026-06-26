import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const ssm = new SSMClient({ region: 'us-east-1' });
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }), {
  marshallOptions: { removeUndefinedValues: true },
});
const TABLE_NAME = process.env.DEAL_INVENTORY_TABLE || 'DealInventory';
const MC_BASE = 'https://mc-api.marketcheck.com/v2';

async function getApiKey(): Promise<string> {
  const result = await ssm.send(new GetParameterCommand({
    Name: '/driveadvocate/marketcheck/key',
    WithDecryption: true,
  }));
  return result.Parameter?.Value || '';
}

export const handler = async (event: any) => {
  const { dealId, make, model, year, zip, radius, carType } = event.arguments;

  if (!dealId || !make || !model || !zip) {
    return { success: false, resultCount: 0, error: 'Missing required fields: dealId, make, model, zip' };
  }

  try {
    const apiKey = await getApiKey();
    const searchRadius = radius || 100;
    const searchCarType = carType || 'used';
    const searchYear = year || '2020';

    const params = new URLSearchParams({
      api_key: apiKey,
      make,
      model,
      year: searchYear,
      zip,
      radius: String(searchRadius),
      car_type: searchCarType,
      rows: '50',
      seller_type: 'dealer',
    });

    const searchRes: Response = await fetch(`${MC_BASE}/search/car/active?${params}`);
    if (!searchRes.ok) {
      const errText = await searchRes.text();
      throw new Error(`MarketCheck search failed: ${searchRes.status} ${errText}`);
    }

    const searchData: any = await searchRes.json();
    const listings: any[] = searchData.listings || [];
    console.log(`Found ${searchData.num_found} total, processing ${listings.length} listings`);

    let marketAvgPrice: number | null = null;
    try {
      const priceParams = new URLSearchParams({
        api_key: apiKey,
        make,
        model,
        year: searchYear,
        trim: 'XLT',
        miles: '50000',
        car_type: searchCarType,
      });
      const priceRes: Response = await fetch(`${MC_BASE}/predict/car/price?${priceParams}`);
      if (priceRes.ok) {
        const priceData: any = await priceRes.json();
        marketAvgPrice = priceData.predicted_price || null;
      }
    } catch {
      console.warn('Market price prediction failed, continuing without it');
    }

    let written = 0;
    for (const listing of listings) {
      const dealer = listing.dealer || {};
      const vin = listing.vin;
      if (!vin) continue;

      const priceDropAmount = listing.ref_price && listing.price
        ? listing.ref_price - listing.price
        : 0;

      const item: Record<string, any> = {
        dealId,
        vin,
        stockNumber: listing.stock_no || null,
        heading: listing.heading || '',
        year: searchYear,
        make,
        model,
        trim: listing.trim || '',
        price: listing.price || 0,
        msrp: listing.msrp || 0,
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
        dealerCity: dealer.city || '',
        dealerState: dealer.state || '',
        dealerZip: dealer.zip || '',
        dealerLatitude: dealer.latitude ? parseFloat(dealer.latitude) : null,
        dealerLongitude: dealer.longitude ? parseFloat(dealer.longitude) : null,
        listingUrl: listing.vdp_url || '',
        photoUrl: listing.media?.photo_links?.[0] || '',
        sellerType: listing.seller_type || '',
        lastSeenAt: listing.last_seen_at_date || '',
        syncedAt: new Date().toISOString(),
      };

      await db.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
      written++;
    }

    console.log(`Wrote ${written} listings for deal ${dealId}`);
    return { success: true, resultCount: written, error: null };
  } catch (err: any) {
    console.error('searchDealInventory failed:', err);
    return { success: false, resultCount: 0, error: err.message };
  }
};
