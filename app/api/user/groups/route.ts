import { NextRequest, NextResponse } from 'next/server';
import { CognitoIdentityProviderClient, AdminListGroupsForUserCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const USER_POOL_ID = 'us-east-1_mBhomQZzY';

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username');
  if (!username) return NextResponse.json({ groups: [] });

  try {
    const result = await cognito.send(new AdminListGroupsForUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
    }));
    const groups = result.Groups?.map(g => g.GroupName || '').filter(Boolean) || [];
    return NextResponse.json({ groups });
  } catch (err: any) {
    console.error('Failed to list groups:', err);
    return NextResponse.json({ groups: [] });
  }
}
