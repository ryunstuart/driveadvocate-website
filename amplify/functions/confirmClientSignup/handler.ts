import { CognitoIdentityProviderClient, AdminConfirmSignUpCommand, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const USER_POOL_ID = 'us-east-1_mBhomQZzY';

export const handler = async (event: any) => {
  const email = event.arguments.email;
  console.log('Confirming user:', email);

  try {
    await cognito.send(new AdminConfirmSignUpCommand({
      UserPoolId: USER_POOL_ID,
      Username: email.trim().toLowerCase(),
    }));

    await cognito.send(new AdminUpdateUserAttributesCommand({
      UserPoolId: USER_POOL_ID,
      Username: email.trim().toLowerCase(),
      UserAttributes: [{ Name: 'email_verified', Value: 'true' }],
    }));

    console.log('Confirmed + verified:', email);
    return { confirmed: true, error: null };
  } catch (err: any) {
    console.error('Confirm error:', err.name, err.message);
    return { confirmed: false, error: err.message };
  }
};
