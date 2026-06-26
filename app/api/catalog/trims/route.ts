import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { NextRequest, NextResponse } from 'next/server';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

export async function GET(request: NextRequest) {
  const year = request.nextUrl.searchParams.get('year') || '2020';
  const make = request.nextUrl.searchParams.get('make');
  const model = request.nextUrl.searchParams.get('model');
  if (!make || !model) return NextResponse.json({ trims: [], exteriorColors: [], interiorColors: [] });

  try {
    const result = await db.send(new GetCommand({
      TableName: 'VehicleCatalog',
      Key: { make, modelYear: `${year}#${model}` },
    }));

    const item = result.Item;
    if (!item) return NextResponse.json({ trims: [], exteriorColors: [], interiorColors: [] });

    const rawTrims: any[] = item.trims || [];
    const uniqueTrims = [...new Map(rawTrims.map((t: any) => [t.name, t])).values()];

    return NextResponse.json({
      trims: uniqueTrims,
      exteriorColors: item.exteriorColors || [],
      interiorColors: item.interiorColors || [],
    });
  } catch (err: any) {
    console.error('Failed to query trims:', err);
    return NextResponse.json({ trims: [], exteriorColors: [], interiorColors: [] }, { status: 500 });
  }
}
