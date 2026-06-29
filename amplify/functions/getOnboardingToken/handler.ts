import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

function unwrap(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val.S) return val.S;
  return String(val);
}

function unwrapBool(val: any): boolean {
  if (val === true || val === false) return val;
  if (typeof val === 'object' && val.BOOL !== undefined) return val.BOOL;
  return false;
}

export const handler = async (event: any) => {
  const { token } = event.arguments;
  console.log('getOnboardingToken:', token);

  try {
    const result = await db.send(new GetCommand({
      TableName: 'OnboardingTokens',
      Key: { token },
    }));

    if (!result.Item) { console.log('Token not found'); return null; }

    console.log('Token found, expiresAt:', result.Item.expiresAt, 'used:', result.Item.used);

    return {
      token: unwrap(result.Item.token),
      clientEmail: unwrap(result.Item.clientEmail),
      clientName: unwrap(result.Item.clientName),
      dealId: unwrap(result.Item.dealId),
      callId: unwrap(result.Item.callId),
      expiresAt: unwrap(result.Item.expiresAt),
      used: unwrapBool(result.Item.used),
      agreementAccepted: unwrapBool(result.Item.agreementAccepted),
      paymentStatus: unwrap(result.Item.paymentStatus),
    };
  } catch (err: any) {
    console.error('getOnboardingToken error:', err);
    return null;
  }
};
