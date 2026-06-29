import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

export const handler = async (event: any) => {
  const { date } = event.arguments;

  try {
    const start = `${date}T00:00:00.000Z`;
    const end = `${date}T23:59:59.999Z`;

    const result = await db.send(new ScanCommand({
      TableName: 'PendingCalls',
      FilterExpression: 'scheduledAt BETWEEN :start AND :end AND #s <> :cancelled',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':start': start, ':end': end, ':cancelled': 'cancelled' },
    }));

    const calls = (result.Items || []).sort((a: any, b: any) =>
      (a.scheduledAt || '').localeCompare(b.scheduledAt || '')
    );

    return calls.map((c: any) => ({
      callId: c.callId, clientName: c.clientName, clientEmail: c.clientEmail,
      clientPhone: c.clientPhone, clientZip: c.clientZip || '',
      scheduledAt: c.scheduledAt, status: c.status, notes: c.notes || '',
    }));
  } catch (err: any) {
    console.error('getCallsByDate error:', err);
    return [];
  }
};
