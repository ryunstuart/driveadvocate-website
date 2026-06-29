import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

function unwrap(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val.S) return val.S;
  return String(val);
}

export const handler = async (event: any) => {
  const { callId } = event.arguments;
  try {
    const result = await db.send(new GetCommand({ TableName: 'PendingCalls', Key: { callId } }));
    if (!result.Item) return null;
    const c = result.Item;
    return {
      callId: unwrap(c.callId),
      clientName: unwrap(c.clientName),
      clientEmail: unwrap(c.clientEmail),
      clientPhone: unwrap(c.clientPhone),
      clientZip: unwrap(c.clientZip),
      scheduledAt: unwrap(c.scheduledAt),
      status: unwrap(c.status),
      notes: unwrap(c.notes),
    };
  } catch (err: any) {
    console.error('getCallById error:', err);
    return null;
  }
};
