import { NextRequest, NextResponse } from 'next/server';
import { CognitoIdentityProviderClient, AdminListGroupsForUserCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username');
  const email = request.nextUrl.searchParams.get('email');
  const poolId = request.nextUrl.searchParams.get('poolId');

  if (!poolId || (!username && !email)) return NextResponse.json({ groups: [] });

  for (const lookup of [username, email].filter(Boolean)) {
    try {
      console.log(`Looking up groups for: ${lookup} in pool: ${poolId}`);
      const result = await cognito.send(new AdminListGroupsForUserCommand({
        UserPoolId: poolId,
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
