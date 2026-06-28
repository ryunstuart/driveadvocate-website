import { NextRequest, NextResponse } from 'next/server';
import { CognitoIdentityProviderClient, AdminConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';

export const dynamic = 'force-dynamic';

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const USER_POOL_ID = 'us-east-1_mBhomQZzY';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    console.log('Auto-confirming user:', email);
    console.log('User pool ID:', USER_POOL_ID);

    await cognito.send(new AdminConfirmSignUpCommand({
      UserPoolId: USER_POOL_ID,
      Username: email.trim().toLowerCase(),
    }));

    console.log('User confirmed successfully:', email);
    return NextResponse.json({ confirmed: true });
  } catch (err: any) {
    console.error('Confirm error:', err.name, err.message);
    return NextResponse.json({ error: err.message, code: err.name }, { status: 500 });
  }
}
