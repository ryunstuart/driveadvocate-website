import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }), {
  marshallOptions: { removeUndefinedValues: true },
});
const TABLE = 'Incentives';

export async function GET(request: NextRequest) {
  const makeModel = request.nextUrl.searchParams.get('makeModel');
  try {
    if (makeModel) {
      const result = await db.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'makeModel = :mk',
        ExpressionAttributeValues: { ':mk': makeModel },
      }));
      return NextResponse.json({ incentives: result.Items || [] });
    }
    const result = await db.send(new ScanCommand({ TableName: TABLE }));
    return NextResponse.json({ incentives: result.Items || [] });
  } catch (err: any) {
    console.error('Failed to read incentives:', err);
    return NextResponse.json({ incentives: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await db.send(new PutCommand({ TableName: TABLE, Item: body }));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to save incentive:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const makeModel = request.nextUrl.searchParams.get('makeModel');
  const type = request.nextUrl.searchParams.get('type');
  if (!makeModel || !type) return NextResponse.json({ success: false, error: 'Missing key' }, { status: 400 });
  try {
    await db.send(new DeleteCommand({ TableName: TABLE, Key: { makeModel, type } }));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
