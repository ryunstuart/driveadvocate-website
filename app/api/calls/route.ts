import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }), {
  marshallOptions: { removeUndefinedValues: true },
});

export async function GET(request: NextRequest) {
  const callId = request.nextUrl.searchParams.get('callId');
  const date = request.nextUrl.searchParams.get('date');
  try {
    if (callId) {
      const result = await db.send(new GetCommand({ TableName: 'PendingCalls', Key: { callId } }));
      return NextResponse.json({ call: result.Item || null });
    }
    const result = await db.send(new ScanCommand({ TableName: 'PendingCalls' }));
    let items = result.Items || [];
    if (date) {
      items = items.filter((i: any) => i.scheduledAt?.startsWith(date));
    }
    items.sort((a: any, b: any) => (a.scheduledAt || '').localeCompare(b.scheduledAt || ''));
    return NextResponse.json({ calls: items });
  } catch (err: any) {
    return NextResponse.json({ calls: [], call: null }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { callId, ...updates } = await request.json();
    if (!callId) return NextResponse.json({ success: false }, { status: 400 });
    const exprs: string[] = [];
    const vals: Record<string, any> = {};
    const names: Record<string, string> = {};
    Object.entries(updates).forEach(([k, v]) => {
      const attr = `#${k}`;
      const val = `:${k}`;
      names[attr] = k;
      vals[val] = v;
      exprs.push(`${attr} = ${val}`);
    });
    names['#updatedAt'] = 'updatedAt';
    vals[':updatedAt'] = new Date().toISOString();
    exprs.push('#updatedAt = :updatedAt');
    await db.send(new UpdateCommand({
      TableName: 'PendingCalls', Key: { callId },
      UpdateExpression: `SET ${exprs.join(', ')}`,
      ExpressionAttributeNames: names, ExpressionAttributeValues: vals,
    }));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
