import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

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

    console.log('Found', items.length, 'calls. Raw first item:', JSON.stringify(items[0]));

    const now = new Date().toISOString();
    const sorted = items.sort((a: any, b: any) =>
      new Date(String(a.scheduledAt)).getTime() - new Date(String(b.scheduledAt)).getTime()
    );
    const upcoming = sorted.find((item: any) => String(item.scheduledAt) > now) || sorted[sorted.length - 1];

    const callData = {
      callId: String(upcoming.callId || ''),
      clientName: String(upcoming.clientName || ''),
      clientEmail: String(upcoming.clientEmail || ''),
      clientPhone: String(upcoming.clientPhone || ''),
      scheduledAt: String(upcoming.scheduledAt || ''),
      status: String(upcoming.status || ''),
      notes: String(upcoming.notes || ''),
    };

    const jsonString = JSON.stringify(callData);
    console.log('Returning:', jsonString);
    return jsonString;
  } catch (err: any) {
    console.error('getPendingCall error:', err);
    return null;
  }
};
