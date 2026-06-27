import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }), {
  marshallOptions: { removeUndefinedValues: true },
});

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ tokenRecord: null });
  try {
    const result = await db.send(new GetCommand({ TableName: 'OnboardingTokens', Key: { token } }));
    return NextResponse.json({ tokenRecord: result.Item || null });
  } catch {
    return NextResponse.json({ tokenRecord: null }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { token, action } = await request.json();
    if (!token) return NextResponse.json({ success: false }, { status: 400 });

    if (action === 'sign_agreement') {
      await db.send(new UpdateCommand({
        TableName: 'OnboardingTokens', Key: { token },
        UpdateExpression: 'SET agreementAccepted = :a, agreementAcceptedAt = :t',
        ExpressionAttributeValues: { ':a': true, ':t': new Date().toISOString() },
      }));
    }

    if (action === 'mark_used') {
      await db.send(new UpdateCommand({
        TableName: 'OnboardingTokens', Key: { token },
        UpdateExpression: 'SET used = :u, usedAt = :t',
        ExpressionAttributeValues: { ':u': true, ':t': new Date().toISOString() },
      }));
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
