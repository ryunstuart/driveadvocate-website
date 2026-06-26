import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { NextRequest, NextResponse } from 'next/server';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

export async function GET(request: NextRequest) {
  const year = request.nextUrl.searchParams.get('year') || '2020';
  const make = request.nextUrl.searchParams.get('make');
  if (!make) return NextResponse.json({ models: [], exteriorColors: [], interiorColors: [] });

  try {
    const result = await db.send(new QueryCommand({
      TableName: 'VehicleCatalog',
      KeyConditionExpression: 'make = :make AND begins_with(modelYear, :prefix)',
      ExpressionAttributeValues: { ':make': make, ':prefix': `${year}#` },
    }));

    const models = (result.Items || []).map((item: any) => item.model as string).sort();
    const allExt: any[] = [];
    const allInt: any[] = [];
    for (const item of result.Items || []) {
      if (item.exteriorColors) allExt.push(...item.exteriorColors);
      if (item.interiorColors) allInt.push(...item.interiorColors);
    }
    const extColors = [...new Map(allExt.map((c: any) => [c.name, c])).values()];
    const intColors = [...new Map(allInt.map((c: any) => [c.name, c])).values()];

    return NextResponse.json({ models, exteriorColors: extColors, interiorColors: intColors });
  } catch (err: any) {
    console.error('Failed to query models:', err);
    return NextResponse.json({ models: [], exteriorColors: [], interiorColors: [] }, { status: 500 });
  }
}
