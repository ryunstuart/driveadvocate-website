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

    const call = result.Items?.[0];
    if (!call) { console.log('No scheduled call found'); return null; }

    console.log('Found call — scheduledAt:', call.scheduledAt, 'createdAt:', call.createdAt);

    return JSON.stringify({
      callId: call.callId,
      clientName: call.clientName,
      clientEmail: call.clientEmail,
      clientPhone: call.clientPhone,
      scheduledAt: call.scheduledAt,
      status: call.status,
      notes: call.notes || '',
    });
  } catch (err: any) {
    console.error('getPendingCall error:', err);
    return null;
  }
};
