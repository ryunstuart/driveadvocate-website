import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }), {
  marshallOptions: { removeUndefinedValues: true },
});

export const handler = async (event: any) => {
  const { token, ipAddress } = event.arguments;
  console.log('signAgreement for token:', token);

  try {
    await db.send(new UpdateCommand({
      TableName: 'OnboardingTokens',
      Key: { token },
      UpdateExpression: 'SET agreementAccepted = :a, agreementAcceptedAt = :t, agreementIpAddress = :ip',
      ExpressionAttributeValues: {
        ':a': true,
        ':t': new Date().toISOString(),
        ':ip': ipAddress || 'unknown',
      },
    }));

    console.log('Agreement signed for token:', token);
    return { success: true };
  } catch (err: any) {
    console.error('signAgreement error:', err.name, err.message);
    return { success: false };
  }
};
