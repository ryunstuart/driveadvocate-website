import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

export const handler = async (event: any) => {
  const { callId } = event.arguments;
  try {
    const result = await db.send(new GetCommand({ TableName: 'PendingCalls', Key: { callId } }));
    if (!result.Item) return null;
    return JSON.stringify(result.Item);
  } catch (err: any) {
    console.error('getCallById error:', err);
    return null;
  }
};
