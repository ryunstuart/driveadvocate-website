import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

export const handler = async () => {
  try {
    const allItems: any[] = [];
    let lastKey: any = undefined;
    do {
      const result = await db.send(new ScanCommand({
        TableName: 'VehicleCatalog',
        ExclusiveStartKey: lastKey,
        ProjectionExpression: 'make, model, #y, modelYear, trims',
        ExpressionAttributeNames: { '#y': 'year' },
      }));
      allItems.push(...(result.Items || []));
      lastKey = result.LastEvaluatedKey;
    } while (lastKey);

    return JSON.stringify(allItems);
  } catch (err: any) {
    console.error('getCatalog error:', err);
    return '[]';
  }
};
