import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { NextRequest, NextResponse } from 'next/server';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

export async function GET(request: NextRequest) {
  const dealId = request.nextUrl.searchParams.get('dealId');
  if (!dealId) return NextResponse.json({ listings: [] });

  try {
    const result = await db.send(new QueryCommand({
      TableName: 'DealInventory',
      KeyConditionExpression: 'dealId = :dealId',
      ExpressionAttributeValues: { ':dealId': dealId },
    }));
    return NextResponse.json({ listings: result.Items || [] });
  } catch (err: any) {
    console.error('Failed to query inventory:', err);
    return NextResponse.json({ listings: [] }, { status: 500 });
  }
}
