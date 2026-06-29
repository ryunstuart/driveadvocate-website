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
    if (items.length === 0) return null;

    const now = new Date().toISOString();
    const sorted = items.sort((a: any, b: any) =>
      new Date(unwrap(a.scheduledAt)).getTime() - new Date(unwrap(b.scheduledAt)).getTime()
    );
    const call = sorted.find((item: any) => unwrap(item.scheduledAt) > now) || sorted[sorted.length - 1];

    return {
      callId: unwrap(call.callId),
      clientName: unwrap(call.clientName),
      clientEmail: unwrap(call.clientEmail),
      clientPhone: unwrap(call.clientPhone),
      scheduledAt: unwrap(call.scheduledAt),
      status: unwrap(call.status),
      notes: unwrap(call.notes),
    };
  } catch (err: any) {
    console.error('getPendingCall error:', err);
    return null;
  }
};
