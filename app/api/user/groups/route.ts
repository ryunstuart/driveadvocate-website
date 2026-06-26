import { NextRequest, NextResponse } from 'next/server';
import { CognitoIdentityProviderClient, AdminListGroupsForUserCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });

function getUserPoolId(): string {
  try {
    const outputs = require('../../../../amplify_outputs.json');
    return outputs.auth?.user_pool_id || '';
  } catch {
    return process.env.USER_POOL_ID || '';
  }
}

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username');
  if (!username) return NextResponse.json({ groups: [] });

  const userPoolId = getUserPoolId();
  if (!userPoolId) {
    console.error('No user pool ID found');
    return NextResponse.json({ groups: [] });
  }

  try {
    const result = await cognito.send(new AdminListGroupsForUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    }));
    const groups = result.Groups?.map(g => g.GroupName || '').filter(Boolean) || [];
    return NextResponse.json({ groups });
  } catch (err: any) {
    console.error('Failed to list groups:', err);
    return NextResponse.json({ groups: [] });
  }
}
