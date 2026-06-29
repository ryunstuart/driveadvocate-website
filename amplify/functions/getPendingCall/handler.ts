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

    console.log(`Found ${items.length} scheduled calls`);

    const now = new Date().toISOString();
    const sorted = items.sort((a: any, b: any) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
    const upcoming = sorted.find((item: any) => item.scheduledAt > now) || sorted[sorted.length - 1];

    console.log('Selected call — scheduledAt:', upcoming.scheduledAt, 'callId:', upcoming.callId);

    return JSON.stringify({
      callId: upcoming.callId,
      clientName: upcoming.clientName,
      clientEmail: upcoming.clientEmail,
      clientPhone: upcoming.clientPhone,
      scheduledAt: upcoming.scheduledAt,
      status: upcoming.status,
      notes: upcoming.notes || '',
    });
  } catch (err: any) {
    console.error('getPendingCall error:', err);
    return null;
  }
};
