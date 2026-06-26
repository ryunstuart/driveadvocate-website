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
  const email = request.nextUrl.searchParams.get('email');
  if (!username && !email) return NextResponse.json({ groups: [] });

  const userPoolId = getUserPoolId();
  if (!userPoolId) return NextResponse.json({ groups: [] });

  // Try username first, then email as fallback
  for (const lookup of [username, email].filter(Boolean)) {
    try {
      console.log(`Looking up groups for: ${lookup} in pool: ${userPoolId}`);
      const result = await cognito.send(new AdminListGroupsForUserCommand({
        UserPoolId: userPoolId,
        Username: lookup!,
      }));
      const groups = result.Groups?.map(g => g.GroupName || '').filter(Boolean) || [];
      console.log(`Groups found for ${lookup}:`, groups);
      if (groups.length > 0) return NextResponse.json({ groups });
    } catch (err: any) {
      console.error(`Group lookup failed for ${lookup}:`, err.message);
    }
  }

  return NextResponse.json({ groups: [] });
}
