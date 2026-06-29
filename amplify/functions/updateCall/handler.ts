import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }), {
  marshallOptions: { removeUndefinedValues: true },
});

export const handler = async (event: any) => {
  const { callId, status, notes } = event.arguments;
  try {
    const exprs: string[] = ['#updatedAt = :updatedAt'];
    const names: Record<string, string> = { '#updatedAt': 'updatedAt' };
    const vals: Record<string, any> = { ':updatedAt': new Date().toISOString() };

    if (status) { exprs.push('#status = :status'); names['#status'] = 'status'; vals[':status'] = status; }
    if (notes !== undefined && notes !== null) { exprs.push('#notes = :notes'); names['#notes'] = 'notes'; vals[':notes'] = notes; }

    await db.send(new UpdateCommand({
      TableName: 'PendingCalls', Key: { callId },
      UpdateExpression: `SET ${exprs.join(', ')}`,
      ExpressionAttributeNames: names, ExpressionAttributeValues: vals,
    }));
    return JSON.stringify({ success: true });
  } catch (err: any) {
    console.error('updateCall error:', err);
    return JSON.stringify({ success: false, error: err.message });
  }
};
