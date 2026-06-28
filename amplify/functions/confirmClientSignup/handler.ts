import { CognitoIdentityProviderClient, AdminConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });

export const handler = async (event: any) => {
  const email = event.arguments.email;
  console.log('Auto-confirming:', email);

  try {
    await cognito.send(new AdminConfirmSignUpCommand({
      UserPoolId: process.env.USER_POOL_ID || 'us-east-1_mBhomQZzY',
      Username: email.trim().toLowerCase(),
    }));
    console.log('Confirmed:', email);
    return { confirmed: true };
  } catch (err: any) {
    console.error('Confirm failed:', err.name, err.message);
    return { confirmed: false };
  }
};
