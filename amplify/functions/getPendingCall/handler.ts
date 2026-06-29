import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

function unwrap(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val.S) return val.S;
  return String(val);
}

export const handler = async (event: any) => {
  const email = event.arguments.email;
  console.log('getPendingCall for:', email);

  try {
    const result = await db.send(new ScanCommand({
      TableName: 'PendingCalls',
      FilterExpression: 'clientEmail = :e AND #s = :s',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':e': email, ':s': 'scheduled' },
    }));

    const items = result.Items || [];
    if (items.length === 0) { console.log('No scheduled calls found'); return null; }

    const raw = items[0];
    console.log('Raw item keys:', Object.keys(raw));
    console.log('scheduledAt raw:', JSON.stringify(raw.scheduledAt), 'type:', typeof raw.scheduledAt);
    console.log('Full raw item:', JSON.stringify(raw));

    const now = new Date().toISOString();
    const sorted = items.sort((a: any, b: any) =>
      new Date(unwrap(a.scheduledAt)).getTime() - new Date(unwrap(b.scheduledAt)).getTime()
    );
    const upcoming = sorted.find((item: any) => unwrap(item.scheduledAt) > now) || sorted[sorted.length - 1];

    const callData = {
      callId: unwrap(upcoming.callId),
      clientName: unwrap(upcoming.clientName),
      clientEmail: unwrap(upcoming.clientEmail),
      clientPhone: unwrap(upcoming.clientPhone),
      scheduledAt: unwrap(upcoming.scheduledAt),
      status: unwrap(upcoming.status),
      notes: unwrap(upcoming.notes),
    };

    const jsonString = JSON.stringify(callData);
    console.log('Returning:', jsonString);
    return jsonString;
  } catch (err: any) {
    console.error('getPendingCall error:', err);
    return null;
  }
};
