import { NextRequest, NextResponse } from 'next/server';
import { CognitoIdentityProviderClient, AdminConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';

export const dynamic = 'force-dynamic';

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });

function getUserPoolId(): string {
  try {
    const outputs = require('../../../../amplify_outputs.json');
    return outputs.auth?.user_pool_id || '';
  } catch {
    return process.env.USER_POOL_ID || '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });

    const userPoolId = getUserPoolId();
    if (!userPoolId) return NextResponse.json({ success: false, error: 'User pool not configured' }, { status: 500 });

    await cognito.send(new AdminConfirmSignUpCommand({
      UserPoolId: userPoolId,
      Username: email.trim().toLowerCase(),
    }));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Auto-confirm failed:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
