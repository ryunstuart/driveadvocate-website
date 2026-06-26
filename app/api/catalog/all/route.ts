import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { NextResponse } from 'next/server';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

export async function GET() {
  try {
    const allItems: any[] = [];
    let lastKey: any = undefined;
    do {
      const result = await db.send(new ScanCommand({
        TableName: 'VehicleCatalog',
        ExclusiveStartKey: lastKey,
      }));
      allItems.push(...(result.Items || []));
      lastKey = result.LastEvaluatedKey;
    } while (lastKey);

    return NextResponse.json({ items: allItems });
  } catch (err: any) {
    console.error('Failed to scan catalog:', err);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
