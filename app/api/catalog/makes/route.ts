import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { NextRequest, NextResponse } from 'next/server';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

export async function GET(request: NextRequest) {
  const year = request.nextUrl.searchParams.get('year') || '2020';
  try {
    const result = await db.send(new ScanCommand({
      TableName: 'VehicleCatalog',
      FilterExpression: '#y = :year',
      ExpressionAttributeNames: { '#y': 'year' },
      ExpressionAttributeValues: { ':year': year },
      ProjectionExpression: 'make',
    }));
    const makes = [...new Set((result.Items || []).map((item: any) => item.make as string))].sort();
    return NextResponse.json({ makes });
  } catch (err: any) {
    console.error('Failed to query makes:', err);
    return NextResponse.json({ makes: [] }, { status: 500 });
  }
}
